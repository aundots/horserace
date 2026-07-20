/** Play Store / IARC 심사용 빌드 (토스 밖 WebView·TWA) */
export function isPlayStoreBuild(): boolean {
  return import.meta.env.VITE_PLAY_STORE === "true";
}

/**
 * Android 래퍼가 WebView 하단에 네이티브 AdMob 배너를 직접 그리는 경우.
 * 이때 웹 쪽 배너까지 띄우면 광고가 두 겹이 되어 밀도 정책에 걸린다.
 */
export function hasNativeBannerAd(): boolean {
  return typeof window !== "undefined" && Boolean(window.HorseraceAds);
}
