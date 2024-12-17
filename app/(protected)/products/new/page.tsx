'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation } from '@tanstack/react-query'
import { formatCurrency } from '@/helpers/currencyFormat'
import { useRouter } from 'next/navigation'
import { SelectGroup } from '@radix-ui/react-select'
import { baseUrl } from '@/utils/baseUrl'
import { useToast } from '@/hooks/use-toast'

type ProductSize = {
  sizeId: number;
  quantity: number;
  cost: number;
}
type ErrorMessage = {
  message : string;
}
type Product = {
  name: string;
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
    unitId: '',
    description: '',
    sizes: []
  })

  const { toast } = useToast()
  const router = useRouter()

  const { data: units = [] } = useQuery<Unit[]>({
    queryKey: ['UNITS'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/units`)
      if (!response.ok) throw new Error('Failed to fetch units')
      return response.json()
    }
  })

  const { data: sizes = [] } = useQuery<Size[]>({
    queryKey: ['SIZES'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/sizes`)
      if (!response.ok) throw new Error('Failed to fetch sizes')
      return response.json()
    }
  })

  useEffect(() => {
    if (sizes.length > 0) {
      const initialSizes = sizes.map(size => ({
        sizeId: size.id,
        quantity: 0,
        cost: 0
      }));
      setNewProduct(prev => ({ ...prev, sizes: initialSizes }));
    }
  }, [sizes]);

  const saveProductMutation = useMutation({
    mutationFn: async (product: Product) => {
      const response = await fetch(`${baseUrl()}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(product)
      })
      if (!response.ok) {
        const errorMessage = await response.json();
        throw new Error(errorMessage.message)
      }else{
        return response.json()
      }
    },
    onSuccess: () => {
      setTimeout(() => router.push('/products'), 500)
      toast({
        title: "Product saved successfully",
      })
    },
    onError: (error : ErrorMessage) => {
      
      toast({
        title: error.message,
        variant: 'destructive'
      })
    }
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleUnitChange = (value: string) => {
    setNewProduct(prev => ({ ...prev, unitId: parseInt(value) }))
  }

  const handleSizeChange = (sizeId: number, field: 'quantity' | 'cost', value: number) => {
    setNewProduct(prev => ({
      ...prev,
      sizes: prev.sizes.map(size => 
        size.sizeId === sizeId ? { ...size, [field]: value } : size
      )
    }));
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
            {/* <div>
              <Label htmlFor="sku">SKU</Label>
              <Input id="sku" name="sku" value={newProduct.sku} onChange={handleInputChange} />
            </div> */}
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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Size</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newProduct.sizes.map((size) => (
                  <TableRow key={size.sizeId}>
                    <TableCell>{sizes.find(s => s.id === size.sizeId)?.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={size.quantity}
                        onChange={(e) => handleSizeChange(size.sizeId, 'quantity', parseInt(e.target.value))}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={size.cost}
                        onChange={(e) => handleSizeChange(size.sizeId, 'cost', parseFloat(e.target.value))}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className='flex justify-end mt-10'>
            <Button onClick={saveProduct} className="" disabled={saveProductMutation.isLoading}>
              {saveProductMutation.isLoading ? "Saving..." : "Save Product"}
            </Button>
          </div>
    </div>
  )
}

