export async function appLogin(): Promise<{
  authorizationCode: string;
  referrer: string;
}> {
  throw new Error("토스 앱에서만 로그인할 수 있어요.");
}

export function loadFullScreenAd(_opts: unknown): () => void {
  return () => {};
}

loadFullScreenAd.isSupported = () => false;

export function showFullScreenAd(_opts?: unknown): void {}

export function getAppsInTossGlobals(): { brandPrimaryColor: string } {
  return { brandPrimaryColor: "#3182F6" };
}

export function getSafeAreaInsets(): { top: number; bottom: number } {
  return { top: 0, bottom: 0 };
}

export function defineConfig<T>(config: T): T {
  return config;
}
