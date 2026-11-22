#!/usr/bin/env bash
# Builds bg-todo.apk, signed with bg-todo.keystore (asks for its password).
set -euo pipefail
cd "$(dirname "$0")"

export JAVA_HOME="${JAVA_HOME:-/usr/lib/jvm/java-17-openjdk-amd64}"
export ANDROID_HOME="${ANDROID_HOME:-$HOME/Android/Sdk}"

if [ ! -e bg-todo.keystore ]; then
  echo "No signing key yet. Run ./create-key.sh first." >&2
  exit 1
fi

./gradlew assembleRelease --no-daemon -q

tools="$(ls -d "$ANDROID_HOME"/build-tools/* | sort -V | tail -1)"
unsigned=app/build/outputs/apk/release/app-release-unsigned.apk
"$tools/zipalign" -f -p 4 "$unsigned" app/build/aligned.apk
"$tools/apksigner" sign --ks bg-todo.keystore --ks-key-alias bg-todo --out bg-todo.apk app/build/aligned.apk

echo
echo "Built $(pwd)/bg-todo.apk"
"$tools/apksigner" verify --print-certs bg-todo.apk | grep "SHA-256"
