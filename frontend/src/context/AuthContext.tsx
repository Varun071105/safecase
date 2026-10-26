import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthResponse } from '../types';
import { api } from '../api/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isCitizen: boolean;
  isInvestigator: boolean;
  isAdmin: boolean;
  login: (email: string, pass: string) => Promise<User>;
  register: (data: { email: string; password: string; full_name: string; phone_number?: string }) => Promise<User>;
  logout: () => Promise<void>;
  updateUser: (user: User) => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('safecase_token');
      if (!token) {
        setIsLoading(false);
        return;
      }

      try {
        const profile = await api.get<User>('/auth/me');
        setUser(profile);
        localStorage.setItem('safecase_user', JSON.stringify(profile));
      } catch {
        localStorage.removeItem('safecase_token');
        localStorage.removeItem('safecase_user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (email: string, pass: string): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/login', { email, password: pass });
    localStorage.setItem('safecase_token', res.access_token);
    localStorage.setItem('safecase_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const register = async (data: { email: string; password: string; full_name: string; phone_number?: string }): Promise<User> => {
    const res = await api.post<AuthResponse>('/auth/register', data);
    localStorage.setItem('safecase_token', res.access_token);
    localStorage.setItem('safecase_user', JSON.stringify(res.user));
    setUser(res.user);
    return res.user;
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('safecase_token');
      localStorage.removeItem('safecase_user');
      setUser(null);
      window.location.href = '/login';
    }
  };

  const updateUser = (updated: User) => {
    setUser(updated);
    localStorage.setItem('safecase_user', JSON.stringify(updated));
  };

  const refreshProfile = async () => {
    try {
      const p = await api.get<User>('/auth/me');
      updateUser(p);
    } catch {
      // ignore
    }
  };

  const isCitizen = user?.role === 'CITIZEN';
  const isInvestigator = user?.role === 'INVESTIGATOR';
  const isAdmin = user?.role === 'ADMIN';

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        isCitizen,
        isInvestigator,
        isAdmin,
        login,
        register,
        logout,
        updateUser,
        refreshProfile,
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
