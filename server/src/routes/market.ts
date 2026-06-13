import { Router } from "express";
import {
  addGold,
  addInventory,
  getOrCreatePlayer,
  getPlayerSnapshot,
  spendInventory,
} from "../db/playerStore.js";
import {
  canTrade,
  getMarketListings,
  getTipsMarketPosts,
  marketBuy,
  marketList,
  publishTipsMarket,
} from "../lib/economy.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const marketRouter = Router();

marketRouter.use(requireSession);

marketRouter.get("/listings", (_req, res) => {
  res.json({ ok: true, listings: getMarketListings() });
});

marketRouter.post("/sell", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { itemId, price } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);
  const qty = player.inventory[itemId] ?? 0;
  if (qty < 1) {
    res.status(400).json({ ok: false, message: "판매할 아이템이 없어요." });
    return;
  }
  if (!canTrade(itemId)) {
    res.status(400).json({ ok: false, message: "거래할 수 없는 아이템이에요." });
    return;
  }
  try {
    spendInventory(player, itemId);
    const listing = marketList(userKey, itemId, itemId, Number(price));
    res.json({ ok: true, listing, snapshot: getPlayerSnapshot(player) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "등록 실패",
    });
  }
});

marketRouter.post("/buy", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { listingId } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);
  try {
    const { listing, sellerReceives, fee } = marketBuy(listingId, userKey);
    if (player.gold < listing.price) {
      res.status(400).json({ ok: false, message: "골드가 부족해요." });
      return;
    }
    player.gold -= listing.price;
    addInventory(player, listing.itemId);
    const seller = getOrCreatePlayer(listing.sellerKey);
    addGold(seller, sellerReceives);
    res.json({ ok: true, fee, snapshot: getPlayerSnapshot(player) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "구매 실패",
    });
  }
});

marketRouter.get("/tips/:raceId", (req, res) => {
  res.json({ ok: true, posts: getTipsMarketPosts(req.params.raceId) });
});

marketRouter.post("/tips/publish", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { raceId, text, price } = req.body ?? {};
  const player = getOrCreatePlayer(userKey);
  const hitRate = player.predictionWins / Math.max(1, player.totalRaces);
  try {
    const post = publishTipsMarket(userKey, raceId, text, Number(price), hitRate);
    res.json({ ok: true, post });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "등록 실패",
    });
  }
});
