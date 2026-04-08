#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-08"
require_cookie "$CASE_ID"

CHILD_ID="$(resolve_runtime_value CHILD_ID current_child_id || true)"
if [[ -z "$CHILD_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_child_id)" "Missing CHILD_ID."
fi

HEADERS="$LOG_DIR/${CASE_ID}-headers.txt"
ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-calendar.ics"
STATUS="$(curl -sS -b "$COOKIE_JAR" -D "$HEADERS" -o "$ARTIFACT" -w "%{http_code}" "$BASE_URL/api/children/$CHILD_ID/calendar.ics" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Calendar download returned HTTP $STATUS."
fi

if ! grep -iq 'content-type: text/calendar' "$HEADERS"; then
  fail_case "$CASE_ID" "AUTO_SH" "$HEADERS" "Response headers do not contain text/calendar."
fi

if ! grep -q 'BEGIN:VCALENDAR' "$ARTIFACT" || ! grep -q 'BEGIN:VEVENT' "$ARTIFACT"; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Downloaded file is not a valid ICS payload."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
