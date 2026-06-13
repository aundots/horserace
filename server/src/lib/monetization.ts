import { isDevUser } from "./devAccess.js";
import { kstDateKey } from "./kst.js";

export const PLACEMENTS = {
  AD_GOLD_2X: { daily: 5, session: 2, cooldownMs: 90_000 },
  AD_STAMINA: { daily: 3, session: 2, cooldownMs: 90_000 },
  AD_RANK_TICKET: { daily: 15, session: 8, cooldownMs: 30_000 },
  AD_TRAIN: { daily: 2, session: 1, cooldownMs: 90_000 },
  AD_REVIVE: { daily: 1, session: 1, cooldownMs: 90_000 },
  AD_DAILY_CHEST: { daily: 1, session: 1, cooldownMs: 60_000 },
  AD_STREAK_SHIELD: { daily: 1, session: 1, cooldownMs: 60_000 },
  AD_WEEKEND_BOOST: { daily: 1, session: 1, cooldownMs: 60_000 },
  AD_PREDICTION_POINTS: { daily: 15, session: 10, cooldownMs: 30_000 },
  AD_RACE_CONTINUE: { daily: 15, session: 10, cooldownMs: 30_000 },
} as const;

export type PlacementId = keyof typeof PLACEMENTS;

export type AdUsageState = Record<
  string,
  { daily: number; dailyDate: string; session: number; sessionDate: string; lastMs: number }
>;

export function getAdEligibility(
  usage: AdUsageState,
  placement: PlacementId,
  accountDays: number,
  globalLastMs: number,
  userKey?: number,
) {
  const rules = PLACEMENTS[placement];
  const today = kstDateKey();
  const entry = usage[placement] ?? {
    daily: 0,
    dailyDate: today,
    session: 0,
    sessionDate: today,
    lastMs: 0,
  };

  if (entry.dailyDate !== today) {
    entry.daily = 0;
    entry.dailyDate = today;
  }
  if (entry.sessionDate !== today) {
    entry.session = 0;
    entry.sessionDate = today;
  }

  const dailyCap = accountDays < 1 ? Math.min(rules.daily, 5) : rules.daily;
  const globalCooldown = Date.now() - globalLastMs < 30_000;
  const placementCooldown = Date.now() - entry.lastMs < rules.cooldownMs;

  const eligible =
    (userKey !== undefined && isDevUser(userKey)) ||
    (entry.daily < dailyCap &&
      entry.session < rules.session &&
      !globalCooldown &&
      !placementCooldown);

  return {
    eligible,
    entry,
    remaining: {
      daily: Math.max(0, dailyCap - entry.daily),
      session: Math.max(0, rules.session - entry.session),
    },
    reason: !eligible
      ? globalCooldown || placementCooldown
        ? "쿨다운 중이에요."
        : "오늘 시청 한도에 도달했어요."
      : null,
  };
}

export function recordAdWatch(usage: AdUsageState, placement: PlacementId) {
  const today = kstDateKey();
  const entry = usage[placement] ?? {
    daily: 0,
    dailyDate: today,
    session: 0,
    sessionDate: today,
    lastMs: 0,
  };
  if (entry.dailyDate !== today) {
    entry.daily = 0;
    entry.dailyDate = today;
  }
  entry.daily += 1;
  entry.session += 1;
  entry.lastMs = Date.now();
  usage[placement] = entry;
  return entry;
}

export const PLACEMENT_REWARDS: Record<
  PlacementId,
  { type: string; amount?: number; multiplier?: number }
> = {
  AD_GOLD_2X: { type: "gold_multiplier", multiplier: 2 },
  AD_STAMINA: { type: "stamina", amount: 3 },
  AD_RANK_TICKET: { type: "rank_ticket", amount: 1 },
  AD_TRAIN: { type: "train", amount: 1 },
  AD_REVIVE: { type: "revive", amount: 1 },
  AD_DAILY_CHEST: { type: "gold", amount: 50 },
  AD_STREAK_SHIELD: { type: "streak_shield", amount: 1 },
  AD_WEEKEND_BOOST: { type: "weekend_boost", amount: 5 },
  AD_PREDICTION_POINTS: { type: "prediction_points", amount: 4 },
  AD_RACE_CONTINUE: { type: "race_continue", amount: 4 },
};
