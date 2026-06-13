export const PLAY_DEMO_USER_KEY = 90001;

export function isPlayDemoEnabled(): boolean {
  return process.env.PLAY_DEMO === "true";
}
