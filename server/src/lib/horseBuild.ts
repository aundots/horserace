import type { DistanceApt, PaceType, TrackState } from "./raceSim.js";
import type { HorseCoatId } from "./horseCoat.js";
import { isHorseCoatId } from "./horseCoat.js";

export const STAT_BUDGET = 150;
export const STAT_MIN = 35;
export const STAT_MAX = 65;

export type HorsePresetId =
  | "SPEED"
  | "BALANCE"
  | "STAMINA"
  | "ACCEL"
  | "STALKER";

export type HorseCustomizeInput = {
  name?: string;
  coat?: HorseCoatId;
  pace?: PaceType;
  trackApt?: TrackState;
  distanceApt?: DistanceApt;
  speed?: number;
  stamina?: number;
  accel?: number;
};

export const HORSE_PRESETS: Record<
  HorsePresetId,
  {
    label: string;
    desc: string;
    name: string;
    speed: number;
    stamina: number;
    accel: number;
    pace: PaceType;
    trackApt: TrackState;
    distanceApt: DistanceApt;
  }
> = {
  SPEED: {
    label: "스피드형",
    desc: "초반 도주 · 단거",
    name: "질주마",
    speed: 58,
    stamina: 44,
    accel: 48,
    pace: "FRONT",
    trackApt: "DRY",
    distanceApt: "SPRINT",
  },
  STALKER: {
    label: "선행형",
    desc: "앞선 두번째 · 중거",
    name: "선행마",
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
    speed: 44,
    stamina: 58,
    accel: 48,
    pace: "CLOSER",
    trackApt: "HEAVY",
    distanceApt: "LONG",
  },
};

const PACES: PaceType[] = ["FRONT", "STALKER", "MID", "CLOSER"];
const TRACKS: TrackState[] = ["DRY", "WET", "HEAVY"];
const DISTANCES: DistanceApt[] = ["SPRINT", "MIDDLE", "LONG"];

function isPace(v: unknown): v is PaceType {
  return typeof v === "string" && PACES.includes(v as PaceType);
}

function isTrack(v: unknown): v is TrackState {
  return typeof v === "string" && TRACKS.includes(v as TrackState);
}

function isDistance(v: unknown): v is DistanceApt {
  return typeof v === "string" && DISTANCES.includes(v as DistanceApt);
}

export function clampStat(n: number) {
  return Math.min(STAT_MAX, Math.max(STAT_MIN, Math.round(n)));
}

export function validateStats(
  speed: number,
  stamina: number,
  accel: number,
  statBonusEarned = 0,
) {
  if (
    speed < STAT_MIN ||
    speed > STAT_MAX ||
    stamina < STAT_MIN ||
    stamina > STAT_MAX ||
    accel < STAT_MIN ||
    accel > STAT_MAX
  ) {
    return "각 스탯은 35~65 사이여야 해요.";
  }
  const sum = speed + stamina + accel;
  if (sum < STAT_BUDGET) {
    return `기본 스탯 ${STAT_BUDGET}을 채워야 해요. (현재 ${sum})`;
  }
  const maxSum = STAT_BUDGET + statBonusEarned;
  if (sum > maxSum) {
    return `보너스 포인트가 부족해요. (최대 ${maxSum}, 현재 ${sum})`;
  }
  return null;
}

export function sanitizeCustomizeInput(
  input: HorseCustomizeInput,
  statBonusEarned = 0,
): { ok: true; value: Required<HorseCustomizeInput> } | { ok: false; message: string } {
  const name = typeof input.name === "string" ? input.name.trim() : "";
  if (!name || name.length > 12) {
    return { ok: false, message: "말 이름은 1~12자여야 해요." };
  }

  if (!isHorseCoatId(input.coat)) {
    return { ok: false, message: "털색을 선택해 주세요." };
  }
  if (!isPace(input.pace)) {
    return { ok: false, message: "페이스를 선택해 주세요." };
  }
  if (!isTrack(input.trackApt)) {
    return { ok: false, message: "주로 적성을 선택해 주세요." };
  }
  if (!isDistance(input.distanceApt)) {
    return { ok: false, message: "거리 적성을 선택해 주세요." };
  }

  const speed = clampStat(Number(input.speed));
  const stamina = clampStat(Number(input.stamina));
  const accel = clampStat(Number(input.accel));
  const statErr = validateStats(speed, stamina, accel, statBonusEarned);
  if (statErr) return { ok: false, message: statErr };

  return {
    ok: true,
    value: {
      name,
      coat: input.coat,
      pace: input.pace,
      trackApt: input.trackApt,
      distanceApt: input.distanceApt,
      speed,
      stamina,
      accel,
    },
  };
}

export function isHorsePresetId(v: unknown): v is HorsePresetId {
  return typeof v === "string" && v in HORSE_PRESETS;
}
