import { randomUUID } from "node:crypto";
import type { JockeyInfo } from "../lib/jockey.js";
import type { TipCard } from "../lib/tips.js";
import { rollTipOpenCosts } from "../lib/tips.js";
import type { RaceCondition, RaceHorse } from "../lib/raceSim.js";

export type PreparedRace = {
  id: string;
  userKey: number;
  mode: "ranked";
  condition: RaceCondition;
  horses: RaceHorse[];
  tips: TipCard[];
  jockeys: Record<number, JockeyInfo>;
  tipCosts: Record<number, number>;
  revealedTips: number[];
  prediction: number | null;
  predictionChanged: boolean;
  createdAt: Date;
};

export function getTipOpenCost(race: PreparedRace, horseNumber: number) {
  return race.tipCosts[horseNumber] ?? 2;
}

const prepared = new Map<string, PreparedRace>();

export function createPreparedRace(
  userKey: number,
  condition: RaceCondition,
  horses: RaceHorse[],
  tips: TipCard[],
  jockeys: Record<number, JockeyInfo>,
) {
  const id = randomUUID();
  const race: PreparedRace = {
    id,
    userKey,
    mode: "ranked",
    condition,
    horses,
    tips,
    jockeys,
    tipCosts: rollTipOpenCosts(horses),
    revealedTips: [],
    prediction: null,
    predictionChanged: false,
    createdAt: new Date(),
  };
  prepared.set(id, race);
  return race;
}

export function getPreparedRace(id: string, userKey: number) {
  const race = prepared.get(id);
  if (!race || race.userKey !== userKey) return null;
  if (Date.now() - race.createdAt.getTime() > 30 * 60 * 1000) {
    prepared.delete(id);
    return null;
  }
  return race;
}

export function getRevealedTipCards(race: PreparedRace): TipCard[] {
  return race.tips.filter((t) => race.revealedTips.includes(t.horseNumber));
}

export function revealTip(
  id: string,
  userKey: number,
  horseNumber: number,
): { race: PreparedRace; tip: TipCard; already: boolean } | null {
  const race = getPreparedRace(id, userKey);
  if (!race) return null;

  const tip = race.tips.find((t) => t.horseNumber === horseNumber);
  if (!tip) return null;

  if (race.revealedTips.includes(horseNumber)) {
    return { race, tip, already: true };
  }

  race.revealedTips.push(horseNumber);
  return { race, tip, already: false };
}

export function setPrediction(id: string, userKey: number, horseNumber: number) {
  const race = getPreparedRace(id, userKey);
  if (!race) return null;
  if (race.prediction !== null) {
    if (race.predictionChanged) throw new Error("예상은 1회만 변경할 수 있어요.");
    race.predictionChanged = true;
  }
  race.prediction = horseNumber;
  return race;
}

export function consumePreparedRace(id: string, userKey: number) {
  const race = getPreparedRace(id, userKey);
  if (race) prepared.delete(id);
  return race;
}
