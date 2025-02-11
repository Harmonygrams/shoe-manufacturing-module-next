import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { baseUrl } from "@/utils/baseUrl";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/skeleton";
import { formatCurrency } from "@/helpers/currencyFormat";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

type ManufacturingCost = {
  id: number;
  name: string;
  cost: number;
};

type Production = {
  id: number;
  date: string;
  status: string;
  manufacturingCosts: ManufacturingCost[];
  totalCost: number;
  totalPairs: number;
};

interface UpdateProductionDialogProps {
  productionId: number | null;
  isOpen: boolean;
  onClose: () => void;
}

export function UpdateProductionDialog({ productionId, isOpen, onClose }: UpdateProductionDialogProps) {
  const router = useRouter();
  const [productionStatus, setProductionStatus] = useState<number>(1)
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [selectedCosts, setSelectedCosts] = useState<number[]>([]);

  // Fetch production details
  const { data: production, isLoading, error, refetch, isSuccess } = useQuery<Production>({
    queryKey: ["production", productionId],
    queryFn: async () => {
      if (!productionId) return null;
      const response = await fetch(`${baseUrl()}/manufacturing/update-metadata/${productionId}`);
      if (!response.ok) throw new Error("Failed to fetch production");
      return response.json();
    },
    enabled: !!productionId && isOpen,
  });

  // Mutation to update production status and costs
  const updateProductionMutation = useMutation({
    mutationFn: async (updatedData: { status: string; selectedManufacturingCosts: {id : number, cost : number}[] }) => {
      const response = await fetch(`${baseUrl()}/manufacturing/update-metadata/${productionId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updatedData),
      });
      if (!response.ok) throw new Error("Failed to update production");
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["productions"] });
      onClose();
      window.location.reload()
    },
  });

  // Handle status change
  const handleStatusChange = (value: string) => {
    setSelectedStatus(value);
  };

  // Handle cost selection
  const handleCostSelection = (costId: number) => {
    setSelectedCosts((prev) =>
      prev.includes(costId) ? prev.filter((id) => id !== costId) : [...prev, costId]
    );
  };

  // Calculate total cost
  const totalCost =
    (production?.totalCost || 0) +
    selectedCosts.reduce((sum, costId) => {
      const cost = production?.manufacturingCosts.find((c) => c.id === costId);
      const costWithTotalPairs = production?.totalPairs ? (Number(cost?.cost) * production.totalPairs)  : Number(cost?.cost) || 0
      return sum + costWithTotalPairs
    }, 0);

  // Handle update
  const handleUpdate = () => {
    if (!selectedStatus) {
      alert("Please select a status.");
      return;
    }
    if(selectedStatus === production?.status){
      alert("Please update production status")
      return;
    }
    const manufacturingCosts = production?.manufacturingCosts.filter(element => selectedCosts.includes(element.id))
    const processedManufacturingCosts = manufacturingCosts?.map(element => ({id : element.id, cost : Number(element.cost)})) || []
    updateProductionMutation.mutate({ status: selectedStatus, selectedManufacturingCosts: processedManufacturingCosts});
  };
  useEffect(() => {
    if(isSuccess){
      switch(production.status){
        case 'cutting' : 
        setProductionStatus(0)
          setSelectedStatus('cutting')
          break;
        case 'sticking' : 
          setProductionStatus(1) 
          setSelectedStatus('sticking')
          break;
        case 'lasting' : 
          setProductionStatus(2) 
          setSelectedStatus('lasting')
          break;
        case 'finished' : 
          setProductionStatus(3)
          setSelectedStatus('finished')
          break;
      }
    }
  }, [isLoading, isSuccess])
  return (
    <Dialog
      open={isOpen}
      onOpenChange={(open) => {
        if (!open) onClose();
      }}
    >
      <DialogContent className="max-w-4xl" onPointerDownOutside={(e) => e.preventDefault()}>
        <DialogHeader>
          <DialogTitle>Update Production #{productionId}</DialogTitle>
        </DialogHeader>

        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-32 w-full" />
          </div>
        ) : error ? (
          <div className="space-y-4">
            <div className="text-red-500">Error loading production details</div>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        ) : production ? (
          <div className="space-y-4">
            {/* Status Selection */}
            <div className="space-y-2">
              <Label>Update Status</Label>
              <Select onValueChange={handleStatusChange} value={selectedStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cutting" disabled={productionStatus === 0 || productionStatus > 0}>Cutting</SelectItem>
                  <SelectItem value="sticking" disabled={productionStatus > 1 || productionStatus > 1}>Sticking</SelectItem>
                  <SelectItem value="lasting" disabled = {productionStatus > 2 || productionStatus > 2}>Lasting</SelectItem>
                  <SelectItem value="finished">Finished</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Manufacturing Costs Checklist */}
            {/* Manufacturing Costs Section */}
            <Card className="mt-8">
                <CardHeader>
                  <CardTitle className="text-2xl font-bold">Additional Manufacturing Costs</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Include</TableHead>
                        <TableHead>Cost Name</TableHead>
                        <TableHead>Amount Per Pair</TableHead>
                        <TableHead>Total Cost</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {production.manufacturingCosts.map((cost) => {
                        const totalCost = cost.cost * production.totalPairs
                        return (
                          <TableRow key={cost.id}>
                            <TableCell>
                              <input 
                                type="checkbox" 
                                checked={selectedCosts.includes(cost.id)}
                                onChange={() => handleCostSelection(cost.id)}
                              />
                            </TableCell>
                            <TableCell>{cost.name}</TableCell>
                            <TableCell>{formatCurrency(cost.cost)}</TableCell>
                            <TableCell>{formatCurrency(totalCost)}</TableCell>
                          </TableRow>
                        )
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            {/* Total Cost and Pairs */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Total Cost</Label>
                <p>{formatCurrency(totalCost)}</p>
              </div>
              <div>
                <Label>Total Pairs</Label>
                <p>{production.totalPairs}</p>
              </div>
            </div>

            {/* Update Button */}
            <div className="flex justify-end">
              <Button onClick={handleUpdate} disabled={updateProductionMutation.isLoading}>
                {updateProductionMutation.isLoading ? "Updating..." : "Update"}
              </Button>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}