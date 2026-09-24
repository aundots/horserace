import type { STRINGS } from "./strings";

type T = (typeof STRINGS)["ko"];

/** 서버가 주는 주로/날씨 코드를 현재 언어 라벨로. 모르는 코드는 원문 그대로. */
export function trackLabel(t: T, track: string): string {
  if (track === "DRY") return t.trackDry;
  if (track === "WET") return t.trackWet;
  if (track === "HEAVY") return t.trackHeavy;
  return track;
}

export function weatherLabel(t: T, weather: string): string {
  if (weather === "SUNNY") return t.weatherSunny;
  if (weather === "CLOUDY") return t.weatherCloudy;
  if (weather === "RAIN") return t.weatherRain;
  return weather;
}

export function paceLabel(t: T, pace: string): string {
  if (pace === "FRONT") return t.paceFront;
  if (pace === "STALKER") return t.paceStalker;
  if (pace === "MID") return t.paceMid;
  if (pace === "CLOSER") return t.paceCloser;
  return pace;
}

/** 출전표 태그용 주로 적성 — trackLabel 과 문구가 같아 재사용한다. */
export function trackAptLabel(t: T, apt: string): string {
  if (apt === "DRY") return t.aptDry;
  if (apt === "WET") return t.aptWet;
  if (apt === "HEAVY") return t.aptHeavy;
  return apt;
}

export function distanceAptLabel(t: T, apt: string): string {
  if (apt === "SPRINT") return t.distSprint;
  if (apt === "MIDDLE") return t.distMiddle;
  if (apt === "LONG") return t.distLong;
  return apt;
}

export function conditionLabel(t: T, cond: string): string {
  if (cond === "GREAT") return t.condGreat;
  if (cond === "GOOD") return t.condGood;
  if (cond === "POOR") return t.condPoor;
  return cond;
}
