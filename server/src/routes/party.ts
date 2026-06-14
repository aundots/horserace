import { Router, type Response } from "express";
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

function partyCodeFromBody(body: unknown): string | undefined {
  if (!body || typeof body !== "object") return undefined;
  const code = (body as { partyCode?: string }).partyCode;
  return code ? String(code).toUpperCase() : undefined;
}

async function respondParty(
  res: Response,
  room: Awaited<ReturnType<typeof getPartyForUser>>,
  userKey: number,
) {
  if (!room) {
    res.json({ ok: true, party: null });
    return;
  }
  res.json({ ok: true, party: serializeParty(room, userKey) });
}

partyRouter.get("/mine", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const room = await getPartyForUser(userKey);
  await respondParty(res, room, userKey);
});

partyRouter.post("/mine", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const partyCode = partyCodeFromBody(req.body);
  const room = await getPartyForUser(userKey, partyCode);
  await respondParty(res, room, userKey);
});

partyRouter.get("/:code", async (req, res) => {
  const { userKey } = req as unknown as AuthedRequest;
  const room = await getParty(req.params.code);
  if (!room) {
    res.status(404).json({ ok: false, message: "방을 찾을 수 없어요." });
    return;
  }
  res.json({ ok: true, party: serializeParty(room, userKey) });
});

partyRouter.post("/create", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { displayName } = req.body ?? {};
  const room = await createParty(userKey, displayName);
  res.json({ ok: true, party: serializeParty(room, userKey) });
});

partyRouter.post("/join", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { code, displayName } = req.body ?? {};
  if (!code) {
    res.status(400).json({ ok: false, message: "방 코드가 필요해요." });
    return;
  }
  try {
    const room = await joinParty(userKey, String(code), displayName);
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "입장 실패",
    });
  }
});

partyRouter.post("/leave", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  await leaveParty(userKey);
  res.json({ ok: true });
});

partyRouter.post("/prepare", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  const partyCode = partyCodeFromBody(req.body);
  try {
    const room = await prepareParty(
      userKey,
      {
        speed: player.horse.speed,
        stamina: player.horse.stamina,
        accel: player.horse.accel,
      },
      partyCode,
    );
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "준비 실패",
    });
  }
});

partyRouter.post("/predict", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { horseNumber } = req.body ?? {};
  const partyCode = partyCodeFromBody(req.body);
  if (!horseNumber) {
    res.status(400).json({ ok: false, message: "horseNumber가 필요해요." });
    return;
  }
  try {
    const room = await setPartyPrediction(userKey, Number(horseNumber), partyCode);
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "선택 실패",
    });
  }
});

partyRouter.post("/reveal-tip", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const { horseNumber } = req.body ?? {};
  const partyCode = partyCodeFromBody(req.body);
  if (!horseNumber) {
    res.status(400).json({ ok: false, message: "horseNumber가 필요해요." });
    return;
  }
  try {
    const result = await revealPartyTip(userKey, Number(horseNumber), partyCode);
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

partyRouter.post("/run", async (req, res) => {
  const { userKey } = req as AuthedRequest;
  const partyCode = partyCodeFromBody(req.body);
  try {
    const room = await runPartyRace(userKey, partyCode);
    res.json({ ok: true, party: serializeParty(room, userKey) });
  } catch (error) {
    res.status(400).json({
      ok: false,
      message: error instanceof Error ? error.message : "경주 시작 실패",
    });
  }
});
