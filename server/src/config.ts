import "dotenv/config";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(fileURLToPath(import.meta.url));

export const config = {
  port: Number(process.env.PORT ?? 4000),
  appName: process.env.APP_NAME ?? "horserace",
  sessionSecret: process.env.SESSION_SECRET ?? "dev-change-me",
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
    `https://${process.env.APP_NAME ?? "horserace"}.private-apps.tossmini.com`,
    `https://${process.env.APP_NAME ?? "horserace"}.apps.tossmini.com`,
  ],
};
