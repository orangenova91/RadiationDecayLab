"use client";

import Link from "next/link";
import { useState } from "react";
import type { LucideIcon } from "lucide-react";
import { ChevronUp, Coins, Dice1, Dice2, Dice3, Dice4, Dice5, RotateCcw } from "lucide-react";
import { clampDecayProbability } from "@/lib/experiment";
import { ViewMode } from "@/types/experiment";

type ControlPanelProps = {
  roomCode: string;
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

const DECAY_PRESETS: readonly { label: string; value: number; icon: LucideIcon }[] = [
  { label: "동전 (붕괴 확률 50%)", value: 0.5, icon: Coins },
  { label: "6면체·스티커 1면 (p = 1/6)", value: 1 / 6, icon: Dice1 },
  { label: "6면체·스티커 2면 (p = 2/6)", value: 2 / 6, icon: Dice2 },
  { label: "6면체·스티커 3면 (p = 3/6)", value: 3 / 6, icon: Dice3 },
  { label: "6면체·스티커 4면 (p = 4/6)", value: 4 / 6, icon: Dice4 },
  { label: "6면체·스티커 5면 (p = 5/6)", value: 5 / 6, icon: Dice5 },
];

function decayPresetMatches(current: number, presetValue: number) {
  return Math.abs(current - presetValue) < 0.002;
}

export function ControlPanel({
  roomCode,
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
  const [advancedOpen, setAdvancedOpen] = useState(false);

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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
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
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-sm font-medium text-zinc-700">초기 동전(주사위) 수</span>
              <input
                type="number"
                min={10}
                max={500}
                value={initialCoins}
                onChange={(e) => onInitialCoinsChange(Number(e.target.value))}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
              />
            </label>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            <Link
              href={`/coin-shop?room=${encodeURIComponent(roomCode)}`}
              className="inline-flex items-center justify-center rounded-lg border border-amber-600/70 bg-gradient-to-b from-amber-200 via-amber-300 to-amber-400 px-4 py-2 text-sm font-semibold text-amber-950 shadow-sm hover:from-amber-300 hover:via-amber-400 hover:to-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-2"
            >
              동전 사러가기
            </Link>
            <button
              type="button"
              onClick={onReset}
              className="inline-flex items-center justify-center gap-2 rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
            >
              <RotateCcw className="h-4 w-4" />
              전체 초기화
            </button>
          </div>
        </div>

        <div className="border-t border-zinc-100 pt-4">
          <div className="flex flex-row flex-wrap items-start gap-3 md:gap-4">
            <button
              type="button"
              id="control-panel-advanced-toggle"
              aria-expanded={advancedOpen}
              aria-controls="control-panel-advanced"
              onClick={() => setAdvancedOpen((open) => !open)}
              className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2"
            >
              고급 설정
              <ChevronUp
                className={`size-4 shrink-0 transition-transform duration-200 ${advancedOpen ? "rotate-180" : ""}`}
                aria-hidden
              />
            </button>

            {advancedOpen ? (
              <div
                id="control-panel-advanced"
                role="region"
                aria-labelledby="control-panel-advanced-toggle"
                className="flex min-w-0 flex-1 flex-col gap-2 md:border-l md:border-zinc-200 md:pl-4"
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-end">
                  <div className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-700">빠른 설정</span>
                    <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="붕괴 확률 빠른 설정">
                      {DECAY_PRESETS.map((preset) => {
                        const Icon = preset.icon;
                        const active = decayPresetMatches(decayProbability, preset.value);
                        return (
                          <button
                            key={preset.label}
                            type="button"
                            title={preset.label}
                            aria-label={preset.label}
                            aria-pressed={active}
                            onClick={() => onDecayProbabilityChange(preset.value)}
                            className={`inline-flex size-9 shrink-0 items-center justify-center rounded-md border text-zinc-900 transition-colors hover:bg-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 focus-visible:ring-offset-2 ${
                              active ? "border-zinc-800 bg-zinc-100" : "border-zinc-300 bg-white"
                            }`}
                          >
                            <Icon className="size-5" aria-hidden />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <label className="flex flex-col gap-1">
                    <span className="text-sm font-medium text-zinc-700">붕괴 확률 p (라운드당)</span>
                    <input
                      type="number"
                      min={0.01}
                      max={0.99}
                      step={0.001}
                      value={decayProbability}
                      onChange={(e) => onDecayProbabilityChange(clampDecayProbability(Number(e.target.value)))}
                      className="box-border w-[160px] max-w-[160px] rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-900"
                    />
                  </label>
                </div>
                <p className="text-xs text-zinc-500">
                  한 라운드에서 남아 있는 개체 하나가 붕괴(제거)할 확률입니다. 동전은 50%, 주사위 한 면에 스티커가 있으면 6면체 기준 약 1/6입니다. 이론곡선은 팀당 남은 개수 ≈ 초기값 × (1−p)
                  <sup>n</sup> (n은 회차)로 계산합니다.
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
