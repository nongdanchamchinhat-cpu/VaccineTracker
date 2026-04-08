#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-09"
require_cookie "$CASE_ID"

CHILD_ID="$(resolve_runtime_value CHILD_ID current_child_id || true)"
if [[ -z "$CHILD_ID" ]]; then
  blocked_case "$CASE_ID" "AUTO_SH" "$(runtime_value_path current_child_id)" "Missing CHILD_ID."
fi

TEST_REMINDER_EMAIL="${TEST_REMINDER_EMAIL:-qa-reminder@example.com}"
ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-reminder-preferences.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X PATCH "$BASE_URL/api/me/reminder-preferences" \
  -d "{\"childId\":\"$CHILD_ID\",\"reminder_email\":\"$TEST_REMINDER_EMAIL\",\"email_enabled\":true,\"remind_one_day\":true,\"remind_two_hours\":false,\"timezone\":\"Asia/Ho_Chi_Minh\"}" \
  -o "$ARTIFACT" -w "%{http_code}" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Update reminder preferences returned HTTP $STATUS."
fi

EMAIL_VALUE="$(json_path "$ARTIFACT" "reminderPreferences.reminder_email" || true)"
TWO_HOURS="$(json_path "$ARTIFACT" "reminderPreferences.remind_two_hours" || true)"

if [[ "$EMAIL_VALUE" != "$TEST_REMINDER_EMAIL" || "$TWO_HOURS" != "False" && "$TWO_HOURS" != "false" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Reminder preferences response does not match expected values."
fi

pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT"
