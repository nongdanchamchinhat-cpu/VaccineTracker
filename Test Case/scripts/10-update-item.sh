#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-06"
require_cookie "$CASE_ID"

SCHEDULE_ITEM_ID="$(resolve_runtime_value SCHEDULE_ITEM_ID current_custom_item_id || true)"
if [[ -z "$SCHEDULE_ITEM_ID" ]]; then
  SCHEDULE_ITEM_ID="$(resolve_runtime_value SCHEDULE_ITEM_ID current_schedule_item_id || true)"
fi
if [[ -z "$SCHEDULE_ITEM_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_schedule_item_id)" "Missing SCHEDULE_ITEM_ID. Run 08-get-schedule.sh or 09-create-custom-item.sh first."
fi

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-update-item.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X PATCH "$BASE_URL/api/schedule-items/$SCHEDULE_ITEM_ID" \
  -d '{"scheduled_date":"2026-09-05","estimated_price":150000,"actual_price":160000,"vaccine_name":"Test Custom Vaccine Updated","disease":"Test Disease Updated","origin":"VN","notes":"updated by antigravity","status":"planned"}' \
  -o "$ARTIFACT" -w "%{http_code}" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Update item returned HTTP $STATUS."
fi

UPDATED_NAME="$(json_path "$ARTIFACT" "item.vaccine_name" || true)"
if [[ "$UPDATED_NAME" != "Test Custom Vaccine Updated" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Unexpected updated vaccine_name: ${UPDATED_NAME:-empty}."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
