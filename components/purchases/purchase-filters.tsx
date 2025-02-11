'use client'

import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"

export function PurchaseFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [date, setDate] = useState<Date | undefined>()
  const [status, setStatus] = useState(searchParams.get('status') || '')
  const [supplier, setSupplier] = useState(searchParams.get('supplier') || '')

  const handleFilter = () => {
    const params = new URLSearchParams(searchParams)
    if (date) params.set('date', format(date, 'yyyy-MM-dd'))
    if (status) params.set('status', status)
    if (supplier) params.set('supplier', supplier)
    router.push(`/purchases?${params.toString()}`)
  }

  return (
    <div className="flex flex-wrap gap-6 mb-6 items-end">
      {/* <div className=''>
        <Popover>
          <Label className='block' htmlFor="date">Date</Label>
          <PopoverTrigger asChild>
            <Button variant="outline">
              {date ? format(date, 'PPP') : 'Pick a date'}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={date}
              onSelect={setDate}
              initialFocus
            />
          </PopoverContent>
        </Popover>
      </div> */}
      {/* <div>
        <Label htmlFor="status">Status</Label>
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger id="status">
            <SelectValue placeholder="Select status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div> */}
      <div>
        <Label htmlFor="supplier">Supplier</Label>
        <Input
          id="supplier"
          value={supplier}
          onChange={(e) => setSupplier(e.target.value)}
          placeholder="Supplier name"
        />
      </div>
      <Button onClick={handleFilter}>Apply Filters</Button>
    </div>
  )
}

