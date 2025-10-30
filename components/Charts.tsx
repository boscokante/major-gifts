'use client';

import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';

type CoverageData = {
  program: string;
  budget: number;
  committed_funding: number;
  gap_to_budget: number;
  coverage_pct: number;
};

type CoverageChartsProps = {
  data: CoverageData[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 0,
});

const percentFormatter = new Intl.NumberFormat('en-US', {
  style: 'percent',
  maximumFractionDigits: 0,
});

export function CoverageCharts({ data }: CoverageChartsProps) {
  return (
    <div className="grid gap-6 md:grid-cols-2">
      <div className="h-96 rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Budget vs. Committed vs. Gap</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program" />
            <YAxis tickFormatter={(value) => currencyFormatter.format(value as number)} />
            <Tooltip formatter={(value: number) => currencyFormatter.format(value)} />
            <Legend />
            <Bar dataKey="budget" stackId="a" fill="#2563eb" name="Budget" />
            <Bar dataKey="committed_funding" stackId="a" fill="#16a34a" name="Committed" />
            <Bar dataKey="gap_to_budget" stackId="a" fill="#dc2626" name="Gap" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <div className="h-96 rounded-lg border bg-white p-4 shadow-sm">
        <h3 className="text-lg font-semibold">Coverage %</h3>
        <ResponsiveContainer width="100%" height="90%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="program" />
            <YAxis tickFormatter={(value) => percentFormatter.format(value as number)} domain={[0, 1.2]} />
            <Tooltip formatter={(value: number) => percentFormatter.format(value)} />
            <Legend />
            <Bar dataKey="coverage_pct" fill="#7c3aed" name="Coverage %" />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
