'use client'

import { useQuery } from '@tanstack/react-query'
import { Skeleton } from "@/components/ui/skeleton"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatCurrency } from '@/helpers/currencyFormat'

interface Purchase {
  id: number
  date: string
  createdAt: string
  supplier: {
    id: number
    name: string
    email: string
    phone: string
    address: string
  }
  materials: Array<{
    id: number
    materialId: number
    materialName: string
    quantity: number
    remainingQuantity: number
    unitCost: number
    totalCost: number
    usedQuantity: number
  }>
  summary: {
    totalCost: number
    totalItems: number
    totalQuantity: number
    remainingQuantity: number
  }
}

interface PurchaseDialogProps {
  id: string
  onClose: () => void
}

export function PurchaseDialog({ id, onClose }: PurchaseDialogProps) {
  const { data: purchase, isLoading, isError } = useQuery<Purchase>({
    queryKey: ['purchase', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5001/api/v1/purchases/${id}`)
      if (!response.ok) {
        throw new Error('Failed to fetch purchase')
      }
      return response.json()
    },
  })

  if (isError) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-red-500">Failed to load purchase details. Please try again later.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600">Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px] lg:max-w-[1000px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Purchase Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <PurchaseDialogSkeleton />
        ) : purchase ? (
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">General Information</h3>
                <p><span className="font-medium">Date:</span> {new Date(purchase.date).toLocaleString()}</p>
                <p><span className="font-medium">Supplier:</span> {purchase.supplier.name}</p>
                <p><span className="font-medium">Address:</span> {purchase.supplier.address}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">Summary</h3>
                <p><span className="font-medium">Total Cost:</span> {formatCurrency(purchase.summary.totalCost)}</p>
                <p><span className="font-medium">Total Items:</span> {purchase.summary.totalItems}</p>
                <p><span className="font-medium">Total Quantity:</span> {purchase.summary.totalQuantity}</p>
                <p><span className="font-medium">Remaining Quantity:</span> {purchase.summary.remainingQuantity}</p>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Materials</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="p-2 text-left">Material</th>
                      <th className="p-2 text-right">Quantity</th>
                      <th className="p-2 text-right">Unit Cost</th>
                      <th className="p-2 text-right">Total Cost</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchase.materials.map((material) => (
                      <tr key={material.id} className="border-t">
                        <td className="p-2">{material.materialName}</td>
                        <td className="p-2 text-right">{material.quantity}</td>
                        <td className="p-2 text-right">{formatCurrency(material.unitCost)}</td>
                        <td className="p-2 text-right">{formatCurrency(material.totalCost)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex justify-end mt-4">
          <Button onClick={onClose} className="bg-orange-500 hover:bg-orange-600">Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function PurchaseDialogSkeleton() {
  return (
    <div className="grid gap-6 py-4">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-gray-50 p-4 rounded-lg">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
        <div className="bg-gray-50 p-4 rounded-lg">
          <Skeleton className="h-6 w-3/4 mb-4" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full mb-2" />
          <Skeleton className="h-4 w-full" />
        </div>
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
    </div>
  )
}

