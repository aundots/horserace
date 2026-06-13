const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";
const DEMO_STATE_KEY = "horserace.demoState";
const IS_PLAY_STORE = import.meta.env.VITE_PLAY_STORE === "true";

function readDemoState(): string | null {
  return localStorage.getItem(DEMO_STATE_KEY);
}

function demoHeaders(): Record<string, string> {
  if (!IS_PLAY_STORE) return {};
  const demoState = readDemoState();
  return demoState ? { "X-Horserace-Demo-State": demoState } : {};
}

function saveDemoState(data: unknown) {
  if (!IS_PLAY_STORE || !data || typeof data !== "object") return;
  const token = (data as { demoState?: string }).demoState;
  if (token) localStorage.setItem(DEMO_STATE_KEY, token);
}

export function clearDemoState() {
  localStorage.removeItem(DEMO_STATE_KEY);
}

export async function apiPost<T>(
  path: string,
  body: unknown,
  sessionId?: string | null,
): Promise<T> {
  const demoState = readDemoState();
  const requestBody =
    IS_PLAY_STORE && demoState
      ? {
          ...(body && typeof body === "object" && body !== null
            ? (body as Record<string, unknown>)
            : {}),
          _demoState: demoState,
        }
      : body;

  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "X-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(requestBody),
  });
  const data = await res.json();
  saveDemoState(data);
  if (!res.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }
  return data as T;
}

export async function apiGet<T>(path: string, sessionId?: string | null) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: {
      ...demoHeaders(),
      ...(sessionId ? { "X-Session-Id": sessionId } : {}),
    },
  });
  const data = await res.json();
  saveDemoState(data);
  if (!res.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }
  return data as T;
}
