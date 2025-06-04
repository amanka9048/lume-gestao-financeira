import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Users, Settings, User, Building2, Shield, Clock } from "lucide-react";

interface DemoUser {
  id: number;
  name: string;
  email: string;
}

interface DemoCostCenter {
  id: number;
  code: string;
  name: string;
  description?: string;
  role: 'admin' | 'collaborator';
  status: 'approved' | 'pending';
  adminUserId: number;
}

export function UserDemo() {
  const [currentUser] = useState<DemoUser>({
    id: 1,
    name: "Maria Silva",
    email: "maria@exemplo.com"
  });

  const [costCenters] = useState<DemoCostCenter[]>([
    {
      id: 1,
      code: "2025FAM01",
      name: "Família Silva",
      description: "Finanças pessoais da família",
      role: "admin",
      status: "approved",
      adminUserId: 1
    },
    {
      id: 2,
      code: "2025EMP02",
      name: "Empresa ABC",
      description: "Departamento financeiro",
      role: "collaborator",
      status: "approved",
      adminUserId: 2
    },
    {
      id: 3,
      code: "2025GRP03",
      name: "Grupo de Investimentos",
      description: "Clube de investimentos",
      role: "collaborator",
      status: "pending",
      adminUserId: 3
    }
  ]);

  const [newCostCenter, setNewCostCenter] = useState({
    code: "",
    name: "",
    description: ""
  });

  const [joinCode, setJoinCode] = useState("");

  const generateCode = () => {
    const year = new Date().getFullYear();
    const randomStr = Math.random().toString(36).substring(2, 5).toUpperCase();
    const randomNum = Math.floor(Math.random() * 100).toString().padStart(2, '0');
    setNewCostCenter(prev => ({ ...prev, code: `${year}${randomStr}${randomNum}` }));
  };

  const approvedCostCenters = costCenters.filter(cc => cc.status === 'approved');
  const pendingCostCenters = costCenters.filter(cc => cc.status === 'pending');

  return (
    <div className="min-h-screen bg-[#121212] p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header com informações do usuário */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#FFD700] p-3 rounded-full">
              <User className="h-6 w-6 text-black" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-white">
                Finanças Fontes
              </h1>
              <p className="text-gray-400">
                Nova Arquitetura: Usuários e Centros de Custo
              </p>
            </div>
          </div>

          <Card className="bg-[#1e1e1e] border-gray-800">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <User className="h-5 w-5" />
                Usuário Logado
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                <div>
                  <p className="text-white font-medium">{currentUser.name}</p>
                  <p className="text-gray-400 text-sm">{currentUser.email}</p>
                </div>
                <Badge className="bg-green-700 text-white">Ativo</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid lg:grid-cols-2 gap-8">
          {/* Centros de Custo Aprovados */}
          <div>
            <h2 className="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              <Building2 className="h-6 w-6" />
              Meus Centros de Custo
            </h2>

            <div className="space-y-4 mb-6">
              {approvedCostCenters.map((costCenter) => (
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
                      <Button
                        size="sm"
                        className="flex-1 bg-[#FFD700] text-black hover:bg-[#e6c200]"
                      >
                        <Building2 className="h-4 w-4 mr-1" />
                        Acessar Dashboard
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

            {/* Solicitações Pendentes */}
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="code" className="text-white">Código</Label>
                  <div className="flex gap-2">
                    <Input
                      id="code"
                      value={newCostCenter.code}
                      onChange={(e) => setNewCostCenter(prev => ({ ...prev, code: e.target.value }))}
                      className="bg-[#2a2a2a] border-gray-700 text-white"
                      placeholder="Ex: 2025ABC01"
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
                <Button className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]">
                  Criar Centro de Custo
                </Button>
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
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code" className="text-white">Código do Centro de Custo</Label>
                  <Input
                    id="join-code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value)}
                    className="bg-[#2a2a2a] border-gray-700 text-white"
                    placeholder="Ex: 2025ABC01"
                  />
                </div>
                <Button 
                  variant="outline" 
                  className="w-full border-gray-700 text-white hover:bg-gray-800"
                >
                  Solicitar Participação
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Resumo da Nova Arquitetura */}
        <Card className="bg-[#1e1e1e] border-gray-800 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Nova Arquitetura: Usuários e Centros de Custo</CardTitle>
            <CardDescription className="text-gray-400">
              Evolução do sistema de casais para uma estrutura multi-usuário colaborativa
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="bg-[#FFD700] p-3 rounded-full w-fit mx-auto mb-3">
                  <User className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-white font-semibold mb-2">Usuários Individuais</h3>
                <p className="text-gray-400 text-sm">
                  Cada pessoa tem sua própria conta com email e senha únicos
                </p>
              </div>
              <div className="text-center">
                <div className="bg-[#FFD700] p-3 rounded-full w-fit mx-auto mb-3">
                  <Building2 className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-white font-semibold mb-2">Centros de Custo</h3>
                <p className="text-gray-400 text-sm">
                  Grupos financeiros com códigos únicos para isolamento de dados
                </p>
              </div>
              <div className="text-center">
                <div className="bg-[#FFD700] p-3 rounded-full w-fit mx-auto mb-3">
                  <Users className="h-6 w-6 text-black" />
                </div>
                <h3 className="text-white font-semibold mb-2">Acesso Colaborativo</h3>
                <p className="text-gray-400 text-sm">
                  Usuários podem participar de múltiplos centros com diferentes permissões
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}