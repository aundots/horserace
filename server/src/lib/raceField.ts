import { pickGhosts } from "../db/ghostStore.js";
import { randomCoat } from "./horseCoat.js";
import { assignRandomSilkHues } from "./horseSilk.js";
import { assignJockeys, type JockeyInfo } from "./jockey.js";
import {
  buildOpponents,
  pickUniqueHorseNames,
  type RaceHorse,
} from "./raceSim.js";

export function buildEntrants(horses: RaceHorse[], jockeys: Record<number, JockeyInfo>) {
  return horses.map((h) => {
    const j = jockeys[h.number];
    return {
      number: h.number,
      name: h.name,
      isGhost: h.isGhost,
      pace: h.pace,
      coat: h.coat,
      silkHue: h.silkHue,
      speed: h.speed,
      stamina: h.stamina,
      accel: h.accel,
      trackApt: h.trackApt,
      distanceApt: h.distanceApt,
      condition: h.condition,
      jockeyName: j?.name ?? "미정",
      jockeyWeight: j?.weight ?? 55,
      jockeyWinRate: j?.winRate ?? 0,
      jockeyTier: j?.tier ?? "신예",
    };
  });
}

export function buildRaceField(anchor: { speed: number; stamina: number; accel: number }) {
  const statSum = anchor.speed + anchor.stamina + anchor.accel;
  const ghosts = pickGhosts(3, statSum);
  const horses: RaceHorse[] = [];
  let num = 1;

  for (const g of ghosts) {
    horses.push({
      number: num++,
      name: g.horseName,
      isPlayer: false,
      isGhost: true,
      speed: g.speed,
      stamina: g.stamina,
      accel: g.accel,
      pace: g.pace,
      trackApt: g.trackApt,
      distanceApt: g.distanceApt,
      condition: "GOOD",
      fatigue: 20,
      weekendBuffPct: 0,
      coat: randomCoat(),
      silkHue: 0,
    });
  }

  const template: RaceHorse = {
    number: 0,
    name: "",
    isPlayer: false,
    isGhost: false,
    speed: anchor.speed,
    stamina: anchor.stamina,
    accel: anchor.accel,
    pace: "MID",
    trackApt: "DRY",
    distanceApt: "MIDDLE",
    condition: "GOOD",
    fatigue: 0,
    weekendBuffPct: 0,
    coat: randomCoat(),
    silkHue: 0,
  };

  while (horses.length < 8) {
    const [bot] = buildOpponents(template, 1);
    if (!bot) break;
    bot.number = num++;
    horses.push(bot);
  }

  const reserved = horses.filter((h) => h.isGhost).map((h) => h.name);
  const bots = horses.filter((h) => !h.isGhost);
  const botNames = pickUniqueHorseNames(bots.length, reserved);
  bots.forEach((h, i) => {
    h.name = botNames[i];
  });

  // 멀티/솔로 공통: 능력치 편차를 줄여 고만고만하게 붙게 조정
  const tighten = (value: number, base: number) => Math.round(base + (value - base) * 0.45);
  for (const h of horses) {
    h.speed = tighten(h.speed, anchor.speed);
    h.stamina = tighten(h.stamina, anchor.stamina);
    h.accel = tighten(h.accel, anchor.accel);
  }

  const jockeys = assignJockeys(horses);
  const silkMap = assignRandomSilkHues(horses.map((h) => h.number));
  for (const h of horses) {
    h.silkHue = silkMap[h.number] ?? 0;
  }
  return { horses, jockeys };
}
