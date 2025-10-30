'use client';

import { useMemo, useState, useTransition } from 'react';
import type { ColDef } from 'ag-grid-community';
import { DataGrid } from '@/components/DataGrid';
import {
  deleteGrantYearAmountAction,
  deleteRestrictionAction,
  upsertGrantAction,
  upsertGrantYearAmountAction,
  upsertRestrictionAction,
} from '@/app/actions';

export type GrantRow = {
  id: string;
  code: string | null;
  funder: string;
  status: string;
  type: string;
  notes: string | null;
};

type GrantGridProps = {
  grants: GrantRow[];
  yearAmounts: Record<string, { id: string; year: number; amount: number }[]>;
  restrictions: Record<string, { id: string; program_id: string; program: string }[]>;
  programs: { id: string; name: string }[];
  years: number[];
};

export function GrantGrid({ grants, yearAmounts, restrictions, programs, years }: GrantGridProps) {
  const [selectedGrantId, setSelectedGrantId] = useState<string | null>(grants[0]?.id ?? null);
  const [pending, startTransition] = useTransition();
  const [newGrant, setNewGrant] = useState({ funder: '', status: 'Prospect', type: 'Unrestricted', notes: '', code: '' });
  const columnDefs = useMemo<ColDef<GrantRow>[]>(
    () => [
      { field: 'code', headerName: 'Code', editable: true },
      { field: 'funder', headerName: 'Funder', editable: true },
      {
        field: 'status',
        headerName: 'Status',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['Received', 'Committed', 'Pledged', 'Prospect'] },
      },
      {
        field: 'type',
        headerName: 'Type',
        editable: true,
        cellEditor: 'agSelectCellEditor',
        cellEditorParams: { values: ['Restricted', 'Unrestricted'] },
      },
      { field: 'notes', headerName: 'Notes', editable: true },
    ],
    [],
  );

  return (
    <div className="flex flex-col gap-4">
      <DataGrid
        rowData={grants}
        columnDefs={columnDefs}
        onCellValueChanged={(event) => {
          startTransition(async () => {
            try {
              await upsertGrantAction({
                id: event.data.id,
                code: event.data.code ?? undefined,
                funder: event.data.funder,
                status: event.data.status as any,
                type: event.data.type as any,
                notes: event.data.notes ?? undefined,
              });
            } catch (error) {
              console.error(error);
            }
          });
        }}
        onRowClicked={(event) => setSelectedGrantId(event.data.id)}
      />
      {selectedGrantId ? (
        <GrantDetail
          grantId={selectedGrantId}
          yearAmounts={yearAmounts[selectedGrantId] ?? []}
          restrictions={restrictions[selectedGrantId] ?? []}
          programs={programs}
          years={years}
          pending={pending}
        />
      ) : null}
      <form
        className="card flex flex-wrap items-end gap-3 p-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (!newGrant.funder) return;
          startTransition(async () => {
            await upsertGrantAction({
              funder: newGrant.funder,
              status: newGrant.status as any,
              type: newGrant.type as any,
              notes: newGrant.notes,
              code: newGrant.code || undefined,
            });
            setNewGrant({ funder: '', status: 'Prospect', type: 'Unrestricted', notes: '', code: '' });
          });
        }}
      >
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Funder</label>
          <input
            className="rounded border px-3 py-2"
            value={newGrant.funder}
            onChange={(event) => setNewGrant((prev) => ({ ...prev, funder: event.target.value }))}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Code</label>
          <input
            className="rounded border px-3 py-2"
            value={newGrant.code}
            onChange={(event) => setNewGrant((prev) => ({ ...prev, code: event.target.value }))}
          />
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Status</label>
          <select
            className="rounded border px-3 py-2"
            value={newGrant.status}
            onChange={(event) => setNewGrant((prev) => ({ ...prev, status: event.target.value }))}
          >
            {['Received', 'Committed', 'Pledged', 'Prospect'].map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col">
          <label className="text-xs font-medium text-slate-500">Type</label>
          <select
            className="rounded border px-3 py-2"
            value={newGrant.type}
            onChange={(event) => setNewGrant((prev) => ({ ...prev, type: event.target.value }))}
          >
            {['Restricted', 'Unrestricted'].map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-1 flex-col min-w-[200px]">
          <label className="text-xs font-medium text-slate-500">Notes</label>
          <input
            className="rounded border px-3 py-2"
            value={newGrant.notes}
            onChange={(event) => setNewGrant((prev) => ({ ...prev, notes: event.target.value }))}
          />
        </div>
        <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={pending}>
          {pending ? 'Saving…' : 'Add Grant'}
        </button>
      </form>
    </div>
  );
}

type GrantDetailProps = {
  grantId: string;
  yearAmounts: { id: string; year: number; amount: number }[];
  restrictions: { id: string; program_id: string; program: string }[];
  programs: { id: string; name: string }[];
  years: number[];
  pending: boolean;
};

function GrantDetail({ grantId, yearAmounts, restrictions, programs, years, pending }: GrantDetailProps) {
  const [transitioning, startTransition] = useTransition();
  const [year, setYear] = useState<number>(years[0] ?? new Date().getFullYear());
  const [amount, setAmount] = useState<number>(0);
  const [programId, setProgramId] = useState<string>(programs[0]?.id ?? '');

  const restrictedPrograms = new Set(restrictions.map((item) => item.program_id));

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="card p-4">
        <h3 className="text-lg font-semibold">Year Amounts</h3>
        <div className="mt-2 space-y-2">
          {yearAmounts.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded border px-3 py-2">
              <span>
                {entry.year}: ${entry.amount.toLocaleString()}
              </span>
              <button
                type="button"
                className="text-sm text-red-600"
                disabled={pending || transitioning}
                onClick={() =>
                  startTransition(async () => {
                    await deleteGrantYearAmountAction(entry.id);
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await upsertGrantYearAmountAction({ grant_id: grantId, year, amount });
            });
          }}
        >
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500">Year</label>
            <select className="rounded border px-2 py-1" value={year} onChange={(event) => setYear(Number(event.target.value))}>
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
              className="rounded border px-2 py-1"
              value={amount}
              onChange={(event) => setAmount(Number(event.target.value))}
            />
          </div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={transitioning}>
            {transitioning ? 'Saving…' : 'Add'}
          </button>
        </form>
      </div>
      <div className="card p-4">
        <h3 className="text-lg font-semibold">Restrictions</h3>
        <div className="mt-2 space-y-2">
          {restrictions.map((entry) => (
            <div key={entry.id} className="flex items-center justify-between rounded border px-3 py-2">
              <span>{entry.program}</span>
              <button
                type="button"
                className="text-sm text-red-600"
                disabled={pending || transitioning}
                onClick={() =>
                  startTransition(async () => {
                    await deleteRestrictionAction(entry.id);
                  })
                }
              >
                Remove
              </button>
            </div>
          ))}
        </div>
        <form
          className="mt-3 flex flex-wrap items-end gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            startTransition(async () => {
              await upsertRestrictionAction({ grant_id: grantId, program_id: programId });
            });
          }}
        >
          <div className="flex flex-col">
            <label className="text-xs font-medium text-slate-500">Program</label>
            <select
              className="rounded border px-2 py-1"
              value={programId}
              onChange={(event) => setProgramId(event.target.value)}
            >
              {programs.map((program) => (
                <option key={program.id} value={program.id} disabled={restrictedPrograms.has(program.id)}>
                  {program.name}
                </option>
              ))}
            </select>
          </div>
          <button type="submit" className="rounded bg-slate-900 px-4 py-2 text-white disabled:opacity-50" disabled={transitioning}>
            {transitioning ? 'Saving…' : 'Add'}
          </button>
        </form>
        <p className="mt-3 text-xs text-slate-500">Restricted grants must allocate only to selected programs.</p>
      </div>
    </div>
  );
}
