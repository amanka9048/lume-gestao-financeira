import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Settings, LogOut, Search, ArrowLeft } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { CostCenter, InsertCostCenter, CostCenterJoinData } from "@shared/schema";

export function CostCenters() {
  const { toast } = useToast();
  const { user, logout } = useAuth();
  const queryClient = useQueryClient();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isJoinOpen, setIsJoinOpen] = useState(false);
  const [createData, setCreateData] = useState<Omit<InsertCostCenter, 'adminUserId'>>({
    code: "",
    name: "",
    description: "",
  });
  const [joinData, setJoinData] = useState<CostCenterJoinData>({
    code: "",
  });

  // Buscar centros de custo do usuário
  const { data: costCenters, isLoading } = useQuery({
    queryKey: ["/api/cost-centers"],
    enabled: !!user,
  });

  // Mutação para criar centro de custo
  const createMutation = useMutation({
    mutationFn: async (data: InsertCostCenter) => {
      return await apiRequest("/api/cost-centers", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centers"] });
      setIsCreateOpen(false);
      setCreateData({ code: "", name: "", description: "" });
      toast({
        title: "Centro de custo criado",
        description: "Centro de custo criado com sucesso!",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar centro de custo",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Mutação para solicitar participação em centro de custo
  const joinMutation = useMutation({
    mutationFn: async (data: CostCenterJoinData) => {
      return await apiRequest("/api/cost-centers/join", {
        method: "POST",
        body: JSON.stringify(data),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/cost-centers"] });
      setIsJoinOpen(false);
      setJoinData({ code: "" });
      toast({
        title: "Solicitação enviada",
        description: "Sua solicitação foi enviada ao administrador do centro de custo.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao solicitar participação",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    createMutation.mutate({
      ...createData,
      adminUserId: user.id,
    });
  };

  const handleJoin = (e: React.FormEvent) => {
    e.preventDefault();
    joinMutation.mutate(joinData);
  };

  const generateCode = () => {
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setCreateData(prev => ({ ...prev, code: `${year}${randomStr}${randomNum}` }));
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] flex items-center justify-center">
        <div className="text-white">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="hover:bg-accent text-white"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">
                Centros de Custo
              </h1>
              <p className="text-gray-400">
                Olá, {user?.name}! Gerencie seus centros de custo financeiro.
              </p>
            </div>
          </div>
          <Button
            onClick={logout}
            variant="outline"
            className="border-gray-700 text-white hover:bg-gray-800"
          >
            <LogOut className="h-4 w-4 mr-2" />
            Sair
          </Button>
        </div>

        {/* Ações */}
        <div className="flex gap-4 mb-8">
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-[#FFD700] text-black hover:bg-[#e6c200]">
                <Plus className="h-4 w-4 mr-2" />
                Criar Centro de Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e1e] border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Criar Centro de Custo</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Crie um novo centro de custo para gerenciar suas finanças.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">Código</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={createData.code}
                      onChange={(e) => setCreateData(prev => ({ ...prev, code: e.target.value }))}
                      className="bg-[#2a2a2a] border-gray-700 text-white"
                      placeholder="Ex: 2025ABC01"
                      required
                    />
                    <Button type="button" onClick={generateCode} variant="outline" className="border-gray-700 text-white">
                      Gerar
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white">Nome</Label>
                  <Input
                    id="name"
                    value={createData.name}
                    onChange={(e) => setCreateData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                    placeholder="Ex: Família Silva"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-white">Descrição</Label>
                  <Input
                    id="description"
                    value={createData.description || ""}
                    onChange={(e) => setCreateData(prev => ({ ...prev, description: e.target.value }))}
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                    placeholder="Opcional"
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
                  disabled={createMutation.isPending}
                >
                  {createMutation.isPending ? "Criando..." : "Criar"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>

          <Dialog open={isJoinOpen} onOpenChange={setIsJoinOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                <Search className="h-4 w-4 mr-2" />
                Participar de Centro de Custo
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-[#1e1e1e] border-gray-800">
              <DialogHeader>
                <DialogTitle className="text-white">Participar de Centro de Custo</DialogTitle>
                <DialogDescription className="text-gray-400">
                  Digite o código do centro de custo para solicitar participação.
                </DialogDescription>
              </DialogHeader>
              <form onSubmit={handleJoin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code" className="text-white">Código do Centro de Custo</Label>
                  <Input
                    id="join-code"
                    value={joinData.code}
                    onChange={(e) => setJoinData(prev => ({ ...prev, code: e.target.value }))}
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                    placeholder="Ex: 2025ABC01"
                    required
                  />
                </div>
                <Button
                  type="submit"
                  className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
                  disabled={joinMutation.isPending}
                >
                  {joinMutation.isPending ? "Solicitando..." : "Solicitar Participação"}
                </Button>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Lista de Centros de Custo */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {costCenters?.map((costCenter: CostCenter & { role: string; status: string }) => (
            <Card key={costCenter.id} className="bg-[#1e1e1e] border-gray-800 hover:border-gray-700 transition-colors">
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-white">{costCenter.name}</CardTitle>
                    <CardDescription className="text-gray-400">
                      Código: {costCenter.code}
                    </CardDescription>
                  </div>
                  <Badge 
                    variant={costCenter.role === 'admin' ? 'default' : 'secondary'}
                    className={costCenter.role === 'admin' ? 'bg-[#FFD700] text-black' : 'bg-gray-700 text-white'}
                  >
                    {costCenter.role === 'admin' ? 'Admin' : 'Colaborador'}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                {costCenter.description && (
                  <p className="text-gray-400 text-sm mb-4">{costCenter.description}</p>
                )}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    className="flex-1 bg-[#FFD700] text-black hover:bg-[#e6c200]"
                    onClick={() => window.location.href = `/dashboard?costCenter=${costCenter.id}`}
                  >
                    <Users className="h-4 w-4 mr-1" />
                    Acessar
                  </Button>
                  {costCenter.role === 'admin' && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="border-gray-700 text-white hover:bg-gray-800"
                    >
                      <Settings className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {(!costCenters || costCenters.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              Você ainda não participa de nenhum centro de custo.
            </div>
            <p className="text-gray-500 text-sm">
              Crie um novo centro de custo ou solicite participação em um existente.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}