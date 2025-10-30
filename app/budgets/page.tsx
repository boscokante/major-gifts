import { createServerClient } from '@/lib/supabaseClient';
import { BudgetGrid } from './BudgetGrid';

export default async function BudgetsPage() {
  const supabase = createServerClient();
  const [{ data: budgets }, { data: programs }, { data: years }] = await Promise.all([
    supabase
      .from('budgets')
      .select('id, amount, year, program_id, programs!inner(name)')
      .order('year', { ascending: true })
      .order('programs(name)', { ascending: true }),
    supabase.from('programs').select('id, name').order('name', { ascending: true }),
    supabase.from('years').select('year').order('year', { ascending: true }),
  ]);

  const rows = (budgets ?? []).map((budget) => ({
    id: budget.id,
    amount: budget.amount,
    year: budget.year,
    program_id: budget.program_id,
    program: (budget as any).programs?.name ?? 'Unknown',
  }));

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Program Budgets</h1>
          <p className="text-sm text-slate-500">Maintain annual program budgets. Budgets drive coverage and gap calculations.</p>
        </div>
      </div>
      <div className="card p-6">
        <BudgetGrid rows={rows} programs={programs ?? []} years={(years ?? []).map((year) => year.year)} />
      </div>
    </div>
  );
}
