import { kstDateKey, kstWeekId } from "./kst.js";

export const HIT_BOX_TABLE = [
  { tier: "일반", item: "골드 30~50", rate: 50 },
  { tier: "일반", item: "에너지 사료", rate: 25 },
  { tier: "희귀", item: "말 색상 조각", rate: 15 },
  { tier: "희귀", item: "찌라시 +1장", rate: 8 },
  { tier: "영웅", item: "한정 칭호 조각", rate: 2 },
] as const;

export function rollHitBox(): { item: string; gold: number; inventoryId?: string } {
  const roll = Math.random() * 100;
  let acc = 0;
  for (const row of HIT_BOX_TABLE) {
    acc += row.rate;
    if (roll <= acc) {
      if (row.item.includes("골드")) return { item: row.item, gold: 30 + Math.floor(Math.random() * 21) };
      if (row.item.includes("사료")) return { item: row.item, gold: 0, inventoryId: "feed_energy" };
      if (row.item.includes("조각")) return { item: row.item, gold: 0, inventoryId: "palette_blue" };
      if (row.item.includes("찌라시")) return { item: row.item, gold: 0, inventoryId: "tip_fragment" };
      return { item: row.item, gold: 0, inventoryId: "title_fragment" };
    }
  }
  return { item: "골드 40", gold: 40 };
}

export function updateStreak(
  current: number,
  lastDate: string,
  today = kstDateKey(),
): { streak: number; broken: boolean } {
  if (lastDate === today) return { streak: current, broken: false };
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yKey = kstDateKey(yesterday);
  if (lastDate === yKey) return { streak: current + 1, broken: false };
  return { streak: Math.max(1, current - 1), broken: true };
}

export const POKEDEX_ENTRIES = [
  { id: "first_race", name: "첫 출발", desc: "연습주행 1회 완료" },
  { id: "streak_7", name: "7일 질주", desc: "7일 연속 접속" },
  { id: "rank_top3", name: "포디움", desc: "랭킹 3위 이내" },
  { id: "predict_win", name: "예상 적중", desc: "1착 예상 성공" },
  { id: "races_100", name: "백전노장", desc: "100경주 완료" },
] as const;

export function checkPokedexUnlocks(state: {
  totalRaces: number;
  streak: number;
  rankTop3: boolean;
  predictionWins: boolean;
  unlocked: string[];
}) {
  const newUnlocks: string[] = [];
  const tryUnlock = (id: string, cond: boolean) => {
    if (cond && !state.unlocked.includes(id)) newUnlocks.push(id);
  };
  tryUnlock("first_race", state.totalRaces >= 1);
  tryUnlock("streak_7", state.streak >= 7);
  tryUnlock("rank_top3", state.rankTop3);
  tryUnlock("predict_win", state.predictionWins);
  tryUnlock("races_100", state.totalRaces >= 100);
  return newUnlocks;
}

export function attendanceReward(dayIndex: number) {
  if (dayIndex === 6) return { gold: 70, label: "7일차 보너스" };
  if (dayIndex === 13) return { gold: 100, label: "14일차 보너스" };
  if (dayIndex === 27) return { gold: 200, label: "28일차 보너스" };
  return { gold: 10 + dayIndex * 2, label: `${dayIndex + 1}일차` };
}

export function streakGoldReward(streak: number) {
  const table = [10, 15, 20, 30, 40, 50, 70];
  return table[Math.min(streak - 1, table.length - 1)] ?? 10;
}

export function isNewbieShield(createdAt: Date, now = new Date()) {
  const days = Math.floor((now.getTime() - createdAt.getTime()) / (24 * 60 * 60 * 1000));
  return days < 7;
}

export function newbieTrapDisabled(totalRaces: number, createdAt: Date) {
  return isNewbieShield(createdAt) && totalRaces < 5;
}

export function promotionDemotionProtected(createdAt: Date) {
  return isNewbieShield(createdAt);
}
