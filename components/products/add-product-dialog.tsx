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
export default function AddProductDialog() {
  const [isOpen, setIsOpen] = useState(false)
  const [ units, setUnits ] = useState<Unit[]>([])
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
  const [product, setProduct] = useState({
    name: '',
    description: '',
    openingStock: 0,
    unitId: '',
    costPrice: 0,
    sellingPrice: 0,
    sku : '',
  })
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setProduct(prev => ({ ...prev, [name]: value }))
  }

  const handleSelectChange = (value: string) => {
    console.log('the value is ', value)
    setProduct(prev => ({ ...prev, unitId : value }))
  }

  async function handleSubmit (e: React.FormEvent) {
    e.preventDefault()
    // Here you would typically send the data to your backend
    const saveProductToDb = await fetch('http://localhost:5001/api/v1/products', { method : 'POST', body : JSON.stringify(product), headers : { 'Content-Type' : 'Application/json'}})
    if(saveProductToDb.ok){
        setIsOpen(false)
        // Reset form after submission
        setProduct({
          name: '',
          description: '',
          openingStock : 0,
          unitId: '',
          costPrice: 0,
          sku : '',
          sellingPrice: 0,
        })
    }
  }
  useEffect(() => {
    if(isSuccess) {
        setUnits(data)
    }
  }, [isSuccess, isLoading])
  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Product
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Product </SheetTitle>
          <SheetDescription>
            Fill in the details of the new Product. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name</Label>
            <Input
              id="name"
              name="name"
              value={product.name}
              onChange={handleInputChange}
              placeholder="Enter product name"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">Sku</Label>
            <Input
              id="sku"
              name="sku"
              value={product.sku}
              onChange={handleInputChange}
              placeholder="Enter product sku"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={product.description}
              onChange={handleInputChange}
              placeholder="Enter product description"
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
                value={product.openingStock}
                onChange={handleInputChange}
                placeholder="Enter opening quantity"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="unit">Unit of Measure</Label>
              <Select value={product.unitId} onValueChange={handleSelectChange}>
                <SelectTrigger id="unit">
                  <SelectValue placeholder="Select unit" />
                </SelectTrigger>
                <SelectContent>
                  {units.map(unit => <SelectItem key={unit.id} value={unit.id}>{`${unit.name} (${unit.symbol})`}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="costPrice">Cost per Unit</Label>
            <Input
              id="costPrice"
              name="costPrice"
              type="number"
              value={product.costPrice}
              onChange={handleInputChange}
              placeholder="Enter cost per unit"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sellingPrice">Selling Price</Label>
            <Input
              id="sellingPrice"
              name="sellingPrice"
              type="number"
              value={product.sellingPrice}
              onChange={handleInputChange}
              placeholder="Enter reorder point"
            />
          </div>
          <SheetFooter>
          <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
            <Button type="submit">Save Product</Button>
          </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
