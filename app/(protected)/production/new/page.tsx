'use client'
import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Plus, Trash2, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
// import { DatePicker } from "@/components/ui/date-picker"
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from '@/helpers/currencyFormat'
import { Skeleton } from "@/components/ui/skeleton"
import { v4 as uuidv4} from 'uuid'
type Product = {
  productName : string;
  cost : number;
  productId: number;
  colorName : string; 
  colorId : number; 
  quantity: number;
  sizeName : string; 
  sizeId : string;
  rawMaterials : RawMaterial[]
}

type RawMaterial = {
  rawMaterialName: string;
  rawMaterialId: number;
  quantityNeeded: number;
  quantityAvailable: number;
  quantityPerUnit : number;
}

type SalesOrder = {
  id: number;
  customerName: string;
  orderDate: string;
  products: Product[];
}

type ManufacturingItem = {
  productId: number;
  productName : string;
  quantity: number;
}

type ManufacturingData = {
  date: Date;
  items: ManufacturingItem[];
  laborCost: number;
}

export default function AddManufacturingPage() {
  const {toast} = useToast(); 
  const [manufacturingData, setManufacturingData] = useState<ManufacturingData>({
    date: new Date(),
    items: [],
    laborCost: 0,
  })
  const [ loading, setLoading ] = useState(false); 
  const [ selectedSalesOrder, setSelectedOrder ] = useState<SalesOrder>();
  const [isLoading, setIsLoading] = useState(false)
  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['PRODUCTS'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/v1/products')
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })
  const { data: salesOrders = [] } = useQuery<SalesOrder[]>({
    queryKey: ['SALES'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/v1/sales', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if (!response.ok) throw new Error('Failed to fetch sales orders')
      const salesOrdersJson = await response.json() as SalesOrder[]
      return salesOrdersJson;
      
    },
  })
   // And fix the handler function
   const handleSelectSalesOrder = async (salesOrder: SalesOrder) => {
     if(salesOrder.id){
       setIsLoading(true)
       try {
         const response = await fetch(`http://localhost:5001/api/v1/sales/${salesOrder.id}`, {
           method: 'GET',
           headers: {
             'Content-Type': 'application/json'
           }
         });
         if(response.ok){
          const responseJson = await response.json() as SalesOrder;
          console.log(responseJson);
          setSelectedOrder(responseJson)
         }
       } catch (error) {
         console.error('Error fetching sales order:', error)
       } finally {
         setIsLoading(false)
       }
     }
    
  };
  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setManufacturingData(prev => ({ ...prev, date }))
    }
  }

  const handleAddItem = () => {
    if (!selectedSalesOrder) {
      // setManufacturingData(prev => ({
      //   ...prev,
      //   items: [...prev.items, { productId: 0, quantity: 0, productName : selectedSalesOrder }],
      // }))
    }
  }

  const handleItemChange = (index: number, field: keyof ManufacturingItem, value: number) => {
    if (!selectedSalesOrder) {
      setManufacturingData(prev => {
        const newItems = [...prev.items]
        newItems[index] = { ...newItems[index], [field]: value }
        return { ...prev, items: newItems }
      })
    }
  }

  const handleRemoveItem = (index: number) => {
    if (!selectedSalesOrder) {
      setManufacturingData(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index),
      }))
    }
  }

  const handleLaborCostChange = (value: string) => {
    setManufacturingData(prev => ({ ...prev, laborCost: parseFloat(value) }))
  }

  const calculateTotalCost = () => {
    const itemsCost = manufacturingData.items.reduce((total, item) => {
      const product = products.find(p => p.productId === item.productId)
      return total + (product?.cost || 0) * item.quantity
    }, 0)
    return itemsCost + manufacturingData.laborCost
  }

  const handleUnselectSalesOrder = () => {
    setSelectedOrder(undefined)
    setManufacturingData(prev => ({ ...prev, items: [] }))
  }

  const handleSubmit = async () => { 
    setLoading(true); 
    if(selectedSalesOrder){
      const allRawMaterials = selectedSalesOrder.products.map(rawMaterials => rawMaterials.rawMaterials)
      let storeRawMaterials:RawMaterial[] = []
      for(const allRawMaterial of allRawMaterials){
        for(const rawMaterial of allRawMaterial){
          const rawMaterialInArray = storeRawMaterials.find(item => item.rawMaterialId === rawMaterial.rawMaterialId)
          if(rawMaterialInArray){
            rawMaterialInArray.quantityNeeded += rawMaterial.quantityNeeded;
          }else{
            storeRawMaterials.push(rawMaterial);
          }
        }
      }
      const saveInDb = {
        productionDate : new Date(), 
        status : 'finishing',
        products : selectedSalesOrder?.products.map((product) => ({
          productId : product.productId,
          sizeId : product.sizeId, 
          colorId : product.colorId, 
          quantity : product.quantity,
        })), 
        rawMaterials : storeRawMaterials.map((rawMaterial) => ({ 
          materialId : rawMaterial.rawMaterialId,
          quantity : rawMaterial.quantityNeeded
        }))
      }
      const  backend = await fetch('http://localhost:5001/api/v1/productions', { method : 'POST', body : JSON.stringify(saveInDb), headers : { 'Content-Type' : 'Application/json'}})
      if(backend.ok){
        toast({
          title: "Production Added Successfully",
          description: "You have successfully added no production",
        })
        setLoading(false); 
        window.location.href = '/production'
      }
      else{
        const errorMessage = await backend.json()
        toast({
          title: "Production error occured",
          description: errorMessage,
          variant : 'destructive'
        })
        setLoading(false)
      }
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Add Manufacturing</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex items-center space-x-4">
                  <div className="flex-1">
                    <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
                    {/* <DatePicker
                      id="manufacturingDate"
                      selected={manufacturingData.date}
                      onSelect={handleDateChange}
                    /> */}
                  </div>
                  {selectedSalesOrder && (
                    <Button type="button" onClick={handleUnselectSalesOrder} variant="outline">
                      <X className="mr-2 h-4 w-4" /> Unselect Sales Order
                    </Button>
                  )}
                </div>

                <div>
                  <Label>Products</Label>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Product</TableHead>
                        <TableHead>Size</TableHead>
                        <TableHead>Color</TableHead>
                        <TableHead>Quantity</TableHead>
                        <TableHead>Manufacturing Cost</TableHead>
                        <TableHead>Total Cost</TableHead>
                        {!selectedSalesOrder && <TableHead>Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={6}>
                            <div className="space-y-2">
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                              <Skeleton className="h-4 w-full" />
                            </div>
                          </TableCell>
                        </TableRow>
                      ) : (
                        selectedSalesOrder?.products.map((item, index) => {
                          const product = products.find(p => p.productId === item.productId)
                          const totalCost = (item?.cost || 0) * item.quantity
                          return (
                            <TableRow key={index}>
                              <TableCell>
                                {selectedSalesOrder ? (
                                  item?.productName
                                ) : (
                                  <Select
                                    value={item.productId.toString()}
                                    onValueChange={(value) => handleItemChange(index, 'productId', parseInt(value))}
                                  >
                                    <SelectTrigger>
                                      <SelectValue placeholder="Select product" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      {products.map((product) => (
                                        <SelectItem key={product.productId} value={product.productId.toString()}>
                                          {item.productName}
                                        </SelectItem>
                                      ))}
                                    </SelectContent>
                                  </Select>
                                )}
                              </TableCell>
                              <TableCell>{item.sizeName}</TableCell>
                              <TableCell>{item.colorName}</TableCell>
                              <TableCell>
                                {selectedSalesOrder ? (
                                  item.quantity
                                ) : (
                                  <Input
                                    type="number"
                                    value={item.quantity}
                                    onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value))}
                                    min="0"
                                  />
                                )}
                              </TableCell>
                              <TableCell>{formatCurrency(item.cost)}</TableCell>
                              <TableCell>{formatCurrency(totalCost)}</TableCell>
                              {!selectedSalesOrder && (
                                <TableCell>
                                  <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </TableCell>
                              )}
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                  {!selectedSalesOrder && (
                    <Button type="button" onClick={handleAddItem} className="mt-2">
                      <Plus className="mr-2 h-4 w-4" /> Add Product
                    </Button>
                  )}
                </div>

                <div>
                  <Label htmlFor="laborCost">Additional Labor Cost</Label>
                  <Input
                    id="laborCost"
                    type="number"
                    value={manufacturingData.laborCost}
                    onChange={(e) => handleLaborCostChange(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </form>
            </CardContent>
          </Card>
          {/* Raw Materials Section */}
          <Card className="mt-8">
            <CardHeader>
              <CardTitle className="text-2xl font-bold">Raw Materials</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product</TableHead>
                    <TableHead>Raw Material</TableHead>
                    <TableHead>Quantity Per Unit</TableHead>
                    <TableHead>Quantity Needed</TableHead>
                    <TableHead>Quantity Available</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                          <Skeleton className="h-4 w-full" />
                        </div>
                      </TableCell>
                    </TableRow>
                  ) : (
                    selectedSalesOrder?.products.flatMap((product) =>
                      product.rawMaterials.map((rawMaterial, index) => {
                        return (<TableRow key={uuidv4()}>
                          {index === 0 && (
                            <TableCell rowSpan={product.rawMaterials.length}>
                              {product.productName}
                              <br />
                              {product.colorName}
                              <br />
                              {product.quantity}
                            </TableCell>
                          )}
                          <TableCell>{rawMaterial.rawMaterialName}</TableCell>
                          <TableCell>{rawMaterial.quantityPerUnit}</TableCell>
                          <TableCell>{rawMaterial.quantityNeeded}</TableCell>
                          <TableCell>{rawMaterial.quantityAvailable}</TableCell>
                          <TableCell>
                            {rawMaterial.quantityAvailable >= rawMaterial.quantityNeeded * product.quantity ? (
                              <span className="text-green-600">Sufficient</span>
                            ) : (
                              <span className="text-red-600">Insufficient</span>
                            )}
                          </TableCell>
                        </TableRow>)})
                    )
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
      <div className="flex justify-between items-center mt-10">
        <div className="text-xl font-semibold">
          Total Manufacturing Cost: ${calculateTotalCost().toFixed(2)}
        </div>
        <Button type="submit" disabled={loading} onClick={handleSubmit}>Save Production</Button>
      </div>
        </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Sales Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-200px)]">
                {salesOrders.map((order) => (
                  <Card 
                    key={order.id} 
                    className={`mb-4 cursor-pointer transition-all ${selectedSalesOrder?.id === order.id ? 'border-primary' : ''}`}
                    onClick={() => handleSelectSalesOrder(order)}
                  >
                    <CardContent className="p-4">
                      <h3 className="font-semibold">{order.customerName}</h3>
                      <p className="text-sm text-muted-foreground">Order Date: {new Date(order.orderDate).toDateString()}</p>
                      <p className="text-sm font-medium">Total Products: {order.products.length}</p>
                    </CardContent>
                  </Card>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

