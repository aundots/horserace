import { createHash, createVerify } from "node:crypto";

/**
 * AdMob 서버 사이드 검증(SSV).
 *
 * 흐름:
 *   1) 클라이언트가 nonce 를 만들어 customData 로 광고에 실어 보낸다
 *   2) 유저가 광고를 끝까지 보면 AdMob 서버가 /ads/ssv 콜백을 호출한다
 *   3) 이 모듈이 Google 공개키로 서명을 검증하고 nonce 를 "검증됨"으로 저장한다
 *   4) 클라이언트가 /ads/claim 에 nonce 를 내면 그때 보상을 지급한다
 *
 * 클라이언트가 만든 토큰을 그대로 믿으면 광고를 안 봐도 보상을 받을 수 있으므로,
 * 보상 지급 판단은 반드시 이 경로를 통해야 한다.
 *
 * 참고: https://developers.google.com/admob/android/ssv
 */

const VERIFIER_KEYS_URL = "https://www.gstatic.com/admob/reward/verifier-keys.json";
const KEY_CACHE_TTL_MS = 24 * 60 * 60 * 1000;
/** 오래된 콜백 재사용(replay) 차단 — AdMob 은 보통 수 초 내에 호출한다. */
const CALLBACK_MAX_AGE_MS = 10 * 60 * 1000;

type VerifierKey = { keyId: string; pem: string; base64: string };

let keyCache: { keys: Map<string, string>; fetchedAt: number } | null = null;

async function getVerifierKeys(): Promise<Map<string, string>> {
  if (keyCache && Date.now() - keyCache.fetchedAt < KEY_CACHE_TTL_MS) {
    return keyCache.keys;
  }

  const res = await fetch(VERIFIER_KEYS_URL);
  if (!res.ok) {
    // 캐시가 있으면 만료됐더라도 쓰는 편이 검증 전면 실패보다 낫다.
    if (keyCache) return keyCache.keys;
    throw new Error(`검증 키를 가져오지 못했어요 (${res.status})`);
  }

  const body = (await res.json()) as { keys?: VerifierKey[] };
  const keys = new Map<string, string>();
  for (const key of body.keys ?? []) {
    if (key.keyId && key.pem) keys.set(String(key.keyId), key.pem);
  }

  keyCache = { keys, fetchedAt: Date.now() };
  return keys;
}

export type SsvParams = {
  /** 서명 대상 문자열 — 원본 쿼리스트링에서 &signature= 앞까지. */
  signedContent: string;
  signature: string;
  keyId: string;
  transactionId: string;
  customData: string;
  adUnit: string;
  timestampMs: number;
};

/**
 * AdMob 콜백 쿼리스트링을 파싱한다.
 *
 * 서명 대상은 "signature 파라미터 앞까지의 원본 문자열"이므로,
 * 파싱된 객체를 다시 직렬화하면 순서·인코딩이 달라져 검증에 실패한다.
 * 반드시 원본 rawQuery 를 잘라서 써야 한다.
 */
export function parseSsvQuery(rawQuery: string): SsvParams | null {
  const sigIndex = rawQuery.indexOf("&signature=");
  if (sigIndex === -1) return null;

  const signedContent = rawQuery.slice(0, sigIndex);
  const params = new URLSearchParams(rawQuery);

  const signature = params.get("signature");
  const keyId = params.get("key_id");
  const transactionId = params.get("transaction_id");
  if (!signature || !keyId || !transactionId) return null;

  const timestamp = Number(params.get("timestamp") ?? 0);

  return {
    signedContent,
    signature,
    keyId,
    transactionId,
    customData: params.get("custom_data") ?? "",
    adUnit: params.get("ad_unit") ?? "",
    // AdMob timestamp 는 마이크로초 단위로 온다.
    timestampMs: Number.isFinite(timestamp) ? Math.floor(timestamp / 1000) : 0,
  };
}

/** base64url → base64 (AdMob 서명은 base64url 인코딩). */
function base64UrlToBuffer(input: string): Buffer {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  return Buffer.from(normalized, "base64");
}

export async function verifySsvSignature(params: SsvParams): Promise<boolean> {
  const keys = await getVerifierKeys();
  const pem = keys.get(params.keyId);
  if (!pem) return false;

  if (
    params.timestampMs > 0 &&
    Date.now() - params.timestampMs > CALLBACK_MAX_AGE_MS
  ) {
    return false;
  }

  try {
    const verifier = createVerify("SHA256");
    verifier.update(params.signedContent);
    verifier.end();
    return verifier.verify(pem, base64UrlToBuffer(params.signature));
  } catch {
    return false;
  }
}

/** nonce 원문을 그대로 키에 넣지 않도록 해시해서 저장한다. */
export function nonceKey(nonce: string): string {
  return `ads:ssv:${createHash("sha256").update(nonce).digest("hex").slice(0, 32)}`;
}
