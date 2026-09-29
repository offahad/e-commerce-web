import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, CustomerAddress } from '../types';
import { api } from '../services/api';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isApproved: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (phone: string, pass: string) => Promise<{ success: boolean; message?: string }>;
  register: (data: any) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  addresses: CustomerAddress[];
  loadAddresses: () => Promise<void>;
  authModal: { isOpen: boolean; mode: 'login' | 'register' };
  openAuthModal: (mode?: 'login' | 'register') => void;
  closeAuthModal: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [addresses, setAddresses] = useState<CustomerAddress[]>([]);
  const [authModal, setAuthModal] = useState<{ isOpen: boolean; mode: 'login' | 'register' }>({
    isOpen: false,
    mode: 'login',
  });

  useEffect(() => {
    const storedUser = localStorage.getItem('lb_user');
    const token = localStorage.getItem('lb_access_token');
    if (storedUser && token) {
      try {
        const parsed = JSON.parse(storedUser);
        setUser(parsed);
      } catch {
        localStorage.removeItem('lb_user');
      }
    }
    setIsLoading(false);
  }, []);

  const loadAddresses = async () => {
    if (!user) return;
    try {
      const res = await api.getCustomerAddresses();
      if (res.success && Array.isArray(res.data)) {
        setAddresses(res.data);
      }
    } catch (err) {
      console.error('Failed to load addresses', err);
    }
  };

  useEffect(() => {
    if (user) {
      loadAddresses();
    } else {
      setAddresses([]);
    }
  }, [user]);

  const login = async (phone: string, pass: string) => {
    try {
      const res = await api.login(phone, pass);
      if (res.success && res.data) {
        localStorage.setItem('lb_access_token', res.data.accessToken);
        localStorage.setItem('lb_refresh_token', res.data.refreshToken);
        localStorage.setItem('lb_user', JSON.stringify(res.data.user));
        setUser(res.data.user);
        setAuthModal({ isOpen: false, mode: 'login' });
        return { success: true };
      }
      return { success: false, message: res.message || 'Login failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Network error during login' };
    }
  };

  const register = async (data: any) => {
    try {
      const res = await api.register(data);
      if (res.success && res.data) {
        // Automatically login
        return await login(data.phone, data.password);
      }
      return { success: false, message: res.message || 'Registration failed' };
    } catch (err: any) {
      return { success: false, message: err.message || 'Registration failed' };
    }
  };

  const logout = () => {
    localStorage.removeItem('lb_access_token');
    localStorage.removeItem('lb_refresh_token');
    localStorage.removeItem('lb_user');
    setUser(null);
  };

  const openAuthModal = (mode: 'login' | 'register' = 'login') => {
    setAuthModal({ isOpen: true, mode });
  };

  const closeAuthModal = () => {
    setAuthModal({ isOpen: false, mode: 'login' });
  };

  const isAuthenticated = !!user;
  const isApproved = user?.status === 'APPROVED';
  const isAdmin = !!user && ['SUPER_ADMIN', 'ADMIN'].includes(user.role);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isApproved,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
        addresses,
        loadAddresses,
        authModal,
        openAuthModal,
        closeAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
