import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types';
import { loginUsuario } from '../services/usuariosService';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('banco_user');
    return stored ? JSON.parse(stored) : null;
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const res = await loginUsuario({ nombre_usuario: username, contrasena: password });

    if (!res.success) {
      throw new Error(res.message ?? 'Credenciales incorrectas');
    }

    const token = res.token ?? res.data?.token;
    if (token) {
      localStorage.setItem('banco_token', token);
    }

    const info = res.data;
    const authUser: User = {
      id: info?.id ?? 0,
      username: info?.nombre_usuario ?? username,
      nombre: info?.nombre ?? username,
      rol: info?.rol ?? 'USUARIO',
    };

    setUser(authUser);
    localStorage.setItem('banco_user', JSON.stringify(authUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('banco_user');
    localStorage.removeItem('banco_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};
