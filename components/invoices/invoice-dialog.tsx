import { useState, useEffect } from 'react'
import { useQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/helpers/currencyFormat'
import { baseUrl } from '@/utils/baseUrl'

type InvoiceDetails = {
  id: number
  date: string
  paymentMethod: string
  customer: {
    id: number
    name: string
    email: string
    phone: string
    address: string
  }
  items: {
    id: number
    productName: string
    size: string
    color: string
    quantity: number
    unitPrice: number
    totalPrice: number
    unit: string
  }[]
  totalAmount: number
}

type InvoiceDetailsModalProps = {
  isOpen: boolean
  onClose: () => void
  invoiceId: number | null
}

export function InvoiceDetailsModal({ isOpen, onClose, invoiceId }: InvoiceDetailsModalProps) {
  const { data: invoice, isLoading, error } = useQuery<InvoiceDetails>({
    queryKey: ['invoice', invoiceId],
    queryFn: async () => {
      if (!invoiceId) throw new Error('Invoice ID is required')
      const response = await fetch(`${baseUrl()}/invoices/${invoiceId}`)
      if (!response.ok) throw new Error('Failed to fetch invoice details')
      return response.json()
    },
    enabled: !!invoiceId,
  })

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch invoice details. Please try again.",
        variant: "destructive"
      })
    }
  }, [error])
  function handleClose () {
    onClose()
    window.location.href = '/invoices'
  }
  if (isLoading) {
    return (
      <Dialog open={isOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-[800px]">
          <DialogHeader>
            <DialogTitle>Loading invoice details...</DialogTitle>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )
  }

  if (!invoice) return null

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Invoice Details</DialogTitle>
        </DialogHeader>
        <div className="mt-4">
          <h3 className="text-lg font-semibold">Invoice #{invoice.id}</h3>
          <p>Date: {format(new Date(invoice.date), 'dd/MM/yyyy HH:mm')}</p>
          <p>Payment Method: {invoice.paymentMethod}</p>
          <h4 className="text-md font-semibold mt-4">Customer Details</h4>
          <p>Name: {invoice.customer.name}</p>
          <p>Email: {invoice.customer.email || 'N/A'}</p>
          <p>Phone: {invoice.customer.phone || 'N/A'}</p>
          <p>Address: {invoice.customer.address}</p>
          <h4 className="text-md font-semibold mt-4">Items</h4>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Size</TableHead>
                <TableHead>Color</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit Price</TableHead>
                <TableHead>Total Price</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoice.items.map((item) => (
                <TableRow key={item.id}>
                  <TableCell>{item.productName}</TableCell>
                  <TableCell>{item.size}</TableCell>
                  <TableCell>{item.color}</TableCell>
                  <TableCell>{item.quantity} {item.unit}</TableCell>
                  <TableCell>{formatCurrency(item.unitPrice)}</TableCell>
                  <TableCell>{formatCurrency(item.totalPrice)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <p className="mt-4 text-right font-semibold">Total Amount: {formatCurrency(invoice.totalAmount)}</p>
        </div>
      </DialogContent>
    </Dialog>
  )
}

