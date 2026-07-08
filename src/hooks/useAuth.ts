import { appLogin } from "@apps-in-toss/web-framework";
import { useToast } from "@toss/tds-mobile";
import { useCallback, useEffect, useState } from "react";
import { apiGet, apiPost, clearDemoState, clearPartyCode } from "../api/client";
import { isPlayStoreBuild } from "../lib/playStore";

const SESSION_KEY = "horserace.sessionId";

type LoginResponse = {
  ok: boolean;
  sessionId: string;
  userKey: number;
};

type MeResponse = {
  ok: boolean;
  userKey: number;
};

export function useAuth() {
  const toast = useToast();
  const [sessionId, setSessionId] = useState<string | null>(() =>
    localStorage.getItem(SESSION_KEY),
  );
  const [userKey, setUserKey] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function restore() {
      if (!sessionId) {
        setLoading(false);
        return;
      }
      try {
        const me = isPlayStoreBuild()
          ? await apiPost<MeResponse>("/auth/me", {}, sessionId)
          : await apiGet<MeResponse>("/auth/me", sessionId);
        if (!cancelled) setUserKey(me.userKey);
      } catch {
        localStorage.removeItem(SESSION_KEY);
        clearDemoState();
        if (!cancelled) setSessionId(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    restore();
    return () => {
      cancelled = true;
    };
  }, [sessionId]);

  const login = useCallback(async () => {
    try {
      const { authorizationCode, referrer } = await appLogin();
      const result = await apiPost<LoginResponse>("/auth/login", {
        authorizationCode,
        referrer,
      });
      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      setUserKey(result.userKey);
      toast.openToast("로그인되었어요.", { type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "로그인에 실패했어요.";
      toast.openToast(message, { type: "bottom" });
    }
  }, [toast]);

  const demoLogin = useCallback(async () => {
    try {
      const result = await apiPost<LoginResponse>("/auth/demo-login", {});
      localStorage.setItem(SESSION_KEY, result.sessionId);
      setSessionId(result.sessionId);
      setUserKey(result.userKey);
      toast.openToast("체험 모드로 시작했어요.", { type: "success" });
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "체험 로그인에 실패했어요.";
      toast.openToast(message, { type: "bottom" });
    }
  }, [toast]);

  const logout = useCallback(() => {
    localStorage.removeItem(SESSION_KEY);
    clearDemoState();
    clearPartyCode();
    setSessionId(null);
    setUserKey(null);
  }, []);

  return {
    sessionId,
    userKey,
    loading,
    isLoggedIn: Boolean(userKey),
    login,
    demoLogin,
    isPlayStore: isPlayStoreBuild(),
    logout,
  };
}
