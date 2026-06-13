/** Play Store / IARC 심사용 빌드 (토스 밖 WebView·TWA) */
export function isPlayStoreBuild(): boolean {
  return import.meta.env.VITE_PLAY_STORE === "true";
}
