import React, { createContext, useContext, useState, useCallback } from 'react';
import type { User } from '../types';
import { loginUsuario } from '../services/usuariosService';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const extractRoleFromJwt = (jwt: string | null): string => {
  if (!jwt) return '';
  try {
    const parts = jwt.split('.');
    if (parts.length >= 2) {
      const payload = JSON.parse(atob(parts[1]));
      return payload.rol || '';
    }
  } catch (e) {}
  return '';
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('banco_token'));

  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('banco_user');
    const storedToken = localStorage.getItem('banco_token');
    if (!stored) return null;

    try {
      const parsed: User = JSON.parse(stored);
      const tokenRol = extractRoleFromJwt(storedToken);

      // Si el rol en sesión era genérico o el token contiene el rol real, sincronizarlo
      if (tokenRol) {
        parsed.rol = tokenRol;
      }

      // Si el usuario es Meny o admin, garantizar rol de superadministrador
      const isSuperUser = 
        (parsed.username || '').toLowerCase().includes('meny') ||
        (parsed.nombre || '').toLowerCase().includes('meny') ||
        (parsed.username || '').toLowerCase() === 'admin';

      if (isSuperUser) {
        parsed.rol = 'ADMINISTRADOR';
      }

      localStorage.setItem('banco_user', JSON.stringify(parsed));
      return parsed;
    } catch (e) {
      return null;
    }
  });

  const login = useCallback(async (username: string, password: string): Promise<boolean> => {
    const res = await loginUsuario({ nombre_usuario: username, contrasena: password });

    if (!res.success) {
      throw new Error(res.message ?? 'Credenciales incorrectas');
    }

    const jwt = res.token ?? (res.data as any)?.token;
    if (jwt) {
      localStorage.setItem('banco_token', jwt);
      setToken(jwt);
    }

    const uData = (res.data as any)?.usuario || res.data;
    const tokenRol = extractRoleFromJwt(jwt);

    // El sistema administrativo es solo para personal interno (no CLIENTE/EMPRESA)
    const realRol = String(uData?.rol || tokenRol || '').toUpperCase();
    if (realRol === 'CLIENTE' || realRol === 'EMPRESA') {
      localStorage.removeItem('banco_token'); setToken(null);
      throw new Error('Este sistema es solo para personal del banco. Si eres cliente entra en clientes.bancaunecre.com; si eres empresa, en empresas.bancaunecre.com.');
    }

    const isSuperUser = 
      username.toLowerCase().includes('meny') ||
      (uData?.nombre_completo || '').toLowerCase().includes('meny') ||
      username.toLowerCase() === 'admin';

    const finalRol = isSuperUser 
      ? 'ADMINISTRADOR' 
      : (uData?.rol || tokenRol || 'OPERADOR');

    const authUser: User = {
      id: uData?.id ?? 0,
      username: uData?.nombre_usuario ?? username,
      nombre: uData?.nombre_completo ?? uData?.nombre ?? username,
      rol: finalRol,
    };

    setUser(authUser);
    localStorage.setItem('banco_user', JSON.stringify(authUser));
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('banco_user');
    localStorage.removeItem('banco_token');
  }, []);

  return (
    <AuthContext.Provider value={{ user, token, isAuthenticated: !!user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};