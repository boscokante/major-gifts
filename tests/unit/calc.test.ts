import { describe, expect, it } from 'vitest';
import { calculateCoverage, calculateGap, calculateWeightedExpected, validateAllocationTotal } from '@/lib/calc';

describe('calc helpers', () => {
  it('calculates coverage', () => {
    expect(calculateCoverage(50, 100)).toBe(0.5);
    expect(calculateCoverage(0, 0)).toBe(0);
  });

  it('calculates gap', () => {
    expect(calculateGap(80, 100)).toBe(20);
    expect(calculateGap(120, 100)).toBe(0);
  });

  it('calculates weighted expected totals', () => {
    const result = calculateWeightedExpected([
      { amount: 100, probability: 1 },
      { amount: 50, probability: 0.5 },
    ]);
    expect(result).toBe(125);
  });

  it('validates allocation totals', () => {
    expect(validateAllocationTotal([0.5, 0.5])).toBe(true);
    expect(validateAllocationTotal([0.5, 0.4])).toBe(false);
  });
});
