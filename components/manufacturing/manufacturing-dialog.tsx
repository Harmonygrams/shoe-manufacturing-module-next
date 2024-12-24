import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Skeleton } from "@/components/ui/skeleton"
import { useQuery, useQueryClient } from "@tanstack/react-query"
import { baseUrl } from "@/utils/baseUrl"
import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

type ProductionProduct = {
  productName: string
  size: string
  color: string
  quantity: number
  pendingQuantity: number
  remainingQuantity: number
  unitCost: number
  unit: string
}

type Production = {
  id: number
  date: string
  status: string
  manufacturingCosts: any[]
  products: ProductionProduct[]
}

interface ProductionDetailsDialogProps {
  productionId: number | null
  isOpen: boolean
  onClose: () => void
}

export function ProductionDetailsDialog({ productionId, isOpen, onClose }: ProductionDetailsDialogProps) {
  const router = useRouter()
  const queryClient = useQueryClient()

  const { data: production, isLoading, error } = useQuery<Production>({
    queryKey: ['production', productionId],
    queryFn: async () => {
      if (!productionId) return null
      const response = await fetch(`${baseUrl()}/manufacturing/${productionId}`)
      if (!response.ok) throw new Error('Failed to fetch production')
      return response.json()
    },
    enabled: !!productionId && isOpen,
  })

  const handleClose = async () => {
    // First invalidate and refetch queries
    await queryClient.invalidateQueries({
      queryKey: ['productions'],
      refetchType: 'all'
    })
    
    await queryClient.refetchQueries({
      queryKey: ['productions'],
      type: 'active'
    })

    // Close dialog
    onClose()
    
    // Refresh the page
    window.location.href = "/manufacturing"
  }

  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) handleClose()
      }}
    >
      <DialogContent className="max-w-4xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Production Details #{productionId}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="text-red-500">Error loading production details</div>
        ) : production ? (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium">Date</label>
                <p>{new Date(production.date).toLocaleDateString()}</p>
              </div>
              <div>
                <label className="text-sm font-medium">Status</label>
                <p>{production.status}</p>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-semibold mb-2">Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr>
                      <th className="text-left py-2">Product</th>
                      <th className="text-left py-2">Size</th>
                      <th className="text-left py-2">Color</th>
                      <th className="text-right py-2">Quantity</th>
                      <th className="text-right py-2">Pending</th>
                      <th className="text-right py-2">Remaining</th>
                    </tr>
                  </thead>
                  <tbody>
                    {production.products.map((product, index) => (
                      <tr key={index}>
                        <td className="py-2">{product.productName}</td>
                        <td className="py-2">{product.size}</td>
                        <td className="py-2">{product.color}</td>
                        <td className="text-right py-2">{product.quantity}</td>
                        <td className="text-right py-2">{product.pendingQuantity}</td>
                        <td className="text-right py-2">{product.remainingQuantity}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}