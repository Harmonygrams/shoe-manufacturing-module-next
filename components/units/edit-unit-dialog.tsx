'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger, SheetFooter } from "@/components/ui/sheet"
import { Textarea } from "@/components/ui/textarea"
import { baseUrl } from '@/utils/baseUrl'
import { useToast } from '@/hooks/use-toast'
import { useQueryClient } from '@tanstack/react-query'

interface UnitData {
    id: number;
    name: string;
    description: string;
    symbol: string;
}

interface EditUnitSheetProps {
    unitData: UnitData;
    setIsOpen: (isOpen: boolean) => void;
}

export default function EditUnitSheet({ unitData, setIsOpen }: EditUnitSheetProps) {
    const [error, setError] = useState<string | null>(null); 
    const [loading, setLoading] = useState(false); 
    const { toast } = useToast(); 
    const [unit, setUnit] = useState({
        name: unitData.name,
        description: unitData.description,
        symbol: unitData.symbol
    })
    const queryClient = useQueryClient()

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target
        setUnit(prev => ({ ...prev, [name]: value }))
    }

    async function handleSubmit (e: React.FormEvent) {
        setLoading(true); 
        e.preventDefault()
        // Here you would typically send the data to your backend
        const updateUnitInDb = await fetch(`${baseUrl()}/units/${unitData.id}`, { 
            method: 'PUT', 
            body: JSON.stringify(unit), 
            headers: { 'Content-Type': 'Application/json' }
        })
        if(updateUnitInDb.ok){
                setIsOpen(false)
                setLoading(false); 
                toast({
                    title: 'Unit updated successfully'
                })
                queryClient.invalidateQueries(["UNITS"])
        } else {
            const errorMessage = await updateUnitInDb.json()
            setError(errorMessage.message)
            setLoading(false);
        }
    }

    return (
        <Sheet open={true} onOpenChange={(isOpen) => setIsOpen(isOpen)}>
            <SheetTrigger asChild>
                <Button onClick={() => setIsOpen(true)}>
                    Unit Unit
                </Button>
            </SheetTrigger>
            <Button onClick={() => setIsOpen(false)} className="absolute top-4 right-4">
                Close
            </Button>
            <SheetContent className="sm:max-w-[540px]">
                <SheetHeader>
                    <SheetTitle>Edit Unit</SheetTitle>
                    <SheetDescription>
                        Update the details of the unit. Click save when you&apos;re done.
                    </SheetDescription>
                </SheetHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Unit Name</Label>
                        <Input
                            id="name"
                            name="name"
                            value={unit.name}
                            onChange={handleInputChange}
                            placeholder="Enter unit name"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                                <Label htmlFor="symbol">Symbol</Label>
                                <Input
                                id="symbol"
                                name="symbol"
                                type="text"
                                value={unit.symbol}
                                onChange={handleInputChange}
                                placeholder="Enter unit symbol"
                                required
                                />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="description">Description</Label>
                        <Textarea
                            id="description"
                            name="description"
                            value={unit.description}
                            onChange={handleInputChange}
                            placeholder="Enter unit description"
                            rows={3}
                        />
                    </div>
                    <SheetFooter>
                        <div className="fixed bottom-0 right-0 w-full sm:max-w-[540px] bg-background border-t p-4 flex justify-end space-x-2">
                            <Button disabled={loading} type="submit">Update Unit</Button>
                        </div>
                    </SheetFooter>
                </form>
            </SheetContent>
        </Sheet>
    )
}