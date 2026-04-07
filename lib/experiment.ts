import { RoundAggregatePoint, TeamRounds } from "@/types/experiment";

export const DEFAULT_INITIAL_COINS = 100;
export const DEFAULT_ROUNDS = 8;

export function calculateExpected(round: number, initialCoins: number): number {
  return initialCoins * 0.5 ** round;
}

export function getAggregateByRound(
  teams: TeamRounds[],
  roundCount: number,
  initialCoins: number,
): RoundAggregatePoint[] {
  return Array.from({ length: roundCount }, (_, index) => {
    const round = index + 1;
    const values = teams
      .map((team) => getRemainingByRound(team.rounds, index, initialCoins))
      .filter((value): value is number => Number.isFinite(value));
    const sum = values.reduce((acc, value) => acc + value, 0);
    const average = values.length ? sum / values.length : 0;

    const expected = calculateExpected(round, initialCoins);
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
