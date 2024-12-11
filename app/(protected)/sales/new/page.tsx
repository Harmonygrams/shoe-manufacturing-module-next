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
import Joi from 'joi'
import { formatCurrency } from '@/helpers/currencyFormat'

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
  customerId : string, 
  transactionDate : Date | undefined, 
  status : string,
  products : OrderProduct2[]
}
type Customer = {
  id : string;
  customerName : string;
}
type Product = {
  id : string; 
  name : string; 
  sizes : Size[];
  bom : RawMaterial[];
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
export default function SalesOrderPage() {
  const [isLoadingBom, setIsLoadingBom] = useState<boolean>(false); 
  const [customer, setCustomer] = useState<string>('')
  const [orderDate, setOrderDate] = useState<Date | undefined>(new Date())
  const [rawMaterials, setRawMaterials] = useState<RawMaterial[]>([])
  const [status, setStatus] = useState('pending')
  const [productSearch, setProductSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])
  const [order,  setOrder ] = useState<Order>()
  // Fetch customers from db 
  const { data : customers = []} = useQuery<Customer[]>({
    queryKey : ['CUSTOMERS'], 
    queryFn : async () => {
      const fetchCustomers = await fetch('http://localhost:5001/api/v1/customers', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
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
          const fetchProducts = await fetch('http://localhost:5001/api/v1/products', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
          if(fetchProducts.ok){
            const fetchProductsJson = await fetchProducts.json() as Product[]
            return fetchProductsJson
          }
        }
      }, 
      {
        queryKey : ['COLORS'], 
        queryFn : async () => {
          const fetchColors = await fetch('http://localhost:5001/api/v1/colors', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
          if(fetchColors.ok){
            const fetchColorsJson = await fetchColors.json() as Color[]
            return fetchColorsJson
          }
        }
      }
    ]
  })
  const saveOrderToDb = useMutation({
    mutationFn : async (payload : string) => {
      const addToDb = await fetch('http://localhost:5001/api/v1/sales', { method : 'POST', body: payload, headers : { 'Content-Type' : 'Application/json'}})
      if(addToDb.ok){
        const addToDbJson = await addToDb.json()
        return addToDbJson
      }
    }
  })
  async function handleSaveSalesOrder () {
    const products = selectedProducts.map(product => {
      const productSizes =  product.items.map(productItem => {
        const colorId = Number(productItem.color);
        return {
          sizeId : productItem.size.id.toString(), 
          colorId : colorId,
          quantity : productItem.quantity, 
          cost : productItem.cost
        }
      })
      return {
        productId : product.id.toString(),
        productSizes
      }
    })    
    setOrder({
      customerId : customer, 
      status : status,
      transactionDate : orderDate,
      products
    })
    if(order){
      console.log(order)
      saveOrderToDb.mutate(JSON.stringify(order), {
        // onSuccess : () => {
        //   window.location.href = "/sales-orders"
        // }
      }); 
    }
  }
  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addProduct = (productId: string) => {
    const product = products.find(p => p.id === productId)
    if (product) {
      setSelectedProducts([...selectedProducts, {
        id: product.id,
        name: product.name,
        items: [{
          id: product.id,
          size: product.sizes[0],
          color: colors[0],
          quantity: 1,
          cost : product.sizes[0].cost
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
      // Find the product
      const product = products.find(p => p.id === currentItem.id)
      if (product) {
        // Find the selected size object
        const selectedSize = product.sizes.find(size => size.id === value)
        if (selectedSize) {
          // Update both size and cost
          currentItem.size = selectedSize
          currentItem.cost = selectedSize.cost
        }
      }
    } else {
      // Handle other field updates normally
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
  const calculateSubpairs = ((items : ProductItem[]) => {
    return items.reduce((sum, item) => sum + item.quantity, 0)
  })
  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + calculateSubtotal(product.items), 0)
  }

  const calculateTotalPairs = () => {
    return selectedProducts.reduce((sum, product) => sum + product.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  }
  // useEffect(() => {
  //   // Get all bills of materials for selected products
  //   const allMaterials = selectedProducts
  //     .map(selectedProduct => {
  //       const product = products.find(p => p.id === selectedProduct.id);
  //       return product?.bom || [];
  //     })
  //     .flat();
  //   console.log('here are all the materials ', allMaterials)
  //   // Create a map to combine duplicates and sum quantities
  //   const materialsMap = allMaterials.reduce((acc, material) => {
  //     if (!material) return acc;
      
  //     if (acc.has(material.id)) {
  //       const existingMaterial = acc.get(material.id);
  //       acc.set(material.id, {
  //         ...existingMaterial,
  //         quantityNeeded: existingMaterial.quantityNeeded + material.quantityNeeded
  //       });
  //     } else {
  //       acc.set(material.id, { ...material });
  //     }
      
  //     return acc;
  //   }, new Map());

  //   // Convert map back to array
  //   const updatedMaterials = Array.from(materialsMap.values());
  //   //Update quantites 
    
  //   setRawMaterials(updatedMaterials);
  // }, [selectedProducts ]);
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Create Sales Order</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <Label htmlFor="customer">Customer</Label>
          <Select value={customer} onValueChange={setCustomer}>
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{`${c.customerName}`}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Order Date</Label>
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

        <div>
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
        </div>
      </div>

      <div className="mb-6">
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
          <div className="mt-2 border rounded-md max-h-60 overflow-y-auto">
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
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {colors.map((color) => (
                              <SelectItem key={color.id} value={color.id}>{color.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateProductItem(productIndex, itemIndex, 'quantity', parseInt(e.target.value))}
                          min={1}
                        />
                      </TableCell>
                      <TableCell>{formatCurrency(item.size.cost)}</TableCell>
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

      {/* <Card className="mt-8">
        <CardHeader>
          <CardTitle>Bill of Materials Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity Needed</TableHead>
                  <TableHead>Available Quantity</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              {isLoadingBom ? <div>Loading bill of materials</div> : 
              <TableBody>
                {rawMaterials.map((material) => (
                  <TableRow key={material.name}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.quantityNeeded}</TableCell>
                    <TableCell>{material.quantityAvailable}</TableCell>
                    <TableCell>
                      {material.quantityAvailable >= material.quantityNeeded ? (
                        <span className="text-green-600">Surplus: {material.quantityAvailable - material.quantityNeeded}</span>
                      ) : (
                        <span className="text-red-600">Needed: {material.quantityNeeded - material.quantityAvailable}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
              }
            </Table>
          </div>
        </CardContent>
      </Card> */}
      <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center sticky bottom-0 bg-background p-4 border-t">
  <div className="w-full md:w-auto order-1 md:order-1 bg-muted p-4 rounded-lg mb-4 md:mb-0">
    <p className="text-lg"><span className="font-semibold">Total Pairs:</span> {calculateTotalPairs()}</p>
    <p className="text-2xl font-bold"><span>Total Amount:</span> {formatCurrency(calculateTotal())}</p>
  </div>
  <div className="w-full md:w-auto order-2 md:order-2">
    <Button className="w-full md:w-auto" onClick={handleSaveSalesOrder}>Save Order</Button>
  </div>
</div>
    </div>
  )
}