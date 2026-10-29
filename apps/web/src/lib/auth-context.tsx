'use client';

import React, { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { UserRole } from '@/shared';
import { AuthUser, getStoredUser, storeUser, clearUser } from './auth-store';
import { apiClient } from './api-client';

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDoctor: boolean;
  isPatient: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<{ mfaRequired: boolean; mfaPendingToken?: string }>;
  verifyMfa: (totpCode: string) => Promise<void>;
  registerPatient: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  registerDoctor: (input: any) => Promise<any>;
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
      if (typeof window !== 'undefined' && result.mfaPendingToken) {
        sessionStorage.setItem('doctalk_mfa_pending', result.mfaPendingToken);
      }
      return { mfaRequired: true, mfaPendingToken: result.mfaPendingToken };
    }
    if (result.user) {
      const authUser = result.user as AuthUser;
      setUser(authUser);
      storeUser(authUser);
    }
    return { mfaRequired: false };
  }, []);

  const verifyMfa = useCallback(async (totpCode: string) => {
    const pendingToken = typeof window !== 'undefined' ? sessionStorage.getItem('doctalk_mfa_pending') : null;
    if (!pendingToken) {
      throw new Error('MFA session expired. Please log in again.');
    }
    const result = await apiClient.verifyMfa({ mfaPendingToken: pendingToken, totpCode });
    if (result.user) {
      const authUser = result.user as AuthUser;
      setUser(authUser);
      storeUser(authUser);
    }
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('doctalk_mfa_pending');
    }
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

  const registerDoctor = useCallback(async (input: any) => {
    return apiClient.registerDoctor(input);
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
    verifyMfa,
    registerPatient,
    registerDoctor,
    logout,
    refreshUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    return {
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isDoctor: false,
      isPatient: false,
      isAdmin: false,
      login: async () => ({ mfaRequired: false }),
      verifyMfa: async () => {},
      registerPatient: async () => {},
      registerDoctor: async () => ({}),
      logout: async () => {},
      refreshUser: async () => {},
    };
  }
  return ctx;
}
