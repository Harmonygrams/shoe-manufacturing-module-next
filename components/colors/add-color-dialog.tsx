'use client'

import { useState } from 'react'
import { Plus } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/utils/baseUrl'
import { useToast } from '@/hooks/use-toast'
import { title } from 'process'

export default function AddColorSheet() {
  const [loading, setLoading] = useState<boolean>(false); 
  const { toast } = useToast()
  const queryClient = useQueryClient()
  const [isOpen, setIsOpen] = useState(false)
  const [color, setColor] = useState({
    name: '',
  })

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setColor(prev => ({ ...prev, [name]: value }))
  }


  async function handleSubmit (e: React.FormEvent) {
    setLoading(true); 
    e.preventDefault()
    // Here you would typically send the data to your backend
    const saveMaterialToDb = await fetch(`${baseUrl()}/colors`, { method : 'POST', body : JSON.stringify(color), headers : { 'Content-Type' : 'Application/json'}})
    if(saveMaterialToDb.ok){
      setIsOpen(false)
      // Reset form after submission
      setColor({
        name: '',
      })
      setLoading(false); 
      queryClient.invalidateQueries(['COLORS'])
      toast({
        title : 'Color added successfully'
      })
    }else{
      setLoading(false); 
      toast({
        title : 'An error occurred', 
        variant : 'destructive'
      })
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button onClick={() => setIsOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Color
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-[540px]">
        <SheetHeader>
          <SheetTitle>Add New Color</SheetTitle>
          <SheetDescription>
            Fill in the details of the new color. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="name">Color Name</Label>
            <Input
              id="name"
              name="name"
              value={color.name}
              onChange={handleInputChange}
              placeholder="Enter color name"
              required
            />
          </div>
          <SheetFooter>
          <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
            <Button type="submit" disabled={loading}>Save Color</Button>
          </div>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}
