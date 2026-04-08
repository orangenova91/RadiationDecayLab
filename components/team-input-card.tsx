"use client";

import { CheckCircle2, FlaskConical } from "lucide-react";
import { isRoundSequenceValid } from "@/lib/experiment";
import { TeamRounds, ViewMode } from "@/types/experiment";

type TeamInputCardProps = {
  team: TeamRounds;
  roundCount: number;
  initialCoins: number;
  mode: ViewMode;
  isSubmitted: boolean;
  onChangeRound: (teamId: string, roundIndex: number, value: number) => void;
  onSubmit: (teamId: string) => void;
};

export function TeamInputCard({
  team,
  roundCount,
  initialCoins,
  mode,
  isSubmitted,
  onChangeRound,
  onSubmit,
}: TeamInputCardProps) {
  const removedRounds = Array.from({ length: roundCount }, (_, index) => team.rounds[index] ?? 0);
  const valid = isRoundSequenceValid(removedRounds, initialCoins);
  const remainingByRound = removedRounds.map((_, index) => {
    const removedUntilNow = removedRounds.slice(0, index + 1).reduce((acc, value) => acc + value, 0);
    return Math.max(0, initialCoins - removedUntilNow);
  });
  const isLocked = mode === "batched" && isSubmitted;

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-3 flex items-center justify-between">
        <div className="inline-flex items-center gap-2">
          <FlaskConical className="h-4 w-4 text-zinc-600" />
          <h3 className="font-semibold text-zinc-900">{team.teamId}</h3> <span className="text-sm text-zinc-500">실험대</span>
        </div>
        <p className="text-xs text-zinc-500">초기값: {initialCoins}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {removedRounds.map((value, index) => (
          <label key={`${team.teamId}-${index}`} className="flex flex-col gap-1 text-xs text-zinc-600">
            {index + 1}회차 (남은 {remainingByRound[index]})
            <input
              type="number"
              min={0}
              max={index === 0 ? initialCoins : remainingByRound[index - 1]}
              value={value}
              disabled={isLocked}
              onChange={(e) => onChangeRound(team.teamId, index, Number(e.target.value))}
              className="rounded-md border border-zinc-300 px-2 py-1 text-sm text-zinc-900 disabled:cursor-not-allowed disabled:bg-zinc-100"
            />
          </label>
        ))}
      </div>

      <div className="mt-3 flex items-center justify-between">
        {!valid ? (
          <p className="text-xs text-red-600">
            입력값은 0 이상이며 누적 제거 동전 수가 초기 동전 수를 넘을 수 없습니다.
          </p>
        ) : (
          <p className="text-xs text-zinc-500">회차별 빼낸 동전 수를 입력하세요.</p>
        )}

        {mode === "batched" && (
          <button
            type="button"
            onClick={() => onSubmit(team.teamId)}
            disabled={!valid}
            className="inline-flex items-center gap-1 rounded-md bg-zinc-900 px-3 py-1.5 text-xs font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-400"
          >
            <CheckCircle2 className="h-3.5 w-3.5" />
            {isSubmitted ? "제출됨 (수정)" : "팀 데이터 제출"}
          </button>
        )}
      </div>
    </article>
  );
}
