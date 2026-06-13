import { Router } from "express";
import {
  addGold,
  addPredictionPoints,
  canRanked,
  getOrCreatePlayer,
  getPlayerSnapshot,
  trainHorse,
} from "../db/playerStore.js";
import { isDevUser } from "../lib/devAccess.js";
import {
  getAdEligibility,
  PLACEMENT_REWARDS,
  PLACEMENTS,
  recordAdWatch,
  type PlacementId,
} from "../lib/monetization.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const adsRouter = Router();

adsRouter.use(requireSession);

adsRouter.get("/eligibility", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  const accountDays = Math.floor(
    (Date.now() - player.createdAt.getTime()) / (24 * 60 * 60 * 1000),
  );

  const placements = (Object.keys(PLACEMENTS) as PlacementId[]).map((id) => {
    const result = getAdEligibility(
      player.adUsage,
      id,
      accountDays,
      player.globalAdLastMs,
      userKey,
    );
    return { id, ...result };
  });

  res.json({ ok: true, placements });
});

adsRouter.post("/claim", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { placement, adToken } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);

  if (!placement || !adToken) {
    res.status(400).json({ ok: false, message: "placement과 adToken이 필요해요." });
    return;
  }

  if (typeof adToken === "string" && adToken.startsWith("dev-") && !isDevUser(userKey)) {
    res.status(403).json({ ok: false, message: "유효하지 않은 광고 토큰이에요." });
    return;
  }

  if (!PLACEMENTS[placement as PlacementId]) {
    res.status(400).json({ ok: false, message: "알 수 없는 광고 placement예요." });
    return;
  }

  const accountDays = Math.floor(
    (Date.now() - player.createdAt.getTime()) / (24 * 60 * 60 * 1000),
  );
  const check = getAdEligibility(
    player.adUsage,
    placement as PlacementId,
    accountDays,
    player.globalAdLastMs,
    userKey,
  );

  if (!check.eligible) {
    res.status(400).json({ ok: false, message: check.reason ?? "광고 보상을 받을 수 없어요." });
    return;
  }

  recordAdWatch(player.adUsage, placement as PlacementId);
  player.globalAdLastMs = Date.now();

  const reward = PLACEMENT_REWARDS[placement as PlacementId];
  let message = "";

  switch (reward.type) {
    case "gold_multiplier":
      addGold(player, player.lastRaceGold);
      message = `골드 2배 (+${player.lastRaceGold})`;
      break;
    case "stamina":
      player.raceStamina = Math.min(8, player.raceStamina + (reward.amount ?? 3));
      message = `경주력 +${reward.amount}`;
      break;
    case "rank_ticket":
      player.adRankedTickets += 1;
      message = "랭킹 티켓 +1";
      break;
    case "train":
      try {
        trainHorse(player);
      } catch {
        player.gold += 30;
      }
      message = "훈련 +1";
      break;
    case "revive":
      player.pendingRevive = false;
      message = "재도전 기회";
      break;
    case "gold":
      addGold(player, reward.amount ?? 50);
      message = `골드 +${reward.amount}`;
      break;
    case "streak_shield":
      player.streakShieldUsedWeek = player.weekId;
      message = "스트릭 보호";
      break;
    case "weekend_boost":
      player.weekendBoostPct = reward.amount ?? 5;
      message = `이번 경주 버프 +${reward.amount}%`;
      break;
    case "prediction_points": {
      const pts = reward.amount ?? 4;
      addPredictionPoints(player, pts);
      message = `찌라시 P +${pts}`;
      break;
    }
    case "race_continue": {
      const ranked = canRanked(player);
      if (!ranked.ok) {
        player.adRankedTickets += 1;
        message = "경주 티켓 +1 · 다음 경주 가능!";
      } else {
        const pts = reward.amount ?? 4;
        addPredictionPoints(player, pts);
        message = `찌라시 P +${pts} · 다음 경주 준비`;
      }
      break;
    }
  }

  res.json({
    ok: true,
    message,
    reward,
    snapshot: getPlayerSnapshot(player),
  });
});
