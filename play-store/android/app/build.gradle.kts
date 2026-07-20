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
 * AdMob ID.
 *
 * debug 빌드는 Google 공식 테스트 ID, release 빌드는 실제 ID 를 쓴다.
 * 개발 중 자기 앱의 실광고를 클릭하면 계정이 정지되므로 절대 섞지 않는다.
 * 광고 단위 ID 는 APK 를 뜯으면 보이는 값이라 비밀이 아니다 — 소스에 두어도 무방.
 */
object Admob {
    const val REAL_APP_ID = "ca-app-pub-3585849238017368~2216233246"
    const val REAL_BANNER = "ca-app-pub-3585849238017368/6579818386"
    const val REAL_INTERSTITIAL = "ca-app-pub-3585849238017368/1327491707"
    const val REAL_REWARDED = "ca-app-pub-3585849238017368/9851869040"

    const val TEST_APP_ID = "ca-app-pub-3940256099942544~3347511713"
    const val TEST_BANNER = "ca-app-pub-3940256099942544/6300978111"
    const val TEST_INTERSTITIAL = "ca-app-pub-3940256099942544/1033173712"
    const val TEST_REWARDED = "ca-app-pub-3940256099942544/5224354917"
}

android {
    namespace = "com.aundots.horserace"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aundots.horserace"
        minSdk = 24
        targetSdk = 35
        versionCode = 11
        versionName = "1.0.6"

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
        debug {
            manifestPlaceholders["admobAppId"] = Admob.TEST_APP_ID
            buildConfigField("String", "ADMOB_BANNER_ID", "\"${Admob.TEST_BANNER}\"")
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"${Admob.TEST_REWARDED}\"")
            buildConfigField(
                "String",
                "ADMOB_INTERSTITIAL_ID",
                "\"${Admob.TEST_INTERSTITIAL}\"",
            )
        }

        release {
            manifestPlaceholders["admobAppId"] = Admob.REAL_APP_ID
            buildConfigField("String", "ADMOB_BANNER_ID", "\"${Admob.REAL_BANNER}\"")
            buildConfigField("String", "ADMOB_REWARDED_ID", "\"${Admob.REAL_REWARDED}\"")
            buildConfigField(
                "String",
                "ADMOB_INTERSTITIAL_ID",
                "\"${Admob.REAL_INTERSTITIAL}\"",
            )

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
