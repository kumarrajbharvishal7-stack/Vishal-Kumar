#!/usr/bin/env bash
set -e

echo "=== ZYVOX AI STUDIO - ANDROID APK BUILD SCRIPT ==="

# Check Java
if ! command -v java &> /dev/null; then
    echo "Error: Java (JDK 17+) is required to build the APK. Please install OpenJDK 17."
    exit 1
fi

# Check Android SDK
if [ -z "$ANDROID_HOME" ]; then
    echo "Warning: ANDROID_HOME is not set. Trying default paths..."
    export ANDROID_HOME=$HOME/Android/Sdk
fi

cd "$(dirname "$0")/native-project"

# Generate Keystore if missing
if [ ! -f "app/release.keystore" ]; then
    echo "Generating secure release signing keystore..."
    keytool -genkey -v -keystore app/release.keystore -alias zyvox_key -keyalg RSA -keysize 2048 -validity 10000 \
        -dname "CN=Zyvox, OU=AI Studio, O=Zyvox, L=Global, S=Global, C=US" \
        -storepass zyvox_studio_keystore -keypass zyvox_studio_keystore
fi

# Build signed release APK
echo "Compiling signed release APK with Gradle..."
if [ -f "./gradlew" ]; then
    ./gradlew assembleRelease
else
    gradle assembleRelease
fi

echo "=== BUILD SUCCESSFUL ==="
echo "Output APK location: app/build/outputs/apk/release/app-release.apk"
