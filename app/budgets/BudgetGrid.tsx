'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColDef } from 'ag-grid-community';
import { DataGrid } from '@/components/DataGrid';
import { upsertBudgetAction } from '@/app/actions';

export type BudgetRow = {
  id: string;
  program_id: string;
  program: string;
  year: number;
  amount: number;
};

type BudgetGridProps = {
  rows: BudgetRow[];
  programs: { id: string; name: string }[];
  years: number[];
};

export function BudgetGrid({ rows, programs, years }: BudgetGridProps) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string | null>(null);
  const columnDefs = useMemo<ColDef<BudgetRow>[]>(
    () => [
      { field: 'program', headerName: 'Program', sortable: true, editable: false },
      { field: 'year', headerName: 'Year', sortable: true, editable: false },
      {
        field: 'amount',
        headerName: 'Amount',
        editable: true,
        valueFormatter: (params) => `$${Number(params.value ?? 0).toLocaleString()}`,
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <div className="text-sm text-slate-500">
        Inline edit the amount column and changes will save automatically. {pending ? 'Saving…' : message}
      </div>
      <DataGrid
        rowData={rows}
        columnDefs={columnDefs}
        onCellValueChanged={(event) => {
          const value = Number(event.newValue);
          if (Number.isNaN(value) || value < 0) {
            setMessage('Amount must be zero or greater.');
            return;
          }
          startTransition(async () => {
            try {
              await upsertBudgetAction({
                id: event.data.id,
                program_id: event.data.program_id,
                year: event.data.year,
                amount: value,
              });
              setMessage('Budget saved');
            } catch (error) {
              console.error(error);
              setMessage('Failed to save budget');
            }
          });
        }}
      />
      <BudgetQuickAdd programs={programs} years={years} onSubmit={setMessage} />
    </div>
  );
}

type BudgetQuickAddProps = {
  programs: { id: string; name: string }[];
  years: number[];
  onSubmit: (message: string) => void;
};

function BudgetQuickAdd({ programs, years, onSubmit }: BudgetQuickAddProps) {
  const [pending, startTransition] = useTransition();
  const [programId, setProgramId] = useState(programs[0]?.id ?? '');
  const [year, setYear] = useState(years[0] ?? new Date().getFullYear());
  const [amount, setAmount] = useState(0);

  return (
    <form
      className="card flex flex-wrap items-end gap-4 p-4"
      onSubmit={(event) => {
        event.preventDefault();
        startTransition(async () => {
          try {
            await upsertBudgetAction({ program_id: programId, year, amount });
            onSubmit('Budget added');
          } catch (error) {
            console.error(error);
            onSubmit('Failed to add budget');
          }
        });
      }}
    >
      <div className="flex flex-col">
        <label className="text-xs font-medium text-slate-500">Program</label>
        <select
          className="rounded border px-3 py-2"
          value={programId}
          onChange={(event) => setProgramId(event.target.value)}
        >
          {programs.map((program) => (
            <option key={program.id} value={program.id}>
              {program.name}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-medium text-slate-500">Year</label>
        <select className="rounded border px-3 py-2" value={year} onChange={(event) => setYear(Number(event.target.value))}>
          {years.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>
      <div className="flex flex-col">
        <label className="text-xs font-medium text-slate-500">Amount</label>
        <input
          type="number"
          min={0}
          value={amount}
          onChange={(event) => setAmount(Number(event.target.value))}
          className="rounded border px-3 py-2"
        />
      </div>
      <button
        type="submit"
        className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50"
        disabled={pending || !programId}
      >
        {pending ? 'Saving…' : 'Add Budget'}
      </button>
    </form>
  );
}
