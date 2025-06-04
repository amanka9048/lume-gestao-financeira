import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Wallet, CreditCard, Building, PiggyBank } from "lucide-react";
import { insertWalletSchema } from "@shared/schema";
import { z } from "zod";

interface WalletModalProps {
  isOpen: boolean;
  onClose: () => void;
  costCenterId: number;
}

export function WalletModal({ isOpen, onClose, costCenterId }: WalletModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [walletData, setWalletData] = useState({
    name: "",
    type: "checking",
    balance: "0",
    isDefault: false,
  });

  const createWalletMutation = useMutation({
    mutationFn: async (data: any) => {
      const walletPayload = {
        costCenterId,
        name: data.name,
        type: data.type,
        balance: data.balance,
        isDefault: data.isDefault,
      };
      
      const validatedData = insertWalletSchema.parse(walletPayload);
      return apiRequest("POST", "/api/wallets", validatedData);
    },
    onSuccess: () => {
      toast({
        title: "Carteira criada",
        description: "A carteira foi criada com sucesso",
      });
      queryClient.invalidateQueries({ 
        queryKey: ["/api/cost-centers", costCenterId, "wallets"] 
      });
      resetForm();
      onClose();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao criar carteira",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const resetForm = () => {
    setWalletData({
      name: "",
      type: "checking",
      balance: "0",
      isDefault: false,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    createWalletMutation.mutate(walletData);
  };

  const walletTypes = [
    { value: "checking", label: "Conta Corrente", icon: Building },
    { value: "savings", label: "Poupança", icon: PiggyBank },
    { value: "cash", label: "Dinheiro", icon: Wallet },
    { value: "investment", label: "Investimento", icon: CreditCard },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[#1e1e1e] border-gray-800 text-white max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Nova Carteira</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name" className="text-white">Nome da Carteira</Label>
            <Input
              id="name"
              value={walletData.name}
              onChange={(e) => setWalletData({ ...walletData, name: e.target.value })}
              placeholder="Ex: Nubank, Bradesco, Dinheiro..."
              className="bg-[#2a2a2a] border-gray-700 text-white"
              required
            />
          </div>

          <div>
            <Label htmlFor="type" className="text-white">Tipo de Carteira</Label>
            <Select
              value={walletData.type}
              onValueChange={(value) => setWalletData({ ...walletData, type: value })}
            >
              <SelectTrigger className="bg-[#2a2a2a] border-gray-700 text-white">
                <SelectValue placeholder="Selecione o tipo" />
              </SelectTrigger>
              <SelectContent className="bg-[#2a2a2a] border-gray-700">
                {walletTypes.map((type) => {
                  const IconComponent = type.icon;
                  return (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <IconComponent className="h-4 w-4" />
                        {type.label}
                      </div>
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="balance" className="text-white">Saldo Inicial (R$)</Label>
            <Input
              id="balance"
              type="number"
              step="0.01"
              value={walletData.balance}
              onChange={(e) => setWalletData({ ...walletData, balance: e.target.value })}
              placeholder="0,00"
              className="bg-[#2a2a2a] border-gray-700 text-white"
              required
            />
          </div>

          <div className="flex items-center space-x-2">
            <Checkbox
              id="isDefault"
              checked={walletData.isDefault}
              onCheckedChange={(checked) => 
                setWalletData({ ...walletData, isDefault: checked as boolean })
              }
            />
            <Label htmlFor="isDefault" className="text-white text-sm">
              Definir como carteira padrão
            </Label>
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              className="flex-1 border-gray-700 text-white hover:bg-gray-800"
              disabled={createWalletMutation.isPending}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              className="flex-1 bg-[#FFD700] hover:bg-[#FFD700]/80 text-black"
              disabled={createWalletMutation.isPending}
            >
              {createWalletMutation.isPending ? "Criando..." : "Criar Carteira"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}