'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { format, set } from 'date-fns'
import { ChevronDown, ChevronUp, Eye, Edit, Trash2, Plus, MoreVertical, AlertCircle } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { baseUrl } from '@/utils/baseUrl'
import { formatCurrency } from '@/helpers/currencyFormat'
import { Status } from '@/components/manufacturing/status'
import { ProductionSummary } from '@/components/manufacturing/production-summary'
import { DeleteConfirmation } from '@/components/delete-confirmation'
import Link from 'next/link'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProductionDetailsDialog } from "@/components/manufacturing/manufacturing-dialog";
import { UpdateProductionDialog } from '@/components/manufacturing/update-manufacturing-status'
type ProductionStatus = 'cutting' | 'sticking' | 'lasting' | 'finished'

type Production = {
  id: number
  date: string
  cost: number
  status: ProductionStatus
}

type PaginationResponse = Production[] & {nextCursor: string | null}

const ITEMS_PER_PAGE = 50

export default function ProductionPage() {
  const [sortConfig, setSortConfig] = useState<{ key: keyof Production; direction: 'asc' | 'desc' }>({
    key: 'date',
    direction: 'desc',
  })
  const [dateFrom, setDateFrom] = useState('')
  const [dateTo, setDateTo] = useState('')
  const [statusFilter, setStatusFilter] = useState<ProductionStatus | 'all'>('all')
  const [selectedProductionId, setSelectedProductionId] = useState<number | null>(null)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isDeleteConfirmationOpen, setIsDeleteConfirmationOpen] = useState(false)
  const [updateManufacturingStatus, setUpdateManufacturingStatus] = useState(false)
  const {
    data,
    isLoading,
    isFetching,
    hasNextPage,
    fetchNextPage,
  } = useInfiniteQuery<PaginationResponse>({
    queryKey: ['PRODUCTIONS', dateFrom, dateTo, statusFilter],
    queryFn: async ({ pageParam = null }) => {
      const params = new URLSearchParams({
        limit: ITEMS_PER_PAGE.toString(),
        ...(pageParam && { cursor: pageParam }),
        ...(dateFrom && { dateFrom }),
        ...(dateTo && { dateTo }),
        ...(statusFilter !== 'all' && { status: statusFilter }),
      })
      const response = await fetch(`${baseUrl()}/manufacturing?${params}`)
      if (!response.ok) throw new Error('Failed to fetch productions')
      return response.json()
    },
    getNextPageParam: (lastPage) => lastPage.nextCursor,
    keepPreviousData: true,
  })

  const productions = data?.pages.flatMap(page => page) || []

  const requestSort = (key: keyof Production) => {
    setSortConfig(prevConfig => ({
      key,
      direction: prevConfig.key === key && prevConfig.direction === 'asc' ? 'desc' : 'asc',
    }))
  }

  const SortIcon = ({ columnKey }: { columnKey: keyof Production }) => {
    if (sortConfig.key === columnKey) {
      return sortConfig.direction === 'asc' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />
    }
    return null
  }

  const renderSkeleton = () => (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-10 w-36" />
      </div>

      <Skeleton className="h-8 w-full mb-6" />
      <Skeleton className="h-96 w-full" />
      <Card className="mt-6">
        <CardHeader>
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <Skeleton className="h-10 w-full md:w-1/3" />
            <Skeleton className="h-10 w-full md:w-1/3" />
            <Skeleton className="h-10 w-full md:w-1/3" />
          </div>

          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
          <Skeleton className="h-12 w-full mb-2" />
        </CardContent>
      </Card>
    </div>
  )
  if (isLoading) {
    return renderSkeleton()
  }
  
  function handleDelete (productionId : number) {
    setSelectedProductionId(productionId)
    setIsDeleteConfirmationOpen(true) 
  }
  const handleView = (id: number) => {
    setSelectedProductionId(id)
    setIsDialogOpen(true)
  }
  function handleUpdateStatus (productionId : number, value : ProductionStatus) {}
  const handleClose = () => {
    setIsDialogOpen(false)
    // Reset ID after animation completes
    setTimeout(() => {
      setSelectedProductionId(null)
    }, 300)
  }
  return (
    <>
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Productions</h1>
          <Button onClick={() => console.log('Adding new production')} asChild>
            <Link href={'/manufacturing/new'}>
              <Plus className="w-4 h-4 mr-2" />
              Add New Production
            </Link>
          </Button>
        </div>

        <ProductionSummary productions={productions} />

        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Production Table</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('date')}>
                      Date
                      <SortIcon columnKey="date" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('id')}>
                      Production ID
                      <SortIcon columnKey="id" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('cost')}>
                      Cost
                      <SortIcon columnKey="cost" />
                    </Button>
                  </TableHead>
                  <TableHead>
                    <Button variant="ghost" onClick={() => requestSort('status')}>
                      Status
                      <SortIcon columnKey="status" />
                    </Button>
                  </TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {productions.map((production) => (
                  <TableRow key={production.id}>
                    <TableCell>{format(new Date(production.date), 'PP')}</TableCell>
                    <TableCell>{production.id}</TableCell>
                    <TableCell>{formatCurrency(production.cost)}</TableCell>
                    <TableCell>
                      <Status status={production.status} />
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreVertical className="w-4 h-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(production.id)}>
                            <Eye className="w-4 h-4 mr-2" />
                            View Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {
                            setSelectedProductionId(production.id)
                            setUpdateManufacturingStatus(true)
                            }}>
                            <AlertCircle className="w-4 h-4 mr-2" />
                            Update Status
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(production.id)} className="text-destructive">
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            {hasNextPage && (
              <div className="mt-4 flex justify-center">
                <Button onClick={() => fetchNextPage()} disabled={isFetching}>
                  {isFetching ? 'Loading...' : 'Load More'}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      {updateManufacturingStatus && <UpdateProductionDialog 
        productionId={selectedProductionId}
        isOpen={updateManufacturingStatus}
        onClose={() => {
          setUpdateManufacturingStatus(false)
          window.location.reload()
        }}
      />}
      {isDialogOpen && <ProductionDetailsDialog 
        productionId={selectedProductionId}
        isOpen={isDialogOpen}
        onClose={handleClose}
      />}
      {selectedProductionId && <DeleteConfirmation 
        isOpen={isDeleteConfirmationOpen}
        itemId={selectedProductionId.toString()}
        onClose={() => {
          setIsDeleteConfirmationOpen(false)
          window.location.reload()
        }
        }
        segment='manufacturing'
        onDeleteSuccess={() => {window.location.reload()}}
      />}
    </>
  )
}
