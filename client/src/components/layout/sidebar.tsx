import { useState } from "react";
import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth-context";
import { 
  Heart, 
  BarChart3, 
  ArrowUpDown, 
  Calendar, 
  History, 
  Settings, 
  LogOut, 
  Menu,
  X 
} from "lucide-react";

export function Sidebar() {
  const [location] = useLocation();
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const { couple, logout } = useAuth();

  const navigation = [
    { name: "Dashboard", href: "/", icon: BarChart3 },
    { name: "Transações", href: "/transactions", icon: ArrowUpDown },
    { name: "Parcelamentos", href: "/installments", icon: Calendar },
    { name: "Histórico", href: "/history", icon: History },
    { name: "Configurações", href: "/settings", icon: Settings },
  ];

  const isActive = (href: string) => {
    if (href === "/") {
      return location === "/";
    }
    return location.startsWith(href);
  };

  const toggleMobile = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  return (
    <>
      {/* Mobile Menu Toggle */}
      <Button
        variant="ghost"
        size="sm"
        className="lg:hidden fixed top-4 left-4 z-50 bg-card shadow-lg"
        onClick={toggleMobile}
      >
        {isMobileOpen ? <X className="text-primary" /> : <Menu className="text-primary" />}
      </Button>

      {/* Overlay for mobile */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 w-64 bg-sidebar shadow-2xl transition-transform duration-300 z-40
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header */}
        <div className="p-6 border-b border-sidebar-border">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 gradient-gold rounded-full flex items-center justify-center">
              <Heart className="text-primary-foreground" />
            </div>
            <div>
              <h2 className="font-bold text-sidebar-primary">Finanças Fontes</h2>
              <p className="text-sm text-sidebar-foreground/70">{couple?.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation */}
        <nav className="mt-6 flex-1">
          {navigation.map((item) => {
            const Icon = item.icon;
            return (
              <Link key={item.name} href={item.href}>
                <button
                  className={`
                    w-full flex items-center px-6 py-3 text-left transition-colors
                    ${isActive(item.href)
                      ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                      : 'text-sidebar-foreground hover:bg-sidebar-accent/50'
                    }
                  `}
                  onClick={() => setIsMobileOpen(false)}
                >
                  <Icon className={`w-5 h-5 mr-3 ${isActive(item.href) ? 'text-sidebar-primary' : ''}`} />
                  {item.name}
                </button>
              </Link>
            );
          })}
        </nav>

        {/* Logout Button */}
        <div className="absolute bottom-6 left-6 right-6">
          <Button
            onClick={logout}
            className="w-full bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          >
            <LogOut className="mr-2 w-4 h-4" />
            Sair
          </Button>
        </div>
      </div>
    </>
  );
}
