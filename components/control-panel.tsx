"use client";

import { RotateCcw } from "lucide-react";
import { clampDecayProbability } from "@/lib/experiment";
import { ViewMode } from "@/types/experiment";

type ControlPanelProps = {
  mode: ViewMode;
  roundCount: number;
  teamCount: number;
  initialCoins: number;
  decayProbability: number;
  onModeChange: (mode: ViewMode) => void;
  onRoundCountChange: (count: number) => void;
  onTeamCountChange: (count: number) => void;
  onInitialCoinsChange: (coins: number) => void;
  onDecayProbabilityChange: (p: number) => void;
  onReset: () => void;
};

const D6_PRESETS = [
  { label: "6면·1면", value: 1 / 6 },
  { label: "6면·2면", value: 2 / 6 },
  { label: "6면·3면", value: 3 / 6 },
  { label: "6면·4면", value: 4 / 6 },
  { label: "6면·5면", value: 5 / 6 },
] as const;

export function ControlPanel({
  mode,
  roundCount,
  teamCount,
  initialCoins,
  decayProbability,
  onModeChange,
  onRoundCountChange,
  onTeamCountChange,
  onInitialCoinsChange,
  onDecayProbabilityChange,
  onReset,
}: ControlPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">보기 모드</span>
              <select
                value={mode}
                onChange={(e) => onModeChange(e.target.value as ViewMode)}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
          </div>
          <button
            type="button"
            onClick={onReset}
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            <RotateCcw className="h-4 w-4" />
            전체 초기화
          </button>
        </div>

        <div className="flex flex-col gap-2 border-t border-zinc-100 pt-4">
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
            <label className="flex min-w-[12rem] flex-1 flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">붕괴 확률 p (라운드당)</span>
              <input
                type="number"
                min={0.01}
                max={0.99}
                step={0.001}
                value={decayProbability}
                onChange={(e) => onDecayProbabilityChange(clampDecayProbability(Number(e.target.value)))}
                className="rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
            <div className="flex flex-col gap-1">
              <span className="text-xs font-medium text-zinc-600">빠른 설정</span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => onDecayProbabilityChange(0.5)}
                  className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                >
                  동전 ½
                </button>
                {D6_PRESETS.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => onDecayProbabilityChange(preset.value)}
                    className="rounded-md border border-zinc-300 bg-white px-2.5 py-1 text-xs font-medium text-zinc-900 hover:bg-zinc-50"
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <p className="text-xs text-zinc-500">
            한 라운드에서 남아 있는 개체 하나가 붕괴(제거)할 확률입니다. 동전은 50%, 주사위 한 면에 스티커가 있으면 6면체 기준 약 1/6입니다. 이론곡선은 팀당 남은 개수 ≈ 초기값 × (1−p)
            <sup>n</sup> (n은 회차)로 계산합니다.
          </p>
        </div>
      </div>
    </section>
  );
}
