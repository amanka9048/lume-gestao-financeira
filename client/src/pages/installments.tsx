import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { InstallmentModal } from "@/components/modals/installment-modal";
import { useFinancialData } from "@/hooks/use-financial-data";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Calendar, ArrowLeft } from "lucide-react";

export function Installments() {
  const [showModal, setShowModal] = useState(false);
  const { installments, installmentPayments } = useFinancialData();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const deleteInstallment = useMutation({
    mutationFn: async (id: number) => {
      await apiRequest("DELETE", `/api/installments/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/installments"] });
      toast({
        title: "Parcelamento deletado",
        description: "O parcelamento foi removido com sucesso.",
      });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível deletar o parcelamento.",
        variant: "destructive",
      });
    },
  });

  const formatCurrency = (amount: string | number) => {
    const value = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (date: string | Date) => {
    return new Date(date).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-warning';
      case 'completed':
        return 'text-success';
      case 'cancelled':
        return 'text-destructive';
      default:
        return 'text-muted-foreground';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'active':
        return 'Ativo';
      case 'completed':
        return 'Completo';
      case 'cancelled':
        return 'Cancelado';
      default:
        return status;
    }
  };

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <header className="bg-card shadow-lg border-b border-border p-4 lg:p-6 rounded-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="hover:bg-accent"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">Parcelamentos</h1>
          </div>
          <Button
            onClick={() => setShowModal(true)}
            className="gradient-gold text-primary-foreground font-semibold shadow-gold hover:shadow-lg transition-all duration-300"
          >
            <Plus className="mr-2" />
            Novo Parcelamento
          </Button>
        </div>
      </header>

      <Card>
        <CardContent className="p-6">
          <div className="space-y-6">
            {installments.data && installments.data.length > 0 ? installments.data.map((installment) => {
              const progress = (installment.paidInstallments / installment.totalInstallments) * 100;
              const payments = installmentPayments.data?.[installment.id] || [];
              const nextPayments = payments.filter(p => p.status === 'pending').slice(0, 3);

              return (
                <div key={installment.id} className="bg-secondary rounded-lg p-6">
                  <div className="flex justify-between items-start mb-4">
                    <div>
                      <h4 className="text-lg font-semibold">{installment.description}</h4>
                      <p className="text-muted-foreground">
                        {installment.totalInstallments}x de {formatCurrency(installment.installmentAmount)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 rounded-full text-sm bg-warning/20 ${getStatusColor(installment.status)}`}>
                        {getStatusText(installment.status)}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteInstallment.mutate(installment.id)}
                        disabled={deleteInstallment.isPending}
                        className="text-destructive hover:text-destructive/80"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                  
                  {/* Progress Bar */}
                  <div className="mb-4">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-sm text-muted-foreground">Progresso</span>
                      <span className="text-sm text-muted-foreground">
                        {installment.paidInstallments} de {installment.totalInstallments} pagas
                      </span>
                    </div>
                    <Progress value={progress} className="h-2" />
                  </div>

                  {/* Next Payments */}
                  {nextPayments.length > 0 && (
                    <div>
                      <h5 className="text-sm font-medium mb-3 text-muted-foreground">Próximas Parcelas:</h5>
                      <div className="space-y-2">
                        {nextPayments.map((payment) => {
                          const daysUntilDue = Math.ceil((new Date(payment.dueDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                          const isOverdue = daysUntilDue < 0;
                          const isDueSoon = daysUntilDue <= 7 && daysUntilDue >= 0;
                          
                          return (
                            <div key={payment.id} className="flex justify-between items-center p-3 bg-background rounded">
                              <span>Parcela {payment.paymentNumber}/{installment.totalInstallments}</span>
                              <div className="text-right">
                                <p className="font-medium">{formatCurrency(payment.amount)}</p>
                                <p className={`text-xs ${
                                  isOverdue ? 'text-destructive' : 
                                  isDueSoon ? 'text-warning' : 
                                  'text-muted-foreground'
                                }`}>
                                  {isOverdue ? `Venceu há ${Math.abs(daysUntilDue)} dias` :
                                   isDueSoon ? `Vence em ${daysUntilDue} dias` :
                                   formatDate(payment.dueDate)}
                                </p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            }) : (
              <div className="text-center text-muted-foreground py-8">
                <Calendar className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p className="text-lg">Nenhum parcelamento encontrado</p>
                <p className="text-sm">Comece criando seu primeiro parcelamento!</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <InstallmentModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
      />
    </div>
  );
}
