#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-PRE-02"
TYPECHECK_LOG="$LOG_DIR/${CASE_ID}-typecheck.txt"
LINT_LOG="$LOG_DIR/${CASE_ID}-lint.txt"
BUILD_LOG="$LOG_DIR/${CASE_ID}-build.txt"

(
  cd "$PROJECT_ROOT"
  "$NPM_BIN" run typecheck
) | tee "$TYPECHECK_LOG"

(
  cd "$PROJECT_ROOT"
  "$NPM_BIN" run lint
) | tee "$LINT_LOG"

(
  cd "$PROJECT_ROOT"
  "$NPM_BIN" run build
) | tee "$BUILD_LOG"

pass_case "$CASE_ID" "AUTO_SH" "$BUILD_LOG"
