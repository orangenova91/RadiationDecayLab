"use client";

import { useId, useState } from "react";
import { CheckCircle2, CircleDollarSign, FlaskConical } from "lucide-react";
import { isRoundSequenceValid } from "@/lib/experiment";
import { TeamRounds, ViewMode } from "@/types/experiment";

const GROUP_NAME_MAX = 40;

type TeamInputCardProps = {
  team: TeamRounds;
  roundCount: number;
  initialCoins: number;
  mode: ViewMode;
  isSubmitted: boolean;
  onChangeRound: (teamId: string, roundIndex: number, value: number) => void;
  onSubmit: (teamId: string) => void;
  onCommitGroupName: (teamId: string, groupName: string) => void | Promise<void>;
};

export function TeamInputCard({
  team,
  roundCount,
  initialCoins,
  mode,
  isSubmitted,
  onChangeRound,
  onSubmit,
  onCommitGroupName,
}: TeamInputCardProps) {
  const groupNameFieldId = useId();
  const serverName = team.groupName ?? "";
  const [draftGroupName, setDraftGroupName] = useState(serverName);

  const removedRounds = Array.from({ length: roundCount }, (_, index) => team.rounds[index] ?? 0);
  const valid = isRoundSequenceValid(removedRounds, initialCoins);
  const remainingByRound = removedRounds.map((_, index) => {
    const removedUntilNow = removedRounds.slice(0, index + 1).reduce((acc, value) => acc + value, 0);
    return Math.max(0, initialCoins - removedUntilNow);
  });
  const isLocked = mode === "batched" && isSubmitted;

  const flushGroupName = () => {
    const next = draftGroupName.slice(0, GROUP_NAME_MAX).trim();
    const prev = serverName.trim();
    if (next === prev) {
      return;
    }
    void onCommitGroupName(team.teamId, next);
  };

  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
      <div className="mb-2 flex flex-wrap items-start justify-between gap-x-3 gap-y-2">
        <div className="flex min-w-0 flex-1 flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <div className="inline-flex shrink-0 items-center gap-2">
            <FlaskConical className="h-4 w-4 text-zinc-600" aria-hidden />
            <h3 className="font-semibold text-zinc-900">{team.teamId}</h3>
            <span className="text-sm text-zinc-500">실험대</span>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5 sm:max-w-[min(100%,18rem)]">
            
            <input
              id={groupNameFieldId}
              type="text"
              name={`groupName-${team.teamId}`}
              value={draftGroupName}
              maxLength={GROUP_NAME_MAX}
              onChange={(e) => setDraftGroupName(e.target.value.slice(0, GROUP_NAME_MAX))}
              onBlur={flushGroupName}
              placeholder="예: 3반 A팀"
              className="w-[150px] rounded-md border border-zinc-300 px-2.5 py-1.5 text-sm text-zinc-900 placeholder:text-zinc-400 focus:border-zinc-500 focus:outline-none focus:ring-2 focus:ring-zinc-400/40"
            />
            
          </div>
        </div>
        <p className="shrink-0 text-xs text-zinc-500">초기값: {initialCoins}</p>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        {removedRounds.map((value, index) => (
          <label key={`${team.teamId}-${index}`} className="flex flex-col gap-1 text-xs text-zinc-600">
            <span className="inline-flex flex-wrap items-center gap-x-1 gap-y-0.5">
              <span>{index + 1}회차 (</span>
              <span
                className="inline-flex items-center gap-0.5"
                title={`남은 동전 ${remainingByRound[index]}`}
              >
                <CircleDollarSign className="h-3.5 w-3.5 shrink-0 text-amber-600" aria-hidden />
                <span className="sr-only">남은 동전 </span>
                {remainingByRound[index]}
              </span>
              <span>)</span>
            </span>
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
