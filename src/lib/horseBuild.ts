import type { HorseCoatId, HorseProfile } from "../types/game";

export const STAT_BUDGET = 150;
export const STAT_MIN = 35;
export const STAT_MAX = 65;

export type HorsePresetId =
  | "SPEED"
  | "BALANCE"
  | "STAMINA"
  | "ACCEL"
  | "STALKER";

export type HorseDraft = {
  name: string;
  coat: HorseCoatId;
  pace: string;
  trackApt: string;
  distanceApt: string;
  speed: number;
  stamina: number;
  accel: number;
};

export const PACE_OPTIONS = [
  { id: "FRONT", label: "도주" },
  { id: "STALKER", label: "선행" },
  { id: "MID", label: "선입" },
  { id: "CLOSER", label: "추입" },
] as const;

export const TRACK_OPTIONS = [
  { id: "DRY", label: "마른" },
  { id: "WET", label: "습윤" },
  { id: "HEAVY", label: "무거운" },
] as const;

export const DISTANCE_OPTIONS = [
  { id: "SPRINT", label: "단거" },
  { id: "MIDDLE", label: "중거" },
  { id: "LONG", label: "장거" },
] as const;

export const HORSE_PRESETS: Record<
  HorsePresetId,
  { label: string; desc: string } & HorseDraft
> = {
  SPEED: {
    label: "스피드형",
    desc: "초반 도주 · 단거",
    name: "질주마",
    coat: "BAY",
    speed: 58,
    stamina: 44,
    accel: 48,
    pace: "FRONT",
    trackApt: "DRY",
    distanceApt: "SPRINT",
  },
  STALKER: {
    label: "선행형",
    desc: "앞선 2번째 · 중거",
    name: "선행마",
    coat: "CHESTNUT",
    speed: 52,
    stamina: 50,
    accel: 48,
    pace: "STALKER",
    trackApt: "DRY",
    distanceApt: "MIDDLE",
  },
  BALANCE: {
    label: "밸런스형",
    desc: "만능 · 중거",
    name: "올라운더",
    coat: "BAY",
    speed: 50,
    stamina: 50,
    accel: 50,
    pace: "MID",
    trackApt: "DRY",
    distanceApt: "MIDDLE",
  },
  ACCEL: {
    label: "추입형",
    desc: "막판 가속 · 중거",
    name: "추입마",
    coat: "BLACK",
    speed: 46,
    stamina: 48,
    accel: 56,
    pace: "CLOSER",
    trackApt: "WET",
    distanceApt: "MIDDLE",
  },
  STAMINA: {
    label: "스태미나형",
    desc: "후반 강세 · 장거",
    name: "마일러",
    coat: "ROAN",
    speed: 44,
    stamina: 58,
    accel: 48,
    pace: "CLOSER",
    trackApt: "HEAVY",
    distanceApt: "LONG",
  },
};

export function horseToDraft(horse: HorseProfile): HorseDraft {
  return {
    name: horse.name,
    coat: horse.coat,
    pace: horse.pace,
    trackApt: horse.trackApt,
    distanceApt: horse.distanceApt,
    speed: horse.speed,
    stamina: horse.stamina,
    accel: horse.accel,
  };
}

export function statSum(draft: HorseDraft) {
  return draft.speed + draft.stamina + draft.accel;
}

export function statPointsLeft(draft: HorseDraft, statBonusEarned = 0) {
  return STAT_BUDGET + statBonusEarned - statSum(draft);
}

export function adjustStat(
  draft: HorseDraft,
  key: "speed" | "stamina" | "accel",
  delta: number,
  statBonusEarned = 0,
): HorseDraft {
  const next = { ...draft, [key]: draft[key] + delta };
  if (next[key] < STAT_MIN || next[key] > STAT_MAX) return draft;
  if (statSum(next) < STAT_BUDGET) return draft;
  if (statPointsLeft(next, statBonusEarned) < 0) return draft;
  return next;
}

export function isDraftValid(draft: HorseDraft, statBonusEarned = 0) {
  const sum = statSum(draft);
  return (
    draft.name.trim().length >= 1 &&
    draft.name.trim().length <= 12 &&
    sum >= STAT_BUDGET &&
    statPointsLeft(draft, statBonusEarned) >= 0 &&
    draft.speed >= STAT_MIN &&
    draft.stamina >= STAT_MIN &&
    draft.accel >= STAT_MIN
  );
}

export const PACE_LABEL: Record<string, string> = Object.fromEntries(
  PACE_OPTIONS.map((o) => [o.id, o.label]),
);

export const TRACK_LABEL: Record<string, string> = Object.fromEntries(
  TRACK_OPTIONS.map((o) => [o.id, o.label]),
);

export const DISTANCE_LABEL: Record<string, string> = Object.fromEntries(
  DISTANCE_OPTIONS.map((o) => [o.id, o.label]),
);
