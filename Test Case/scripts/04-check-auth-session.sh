#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-MAN-02"
require_cookie "$CASE_ID"

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-session.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL/api/me/children" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "HYBRID" "$ARTIFACT" "Expected authenticated request to return 200, got $STATUS."
fi

pass_case "$CASE_ID" "HYBRID" "$ARTIFACT" "Auth cookie is valid and can be used for AUTO_SH cases."
