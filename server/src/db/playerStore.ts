import { randomUUID } from "node:crypto";
import type { DivisionTier, League } from "../lib/division.js";
import type { AdUsageState } from "../lib/monetization.js";
import { computeNeglect } from "../lib/neglect.js";
import {
  attendanceReward,
  checkPokedexUnlocks,
  isNewbieShield,
  streakGoldReward,
  updateStreak,
} from "../lib/retention.js";
import type { Condition, DistanceApt, PaceType, TrackState } from "../lib/raceSim.js";
import type { HorseCoatId } from "../lib/horseCoat.js";
import { STAT_BUDGET, type HorseCustomizeInput } from "../lib/horseBuild.js";
import { defaultCoatForUser, ensureHorseCoat, randomCoat } from "../lib/horseCoat.js";
import { rankedTicketGoldPrice } from "../lib/economy.js";
import { migrateRaceLoopFields, raceLoopSnapshot, resetSessionRaceStreak } from "../lib/raceLoop.js";
import { freshPass, syncPassWeek, type WeeklyPassState } from "../lib/weeklyPass.js";
import { isDevUser } from "../lib/devAccess.js";
import { isPlayDemoUser, PLAY_DEMO_RANKED_TICKETS_DAILY } from "../lib/playDemo.js";
import { daysAbsentKst, kstDateKey, kstWeekId, nowKst } from "../lib/kst.js";

export type HorseProfile = {
  id: string;
  name: string;
  speed: number;
  stamina: number;
  accel: number;
  pace: PaceType;
  trackApt: TrackState;
  distanceApt: DistanceApt;
  condition: Condition;
  fatigue: number;
  coat: HorseCoatId;
};

export type PlayerState = {
  userKey: number;
  gold: number;
  raceStamina: number;
  raceStaminaUpdatedAt: Date;
  rankedTicketsUsed: number;
  rankedTicketsBought: number;
  adRankedTickets: number;
  rankedTicketsDate: string;
  practiceCountToday: number;
  practiceDate: string;
  trainUsed: number;
  feedUsed: number;
  restUsed: number;
  actionDate: string;
  weekendBuffPct: number;
  weekendBoostPct: number;
  weeklyScores: number[];
  weekId: string;
  totalRaces: number;
  horse: HorseProfile;
  rehabProgress: number;
  createdAt: Date;
  lastLoginAt: Date;
  streak: number;
  lastStreakDate: string;
  streakShieldUsedWeek: string;
  attendanceIndex: number;
  attendanceLastClaim: string;
  pokedexUnlocks: string[];
  predictionPoints: number;
  predictionWins: number;
  hitBoxesToday: number;
  hitBoxDate: string;
  weeklyPass: WeeklyPassState;
  inventory: Record<string, number>;
  divisionTier: DivisionTier;
  league: League;
  adUsage: AdUsageState;
  globalAdLastMs: number;
  lastRaceGold: number;
  pendingRevive: boolean;
  welcomeBack: boolean;
  /** 훈련·먹이로 획득한 추가 스탯 배분 포인트 */
  statBonusEarned: number;
  /** 홈 복귀 전 연속 경주 수 */
  sessionRaceStreak: number;
  /** 연속 보너스로 받은 무료 찌라시 */
  freeTipReveals: number;
  rankedRacesToday: number;
  rankedRacesDate: string;
  dailyChallengeClaimed: boolean;
};

const players = new Map<number, PlayerState>();

const STAMINA_MAX = 8;
const STAMINA_RECOVER_MS = 25 * 60 * 1000;
/** 무료 티켓 — 추가 경주는 광고로 */
const RANKED_TICKETS_DAILY = 1;
const RANKED_BUY_DAILY = 0;
const TRAIN_DAILY = 3;
const DEV_RANKED_TICKETS = 999;

function rankedTicketsDailyFree(userKey: number): number {
  if (isPlayDemoUser(userKey)) return PLAY_DEMO_RANKED_TICKETS_DAILY;
  return RANKED_TICKETS_DAILY;
}

function randomPick<T>(items: T[]): T {
  return items[Math.floor(Math.random() * items.length)];
}

function createHorse(name = "내 말", coat: HorseCoatId = randomCoat()): HorseProfile {
  return {
    id: randomUUID(),
    name,
    speed: 48 + Math.floor(Math.random() * 8),
    stamina: 48 + Math.floor(Math.random() * 8),
    accel: 48 + Math.floor(Math.random() * 8),
    pace: randomPick(["FRONT", "STALKER", "MID", "CLOSER"] as PaceType[]),
    trackApt: randomPick(["DRY", "WET", "HEAVY"] as TrackState[]),
    distanceApt: randomPick(["SPRINT", "MIDDLE", "LONG"] as DistanceApt[]),
    condition: "GOOD",
    fatigue: 0,
    coat,
  };
}

function migrateHorseCoat(player: PlayerState) {
  player.horse.coat = ensureHorseCoat(
    player.horse.coat,
    defaultCoatForUser(player.userKey),
  );
}

function migrateStatBonus(player: PlayerState) {
  if (typeof player.statBonusEarned !== "number") {
    const sum =
      player.horse.speed + player.horse.stamina + player.horse.accel;
    player.statBonusEarned = Math.max(0, sum - STAT_BUDGET);
  }
}

function refreshDailyCounters(player: PlayerState, now = new Date()) {
  const today = kstDateKey(now);
  if (player.actionDate !== today) {
    player.actionDate = today;
    player.trainUsed = 0;
    player.feedUsed = 0;
    player.restUsed = 0;
  }
  if (player.practiceDate !== today) {
    player.practiceDate = today;
    player.practiceCountToday = 0;
  }
  if (player.rankedTicketsDate !== today) {
    player.rankedTicketsDate = today;
    player.rankedTicketsUsed = 0;
    player.rankedTicketsBought = 0;
    player.adRankedTickets = 0;
  }
  if (player.hitBoxDate !== today) {
    player.hitBoxDate = today;
    player.hitBoxesToday = 0;
  }
  const weekId = kstWeekId(now);
  if (player.weekId !== weekId) {
    player.weekId = weekId;
    player.weeklyScores = [];
  }
  syncPassWeek(player.weeklyPass);
}

function refreshRaceStamina(player: PlayerState, now = new Date()) {
  const elapsed = now.getTime() - player.raceStaminaUpdatedAt.getTime();
  const gained = Math.floor(elapsed / STAMINA_RECOVER_MS);
  if (gained > 0) {
    player.raceStamina = Math.min(STAMINA_MAX, player.raceStamina + gained);
    player.raceStaminaUpdatedAt = new Date(
      player.raceStaminaUpdatedAt.getTime() + gained * STAMINA_RECOVER_MS,
    );
  }
}

export function getOrCreatePlayer(userKey: number): PlayerState {
  let player = players.get(userKey);
  const now = new Date();

  if (!player) {
    const today = kstDateKey(now);
    player = {
      userKey,
      gold: 200,
      raceStamina: STAMINA_MAX,
      raceStaminaUpdatedAt: now,
      rankedTicketsUsed: 0,
      rankedTicketsBought: 0,
      adRankedTickets: 0,
      rankedTicketsDate: today,
      practiceCountToday: 0,
      practiceDate: today,
      trainUsed: 0,
      feedUsed: 0,
      restUsed: 0,
      actionDate: today,
      weekendBuffPct: 0,
      weekendBoostPct: 0,
      weeklyScores: [],
      weekId: kstWeekId(now),
      totalRaces: 0,
      horse: createHorse("내 말", defaultCoatForUser(userKey)),
      rehabProgress: 0,
      createdAt: now,
      lastLoginAt: now,
      streak: 1,
      lastStreakDate: today,
      streakShieldUsedWeek: "",
      attendanceIndex: 0,
      attendanceLastClaim: "",
      pokedexUnlocks: [],
      predictionPoints: 5,
      predictionWins: 0,
      hitBoxesToday: 0,
      hitBoxDate: today,
      weeklyPass: freshPass(),
      inventory: {},
      divisionTier: 1,
      league: "ROOKIE",
      adUsage: {},
      globalAdLastMs: 0,
      lastRaceGold: 0,
      pendingRevive: false,
      welcomeBack: false,
      statBonusEarned: 0,
      sessionRaceStreak: 0,
      freeTipReveals: 0,
      rankedRacesToday: 0,
      rankedRacesDate: today,
      dailyChallengeClaimed: false,
    };
    players.set(userKey, player);
    return player;
  }

  refreshDailyCounters(player, now);
  refreshRaceStamina(player, now);
  migrateHorseCoat(player);
  migrateStatBonus(player);
  migrateRaceLoopFields(player);
  return player;
}


export function syncPlayerSession(player: PlayerState) {
  refreshDailyCounters(player);
  refreshRaceStamina(player);

  const today = kstDateKey();
  const lastDay = kstDateKey(player.lastLoginAt);

  const streakUpdate = updateStreak(player.streak, player.lastStreakDate, today);
  if (lastDay !== today) {
    player.streak = streakUpdate.streak;
    player.lastStreakDate = today;
    player.weeklyPass.loginDays += 1;
    addGold(player, streakGoldReward(player.streak));
  }

  if (lastDay === today) return;

  const absent = daysAbsentKst(player.lastLoginAt);

  if (absent >= 7 && absent < 14) {
    player.gold += 100;
    player.raceStamina = STAMINA_MAX;
    player.raceStaminaUpdatedAt = new Date();
    player.welcomeBack = true;
  }

  if (absent >= 2 && absent <= 3) {
    player.horse.fatigue = Math.min(100, player.horse.fatigue + 25);
    if (player.horse.condition === "GREAT") player.horse.condition = "GOOD";
  } else if (absent >= 4 && absent <= 6) {
    player.horse.condition = "POOR";
    player.weekendBuffPct = Math.floor(player.weekendBuffPct * 0.5);
  } else if (absent >= 7) {
    player.horse.condition = "POOR";
    player.weekendBuffPct = Math.floor(player.weekendBuffPct * 0.5);
    player.rehabProgress = 0;
  }

  player.lastLoginAt = new Date();
}

export function playerToHorseRace(player: PlayerState) {
  const neglect = computeNeglect(
    player.lastLoginAt,
    player.createdAt,
    player.rehabProgress,
  );
  const buffPct =
    Math.round(
      (player.weekendBuffPct + player.weekendBoostPct) *
        neglect.weekendBuffMultiplier *
        10,
    ) / 10;

  return {
    number: 1,
    name: player.horse.name,
    isPlayer: true,
    isGhost: false,
    speed: player.horse.speed,
    stamina: player.horse.stamina,
    accel: player.horse.accel,
    pace: player.horse.pace,
    trackApt: player.horse.trackApt,
    distanceApt: player.horse.distanceApt,
    condition: player.horse.condition,
    fatigue: player.horse.fatigue,
    weekendBuffPct: buffPct,
    coat: player.horse.coat,
  };
}

export function getWeeklyRankScore(player: PlayerState) {
  if (player.weeklyScores.length === 0) return 0;
  const sorted = [...player.weeklyScores].sort((a, b) => b - a);
  if (sorted.length === 1) return sorted[0];
  return Math.round((sorted[0] + sorted[1]) / 2);
}

/** @deprecated 디비전·주간 랭킹 비활성화 */
export function recordWeeklyScore(_player: PlayerState, _score: number) {}

export function canPractice(player: PlayerState) {
  refreshRaceStamina(player);
  return player.raceStamina > 0;
}

export function spendPracticeStamina(player: PlayerState) {
  player.raceStamina -= 1;
  player.practiceCountToday += 1;
  player.totalRaces += 1;
  player.weeklyPass.practiceRuns += 1;
  unlockPokedex(player);
}

export function totalRankedTickets(player: PlayerState) {
  if (isDevUser(player.userKey)) return DEV_RANKED_TICKETS;
  return rankedTicketsDailyFree(player.userKey) + player.rankedTicketsBought + player.adRankedTickets;
}

export function rankedTicketsUsedTotal(player: PlayerState) {
  return player.rankedTicketsUsed;
}

export function canRanked(player: PlayerState) {
  refreshDailyCounters(player);
  if (isDevUser(player.userKey)) return { ok: true as const };
  if (player.rankedTicketsUsed >= totalRankedTickets(player)) {
    return {
      ok: false,
      reason: "경주 티켓이 없어요. 광고를 보면 티켓을 받고 바로 이어서 달릴 수 있어요.",
    };
  }
  return { ok: true as const };
}

export function spendRankedTicket(player: PlayerState) {
  player.rankedTicketsUsed += 1;
  player.totalRaces += 1;
  player.weeklyPass.rankedRuns += 1;
  player.weekendBoostPct = 0;
  unlockPokedex(player);
}

export function buyRankedTicket(player: PlayerState) {
  refreshDailyCounters(player);
  if (RANKED_BUY_DAILY <= 0) {
    throw new Error("티켓은 광고 시청으로 받을 수 있어요.");
  }
  if (player.rankedTicketsBought >= RANKED_BUY_DAILY) {
    throw new Error("오늘 골드 구매 한도에 도달했어요.");
  }
  const price = rankedTicketGoldPrice(player.rankedTicketsBought);
  if (player.gold < price) throw new Error(`골드가 부족해요. (${price}G 필요)`);
  player.gold -= price;
  player.rankedTicketsBought += 1;
  return price;
}

export function setHorseCoat(player: PlayerState, coat: HorseCoatId) {
  player.horse.coat = coat;
}

export function updateHorseBuild(
  player: PlayerState,
  build: Required<HorseCustomizeInput>,
) {
  player.horse.name = build.name;
  player.horse.coat = build.coat;
  player.horse.pace = build.pace;
  player.horse.trackApt = build.trackApt;
  player.horse.distanceApt = build.distanceApt;
  player.horse.speed = build.speed;
  player.horse.stamina = build.stamina;
  player.horse.accel = build.accel;
}

export function trainHorse(player: PlayerState) {
  refreshDailyCounters(player);
  if (player.trainUsed >= TRAIN_DAILY) {
    throw new Error("오늘 훈련 횟수를 모두 사용했어요.");
  }
  player.statBonusEarned += 1;
  player.horse.fatigue = Math.min(100, player.horse.fatigue + 8);
  player.weekendBuffPct = Math.min(15, player.weekendBuffPct + 1);
  player.trainUsed += 1;
  player.weeklyPass.trainCount += 1;
  if (player.horse.fatigue < 30 && player.horse.condition === "POOR") {
    player.horse.condition = "GOOD";
  }
}

export function feedHorse(player: PlayerState) {
  refreshDailyCounters(player);
  if (player.feedUsed >= 1) throw new Error("오늘 먹이는 이미 줬어요.");
  player.horse.fatigue = Math.max(0, player.horse.fatigue - 10);
  if (player.horse.condition === "POOR") player.horse.condition = "GOOD";
  player.statBonusEarned += 1;
  player.feedUsed += 1;
  if (player.rehabProgress < 3) player.rehabProgress += 1;
}

export function restHorse(player: PlayerState) {
  refreshDailyCounters(player);
  if (player.restUsed >= 1) throw new Error("오늘 휴식은 이미 했어요.");
  player.horse.fatigue = Math.max(0, player.horse.fatigue - 30);
  player.horse.condition = "GOOD";
  player.restUsed += 1;
  if (player.rehabProgress < 3) player.rehabProgress += 1;
}

export function spendPredictionPoints(player: PlayerState, amount: number) {
  if (player.predictionPoints < amount) {
    throw new Error(`예상 포인트가 부족해요. (${amount}P 필요)`);
  }
  player.predictionPoints -= amount;
}

export function addPredictionPoints(player: PlayerState, amount: number) {
  player.predictionPoints += amount;
}

export function addGold(player: PlayerState, amount: number) {
  player.gold += amount;
}

export function addInventory(player: PlayerState, itemId: string, qty = 1) {
  player.inventory[itemId] = (player.inventory[itemId] ?? 0) + qty;
}

export function spendInventory(player: PlayerState, itemId: string, qty = 1) {
  const have = player.inventory[itemId] ?? 0;
  if (have < qty) throw new Error("아이템이 부족해요.");
  player.inventory[itemId] = have - qty;
}

export function claimAttendance(player: PlayerState) {
  const today = kstDateKey();
  if (player.attendanceLastClaim === today) {
    throw new Error("오늘은 이미 출석했어요.");
  }
  const reward = attendanceReward(player.attendanceIndex);
  player.attendanceLastClaim = today;
  player.attendanceIndex = Math.min(27, player.attendanceIndex + 1);
  addGold(player, reward.gold);
  return reward;
}

export function unlockPokedex(
  player: PlayerState,
  extras?: { rankTop3?: boolean; predictWin?: boolean },
) {
  const newIds = checkPokedexUnlocks({
    totalRaces: player.totalRaces,
    streak: player.streak,
    rankTop3: extras?.rankTop3 ?? false,
    predictionWins: extras?.predictWin ?? player.predictionWins > 0,
    unlocked: player.pokedexUnlocks,
  });
  for (const id of newIds) {
    if (!player.pokedexUnlocks.includes(id)) player.pokedexUnlocks.push(id);
  }
  return newIds;
}

export function getPlayerSnapshot(player: PlayerState) {
  refreshDailyCounters(player);
  refreshRaceStamina(player);
  const neglect = computeNeglect(
    player.lastLoginAt,
    player.createdAt,
    player.rehabProgress,
  );
  const ranked = canRanked(player);
  const newbie = isNewbieShield(player.createdAt);
  const ticketPrice = rankedTicketGoldPrice(player.rankedTicketsBought);

  return {
    gold: player.gold,
    raceStamina: player.raceStamina,
    raceStaminaMax: STAMINA_MAX,
    rankedTicketsLeft: Math.max(0, totalRankedTickets(player) - player.rankedTicketsUsed),
    rankedTicketsMax: totalRankedTickets(player),
    rankedTicketsFree: rankedTicketsDailyFree(player.userKey),
    rankedTicketBuyPrice: ticketPrice,
    rankedTicketsBoughtLeft: RANKED_BUY_DAILY - player.rankedTicketsBought,
    practiceCountToday: player.practiceCountToday,
    weekendBuffPct: player.weekendBuffPct,
    weeklyRankScore: 0,
    isWeekend: true,
    rankedAvailable: ranked.ok,
    careEnabled: false,
    rankedMessage: ranked.ok ? null : ranked.reason,
    newbieShield: newbie,
    welcomeBack: player.welcomeBack,
    neglect: {
      tier: neglect.tier,
      daysAbsent: neglect.daysAbsent,
      rankedLocked: neglect.rankedLocked,
      rehabProgress: player.rehabProgress,
      rehabTarget: 3,
    },
    statBonusEarned: player.statBonusEarned,
    trainLeft: TRAIN_DAILY - player.trainUsed,
    feedLeft: 1 - player.feedUsed,
    restLeft: 1 - player.restUsed,
    totalRaces: player.totalRaces,
    horse: player.horse,
    streak: player.streak,
    attendanceIndex: player.attendanceIndex,
    attendanceClaimedToday: player.attendanceLastClaim === kstDateKey(),
    pokedexUnlocks: player.pokedexUnlocks,
    predictionPoints: player.predictionPoints,
    hitBoxesLeft: Math.max(0, 3 - player.hitBoxesToday),
    inventory: player.inventory,
    division: null,
    ...raceLoopSnapshot(player),
    freePath: {
      practice: player.raceStamina,
      ranked: Math.max(0, rankedTicketsDailyFree(player.userKey) - player.rankedTicketsUsed),
    },
    kstNow: nowKst().toISOString(),
  };
}

export function getPlayerState(userKey: number) {
  return players.get(userKey) ?? null;
}

export function replacePlayerState(userKey: number, state: PlayerState) {
  players.set(userKey, state);
}
