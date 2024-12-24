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
import { useToast } from '@/hooks/use-toast'
import { ScrollArea } from "@/components/ui/scroll-area"
import { formatCurrency } from '@/helpers/currencyFormat'
import { Skeleton } from "@/components/ui/skeleton"
import { v4 as uuidv4} from 'uuid'
import { baseUrl } from '@/utils/baseUrl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

type Product = {
  productName: string;
  cost: number;
  productId: number;
  colorName: string;
  colorId: number;
  quantity: number;
  sizeName: string;
  sizeId: string;
  rawMaterials: RawMaterial[]
}

type RawMaterial = {
  rawMaterialName: string;
  rawMaterialId: number;
  quantityNeeded: number;
  quantityAvailable: number;
  quantityPerUnit: number;
  materialCost : number;
}

type SalesOrder = {
  id: number;
  customerName: string;
  orderDate: string;
  products: Product[];
}

type ManufacturingItem = {
  productId: number;
  productName: string;
  quantity: number;
}

type ManufacturingData = {
  date: Date;
  items: ManufacturingItem[];
  laborCost: number;
}


export default function AddManufacturingPage() {
  const [status, setStatus] = useState<string>()
  const { toast } = useToast()
  const [manufacturingData, setManufacturingData] = useState<ManufacturingData>({
    date: new Date(),
    items: [],
    laborCost: 0,
  })
  const [loading, setLoading] = useState(false)
  const [selectedSalesOrder, setSelectedOrder] = useState<SalesOrder>()
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('sales-orders')

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['PRODUCTS'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/products`)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    },
  })

  const { data: salesOrders = [] } = useQuery<SalesOrder[]>({
    queryKey: ['SALES'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/orders?orderStatus=pending`, { method: 'GET', headers: { 'Content-Type': 'Application/json' } })
      if (!response.ok) throw new Error('Failed to fetch sales orders')
      return response.json()
    },
  })

  const calculateTotalMaterials = (products: Product[]) => {
    const materialTotals = products.reduce((acc, product) => {
      product.rawMaterials.forEach(material => {
        const totalNeeded = material.quantityPerUnit * product.quantity; // Calculate total needed for this product
        const quantityAvailable = material.quantityAvailable; // Available quantity for this material
  
        if (acc[material.rawMaterialId]) {
          // Add to the existing total
          acc[material.rawMaterialId].quantityNeeded += totalNeeded;
  
          // Update `quantityAvailable` to the minimum value
          acc[material.rawMaterialId].quantityAvailable = Math.min(
            acc[material.rawMaterialId].quantityAvailable,
            quantityAvailable
          );
        } else {
          // Initialize new entry
          acc[material.rawMaterialId] = {
            rawMaterialId: material.rawMaterialId,
            rawMaterialName: material.rawMaterialName,
            quantityNeeded: totalNeeded,
            quantityAvailable: quantityAvailable,
          };
        }
      });
  
      return acc;
    }, {} as Record<number, {
      rawMaterialId: number;
      rawMaterialName: string;
      quantityNeeded: number;
      quantityAvailable: number;
    }>);
  
    // Convert the result to an array (if required)
    return Object.values(materialTotals);
  };
  
  const handleSelectSalesOrder = async (salesOrder: SalesOrder) => {
    if (salesOrder.id) {
      setIsLoading(true)
      try {
        const response = await fetch(`${baseUrl()}/orders/${salesOrder.id}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const responseJson = await response.json() as SalesOrder;
          setSelectedOrder(responseJson)
        }
      } catch (error) {
        console.error('Error fetching sales order:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setManufacturingData(prev => ({ ...prev, date }))
    }
  }

  const handleAddItem = () => {
    setManufacturingData(prev => ({
      ...prev,
      items: [...prev.items, { productId: 0, quantity: 0, productName: '' }],
    }))
  }

  const handleItemChange = (index: number, field: keyof ManufacturingItem, value: any) => {
    setManufacturingData(prev => {
      const newItems = [...prev.items]
      newItems[index] = { ...newItems[index], [field]: value }
      return { ...prev, items: newItems }
    })
  }

  const handleRemoveItem = (index: number) => {
    setManufacturingData(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index),
    }))
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
    setLoading(true)
    let saveInDb
    if (activeTab === 'sales-orders' && selectedSalesOrder) {
      const allRawMaterials = selectedSalesOrder.products.flatMap(product => product.rawMaterials)
      const storeRawMaterials = allRawMaterials.reduce((acc, rawMaterial) => {
        const existingMaterial = acc.find(item => item.rawMaterialId === rawMaterial.rawMaterialId)
        if (existingMaterial) {
          existingMaterial.quantityNeeded += rawMaterial.quantityNeeded
        } else {
          acc.push({ ...rawMaterial })
        }
        return acc
      }, [] as RawMaterial[])

      saveInDb = {
        productionDate: new Date(),
        status: status,
        orderType : 'sales', 
        orderId : selectedSalesOrder.id,
        products: selectedSalesOrder.products.map((product) => ({
          productId: product.productId,
          sizeId: product.sizeId,
          colorId: product.colorId,
          unitCost : product.rawMaterials.reduce((init, accum) => (init + accum.materialCost), 0),
          quantity: product.quantity,
        })),
        rawMaterials: storeRawMaterials.map((rawMaterial) => ({
          materialId: rawMaterial.rawMaterialId,
          quantity: rawMaterial.quantityNeeded
        }))
      }
    } else {
      saveInDb = {
        productionDate: manufacturingData.date,
        status: status,
        products: manufacturingData.items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
        })),
        laborCost: manufacturingData.laborCost
      }
    }

    try {
      const response = await fetch(`${baseUrl()}/manufacturing`, {
        method: 'POST',
        body: JSON.stringify(saveInDb),
        headers: { 'Content-Type': 'Application/json' }
      })
      if (response.ok) {
        toast({
          title: "Production Added Successfully",
          description: "You have successfully added a new production",
        })
        window.location.href = '/manufacturing'
      } else {
        const errorMessage = await response.json()
        throw new Error(errorMessage)
      }
    } catch (error) {
      toast({
        title: "Production error occurred",
        description: error instanceof Error ? error.message : "An unknown error occurred",
        variant: 'destructive'
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="sales-orders">Add Production Orders</TabsTrigger>
        </TabsList>
        <TabsContent value="sales-orders">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Add Manufacturing from Sales Order</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={(e) => { e.preventDefault(); handleSubmit(); }} className="space-y-6">
                    <div className="flex items-end space-x-4 flex-wrap">
                      <div className="flex-1">
                        <Label htmlFor="manufacturingDate">Manufacturing Date</Label>
                        <Input
                          type="date"
                          id="manufacturingDate"
                          value={manufacturingData.date.toISOString().split('T')[0]}
                          onChange={(e) => handleDateChange(new Date(e.target.value))}
                        />
                      </div>
                      <div className="flex-1">
                        <Label htmlFor="status">Status</Label>
                        <Select value={status} onValueChange={setStatus}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="cutting">Cutting</SelectItem>
                            <SelectItem value="sticking">Sticking</SelectItem>
                            <SelectItem value="lasting">Lasting</SelectItem>
                            <SelectItem value="finished">Finished</SelectItem>
                          </SelectContent>
                        </Select>
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
                              const totalCost = (item?.cost || 0) * item.quantity
                              return (
                                <TableRow key={index}>
                                  <TableCell>{item?.productName}</TableCell>
                                  <TableCell>{item.sizeName}</TableCell>
                                  <TableCell>{item.colorName}</TableCell>
                                  <TableCell>{item.quantity}</TableCell>
                                  <TableCell>{formatCurrency(item.rawMaterials.reduce((init, accum) => init + accum.materialCost, 0))}</TableCell>
                                  <TableCell>{formatCurrency(item.rawMaterials.reduce((init, accum) => init + accum.materialCost, 0) * item.quantity)}</TableCell>
                                </TableRow>
                              )
                            })
                          )}
                        </TableBody>
                      </Table>
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

              {/* Updated Raw Materials Section */}
              {selectedSalesOrder && (
                <Card className="mt-8">
                  <CardHeader>
                    <CardTitle className="text-2xl font-bold">Raw Materials Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Raw Material</TableHead>
                          <TableHead>Quantity Needed</TableHead>
                          <TableHead>Available</TableHead>
                          <TableHead>Status</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isLoading ? (
                          <TableRow>
                            <TableCell colSpan={4}>
                              <div className="space-y-2">
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                                <Skeleton className="h-4 w-full" />
                              </div>
                            </TableCell>
                          </TableRow>
                        ) : (
                          calculateTotalMaterials(selectedSalesOrder.products).map((material) => (
                            <TableRow key={material.rawMaterialId}>
                              <TableCell>{material.rawMaterialName}</TableCell>
                              <TableCell>{material.quantityNeeded.toFixed(2)}</TableCell>
                              <TableCell>{material.quantityAvailable}</TableCell>
                              <TableCell>
                                {material.quantityAvailable >= material.quantityNeeded ? (
                                  <span className="text-green-600">Sufficient</span>
                                ) : (
                                  <span className="text-red-600">Insufficient</span>
                                )}
                              </TableCell>
                            </TableRow>
                          ))
                        )}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              )}

              <div className="flex justify-between items-center mt-10">
                <div className="text-xl font-semibold">
                  Total Manufacturing Cost: {formatCurrency(calculateTotalCost())}
                </div>
                <Button type="submit" disabled={loading} onClick={handleSubmit}>Save Production</Button>
              </div>
            </div>
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-bold">Production Orders</CardTitle>
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
      </TabsContent>
      </Tabs>
    </div>
  )
}

