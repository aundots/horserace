import {
  loadFullScreenAd,
  showFullScreenAd,
} from "@apps-in-toss/web-framework";
import { useToast } from "@toss/tds-mobile";
import { useCallback, useEffect, useRef, useState } from "react";

interface Reward {
  unitType: string;
  unitAmount: number;
}

interface PendingReward {
  resolve: (reward: Reward) => void;
  reject: (error: Error) => void;
}

interface UseInAppAdsReturn {
  isAdLoaded: boolean;
  isSupported: boolean;
  showAd: () => void;
  showRewardedAd: () => Promise<Reward>;
  lastReward: Reward | null;
}

// 참고문서: https://developers-apps-in-toss.toss.im/ads/intro.html
export function useInAppAds(adGroupId: string): UseInAppAdsReturn {
  const toast = useToast();

  const [isAdLoaded, setIsAdLoaded] = useState(false);
  const [lastReward, setLastReward] = useState<Reward | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const unregisterRef = useRef<(() => void) | null>(null);
  const pendingRewardRef = useRef<PendingReward | null>(null);

  const clearPending = useCallback((error?: Error) => {
    if (!pendingRewardRef.current) return;
    if (error) pendingRewardRef.current.reject(error);
    pendingRewardRef.current = null;
  }, []);

  const handleShowEvent = useCallback(
    (event: { type: string; data?: Reward }) => {
      switch (event.type) {
        case "userEarnedReward":
          if (event.data) {
            toast.openToast(
              `보상 획득: ${event.data.unitType} ${event.data.unitAmount}개`,
            );
            setLastReward(event.data);
            pendingRewardRef.current?.resolve(event.data);
            pendingRewardRef.current = null;
          }
          break;
        case "dismissed":
          clearPending(new Error("광고가 닫혔어요."));
          setIsAdLoaded(false);
          break;
        case "failedToShow":
          clearPending(new Error("광고 표시에 실패했어요."));
          setIsAdLoaded(false);
          break;
      }
    },
    [clearPending, toast],
  );

  /**
   * 광고를 로드합니다.
   */
  const load = useCallback(() => {
    setIsAdLoaded(false);

    try {
      unregisterRef.current = loadFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (event.type === "loaded") {
            setIsAdLoaded(true);
          }
        },
        onError: (error) => {
          console.error("광고 로드 실패:", error);
        },
      });
    } catch (error) {
      console.error("광고 로드 실패:", error);
      setIsAdLoaded(false);
    }
  }, [adGroupId]);

  const reloadAfterShow = useCallback(() => {
    load();
  }, [load]);

  useEffect(() => {
    try {
      const supported = loadFullScreenAd.isSupported();
      setIsSupported(supported);
      if (supported) load();
    } catch {
      // 브라우저 로컬 개발: 조용히 비활성화 (다이얼로그로 화면 가림 방지)
      setIsSupported(false);
    }

    return () => {
      clearPending(new Error("광고가 취소됐어요."));
      try {
        unregisterRef.current?.();
      } catch (error) {
        console.error("광고 정리(cleanup) 중 에러:", error);
      }
    };
  }, [clearPending, load]);

  const invokeShow = useCallback(
    (trackReward: boolean) => {
      showFullScreenAd({
        options: { adGroupId },
        onEvent: (event) => {
          if (trackReward) {
            handleShowEvent(event);
            if (event.type === "dismissed" || event.type === "failedToShow") {
              reloadAfterShow();
            }
          } else {
            switch (event.type) {
              case "userEarnedReward":
                if (event.data) {
                  toast.openToast(
                    `보상 획득: ${event.data.unitType} ${event.data.unitAmount}개`,
                  );
                  setLastReward(event.data);
                }
                break;
              case "dismissed":
              case "failedToShow":
                setIsAdLoaded(false);
                reloadAfterShow();
                break;
            }
          }
        },
        onError: (error) => {
          console.error("광고 표시 실패:", error);
          if (trackReward) {
            clearPending(
              error instanceof Error ? error : new Error("광고 표시에 실패했어요."),
            );
          }
          setIsAdLoaded(false);
          reloadAfterShow();
        },
      });
    },
    [adGroupId, clearPending, handleShowEvent, reloadAfterShow, toast],
  );

  /**
   * 광고를 실제로 화면에 표시합니다.
   * - 지원되지 않는 환경이거나, 아직 로드되지 않은 경우에는 아무 동작도 하지 않습니다.
   */
  const showAd = useCallback(() => {
    if (!isSupported) {
      console.info("현재 환경에서는 인앱 광고가 지원되지 않습니다.");
      return;
    }

    if (!isAdLoaded) {
      console.info("아직 광고가 로드되지 않았습니다.");
      return;
    }

    try {
      invokeShow(false);
    } catch (error) {
      console.error("광고 표시 실패:", error);
      setIsAdLoaded(false);
      reloadAfterShow();
    }
  }, [invokeShow, isAdLoaded, isSupported, reloadAfterShow]);

  const showRewardedAd = useCallback((): Promise<Reward> => {
    if (!isSupported) {
      return Promise.reject(new Error("현재 환경에서는 인앱 광고가 지원되지 않습니다."));
    }

    if (!isAdLoaded) {
      return Promise.reject(new Error("아직 광고가 로드되지 않았습니다."));
    }

    if (pendingRewardRef.current) {
      return Promise.reject(new Error("이미 광고를 표시 중이에요."));
    }

    return new Promise((resolve, reject) => {
      pendingRewardRef.current = { resolve, reject };
      try {
        invokeShow(true);
      } catch (error) {
        pendingRewardRef.current = null;
        reject(error instanceof Error ? error : new Error("광고 표시에 실패했어요."));
      }
    });
  }, [invokeShow, isAdLoaded, isSupported]);

  return { isAdLoaded, isSupported, showAd, showRewardedAd, lastReward };
}
