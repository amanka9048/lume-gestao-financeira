import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Minus, TrendingUp, TrendingDown, BarChart3, Users, Wallet, Tag, ArrowLeft, Bell, FileText, PieChart } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { TransactionModal } from "@/components/modals/transaction-modal";
import { WalletModal } from "@/components/modals/wallet-modal";
import { CategoryModal } from "@/components/modals/category-modal";
import { Badge } from "@/components/ui/badge";
import type { CostCenter, UserCostCenter, User } from "@shared/schema";

export function Dashboard() {
  const { costCenterId } = useParams<{ costCenterId: string }>();
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

  // Fetch pending memberships for notifications
  const { data: pendingMemberships = [] } = useQuery({
    queryKey: ["/api/cost-centers", costCenterId, "pending-memberships"],
    queryFn: async () => {
      const response = await fetch(`/api/cost-centers/${costCenterId}/pending-memberships`);
      if (!response.ok) throw new Error('Failed to fetch pending memberships');
      return response.json() as Promise<Array<UserCostCenter & { user: User }>>;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  if (costCenterLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <div className="max-w-6xl mx-auto">
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
        <div className="max-w-6xl mx-auto">
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
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
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
            <div>
              <h1 className="text-3xl font-bold text-white">{costCenter.name}</h1>
              <p className="text-gray-400">Código: {costCenter.code}</p>
            </div>
          </div>
          
          {/* Notifications */}
          {pendingMemberships.length > 0 && (
            <div className="bg-red-900/20 border border-red-700 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Bell className="h-5 w-5 text-red-400" />
                  <Badge 
                    variant="destructive" 
                    className="absolute -top-2 -right-2 h-4 w-4 rounded-full p-0 flex items-center justify-center text-xs"
                  >
                    {pendingMemberships.length}
                  </Badge>
                </div>
                <div>
                  <p className="text-white font-medium">
                    {pendingMemberships.length} solicitação(ões) pendente(s)
                  </p>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.location.href = `/notifications/${costCenter.id}`}
                    className="mt-2 border-red-700 text-red-400 hover:bg-red-900/30"
                  >
                    Ver Solicitações
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="bg-[#1e1e1e] border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Ações Rápidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              <Button
                onClick={() => setTransactionModal({open: true, type: 'income'})}
                className="bg-green-600 hover:bg-green-700 text-white h-16 flex items-center gap-4"
              >
                <Plus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Nova Receita</div>
                  <div className="text-sm opacity-90">Adicionar entrada de dinheiro</div>
                </div>
              </Button>
              
              <Button
                onClick={() => setTransactionModal({open: true, type: 'expense'})}
                className="bg-red-600 hover:bg-red-700 text-white h-16 flex items-center gap-4"
              >
                <Minus className="h-6 w-6" />
                <div className="text-left">
                  <div className="font-semibold">Nova Despesa</div>
                  <div className="text-sm opacity-90">Registrar gasto ou saída</div>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Management Menu */}
        <Card className="bg-[#1e1e1e] border-gray-800 mb-8">
          <CardHeader>
            <CardTitle className="text-white">Gerenciamento</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-4">
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-16"
                onClick={() => setWalletModal(true)}
              >
                <div className="flex flex-col items-center gap-2">
                  <Wallet className="h-5 w-5 text-blue-400" />
                  <span className="text-sm">Gerenciar Carteiras</span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-16"
                onClick={() => setCategoryModal(true)}
              >
                <div className="flex flex-col items-center gap-2">
                  <Tag className="h-5 w-5 text-purple-400" />
                  <span className="text-sm">Gerenciar Categorias</span>
                </div>
              </Button>
              
              <Button
                variant="outline"
                className="border-gray-700 text-white hover:bg-gray-800 h-16"
                onClick={() => window.location.href = `/transactions/${costCenter.id}`}
              >
                <div className="flex flex-col items-center gap-2">
                  <FileText className="h-5 w-5 text-green-400" />
                  <span className="text-sm">Ver Transações</span>
                </div>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports Menu */}
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
                  <Wallet className="h-6 w-6 text-blue-400" />
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

      {/* Transaction Modal */}
      <TransactionModal
        isOpen={transactionModal.open}
        onClose={() => setTransactionModal({...transactionModal, open: false})}
        type={transactionModal.type}
        costCenterId={Number(costCenterId)}
      />

      {/* Wallet Modal */}
      <WalletModal
        isOpen={walletModal}
        onClose={() => setWalletModal(false)}
        costCenterId={Number(costCenterId)}
      />

      {/* Category Modal */}
      <CategoryModal
        isOpen={categoryModal}
        onClose={() => setCategoryModal(false)}
        costCenterId={Number(costCenterId)}
      />
    </div>
  );
}