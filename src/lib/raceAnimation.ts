import type { TimelineFrame } from "../types/game";
import {
  getHorsePositionAtMetersRemaining,
  racingLateralTarget,
  smoothHorsePoint,
  smoothLateralT,
  smoothMetersRemaining,
  gateLateralT,
  type HorsePoint,
  type OvalLayout,
} from "./ovalTrack";

export const RACE_DURATION_MS = 56_000;

/** 순위 간 전후 간격 (m) — 대각선 일렬 방지 */
const PACK_GAP_M = 2.2;
const SPREAD_RAMP_END = 0.18;
const GATE_BLEND_END = 0.08;

function horseAlongJitter(horseNumber: number): number {
  return (
    Math.sin(horseNumber * 2.17 + 0.8) * 1.8 +
    Math.cos(horseNumber * 1.43 + 2.1) * 1.2
  );
}

/** 출발 직후 순위 간격·게이트 정렬을 서서히 풀어줌 */
function startSpreadFactor(raceProgress: number): number {
  if (raceProgress >= SPREAD_RAMP_END) return 1;
  const t = raceProgress / SPREAD_RAMP_END;
  return t * t * (3 - 2 * t);
}

function blendMetersRemaining(
  raceProgress: number,
  racedRemaining: number,
  gateRemaining: number,
): number {
  if (raceProgress >= GATE_BLEND_END) return racedRemaining;
  const blend = 1 - raceProgress / GATE_BLEND_END;
  const blended = gateRemaining * blend + racedRemaining * (1 - blend);
  return Math.max(0, blended);
}

export type RaceKeyframe = {
  frame0: TimelineFrame;
  frame1: TimelineFrame;
  /** 0~1 구간 보간 */
  t: number;
  raceProgress: number;
};

export function getRaceKeyframe(
  timeline: TimelineFrame[],
  raceProgress: number,
): RaceKeyframe {
  const max = Math.max(1, timeline.length - 1);
  const clamped = Math.min(1, Math.max(0, raceProgress));
  const frameFloat = clamped * max;
  const i0 = Math.floor(frameFloat);
  const i1 = Math.min(max, i0 + 1);
  return {
    frame0: timeline[i0],
    frame1: timeline[i1],
    t: frameFloat - i0,
    raceProgress: clamped,
  };
}

export type InterpolatedHorse = {
  number: number;
  rankIdx: number;
  displayRank: number;
  pos: HorsePoint;
};

export function buildInterpolatedHorses(
  timeline: TimelineFrame[],
  layout: OvalLayout,
  horseNumbers: number[],
  raceProgress: number,
  started: boolean,
  raceDistance = 1600,
  lateralState?: Map<number, number>,
  positionState?: Map<number, HorsePoint>,
  metersState?: Map<number, number>,
): InterpolatedHorse[] {
  if (!started) {
    return horseNumbers.map((number, idx) => ({
      number,
      rankIdx: idx,
      displayRank: idx + 1,
      pos: getHorsePositionAtMetersRemaining(
        layout,
        raceDistance,
        gateLateralT(number),
      ),
    }));
  }

  const { frame0, frame1, t, raceProgress: p } = getRaceKeyframe(
    timeline,
    raceProgress,
  );

  const spreadFactor = startSpreadFactor(p);
  const gateRemaining = raceDistance;
  const count = horseNumbers.length;
  const jitterFade = 1 - p * 0.65;

  return horseNumbers.map((number) => {
    const rank0 = frame0.ranks.indexOf(number);
    const rank1 = frame1.ranks.indexOf(number);
    const rankIdx = rank0 + (rank1 - rank0) * t;
    const baseRemaining = raceDistance * (1 - p);
    const rankOffsetM = rankIdx * PACK_GAP_M * spreadFactor;
    const jitterM = horseAlongJitter(number) * jitterFade;
    const racedRemaining = Math.max(0, baseRemaining - rankOffsetM + jitterM);
    const metersRem = metersState
      ? smoothMetersRemaining(number, blendMetersRemaining(p, racedRemaining, gateRemaining), metersState)
      : blendMetersRemaining(p, racedRemaining, gateRemaining);
    const targetLateral = racingLateralTarget(number, rankIdx, count, p);
    const lateralT = lateralState
      ? smoothLateralT(number, targetLateral, lateralState)
      : targetLateral;
    const rawPos = getHorsePositionAtMetersRemaining(
      layout,
      metersRem,
      lateralT,
    );
    const pos = positionState
      ? smoothHorsePoint(number, rawPos, positionState)
      : rawPos;
    return {
      number,
      rankIdx,
      displayRank: Math.round(rankIdx) + 1,
      pos,
    };
  });
}

export function pickLeader(horses: InterpolatedHorse[]): InterpolatedHorse | null {
  if (horses.length === 0) return null;
  return horses.reduce((best, h) => (h.rankIdx < best.rankIdx ? h : best));
}

export function isOvertakeFrame(keyframe: RaceKeyframe): boolean {
  return Boolean(keyframe.frame1.overtakes && keyframe.t > 0.35);
}
