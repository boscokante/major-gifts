'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColDef } from 'ag-grid-community';
import { DataGrid } from '@/components/DataGrid';
import { upsertAllocationRuleAction } from '@/app/actions';

export type AllocationRow = {
  id: string;
  grant_id: string;
  grant: string;
  year: number;
  program_id: string;
  program: string;
  percent: number;
};

type AllocationGridProps = {
  rows: AllocationRow[];
  grants: { id: string; funder: string; type: string }[];
  programs: { id: string; name: string }[];
  years: number[];
  restrictions: Record<string, string[]>;
};

export function AllocationGrid({ rows, grants, programs, years, restrictions }: AllocationGridProps) {
  const [pending, startTransition] = useTransition();
  const [formState, setFormState] = useState({ grantId: grants[0]?.id ?? '', year: years[0] ?? new Date().getFullYear(), programId: programs[0]?.id ?? '', percent: 0.1 });

  const columnDefs = useMemo<ColDef<AllocationRow>[]>(
    () => [
      { field: 'grant', headerName: 'Grant', editable: false, rowGroup: false },
      { field: 'year', headerName: 'Year', editable: false },
      { field: 'program', headerName: 'Program', editable: false },
      {
        field: 'percent',
        headerName: 'Percent',
        editable: true,
        valueFormatter: (params) => `${Math.round((Number(params.value ?? 0) || 0) * 100)}%`,
      },
    ],
    [],
  );

  const totals = useMemo(() => {
    const map = new Map<string, number>();
    for (const row of rows) {
      const key = `${row.grant_id}-${row.year}`;
      map.set(key, (map.get(key) ?? 0) + row.percent);
    }
    return map;
  }, [rows]);

  const getTotal = (grantId: string, year: number) => Number(totals.get(`${grantId}-${year}`) ?? 0);

  const filteredPrograms = useMemo(() => {
    const allowed = restrictions[formState.grantId];
    if (!allowed || allowed.length === 0) {
      return programs;
    }
    return programs.filter((program) => allowed.includes(program.id));
  }, [formState.grantId, programs, restrictions]);

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Allocation percentages must total 100% for each grant-year. Enter values as decimals (e.g., 0.2) or whole
        percentages (e.g., 20). {pending ? 'Saving…' : ''}
      </div>
      <DataGrid
        rowData={rows}
        columnDefs={columnDefs}
        onCellValueChanged={(event) => {
          let value = Number(event.newValue);
          if (Number.isNaN(value)) {
            return;
          }
          if (value > 1) {
            value = value / 100;
          }
          if (Number.isNaN(value) || value < 0 || value > 1) {
            return;
          }
          startTransition(async () => {
            await upsertAllocationRuleAction({
              id: event.data.id,
              grant_id: event.data.grant_id,
              year: event.data.year,
              program_id: event.data.program_id,
              percent: value,
            });
          });
        }}
      />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {grants.map((grant) =>
          years.map((year) => {
            const total = getTotal(grant.id, year);
            return (
              <div key={`${grant.id}-${year}`} className="card p-4">
                <div className="text-sm font-medium">{grant.funder} – {year}</div>
                <div className="mt-2 h-2 w-full rounded bg-slate-200">
                  <div className="h-2 rounded bg-slate-900" style={{ width: `${Math.min(total, 1) * 100}%` }} />
                </div>
                <div className="mt-2 text-xs text-slate-500">{Math.round(total * 100)}% allocated</div>
              </div>
            );
          }),
        )}
      </div>
      <form
        className="card flex flex-wrap items-end gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            await upsertAllocationRuleAction({
              grant_id: formState.grantId,
              year: formState.year,
              program_id: formState.programId,
              percent: formState.percent,
            });
          });
        }}
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Grant</label>
          <select
            className="rounded border px-3 py-2"
            value={formState.grantId}
            onChange={(event) =>
              setFormState((prev) => ({
                ...prev,
                grantId: event.target.value,
                programId: restrictions[event.target.value]?.[0] ?? programs[0]?.id ?? '',
              }))
            }
          >
            {grants.map((grant) => (
              <option key={grant.id} value={grant.id}>
                {grant.funder}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Year</label>
          <select
            className="rounded border px-3 py-2"
            value={formState.year}
            onChange={(event) => setFormState((prev) => ({ ...prev, year: Number(event.target.value) }))}
          >
            {years.map((year) => (
              <option key={year} value={year}>
                {year}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Program</label>
          <select
            className="rounded border px-3 py-2"
            value={formState.programId}
            onChange={(event) => setFormState((prev) => ({ ...prev, programId: event.target.value }))}
          >
            {filteredPrograms.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Percent</label>
          <input
            type="number"
            min={0}
            max={1}
            step={0.01}
            className="rounded border px-3 py-2"
            value={formState.percent}
            onChange={(event) => setFormState((prev) => ({ ...prev, percent: Number(event.target.value) }))}
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={pending}>
          {pending ? 'Saving…' : 'Add Allocation'}
        </button>
      </form>
    </div>
  );
}
