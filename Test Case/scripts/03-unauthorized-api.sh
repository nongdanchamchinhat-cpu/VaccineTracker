#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-PRE-03"
ARTIFACT="$ARTIFACT_DIR/${CASE_ID}.json"
STATUS="$(curl -sS -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL/api/me/children" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "401" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected HTTP 401 from unauthorized API call, got $STATUS."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
