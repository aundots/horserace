export function showDevLogin(): boolean {
  if (import.meta.env.VITE_DEV_LOGIN !== "true") return false;
  if (import.meta.env.DEV) return true;
  return Boolean(import.meta.env.VITE_DEV_USER_KEY);
}

export function showDevAdsLink(): boolean {
  return import.meta.env.DEV;
}

export function devUserKeyForLogin(): number {
  const raw = import.meta.env.VITE_DEV_USER_KEY;
  if (raw) {
    const n = Number(raw);
    if (Number.isFinite(n)) return n;
  }
  return 10001;
}
