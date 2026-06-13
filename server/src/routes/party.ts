import { Router } from "express";
import { getOrCreatePlayer } from "../db/playerStore.js";
import {
  createParty,
  getParty,
  getPartyForUser,
  joinParty,
  leaveParty,
  prepareParty,
  revealPartyTip,
  runPartyRace,
  serializeParty,
  setPartyPrediction,
} from "../db/partyStore.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const partyRouter = Router();

partyRouter.use(requireSession);

partyRouter.get("/mine", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const room = getPartyForUser(userKey);
  if (!room) {
    res.json({ ok: true, party: null });
    return;
  }
  res.json({ ok: true, party: serializeParty(room, userKey) });
});

partyRouter.get("/:code", (req, res) => {
  const { userKey } = req as unknown as AuthedRequest;
  const room = getParty(req.params.code);
  if (!room) {
    res.status(404).json({ ok: false, message: "방을 찾을 수 없어요." });
    return;
  }
  res.json({ ok: true, party: serializeParty(room, userKey) });
});

partyRouter.post("/create", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { displayName } = req.body ?? {};
  const room = createParty(userKey, displayName);
  res.json({ ok: true, party: serializeParty(room, userKey) });
});

partyRouter.post("/join", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { code, displayName } = req.body ?? {};
  if (!code) {
    res.status(400).json({ ok: false, message: "방 코드가 필요해요." });
    return;
  }
  try {
    const room = joinParty(userKey, String(code), displayName);
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "입장 실패",
    });
  }
});

partyRouter.post("/leave", (req, res) => {
  const { userKey } = req as AuthedRequest;
  leaveParty(userKey);
  res.json({ ok: true });
});

partyRouter.post("/prepare", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  try {
    const room = prepareParty(userKey, {
      speed: player.horse.speed,
      stamina: player.horse.stamina,
      accel: player.horse.accel,
    });
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "준비 실패",
    });
  }
});

partyRouter.post("/predict", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { horseNumber } = req.body ?? {};
  if (!horseNumber) {
    res.status(400).json({ ok: false, message: "horseNumber가 필요해요." });
    return;
  }
  try {
    const room = setPartyPrediction(userKey, Number(horseNumber));
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "선택 실패",
    });
  }
});

partyRouter.post("/reveal-tip", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { horseNumber } = req.body ?? {};
  if (!horseNumber) {
    res.status(400).json({ ok: false, message: "horseNumber가 필요해요." });
    return;
  }
  try {
    const result = revealPartyTip(userKey, Number(horseNumber));
    res.json({
      ok: true,
      party: serializeParty(result.room, userKey),
      tip: result.tip,
      already: result.already,
    });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "찌라시 열기 실패",
    });
  }
});

partyRouter.post("/run", (req, res) => {
  const { userKey } = req as AuthedRequest;
  try {
    const room = runPartyRace(userKey);
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "경주 시작 실패",
    });
  }
});
