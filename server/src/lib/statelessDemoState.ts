import { createHmac, timingSafeEqual } from "node:crypto";
import { gunzipSync, gzipSync } from "node:zlib";
import type { PreparedRace } from "../db/racePrepStore.js";
import {
  exportPreparedForUser,
  replacePreparedRacesForUser,
} from "../db/racePrepStore.js";
import type { PlayerState } from "../db/playerStore.js";
import { getPlayerState, replacePlayerState } from "../db/playerStore.js";
import { config } from "../config.js";
import { isPlayDemoEnabled } from "./playDemo.js";

type DemoBlob = {
  v: 1;
  userKey: number;
  player: PlayerState;
  races: PreparedRace[];
};

function sign(payload: string): string {
  return createHmac("sha256", config.sessionSecret).update(payload).digest("base64url");
}

function safeEqual(a: string, b: string): boolean {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ab.length !== bb.length) return false;
  return timingSafeEqual(ab, bb);
}

const DATE_KEYS = new Set([
  "raceStaminaUpdatedAt",
  "createdAt",
  "lastLoginAt",
  "recordedAt",
  "expiresAt",
]);

function replacer(_key: string, value: unknown) {
  if (value instanceof Date) {
    return { __t: "Date", v: value.toISOString() };
  }
  return value;
}

function reviver(key: string, value: unknown) {
  if (
    value &&
    typeof value === "object" &&
    (value as { __t?: string }).__t === "Date" &&
    typeof (value as { v?: string }).v === "string"
  ) {
    return new Date((value as { v: string }).v);
  }
  if (
    typeof value === "string" &&
    DATE_KEYS.has(key) &&
    /^\d{4}-\d{2}-\d{2}T/.test(value)
  ) {
    return new Date(value);
  }
  return value;
}

function pack(blob: DemoBlob): string {
  const json = JSON.stringify(blob, replacer);
  return gzipSync(Buffer.from(json, "utf8")).toString("base64url");
}

function unpack(token: string): DemoBlob {
  const json = gunzipSync(Buffer.from(token, "base64url")).toString("utf8");
  return JSON.parse(json, reviver) as DemoBlob;
}

export function exportDemoStateToken(userKey: number): string | null {
  const player = getPlayerState(userKey);
  if (!player) return null;
  const payload = pack({
    v: 1,
    userKey,
    player,
    races: exportPreparedForUser(userKey),
  });
  return `${payload}.${sign(payload)}`;
}

export function hydrateDemoStateToken(token: string, userKey: number): boolean {
  const dot = token.lastIndexOf(".");
  if (dot <= 0) return false;
  const payload = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  if (!safeEqual(sig, sign(payload))) return false;

  const blob = unpack(payload);
  if (blob.v !== 1 || blob.userKey !== userKey) return false;

  replacePlayerState(userKey, blob.player);
  replacePreparedRacesForUser(userKey, blob.races);
  return true;
}

export function attachDemoState(
  userKey: number,
  body: Record<string, unknown>,
): Record<string, unknown> {
  if (!isPlayDemoEnabled()) return body;
  const demoState = exportDemoStateToken(userKey);
  if (demoState) body.demoState = demoState;
  return body;
}

export { isPlayDemoEnabled };
