import { randomInt } from "node:crypto";

/** Inclusive range for Play Store demo-login userKeys (IARC / internal test). */
export const PLAY_DEMO_USER_KEY_MIN = 90_001;
export const PLAY_DEMO_USER_KEY_MAX = 99_999;

/** Legacy constant — first key in the demo range. */
export const PLAY_DEMO_USER_KEY = PLAY_DEMO_USER_KEY_MIN;

/** Daily free ranked tickets for Play Store demo-login (IARC / internal test). */
export const PLAY_DEMO_RANKED_TICKETS_DAILY = 999;

export function isPlayDemoEnabled(): boolean {
  return process.env.PLAY_DEMO === "true";
}

export function isPlayDemoUser(userKey: number): boolean {
  return (
    isPlayDemoEnabled() &&
    userKey >= PLAY_DEMO_USER_KEY_MIN &&
    userKey <= PLAY_DEMO_USER_KEY_MAX
  );
}

export function allocatePlayDemoUserKey(): number {
  return randomInt(PLAY_DEMO_USER_KEY_MIN, PLAY_DEMO_USER_KEY_MAX + 1);
}
