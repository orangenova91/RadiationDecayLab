"use client";

import { useMemo } from "react";
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

type AggregateChartProps = {
  data: RoundAggregatePoint[];
  initialCoins: number;
};

export function AggregateChart({ data, initialCoins }: AggregateChartProps) {
  const chartData = useMemo(() => {
    const n = data[0]?.teamCount ?? 0;
    const initial: RoundAggregatePoint = {
      round: 0,
      expected: initialCoins,
      average: initialCoins,
      teamCount: n,
      total: n * initialCoins,
      expectedTotal: n * initialCoins,
    };
    return [initial, ...data];
  }, [data, initialCoins]);

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <h2 className="mb-3 text-sm font-semibold text-zinc-800">라운드별 평균 vs 이론값</h2>
      <p className="mb-3 text-xs text-zinc-500">
        라운드별 남은 동전의 비율(실험값 vs 이론값)을 표시한 그래프입니다.
      </p>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="round" />
            <YAxis domain={[0, "auto"]} />
            <Tooltip
              labelFormatter={(label) =>
                Number(label) === 0 ? "0 (시작)" : `${label}회차`
              }
            />
            <Legend />
            <Line type="monotone" dataKey="expected" stroke="#2563eb" name="이론값" strokeWidth={2} dot={false} />
            <Line type="monotone" dataKey="average" stroke="#f97316" name="실험값" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
