'use client'

import { useState } from 'react'
import { useInfiniteQuery } from '@tanstack/react-query'
import { format } from 'date-fns'
import { ChevronDown, ChevronUp, Eye, Edit, Trash2, Plus } from 'lucide-react'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { baseUrl } from '@/utils/baseUrl'
import { formatCurrency } from '@/helpers/currencyFormat'
import { Status } from '@/components/production/status'
import { ProductionSummary } from '@/components/production/production-summary'
import Link from 'next/link'

type ProductionStatus = 'processing' | 'cutting' | 'sticking' | 'lasting' | 'finishing' | 'delivery' | 'done'

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
      const response = await fetch(`${baseUrl()}/productions?${params}`)
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
  
  function handleDelete (productionId : number) {}
  function handleView (productionId : number) {}
  function handleUpdateStatus (productionId : number, value : ProductionStatus) {}
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Productions</h1>
        <Button onClick={() => console.log('Adding new production')} asChild>
          <Link href={'/production/new'}>
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
                    <div className="flex space-x-2">
                      <Button variant="outline" size="sm" onClick={() => handleView(production.id)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="outline" size="sm" onClick={() => handleDelete(production.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                      <Select onValueChange={(value: ProductionStatus) => handleUpdateStatus(production.id, value)}>
                        <SelectTrigger className="w-[130px]">
                          <SelectValue placeholder="Update Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="processing">Processing</SelectItem>
                          <SelectItem value="cutting">Cutting</SelectItem>
                          <SelectItem value="sticking">Sticking</SelectItem>
                          <SelectItem value="lasting">Lasting</SelectItem>
                          <SelectItem value="finishing">Finishing</SelectItem>
                          <SelectItem value="delivery">Delivery</SelectItem>
                          <SelectItem value="done">Done</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
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
  )
}
