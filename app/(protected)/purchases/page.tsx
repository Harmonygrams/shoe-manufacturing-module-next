import { Suspense } from 'react'
import Link from 'next/link'
import { PurchaseList } from '@/components/purchases/purchase-list'
import { PurchaseFilters } from '@/components/purchases/purchase-filters'
import { Button } from "@/components/ui/button"

export default function PurchasesPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Purchases</h1>
        <Link href="/purchases/new">
          <Button>Add New Purchase</Button>
        </Link>
      </div>
      <Suspense fallback={<div>Loading...</div>}>
        <PurchaseFilters />
      </Suspense>
      <Suspense fallback={<div>Loading...</div>}>
        <PurchaseList />
      </Suspense>
    </div>
  )
}

