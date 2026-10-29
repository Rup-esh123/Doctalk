import { describe, it, expect, beforeEach } from 'vitest';
import { getStoredUser, storeUser, clearUser, AuthUser } from '../src/lib/auth-store';
import { patientRegisterSchema, doctorRegisterSchema } from '../src/shared';

// Polyfill window & localStorage in Node test environment
const storageMock = (() => {
  let store: Record<string, string> = {};
  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = String(value);
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(globalThis, 'window', {
  value: globalThis,
  writable: true,
});

Object.defineProperty(globalThis, 'localStorage', {
  value: storageMock,
  writable: true,
});

describe('Web Auth Store & Registration Validation', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('stores and retrieves authenticated user from localStorage', () => {
    const mockUser: AuthUser = {
      id: 'usr-123',
      email: 'patient@example.com',
      role: 'PATIENT' as any,
      displayName: 'Aarav Sharma',
      isVerified: true,
    };

    expect(getStoredUser()).toBeNull();
    storeUser(mockUser);
    expect(getStoredUser()).toEqual(mockUser);
    clearUser();
    expect(getStoredUser()).toBeNull();
  });

  it('validates doctor registration data against schema', () => {
    const validDoctor = {
      displayName: 'Dr. Anita Desai',
      email: 'doctor@hospital.org',
      password: 'StrongPassword123!',
      registrationCouncil: 'Delhi Medical Council',
      registrationNumber: 'DMC-98765',
      primarySpecialty: 'General Medicine',
      yearsExperience: 8,
      consultationFeePaise: 60000,
      languages: ['English', 'Hindi'],
    };

    const parsed = doctorRegisterSchema.safeParse(validDoctor);
    expect(parsed.success).toBe(true);
  });

  it('rejects patient registration without strong password', () => {
    const invalidPatient = {
      fullName: 'Vikram Singh',
      email: 'vikram@example.com',
      password: 'weak',
    };

    const parsed = patientRegisterSchema.safeParse(invalidPatient);
    expect(parsed.success).toBe(false);
  });
});
