import { Router } from "express";
import {
  addGold,
  addInventory,
  claimAttendance,
  getOrCreatePlayer,
  getPlayerSnapshot,
} from "../db/playerStore.js";
import { HIT_BOX_TABLE, POKEDEX_ENTRIES, rollHitBox } from "../lib/retention.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const retentionRouter = Router();

retentionRouter.use(requireSession);

retentionRouter.get("/streak", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  res.json({
    ok: true,
    streak: player.streak,
    shieldUsedThisWeek: player.streakShieldUsedWeek === player.weekId,
  });
});

retentionRouter.post("/attendance", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  try {
    const reward = claimAttendance(player);
    res.json({ ok: true, reward, snapshot: getPlayerSnapshot(player) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "출석 실패",
    });
  }
});

retentionRouter.get("/pokedex", (_req, res) => {
  res.json({
    ok: true,
    entries: POKEDEX_ENTRIES,
  });
});

retentionRouter.get("/my-pokedex", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  res.json({ ok: true, unlocked: player.pokedexUnlocks });
});

retentionRouter.get("/hit-box-info", (_req, res) => {
  res.json({ ok: true, table: HIT_BOX_TABLE });
});

retentionRouter.post("/hit-box/open", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  if (player.hitBoxesToday >= 3) {
    res.status(400).json({ ok: false, message: "오늘 적중 상자 한도에 도달했어요." });
    return;
  }
  player.hitBoxesToday += 1;
  const reward = rollHitBox();
  addGold(player, reward.gold);
  if (reward.inventoryId) addInventory(player, reward.inventoryId);
  res.json({ ok: true, reward, snapshot: getPlayerSnapshot(player) });
});
