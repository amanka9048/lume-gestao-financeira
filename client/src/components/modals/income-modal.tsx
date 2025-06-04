import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import type { Category, Wallet } from "@shared/schema";

interface IncomeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function IncomeModal({ isOpen, onClose }: IncomeModalProps) {
  const { couple } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    walletId: "",
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringType: "",
    recurringDay: "",
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories', couple?.id, 'income'],
    enabled: !!couple?.id,
  });

  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ['wallets', couple?.id],
    queryFn: async () => {
      const response = await fetch(`/api/wallets/${couple?.id}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    },
    enabled: !!couple?.id,
  });

  const createIncome = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/transactions", {
        ...data,
        type: "income",
        coupleId: couple?.id,
        recurringDay: data.recurringDay ? parseInt(data.recurringDay) : undefined,
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: "Entrada criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", couple?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallets", couple?.id] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar entrada.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      walletId: "",
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringType: "",
      recurringDay: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description || !formData.amount || !formData.category) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos.",
        variant: "destructive",
      });
      return;
    }

    // Use primeira carteira disponível se não selecionada
    const walletId = formData.walletId ? parseInt(formData.walletId) : wallets[0]?.id;
    
    if (!walletId) {
      toast({
        title: "Erro",
        description: "Nenhuma carteira disponível. Crie uma carteira primeiro.",
        variant: "destructive",
      });
      return;
    }

    createIncome.mutate({
      ...formData,
      walletId,
      coupleId: couple?.id,
      type: "income",
      amount: parseFloat(formData.amount)
    });
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  // Default categories as fallback
  const defaultIncomeCategories = [
    { value: "salary", label: "Salário" },
    { value: "freelance", label: "Freelance/Autônomo" },
    { value: "bonus", label: "Bônus/13º Salário" },
    { value: "investment", label: "Investimentos" },
    { value: "dividend", label: "Dividendos" },
    { value: "rental", label: "Aluguel Recebido" },
    { value: "business", label: "Negócio Próprio" },
    { value: "sale", label: "Vendas" },
    { value: "refund", label: "Reembolso" },
    { value: "gift", label: "Presente/Doação" },
    { value: "pension", label: "Aposentadoria/Pensão" },
    { value: "benefits", label: "Benefícios" },
    { value: "other", label: "Outros" },
  ];

  // Use custom categories if available, otherwise use defaults
  const incomeCategories = categories.length > 0 
    ? categories.map(cat => ({ value: cat.name, label: cat.name }))
    : defaultIncomeCategories;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-white font-semibold text-lg">
            Nova Entrada
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Salário, Freelance..."
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">Valor</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="date">Data</Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={(e) => handleInputChange("date", e.target.value)}
              className="mt-2"
            />
          </div>

          <div>
            <Label htmlFor="wallet">Carteira</Label>
            <Select value={formData.walletId} onValueChange={(value) => handleInputChange("walletId", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma carteira" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map((wallet) => (
                  <SelectItem key={wallet.id} value={wallet.id.toString()}>
                    {wallet.name} - R$ {parseFloat(wallet.balance).toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {incomeCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isRecurring"
                checked={formData.isRecurring}
                onChange={(e) => setFormData(prev => ({ ...prev, isRecurring: e.target.checked }))}
                className="w-4 h-4 text-yellow-600 bg-zinc-800 border-zinc-700 rounded focus:ring-yellow-500"
              />
              <Label htmlFor="isRecurring" className="text-white">
                Entrada Recorrente
              </Label>
            </div>

            {formData.isRecurring && (
              <div className="grid grid-cols-2 gap-4 pl-6">
                <div>
                  <Label htmlFor="recurringType">Frequência</Label>
                  <select
                    id="recurringType"
                    value={formData.recurringType}
                    onChange={(e) => handleInputChange("recurringType", e.target.value)}
                    className="w-full p-2 bg-zinc-800 border border-zinc-700 rounded-md text-white mt-2"
                  >
                    <option value="">Selecione...</option>
                    <option value="monthly">Mensal</option>
                    <option value="weekly">Semanal</option>
                    <option value="yearly">Anual</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="recurringDay">
                    {formData.recurringType === 'monthly' ? 'Dia do Mês' : 
                     formData.recurringType === 'weekly' ? 'Dia da Semana (1-7)' : 
                     'Dia do Ano (1-365)'}
                  </Label>
                  <Input
                    id="recurringDay"
                    type="number"
                    min="1"
                    max={formData.recurringType === 'monthly' ? '31' : 
                         formData.recurringType === 'weekly' ? '7' : '365'}
                    placeholder={formData.recurringType === 'monthly' ? '15' : 
                                formData.recurringType === 'weekly' ? '1' : '1'}
                    value={formData.recurringDay}
                    onChange={(e) => handleInputChange("recurringDay", e.target.value)}
                    className="bg-zinc-800 border-zinc-700 text-white mt-2"
                  />
                </div>
              </div>
            )}
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
              disabled={createIncome.isPending}
              className="flex-1 gradient-gold text-primary-foreground font-semibold shadow-gold hover:shadow-lg transition-all duration-300"
            >
              {createIncome.isPending ? "Salvando..." : "Salvar Entrada"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}