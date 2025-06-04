import { useState, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Users, Settings, Building2, Shield, Clock, User, LogOut, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Link } from "wouter";
import type { CostCenter, UserCostCenter, User as UserType } from "@shared/schema";

interface CostCenterWithRole extends CostCenter {
  role: string;
  status: string;
}

export function CostCenterDashboard() {
  const { user, logout } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [newCostCenter, setNewCostCenter] = useState({
    code: "",
    name: "",
    description: ""
  });

  const [joinCode, setJoinCode] = useState("");

  // Fetch user's cost centers
  const { data: costCenters = [], isLoading } = useQuery({
    queryKey: ["/api/users", user?.id, "cost-centers"],
    queryFn: async () => {
      const response = await apiRequest("GET", `/api/users/${user?.id}/cost-centers`);
      return response.json() as Promise<CostCenterWithRole[]>;
    },
    enabled: !!user?.id,
  });

  // Create cost center mutation
  const createCostCenterMutation = useMutation({
    mutationFn: async (data: typeof newCostCenter) => {
      const response = await apiRequest("POST", "/api/cost-centers", {
        ...data,
        adminUserId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Centro de custo criado!",
        description: "Você foi automaticamente adicionado como administrador.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "cost-centers"] });
      setNewCostCenter({ code: "", name: "", description: "" });
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao criar centro de custo",
        description: error.message || "Tente novamente",
        variant: "destructive",
      });
    },
  });

  // Join cost center mutation
  const joinCostCenterMutation = useMutation({
    mutationFn: async (code: string) => {
      const response = await apiRequest("POST", "/api/cost-centers/join", {
        code,
        userId: user?.id,
      });
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Solicitação enviada!",
        description: "Aguarde a aprovação do administrador do centro de custo.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "cost-centers"] });
      setJoinCode("");
    },
    onError: (error: any) => {
      toast({
        title: "Erro ao solicitar acesso",
        description: error.message || "Verifique o código e tente novamente",
        variant: "destructive",
      });
    },
  });

  const deleteCostCenterMutation = useMutation({
    mutationFn: async (costCenterId: number) => {
      const response = await fetch(`/api/cost-centers/${costCenterId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ userId: user?.id }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Failed to delete cost center");
      }
      
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Centro de custo deletado", description: "O centro de custo foi deletado com sucesso!" });
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "cost-centers"] });
    },
    onError: (error: Error) => {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    },
  });

  const generateCode = () => {
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setNewCostCenter(prev => ({ ...prev, code: `${year}${randomStr}${randomNum}` }));
  };

  const handleCreateCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCostCenter.code || !newCostCenter.name) {
      toast({
        title: "Campos obrigatórios",
        description: "Código e nome são obrigatórios",
        variant: "destructive",
      });
      return;
    }
    createCostCenterMutation.mutate(newCostCenter);
  };

  const handleJoinCostCenter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCode.trim()) {
      toast({
        title: "Código obrigatório",
        description: "Digite o código do centro de custo",
        variant: "destructive",
      });
      return;
    }
    joinCostCenterMutation.mutate(joinCode.trim());
  };

  const handleDeleteCostCenter = (costCenter: any) => {
    const confirmed = window.confirm(
      `Tem certeza que deseja deletar o centro de custo "${costCenter.name}"?\n\nEsta ação não pode ser desfeita e todos os dados relacionados serão perdidos.`
    );
    
    if (confirmed) {
      deleteCostCenterMutation.mutate(costCenter.id);
    }
  };

  const approvedCostCenters = costCenters.filter(cc => cc.status === 'approved');
  const pendingCostCenters = costCenters.filter(cc => cc.status === 'pending');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#FFD700] p-3 rounded-full">
              <Building2 className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Painel de Centros de Custo
              </h1>
              <p className="text-gray-400">
                Gerencie seus centros de custo e colaborações financeiras
              </p>
            </div>
          </div>

          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Usuário Logado
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={logout}
                  className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                >
                  <LogOut className="h-4 w-4 mr-1" />
                  Sair
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user?.avatar || undefined} alt="Avatar do usuário" />
                    <AvatarFallback className="bg-[#FFD700] text-black font-semibold">
                      {user ? user.name.charAt(0).toUpperCase() : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-white font-medium">{user?.name}</p>
                    <p className="text-gray-400 text-sm">{user?.email}</p>
                  </div>
                  <Badge className="bg-green-700 text-white">Ativo</Badge>
                </div>
                <Link href="/profile">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-blue-600 text-blue-400 hover:bg-blue-600 hover:text-white"
                  >
                    <Edit className="h-4 w-4 mr-1" />
                    Editar Perfil
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Centros de Custo */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Meus Centros de Custo
            </h2>

            {/* Aprovados */}
            <div className="space-y-4 mb-6">
              {approvedCostCenters.length === 0 ? (
                <Card className="bg-[#1e1e1e] border-gray-800">
                  <CardContent className="p-6 text-center">
                    <Building2 className="h-12 w-12 text-gray-600 mx-auto mb-4" />
                    <p className="text-gray-400 mb-4">
                      Você ainda não participa de nenhum centro de custo
                    </p>
                    <p className="text-gray-500 text-sm">
                      Crie um novo ou solicite acesso a um existente
                    </p>
                  </CardContent>
                </Card>
              ) : (
                approvedCostCenters.map((costCenter) => (
                  <Card key={costCenter.id} className="bg-[#1e1e1e] border-gray-800 hover:border-gray-700 transition-colors">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-white text-lg">{costCenter.name}</CardTitle>
                          <CardDescription className="text-gray-400">
                            Código: {costCenter.code}
                          </CardDescription>
                        </div>
                        <div className="flex gap-2">
                          <Badge 
                            variant={costCenter.role === 'admin' ? 'default' : 'secondary'}
                            className={costCenter.role === 'admin' ? 'bg-[#FFD700] text-black' : 'bg-gray-700 text-white'}
                          >
                            {costCenter.role === 'admin' ? (
                              <><Shield className="h-3 w-3 mr-1" />Admin</>
                            ) : (
                              <><Users className="h-3 w-3 mr-1" />Colaborador</>
                            )}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      {costCenter.description && (
                        <p className="text-gray-400 text-sm mb-4">{costCenter.description}</p>
                      )}
                      <div className="flex gap-2">
                        <Link href={`/dashboard/${costCenter.id}`}>
                          <Button
                            size="sm"
                            className="flex-1 bg-[#FFD700] text-black hover:bg-[#e6c200]"
                          >
                            <Building2 className="h-4 w-4 mr-1" />
                            Acessar
                          </Button>
                        </Link>
                        {costCenter.role === 'admin' && (
                          <>
                            <Link href={`/settings/${costCenter.id}`}>
                              <Button
                                size="sm"
                                variant="outline"
                                className="border-gray-700 text-white hover:bg-gray-800"
                              >
                                <Settings className="h-4 w-4" />
                              </Button>
                            </Link>
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                              onClick={() => handleDeleteCostCenter(costCenter)}
                              disabled={deleteCostCenterMutation.isPending}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>

            {/* Pendentes */}
            {pendingCostCenters.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3 flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Solicitações Pendentes
                </h3>
                {pendingCostCenters.map((costCenter) => (
                  <Card key={costCenter.id} className="bg-[#2a2a2a] border-yellow-700">
                    <CardContent className="p-4">
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-white font-medium">{costCenter.name}</p>
                          <p className="text-gray-400 text-sm">Código: {costCenter.code}</p>
                        </div>
                        <Badge variant="outline" className="border-yellow-600 text-yellow-400">
                          Aguardando Aprovação
                        </Badge>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Ações */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4">Ações</h2>

            {/* Criar Centro de Custo */}
            <Card className="bg-[#1e1e1e] border-gray-800 mb-6">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Criar Centro de Custo
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Crie um novo centro de custo e seja o administrador
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCreateCostCenter} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="code" className="text-white">Código</Label>
                    <div className="flex gap-2">
                      <Input
                        id="code"
                        value={newCostCenter.code}
                        onChange={(e) => setNewCostCenter(prev => ({ ...prev, code: e.target.value }))}
                        className="bg-[#2a2a2a] border-gray-700 text-white"
                        placeholder="Ex: 2025ABC01"
                        required
                      />
                      <Button 
                        type="button" 
                        onClick={generateCode} 
                        variant="outline" 
                        className="border-gray-700 text-white hover:bg-gray-800"
                      >
                        Gerar
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="name" className="text-white">Nome</Label>
                    <Input
                      id="name"
                      value={newCostCenter.name}
                      onChange={(e) => setNewCostCenter(prev => ({ ...prev, name: e.target.value }))}
                      className="bg-[#2a2a2a] border-gray-700 text-white"
                      placeholder="Ex: Família Silva"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="description" className="text-white">Descrição</Label>
                    <Input
                      id="description"
                      value={newCostCenter.description}
                      onChange={(e) => setNewCostCenter(prev => ({ ...prev, description: e.target.value }))}
                      className="bg-[#2a2a2a] border-gray-700 text-white"
                      placeholder="Opcional"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
                    disabled={createCostCenterMutation.isPending}
                  >
                    {createCostCenterMutation.isPending ? "Criando..." : "Criar Centro de Custo"}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Participar de Centro de Custo */}
            <Card className="bg-[#1e1e1e] border-gray-800">
              <CardHeader>
                <CardTitle className="text-white flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Participar de Centro de Custo
                </CardTitle>
                <CardDescription className="text-gray-400">
                  Digite o código para solicitar participação
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleJoinCostCenter} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="join-code" className="text-white">Código do Centro de Custo</Label>
                    <Input
                      id="join-code"
                      value={joinCode}
                      onChange={(e) => setJoinCode(e.target.value)}
                      className="bg-[#2a2a2a] border-gray-700 text-white"
                      placeholder="Ex: 2025ABC01"
                      required
                    />
                  </div>
                  <Button 
                    type="submit"
                    variant="outline" 
                    className="w-full border-gray-700 text-white hover:bg-gray-800"
                    disabled={joinCostCenterMutation.isPending}
                  >
                    {joinCostCenterMutation.isPending ? "Solicitando..." : "Solicitar Participação"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}