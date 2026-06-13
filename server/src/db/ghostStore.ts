import type { RaceHorse } from "../lib/raceSim.js";

export type GhostRecord = {
  userKey: number;
  horseName: string;
  speed: number;
  stamina: number;
  accel: number;
  pace: RaceHorse["pace"];
  trackApt: RaceHorse["trackApt"];
  distanceApt: RaceHorse["distanceApt"];
  finishTime: number;
  recordedAt: Date;
};

const ghosts: GhostRecord[] = [];

export function saveGhost(record: GhostRecord) {
  ghosts.push(record);
  if (ghosts.length > 500) ghosts.shift();
}

export function pickGhosts(count: number, statSum: number): GhostRecord[] {
  const pool = ghosts.filter(
    (g) => g.speed + g.stamina + g.accel >= statSum * 0.9 && g.speed + g.stamina + g.accel <= statSum * 1.1,
  );
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
