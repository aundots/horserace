import {
  DISTANCE_LABEL,
  PACE_LABEL,
  STAT_MAX,
  STAT_MIN,
  TRACK_LABEL,
} from "./horseBuild";
import type { RaceEntrant } from "../types/game";

const CONDITION_LABEL: Record<string, string> = {
  GREAT: "최상",
  GOOD: "양호",
  POOR: "부진",
};

const DISTANCE_FOR_APT: Record<string, number> = {
  SPRINT: 1200,
  MIDDLE: 1600,
  LONG: 2000,
};

export function conditionLabel(c: string) {
  return CONDITION_LABEL[c] ?? c;
}

export function statBarPct(value: number) {
  return Math.round(
    ((Math.min(STAT_MAX, Math.max(STAT_MIN, value)) - STAT_MIN) /
      (STAT_MAX - STAT_MIN)) *
      100,
  );
}

export function entrantAptTags(
  entrant: RaceEntrant,
  raceTrack: string,
  raceDistance: number,
) {
  const tags: { label: string; match: boolean }[] = [
    { label: PACE_LABEL[entrant.pace] ?? entrant.pace, match: false },
    {
      label: `${TRACK_LABEL[entrant.trackApt] ?? entrant.trackApt} 주로`,
      match: entrant.trackApt === raceTrack,
    },
    {
      label: `${DISTANCE_LABEL[entrant.distanceApt] ?? entrant.distanceApt}`,
      match: DISTANCE_FOR_APT[entrant.distanceApt] === raceDistance,
    },
    {
      label: conditionLabel(entrant.condition),
      match: entrant.condition === "GREAT",
    },
  ];
  return tags;
}
