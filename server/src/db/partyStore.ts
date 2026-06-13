import { randomInt } from "node:crypto";
import type { JockeyInfo } from "../lib/jockey.js";
import type { RaceEvent } from "../lib/raceSim.js";
import { PARTY_TIPS_PER_RACE, placePoints } from "../lib/partyScoring.js";
import { buildEntrants, buildRaceField } from "../lib/raceField.js";
import {
  randomRaceCondition,
  simulateRace,
  type RaceCondition,
  type RaceHorse,
} from "../lib/raceSim.js";
import { generateTipsForAllHorses, resolvePrediction, type TipCard } from "../lib/tips.js";

export type PartyStatus = "waiting" | "picking" | "racing" | "done";

export type PartyMember = {
  userKey: number;
  displayName: string;
  prediction: number | null;
  revealedTips: number[];
  totalScore: number;
};

export type PartyClientResult = {
  raceNumber: number;
  finishOrder: number[];
  entrants: ReturnType<typeof buildEntrants>;
  condition: RaceCondition;
  timeline: ReturnType<typeof simulateRace>["timeline"];
  overtakes: number;
  memberResults: {
    userKey: number;
    displayName: string;
    pick: number | null;
    place: number;
    racePoints: number;
    totalScore: number;
    hit: "win" | "place" | "miss" | "none";
    dnf?: boolean;
    dnfReason?: "fall" | "interference";
  }[];
  raceEvents?: RaceEvent[];
};

export type PartyRoom = {
  code: string;
  hostUserKey: number;
  members: PartyMember[];
  status: PartyStatus;
  raceNumber: number;
  condition: RaceCondition | null;
  horses: RaceHorse[];
  jockeys: Record<number, JockeyInfo>;
  tips: TipCard[];
  clientResult: PartyClientResult | null;
  createdAt: Date;
};

const rooms = new Map<string, PartyRoom>();
const userParty = new Map<number, string>();

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const MAX_MEMBERS = 8;
const TTL_MS = 2 * 60 * 60 * 1000;

function genCode(): string {
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += CODE_CHARS[randomInt(CODE_CHARS.length)];
  }
  return rooms.has(code) ? genCode() : code;
}

function defaultName(userKey: number) {
  return `플레이어${String(userKey).slice(-4)}`;
}

function newMember(userKey: number, displayName?: string): PartyMember {
  return {
    userKey,
    displayName: displayName?.trim() || defaultName(userKey),
    prediction: null,
    revealedTips: [],
    totalScore: 0,
  };
}

function purgeExpired() {
  const now = Date.now();
  for (const [code, room] of rooms) {
    if (now - room.createdAt.getTime() > TTL_MS) {
      for (const m of room.members) userParty.delete(m.userKey);
      rooms.delete(code);
    }
  }
}

function partyPickEntrants(room: PartyRoom) {
  return buildEntrants(room.horses, room.jockeys).map((e) => ({
    number: e.number,
    coat: e.coat,
    silkHue: e.silkHue,
    name: e.name,
    speed: 0,
    stamina: 0,
    accel: 0,
    pace: "",
    trackApt: "",
    distanceApt: "",
    condition: "",
    jockeyName: "",
    jockeyWeight: 0,
    jockeyWinRate: 0,
    jockeyTier: "",
    isGhost: e.isGhost,
  }));
}

export function serializeParty(room: PartyRoom, viewerKey: number) {
  const viewer = room.members.find((m) => m.userKey === viewerKey);
  const isPicking = room.status === "picking";

  const takenNumbers = isPicking
    ? room.members
        .filter((m) => m.userKey !== viewerKey && m.prediction != null)
        .map((m) => m.prediction!)
    : [];

  const revealedTips = viewer?.revealedTips ?? [];
  const revealedTipCards = room.tips.filter((t) => revealedTips.includes(t.horseNumber));

  return {
    code: room.code,
    hostUserKey: room.hostUserKey,
    isHost: room.hostUserKey === viewerKey,
    status: room.status,
    raceNumber: room.raceNumber,
    members: room.members.map((m) => ({
      userKey: m.userKey,
      displayName: m.displayName,
      totalScore: m.totalScore,
      isYou: m.userKey === viewerKey,
      prediction:
        isPicking && m.userKey !== viewerKey ? null : m.prediction,
      pickConfirmed: isPicking && m.userKey !== viewerKey && m.prediction != null,
    })),
    condition: room.condition,
    entrants:
      room.status !== "waiting"
        ? isPicking
          ? partyPickEntrants(room)
          : buildEntrants(room.horses, room.jockeys)
        : null,
    takenNumbers,
    tipsRemaining: Math.max(0, PARTY_TIPS_PER_RACE - revealedTips.length),
    revealedTipCards,
    clientResult: room.clientResult,
  };
}

export function createParty(userKey: number, displayName?: string) {
  purgeExpired();
  const existing = userParty.get(userKey);
  if (existing) leaveParty(userKey);

  const code = genCode();
  const room: PartyRoom = {
    code,
    hostUserKey: userKey,
    members: [newMember(userKey, displayName)],
    status: "waiting",
    raceNumber: 0,
    condition: null,
    horses: [],
    jockeys: {},
    tips: [],
    clientResult: null,
    createdAt: new Date(),
  };
  rooms.set(code, room);
  userParty.set(userKey, code);
  return room;
}

export function joinParty(userKey: number, code: string, displayName?: string) {
  purgeExpired();
  const room = rooms.get(code.toUpperCase());
  if (!room) throw new Error("방 코드를 찾을 수 없어요.");
  if (room.status !== "waiting") throw new Error("이미 시작된 방이에요.");
  if (room.members.length >= MAX_MEMBERS) throw new Error("방이 가득 찼어요.");

  const existing = userParty.get(userKey);
  if (existing && existing !== room.code) leaveParty(userKey);

  if (!room.members.some((m) => m.userKey === userKey)) {
    room.members.push(newMember(userKey, displayName));
  }
  userParty.set(userKey, room.code);
  return room;
}

export function leaveParty(userKey: number) {
  const code = userParty.get(userKey);
  if (!code) return;
  const room = rooms.get(code);
  if (!room) {
    userParty.delete(userKey);
    return;
  }
  room.members = room.members.filter((m) => m.userKey !== userKey);
  userParty.delete(userKey);
  if (room.members.length === 0) {
    rooms.delete(code);
    return;
  }
  if (room.hostUserKey === userKey) {
    room.hostUserKey = room.members[0]!.userKey;
  }
}

export function getPartyForUser(userKey: number) {
  purgeExpired();
  const code = userParty.get(userKey);
  if (!code) return null;
  return rooms.get(code) ?? null;
}

export function getParty(code: string) {
  purgeExpired();
  return rooms.get(code.toUpperCase()) ?? null;
}

export function prepareParty(userKey: number, anchor: { speed: number; stamina: number; accel: number }) {
  const room = getPartyForUser(userKey);
  if (!room) throw new Error("참여 중인 방이 없어요.");
  if (room.hostUserKey !== userKey) throw new Error("방장만 경주를 준비할 수 있어요.");
  if (room.status !== "waiting" && room.status !== "done") {
    throw new Error("지금은 새 경주를 준비할 수 없어요.");
  }

  const condition = randomRaceCondition();
  const { horses, jockeys } = buildRaceField(anchor);
  room.condition = condition;
  room.horses = horses;
  room.jockeys = jockeys;
  room.tips = generateTipsForAllHorses(horses, condition, {
    trapEnabled: true,
    trainedToday: false,
  });
  room.raceNumber += 1;
  room.status = "picking";
  for (const m of room.members) {
    m.prediction = null;
    m.revealedTips = [];
  }
  room.clientResult = null;
  return room;
}

export function setPartyPrediction(userKey: number, horseNumber: number) {
  const room = getPartyForUser(userKey);
  if (!room) throw new Error("참여 중인 방이 없어요.");
  if (room.status !== "picking") throw new Error("지금은 선택할 수 없어요.");

  const member = room.members.find((m) => m.userKey === userKey);
  if (!member) throw new Error("방 멤버가 아니에요.");

  const num = Number(horseNumber);
  if (!room.horses.some((h) => h.number === num)) {
    throw new Error("유효하지 않은 말 번호예요.");
  }

  const taken = room.members.find(
    (m) => m.userKey !== userKey && m.prediction === num,
  );
  if (taken) {
    throw new Error(`${num}번은 이미 다른 친구가 선택했어요.`);
  }

  member.prediction = num;
  return room;
}

export function revealPartyTip(userKey: number, horseNumber: number) {
  const room = getPartyForUser(userKey);
  if (!room) throw new Error("참여 중인 방이 없어요.");
  if (room.status !== "picking") throw new Error("지금은 찌라시를 볼 수 없어요.");

  const member = room.members.find((m) => m.userKey === userKey);
  if (!member) throw new Error("방 멤버가 아니에요.");

  const num = Number(horseNumber);
  const tip = room.tips.find((t) => t.horseNumber === num);
  if (!tip) throw new Error("유효하지 않은 말 번호예요.");

  if (member.revealedTips.includes(num)) {
    return { room, tip, already: true };
  }

  if (member.revealedTips.length >= PARTY_TIPS_PER_RACE) {
    throw new Error(`찌라시는 경기당 ${PARTY_TIPS_PER_RACE}장까지만 볼 수 있어요.`);
  }

  member.revealedTips.push(num);
  return { room, tip, already: false };
}

export function runPartyRace(userKey: number) {
  const room = getPartyForUser(userKey);
  if (!room) throw new Error("참여 중인 방이 없어요.");
  if (room.hostUserKey !== userKey) throw new Error("방장만 경주를 시작할 수 있어요.");
  if (room.status !== "picking") throw new Error("아직 선택 단계가 아니에요.");
  if (!room.condition || room.horses.length === 0) throw new Error("경주가 준비되지 않았어요.");

  const unpicked = room.members.filter((m) => m.prediction == null);
  if (unpicked.length > 0) {
    throw new Error(`${unpicked.map((m) => m.displayName).join(", ")}님 선택 대기 중`);
  }

  const picks = room.members.map((m) => m.prediction!);
  if (new Set(picks).size !== picks.length) {
    throw new Error("같은 말을 고른 친구가 있어요. 번호를 바꿔 주세요.");
  }

  room.status = "racing";
  const sim = simulateRace(room.horses, room.condition, { finishTimePenaltyPct: 0, fallChanceBonus: 0 }, {});
  const entrants = buildEntrants(room.horses, room.jockeys);

  const memberResults = room.members.map((m) => {
    const pick = m.prediction;
    if (pick == null) {
      return {
        userKey: m.userKey,
        displayName: m.displayName,
        pick: null,
        place: 0,
        racePoints: 0,
        totalScore: m.totalScore,
        hit: "none" as const,
      };
    }
    const place = sim.finishOrder.indexOf(pick) + 1;
    const racePoints = placePoints(place);
    m.totalScore += racePoints;
    const hit = resolvePrediction(pick, sim.finishOrder).hit;
    const horseDnf = Boolean(sim.dnf[pick]);
    return {
      userKey: m.userKey,
      displayName: m.displayName,
      pick,
      place,
      racePoints,
      totalScore: m.totalScore,
      hit,
      dnf: horseDnf,
      dnfReason: sim.dnfReasons[pick],
    };
  });

  room.clientResult = {
    raceNumber: room.raceNumber,
    finishOrder: sim.finishOrder,
    entrants,
    condition: room.condition,
    timeline: sim.timeline,
    overtakes: sim.overtakes,
    raceEvents: sim.raceEvents,
    memberResults,
  };
  room.status = "done";
  for (const m of room.members) {
    m.prediction = null;
  }
  return room;
}
