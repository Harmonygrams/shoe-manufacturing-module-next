import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { baseUrl } from '@/utils/baseUrl'
import { toast } from '@/hooks/use-toast'

type Size = {
  id: number
  name: string
}

interface EditSizeDialogProps {
  size: Size | null
  isOpen: boolean
  onClose: () => void
}

export function EditSizeDialog({ size, isOpen, onClose }: EditSizeDialogProps) {
  const [formData, setFormData] = useState({
    name: ''
  })
  const queryClient = useQueryClient()

  useEffect(() => {
    if (size) {
      setFormData({
        name: size.name
      })
    }
  }, [size])

  const editSizeMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (!size) return
      const response = await fetch(`${baseUrl()}/sizes/${size.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update size')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sizes'])
      toast({
        title: "Success",
        description: "Size updated successfully"
      })
      window.location.href="/sizes"
      onClose()
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to update size",
        variant: "destructive"
      })
    }
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    editSizeMutation.mutate(formData)
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Size</DialogTitle>
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
            disabled={editSizeMutation.isLoading}
          >
            {editSizeMutation.isLoading ? "Updating..." : "Update Size"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  )
}