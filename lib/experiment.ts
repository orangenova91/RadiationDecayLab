import { RoundAggregatePoint, TeamRounds } from "@/types/experiment";

export const DEFAULT_INITIAL_COINS = 100;
export const DEFAULT_ROUNDS = 8;
/** 한 라운드에서 개체 하나가 붕괴할 확률 p (동전 앞면=0.5, 6면 주사위 스티커 1면≈1/6 등) */
export const DEFAULT_DECAY_PROBABILITY = 0.5;

const DECAY_P_MIN = 0.01;
const DECAY_P_MAX = 0.99;

export function clampDecayProbability(p: number): number {
  if (!Number.isFinite(p)) {
    return DEFAULT_DECAY_PROBABILITY;
  }
  return Math.min(DECAY_P_MAX, Math.max(DECAY_P_MIN, p));
}

/** 차트·설명문용 (예: 50%, 16.7%) */
export function formatDecayPercent(p: number): string {
  const c = clampDecayProbability(p);
  const pct = c * 100;
  if (Math.abs(pct - Math.round(pct)) < 1e-4) {
    return `${Math.round(pct)}%`;
  }
  return `${pct.toFixed(1)}%`;
}

export function calculateExpected(
  round: number,
  initialCoins: number,
  decayProbability: number = DEFAULT_DECAY_PROBABILITY,
): number {
  const p = clampDecayProbability(decayProbability);
  return initialCoins * (1 - p) ** round;
}

export function getAggregateByRound(
  teams: TeamRounds[],
  roundCount: number,
  initialCoins: number,
  decayProbability: number = DEFAULT_DECAY_PROBABILITY,
): RoundAggregatePoint[] {
  const p = clampDecayProbability(decayProbability);
  return Array.from({ length: roundCount }, (_, index) => {
    const round = index + 1;
    const values = teams
      .map((team) => getRemainingByRound(team.rounds, index, initialCoins))
      .filter((value): value is number => Number.isFinite(value));
    const sum = values.reduce((acc, value) => acc + value, 0);
    const average = values.length ? sum / values.length : 0;

    const expected = calculateExpected(round, initialCoins, p);
    return {
      round,
      expected,
      average,
      teamCount: values.length,
      total: sum,
      expectedTotal: values.length * expected,
    };
  });
}

export function isRoundSequenceValid(rounds: number[], initialCoins: number): boolean {
  if (!rounds.length) {
    return true;
  }

  let cumulativeRemoved = 0;
  for (let i = 0; i < rounds.length; i += 1) {
    const current = rounds[i];
    if (!Number.isFinite(current) || current < 0 || current > initialCoins) {
      return false;
    }
    cumulativeRemoved += current;
    if (cumulativeRemoved > initialCoins) {
      return false;
    }
  }

  return true;
}

function getRemainingByRound(removedByRound: number[], roundIndex: number, initialCoins: number): number {
  const removed = removedByRound
    .slice(0, roundIndex + 1)
    .reduce((acc, value) => acc + (Number.isFinite(value) ? value : 0), 0);
  return Math.max(0, initialCoins - removed);
}
