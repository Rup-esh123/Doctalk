import { describe, it, expect } from 'vitest';
import { paiseToRupees, rupeesToPaise, formatINR, calculateCommission } from './money.js';

describe('Money Utilities (Integer Paise Integrity)', () => {
  it('converts paise to rupees accurately without float error', () => {
    expect(paiseToRupees(50000)).toBe(500);
    expect(paiseToRupees(15050)).toBe(150.5);
  });

  it('converts rupees to paise accurately', () => {
    expect(rupeesToPaise(500)).toBe(50000);
    expect(rupeesToPaise(150.5)).toBe(15050);
  });

  it('formats INR strings correctly with rupee symbol', () => {
    const formatted = formatINR(50000);
    expect(formatted).toContain('500');
  });

  it('computes commission in basis points accurately', () => {
    // 15% commission = 1500 bps
    const feePaise = 50000; // ₹500
    const { commissionPaise, doctorPayablePaise } = calculateCommission(feePaise, 1500);
    expect(commissionPaise).toBe(7500); // ₹75
    expect(doctorPayablePaise).toBe(42500); // ₹425
    expect(commissionPaise + doctorPayablePaise).toBe(feePaise);
  });

  it('handles managed clinic 25% commission (2500 bps)', () => {
    const feePaise = 100000; // ₹1000
    const { commissionPaise, doctorPayablePaise } = calculateCommission(feePaise, 2500);
    expect(commissionPaise).toBe(25000); // ₹250
    expect(doctorPayablePaise).toBe(75000); // ₹750
    expect(commissionPaise + doctorPayablePaise).toBe(feePaise);
  });
});
