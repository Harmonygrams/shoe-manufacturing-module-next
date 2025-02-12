'use client'

import { useState, useEffect } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { baseUrl } from '@/utils/baseUrl'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useToast } from '@/hooks/use-toast'

type Supplier = {
  id: number
  firstName: string
  lastName: string
  businessName: string
  phone: string
  email: string
  address: string
  supplierType: string
}

interface EditSupplierSheetProps {
  supplierId: string | undefined
  isOpen: boolean
  onOpenChange: (open: boolean) => void
  trigger?: React.ReactNode
}

export default function EditSupplierSheet({ supplierId, isOpen, onOpenChange, trigger }: EditSupplierSheetProps) {
console.log('the supplie id is ', supplierId)
  const queryClient = useQueryClient()
  const [loading, setLoading] = useState(false)
  const { toast } = useToast()
  const [supplierData, setSupplierData] = useState<Supplier | null>(null)
  const { data: supplier } = useQuery({
    queryKey: ['supplier', supplierId],
    queryFn: async () => {
      if (!supplierId) throw new Error('No supplier ID')
      const response = await fetch(`${baseUrl()}/suppliers/${supplierId}`)
      if (!response.ok) throw new Error('Failed to fetch supplier')
      return response.json()
    },
    enabled: !!supplierId && isOpen
  })

  const updateSupplierMutation = useMutation({
    mutationFn: async (data: Supplier) => {
      const response = await fetch(`${baseUrl()}/suppliers/${supplierId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })
      if (!response.ok) throw new Error('Failed to update supplier')
      return response.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['suppliers'])
      toast({ title: "Supplier updated successfully" })
      onOpenChange(false)
      setLoading(false)
    },
    onError: () => {
      toast({
        title: "Failed to update supplier",
        variant: "destructive"
      })
      setLoading(false)
    }
  })

  useEffect(() => {
    if (supplier) {
      setSupplierData(supplier)
    }
  }, [supplier])

  function handleChange(ev: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) {
    setSupplierData(prev => prev ? { ...prev, [ev.target.name]: ev.target.value } : null)
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault()
    if (supplierData) {
      setLoading(true)
      updateSupplierMutation.mutate(supplierData)
    }
  }

  return (
    <Sheet open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <SheetTrigger asChild>{trigger}</SheetTrigger>}
      <SheetContent className="w-full sm:max-w-[540px] overflow-y-auto" side="right">
        <SheetHeader>
          <SheetTitle>Edit Supplier Details</SheetTitle>
          <SheetDescription>
            Update the supplier details below. Click save when you&apos;re done.
          </SheetDescription>
        </SheetHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pt-6 pb-16">
          <div className="space-y-2">
            <Label htmlFor="supplierType">Supplier Type</Label>
            <RadioGroup 
              id="supplierType" 
              value={supplierData?.supplierType} 
              onValueChange={(type) => setSupplierData(prev => prev ? {...prev, supplierType: type} : null)} 
              className="flex" 
              name="supplierType"
            >
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

          {supplierData?.supplierType === 'individual' ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input 
                  name="firstName" 
                  id="firstName" 
                  placeholder="John" 
                  value={supplierData.firstName}
                  onChange={handleChange}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input 
                  name="lastName" 
                  id="lastName" 
                  placeholder="Doe" 
                  value={supplierData.lastName}
                  onChange={handleChange}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2">
              <Label htmlFor="businessName">Business Name</Label>
              <Input 
                name="businessName" 
                id="businessName" 
                placeholder="Acme Corp" 
                value={supplierData?.businessName || ''}
                onChange={handleChange}
              />
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input 
              name="phone" 
              id="phone" 
              type="tel" 
              placeholder="+1 (555) 000-0000" 
              value={supplierData?.phone || ''}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input 
              name="email" 
              id="email" 
              type="email" 
              placeholder="johndoe@example.com" 
              value={supplierData?.email || ''}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Textarea 
              name="address" 
              id="address" 
              placeholder="Enter full address" 
              value={supplierData?.address || ''}
              onChange={handleChange}
            />
          </div>
        </form>
        <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>Cancel</Button>
          <Button type="submit" onClick={handleSubmit} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}