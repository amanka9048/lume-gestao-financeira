import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface InstallmentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function InstallmentModal({ isOpen, onClose }: InstallmentModalProps) {
  const { couple } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    description: "",
    totalAmount: "",
    totalInstallments: "",
    startDate: new Date().toISOString().split('T')[0],
  });

  const createInstallment = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/installments", {
        ...data,
        coupleId: couple!.id,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({
        title: "Parcelamento criado",
        description: "O parcelamento foi criado com sucesso.",
      });
      onClose();
      resetForm();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Não foi possível criar o parcelamento.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      totalAmount: "",
      totalInstallments: "",
      startDate: new Date().toISOString().split('T')[0],
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.totalAmount || !formData.totalInstallments) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    const totalInstallments = parseInt(formData.totalInstallments);
    if (totalInstallments < 2 || totalInstallments > 60) {
      toast({
        title: "Erro",
        description: "O número de parcelas deve estar entre 2 e 60.",
        variant: "destructive",
      });
      return;
    }

    createInstallment.mutate(formData);
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  // Calculate installment amount
  const installmentAmount = formData.totalAmount && formData.totalInstallments
    ? (parseFloat(formData.totalAmount) / parseInt(formData.totalInstallments)).toFixed(2)
    : "0,00";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Novo Parcelamento</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              type="text"
              placeholder="Ex: Financiamento, Cartão..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="totalAmount">Valor Total (R$)</Label>
            <Input
              id="totalAmount"
              type="number"
              step="0.01"
              placeholder="0,00"
              value={formData.totalAmount}
              onChange={(e) => handleInputChange("totalAmount", e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="totalInstallments">Número de Parcelas</Label>
            <Input
              id="totalInstallments"
              type="number"
              min="2"
              max="60"
              placeholder="12"
              value={formData.totalInstallments}
              onChange={(e) => handleInputChange("totalInstallments", e.target.value)}
              className="mt-2"
            />
          </div>
          
          {formData.totalAmount && formData.totalInstallments && (
            <div className="bg-secondary p-3 rounded-lg">
              <p className="text-sm text-muted-foreground">Valor de cada parcela:</p>
              <p className="text-lg font-semibold text-primary">
                R$ {installmentAmount}
              </p>
            </div>
          )}
          
          <div>
            <Label htmlFor="startDate">Data da Primeira Parcela</Label>
            <Input
              id="startDate"
              type="date"
              value={formData.startDate}
              onChange={(e) => handleInputChange("startDate", e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div className="flex space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createInstallment.isPending}
              className="flex-1 gradient-gold text-primary-foreground font-semibold shadow-gold hover:shadow-lg transition-all duration-300"
            >
              {createInstallment.isPending ? "Criando..." : "Criar Parcelamento"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
