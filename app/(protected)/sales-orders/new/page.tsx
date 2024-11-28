'use client'

import { useState } from 'react'
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

// Mock data for customers and products
const customers = [
  { id: '1', name: 'John Doe' },
  { id: '2', name: 'Jane Smith' },
  { id: '3', name: 'Bob Johnson' },
]

const products = [
  { id: '1', name: 'Running Shoe', sizes: ['7', '8', '9', '10'], colors: ['Red', 'Blue', 'Black'], cost: 59.99 },
  { id: '2', name: 'Casual Sneaker', sizes: ['6', '7', '8', '9'], colors: ['White', 'Gray', 'Navy'], cost: 49.99 },
  { id: '3', name: 'Dress Shoe', sizes: ['8', '9', '10', '11'], colors: ['Brown', 'Black'], cost: 79.99 },
]

interface ProductItem {
  productId: string
  size: string
  color: string
  quantity: number
  cost: number
}

interface OrderProduct {
  id: string
  name: string
  items: ProductItem[]
}

export default function SalesOrderPage() {
  const [customer, setCustomer] = useState('')
  const [orderDate, setOrderDate] = useState<Date>()
  const [status, setStatus] = useState('pending')
  const [productSearch, setProductSearch] = useState('')
  const [selectedProducts, setSelectedProducts] = useState<OrderProduct[]>([])

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
          productId: product.id,
          size: product.sizes[0],
          color: product.colors[0],
          quantity: 1,
          cost: product.cost
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
        productId: product.id,
        size: product.sizes[0],
        color: product.colors[0],
        quantity: 1,
        cost: product.cost
      })
      setSelectedProducts(newSelectedProducts)
    }
  }

  const updateProductItem = (productIndex: number, itemIndex: number, field: keyof ProductItem, value: string | number) => {
    const newSelectedProducts = [...selectedProducts]
    newSelectedProducts[productIndex].items[itemIndex][field] = value as never
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
    return items.reduce((sum, item) => sum + item.quantity * item.cost, 0)
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, product) => sum + calculateSubtotal(product.items), 0)
  }

  const calculateTotalPairs = () => {
    return selectedProducts.reduce((sum, product) => sum + product.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0)
  }

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
                <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
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
        <Label htmlFor="productSearch" className="text-lg font-semibold mb-2 block">Search and Add Products</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="productSearch"
            type="text"
            placeholder="Type to search for products..."
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
                          value={item.size}
                          onValueChange={(value) => updateProductItem(productIndex, itemIndex, 'size', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.find(p => p.id === item.productId)?.sizes.map((size) => (
                              <SelectItem key={size} value={size}>{size}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Select
                          value={item.color}
                          onValueChange={(value) => updateProductItem(productIndex, itemIndex, 'color', value)}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {products.find(p => p.id === item.productId)?.colors.map((color) => (
                              <SelectItem key={color} value={color}>{color}</SelectItem>
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
                      <TableCell>${item.cost.toFixed(2)}</TableCell>
                      <TableCell>${(item.quantity * item.cost).toFixed(2)}</TableCell>
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
                <span className="font-semibold">Subtotal:</span> ${calculateSubtotal(product.items).toFixed(2)}
              </div>
            </div>
          </CardContent>
        </Card>
      ))}

      <Card className="mt-8">
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
              <TableBody>
                {[
                  { name: 'Leather', needed: 100, available: 150 },
                  { name: 'Rubber Soles', needed: 50, available: 40 },
                  { name: 'Laces', needed: 100, available: 200 },
                  { name: 'Insoles', needed: 50, available: 30 },
                ].map((material) => (
                  <TableRow key={material.name}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.needed}</TableCell>
                    <TableCell>{material.available}</TableCell>
                    <TableCell>
                      {material.available >= material.needed ? (
                        <span className="text-green-600">Surplus: {material.available - material.needed}</span>
                      ) : (
                        <span className="text-red-600">Needed: {material.needed - material.available}</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      <div className="mt-6 flex flex-col md:flex-row justify-between items-start md:items-center sticky bottom-0 bg-background p-4 border-t">
  <div className="w-full md:w-auto order-1 md:order-1 bg-muted p-4 rounded-lg mb-4 md:mb-0">
    <p className="text-lg"><span className="font-semibold">Total Pairs:</span> {calculateTotalPairs()}</p>
    <p className="text-2xl font-bold"><span>Total Amount:</span> ${calculateTotal().toFixed(2)}</p>
  </div>
  <div className="w-full md:w-auto order-2 md:order-2">
    <Button className="w-full md:w-auto">Save Order</Button>
  </div>
</div>
    </div>
  )
}