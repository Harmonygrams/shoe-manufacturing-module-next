import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { Info } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { useQuery } from "@tanstack/react-query"
import { formatCurrency } from "@/helpers/currencyFormat"

type BomListItem = {
    id: string;
    name: string;
    quantityNeed: number;
    unitName: string;
    cost: number;
}

type Props = {
    props: {
        productId: string | null;
    },
    selectedBOM: string | null;
    handleCloseBOMDetail: () => void;
}

type BomItem = {
    productName: string;
    sku: string;
    description: string;
    bomList: BomListItem[];
}

export function BomView({ props, selectedBOM, handleCloseBOMDetail }: Props) {
  const { data: bomItem, refetch } = useQuery<BomItem>({
    queryKey: ['BOM_ITEMS'],
    enabled: false,
    queryFn: async () => {
      const fetchBomItem = await fetch(`http://localhost:5001/api/v1/bom/${props.productId}`, { method: 'GET', headers: { 'Content-Type': 'Application/json' } })
      if (fetchBomItem.ok) {
        const fetchBomItemJson = await fetchBomItem.json()
        console.log('here is fetched bom ', fetchBomItemJson)
        return fetchBomItemJson
      }
    }
  })

  function computeTotal() {
    const total = bomItem?.bomList.reduce((sum, material) => sum + material.quantityNeed * material.cost, 0)
    if (total) {
      return formatCurrency(total)
    }
    return formatCurrency(0)
  }

  useEffect(() => {
    if (props.productId) {
      refetch()
    }
  }, [props, refetch])

  return (
    <div>
      <Dialog open={selectedBOM !== null} onOpenChange={handleCloseBOMDetail}>
        <DialogContent className="max-w-4xl">
          <DialogHeader>
            <DialogTitle>BOM Details: {bomItem?.productName}</DialogTitle>
            <DialogDescription>
              SKU: {bomItem?.sku}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <h3 className="text-lg font-semibold mb-2">Product Description</h3>
            <p>{bomItem?.description}</p>
          </div>
          <div className="mt-6">
            <h3 className="text-lg font-semibold mb-2">Materials Breakdown</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead key="header-name">Material Name</TableHead>
                  <TableHead key="header-quantity">Quantity Required</TableHead>
                  <TableHead key="header-unit">Unit</TableHead>
                  <TableHead key="header-cost">Cost</TableHead>
                  <TableHead key="header-total">Total Cost</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomItem?.bomList.map((material) => (
                  <TableRow key={`row-${material.id}`}>
                    <TableCell key={`name-${material.id}`}>{material.name}</TableCell>
                    <TableCell key={`quantity-${material.id}`}>{material.quantityNeed}</TableCell>
                    <TableCell key={`unit-${material.id}`}>{material.unitName}</TableCell>
                    <TableCell key={`cost-${material.id}`}>{formatCurrency(material.cost)}</TableCell>
                    <TableCell key={`total-${material.id}`}>{formatCurrency(material.cost * material.quantityNeed)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <div className="mt-6 flex justify-between items-center">
            <div>
              <h3 className="text-lg font-semibold">BOM Cost Summary</h3>
              <p>Total Material Cost per Unit: {computeTotal()}</p>
            </div>
            <div className="space-x-2">
              <Button>
                Update BOM
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="fixed bottom-4 right-4">
              <Info className="h-4 w-4" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>BOM: Bill of Materials</p>
            <p>A comprehensive list of raw materials, components, and instructions required to manufacture a product.</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
    </div>
  )
}