import type { NextFunction, Request, Response } from "express";
import { getSession } from "../db/store.js";
import { getOrCreatePlayer, syncPlayerSession } from "../db/playerStore.js";
import {
  attachDemoState,
  hydrateDemoStateToken,
  isPlayDemoEnabled,
} from "../lib/statelessDemoState.js";

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

  if (isPlayDemoEnabled()) {
    let demoToken = req.header("x-horserace-demo-state");
    if (!demoToken && req.body && typeof req.body._demoState === "string") {
      demoToken = req.body._demoState;
      delete req.body._demoState;
    }
    if (demoToken) {
      hydrateDemoStateToken(demoToken, session.userKey);
    }
  }

  const player = getOrCreatePlayer(session.userKey);
  syncPlayerSession(player);

  (req as AuthedRequest).sessionId = sessionId;
  (req as AuthedRequest).userKey = session.userKey;

  if (isPlayDemoEnabled()) {
    const resWithFlag = res as Response & { _demoJsonPatched?: boolean };
    if (!resWithFlag._demoJsonPatched) {
      resWithFlag._demoJsonPatched = true;
      const originalJson = res.json.bind(res);
      res.json = (body: unknown) => {
        if (body && typeof body === "object" && !Array.isArray(body)) {
          attachDemoState(session.userKey, body as Record<string, unknown>);
        }
        return originalJson(body);
      };
    }
  }

  next();
}
