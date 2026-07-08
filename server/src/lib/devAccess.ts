export function getDevUserKey(): number | null {
  const raw = process.env.DEV_USER_KEY;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Unlimited tickets, ad eligibility bypass — only when DEV_LOGIN=true and DEV_USER_KEY matches. */
export function isDevUser(userKey: number): boolean {
  if (process.env.DEV_LOGIN !== "true") return false;
  const devKey = getDevUserKey();
  if (devKey === null) return false;
  return userKey === devKey;
}
