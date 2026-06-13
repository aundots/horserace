/** 베이스(빨간 실크) 기준 hue-rotate — 경기마다 1~8번에 셔플 배정 */
export const SILK_HUES = [0, 38, 72, 120, 165, 210, 270, 310] as const;

function assetUrl(path: string): string {
  const base = import.meta.env.BASE_URL ?? "/";
  return `${base}${path.replace(/^\//, "")}`;
}

export const RACE_HORSE_BASE = assetUrl("assets/race-horse-base.png");

/** 달리기 연출 — 시트에서 추출한 유효 프레임 */
export const RACE_HORSE_FRAMES = [
  assetUrl("assets/race-horse-frame-3.png"),
  assetUrl("assets/race-horse-frame-4.png"),
  assetUrl("assets/race-horse-frame-5.png"),
];

export function silkHueForNumber(number: number, map?: Record<number, number>): number {
  if (map && map[number] != null) return map[number]!;
  return SILK_HUES[(number - 1) % SILK_HUES.length]!;
}

export function silkFilter(hue: number): string {
  return `hue-rotate(${hue}deg) drop-shadow(0 1px 2px rgba(0,0,0,0.45))`;
}

export function silkColorFromHue(hue: number): string {
  // 빨강 #E53935 기준 근사
  const h = (hue % 360) / 360;
  const s = 0.72;
  const l = 0.48;
  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;
  const r = hueToRgb(p, q, h + 1 / 3);
  const g = hueToRgb(p, q, h);
  const b = hueToRgb(p, q, h - 1 / 3);
  return `rgb(${Math.round(r * 255)}, ${Math.round(g * 255)}, ${Math.round(b * 255)})`;
}

function hueToRgb(p: number, q: number, t: number) {
  let tt = t;
  if (tt < 0) tt += 1;
  if (tt > 1) tt -= 1;
  if (tt < 1 / 6) return p + (q - p) * 6 * tt;
  if (tt < 1 / 2) return q;
  if (tt < 2 / 3) return p + (q - p) * (2 / 3 - tt) * 6;
  return p;
}
