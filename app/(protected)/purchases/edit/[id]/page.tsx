'use client'
import { useEffect, useState } from 'react'
import { Plus, Search, X } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { useMutation, useQuery } from '@tanstack/react-query'
import { toast } from '@/hooks/use-toast'
import { formatCurrency } from '@/helpers/currencyFormat'
import { baseUrl } from '@/utils/baseUrl'
import { useParams } from 'next/navigation'
type Supplier = {
  id: string;
  supplierName: string;
}

type RawMaterial = {
  id: string;
  name: string;
  cost: number;
  unit : string;
}

type PurchaseItem = {
  materialId: string;
  name: string;
  quantity: number;
  cost: number;
}
type PurchaseItemFetched = {
  materialId: string;
  materialName: string;
  quantity: number;
  unitCost: number;
}

type Purchase = {
  purchaseId : string;
  supplierId: string;
  purchaseDate: Date | undefined;
  rawMaterials: PurchaseItem[];
}
type FetchedPurchase = {
  id : number; 
  date : Date; 
  supplier : Supplier,
  materials : PurchaseItemFetched[]
}
export default function AddPurchasesPage() {
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [supplier, setSupplier] = useState<string>('')
  const [purchaseDate, setPurchaseDate] = useState<Date | undefined>(new Date())
  const [status, setStatus] = useState('completed')
  const [rawMaterialSearch, setRawMaterialSearch] = useState('')
  const [selectedItems, setSelectedItems] = useState<PurchaseItem[]>([])
  const { id } = useParams()
  //Fetch the current purchase details 
  const fetchPurchase = useQuery({
    queryKey : ['purchase'],
    queryFn : async () => {
      const  fetchPurchase = await fetch(`${baseUrl()}/purchases/${id}`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if(fetchPurchase.ok){
        const fetchPurchaseJson = await fetchPurchase.json() as FetchedPurchase;
        return fetchPurchaseJson
      }
    }
  })
  // Fetch suppliers from db 
  const { data: suppliers = [] } = useQuery<Supplier[]>({
    queryKey: ['SUPPLIERS'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/suppliers`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (response.ok) {
        return response.json()
      }
      throw new Error('Failed to fetch suppliers')
    }
  })

  // Fetch raw materials from db
  const { data: rawMaterials = [] } = useQuery<RawMaterial[]>({
    queryKey: ['RAW_MATERIALS'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/materials`, { method: 'GET', headers: { 'Content-Type': 'application/json' } })
      if (response.ok) {
        return response.json()
      }
      throw new Error('Failed to fetch raw materials')
    }
  })

  const savePurchaseToDb = useMutation({
    mutationFn: async (payload: string) => {
      setIsLoading(true)
      const response = await fetch(`${baseUrl()}/purchases/${id}`, { 
        method: 'PUT', 
        body: payload, 
        headers: { 'Content-Type': 'application/json' }
      })
      if (!response.ok) {
        const errorData = await response.json()
        console.log(errorData)
        throw new Error(errorData.message || 'An error occurred while saving the purchase')
      }
      return response.json()
    },
    onSuccess: () => {
      setIsLoading(false)
      toast({
        title: "Purchase added successfully"
      })
      setTimeout(() => {
        window.location.href = '/purchases'
      }, 1000)
    },
    onError: (error: Error) => {
      setIsLoading(false)
      toast({
        title: "An error occurred",
        description: error.message,
        variant: "destructive"
      })
    }
  })

  async function handleSavePurchase() {
    const purchaseData: Purchase = {
      purchaseId : id as string,
      supplierId: supplier,
      purchaseDate: purchaseDate,
      rawMaterials: selectedItems
    }

    savePurchaseToDb.mutate(JSON.stringify(purchaseData))
  }

  const filteredRawMaterials = rawMaterials.filter(material =>
    material.name.toLowerCase().includes(rawMaterialSearch.toLowerCase())
  )

  const addRawMaterial = (rawMaterialId: string) => {
    const rawMaterial = rawMaterials.find(rm => rm.id === rawMaterialId)
    if (rawMaterial) {
      setSelectedItems([...selectedItems, {
        materialId: rawMaterial.id,
        name: rawMaterial.name,
        quantity: 1,
        cost: rawMaterial.cost
      }])
    }
    setRawMaterialSearch('')
  }

  const updatePurchaseItem = (index: number, field: keyof PurchaseItem, value: string | number) => {
    const newSelectedItems = [...selectedItems]
    newSelectedItems[index][field] = value as never
    setSelectedItems(newSelectedItems)
  }

  const removePurchaseItem = (index: number) => {
    const newSelectedItems = [...selectedItems]
    newSelectedItems.splice(index, 1)
    setSelectedItems(newSelectedItems)
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + item.quantity * item.cost, 0)
  }

  const calculateTotalQuantity = () => {
    return selectedItems.reduce((sum, item) => sum + item.quantity, 0)
  }
  useEffect(() => {
    if(fetchPurchase.data){
      const { supplier, date, materials } = fetchPurchase.data
      setSupplier(supplier.id)
      setPurchaseDate(new Date(date))
      const processedMaterials = materials.map(material => ({materialId : material.materialId, quantity : material.quantity, cost : material.unitCost, name : material.materialName}))
      setSelectedItems(processedMaterials)
    }
  }, [fetchPurchase.isSuccess, fetchPurchase.data])
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Purchase</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div>
          <Label htmlFor="supplier">Supplier</Label>
          <Select value={supplier} onValueChange={setSupplier}>
            <SelectTrigger id="supplier">
              <SelectValue placeholder="Select supplier" />
            </SelectTrigger>
            <SelectContent>
              {suppliers.map((s) => (
                <SelectItem key={s.id} value={s.id}>{s.supplierName}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="date">Purchase Date</Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={`w-full justify-start text-left font-normal ${!purchaseDate && "text-muted-foreground"}`}
              >
                {purchaseDate ? format(purchaseDate, "PPP") : <span>Pick a date</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={purchaseDate}
                onSelect={setPurchaseDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>

        <div>
          <Label htmlFor="status">Status</Label>
          <Select value={status} onValueChange={setStatus} disabled>
            <SelectTrigger id="status">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="processing">Processing</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="mb-6 relative">
        <Label htmlFor="rawMaterialSearch" className="text-lg font-semibold mb-2 block">Search for raw material</Label>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            id="rawMaterialSearch"
            type="text"
            placeholder="Type to search for raw material..."
            value={rawMaterialSearch}
            onChange={(e) => setRawMaterialSearch(e.target.value)}
            className="pl-10 py-2 text-lg"
          />
        </div>
        {rawMaterialSearch && (
          <div className="absolute z-10 mt-1 w-full bg-white border rounded-md shadow-lg max-h-60 overflow-y-auto">
            {filteredRawMaterials.length > 0 ? (
              filteredRawMaterials.map(material => (
                <div
                  key={material.id}
                  className="p-2 hover:bg-gray-100 cursor-pointer"
                  onClick={() => addRawMaterial(material.id)}
                >
                  {material.name}
                </div>
              ))
            ) : (
              <div className="p-2 text-gray-500">No matching raw materials found</div>
            )}
          </div>
        )}
      </div>

      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Purchase Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Raw Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Cost</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedItems.map((item, index) => (
                  <TableRow key={index}>
                    <TableCell>{item.name}</TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updatePurchaseItem(index, 'quantity', parseFloat(e.target.value))}
                        min={0}
                        step={1}
                      />
                    </TableCell>
                    <TableCell>
                      <Input
                        type="number"
                        value={item.cost}
                        onChange={(e) => updatePurchaseItem(index, 'cost', parseFloat(e.target.value))}
                        min={0}
                        step={0.01}
                      />
                    </TableCell>
                    <TableCell>{formatCurrency(item.quantity * item.cost)}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm" onClick={() => removePurchaseItem(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <div className="mt-6 bg-gray-50 p-6 rounded-lg shadow">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center">
          <div className="w-full md:w-auto order-2 md:order-1">
            <p className="text-lg"><span className="font-semibold">Total Quantity:</span> {calculateTotalQuantity()}</p>
            <p className="text-2xl font-bold mt-2"><span>Total Cost:</span> {formatCurrency(calculateTotal())}</p>
          </div>
          <div className="w-full md:w-auto order-1 md:order-2 mb-4 md:mb-0">
            <Button className="w-full md:w-auto" onClick={handleSavePurchase} disabled={isLoading}>
              {isLoading ? "Updating..." : "Update Purchase"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

