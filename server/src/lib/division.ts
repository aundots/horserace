import { kstWeekId } from "./kst.js";

export type DivisionTier = 1 | 2 | 3 | 4 | 5;
export type League = "ROOKIE" | "VETERAN" | "CHAMPION";

const TIER_NAMES = ["브론즈", "실버", "골드", "다이아", "마스터"] as const;

export type RoomMember = {
  userKey: number;
  name: string;
  score: number;
};

export type DivisionRoom = {
  id: string;
  weekId: string;
  league: League;
  tier: DivisionTier;
  members: RoomMember[];
};

const rooms = new Map<string, DivisionRoom>();
let roomSeq = 1;

export function tierName(tier: DivisionTier) {
  return TIER_NAMES[tier - 1];
}

export function leagueFromStats(statSum: number, accountDays: number): League {
  if (accountDays < 14 || statSum < 300) return "ROOKIE";
  if (statSum < 600) return "VETERAN";
  return "CHAMPION";
}

export function getOrAssignRoom(
  userKey: number,
  horseName: string,
  league: League,
  tier: DivisionTier,
  newbieShield: boolean,
): DivisionRoom {
  const weekId = kstWeekId();
  const existing = [...rooms.values()].find(
    (r) =>
      r.weekId === weekId &&
      r.members.some((m) => m.userKey === userKey),
  );
  if (existing) return existing;

  let pool = [...rooms.values()].filter(
    (r) =>
      r.weekId === weekId &&
      r.league === league &&
      r.tier === tier &&
      r.members.length < 40,
  );

  if (newbieShield) {
    const rookieRoom = pool.find((r) => r.id.includes("newbie"));
    if (rookieRoom && rookieRoom.members.length < 40) {
      rookieRoom.members.push({ userKey, name: horseName, score: 0 });
      return rookieRoom;
    }
  }

  let room = pool.find((r) => r.members.length < 40);
  if (!room) {
    const id = `room-${weekId}-${roomSeq++}${newbieShield ? "-newbie" : ""}`;
    room = {
      id,
      weekId,
      league,
      tier,
      members: [],
    };
    rooms.set(id, room);
  }

  if (!room.members.some((m) => m.userKey === userKey)) {
    room.members.push({ userKey, name: horseName, score: 0 });
  }
  return room;
}

export function updateRoomScore(userKey: number, score: number) {
  const weekId = kstWeekId();
  for (const room of rooms.values()) {
    if (room.weekId !== weekId) continue;
    const member = room.members.find((m) => m.userKey === userKey);
    if (member) {
      member.score = Math.max(member.score, score);
      room.members.sort((a, b) => b.score - a.score);
      return room;
    }
  }
  return null;
}

export function getPlayerRoom(userKey: number): DivisionRoom | null {
  const weekId = kstWeekId();
  return (
    [...rooms.values()].find(
      (r) => r.weekId === weekId && r.members.some((m) => m.userKey === userKey),
    ) ?? null
  );
}

export function getRoomRank(userKey: number) {
  const room = getPlayerRoom(userKey);
  if (!room) return null;
  const rank = room.members.findIndex((m) => m.userKey === userKey) + 1;
  const leader = room.members[0];
  const me = room.members[rank - 1];
  return {
    roomId: room.id,
    tier: room.tier,
    tierName: tierName(room.tier),
    league: room.league,
    rank,
    total: room.members.length,
    score: me?.score ?? 0,
    gapToLeader: leader ? leader.score - (me?.score ?? 0) : 0,
    members: room.members.slice(0, 10),
  };
}

export function allRoomsForSettlement(weekId: string) {
  return [...rooms.values()].filter((r) => r.weekId === weekId);
}
