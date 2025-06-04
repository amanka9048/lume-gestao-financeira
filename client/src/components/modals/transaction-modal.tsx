import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Minus, CreditCard, Wallet as WalletIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { Wallet, CreditCard as CreditCardType, Category } from "@shared/schema";

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  costCenterId: number;
  type: "income" | "expense";
}

export function TransactionModal({ isOpen, onClose, costCenterId, type }: TransactionModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [transactionData, setTransactionData] = useState({
    description: "",
    amount: "",
    date: new Date().toISOString().split('T')[0],
    categoryId: "",
    paymentMethod: "debit", // debit, credit, installment
    walletId: "",
    creditCardId: "",
    installments: "1",
  });

  // Fetch wallets
  const { data: wallets = [] } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "wallets"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${costCenterId}/wallets`);
      return response.json() as Promise<Wallet[]>;
    },
  });

  // Fetch credit cards
  const { data: creditCards = [] } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "credit-cards"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${costCenterId}/credit-cards`);
      return response.json() as Promise<CreditCardType[]>;
    },
  });

  // Fetch categories
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${costCenterId}/categories`);
      return response.json() as Promise<Category[]>;
    },
  });

  const filteredCategories = categories.filter(cat => cat.type === type);

  const createTransactionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", `/api/cost-centers/${costCenterId}/transactions`, data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Transação criada!",
        description: `${type === 'income' ? 'Receita' : 'Despesa'} registrada com sucesso.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centers", costCenterId, "transactions"] });
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centers", costCenterId, "wallets"] });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar transação",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setTransactionData({
      description: "",
      amount: "",
      date: new Date().toISOString().split('T')[0],
      categoryId: "",
      paymentMethod: "debit",
      walletId: "",
      creditCardId: "",
      installments: "1",
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!transactionData.description || !transactionData.amount || !transactionData.categoryId) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha descrição, valor e categoria",
        variant: "destructive",
      });
      return;
    }

    if (type === 'expense' && transactionData.paymentMethod === 'debit' && !transactionData.walletId) {
      toast({
        title: "Carteira obrigatória",
        description: "Selecione uma carteira para pagamento no débito",
        variant: "destructive",
      });
      return;
    }

    if (type === 'expense' && (transactionData.paymentMethod === 'credit' || transactionData.paymentMethod === 'installment') && !transactionData.creditCardId) {
      toast({
        title: "Cartão obrigatório",
        description: "Selecione um cartão de crédito",
        variant: "destructive",
      });
      return;
    }

    const payload = {
      ...transactionData,
      type,
      costCenterId,
      amount: parseFloat(transactionData.amount),
      categoryId: parseInt(transactionData.categoryId),
      walletId: transactionData.walletId ? parseInt(transactionData.walletId) : null,
      creditCardId: transactionData.creditCardId ? parseInt(transactionData.creditCardId) : null,
      installments: transactionData.paymentMethod === 'installment' ? parseInt(transactionData.installments) : 1,
    };

    createTransactionMutation.mutate(payload);
  };

  const isExpense = type === 'expense';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-gray-800 text-white max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {type === 'income' ? (
              <Plus className="h-5 w-5 text-green-500" />
            ) : (
              <Minus className="h-5 w-5 text-red-500" />
            )}
            {type === 'income' ? 'Nova Receita' : 'Nova Despesa'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Informações básicas */}
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="description">Descrição</Label>
              <Input
                id="description"
                value={transactionData.description}
                onChange={(e) => setTransactionData(prev => ({ ...prev, description: e.target.value }))}
                className="bg-[#2a2a2a] border-gray-700 text-white"
                placeholder="Ex: Salário, Supermercado..."
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="amount">Valor</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                value={transactionData.amount}
                onChange={(e) => setTransactionData(prev => ({ ...prev, amount: e.target.value }))}
                className="bg-[#2a2a2a] border-gray-700 text-white"
                placeholder="0,00"
                required
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Data</Label>
              <Input
                id="date"
                type="date"
                value={transactionData.date}
                onChange={(e) => setTransactionData(prev => ({ ...prev, date: e.target.value }))}
                className="bg-[#2a2a2a] border-gray-700 text-white"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <Select
                value={transactionData.categoryId}
                onValueChange={(value) => setTransactionData(prev => ({ ...prev, categoryId: value }))}
              >
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione a categoria" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {filteredCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Método de pagamento (apenas para despesas) */}
          {isExpense && (
            <Card className="bg-[#2a2a2a] border-gray-700">
              <CardHeader>
                <CardTitle className="text-white text-lg">Método de Pagamento</CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs
                  value={transactionData.paymentMethod}
                  onValueChange={(value) => setTransactionData(prev => ({ 
                    ...prev, 
                    paymentMethod: value,
                    walletId: value === 'debit' ? prev.walletId : '',
                    creditCardId: value !== 'debit' ? prev.creditCardId : '',
                  }))}
                  className="w-full"
                >
                  <TabsList className="grid w-full grid-cols-3 bg-[#1e1e1e]">
                    <TabsTrigger value="debit" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                      <WalletIcon className="h-4 w-4 mr-1" />
                      Débito
                    </TabsTrigger>
                    <TabsTrigger value="credit" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Crédito
                    </TabsTrigger>
                    <TabsTrigger value="installment" className="data-[state=active]:bg-[#FFD700] data-[state=active]:text-black">
                      <CreditCard className="h-4 w-4 mr-1" />
                      Parcelado
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="debit" className="mt-4">
                    <div className="space-y-2">
                      <Label>Carteira</Label>
                      <Select
                        value={transactionData.walletId}
                        onValueChange={(value) => setTransactionData(prev => ({ ...prev, walletId: value }))}
                      >
                        <SelectTrigger className="bg-[#1e1e1e] border-gray-700 text-white">
                          <SelectValue placeholder="Selecione a carteira" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a2a2a] border-gray-700">
                          {wallets.map((wallet) => (
                            <SelectItem key={wallet.id} value={wallet.id.toString()}>
                              {wallet.name} - {parseFloat(wallet.balance || "0").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="credit" className="mt-4">
                    <div className="space-y-2">
                      <Label>Cartão de Crédito</Label>
                      <Select
                        value={transactionData.creditCardId}
                        onValueChange={(value) => setTransactionData(prev => ({ ...prev, creditCardId: value }))}
                      >
                        <SelectTrigger className="bg-[#1e1e1e] border-gray-700 text-white">
                          <SelectValue placeholder="Selecione o cartão" />
                        </SelectTrigger>
                        <SelectContent className="bg-[#2a2a2a] border-gray-700">
                          {creditCards.map((card) => (
                            <SelectItem key={card.id} value={card.id.toString()}>
                              {card.name} - Limite: {parseFloat(card.creditLimit || "0").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </TabsContent>

                  <TabsContent value="installment" className="mt-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Cartão de Crédito</Label>
                        <Select
                          value={transactionData.creditCardId}
                          onValueChange={(value) => setTransactionData(prev => ({ ...prev, creditCardId: value }))}
                        >
                          <SelectTrigger className="bg-[#1e1e1e] border-gray-700 text-white">
                            <SelectValue placeholder="Selecione o cartão" />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2a] border-gray-700">
                            {creditCards.map((card) => (
                              <SelectItem key={card.id} value={card.id.toString()}>
                                {card.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="installments">Parcelas</Label>
                        <Select
                          value={transactionData.installments}
                          onValueChange={(value) => setTransactionData(prev => ({ ...prev, installments: value }))}
                        >
                          <SelectTrigger className="bg-[#1e1e1e] border-gray-700 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-[#2a2a2a] border-gray-700">
                            {Array.from({ length: 24 }, (_, i) => i + 1).map((num) => (
                              <SelectItem key={num} value={num.toString()}>
                                {num}x de {transactionData.amount ? 
                                  (parseFloat(transactionData.amount) / num).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) 
                                  : 'R$ 0,00'
                                }
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}

          {/* Receitas usam carteira */}
          {!isExpense && (
            <div className="space-y-2">
              <Label>Carteira de Destino</Label>
              <Select
                value={transactionData.walletId}
                onValueChange={(value) => setTransactionData(prev => ({ ...prev, walletId: value }))}
              >
                <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                  <SelectValue placeholder="Selecione a carteira" />
                </SelectTrigger>
                <SelectContent className="bg-[#2a2a2a] border-gray-700">
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name} - {parseFloat(wallet.balance || "0").toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={createTransactionMutation.isPending}
              className={`flex-1 ${
                type === 'income' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'
              } text-white`}
            >
              {createTransactionMutation.isPending ? "Salvando..." : 
                type === 'income' ? "Registrar Receita" : "Registrar Despesa"
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}