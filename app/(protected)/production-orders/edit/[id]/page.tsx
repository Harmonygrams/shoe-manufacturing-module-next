'use client'
import { useEffect, useState } from 'react'
import { Plus, Minus, Search, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useMutation, useQueries, useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/helpers/currencyFormat'
import { baseUrl } from '@/utils/baseUrl'
import { useParams } from 'next/navigation'

type OrderSize = {
  sizeId : string; 
  colorId? : number; 
  quantity : number; 
  cost : number;
}
type OrderProduct2 = {
  productId : string, 
  productSizes : OrderSize[]

}
type Order = {
  customerId? : string, 
  orderType: 'sale' | 'manufacturing',
  transactionDate : Date | undefined, 
  status : string,
  products : OrderProduct2[],
  productionCosts?: ProductionCost[]
}
type Customer = {
  id : string;
  customerName : string;
}
type Product = {
  id : string; 
  name : string; 
  sizes : Size[];
}

type Size = { 
  id : string; 
  name : string; 
  cost : number;
}
type Color = { 
  id : string; 
  name : string;
}

type ProductItem = {
  id: string
  size: Size,
  color: Color
  quantity: number, 
  cost : number;
}

type OrderProduct = {
  id: string
  name: string
  items: ProductItem[]
}
type RawMaterial = {
  productId : string;
  id : string;
  name : string; 
  quantityNeeded : number; 
  quantityAvailable : number; 
}
type OrderFetched = {
    id : number; 
    customerId : number; 
    status : string; 
    orderDate : string,
    products : { 
        productId : number; 
        productName : string; 
        colorName : string; 
        colorId : number;
        quantity : number; 
        sizeName : string; 
        cost : number; 
        sizeId : number; 
    }[]
}
type ProductionCost = {
  id: number
  amount: number
}
export default function ProductionOrderPage() {
  const [isLoading, setIsLoading ] = useState<boolean>(false); 
  const [customer, setCustomer] = useState<string>('')
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState('pending')
  const [productSearch, setProductSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])
  const [order,  setOrder ] = useState<Order>()
  const [orderType, setOrderType] = useState<'sale' | 'manufacturing'>('sale')
  const [productionCosts, setProductionCosts] = useState<ProductionCost[]>([])
  const { id } = useParams()
  //fetch the current order 
  const fetchOrder = useQuery({
    queryKey : ['productionOrder'], 
    queryFn : async () => {
        const fetchOrder = await fetch(`${baseUrl()}/orders/${id}`, { method : 'GET'})
        if(fetchOrder.ok){
            const fetchOrderJson = await fetchOrder.json() as OrderFetched
            return fetchOrderJson;
        }
    }
  })
  // Fetch customers from db
  const { data : customers = []} = useQuery<Customer[]>({
    queryKey : ['CUSTOMERS'], 
    queryFn : async () => {
      const fetchCustomers = await fetch(`${baseUrl()}/customers`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchCustomers.ok){
        const fetchCustomersJson = await fetchCustomers.json();
        return fetchCustomersJson
      }
    }
  })
  const [{data : products = []}, { data : colors = []}] = useQueries({
    queries : [
      {
        queryKey : ['PRODUCTS'],
        queryFn : async () => {
          const fetchProducts = await fetch(`${baseUrl()}/products`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
          if(fetchProducts.ok){
            const fetchProductsJson = await fetchProducts.json() as Product[]
            return fetchProductsJson
          }
        }
      }, 
      {
        queryKey : ['COLORS'], 
        queryFn : async () => {
          const fetchColors = await fetch(`${baseUrl()}/colors`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
          if(fetchColors.ok){
            const fetchColorsJson = await fetchColors.json() as Color[]
            return fetchColorsJson
          }
        }
      }
    ]
  })
  const saveOrderToDb = useMutation({
    mutationFn: async (payload: string) => {
      setIsLoading(true)
      const response = await fetch(`${baseUrl()}/orders`, { 
        method: 'POST', 
        body: payload, 
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.message || 'An error occurred while saving the order')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsLoading(false)
      toast({
        title: "Production order added successfully"
      })
      setTimeout(() => {
        window.location.href = '/production-orders'
      }, 1000)
    },
    onError: (error: Error) => {
      setIsLoading(false)
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive"
      })
    }
  })
  async function handleSaveProductionOrder() {
    if (!orderDate || selectedProducts.length === 0) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one product.",
        variant: "destructive"
      })
      return
    }

    if (orderType === 'sale' && !customer) {
      toast({
        title: "Error",
        description: "Please select a customer for sales orders.",
        variant: "destructive"
      })
      return
    }

    const products = selectedProducts.map(product => ({
      productId: product.id.toString(),
      productSizes: product.items.map(item => ({
        sizeId: item.size.id.toString(),
        colorId: parseInt(item.color.id),
        quantity: item.quantity,
        cost: item.cost
      }))
    }))

    const orderData = {
      ...(orderType === 'sale' && { customerId: customer }),
      orderType,
      status: status,
      transactionDate: orderDate,
      products,
      productionCosts: productionCosts
    }

    setOrder(orderData as Order)
    saveOrderToDb.mutate(JSON.stringify(orderData))
  }
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product && colors.length > 0) {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        name: product.name,
        items: [{
          id: product.id,
          size: product.sizes[0],
          color: colors[0],
          quantity: 1,
          cost: product.sizes[0].cost
        }]
      }])
    }
    setProductSearch('')
  }

  const addProductItem = (productIndex: number) => {
    const newSelectedProducts = [...selectedProducts]
    const product = products.find(p => p.id === newSelectedProducts[productIndex].id)
    if (product) {
      newSelectedProducts[productIndex].items.push({
        id: product.id,
        size: product.sizes[0],
        color: colors[0],
        quantity: 1,
        cost : product.sizes[0].cost
      })
      setSelectedProducts(newSelectedProducts)
    }
  }
  const updateProductItem = (productIndex: number, itemIndex: number, field: keyof ProductItem, value: string | number) => {
    const newSelectedProducts = [...selectedProducts]
    const currentItem = newSelectedProducts[productIndex].items[itemIndex]
    
    if (field === 'size') {
      const product = products.find(p => p.id === currentItem.id)
      if (product) {
        const selectedSize = product.sizes.find(size => size.id === value)
        if (selectedSize) {
          currentItem.size = selectedSize
          currentItem.cost = selectedSize.cost
        }
      }
    } else if (field === 'color') {
      const selectedColor = colors.find(c => c.id === value)
      if (selectedColor) {
        currentItem.color = selectedColor
      }
    } else {
      currentItem[field] = value as never
    }
    setSelectedProducts(newSelectedProducts)
  }

  const removeProductItem = (productIndex: number, itemIndex: number) => {
    const newSelectedProducts = [...selectedProducts]
    newSelectedProducts[productIndex].items.splice(itemIndex, 1)
    if (newSelectedProducts[productIndex].items.length === 0) {
      newSelectedProducts.splice(productIndex, 1)
    }
    setSelectedProducts(newSelectedProducts)
  }
  const calculateSubtotal = (items: ProductItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity * item.size.cost, 0)
  }
  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + calculateSubtotal(product.items), 0)
  }

  const calculateTotalPairs = () => {
    return selectedProducts.reduce((sum, product) => sum + product.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  }
  const handleCostCheck = (costId: number, amount: number, checked: boolean) => {
    if (checked) {
      setProductionCosts(prev => [...prev, { id: costId, amount }])
    } else {
      setProductionCosts(prev => prev.filter(cost => cost.id !== costId))
    }
  }
  useEffect(() => {
    if(fetchOrder.data){
        const { customerId, orderDate, products } = fetchOrder.data
        setOrderType(customerId ? 'sale' : 'manufacturing')
        setOrderDate(new Date(orderDate))
        setCustomer(customerId ?  customerId.toString() : "")
        const processedProducts : OrderProduct[] = []
        for(const product of products){
            //check if this product is in the array 
            const findProduct = processedProducts.find(p => p.id === product.productId.toString())
            if(!findProduct){
                processedProducts.push({
                    id : product.productId.toString(),
                    name : product.productName,
                    items : []
                })
                // Get the items array of this product 
                const itemsArray = processedProducts.find(processedProduct => processedProduct.id === product.productId.toString())?.items
                itemsArray?.push({
                    id : product.productId.toString(), 
                    size : {
                        id : product.sizeId.toString(),
                        name : product.sizeName, 
                        cost : product.cost
                    }, 
                    color : {
                        name : product.colorName, 
                        id : product.colorId.toString()
                    }, 
                    quantity : product.quantity, 
                    cost : product.cost
                })
            }else{
                // Get the items array of this product 
                const itemsArray = processedProducts.find(processedProduct => processedProduct.id === product.productId.toString())?.items
                itemsArray?.push({
                    id : product.productId.toString(), 
                    size : {
                        id : product.sizeId.toString(),
                        name : product.sizeName, 
                        cost : product.cost
                    }, 
                    color : {
                        name : product.colorName, 
                        id : product.colorId.toString()
                    }, 
                    quantity : product.quantity, 
                    cost : product.cost
                })
            }
        }
        setSelectedProducts(processedProducts)
    }
  }, [fetchOrder.isSuccess, fetchOrder.data])
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Production Order</h1>

      <div className="mb-6">
        <div className="flex space-x-4 mb-6">
          <Button
            variant={orderType === 'sale' ? 'default' : 'outline'}
            onClick={() => setOrderType('sale')}
          >
            Customer Order
          </Button>
          <Button
            variant={orderType === 'manufacturing' ? 'default' : 'outline'}
            onClick={() => setOrderType('manufacturing')}
          >
            In-house Manufacturing
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {orderType === 'sale' && (
            <div>
              <Label htmlFor="customer">Customer</Label>
              <Select value={customer} onValueChange={setCustomer}>
                <SelectTrigger id="customer">
                  <SelectValue placeholder="Select customer" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((c) => (<SelectItem key={c.id} value={c.id.toString()}>{c.customerName}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div>
            <Label htmlFor="date">Production Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant={"outline"}
                  className={`w-full justify-start text-left font-normal ${!orderDate && "text-muted-foreground"}`}
                >
                  {orderDate ? format(orderDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={orderDate}
                  onSelect={setOrderDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* <div>
            <Label htmlFor="status">Status</Label>
            <Select value={status} onValueChange={setStatus}>
              <SelectTrigger id="status">
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="processing">Processing</SelectItem>
                <SelectItem value="fulfilled">Fulfilled</SelectItem>
              </SelectContent>
            </Select>
          </div> */}
        </div>
      </div>

      <div className="mb-6 relative">
        <Label htmlFor="productSearch" className="text-lg font-semibold mb-2 block">Search for item no.</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="productSearch"
            type="text"
            placeholder="Type to search for item no..."
            value={productSearch}
            onChange={(e) => setProductSearch(e.target.value)}
            className="pl-10 py-2 text-lg"
          />
        </div>
        {productSearch && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.map(product => (
              <div
                key={product.id}
                className="p-2 hover:bg-gray-100 cursor-pointer"
                onClick={() => addProduct(product.id)}
              >
                {product.name}
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProducts.map((product, productIndex) => (
        <Card key={product.id} className="mb-6">
          <CardHeader>
            <CardTitle>{product.name}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Color</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.items.map((item, itemIndex) => (
                    <TableRow key={itemIndex}>
                      <TableCell>
                        <Select
                          value={item.size.id}
                          onValueChange={(value) => updateProductItem(productIndex, itemIndex, 'size', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.find(p => p.id === item.id)?.sizes.map((size) => (
                              <SelectItem key={size.id} value={size.id}>{size.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.color.id}
                          onValueChange={(value) => updateProductItem(productIndex, itemIndex, 'color', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder={item.color.name} />
                          </SelectTrigger>
                          <SelectContent>
                            {colors.map((color) => (<SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateProductItem(productIndex, itemIndex, 'quantity', parseFloat(e.target.value))}
                          min={0}
                          step={0.01}
                        />
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            checked={productionCosts.some(cost => cost.id === parseInt(item.id) && cost.amount === item.size.cost)}
                            onChange={(e) => handleCostCheck(parseInt(item.id), item.size.cost, e.target.checked)}
                            className="h-4 w-4"
                          />
                          {formatCurrency(item.size.cost)}
                        </div>
                      </TableCell>
                      <TableCell>{formatCurrency(item.quantity * item.size.cost)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeProductItem(productIndex, itemIndex)}>
                          <X className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            <div className="mt-4 flex justify-between items-center">
              <Button onClick={() => addProductItem(productIndex)}>
                <Plus className="mr-2 h-4 w-4" /> Add Size
              </Button>
              <div>
                <span className="font-semibold">Subtotal:</span> {formatCurrency(calculateSubtotal(product.items))}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
      
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full md:w-auto order-2 md:order-1">
            <p className="text-lg"><span className="font-semibold">Total Pairs:</span> {calculateTotalPairs()}</p>
            <p className="text-2xl font-bold mt-2"><span>Total Amount:</span> {formatCurrency(calculateTotal())}</p>
          </div>
          <div className="w-full md:w-auto order-1 md:order-2 mb-4 md:mb-0">
            <Button className="w-full md:w-auto" onClick={handleSaveProductionOrder} disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Production Order"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

