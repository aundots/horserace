import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

/**
 * 세션 토큰(HMAC) 서명 키. 이게 새어나가거나 예측 가능하면 누구든 임의
 * userKey로 세션을 위조할 수 있다 — 프로덕션에서 이 값이 안 잡혀 있는 채로
 * "dev-change-me" 같은 뻔한 문자열로 조용히 넘어가면 안 된다. 로컬 개발
 * 편의를 위해 그 경우에만 폴백을 허용하고 경고를 남긴다.
 */
function resolveSessionSecret(): string {
  const fromEnv = process.env.SESSION_SECRET;
  if (fromEnv) return fromEnv;

  const isProd =
    process.env.NODE_ENV === "production" || process.env.VERCEL_ENV === "production";
  if (isProd) {
    throw new Error(
      "SESSION_SECRET이 설정되지 않았어요. 프로덕션에서는 예측 가능한 기본값으로 세션을 서명할 수 없습니다.",
    );
  }

  console.warn(
    "[config] SESSION_SECRET이 없어서 개발용 기본값을 씁니다 — 프로덕션에서는 반드시 설정하세요.",
  );
  return "dev-change-me";
}

export const config = {
  port: Number(process.env.PORT ?? 4000),
  appName: process.env.APP_NAME ?? "horserun",
  sessionSecret: resolveSessionSecret(),
  databaseUrl: process.env.DATABASE_URL ?? "",
  mtls: {
    certPath: path.resolve(
      root,
      "..",
      process.env.MTLS_CERT_PATH ?? "cert/client-cert.pem",
    ),
    keyPath: path.resolve(
      root,
      "..",
      process.env.MTLS_KEY_PATH ?? "cert/client-key.pem",
    ),
  },
  tossApiBase: "https://apps-in-toss-api.toss.im",
  corsOrigins: [
    "http://localhost:5173",
    "http://localhost:4173",
    "https://aundots.github.io",
    ...(process.env.CORS_ORIGINS?.split(",")
      .map((origin) => origin.trim())
      .filter(Boolean) ?? []),
    `https://${process.env.APP_NAME ?? "horserun"}.private-apps.tossmini.com`,
    `https://${process.env.APP_NAME ?? "horserun"}.apps.tossmini.com`,
  ],
};
