#!/usr/bin/env bash
# Builds a standalone release APK locally (no Expo account): JDK 17 + Android SDK in $HOME.
# Output: dist/rooots.apk (signed with the local debug key — fine for personal installs,
# not for the Play Store).
set -euo pipefail
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk-17}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$PATH"

CI=1 npx expo prebuild --platform android --no-install
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
(cd android && ./gradlew assembleRelease)

mkdir -p dist
cp android/app/build/outputs/apk/release/app-release.apk dist/rooots.apk
echo "APK: dist/rooots.apk"
