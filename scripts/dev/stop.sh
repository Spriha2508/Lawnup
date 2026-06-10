#!/usr/bin/env bash
# LawnUp dev stop — kills Expo/Metro, frees ports

echo "[stop] Stopping Expo and Metro..."

pkill -f "expo start" 2>/dev/null && echo "[stop] Killed expo start" || true
pkill -f "ngrok"      2>/dev/null && echo "[stop] Killed ngrok"      || true

for PORT in 8081 8097 19000 19001; do
  PID=$(lsof -ti :"$PORT" 2>/dev/null || true)
  if [ -n "$PID" ]; then
    kill "$PID" 2>/dev/null || true
    echo "[stop] Freed port $PORT (PID $PID)"
  fi
done

echo "[stop] Done."
