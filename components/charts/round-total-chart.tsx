"use client";

import { useMemo, useState } from "react";
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { RoundAggregatePoint } from "@/types/experiment";

type RoundTotalChartProps = {
  data: RoundAggregatePoint[];
  initialCoins: number;
};

export function RoundTotalChart({ data, initialCoins }: RoundTotalChartProps) {
  const [showExpectedTotal, setShowExpectedTotal] = useState(false);
  const [showExpectedRemovedTotal, setShowExpectedRemovedTotal] = useState(false);
  const chartData = useMemo(() => {
    const activeTeamCount = data[0]?.teamCount ?? 0;
    const initialTotal = activeTeamCount * initialCoins;

    return [
      {
        round: 0,
        expectedTotal: initialTotal,
        total: initialTotal,
        removedTotal: 0,
        expectedRemovedTotal: 0,
      },
      ...data.map((point) => ({
        ...point,
        removedTotal: initialTotal - point.total,
        expectedRemovedTotal: initialTotal - point.expectedTotal,
      })),
    ];
  }, [data, initialCoins]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-sm font-semibold text-zinc-800">라운드별 남은 동전 총합</h2>
        <div className="flex flex-wrap items-center gap-4">
          <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={showExpectedTotal}
              onChange={(e) => setShowExpectedTotal(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            남은 동전 예상값(파란선) 표시
          </label>
          <label className="inline-flex items-center gap-2 text-xs text-zinc-700">
            <input
              type="checkbox"
              checked={showExpectedRemovedTotal}
              onChange={(e) => setShowExpectedRemovedTotal(e.target.checked)}
              className="h-4 w-4 rounded border-zinc-300"
            />
            빼낸 동전 예상값(보라선) 표시
          </label>
        </div>
      </div>
      <p className="mb-3 text-xs text-zinc-500">
        각 회차에서 모든 조 상자에 남아 있는 동전 개수 총합입니다.
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis domain={[0, "auto"]} />
            <Tooltip
              formatter={(value) =>
                typeof value === "number" ? [Math.round(value * 100) / 100, ""] : [value, ""]
              }
              labelFormatter={(label) => `${label}회차`}
            />
            <Legend />
            {showExpectedTotal ? (
              <Line
                type="monotone"
                dataKey="expectedTotal"
                stroke="#2563eb"
                name="남은 동전(예상값)"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
            <Line 
              type="monotone" 
              dataKey="total" 
              stroke="#f97316" 
              name="남은 동전 총합" 
              strokeWidth={2} 
            />
            <Line
              type="monotone"
              dataKey="removedTotal"
              stroke="#16a34a"
              name="빼낸 동전 총합"
              strokeWidth={2}
            />
            {showExpectedRemovedTotal ? (
              <Line
                type="monotone"
                dataKey="expectedRemovedTotal"
                stroke="#7c3aed"
                name="빼낸 동전(예상값)"
                strokeWidth={2}
                dot={false}
              />
            ) : null}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
