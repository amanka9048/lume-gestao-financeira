import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Settings as SettingsIcon, Plus, Edit, Trash2, ArrowLeft } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useParams } from "wouter";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import type { Category, InsertCategory } from "@shared/schema";

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  color: string;
}

const DEFAULT_COLORS = [
  "#FF6B6B", "#4ECDC4", "#45B7D1", "#96CEB4", "#FECA57", "#FF9FF3", 
  "#54A0FF", "#5F27CD", "#00D2D3", "#FF9F43", "#A3CB38", "#FDA7DF"
];

export function Settings() {
  const { costCenterId } = useParams<{ costCenterId: string }>();
  const { toast } = useToast();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState<CategoryFormData>({
    name: "",
    type: "expense",
    color: DEFAULT_COLORS[0]
  });

  const { data: categories = [], isLoading } = useQuery<Category[]>({
    queryKey: ['/api/cost-centers', costCenterId, 'categories'],
    enabled: !!costCenterId,
  });

  const createCategoryMutation = useMutation({
    mutationFn: async (data: InsertCategory) => {
      const response = await apiRequest('POST', '/api/categories', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', couple?.id] });
      setIsDialogOpen(false);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Categoria criada com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao criar categoria. Tente novamente.",
        variant: "destructive",
      });
    }
  });

  const updateCategoryMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<Category> }) => {
      const response = await apiRequest('PUT', `/api/categories/${id}`, data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', couple?.id] });
      setIsDialogOpen(false);
      setEditingCategory(null);
      resetForm();
      toast({
        title: "Sucesso",
        description: "Categoria atualizada com sucesso!",
      });
    }
  });

  const deleteCategoryMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/categories/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/categories', couple?.id] });
      toast({
        title: "Sucesso",
        description: "Categoria excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir categoria. Pode estar sendo usada em transações.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      name: "",
      type: "expense",
      color: DEFAULT_COLORS[0]
    });
  };

  const handleSubmit = () => {
    if (!formData.name.trim() || !couple?.id) return;

    if (editingCategory) {
      updateCategoryMutation.mutate({
        id: editingCategory.id,
        data: formData
      });
    } else {
      createCategoryMutation.mutate({
        ...formData,
        coupleId: couple.id
      });
    }
  };

  const handleEdit = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      type: category.type as 'income' | 'expense',
      color: category.color || DEFAULT_COLORS[0]
    });
    setIsDialogOpen(true);
  };

  const handleDelete = (categoryId: number) => {
    if (confirm('Tem certeza que deseja excluir esta categoria?')) {
      deleteCategoryMutation.mutate(categoryId);
    }
  };

  const openNewCategoryDialog = () => {
    setEditingCategory(null);
    resetForm();
    setIsDialogOpen(true);
  };

  const incomeCategories = categories.filter(cat => cat.type === 'income');
  const expenseCategories = categories.filter(cat => cat.type === 'expense');

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-8">
            <SettingsIcon className="h-8 w-8 text-[#FFD700]" />
            <h1 className="text-3xl font-bold">Configurações</h1>
          </div>
          <div className="text-center py-8">Carregando...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#121212] text-white p-4 md:p-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="flex items-center gap-3 mb-8">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <SettingsIcon className="h-8 w-8 text-[#FFD700]" />
          <h1 className="text-3xl font-bold">Configurações</h1>
        </div>

        {/* Categories Management */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle className="text-white">Categorias Personalizadas</CardTitle>
                <CardDescription className="text-gray-400">
                  Gerencie suas categorias de receitas e despesas
                </CardDescription>
              </div>
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                    onClick={openNewCategoryDialog}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Nova Categoria
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700">
                  <DialogHeader>
                    <DialogTitle className="text-white">
                      {editingCategory ? 'Editar Categoria' : 'Nova Categoria'}
                    </DialogTitle>
                    <DialogDescription className="text-gray-400">
                      {editingCategory ? 'Edite os dados da categoria' : 'Crie uma nova categoria personalizada'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name" className="text-white">Nome</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Digite o nome da categoria"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>
                    
                    <div>
                      <Label htmlFor="type" className="text-white">Tipo</Label>
                      <Select 
                        value={formData.type} 
                        onValueChange={(value: 'income' | 'expense') => 
                          setFormData(prev => ({ ...prev, type: value }))
                        }
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="income">Receita</SelectItem>
                          <SelectItem value="expense">Despesa</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label className="text-white">Cor</Label>
                      <div className="grid grid-cols-6 gap-2 mt-2">
                        {DEFAULT_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-full border-2 ${
                              formData.color === color ? 'border-white' : 'border-gray-600'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setFormData(prev => ({ ...prev, color }))}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Cancelar
                    </Button>
                    <Button 
                      type="button" 
                      onClick={handleSubmit}
                      disabled={!formData.name.trim() || createCategoryMutation.isPending || updateCategoryMutation.isPending}
                      className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
                    >
                      {editingCategory ? 'Atualizar' : 'Criar'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2">
              {/* Income Categories */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-green-400">Receitas</h3>
                <div className="space-y-2">
                  {incomeCategories.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma categoria de receita criada</p>
                  ) : (
                    incomeCategories.map((category: Category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color || DEFAULT_COLORS[0] }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* Expense Categories */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-red-400">Despesas</h3>
                <div className="space-y-2">
                  {expenseCategories.length === 0 ? (
                    <p className="text-gray-400 text-sm">Nenhuma categoria de despesa criada</p>
                  ) : (
                    expenseCategories.map((category: Category) => (
                      <div key={category.id} className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded-full" 
                            style={{ backgroundColor: category.color || DEFAULT_COLORS[0] }}
                          />
                          <span>{category.name}</span>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0"
                            onClick={() => handleEdit(category)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="ghost" 
                            className="h-8 w-8 p-0 text-red-400 hover:text-red-300"
                            onClick={() => handleDelete(category.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* User Preferences */}
        <Card className="bg-gray-800/50 border-gray-700">
          <CardHeader>
            <CardTitle className="text-white">Preferências do Sistema</CardTitle>
            <CardDescription className="text-gray-400">
              Configure suas preferências gerais
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Moeda padrão</label>
                <Badge variant="secondary">BRL (R$)</Badge>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Formato de data</label>
                <Badge variant="secondary">DD/MM/AAAA</Badge>
              </div>
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Tema</label>
                <Badge variant="secondary">Escuro</Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}