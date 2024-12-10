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
import { useQuery } from '@tanstack/react-query'

type Customer = {
  id : string;
  customerName : string;
  email : string;
  address : string; 
}

export default function CustomersPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedCustomer, setSelectedCustomer] = useState<Customer>()
  const customersPerPage = 10
  const { data : customers = []} = useQuery<Customer[]>({
    queryKey : ['CUSTOMER'],
    queryFn : async () => {
      const fetchCustomers = await fetch('http://localhost:5001/api/v1/customers', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchCustomers.ok){
        const fetchCustomersJson = await fetchCustomers.json()
        return fetchCustomersJson
      }
    }
  })
  const filteredCustomers = customers.filter(customer => 
    (customer.customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     customer.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filter === '')
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
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Billing Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentCustomers.map((customer) => (
              <TableRow key={customer.id}>
                <TableCell>{customer.id}</TableCell>
                <TableCell>{customer.customerName}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer.email}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {customer.address}
                </TableCell>
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
                          <DialogTitle>Customer Profile: {selectedCustomer?.customerName}</DialogTitle>
                          <DialogDescription>Detailed information about the customer.</DialogDescription>
                        </DialogHeader>
                        {selectedCustomer && (
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold">Customer Information</h3>
                                <p><strong>ID:</strong> {selectedCustomer.id}</p>
                                <p><strong>Name:</strong> {selectedCustomer.customerName}</p>
                                <p><strong>Email:</strong> {selectedCustomer.email}</p>
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
                                </Table>
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