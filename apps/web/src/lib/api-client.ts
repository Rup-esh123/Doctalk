import {
  DoctorSummary,
  DoctorSearchQuery,
  Slot,
  CreateAppointmentInput,
  LoginInput,
  PatientRegisterInput,
  DoctorRegisterInput,
} from '@/shared';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/v1';

async function fetcher<T>(endpoint: string, options?: RequestInit): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const res = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers || {}),
    },
    credentials: 'include',
  });

  if (!res.ok) {
    let errorJson: any;
    try {
      errorJson = await res.json();
    } catch {
      throw new Error(`API error: ${res.statusText}`);
    }
    throw new Error(errorJson.message || 'API request failed');
  }

  return res.json();
}

export const apiClient = {
  async getHealth() {
    return fetcher<{ status: string; service: string; timestamp: string }>('/health/liveness');
  },

  async getSpecialties() {
    return fetcher<Array<{ id: string; name: string; slug: string; description: string; icon: string }>>(
      '/doctors/specialties',
    );
  },

  async getDoctors(query?: Partial<DoctorSearchQuery>) {
    const params = new URLSearchParams();
    if (query?.specialty) params.append('specialty', query.specialty);
    if (query?.language) params.append('language', query.language);
    if (query?.search) params.append('search', query.search);
    if (query?.mode) params.append('mode', query.mode);
    if (query?.practiceType) params.append('practiceType', query.practiceType);

    const qs = params.toString() ? `?${params.toString()}` : '';
    return fetcher<{ doctors: DoctorSummary[]; total: number }>(`/doctors${qs}`);
  },

  async getDoctor(idOrSlug: string) {
    return fetcher<DoctorSummary>(`/doctors/${idOrSlug}`);
  },

  async getSlots(doctorId: string, date?: string) {
    const qs = date ? `?date=${encodeURIComponent(date)}` : '';
    return fetcher<Slot[]>(`/doctors/${doctorId}/slots${qs}`);
  },

  async createAppointment(input: CreateAppointmentInput, idempotencyKey?: string) {
    return fetcher<any>('/appointments', {
      method: 'POST',
      headers: idempotencyKey ? { 'Idempotency-Key': idempotencyKey } : {},
      body: JSON.stringify(input),
    });
  },

  async getAppointment(id: string) {
    return fetcher<any>(`/appointments/${id}`);
  },

  async cancelAppointment(id: string, reason: string) {
    return fetcher<any>(`/appointments/${id}/cancel`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },

  async login(input: LoginInput) {
    return fetcher<any>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async registerPatient(input: PatientRegisterInput) {
    return fetcher<any>('/auth/register/patient', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async registerDoctor(input: DoctorRegisterInput) {
    return fetcher<any>('/auth/register/doctor', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async verifyMfa(input: { mfaPendingToken: string; totpCode: string }) {
    return fetcher<any>('/auth/mfa/verify', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  },

  async enrollMfa() {
    return fetcher<{ secret: string; otpAuthUrl: string; message: string }>('/auth/mfa/enroll', {
      method: 'POST',
    });
  },

  async confirmMfa(totpCode: string) {
    return fetcher<{ message: string }>('/auth/mfa/confirm', {
      method: 'POST',
      body: JSON.stringify({ totpCode }),
    });
  },

  async verifyEmail(token: string) {
    return fetcher<{ message: string }>('/auth/verify-email', {
      method: 'POST',
      body: JSON.stringify({ token }),
    });
  },

  async resendVerification() {
    return fetcher<{ message: string }>('/auth/resend-verification', {
      method: 'POST',
    });
  },

  async requestPasswordReset(email: string) {
    return fetcher<{ message: string }>('/auth/password-reset/request', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  },

  async confirmPasswordReset(token: string, newPassword: string) {
    return fetcher<{ message: string }>('/auth/password-reset/confirm', {
      method: 'POST',
      body: JSON.stringify({ token, newPassword }),
    });
  },

  async getMe() {
    return fetcher<any>('/auth/me');
  },

  async logout() {
    return fetcher<any>('/auth/logout', { method: 'POST' });
  },

  // ---------------------------------------------------------------------------
  // Doctor Onboarding
  // ---------------------------------------------------------------------------

  async getDoctorOnboarding() {
    return fetcher<{ profile: any; decisions: any[] }>('/doctors/me/onboarding');
  },

  async updateDoctorOnboarding(data: any) {
    return fetcher<any>('/doctors/me/onboarding/profile', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  async addDoctorCredential(data: { type: string; councilName: string; registrationNumber: string; documentFileId?: string }) {
    return fetcher<any>('/doctors/me/onboarding/documents', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async submitDoctorOnboarding() {
    return fetcher<{ message: string }>('/doctors/me/onboarding/submit', {
      method: 'POST',
    });
  },

  // ---------------------------------------------------------------------------
  // Admin Verification Portal
  // ---------------------------------------------------------------------------

  async getAdminApplications(params?: { status?: string; page?: number; limit?: number }) {
    const qs = new URLSearchParams();
    if (params?.status) qs.append('status', params.status);
    if (params?.page) qs.append('page', String(params.page));
    if (params?.limit) qs.append('limit', String(params.limit));
    const query = qs.toString() ? `?${qs.toString()}` : '';
    return fetcher<{ applications: any[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      `/admin/applications${query}`,
    );
  },

  async getAdminApplicationDetail(doctorId: string) {
    return fetcher<{ profile: any; decisions: any[] }>(`/admin/applications/${doctorId}`);
  },

  async approveDoctorApplication(doctorId: string, notes?: string) {
    return fetcher<{ message: string }>(`/admin/applications/${doctorId}/approve`, {
      method: 'POST',
      body: JSON.stringify({ notes }),
    });
  },

  async rejectDoctorApplication(doctorId: string, reason: string, notes?: string) {
    return fetcher<{ message: string }>(`/admin/applications/${doctorId}/reject`, {
      method: 'POST',
      body: JSON.stringify({ reason, notes }),
    });
  },

  async requestDoctorInfo(doctorId: string, reason: string) {
    return fetcher<{ message: string }>(`/admin/applications/${doctorId}/request-info`, {
      method: 'POST',
      body: JSON.stringify({ reason }),
    });
  },
};
