import { createHmac, timingSafeEqual } from "node:crypto";
import { config } from "../config.js";

export type SessionRecord = {
  id: string;
  userKey: number;
  expiresAt: Date;
};

function signPayload(userKey: number, expiresAtMs: number): string {
  const payload = `${userKey}.${expiresAtMs}`;
  const sig = createHmac("sha256", config.sessionSecret)
    .update(payload)
    .digest("base64url");
  return `${payload}.${sig}`;
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

export function createStatelessSession(
  userKey: number,
  ttlHours = 24 * 7,
): SessionRecord {
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const id = signPayload(userKey, expiresAt.getTime());
  return { id, userKey, expiresAt };
}

export function readStatelessSession(sessionId: string): SessionRecord | null {
  const parts = sessionId.split(".");
  if (parts.length !== 3) return null;

  const userKey = Number(parts[0]);
  const expiresAtMs = Number(parts[1]);
  const sig = parts[2];
  if (!Number.isFinite(userKey) || !Number.isFinite(expiresAtMs) || !sig) {
    return null;
  }

  const expected = createHmac("sha256", config.sessionSecret)
    .update(`${userKey}.${expiresAtMs}`)
    .digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  if (expiresAtMs < Date.now()) return null;

  return {
    id: sessionId,
    userKey,
    expiresAt: new Date(expiresAtMs),
  };
}

export function useStatelessSessions(): boolean {
  return process.env.PLAY_DEMO === "true" || process.env.STATELESS_SESSIONS === "true";
}
