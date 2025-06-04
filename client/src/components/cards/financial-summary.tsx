import { useFinancialData } from "@/hooks/use-financial-data";

export function FinancialSummary() {
  const { currentBalance } = useFinancialData();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(amount);
  };

  return (
    <div className="text-right">
      <p className="text-sm text-muted-foreground">Saldo Atual</p>
      <p className={`text-xl font-bold ${currentBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
        {formatCurrency(currentBalance)}
      </p>
    </div>
  );
}
