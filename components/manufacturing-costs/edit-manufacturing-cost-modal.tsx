import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from '@/hooks/use-toast'
import { baseUrl } from '@/utils/baseUrl'

type ManufacturingCost = {
  id: number
  name: string
  amount: number
}

type EditManufacturingCostModalProps = {
  isOpen: boolean
  onClose: () => void
  cost: ManufacturingCost | null
}

export function EditManufacturingCostModal({ isOpen, onClose, cost }: EditManufacturingCostModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
  })

  const queryClient = useQueryClient()

  useEffect(() => {
    if (cost) {
      setFormData({
        name: cost.name,
        amount: cost.amount.toString(),
      })
    } else {
      // Reset form when modal is closed
      setFormData({
        name: '',
        amount: '',
      })
    }
  }, [cost])

  const editCostMutation = useMutation({
    mutationFn: async (data: { name: string, amount: number }) => {
      if (!cost) throw new Error('No cost selected for editing')
      const response = await fetch(`${baseUrl()}/manufacturing-costs/${cost.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })
      if (!response.ok) throw new Error('Failed to update manufacturing cost')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manufacturingCosts'])
      toast({
        title: "Success",
        description: "Manufacturing cost updated successfully.",
      })
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update manufacturing cost. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const parsedAmount = parseFloat(formData.amount)
    
    if (isNaN(parsedAmount)) {
      toast({
        title: "Error",
        description: "Please enter a valid number for amount.",
        variant: "destructive"
      })
      return
    }

    editCostMutation.mutate({
      name: formData.name,
      amount: parsedAmount,
    })
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    
    if (name === 'amount') {
      // Allow empty string or valid number input
      if (value === '' || !isNaN(parseFloat(value))) {
        setFormData(prev => ({
          ...prev,
          [name]: value
        }))
      }
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }))
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Manufacturing Cost</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Cost Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              name="amount"
              type="number"
              min="0"
              step="0.01"
              value={formData.amount}
              onChange={handleChange}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={!formData.name || formData.amount === '' || isNaN(parseFloat(formData.amount))}
          >
            Update Manufacturing Cost
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}