import { isPlayStoreBuild } from "./playStore";

type AndroidSafeAreaBridge = {
  getSafeAreaTopPx?: () => number;
  getSafeAreaRightPx?: () => number;
};

/** Apply native WebView insets when the Android wrapper exposes them. */
export function applyNativeSafeAreaInsets() {
  if (!isPlayStoreBuild() || typeof window === "undefined") return;

  const bridge = (window as Window & { HorseraceAndroid?: AndroidSafeAreaBridge })
    .HorseraceAndroid;
  if (!bridge?.getSafeAreaTopPx) return;

  const root = document.documentElement;
  const top = Math.max(0, bridge.getSafeAreaTopPx?.() ?? 0);
  const right = Math.max(0, bridge.getSafeAreaRightPx?.() ?? 0);
  if (top > 0) root.style.setProperty("--app-safe-top-fallback", `${top}px`);
  if (right > 0) root.style.setProperty("--app-safe-right-fallback", `${right}px`);
}
