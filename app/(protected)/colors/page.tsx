'use client'

import { useEffect, useState } from 'react'
import { Search, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery } from '@tanstack/react-query'
import AddColorSheet from '@/components/colors/add-color-dialog'
import { baseUrl } from '@/utils/baseUrl'

// Mock data for Colors
type Color = {
  id : number; 
  name : string; 
}
export default function ColorsPage() {
  const [colors, setColors] = useState<Color[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const { data, isLoading, isSuccess} = useQuery({
    queryKey : ["Colors"],
    queryFn : async () => {
      const fetchColors = await fetch(`${baseUrl()}/colors`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchColors.ok){
        const fetchColorsJson = await fetchColors.json();
        return fetchColorsJson;
      }
    }, 
  })

  const colorsPerPage = 5
  const indexOfLastColor = currentPage * colorsPerPage
  const indexOfFirstColor = indexOfLastColor - colorsPerPage
  const currentColors = colors
    .filter(color => color.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstColor, indexOfLastColor)

  const totalPages = Math.ceil(colors.length / colorsPerPage)
  useEffect(() => {
    if(isSuccess){
      setColors(data)
    }
  }, [isLoading, isSuccess, data])
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Colors</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search colors..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AddColorSheet />
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
            {currentColors.map((color) => (
              <TableRow key={color.id}>
                <TableCell>{color.name}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" aria-label="Edit color">
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete color">
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
          Showing {indexOfFirstColor + 1} to {Math.min(indexOfLastColor, colors.length)} of {colors.length} colors
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