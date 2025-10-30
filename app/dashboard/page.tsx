import { CoverageCharts } from '@/components/Charts';
import { ScenarioDiff } from '@/components/ScenarioDiff';
import { createServerClient } from '@/lib/supabaseClient';
import Link from 'next/link';

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

export default async function DashboardPage({
  searchParams,
}: {
  searchParams?: { year?: string; scenario?: string };
}) {
  const supabase = createServerClient();
  const { data: yearsData } = await supabase.from('years').select('year').order('year', { ascending: true });

  const yearOptions = yearsData?.map((y) => y.year) ?? [];
  const fallbackYear = yearOptions[0] ?? new Date().getFullYear();
  const selectedYear = searchParams?.year ? Number(searchParams.year) : fallbackYear;
  const selectedScenario = searchParams?.scenario ?? 'live';

  const { data: coverageData } = await supabase
    .from('v_coverage_summary')
    .select('*')
    .eq('year', selectedYear)
    .order('program', { ascending: true });

  const { data: scenarios } = await supabase
    .from('scenarios')
    .select('id, name, is_live')
    .order('is_live', { ascending: false })
    .order('created_at', { ascending: false });

  let scenarioCoverage: any[] = [];
  if (selectedScenario !== 'live') {
    const { data } = await supabase
      .from('v_scenario_coverage_summary')
      .select('*')
      .eq('scenario_id', selectedScenario)
      .eq('year', selectedYear)
      .order('program', { ascending: true });
    scenarioCoverage = data ?? [];
  }

  const totals = coverageData?.reduce(
    (acc, item) => {
      acc.budget += item.budget ?? 0;
      acc.committed += item.committed_funding ?? 0;
      acc.gap += item.gap_to_budget ?? 0;
      acc.weighted += item.weighted_expected ?? 0;
      return acc;
    },
    { budget: 0, committed: 0, gap: 0, weighted: 0 },
  ) ?? { budget: 0, committed: 0, gap: 0, weighted: 0 };

  const scenarioMetrics = scenarioCoverage.map((row) => {
    const liveRow = coverageData?.find((item) => item.program_id === row.program_id);
    return {
      program: row.program,
      liveCoverage: liveRow?.coverage_pct ?? 0,
      scenarioCoverage: row.coverage_pct ?? 0,
      liveGap: liveRow?.gap_to_budget ?? 0,
      scenarioGap: row.gap_to_budget ?? 0,
    };
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Coverage Dashboard</h1>
        <div className="flex items-center gap-3 text-sm">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Year</span>
            <div className="flex items-center gap-1">
              {yearOptions.map((year) => (
                <Link
                  key={year}
                  href={`/dashboard?year=${year}&scenario=${selectedScenario}`}
                  className={`rounded px-3 py-1 ${selectedYear === year ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'}`}
                >
                  {year}
                </Link>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-600">Scenario</span>
            <div className="flex items-center gap-1">
              <Link
                href={`/dashboard?year=${selectedYear}&scenario=live`}
                className={`rounded px-3 py-1 ${selectedScenario === 'live' ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'}`}
              >
                Live
              </Link>
              {(scenarios ?? [])
                .filter((scenario) => !scenario.is_live)
                .map((scenario) => (
                  <Link
                    key={scenario.id}
                    href={`/dashboard?year=${selectedYear}&scenario=${scenario.id}`}
                    className={`rounded px-3 py-1 ${selectedScenario === scenario.id ? 'bg-slate-900 text-white' : 'bg-white text-slate-600 border'}`}
                  >
                    {scenario.name}
                  </Link>
                ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <div className="card p-4">
          <span className="text-sm text-slate-500">Budget</span>
          <div className="text-2xl font-semibold">{currencyFormatter.format(totals.budget)}</div>
        </div>
        <div className="card p-4">
          <span className="text-sm text-slate-500">Committed</span>
          <div className="text-2xl font-semibold">{currencyFormatter.format(totals.committed)}</div>
        </div>
        <div className="card p-4">
          <span className="text-sm text-slate-500">Gap</span>
          <div className="text-2xl font-semibold">{currencyFormatter.format(totals.gap)}</div>
        </div>
        <div className="card p-4">
          <span className="text-sm text-slate-500">Weighted Expected</span>
          <div className="text-2xl font-semibold">{currencyFormatter.format(totals.weighted)}</div>
        </div>
      </div>

      <div className="card p-6">
        <CoverageCharts data={(coverageData ?? []) as any} />
      </div>

      {selectedScenario !== 'live' && scenarioMetrics.length > 0 ? (
        <ScenarioDiff metrics={scenarioMetrics} />
      ) : null}
    </div>
  );
}
