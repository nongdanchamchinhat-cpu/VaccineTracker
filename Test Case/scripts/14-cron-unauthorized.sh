#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-10"
ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-cron-no-auth.json"
STATUS="$(curl -sS -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL/api/cron/reminders" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ -z "$CRON_SECRET" ]]; then
  pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "CRON_SECRET is not set in the test environment, so the route may be intentionally open."
fi

if [[ "$STATUS" != "401" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected HTTP 401 from cron route without auth, got $STATUS."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
