const KST_OFFSET_MS = 9 * 60 * 60 * 1000;

export function nowKst(): Date {
  return new Date(Date.now() + KST_OFFSET_MS);
}

export function kstDateKey(date = new Date()): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.toISOString().slice(0, 10);
}

export function kstDayOfWeek(date = new Date()): number {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  return kst.getUTCDay();
}

export function isWeekendKst(date = new Date()): boolean {
  const day = kstDayOfWeek(date);
  return day === 0 || day === 6;
}

/** 주말 랭킹 시즌 — 로컬 테스트 시 DEV_LOGIN/DEV_WEEKEND면 평일에도 오픈 */
export function isRankedSeasonOpen(date = new Date()): boolean {
  if (process.env.DEV_LOGIN === "true" || process.env.DEV_WEEKEND === "true") {
    return true;
  }
  return isWeekendKst(date);
}

export function kstWeekId(date = new Date()): string {
  const kst = new Date(date.getTime() + KST_OFFSET_MS);
  const day = kst.getUTCDay();
  const monday = new Date(kst);
  monday.setUTCDate(kst.getUTCDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

export function daysAbsentKst(lastLoginAt: Date, now = new Date()): number {
  const lastKey = kstDateKey(lastLoginAt);
  const nowKey = kstDateKey(now);
  if (lastKey === nowKey) return 0;
  const last = new Date(`${lastKey}T00:00:00.000Z`).getTime();
  const current = new Date(`${nowKey}T00:00:00.000Z`).getTime();
  return Math.max(0, Math.round((current - last) / (24 * 60 * 60 * 1000)));
}
