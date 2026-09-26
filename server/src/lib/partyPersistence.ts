import type { PartyRoom } from "../db/partyStore.js";

const ROOM_TTL_MS = 2 * 60 * 60 * 1000;

const DATE_KEYS = new Set(["createdAt"]);

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

function serializeRoom(room: PartyRoom): string {
  return JSON.stringify(room, replacer);
}

function deserializeRoom(raw: string): PartyRoom {
  return JSON.parse(raw, reviver) as PartyRoom;
}

const memoryRooms = new Map<string, PartyRoom>();
const memoryUserParty = new Map<number, string>();

function redisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

async function redisCommand<T>(command: string[]): Promise<T | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  const res = await fetch(cfg.url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${cfg.token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
  });
  if (!res.ok) return null;
  const data = (await res.json()) as { result?: T };
  return data.result ?? null;
}

function roomKey(code: string) {
  return `party:room:${code.toUpperCase()}`;
}

function userPartyKey(uid: number) {
  return `party:user:${uid}`;
}

export function partyPersistenceEnabled() {
  return Boolean(redisConfig());
}

function isRoomExpired(room: PartyRoom): boolean {
  return Date.now() - room.createdAt.getTime() > ROOM_TTL_MS;
}

export async function loadPartyRoom(code: string): Promise<PartyRoom | null> {
  const normalized = code.toUpperCase();
  const fromRedis = await redisCommand<string>(["GET", roomKey(normalized)]);
  if (typeof fromRedis === "string") {
    const room = deserializeRoom(fromRedis);
    memoryRooms.set(normalized, room);
    return room;
  }
  const fromMemory = memoryRooms.get(normalized);
  if (!fromMemory) return null;
  if (isRoomExpired(fromMemory)) {
    memoryRooms.delete(normalized);
    return null;
  }
  return fromMemory;
}

export async function savePartyRoom(room: PartyRoom): Promise<void> {
  const normalized = room.code.toUpperCase();
  room.code = normalized;
  memoryRooms.set(normalized, room);
  await redisCommand(["SET", roomKey(normalized), serializeRoom(room), "EX", "7200"]);
}

export async function deletePartyRoom(code: string): Promise<void> {
  const normalized = code.toUpperCase();
  memoryRooms.delete(normalized);
  await redisCommand(["DEL", roomKey(normalized)]);
}

export async function loadUserPartyCode(userKey: number): Promise<string | null> {
  const fromRedis = await redisCommand<string>(["GET", userPartyKey(userKey)]);
  if (typeof fromRedis === "string") return fromRedis.toUpperCase();
  return memoryUserParty.get(userKey) ?? null;
}

export async function saveUserPartyCode(userKey: number, code: string): Promise<void> {
  const normalized = code.toUpperCase();
  memoryUserParty.set(userKey, normalized);
  await redisCommand(["SET", userPartyKey(userKey), normalized, "EX", "7200"]);
}

export async function clearUserPartyCode(userKey: number): Promise<void> {
  memoryUserParty.delete(userKey);
  await redisCommand(["DEL", userPartyKey(userKey)]);
}
