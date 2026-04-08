#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-02"
require_cookie "$CASE_ID"

CHILD_ID="$(resolve_runtime_value CHILD_ID current_child_id || true)"
if [[ -z "$CHILD_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_child_id)" "Missing CHILD_ID. Run 05-create-child.sh first or export CHILD_ID."
fi

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-generate-schedule.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/children/$CHILD_ID/schedule/from-template" -o "$ARTIFACT" -w "%{http_code}" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Generate schedule returned HTTP $STATUS."
fi

CREATED="$(json_path "$ARTIFACT" "created" || true)"
if [[ -z "$CREATED" || "$CREATED" == "0" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Expected created count > 0, got ${CREATED:-empty}."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
