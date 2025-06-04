import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useFinancialData } from "@/hooks/use-financial-data";
import { TrendingUp, TrendingDown, Scale, Briefcase, ShoppingCart, Home, Car, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export function History() {
  const [selectedMonth, setSelectedMonth] = useState("12");
  const [selectedYear, setSelectedYear] = useState("2024");
  
  const { transactions } = useFinancialData();

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

  const getCategoryIcon = (category: string, type: string) => {
    if (type === 'income') {
      return <Briefcase className="text-success" />;
    }
    
    switch (category) {
      case 'food':
        return <ShoppingCart className="text-destructive" />;
      case 'transport':
        return <Car className="text-destructive" />;
      case 'bills':
        return <Home className="text-destructive" />;
      default:
        return <ShoppingCart className="text-destructive" />;
    }
  };

  // Filter transactions by selected month/year
  const filteredTransactions = transactions.data?.filter(transaction => {
    const date = new Date(transaction.date);
    return date.getMonth() === parseInt(selectedMonth) - 1 && 
           date.getFullYear() === parseInt(selectedYear);
  }) || [];

  // Calculate monthly summary
  const monthlyIncome = filteredTransactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyExpenses = filteredTransactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);

  const monthlyBalance = monthlyIncome - monthlyExpenses;

  const months = [
    { value: "1", label: "Janeiro" },
    { value: "2", label: "Fevereiro" },
    { value: "3", label: "Março" },
    { value: "4", label: "Abril" },
    { value: "5", label: "Maio" },
    { value: "6", label: "Junho" },
    { value: "7", label: "Julho" },
    { value: "8", label: "Agosto" },
    { value: "9", label: "Setembro" },
    { value: "10", label: "Outubro" },
    { value: "11", label: "Novembro" },
    { value: "12", label: "Dezembro" },
  ];

  return (
    <div className="p-4 lg:p-6 space-y-6">
      {/* Header */}
      <header className="bg-card shadow-lg border-b border-border p-4 lg:p-6 rounded-lg">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="hover:bg-accent"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-2xl font-bold text-primary">Histórico Financeiro</h1>
        </div>
      </header>

      <Card>
        <CardContent className="p-6">
          <h3 className="text-xl font-semibold mb-6">Histórico Financeiro</h3>
          
          {/* Period Selector */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium mb-2">Mês</label>
              <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {months.map(month => (
                    <SelectItem key={month.value} value={month.value}>
                      {month.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Ano</label>
              <Select value={selectedYear} onValueChange={setSelectedYear}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="2024">2024</SelectItem>
                  <SelectItem value="2023">2023</SelectItem>
                  <SelectItem value="2022">2022</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Monthly Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-secondary rounded-lg p-4 text-center">
              <TrendingUp className="text-success text-2xl mb-2 mx-auto" />
              <p className="text-muted-foreground text-sm">Total Entradas</p>
              <p className="text-xl font-bold text-success">{formatCurrency(monthlyIncome)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 text-center">
              <TrendingDown className="text-destructive text-2xl mb-2 mx-auto" />
              <p className="text-muted-foreground text-sm">Total Saídas</p>
              <p className="text-xl font-bold text-destructive">{formatCurrency(monthlyExpenses)}</p>
            </div>
            <div className="bg-secondary rounded-lg p-4 text-center">
              <Scale className="text-primary text-2xl mb-2 mx-auto" />
              <p className="text-muted-foreground text-sm">Saldo do Mês</p>
              <p className={`text-xl font-bold ${monthlyBalance >= 0 ? 'text-success' : 'text-destructive'}`}>
                {formatCurrency(monthlyBalance)}
              </p>
            </div>
          </div>

          {/* Historical Transactions */}
          <div className="space-y-4">
            <h4 className="text-lg font-semibold mb-4">
              Transações de {months.find(m => m.value === selectedMonth)?.label} {selectedYear}
            </h4>
            
            {filteredTransactions.length > 0 ? (
              <div className="space-y-3">
                {filteredTransactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-4 bg-secondary rounded-lg">
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        transaction.type === 'income' ? 'bg-success/20' : 'bg-destructive/20'
                      }`}>
                        {getCategoryIcon(transaction.category, transaction.type)}
                      </div>
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-muted-foreground">{formatDate(transaction.date)}</p>
                      </div>
                    </div>
                    <p className={`font-bold ${
                      transaction.type === 'income' ? 'text-success' : 'text-destructive'
                    }`}>
                      {transaction.type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center text-muted-foreground py-8">
                <p>Nenhuma transação encontrada para este período</p>
                <p className="text-sm">Selecione outro mês ou ano para ver o histórico</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
