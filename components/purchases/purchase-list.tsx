'use client'

import { useInfiniteQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { formatCurrency } from '@/helpers/currencyFormat'
import { Button } from "@/components/ui/button"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { baseUrl } from '@/utils/baseUrl'
import { useToast } from '@/hooks/use-toast'

type Data = {
  id: string
  supplier: {
    name: string
  }
  date: string
  materialCount: number;
  totalCost: number
}

type Page = {
  data: Data[]
  nextCursor: string | null
}

export function PurchaseList({
  date,
  status,
  supplier
}: {
  date?: string
  status?: string
  supplier?: string
}) {
  const { toast } = useToast()

  const fetchPurchases = async ({ pageParam = '' }): Promise<Page> => {
    const params = new URLSearchParams({ cursor: pageParam })
    if (date) params.append('date', date)
    if (status) params.append('status', status)
    if (supplier) params.append('supplier', supplier)
    const response = await fetch(`${baseUrl()}/purchases?${params.toString()}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    })

    if (!response.ok) {
      throw new Error('Failed to fetch purchases')
    }

    return response.json()
  }

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status: queryStatus,
  } = useInfiniteQuery<Page>({
    queryKey: ['purchases', date, status, supplier],
    queryFn: fetchPurchases,
    getNextPageParam: (lastPage) => lastPage.nextCursor,
  })

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`${baseUrl()}/purchases/${id}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' }
      })

      if (!response.ok) {
        throw new Error('Failed to delete purchase')
      }

      toast({
        title: "Purchase deleted",
        description: "The purchase has been successfully deleted.",
      })

      // Optionally, you can invalidate the query to refetch the data
      // queryClient.invalidateQueries(['purchases'])
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete the purchase. Please try again.",
        variant: "destructive",
      })
    }
  }

  if (queryStatus === 'loading') return <div>Loading...</div>
  if (queryStatus === 'error') return <div>Error fetching purchases</div>

  return (
    <div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Purchase ID</TableHead>
            <TableHead>Supplier</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Number of Materials</TableHead>
            <TableHead>Total Cost</TableHead>
            <TableHead>Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.pages.flatMap((page) => 
            page.data.map((purchase) => (
              <TableRow key={purchase.id}>
                <TableCell>{purchase.id}</TableCell>
                <TableCell>{purchase.supplier.name}</TableCell>
                <TableCell>{new Date(purchase.date).toDateString()}</TableCell>
                <TableCell>{purchase.materialCount}</TableCell>
                <TableCell>{formatCurrency(purchase.totalCost)}</TableCell>
                <TableCell>
                  <div className="flex space-x-2">
                    <Link href={`/purchases/${purchase.id}`}>
                      <Button variant="outline" size="sm">View</Button>
                    </Link>
                    <Link href={`/purchases/${purchase.id}/edit`}>
                      <Button variant="outline" size="sm">Edit</Button>
                    </Link>
                    <Button variant="outline" size="sm" onClick={() => handleDelete(purchase.id)}>Delete</Button>
                  </div>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
      {hasNextPage && (
        <div className="mt-4 flex justify-center">
          <Button
            onClick={() => fetchNextPage()}
            disabled={isFetchingNextPage || !hasNextPage}
          >
            {isFetchingNextPage ? 'Loading more...' : 'Load More'}
          </Button>
        </div>
      )}
    </div>
  )
}

