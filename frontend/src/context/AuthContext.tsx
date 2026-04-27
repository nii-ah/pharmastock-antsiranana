import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Pharmacien } from '../types';
import { login as apiLogin, logout as apiLogout } from '../api';

interface AuthContextType {
  pharmacien:    Pharmacien | null;
  token:         string | null;
  isLoading:     boolean;
  login:         (email: string, password: string) => Promise<void>;
  logout:        () => Promise<void>;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [pharmacien, setPharmacien] = useState<Pharmacien | null>(null);
  const [token,      setToken]      = useState<string | null>(null);
  const [isLoading,  setIsLoading]  = useState(true);

  // Restaurer la session depuis localStorage au chargement
  useEffect(() => {
    const savedToken     = localStorage.getItem('token');
    const savedPharmacien = localStorage.getItem('pharmacien');
    if (savedToken && savedPharmacien) {
      setToken(savedToken);
      setPharmacien(JSON.parse(savedPharmacien));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    const res = await apiLogin(email, password);
    const { token: newToken, pharmacien: newPharmacien } = res.data;
    localStorage.setItem('token',      newToken);
    localStorage.setItem('pharmacien', JSON.stringify(newPharmacien));
    setToken(newToken);
    setPharmacien(newPharmacien);
  };

  const logout = async () => {
    try { await apiLogout(); } catch { /* ignore */ }
    localStorage.removeItem('token');
    localStorage.removeItem('pharmacien');
    setToken(null);
    setPharmacien(null);
  };

  return (
    <AuthContext.Provider value={{
      pharmacien, token, isLoading,
      login, logout,
      isAuthenticated: !!token,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth doit être utilisé dans AuthProvider');
  return ctx;
};
