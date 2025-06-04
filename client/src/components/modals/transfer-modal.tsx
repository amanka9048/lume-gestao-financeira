import { useState } from "react";
import { useMutation, useQueryClient, useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/queryClient";
import type { Wallet } from "@shared/schema";

interface TransferModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function TransferModal({ isOpen, onClose }: TransferModalProps) {
  const { couple } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [formData, setFormData] = useState({
    fromWalletId: "",
    toWalletId: "",
    amount: "",
    description: "",
  });

  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ['wallets', couple?.id],
    queryFn: async () => {
      const response = await fetch(`/api/wallets/${couple?.id}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    },
    enabled: !!couple?.id,
  });

  const transferMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest('POST', '/api/wallets/transfer', data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', couple?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', couple?.id] });
      toast({
        title: "Sucesso",
        description: "Transferência realizada com sucesso!",
      });
      resetForm();
      onClose();
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao realizar transferência. Verifique o saldo disponível.",
        variant: "destructive",
      });
    }
  });

  const resetForm = () => {
    setFormData({
      fromWalletId: "",
      toWalletId: "",
      amount: "",
      description: "",
    });
  };

  const handleSubmit = () => {
    if (!formData.fromWalletId || !formData.toWalletId || !formData.amount) {
      toast({
        title: "Erro",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      });
      return;
    }

    if (formData.fromWalletId === formData.toWalletId) {
      toast({
        title: "Erro",
        description: "Selecione carteiras diferentes para a transferência.",
        variant: "destructive",
      });
      return;
    }

    transferMutation.mutate(formData);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const fromWallet = wallets.find(w => w.id.toString() === formData.fromWalletId);
  const availableToWallets = wallets.filter(w => w.id.toString() !== formData.fromWalletId);

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="bg-gray-800 border-gray-700 max-w-md">
        <DialogHeader>
          <DialogTitle className="text-white">Transferir entre Carteiras</DialogTitle>
          <DialogDescription className="text-gray-400">
            Transfira dinheiro de uma carteira para outra
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="fromWallet" className="text-white">Carteira de Origem</Label>
            <Select 
              value={formData.fromWalletId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, fromWalletId: value, toWalletId: "" }))}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue placeholder="Selecione a carteira de origem" />
              </SelectTrigger>
              <SelectContent>
                {wallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: wallet.color || "#4ECDC4" }}
                      />
                      <span>{wallet.name}</span>
                      <span className="text-gray-400 ml-auto">R$ {parseFloat(wallet.balance).toFixed(2)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {fromWallet && (
              <p className="text-sm text-gray-400 mt-1">
                Saldo disponível: R$ {parseFloat(fromWallet.balance).toFixed(2)}
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="toWallet" className="text-white">Carteira de Destino</Label>
            <Select 
              value={formData.toWalletId} 
              onValueChange={(value) => setFormData(prev => ({ ...prev, toWalletId: value }))}
              disabled={!formData.fromWalletId}
            >
              <SelectTrigger className="bg-gray-700 border-gray-600 text-white mt-1">
                <SelectValue placeholder="Selecione a carteira de destino" />
              </SelectTrigger>
              <SelectContent>
                {availableToWallets.map(wallet => (
                  <SelectItem key={wallet.id} value={wallet.id.toString()}>
                    <div className="flex items-center gap-2">
                      <div 
                        className="w-3 h-3 rounded-full" 
                        style={{ backgroundColor: wallet.color || "#4ECDC4" }}
                      />
                      <span>{wallet.name}</span>
                      <span className="text-gray-400 ml-auto">R$ {parseFloat(wallet.balance).toFixed(2)}</span>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="amount" className="text-white">Valor da Transferência</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              min="0.01"
              value={formData.amount}
              onChange={(e) => setFormData(prev => ({ ...prev, amount: e.target.value }))}
              placeholder="0.00"
              className="bg-gray-700 border-gray-600 text-white mt-1"
            />
          </div>

          <div>
            <Label htmlFor="description" className="text-white">Descrição (opcional)</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Motivo da transferência..."
              className="bg-gray-700 border-gray-600 text-white mt-1"
            />
          </div>
        </div>

        <DialogFooter>
          <Button 
            type="button" 
            variant="outline" 
            onClick={handleClose}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            Cancelar
          </Button>
          <Button 
            type="button" 
            onClick={handleSubmit}
            disabled={transferMutation.isPending || !formData.fromWalletId || !formData.toWalletId || !formData.amount}
            className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
          >
            {transferMutation.isPending ? 'Transferindo...' : 'Transferir'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}