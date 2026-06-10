#!/usr/bin/env bash
# LawnUp dev launcher
# Usage:
#   ./scripts/dev/start.sh           tunnel (default, Android)
#   ./scripts/dev/start.sh --web     web mode
#   ./scripts/dev/start.sh --clean   clear Metro cache first

set -e

ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
LOG_DIR="$ROOT/logs"
QR_HTML="/tmp/lawnup_qr.html"

MODE="tunnel"
CLEAN=""
for arg in "$@"; do
  case "$arg" in
    --web)   MODE="web" ;;
    --clean) CLEAN="--clear" ;;
  esac
done

# Kill stale Metro on port 8081
OLD_PID=$(lsof -ti :8081 2>/dev/null || true)
if [ -n "$OLD_PID" ]; then
  echo "[start] Killing stale Metro (PID $OLD_PID)"
  kill "$OLD_PID" 2>/dev/null || true
  sleep 1
fi

pkill -f "expo start" 2>/dev/null || true

mkdir -p "$LOG_DIR"
echo "" > "$LOG_DIR/expo.log"

cd "$ROOT"

if [ "$MODE" = "web" ]; then
  echo "[start] Starting Expo web..."
  npx expo start --web --port 8081 $CLEAN 2>&1 | tee "$LOG_DIR/expo.log"
  exit 0
fi

# Tunnel mode — start in background, wait for URL, open QR page
echo "[start] Starting Expo tunnel..."
npx expo start --tunnel $CLEAN 2>&1 | tee "$LOG_DIR/expo.log" &
EXPO_PID=$!

echo "[start] Waiting for tunnel URL..."
URL=""
for i in $(seq 1 90); do
  URL=$(grep -oE 'exp://[a-zA-Z0-9._:/@%-]+' "$LOG_DIR/expo.log" 2>/dev/null | head -1 || true)
  if [ -n "$URL" ]; then
    break
  fi
  sleep 1
done

if [ -z "$URL" ]; then
  echo "[start] Tunnel URL not detected yet — check terminal for QR code."
  wait "$EXPO_PID"
  exit 0
fi

echo "[start] Tunnel ready: $URL"

# Build QR page
ENCODED=$(node -e "process.stdout.write(encodeURIComponent('$URL'))")
cat > "$QR_HTML" << HTML
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>LawnUp — Expo Go</title>
  <style>
    body{font-family:-apple-system,sans-serif;background:#F5F1E8;min-height:100vh;display:flex;align-items:center;justify-content:center;padding:24px;margin:0}
    .card{background:#fff;border-radius:24px;padding:40px 32px;text-align:center;box-shadow:0 2px 40px rgba(0,0,0,.08);max-width:380px;width:100%}
    h1{font-size:22px;font-weight:700;color:#111;margin:0 0 6px}
    p{font-size:13px;color:#9E9A94;margin:0 0 20px;line-height:1.5}
    .qr{background:#F5F1E8;border-radius:16px;padding:16px;display:inline-block;margin-bottom:16px}
    .qr img{display:block;width:200px;height:200px}
    .url{background:#F5F1E8;border-radius:8px;padding:10px;font-size:11px;font-family:monospace;color:#666;word-break:break-all;margin-bottom:16px}
    .steps{font-size:12px;color:#9E9A94;text-align:left;background:#FAFAF8;border-radius:10px;padding:12px 16px;line-height:1.9}
    .steps strong{color:#111}
  </style>
</head>
<body>
  <div class="card">
    <h1>Scan to open in Expo Go</h1>
    <p>Point your Android camera or open Expo Go to scan.</p>
    <div class="qr">
      <img src="https://api.qrserver.com/v1/create-qr-code/?size=400x400&data=${ENCODED}&color=111111&bgcolor=F5F1E8" alt="QR"/>
    </div>
    <div class="url">${URL}</div>
    <div class="steps">
      <strong>Android</strong> — Open Expo Go → Scan QR code<br>
      <strong>iOS</strong> — Open Camera → point at code
    </div>
  </div>
</body>
</html>
HTML

open "$QR_HTML" 2>/dev/null || xdg-open "$QR_HTML" 2>/dev/null || true
echo "[start] QR page opened. Logs: $LOG_DIR/expo.log"

wait "$EXPO_PID"
