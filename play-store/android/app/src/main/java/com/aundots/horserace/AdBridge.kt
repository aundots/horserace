package com.aundots.horserace

import android.app.Activity
import android.webkit.JavascriptInterface
import android.webkit.WebView
import com.google.android.gms.ads.AdError
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.FullScreenContentCallback
import com.google.android.gms.ads.LoadAdError
import com.google.android.gms.ads.interstitial.InterstitialAd
import com.google.android.gms.ads.interstitial.InterstitialAdLoadCallback
import com.google.android.gms.ads.rewarded.RewardedAd
import com.google.android.gms.ads.rewarded.RewardedAdLoadCallback
import com.google.android.gms.ads.rewarded.ServerSideVerificationOptions
import org.json.JSONObject

/**
 * WebView 안의 JS 에 AdMob 보상형/전면 광고를 노출하는 브릿지.
 *
 * JS 쪽 계약 (src/play/shim/apps-in-toss-web-framework.ts 와 짝):
 *   HorseraceAds.isSupported() / loadRewarded() / showRewarded(requestId) / showInterstitial()
 * 이벤트는 window.__horseraceAds.emit({ type, requestId, data }) 로 되돌려준다.
 * type: loaded | failedToLoad | userEarnedReward | dismissed | failedToShow
 */
class AdBridge(
    private val activity: Activity,
    private val webView: WebView,
) {
    private var rewardedAd: RewardedAd? = null
    private var interstitialAd: InterstitialAd? = null
    private var rewardedLoading = false
    private var interstitialLoading = false

    /** JS 로 이벤트 전달 — 항상 UI 스레드에서 evaluateJavascript 호출. */
    private fun emit(type: String, requestId: String?, data: JSONObject? = null) {
        val payload = JSONObject().apply {
            put("type", type)
            put("requestId", requestId ?: JSONObject.NULL)
            put("data", data ?: JSONObject.NULL)
        }
        activity.runOnUiThread {
            webView.evaluateJavascript(
                "window.__horseraceAds && window.__horseraceAds.emit($payload);",
                null,
            )
        }
    }

    @JavascriptInterface
    fun isSupported(): Boolean = true

    @JavascriptInterface
    fun loadRewarded() {
        activity.runOnUiThread { loadRewardedInternal() }
    }

    private fun loadRewardedInternal() {
        if (rewardedLoading || rewardedAd != null) return
        rewardedLoading = true

        RewardedAd.load(
            activity,
            BuildConfig.ADMOB_REWARDED_ID,
            AdRequest.Builder().build(),
            object : RewardedAdLoadCallback() {
                override fun onAdLoaded(ad: RewardedAd) {
                    rewardedLoading = false
                    rewardedAd = ad
                    emit("loaded", null)
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    rewardedLoading = false
                    rewardedAd = null
                    emit(
                        "failedToLoad",
                        null,
                        JSONObject().put("message", error.message),
                    )
                }
            },
        )
    }

    @JavascriptInterface
    fun showRewarded(requestId: String) {
        activity.runOnUiThread {
            val ad = rewardedAd
            if (ad == null) {
                emit(
                    "failedToShow",
                    requestId,
                    JSONObject().put("message", "광고가 아직 준비되지 않았어요."),
                )
                loadRewardedInternal()
                return@runOnUiThread
            }

            // requestId 를 SSV customData 로 실어 보낸다 — 서버가 /ads/ssv 콜백에서
            // 같은 값을 받아 "이 requestId 로 실제 광고가 끝까지 재생됐다"를 검증한다.
            ad.setServerSideVerificationOptions(
                ServerSideVerificationOptions.Builder()
                    .setCustomData(requestId)
                    .build(),
            )

            // 보상을 실제로 받았는지 — dismissed 이벤트가 먼저 올 수 있어 플래그로 구분한다.
            var earned = false

            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    rewardedAd = null
                    if (!earned) emit("dismissed", requestId)
                    loadRewardedInternal()
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    rewardedAd = null
                    emit(
                        "failedToShow",
                        requestId,
                        JSONObject().put("message", error.message),
                    )
                    loadRewardedInternal()
                }
            }

            ad.show(activity) { reward ->
                earned = true
                emit(
                    "userEarnedReward",
                    requestId,
                    JSONObject().apply {
                        put("unitType", reward.type)
                        put("unitAmount", reward.amount)
                    },
                )
            }
        }
    }

    @JavascriptInterface
    fun loadInterstitial() {
        activity.runOnUiThread { loadInterstitialInternal() }
    }

    private fun loadInterstitialInternal() {
        if (interstitialLoading || interstitialAd != null) return
        interstitialLoading = true

        InterstitialAd.load(
            activity,
            BuildConfig.ADMOB_INTERSTITIAL_ID,
            AdRequest.Builder().build(),
            object : InterstitialAdLoadCallback() {
                override fun onAdLoaded(ad: InterstitialAd) {
                    interstitialLoading = false
                    interstitialAd = ad
                }

                override fun onAdFailedToLoad(error: LoadAdError) {
                    interstitialLoading = false
                    interstitialAd = null
                }
            },
        )
    }

    /** 경주 결과처럼 자연스러운 끊김 지점에서만 호출한다. */
    @JavascriptInterface
    fun showInterstitial() {
        activity.runOnUiThread {
            val ad = interstitialAd ?: run {
                loadInterstitialInternal()
                return@runOnUiThread
            }
            ad.fullScreenContentCallback = object : FullScreenContentCallback() {
                override fun onAdDismissedFullScreenContent() {
                    interstitialAd = null
                    loadInterstitialInternal()
                }

                override fun onAdFailedToShowFullScreenContent(error: AdError) {
                    interstitialAd = null
                    loadInterstitialInternal()
                }
            }
            ad.show(activity)
        }
    }
}
