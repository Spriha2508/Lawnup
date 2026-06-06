#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  LawnUp AI — Dev Environment Shutdown                                       ║
# ║  Cleanly stops all services, reports errors, optionally archives logs       ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -uo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$SCRIPT_DIR/.dev-pids"
SESSION_FILE="$SCRIPT_DIR/.dev-session"
ARCHIVE_DIR="$LOG_DIR/archive"

# ── ANSI Colors ───────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
MAGENTA='\033[0;35m'
CYAN='\033[0;36m'
WHITE='\033[1;37m'
DIM='\033[2m'
BOLD='\033[1m'
NC='\033[0m'

# ── Helpers ───────────────────────────────────────────────────────────────────
ts() { date '+%H:%M:%S'; }

say() {
  local color=$1; shift
  printf "${color}${BOLD}[%-10s]${NC} ${DIM}%s${NC}  %s\n" "STOP" "$(ts)" "$*"
}

say_ok()   { say "$GREEN"   "$*"; }
say_warn() { say "$YELLOW"  "$*"; }
say_err()  { say "$RED"     "$*"; }
say_info() { say "$BLUE"    "$*"; }

# ── Banner ────────────────────────────────────────────────────────────────────
echo ""
printf "${YELLOW}${BOLD}"
echo "  ┌──────────────────────────────────────────────────┐"
echo "  │         LawnUp Dev Environment — Shutdown        │"
printf "  │  ${NC}${DIM}%-48s${YELLOW}${BOLD}│${NC}\n" "$(date '+%Y-%m-%d %H:%M:%S')"
printf "${YELLOW}${BOLD}"
echo "  └──────────────────────────────────────────────────┘"
printf "${NC}"
echo ""

# ── Kill Tracked PIDs ─────────────────────────────────────────────────────────
kill_tracked_pids() {
  if [[ ! -f "$PID_FILE" ]]; then
    say_warn "No PID file found — dev-start.sh may not have been run"
    return
  fi

  local count=0
  say_info "Sending SIGTERM to tracked processes..."

  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      kill -TERM "$pid" 2>/dev/null && {
        say_ok "Stopped PID $pid"
        count=$((count + 1))
      } || say_warn "Could not stop PID $pid (may have already exited)"
    else
      say_warn "PID $pid not running (already stopped)"
    fi
  done < "$PID_FILE"

  sleep 2

  # Force-kill any survivors
  local forced=0
  while IFS= read -r pid; do
    [[ -z "$pid" ]] && continue
    if kill -0 "$pid" 2>/dev/null; then
      kill -KILL "$pid" 2>/dev/null && {
        say_warn "Force-killed PID $pid (did not exit after SIGTERM)"
        forced=$((forced + 1))
      }
    fi
  done < "$PID_FILE"

  rm -f "$PID_FILE"
  say_ok "Stopped $count process(es) (force-killed: $forced)"
}

# ── Kill by Port (fallback if PID file is missing) ────────────────────────────
kill_by_port() {
  local port=$1 name=$2
  local pid
  pid=$(lsof -ti :"$port" 2>/dev/null | head -1)
  if [[ -n "$pid" ]]; then
    kill -TERM "$pid" 2>/dev/null && say_ok "Stopped $name (port $port, PID $pid)" \
      || say_warn "Could not stop $name on port $port"
  fi
}

kill_known_ports() {
  say_info "Checking known dev ports..."
  kill_by_port 8081  "Metro bundler"
  kill_by_port 8097  "Expo DevTools"
  kill_by_port 9099  "Firebase Auth emulator"
  kill_by_port 8080  "Firestore emulator"
  kill_by_port 5001  "Functions emulator"
  kill_by_port 9199  "Storage emulator"
  kill_by_port 4000  "Firebase Emulator UI"
  kill_by_port 4400  "Firebase Hosting emulator"
}

# ── Error Report ──────────────────────────────────────────────────────────────
show_error_report() {
  local errors_file="$LOG_DIR/errors.log"

  echo ""
  printf "${BOLD}══════════════════════════════════════════════════════${NC}\n"
  printf "${BOLD}  Session Error Report${NC}\n"
  printf "${BOLD}══════════════════════════════════════════════════════${NC}\n"

  if [[ ! -f "$errors_file" ]]; then
    printf "  ${DIM}No error log found${NC}\n"
    printf "${BOLD}══════════════════════════════════════════════════════${NC}\n"
    return
  fi

  # Count non-header lines
  local total_errors
  total_errors=$(grep -c '\[' "$errors_file" 2>/dev/null || echo 0)
  # Remove session header from count
  local headers
  headers=$(grep -c '===' "$errors_file" 2>/dev/null || echo 0)
  total_errors=$((total_errors - headers))
  [[ "$total_errors" -lt 0 ]] && total_errors=0

  if [[ "$total_errors" -eq 0 ]]; then
    printf "  ${GREEN}${BOLD}✓ Clean session — no errors logged${NC}\n"
    printf "${BOLD}══════════════════════════════════════════════════════${NC}\n"
    echo ""
    return
  fi

  printf "  ${RED}${BOLD}Total errors: %d${NC}\n" "$total_errors"
  echo ""

  # Categorize errors
  local firebase_errors expo_errors function_errors auth_errors api_errors
  firebase_errors=$(grep -c '\[FIREBASE' "$errors_file" 2>/dev/null || echo 0)
  expo_errors=$(grep -c '\[EXPO'     "$errors_file" 2>/dev/null || echo 0)
  function_errors=$(grep -c '\[FUNCTIONS' "$errors_file" 2>/dev/null || echo 0)
  auth_errors=$(grep -c '\[AUTH'     "$errors_file" 2>/dev/null || echo 0)
  api_errors=$(grep -c '\[API'      "$errors_file" 2>/dev/null || echo 0)

  printf "  ${MAGENTA}  Firebase:${NC}  %d\n" "$firebase_errors"
  printf "  ${MAGENTA}  Functions:${NC} %d\n" "$function_errors"
  printf "  ${CYAN}  Expo/Metro:${NC} %d\n" "$expo_errors"
  printf "  ${YELLOW}  Auth:${NC}      %d\n" "$auth_errors"
  printf "  ${BLUE}  API:${NC}       %d\n" "$api_errors"
  echo ""

  printf "  ${YELLOW}${BOLD}Last 10 errors:${NC}\n"
  echo ""
  grep -v '===' "$errors_file" 2>/dev/null | tail -10 | while IFS= read -r line; do
    printf "  ${RED}  ›${NC} %s\n" "$line"
  done

  echo ""
  printf "  ${DIM}Full error log: %s${NC}\n" "$errors_file"
  printf "${BOLD}══════════════════════════════════════════════════════${NC}\n"
  echo ""
}

# ── Log Archive ───────────────────────────────────────────────────────────────
archive_logs() {
  local session_ts
  if [[ -f "$SESSION_FILE" ]]; then
    session_ts=$(head -1 "$SESSION_FILE")
  else
    session_ts=$(date '+%Y%m%d_%H%M%S')
  fi

  # Only archive if logs directory has actual content
  local log_size
  log_size=$(du -sm "$LOG_DIR" 2>/dev/null | cut -f1 || echo 0)
  if [[ "$log_size" -lt 1 ]]; then
    say_info "Logs are empty — skipping archive"
    return
  fi

  mkdir -p "$ARCHIVE_DIR"
  local archive="$ARCHIVE_DIR/session_${session_ts}.tar.gz"

  say_info "Archiving session logs → $archive"
  tar -czf "$archive" \
    -C "$LOG_DIR" \
    --exclude="archive" \
    --exclude=".emulator-data" \
    --exclude=".gitkeep" \
    . 2>/dev/null \
    && say_ok "Archive saved: $(du -sh "$archive" 2>/dev/null | cut -f1) — $archive" \
    || say_warn "Archive failed (tar error)"

  # Keep only the last 10 archives
  local archive_count
  archive_count=$(ls "$ARCHIVE_DIR"/session_*.tar.gz 2>/dev/null | wc -l)
  if [[ "$archive_count" -gt 10 ]]; then
    ls -t "$ARCHIVE_DIR"/session_*.tar.gz | tail -n +"11" | xargs rm -f 2>/dev/null
    say_info "Pruned old archives (kept last 10)"
  fi
}

# ── Cleanup Session Files ─────────────────────────────────────────────────────
cleanup_session() {
  rm -f "$SESSION_FILE"
  rm -f "$PID_FILE"
  say_ok "Session files cleaned"
}

# ── Goodbye ───────────────────────────────────────────────────────────────────
print_goodbye() {
  echo ""
  printf "  ${GREEN}${BOLD}Dev environment stopped. Logs archived. Goodbye 🌿${NC}\n"
  echo ""
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  # Parse flags
  local do_archive=0
  for arg in "$@"; do
    case "$arg" in
      --archive|-a) do_archive=1 ;;
      --help|-h)
        echo "Usage: ./dev-stop.sh [--archive|-a]"
        echo "  --archive  Archive logs before stopping"
        exit 0
        ;;
    esac
  done

  kill_tracked_pids
  kill_known_ports

  show_error_report

  if [[ "$do_archive" -eq 1 ]]; then
    archive_logs
  else
    say_info "Tip: run './dev-stop.sh --archive' to save this session's logs"
  fi

  cleanup_session
  print_goodbye
}

main "$@"
