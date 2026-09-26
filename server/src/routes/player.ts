import { Router, type Request, type Response } from "express";
import { getOrCreatePlayer, getPlayerSnapshot } from "../db/playerStore.js";
import { resetSessionRaceStreak } from "../lib/raceLoop.js";
import type { AuthedRequest } from "../middleware/requireSession.js";
import { requireSession } from "../middleware/requireSession.js";

export const playerRouter = Router();

playerRouter.use(requireSession);

playerRouter.get("/status", statusHandler);
playerRouter.post("/status", statusHandler);

function statusHandler(req: Request, res: Response) {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  res.json({ ok: true, ...getPlayerSnapshot(player) });
}

/** 홈 복귀 시 연속 출전 스트릭 초기화 */
playerRouter.post("/end-session", (req, res) => {
  const { userKey } = req as AuthedRequest;
  const player = getOrCreatePlayer(userKey);
  resetSessionRaceStreak(player);
  res.json({ ok: true, snapshot: getPlayerSnapshot(player) });
});
