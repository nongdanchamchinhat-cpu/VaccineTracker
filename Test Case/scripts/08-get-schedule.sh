#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-04"
require_cookie "$CASE_ID"

MEMBER_ID="$(resolve_runtime_value MEMBER_ID current_member_id || true)"
if [[ -z "$MEMBER_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_member_id)" "Missing MEMBER_ID."
fi

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-schedule.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL/api/family-members/$MEMBER_ID/schedule" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Get schedule returned HTTP $STATUS."
fi

ITEM_COUNT="$(json_length "$ARTIFACT" "items" || true)"
if [[ -z "$ITEM_COUNT" || "$ITEM_COUNT" == "0" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected schedule items > 0."
fi

FIRST_ITEM_ID="$(json_path "$ARTIFACT" "items.0.id" || true)"
if [[ -n "$FIRST_ITEM_ID" ]]; then
  save_runtime_value "current_schedule_item_id" "$FIRST_ITEM_ID"
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Saved current_schedule_item_id=${FIRST_ITEM_ID:-none}"
