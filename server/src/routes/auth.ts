import { Router } from "express";
import { createSession, upsertUser } from "../db/store.js";
import { getOrCreatePlayer } from "../db/playerStore.js";
import { canDevLogin } from "../lib/devAccess.js";
import { allocatePlayDemoUserKey, isPlayDemoEnabled } from "../lib/playDemo.js";
import {
  attachDemoState,
  hydrateDemoStateToken,
} from "../lib/statelessDemoState.js";
import { exchangeAuthorizationCode, fetchLoginMe } from "../lib/tossAuth.js";

export const authRouter = Router();

authRouter.post("/login", async (req, res) => {
  const { authorizationCode, referrer } = req.body ?? {};

  if (!authorizationCode || !referrer) {
    res.status(400).json({
      ok: false,
      message: "authorizationCode와 referrer가 필요합니다.",
    });
    return;
  }

  try {
    const token = await exchangeAuthorizationCode({
      authorizationCode,
      referrer,
    });
    const profile = await fetchLoginMe(token.accessToken);
    await upsertUser(profile.userKey);
    const session = await createSession(profile.userKey);

    res.json({
      ok: true,
      sessionId: session.id,
      userKey: profile.userKey,
      expiresAt: session.expiresAt.toISOString(),
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "로그인에 실패했습니다.";
    res.status(502).json({ ok: false, message });
  }
});

/** Play Store IARC·내부 테스트용 — PLAY_DEMO=true 일 때만 */
authRouter.post("/demo-login", async (_req, res) => {
  if (!isPlayDemoEnabled()) {
    res.status(404).json({ ok: false, message: "Not found" });
    return;
  }
  const userKey = allocatePlayDemoUserKey();
  await upsertUser(userKey);
  getOrCreatePlayer(userKey);
  const session = await createSession(userKey);
  const body: Record<string, unknown> = {
    ok: true,
    sessionId: session.id,
    userKey,
    expiresAt: session.expiresAt.toISOString(),
  };
  attachDemoState(userKey, body);
  res.json(body);
});

authRouter.post("/dev-login", async (req, res) => {
  const userKey = Number(req.body?.userKey ?? 10001);

  if (!canDevLogin(userKey)) {
    res.status(404).json({ ok: false, message: "Not found" });
    return;
  }
  await upsertUser(userKey);
  const session = await createSession(userKey);
  res.json({
    ok: true,
    sessionId: session.id,
    userKey,
    expiresAt: session.expiresAt.toISOString(),
  });
});

authRouter.get("/me", async (req, res) => {
  const sessionId = req.header("x-session-id");
  if (!sessionId) {
    res.status(401).json({ ok: false, message: "세션이 없습니다." });
    return;
  }

  const { getSession } = await import("../db/store.js");
  const session = await getSession(sessionId);
  if (!session) {
    res.status(401).json({ ok: false, message: "세션이 만료되었습니다." });
    return;
  }

  if (isPlayDemoEnabled()) {
    const demoToken = req.header("x-horserace-demo-state");
    if (demoToken) hydrateDemoStateToken(demoToken, session.userKey);
  }

  const body: Record<string, unknown> = {
    ok: true,
    userKey: session.userKey,
    expiresAt: session.expiresAt.toISOString(),
  };
  if (isPlayDemoEnabled()) attachDemoState(session.userKey, body);
  res.json(body);
});
