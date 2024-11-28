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
type Unit = {
  id : string;
  name : string; 
  symbol : string;
}
export default function AddMaterialSheet() {
  const [isOpen, setIsOpen] = useState(false)
  const [ units, setUnits ] = useState<Unit[]>([])
  const [material, setMaterial] = useState({
    name: '',
    description: '',
    openingStock: 0,
    unitId: 1,
    costPrice: 0,
    reorderPoint: 0,
  })
  const { data, isSuccess, isLoading, error } = useQuery({
    queryKey : ['UNITS'],
    queryFn : async () => {
      const fetchUnits = await fetch('http://localhost:5001/api/v1/units', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchUnits.ok){
        const fetchUnitsJson = await fetchUnits.json()
        return fetchUnitsJson
      }
    }, 
  })
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setMaterial(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    setMaterial(prev => ({ ...prev, unitId: 2 }))
  }

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    // Here you would typically send the data to your backend
    const saveMaterialToDb = await fetch('http://localhost:5001/api/v1/materials', { method : 'POST', body : JSON.stringify(material), headers : { 'Content-Type' : 'Application/json'}})
    if(saveMaterialToDb.ok){
        setIsOpen(false)
        // Reset form after submission
        setMaterial({
          name: '',
          description: '',
          openingStock : 0,
          unitId: 0,
          costPrice: 0,
          reorderPoint: 0,
        })
    }
  }
  useEffect(() => {
    if(isSuccess){
      setUnits(data)
    }
  },[isLoading])
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
              <Label htmlFor="quantity">Opening Quantity</Label>
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
              <Select value={(material.unitId).toString()} onValueChange={handleSelectChange}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => <SelectItem value="kg" key={unit.id}>{`${unit.name} (${unit.symbol})`} </SelectItem>)}
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
              type=""
              value={material.reorderPoint}
              onChange={handleInputChange}
              placeholder="Enter reorder point"
            />
          </div>
          <SheetFooter>
          <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
            <Button type="submit">Save Material</Button>
          </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
