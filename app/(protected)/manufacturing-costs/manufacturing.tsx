'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { Plus, Pencil, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { toast } from '@/hooks/use-toast'
import { AddManufacturingCostModal } from '@/components/manufacturing-costs/add-manufacturing-cost-modal'
import { EditManufacturingCostModal } from '@/components/manufacturing-costs/edit-manufacturing-cost-modal'
import { formatCurrency } from '@/helpers/currencyFormat'
import { baseUrl } from '@/utils/baseUrl'

type ManufacturingCost = {
  id: number
  name: string
  amount: number
}

export default function ManufacturingCostPage() {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [selectedCost, setSelectedCost] = useState<ManufacturingCost | null>(null)

  const queryClient = useQueryClient()

  const { data: costs = [], isLoading, error } = useQuery<ManufacturingCost[]>({
    queryKey: ['manufacturingCosts'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/manufacturing-costs`)
      if (!response.ok) throw new Error('Failed to fetch manufacturing costs')
      return response.json()
    }
  })

  const deleteCostMutation = useMutation({
    mutationFn: async (costId: number) => {
      const response = await fetch(`${baseUrl()}/manufacturing-costs/${costId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete manufacturing cost')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manufacturingCosts'])
      toast({
        title: "Success",
        description: "Manufacturing cost deleted successfully.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete manufacturing cost. Please try again.",
        variant: "destructive"
      })
    }
  })

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch manufacturing costs. Please try again.",
      variant: "destructive"
    })
  }

  const handleAddCost = () => {
    setIsAddModalOpen(true)
  }

  const handleEditCost = (cost: ManufacturingCost) => {
    setSelectedCost(cost)
    setIsEditModalOpen(true)
  }

  const handleDeleteCost = (costId: number) => {
    if (window.confirm('Are you sure you want to delete this manufacturing cost?')) {
      deleteCostMutation.mutate(costId)
    }
  }

  return (
    <>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Manufacturing Costs</h1>
        <Button onClick={handleAddCost}>
          <Plus className="mr-2 h-4 w-4" /> Add New Cost
        </Button>
      </div>

      {isLoading ? (
        <div className="text-center">Loading...</div>
      ) : costs.length === 0 ? (
        <div className="text-center">No manufacturing costs found.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 p-4">
          {costs.map((cost) => (
            <Card key={cost.id} className="hover:shadow-lg transition-shadow duration-300">
              <CardContent className="p-4">
                <h2 className="text-xl font-semibold mb-2">{cost.name}</h2>
                <p className="text-2xl font-bold mb-4">{formatCurrency(cost.amount)}</p>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" size="sm" onClick={() => handleEditCost(cost)}>
                    <Pencil className="h-4 w-4 mr-1" /> Edit
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => handleDeleteCost(cost.id)}>
                    <Trash2 className="h-4 w-4 mr-1" /> Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <AddManufacturingCostModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
      />
      <EditManufacturingCostModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        cost={selectedCost}
      />
    </>
  )
}

