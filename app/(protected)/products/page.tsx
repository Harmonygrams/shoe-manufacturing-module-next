'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query'
import { baseUrl } from '@/utils/baseUrl'
type Product = { 
  id : number;
  name : string; 
  quantity : string | number;
  unit : string; 
  cost : number;
}
export default function ProductsPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { data : products = [] } = useQuery<Product[]>({
    queryKey : ['PRODUCTS'],
    queryFn : async () => {
      const fetchMaterials = await fetch(`${baseUrl()}/products`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchMaterials.ok){
        const fetchMaterialsJson = await fetchMaterials.json()
        return fetchMaterialsJson
      }
    }
  })
  const materialsPerPage = 5
  const indexOfLastMaterial = currentPage * materialsPerPage
  const indexOfFirstMaterial = indexOfLastMaterial - materialsPerPage
  const currentProducts = products
    .filter(products => products.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstMaterial, indexOfLastMaterial)

  const totalPages = Math.ceil(products.length / materialsPerPage)
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Products</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search products..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Button className="w-full md:w-auto" asChild>
          <Link href="/products/new">
            <Plus className="mr-2 h-4 w-4" /> Add New Product
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Quantity</TableHead>
              <TableHead>Unit of Measure</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentProducts.map((product) => (
              <TableRow key={product.id}>
                <TableCell>{product.name}</TableCell>
                <TableCell>{product.quantity}</TableCell>
                <TableCell>{product.unit}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" aria-label="View material details">
                      <Eye className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Edit material">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete material">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {indexOfFirstMaterial + 1} to {Math.min(indexOfLastMaterial, products.length)} of {products.length} materials
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  )
}