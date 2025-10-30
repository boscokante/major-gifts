import { ScenarioDiff } from '@/components/ScenarioDiff';
import { createServerClient } from '@/lib/supabaseClient';
import { ScenarioManager } from './ScenarioManager';

export default async function ScenariosPage() {
  const supabase = createServerClient();
  const [{ data: scenarios }, { data: coverage }, { data: liveCoverage }] = await Promise.all([
    supabase
      .from('scenarios')
      .select('id, name, description, is_live, base_scenario_id, created_at')
      .order('is_live', { ascending: false })
      .order('created_at', { ascending: false }),
    supabase.from('v_scenario_coverage_summary').select('*'),
    supabase.from('v_coverage_summary').select('*'),
  ]);

  const liveMap = new Map<string, any>();
  for (const row of liveCoverage ?? []) {
    liveMap.set(`${row.program_id}-${row.year}`, row);
  }

  const coverageMap: Record<string, any[]> = {};
  for (const row of coverage ?? []) {
    coverageMap[row.scenario_id] = coverageMap[row.scenario_id] ?? [];
    coverageMap[row.scenario_id]!.push(row);
  }

  const scenarioMetrics = Object.entries(coverageMap).reduce<Record<string, any[]>>((acc, [scenarioId, rows]) => {
    acc[scenarioId] = rows.map((row) => {
      const liveRow = liveMap.get(`${row.program_id}-${row.year}`);
      return {
        program: row.program,
        liveCoverage: liveRow?.coverage_pct ?? 0,
        scenarioCoverage: row.coverage_pct ?? 0,
        liveGap: liveRow?.gap_to_budget ?? 0,
        scenarioGap: row.gap_to_budget ?? 0,
      };
    });
    return acc;
  }, {});

  const nonLiveIds = new Set((scenarios ?? []).filter((scenario) => !scenario.is_live).map((scenario) => scenario.id));

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Scenarios</h1>
        <p className="text-sm text-slate-500">
          Create sandboxes to model alternate allocations and budgets, compare against live, and push approved scenarios
          into production.
        </p>
      </div>
      <ScenarioManager scenarios={scenarios ?? []} coverageMap={coverageMap} />
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(scenarioMetrics).map(([scenarioId, metrics]) => {
          if (!nonLiveIds.has(scenarioId) || metrics.length === 0) return null;
          return <ScenarioDiff key={scenarioId} metrics={metrics} />;
        })}
      </div>
    </div>
  );
}
