'use client'
import React, { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {  X } from 'lucide-react'
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
import { baseUrl } from '@/utils/baseUrl'
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Comprehensive Type Definitions
interface RawMaterial {
  rawMaterialId: number;
  rawMaterialName: string;
  quantityNeeded: number;
  quantityAvailable: number;
  quantityPerUnit: number;
  materialCost: number;
}

interface Product {
  productId: number;
  productName: string;
  cost: number;
  colorName: string;
  colorId: number;
  quantity: number;
  sizeName: string;
  sizeId: string;
  rawMaterials: RawMaterial[];
}

interface SalesOrder {
  id: number;
  customerName: string;
  orderDate: string;
  products: Product[];
}

interface ManufacturingItem {
  productId: number;
  productName?: string;
  quantity: number;
}

interface ManufacturingData {
  date: Date;
  items: ManufacturingItem[];
  laborCost: number;
}

interface ManufacturingCost {
  id: string;
  name: string;
  amount: number;
}

interface RawMaterialSummary {
  rawMaterialId: number;
  rawMaterialName: string;
  quantityNeeded: number;
  quantityAvailable: number;
}

interface ProductionPayload {
  productionDate: Date;
  status?: string;
  orderType?: 'sales' | 'custom';
  orderId?: number;
  productionCosts?: ManufacturingCost[];
  products: Array<{
    productId: number;
    sizeId?: string;
    colorId?: number;
    unitCost?: number;
    quantity: number;
  }>;
  rawMaterials?: Array<{
    materialId: number;
    quantity: number;
  }>;
  laborCost?: number;
}

export default function AddManufacturingPage(): React.JSX.Element {
  const { toast } = useToast()
  const [status, setStatus] = useState<string>()
  const [productionCosts, setProductionCosts] = useState<ManufacturingCost[]>([])
  const [manufacturingData, setManufacturingData] = useState<ManufacturingData>({
    date: new Date(),
    items: [],
    laborCost: 0,
  })
  const [loading, setLoading] = useState<boolean>(false)
  const [selectedSalesOrder, setSelectedOrder] = useState<SalesOrder | undefined>()
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [activeTab, setActiveTab] = useState<string>('sales-orders')

  const { data: manufacturingCosts = [] } = useQuery<ManufacturingCost[]>({
    queryKey: ['manufacturingCosts'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/manufacturing-costs`)
      if (!response.ok) throw new Error('Failed to fetch manufacturing costs')
      return response.json()
    }
  })

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
      const response = await fetch(`${baseUrl()}/orders?orderStatus=pending`, { 
        method: 'GET', 
        headers: { 'Content-Type': 'Application/json' } 
      })
      if (!response.ok) throw new Error('Failed to fetch sales orders')
      return response.json()
    },
  })

  const calculateTotalPairs = (): number => {
    if (activeTab === 'sales-orders' && selectedSalesOrder) {
      const totalPairs = selectedSalesOrder.products.reduce((total, product) => total + Number(product.quantity), 0)
      return totalPairs

    }
    const totalPairs = manufacturingData.items.reduce((total, item) => total + Number(item.quantity), 0)
    return totalPairs
  }

  const calculateTotalMaterials = (products: Product[]): RawMaterialSummary[] => {
    const materialTotals = products.reduce((acc, product) => {
      product.rawMaterials.forEach(material => {
        const totalNeeded = material.quantityPerUnit * product.quantity
        const quantityAvailable = material.quantityAvailable

        if (acc[material.rawMaterialId]) {
          acc[material.rawMaterialId].quantityNeeded += totalNeeded
          acc[material.rawMaterialId].quantityAvailable = Math.min(
            acc[material.rawMaterialId].quantityAvailable,
            quantityAvailable
          )
        } else {
          acc[material.rawMaterialId] = {
            rawMaterialId: material.rawMaterialId,
            rawMaterialName: material.rawMaterialName,
            quantityNeeded: totalNeeded,
            quantityAvailable: quantityAvailable,
          }
        }
      })
      return acc
    }, {} as Record<number, RawMaterialSummary>)

    return Object.values(materialTotals)
  }

  const calculateTotalCost = (): number => {
    const totalPairs = calculateTotalPairs()
    
    const rawMaterialCost = activeTab === 'sales-orders' && selectedSalesOrder 
      ? selectedSalesOrder.products.reduce((total, product) => {
          const materialCost = product.rawMaterials.reduce((init, accum) => init + accum.materialCost, 0)
          return total + (materialCost * product.quantity)
        }, 0)
      : manufacturingData.items.reduce((total, item) => {
          const product = products.find(p => p.productId === item.productId)
          return total + ((product?.cost || 0) * item.quantity)
        }, 0)

    const manufacturingCostTotal = (manufacturingCosts || [])
      .filter(cost => productionCosts.some(pc => pc.id === cost.id))
      .reduce((total, cost) => total + (cost.amount * totalPairs), 0)

    const laborCost = activeTab === 'sales-orders' ? 0 : manufacturingData.laborCost

    return rawMaterialCost + manufacturingCostTotal + laborCost
  }

  const handleSelectSalesOrder = async (salesOrder: SalesOrder): Promise<void> => {
    if (salesOrder.id) {
      setIsLoading(true)
      try {
        const response = await fetch(`${baseUrl()}/orders/${salesOrder.id}`, {
          method: 'GET',
          headers: { 'Content-Type': 'application/json' }
        })
        if (response.ok) {
          const responseJson = await response.json() as SalesOrder
          setSelectedOrder(responseJson)
        }
      } catch (error) {
        console.error('Error fetching sales order:', error)
      } finally {
        setIsLoading(false)
      }
    }
  }

  const handleSubmit = async (): Promise<void> => {
    setLoading(true)
    
    let saveInDb: ProductionPayload
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
        orderType: 'sales', 
        orderId: selectedSalesOrder.id,
        productionCosts: productionCosts,
        products: selectedSalesOrder.products.map((product) => ({
          productId: product.productId,
          sizeId: product.sizeId,
          colorId: product.colorId,
          unitCost: product.rawMaterials.reduce((init, accum) => (init + accum.materialCost), 0),
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
        orderType: 'custom',
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
        headers: { 'Content-Type': 'application/json' }
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

  const handleAddProductionCost = (cost: ManufacturingCost): void => {
    setProductionCosts(prev => 
      prev.some(pc => pc.id === cost.id) 
        ? prev.filter(pc => pc.id !== cost.id)
        : [...prev, cost]
    )
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
                          onChange={(e) => setManufacturingData(prev => ({ ...prev, date: new Date(e.target.value) }))}
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
                        <Button type="button" onClick={() => setSelectedOrder(undefined)} variant="outline">
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
                  </form>
                </CardContent>
              </Card>

              {/* Manufacturing Costs Section */}
              <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Manufacturing Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Include</TableHead>
                        <TableHead>Cost Name</TableHead>
                        <TableHead>Amount Per Pair</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manufacturingCosts.map((cost) => {
                        const totalPairs = calculateTotalPairs()
                        const totalCost = cost.amount * totalPairs
                        return (
                          <TableRow key={cost.id}>
                            <TableCell>
                              <input 
                                type="checkbox" 
                                checked={productionCosts.some(pc => pc.id === cost.id)}
                                onChange={() => handleAddProductionCost(cost)}
                              />
                            </TableCell>
                            <TableCell>{cost.name}</TableCell>
                            <TableCell>{formatCurrency(cost.amount)}</TableCell>
                            <TableCell>{formatCurrency(totalCost)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
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
                              <TableCell>{material.quantityAvailable.toFixed(2)}</TableCell>
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