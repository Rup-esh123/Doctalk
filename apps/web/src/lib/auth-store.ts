'use client';

/**
 * DocTALK Auth Store
 * The access token is stored in an httpOnly cookie by the server.
 * We store the user payload in localStorage for client-side role checks and UI rendering.
 * Source of truth for authorization is always the server (cookie verification).
 */

import { UserRole } from '@doctalk/shared';

export interface AuthUser {
  id: string;
  email: string;
  role: UserRole;
  displayName: string;
  isVerified: boolean;
}

const STORAGE_KEY = 'doctalk_user';

export function getStoredUser(): AuthUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as AuthUser;
  } catch {
    return null;
  }
}

export function storeUser(user: AuthUser): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(user));
}

export function clearUser(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY);
}
