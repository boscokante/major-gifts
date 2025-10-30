'use client';

import { useMemo, useState, useTransition } from 'react';
import { applyScenarioToLiveAction, cloneScenarioAction, upsertScenarioAction } from '@/app/actions';

export type ScenarioRecord = {
  id: string;
  name: string;
  description: string | null;
  is_live: boolean;
  base_scenario_id: string | null;
};

type ScenarioManagerProps = {
  scenarios: ScenarioRecord[];
  coverageMap: Record<string, any[]>;
};

export function ScenarioManager({ scenarios, coverageMap }: ScenarioManagerProps) {
  const [selectedId, setSelectedId] = useState<string>(scenarios[0]?.id ?? '');
  const [pending, startTransition] = useTransition();
  const [newScenarioName, setNewScenarioName] = useState('New Scenario');
  const [description, setDescription] = useState('');

  const selectedScenario = useMemo(() => scenarios.find((scenario) => scenario.id === selectedId), [selectedId, scenarios]);
  const selectedCoverage = selectedScenario ? coverageMap[selectedId] ?? [] : [];

  if (!scenarios.length) {
    return <div className="card p-4 text-sm text-slate-500">No scenarios found. Seed data must be applied.</div>;
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-3 md:grid-cols-3">
        {scenarios.map((scenario) => (
          <button
            key={scenario.id}
            type="button"
            onClick={() => setSelectedId(scenario.id)}
            className={`rounded border px-4 py-3 text-left ${
              selectedId === scenario.id ? 'border-slate-900 bg-slate-900 text-white' : 'border-slate-200 bg-white'
            }`}
          >
            <div className="text-sm font-semibold">{scenario.name}</div>
            <div className="text-xs text-slate-500">{scenario.is_live ? 'Live scenario' : scenario.description ?? 'Draft scenario'}</div>
          </button>
        ))}
      </div>
      <form
        className="card flex flex-wrap items-end gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            await upsertScenarioAction({ name: newScenarioName, description });
            setNewScenarioName('New Scenario');
            setDescription('');
          });
        }}
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Scenario name</label>
          <input className="rounded border px-3 py-2" value={newScenarioName} onChange={(event) => setNewScenarioName(event.target.value)} />
        </div>
        <div className="flex flex-1 flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-500">Description</label>
          <input className="rounded border px-3 py-2" value={description} onChange={(event) => setDescription(event.target.value)} />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={pending}>
          {pending ? 'Saving…' : 'Create scenario'}
        </button>
      </form>
      {selectedScenario ? (
        <div className="card p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-lg font-semibold">{selectedScenario.name}</h3>
              <p className="text-sm text-slate-500">{selectedScenario.description}</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="rounded border border-slate-200 px-3 py-2 text-sm"
                disabled={pending}
                onClick={() =>
                  startTransition(async () => {
                    await cloneScenarioAction(selectedScenario.id, `${selectedScenario.name} Copy`);
                  })
                }
              >
                Clone
              </button>
              {!selectedScenario.is_live ? (
                <button
                  type="button"
                  className="rounded bg-slate-900 px-3 py-2 text-sm text-white"
                  disabled={pending}
                  onClick={() =>
                    startTransition(async () => {
                      await applyScenarioToLiveAction(selectedScenario.id);
                    })
                  }
                >
                  Apply to Live
                </button>
              ) : null}
            </div>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="px-2 py-1">Program</th>
                  <th className="px-2 py-1">Year</th>
                  <th className="px-2 py-1">Budget</th>
                  <th className="px-2 py-1">Committed</th>
                  <th className="px-2 py-1">Coverage %</th>
                  <th className="px-2 py-1">Gap</th>
                </tr>
              </thead>
              <tbody>
                {selectedCoverage.map((row) => (
                  <tr key={`${row.program_id}-${row.year}`} className="border-t">
                    <td className="px-2 py-1">{row.program}</td>
                    <td className="px-2 py-1">{row.year}</td>
                    <td className="px-2 py-1">${Number(row.budget ?? 0).toLocaleString()}</td>
                    <td className="px-2 py-1">${Number(row.committed_funding ?? 0).toLocaleString()}</td>
                    <td className="px-2 py-1">{Math.round((row.coverage_pct ?? 0) * 100)}%</td>
                    <td className="px-2 py-1">${Number(row.gap_to_budget ?? 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </div>
  );
}
