'use client'

import { useEffect, useState } from 'react';
import { Search, Pencil, Trash2, Eye } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import AddMaterialSheet from '@/components/materials/add-material-dialog';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '@/helpers/currencyFormat';
import { baseUrl } from '@/utils/baseUrl';

type RawMaterial = {
  id: number;
  name: string;
  quantity: number;
  unit: string;
  cost: number;
};

export default function MaterialsPage() {
  const [materials, setMaterials] = useState<RawMaterial[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const materialsPerPage = 5;

  const { data, isSuccess, isLoading, error, refetch } = useQuery({
    queryKey: ['RAW_MATERIAL'],
    queryFn: async () => {
      const response = await fetch(`${baseUrl()}/materials`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      if (!response.ok) throw new Error('Failed to fetch materials');
      return response.json();
    },
  });

  const indexOfLastMaterial = currentPage * materialsPerPage;
  const indexOfFirstMaterial = indexOfLastMaterial - materialsPerPage;
  const currentMaterials = materials
    .filter((material) => material.name.toLowerCase().includes(searchTerm.toLowerCase()))
    .slice(indexOfFirstMaterial, indexOfLastMaterial);

  const totalPages = Math.ceil(materials.length / materialsPerPage);

  useEffect(() => {
    if (isSuccess && data) {
      setMaterials(data);
    }
  }, [isSuccess, data]);

  const handleMaterialAdded = () => {
    refetch(); // Refetch materials after adding a new one
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Raw Materials</h1>

      <div className="flex justify-between items-center mb-6">
        <div className="relative w-64">
          <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <Input
            type="text"
            placeholder="Search materials..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <AddMaterialSheet  />
      </div>

      {isLoading ? (
        <p>Loading materials...</p>
      ) : error ? (
        <p className="text-red-500">Failed to load materials. Please try again later.</p>
      ) : (
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Quantity</TableHead>
                <TableHead>Unit of Measure</TableHead>
                <TableHead>Cost</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentMaterials.length > 0 ? (
                currentMaterials.map((material) => (
                  <TableRow key={material.id}>
                    <TableCell>{material.name}</TableCell>
                    <TableCell>{material.quantity}</TableCell>
                    <TableCell>{material.unit}</TableCell>
                    <TableCell>{formatCurrency(material.cost)}</TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button variant="ghost" size="icon" aria-label="View material details">
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Edit material">
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button variant="ghost" size="icon" aria-label="Delete material">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} className="text-center">
                    No materials found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      )}

      <div className="flex justify-between items-center mt-4">
        <div>
          Showing {indexOfFirstMaterial + 1} to {Math.min(indexOfLastMaterial, materials.length)} of {materials.length} materials
        </div>
        <div className="flex space-x-2">
          <Button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
