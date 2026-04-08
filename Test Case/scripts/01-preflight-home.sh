#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-PRE-01"
ARTIFACT="$ARTIFACT_DIR/${CASE_ID}.html"
STATUS="$(curl -sS -L -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected HTTP 200 from home page, got $STATUS."
fi

if ! grep -Eiq 'Kobe Tracker|KOBE TRACKER|Sổ tay tiêm chủng' "$ARTIFACT"; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Home page body does not contain expected product text."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
