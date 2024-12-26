import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { baseUrl } from '@/utils/baseUrl'
import { toast } from '@/hooks/use-toast'

type Color = {
  id: number
  name: string
}

interface EditColorDialogProps {
  color: Color | null
  isOpen: boolean
  onClose: () => void
}

export function EditColorDialog({ color, isOpen, onClose }: EditColorDialogProps) {
  const [formData, setFormData] = useState({
    name: ''
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (color) {
      setFormData({
        name: color.name
      })
    }
  }, [color])

  const editColorMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!color) return
      const response = await fetch(`${baseUrl()}/colors/${color.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update color')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['colors'])
      toast({
        title: "Success",
        description: "Color updated successfully"
      })
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update color",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editColorMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Color</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">Name</Label>
            <Input
              id="name"
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
            />
          </div>
          <Button 
            type="submit" 
            className="w-full"
            disabled={editColorMutation.isLoading}
          >
            {editColorMutation.isLoading ? "Updating..." : "Update Color"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}