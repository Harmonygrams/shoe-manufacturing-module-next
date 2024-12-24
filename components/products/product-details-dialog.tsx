import { useState, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Skeleton } from "@/components/ui/skeleton"
import { formatCurrency } from '@/helpers/currencyFormat'
import { useQuery } from '@tanstack/react-query'

type ProductDetails = {
  id: number;
  name: string;
  description: string;
  selling_price: string;
  unit: {
    name: string;
    symbol: string;
  };
  sizes: {
    size: string;
    quantity: number;
    cost: number;
    transaction_summary: {
      total_opening_stock: number;
      total_purchases: number;
      total_sales: number;
      total_adjustments: number;
    };
  }[];
  bill_of_materials: {
    date: string;
    quantity: string;
    materials: {
      material: string;
      quantityNeeded: string;
      quantityAvailable: number;
    }[];
  }[];
}

type ProductDetailsDialogProps = {
  productId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDetailsDialog({ productId, isOpen, onClose }: ProductDetailsDialogProps) {
  const { data: product, isLoading, error } = useQuery<ProductDetails>({
    queryKey: ['PRODUCT_DETAILS', productId],
    queryFn: async () => {
      if (!productId) return null;
      const response = await fetch(`http://localhost:5001/api/v1/products/${productId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch product details');
      }
      return response.json();
    },
    enabled: !!productId,
  });

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isLoading ? 'Loading...' : product?.name}</DialogTitle>
        </DialogHeader>
        {isLoading ? (
          <ProductDetailsSkeleton />
        ) : error ? (
          <div>Error loading product details. Please try again.</div>
        ) : product ? (
          <div className="space-y-6">
            <div>
              <p><strong>Description:</strong> {product.description || 'N/A'}</p>
              <p><strong>Unit:</strong> {product.unit.name} ({product.unit.symbol})</p>
              <p><strong>Selling Price:</strong> {formatCurrency(parseFloat(product.selling_price))}</p>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Sizes and Inventory</h3>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Size</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Cost</TableHead>
                    <TableHead>Opening Stock</TableHead>
                    <TableHead>Purchases</TableHead>
                    <TableHead>Sales</TableHead>
                    <TableHead>Adjustments</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {product.sizes.map((size, index) => (
                    <TableRow key={index}>
                      <TableCell>{size.size}</TableCell>
                      <TableCell>{size.quantity}</TableCell>
                      <TableCell>{formatCurrency(size.cost)}</TableCell>
                      <TableCell>{size.transaction_summary.total_opening_stock}</TableCell>
                      <TableCell>{size.transaction_summary.total_purchases}</TableCell>
                      <TableCell>{size.transaction_summary.total_sales}</TableCell>
                      <TableCell>{size.transaction_summary.total_adjustments}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">Bill of Materials</h3>
              {product.bill_of_materials.map((bom, bomIndex) => (
                <div key={bomIndex} className="mb-4">
                  <p><strong>Date:</strong> {new Date(bom.date).toLocaleDateString()}</p>
                  <p><strong>Quantity:</strong> {bom.quantity}</p>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Material</TableHead>
                        <TableHead>Quantity Needed</TableHead>
                        <TableHead>Quantity Available</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {bom.materials.map((material, materialIndex) => (
                        <TableRow key={materialIndex}>
                          <TableCell>{material.material}</TableCell>
                          <TableCell>{material.quantityNeeded}</TableCell>
                          <TableCell>{material.quantityAvailable}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

function ProductDetailsSkeleton() {
  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-4 w-1/2" />
        <Skeleton className="h-4 w-1/4" />
      </div>
      
      <div>
        <Skeleton className="h-6 w-1/4 mb-2" />
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
      </div>
      
      <div>
        <Skeleton className="h-6 w-1/4 mb-2" />
        <div className="space-y-4">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-1/4" />
              <Skeleton className="h-4 w-1/6" />
              <div className="space-y-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

