import { createContext, useContext, useEffect, useState } from "react";
import type { User } from "@shared/schema";

interface AuthContextType {
  user: User | null;
  login: (user: User) => void;
  logout: () => void;
  updateUser: (user: User) => void;
  refreshUser: () => Promise<void>;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored auth data
    const storedUser = localStorage.getItem("financas_fontes_auth");
    if (storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        setUser(userData);
        // Buscar dados atualizados do servidor
        fetch(`/api/users/${userData.id}/profile`)
          .then(response => {
            if (response.ok) {
              return response.json();
            }
          })
          .then(updatedUser => {
            if (updatedUser) {
              setUser(updatedUser);
              localStorage.setItem("financas_fontes_auth", JSON.stringify(updatedUser));
            }
          })
          .catch(error => {
            console.error('Failed to fetch updated user data:', error);
          });
      } catch (error) {
        localStorage.removeItem("financas_fontes_auth");
      }
    }
    setIsLoading(false);
  }, []);

  const login = (user: User) => {
    setUser(user);
    localStorage.setItem("financas_fontes_auth", JSON.stringify(user));
  };

  const updateUser = (updatedUser: User) => {
    setUser(updatedUser);
    localStorage.setItem("financas_fontes_auth", JSON.stringify(updatedUser));
  };

  const refreshUser = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/users/${user.id}/profile`);
      if (response.ok) {
        const updatedUser = await response.json();
        updateUser(updatedUser);
      }
    } catch (error) {
      console.error('Failed to refresh user data:', error);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("financas_fontes_auth");
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, refreshUser, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
