'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColDef } from 'ag-grid-community';
import { DataGrid } from '@/components/DataGrid';
import { deleteActualAction, upsertActualAction } from '@/app/actions';

export type ActualRow = {
  id: string;
  occurred_on: string;
  program_id: string;
  program: string;
  type: 'Revenue' | 'Expense';
  amount: number;
  memo: string | null;
  grant_id: string | null;
  grant: string | null;
};

type ActualsGridProps = {
  rows: ActualRow[];
  programs: { id: string; name: string }[];
  grants: { id: string; funder: string }[];
};

export function ActualsGrid({ rows, programs, grants }: ActualsGridProps) {
  const [pending, startTransition] = useTransition();
  const [formState, setFormState] = useState({
    occurred_on: new Date().toISOString().slice(0, 10),
    program_id: programs[0]?.id ?? '',
    type: 'Expense' as 'Revenue' | 'Expense',
    amount: 0,
    memo: '',
    grant_id: '',
  });

  const columnDefs = useMemo<ColDef<ActualRow>[]>(
    () => [
      { field: 'occurred_on', headerName: 'Date', editable: true },
      { field: 'program', headerName: 'Program', editable: false },
      {
        field: 'type',
        headerName: 'Type',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['Revenue', 'Expense'] },
      },
      {
        field: 'amount',
        headerName: 'Amount',
        editable: true,
        valueFormatter: (params) => `$${Number(params.value ?? 0).toLocaleString()}`,
      },
      { field: 'memo', headerName: 'Memo', editable: true },
      { field: 'grant', headerName: 'Grant', editable: false },
      {
        field: 'actions',
        headerName: '',
        cellRenderer: (params: any) => {
          const button = document.createElement('button');
          button.textContent = 'Delete';
          button.className = 'text-sm text-red-600';
          button.onclick = () => {
            startTransition(async () => {
              await deleteActualAction(params.data.id);
            });
          };
          return button;
        },
      },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <DataGrid
        rowData={rows}
        columnDefs={columnDefs}
        onCellValueChanged={(event) => {
          startTransition(async () => {
            await upsertActualAction({
              id: event.data.id,
              occurred_on: event.data.occurred_on,
              program_id: event.data.program_id,
              type: event.data.type,
              amount: Number(event.data.amount),
              memo: event.data.memo ?? undefined,
              grant_id: event.data.grant_id ?? undefined,
            });
          });
        }}
      />
      <form
        className="card flex flex-wrap items-end gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          startTransition(async () => {
            await upsertActualAction({
              occurred_on: formState.occurred_on,
              program_id: formState.program_id,
              type: formState.type,
              amount: formState.amount,
              memo: formState.memo,
              grant_id: formState.grant_id || null,
            });
            setFormState((prev) => ({
              ...prev,
              amount: 0,
              memo: '',
            }));
          });
        }}
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Date</label>
          <input
            type="date"
            className="rounded border px-3 py-2"
            value={formState.occurred_on}
            onChange={(event) => setFormState((prev) => ({ ...prev, occurred_on: event.target.value }))}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Program</label>
          <select
            className="rounded border px-3 py-2"
            value={formState.program_id}
            onChange={(event) => setFormState((prev) => ({ ...prev, program_id: event.target.value }))}
          >
            {programs.map((program) => (
              <option key={program.id} value={program.id}>
                {program.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Type</label>
          <select
            className="rounded border px-3 py-2"
            value={formState.type}
            onChange={(event) => setFormState((prev) => ({ ...prev, type: event.target.value as 'Revenue' | 'Expense' }))}
          >
            <option value="Revenue">Revenue</option>
            <option value="Expense">Expense</option>
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Amount</label>
          <input
            type="number"
            min={0}
            className="rounded border px-3 py-2"
            value={formState.amount}
            onChange={(event) => setFormState((prev) => ({ ...prev, amount: Number(event.target.value) }))}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Grant (optional)</label>
          <select
            className="rounded border px-3 py-2"
            value={formState.grant_id}
            onChange={(event) => setFormState((prev) => ({ ...prev, grant_id: event.target.value }))}
          >
            <option value="">Unlinked</option>
            {grants.map((grant) => (
              <option key={grant.id} value={grant.id}>
                {grant.funder}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-500">Memo</label>
          <input
            className="rounded border px-3 py-2"
            value={formState.memo}
            onChange={(event) => setFormState((prev) => ({ ...prev, memo: event.target.value }))}
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={pending}>
          {pending ? 'Saving…' : 'Add Actual'}
        </button>
      </form>
      <div className="text-xs text-slate-500">Use the delete action within each row to remove an entry.</div>
    </div>
  );
}
