'use client';

import { ArrowDownRight, ArrowUpRight } from 'lucide-react';

export type ScenarioMetric = {
  program: string;
  liveCoverage: number;
  scenarioCoverage: number;
  liveGap: number;
  scenarioGap: number;
};

type ScenarioDiffProps = {
  metrics: ScenarioMetric[];
};

export function ScenarioDiff({ metrics }: ScenarioDiffProps) {
  return (
    <div className="rounded-lg border bg-white p-4 shadow-sm">
      <h3 className="text-lg font-semibold">Scenario Comparison</h3>
      <div className="mt-4 grid gap-4">
        {metrics.map((metric) => {
          const coverageDelta = metric.scenarioCoverage - metric.liveCoverage;
          const gapDelta = metric.scenarioGap - metric.liveGap;
          const CoverageIcon = coverageDelta >= 0 ? ArrowUpRight : ArrowDownRight;
          const GapIcon = gapDelta <= 0 ? ArrowDownRight : ArrowUpRight;
          return (
            <div key={metric.program} className="rounded border p-3">
              <div className="font-medium">{metric.program}</div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Coverage %</span>
                <span className="flex items-center gap-1">
                  <CoverageIcon className="h-4 w-4" />
                  {(coverageDelta * 100).toFixed(1)}%
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-sm">
                <span>Gap</span>
                <span className="flex items-center gap-1">
                  <GapIcon className="h-4 w-4" />
                  ${Math.abs(gapDelta).toLocaleString()}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
