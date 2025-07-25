
'use client';

import * as React from 'react';
import type { User } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: Omit<User, 'password' | 'password_hash'> | null;
  login: (userData: Omit<User, 'password' | 'password_hash'>) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = React.useState<Omit<User, 'password' | 'password_hash'> | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const { toast } = useToast();
  const router = useRouter();
  
  React.useEffect(() => {
    try {
      const storedUser = localStorage.getItem('CineBook-user');
      if (storedUser) {
        setUser(JSON.parse(storedUser));
      }
    } catch (error) {
      console.error("Failed to parse user from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const login = (userData: Omit<User, 'password' | 'password_hash'>) => {
    try {
      localStorage.setItem('CineBook-user', JSON.stringify(userData));
      setUser(userData);
    } catch (error) {
      console.error("Failed to save user to localStorage", error);
    }
  };

  const logout = () => {
    try {
      localStorage.removeItem('CineBook-user');
      setUser(null);
      toast({ title: 'Logged Out', description: 'You have been successfully logged out.' });
      router.push('/login');
    } catch (error) {
      console.error("Failed to remove user from localStorage", error);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
