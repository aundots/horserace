import { randomUUID } from "node:crypto";

export type SessionRecord = {
  id: string;
  userKey: number;
  expiresAt: Date;
};

const users = new Map<number, { createdAt: Date; lastLoginAt: Date }>();
const sessions = new Map<string, SessionRecord>();

export async function upsertUser(userKey: number) {
  const now = new Date();
  const existing = users.get(userKey);
  if (existing) {
    existing.lastLoginAt = now;
    return;
  }
  users.set(userKey, { createdAt: now, lastLoginAt: now });
}

export async function createSession(userKey: number, ttlHours = 24 * 7) {
  const id = randomUUID();
  const expiresAt = new Date(Date.now() + ttlHours * 60 * 60 * 1000);
  const record = { id, userKey, expiresAt };
  sessions.set(id, record);
  return record;
}

export async function getSession(sessionId: string) {
  const record = sessions.get(sessionId);
  if (!record) return null;
  if (record.expiresAt.getTime() < Date.now()) {
    sessions.delete(sessionId);
    return null;
  }
  return record;
}
