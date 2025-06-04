import { useState } from "react";
import { Home, Receipt, Plus, BarChart3, Settings, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useParams, useLocation } from "wouter";

interface BottomNavProps {
  onOpenTransactionModal: (type: 'income' | 'expense') => void;
}

export function BottomNav({ onOpenTransactionModal }: BottomNavProps) {
  const { costCenterId } = useParams<{ costCenterId: string }>();
  const [location] = useLocation();
  const [showQuickMenu, setShowQuickMenu] = useState(false);

  const navItems = [
    {
      icon: Home,
      label: "Home",
      href: `/dashboard/${costCenterId}`,
      isActive: location === `/dashboard/${costCenterId}`
    },
    {
      icon: Receipt,
      label: "Transações",
      href: `/transactions/${costCenterId}`,
      isActive: location === `/transactions/${costCenterId}`
    },
    {
      icon: Plus,
      label: "Adicionar",
      href: "#",
      isActive: false,
      isCenter: true
    },
    {
      icon: BarChart3,
      label: "Relatórios",
      href: `/reports/users/${costCenterId}`,
      isActive: location.includes('/reports/')
    },
    {
      icon: Settings,
      label: "Configurações",
      href: `/settings/${costCenterId}`,
      isActive: location === `/settings/${costCenterId}`
    }
  ];

  const handleNavClick = (item: any) => {
    if (item.isCenter) {
      setShowQuickMenu(!showQuickMenu);
    } else {
      window.location.href = item.href;
    }
  };

  return (
    <>
      {/* Quick Action Menu */}
      {showQuickMenu && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={() => setShowQuickMenu(false)}
        >
          <div className="fixed bottom-24 left-1/2 transform -translate-x-1/2 z-50">
            <Card className="bg-[#1e1e1e] border-gray-800 p-4">
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    onOpenTransactionModal('income');
                    setShowQuickMenu(false);
                  }}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 flex items-center gap-3"
                >
                  <Plus className="h-5 w-5" />
                  <span>Nova Receita</span>
                </Button>
                
                <Button
                  onClick={() => {
                    onOpenTransactionModal('expense');
                    setShowQuickMenu(false);
                  }}
                  className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 flex items-center gap-3"
                >
                  <Minus className="h-5 w-5" />
                  <span>Nova Despesa</span>
                </Button>
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-[#1e1e1e] border-t border-gray-800 px-4 py-3">
        <div className="max-w-md mx-auto">
          <div className="flex justify-around items-center">
            {navItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <Button
                  key={index}
                  variant="ghost"
                  size="sm"
                  onClick={() => handleNavClick(item)}
                  className={`
                    flex flex-col items-center gap-1 p-3 rounded-lg transition-all
                    ${item.isCenter 
                      ? 'bg-[#FFD700] hover:bg-[#e6c200] text-black w-14 h-14 rounded-full' 
                      : item.isActive 
                        ? 'text-[#FFD700] bg-[#FFD700]/10' 
                        : 'text-gray-400 hover:text-white hover:bg-gray-800'
                    }
                  `}
                >
                  <Icon className={`h-5 w-5 ${item.isCenter ? 'h-6 w-6' : ''}`} />
                </Button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Spacer to prevent content from being hidden behind fixed nav */}
      <div className="h-20"></div>
    </>
  );
}