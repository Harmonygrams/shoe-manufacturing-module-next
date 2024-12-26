'use client'

import { useEffect, useState } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import {AddSizeSheet} from '@/components/size/add-size-dialog'
import { EditSizeDialog } from "@/components/size/edit-size-dialog"
import { baseUrl } from '@/utils/baseUrl'
import { toast } from "@/hooks/use-toast"

// Mock data for sizes
type Size = {
  id : number; 
  name : string; 
}
type Unit = {
  id: number
  name: string
  description: string
  symbol: string
}

export default function SizesPage() {
  const [sizes, setSizes] = useState<Size[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedSize, setSelectedSize] = useState<Size | null>(null)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const queryClient = useQueryClient()

  const { data, isLoading, isSuccess} = useQuery({
    queryKey : ["sizes" ],
    queryFn : async () => {
      const fetchSizes = await fetch(`${baseUrl()}/sizes`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchSizes.ok){
        const fetchSizesJson = await fetchSizes.json();
        return fetchSizesJson;
      }
    }, 
  })

  const deleteSizeMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`${baseUrl()}/sizes/${id}`, {
        method: 'DELETE'
      })
      if (!response.ok) throw new Error('Failed to delete size')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sizes'])
      toast({ title: "Success", description: "Size deleted successfully" })
      window.location.href = '/sizes'
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete size",
        variant: "destructive"
      })
    }
  })

  const handleDelete = (size: Size) => {
    deleteSizeMutation.mutate(size.id)
  }

  const handleEdit = (size: Size) => {
    setSelectedSize(size)
    setIsEditDialogOpen(true)
  }

  const sizesPerPage = 5
  const indexOfLastSize = currentPage * sizesPerPage
  const indexOfFirstSize = indexOfLastSize - sizesPerPage
  const currentSizes = sizes
    .filter(size => size.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstSize, indexOfLastSize)

  const totalPages = Math.ceil(sizes.length / sizesPerPage)
  useEffect(() => {
    if(isSuccess){
      setSizes(data)
    }
  }, [isLoading, isSuccess])
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Size</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search sizes..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AddSizeSheet />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSizes.map((size) => (
              <TableRow key={size.id}>
                <TableCell>{size.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" aria-label="Edit size" onClick={() => handleEdit(size)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete size" onClick={() => handleDelete(size)}>
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
          Showing {indexOfFirstSize + 1} to {Math.min(indexOfLastSize, sizes.length)} of {sizes.length} Sizes
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
      <EditSizeDialog 
        isOpen={isEditDialogOpen}
        onClose={() => setIsEditDialogOpen(false)}
        size={selectedSize}
      />
    </div>
  )
}