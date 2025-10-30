'use client';

import { useMemo } from 'react';
import { AgGridReact } from 'ag-grid-react';
import { ColDef } from 'ag-grid-community';
import 'ag-grid-community/styles/ag-grid.css';
import 'ag-grid-community/styles/ag-theme-quartz.css';

export type GridProps<T> = {
  rowData: T[];
  columnDefs: ColDef<T>[];
  onCellValueChanged?: (params: any) => void;
  height?: number;
};

export function DataGrid<T>({ rowData, columnDefs, onCellValueChanged, height = 520 }: GridProps<T>) {
  const gridStyle = useMemo(() => ({ width: '100%', height }), [height]);
  return (
    <div className="ag-theme-quartz" style={gridStyle}>
      <AgGridReact
        rowData={rowData}
        columnDefs={columnDefs}
        editType="fullRow"
        stopEditingWhenCellsLoseFocus
        animateRows
        undoRedoCellEditing
        onCellValueChanged={onCellValueChanged}
      />
    </div>
  );
}
