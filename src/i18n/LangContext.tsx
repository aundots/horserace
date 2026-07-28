import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { STRINGS, type Lang } from "./strings";

const STORAGE_KEY = "horserace.lang";

/** 저장된 선택이 없으면 기기 언어를 따르되, 한국어가 아니면 영어로 시작한다. */
function detectLang(): Lang {
  if (typeof window === "undefined") return "ko";
  const saved = localStorage.getItem(STORAGE_KEY);
  if (saved === "ko" || saved === "en") return saved;
  const nav = navigator.language?.toLowerCase() ?? "";
  return nav.startsWith("ko") ? "ko" : "en";
}

type LangContextValue = {
  lang: Lang;
  setLang: (lang: Lang) => void;
  toggleLang: () => void;
  t: (typeof STRINGS)["ko"];
};

const LangContext = createContext<LangContextValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang);

  const setLang = useCallback((next: Lang) => {
    setLangState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // 저장 실패해도 이번 세션 동안은 선택이 유지되므로 무시한다.
    }
  }, []);

  const toggleLang = useCallback(() => {
    setLang(lang === "ko" ? "en" : "ko");
  }, [lang, setLang]);

  const value = useMemo<LangContextValue>(
    () => ({
      lang,
      setLang,
      toggleLang,
      // 카탈로그는 두 언어가 같은 키를 갖지만 값 타입이 리터럴로 좁아져
      // 서로 호환되지 않는다 — 한국어 쪽 형태를 기준으로 맞춘다.
      t: STRINGS[lang] as (typeof STRINGS)["ko"],
    }),
    [lang, setLang, toggleLang],
  );

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useLang(): LangContextValue {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LangProvider");
  return ctx;
}

/** 문자열만 필요할 때 쓰는 축약 훅. */
export function useT() {
  return useLang().t;
}
