import { randomInt } from "node:crypto";

/** 베이스(빨간 실크) 기준 hue-rotate — 경기마다 1~8번에 셔플 배정 */
export const SILK_HUES = [0, 38, 72, 120, 165, 210, 270, 310] as const;

export function assignRandomSilkHues(numbers: number[]): Record<number, number> {
  const hues = [...SILK_HUES];
  for (let i = hues.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [hues[i], hues[j]] = [hues[j]!, hues[i]!];
  }
  const map: Record<number, number> = {};
  numbers.forEach((n, i) => {
    map[n] = hues[i % hues.length] ?? 0;
  });
  return map;
}

export function silkHueForNumber(number: number, map?: Record<number, number>): number {
  if (map && map[number] != null) return map[number]!;
  return SILK_HUES[(number - 1) % SILK_HUES.length]!;
}
