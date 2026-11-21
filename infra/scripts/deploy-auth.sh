#!/usr/bin/env bash
# Deploys ProfileAuth, passing the Google OAuth client from Parameter Store.
#
# The two values live in the Amplify console under Hosting > Secrets
# ("All branches"), which stores them as encrypted Parameter Store values.
# They are only needed here on the first deploy or when they change; any
# other `cdk deploy` reuses the values CloudFormation already has.
#
# Usage:
#   scripts/deploy-auth.sh --check       validate the stored values, deploy nothing
#   scripts/deploy-auth.sh [cdk args]    deploy
set -euo pipefail
cd "$(dirname "$0")/.."

PROFILE="${AWS_PROFILE:-Gossett-Claude}"
REGION="us-east-2"
BASE="/amplify/shared/d3ksz8q52usvuz"

get() {
  aws ssm get-parameter --name "$1" --with-decryption \
    --query Parameter.Value --output text --profile "$PROFILE" --region "$REGION"
}

client_id="$(get "$BASE/client_id")"
client_secret="$(get "$BASE/client_secret")"

problems=0
if [[ ! "$client_id" =~ ^[0-9A-Za-z_.-]+\.apps\.googleusercontent\.com$ ]]; then
  echo "client_id is not a bare Google client ID (quotes or spaces saved with it?)." >&2
  problems=1
fi
if [[ -z "$client_secret" || "$client_secret" =~ [\"\'[:space:]] ]]; then
  echo "client_secret is empty or contains quotes or spaces." >&2
  problems=1
fi
if (( problems )); then
  echo "Fix it in Amplify > Hosting > Secrets, then run this again." >&2
  exit 1
fi

if [[ "${1:-}" == "--check" ]]; then
  echo "client_id and client_secret look valid. Nothing was deployed."
  exit 0
fi

npx cdk deploy ProfileAuth --profile "$PROFILE" "$@" \
  --parameters "ProfileAuth:GoogleClientId=$client_id" \
  --parameters "ProfileAuth:GoogleClientSecret=$client_secret"
