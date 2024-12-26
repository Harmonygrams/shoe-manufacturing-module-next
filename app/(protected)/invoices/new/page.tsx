'use client'

import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Search, Plus, Minus, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/helpers/currencyFormat'
import { baseUrl } from '@/utils/baseUrl'

type Size = {
  sizeId: number
  sizeName: string
  colorId: number
  color: string
  quantity: number
  cost: number
}

type Product = {
  name: string
  id: number
  sellingPrice: number
  sizes: Size[]
}

type Customer = {
  id: string
  customerName: string
}

type InvoiceItem = {
  productId: number
  productName: string
  sizeId: number
  sizeName: string
  colorId: number
  color: string
  quantity: number
  availableQuantity: number
  sellingPrice: number
}

type Invoice = {
  customerId: string
  date: Date
  items: InvoiceItem[]
  paymentMethod: string
}

const paymentMethods = ['Cash', 'Card', 'Bank Transfer']

export default function InvoiceGenerator() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [selectedCustomer, setSelectedCustomer] = useState<string>('')
  const [invoiceDate, setInvoiceDate] = useState<Date>(new Date())
  const [productSearch, setProductSearch] = useState<string>('')
  const [selectedProducts, setSelectedProducts] = useState<InvoiceItem[]>([])
  const [paymentMethod, setPaymentMethod] = useState<string>('')

  // Fetch customers
  useEffect(() => {
    const fetchCustomers = async () => {
      try {
        const response = await fetch(`${baseUrl()}/customers`)
        if (!response.ok) throw new Error('Failed to fetch customers')
        const data = await response.json()
        setCustomers(data)
      } catch (error) {
        console.error('Error fetching customers:', error)
        toast({
          title: "Error",
          description: "Failed to fetch customers. Please try again.",
          variant: "destructive"
        })
      }
    }
    fetchCustomers()
  }, [])

  // Fetch products
  const { data: products = [], isLoading, error } = useQuery<Product[]>({
    queryKey: ['products'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/products/invoicing`)
      if (!response.ok) throw new Error('Failed to fetch products')
      return response.json()
    }
  })

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch products. Please try again.",
      variant: "destructive"
    })
  }

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(productSearch.toLowerCase())
  )

  const addProduct = (product: Product, size: Size) => {
    const existingItemIndex = selectedProducts.findIndex(
      item => item.productId === product.id && item.sizeId === size.sizeId && item.colorId === size.colorId
    )

    if (existingItemIndex > -1) {
      const updatedProducts = [...selectedProducts]
      const currentItem = updatedProducts[existingItemIndex]
      if (currentItem.quantity < currentItem.availableQuantity) {
        currentItem.quantity += 1
        setSelectedProducts(updatedProducts)
      }
    } else {
      setSelectedProducts([...selectedProducts, {
        productId: product.id,
        productName: product.name,
        sizeId: size.sizeId,
        sizeName: size.sizeName,
        colorId: size.colorId,
        color: size.color,
        quantity: 1,
        availableQuantity: size.quantity,
        sellingPrice: product.sellingPrice || size.cost // Use sellingPrice if available, otherwise use cost
      }])
    }
    setProductSearch('')
  }

  const updateProductQuantity = (index: number, newQuantity: number) => {
    const updatedProducts = [...selectedProducts]
    const item = updatedProducts[index]
    item.quantity = Math.max(0, Math.min(newQuantity, item.availableQuantity))
    setSelectedProducts(updatedProducts)
  }

  const updateSellingPrice = (index: number, newPrice: number) => {
    const updatedProducts = [...selectedProducts]
    updatedProducts[index].sellingPrice = Math.max(0, newPrice)
    setSelectedProducts(updatedProducts)
  }

  const removeProduct = (index: number) => {
    const updatedProducts = [...selectedProducts]
    updatedProducts.splice(index, 1)
    setSelectedProducts(updatedProducts)
  }

  const calculateTotal = () => {
    return selectedProducts.reduce((sum, item) => sum + item.quantity * item.sellingPrice, 0)
  }

  const handleSaveInvoice = async () => {
    if (!selectedCustomer || selectedProducts.length === 0 || !paymentMethod) {
      toast({
        title: "Error",
        description: "Please fill in all required fields and add at least one product.",
        variant: "destructive"
      })
      return
    }

    const invoice: Invoice = {
      customerId: selectedCustomer,
      date: invoiceDate,
      items: selectedProducts.map(item => ({
        ...item,
        colorId: item.colorId // Ensure colorId is included
      })),
      paymentMethod: paymentMethod
    }

    try {
      const response = await fetch(`${baseUrl()}/invoices`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(invoice),
      })

      if (!response.ok) throw new Error('Failed to save invoice')

      toast({
        title: "Success",
        description: "Invoice saved successfully!",
      })

      // Reset form
      setSelectedCustomer('')
      setInvoiceDate(new Date())
      setSelectedProducts([])
      setPaymentMethod('')
    } catch (error) {
      console.error('Error saving invoice:', error)
      toast({
        title: "Error",
        description: "Failed to save invoice. Please try again.",
        variant: "destructive"
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Generate Invoice</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <Label htmlFor="customer">Customer</Label>
          <Select value={selectedCustomer} onValueChange={setSelectedCustomer}>
            <SelectTrigger id="customer">
              <SelectValue placeholder="Select customer" />
            </SelectTrigger>
            <SelectContent>
              {customers.map((c) => (
                <SelectItem key={c.id} value={c.id}>{c.customerName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Invoice Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!invoiceDate && "text-muted-foreground"}`}
              >
                {invoiceDate ? format(invoiceDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={invoiceDate}
                onSelect={(date) => date && setInvoiceDate(date)}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="paymentMethod">Payment Method</Label>
          <Select value={paymentMethod} onValueChange={setPaymentMethod}>
            <SelectTrigger id="paymentMethod">
              <SelectValue placeholder="Select payment method" />
            </SelectTrigger>
            <SelectContent>
              {paymentMethods.map((method) => (
                <SelectItem key={method} value={method}>{method}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 relative">
        <Label htmlFor="productSearch" className="text-lg font-semibold mb-2 block">Search for product</Label>
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
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredProducts.map(product => (
              <div key={product.id} className="p-2 hover:bg-gray-100">
                <h3 className="font-semibold">{product.name}</h3>
                <div className="grid grid-cols-3 gap-2 mt-1">
                  {product.sizes.map(size => (
                    <button
                      key={`${size.sizeId}-${size.colorId}`}
                      className="text-sm bg-blue-100 hover:bg-blue-200 rounded p-1"
                      onClick={() => addProduct(product, size)}
                    >
                      {size.sizeName} - {size.color} ({size.quantity})
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {selectedProducts.map((item, index) => (
        <Card key={`${item.productId}-${item.sizeId}-${item.colorId}`} className="mb-4">
          <CardHeader>
            <CardTitle>{item.productName}</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Color</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Selling Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{item.sizeName}</TableCell>
                  <TableCell>{item.color}</TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateProductQuantity(index, item.quantity - 1)}
                        disabled={item.quantity <= 0}
                      >
                        <Minus className="h-4 w-4" />
                      </Button>
                      <span>{item.quantity}</span>
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={() => updateProductQuantity(index, item.quantity + 1)}
                        disabled={item.quantity >= item.availableQuantity}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Input
                      type="number"
                      value={item.sellingPrice}
                      onChange={(e) => updateSellingPrice(index, parseFloat(e.target.value))}
                      className="w-24"
                    />
                  </TableCell>
                  <TableCell>{formatCurrency(item.quantity * item.sellingPrice)}</TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" onClick={() => removeProduct(index)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      ))}

      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full md:w-auto order-2 md:order-1">
            <p className="text-2xl font-bold"><span>Total Amount:</span> {formatCurrency(calculateTotal())}</p>
          </div>
          <div className="w-full md:w-auto order-1 md:order-2 mb-4 md:mb-0">
            <Button className="w-full md:w-auto" onClick={handleSaveInvoice}>
              Save Invoice
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

