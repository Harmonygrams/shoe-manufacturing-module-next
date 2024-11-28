'use client'

import { useState } from 'react'
import { Eye, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import CustomerDetailsDialog from '@/components/customers/add-customer-dialog'

// Mock data for demonstration
const customers = [
  { id: 'CUST001', name: 'Acme Corp', phone: '+1 (555) 123-4567', email: 'contact@acmecorp.com', billingAddress: '123 Main St, Anytown, AN 12345', totalOrders: 15, outstandingBalance: 1500, lastOrderDate: '2023-06-15' },
  { id: 'CUST002', name: 'TechGiant Inc', phone: '+1 (555) 987-6543', email: 'info@techgiant.com', billingAddress: '456 Tech Blvd, Innovation City, IC 67890', totalOrders: 8, outstandingBalance: 0, lastOrderDate: '2023-06-10' },
  { id: 'CUST003', name: 'Global Manufacturing', phone: '+1 (555) 246-8135', email: 'orders@globalmanufacturing.com', billingAddress: '789 Industry Ave, Factoryville, FV 13579', totalOrders: 22, outstandingBalance: 3000, lastOrderDate: '2023-06-18' },
  { id: 'CUST004', name: 'SmartSolutions LLC', phone: '+1 (555) 369-2580', email: 'support@smartsolutions.com', billingAddress: '321 Smart St, Techville, TV 97531', totalOrders: 5, outstandingBalance: 750, lastOrderDate: '2023-06-05' },
  { id: 'CUST005', name: 'Innovative Designs Co', phone: '+1 (555) 159-7531', email: 'designs@innovative.com', billingAddress: '654 Creative Ln, Artstown, AT 86420', totalOrders: 12, outstandingBalance: 0, lastOrderDate: '2023-06-20' },
]

// Mock order history data
const orderHistory = [
  { id: 'ORD001', status: 'Completed', amount: 5000, date: '2023-06-15' },
  { id: 'ORD002', status: 'In Production', amount: 3500, date: '2023-06-10' },
  { id: 'ORD003', status: 'Pending', amount: 2000, date: '2023-06-05' },
]

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState(null)
  const customersPerPage = 10

  const filteredCustomers = customers.filter(customer => 
    (customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.phone.includes(searchTerm) ||
     customer.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filter === '' ||
     (filter === 'outstanding' && customer.outstandingBalance > 0) ||
     (filter === 'recent' && new Date(customer.lastOrderDate) >= new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)))
  )

  const indexOfLastCustomer = currentPage * customersPerPage
  const indexOfFirstCustomer = indexOfLastCustomer - customersPerPage
  const currentCustomers = filteredCustomers.slice(indexOfFirstCustomer, indexOfLastCustomer)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Customers</h1>
        <CustomerDetailsDialog />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search customers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter customers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Customers</SelectItem>
            <SelectItem value="outstanding">Outstanding Balance</SelectItem>
            <SelectItem value="recent">Recent Customers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Customer ID</TableHead>
              <TableHead>Customer Name</TableHead>
              <TableHead className="hidden md:table-cell">Contact Info</TableHead>
              <TableHead className="hidden lg:table-cell">Billing Address</TableHead>
              <TableHead>Total Orders</TableHead>
              <TableHead>Outstanding Balance</TableHead>
              <TableHead className="hidden sm:table-cell">Last Order Date</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.id}</TableCell>
                <TableCell>{customer.name}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer.phone}<br />{customer.email}
                </TableCell>
                <TableCell className="hidden lg:table-cell">{customer.billingAddress}</TableCell>
                <TableCell>{customer.totalOrders}</TableCell>
                <TableCell>
                  ${customer.outstandingBalance}
                  {customer.outstandingBalance > 0 && (
                    <Badge variant="destructive" className="ml-2">Outstanding</Badge>
                  )}
                </TableCell>
                <TableCell className="hidden sm:table-cell">{customer.lastOrderDate}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setSelectedCustomer(customer)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Customer Profile: {selectedCustomer?.name}</DialogTitle>
                          <DialogDescription>Detailed information about the customer.</DialogDescription>
                        </DialogHeader>
                        {selectedCustomer && (
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold">Customer Information</h3>
                                <p><strong>ID:</strong> {selectedCustomer.id}</p>
                                <p><strong>Name:</strong> {selectedCustomer.name}</p>
                                <p><strong>Phone:</strong> {selectedCustomer.phone}</p>
                                <p><strong>Email:</strong> {selectedCustomer.email}</p>
                                <p><strong>Billing Address:</strong> {selectedCustomer.billingAddress}</p>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Order History</h3>
                                <Table>
                                  <TableHeader>
                                    <TableRow>
                                      <TableHead>Order ID</TableHead>
                                      <TableHead>Status</TableHead>
                                      <TableHead>Amount</TableHead>
                                      <TableHead>Date</TableHead>
                                    </TableRow>
                                  </TableHeader>
                                  <TableBody>
                                    {orderHistory.map((order) => (
                                      <TableRow key={order.id}>
                                        <TableCell>{order.id}</TableCell>
                                        <TableCell>{order.status}</TableCell>
                                        <TableCell>${order.amount}</TableCell>
                                        <TableCell>{order.date}</TableCell>
                                      </TableRow>
                                    ))}
                                  </TableBody>
                                </Table>
                              </div>
                              <div>
                                <h3 className="text-lg font-semibold">Outstanding Payments</h3>
                                <p>Total Outstanding: ${selectedCustomer.outstandingBalance}</p>
                                {selectedCustomer.outstandingBalance > 0 && (
                                  <Button className="mt-2">Process Payment</Button>
                                )}
                              </div>
                            </div>
                          </ScrollArea>
                        )}
                      </DialogContent>
                    </Dialog>
                    <Button variant="outline" size="icon">
                      <Edit className="h-4 w-4" />
                      <span className="sr-only">Edit</span>
                    </Button>
                    <Button variant="outline" size="icon">
                      <Trash2 className="h-4 w-4" />
                      <span className="sr-only">Delete</span>
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {filteredCustomers.length > customersPerPage && (
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
            disabled={indexOfLastCustomer >= filteredCustomers.length}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  )
}