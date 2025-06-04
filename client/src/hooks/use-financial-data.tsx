import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/lib/auth-context";
import type { Transaction, Installment, InstallmentPayment, Wallet } from "@shared/schema";

export function useFinancialData() {
  const { couple } = useAuth();

  // Wallets
  const wallets = useQuery<Wallet[]>({
    queryKey: ['wallets', couple?.id],
    queryFn: async () => {
      const response = await fetch(`/api/wallets/${couple?.id}`);
      if (!response.ok) throw new Error('Failed to fetch wallets');
      return response.json();
    },
    enabled: !!couple?.id,
  });

  // Transactions
  const transactions = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${couple?.id}`],
    enabled: !!couple?.id,
  });

  const recentTransactions = useQuery<Transaction[]>({
    queryKey: [`/api/transactions/${couple?.id}`],
    enabled: !!couple?.id,
    select: (data) => data?.slice(0, 10) || [],
  });

  // Installments
  const installments = useQuery<Installment[]>({
    queryKey: [`/api/installments/${couple?.id}`],
    enabled: !!couple?.id,
  });

  const activeInstallments = useQuery<Installment[]>({
    queryKey: [`/api/installments/${couple?.id}/active`],
    enabled: !!couple?.id,
  });

  // Upcoming payments
  const upcomingPayments = useQuery<InstallmentPayment[]>({
    queryKey: [`/api/payments/upcoming/${couple?.id}?days=30`],
    enabled: !!couple?.id,
  });

  // Get installment payments for each installment
  const installmentPayments = useQuery<Record<number, InstallmentPayment[]>>({
    queryKey: [`installment-payments-${couple?.id}`],
    queryFn: async () => {
      if (!installments.data) return {};
      
      const paymentsMap: Record<number, InstallmentPayment[]> = {};
      
      for (const installment of installments.data) {
        const response = await fetch(`/api/installments/${installment.id}/payments`, {
          credentials: "include",
        });
        
        if (response.ok) {
          const payments = await response.json();
          paymentsMap[installment.id] = payments;
        }
      }
      
      return paymentsMap;
    },
    enabled: !!installments.data?.length,
  });

  // Calculate current balance from wallets
  const currentBalance = wallets.data?.reduce((total, wallet) => {
    return total + parseFloat(wallet.balance);
  }, 0) || 0;

  // Calculate monthly income and expenses
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const monthlyTransactions = transactions.data?.filter(transaction => {
    const transactionDate = new Date(transaction.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  }) || [];

  const monthlyIncome = monthlyTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyExpenses = monthlyTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  // Count pending installments
  const pendingInstallments = installments.data?.filter(i => i.status === 'active')
    .reduce((sum, i) => sum + (i.totalInstallments - i.paidInstallments), 0) || 0;

  return {
    transactions,
    recentTransactions,
    installments,
    activeInstallments,
    upcomingPayments,
    installmentPayments,
    currentBalance,
    monthlyIncome,
    monthlyExpenses,
    pendingInstallments,
  };
}
