'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { CalendarIcon, ChevronLeft, ChevronRight, MoreHorizontal, FileText, Eye, Trash2, Pencil } from 'lucide-react'
import { format } from "date-fns"
import Link from 'next/link'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { baseUrl } from '@/utils/baseUrl'
import { DeleteConfirmation } from '@/components/delete-confirmation'
import { ViewOrderDetails } from '@/components/orders/view-order-details' 

type Order = { 
  id: string; 
  customerName: string; 
  orderDate: string; 
  status: string; 
  quantity: string; 
  products: Product[]
}

type Product = {
  productId: number;  
  quantity: number;
}

export default function OrderManagement() {
  const [ isDeleteDialogOpen, setIsDeleteDialogOpen] = useState<boolean>(false)
  const [viewOrder, setViewOrder] = useState<boolean>(false);
  const queryClient = useQueryClient()
  const [selectedOrderId, setSelectedOrderId ] = useState<string>("")
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [currentPage, setCurrentPage] = useState(1)
  const ordersPerPage = 10

  const { data: orders = [] } = useQuery<Order[]>({
    queryKey: ['orders'],
    queryFn: async () => {
      const fetchOrders = await fetch(`${baseUrl()}/orders`, { method: 'GET', headers: { 'Content-Type': 'application/json' }})
      if (fetchOrders.ok) {
        const fetchOrdersJson = await fetchOrders.json()
        return fetchOrdersJson
      }
      throw new Error('Failed to fetch orders')
    }
  })

  const filteredOrders = orders.filter(order => 
    order.customerName.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (statusFilter === '' || order.status === statusFilter) &&
    (!startDate || new Date(order.orderDate) >= startDate) &&
    (!endDate || new Date(order.orderDate) <= endDate)
  )

  const indexOfLastOrder = currentPage * ordersPerPage
  const indexOfFirstOrder = indexOfLastOrder - ordersPerPage
  const currentOrders = filteredOrders.slice(indexOfFirstOrder, indexOfLastOrder)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const statusColors: { [key: string]: string } = {
    'processing': 'bg-yellow-100 text-yellow-800',
    'pending': 'bg-blue-100 text-blue-800',
    'fulfilled': 'bg-green-100 text-green-800',
  }

  const handleCreateInvoice = (orderId: string) => {
    console.log('Create Invoice for order:', orderId)
    // Implement create invoice logic here
  }

  const handleViewOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setViewOrder(true)
  }

  const handleDeleteOrder = (orderId: string) => {
    setSelectedOrderId(orderId)
    setIsDeleteDialogOpen(true)
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Production Orders</h1>
        
        <Button className="bg-primary hover:bg-primary/90" asChild>
          <Link href='/production-orders/new'>
            Add New Order
          </Link>
        </Button>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <Input
          placeholder="Search by customer name"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full sm:w-64"
        />
        <Select onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="processing">Processing</SelectItem>
            <SelectItem value="fulfilled">Fulfilled</SelectItem>
          </SelectContent>
        </Select>
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="outline" className="w-full sm:w-[280px] justify-start text-left font-normal">
              <CalendarIcon className="mr-2 h-4 w-4" />
              {startDate && endDate ? (
                `${format(startDate, "PPP")} - ${format(endDate, "PPP")}`
              ) : (
                <span>Pick a date range</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={startDate}
              selected={{ from: startDate, to: endDate }}
              onSelect={(range) => {
                setStartDate(range?.from)
                setEndDate(range?.to)
              }}
              numberOfMonths={2}
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Order ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead>Order Date</TableHead>
              <TableHead>Status</TableHead>
              {/* <TableHead>Total Quantity</TableHead> */}
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentOrders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>{order.id}</TableCell>
                <TableCell>{order.customerName}</TableCell>
                <TableCell>{new Date(order.orderDate).toDateString()}</TableCell>
                <TableCell>
                  <Badge className={statusColors[order.status]}>{order.status}</Badge>
                </TableCell>
                {/* <TableCell>{order.products.reduce((init, sum) => init + sum.quantity, 0)}</TableCell> */}
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-[160px]">
                      <DropdownMenuLabel>Actions</DropdownMenuLabel>
                      <DropdownMenuItem onClick={() => handleCreateInvoice(order.id)}>
                        <FileText className="mr-2 h-4 w-4" />
                        <span>Create Invoice</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => handleViewOrder(order.id)}>
                        <Eye className="mr-2 h-4 w-4" />
                        <span>View</span>
                      </DropdownMenuItem>
                      {/* <DropdownMenuItem className="cursor-pointer" disabled={order.status !== "pending"} asChild>
                        <Link href={`/production-orders/edit/${order.id}`}> 
                          <Pencil className="mr-2 h-4 w-4" />
                          <span>Edit</span>
                        </Link>
                      </DropdownMenuItem> */}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => handleDeleteOrder(order.id)} className="text-red-600 cursor-pointer" disabled={order.status !== "pending"}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        <span>Delete</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredOrders.length > ordersPerPage && (
        <div className="mt-4 flex justify-center">
          <Button
            variant="outline"
            onClick={() => paginate(currentPage - 1)}
            disabled={currentPage === 1}
            className="mr-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            onClick={() => paginate(currentPage + 1)}
            disabled={indexOfLastOrder >= filteredOrders.length}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <DeleteConfirmation 
        itemId={selectedOrderId}
        onClose={() => {
          setIsDeleteDialogOpen(false)
          window.location.reload()
        }}
        isOpen = {isDeleteDialogOpen}
        segment="orders"
        onDeleteSuccess={() => {
          setSelectedOrderId('')
          queryClient.invalidateQueries(["orders"])
          window.location.reload()
        }}
      />
      {viewOrder && <ViewOrderDetails 
        id = {selectedOrderId}
        onClose={() => {
          setViewOrder(false)
          window.location.reload()
        }}
      />}
    </div>
  )
}

