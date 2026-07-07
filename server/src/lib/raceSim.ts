export type PaceType = "FRONT" | "STALKER" | "MID" | "CLOSER";
export type TrackState = "DRY" | "WET" | "HEAVY";
export type DistanceApt = "SPRINT" | "MIDDLE" | "LONG";
export type Condition = "GREAT" | "GOOD" | "POOR";

import type { HorseCoatId } from "./horseCoat.js";
import { randomCoat } from "./horseCoat.js";

export type RaceHorse = {
  number: number;
  name: string;
  isPlayer: boolean;
  isGhost: boolean;
  speed: number;
  stamina: number;
  accel: number;
  pace: PaceType;
  trackApt: TrackState;
  distanceApt: DistanceApt;
  condition: Condition;
  fatigue: number;
  weekendBuffPct: number;
  coat: HorseCoatId;
  silkHue: number;
};

export type RaceCondition = {
  distance: 1200 | 1600 | 2000;
  track: TrackState;
  weather: "SUNNY" | "CLOUDY" | "RAIN";
};

export type TimelineFrame = {
  t: number;
  ranks: number[];
  overtakes?: boolean;
};

export type RaceSimResult = {
  finishOrder: number[];
  finishTimes: Record<number, number>;
  dnf: Record<number, boolean>;
  dnfReasons: Record<number, "fall" | "interference">;
  dnfProgress: Record<number, number>;
  raceEvents: RaceEvent[];
  timeline: TimelineFrame[];
  overtakes: number;
  playerPlace: number;
  playerDnf: boolean;
  playerDnfReason?: "fall" | "interference";
  raceScore: number;
};

export type RaceEvent = {
  type: "fall" | "interference";
  progress: number;
  horses: number[];
};

const PACE_MULT: Record<PaceType, number[]> = {
  FRONT: [1.12, 1.07, 0.94, 0.88],
  STALKER: [1.07, 1.03, 0.97, 0.93],
  MID: [0.97, 1.0, 1.03, 1.06],
  CLOSER: [0.89, 0.95, 1.06, 1.14],
};

const TRACK_MATRIX: Record<TrackState, Record<TrackState, number>> = {
  DRY: { DRY: 0.95, WET: 1.05, HEAVY: 1.08 },
  WET: { DRY: 1.05, WET: 0.95, HEAVY: 0.97 },
  HEAVY: { DRY: 1.04, WET: 1.0, HEAVY: 0.94 },
};

const HORSE_NAMES = [
  "바람돌이",
  "질주의달인",
  "번개발",
  "황금갈기",
  "폭풍질주",
  "은빛바람",
  "천리마",
  "불꽃질주",
  "달빛질주",
  "청룡마",
  "백마왕",
  "서해의별",
  "한강히어로",
  "쌍화차",
  "뇌전마",
  "서릿발",
  "다이나믹",
  "캡틴스타",
  "로열챔프",
  "골든에이지",
];

function shuffle<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/** 같은 경주 안에서 겹치지 않는 말 이름 */
export function pickUniqueHorseNames(count: number, exclude: string[] = []): string[] {
  const taken = new Set(exclude);
  const pool = shuffle(HORSE_NAMES.filter((n) => !taken.has(n)));
  const result: string[] = [];

  for (let i = 0; i < count; i++) {
    if (i < pool.length) {
      result.push(pool[i]);
      taken.add(pool[i]);
      continue;
    }
    const base = HORSE_NAMES[i % HORSE_NAMES.length];
    let suffix = 2;
    let candidate = `${base}${suffix}`;
    while (taken.has(candidate)) {
      suffix++;
      candidate = `${base}${suffix}`;
    }
    result.push(candidate);
    taken.add(candidate);
  }

  return result;
}

const BASE_SEGMENT_MS = 11500;

/** 이 시간(ms) 이내로 붙어 달리면 '엉킴' 판정 */
const PACK_GAP_MS = 320;

function randBetween(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function statFactor(horse: RaceHorse) {
  const sum = horse.speed + horse.stamina + horse.accel;
  return 1 - (sum - 150) * 0.0008;
}

function distanceModifier(horse: RaceHorse, distance: RaceCondition["distance"]) {
  const match =
    (distance === 1200 && horse.distanceApt === "SPRINT") ||
    (distance === 1600 && horse.distanceApt === "MIDDLE") ||
    (distance === 2000 && horse.distanceApt === "LONG");
  return match ? 0.975 : 1.03;
}

function conditionModifier(condition: Condition) {
  if (condition === "GREAT") return 0.985;
  if (condition === "POOR") return 1.03;
  return 1;
}

function cornerWetBonus(horse: RaceHorse, track: TrackState, segmentIndex: number) {
  if (horse.trackApt === "WET" && track === "WET" && (segmentIndex === 1 || segmentIndex === 3)) {
    return 0.97;
  }
  return 1;
}

function rollFall(
  horse: RaceHorse,
  segmentIndex: number,
  fallChanceBonus: number,
  rookieShield: boolean,
) {
  if (rookieShield) return false;
  const cornerWeight = segmentIndex === 1 || segmentIndex === 3 ? 2.5 : 1;
  const fatigueFactor =
    horse.fatigue >= 90 ? 1 : horse.fatigue >= 70 ? 0.5 : 0;
  const staminaFactor = Math.min(0.3, horse.stamina / 300);
  const weekdayBuff = horse.weekendBuffPct > 0 ? 0.1 : 0;
  const p =
    0.0014 *
    cornerWeight *
    (1 + fatigueFactor) *
    (1 - staminaFactor) *
    (1 - weekdayBuff) +
    fallChanceBonus;
  return Math.random() < p;
}

/** 밀집 구간 간섭·추돌 낙마 확률 (코너·다마수·주로) */
function interferenceProbability(
  clusterSize: number,
  segmentIndex: number,
  track: TrackState,
  fallChanceBonus: number,
): number {
  if (clusterSize < 2) return 0;
  const corner = segmentIndex === 1 || segmentIndex === 3;
  const base = corner ? 0.0055 : 0.0012;
  const sizeFactor =
    clusterSize >= 6 ? 2.1 : clusterSize >= 5 ? 1.7 : clusterSize >= 4 ? 1.35 : clusterSize >= 3 ? 1.12 : 1;
  const trackFactor = track === "WET" ? 1.45 : track === "HEAVY" ? 1.28 : 1;
  return base * sizeFactor * trackFactor + fallChanceBonus * 0.35;
}

type HorseSimState = {
  segmentTimes: number[];
  dnf: boolean;
  dnfReason?: "fall" | "interference";
  dnfProgress?: number;
};

function computeSegmentTime(
  horse: RaceHorse,
  condition: RaceCondition,
  debuffs: { finishTimePenaltyPct: number },
  segmentIndex: number,
): number {
  const pace = PACE_MULT[horse.pace][segmentIndex];
  const track = TRACK_MATRIX[horse.trackApt][condition.track];
  const dist = distanceModifier(horse, condition.distance);
  const cond = conditionModifier(horse.condition);
  const stat = statFactor(horse);
  const wet = cornerWetBonus(horse, condition.track, segmentIndex);
  const buff = 1 - horse.weekendBuffPct / 100;
  const rng = 1 + randBetween(-0.03, 0.03);
  return (
    BASE_SEGMENT_MS *
    pace *
    track *
    dist *
    cond *
    stat *
    wet *
    buff *
    rng *
    (1 + debuffs.finishTimePenaltyPct / 100)
  );
}

function findPackClusters(
  atSeg: { horse: RaceHorse; cumTime: number }[],
): { horse: RaceHorse; cumTime: number }[][] {
  const clusters: { horse: RaceHorse; cumTime: number }[][] = [];
  let cur: { horse: RaceHorse; cumTime: number }[] = [];
  for (const item of atSeg) {
    if (cur.length === 0) {
      cur.push(item);
      continue;
    }
    if (item.cumTime - cur[cur.length - 1]!.cumTime <= PACK_GAP_MS) {
      cur.push(item);
    } else {
      if (cur.length >= 2) clusters.push(cur);
      cur = [item];
    }
  }
  if (cur.length >= 2) clusters.push(cur);
  return clusters;
}

/** 말끼리 엉킨 팩에서 간섭 사고 롤 */
function applyPackInterference(
  seg: number,
  horses: RaceHorse[],
  states: Map<number, HorseSimState>,
  condition: RaceCondition,
  fallChanceBonus: number,
  events: RaceEvent[],
): void {
  const active = horses.filter((h) => {
    const st = states.get(h.number);
    return st && !st.dnf && st.segmentTimes.length > seg;
  });

  if (active.length < 2) return;

  const atSeg = active
    .map((h) => {
      const st = states.get(h.number)!;
      const cum = st.segmentTimes.slice(0, seg + 1).reduce((a, b) => a + b, 0);
      return { horse: h, cumTime: cum };
    })
    .sort((a, b) => a.cumTime - b.cumTime);

  for (const cluster of findPackClusters(atSeg)) {
    const p = interferenceProbability(cluster.length, seg, condition.track, fallChanceBonus);
    if (Math.random() >= p) continue;

    const victimCount = cluster.length >= 5 ? 2 : 1;
    const sorted = [...cluster].sort((a, b) => b.cumTime - a.cumTime);
    const hit: number[] = [];

    for (let i = 0; i < victimCount && i < sorted.length; i++) {
      const num = sorted[i]!.horse.number;
      const st = states.get(num);
      if (!st || st.dnf) continue;
      st.dnf = true;
      st.dnfReason = "interference";
      st.dnfProgress = Math.min(0.98, (seg + 0.72 + i * 0.03) / 4);
      hit.push(num);
    }

    if (hit.length > 0) {
      events.push({
        type: "interference",
        progress: (seg + 0.75) / 4,
        horses: hit,
      });
    }
  }
}

function buildTimeline(
  horses: RaceHorse[],
  segmentTimesByHorse: Map<number, number[]>,
  dnf: Record<number, boolean>,
  dnfProgress: Record<number, number>,
  finishOrder: number[],
): TimelineFrame[] {
  const steps = 36;
  const frames: TimelineFrame[] = [];

  for (let step = 0; step < steps; step++) {
    const progress = step / (steps - 1);
    const segmentProgress = progress * 4;
    const fullSegment = Math.min(3, Math.floor(segmentProgress));
    const partial = segmentProgress - fullSegment;

    /** 초반 12% 구간 — 팩 유지 후 서서히 실제 페이스 반영 (출발 튐 방지) */
    const packBlend = progress < 0.12 ? (0.12 - progress) / 0.12 : 0;

    const virtualTimes = horses.map((horse) => {
      if (dnf[horse.number]) {
        const dropAt = dnfProgress[horse.number] ?? 0;
        if (progress >= dropAt) {
          return { number: horse.number, time: Number.POSITIVE_INFINITY };
        }
      }
      const segments = segmentTimesByHorse.get(horse.number) ?? [];
      let time = 0;
      for (let i = 0; i < fullSegment; i++) time += segments[i] ?? 0;
      if (fullSegment < 4) time += (segments[fullSegment] ?? 0) * partial;
      const raceTime = time + horse.number * 0.01;
      const packTime = progress * 12000 + horse.number * 0.01;
      return {
        number: horse.number,
        time: raceTime * (1 - packBlend) + packTime * packBlend,
      };
    });

    virtualTimes.sort((a, b) => a.time - b.time);
    frames.push({
      t: progress,
      ranks: virtualTimes.map((v) => v.number),
    });
  }

  frames[frames.length - 1].ranks = finishOrder;
  return enhanceOvertakes(frames, finishOrder);
}

function enhanceOvertakes(frames: TimelineFrame[], finishOrder: number[]): TimelineFrame[] {
  let swaps = 0;
  for (let i = 1; i < frames.length; i++) {
    const prevTop = frames[i - 1].ranks.slice(0, 3);
    const curTop = frames[i].ranks.slice(0, 3);
    if (prevTop.join() !== curTop.join()) swaps++;
  }

  if (swaps >= 4) return frames;

  const result = frames.map((f) => ({ ...f, ranks: [...f.ranks] }));
  const leaderA = finishOrder[0];
  const leaderB = finishOrder[1] ?? finishOrder[0];
  const mid = Math.floor(result.length / 2);

  for (let i = mid - 2; i <= mid + 2 && i < result.length - 1; i++) {
    if (i < 1) continue;
    const frame = result[i];
    const ranks = [...frame.ranks];
    const idxA = ranks.indexOf(leaderA);
    const idxB = ranks.indexOf(leaderB);
    if (idxA > -1 && idxB > -1) {
      ranks[idxA] = leaderB;
      ranks[idxB] = leaderA;
      ranks.sort((a, b) => {
        const order = frame.ranks;
        return order.indexOf(a) - order.indexOf(b);
      });
      frame.ranks = ranks;
      frame.overtakes = true;
    }
  }

  result[result.length - 1].ranks = finishOrder;
  return result;
}

function countOvertakes(frames: TimelineFrame[]) {
  let swaps = 0;
  for (let i = 1; i < frames.length; i++) {
    const prev = frames[i - 1].ranks.slice(0, 3).join();
    const cur = frames[i].ranks.slice(0, 3).join();
    if (prev !== cur) swaps++;
  }
  return swaps;
}

export function randomRaceCondition(): RaceCondition {
  const distances: RaceCondition["distance"][] = [1200, 1600, 2000];
  const tracks: TrackState[] = ["DRY", "WET", "HEAVY"];
  const distance = distances[Math.floor(Math.random() * distances.length)];
  const track = tracks[Math.floor(Math.random() * tracks.length)];
  const weather =
    track === "WET" ? "RAIN" : track === "HEAVY" ? "CLOUDY" : "SUNNY";
  return { distance, track, weather };
}

export function buildOpponents(player: RaceHorse, count: number): RaceHorse[] {
  const opponents: RaceHorse[] = [];
  const paces: PaceType[] = ["FRONT", "STALKER", "MID", "CLOSER"];
  const apts: TrackState[] = ["DRY", "WET", "HEAVY"];
  const dists: DistanceApt[] = ["SPRINT", "MIDDLE", "LONG"];
  const conds: Condition[] = ["GREAT", "GOOD", "POOR"];

  for (let i = 0; i < count; i++) {
    const scale = randBetween(0.85, 1.15);
    opponents.push({
      number: i + 2,
      name: HORSE_NAMES[i % HORSE_NAMES.length],
      isPlayer: false,
      isGhost: false,
      speed: Math.round(player.speed * scale),
      stamina: Math.round(player.stamina * scale),
      accel: Math.round(player.accel * scale),
      pace: paces[Math.floor(Math.random() * paces.length)],
      trackApt: apts[Math.floor(Math.random() * apts.length)],
      distanceApt: dists[Math.floor(Math.random() * dists.length)],
      condition: conds[Math.floor(Math.random() * conds.length)],
      fatigue: Math.round(randBetween(0, 40)),
      weekendBuffPct: 0,
      coat: randomCoat(),
      silkHue: 0,
    });
  }
  return opponents;
}

export type SimulateRaceOptions = {
  rookieShield?: boolean;
  /** 예상(픽)한 말 번호 — 순위·점수 산정 기준 */
  focusNumber?: number | null;
};

export function simulateRace(
  horses: RaceHorse[],
  condition: RaceCondition,
  debuffs: { finishTimePenaltyPct: number; fallChanceBonus: number },
  options: SimulateRaceOptions = {},
): RaceSimResult {
  const { rookieShield = false, focusNumber = null } = options;
  const segmentTimesByHorse = new Map<number, number[]>();
  const finishTimes: Record<number, number> = {};
  const dnf: Record<number, boolean> = {};
  const dnfReasons: Record<number, "fall" | "interference"> = {};
  const dnfProgress: Record<number, number> = {};
  const raceEvents: RaceEvent[] = [];
  const states = new Map<number, HorseSimState>();

  for (const horse of horses) {
    states.set(horse.number, { segmentTimes: [], dnf: false });
  }

  for (let seg = 0; seg < 4; seg++) {
    for (const horse of horses) {
      const st = states.get(horse.number)!;
      if (st.dnf) continue;

      const shielded = rookieShield && focusNumber === horse.number;
      if (rollFall(horse, seg, debuffs.fallChanceBonus, shielded)) {
        st.dnf = true;
        st.dnfReason = "fall";
        st.dnfProgress = (seg + 0.55) / 4;
        raceEvents.push({ type: "fall", progress: (seg + 0.55) / 4, horses: [horse.number] });
        continue;
      }

      st.segmentTimes.push(
        computeSegmentTime(horse, condition, debuffs, seg),
      );
    }

    applyPackInterference(seg, horses, states, condition, debuffs.fallChanceBonus, raceEvents);
  }

  for (const horse of horses) {
    const st = states.get(horse.number)!;
    segmentTimesByHorse.set(horse.number, st.segmentTimes);
    dnf[horse.number] = st.dnf;
    if (st.dnfReason) dnfReasons[horse.number] = st.dnfReason;
    if (st.dnfProgress != null) dnfProgress[horse.number] = st.dnfProgress;
    finishTimes[horse.number] = st.dnf
      ? Number.POSITIVE_INFINITY
      : st.segmentTimes.reduce((a, b) => a + b, 0);
  }

  const finishers = horses
    .filter((h) => !dnf[h.number])
    .sort((a, b) => finishTimes[a.number] - finishTimes[b.number]);
  const dnfHorses = horses.filter((h) => dnf[h.number]).map((h) => h.number);
  const finishOrder = [...finishers.map((h) => h.number), ...dnfHorses];

  const timeline = buildTimeline(
    horses,
    segmentTimesByHorse,
    dnf,
    dnfProgress,
    finishOrder,
  );
  const overtakes = countOvertakes(timeline);

  const focus = focusNumber ? horses.find((h) => h.number === focusNumber) : null;
  const playerDnf = focus ? Boolean(dnf[focus.number]) : false;
  const playerDnfReason = focus ? dnfReasons[focus.number] : undefined;
  const playerPlace = !focus
    ? 0
    : playerDnf
      ? horses.length
      : finishOrder.indexOf(focus.number) + 1;

  const placementBonus = [500, 300, 100, 50, 30, 20, 10, 0][playerPlace - 1] ?? 0;
  const finishMs = !focus || playerDnf ? 0 : finishTimes[focus.number];
  const raceScore =
    !focus || playerDnf
      ? 0
      : Math.round(
          10000 -
            finishMs / 100 +
            (focus.speed + focus.stamina + focus.accel) * 0.5 +
            placementBonus,
        );

  return {
    finishOrder,
    finishTimes,
    dnf,
    dnfReasons,
    dnfProgress,
    raceEvents,
    timeline,
    overtakes,
    playerPlace,
    playerDnf,
    playerDnfReason,
    raceScore,
  };
}
