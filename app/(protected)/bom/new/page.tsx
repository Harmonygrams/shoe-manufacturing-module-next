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

type Product = {
  id : string; 
  name : string;
}
type BOMItem = {
  materialId: string
  quantity: number, 
}

type Material = {
  id: string
  name: string
  unit: string
  cost: number
}

export default function AddBOMPage() {
  const [selectedProduct, setSelectedProduct] = useState<string>('')
  const [isLoading, setIsLoading] = useState<boolean>(false)
  const [products, setProducts] = useState<Product[]>([])
  const [ totalCost, setTotalCost ] = useState<number>(0)
  const [bomList, setBomList] = useState<BOMItem[]>([])
  const [materials, setMaterials] = useState<Material[]>([])
  const [quantity, setQuantity] = useState<number>(1)
  const [bomDate, setBomDate] = useState<Date | undefined>(new Date())
  const productQuery = useQuery({
    queryKey : ['PRODUCTS'],
    queryFn : async () => {
      const fetchProducts = await fetch('http://localhost:5001/api/v1/products', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchProducts.ok){
        const fetchProductsMaterial = await fetchProducts.json()
        return fetchProductsMaterial
      }
    }
  })
  const rawMaterialQuery = useQuery({
    queryKey : ['RAW_MATERIAL'],
    queryFn : async () => {
      const fetchMaterials = await fetch('http://localhost:5001/api/v1/materials', { method : 'GET', headers : { 'Content-Type' : 'Application/json'}})
      if(fetchMaterials.ok){ 
        const fetchMaterialsJson = await fetchMaterials.json()
        return fetchMaterialsJson
      }
    }
  })
  function addBOMItem () {
    setBomList([...bomList, { materialId: '', quantity: 1 }])
  }

  function removeBOMItem (index: number) {
    const newBomItems = [...bomList]
    newBomItems.splice(index, 1)
    setBomList(newBomItems)
  }

  function updateBOMItem (index: number, field: keyof BOMItem, value: string | number) {
    const newBomItems = [...bomList]
    //get the cost price of the item with the id in the array 
    newBomItems[index] = { ...newBomItems[index], [field]: value }
    setBomList(newBomItems)
  }

  function getMaterial (materialId: string): Material | undefined {
    return materials.find(m => m.id === materialId)
  }
  function calculateTotalMaterialCost(materialId: string, quantity: number): number {
    const material = getMaterial(materialId)
    if (material) {
      return material.cost * quantity
    }
    return 0
  }
  function getTotalCost (): number {
    return bomList.reduce((total, item) => {
      return total + calculateTotalMaterialCost(item.materialId, item.quantity)
    }, 0)
  }

  async function  handleSaveBOM () {
    setIsLoading(true)
    const saveBom = await fetch('http://localhost:5001/api/v1/bom', { method : 'POST', body : JSON.stringify({bomList, quantity, bomDate, productId : selectedProduct,}), headers : { 'Content-Type' : 'Application/json'}})
    if(saveBom.ok){
      await saveBom.json()
      window.location.href = "/bom"
      setIsLoading(false);
    }
    setIsLoading(false); 
  }
  useEffect(() => {
    if(productQuery.isSuccess) {
        setProducts(productQuery.data)
    }
    if(rawMaterialQuery.isSuccess){
      setMaterials(rawMaterialQuery.data)
    }
  }, [productQuery, rawMaterialQuery])
  useEffect(() => {
    const totalCost = getTotalCost();
    setTotalCost(totalCost);
  }, [bomList])
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Add Bill of Materials (BOM)</h1>

      <div className="space-y-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex flex-col space-y-1.5">
            <Label htmlFor="bomDate">BOM Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
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
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
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
                        <Select value={item.materialId} onValueChange={(value) => updateBOMItem(index, 'materialId', value)}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select material" />
                          </SelectTrigger>
                          <SelectContent>
                            {materials.map(material => (
                              <SelectItem key={material.id} value={material.id}>{material.name}</SelectItem>
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
                      <TableCell>${material?.cost.toFixed(2)}</TableCell>
                      <TableCell>${totalCost.toFixed(2)}</TableCell>
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
          />
        </div>
        <Card>
          <CardContent className="p-4">
            <h3 className="text-lg font-semibold mb-2">Cost Breakdown</h3>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span>Total cost per unit:</span>
                <span>${totalCost.toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold">
                <span>Total production cost:</span>
                <span>${(totalCost * (Number.isNaN(quantity) ? 0 : quantity)).toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <div className="flex justify-end space-x-2">
        <Button onClick={handleSaveBOM}>{isLoading ? "Saving" : "Save BOM"}</Button>
      </div>
    </div>
  )
}

