'use client'

import { useState } from 'react'
import { Eye, Edit, Trash2, Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { ScrollArea } from "@/components/ui/scroll-area"
import SupplierDetailsDialog from '@/components/suppliers/add-supplier-dialog'
import { useQuery } from '@tanstack/react-query'
import { baseUrl } from '@/utils/baseUrl'
import EditSupplierSheet from '@/components/suppliers/edit-supplier-dialog'

type Supplier = {
  id : string;
  supplierName : string;
  email : string;
  address : string; 
}

export default function SupplierssPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [filter, setFilter] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [supplierEditorIsOpen, setSupplierEditorIsOpen] = useState<boolean>(false); 
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier>()
  const suppliersPerPage = 10
  const { data : suppliers = []} = useQuery<Supplier[]>({
    queryKey : ['suppliers'],
    queryFn : async () => {
      const fetchSuppliers = await fetch(`${baseUrl()}/suppliers`, { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchSuppliers.ok){
        const fetchSuppliersJson = await fetchSuppliers.json()
        return fetchSuppliersJson
      }
    }
  })
  const filteredSuppliers = suppliers.filter(supplier => 
    (supplier.supplierName.toLowerCase().includes(searchTerm.toLowerCase()) ||
     supplier.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
     supplier.email.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filter === '')
  )
  const indexOfLastSupplier = currentPage * suppliersPerPage
  const indexOfFirstSupplier = indexOfLastSupplier - suppliersPerPage
  const currentSupplier = filteredSuppliers.slice(indexOfFirstSupplier, indexOfLastSupplier)

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber)

  const handleSelectSupplier = (id : string) => {
    const supplier = suppliers.find(supplier => supplier.id === id)
    setSelectedSupplier(supplier)
    setSupplierEditorIsOpen(true)
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Suppliers</h1>
        <SupplierDetailsDialog />
      </div>
      <div className="mb-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-grow">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            placeholder="Search suppliers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select onValueChange={setFilter}>
          <SelectTrigger className="w-full sm:w-[200px]">
            <SelectValue placeholder="Filter suppliers" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Suppliers</SelectItem>
            <SelectItem value="outstanding">Outstanding Balance</SelectItem>
            <SelectItem value="recent">Recent Suppliers</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Supplier ID</TableHead>
              <TableHead>Supplier Name</TableHead>
              <TableHead className="hidden md:table-cell">Email</TableHead>
              <TableHead className="hidden lg:table-cell">Billing Address</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {currentSupplier.map((supplier) => (
              <TableRow key={supplier.id}>
                <TableCell>{supplier.id}</TableCell>
                <TableCell>{supplier.supplierName}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {supplier.email}
                </TableCell>
                <TableCell className="hidden md:table-cell">
                  {supplier.address}
                </TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button variant="outline" size="icon" onClick={() => setSelectedSupplier(supplier)}>
                          <Eye className="h-4 w-4" />
                          <span className="sr-only">View Details</span>
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-3xl">
                        <DialogHeader>
                          <DialogTitle>Supplier Profile: {selectedSupplier?.supplierName}</DialogTitle>
                          <DialogDescription>Detailed information about the supplier.</DialogDescription>
                        </DialogHeader>
                        {selectedSupplier && (
                          <ScrollArea className="h-[400px] rounded-md border p-4">
                            <div className="space-y-4">
                              <div>
                                <h3 className="text-lg font-semibold">Supplier Information</h3>
                                <p><strong>ID:</strong> {selectedSupplier.id}</p>
                                <p><strong>Name:</strong> {selectedSupplier.supplierName}</p>
                                <p><strong>Email:</strong> {selectedSupplier.email}</p>
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
                    <Button variant="outline" size="icon" onClick={() => handleSelectSupplier(supplier.id)}>
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

      {filteredSuppliers.length > suppliersPerPage && (
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
            disabled={indexOfFirstSupplier >= filteredSuppliers.length}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}
      <EditSupplierSheet
        supplierId={selectedSupplier?.id}
        isOpen = { supplierEditorIsOpen }
        onOpenChange={() => {setSupplierEditorIsOpen(false)}}
      />
    </div>
  )
}