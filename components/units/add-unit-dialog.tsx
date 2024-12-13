'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { baseUrl } from '@/utils/baseUrl'
import { useToast } from '@/hooks/use-toast'
import { ErrorNotification } from '../error-message-badge'

export default function AddUnitSheet() {
  const [error, setError] = useState<string | null>(null); 
  const [loading, setLoading] = useState(false); 
  const { toast } = useToast(); 
  const [isOpen, setIsOpen] = useState(false)
  const [unit, setUnit] = useState({
    name: '',
    description: '',
    symbol : ''
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setUnit(prev => ({ ...prev, [name]: value }))
  }


  async function handleSubmit (e: React.FormEvent) {
    setLoading(true); 
    e.preventDefault()
    // Here you would typically send the data to your backend
    const saveMaterialToDb = await fetch(`${baseUrl()}/units`, { method : 'POST', body : JSON.stringify(unit), headers : { 'Content-Type' : 'Application/json'}})
    if(saveMaterialToDb.ok){
        setIsOpen(false)
        // Reset form after submission
        setUnit({
          name: '',
          description: '',
          symbol : ''
        })
        setLoading(false); 
        toast({
          title : 'Unit added successfully'
        })

    }else{
      const errorMessage = await saveMaterialToDb.json()
      // setError()
      setLoading(false);
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Unit
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Unit</SheetTitle>
          <SheetDescription>
            Fill in the details of the new unit. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Unit Name</Label>
            <Input
              id="name"
              name="name"
              value={unit.name}
              onChange={handleInputChange}
              placeholder="Enter unit name"
              required
            />
          </div>
          <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input
                id="symbol"
                name="symbol"
                type="text"
                value={unit.symbol}
                onChange={handleInputChange}
                placeholder="Enter unit symbol"
                required
                />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={unit.description}
              onChange={handleInputChange}
              placeholder="Enter unit description"
              rows={3}
            />
          </div>
          <SheetFooter>
          <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
            <Button disabled={loading} type="submit">Save Unit</Button>
          </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
