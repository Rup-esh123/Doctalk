'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole } from '@doctalk/shared';
import { AuthUser, getStoredUser, storeUser, clearUser } from './auth-store';
import { apiClient } from './api-client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean }>;
  registerPatient: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // On mount, restore user from localStorage and verify with server
  useEffect(() => {
    const stored = getStoredUser();
    if (stored) {
      setUser(stored);
      // Verify the session is still valid in background
      apiClient.getMe()
        .then((serverUser) => {
          const updated = serverUser as AuthUser;
          setUser(updated);
          storeUser(updated);
        })
        .catch(() => {
          // Session expired or invalid
          clearUser();
          setUser(null);
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const result = await apiClient.login({ email, password });
    if (result.mfaRequired) {
      return { mfaRequired: true };
    }
    if (result.user) {
      const authUser = result.user as AuthUser;
      setUser(authUser);
      storeUser(authUser);
    }
    return { mfaRequired: false };
  }, []);

  const registerPatient = useCallback(async (
    fullName: string,
    email: string,
    password: string,
    phone?: string,
  ) => {
    const result = await apiClient.registerPatient({ fullName, email, password, phone });
    if (result.user) {
      const authUser = result.user as AuthUser;
      setUser(authUser);
      storeUser(authUser);
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiClient.logout();
    } finally {
      clearUser();
      setUser(null);
    }
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const serverUser = await apiClient.getMe();
      const authUser = serverUser as AuthUser;
      setUser(authUser);
      storeUser(authUser);
    } catch {
      clearUser();
      setUser(null);
    }
  }, []);

  const value: AuthContextValue = {
    user,
    isLoading,
    isAuthenticated: !!user,
    isDoctor: user?.role === UserRole.DOCTOR,
    isPatient: user?.role === UserRole.PATIENT,
    isAdmin: user?.role === UserRole.ADMIN,
    login,
    registerPatient,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
