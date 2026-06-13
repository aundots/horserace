import { Router } from "express";
import { getOrCreatePlayer, getPlayerSnapshot, setHorseCoat } from "../db/playerStore.js";
import { isHorseCoatId } from "../lib/horseCoat.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const horseRouter = Router();

const CARE_DISABLED_MSG = "말 육성은 현재 비활성화되어 있어요. 경주에 집중해 보세요!";

horseRouter.use(requireSession);

horseRouter.get("/", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  res.json({ ok: true, horse: player.horse, snapshot: getPlayerSnapshot(player) });
});

horseRouter.get("/presets", (_req, res) => {
  res.json({ ok: true, presets: [] });
});

horseRouter.post("/action", (_req, res) => {
  res.status(400).json({ ok: false, message: CARE_DISABLED_MSG });
});

horseRouter.post("/coat", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const coat = req.body?.coat;
  if (!isHorseCoatId(coat)) {
    res.status(400).json({ ok: false, message: "유효하지 않은 털색입니다." });
    return;
  }
  const player = getOrCreatePlayer(userKey);
  setHorseCoat(player, coat);
  res.json({ ok: true, snapshot: getPlayerSnapshot(player) });
});

horseRouter.post("/customize", (_req, res) => {
  res.status(400).json({ ok: false, message: CARE_DISABLED_MSG });
});

horseRouter.post("/preset", (_req, res) => {
  res.status(400).json({ ok: false, message: CARE_DISABLED_MSG });
});
