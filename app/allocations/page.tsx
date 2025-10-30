import { createServerClient } from '@/lib/supabaseClient';
import { AllocationGrid } from './AllocationGrid';

export default async function AllocationsPage() {
  const supabase = createServerClient();
  const [{ data: allocations }, { data: grants }, { data: programs }, { data: years }, { data: restrictions }] =
    await Promise.all([
      supabase
        .from('allocation_rules')
        .select('id, grant_id, year, program_id, percent, grants(funder, type), programs(name)')
        .order('year', { ascending: true }),
      supabase.from('grants').select('id, funder, type').order('funder', { ascending: true }),
      supabase.from('programs').select('id, name').order('name', { ascending: true }),
      supabase.from('years').select('year').order('year', { ascending: true }),
      supabase.from('grant_restrictions').select('grant_id, program_id'),
    ]);

  const rows = (allocations ?? []).map((allocation) => ({
    id: allocation.id,
    grant_id: allocation.grant_id,
    grant: (allocation as any).grants?.funder ?? 'Unknown',
    year: allocation.year,
    program_id: allocation.program_id,
    program: (allocation as any).programs?.name ?? 'Unknown',
    percent: allocation.percent,
  }));

  const restrictionLookup: Record<string, string[]> = {};
  for (const restriction of restrictions ?? []) {
    restrictionLookup[restriction.grant_id] = restrictionLookup[restriction.grant_id] ?? [];
    restrictionLookup[restriction.grant_id]!.push(restriction.program_id);
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Grant Allocations</h1>
        <p className="text-sm text-slate-500">
          Allocate each grant-year across eligible programs. Ensure restricted grants stay within their allowed list and
          totals hit 100%.
        </p>
      </div>
      <AllocationGrid
        rows={rows}
        grants={grants ?? []}
        programs={programs ?? []}
        years={(years ?? []).map((item) => item.year)}
        restrictions={restrictionLookup}
      />
    </div>
  );
}
