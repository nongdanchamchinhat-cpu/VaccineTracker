#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-AUTO-01"
require_cookie "$CASE_ID"

TEST_MEMBER_NAME="${TEST_MEMBER_NAME:-Be Test A}"
TEST_MEMBER_BIRTH_DATE="${TEST_MEMBER_BIRTH_DATE:-2026-01-26}"
TEST_MEMBER_GENDER="${TEST_MEMBER_GENDER:-female}"

ARTIFACT="$ARTIFACT_DIR/${CASE_ID}-create-child.json"
STATUS="$(curl -sS -b "$COOKIE_JAR" \
  -H "Content-Type: application/json" \
  -X POST "$BASE_URL/api/family-members" \
  -d "{\"name\":\"$TEST_MEMBER_NAME\",\"birth_date\":\"$TEST_MEMBER_BIRTH_DATE\",\"gender\":\"$TEST_MEMBER_GENDER\"}" \
  -o "$ARTIFACT" -w "%{http_code}" || true)"
maybe_blocked_from_response "$CASE_ID" "$ARTIFACT" "$STATUS"

if [[ "$STATUS" != "200" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Create child returned HTTP $STATUS."
fi

MEMBER_ID="$(json_path "$ARTIFACT" "member.id" || true)"
if [[ -z "$MEMBER_ID" ]]; then
  fail_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Response does not contain member.id."
fi

save_runtime_value "current_member_id" "$MEMBER_ID"
pass_case "$CASE_ID" "AUTO_SH" "$ARTIFACT" "Saved current_member_id=$MEMBER_ID"
