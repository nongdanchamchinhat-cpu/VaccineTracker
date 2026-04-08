#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-05"
require_cookie "$CASE_ID"

CHILD_ID="$(resolve_runtime_value CHILD_ID current_child_id || true)"
if [[ -z "$CHILD_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_child_id)" "Missing CHILD_ID."
fi

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-custom-item.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/schedule-items" \
  -d "{\"child_id\":\"$CHILD_ID\",\"vaccine_name\":\"Test Custom Vaccine\",\"disease\":\"Test Disease\",\"origin\":\"VN\",\"estimated_price\":123000,\"scheduled_date\":\"2026-09-01\",\"milestone\":\"Mui tu tao\",\"recommended_age_label\":\"Tuy chinh\",\"notes\":\"created by antigravity\"}" \
  -o "$ARTIFACT" -w "%{http_code}" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Create custom item returned HTTP $STATUS."
fi

ITEM_ID="$(json_path "$ARTIFACT" "item.id" || true)"
TEMPLATE_SOURCE="$(json_path "$ARTIFACT" "item.template_source" || true)"

if [[ -z "$ITEM_ID" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Response does not contain item.id."
fi

if [[ "$TEMPLATE_SOURCE" != "custom" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected template_source=custom, got ${TEMPLATE_SOURCE:-empty}."
fi

save_runtime_value "current_custom_item_id" "$ITEM_ID"
pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Saved current_custom_item_id=$ITEM_ID"
