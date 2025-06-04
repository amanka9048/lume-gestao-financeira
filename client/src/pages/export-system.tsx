import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Download, Database, FileText, Package, AlertCircle, CheckCircle, Github, ExternalLink } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { apiRequest } from "@/lib/queryClient";

interface CostCenter {
  id: number;
  name: string;
  description: string;
  code: string;
}

export function ExportSystem() {
  const { toast } = useToast();
  const [exportingType, setExportingType] = useState<string | null>(null);
  const [githubForm, setGithubForm] = useState({
    repoName: "lume-financial-system",
    description: "Sistema de Gestão Financeira Lume - Exportado do Replit",
    isPrivate: true
  });
  const [githubResult, setGithubResult] = useState<any>(null);

  // Get user's cost centers
  const { data: costCenters, isLoading } = useQuery<CostCenter[]>({
    queryKey: ["/api/user/cost-centers"]
  });

  const downloadFile = (url: string, filename: string) => {
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportDatabase = useMutation({
    mutationFn: async (costCenterId: number) => {
      const response = await fetch(`/api/export/database/${costCenterId}`);
      if (!response.ok) throw new Error('Erro ao exportar banco de dados');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'lume-export.json';
      downloadFile(url, filename);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Exportação concluída",
        description: "Dados do sistema exportados com sucesso!",
      });
      setExportingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
      setExportingType(null);
    },
  });

  const exportComplete = useMutation({
    mutationFn: async (costCenterId: number) => {
      const response = await fetch(`/api/export/complete/${costCenterId}`);
      if (!response.ok) throw new Error('Erro ao exportar sistema completo');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'lume-complete-export.zip';
      downloadFile(url, filename);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Exportação completa concluída",
        description: "Sistema completo exportado com sucesso!",
      });
      setExportingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
      setExportingType(null);
    },
  });

  const exportSQL = useMutation({
    mutationFn: async (costCenterId: number) => {
      const response = await fetch(`/api/export/sql/${costCenterId}`);
      if (!response.ok) throw new Error('Erro ao exportar SQL');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const filename = response.headers.get('content-disposition')?.split('filename=')[1]?.replace(/"/g, '') || 'lume-export.sql';
      downloadFile(url, filename);
      window.URL.revokeObjectURL(url);
    },
    onSuccess: () => {
      toast({
        title: "Exportação SQL concluída",
        description: "Arquivo SQL exportado com sucesso!",
      });
      setExportingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na exportação",
        description: error.message,
        variant: "destructive",
      });
      setExportingType(null);
    },
  });

  const exportToGitHub = useMutation({
    mutationFn: async (formData: typeof githubForm) => {
      const response = await fetch("/api/export/github", {
        method: "POST",
        body: JSON.stringify(formData),
        headers: {
          "Content-Type": "application/json",
        },
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao exportar para GitHub');
      }
      
      return response.json();
    },
    onSuccess: (data: any) => {
      setGithubResult(data);
      toast({
        title: "Exportação para GitHub concluída!",
        description: `Repositório '${data.repository?.name}' criado com sucesso`,
      });
      setExportingType(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro na exportação para GitHub",
        description: error.message,
        variant: "destructive",
      });
      setExportingType(null);
    },
  });

  const handleExport = (type: string, costCenterId: number) => {
    setExportingType(type);
    
    switch (type) {
      case 'database':
        exportDatabase.mutate(costCenterId);
        break;
      case 'complete':
        exportComplete.mutate(costCenterId);
        break;
      case 'sql':
        exportSQL.mutate(costCenterId);
        break;
    }
  };

  const handleGitHubExport = () => {
    if (!githubForm.repoName.trim()) {
      toast({
        title: "Nome do repositório obrigatório",
        description: "Digite um nome para o repositório GitHub",
        variant: "destructive",
      });
      return;
    }
    
    setExportingType('github');
    exportToGitHub.mutate(githubForm);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin h-8 w-8 border-b-2 border-blue-600 rounded-full mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando opções de exportação...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Exportar Sistema</h1>
        <p className="text-muted-foreground mt-2">
          Baixe todo o sistema Lume para seu computador, incluindo dados e código-fonte
        </p>
      </div>

      <Alert className="mb-6">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          <strong>Importante:</strong> As exportações incluem dados sensíveis. Mantenha os arquivos seguros e não compartilhe com terceiros.
        </AlertDescription>
      </Alert>

      {!costCenters || costCenters.length === 0 ? (
        <Card>
          <CardContent className="p-6">
            <div className="text-center">
              <AlertCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Nenhum centro de custo encontrado</h3>
              <p className="text-muted-foreground">
                Você precisa ter acesso a pelo menos um centro de custo para fazer exportações.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {costCenters.map((costCenter) => (
            <Card key={costCenter.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2">
                      {costCenter.name}
                      <Badge variant="secondary">{costCenter.code}</Badge>
                    </CardTitle>
                    <CardDescription>{costCenter.description}</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Exportação de Dados */}
                  <Card className="relative">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Database className="h-5 w-5 text-blue-600" />
                        Dados Apenas
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Exporta apenas os dados financeiros em formato JSON
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Transações
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Categorias
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Carteiras
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Usuários
                        </div>
                      </div>
                      <Button
                        onClick={() => handleExport('database', costCenter.id)}
                        disabled={exportingType === 'database'}
                        className="w-full"
                        variant="outline"
                      >
                        {exportingType === 'database' ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full mr-2"></div>
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar JSON
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Exportação Completa */}
                  <Card className="relative border-blue-200 bg-blue-50/50">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Package className="h-5 w-5 text-blue-600" />
                        Sistema Completo
                        <Badge className="bg-blue-600">Recomendado</Badge>
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Código-fonte + dados + instruções de instalação
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Todo o código-fonte
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Todos os dados
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Instruções de instalação
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Pronto para usar
                        </div>
                      </div>
                      <Button
                        onClick={() => handleExport('complete', costCenter.id)}
                        disabled={exportingType === 'complete'}
                        className="w-full"
                      >
                        {exportingType === 'complete' ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full mr-2"></div>
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar ZIP
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>

                  {/* Exportação SQL */}
                  <Card className="relative">
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <FileText className="h-5 w-5 text-green-600" />
                        SQL Dump
                      </CardTitle>
                      <CardDescription className="text-sm">
                        Comandos SQL para restaurar os dados
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-sm text-muted-foreground mb-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Comandos INSERT
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Compatível PostgreSQL
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Fácil importação
                        </div>
                        <div className="flex items-center gap-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          Texto puro
                        </div>
                      </div>
                      <Button
                        onClick={() => handleExport('sql', costCenter.id)}
                        disabled={exportingType === 'sql'}
                        className="w-full"
                        variant="outline"
                      >
                        {exportingType === 'sql' ? (
                          <>
                            <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full mr-2"></div>
                            Exportando...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            Baixar SQL
                          </>
                        )}
                      </Button>
                    </CardContent>
                  </Card>
                </div>

                <Separator className="my-4" />
                
                <div className="text-sm text-muted-foreground">
                  <h4 className="font-semibold mb-2">O que está incluído:</h4>
                  <ul className="list-disc list-inside space-y-1">
                    <li>Todas as transações e movimentações financeiras</li>
                    <li>Configurações de categorias e carteiras</li>
                    <li>Dados de usuários e permissões</li>
                    <li>Histórico de parcelamentos e cartões de crédito</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* GitHub Export Section */}
      <Card className="mt-8 border-blue-200 bg-blue-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-blue-800">
            <Github className="h-6 w-6" />
            Exportar para GitHub
          </CardTitle>
          <CardDescription>
            Crie um repositório em sua conta GitHub com todo o código-fonte do sistema Lume
          </CardDescription>
        </CardHeader>
        <CardContent>
          {githubResult ? (
            <div className="space-y-4">
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Exportação concluída com sucesso!</strong>
                </AlertDescription>
              </Alert>
              
              <div className="bg-white p-4 rounded-lg border">
                <h4 className="font-semibold mb-3">Repositório criado:</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Nome:</span>
                    <span className="font-mono">{githubResult.repository.name}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Arquivos:</span>
                    <span>{githubResult.filesUploaded} arquivos</span>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => window.open(githubResult.repository.url, '_blank')}
                      className="flex-1"
                    >
                      <ExternalLink className="h-4 w-4 mr-2" />
                      Ver no GitHub
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        navigator.clipboard.writeText(githubResult.repository.clone_url);
                        toast({
                          title: "Copiado!",
                          description: "URL de clone copiada para a área de transferência",
                        });
                      }}
                    >
                      Copiar Clone URL
                    </Button>
                  </div>
                </div>
              </div>
              
              <Button
                variant="outline"
                onClick={() => {
                  setGithubResult(null);
                  setGithubForm({
                    repoName: "lume-financial-system",
                    description: "Sistema de Gestão Financeira Lume - Exportado do Replit",
                    isPrivate: true
                  });
                }}
                className="w-full"
              >
                Exportar Novamente
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="repoName">Nome do Repositório</Label>
                  <Input
                    id="repoName"
                    value={githubForm.repoName}
                    onChange={(e) => setGithubForm({ ...githubForm, repoName: e.target.value })}
                    placeholder="lume-financial-system"
                    disabled={exportingType === 'github'}
                  />
                  <p className="text-xs text-gray-500">
                    Apenas letras, números, hífens e underscores são permitidos
                  </p>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="description">Descrição (opcional)</Label>
                  <Textarea
                    id="description"
                    value={githubForm.description}
                    onChange={(e) => setGithubForm({ ...githubForm, description: e.target.value })}
                    placeholder="Descrição do repositório..."
                    rows={3}
                    disabled={exportingType === 'github'}
                  />
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="private"
                    checked={githubForm.isPrivate}
                    onCheckedChange={(checked) => setGithubForm({ ...githubForm, isPrivate: checked })}
                    disabled={exportingType === 'github'}
                  />
                  <Label htmlFor="private">Repositório privado</Label>
                </div>
              </div>
              
              <div className="pt-4">
                <Button
                  onClick={handleGitHubExport}
                  disabled={exportingType === 'github' || !githubForm.repoName.trim()}
                  className="w-full bg-blue-600 hover:bg-blue-700"
                >
                  {exportingType === 'github' ? (
                    <>
                      <div className="animate-spin h-4 w-4 border-b-2 border-current rounded-full mr-2"></div>
                      Criando repositório...
                    </>
                  ) : (
                    <>
                      <Github className="h-4 w-4 mr-2" />
                      Exportar para GitHub
                    </>
                  )}
                </Button>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg text-sm text-gray-600">
                <h5 className="font-semibold mb-2">O que será exportado:</h5>
                <ul className="list-disc list-inside space-y-1">
                  <li>Todo o código-fonte (Frontend + Backend)</li>
                  <li>Arquivo README.md com instruções de instalação</li>
                  <li>Configurações de desenvolvimento</li>
                  <li>Esquemas de banco de dados</li>
                </ul>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-8 border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-amber-800">
            <AlertCircle className="h-5 w-5" />
            Instruções de Uso
          </CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-amber-800">
          <div className="space-y-3">
            <div>
              <strong>Exportação de Dados (JSON):</strong> Use para backup rápido ou migração de dados. Pode ser importado em outros sistemas.
            </div>
            <div>
              <strong>Sistema Completo (ZIP):</strong> Contém tudo que você precisa para instalar o Lume em outro servidor. Inclui código-fonte, dados e instruções.
            </div>
            <div>
              <strong>SQL Dump:</strong> Comandos SQL para restaurar apenas os dados em um banco PostgreSQL existente.
            </div>
            <div className="pt-2 border-t border-amber-200">
              <strong>Importante:</strong> Mantenha os arquivos exportados em local seguro. Eles contêm informações financeiras sensíveis.
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}