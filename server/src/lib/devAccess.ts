export function getDevUserKey(): number | null {
  const raw = process.env.DEV_USER_KEY;
  if (!raw) return null;
  const n = Number(raw);
  return Number.isFinite(n) ? n : null;
}

/** Unlimited tickets, ad eligibility bypass — only for the configured dev user. */
export function isDevUser(userKey: number): boolean {
  if (process.env.DEV_LOGIN !== "true") return false;
  const devKey = getDevUserKey();
  if (devKey === null) return false;
  return userKey === devKey;
}

export function canDevLogin(requestedUserKey: number): boolean {
  if (process.env.DEV_LOGIN !== "true") return false;
  const devKey = getDevUserKey();
  if (devKey === null) return true;
  return requestedUserKey === devKey;
}
