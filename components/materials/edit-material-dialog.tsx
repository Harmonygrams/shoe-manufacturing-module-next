'use client'

import { useEffect, useState } from 'react'
import { Pencil } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Alert, AlertTitle } from "@/components/ui/alert"

type Unit = {
  id: number;
  name: string;
  symbol: string;
}

type Material = {
  id: number;
  name: string;
  description: string;
  openingStock: number;
  unitId: string | number;
  costPrice: number;
  reorderPoint: number;
}

type EditMaterialSheetProps = {
  materialId: number;
  onUpdate: () => void;
}

export default function EditMaterialSheet({ materialId, onUpdate }: EditMaterialSheetProps) {
  const [loading, setLoading] = useState(false)
  const [fetchingMaterial, setFetchingMaterial] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [isOpen, setIsOpen] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [editedMaterial, setEditedMaterial] = useState<Material | null>(null)

  useEffect(() => {
    async function fetchData() {
      setFetchingMaterial(true)
      setError(null)
      
      try {
        const [materialResponse, unitsResponse] = await Promise.all([
          fetch(`/api/materials/${materialId}`),
          fetch('/api/units')
        ])

        if (!materialResponse.ok) throw new Error('Failed to fetch material')
        if (!unitsResponse.ok) throw new Error('Failed to fetch units')

        const [materialData, unitsData] = await Promise.all([
          materialResponse.json(),
          unitsResponse.json()
        ])

        setEditedMaterial(materialData)
        setUnits(unitsData)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data')
      } finally {
        setFetchingMaterial(false)
      }
    }

    if (isOpen) {
      fetchData()
    }
  }, [isOpen, materialId])

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (!editedMaterial) return
    
    const { name, value } = e.target
    setEditedMaterial(prev => {
      if (!prev) return prev
      return {
        ...prev,
        [name]: name === 'openingStock' || name === 'costPrice' || name === 'reorderPoint' 
          ? parseFloat(value) || 0 
          : value
      }
    })
  }

  const handleSelectChange = (value: string) => {
    if (!editedMaterial) return
    
    setEditedMaterial(prev => {
      if (!prev) return prev
      return { ...prev, unitId: parseInt(value) }
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!editedMaterial) return
    
    setLoading(true)
    setError(null)
    setSuccess(null)
    
    try {
      const response = await fetch(`/api/materials/${materialId}`, {
        method: 'PUT',
        body: JSON.stringify(editedMaterial),
        headers: { 'Content-Type': 'application/json' },
      })

      if (response.ok) {
        setSuccess('Material updated successfully')
        onUpdate()
        setTimeout(() => {
          setIsOpen(false)
          setSuccess(null)
        }, 1500)
      } else {
        const data = await response.json()
        throw new Error(data.message || 'Failed to update material')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update material')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon">
          <Pencil className="h-4 w-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Edit Material</SheetTitle>
          <SheetDescription>
            Modify the material details and save your changes.
          </SheetDescription>
        </SheetHeader>
        {error && (
          <Alert variant="destructive" className="mt-4">
            <AlertTitle>{error}</AlertTitle>
          </Alert>
        )}
        {success && (
          <Alert className="mt-4">
            <AlertTitle>{success}</AlertTitle>
          </Alert>
        )}
        {fetchingMaterial ? (
          <div className="flex items-center justify-center h-[400px]">
            Loading material data...
          </div>
        ) : editedMaterial ? (
          <form onSubmit={handleSubmit} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Material Name</Label>
              <Input
                id="name"
                name="name"
                value={editedMaterial.name}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={editedMaterial.description}
                onChange={handleInputChange}
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
                  value={editedMaterial.openingStock}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="unit">Unit of Measure</Label>
                <Select 
                  value={editedMaterial.unitId.toString()} 
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="unit">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {units.map(unit => (
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
                value={editedMaterial.costPrice}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reorderPoint">Reorder point</Label>
              <Input
                id="reorderPoint"
                name="reorderPoint"
                type="number"
                value={editedMaterial.reorderPoint}
                onChange={handleInputChange}
              />
            </div>
            <SheetFooter>
              <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
                <Button type="submit" disabled={loading}>
                  {loading ? 'Saving...' : 'Save Changes'}
                </Button>
              </div>
            </SheetFooter>
          </form>
        ) : null}
      </SheetContent>
    </Sheet>
  )
}