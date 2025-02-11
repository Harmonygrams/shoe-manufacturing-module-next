'use client'

import { useEffect, useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { baseUrl } from '@/utils/baseUrl'

type Material = {
  id: number
  name: string
  description: string
  reorderPoint: string
  unitId: number
  unitName: string
  openingStock: string
  costPrice: string
}

type Unit = {
  id: number
  name: string
  symbol: string
}

interface EditMaterialSheetProps {
  materialId: number | undefined
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}

export default function EditMaterialSheet({ materialId, isOpen, onOpenChange, trigger }: EditMaterialSheetProps) {
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [editedMaterial, setEditedMaterial] = useState<Material | null>(null)

  // Fetch units using React Query
  const { data: units } = useQuery<Unit[]>({
    queryKey: ['units'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/units`)
      if (!response.ok) throw new Error('Failed to fetch units')
      return response.json()
    }
  })

  // Fetch material data
  const { data: material } = useQuery<Material>({
    queryKey: ['material', materialId],
    queryFn: async () => {
      if (!materialId) throw new Error('No material ID')
      const response = await fetch(`${baseUrl()}/materials/${materialId}`)
      if (!response.ok) throw new Error('Failed to fetch material')
      return response.json()
    },
    enabled: !!materialId && isOpen
  })

  // Update material mutation
  const updateMaterialMutation = useMutation({
    mutationFn: async (data: Material) => {
      const response = await fetch(`${baseUrl()}/materials/${materialId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update material')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['rawMaterials'])
      toast({ title: "Material updated successfully" })
      onOpenChange(false)
      setLoading(false)
    },
    onError: () => {
      toast({
        title: "Failed to update material",
        variant: "destructive"
      })
      setLoading(false)
    }
  })

  useEffect(() => {
    if (material) {
      setEditedMaterial(material)
    }
  }, [material])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setEditedMaterial(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: value
      }
    })
  }

  const handleSelectChange = (value: string) => {
    setEditedMaterial(prev => {
      if (!prev) return prev
      return { ...prev, unitId: parseInt(value) }
    })
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editedMaterial) {
      setLoading(true)
      updateMaterialMutation.mutate(editedMaterial)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit Material</SheetTitle>
          <SheetDescription>
            Update the material details below. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Material Name</Label>
            <Input
              id="name"
              name="name"
              value={editedMaterial?.name || ''}
              onChange={handleInputChange}
              placeholder="Enter material name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={editedMaterial?.description || ''}
              onChange={handleInputChange}
              placeholder="Enter material description"
              rows={3}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="openingStock">Opening Quantity</Label>
              <Input
                id="openingStock"
                name="openingStock"
                type="number"
                value={editedMaterial?.openingStock || ''}
                onChange={handleInputChange}
                placeholder="Enter opening quantity"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measure</Label>
              <Select value={editedMaterial?.unitId.toString()} onValueChange={handleSelectChange}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units?.map(unit => (
                    <SelectItem value={unit.id.toString()} key={unit.id}>
                      {`${unit.name} (${unit.symbol})`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost price</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              value={editedMaterial?.costPrice || ''}
              onChange={handleInputChange}
              placeholder="Enter cost of raw material"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reorderPoint">Reorder point</Label>
            <Input
              id="reorderPoint"
              name="reorderPoint"
              type="number"
              value={editedMaterial?.reorderPoint || ''}
              onChange={handleInputChange}
              placeholder="Enter reorder point"
            />
          </div>
          <SheetFooter>
            <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
              <Button type="submit" disabled={loading}>
                {loading ? "Updating..." : "Update"}
              </Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}