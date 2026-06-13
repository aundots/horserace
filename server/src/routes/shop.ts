import { Router } from "express";
import {
  addInventory,
  buyRankedTicket,
  getOrCreatePlayer,
  getPlayerSnapshot,
  spendInventory,
  trainHorse,
} from "../db/playerStore.js";
import { getShopCatalog, recordPurchase } from "../lib/economy.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const shopRouter = Router();

shopRouter.use(requireSession);

shopRouter.get("/catalog", (_req, res) => {
  res.json({ ok: true, items: getShopCatalog() });
});

shopRouter.post("/purchase", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { itemId } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);
  const item = getShopCatalog().find((i) => i.id === itemId);
  if (!item) {
    res.status(404).json({ ok: false, message: "상품을 찾을 수 없어요." });
    return;
  }
  if (player.gold < item.price) {
    res.status(400).json({ ok: false, message: "골드가 부족해요." });
    return;
  }

  player.gold -= item.price;
  recordPurchase(itemId);

  if (item.category === "cosmetic" || item.category === "consumable" || item.category === "limited") {
    addInventory(player, itemId);
  }
  if (item.effect === "fatigue-20") {
    player.horse.fatigue = Math.max(0, player.horse.fatigue - 20);
    spendInventory(player, itemId);
  }
  if (item.effect === "train+1") {
    try {
      trainHorse(player);
    } catch {
      addInventory(player, itemId);
    }
    spendInventory(player, itemId);
  }
  if (item.effect === "rank-buff-3") {
    player.weekendBoostPct = 3;
    spendInventory(player, itemId);
  }

  res.json({ ok: true, snapshot: getPlayerSnapshot(player) });
});

shopRouter.post("/buy-ticket", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  try {
    const price = buyRankedTicket(player);
    res.json({ ok: true, price, snapshot: getPlayerSnapshot(player) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "구매 실패",
    });
  }
});
