import { useCallback } from "react";
import type { PlayerSnapshot } from "../types/game";
import { useInAppAds } from "./useInAppAds";

const AD_GROUP_ID =
  import.meta.env.VITE_AD_GROUP_ID ?? "ait-ad-test-rewarded-id";

const AD_DEV_MOCK =
  import.meta.env.DEV || import.meta.env.VITE_AD_DEV_MOCK === "true";

type ClaimResult = { message: string; snapshot: PlayerSnapshot };

function buildRewardToken(reward?: {
  unitType: string;
  unitAmount: number;
  requestId?: string;
}) {
  // Play 빌드(AdMob)는 requestId가 SSV로 검증된 nonce라서, 이 형태로 보내면
  // 서버가 실제 시청 여부를 확인하고 보상을 준다. 없으면(토스 인앱광고) 기존 방식.
  if (reward?.requestId) {
    return `ssv:${reward.requestId}`;
  }
  if (reward) {
    return `reward-${Date.now()}-${reward.unitType}-${reward.unitAmount}`;
  }
  return `reward-${Date.now()}`;
}

export function useMonetization(
  claimReward: (placement: string, adToken: string) => Promise<ClaimResult>,
) {
  const { isAdLoaded, isSupported, showRewardedAd } = useInAppAds(AD_GROUP_ID);

  const watchAdForReward = useCallback(
    async (placement: string): Promise<ClaimResult> => {
      if (isSupported && isAdLoaded) {
        const reward = await showRewardedAd();
        return claimReward(placement, buildRewardToken(reward));
      }

      if (AD_DEV_MOCK) {
        return claimReward(placement, `dev-${Date.now()}`);
      }

      throw new Error("광고를 시청할 수 없는 환경이에요.");
    },
    [claimReward, isAdLoaded, isSupported, showRewardedAd],
  );

  return { isAdLoaded, isSupported, showRewardedAd: watchAdForReward };
}
