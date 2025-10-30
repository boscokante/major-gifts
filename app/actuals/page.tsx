import { createServerClient } from '@/lib/supabaseClient';
import { ActualsGrid } from './ActualsGrid';

export default async function ActualsPage() {
  const supabase = createServerClient();
  const [{ data: actuals }, { data: programs }, { data: grants }] = await Promise.all([
    supabase
      .from('actuals')
      .select('id, occurred_on, program_id, type, amount, memo, grant_id, programs(name), grants(funder)')
      .order('occurred_on', { ascending: false }),
    supabase.from('programs').select('id, name').order('name', { ascending: true }),
    supabase.from('grants').select('id, funder').order('funder', { ascending: true }),
  ]);

  const rows = (actuals ?? []).map((actual) => ({
    id: actual.id,
    occurred_on: actual.occurred_on,
    program_id: actual.program_id,
    program: (actual as any).programs?.name ?? 'Unknown',
    type: actual.type,
    amount: actual.amount,
    memo: actual.memo,
    grant_id: actual.grant_id,
    grant: (actual as any).grants?.funder ?? null,
  }));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Actuals</h1>
        <p className="text-sm text-slate-500">Track realized revenue and expenses by program and optionally tie them to a grant.</p>
      </div>
      <ActualsGrid rows={rows} programs={programs ?? []} grants={grants ?? []} />
    </div>
  );
}
