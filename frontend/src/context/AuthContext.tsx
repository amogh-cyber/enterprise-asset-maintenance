import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserRole } from '../types';
import { apiService } from '../services/apiService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  switchDemoRole: (role: UserRole) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const DEMO_CREDENTIALS: Record<UserRole, { email: string; pass: string }> = {
  OPERATOR: { email: 'operator@assetflow.com', pass: 'AssetFlow@2026' },
  MAINTENANCE_MANAGER: { email: 'manager@assetflow.com', pass: 'AssetFlow@2026' },
  TECHNICIAN: { email: 'tech@assetflow.com', pass: 'AssetFlow@2026' },
  ADMIN: { email: 'admin@assetflow.com', pass: 'AssetFlow@2026' },
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('assetflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('assetflow_token'));
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuth = async () => {
      if (token) {
        try {
          const profile = await apiService.getCurrentUser();
          setUser(profile);
          localStorage.setItem('assetflow_user', JSON.stringify(profile));
        } catch (err) {
          logout();
        }
      }
      setIsLoading(false);
    };
    checkAuth();
  }, [token]);

  const login = async (email: string, password: string) => {
    const data = await apiService.login(email, password);
    setToken(data.access_token);
    setUser(data.user);
    localStorage.setItem('assetflow_token', data.access_token);
    localStorage.setItem('assetflow_user', JSON.stringify(data.user));
  };

  const switchDemoRole = async (role: UserRole) => {
    const creds = DEMO_CREDENTIALS[role];
    if (creds) {
      await login(creds.email, creds.pass);
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('assetflow_token');
    localStorage.removeItem('assetflow_user');
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!token && !!user,
        isLoading,
        login,
        switchDemoRole,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
