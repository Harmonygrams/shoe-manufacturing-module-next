import { Badge } from "@/components/ui/badge"

type StatusProps = {
  status: 'processing' | 'cutting' | 'sticking' | 'lasting' | 'finishing' | 'delivery' | 'done'
}

const statusConfig = {
  processing: { label: 'Processing', color: 'bg-blue-500' },
  cutting: { label: 'Cutting', color: 'bg-yellow-500' },
  sticking: { label: 'Sticking', color: 'bg-orange-500' },
  lasting: { label: 'Lasting', color: 'bg-purple-500' },
  finishing: { label: 'Finishing', color: 'bg-indigo-500' },
  delivery: { label: 'Delivery', color: 'bg-green-500' },
  done: { label: 'Done', color: 'bg-gray-500' },
}

export function Status({ status }: StatusProps) {
  console.log('here is the status')
  const { label, color } = statusConfig[status]
  return (
    <Badge className={`${color} text-white`}>
      {label}
    </Badge>
  )
}

