plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

/** keystore.env 의 ../horserace-release.jks 는 android/ 루트 기준 */
fun resolveKeystoreFile(): java.io.File {
    val envPath = System.getenv("PLAY_KEYSTORE")
    if (!envPath.isNullOrBlank()) {
        val fromRoot = rootProject.file(envPath)
        if (fromRoot.exists()) return fromRoot
        val fromModule = file(envPath)
        if (fromModule.exists()) return fromModule
    }
    return rootProject.file("../horserace-release.jks")
}

/**
 * AdMob ID — 기본값은 Google 공식 테스트 ID.
 * 실제 ID 는 keystore.env 처럼 환경변수로 주입한다 (자기 앱의 실광고 클릭은 정책 위반).
 * 예) ADMOB_APP_ID=ca-app-pub-3585849238017368~0000000000
 */
fun admobId(envKey: String, testDefault: String): String =
    System.getenv(envKey)?.takeIf { it.isNotBlank() } ?: testDefault

android {
    namespace = "com.aundots.horserace"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aundots.horserace"
        minSdk = 24
        targetSdk = 35
        versionCode = 11
        versionName = "1.0.6"

        manifestPlaceholders["admobAppId"] =
            admobId("ADMOB_APP_ID", "ca-app-pub-3940256099942544~3347511713")

        buildConfigField(
            "String",
            "ADMOB_BANNER_ID",
            "\"${admobId("ADMOB_BANNER_ID", "ca-app-pub-3940256099942544/6300978111")}\"",
        )
        buildConfigField(
            "String",
            "ADMOB_REWARDED_ID",
            "\"${admobId("ADMOB_REWARDED_ID", "ca-app-pub-3940256099942544/5224354917")}\"",
        )
        buildConfigField(
            "String",
            "ADMOB_INTERSTITIAL_ID",
            "\"${admobId("ADMOB_INTERSTITIAL_ID", "ca-app-pub-3940256099942544/1033173712")}\"",
        )
    }

    buildFeatures {
        buildConfig = true
    }

    signingConfigs {
        create("release") {
            val keystoreFile = resolveKeystoreFile()
            if (!keystoreFile.exists()) {
                logger.warn("Release keystore not found: ${keystoreFile.absolutePath}")
            } else {
                storeFile = keystoreFile
                storePassword = System.getenv("PLAY_KEYSTORE_PASSWORD") ?: ""
                keyAlias = System.getenv("PLAY_KEY_ALIAS") ?: "horserace"
                keyPassword = System.getenv("PLAY_KEY_PASSWORD") ?: ""
            }
        }
    }

    buildTypes {
        release {
            isMinifyEnabled = false
            val keystoreFile = resolveKeystoreFile()
            val storePass = System.getenv("PLAY_KEYSTORE_PASSWORD").orEmpty()
            val keyPass = System.getenv("PLAY_KEY_PASSWORD").orEmpty()
            if (keystoreFile.exists() && storePass.isNotEmpty() && keyPass.isNotEmpty()) {
                signingConfig = signingConfigs.getByName("release")
            } else if (keystoreFile.exists()) {
                logger.error(
                    "Release keystore found but PLAY_KEYSTORE_PASSWORD / PLAY_KEY_PASSWORD is missing. " +
                        "Load play-store/keystore.env before bundleRelease.",
                )
            }
        }
    }

    compileOptions {
        sourceCompatibility = JavaVersion.VERSION_17
        targetCompatibility = JavaVersion.VERSION_17
    }

    kotlinOptions {
        jvmTarget = "17"
    }
}

dependencies {
    implementation("androidx.appcompat:appcompat:1.7.0")
    implementation("androidx.core:core-ktx:1.15.0")
    implementation("com.google.android.gms:play-services-ads:23.6.0")
}
