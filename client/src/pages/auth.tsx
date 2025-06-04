import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { User, Mail, Lock } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import type { User as UserType } from "@shared/schema";

export function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const loginMutation = useMutation({
    mutationFn: async (data: { email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/login", data);
      return response.json();
    },
    onSuccess: (data: { user: UserType }) => {
      login(data.user);
      toast({
        title: "Login realizado com sucesso!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      // Redirecionar para o painel após login bem-sucedido
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no login",
        description: error.message || "Email ou senha incorretos",
        variant: "destructive",
      });
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: { name: string; email: string; password: string }) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data: { user: UserType }) => {
      login(data.user);
      toast({
        title: "Conta criada com sucesso!",
        description: `Bem-vindo, ${data.user.name}!`,
      });
      // Redirecionar para o painel após registro bem-sucedido
      setLocation("/");
    },
    onError: (error: any) => {
      toast({
        title: "Erro no cadastro",
        description: error.message || "Falha ao criar conta",
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isLogin) {
      loginMutation.mutate({
        email: formData.email,
        password: formData.password,
      });
    } else {
      if (formData.password !== formData.confirmPassword) {
        toast({
          title: "Erro de validação",
          description: "As senhas não coincidem",
          variant: "destructive",
        });
        return;
      }
      
      registerMutation.mutate({
        name: formData.name,
        email: formData.email,
        password: formData.password,
      });
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  return (
    <div className="min-h-screen bg-[#121212] flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg bg-[#1e1e1e] border-gray-800">
        <CardContent className="p-8">
          <div className="flex flex-col items-center mb-8">
            <div className="bg-[#FFD700] p-3 rounded-full mb-4">
              <User className="h-8 w-8 text-black" />
            </div>
            <h1 className="text-2xl font-bold text-white mb-2">
              Lume
            </h1>
            <p className="text-gray-400 text-center">
              {isLogin ? "Entre em sua conta" : "Crie sua conta individual"}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="name" className="text-white">
                  Nome completo
                </Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="name"
                    name="name"
                    type="text"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="pl-10 bg-[#2a2a2a] border-gray-700 text-white"
                    placeholder="Digite seu nome completo"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="email" className="text-white">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-10 bg-[#2a2a2a] border-gray-700 text-white"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-white">
                Senha
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  className="pl-10 bg-[#2a2a2a] border-gray-700 text-white"
                  placeholder="Digite sua senha"
                  required
                />
              </div>
            </div>

            {!isLogin && (
              <div className="space-y-2">
                <Label htmlFor="confirmPassword" className="text-white">
                  Confirmar senha
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type="password"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pl-10 bg-[#2a2a2a] border-gray-700 text-white"
                    placeholder="Confirme sua senha"
                    required={!isLogin}
                  />
                </div>
              </div>
            )}

            <Button
              type="submit"
              className="w-full bg-[#FFD700] text-black hover:bg-[#e6c200]"
              disabled={loginMutation.isPending || registerMutation.isPending}
            >
              {loginMutation.isPending || registerMutation.isPending
                ? "Carregando..."
                : isLogin
                ? "Entrar"
                : "Criar conta"}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-400">
              {isLogin ? "Não tem uma conta?" : "Já tem uma conta?"}
            </p>
            <Button
              variant="link"
              onClick={() => {
                setIsLogin(!isLogin);
                setFormData({
                  name: "",
                  email: "",
                  password: "",
                  confirmPassword: "",
                });
              }}
              className="text-[#FFD700] hover:text-[#e6c200] p-0 h-auto"
            >
              {isLogin ? "Criar conta" : "Fazer login"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}