'use server';

import { revalidatePath } from 'next/cache';
import { createServerClient } from '@/lib/supabaseClient';
import {
  ActualInput,
  actualSchema,
  AllocationRuleInput,
  allocationRuleSchema,
  BudgetInput,
  budgetSchema,
  GrantInput,
  grantSchema,
  GrantYearAmountInput,
  grantYearAmountSchema,
  ProgramInput,
  programSchema,
  RestrictionInput,
  restrictionSchema,
  ScenarioInput,
  scenarioSchema,
} from '@/lib/validators';

const upsertRecord = async <T extends { id?: string }>(
  table: string,
  payload: T,
  pathToRevalidate: string[],
) => {
  const supabase = createServerClient();
  const { data, error } = await supabase.from(table).upsert(payload).select().single();
  if (error) {
    throw new Error(error.message);
  }
  pathToRevalidate.forEach((path) => revalidatePath(path));
  return data;
};

const deleteRecord = async (table: string, id: string, pathToRevalidate: string[]) => {
  const supabase = createServerClient();
  const { error } = await supabase.from(table).delete().eq('id', id);
  if (error) {
    throw new Error(error.message);
  }
  pathToRevalidate.forEach((path) => revalidatePath(path));
};

export async function upsertProgramAction(values: ProgramInput) {
  const payload = programSchema.parse(values);
  return upsertRecord('programs', payload, ['/dashboard', '/budgets', '/grants', '/allocations', '/actuals']);
}

export async function deleteProgramAction(id: string) {
  return deleteRecord('programs', id, ['/dashboard', '/budgets']);
}

export async function upsertBudgetAction(values: BudgetInput) {
  const payload = budgetSchema.parse(values);
  return upsertRecord('budgets', payload, ['/dashboard', '/budgets', '/share/[slug]']);
}

export async function deleteBudgetAction(id: string) {
  return deleteRecord('budgets', id, ['/dashboard', '/budgets', '/share/[slug]']);
}

export async function upsertGrantAction(values: GrantInput) {
  const payload = grantSchema.parse(values);
  return upsertRecord('grants', payload, ['/dashboard', '/grants', '/allocations', '/share/[slug]']);
}

export async function deleteGrantAction(id: string) {
  return deleteRecord('grants', id, ['/dashboard', '/grants', '/allocations', '/share/[slug]']);
}

export async function upsertGrantYearAmountAction(values: GrantYearAmountInput) {
  const payload = grantYearAmountSchema.parse(values);
  return upsertRecord('grant_year_amounts', payload, ['/grants', '/allocations', '/dashboard', '/share/[slug]']);
}

export async function deleteGrantYearAmountAction(id: string) {
  return deleteRecord('grant_year_amounts', id, ['/grants', '/allocations', '/dashboard', '/share/[slug]']);
}

export async function upsertRestrictionAction(values: RestrictionInput) {
  const payload = restrictionSchema.parse(values);
  return upsertRecord('grant_restrictions', payload, ['/grants', '/allocations']);
}

export async function deleteRestrictionAction(id: string) {
  return deleteRecord('grant_restrictions', id, ['/grants', '/allocations']);
}

export async function upsertAllocationRuleAction(values: AllocationRuleInput) {
  const payload = allocationRuleSchema.parse(values);
  return upsertRecord('allocation_rules', payload, ['/allocations', '/dashboard', '/share/[slug]']);
}

export async function deleteAllocationRuleAction(id: string) {
  return deleteRecord('allocation_rules', id, ['/allocations', '/dashboard', '/share/[slug]']);
}

export async function upsertActualAction(values: ActualInput) {
  const payload = actualSchema.parse(values);
  return upsertRecord('actuals', payload, ['/dashboard', '/actuals', '/share/[slug]']);
}

export async function deleteActualAction(id: string) {
  return deleteRecord('actuals', id, ['/dashboard', '/actuals', '/share/[slug]']);
}

export async function upsertScenarioAction(values: ScenarioInput) {
  const payload = scenarioSchema.parse(values);
  return upsertRecord('scenarios', payload, ['/scenarios', '/dashboard']);
}

export async function cloneScenarioAction(sourceScenarioId: string, name: string) {
  const supabase = createServerClient();
  const { data: scenario, error } = await supabase
    .from('scenarios')
    .insert({ name, base_scenario_id: sourceScenarioId })
    .select()
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const { error: cloneError } = await supabase.rpc('clone_scenario_data', {
    source_id: sourceScenarioId,
    target_id: scenario.id,
  });

  if (cloneError) {
    throw new Error(cloneError.message);
  }

  revalidatePath('/scenarios');
  return scenario;
}

export async function applyScenarioToLiveAction(scenarioId: string) {
  const supabase = createServerClient();
  const { error } = await supabase.rpc('apply_scenario_to_live', {
    scenario_id: scenarioId,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath('/dashboard');
  revalidatePath('/budgets');
  revalidatePath('/allocations');
  revalidatePath('/scenarios');
  revalidatePath('/share/[slug]');
}
