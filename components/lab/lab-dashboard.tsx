"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
} from "firebase/firestore";
import { FlaskConical } from "lucide-react";
import { ControlPanel } from "@/components/control-panel";
import { SummaryCards } from "@/components/summary-cards";
import { TeamInputCard } from "@/components/team-input-card";
import { db } from "@/lib/firebase";
import {
  clampDecayProbability,
  DEFAULT_DECAY_PROBABILITY,
  DEFAULT_INITIAL_COINS,
  DEFAULT_ROUNDS,
  getAggregateByRound,
} from "@/lib/experiment";
import {
  DEFAULT_TEAM_COUNT,
  LabMeta,
  LabSettings,
  defaultSettings,
  defaultTeams,
  syncTeamsCount,
  updateLabSettings,
} from "@/lib/lab-store";
import { TeamRounds } from "@/types/experiment";

const AggregateChart = dynamic(
  () => import("@/components/charts/aggregate-chart").then((mod) => mod.AggregateChart),
  { ssr: false },
);
const RoundTotalChart = dynamic(
  () => import("@/components/charts/round-total-chart").then((mod) => mod.RoundTotalChart),
  { ssr: false },
);

type TeamDoc = TeamRounds & { submitted?: boolean };

type LabDashboardProps = {
  roomCode: string;
};

export function LabDashboard({ roomCode }: LabDashboardProps) {
  const router = useRouter();
  const [settings, setSettings] = useState<LabSettings>(defaultSettings());
  const [teams, setTeams] = useState<TeamDoc[]>([]);
  const [labMeta, setLabMeta] = useState<LabMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [showLeaveModal, setShowLeaveModal] = useState(false);

  useEffect(() => {
    const roomRef = doc(db, "labs", roomCode);
    const teamsRef = query(collection(db, "labs", roomCode, "teams"), orderBy("teamId"));

    const unsubRoom = onSnapshot(roomRef, (snap) => {
      const data = snap.data();
      if (!data) {
        return;
      }
      if (data.settings) {
        setSettings({ ...defaultSettings(), ...(data.settings as Partial<LabSettings>) });
      }
      const m = data.meta as Partial<LabMeta> | undefined;
      if (
        m &&
        typeof m.region === "string" &&
        typeof m.schoolName === "string" &&
        typeof m.grade === "string" &&
        typeof m.classSection === "string"
      ) {
        setLabMeta({
          region: m.region,
          schoolName: m.schoolName,
          grade: m.grade,
          classSection: m.classSection,
        });
      } else {
        setLabMeta(null);
      }
    });

    const unsubTeams = onSnapshot(teamsRef, (snap) => {
      const next = snap.docs
        .map((row) => row.data() as TeamDoc)
        .sort((a, b) => extractTeamNumber(a.teamId) - extractTeamNumber(b.teamId));
      setTeams(next);
      setLoading(false);
    });

    return () => {
      unsubRoom();
      unsubTeams();
    };
  }, [roomCode]);

  const roundCount = settings.roundCount ?? DEFAULT_ROUNDS;
  const teamCount = settings.teamCount ?? DEFAULT_TEAM_COUNT;
  const initialCoins = settings.initialCoins ?? DEFAULT_INITIAL_COINS;
  const decayProbability = settings.decayProbability ?? DEFAULT_DECAY_PROBABILITY;
  const mode = settings.mode ?? "batched";

  const activeTeams = useMemo(() => {
    if (mode === "realtime") {
      return teams;
    }
    return teams.filter((team) => team.submitted);
  }, [mode, teams]);

  const aggregateData = useMemo(
    () => getAggregateByRound(activeTeams, roundCount, initialCoins, decayProbability),
    [activeTeams, roundCount, initialCoins, decayProbability],
  );

  const handleChangeRound = async (teamId: string, roundIndex: number, value: number) => {
    const team = teams.find((item) => item.teamId === teamId);
    if (!team) {
      return;
    }
    const nextRounds = [...team.rounds];
    nextRounds[roundIndex] = Number.isFinite(value) ? value : 0;
    await updateDoc(doc(db, "labs", roomCode, "teams", teamId), {
      rounds: nextRounds,
      updatedAt: serverTimestamp(),
    });
  };

  const handleRoundCountChange = async (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(12, Number.isFinite(nextCount) ? nextCount : DEFAULT_ROUNDS));
    const nextSettings = { ...settings, roundCount: safeCount };
    setSettings(nextSettings);
    await updateLabSettings(roomCode, nextSettings);

    await Promise.all(
      teams.map((team) => {
        const rounds = Array.from({ length: safeCount }, (_, index) => team.rounds[index] ?? 0);
        return updateDoc(doc(db, "labs", roomCode, "teams", team.teamId), {
          rounds,
          updatedAt: serverTimestamp(),
        });
      }),
    );
  };

  const handleSubmitTeam = async (teamId: string) => {
    const team = teams.find((item) => item.teamId === teamId);
    if (!team) {
      return;
    }
    await updateDoc(doc(db, "labs", roomCode, "teams", teamId), {
      submitted: !team.submitted,
      updatedAt: serverTimestamp(),
    });
  };

  const handleCommitGroupName = async (teamId: string, groupName: string) => {
    const safe = groupName.slice(0, 40);
    await updateDoc(doc(db, "labs", roomCode, "teams", teamId), {
      groupName: safe,
      updatedAt: serverTimestamp(),
    });
  };

  const handleInitialCoinsChange = async (nextCoins: number) => {
    const safeCoins = Math.max(10, Math.min(500, Number.isFinite(nextCoins) ? nextCoins : DEFAULT_INITIAL_COINS));
    const nextSettings = { ...settings, initialCoins: safeCoins };
    setSettings(nextSettings);
    await updateLabSettings(roomCode, nextSettings);

    await Promise.all(
      teams.map((team) => {
        const rounds = clampRemovedRounds(team.rounds, safeCoins);
        return updateDoc(doc(db, "labs", roomCode, "teams", team.teamId), {
          rounds,
          updatedAt: serverTimestamp(),
        });
      }),
    );
  };

  const handleTeamCountChange = async (nextCount: number) => {
    const safeCount = Math.max(1, Math.min(30, Number.isFinite(nextCount) ? nextCount : DEFAULT_TEAM_COUNT));
    const nextSettings = { ...settings, teamCount: safeCount };
    const prevSettings = settings;
    setSettings(nextSettings);
    try {
      await updateLabSettings(roomCode, nextSettings);
      await syncTeamsCount(roomCode, roundCount, safeCount);
    } catch (err) {
      console.error("[handleTeamCountChange]", err);
      setSettings(prevSettings);
      window.alert(
        "조 수를 바꾸는 데 실패했습니다. Firestore 보안 규칙(teams 삭제 허용 등)을 확인하거나 잠시 후 다시 시도해 주세요.",
      );
    }
  };

  const handleModeChange = async (nextMode: LabSettings["mode"]) => {
    const nextSettings = { ...settings, mode: nextMode };
    setSettings(nextSettings);
    await updateLabSettings(roomCode, nextSettings);
  };

  const handleDecayProbabilityChange = async (nextP: number) => {
    const safeP = clampDecayProbability(nextP);
    const nextSettings = { ...settings, decayProbability: safeP };
    setSettings(nextSettings);
    await updateLabSettings(roomCode, nextSettings);
  };

  const handleReset = async () => {
    const fresh = defaultSettings();
    setSettings(fresh);
    await updateLabSettings(roomCode, fresh);
    await syncTeamsCount(roomCode, fresh.roundCount, fresh.teamCount);

    const resetTeams = defaultTeams(fresh.roundCount, fresh.teamCount);
    await Promise.all(
      resetTeams.map((team) =>
        updateDoc(doc(db, "labs", roomCode, "teams", team.teamId), {
          rounds: team.rounds,
          submitted: false,
          groupName: "",
          updatedAt: serverTimestamp(),
        }),
      ),
    );
  };

  if (loading) {
    return <main className="mx-auto w-full max-w-4xl p-8 text-sm text-zinc-600">실험실 데이터를 불러오는 중...</main>;
  }

  return (
    <main className="mx-auto flex w-full max-w-7xl flex-col gap-4 p-4 md:p-8">
      <header className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <FlaskConical className="h-6 w-6 shrink-0 text-zinc-700" aria-hidden />
              <h1 className="text-xl font-bold text-zinc-900">방사성 반감기 실험실</h1>
            </div>
            <p className="mt-1 text-sm text-zinc-600">
              실험실 코드: <span className="font-semibold">{roomCode}</span>
            </p>
            {labMeta ? (
              <p className="mt-1 text-sm text-zinc-600">
                {labMeta.region} · {labMeta.schoolName} · {labMeta.grade} · {labMeta.classSection}
              </p>
            ) : null}
          </div>
          <button
            type="button"
            onClick={() => setShowLeaveModal(true)}
            className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-900 hover:bg-zinc-50"
          >
            실험실 나가기
          </button>
        </div>
      </header>

      <ControlPanel
        roomCode={roomCode}
        mode={mode}
        roundCount={roundCount}
        teamCount={teamCount}
        initialCoins={initialCoins}
        decayProbability={decayProbability}
        onModeChange={handleModeChange}
        onRoundCountChange={handleRoundCountChange}
        onTeamCountChange={handleTeamCountChange}
        onInitialCoinsChange={handleInitialCoinsChange}
        onDecayProbabilityChange={handleDecayProbabilityChange}
        onReset={handleReset}
      />

      <SummaryCards teamCount={activeTeams.length} roundCount={roundCount} sampleCount={activeTeams.length * roundCount} />

      {mode === "batched" && activeTeams.length === 0 ? (
        <section className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
          합산 모드입니다. 각 조 카드에서 `팀 데이터 제출`을 눌러야 통합 차트에 반영됩니다.
        </section>
      ) : null}

      <section className="grid gap-4 lg:grid-cols-2">
        <RoundTotalChart data={aggregateData} initialCoins={initialCoins} decayProbability={decayProbability} />
        <AggregateChart data={aggregateData} initialCoins={initialCoins} decayProbability={decayProbability} />
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {teams.map((team) => (
          <TeamInputCard
            key={`${team.teamId}-${team.groupName ?? ""}`}
            team={team}
            roundCount={roundCount}
            initialCoins={initialCoins}
            mode={mode}
            isSubmitted={Boolean(team.submitted)}
            onChangeRound={handleChangeRound}
            onSubmit={handleSubmitTeam}
            onCommitGroupName={handleCommitGroupName}
          />
        ))}
      </section>

      {showLeaveModal ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="w-full max-w-sm rounded-xl bg-white p-5 shadow-lg">
            <h2 className="text-base font-semibold text-zinc-900">실험실을 나가시겠습니까?</h2>
            <p className="mt-2 text-sm text-zinc-600">현재 실험실 화면을 나가면 로비 화면으로 이동합니다.</p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowLeaveModal(false)}
                className="rounded-lg border border-zinc-300 px-4 py-2 text-sm text-zinc-900 hover:bg-zinc-50"
              >
                취소
              </button>
              <button
                type="button"
                onClick={() => router.push("/")}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-medium text-white"
              >
                나가기
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </main>
  );
}

function clampRemovedRounds(rounds: number[], maxTotal: number): number[] {
  let remaining = maxTotal;
  return rounds.map((value) => {
    const safeValue = Math.max(0, Math.min(remaining, Number.isFinite(value) ? value : 0));
    remaining -= safeValue;
    return safeValue;
  });
}

function extractTeamNumber(teamId: string) {
  const n = Number(teamId.replace("조", ""));
  return Number.isFinite(n) ? n : 0;
}
