import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { BottomNav } from "@/components/navigation/bottom-nav";
import { useFinancialData } from "@/hooks/use-financial-data";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/auth-context";
import { useParams } from "wouter";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Briefcase, ShoppingCart, Home, Car, Wallet as WalletIcon, ArrowLeft } from "lucide-react";
import type { Wallet, Transaction, CreditCard } from "@shared/schema";

export function Transactions() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"income" | "expense">("expense");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [periodFilter, setPeriodFilter] = useState<string>("current");
  const [walletFilter, setWalletFilter] = useState<string>("all");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Obter cost center do usuário logado
  const { data: userCostCenters = [] } = useQuery({
    queryKey: ["/api/users", user?.id, "cost-centers"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/cost-centers`);
      return response.json();
    },
    enabled: !!user?.id
  });

  const currentCostCenter = userCostCenters[0]; // Usar o primeiro cost center do usuário

  // Buscar carteiras para o filtro
  const { data: wallets = [] } = useQuery<Wallet[]>({
    queryKey: ["/api/cost-centers", currentCostCenter?.id, "wallets"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${currentCostCenter?.id}/wallets`);
      return response.json();
    },
    enabled: !!currentCostCenter?.id,
  });

  // Buscar categorias para o filtro
  const { data: categories = [] } = useQuery({
    queryKey: ["/api/cost-centers", currentCostCenter?.id, "categories"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${currentCostCenter?.id}/categories`);
      return response.json();
    },
    enabled: !!currentCostCenter?.id
  });

  // Buscar cartões de crédito para o filtro
  const { data: creditCards = [] } = useQuery<CreditCard[]>({
    queryKey: ["/api/cost-centers", currentCostCenter?.id, "credit-cards"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${currentCostCenter?.id}/credit-cards`);
      return response.json();
    },
    enabled: !!currentCostCenter?.id,
  });

  // Buscar transações
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/cost-centers", currentCostCenter?.id, "transactions"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/cost-centers/${currentCostCenter?.id}/transactions`);
      return response.json();
    },
    enabled: !!currentCostCenter?.id
  });

  const deleteTransaction = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/transactions/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/transactions"] });
      toast({
        title: "Transação deletada",
        description: "A transação foi removida com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar a transação.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'income') {
      return <Briefcase className="text-success" />;
    }
    
    switch (category) {
      case 'food':
        return <ShoppingCart className="text-destructive" />;
      case 'transport':
        return <Car className="text-destructive" />;
      case 'bills':
        return <Home className="text-destructive" />;
      default:
        return <ShoppingCart className="text-destructive" />;
    }
  };

  // Função auxiliar para obter o nome da categoria
  const getCategoryName = (categoryId: number) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category ? category.name : 'Sem categoria';
  };

  const filteredTransactions = transactions.filter(transaction => {
    if (typeFilter && typeFilter !== "all" && transaction.type !== typeFilter) return false;
    if (categoryFilter && categoryFilter !== "all" && transaction.categoryId !== parseInt(categoryFilter)) return false;
    
    // Filtro de carteira/cartão: incluir tanto walletId quanto creditCardId
    if (walletFilter && walletFilter !== "all") {
      const filterId = parseInt(walletFilter);
      // Se é uma carteira (wallet), verificar walletId
      const isWalletMatch = transaction.walletId === filterId;
      // Se é um cartão de crédito, verificar creditCardId (usando IDs negativos para distinguir)
      const isCreditCardMatch = transaction.creditCardId === Math.abs(filterId) && filterId < 0;
      
      if (!isWalletMatch && !isCreditCardMatch) return false;
    }
    
    // Filtro de período
    if (periodFilter === "custom" && customStartDate && customEndDate) {
      const transactionDate = new Date(transaction.date);
      const startDate = new Date(customStartDate);
      const endDate = new Date(customEndDate);
      if (transactionDate < startDate || transactionDate > endDate) return false;
    } else if (periodFilter !== "all") {
      const transactionDate = new Date(transaction.date);
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      switch (periodFilter) {
        case "current":
          if (transactionDate.getMonth() !== currentMonth || transactionDate.getFullYear() !== currentYear) return false;
          break;
        case "last":
          const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
          const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
          if (transactionDate.getMonth() !== lastMonth || transactionDate.getFullYear() !== lastMonthYear) return false;
          break;
        case "last3":
          const threeMonthsAgo = new Date(now);
          threeMonthsAgo.setMonth(now.getMonth() - 3);
          if (transactionDate < threeMonthsAgo) return false;
          break;
      }
    }
    
    return true;
  }) || [];

  // Função para encontrar o nome da carteira ou cartão
  const getWalletName = (transaction: Transaction) => {
    if (transaction?.walletId) {
      const wallet = wallets.find(w => w.id === transaction.walletId);
      return wallet ? `💳 ${wallet.name}` : "Carteira não encontrada";
    } else if (transaction?.creditCardId) {
      const card = creditCards.find(c => c.id === transaction.creditCardId);
      return card ? `🏦 ${card.name}` : "Cartão não encontrado";
    }
    return "Não especificado";
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <header className="bg-card shadow-lg border-b border-border p-4 lg:p-6 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Transações</h1>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="gradient-gold text-primary-foreground font-semibold shadow-gold hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2" />
            Nova Transação
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
            <h3 className="text-xl font-semibold mb-4 md:mb-0">Gerenciar Transações</h3>
          </div>

          {/* Filter Controls */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Tipo</label>
              <Select value={typeFilter} onValueChange={setTypeFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todos" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos</SelectItem>
                  <SelectItem value="income">Entradas</SelectItem>
                  <SelectItem value="expense">Saídas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Categoria</label>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id.toString()}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Carteira/Cartão</label>
              <Select value={walletFilter} onValueChange={setWalletFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Todas" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todas</SelectItem>
                  {wallets.map((wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      💳 {wallet.name}
                    </SelectItem>
                  ))}
                  {creditCards.map((card) => (
                    <SelectItem key={`credit-${card.id}`} value={(-card.id).toString()}>
                      🏦 {card.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Período</label>
              <Select value={periodFilter} onValueChange={setPeriodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Mês Atual" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="current">Mês Atual</SelectItem>
                  <SelectItem value="last">Mês Passado</SelectItem>
                  <SelectItem value="last3">Últimos 3 Meses</SelectItem>
                  <SelectItem value="custom">Período Personalizado</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Custom Date Range Fields */}
          {periodFilter === "custom" && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6 p-4 bg-secondary/50 rounded-lg">
              <div>
                <Label htmlFor="startDate">Data Inicial</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={customStartDate}
                  onChange={(e) => setCustomStartDate(e.target.value)}
                  className="mt-2"
                />
              </div>
              <div>
                <Label htmlFor="endDate">Data Final</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={customEndDate}
                  onChange={(e) => setCustomEndDate(e.target.value)}
                  className="mt-2"
                />
              </div>
            </div>
          )}

          {/* Transactions List */}
          <div className="space-y-4">
            {filteredTransactions.length > 0 ? filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg hover:bg-secondary/80 transition-colors group">
                <div className="flex items-center space-x-4 flex-1">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    transaction.type === 'income' ? 'bg-success/20' : 'bg-destructive/20'
                  }`}>
                    {getCategoryIcon(getCategoryName(transaction.categoryId), transaction.type)}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>Categoria: {getCategoryName(transaction.categoryId)}</span>
                          <span>•</span>
                          <div className="flex items-center gap-1">
                            <WalletIcon className="w-3 h-3" />
                            <span>{getWalletName(transaction)}</span>
                          </div>
                          <span>•</span>
                          <span>{formatDate(transaction.date)}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          transaction.type === 'income' ? 'text-success' : 'text-destructive'
                        }`}>
                          {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                        </p>
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="text-primary hover:text-primary/80 mr-2">
                            <Edit className="w-4 h-4" />
                          </button>
                          <button 
                            onClick={() => deleteTransaction.mutate(transaction.id)}
                            className="text-destructive hover:text-destructive/80"
                            disabled={deleteTransaction.isPending}
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma transação encontrada</p>
                <p className="text-sm">Use os filtros acima ou adicione uma nova transação!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <TransactionModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        costCenterId={currentCostCenter?.id || 1}
        type={modalType}
      />

      <BottomNav
        onOpenTransactionModal={(type) => {
          setModalType(type);
          setShowModal(true);
        }}
      />
    </div>
  );
}
