import { Router } from "express";
import {
  addGold,
  addInventory,
  getOrCreatePlayer,
  getPlayerSnapshot,
} from "../db/playerStore.js";
import { claimStep, passProgress } from "../lib/weeklyPass.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const weeklyPassRouter = Router();

weeklyPassRouter.use(requireSession);

weeklyPassRouter.get("/", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  res.json({ ok: true, steps: passProgress(player.weeklyPass) });
});

weeklyPassRouter.post("/claim", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { step } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);
  try {
    const reward = claimStep(player.weeklyPass, Number(step));
    let tossPoints = 0;
    if (reward === "gold_50") addGold(player, 50);
    if (reward === "gold_80") addGold(player, 80);
    if (reward === "gold_100") addGold(player, 100);
    if (reward === "item_feed") addInventory(player, "feed_energy");
    if (reward === "toss_100p") tossPoints = 100;

    res.json({
      ok: true,
      reward,
      tossPoints,
      note: tossPoints
        ? "토스 포인트는 프로모션 API 연동 후 지급됩니다."
        : undefined,
      snapshot: getPlayerSnapshot(player),
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "수령 실패",
    });
  }
});
