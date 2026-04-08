#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-03"
require_cookie "$CASE_ID"

CHILD_ID="$(resolve_runtime_value CHILD_ID current_child_id || true)"
if [[ -z "$CHILD_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_child_id)" "Missing CHILD_ID."
fi

BEFORE_ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-before.json"
AFTER_ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-after.json"
REGEN_ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-regen.json"

curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/children/$CHILD_ID/schedule" -o "$BEFORE_ARTIFACT"
BEFORE_COUNT="$(json_length "$BEFORE_ARTIFACT" "items")"

curl -sS -b "$COOKIE_JAR" -X POST "$BASE_URL/api/children/$CHILD_ID/schedule/from-template" -o "$REGEN_ARTIFACT"
curl -sS -b "$COOKIE_JAR" "$BASE_URL/api/children/$CHILD_ID/schedule" -o "$AFTER_ARTIFACT"
AFTER_COUNT="$(json_length "$AFTER_ARTIFACT" "items")"

if [[ "$BEFORE_COUNT" != "$AFTER_COUNT" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$AFTER_ARTIFACT" "Schedule count changed from $BEFORE_COUNT to $AFTER_COUNT after regenerate."
fi

pass_case "$CASE_ID" "AUTO_SH" "$AFTER_ARTIFACT"
