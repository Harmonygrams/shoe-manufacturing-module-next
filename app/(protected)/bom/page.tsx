'use client'

import React, { useState } from 'react'
import { Plus, Search, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import Link from 'next/link'
import { BomView } from '@/components/bom/bom-view'
import { dateFormater } from '@/utils/date-formater'
import { useQuery } from '@tanstack/react-query'
import { baseUrl } from '@/utils/baseUrl'
import { DeleteConfirmation } from '@/components/delete-confirmation'
import { useQueryClient } from '@tanstack/react-query'


type BomListMaterial = {
  id : string; 
  quantity : number, 
  materialName : string; 
  unit : string; 
}
type Bom = {
  id : string; 
  productId : string;
  productName : string; 
  quantity : string; 
  sku : string; 
  bomDate : string;
  bomList : BomListMaterial[],
  totalCost : number;

}

export default function BOMPage() {
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedBOM, setSelectedBOM] = useState<string | null>(null)
  const [selectedBomId, setSelectedBomId] = useState<string | null>(null)
  const [deleteDialogIsOpen, setDeleteDialogIsOpen] = useState<boolean>(false); 
  const [showBomDetails, setShowBomDetails ] = useState<boolean>(false); 
  const queryClient = useQueryClient()
  const { data : bomItems = []} = useQuery<Bom[]>({
    queryKey : ['bom'],
    queryFn : async () => {
      const fetchBom = await fetch(`${baseUrl()}/bom`, { method : "GET", headers : { 'Content-Type' : 'Application/json'}})
      if(fetchBom.ok){
        const fetchBomJson = await fetchBom.json()
        console.log(fetchBomJson)
        return fetchBomJson.bomItems;
      }
    }
  })
  const handleCloseBOMDetail = () => {
    setSelectedBOM(null)
    setShowBomDetails(false); 
  }
  const handleDeleteDom = (id : string ) => {
    setDeleteDialogIsOpen(true)
    setSelectedBomId(id)
  }
  const handleBomView = (productId : string) => {
    setSelectedBOM(productId)
    setShowBomDetails(true); 
  }
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Bill of Materials (BOM)</h1>   
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 space-y-4 md:space-y-0 md:space-x-4">
        <div className="flex-grow w-full md:w-auto">
          <div className="relative max-w-[300px]">
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
              <TableHead>Materials</TableHead>
              <TableHead>Date Created</TableHead>
              <TableHead>Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {bomItems?.map((bom) => (
              <TableRow key={bom.id}>
                <TableCell>{bom.productName}</TableCell>
                <TableCell>{bom.bomList.length} materials</TableCell>
                <TableCell>{dateFormater(bom.bomDate)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button variant="outline" size="icon" onClick={() => handleBomView(bom.productId)}>
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
                          <Button variant="outline" size="icon" asChild>
                            <Link href={`/bom/edit/${bom.productId}`}>
                              <Edit className="h-4 w-4" />
                            </Link>
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
                          <Button variant="outline" size="icon" onClick={() => handleDeleteDom(bom.id)}>
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
        {showBomDetails && <BomView selectedBOM={selectedBOM} handleCloseBOMDetail={handleCloseBOMDetail} props={{ productId : selectedBOM}}/>}
        {deleteDialogIsOpen && <DeleteConfirmation 
        itemId = {selectedBomId || ''}
        isOpen = {deleteDialogIsOpen} 
        onClose = {() => setDeleteDialogIsOpen(false)}
        onDeleteSuccess = {() => {queryClient.invalidateQueries(['bom'])}}
        segment = "bom"
         />}
      </div>
    </div>
  )
}