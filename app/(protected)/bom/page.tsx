'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Search, Filter, FileDown, Copy, AlertTriangle, Check, Info, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Badge } from "@/components/ui/badge"
import Link from 'next/link'
import { BomView } from '@/components/bom/bom-view'
import { dateFormater } from '@/utils/date-formater'

type BomListMaterial = {
  id : string; 
  quantity : number, 
  materialName : string; 
  unit : string; 
}
type Bom = {
  id : string; 
  productName : string; 
  quantity : string; 
  sku : string; 
  bomDate : string;
  bomList : BomListMaterial[],
  totalCost : number;

}

export default function BOMPage() {
  const [bomItems, setBom] = useState<Bom[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('')
  const [selectedBOM, setSelectedBOM] = useState<string | null>(null)

  // const filteredBOMs = bomItems.filter(bom => 
  //   (bom.productName.toLowerCase().includes(searchTerm.toLowerCase()) ||
  //    bom.sku.toLowerCase().includes(searchTerm.toLowerCase())) &&
  //   (statusFilter === '' || (statusFilter === 'active' && bom.sufficientMaterials) || (statusFilter === 'inactive' && !bom.sufficientMaterials))
  // )

  const handleCloseBOMDetail = () => {
    setSelectedBOM(null)
  }
  async function fetchBom () { 
    const fetchBom = await fetch("http://localhost:5001/api/v1/bom", { method : "GET", headers : { 'Content-Type' : 'Application/json'}})
    if(fetchBom.ok){
      const fetchBomJson = await fetchBom.json();
      setBom(fetchBomJson)
    }
  }
  useEffect(() => {
    fetchBom()
  }, [])
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bill of Materials (BOM)</h1>
      
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-grow w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
            <Input
              type="text"
              placeholder="Search BOMs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full"
            />
          </div>
        </div>
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 w-full md:w-auto">
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jg">All Categories</SelectItem>
              <SelectItem value="Electronics">Electronics</SelectItem>
              <SelectItem value="Mechanics">Mechanics</SelectItem>
              <SelectItem value="Hardware">Hardware</SelectItem>
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="jf">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button className="w-full md:w-auto" asChild>
          <Link href="/bom/new">
            <Plus className="mr-2 h-4 w-4" /> Add New BOM
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Product Name</TableHead>
              <TableHead>SKU/Code</TableHead>
              <TableHead>Materials</TableHead>
              <TableHead>Total Cost</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bomItems.map((bom) => (
              <TableRow key={bom.id}>
                <TableCell>{bom.productName}</TableCell>
                <TableCell>{bom.sku}</TableCell>
                <TableCell>{bom.bomList.length} materials</TableCell>
                <TableCell>${bom.totalCost}</TableCell>
                <TableCell>
                    <Badge variant="outline" className="bg-green-100 text-green-800">
                      <Check className="mr-1 h-3 w-3" /> Active
                    </Badge>
                  {/* {bom. ? (
                  ) : (
                    <Badge variant="outline" className="bg-yellow-100 text-yellow-800">
                      <AlertTriangle className="mr-1 h-3 w-3" /> Insufficient
                    </Badge>
                  )} */}
                </TableCell>
                <TableCell>{dateFormater(bom.bomDate)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => setSelectedBOM(bom.id)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>View BOM</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Edit BOM</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>
                          <p>Delete BOM</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        <BomView selectedBOM={selectedBOM} handleCloseBOMDetail={handleCloseBOMDetail} props={{ bomId : selectedBOM}}/>
      </div>
    </div>
  )
}