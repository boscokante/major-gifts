import { z } from 'zod';

export const uuidSchema = z.string().uuid();
export const yearSchema = z.number().int().min(2020).max(2100);

export const programSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(2).max(120),
});

export const budgetSchema = z.object({
  id: uuidSchema.optional(),
  program_id: uuidSchema,
  year: yearSchema,
  amount: z.number().min(0),
});

export const grantSchema = z.object({
  id: uuidSchema.optional(),
  code: z.string().max(24).optional().nullable(),
  funder: z.string().min(2),
  status: z.enum(['Received', 'Committed', 'Pledged', 'Prospect']),
  type: z.enum(['Restricted', 'Unrestricted']),
  notes: z.string().optional().nullable(),
});

export const grantYearAmountSchema = z.object({
  id: uuidSchema.optional(),
  grant_id: uuidSchema,
  year: yearSchema,
  amount: z.number().min(0),
});

export const restrictionSchema = z.object({
  id: uuidSchema.optional(),
  grant_id: uuidSchema,
  program_id: uuidSchema,
});

export const allocationRuleSchema = z.object({
  id: uuidSchema.optional(),
  grant_id: uuidSchema,
  year: yearSchema,
  program_id: uuidSchema,
  percent: z.number().min(0).max(1),
});

export const actualSchema = z.object({
  id: uuidSchema.optional(),
  occurred_on: z.string(),
  program_id: uuidSchema,
  type: z.enum(['Revenue', 'Expense']),
  amount: z.number().min(0),
  memo: z.string().optional().nullable(),
  grant_id: uuidSchema.optional().nullable(),
});

export const scenarioSchema = z.object({
  id: uuidSchema.optional(),
  name: z.string().min(2),
  description: z.string().optional().nullable(),
  base_scenario_id: uuidSchema.optional().nullable(),
  is_live: z.boolean().optional(),
});

export type ProgramInput = z.infer<typeof programSchema>;
export type BudgetInput = z.infer<typeof budgetSchema>;
export type GrantInput = z.infer<typeof grantSchema>;
export type GrantYearAmountInput = z.infer<typeof grantYearAmountSchema>;
export type RestrictionInput = z.infer<typeof restrictionSchema>;
export type AllocationRuleInput = z.infer<typeof allocationRuleSchema>;
export type ActualInput = z.infer<typeof actualSchema>;
export type ScenarioInput = z.infer<typeof scenarioSchema>;
