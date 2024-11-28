'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useQuery } from '@tanstack/react-query'

type ProductSize = {
  name: string;
  cost: number;
  sellingPrice: number;
}

type Product = {
  id: number;
  name: string;
  sku: string;
  unit: string;
  description: string;
  sizes: ProductSize[];
}

const units = ['pcs', 'kg', 'g', 'l', 'ml', 'm', 'cm']

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [newProduct, setNewProduct] = useState<Product>({
    id: 0,
    name: '',
    sku: '',
    unit: 'pcs',
    description: '',
    sizes: []
  })
  const [newSize, setNewSize] = useState<ProductSize>({
    name: '',
    cost: 0,
    sellingPrice: 0
  })

  const { data, isSuccess, isLoading, error } = useQuery({
    queryKey: ['PRODUCTS'],
    queryFn: async () => {
      const fetchProducts = await fetch('http://localhost:5001/api/v1/products', { method: 'GET', headers: { 'Content-Type': 'Application/json' } })
      if (fetchProducts.ok) {
        const fetchProductsJson = await fetchProducts.json()
        return fetchProductsJson
      }
    }
  })

  const productsPerPage = 5
  const indexOfLastProduct = currentPage * productsPerPage
  const indexOfFirstProduct = indexOfLastProduct - productsPerPage
  const currentProducts = products
    .filter(product => product.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstProduct, indexOfLastProduct)

  const totalPages = Math.ceil(products.length / productsPerPage)

  useEffect(() => {
    if (isSuccess) {
      setProducts(data)
    }
  }, [isLoading, isSuccess, data])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setNewProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleUnitChange = (value: string) => {
    setNewProduct(prev => ({ ...prev, unit: value }))
  }

  const handleSizeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setNewSize(prev => ({ ...prev, [name]: name === 'name' ? value : parseFloat(value) }))
  }

  const addSize = () => {
    if (newSize.name && newSize.cost > 0 && newSize.sellingPrice > 0) {
      setNewProduct(prev => ({
        ...prev,
        sizes: [...prev.sizes, newSize]
      }))
      setNewSize({ name: '', cost: 0, sellingPrice: 0 })
    }
  }

  const saveProduct = () => {
    if (newProduct.name && newProduct.sku && newProduct.unit) {
      setProducts(prev => [...prev, { ...newProduct, id: prev.length + 1 }])
      setNewProduct({
        id: 0,
        name: '',
        sku: '',
        unit: 'pcs',
        description: '',
        sizes: []
      })
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Add New Product</CardTitle>
        </CardHeader>
        <CardContent>
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
              <Select value={newProduct.unit} onValueChange={handleUnitChange}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem key={unit} value={unit}>{unit}</SelectItem>
                  ))}
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
                    <TableHead>Cost</TableHead>
                    <TableHead>Selling Price</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {newProduct.sizes.map((size, index) => (
                    <TableRow key={index}>
                      <TableCell>{size.name}</TableCell>
                      <TableCell>${size.cost.toFixed(2)}</TableCell>
                      <TableCell>${size.sellingPrice.toFixed(2)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-2">
              <Input placeholder="Size Name" name="name" value={newSize.name} onChange={handleSizeInputChange} />
              <Input type="number" placeholder="Cost" name="cost" value={newSize.cost || ''} onChange={handleSizeInputChange} />
              <Input type="number" placeholder="Selling Price" name="sellingPrice" value={newSize.sellingPrice || ''} onChange={handleSizeInputChange} />
            </div>
            <Button onClick={addSize} className="mb-4 rounded-full w-8 h-8 p-0" variant="outline">
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <Button onClick={saveProduct}>Save Product</Button>
        </CardContent>
      </Card>
    </div>
  )
}