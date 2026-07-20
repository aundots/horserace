/**
 * Play Store(WebView) 빌드용 shim.
 * 토스 광고 SDK 대신 Android 쪽 AdMob 브릿지(MainActivity 의 `HorseraceAds`)에 연결한다.
 * 브릿지가 없는 환경(사파리 등 일반 웹)에서는 조용히 미지원으로 떨어진다.
 */

// requestId 는 AdMob SSV 의 customData 이기도 하다 — claimReward 가 이 값을
// "ssv:<requestId>" 형태로 서버에 보내면, 서버는 Google 이 보낸 콜백과 대조해서
// 실제로 광고를 끝까지 봤는지 확인한다 (server/src/routes/ads.ts 의 /ssv, /claim).
type Reward = { unitType: string; unitAmount: number; requestId?: string };
type AdEvent = { type: string; data?: Reward };
type AdHandlers = { onEvent?: (event: AdEvent) => void; onError?: (error: Error) => void };

type NativeAds = {
  isSupported: () => boolean;
  loadRewarded: () => void;
  showRewarded: (requestId: string) => void;
  loadInterstitial?: () => void;
  showInterstitial?: () => void;
};

type BridgeEvent = {
  type: string;
  requestId: string | null;
  data: Reward | { message?: string } | null;
};

declare global {
  interface Window {
    HorseraceAds?: NativeAds;
    __horseraceAds?: { emit: (event: BridgeEvent) => void };
  }
}

function nativeAds(): NativeAds | null {
  const ads = typeof window !== "undefined" ? window.HorseraceAds : undefined;
  try {
    return ads?.isSupported() ? ads : null;
  } catch {
    return null;
  }
}

/** 로드 이벤트는 요청 단위가 아니므로 구독자 전체에게 브로드캐스트한다. */
const loadListeners = new Set<AdHandlers>();
/** 노출 이벤트는 showRewarded 를 부른 쪽에만 전달해야 해서 requestId 로 라우팅한다. */
const showListeners = new Map<string, AdHandlers>();

function ensureBridge() {
  if (typeof window === "undefined" || window.__horseraceAds) return;

  window.__horseraceAds = {
    emit(event) {
      const { type, requestId, data } = event;

      if (type === "loaded" || type === "failedToLoad") {
        for (const handlers of loadListeners) {
          if (type === "loaded") handlers.onEvent?.({ type: "loaded" });
          else {
            const message = (data as { message?: string } | null)?.message;
            handlers.onError?.(new Error(message ?? "광고 로드에 실패했어요."));
          }
        }
        return;
      }

      if (!requestId) return;
      const handlers = showListeners.get(requestId);
      if (!handlers) return;

      switch (type) {
        case "userEarnedReward":
          handlers.onEvent?.({
            type: "userEarnedReward",
            data: { ...(data as Reward), requestId },
          });
          break;
        case "dismissed":
          handlers.onEvent?.({ type: "dismissed" });
          showListeners.delete(requestId);
          break;
        case "failedToShow":
          handlers.onEvent?.({ type: "failedToShow" });
          showListeners.delete(requestId);
          break;
      }
    },
  };
}

export async function appLogin(): Promise<{
  authorizationCode: string;
  referrer: string;
}> {
  throw new Error("토스 앱에서만 로그인할 수 있어요.");
}

export function loadFullScreenAd(opts: AdHandlers): () => void {
  const ads = nativeAds();
  if (!ads) return () => {};

  ensureBridge();
  loadListeners.add(opts);
  ads.loadRewarded();

  return () => {
    loadListeners.delete(opts);
  };
}

loadFullScreenAd.isSupported = () => nativeAds() !== null;

export function showFullScreenAd(opts?: AdHandlers): void {
  const ads = nativeAds();
  if (!ads) {
    opts?.onError?.(new Error("현재 환경에서는 광고를 표시할 수 없어요."));
    return;
  }

  ensureBridge();
  const requestId = `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
  if (opts) showListeners.set(requestId, opts);
  ads.showRewarded(requestId);
}

/** 경주 결과 등 자연스러운 끊김 지점에서만 호출한다. */
export function showInterstitialAd(): void {
  nativeAds()?.showInterstitial?.();
}

export function getAppsInTossGlobals(): { brandPrimaryColor: string } {
  return { brandPrimaryColor: "#3182F6" };
}

export function getSafeAreaInsets(): { top: number; bottom: number } {
  return { top: 0, bottom: 0 };
}

export function defineConfig<T>(config: T): T {
  return config;
}
