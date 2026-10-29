import JSZip from 'jszip';

export interface AndroidApkConfig {
  appName: string;
  packageName: string;
  appUrl: string;
  themeColor: string;
  backgroundColor: string;
}

/**
 * Generates official PWABuilder direct APK build URL for the given deployment
 */
export function getPwaBuilderUrl(appUrl: string): string {
  const cleanUrl = appUrl.trim() || (typeof window !== 'undefined' ? window.location.origin : 'https://branchlabs.app');
  return `https://www.pwabuilder.com/reportcard?site=${encodeURIComponent(cleanUrl)}`;
}

/**
 * Builds the Android Manifest XML for a Trusted Web Activity (TWA) APK
 */
export function generateAndroidManifestXml(config: AndroidApkConfig): string {
  let host = 'branchlabs.app';
  try {
    const parsed = new URL(config.appUrl);
    host = parsed.host;
  } catch {
    // fallback
  }

  return `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="${config.packageName}">

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />

    <application
        android:allowBackup="true"
        android:icon="@mipmap/ic_launcher"
        android:label="@string/app_name"
        android:roundIcon="@mipmap/ic_launcher_round"
        android:supportsRtl="true"
        android:theme="@style/Theme.BranchLabs">

        <activity
            android:name="com.google.androidbrowserhelper.trusted.LauncherActivity"
            android:label="@string/app_name"
            android:exported="true"
            android:theme="@style/Theme.BranchLabs">

            <meta-data
                android:name="android.support.customtabs.trusted.DEFAULT_URL"
                android:value="${config.appUrl}" />

            <meta-data
                android:name="android.support.customtabs.trusted.STATUS_BAR_COLOR"
                android:resource="@color/colorPrimary" />

            <meta-data
                android:name="android.support.customtabs.trusted.NAVIGATION_BAR_COLOR"
                android:resource="@color/colorPrimaryDark" />

            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>

            <intent-filter android:autoVerify="true">
                <action android:name="android.intent.action.VIEW" />
                <category android:name="android.intent.category.DEFAULT" />
                <category android:name="android.intent.category.BROWSABLE" />
                <data
                    android:scheme="https"
                    android:host="${host}"
                    android:pathPrefix="/" />
            </intent-filter>
        </activity>

        <service
            android:name="com.google.androidbrowserhelper.trusted.KeepAliveService"
            android:enabled="true"
            android:exported="false" />

    </application>
</manifest>`;
}

/**
 * Builds the app/build.gradle for Android TWA
 */
export function generateAppBuildGradle(config: AndroidApkConfig): string {
  return `plugins {
    id 'com.android.application'
}

android {
    namespace '${config.packageName}'
    compileSdk 34

    defaultConfig {
        applicationId "${config.packageName}"
        minSdk 21
        targetSdk 34
        versionCode 1
        versionName "1.0.0"

        testInstrumentationRunner "androidx.test.runner.AndroidJUnitRunner"
    }

    buildTypes {
        release {
            minifyEnabled false
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
    compileOptions {
        sourceCompatibility JavaVersion.VERSION_1_8
        targetCompatibility JavaVersion.VERSION_1_8
    }
}

dependencies {
    implementation 'androidx.appcompat:appcompat:1.6.1'
    implementation 'com.google.android.material:material:1.11.0'
    implementation 'com.google.androidbrowserhelper:androidbrowserhelper:2.5.0'
}
`;
}

/**
 * Builds the Android strings.xml
 */
export function generateStringsXml(appName: string): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">${appName}</string>
</resources>`;
}

/**
 * Builds the Android colors.xml
 */
export function generateColorsXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="colorPrimary">#0D1117</color>
    <color name="colorPrimaryDark">#0B0F17</color>
    <color name="colorAccent">#6366F1</color>
</resources>`;
}

/**
 * Builds the Android styles.xml
 */
export function generateStylesXml(): string {
  return `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="Theme.BranchLabs" parent="Theme.AppCompat.NoActionBar">
        <item name="colorPrimary">@color/colorPrimary</item>
        <item name="colorPrimaryDark">@color/colorPrimaryDark</item>
        <item name="colorAccent">@color/colorAccent</item>
        <item name="android:windowNoTitle">true</item>
        <item name="android:windowActionBar">false</item>
    </style>
</resources>`;
}

/**
 * Generates an Android Studio TWA project zip file that can be compiled to an APK
 */
export async function createAndroidTwaProjectZip(config: AndroidApkConfig): Promise<Blob> {
  const zip = new JSZip();

  // Root files
  zip.file('settings.gradle', `include ':app'\nrootProject.name = "${config.appName}"\n`);
  zip.file('gradle.properties', `org.gradle.jvmargs=-Xmx2048m -Dfile.encoding=UTF-8\nandroid.useAndroidX=true\n`);
  zip.file(
    'build.gradle',
    `// Top-level build file
buildscript {
    repositories {
        google()
        mavenCentral()
    }
    dependencies {
        classpath 'com.android.tools.build:gradle:8.2.2'
    }
}

allprojects {
    repositories {
        google()
        mavenCentral()
    }
}
`
  );

  zip.file(
    'README.md',
    `# ${config.appName} - Android APK Project (TWA)

This package contains the native Android Trusted Web Activity (TWA) project for ${config.appName}.

## How to build your APK:

### Method 1: Instant APK with Android Studio
1. Download and open **Android Studio** (or IntelliJ with Android plugin).
2. Choose **Open an Existing Project** and select this extracted folder.
3. Wait for Gradle sync to complete.
4. Click **Build** > **Build Bundle(s) / APK(s)** > **Build APK(s)**.
5. Android Studio will generate your \`app-debug.apk\` in \`app/build/outputs/apk/debug/\`!

### Method 2: Command Line (Linux/Mac/WSL)
\`\`\`bash
# Inside the extracted folder:
chmod +x gradlew
./gradlew assembleDebug
\`\`\`
Your APK will be ready at: \`app/build/outputs/apk/debug/app-debug.apk\`.

### Method 3: One-Click Cloud APK Builder
Use Microsoft's official online PWABuilder:
${getPwaBuilderUrl(config.appUrl)}

---
Target URL: ${config.appUrl}
Package Name: ${config.packageName}
`
  );

  // App module
  const appFolder = zip.folder('app')!;
  appFolder.file('build.gradle', generateAppBuildGradle(config));
  appFolder.file('proguard-rules.pro', `# Proguard rules\n`);

  // App Manifest & Resources
  const mainFolder = appFolder.folder('src')?.folder('main')!;
  mainFolder.file('AndroidManifest.xml', generateAndroidManifestXml(config));

  const resValues = mainFolder.folder('res')?.folder('values')!;
  resValues.file('strings.xml', generateStringsXml(config.appName));
  resValues.file('colors.xml', generateColorsXml());
  resValues.file('styles.xml', generateStylesXml());

  return await zip.generateAsync({ type: 'blob' });
}

/**
 * Triggers a browser download of the Android TWA Project zip
 */
export async function downloadAndroidTwaZip(config: AndroidApkConfig, fileName = 'branchlabs-android-project.zip') {
  const blob = await createAndroidTwaProjectZip(config);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
