import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/lib/auth-context";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import type { CreditCard, Wallet } from "@shared/schema";

interface PayBillModalProps {
  isOpen: boolean;
  onClose: () => void;
  creditCard: CreditCard | null;
}

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function PayBillModal({ isOpen, onClose, creditCard }: PayBillModalProps) {
  const { couple } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [amount, setAmount] = useState("");
  const [selectedWalletId, setSelectedWalletId] = useState<string>("");

  const wallets = useQuery({
    queryKey: ['/api/wallets', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const response = await fetch(`/api/wallets/${couple.id}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    },
    enabled: !!couple?.id,
  });

  const payBill = useMutation({
    mutationFn: async ({ creditCardId, amount, fromWalletId }: { 
      creditCardId: number; 
      amount: number; 
      fromWalletId: number; 
    }) => {
      const response = await fetch(`/api/credit-cards/${creditCardId}/pay-bill`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, fromWalletId }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Erro ao pagar fatura');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit-cards', couple?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/wallets', couple?.id] });
      queryClient.invalidateQueries({ queryKey: ['/api/transactions', couple?.id] });
      toast({
        title: "Sucesso",
        description: "Fatura paga com sucesso!",
      });
      onClose();
      setAmount("");
      setSelectedWalletId("");
    },
    onError: (error: Error) => {
      toast({
        title: "Erro",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!creditCard || !amount || !selectedWalletId) {
      toast({
        title: "Erro",
        description: "Preencha todos os campos",
        variant: "destructive",
      });
      return;
    }

    const amountValue = parseFloat(amount);
    if (amountValue <= 0) {
      toast({
        title: "Erro",
        description: "Valor deve ser maior que zero",
        variant: "destructive",
      });
      return;
    }

    payBill.mutate({
      creditCardId: creditCard.id,
      amount: amountValue,
      fromWalletId: parseInt(selectedWalletId),
    });
  };

  const getSelectedWallet = () => {
    return wallets.data?.find((w: Wallet) => w.id.toString() === selectedWalletId);
  };

  const selectedWallet = getSelectedWallet();
  const walletBalance = selectedWallet ? parseFloat(selectedWallet.balance) : 0;
  const paymentAmount = amount ? parseFloat(amount) : 0;
  const hasInsufficientFunds = paymentAmount > walletBalance;

  if (!creditCard) return null;

  const currentLimit = parseFloat(creditCard.limit);
  const availableLimit = parseFloat(creditCard.availableLimit);
  const usedAmount = currentLimit - availableLimit;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pagar Fatura - {creditCard.name}</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Valor Usado:</span>
              <span className="font-semibold text-red-600">{formatCurrency(usedAmount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Limite Disponível:</span>
              <span className="font-semibold text-green-600">{formatCurrency(availableLimit)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Limite Total:</span>
              <span className="font-semibold">{formatCurrency(currentLimit)}</span>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="wallet">Pagar da Carteira</Label>
              <Select value={selectedWalletId} onValueChange={setSelectedWalletId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma carteira" />
                </SelectTrigger>
                <SelectContent>
                  {wallets.data?.map((wallet: Wallet) => (
                    <SelectItem key={wallet.id} value={wallet.id.toString()}>
                      {wallet.name} - {formatCurrency(parseFloat(wallet.balance))}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="amount">Valor do Pagamento (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                max={usedAmount}
              />
              {hasInsufficientFunds && selectedWallet && (
                <p className="text-sm text-red-500 mt-1">
                  Saldo insuficiente. Disponível: {formatCurrency(walletBalance)}
                </p>
              )}
            </div>

            <div className="flex justify-end space-x-2 pt-4">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={payBill.isPending || hasInsufficientFunds || !amount || !selectedWalletId}
              >
                {payBill.isPending ? "Processando..." : "Pagar Fatura"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}