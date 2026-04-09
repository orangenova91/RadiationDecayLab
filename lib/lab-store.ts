import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { recordLabEngagement } from "@/lib/engagement-stats";
import { DEFAULT_DECAY_PROBABILITY, DEFAULT_INITIAL_COINS, DEFAULT_ROUNDS } from "@/lib/experiment";
import { TeamRounds, ViewMode } from "@/types/experiment";

export const DEFAULT_TEAM_COUNT = 5;

export type LabSettings = {
  roundCount: number;
  teamCount: number;
  initialCoins: number;
  /** 한 라운드당 붕괴 확률 p (0.01~0.99) */
  decayProbability: number;
  mode: ViewMode;
};

export function defaultTeams(roundCount: number, teamCount: number): TeamRounds[] {
  return Array.from({ length: teamCount }, (_, idx) => ({
    teamId: `${idx + 1}조`,
    rounds: Array.from({ length: roundCount }, () => 0),
  }));
}

export function defaultSettings(): LabSettings {
  return {
    roundCount: DEFAULT_ROUNDS,
    teamCount: DEFAULT_TEAM_COUNT,
    initialCoins: DEFAULT_INITIAL_COINS,
    decayProbability: DEFAULT_DECAY_PROBABILITY,
    mode: "batched",
  };
}

/** 실험실 생성 시 입력하는 학급·학교 정보 (Firestore `labs/{code}.meta`) */
export type LabMeta = {
  region: string;
  schoolName: string;
  /** 참여 학년 (자유 입력, 예: 2학년) */
  grade: string;
  /** 학반 (자유 입력, 예: 3반) */
  classSection: string;
};

export async function createLabRoom(meta: LabMeta) {
  const settings = defaultSettings();
  const roomCode = await generateUniqueRoomCode();
  const roomRef = doc(db, "labs", roomCode);

  await setDoc(roomRef, {
    roomCode,
    settings,
    meta: {
      region: meta.region.trim(),
      schoolName: meta.schoolName.trim(),
      grade: meta.grade.trim(),
      classSection: meta.classSection.trim(),
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  const teamsRef = collection(db, "labs", roomCode, "teams");
  const teams = defaultTeams(settings.roundCount, settings.teamCount);
  await Promise.all(
    teams.map((team) =>
      setDoc(doc(teamsRef, team.teamId), {
        teamId: team.teamId,
        rounds: team.rounds,
        submitted: false,
        groupName: "",
        updatedAt: serverTimestamp(),
      }),
    ),
  );

  try {
    await recordLabEngagement(meta);
  } catch (err) {
    console.error("[createLabRoom] engagement stats failed (lab was created)", err);
  }

  return roomCode;
}

export async function labExists(roomCode: string) {
  const snap = await getDoc(doc(db, "labs", roomCode));
  return snap.exists();
}

export async function updateLabSettings(roomCode: string, settings: Partial<LabSettings>) {
  await updateDoc(doc(db, "labs", roomCode), {
    settings,
    updatedAt: serverTimestamp(),
  });
}

export async function syncTeamsCount(roomCode: string, roundCount: number, teamCount: number) {
  const teamsRef = collection(db, "labs", roomCode, "teams");
  const snap = await getDocs(teamsRef);
  const docs = snap.docs;
  const currentCount = docs.length;

  if (teamCount > currentCount) {
    const creates: Promise<void>[] = [];
    for (let i = currentCount + 1; i <= teamCount; i += 1) {
      const teamId = `${i}조`;
      creates.push(
        setDoc(doc(teamsRef, teamId), {
          teamId,
          rounds: Array.from({ length: roundCount }, () => 0),
          submitted: false,
          groupName: "",
          updatedAt: serverTimestamp(),
        }),
      );
    }
    await Promise.all(creates);
    return;
  }

  if (teamCount < currentCount) {
    const deletes = docs
      .map((row) => row.id)
      .filter((id) => extractTeamNumber(id) > teamCount)
      .map((id) => deleteDoc(doc(teamsRef, id)));
    await Promise.all(deletes);
  }
}

function extractTeamNumber(teamId: string) {
  const n = Number(teamId.replace("조", ""));
  return Number.isFinite(n) ? n : 0;
}

async function generateUniqueRoomCode() {
  for (let i = 0; i < 20; i += 1) {
    const code = makeRoomCode();
    if (!(await labExists(code))) {
      return code;
    }
  }
  throw new Error("실험실 코드 생성에 실패했습니다. 다시 시도해 주세요.");
}

function makeRoomCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 6; i += 1) {
    out += chars[Math.floor(Math.random() * chars.length)];
  }
  return out;
}
