import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Users, TrendingUp, TrendingDown } from "lucide-react";
import { useParams } from "wouter";
import { useQuery } from "@tanstack/react-query";

interface UserReport {
  user: {
    id: number;
    name: string;
    email: string;
  };
  totalTransactions: number;
  totalIncome: number;
  totalExpenses: number;
  balance: number;
  lastTransactionDate: Date | null;
}

export function ReportsUsers() {
  const { costCenterId } = useParams<{ costCenterId: string }>();

  const { data: userReports = [], isLoading } = useQuery({
    queryKey: ["/api/reports/users", costCenterId],
    queryFn: async () => {
      const response = await fetch(`/api/reports/users/${costCenterId}`);
      if (!response.ok) throw new Error('Failed to fetch user reports');
      return response.json() as Promise<UserReport[]>;
    }
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Nunca';
    return new Date(date).toLocaleDateString('pt-BR');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#FFD700] mx-auto"></div>
            <p className="mt-4 text-gray-400">Carregando relatório de usuários...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => window.location.href = `/dashboard/${costCenterId}`}
            className="text-gray-400 hover:text-white"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar ao Dashboard
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-white flex items-center gap-3">
              <Users className="h-8 w-8 text-orange-400" />
              Relatório por Usuários
            </h1>
            <p className="text-gray-400">Atividade financeira de cada membro do centro de custo</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-400 text-sm">Total de Usuários Ativos</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">{userReports.length}</p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-400 text-sm">Total de Transações</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-white">
                {userReports.reduce((sum, user) => sum + user.totalTransactions, 0)}
              </p>
            </CardContent>
          </Card>
          
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-gray-400 text-sm">Saldo Total</CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`text-2xl font-bold ${
                userReports.reduce((sum, user) => sum + user.balance, 0) >= 0 
                  ? 'text-green-400' 
                  : 'text-red-400'
              }`}>
                {formatCurrency(userReports.reduce((sum, user) => sum + user.balance, 0))}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* User Reports */}
        <div className="grid gap-6">
          {userReports.map((userReport) => (
            <Card key={userReport.user.id} className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-600 p-2 rounded-full">
                      <Users className="h-4 w-4 text-white" />
                    </div>
                    <div>
                      <h3 className="font-semibold">{userReport.user.name}</h3>
                      <p className="text-sm text-gray-400">{userReport.user.email}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-lg font-bold ${
                      userReport.balance >= 0 ? 'text-green-400' : 'text-red-400'
                    }`}>
                      {formatCurrency(userReport.balance)}
                    </p>
                    <p className="text-sm text-gray-400">Saldo líquido</p>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-4 gap-4">
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-4 w-4 text-green-400" />
                      <span className="text-sm text-gray-400">Receitas</span>
                    </div>
                    <p className="text-lg font-semibold text-green-400">
                      {formatCurrency(userReport.totalIncome)}
                    </p>
                  </div>
                  
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingDown className="h-4 w-4 text-red-400" />
                      <span className="text-sm text-gray-400">Despesas</span>
                    </div>
                    <p className="text-lg font-semibold text-red-400">
                      {formatCurrency(userReport.totalExpenses)}
                    </p>
                  </div>
                  
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Users className="h-4 w-4 text-blue-400" />
                      <span className="text-sm text-gray-400">Transações</span>
                    </div>
                    <p className="text-lg font-semibold text-white">
                      {userReport.totalTransactions}
                    </p>
                  </div>
                  
                  <div className="bg-[#2a2a2a] p-4 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-sm text-gray-400">Última Atividade</span>
                    </div>
                    <p className="text-sm text-white">
                      {formatDate(userReport.lastTransactionDate)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {userReports.length === 0 && (
          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardContent className="text-center py-12">
              <Users className="h-12 w-12 text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">Nenhuma atividade de usuário encontrada</p>
              <p className="text-sm text-gray-500">Comece criando transações para ver os relatórios</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}