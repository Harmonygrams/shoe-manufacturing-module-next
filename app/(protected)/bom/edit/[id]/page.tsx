'use client'

import React, { useState, useEffect } from 'react'
import { Plus, Minus, CalendarIcon } from 'lucide-react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent } from "@/components/ui/card"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { useQuery } from '@tanstack/react-query'
import { formatCurrency } from '@/helpers/currencyFormat'
import { baseUrl } from '@/utils/baseUrl'
import { useToast } from '@/hooks/use-toast'
import { useParams } from 'next/navigation'
import { Skeleton } from "@/components/ui/skeleton"

type ErrorMessage = {
  message: string;
}

type Product = {
  id: string;
  name: string;
}

type BOMItem = {
  materialId: string;
  quantity: number;
}

type Material = {
  id: string;
  name: string;
  unit: string;
  cost: number;
}

type Bom = {
  id: number;
  productName: string;
  bomDate: Date;
  productId: string;
  bomList: [{
    quantityNeed: number;
    cost: number;
    materialId: string;
  }]
}

function BomFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
        <div className="space-y-2">
          <Skeleton className="h-5 w-20" />
          <Skeleton className="h-10 w-full" />
        </div>
      </div>

      <Card>
        <CardContent className="p-4">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <Skeleton className="h-6 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-16" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-12" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead>
                    <Skeleton className="h-4 w-20" />
                  </TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[1, 2].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Skeleton className="h-10 w-full" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-10 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-12" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-4 w-20" />
                    </TableCell>
                    <TableCell>
                      <Skeleton className="h-8 w-8" />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-10 w-full" />
        </div>
        <Card>
          <CardContent className="p-4 space-y-4">
            <Skeleton className="h-6 w-32" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function BomNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-12">
      <h2 className="text-2xl font-semibold mb-4">Bill of Material Not Found</h2>
      <p className="text-gray-500 mb-6">The requested BOM could not be found or has been deleted.</p>
      <Button asChild>
        <a href="/bom">Return to BOM List</a>
      </Button>
    </div>
  )
}

export default function EditBomPage() {
  const { toast } = useToast()
  const { id } = useParams()
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [bomId, setBomId] = useState<number | null>(null)
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [totalCost, setTotalCost] = useState<number>(0)
  const [bomList, setBomList] = useState<BOMItem[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [bomDate, setBomDate] = useState<Date | undefined>(new Date())

  const { data: bomData, isLoading: isBomLoading, isError: isBomError } = useQuery({
    queryKey: ['bom', id],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/bom/${id}`)
      if (!response.ok) {
        throw new Error('BOM not found')
      }
      return response.json() as Promise<Bom>
    }
  })

  const { data: productsData, isSuccess: isProductsSuccess } = useQuery({
    queryKey: ['PRODUCTS'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/products`)
      if (!response.ok) {
        throw new Error('Failed to fetch products')
      }
      return response.json() as Promise<Product[]>
    }
  })

  const { data: materialsData, isSuccess: isMaterialsSuccess } = useQuery({
    queryKey: ['rawMaterials'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/materials`)
      if (!response.ok) {
        throw new Error('Failed to fetch materials')
      }
      return response.json() as Promise<Material[]>
    }
  })

  function addBOMItem() {
    setBomList([...bomList, { materialId: '', quantity: 1 }])
  }

  function removeBOMItem(index: number) {
    const newBomItems = [...bomList]
    newBomItems.splice(index, 1)
    setBomList(newBomItems)
  }

  function updateBOMItem(index: number, field: keyof BOMItem, value: string | number) {
    const newBomItems = [...bomList]
    newBomItems[index] = { ...newBomItems[index], [field]: value }
    setBomList(newBomItems)
  }

  function getMaterial(materialId: string): Material | undefined {
    return materials.find(m => m.id === materialId)
  }

  function calculateTotalMaterialCost(materialId: string, quantity: number): number {
    const material = getMaterial(materialId)
    if (material) {
      return material.cost * quantity
    }
    return 0
  }

  function getTotalCost(): number {
    return bomList.reduce((total, item) => {
      return total + calculateTotalMaterialCost(item.materialId, item.quantity)
    }, 0)
  }

  async function handleUpdateBom() {
    setIsLoading(true)
    const payload = JSON.stringify({ bomList, quantity, bomDate, productId: selectedProduct, bomId })
    try {
      const response = await fetch(`${baseUrl()}/bom/${id}`, {
        method: 'PUT',
        body: payload,
        headers: { 'Content-Type': 'Application/json' }
      })
      
      if (response.ok) {
        await response.json()
        toast({
          title: "Bill of materials updated successfully"
        })
        window.location.href = "/bom"
      } else {
        const errorMessage = await response.json() as ErrorMessage
        toast({
          title: errorMessage.message,
          variant: 'destructive'
        })
      }
    } catch (error) {
      toast({
        title: "Failed to update BOM",
        description: "An unexpected error occurred",
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (bomData) {
      const { bomDate, productId, bomList, id } = bomData
      setBomDate(new Date(bomDate))
      const bomListItems = bomList.map(item => ({
        materialId: item.materialId,
        quantity: item.quantityNeed
      }))
      setBomList(bomListItems)
      setSelectedProduct(productId)
      setBomId(id)
    }
  }, [bomData, getTotalCost])

  useEffect(() => {
    if (isProductsSuccess && productsData) {
      setProducts(productsData)
    }
    if (isMaterialsSuccess && materialsData) {
      setMaterials(materialsData)
    }
  }, [isProductsSuccess, isMaterialsSuccess, productsData, materialsData])

  useEffect(() => {
    const totalCost = getTotalCost()
    setTotalCost(totalCost)
  }, [bomList, getTotalCost])

  if (isBomLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Edit Bill of Materials (BOM)</h1>
        <BomFormSkeleton />
      </div>
    )
  }

  if (isBomError || !bomData) {
    return (
      <div className="container mx-auto px-4 py-8">
        <BomNotFound />
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Edit Bill of Materials (BOM)</h1>

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="bomDate">BOM Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  disabled={isLoading}
                  variant={"outline"}
                  className={cn(
                    "w-full justify-start text-left font-normal",
                    !bomDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {bomDate ? format(bomDate, "PPP") : <span>Pick a date</span>}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={bomDate}
                  onSelect={setBomDate}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="product">Product</Label>
            <Select 
              value={selectedProduct} 
              onValueChange={setSelectedProduct} 
              disabled={isLoading}
            >
              <SelectTrigger id="product">
                <SelectValue placeholder="Select a product" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold">Materials</h2>
          <Button onClick={addBOMItem} size="sm">
            <Plus className="mr-2 h-4 w-4" /> Add Material
          </Button>
        </div>
        <Card>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Material</TableHead>
                  <TableHead>Quantity</TableHead>
                  <TableHead>Unit</TableHead>
                  <TableHead>Cost/Unit</TableHead>
                  <TableHead>Total Cost</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {bomList.map((item, index) => {
                  const material = getMaterial(item.materialId)
                  const totalCost = calculateTotalMaterialCost(item.materialId, item.quantity)
                  return (
                    <TableRow key={index}>
                      <TableCell>
                        <Select 
                          value={item.materialId} 
                          onValueChange={(value) => updateBOMItem(index, 'materialId', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(material => (
                              <SelectItem key={material.id} value={material.id}>
                                {material.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </TableCell>
                      <TableCell>
                        <Input 
                          type="number" 
                          value={item.quantity} 
                          onChange={(e) => updateBOMItem(index, 'quantity', parseFloat(e.target.value))}
                          min={0}
                          className="w-20"
                        />
                      </TableCell>
                      <TableCell>{material?.unit}</TableCell>
                      <TableCell>{formatCurrency(material?.cost || 0)}</TableCell>
                      <TableCell>{formatCurrency(totalCost)}</TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => removeBOMItem(index)}>
                          <Minus className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <div>
          <Label htmlFor="quantity" className="text-sm font-medium text-gray-700">Production Quantity</Label>
          <Input 
            id="quantity" 
            type="number" 
            value={quantity} 
            onChange={(e) => setQuantity(parseInt(e.target.value))}
            min={1}
            className="mt-1"
            disabled ={true}
          />
        </div>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Cost Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total cost per unit:</span>
                <span>{formatCurrency(totalCost)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total production cost:</span>
                <span>{formatCurrency((totalCost * (Number.isNaN(quantity) ? 0 : quantity)))}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end space-x-2">
        <Button disabled={isLoading} onClick={handleUpdateBom}>{isLoading ? "Updating" : "Update BOM"}</Button>
      </div>
    </div>
  )
}

