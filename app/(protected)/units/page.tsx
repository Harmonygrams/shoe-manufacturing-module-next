'use client'

import { useEffect, useState } from 'react'
import { Plus, Search, Pencil, Trash2, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import AddUnitSheet from '@/components/units/add-unit-dialog'
import EditUnitSheet from '@/components/units/edit-unit-dialog'
import { baseUrl } from '@/utils/baseUrl'
import { DeleteConfirmation } from '@/components/delete-confirmation'

// Mock data for units
type Unit = {
  id: number; 
  name: string; 
  symbol: string;
  description: string;
}

export default function UnitsPage() {
  const [units, setUnits] = useState<Unit[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [isEditOpen, setIsEditOpen] = useState(false)
  const [selectedUnit, setSelectedUnit] = useState<Unit | null>(null)
  const [deleteConfirmation, setDeleteConfirmation] = useState<{ isOpen: boolean; unitId: string }>({
    isOpen: false,
    unitId: '',
  })
  const queryClient = useQueryClient()

  const { data, isLoading, isSuccess } = useQuery({
    queryKey: ["units"],
    queryFn: async () => {
      const fetchUnits = await fetch(`${baseUrl()}/units`, { method: 'GET', headers: { 'Content-Type': 'Application/json' } })
      if (fetchUnits.ok) {
        const fetchUnitsJson = await fetchUnits.json();
        return fetchUnitsJson;
      }
    }
  })

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${baseUrl()}/units/${id}`, { method: 'DELETE' })
    },
    onSuccess: () => {
      queryClient.invalidateQueries(["units"])
    }
  })

  const unitsPerPage = 5
  const indexOfLastUnit = currentPage * unitsPerPage
  const indexOfFirstUnit = indexOfLastUnit - unitsPerPage
  const currentUnits = units
    .filter(unit => unit.name.toLowerCase().includes(searchTerm.toLowerCase()) || unit.symbol.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstUnit, indexOfLastUnit)

  const totalPages = Math.ceil(units.length / unitsPerPage)
  useEffect(() => {
    if (isSuccess) {
      setUnits(data)
    }
  }, [isLoading, isSuccess])

  const handleEditClick = (unit: Unit) => {
    setSelectedUnit(unit)
    setIsEditOpen(true)
  }

  const handleDeleteClick = (id: number) => {
    setDeleteConfirmation({ isOpen: true, unitId: id.toString() })
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Units of Measurement</h1>
      
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search units..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AddUnitSheet />
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Unit Name</TableHead>
              <TableHead>Symbol</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentUnits.map((unit) => (
              <TableRow key={unit.id}>
                <TableCell>{unit.name}</TableCell>
                <TableCell>{unit.symbol}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Button variant="ghost" size="icon" aria-label="Edit unit" onClick={() => handleEditClick(unit)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" aria-label="Delete unit" onClick={() => handleDeleteClick(unit.id)}>
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
          Showing {indexOfFirstUnit + 1} to {Math.min(indexOfLastUnit, units.length)} of {units.length} units
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

      {selectedUnit && (
        <EditUnitSheet
          unitData={selectedUnit}
          setIsOpen={setIsEditOpen}
        />
      )}
      <DeleteConfirmation 
        segment='units'
        isOpen={deleteConfirmation.isOpen}
        onClose={() => setDeleteConfirmation({ isOpen: false, unitId: '' })}
        onDeleteSuccess={() => window.location.reload()}
        itemId={deleteConfirmation.unitId}
      />
    </div>
  )
}