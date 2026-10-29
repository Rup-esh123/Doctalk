/**
 * Money utilities for DocTALK.
 * Rule: Money is ALWAYS stored and calculated in integer paise (1 INR = 100 paise).
 * No floating-point math for money.
 */

export function paiseToRupees(paise: number): number {
  return paise / 100;
}

export function rupeesToPaise(rupees: number): number {
  return Math.round(rupees * 100);
}

export function formatINR(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(rupees);
}

export function calculateCommission(
  feePaise: number,
  commissionBps: number,
): { commissionPaise: number; doctorPayablePaise: number } {
  // 1 bps = 0.01% = 1/10000
  const commissionPaise = Math.round((feePaise * commissionBps) / 10000);
  const doctorPayablePaise = feePaise - commissionPaise;
  return { commissionPaise, doctorPayablePaise };
}
