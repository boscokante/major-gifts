import { createServerClient } from '@/lib/supabaseClient';
import { GrantGrid } from './GrantGrid';

export default async function GrantsPage() {
  const supabase = createServerClient();
  const [{ data: grants }, { data: amounts }, { data: restrictionData }, { data: programs }, { data: years }] =
    await Promise.all([
      supabase.from('grants').select('id, code, funder, status, type, notes').order('funder', { ascending: true }),
      supabase
        .from('grant_year_amounts')
        .select('id, grant_id, year, amount')
        .order('year', { ascending: true }),
      supabase
        .from('grant_restrictions')
        .select('id, grant_id, program_id, programs(name)')
        .order('programs(name)', { ascending: true }),
      supabase.from('programs').select('id, name').order('name', { ascending: true }),
      supabase.from('years').select('year').order('year', { ascending: true }),
    ]);

  const yearMap: Record<string, { id: string; grant_id: string; year: number; amount: number }[]> = {};
  for (const entry of amounts ?? []) {
    yearMap[entry.grant_id] = yearMap[entry.grant_id] ?? [];
    yearMap[entry.grant_id]!.push(entry);
  }
  const restrictionMap: Record<string, { id: string; grant_id: string; program_id: string; programs?: { name: string } }[]> = {};
  for (const entry of restrictionData ?? []) {
    restrictionMap[entry.grant_id] = restrictionMap[entry.grant_id] ?? [];
    restrictionMap[entry.grant_id]!.push(entry);
  }

  const grantsWithDefaults = (grants ?? []).map((grant) => ({
    id: grant.id,
    code: grant.code,
    funder: grant.funder,
    status: grant.status,
    type: grant.type,
    notes: grant.notes,
  }));

  const yearLookup: Record<string, { id: string; year: number; amount: number }[]> = {};
  for (const [grantId, entries] of Object.entries(yearMap ?? {})) {
    yearLookup[grantId] = entries.map((entry) => ({ id: entry.id, year: entry.year, amount: entry.amount }));
  }

  const restrictionLookup: Record<string, { id: string; program_id: string; program: string }[]> = {};
  for (const [grantId, entries] of Object.entries(restrictionMap ?? {})) {
    restrictionLookup[grantId] = entries.map((entry) => ({
      id: entry.id,
      program_id: entry.program_id,
      program: (entry as any).programs?.name ?? 'Unknown',
    }));
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Grants</h1>
        <p className="text-sm text-slate-500">
          Manage funders, restricted programs, and annual amounts. Grant metadata feeds allocations and dashboard
          projections.
        </p>
      </div>
      <GrantGrid
        grants={grantsWithDefaults}
        yearAmounts={yearLookup}
        restrictions={restrictionLookup}
        programs={programs ?? []}
        years={(years ?? []).map((item) => item.year)}
      />
    </div>
  );
}
