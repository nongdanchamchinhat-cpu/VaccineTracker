#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TEST_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
PROJECT_ROOT="$(cd "$TEST_ROOT/.." && pwd)"

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/usr/sbin:/sbin:$PATH"
export BASE_URL="${BASE_URL:-http://localhost:3000}"
export COOKIE_JAR="${COOKIE_JAR:-$TEST_ROOT/runtime/auth.cookie}"
export RUNTIME_DIR="${RUNTIME_DIR:-$TEST_ROOT/runtime}"
export LOG_DIR="${LOG_DIR:-$RUNTIME_DIR/logs}"
export ARTIFACT_DIR="${ARTIFACT_DIR:-$RUNTIME_DIR/artifacts}"
export CRON_SECRET="${CRON_SECRET:-}"

if command -v npm >/dev/null 2>&1; then
  export NPM_BIN="${NPM_BIN:-$(command -v npm)}"
else
  export NPM_BIN="${NPM_BIN:-/opt/homebrew/bin/npm}"
fi

mkdir -p "$RUNTIME_DIR" "$LOG_DIR" "$ARTIFACT_DIR"

case_result() {
  local case_id="$1"
  local status="$2"
  local mode="$3"
  local evidence="$4"
  local reason="${5:-}"
  local result_file="$LOG_DIR/${case_id}.result.txt"

  {
    printf '[%s] STATUS=%s\n' "$case_id" "$status"
    printf 'mode=%s\n' "$mode"
    printf 'evidence=%s\n' "$evidence"
    if [[ -n "$reason" ]]; then
      printf 'reason=%s\n' "$reason"
    fi
  } | tee "$result_file"
}

pass_case() {
  local case_id="$1"
  local mode="$2"
  local evidence="$3"
  local reason="${4:-}"
  case_result "$case_id" "PASS" "$mode" "$evidence" "$reason"
  exit 0
}

fail_case() {
  local case_id="$1"
  local mode="$2"
  local evidence="$3"
  local reason="${4:-}"
  case_result "$case_id" "FAIL" "$mode" "$evidence" "$reason"
  exit 1
}

blocked_case() {
  local case_id="$1"
  local mode="$2"
  local evidence="$3"
  local reason="${4:-}"
  case_result "$case_id" "BLOCKED" "$mode" "$evidence" "$reason"
  exit 2
}

require_cookie() {
  local case_id="$1"
  if [[ ! -s "$COOKIE_JAR" ]]; then
    blocked_case "$case_id" "AUTO_SH" "$COOKIE_JAR" "Missing auth cookie jar. Complete manual login and export cookie first."
  fi
}

runtime_value_path() {
  local key="$1"
  printf '%s/%s.txt' "$RUNTIME_DIR" "$key"
}

save_runtime_value() {
  local key="$1"
  local value="$2"
  printf '%s' "$value" > "$(runtime_value_path "$key")"
}

resolve_runtime_value() {
  local env_name="$1"
  local key="$2"
  local from_env="${!env_name:-}"

  if [[ -n "$from_env" ]]; then
    printf '%s' "$from_env"
    return 0
  fi

  local key_file
  key_file="$(runtime_value_path "$key")"
  if [[ -s "$key_file" ]]; then
    cat "$key_file"
    return 0
  fi

  return 1
}

json_path() {
  local file="$1"
  local path="$2"
  python3 - "$file" "$path" <<'PY'
import json, sys
from pathlib import Path

file_path = Path(sys.argv[1])
path = sys.argv[2]

data = json.loads(file_path.read_text())
current = data

if path:
    for part in path.split("."):
        if isinstance(current, list) and part.isdigit():
            current = current[int(part)]
        elif isinstance(current, dict):
            current = current[part]
        else:
            raise SystemExit(1)

if isinstance(current, (dict, list)):
    print(json.dumps(current, ensure_ascii=False))
elif current is None:
    print("")
else:
    print(current)
PY
}

json_length() {
  local file="$1"
  local path="$2"
  python3 - "$file" "$path" <<'PY'
import json, sys
from pathlib import Path

file_path = Path(sys.argv[1])
path = sys.argv[2]
data = json.loads(file_path.read_text())
current = data

if path:
    for part in path.split("."):
        if isinstance(current, list) and part.isdigit():
            current = current[int(part)]
        elif isinstance(current, dict):
            current = current[part]
        else:
            raise SystemExit(1)

if not isinstance(current, list):
    raise SystemExit(1)

print(len(current))
PY
}

maybe_blocked_from_response() {
  local case_id="$1"
  local artifact="$2"
  local status="$3"

  if [[ "$status" == "500" ]] && grep -q "Missing NEXT_PUBLIC_SUPABASE_URL" "$artifact"; then
    blocked_case "$case_id" "AUTO_SH" "$artifact" "Supabase env vars are missing in the running app."
  fi
}
