#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  LawnUp AI — Dev Environment Startup                                        ║
# ║  Starts Firebase emulators + Expo/Metro with full structured logging        ║
# ╚══════════════════════════════════════════════════════════════════════════════╝

set -uo pipefail

# ── Paths ─────────────────────────────────────────────────────────────────────
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
LOG_DIR="$SCRIPT_DIR/logs"
PID_FILE="$SCRIPT_DIR/.dev-pids"
SESSION_FILE="$SCRIPT_DIR/.dev-session"
FIREBASE_JSON="$SCRIPT_DIR/firebase.json"

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
BG_RED='\033[41m'
BG_GREEN='\033[42m'
NC='\033[0m'

# ── Log Files ─────────────────────────────────────────────────────────────────
LOG_EXPO="$LOG_DIR/expo.log"
LOG_METRO="$LOG_DIR/metro.log"
LOG_FIREBASE="$LOG_DIR/firebase.log"
LOG_FUNCTIONS="$LOG_DIR/functions.log"
LOG_AUTH="$LOG_DIR/auth.log"
LOG_API="$LOG_DIR/api.log"
LOG_APP="$LOG_DIR/app.log"
LOG_ERRORS="$LOG_DIR/errors.log"
LOG_COMBINED="$LOG_DIR/combined.log"

# ── Helpers ───────────────────────────────────────────────────────────────────

ts() { date '+%H:%M:%S'; }

log_raw() {
  local color=$1 prefix=$2 msg=$3
  local timestamp
  timestamp=$(ts)
  printf "${color}${BOLD}[%-10s]${NC} ${DIM}%s${NC}  %s\n" \
    "$prefix" "$timestamp" "$msg"
  printf "[%-10s] %s  %s\n" "$prefix" "$timestamp" "$msg" >> "$LOG_COMBINED"
}

log_info()    { log_raw "$BLUE"    "INFO"      "$*"; }
log_success() { log_raw "$GREEN"   "OK"        "$*"; }
log_warn()    { log_raw "$YELLOW"  "WARN"      "$*"; }
log_error()   {
  log_raw "$RED"     "ERROR"     "$*"
  printf "[%-10s] %s  %s\n" "ERROR" "$(ts)" "$*" >> "$LOG_ERRORS"
}
log_expo()     { log_raw "$CYAN"    "EXPO"      "$*"; }
log_firebase() { log_raw "$MAGENTA" "FIREBASE"  "$*"; }
log_functions(){ log_raw "$MAGENTA" "FUNCTIONS" "$*"; }
log_auth()     {
  log_raw "$YELLOW"  "AUTH"      "$*"
  printf "[%-10s] %s  %s\n" "AUTH" "$(ts)" "$*" >> "$LOG_AUTH"
}

# ── Banner ────────────────────────────────────────────────────────────────────
print_banner() {
  echo ""
  printf "${GREEN}${BOLD}"
  echo "  ██╗      █████╗ ██╗    ██╗███╗   ██╗██╗   ██╗██████╗ "
  echo "  ██║     ██╔══██╗██║    ██║████╗  ██║██║   ██║██╔══██╗"
  echo "  ██║     ███████║██║ █╗ ██║██╔██╗ ██║██║   ██║██████╔╝"
  echo "  ██║     ██╔══██║██║███╗██║██║╚██╗██║██║   ██║██╔═══╝ "
  echo "  ███████╗██║  ██║╚███╔███╔╝██║ ╚████║╚██████╔╝██║     "
  echo "  ╚══════╝╚═╝  ╚═╝ ╚══╝╚══╝ ╚═╝  ╚═══╝ ╚═════╝ ╚═╝     "
  printf "${NC}"
  echo ""
  printf "  ${DIM}India-first AI Gardening App — Development Environment${NC}\n"
  printf "  ${DIM}Session: %s${NC}\n" "$(date '+%Y-%m-%d %H:%M:%S')"
  echo ""
  printf "  ${DIM}──────────────────────────────────────────────────${NC}\n"
  printf "  ${CYAN}Logs:${NC}     %s\n" "$LOG_DIR"
  printf "  ${CYAN}PIDs:${NC}     %s\n" "$PID_FILE"
  printf "  ${DIM}──────────────────────────────────────────────────${NC}\n"
  echo ""
}

# ── Prerequisite Checks ───────────────────────────────────────────────────────
check_prereqs() {
  log_info "Checking prerequisites..."
  local ok=1

  if ! command -v node &>/dev/null; then
    log_error "node not found — install Node.js 20+"
    ok=0
  else
    local node_ver
    node_ver=$(node --version)
    log_success "node $node_ver"
  fi

  if ! command -v npx &>/dev/null; then
    log_error "npx not found"
    ok=0
  else
    log_success "npx available"
  fi

  if [[ ! -f "$SCRIPT_DIR/package.json" ]]; then
    log_error "package.json not found — are you in the project root?"
    ok=0
  fi

  if [[ ! -d "$SCRIPT_DIR/node_modules" ]]; then
    log_warn "node_modules missing — running npm install..."
    npm install --prefix "$SCRIPT_DIR" >> "$LOG_COMBINED" 2>&1 \
      && log_success "npm install complete" \
      || { log_error "npm install failed — check $LOG_COMBINED"; ok=0; }
  else
    log_success "node_modules present"
  fi

  if [[ ! -f "$SCRIPT_DIR/.env" ]]; then
    log_warn ".env file missing — copy .env.example to .env and fill in values"
    log_warn "Firebase/PostHog features may not work until .env is configured"
  else
    log_success ".env present"
  fi

  if [[ "$ok" -eq 0 ]]; then
    log_error "Prerequisite check failed. Fix the issues above and re-run."
    exit 1
  fi

  log_success "All prerequisites satisfied"
  echo ""
}

# ── Log Directory Setup ───────────────────────────────────────────────────────
setup_logs() {
  mkdir -p "$LOG_DIR"

  # Rotate old logs (keep last 5 sessions)
  local session_ts
  session_ts=$(date '+%Y%m%d_%H%M%S')
  echo "$session_ts" > "$SESSION_FILE"

  for logfile in "$LOG_EXPO" "$LOG_METRO" "$LOG_FIREBASE" "$LOG_FUNCTIONS" \
                 "$LOG_AUTH" "$LOG_API" "$LOG_APP" "$LOG_ERRORS" "$LOG_COMBINED"; do
    # Archive if larger than 5MB
    if [[ -f "$logfile" ]]; then
      local size
      size=$(stat -f%z "$logfile" 2>/dev/null || stat -c%s "$logfile" 2>/dev/null || echo 0)
      if [[ "$size" -gt 5242880 ]]; then
        mv "$logfile" "${logfile%.log}_${session_ts}.log"
        log_info "Rotated $(basename "$logfile") (was >5MB)"
      fi
    fi
    : > "$logfile"  # truncate / create
  done

  # Write session header to all logs
  local header="=== LawnUp Dev Session: $(date '+%Y-%m-%d %H:%M:%S') ==="
  for logfile in "$LOG_EXPO" "$LOG_METRO" "$LOG_FIREBASE" "$LOG_FUNCTIONS" \
                 "$LOG_AUTH" "$LOG_API" "$LOG_APP" "$LOG_ERRORS" "$LOG_COMBINED"; do
    echo "$header" >> "$logfile"
  done

  # Clear PID file for fresh session
  : > "$PID_FILE"

  log_success "Log directory ready: $LOG_DIR"
  echo ""
}

# ── Line Classifier (error pattern detection) ─────────────────────────────────
# Returns 0=error, 1=warn, 2=success, 3=info
classify_line() {
  local line="$1"
  if echo "$line" | grep -qiE \
    'error:|ERROR:|exception:|Exception:|FATAL|failed:|Failed:|crash|Cannot find module|ENOENT|ECONNREFUSED|Unhandled|rejected'; then
    echo "error"
  elif echo "$line" | grep -qiE 'warn(ing)?:|WARN|deprecated|skipping'; then
    echo "warn"
  elif echo "$line" | grep -qiE \
    'ready|started|running on|listening|loaded|success|bundled|compiled|connected'; then
    echo "success"
  else
    echo "info"
  fi
}

# ── Stream Colorizer ──────────────────────────────────────────────────────────
# Usage: stream_with_color PREFIX COLOR LOGFILE [EXTRALOGFILE]
# Reads from stdin, writes colored output to terminal and log files
stream_with_color() {
  local prefix=$1 color=$2 logfile=$3 extralog=${4:-""}

  while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    local ts_val class out
    ts_val=$(ts)
    class=$(classify_line "$line")

    case "$class" in
      error)
        out="${RED}${BOLD}[%-10s]${NC} ${DIM}%s${NC}  ${RED}%s${NC}\n"
        printf "[%-10s] %s  %s\n" "$prefix" "$ts_val" "$line" >> "$LOG_ERRORS"
        ;;
      warn)
        out="${YELLOW}${BOLD}[%-10s]${NC} ${DIM}%s${NC}  ${YELLOW}%s${NC}\n"
        ;;
      success)
        out="${GREEN}${BOLD}[%-10s]${NC} ${DIM}%s${NC}  ${GREEN}%s${NC}\n"
        ;;
      *)
        out="${color}${BOLD}[%-10s]${NC} ${DIM}%s${NC}  %s\n"
        ;;
    esac

    # shellcheck disable=SC2059
    printf "$out" "$prefix" "$ts_val" "$line"
    printf "[%-10s] %s  %s\n" "$prefix" "$ts_val" "$line" >> "$logfile"
    printf "[%-10s] %s  %s\n" "$prefix" "$ts_val" "$line" >> "$LOG_COMBINED"
    [[ -n "$extralog" ]] && \
      printf "[%-10s] %s  %s\n" "$prefix" "$ts_val" "$line" >> "$extralog"

    # Detect auth events → write to auth.log
    if echo "$line" | grep -qiE 'auth|sign.?in|sign.?up|login|logout|token|uid'; then
      printf "[%-10s] %s  %s\n" "AUTH" "$ts_val" "$line" >> "$LOG_AUTH"
    fi
    # Detect API events → write to api.log
    if echo "$line" | grep -qiE 'HTTP|POST|GET|PUT|DELETE|fetch|axios|request|response|status [0-9]'; then
      printf "[%-10s] %s  %s\n" "API" "$ts_val" "$line" >> "$LOG_API"
    fi
    # Detect app events → write to app.log
    if echo "$line" | grep -qiE '\[APP\]|\[SCAN\]|\[AI\]|\[PAYMENT\]|\[REMINDER\]'; then
      printf "[%-10s] %s  %s\n" "APP" "$ts_val" "$line" >> "$LOG_APP"
    fi
  done
}
export -f stream_with_color ts classify_line
export LOG_ERRORS LOG_COMBINED LOG_AUTH LOG_API LOG_APP
export RED GREEN YELLOW BLUE MAGENTA CYAN WHITE DIM BOLD BG_RED NC

# ── Firebase Emulators ────────────────────────────────────────────────────────
start_firebase_emulators() {
  log_firebase "Checking Firebase CLI..."

  local firebase_bin=""
  if command -v firebase &>/dev/null; then
    firebase_bin="firebase"
  elif [[ -f "$SCRIPT_DIR/node_modules/.bin/firebase" ]]; then
    firebase_bin="$SCRIPT_DIR/node_modules/.bin/firebase"
  elif command -v npx &>/dev/null; then
    firebase_bin="npx firebase-tools"
  fi

  if [[ -z "$firebase_bin" ]]; then
    log_warn "Firebase CLI not found — skipping emulators"
    log_warn "Install with: npm install -g firebase-tools"
    log_warn "App will connect to live Firebase (requires valid .env)"
    return 0
  fi

  if [[ ! -f "$FIREBASE_JSON" ]]; then
    log_warn "firebase.json not found — skipping emulators"
    return 0
  fi

  log_firebase "Starting Firebase emulators..."
  log_firebase "  Auth  → http://localhost:9099"
  log_firebase "  Firestore → http://localhost:8080"
  log_firebase "  Functions → http://localhost:5001"
  log_firebase "  Storage → http://localhost:9199"
  log_firebase "  UI    → http://localhost:4000"

  (
    cd "$SCRIPT_DIR"
    FIRESTORE_EMULATOR_HOST="localhost:8080" \
    FIREBASE_AUTH_EMULATOR_HOST="localhost:9099" \
    $firebase_bin emulators:start \
      --import="$LOG_DIR/.emulator-data" \
      --export-on-exit="$LOG_DIR/.emulator-data" 2>&1 \
    | stream_with_color "FIREBASE" "$MAGENTA" "$LOG_FIREBASE" "$LOG_FUNCTIONS"
  ) &
  local fb_pid=$!
  echo "$fb_pid" >> "$PID_FILE"
  echo "FIREBASE_PID=$fb_pid" >> "$SESSION_FILE"

  log_firebase "Firebase emulators starting (PID $fb_pid)..."
  # Give emulators time to initialize before Expo tries to connect
  sleep 4

  if kill -0 "$fb_pid" 2>/dev/null; then
    log_success "Firebase emulators running"
  else
    log_error "Firebase emulators failed to start — check $LOG_FIREBASE"
  fi
  echo ""
}

# ── Metro / Expo ──────────────────────────────────────────────────────────────
start_expo() {
  log_expo "Starting Expo / Metro bundler..."
  log_expo "  Bundler → http://localhost:8081"
  log_expo "  DevTools → http://localhost:8097"

  # EXPO_USE_METRO_WORKSPACE_ROOT helps with monorepo setups
  (
    cd "$SCRIPT_DIR"
    EXPO_USE_METRO_WORKSPACE_ROOT=1 \
    npx expo start --clear --port 8081 2>&1 \
    | tee -a "$LOG_METRO" \
    | stream_with_color "EXPO" "$CYAN" "$LOG_EXPO"
  ) &
  local expo_pid=$!
  echo "$expo_pid" >> "$PID_FILE"
  echo "EXPO_PID=$expo_pid" >> "$SESSION_FILE"

  log_expo "Metro bundler starting (PID $expo_pid)..."
  echo ""
}

# ── Health Monitor ────────────────────────────────────────────────────────────
start_health_monitor() {
  (
    while true; do
      sleep 30
      local ts_val has_error=0
      ts_val=$(ts)

      # Check for new errors in the last 30s
      local recent_errors
      recent_errors=$(tail -20 "$LOG_ERRORS" 2>/dev/null | grep -c '\[' || echo 0)

      if [[ "$recent_errors" -gt 0 ]]; then
        printf "${RED}${BOLD}[MONITOR  ]${NC} ${DIM}%s${NC}  ${RED}⚠ %d new error(s) — check %s/errors.log${NC}\n" \
          "$ts_val" "$recent_errors" "$LOG_DIR"
        has_error=1
      fi

      # Check PIDs are still alive
      while IFS= read -r pid; do
        [[ -z "$pid" ]] && continue
        if ! kill -0 "$pid" 2>/dev/null; then
          printf "${RED}${BOLD}[MONITOR  ]${NC} ${DIM}%s${NC}  ${RED}Process PID %s died unexpectedly${NC}\n" \
            "$ts_val" "$pid"
          has_error=1
        fi
      done < "$PID_FILE"

      if [[ "$has_error" -eq 0 ]]; then
        printf "${DIM}[MONITOR  ] %s  All services healthy${NC}\n" "$ts_val"
      fi
    done
  ) &
  echo "$!" >> "$PID_FILE"
}

# ── Startup Complete ──────────────────────────────────────────────────────────
print_startup_complete() {
  sleep 2
  echo ""
  printf "${GREEN}${BOLD}"
  echo "  ╔══════════════════════════════════════════════════════╗"
  echo "  ║           🌿  LawnUp Dev Environment Ready           ║"
  echo "  ╠══════════════════════════════════════════════════════╣"
  printf "  ║  ${NC}${CYAN}Expo${GREEN}        →  ${NC}Open Expo Go, scan the QR code       ${GREEN}║${NC}\n"
  printf "  ║  ${NC}${CYAN}Metro${GREEN}       →  ${NC}http://localhost:8081                 ${GREEN}║${NC}\n"
  printf "  ║  ${NC}${MAGENTA}Firebase UI${GREEN} →  ${NC}http://localhost:4000                 ${GREEN}║${NC}\n"
  printf "  ║  ${NC}${MAGENTA}Firestore${GREEN}   →  ${NC}http://localhost:8080                 ${GREEN}║${NC}\n"
  printf "  ║  ${NC}${MAGENTA}Auth${GREEN}        →  ${NC}http://localhost:9099                 ${GREEN}║${NC}\n"
  printf "  ║  ${NC}${YELLOW}Logs${GREEN}        →  ${NC}./logs/                              ${GREEN}║${NC}\n"
  printf "${GREEN}${BOLD}"
  echo "  ╠══════════════════════════════════════════════════════╣"
  printf "  ║  ${NC}${DIM}Press Ctrl+C to stop all services               ${GREEN}${BOLD}║${NC}\n"
  printf "${GREEN}${BOLD}"
  echo "  ╚══════════════════════════════════════════════════════╝"
  printf "${NC}"
  echo ""
  printf "  ${DIM}Log streams:${NC}\n"
  printf "  ${CYAN}  tail -f logs/expo.log${NC}       — Expo/Metro events\n"
  printf "  ${MAGENTA}  tail -f logs/firebase.log${NC}   — Firebase emulator\n"
  printf "  ${MAGENTA}  tail -f logs/functions.log${NC}  — Cloud Function calls\n"
  printf "  ${YELLOW}  tail -f logs/auth.log${NC}       — Auth events\n"
  printf "  ${BLUE}  tail -f logs/api.log${NC}        — Network requests\n"
  printf "  ${RED}  tail -f logs/errors.log${NC}     — All errors (realtime)\n"
  printf "  ${WHITE}  tail -f logs/combined.log${NC}  — Everything\n"
  echo ""
  printf "${DIM}  ── Live output below ───────────────────────────────${NC}\n"
  echo ""
}

# ── Cleanup / Shutdown ────────────────────────────────────────────────────────
show_error_summary() {
  local error_count=0
  if [[ -f "$LOG_ERRORS" ]]; then
    error_count=$(grep -c '\[' "$LOG_ERRORS" 2>/dev/null || echo 0)
    # Subtract the session header line
    error_count=$((error_count > 0 ? error_count - 1 : 0))
  fi

  echo ""
  printf "${BOLD}═══════════════════════════════════════════════════════${NC}\n"
  printf "${BOLD}  Session Summary — %s${NC}\n" "$(date '+%H:%M:%S')"
  printf "${BOLD}═══════════════════════════════════════════════════════${NC}\n"

  if [[ "$error_count" -gt 0 ]]; then
    printf "  ${RED}${BOLD}Errors recorded: %d${NC}\n" "$error_count"
    echo ""
    printf "  ${YELLOW}Last 5 errors:${NC}\n"
    grep -v "^===" "$LOG_ERRORS" 2>/dev/null | tail -5 | while IFS= read -r line; do
      printf "  ${RED}  › %s${NC}\n" "$line"
    done
    echo ""
    printf "  ${DIM}Full error log: %s${NC}\n" "$LOG_ERRORS"
  else
    printf "  ${GREEN}No errors recorded this session${NC}\n"
  fi

  printf "${BOLD}═══════════════════════════════════════════════════════${NC}\n"
  echo ""
}

cleanup() {
  echo ""
  log_warn "Shutting down LawnUp dev environment..."

  if [[ -f "$PID_FILE" ]]; then
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      if kill -0 "$pid" 2>/dev/null; then
        kill -TERM "$pid" 2>/dev/null || true
        log_info "Stopped PID $pid"
      fi
    done < "$PID_FILE"
    sleep 1
    # Force kill any still-running PIDs
    while IFS= read -r pid; do
      [[ -z "$pid" ]] && continue
      kill -KILL "$pid" 2>/dev/null || true
    done < "$PID_FILE"
    rm -f "$PID_FILE"
  fi

  show_error_summary

  log_info "Logs saved to: $LOG_DIR"
  log_success "Dev environment stopped. Goodbye 🌿"
}

trap cleanup EXIT INT TERM

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
  print_banner
  setup_logs
  check_prereqs
  start_firebase_emulators
  start_expo
  start_health_monitor
  print_startup_complete

  # Block and wait — cleanup runs on Ctrl+C via trap
  wait
}

main
