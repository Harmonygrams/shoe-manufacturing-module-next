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
import { format } from 'date-fns'

interface Order {
  id: number
  customerId: number
  status: string
  orderDate: string
  products: OrderProduct[]
}

interface OrderProduct {
  productId: number
  productName: string
  colorName: string
  colorId: number
  quantity: string
  cost: string
  sizeId: number
  sizeName: string
}

interface ViewOrderDetailsProps {
  id: string
  onClose: () => void
}

export function ViewOrderDetails({ id, onClose }: ViewOrderDetailsProps) {
  const { data: order, isLoading, isError } = useQuery<Order>({
    queryKey: ['order', id],
    queryFn: async () => {
      const response = await fetch(`http://localhost:5001/api/v1/orders/${id}`)
      if (!response.ok) throw new Error('Failed to fetch order')
      return response.json()
    },
  })

  if (isError) {
    return (
      <Dialog open onOpenChange={onClose}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Error</DialogTitle>
          </DialogHeader>
          <div className="p-6">
            <p className="text-red-500">Failed to load order details.</p>
          </div>
          <div className="flex justify-end">
            <Button onClick={onClose}>Close</Button>
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[800px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Order Details</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <OrderDetailsSkeleton />
        ) : order ? (
          <div className="grid gap-6 py-4">
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-2">Order Information</h3>
              <p><span className="font-medium">Order ID:</span> {order.id}</p>
              <p><span className="font-medium">Date:</span> {format(new Date(order.orderDate), 'PPP')}</p>
              <p><span className="font-medium">Status:</span> 
                <span className={`ml-2 capitalize ${
                  order.status === 'pending' ? 'text-yellow-600' : 
                  order.status === 'completed' ? 'text-green-600' : 
                  'text-gray-600'
                }`}>
                  {order.status}
                </span>
              </p>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="text-lg font-semibold mb-4">Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full divide-y divide-gray-200">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-4 py-3 text-left text-sm font-medium">Product</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Size</th>
                      <th className="px-4 py-3 text-left text-sm font-medium">Color</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Quantity</th>
                      <th className="px-4 py-3 text-right text-sm font-medium">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {order.products.map((product, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3">{product.productName}</td>
                        <td className="px-4 py-3">{product.sizeName}</td>
                        <td className="px-4 py-3">{product.colorName}</td>
                        <td className="px-4 py-3 text-right">{product.quantity}</td>
                        <td className="px-4 py-3 text-right">{formatCurrency(parseFloat(product.cost))}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-gray-50">
                      <td colSpan={3} className="px-4 py-3 font-medium">Total</td>
                      <td className="px-4 py-3 text-right font-medium">
                        {order.products.reduce((sum, product) => sum + parseInt(product.quantity), 0)}
                      </td>
                      <td className="px-4 py-3 text-right font-medium">
                        {formatCurrency(order.products.reduce((sum, product) => 
                          sum + (parseFloat(product.cost) * parseInt(product.quantity)), 0
                        ))}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          </div>
        ) : null}
        <div className="flex justify-end mt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

function OrderDetailsSkeleton() {
  return (
    <div className="grid gap-6 py-4">
      <div className="bg-gray-50 p-4 rounded-lg">
        <Skeleton className="h-6 w-3/4 mb-4" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full mb-2" />
        <Skeleton className="h-4 w-full" />
      </div>
      <div className="bg-gray-50 p-4 rounded-lg">
        <Skeleton className="h-6 w-1/4 mb-4" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full mb-2" />
        <Skeleton className="h-20 w-full" />
      </div>
    </div>
  )
}