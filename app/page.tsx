"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { ControlPanel } from "@/components/control-panel";
import { SummaryCards } from "@/components/summary-cards";
import { TeamInputCard } from "@/components/team-input-card";
import { DEFAULT_INITIAL_COINS, DEFAULT_ROUNDS, getAggregateByRound } from "@/lib/experiment";
import { TeamRounds, ViewMode } from "@/types/experiment";

const DEFAULT_TEAM_COUNT = 5;
const AggregateChart = dynamic(
  () => import("@/components/charts/aggregate-chart").then((mod) => mod.AggregateChart),
  { ssr: false },
);
const RoundTotalChart = dynamic(
  () => import("@/components/charts/round-total-chart").then((mod) => mod.RoundTotalChart),
  { ssr: false },
);

function createDefaultTeams(roundCount: number, teamCount: number): TeamRounds[] {
  return Array.from({ length: teamCount }, (_, idx) => ({
    teamId: `${idx + 1}조`,
    rounds: Array.from({ length: roundCount }, () => 0),
  }));
}

function clampRemovedRounds(rounds: number[], maxTotal: number): number[] {
  let remaining = maxTotal;
  return rounds.map((value) => {
    const safeValue = Math.max(0, Math.min(remaining, Number.isFinite(value) ? value : 0));
    remaining -= safeValue;
    return safeValue;
  });
}

export default function Home() {
  const [roundCount, setRoundCount] = useState(DEFAULT_ROUNDS);
  const [teamCount, setTeamCount] = useState(DEFAULT_TEAM_COUNT);
  const [initialCoins, setInitialCoins] = useState(DEFAULT_INITIAL_COINS);
  const [mode, setMode] = useState<ViewMode>("realtime");
  const [teams, setTeams] = useState<TeamRounds[]>(() => createDefaultTeams(DEFAULT_ROUNDS, DEFAULT_TEAM_COUNT));
  const [submittedTeamIds, setSubmittedTeamIds] = useState<string[]>([]);

  const activeTeams = useMemo(() => {
    if (mode === "realtime") {
      return teams;
    }
    return teams.filter((team) => submittedTeamIds.includes(team.teamId));
  }, [mode, submittedTeamIds, teams]);

  const aggregateData = useMemo(
    () => getAggregateByRound(activeTeams, roundCount, initialCoins),
    [activeTeams, roundCount, initialCoins],
  );

  const handleChangeRound = (teamId: string, roundIndex: number, value: number) => {
    setTeams((prev) =>
      prev.map((team) => {
        if (team.teamId !== teamId) {
          return team;
        }
        const rounds = [...team.rounds];
        rounds[roundIndex] = Number.isFinite(value) ? value : 0;
        return { ...team, rounds };
      }),
    );
  };

  const handleRoundCountChange = (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(12, Number.isFinite(nextCount) ? nextCount : DEFAULT_ROUNDS));
    setRoundCount(safeCount);
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        rounds: Array.from({ length: safeCount }, (_, index) => team.rounds[index] ?? 0),
      })),
    );
  };

  const handleSubmitTeam = (teamId: string) => {
    setSubmittedTeamIds((prev) =>
      prev.includes(teamId) ? prev.filter((id) => id !== teamId) : [...prev, teamId],
    );
  };

  const handleInitialCoinsChange = (nextCoins: number) => {
    const safeCoins = Math.max(10, Math.min(500, Number.isFinite(nextCoins) ? nextCoins : DEFAULT_INITIAL_COINS));
    setInitialCoins(safeCoins);
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        rounds: clampRemovedRounds(team.rounds, safeCoins),
      })),
    );
  };

  const handleTeamCountChange = (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(30, Number.isFinite(nextCount) ? nextCount : DEFAULT_TEAM_COUNT));
    setTeamCount(safeCount);

    setTeams((prev) => {
      if (safeCount <= prev.length) {
        return prev.slice(0, safeCount);
      }
      const additional = Array.from({ length: safeCount - prev.length }, (_, index) => ({
        teamId: `${prev.length + index + 1}조`,
        rounds: Array.from({ length: roundCount }, () => 0),
      }));
      return [...prev, ...additional];
    });

    setSubmittedTeamIds((prev) => prev.filter((teamId) => Number(teamId.replace("조", "")) <= safeCount));
  };

  const handleReset = () => {
    setRoundCount(DEFAULT_ROUNDS);
    setTeamCount(DEFAULT_TEAM_COUNT);
    setInitialCoins(DEFAULT_INITIAL_COINS);
    setTeams(createDefaultTeams(DEFAULT_ROUNDS, DEFAULT_TEAM_COUNT));
    setSubmittedTeamIds([]);
    setMode("realtime");
  };

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-8">
      <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <h1 className="text-xl font-bold text-zinc-900">방사성 반감기 실험 통합 대시보드</h1>
        <p className="mt-1 text-sm text-zinc-600">
          각 조는 초기 동전 수에서 시작해 회차별 빼낸 동전 수를 입력합니다. 전체 평균이 이론값에 수렴하는 과정을
          확인하세요.
        </p>
      </header>

      <ControlPanel
        mode={mode}
        roundCount={roundCount}
        teamCount={teamCount}
        initialCoins={initialCoins}
        onModeChange={setMode}
        onRoundCountChange={handleRoundCountChange}
        onTeamCountChange={handleTeamCountChange}
        onInitialCoinsChange={handleInitialCoinsChange}
        onReset={handleReset}
      />

      <SummaryCards teamCount={activeTeams.length} roundCount={roundCount} sampleCount={activeTeams.length * roundCount} />

      {mode === "batched" && activeTeams.length === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          합산 모드입니다. 각 조 카드에서 `팀 데이터 제출`을 눌러야 통합 차트에 반영됩니다.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <RoundTotalChart data={aggregateData} initialCoins={initialCoins} />
        <AggregateChart data={aggregateData} initialCoins={initialCoins} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <TeamInputCard
            key={team.teamId}
            team={team}
            roundCount={roundCount}
            initialCoins={initialCoins}
            mode={mode}
            isSubmitted={submittedTeamIds.includes(team.teamId)}
            onChangeRound={handleChangeRound}
            onSubmit={handleSubmitTeam}
          />
        ))}
      </section>
    </main>
  );
}
