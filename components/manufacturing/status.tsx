import { Badge } from "@/components/ui/badge"

type StatusProps = {
  status: 'cutting' | 'sticking' | 'lasting' | 'finished'
}

const statusConfig = {
  cutting: { label: 'Cutting', color: 'bg-yellow-500' },
  sticking: { label: 'Sticking', color: 'bg-orange-500' },
  lasting: { label: 'Lasting', color: 'bg-purple-500' },
  finished: { label: 'Finished', color: 'bg-green-500' },
}

export function Status({ status }: StatusProps) {
  const { label, color } = statusConfig[status]
  return (
    <Badge className={`${color} text-white`}>
      {label}
    </Badge>
  )
}

