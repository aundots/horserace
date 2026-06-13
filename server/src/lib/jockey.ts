import type { RaceHorse } from "./raceSim.js";

export type JockeyInfo = {
  name: string;
  weight: number;
  winRate: number;
  tier: "에이스" | "베테랑" | "신예";
};

const JOCKEY_NAMES = [
  "김태형",
  "박준호",
  "이서진",
  "최민재",
  "정우빈",
  "한도윤",
  "오성민",
  "윤재혁",
  "강현우",
  "임지훈",
  "송유나",
  "배서연",
];

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function pick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)]!;
}

export function rollJockey(horse: RaceHorse): JockeyInfo {
  const winRate = Math.round(randBetween(8, 24));
  let tier: JockeyInfo["tier"] = "신예";
  if (winRate >= 20) tier = "에이스";
  else if (winRate >= 14) tier = "베테랑";

  return {
    name: pick(JOCKEY_NAMES),
    weight: Math.round(randBetween(52, 57) * 10) / 10,
    winRate,
    tier,
  };
}

export function assignJockeys(horses: RaceHorse[]): Record<number, JockeyInfo> {
  const used = new Set<string>();
  const map: Record<number, JockeyInfo> = {};

  for (const horse of horses) {
    let jockey = rollJockey(horse);
    let guard = 0;
    while (used.has(jockey.name) && guard < 12) {
      jockey = rollJockey(horse);
      guard += 1;
    }
    used.add(jockey.name);
    map[horse.number] = jockey;
  }

  return map;
}
