import type { RaceHorse, RaceCondition } from "./raceSim.js";

export type TipGrade = "SURE" | "LIKELY" | "RUMOR" | "TRAP";

export type TipCard = {
  horseNumber: number;
  grade: TipGrade;
  text: string;
};

/** 말마다 1~3P 랜덤 (평균 약 1.6P → 8두 전부 약 13P) */
export function rollTipOpenCost(): number {
  const r = Math.random();
  if (r < 0.5) return 1;
  if (r < 0.85) return 2;
  return 3;
}

export function rollTipOpenCosts(horses: RaceHorse[]): Record<number, number> {
  const costs: Record<number, number> = {};
  for (const horse of horses) {
    costs[horse.number] = rollTipOpenCost();
  }
  return costs;
}

const GRADE_ARROWS: Record<TipGrade, string> = {
  SURE: "▲▲",
  LIKELY: "▲",
  RUMOR: "−",
  TRAP: "▼",
};

export function gradeIcon(grade: TipGrade) {
  return GRADE_ARROWS[grade];
}

function paceLabel(pace: string) {
  const map: Record<string, string> = {
    FRONT: "도주",
    STALKER: "선행",
    MID: "선입",
    CLOSER: "추입",
  };
  return map[pace] ?? pace;
}

function trackLabel(track: RaceCondition["track"]) {
  if (track === "WET") return "습윤";
  if (track === "HEAVY") return "무거운";
  return "마른";
}

function distanceMatches(horse: RaceHorse, distance: number) {
  return (
    (distance === 1200 && horse.distanceApt === "SPRINT") ||
    (distance === 1600 && horse.distanceApt === "MIDDLE") ||
    (distance === 2000 && horse.distanceApt === "LONG")
  );
}

function rumorText(horse: RaceHorse) {
  if (horse.speed >= 54) {
    return `${horse.number}번, 스피드가 상위권이라는 평`;
  }
  if (horse.stamina >= 54) {
    return `${horse.number}번, 후반 탄력이 좋다는 소문`;
  }
  if (horse.accel >= 54) {
    return `${horse.number}번, 막판 가속이 날카롭다는 말`;
  }
  if (horse.pace === "FRONT") {
    return `${horse.number}번, 초반 선두 각이 나온다`;
  }
  if (horse.pace === "CLOSER") {
    return `${horse.number}번, 추입 각을 노린다는 이야기`;
  }
  return `${horse.number}번, 컨디션 소문 — 판단은 직접`;
}

function buildHorseTip(
  horse: RaceHorse,
  condition: RaceCondition,
  options: { trainedToday: boolean },
  trapNumber: number | null,
): TipCard {
  const base = { horseNumber: horse.number };

  if (trapNumber === horse.number) {
    return {
      ...base,
      grade: "TRAP",
      text: `${horse.number}번 거리·주로 부담 소문 (신뢰 낮음)`,
    };
  }

  if (horse.trackApt === condition.track) {
    return {
      ...base,
      grade: "LIKELY",
      text: `${horse.number}번, ${trackLabel(condition.track)} 주로 적성이 맞는다`,
    };
  }

  if (distanceMatches(horse, condition.distance)) {
    return {
      ...base,
      grade: "LIKELY",
      text: `${horse.number}번, 오늘 ${condition.distance}m 거리에 강하다`,
    };
  }

  if (horse.condition === "GREAT") {
    return {
      ...base,
      grade: "LIKELY",
      text: `${horse.number}번 컨디션 최상 — 기수도 자신감`,
    };
  }

  if (horse.condition === "POOR") {
    return {
      ...base,
      grade: "TRAP",
      text: `${horse.number}번 컨디션 부진설 — 주의 요망`,
    };
  }

  if (horse.isGhost) {
    return {
      ...base,
      grade: "RUMOR",
      text: `${horse.name} — 과거 레이스 기록 참고용`,
    };
  }

  if (horse.pace === "CLOSER") {
    return {
      ...base,
      grade: "RUMOR",
      text: `${horse.number}번, 추입 마무리가 빠르다는 말`,
    };
  }

  return {
    ...base,
    grade: "RUMOR",
    text: rumorText(horse),
  };
}

/** 출전 8두 각각 1장의 찌라시 생성 */
export function generateTipsForAllHorses(
  horses: RaceHorse[],
  condition: RaceCondition,
  options: { trapEnabled: boolean; trainedToday: boolean },
): TipCard[] {
  const sorted = [...horses].sort((a, b) => a.number - b.number);
  const trapNumber =
    options.trapEnabled && sorted.length > 0 && Math.random() < 0.4
      ? sorted[Math.floor(Math.random() * sorted.length)]!.number
      : null;

  return sorted.map((horse) =>
    buildHorseTip(
      horse,
      condition,
      { trainedToday: options.trainedToday },
      trapNumber,
    ),
  );
}

/** @deprecated generateTipsForAllHorses 사용 */
export function generateTips(
  horses: RaceHorse[],
  condition: RaceCondition,
  options: { trapEnabled: boolean; trainedToday: boolean },
): TipCard[] {
  return generateTipsForAllHorses(horses, condition, options);
}

export function resolvePrediction(
  pick: number,
  finishOrder: number[],
): { hit: "win" | "place" | "miss" } {
  const place = finishOrder.indexOf(pick) + 1;
  if (place === 1) return { hit: "win" };
  if (place === 2) return { hit: "place" };
  return { hit: "miss" };
}
