import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Usuario } from '../types';
import { apiClient } from '../services/api';

interface AuthState {
  usuario: Usuario | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  actualizarUsuario: (usuario: Usuario) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>({
    usuario: null,
    token: localStorage.getItem('token'),
    loading: true,
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setState(s => ({ ...s, loading: false }));
      return;
    }

    apiClient.get<Usuario>('/auth/perfil')
      .then(usuario => setState({ usuario, token, loading: false }))
      .catch(() => {
        localStorage.removeItem('token');
        setState({ usuario: null, token: null, loading: false });
      });
  }, []);

  const login = async (email: string, password: string) => {
    const data = await apiClient.post<{ token: string; usuario: Usuario }>('/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setState({ usuario: data.usuario, token: data.token, loading: false });
  };

  const logout = () => {
    localStorage.removeItem('token');
    setState({ usuario: null, token: null, loading: false });
  };

  const actualizarUsuario = (usuario: Usuario) => {
    setState(s => ({ ...s, usuario }));
  };

  return (
    <AuthContext.Provider value={{ ...state, login, logout, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth debe usarse dentro de AuthProvider');
  return ctx;
}
