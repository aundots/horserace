/** 내기 착순 점수 — 7·8착 0점, 누적 낮을수록 불리 */
export const PLACE_POINT_TABLE: Record<number, number> = {
  1: 10,
  2: 8,
  3: 5,
  4: 3,
  5: 2,
  6: 1,
  7: 0,
  8: 0,
};

export function placePoints(place: number): number {
  return PLACE_POINT_TABLE[place] ?? 0;
}

export const PARTY_TIPS_PER_RACE = 3;

export function formatScoreRules(): string {
  return "1착 10 · 2착 8 · 3착 5 · 4착 3 · 5착 2 · 6착 1 · 7·8착 0";
}

export function placePointsLabel(place: number): string {
  return `${placePoints(place)}점`;
}
