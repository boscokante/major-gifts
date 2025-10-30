import { CoverageCharts } from '@/components/Charts';
import { createServerClient } from '@/lib/supabaseClient';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function SharePage({ params }: { params: { slug: string } }) {
  const supabase = createServerClient();
  const slug = params.slug;
  const yearMatch = /^\d{4}$/.test(slug) ? Number(slug) : 2025;
  const scenarioMatch = slug.startsWith('scenario-') ? slug.replace('scenario-', '') : null;

  let coverage;
  if (scenarioMatch) {
    const { data } = await supabase
      .from('v_scenario_coverage_summary')
      .select('*')
      .eq('scenario_id', scenarioMatch)
      .eq('year', yearMatch);
    coverage = data ?? [];
  } else {
    const { data } = await supabase.from('v_coverage_summary').select('*').eq('year', yearMatch);
    coverage = data ?? [];
  }

  const totals = (coverage ?? []).reduce(
    (acc, row) => {
      acc.budget += row.budget ?? 0;
      acc.committed += row.committed_funding ?? 0;
      acc.gap += row.gap_to_budget ?? 0;
      return acc;
    },
    { budget: 0, committed: 0, gap: 0 },
  );

  return (
    <div className="flex flex-col gap-6">
      <div className="card p-6">
        <h1 className="text-2xl font-semibold">HiiiWAV Coverage Snapshot ({slug})</h1>
        <div className="mt-4 grid gap-4 md:grid-cols-3">
          <div>
            <div className="text-xs uppercase text-slate-500">Budget</div>
            <div className="text-xl font-semibold">{currencyFormatter.format(totals.budget)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Committed</div>
            <div className="text-xl font-semibold">{currencyFormatter.format(totals.committed)}</div>
          </div>
          <div>
            <div className="text-xs uppercase text-slate-500">Gap</div>
            <div className="text-xl font-semibold">{currencyFormatter.format(totals.gap)}</div>
          </div>
        </div>
      </div>
      <div className="card p-6">
        <CoverageCharts data={(coverage ?? []) as any} />
      </div>
    </div>
  );
}
