#!/usr/bin/env bash
# Builds a standalone release APK locally (no Expo account): JDK 17 + Android SDK in $HOME.
# Output: dist/rooots.apk (signed with the local debug key — fine for personal installs,
# not for the Play Store).
set -euo pipefail
cd "$(dirname "$0")/.."

export JAVA_HOME="${JAVA_HOME:-$HOME/.local/jdk-17}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"
export PATH="$JAVA_HOME/bin:$PATH"

# versionCode = number of commits on HEAD: it grows with every commit on main, so each new APK
# (local or CI) installs over the previous one, and the same commit always gives the same code.
VERSION_CODE="$(git rev-list --count HEAD)"
echo "versionCode: $VERSION_CODE"

# prebuild rewrites the "android"/"ios" npm scripts: keep ours. app.json gets the versionCode
# only for the build.
cp package.json package.json.bak
cp app.json app.json.bak
trap 'mv -f package.json.bak package.json 2>/dev/null || true; mv -f app.json.bak app.json 2>/dev/null || true' EXIT
node -e '
  const fs = require("fs");
  const app = JSON.parse(fs.readFileSync("app.json", "utf8"));
  app.expo.android.versionCode = Number(process.argv[1]);
  fs.writeFileSync("app.json", JSON.stringify(app, null, 2) + "\n");
' "$VERSION_CODE"
CI=1 npx expo prebuild --platform android --no-install
mv -f package.json.bak package.json
mv -f app.json.bak app.json
echo "sdk.dir=$ANDROID_HOME" > android/local.properties
# Always sign with the same key, whatever prebuild generates: Android only installs an update
# over an existing app (keeping its data) if the signature is identical. This is React Native's
# public debug key (no secret), the one the first APK was signed with.
cp scripts/android/signing.keystore android/app/debug.keystore
# Memory-friendly on a 16 GB laptop: one CPU architecture (all recent phones are arm64),
# few parallel workers and capped JVM heaps. Override with ARCHS / WORKERS if needed.
ARCHS="${ARCHS:-arm64-v8a}"
WORKERS="${WORKERS:-2}"
(cd android && ./gradlew assembleRelease --no-daemon --console=rich \
  --max-workers="$WORKERS" \
  -PreactNativeArchitectures="$ARCHS" \
  -Dorg.gradle.jvmargs="-Xmx2560m -XX:MaxMetaspaceSize=768m" \
  -Pkotlin.daemon.jvmargs="-Xmx1536m")

mkdir -p dist
cp android/app/build/outputs/apk/release/app-release.apk dist/rooots.apk
echo "APK: dist/rooots.apk"
