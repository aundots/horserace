package com.aundots.horserace

import android.annotation.SuppressLint
import android.graphics.Color
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebChromeClient
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.webkit.WebViewClient
import androidx.activity.OnBackPressedCallback
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.ViewCompat
import androidx.core.view.WindowCompat
import androidx.core.view.WindowInsetsCompat

class MainActivity : AppCompatActivity() {
    private lateinit var webView: WebView
    private var safeInsetTopPx = 0
    private var safeInsetRightPx = 0

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        WindowCompat.setDecorFitsSystemWindows(window, false)
        window.statusBarColor = Color.parseColor("#3182F6")

        webView = WebView(this)
        ViewCompat.setOnApplyWindowInsetsListener(webView) { view, windowInsets ->
            val bars = windowInsets.getInsets(WindowInsetsCompat.Type.systemBars())
            safeInsetTopPx = bars.top
            safeInsetRightPx = bars.right
            injectSafeArea(view as WebView)
            windowInsets
        }
        setContentView(webView)

        webView.settings.apply {
            javaScriptEnabled = true
            domStorageEnabled = true
            mediaPlaybackRequiresUserGesture = false
            allowFileAccess = false
            allowContentAccess = false
        }
        webView.addJavascriptInterface(SafeAreaBridge(), "HorseraceAndroid")
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

        onBackPressedDispatcher.addCallback(
            this,
            object : OnBackPressedCallback(true) {
                override fun handleOnBackPressed() {
                    if (webView.canGoBack()) webView.goBack() else finish()
                }
            },
        )
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
