'use client'

import { useEffect, useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { useQuery } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'
import { baseUrl } from '@/utils/baseUrl'

type Unit = {
  id: string
  name: string
  symbol: string
}

export default function AddMaterialSheet() {
  const [loading, setLoading] = useState<boolean>(false); 
  const { toast } = useToast()
  const [isOpen, setIsOpen] = useState(false)
  const [units, setUnits] = useState<Unit[]>([])
  const [material, setMaterial] = useState({
    name: '',
    description: '',
    openingStock: 0,
    unitId: '',
    costPrice: 0,
    reorderPoint: 0,
  })

  // Fetch units using React Query
  const { data, isSuccess, isLoading, error } = useQuery({
    queryKey: ['UNITS'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/units`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      })
      if (!response.ok) {
        throw new Error('Failed to fetch units')
      }
      return response.json()
    },
  })

  // Update the units state on successful fetch
  useEffect(() => {
    if (isSuccess && data) {
      setUnits(data)
    }
  }, [isSuccess, data])

  // Handle input changes for text and number fields
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setMaterial(prev => ({ ...prev, [name]: name === 'openingStock' || name === 'costPrice' || name === 'reorderPoint' ? parseFloat(value) : value }))
  }

  // Handle changes for the unit selector
  const handleSelectChange = (value: string) => {
    setMaterial(prev => ({ ...prev, unitId: value }))
  }

  // Submit the material to the API
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); 
    const response = await fetch(`${baseUrl()}/materials`, {
      method: 'POST',
      body: JSON.stringify(material),
      headers: { 'Content-Type': 'application/json' },
    })
    if (response.ok) {
      setIsOpen(false)
      setMaterial({
        name: '',
        description: '',
        openingStock: 0,
        unitId: '',
        costPrice: 0,
        reorderPoint: 0,
      })
      setLoading(false)
      toast({
        title : 'Raw material added successfully', 
      })
    } else {
      toast({
        title : 'An error occurred', 
        variant : 'destructive'
      })
      setLoading(false)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Material
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Material</SheetTitle>
          <SheetDescription>
            Fill in the details of the new material. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Material Name</Label>
            <Input
              id="name"
              name="name"
              value={material.name}
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
              value={material.description}
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
                value={material.openingStock}
                onChange={handleInputChange}
                placeholder="Enter opening quantity"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measure</Label>
              <Select value={material.unitId} onValueChange={handleSelectChange}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => (
                    <SelectItem value={unit.id} key={unit.id}>
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
              value={material.costPrice}
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
              value={material.reorderPoint}
              onChange={handleInputChange}
              placeholder="Enter reorder point"
            />
          </div>
          <SheetFooter>
            <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
              <Button type="submit" disabled={loading}>Save Material</Button>
            </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
