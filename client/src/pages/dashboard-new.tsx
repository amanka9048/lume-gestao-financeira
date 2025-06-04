import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Plus, Minus, TrendingUp, TrendingDown, BarChart3, Users, WalletIcon, Tag, ArrowLeft, Bell, FileText, PieChart, Eye, EyeOff, CreditCard, Settings } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { WalletModal } from "@/components/modals/wallet-modal";
import { CategoryModal } from "@/components/modals/category-modal";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/lib/auth-context";
import { Area, AreaChart, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";
import type { CostCenter, UserCostCenter, User } from "@shared/schema";

export function Dashboard() {
  const { costCenterId } = useParams<{ costCenterId: string }>();
  const { user } = useAuth();
  const [hideValues, setHideValues] = useState(false);
  const [transactionModal, setTransactionModal] = useState<{open: boolean, type: 'income' | 'expense'}>({
    open: false,
    type: 'income'
  });
  const [walletModal, setWalletModal] = useState(false);
  const [categoryModal, setCategoryModal] = useState(false);

  // Fetch cost center data
  const { data: costCenter, isLoading: costCenterLoading } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers/${costCenterId}`);
      if (!response.ok) throw new Error('Failed to fetch cost center');
      return response.json() as Promise<CostCenter>;
    }
  });

  // Fetch wallets
  const { data: wallets = [], isLoading: walletsLoading } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "wallets"],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers/${costCenterId}/wallets`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    }
  });

  // Fetch credit cards
  const { data: creditCards = [], isLoading: creditCardsLoading } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "credit-cards"],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers/${costCenterId}/credit-cards`);
      if (!response.ok) throw new Error('Failed to fetch credit cards');
      return response.json();
    }
  });

  // Fetch transactions for chart
  const { data: transactions = [] } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "transactions"],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers/${costCenterId}/transactions`);
      if (!response.ok) throw new Error('Failed to fetch transactions');
      return response.json();
    }
  });

  // Fetch pending memberships for notifications
  const { data: pendingMemberships = [] } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "pending-memberships"],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers/${costCenterId}/pending-memberships`);
      if (!response.ok) throw new Error('Failed to fetch pending memberships');
      return response.json() as Promise<Array<UserCostCenter & { user: User }>>;
    }
  });

  // Calculate totals
  const totalBalance = wallets.reduce((sum: number, wallet: any) => sum + parseFloat(wallet.balance || '0'), 0);
  const totalCreditLimit = creditCards.reduce((sum: number, card: any) => sum + parseFloat(card.limit || '0'), 0);
  const totalCreditUsed = creditCards.reduce((sum: number, card: any) => sum + parseFloat(card.currentBalance || '0'), 0);
  const availableCredit = totalCreditLimit - totalCreditUsed;

  // Prepare chart data
  const chartData = transactions
    .slice(-30) // Last 30 transactions
    .map((transaction: any, index: number) => ({
      name: `T${index + 1}`,
      receitas: transaction.type === 'income' ? parseFloat(transaction.amount) : 0,
      despesas: transaction.type === 'expense' ? parseFloat(transaction.amount) : 0,
    }));

  const formatCurrency = (amount: number) => {
    if (hideValues) return "R$ ••••••";
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const getUserInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  };

  if (costCenterLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
            <p className="mt-4 text-gray-400">Carregando dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!costCenter) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center py-12">
            <p className="text-red-400">Centro de custo não encontrado</p>
            <Button 
              onClick={() => window.location.href = '/cost-centers'}
              className="mt-4 bg-[#FFD700] text-black hover:bg-[#e6c200]"
            >
              Voltar para Centros de Custo
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header with User Avatar and Notifications */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => window.location.href = '/cost-centers'}
              className="text-gray-400 hover:text-white"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar
            </Button>
            <Avatar className="h-12 w-12">
              <AvatarFallback className="bg-[#FFD700] text-black font-semibold">
                {user ? getUserInitials(user.name) : 'U'}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="text-xl font-semibold text-white">{user?.name || 'Usuário'}</h2>
              <p className="text-sm text-gray-400">{costCenter.name}</p>
            </div>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/notifications/${costCenter.id}`}
            className="relative"
          >
            <Bell className="h-6 w-6 text-gray-400" />
            {pendingMemberships.length > 0 && (
              <Badge 
                variant="destructive" 
                className="absolute -top-1 -right-1 h-5 w-5 rounded-full p-0 flex items-center justify-center text-xs"
              >
                {pendingMemberships.length}
              </Badge>
            )}
          </Button>
        </div>

        {/* General Balance */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-400">Saldo Geral</p>
                <p className="text-3xl font-bold text-white mt-1">
                  {formatCurrency(totalBalance)}
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setHideValues(!hideValues)}
                className="text-gray-400 hover:text-white"
              >
                {hideValues ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* My Wallets */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white flex items-center justify-between">
              <span>Minhas Carteiras</span>
              <Button
                size="sm"
                onClick={() => setWalletModal(true)}
                className="bg-[#FFD700] text-black hover:bg-[#e6c200]"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {walletsLoading ? (
              <div className="text-center text-gray-400 py-4">Carregando carteiras...</div>
            ) : wallets.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <WalletIcon className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p>Nenhuma carteira encontrada</p>
                <p className="text-sm">Crie sua primeira carteira para começar</p>
              </div>
            ) : (
              <div className="space-y-3">
                {wallets.map((wallet: any) => (
                  <div key={wallet.id} className="flex justify-between items-center p-4 bg-[#2a2a2a] rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="bg-blue-600 p-2 rounded-lg">
                        <WalletIcon className="h-4 w-4 text-white" />
                      </div>
                      <div>
                        <p className="text-white font-medium">{wallet.name}</p>
                        <p className="text-sm text-gray-400 capitalize">{wallet.type}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-white font-bold">
                        {formatCurrency(parseFloat(wallet.balance || '0'))}
                      </p>
                      {wallet.isDefault && (
                        <span className="text-xs text-[#FFD700]">Padrão</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Credit Cards */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Cartões de Crédito</CardTitle>
          </CardHeader>
          <CardContent>
            {creditCardsLoading ? (
              <div className="text-center text-gray-400 py-4">Carregando cartões...</div>
            ) : creditCards.length === 0 ? (
              <div className="text-center text-gray-400 py-8">
                <CreditCard className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                <p>Nenhum cartão cadastrado</p>
              </div>
            ) : (
              <div className="space-y-4">
                {creditCards.map((card: any) => (
                  <div key={card.id} className="p-4 bg-[#2a2a2a] rounded-lg">
                    <div className="flex justify-between items-start mb-3">
                      <div className="flex items-center gap-3">
                        <div className="bg-purple-600 p-2 rounded-lg">
                          <CreditCard className="h-4 w-4 text-white" />
                        </div>
                        <div>
                          <p className="text-white font-medium">{card.name}</p>
                          <p className="text-sm text-gray-400">Vencimento: {card.dueDate}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-400">Fatura Atual</p>
                        <p className="text-lg font-semibold text-red-400">
                          {formatCurrency(parseFloat(card.currentBalance || '0'))}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-400">Limite Disponível</p>
                        <p className="text-lg font-semibold text-green-400">
                          {formatCurrency(parseFloat(card.limit || '0') - parseFloat(card.currentBalance || '0'))}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-gray-700 text-gray-400 hover:text-white hover:bg-gray-800"
                >
                  <Settings className="h-4 w-4 mr-2" />
                  Gerenciar Cartões
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Chart Dashboard */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Fluxo Financeiro</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis dataKey="name" stroke="#6b7280" />
                  <YAxis stroke="#6b7280" />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: '#2a2a2a', 
                      border: '1px solid #4b5563',
                      borderRadius: '8px'
                    }}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="receitas" 
                    stackId="1"
                    stroke="#10b981" 
                    fill="#10b981" 
                    fillOpacity={0.6}
                  />
                  <Area 
                    type="monotone" 
                    dataKey="despesas" 
                    stackId="2"
                    stroke="#ef4444" 
                    fill="#ef4444" 
                    fillOpacity={0.6}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-8 mt-4">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                <span className="text-sm text-gray-400">Receitas</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                <span className="text-sm text-gray-400">Despesas</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <div className="grid md:grid-cols-2 gap-4">
          <Button
            onClick={() => setTransactionModal({open: true, type: 'income'})}
            className="bg-green-600 hover:bg-green-700 text-white h-16 flex items-center gap-4"
          >
            <Plus className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Nova Receita</div>
              <div className="text-sm opacity-90">Adicionar entrada</div>
            </div>
          </Button>
          
          <Button
            onClick={() => setTransactionModal({open: true, type: 'expense'})}
            className="bg-red-600 hover:bg-red-700 text-white h-16 flex items-center gap-4"
          >
            <Minus className="h-6 w-6" />
            <div className="text-left">
              <div className="font-semibold">Nova Despesa</div>
              <div className="text-sm opacity-90">Registrar gasto</div>
            </div>
          </Button>
        </div>

        {/* Reports Options */}
        <Card className="bg-[#1e1e1e] border-gray-800">
          <CardHeader>
            <CardTitle className="text-white">Relatórios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-20"
                onClick={() => window.location.href = `/reports/wallets/${costCenter.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <WalletIcon className="h-6 w-6 text-blue-400" />
                  <div className="text-center">
                    <div className="font-medium">Por Carteiras</div>
                    <div className="text-xs text-gray-400">Saldos e movimentações</div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-20"
                onClick={() => window.location.href = `/reports/transactions/${costCenter.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <BarChart3 className="h-6 w-6 text-green-400" />
                  <div className="text-center">
                    <div className="font-medium">Por Transações</div>
                    <div className="text-xs text-gray-400">Histórico detalhado</div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-20"
                onClick={() => window.location.href = `/reports/categories/${costCenter.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <PieChart className="h-6 w-6 text-purple-400" />
                  <div className="text-center">
                    <div className="font-medium">Por Categorias</div>
                    <div className="text-xs text-gray-400">Gastos por categoria</div>
                  </div>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-20"
                onClick={() => window.location.href = `/reports/users/${costCenter.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <Users className="h-6 w-6 text-orange-400" />
                  <div className="text-center">
                    <div className="font-medium">Por Usuários</div>
                    <div className="text-xs text-gray-400">Atividade por pessoa</div>
                  </div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modals */}
      <TransactionModal
        isOpen={transactionModal.open}
        onClose={() => setTransactionModal({...transactionModal, open: false})}
        type={transactionModal.type}
        costCenterId={Number(costCenterId)}
      />

      <WalletModal
        isOpen={walletModal}
        onClose={() => setWalletModal(false)}
        costCenterId={Number(costCenterId)}
      />

      <CategoryModal
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        costCenterId={Number(costCenterId)}
      />
    </div>
  );
}