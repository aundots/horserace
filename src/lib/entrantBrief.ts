import { STAT_MAX, STAT_MIN } from "./horseBuild";
import {
  conditionLabel,
  distanceAptLabel,
  paceLabel,
  trackAptLabel,
} from "../i18n/labels";
import type { STRINGS } from "../i18n/strings";
import type { RaceEntrant } from "../types/game";

const DISTANCE_FOR_APT: Record<string, number> = {
  SPRINT: 1200,
  MIDDLE: 1600,
  LONG: 2000,
};

export function statBarPct(value: number) {
  return Math.round(
    ((Math.min(STAT_MAX, Math.max(STAT_MIN, value)) - STAT_MIN) /
      (STAT_MAX - STAT_MIN)) *
      100,
  );
}

export function entrantAptTags(
  t: (typeof STRINGS)["ko"],
  entrant: RaceEntrant,
  raceTrack: string,
  raceDistance: number,
) {
  const tags: { label: string; match: boolean }[] = [
    { label: paceLabel(t, entrant.pace), match: false },
    {
      label: trackAptLabel(t, entrant.trackApt),
      match: entrant.trackApt === raceTrack,
    },
    {
      label: distanceAptLabel(t, entrant.distanceApt),
      match: DISTANCE_FOR_APT[entrant.distanceApt] === raceDistance,
    },
    {
      label: conditionLabel(t, entrant.condition),
      match: entrant.condition === "GREAT",
    },
  ];
  return tags;
}
