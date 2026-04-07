export type TeamRounds = {
  teamId: string;
  rounds: number[];
};

export type ViewMode = "realtime" | "batched";

export type RoundAggregatePoint = {
  round: number;
  expected: number;
  average: number;
  teamCount: number;
  /** 해당 라운드에서 모든 팀 상자에 남은 동전 수의 합 */
  total: number;
  /** 팀 수 × 이론값(팀당) — 모든 팀이 이론대로일 때의 총합 */
  expectedTotal: number;
};
