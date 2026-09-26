import fs from "node:fs";
import https from "node:https";
import { config } from "../config.js";

let agent: https.Agent | null = null;

function getAgent(): https.Agent {
  if (agent) return agent;

  const { certPath, keyPath } = config.mtls;
  if (!fs.existsSync(certPath) || !fs.existsSync(keyPath)) {
    throw new Error(
      `mTLS 인증서가 없습니다. ${certPath}, ${keyPath} 를 콘솔에서 발급 후 server/cert/ 에 넣어주세요.`,
    );
  }

  agent = new https.Agent({
    cert: fs.readFileSync(certPath),
    key: fs.readFileSync(keyPath),
    rejectUnauthorized: true,
  });
  return agent;
}

type TossResult<T> =
  | { resultType: "SUCCESS"; success: T }
  | { resultType: "FAIL"; error: { errorCode?: string; reason?: string } };

export async function tossRequest<T>(
  pathname: string,
  options: {
    method?: "GET" | "POST";
    body?: unknown;
    accessToken?: string;
  } = {},
): Promise<T> {
  const url = new URL(pathname, config.tossApiBase);
  const method = options.method ?? (options.body ? "POST" : "GET");
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const payload = options.body ? JSON.stringify(options.body) : undefined;

  const responseText = await new Promise<string>((resolve, reject) => {
    const req = https.request(
      url,
      { method, headers, agent: getAgent() },
      (res) => {
        let data = "";
        res.on("data", (chunk) => {
          data += chunk;
        });
        res.on("end", () => {
          if ((res.statusCode ?? 500) >= 400) {
            reject(new Error(`Toss API ${res.statusCode}: ${data}`));
            return;
          }
          resolve(data);
        });
      },
    );
    req.on("error", reject);
    if (payload) req.write(payload);
    req.end();
  });

  const parsed = JSON.parse(responseText) as TossResult<T>;
  if (parsed.resultType === "FAIL") {
    throw new Error(
      parsed.error?.reason ??
        parsed.error?.errorCode ??
        "Toss API 요청에 실패했습니다.",
    );
  }
  return parsed.success;
}
