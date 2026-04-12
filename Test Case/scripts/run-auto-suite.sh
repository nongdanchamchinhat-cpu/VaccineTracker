#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

bash "$SCRIPT_DIR/00-prepare-runtime.sh"
bash "$SCRIPT_DIR/01-preflight-home.sh"
bash "$SCRIPT_DIR/02-build-health.sh"
bash "$SCRIPT_DIR/03-unauthorized-api.sh"
bash "$SCRIPT_DIR/04-check-auth-session.sh"
bash "$SCRIPT_DIR/05-create-child.sh"
bash "$SCRIPT_DIR/06-generate-schedule.sh"
bash "$SCRIPT_DIR/07-regenerate-no-duplicate.sh"
bash "$SCRIPT_DIR/08-get-schedule.sh"
bash "$SCRIPT_DIR/09-create-custom-item.sh"
bash "$SCRIPT_DIR/10-update-item.sh"
bash "$SCRIPT_DIR/11-complete-item.sh"
bash "$SCRIPT_DIR/12-download-calendar.sh"
bash "$SCRIPT_DIR/13-update-reminder-preferences.sh"
bash "$SCRIPT_DIR/14-cron-unauthorized.sh"
bash "$SCRIPT_DIR/15-cron-authorized.sh"

echo "AUTO_SUITE_STATUS=PASS"
