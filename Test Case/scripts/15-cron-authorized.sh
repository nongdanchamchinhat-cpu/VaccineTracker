#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-11"
if [[ -z "$CRON_SECRET" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$ARTIFACT_DIR/${CASE_ID}-cron-auth.json" "Missing CRON_SECRET."
fi

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-cron-auth.json"
STATUS="$(curl -sS -H "Authorization: Bearer $CRON_SECRET" -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL/api/cron/reminders" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Authorized cron returned HTTP $STATUS."
fi

OK_VALUE="$(json_path "$ARTIFACT" "ok" || true)"
if [[ "$OK_VALUE" != "True" && "$OK_VALUE" != "true" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Cron response does not contain ok=true."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
