"use client";

import { RotateCcw } from "lucide-react";
import { ViewMode } from "@/types/experiment";

type ControlPanelProps = {
  mode: ViewMode;
  roundCount: number;
  teamCount: number;
  initialCoins: number;
  onModeChange: (mode: ViewMode) => void;
  onRoundCountChange: (count: number) => void;
  onTeamCountChange: (count: number) => void;
  onInitialCoinsChange: (coins: number) => void;
  onReset: () => void;
};

export function ControlPanel({
  mode,
  roundCount,
  teamCount,
  initialCoins,
  onModeChange,
  onRoundCountChange,
  onTeamCountChange,
  onInitialCoinsChange,
  onReset,
}: ControlPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="grid gap-4 sm:grid-cols-4">
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">보기 모드</span>
            <select
              value={mode}
              onChange={(e) => onModeChange(e.target.value as ViewMode)}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            >
              <option value="realtime">실시간 반영</option>
              <option value="batched">합산 반영</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">라운드 수</span>
            <input
              type="number"
              min={1}
              max={12}
              value={roundCount}
              onChange={(e) => onRoundCountChange(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">조 수</span>
            <input
              type="number"
              min={1}
              max={30}
              value={teamCount}
              onChange={(e) => onTeamCountChange(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-sm font-medium text-zinc-700">초기 동전 수</span>
            <input
              type="number"
              min={10}
              max={500}
              value={initialCoins}
              onChange={(e) => onInitialCoinsChange(Number(e.target.value))}
              className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          onClick={onReset}
          className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          <RotateCcw className="h-4 w-4" />
          전체 초기화
        </button>
      </div>
    </section>
  );
}
