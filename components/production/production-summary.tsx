import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ProductionStatus = 'processing' | 'cutting' | 'sticking' | 'lasting' | 'finishing' | 'delivery' | 'done'

type Production = {
  id: number
  date: string
  cost: number
  status: ProductionStatus
}

type ProductionSummaryProps = {
  productions: Production[]
}

export function ProductionSummary({ productions }: ProductionSummaryProps) {
  const statusCounts = productions.reduce((acc, production) => {
    acc[production.status] = (acc[production.status] || 0) + 1
    return acc
  }, {} as Record<ProductionStatus, number>)

  const statuses: ProductionStatus[] = ['processing', 'cutting', 'sticking', 'lasting', 'finishing', 'delivery', 'done']

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {statuses.map(status => (
        <Card key={status}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium capitalize">{status}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statusCounts[status] || 0}</div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}

