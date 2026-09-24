import { nonceKey } from "./adSsv.js";

/**
 * SSV 로 검증된 광고 시청 기록 저장소.
 *
 * SSV 콜백과 /ads/claim 은 서로 다른 서버리스 인스턴스로 들어올 수 있어서
 * 반드시 인스턴스 밖(Redis)에 남겨야 한다. 메모리 맵은 로컬 개발용 폴백이라
 * 재배포/콜드스타트 시 사라질 수 있다.
 */

const NONCE_TTL_SEC = 60 * 10;

export type VerifiedWatch = {
  placement: string;
  adUnit: string;
  transactionId: string;
  /** 보상 지급에 이미 사용됐는지 — 같은 광고로 두 번 받는 것을 막는다. */
  claimed: boolean;
};

const memory = new Map<string, { value: VerifiedWatch; expiresAt: number }>();

function redisConfig() {
  const url =
    process.env.UPSTASH_REDIS_REST_URL ?? process.env.KV_REST_API_URL ?? "";
  const token =
    process.env.UPSTASH_REDIS_REST_TOKEN ?? process.env.KV_REST_API_TOKEN ?? "";
  if (!url || !token) return null;
  return { url: url.replace(/\/$/, ""), token };
}

export function adNonceStoreDurable(): boolean {
  return Boolean(redisConfig());
}

async function redisCommand<T>(command: string[]): Promise<T | null> {
  const cfg = redisConfig();
  if (!cfg) return null;
  try {
    const res = await fetch(cfg.url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${cfg.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T };
    return data.result ?? null;
  } catch {
    return null;
  }
}

function sweepMemory() {
  const now = Date.now();
  for (const [key, entry] of memory) {
    if (entry.expiresAt <= now) memory.delete(key);
  }
}

export async function markVerified(
  nonce: string,
  watch: VerifiedWatch,
): Promise<void> {
  const key = nonceKey(nonce);
  memory.set(key, {
    value: watch,
    expiresAt: Date.now() + NONCE_TTL_SEC * 1000,
  });
  await redisCommand([
    "SET",
    key,
    JSON.stringify(watch),
    "EX",
    String(NONCE_TTL_SEC),
  ]);
}

export async function readVerified(nonce: string): Promise<VerifiedWatch | null> {
  const key = nonceKey(nonce);
  const raw = await redisCommand<string>(["GET", key]);
  if (typeof raw === "string") {
    try {
      return JSON.parse(raw) as VerifiedWatch;
    } catch {
      return null;
    }
  }
  sweepMemory();
  return memory.get(key)?.value ?? null;
}

/**
 * 보상 지급 직전에 호출 — 아직 안 쓴 검증 기록이면 사용 처리하고 그 기록을 반환.
 * 이미 쓴 기록/없는 기록이면 null 이라서 같은 광고로 중복 수령이 안 된다.
 *
 * 주의: Redis 없이(memory 폴백) 동시 요청이 오면 두 요청이 같은 기록을 동시에 읽어
 * 둘 다 통과할 수 있다(TOCTOU). 로컬 개발 한정 리스크이며, 운영은 항상 Redis를 쓴다.
 */
export async function consumeVerified(nonce: string): Promise<VerifiedWatch | null> {
  const watch = await readVerified(nonce);
  if (!watch || watch.claimed) return null;
  await markVerified(nonce, { ...watch, claimed: true });
  return watch;
}
