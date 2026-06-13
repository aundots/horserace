import type { NextFunction, Request, Response } from "express";
import { getSession } from "../db/store.js";
import { getOrCreatePlayer, syncPlayerSession } from "../db/playerStore.js";

export type AuthedRequest = Request & {
  sessionId: string;
  userKey: number;
};

export async function requireSession(
  req: Request,
  res: Response,
  next: NextFunction,
) {
  const sessionId = req.header("x-session-id");
  if (!sessionId) {
    res.status(401).json({ ok: false, message: "세션이 없습니다." });
    return;
  }

  const session = await getSession(sessionId);
  if (!session) {
    res.status(401).json({ ok: false, message: "세션이 만료되었습니다." });
    return;
  }

  const player = getOrCreatePlayer(session.userKey);
  syncPlayerSession(player);

  (req as AuthedRequest).sessionId = sessionId;
  (req as AuthedRequest).userKey = session.userKey;
  next();
}
