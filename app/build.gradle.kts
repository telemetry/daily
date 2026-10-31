plugins {
    alias(libs.plugins.android.application)
    alias(libs.plugins.kotlin.android)
    alias(libs.plugins.kotlin.compose)
}

android {
    namespace = "com.telemetry.a2uiwestpac"
    // The a2ui preview libraries are compiled against SDK 37.1. If Android
    // Studio asks for the minor level, add `compileSdkMinor = 1` (AGP 8.12+).
    compileSdk = 37

    defaultConfig {
        applicationId = "com.telemetry.a2uiwestpac"
        minSdk = 26
        targetSdk = 36
        versionCode = 1
        versionName = "0.1.0"
    }

    buildTypes {
        release {
            isMinifyEnabled = false
        }
    }

    buildFeatures {
        compose = true
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
    implementation(libs.kotlinx.coroutines.android)
    implementation(libs.androidx.activity.compose)
    implementation(libs.androidx.lifecycle.viewmodel.compose)
    implementation(libs.androidx.lifecycle.runtime.compose)
    implementation(libs.compose.ui)
    implementation(libs.compose.ui.tooling.preview)
    implementation(libs.compose.foundation)
    implementation(libs.compose.material3)

    // A2UI: protocol model + engine, the Compose runtime/UI layer, and the
    // Material 3 implementation of the basic catalog.
    implementation(libs.a2ui.model)
    implementation(libs.a2ui.engine)
    implementation(libs.a2ui.compose.runtime)
    implementation(libs.a2ui.compose.ui)
    implementation(libs.compose.material3.a2ui)

    debugImplementation(libs.compose.ui.tooling)
}
