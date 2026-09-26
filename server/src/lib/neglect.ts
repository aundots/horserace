import { daysAbsentKst } from "./kst.js";

export type NeglectTier = 0 | 1 | 2 | 3 | 4 | 5;

export type NeglectState = {
  tier: NeglectTier;
  daysAbsent: number;
  rankedLocked: boolean;
  rehabProgress: number;
  finishTimePenaltyPct: number;
  weekendBuffMultiplier: number;
  fallChanceBonus: number;
};

export function computeNeglect(
  lastLoginAt: Date,
  createdAt: Date,
  rehabProgress: number,
  now = new Date(),
): NeglectState {
  const daysAbsent = daysAbsentKst(lastLoginAt, now);
  const accountAgeDays = daysAbsentKst(createdAt, now);
  const newbieShield = accountAgeDays < 7;

  if (newbieShield || daysAbsent <= 1) {
    return {
      tier: 0,
      daysAbsent,
      rankedLocked: false,
      rehabProgress,
      finishTimePenaltyPct: 0,
      weekendBuffMultiplier: 1,
      fallChanceBonus: 0,
    };
  }

  if (daysAbsent <= 3) {
    return {
      tier: 1,
      daysAbsent,
      rankedLocked: false,
      rehabProgress,
      finishTimePenaltyPct: 0,
      weekendBuffMultiplier: 1,
      fallChanceBonus: 0,
    };
  }

  if (daysAbsent <= 6) {
    return {
      tier: 2,
      daysAbsent,
      rankedLocked: false,
      rehabProgress,
      finishTimePenaltyPct: 2,
      weekendBuffMultiplier: 0.5,
      fallChanceBonus: 0,
    };
  }

  if (daysAbsent <= 13) {
    return {
      tier: 3,
      daysAbsent,
      rankedLocked: false,
      rehabProgress,
      finishTimePenaltyPct: 3,
      fallChanceBonus: 0.0002,
      weekendBuffMultiplier: 0.5,
    };
  }

  if (daysAbsent <= 20) {
    return {
      tier: 4,
      daysAbsent,
      rankedLocked: rehabProgress < 3,
      rehabProgress,
      finishTimePenaltyPct: 3,
      weekendBuffMultiplier: 0.5,
      fallChanceBonus: 0.0002,
    };
  }

  return {
    tier: 5,
    daysAbsent,
    rankedLocked: rehabProgress < 3,
    rehabProgress,
    finishTimePenaltyPct: 3,
    weekendBuffMultiplier: 0.5,
    fallChanceBonus: 0.0002,
  };
}
