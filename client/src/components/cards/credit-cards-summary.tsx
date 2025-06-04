import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, CreditCard as CreditCardIcon, Edit2, Trash2, Receipt } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { useIsMobile } from "@/hooks/use-mobile";
import { CreditCardModal } from "@/components/modals/credit-card-modal";
import { PayBillModal } from "@/components/modals/pay-bill-modal";
import type { CreditCard } from "@shared/schema";

const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export function CreditCardsSummary() {
  const { couple } = useAuth();
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [showCreditCardModal, setShowCreditCardModal] = useState(false);
  const [showPayBillModal, setShowPayBillModal] = useState(false);
  const [editingCreditCard, setEditingCreditCard] = useState<CreditCard | null>(null);
  const [selectedCreditCard, setSelectedCreditCard] = useState<CreditCard | null>(null);

  const creditCards = useQuery({
    queryKey: ['/api/credit-cards', couple?.id],
    queryFn: async () => {
      if (!couple?.id) return [];
      const response = await fetch(`/api/credit-cards/${couple.id}`);
      if (!response.ok) throw new Error('Failed to fetch credit cards');
      return response.json();
    },
    enabled: !!couple?.id,
  });

  const deleteCreditCard = useMutation({
    mutationFn: async (creditCardId: number) => {
      const response = await fetch(`/api/credit-cards/${creditCardId}`, {
        method: 'DELETE',
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/credit-cards', couple?.id] });
    },
  });

  const handleNewCreditCard = () => {
    setEditingCreditCard(null);
    setShowCreditCardModal(true);
  };

  const handleEditCreditCard = (creditCard: CreditCard) => {
    setEditingCreditCard(creditCard);
    setShowCreditCardModal(true);
  };

  const handleDeleteCreditCard = (creditCard: CreditCard) => {
    if (confirm(`Tem certeza que deseja excluir o cartão "${creditCard.name}"?`)) {
      deleteCreditCard.mutate(creditCard.id);
    }
  };

  const handlePayBill = (creditCard: CreditCard) => {
    setSelectedCreditCard(creditCard);
    setShowPayBillModal(true);
  };

  const getUsagePercentage = (creditCard: CreditCard) => {
    const limit = parseFloat(creditCard.limit);
    const available = parseFloat(creditCard.availableLimit);
    const used = limit - available;
    return (used / limit) * 100;
  };

  const getUsageColor = (percentage: number) => {
    if (percentage >= 80) return "text-red-500";
    if (percentage >= 60) return "text-yellow-500";
    return "text-green-500";
  };

  if (creditCards.isLoading) {
    return (
      <Card>
        <CardHeader className={`${isMobile ? 'p-3 pb-2' : 'pb-3'}`}>
          <CardTitle className={`flex items-center ${isMobile ? 'text-lg' : 'text-xl'}`}>
            <CreditCardIcon className={`mr-2 text-primary ${isMobile ? 'w-5 h-5' : ''}`} />
            Cartões de Crédito
          </CardTitle>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-3 pt-0' : 'pt-0'}`}>
          <p className={`text-muted-foreground ${isMobile ? 'text-sm' : ''}`}>Carregando cartões...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className={`${isMobile ? 'p-3 pb-2' : 'pb-3'}`}>
          <div className="flex items-center justify-between">
            <CardTitle className={`flex items-center ${isMobile ? 'text-lg' : 'text-xl'}`}>
              <CreditCardIcon className={`mr-2 text-primary ${isMobile ? 'w-5 h-5' : ''}`} />
              Cartões de Crédito
            </CardTitle>
            <Button
              onClick={handleNewCreditCard}
              size={isMobile ? "sm" : "default"}
              className="bg-primary/20 hover:bg-primary/30 text-primary border border-primary/30"
              variant="outline"
            >
              <Plus className={`${isMobile ? 'w-4 h-4' : 'mr-2'}`} />
              {!isMobile && 'Novo Cartão'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className={`${isMobile ? 'p-3 pt-0' : 'pt-0'}`}>
          {creditCards.data?.length === 0 ? (
            <div className={`text-center text-muted-foreground ${isMobile ? 'py-4' : 'py-8'}`}>
              <CreditCardIcon className={`mx-auto mb-2 text-muted-foreground ${isMobile ? 'w-8 h-8' : 'w-12 h-12'}`} />
              <p className={`${isMobile ? 'text-sm' : ''}`}>Nenhum cartão de crédito cadastrado</p>
              <p className={`${isMobile ? 'text-xs' : 'text-sm'}`}>Adicione seu primeiro cartão para começar!</p>
            </div>
          ) : (
            <div className={`${isMobile ? 'space-y-2' : 'space-y-4'}`}>
              {creditCards.data?.map((creditCard: CreditCard) => {
                const usagePercentage = getUsagePercentage(creditCard);
                const limit = parseFloat(creditCard.limit);
                const available = parseFloat(creditCard.availableLimit);
                const used = limit - available;

                return (
                  <div
                    key={creditCard.id}
                    className={`border rounded-lg transition-all duration-300 hover:border-primary/50 ${isMobile ? 'p-2' : 'p-3'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <div className={`${isMobile ? 'w-6 h-6' : 'w-7 h-7'} bg-gradient-to-r from-blue-500 to-purple-600 rounded flex items-center justify-center`}>
                          <CreditCardIcon className={`${isMobile ? 'w-3 h-3' : 'w-4 h-4'} text-white`} />
                        </div>
                        <div>
                          <h3 className={`font-semibold ${isMobile ? 'text-xs' : 'text-sm'}`}>{creditCard.name}</h3>
                          <p className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                            Vence dia {creditCard.dueDay}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-1">
                        <Button
                          onClick={() => handlePayBill(creditCard)}
                          size="sm"
                          variant="outline"
                          className={`text-green-600 border-green-600/30 hover:bg-green-600/10 ${isMobile ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0'}`}
                        >
                          <Receipt className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                        </Button>
                        <Button
                          onClick={() => handleEditCreditCard(creditCard)}
                          size="sm"
                          variant="outline"
                          className={`text-blue-600 border-blue-600/30 hover:bg-blue-600/10 ${isMobile ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0'}`}
                        >
                          <Edit2 className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                        </Button>
                        <Button
                          onClick={() => handleDeleteCreditCard(creditCard)}
                          size="sm"
                          variant="outline"
                          className={`text-red-600 border-red-600/30 hover:bg-red-600/10 ${isMobile ? 'h-6 w-6 p-0' : 'h-7 w-7 p-0'}`}
                        >
                          <Trash2 className={`${isMobile ? 'w-3 h-3' : 'w-3 h-3'}`} />
                        </Button>
                      </div>
                    </div>

                    <div className={`space-y-1 ${isMobile ? '' : ''}`}>
                      <div className="flex justify-between items-center">
                        <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                          Limite Disponível
                        </span>
                        <span className={`font-bold text-green-600 ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {formatCurrency(available)}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                          Usado
                        </span>
                        <span className={`font-bold ${getUsageColor(usagePercentage)} ${isMobile ? 'text-xs' : 'text-sm'}`}>
                          {formatCurrency(used)}
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            usagePercentage >= 80 ? 'bg-red-500' :
                            usagePercentage >= 60 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${usagePercentage}%` }}
                        ></div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className={`text-muted-foreground ${isMobile ? 'text-xs' : 'text-xs'}`}>
                          Limite Total
                        </span>
                        <Badge variant="outline" className={`${isMobile ? 'text-xs h-4 px-1' : 'text-xs h-5 px-2'}`}>
                          {formatCurrency(limit)}
                        </Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      <CreditCardModal
        isOpen={showCreditCardModal}
        onClose={() => {
          setShowCreditCardModal(false);
          setEditingCreditCard(null);
        }}
        creditCard={editingCreditCard}
      />

      <PayBillModal
        isOpen={showPayBillModal}
        onClose={() => {
          setShowPayBillModal(false);
          setSelectedCreditCard(null);
        }}
        creditCard={selectedCreditCard}
      />
    </>
  );
}