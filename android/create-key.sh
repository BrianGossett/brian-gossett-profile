#!/usr/bin/env bash
# Creates the app's signing key. Run once. It asks you to choose a password:
# keep the password and a backup of bg-todo.keystore somewhere safe, because
# updates to the app must be signed with the same key.
set -euo pipefail
cd "$(dirname "$0")"

if [ -e bg-todo.keystore ]; then
  echo "bg-todo.keystore already exists. Not replacing it." >&2
  exit 1
fi

keytool -genkeypair -v \
  -keystore bg-todo.keystore -alias bg-todo \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -dname "CN=Brian Gossett"

echo
echo "Fingerprint for public/.well-known/assetlinks.json:"
keytool -list -v -keystore bg-todo.keystore -alias bg-todo | grep "SHA256:"
