const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEMO_STATE_KEY = "horserace.demoState";
const PARTY_CODE_KEY = "horserace.partyCode";
const IS_PLAY_STORE = import.meta.env.VITE_PLAY_STORE === "true";

function readDemoState(): string | null {
  return localStorage.getItem(DEMO_STATE_KEY);
}

export function readPartyCode(): string | null {
  return localStorage.getItem(PARTY_CODE_KEY);
}

export function savePartyCode(code: string | null | undefined) {
  if (!code) {
    localStorage.removeItem(PARTY_CODE_KEY);
    return;
  }
  localStorage.setItem(PARTY_CODE_KEY, code.toUpperCase());
}

export function clearPartyCode() {
  localStorage.removeItem(PARTY_CODE_KEY);
}

function demoHeaders(): Record<string, string> {
  // Demo state is sent on POST bodies (_demoState). Custom headers on GET trigger
  // CORS preflight; keep GET requests header-free until all API hosts allow
  // X-Horserace-Demo-State.
  return {};
}

function saveDemoState(data: unknown) {
  if (!IS_PLAY_STORE || !data || typeof data !== "object") return;
  const token = (data as { demoState?: string }).demoState;
  if (token) localStorage.setItem(DEMO_STATE_KEY, token);
}

export function clearDemoState() {
  localStorage.removeItem(DEMO_STATE_KEY);
}

function withPlayPayload(body: unknown): unknown {
  if (!IS_PLAY_STORE) return body;
  const base =
    body && typeof body === "object" && body !== null
      ? { ...(body as Record<string, unknown>) }
      : {};
  const demoState = readDemoState();
  if (demoState) base._demoState = demoState;
  const partyCode = readPartyCode();
  if (partyCode) base.partyCode = partyCode;
  return base;
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  sessionId?: string | null,
): Promise<T> {
  const requestBody = withPlayPayload(body);

  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(sessionId ? { "X-Session-Id": sessionId } : {}),
      },
      body: JSON.stringify(requestBody),
    });
  } catch {
    throw new Error("서버에 연결할 수 없어요. 네트워크를 확인해 주세요.");
  }
  const data = await res.json();
  saveDemoState(data);
  if (!res.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }
  return data as T;
}

export async function apiGet<T>(path: string, sessionId?: string | null) {
  let res: Response;
  try {
    res = await fetch(`${API_BASE}${path}`, {
      headers: {
        ...demoHeaders(),
        ...(sessionId ? { "X-Session-Id": sessionId } : {}),
      },
    });
  } catch {
    throw new Error("서버에 연결할 수 없어요. 네트워크를 확인해 주세요.");
  }
  const data = await res.json();
  saveDemoState(data);
  if (!res.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }
  return data as T;
}
