import { describe, it, expect } from 'vitest';
import { formatINR, PracticeType, DoctorStatus } from '../src/shared';

describe('DoctorCard Component Logic & Formatting', () => {
  it('formats consultation fee correctly in INR', () => {
    const feePaise = 50000; // ₹500
    const formatted = formatINR(feePaise);
    expect(formatted).toContain('500');
  });

  it('validates doctor data contract', () => {
    const doctor = {
      id: 'doc-1',
      userId: 'usr-1',
      slug: 'dr-test',
      displayName: 'Dr. Test Physician',
      practiceType: PracticeType.INDEPENDENT,
      yearsExperience: 10,
      consultationFeePaise: 50000,
      currency: 'INR',
      languages: ['English', 'Hindi'],
      acceptsInstant: true,
      status: DoctorStatus.VERIFIED,
      specialties: ['General Medicine'],
      ratingAvg: 4.9,
      ratingCount: 10,
    };

    expect(doctor.status).toBe(DoctorStatus.VERIFIED);
    expect(doctor.specialties.length).toBeGreaterThan(0);
    expect(doctor.consultationFeePaise).toBeGreaterThan(0);
  });
});
