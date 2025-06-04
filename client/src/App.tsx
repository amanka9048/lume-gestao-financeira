import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/auth-context";
import { Landing } from "@/pages/landing";
import { AuthPage } from "@/pages/auth";
import { Dashboard } from "@/pages/dashboard";
import { Transactions } from "@/pages/transactions";
import { Installments } from "@/pages/installments";
import { History } from "@/pages/history";
import { Settings } from "@/pages/settings";
import { UserDemo } from "@/pages/user-demo";
import { CostCenterDashboard } from "@/pages/cost-center-dashboard";
import { Notifications } from "@/pages/notifications";
import { ReportsUsers } from "@/pages/reports-users";
import { UserProfile } from "@/pages/user-profile";
import { ExportSystem } from "@/pages/export-system";
import { useAuth } from "@/lib/auth-context";

function AppContent() {
  const { user, isLoading } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Switch>
        <Route path="/" component={() => {
          if (isLoading) {
            return <div className="min-h-screen flex items-center justify-center bg-[#0a0a0a]">
              <div className="text-white">Carregando...</div>
            </div>;
          }
          return user ? <CostCenterDashboard /> : <Landing />;
        }} />
        <Route path="/auth" component={AuthPage} />
        <Route path="/cost-centers" component={() => user ? <CostCenterDashboard /> : <Landing />} />
        <Route path="/dashboard/:costCenterId" component={() => user ? <Dashboard /> : <Landing />} />
        <Route path="/transactions/:costCenterId" component={() => user ? <Transactions /> : <Landing />} />
        <Route path="/installments/:costCenterId" component={() => user ? <Installments /> : <Landing />} />
        <Route path="/history/:costCenterId" component={() => user ? <History /> : <Landing />} />
        <Route path="/settings/:costCenterId" component={() => user ? <Settings /> : <Landing />} />
        <Route path="/notifications/:costCenterId" component={() => user ? <Notifications /> : <Landing />} />
        <Route path="/reports/users/:costCenterId" component={() => user ? <ReportsUsers /> : <Landing />} />
        <Route path="/profile" component={() => user ? <UserProfile /> : <Landing />} />
        <Route path="/export" component={() => user ? <ExportSystem /> : <Landing />} />
        <Route path="/user-demo" component={() => user ? <UserDemo /> : <Landing />} />
      </Switch>
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AppContent />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
