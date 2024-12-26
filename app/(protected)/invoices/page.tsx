'use client'

import { useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { Eye, ChevronDown, ChevronUp, Plus, Trash2 } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/helpers/currencyFormat'
import { InvoiceDetailsModal } from '@/components/invoices/invoice-dialog';
import Link from 'next/link'

type Invoice = {
  id: number
  date: string
  paymentMethod: string
  customer: string
  totalAmount: number
  itemCount: number
}

export default function InvoicesPage() {
  const [sortColumn, setSortColumn] = useState<keyof Invoice>('date')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc')
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const queryClient = useQueryClient()

  const { data: invoices = [], isLoading, error } = useQuery<Invoice[]>({
    queryKey: ['invoices'],
    queryFn: async () => {
      const response = await fetch('http://localhost:5001/api/v1/invoices')
      if (!response.ok) throw new Error('Failed to fetch invoices')
      return response.json()
    }
  })

  const deleteInvoiceMutation = useMutation({
    mutationFn: async (invoiceId: number) => {
      const response = await fetch(`http://localhost:5001/api/v1/invoices/${invoiceId}`, {
        method: 'DELETE',
      })
      if (!response.ok) throw new Error('Failed to delete invoice')
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['invoices'])
      toast({
        title: "Success",
        description: "Invoice deleted successfully.",
      })
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to delete invoice. Please try again.",
        variant: "destructive"
      })
    }
  })

  if (error) {
    toast({
      title: "Error",
      description: "Failed to fetch invoices. Please try again.",
      variant: "destructive"
    })
  }

  const sortedInvoices = [...invoices].sort((a, b) => {
    if (a[sortColumn] < b[sortColumn]) return sortDirection === 'asc' ? -1 : 1
    if (a[sortColumn] > b[sortColumn]) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  const filteredInvoices = sortedInvoices.filter(invoice =>
    invoice.customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.paymentMethod.toLowerCase().includes(searchTerm.toLowerCase()) ||
    invoice.id.toString().includes(searchTerm) ||
    format(new Date(invoice.date), 'dd/MM/yyyy').includes(searchTerm)
  )

  const handleSort = (column: keyof Invoice) => {
    if (column === sortColumn) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortColumn(column)
      setSortDirection('asc')
    }
  }

  const SortIcon = ({ column }: { column: keyof Invoice }) => {
    if (column !== sortColumn) return null
    return sortDirection === 'asc' ? <ChevronUp className="ml-2 h-4 w-4" /> : <ChevronDown className="ml-2 h-4 w-4" />
  }
  const handleViewInvoice = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId)
    setIsModalOpen(true)
  }

  const handleDeleteInvoice = (invoiceId: number) => {
    if (window.confirm('Are you sure you want to delete this invoice?')) {
      deleteInvoiceMutation.mutate(invoiceId)
    }
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Invoices</h1>
        <Button asChild>
            <Link href={'/invoices/new'}>
                <Plus className="mr-2 h-4 w-4" /> New Invoice
            </Link>
        </Button>
      </div>

      <div className="mb-4">
        <Input
          type="text"
          placeholder="Search by ID, customer, payment method, or date..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">
                <Button variant="ghost" onClick={() => handleSort('id')}>
                  ID
                  <SortIcon column="id" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('date')}>
                  Date
                  <SortIcon column="date" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('paymentMethod')}>
                  Payment Method
                  <SortIcon column="paymentMethod" />
                </Button>
              </TableHead>
              <TableHead>
                <Button variant="ghost" onClick={() => handleSort('customer')}>
                  Customer
                  <SortIcon column="customer" />
                </Button>
              </TableHead>
              <TableHead className="text-right">
                <Button variant="ghost" onClick={() => handleSort('totalAmount')}>
                  Total Amount
                  <SortIcon column="totalAmount" />
                </Button>
              </TableHead>
              <TableHead className="text-center">
                <Button variant="ghost" onClick={() => handleSort('itemCount')}>
                  Item Count
                  <SortIcon column="itemCount" />
                </Button>
              </TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredInvoices.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No invoices found.
                </TableCell>
              </TableRow>
            ) : (
              filteredInvoices.map((invoice) => (
                <TableRow key={invoice.id}>
                  <TableCell className="font-medium">{invoice.id}</TableCell>
                  <TableCell>{format(new Date(invoice.date), 'dd/MM/yyyy')}</TableCell>
                  <TableCell>{invoice.paymentMethod}</TableCell>
                  <TableCell>{invoice.customer}</TableCell>
                  <TableCell className="text-right">{formatCurrency(invoice.totalAmount)}</TableCell>
                  <TableCell className="text-center">{invoice.itemCount}</TableCell>
                  <TableCell className="text-right">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <span className="sr-only">Open menu</span>
                          <Eye className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleViewInvoice(invoice.id)}>
                          <Eye className="mr-2 h-4 w-4" /> View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteInvoice(invoice.id)}>
                          <Trash2 className="mr-2 h-4 w-4" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <InvoiceDetailsModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        invoiceId={selectedInvoiceId}
      />
    </div>
  )
}

