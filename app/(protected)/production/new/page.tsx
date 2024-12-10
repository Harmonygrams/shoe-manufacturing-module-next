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
import { ScrollArea } from "@/components/ui/scroll-area"

type Product = {
  id: number;
  name: string;
  sku: string;
  cost: number;
}


type SalesOrder = {
  id: number;
  customerName: string;
  orderDate: string;
  products: {
    productId: number;
    quantity: number;
  }[];
}

type ManufacturingItem = {
  productId: number;
  quantity: number;
}

type ManufacturingData = {
  date: Date;
  items: ManufacturingItem[];
  laborCost: number;
}

export default function AddManufacturingPage() {
  const [manufacturingData, setManufacturingData] = useState<ManufacturingData>({
    date: new Date(),
    items: [],
    laborCost: 0,
  })
  const [selectedSalesOrder, setSelectedSalesOrder] = useState<SalesOrder | null>(null)

  const { data: products = [] } = useQuery<Product[]>({
    queryKey: ['products'],
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

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      setManufacturingData(prev => ({ ...prev, date }))
    }
  }

  const handleAddItem = () => {
    if (!selectedSalesOrder) {
      setManufacturingData(prev => ({
        ...prev,
        items: [...prev.items, { productId: 0, quantity: 0 }],
      }))
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
    setManufacturingData(prev => ({ ...prev, laborCost: parseFloat(value) || 0 }))
  }

  const calculateTotalCost = () => {
    const itemsCost = manufacturingData.items.reduce((total, item) => {
      const product = products.find(p => p.id === item.productId)
      return total + (product?.cost || 0) * item.quantity
    }, 0)
    return itemsCost + manufacturingData.laborCost
  }

  const handleSelectSalesOrder = (salesOrder: SalesOrder) => {
    setSelectedSalesOrder(salesOrder)
    setManufacturingData(prev => ({
      ...prev,
      items: salesOrder.products.map(p => ({ productId: p.productId, quantity: p.quantity })),
    }))
  }

  const handleUnselectSalesOrder = () => {
    setSelectedSalesOrder(null)
    setManufacturingData(prev => ({ ...prev, items: [] }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Implement the logic to save the manufacturing data
    console.log('Submitting manufacturing data:', manufacturingData)
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
                        <TableHead>Quantity</TableHead>
                        <TableHead>Manufacturing Cost</TableHead>
                        <TableHead>Total Cost</TableHead>
                        {!selectedSalesOrder && <TableHead>Action</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {manufacturingData.items.map((item, index) => {
                        const product = products.find(p => p.id === item.productId)
                        const totalCost = (product?.cost || 0) * item.quantity
                        return (
                          <TableRow key={index}>
                            <TableCell>
                              {selectedSalesOrder ? (
                                product?.name
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
                                      <SelectItem key={product.id} value={product.id.toString()}>
                                        {product.name}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              )}
                            </TableCell>
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
                            {/* <TableCell>${product?.manufacturingCost.toFixed(2) || '0.00'}</TableCell> */}
                            <TableCell>3.00</TableCell>
                            <TableCell>${totalCost.toFixed(2)}</TableCell>
                            {!selectedSalesOrder && (
                              <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(index)}>
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </TableCell>
                            )}
                          </TableRow>
                        )
                      })}
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

                <div className="flex justify-between items-center">
                  <div className="text-xl font-semibold">
                    Total Manufacturing Cost: ${calculateTotalCost().toFixed(2)}
                  </div>
                  <Button type="submit">Save Manufacturing Data</Button>
                </div>
              </form>
            </CardContent>
          </Card>
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