# Zyvox AI Studio - Android Mobile Application (React Native + Expo)

This mobile application brings the **Zyvox AI Studio** video editing experience to native Android devices, utilizing shared backend APIs, real-time video playback, and AI endpoints.

## Features on Android

- **Touch-Optimized Timeline**: Smooth horizontal scrubbing and multi-touch pinch-to-zoom.
- **Aspect Ratio Selector**: Direct presets for 9:16 (Shorts/Reels/TikTok), 16:9, and 1:1.
- **Server Sync**: Seamless synchronization with the Zyvox Node.js backend.
- **AI Studio Integration**: Real-time story-to-scenes breakdown, auto-captions, and AI voiceovers.
- **Android Media Access**: Direct import from Android Gallery and Camera Roll via `expo-media-library`.

---

## Prerequisites

1. Node.js (version 18 or higher)
2. Android Studio with Android SDK (API 34+) or an Android device with Expo Go installed.
3. EAS CLI: `npm install -g eas-cli`

---

## Running the Android App Locally

```bash
# 1. Navigate to the android directory
cd android

# 2. Install dependencies
npm install

# 3. Start Expo development server
npx expo start --android
```

Scan the terminal QR code with **Expo Go** on your Android device, or press `a` to open in the Android Studio Emulator.

---

## Building Standalone Android APK / AAB

To generate a standalone `.apk` for distribution or direct installation on Android devices:

```bash
# Login to EAS
eas login

# Configure project
eas build:configure

# Generate installable Android APK (Preview build)
eas build --platform android --profile preview

# Generate Google Play Store Android App Bundle (.aab)
eas build --platform android --profile production
```

---

## Architecture and Shared Logic

- **Editor Types**: Shared with web (`/src/types/editor.ts`)
- **Backend API**: Connects to `APP_URL` or local `http://<your-ip>:3000`
- **Video Playback**: Driven by `expo-av` with hardware-accelerated decoding.
