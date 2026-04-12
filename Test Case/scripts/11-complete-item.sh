#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-07"
require_cookie "$CASE_ID"

SCHEDULE_ITEM_ID="$(resolve_runtime_value SCHEDULE_ITEM_ID current_schedule_item_id || true)"
if [[ -z "$SCHEDULE_ITEM_ID" ]]; then
  SCHEDULE_ITEM_ID="$(resolve_runtime_value SCHEDULE_ITEM_ID current_custom_item_id || true)"
fi
if [[ -z "$SCHEDULE_ITEM_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_schedule_item_id)" "Missing SCHEDULE_ITEM_ID."
fi

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-complete-item.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/schedule-items/$SCHEDULE_ITEM_ID/complete" \
  -d '{"actual_price":165000}' \
  -o "$ARTIFACT" -w "%{http_code}" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Complete item returned HTTP $STATUS."
fi

STATUS_VALUE="$(json_path "$ARTIFACT" "item.status" || true)"
COMPLETED_AT="$(json_path "$ARTIFACT" "item.completed_at" || true)"

if [[ "$STATUS_VALUE" != "completed" || -z "$COMPLETED_AT" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected completed item with completed_at."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
