import { Router } from "express";
import { addGold, getOrCreatePlayer, getPlayerSnapshot } from "../db/playerStore.js";
import { claimPendingReward, getPendingReward } from "../jobs/weeklySettlement.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const rewardRouter = Router();

rewardRouter.use(requireSession);

rewardRouter.get("/pending", (req, res) => {
  const { userKey } = req as AuthedRequest;
  res.json({ ok: true, reward: getPendingReward(userKey) });
});

rewardRouter.post("/claim-settlement", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  const reward = claimPendingReward(userKey);
  if (!reward) {
    res.status(400).json({ ok: false, message: "받을 정산 보상이 없어요." });
    return;
  }
  addGold(player, reward.gold);
  res.json({
    ok: true,
    reward,
    snapshot: getPlayerSnapshot(player),
  });
});
