import { kstDateKey } from "./kst.js";

/** playerStore와 순환 참조 방지 — 필드만 사용 */
export type RaceLoopPlayer = {
  sessionRaceStreak: number;
  freeTipReveals: number;
  rankedRacesToday: number;
  rankedRacesDate: string;
  dailyChallengeClaimed: boolean;
};

export const STREAK_BONUS_EVERY = 3;
export const DAILY_RACE_GOAL = 5;
export const DAILY_RACE_GOLD = 80;

export type RaceLoopBonus = {
  sessionRaceStreak: number;
  streakBonus: boolean;
  freeTipReveals: number;
  rankedRacesToday: number;
  dailyRaceGoal: number;
  dailyChallengeComplete: boolean;
  dailyChallengeGold: number;
};

function refreshRaceDay(player: RaceLoopPlayer, today = kstDateKey()) {
  if (player.rankedRacesDate !== today) {
    player.rankedRacesDate = today;
    player.rankedRacesToday = 0;
    player.dailyChallengeClaimed = false;
  }
}

export function migrateRaceLoopFields(player: RaceLoopPlayer) {
  if (typeof player.sessionRaceStreak !== "number") player.sessionRaceStreak = 0;
  if (typeof player.freeTipReveals !== "number") player.freeTipReveals = 0;
  if (typeof player.rankedRacesToday !== "number") player.rankedRacesToday = 0;
  if (!player.rankedRacesDate) player.rankedRacesDate = kstDateKey();
  if (typeof player.dailyChallengeClaimed !== "boolean") player.dailyChallengeClaimed = false;
}

export function resetSessionRaceStreak(player: RaceLoopPlayer) {
  player.sessionRaceStreak = 0;
}

export function onRankedRaceComplete(player: RaceLoopPlayer): RaceLoopBonus {
  refreshRaceDay(player);
  player.sessionRaceStreak += 1;
  player.rankedRacesToday += 1;

  let streakBonus = false;
  if (player.sessionRaceStreak > 0 && player.sessionRaceStreak % STREAK_BONUS_EVERY === 0) {
    player.freeTipReveals += 1;
    streakBonus = true;
  }

  let dailyChallengeComplete = false;
  let dailyChallengeGold = 0;
  if (
    player.rankedRacesToday >= DAILY_RACE_GOAL &&
    !player.dailyChallengeClaimed
  ) {
    player.dailyChallengeClaimed = true;
    dailyChallengeGold = DAILY_RACE_GOLD;
    dailyChallengeComplete = true;
  }

  return {
    sessionRaceStreak: player.sessionRaceStreak,
    streakBonus,
    freeTipReveals: player.freeTipReveals,
    rankedRacesToday: player.rankedRacesToday,
    dailyRaceGoal: DAILY_RACE_GOAL,
    dailyChallengeComplete,
    dailyChallengeGold,
  };
}

export function raceLoopSnapshot(player: RaceLoopPlayer) {
  refreshRaceDay(player);
  return {
    sessionRaceStreak: player.sessionRaceStreak,
    freeTipReveals: player.freeTipReveals,
    rankedRacesToday: player.rankedRacesToday,
    dailyRaceGoal: DAILY_RACE_GOAL,
    dailyChallengeClaimed: player.dailyChallengeClaimed,
    dailyChallengeGold: DAILY_RACE_GOLD,
  };
}
