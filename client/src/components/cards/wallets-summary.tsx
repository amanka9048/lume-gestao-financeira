import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Wallet as WalletIcon, ArrowRightLeft, Edit, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { WalletModal } from "@/components/modals/wallet-modal";
import { TransferModal } from "@/components/modals/transfer-modal";
import type { Wallet } from "@shared/schema";

export function WalletsSummary() {
  const { couple } = useAuth();
  const { toast } = useToast();
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  const { data: wallets = [], isLoading } = useQuery<Wallet[]>({
    queryKey: ['wallets', couple?.id],
    queryFn: async () => {
      const response = await fetch(`/api/wallets/${couple?.id}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    },
    enabled: !!couple?.id,
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchOnWindowFocus: false,
  });

  const deleteWalletMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest('DELETE', `/api/wallets/${id}`);
      return response.ok;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallets', couple?.id] });
      toast({
        title: "Sucesso",
        description: "Carteira excluída com sucesso!",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao excluir carteira. Pode estar sendo usada em transações.",
        variant: "destructive",
      });
    }
  });

  const totalBalance = wallets.reduce((sum, wallet) => sum + parseFloat(wallet.balance), 0);

  const handleEditWallet = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setIsWalletModalOpen(true);
  };

  const handleDeleteWallet = (wallet: Wallet) => {
    if (wallet.isDefault) {
      toast({
        title: "Erro",
        description: "Não é possível excluir a carteira padrão.",
        variant: "destructive",
      });
      return;
    }

    if (confirm(`Tem certeza que deseja excluir a carteira "${wallet.name}"?`)) {
      deleteWalletMutation.mutate(wallet.id);
    }
  };

  const handleCloseModal = () => {
    setIsWalletModalOpen(false);
    setEditingWallet(null);
  };

  if (isLoading) {
    return (
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <WalletIcon className="h-5 w-5 text-[#FFD700]" />
            Carteiras
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-4 text-gray-400">Carregando carteiras...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="bg-gray-800/50 border-gray-700">
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-white flex items-center gap-2">
                <WalletIcon className="h-5 w-5 text-[#FFD700]" />
                Carteiras
              </CardTitle>
              <CardDescription className="text-gray-400">
                Saldo total: R$ {totalBalance.toFixed(2)}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                onClick={() => setIsTransferModalOpen(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white"
                disabled={wallets.length < 2}
              >
                <ArrowRightLeft className="h-4 w-4 mr-1" />
                Transferir
              </Button>
              <Button
                size="sm"
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
              >
                <Plus className="h-4 w-4 mr-1" />
                Nova Carteira
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {wallets.length === 0 ? (
            <div className="text-center py-8">
              <WalletIcon className="h-12 w-12 text-gray-500 mx-auto mb-4" />
              <p className="text-gray-400 mb-4">Nenhuma carteira encontrada</p>
              <Button
                onClick={() => setIsWalletModalOpen(true)}
                className="bg-[#FFD700] text-black hover:bg-[#FFD700]/90"
              >
                <Plus className="h-4 w-4 mr-2" />
                Criar primeira carteira
              </Button>
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
              {wallets.map((wallet) => (
                <div
                  key={wallet.id}
                  className="p-4 bg-gray-700/30 rounded-lg border border-gray-600/50 hover:border-gray-500 transition-colors"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: wallet.color || "#4ECDC4" }}
                      />
                      <h3 className="font-medium text-white">{wallet.name}</h3>
                      {wallet.isDefault && (
                        <Badge variant="secondary" className="text-xs">
                          Padrão
                        </Badge>
                      )}
                    </div>
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                        onClick={() => handleEditWallet(wallet)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                      {!wallet.isDefault && (
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                          onClick={() => handleDeleteWallet(wallet)}
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-white">
                      R$ {parseFloat(wallet.balance).toFixed(2)}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <WalletModal
        isOpen={isWalletModalOpen}
        onClose={handleCloseModal}
        wallet={editingWallet}
      />

      <TransferModal
        isOpen={isTransferModalOpen}
        onClose={() => setIsTransferModalOpen(false)}
      />
    </>
  );
}