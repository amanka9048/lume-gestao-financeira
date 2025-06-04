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
import type { Category, Wallet, CreditCard } from "@shared/schema";

interface ExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ExpenseModal({ isOpen, onClose }: ExpenseModalProps) {
  const { couple } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    description: "",
    amount: "",
    category: "",
    paymentMethod: "debit", // debit or credit
    walletId: "",
    creditCardId: "",
    date: new Date().toISOString().split('T')[0],
    isRecurring: false,
    recurringType: "",
    recurringDay: "",
    isInstallment: false,
    installmentCount: "",
    installmentValue: "",
  });

  const { data: categories = [], isLoading: categoriesLoading } = useQuery<Category[]>({
    queryKey: ['/api/categories'],
    queryFn: async () => {
      const response = await fetch('/api/categories');
      if (!response.ok) throw new Error('Failed to fetch categories');
      return response.json();
    },
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

  const { data: creditCards = [] } = useQuery<CreditCard[]>({
    queryKey: ['/api/credit-cards', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const response = await fetch(`/api/credit-cards/${couple.id}`);
      if (!response.ok) throw new Error('Failed to fetch credit cards');
      return response.json();
    },
    enabled: !!couple?.id,
  });

  const createExpense = useMutation({
    mutationFn: async (data: any) => {
      if (data.isInstallment) {
        const installmentData = {
          coupleId: couple?.id,
          description: data.description,
          totalAmount: data.amount,
          totalInstallments: data.installmentCount,
          startDate: data.date,
          creditCardId: data.creditCardId ? parseInt(data.creditCardId) : undefined,
        };
        
        const response = await apiRequest("POST", "/api/installments", installmentData);
        return response;
      } else if (data.paymentMethod === "credit") {
        // Credit transaction - backend will handle charging the card
        const response = await apiRequest("POST", "/api/transactions", {
          ...data,
          type: "expense",
          coupleId: couple?.id,
          walletId: null, // Credit transactions don't affect wallet balance
          creditCardId: data.creditCardId ? parseInt(data.creditCardId) : null,
          recurringDay: data.recurringDay ? parseInt(data.recurringDay) : undefined,
        });
        return response;
      } else {
        // Debit transaction (wallet)
        const response = await apiRequest("POST", "/api/transactions", {
          ...data,
          type: "expense",
          coupleId: couple?.id,
          creditCardId: null,
          recurringDay: data.recurringDay ? parseInt(data.recurringDay) : undefined,
        });
        return response;
      }
    },
    onSuccess: () => {
      toast({
        title: "Sucesso",
        description: formData.isInstallment 
          ? "Compra parcelada criada com sucesso!" 
          : "Saída criada com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/transactions", couple?.id] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      queryClient.invalidateQueries({ queryKey: ["/api/installments", couple?.id] });
      queryClient.invalidateQueries({ queryKey: ["wallets", couple?.id] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar saída.",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setFormData({
      description: "",
      amount: "",
      category: "",
      paymentMethod: "debit",
      walletId: "",
      creditCardId: "",
      date: new Date().toISOString().split('T')[0],
      isRecurring: false,
      recurringType: "",
      recurringDay: "",
      isInstallment: false,
      installmentCount: "",
      installmentValue: "",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.description.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira uma descrição.",
        variant: "destructive",
      });
      return;
    }

    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast({
        title: "Erro",
        description: "Por favor, insira um valor válido.",
        variant: "destructive",
      });
      return;
    }

    if (formData.paymentMethod === "debit" && !formData.walletId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione uma carteira para débito.",
        variant: "destructive",
      });
      return;
    }

    if ((formData.paymentMethod === "credit" || formData.isInstallment) && !formData.creditCardId) {
      toast({
        title: "Erro",
        description: "Por favor, selecione um cartão de crédito.",
        variant: "destructive",
      });
      return;
    }

    createExpense.mutate(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleInstallmentChange = (field: string, value: string) => {
    setFormData(prev => {
      const updated = { ...prev, [field]: value };
      
      if (field === "installmentCount" && updated.installmentValue) {
        const count = parseFloat(value);
        const installmentValue = parseFloat(updated.installmentValue);
        if (!isNaN(count) && !isNaN(installmentValue)) {
          updated.amount = (count * installmentValue).toFixed(2);
        }
      } else if (field === "installmentValue" && updated.installmentCount) {
        const count = parseFloat(updated.installmentCount);
        const installmentValue = parseFloat(value);
        if (!isNaN(count) && !isNaN(installmentValue)) {
          updated.amount = (count * installmentValue).toFixed(2);
        }
      }
      
      return updated;
    });
  };

  const expenseCategories = categories
    .filter((cat) => cat.type === 'expense')
    .map((cat) => ({ value: cat.name, label: cat.name }));

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[600px] bg-zinc-900 border-zinc-800">
        <DialogHeader>
          <DialogTitle className="text-xl text-white">Nova Saída</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="description">Descrição</Label>
            <Input
              id="description"
              placeholder="Ex: Compra no supermercado"
              value={formData.description}
              onChange={(e) => handleInputChange("description", e.target.value)}
              className="mt-2"
            />
          </div>
          
          <div>
            <Label htmlFor="amount">
              {formData.isInstallment ? "Valor Total (calculado automaticamente)" : "Valor Total"}
            </Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              placeholder="0.00"
              value={formData.amount}
              onChange={(e) => handleInputChange("amount", e.target.value)}
              readOnly={formData.isInstallment}
              className={`mt-2 ${formData.isInstallment ? 'bg-zinc-700 border-zinc-600 text-gray-300' : ''}`}
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
            <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
            <Select value={formData.paymentMethod} onValueChange={(value) => handleInputChange("paymentMethod", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione a forma de pagamento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="debit">💳 Débito (Carteira)</SelectItem>
                <SelectItem value="credit">💳 Crédito (Cartão)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {formData.paymentMethod === "debit" && (
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
          )}

          {formData.paymentMethod === "credit" && (
            <div>
              <Label htmlFor="creditCard">Cartão de Crédito</Label>
              <Select value={formData.creditCardId} onValueChange={(value) => handleInputChange("creditCardId", value)}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder="Selecione um cartão de crédito" />
                </SelectTrigger>
                <SelectContent>
                  {creditCards.map((card) => (
                    <SelectItem key={card.id} value={card.id.toString()}>
                      {card.name} - Limite: R$ {parseFloat(card.availableLimit).toFixed(2)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
          
          <div>
            <Label htmlFor="category">Categoria</Label>
            <Select value={formData.category} onValueChange={(value) => handleInputChange("category", value)}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((category) => (
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
                id="isInstallment"
                checked={formData.isInstallment}
                onChange={(e) => setFormData(prev => ({ 
                  ...prev, 
                  isInstallment: e.target.checked,
                  isRecurring: false,
                  paymentMethod: e.target.checked ? "credit" : prev.paymentMethod
                }))}
                className="w-4 h-4 text-yellow-600 bg-zinc-800 border-zinc-700 rounded focus:ring-yellow-500"
              />
              <Label htmlFor="isInstallment" className="text-white">
                Compra Parcelada
              </Label>
            </div>

            {formData.isInstallment && (
              <div className="space-y-4 pl-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="installmentCount">Quantidade de Parcelas</Label>
                    <Input
                      id="installmentCount"
                      type="number"
                      min="2"
                      max="60"
                      placeholder="12"
                      value={formData.installmentCount}
                      onChange={(e) => handleInstallmentChange("installmentCount", e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="installmentValue">Valor de Cada Parcela</Label>
                    <Input
                      id="installmentValue"
                      type="number"
                      step="0.01"
                      placeholder="0.00"
                      value={formData.installmentValue}
                      onChange={(e) => handleInstallmentChange("installmentValue", e.target.value)}
                      className="bg-zinc-800 border-zinc-700 text-white mt-2"
                    />
                  </div>
                </div>
              </div>
            )}

            {!formData.isInstallment && (
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="isRecurring"
                    checked={formData.isRecurring}
                    onChange={(e) => setFormData(prev => ({ 
                      ...prev, 
                      isRecurring: e.target.checked,
                      isInstallment: false
                    }))}
                    className="w-4 h-4 text-yellow-600 bg-zinc-800 border-zinc-700 rounded focus:ring-yellow-500"
                  />
                  <Label htmlFor="isRecurring" className="text-white">
                    Saída Recorrente
                  </Label>
                </div>

                {formData.isRecurring && (
                  <div className="grid grid-cols-2 gap-4 pl-6">
                    <div>
                      <Label htmlFor="recurringType">Frequência</Label>
                      <Select value={formData.recurringType} onValueChange={(value) => handleInputChange("recurringType", value)}>
                        <SelectTrigger className="mt-2">
                          <SelectValue placeholder="Selecione" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="weekly">Semanal</SelectItem>
                          <SelectItem value="monthly">Mensal</SelectItem>
                          <SelectItem value="yearly">Anual</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label htmlFor="recurringDay">
                        {formData.recurringType === 'weekly' ? 'Dia da Semana' : 
                         formData.recurringType === 'monthly' ? 'Dia do Mês' : 'Dia do Ano'}
                      </Label>
                      <Input
                        id="recurringDay"
                        type="number"
                        min={formData.recurringType === 'weekly' ? '1' : '1'}
                        max={formData.recurringType === 'weekly' ? '7' : 
                             formData.recurringType === 'monthly' ? '31' : '365'}
                        placeholder={formData.recurringType === 'weekly' ? '1-7' : 
                                   formData.recurringType === 'monthly' ? '1-31' : '1-365'}
                        value={formData.recurringDay}
                        onChange={(e) => handleInputChange("recurringDay", e.target.value)}
                        className="bg-zinc-800 border-zinc-700 text-white mt-2"
                      />
                    </div>
                  </div>
                )}
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
              disabled={createExpense.isPending}
              className="flex-1 gradient-gold text-primary-foreground font-semibold shadow-gold hover:shadow-lg transition-all duration-300"
            >
              {createExpense.isPending ? "Salvando..." : 
               formData.isInstallment ? "Salvar Parcelamento" : "Salvar Saída"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}