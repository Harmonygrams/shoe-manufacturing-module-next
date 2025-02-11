import { useState } from 'react'
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

type AddManufacturingCostModalProps = {
  isOpen: boolean
  onClose: () => void
}

export function AddManufacturingCostModal({ isOpen, onClose }: AddManufacturingCostModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    amount: '',
  })

  const queryClient = useQueryClient()

  const addCostMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      const response = await fetch(`${baseUrl()}/manufacturing-costs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          amount: parseFloat(data.amount) || 0
        }),
      })
      if (!response.ok) throw new Error('Failed to add manufacturing cost')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manufacturingCosts'])
      toast({
        title: "Success",
        description: "Manufacturing cost added successfully.",
      })
      onClose()
      window.location.reload()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to add manufacturing cost. Please try again.",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    addCostMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add Manufacturing Cost</DialogTitle>
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
          <Button type="submit" className="w-full">
            Add Manufacturing Cost
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}