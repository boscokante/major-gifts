export const calculateCoverage = (committed: number, budget: number) => {
  if (!budget) return 0;
  return committed / budget;
};

export const calculateGap = (committed: number, budget: number) => {
  return Math.max(budget - committed, 0);
};

export const calculateWeightedExpected = (
  allocations: { amount: number; probability: number }[],
) => {
  return allocations.reduce((acc, item) => acc + item.amount * item.probability, 0);
};

export const validateAllocationTotal = (percents: number[]) => {
  const total = percents.reduce((acc, pct) => acc + pct, 0);
  return Math.abs(total - 1) < 0.0001;
};
