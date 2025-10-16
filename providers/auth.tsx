import { api, apiPublic } from '@/lib/api';
import * as SecureStore from 'expo-secure-store';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

type User = { email: string } | null;

type LoginResponse = {
  accessToken: string;
  refreshToken?: string;
  user?: { email: string };
};

const TOKEN_KEY = 'auth_token';
const EMAIL_KEY = 'auth_email';
const REFRESH_KEY = 'auth_refresh_token';

type AuthContextType = {
  isLoading: boolean;
  isSignedIn: boolean;
  user: User;
  token: string | null;
  refreshToken: string | null;
  signIn: (credentials: { email: string; password: string }) => Promise<void>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  getRefreshToken: () => Promise<string | null>;
  refreshAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [isLoading, setLoading] = useState(true);
  const [user, setUser] = useState<User>(null);
  const [token, setToken] = useState<string | null>(null);
  const [rToken, setRToken] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [t, email, rt] = await Promise.all([
          SecureStore.getItemAsync(TOKEN_KEY),
          SecureStore.getItemAsync(EMAIL_KEY),
          SecureStore.getItemAsync(REFRESH_KEY),
        ]);
        if (t) setToken(t);
        if (rt) setRToken(rt);
        if (email) setUser({ email });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const signIn = async ({ email, password }: { email: string; password: string }) => {
    // POST /api/v1/auth/login
    const { data } = await apiPublic.post('/api/v1/auth/login', { email, password });
    const accessToken = data.accessToken;
    const refreshToken = data.refreshToken ?? null;
    const userEmail = data.user?.email ?? email;

    await SecureStore.setItemAsync(TOKEN_KEY, accessToken);
    await SecureStore.setItemAsync(EMAIL_KEY, userEmail);
    if (refreshToken) await SecureStore.setItemAsync(REFRESH_KEY, refreshToken);

    setToken(accessToken);
    setRToken(refreshToken);
    setUser({ email: userEmail });
  };

  const signOut = async () => {
    try {
      // POST /api/v1/auth/logout (Authorization: Bearer <token>)
      // No enviamos body, tu endpoint acepta vacío.
      await api.post('/api/v1/auth/logout');
    } catch {
      // Ignorar errores de red aquí, de todas formas limpiamos.
    } finally {
      await Promise.all([
        SecureStore.deleteItemAsync(TOKEN_KEY),
        SecureStore.deleteItemAsync(EMAIL_KEY),
        SecureStore.deleteItemAsync(REFRESH_KEY),
      ]);
      setToken(null);
      setRToken(null);
      setUser(null);
    }
  };

  const getAccessToken = async () => {
    if (token) return token;
    const t = await SecureStore.getItemAsync(TOKEN_KEY);
    if (t && t !== token) setToken(t);
    return t;
  };

  const getRefreshToken = async () => {
    if (rToken) return rToken;
    const rt = await SecureStore.getItemAsync(REFRESH_KEY);
    if (rt && rt !== rToken) setRToken(rt);
    return rt;
  };

  const refreshAccessToken = async (): Promise<string | null> => {
    const rt = await getRefreshToken();
    if (!rt) return null;

    // POST /api/v1/auth/refresh-token
    // Asumo contrato: body { refreshToken }, y devuelve { accessToken }
    const { data } = await api.post<{ accessToken: string }>('/api/v1/auth/refresh-token', {
      refreshToken: rt,
    });

    const newAccess = data.accessToken;
    if (newAccess) {
      await SecureStore.setItemAsync(TOKEN_KEY, newAccess);
      setToken(newAccess);
      return newAccess;
    }
    return null;
  };

  const value = useMemo<AuthContextType>(() => ({
    isLoading,
    isSignedIn: !!user && !!token,
    user,
    token,
    refreshToken: rToken,
    signIn,
    signOut,
    getAccessToken,
    getRefreshToken,
    refreshAccessToken,
  }), [isLoading, user, token, rToken]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
