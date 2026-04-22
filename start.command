#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
BACKEND_DIR="$SCRIPT_DIR/backend"
FRONTEND_DIR="$SCRIPT_DIR/frontend"
STATE_DIR="$SCRIPT_DIR/.run-state"
BACKEND_PID_FILE="$STATE_DIR/backend.pid"
FRONTEND_PID_FILE="$STATE_DIR/frontend.pid"

cleanup_pid_file() {
  local file="$1"
  if [[ ! -f "$file" ]]; then
    return
  fi

  local pid
  pid="$(cat "$file" 2>/dev/null || true)"
  if [[ -n "$pid" ]] && kill -0 "$pid" 2>/dev/null; then
    kill "$pid" 2>/dev/null || true
    for _ in {1..20}; do
      if ! kill -0 "$pid" 2>/dev/null; then
        break
      fi
      sleep 0.1
    done

    if kill -0 "$pid" 2>/dev/null; then
      kill -9 "$pid" 2>/dev/null || true
    fi
  fi

  rm -f "$file"
}

cleanup() {
  if [[ -n "${FRONTEND_PID:-}" ]] && kill -0 "$FRONTEND_PID" 2>/dev/null; then
    kill "$FRONTEND_PID" 2>/dev/null || true
  fi

  if [[ -n "${BACKEND_PID:-}" ]] && kill -0 "$BACKEND_PID" 2>/dev/null; then
    kill "$BACKEND_PID" 2>/dev/null || true
  fi

  rm -f "$BACKEND_PID_FILE" "$FRONTEND_PID_FILE"
}

mkdir -p "$STATE_DIR"
cleanup_pid_file "$BACKEND_PID_FILE"
cleanup_pid_file "$FRONTEND_PID_FILE"

trap cleanup EXIT
trap 'cleanup; exit 130' INT
trap 'cleanup; exit 143' TERM

cd "$BACKEND_DIR"
./mvnw spring-boot:run &
BACKEND_PID=$!
printf '%s\n' "$BACKEND_PID" > "$BACKEND_PID_FILE"

cd "$FRONTEND_DIR"
npm install
FRONTEND_PORT="${FRONTEND_PORT:-4200}"
while lsof -nP -iTCP:"$FRONTEND_PORT" -sTCP:LISTEN >/dev/null 2>&1; do
  FRONTEND_PORT=$((FRONTEND_PORT + 1))
done
NG_CLI_ANALYTICS=false CI=true npm start -- --host 0.0.0.0 --port "$FRONTEND_PORT" &
FRONTEND_PID=$!
printf '%s\n' "$FRONTEND_PID" > "$FRONTEND_PID_FILE"

while true; do
  if ! kill -0 "$BACKEND_PID" 2>/dev/null; then
    wait "$BACKEND_PID" || true
    exit 1
  fi

  if ! kill -0 "$FRONTEND_PID" 2>/dev/null; then
    wait "$FRONTEND_PID" || true
    exit 1
  fi

  sleep 1
done
