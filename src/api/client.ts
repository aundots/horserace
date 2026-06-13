const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:4000";

export async function apiPost<T>(
  path: string,
  body: unknown,
  sessionId?: string | null,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(sessionId ? { "X-Session-Id": sessionId } : {}),
    },
    body: JSON.stringify(body),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }
  return data as T;
}

export async function apiGet<T>(path: string, sessionId?: string | null) {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: sessionId ? { "X-Session-Id": sessionId } : undefined,
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message ?? "요청에 실패했습니다.");
  }
  return data as T;
}
