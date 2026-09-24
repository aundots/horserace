import { allRoomsForSettlement, tierName } from "../lib/division.js";
import { kstWeekId } from "../lib/kst.js";

export type SettlementReward = {
  userKey: number;
  rank: number;
  tier: number;
  gold: number;
  title?: string;
};

const TIER_GOLD_MULT = [1, 1, 1.1, 1.25, 1.5];

export function settleWeek(weekId?: string): SettlementReward[] {
  const targetWeek = weekId ?? kstWeekId();
  const rewards: SettlementReward[] = [];

  for (const room of allRoomsForSettlement(targetWeek)) {
    if (room.members.length < 5) continue;

    const mult = TIER_GOLD_MULT[room.tier - 1] ?? 1;
    room.members.forEach((member, index) => {
      const rank = index + 1;
      let gold = 0;
      let title: string | undefined;

      if (rank <= 3) {
        gold = Math.round([500, 300, 150][rank - 1] * mult);
        title = `${tierName(room.tier as 1)} ${rank}위`;
      } else if (rank <= 10) {
        gold = Math.round(50 * mult);
      }

      if (gold > 0) {
        rewards.push({
          userKey: member.userKey,
          rank,
          tier: room.tier,
          gold,
          title,
        });
      }
    });
  }

  return rewards;
}

let settlementTimer: ReturnType<typeof setInterval> | null = null;
const pendingRewards = new Map<number, SettlementReward>();

export function startSettlementScheduler(
  onSettle?: (rewards: SettlementReward[]) => void,
) {
  if (settlementTimer) return;

  settlementTimer = setInterval(() => {
    const now = new Date();
    const kstHour = (now.getUTCHours() + 9) % 24;
    const kstDay = new Date(now.getTime() + 9 * 60 * 60 * 1000).getUTCDay();

    // Sunday 22:10 KST
    if (kstDay === 0 && kstHour === 22 && now.getMinutes() >= 10 && now.getMinutes() < 11) {
      const rewards = settleWeek();
      for (const r of rewards) {
        pendingRewards.set(r.userKey, r);
      }
      onSettle?.(rewards);
      console.log(`[settlement] ${rewards.length} rewards for week ${kstWeekId()}`);
    }
  }, 60_000);
}

export function claimPendingReward(userKey: number) {
  const reward = pendingRewards.get(userKey);
  if (!reward) return null;
  pendingRewards.delete(userKey);
  return reward;
}

export function getPendingReward(userKey: number) {
  return pendingRewards.get(userKey) ?? null;
}
