plugins {
    id("com.android.application")
    id("org.jetbrains.kotlin.android")
}

android {
    namespace = "com.aundots.horserace"
    compileSdk = 35

    defaultConfig {
        applicationId = "com.aundots.horserace"
        minSdk = 24
        targetSdk = 35
        versionCode = 6
        versionName = "1.0.5"
    }

    signingConfigs {
        create("release") {
            val keystorePath = System.getenv("PLAY_KEYSTORE") ?: "../horserace-release.jks"
            val keystoreFile = file(keystorePath)
            if (keystoreFile.exists()) {
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
            val keystorePath = System.getenv("PLAY_KEYSTORE") ?: "../horserace-release.jks"
            if (file(keystorePath).exists()) {
                signingConfig = signingConfigs.getByName("release")
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
}
