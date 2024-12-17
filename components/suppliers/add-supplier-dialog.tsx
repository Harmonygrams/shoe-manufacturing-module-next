'use client'

import { useState, ChangeEvent} from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { baseUrl } from '@/utils/baseUrl'

export default function SupplierDetailsDialog() {
  const [open, setOpen] = useState(false)
  const [loading, setLoading] = useState(false); 
  const [ supplierData, setSupplierData ] = useState({
    firstName : '', 
    lastName : '',
    businessName : '',
    phone : '', 
    email : '', 
    address : '', 
    supplierType : ''
  })
  function handleChange (ev : ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSupplierData(prev => ({ ...prev, [ev.target.name] : ev.target.value }))
  }
  async function handleSubmit (event: React.FormEvent) {
    setLoading(true); 
    event.preventDefault()
    const addSupplier = await fetch(`${baseUrl()}/suppliers`, { method : 'POST', body : JSON.stringify(supplierData), headers : {'Content-Type' : 'Application/json'}})
    if(addSupplier.ok){
      setLoading(false); 
      setOpen(false);
    }
  }
  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>Add Supplier</Button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>Add Supplier Details</SheetTitle>
          <SheetDescription>
            Add a new supplier to your database. Click save when you're done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-6 pb-16">
          <div className="space-y-2">
            <Label htmlFor="supplierType">Supplier Type</Label>
            <RadioGroup id="supplierType" value={supplierData.supplierType} onValueChange={(type) => setSupplierData(prev => ({...prev, supplierType : type}))} className="flex" name="supplierType">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="individual" />
                <Label htmlFor="individual">Individual</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="business" id="business" />
                <Label htmlFor="business">Business</Label>
              </div>
            </RadioGroup>
          </div>

          {supplierData.supplierType === 'individual' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input name="firstName" id="firstName" placeholder="John" onChange={handleChange}/>
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input name="lastName" id="lastName" placeholder="Doe" onChange={handleChange}/>
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input name="businessName" id="businessName" placeholder="Acme Corp" onChange={handleChange}/>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input name="phone" id="phone" type="tel" placeholder="+1 (555) 000-0000" onChange={handleChange}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input name = "email" id="email" type="email" placeholder="johndoe@example.com" onChange={handleChange}/>
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea name="address" id="address" placeholder="Enter full address" onChange={handleChange}/>
          </div>
        </form>
        <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>Cancel</Button>
          {loading ? <Button onClick={handleSubmit} disabled={loading}> Saving </Button> : <Button onClick={handleSubmit}>Save Supplier</Button>}
        </div>
      </SheetContent>
    </Sheet>
  )
}