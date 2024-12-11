'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation } from '@tanstack/react-query'
import { formatCurrency } from '@/helpers/currencyFormat'
// import { useToast } from "@/components/ui/use-toast"
import { useRouter } from 'next/navigation'
import { SelectGroup, SelectLabel } from '@radix-ui/react-select'

type ProductSize = {
  sizeId: number | string;
  quantity: number;
  cost: number;
}

type Product = {
  name: string;
  sku: string;
  unitId: number | string;
  description: string;
  sizes: ProductSize[];
}

type Unit = {
  id: number;
  name: string;
}

type Size = {
  id: number;
  name: string;
}

export default function ProductsPage() {
  const [newProduct, setNewProduct] = useState<Product>({
    name: '',
    sku: '',
    unitId: '',
    description: '',
    sizes: []
  })
  const [newSize, setNewSize] = useState<ProductSize>({
    sizeId: '',
    quantity: 0,
    cost: 0
  })

  // const { toast } = useToast()
  const router = useRouter()

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['UNITS'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/v1/units')
      if (!response.ok) throw new Error('Failed to fetch units')
      return response.json()
    }
  })

  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ['SIZES'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/v1/sizes')
      if (!response.ok) throw new Error('Failed to fetch sizes')
      return response.json()
    }
  })

  const saveProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const response = await fetch('http://localhost:5001/api/v1/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      })
      if (!response.ok) throw new Error('Failed to save product')
      return response.json()
    },
    onSuccess: () => {
      // toast({
      //   title: "Product saved successfully",
      //   description: "You will be redirected to the products page.",
      // })
      setTimeout(() => router.push('/products'), 2000)
    },
    onError: (error) => {
      console.log(error);
      // toast({
      //   title: "Failed to save product",
      //   description: error.message,
      //   variant: "destructive"
      // })
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleUnitChange = (value: string) => {
    setNewProduct(prev => ({ ...prev, unitId: parseInt(value) }))
  }

  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSize(prev => ({ ...prev, [name]: name === 'sizeId' ? parseInt(value) : parseFloat(value) }))
  }

  const addSize = () => {
    if (newSize.sizeId && newSize.quantity > 0 && newSize.cost > 0) {
      setNewProduct(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize]
      }))
      setNewSize({ sizeId: 0, quantity: 0, cost: 0 })
    }
  }

  const saveProduct = () => {
    saveProductMutation.mutate(newProduct)
  }

  return (
    <div className="container mx-auto px-4 py-8 mb-20">
      <h1 className="text-3xl font-bold mb-6">Add New Product</h1>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input id="name" name="name" value={newProduct.name} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={newProduct.sku} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="unit">Unit</Label>
              <Select value={newProduct.unitId.toString()} onValueChange={handleUnitChange}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit"/>
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    {units.map(unit => (
                      <SelectItem key={unit.id} value={unit.id.toString()}>{unit.name}</SelectItem>
                    ))}
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="mb-4">
            <Label htmlFor="description">Product Description</Label>
            <Textarea id="description" name="description" value={newProduct.description} onChange={handleInputChange} rows={3} />
          </div>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Sizes</h3>
            {newProduct.sizes.length > 0 && (
              <Table className="mb-4">
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newProduct.sizes.map((size, index) => (
                    <TableRow key={index}>
                      <TableCell>{sizes.find(s => s.id === size.sizeId)?.name}</TableCell>
                      <TableCell>{size.quantity}</TableCell>
                      <TableCell>{formatCurrency(size.cost)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <Select value={newSize.sizeId.toString()} onValueChange={(value) => handleSizeInputChange({ target: { name: 'sizeId', value } } as React.ChangeEvent<HTMLInputElement>)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select size" />
                </SelectTrigger>
                <SelectContent>
                  {sizes.map(size => (
                    <SelectItem key={size.id} value={size.id.toString()}>{size.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Quantity" name="quantity" value={newSize.quantity || ''} onChange={handleSizeInputChange} />
              <Input type="number" placeholder="Cost" name="cost" value={newSize.cost || ''} onChange={handleSizeInputChange} />
            </div>
            <Button onClick={addSize} className="mb-4 rounded-full w-8 h-8 p-0" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className='flex justify-end mt-10'>
            <Button onClick={saveProduct} className="" disabled={saveProductMutation.isLoading}>
              {saveProductMutation.isLoading ? "Saving..." : "Save Product"}
            </Button>
          </div>
    </div>
  )
}