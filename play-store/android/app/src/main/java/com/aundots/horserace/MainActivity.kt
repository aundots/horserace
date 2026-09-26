package com.aundots.horserace

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import android.widget.LinearLayout
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat
import com.google.android.gms.ads.AdRequest
import com.google.android.gms.ads.AdSize
import com.google.android.gms.ads.AdView
import com.google.android.gms.ads.MobileAds

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private lateinit var bannerView: AdView
    private var safeInsetTopPx = 0
    private var safeInsetRightPx = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#3182F6")

        webView = WebView(this)
        bannerView = AdView(this).apply {
            adUnitId = BuildConfig.ADMOB_BANNER_ID
            setAdSize(adaptiveBannerSize())
        }

        // WebView(가변) + 하단 고정 배너 1개. 배너를 여러 개 쌓으면 AdMob 광고 밀도 정책 위반.
        val root = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            addView(
                webView,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    0,
                    1f,
                ),
            )
            addView(
                bannerView,
                LinearLayout.LayoutParams(
                    LinearLayout.LayoutParams.MATCH_PARENT,
                    LinearLayout.LayoutParams.WRAP_CONTENT,
                ),
            )
        }

        ViewCompat.setOnApplyWindowInsetsListener(root) { view, windowInsets ->
            val bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            safeInsetTopPx = bars.top
            safeInsetRightPx = bars.right
            view.setPadding(0, 0, 0, bars.bottom)
            injectSafeArea(webView)
            windowInsets
        }
        setContentView(root)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }
        webView.addJavascriptInterface(SafeAreaBridge(), "HorseraceAndroid")
        webView.addJavascriptInterface(AdBridge(this, webView), "HorseraceAds")
        webView.webChromeClient = WebChromeClient()
        webView.webViewClient = object : WebViewClient() {
            override fun onPageFinished(view: WebView?, url: String?) {
                super.onPageFinished(view, url)
                view?.let { injectSafeArea(it) }
            }

            override fun shouldOverrideUrlLoading(
                view: WebView,
                request: WebResourceRequest,
            ): Boolean {
                val url = request.url.toString()
                return !url.startsWith("https://aundots.github.io/horserace/play")
            }
        }
        webView.loadUrl("https://aundots.github.io/horserace/play/")

        // 배너는 onCreate 안에서 바로 로드 요청을 보내는 유일한 광고라 SDK 초기화
        // 완료 전에 요청이 나가기 쉽다. 보상형/전면은 JS가 WebView 로드 이후에
        // 호출해서 초기화가 이미 끝나 있다.
        MobileAds.initialize(this) {
            bannerView.loadAd(AdRequest.Builder().build())
        }

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    // page 는 React state 라 실제 브라우저 히스토리가 안 쌓여서
                    // canGoBack()은 늘 false다 — 대신 앱(App.tsx)에 직접 물어본다.
                    // window.__horseraceBack() 이 false 면 앱이 알아서 홈으로
                    // 이동했다는 뜻이라 그대로 두고, true(=이미 홈)면 액티비티를 닫는다.
                    webView.evaluateJavascript(
                        "(window.__horseraceBack ? window.__horseraceBack() : true).toString()",
                    ) { result ->
                        if (result == "true") finish()
                    }
                }
            },
        )
    }

    /** 화면 폭에 맞춘 앵커 배너 — 고정 320x50 보다 채움률과 eCPM 이 높다. */
    private fun adaptiveBannerSize(): AdSize {
        val widthPx = resources.displayMetrics.widthPixels
        val widthDp = (widthPx / resources.displayMetrics.density).toInt()
        return AdSize.getCurrentOrientationAnchoredAdaptiveBannerAdSize(this, widthDp)
    }

    override fun onPause() {
        bannerView.pause()
        super.onPause()
    }

    override fun onResume() {
        super.onResume()
        bannerView.resume()
    }

    override fun onDestroy() {
        bannerView.destroy()
        super.onDestroy()
    }

    private fun injectSafeArea(view: WebView) {
        val top = safeInsetTopPx.coerceAtLeast(0)
        val right = safeInsetRightPx.coerceAtLeast(0)
        view.evaluateJavascript(
            """
            (function(){
              var root = document.documentElement;
              root.classList.add('play-store');
              root.style.setProperty('--app-safe-top-fallback', '${top}px');
              root.style.setProperty('--app-safe-right-fallback', '${right}px');
            })();
            """.trimIndent(),
            null,
        )
    }

    private inner class SafeAreaBridge {
        @JavascriptInterface
        fun getSafeAreaTopPx(): Int = safeInsetTopPx

        @JavascriptInterface
        fun getSafeAreaRightPx(): Int = safeInsetRightPx
    }
}
