#!/usr/bin/env bash
set -euo pipefail
source "$(cd "$(dirname "$0")" && pwd)/lib.sh"

CASE_ID="AG-SETUP-00"
{
  echo "BASE_URL=$BASE_URL"
  echo "COOKIE_JAR=$COOKIE_JAR"
  echo "RUNTIME_DIR=$RUNTIME_DIR"
  echo "LOG_DIR=$LOG_DIR"
  echo "ARTIFACT_DIR=$ARTIFACT_DIR"
} | tee "$LOG_DIR/${CASE_ID}.env.txt"

pass_case "$CASE_ID" "AUTO_SH" "$LOG_DIR/${CASE_ID}.env.txt" "Runtime directories prepared."
