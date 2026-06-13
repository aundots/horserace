export const PLAY_DEMO_USER_KEY = 90001;

/** Daily free ranked tickets for Play Store demo-login (IARC / internal test). */
export const PLAY_DEMO_RANKED_TICKETS_DAILY = 10;

export function isPlayDemoEnabled(): boolean {
  return process.env.PLAY_DEMO === "true";
}

export function isPlayDemoUser(userKey: number): boolean {
  return isPlayDemoEnabled() && userKey === PLAY_DEMO_USER_KEY;
}
