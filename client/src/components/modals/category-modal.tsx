import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Minus, Tag } from "lucide-react";
import { insertCategorySchema } from "@shared/schema";

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  costCenterId: number;
}

const categoryColors = [
  "#FFD700", // Dourado
  "#FF6B6B", // Vermelho claro
  "#4ECDC4", // Verde azulado
  "#45B7D1", // Azul claro
  "#96CEB4", // Verde claro
  "#FFEAA7", // Amarelo claro
  "#DDA0DD", // Roxo claro
  "#98D8C8", // Verde menta
  "#F7DC6F", // Amarelo ouro
  "#BB8FCE", // Lavanda
  "#85C1E9", // Azul céu
  "#F8C471", // Laranja claro
];

export function CategoryModal({ isOpen, onClose, costCenterId }: CategoryModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [categoryData, setCategoryData] = useState({
    name: "",
    type: "expense" as "income" | "expense",
    color: categoryColors[0],
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: any) => {
      const categoryPayload = {
        costCenterId,
        name: data.name,
        type: data.type,
        color: data.color,
      };
      
      const validatedData = insertCategorySchema.parse(categoryPayload);
      return apiRequest("POST", "/api/categories", validatedData);
    },
    onSuccess: () => {
      toast({
        title: "Categoria criada",
        description: "A categoria foi criada com sucesso",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cost-centers", costCenterId, "categories"] 
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar categoria",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setCategoryData({
      name: "",
      type: "expense",
      color: categoryColors[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createCategoryMutation.mutate(categoryData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Categoria</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Nome da Categoria</Label>
            <Input
              id="name"
              value={categoryData.name}
              onChange={(e) => setCategoryData({ ...categoryData, name: e.target.value })}
              placeholder="Ex: Alimentação, Transporte, Salário..."
              className="bg-[#2a2a2a] border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-white">Tipo de Categoria</Label>
            <Select
              value={categoryData.type}
              onValueChange={(value: "income" | "expense") => 
                setCategoryData({ ...categoryData, type: value })
              }
            >
              <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-700">
                <SelectItem value="expense">
                  <div className="flex items-center gap-2">
                    <Minus className="h-4 w-4 text-red-500" />
                    Despesa
                  </div>
                </SelectItem>
                <SelectItem value="income">
                  <div className="flex items-center gap-2">
                    <Plus className="h-4 w-4 text-green-500" />
                    Receita
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-white">Cor da Categoria</Label>
            <div className="grid grid-cols-6 gap-2 mt-2">
              {categoryColors.map((color) => (
                <button
                  key={color}
                  type="button"
                  className={`w-8 h-8 rounded-full border-2 ${
                    categoryData.color === color 
                      ? "border-white" 
                      : "border-gray-600"
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setCategoryData({ ...categoryData, color })}
                />
              ))}
            </div>
          </div>

          <div className="pt-2">
            <div className="flex items-center gap-2 p-3 bg-[#2a2a2a] rounded-lg border border-gray-700">
              <Tag className="h-4 w-4" style={{ color: categoryData.color }} />
              <span className="text-white">
                {categoryData.name || "Nome da categoria"}
              </span>
              <span className="text-sm text-gray-400">
                ({categoryData.type === "income" ? "Receita" : "Despesa"})
              </span>
            </div>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              disabled={createCategoryMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/80 text-black"
              disabled={createCategoryMutation.isPending}
            >
              {createCategoryMutation.isPending ? "Criando..." : "Criar Categoria"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}