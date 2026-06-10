#!/usr/bin/env bash
# ╔══════════════════════════════════════════════════════════════════════════════╗
# ║  LawnUp — Dev Doctor                                                        ║
# ║  Diagnoses common React Native / Expo / environment issues                  ║
# ╚══════════════════════════════════════════════════════════════════════════════╝
set -uo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
LOG_DIR="$ROOT/logs"

RED='\033[0;31m';   GREEN='\033[0;32m';  YELLOW='\033[1;33m'
BLUE='\033[0;34m';  CYAN='\033[0;36m';   BOLD='\033[1m'
DIM='\033[2m';      NC='\033[0m'

PASS=0; WARN=0; FAIL=0

ts() { date '+%H:%M:%S'; }

check_pass() { printf "  ${GREEN}${BOLD}[PASS]${NC}  %s\n" "$*"; PASS=$((PASS+1)); }
check_warn() { printf "  ${YELLOW}${BOLD}[WARN]${NC}  %s\n" "$*"; WARN=$((WARN+1)); }
check_fail() { printf "  ${RED}${BOLD}[FAIL]${NC}  %s\n" "$*"; FAIL=$((FAIL+1)); }
section()    { echo ""; printf "  ${CYAN}${BOLD}── %s${NC}\n" "$*"; }

echo ""
printf "${GREEN}${BOLD}"
echo "  ╔════════════════════════════════════════╗"
echo "  ║   🩺  LawnUp Dev Doctor                ║"
printf "  ╚════════════════════════════════════════╝${NC}\n"
echo ""

# ── Node / npm ─────────────────────────────────────────────────────────────────
section "Runtime"

if command -v node &>/dev/null; then
  NODE_VER=$(node --version | sed 's/v//')
  MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
  if [[ "$MAJOR" -ge 18 ]]; then
    check_pass "node v$NODE_VER (>= 18)"
  else
    check_warn "node v$NODE_VER — recommend v20+ for best Expo 54 support"
  fi
else
  check_fail "node not found — install Node.js 20+ from nodejs.org"
fi

if command -v npm &>/dev/null; then
  check_pass "npm $(npm --version)"
else
  check_fail "npm not found"
fi

# ── Project ────────────────────────────────────────────────────────────────────
section "Project"

[[ -f "$ROOT/package.json" ]] && check_pass "package.json found" || check_fail "package.json missing"
[[ -d "$ROOT/node_modules" ]] && check_pass "node_modules present" || check_fail "node_modules missing — run: npm install"
[[ -f "$ROOT/.env" ]]         && check_pass ".env present"         || check_warn ".env missing — copy .env.example and fill keys"
[[ -f "$ROOT/app.config.ts" ]] && check_pass "app.config.ts found" || check_warn "app.config.ts missing"

# Check for Expo SDK version mismatch
if [[ -f "$ROOT/package.json" ]]; then
  EXPO_VERSION=$(node -e "const p=require('$ROOT/package.json');console.log(p.dependencies?.expo || 'not found')" 2>/dev/null)
  check_pass "expo version: $EXPO_VERSION"
fi

# ── .env keys ──────────────────────────────────────────────────────────────────
section "Environment Keys"

if [[ -f "$ROOT/.env" ]]; then
  REQUIRED_KEYS=(
    "EXPO_PUBLIC_FIREBASE_API_KEY"
    "EXPO_PUBLIC_FIREBASE_PROJECT_ID"
    "EXPO_PUBLIC_PLANT_ID_KEY"
  )
  OPTIONAL_KEYS=(
    "EXPO_PUBLIC_OPENWEATHER_KEY"
    "EXPO_PUBLIC_POSTHOG_HOST"
    "EXPO_PUBLIC_IMAGEKIT_URL_ENDPOINT"
  )

  for key in "${REQUIRED_KEYS[@]}"; do
    val=$(grep "^${key}=" "$ROOT/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
    if [[ -n "$val" && "$val" != "your_key_here" && "$val" != "TODO" ]]; then
      check_pass "$key set (${#val} chars)"
    else
      check_fail "$key missing or placeholder — required for app to function"
    fi
  done

  for key in "${OPTIONAL_KEYS[@]}"; do
    val=$(grep "^${key}=" "$ROOT/.env" 2>/dev/null | cut -d= -f2- | tr -d '"' || true)
    if [[ -n "$val" && "$val" != "your_key_here" ]]; then
      check_pass "$key set"
    else
      check_warn "$key not set — some features disabled"
    fi
  done
else
  check_fail ".env not found — no keys to check"
fi

# ── Ports ──────────────────────────────────────────────────────────────────────
section "Ports"

check_port() {
  local port=$1 name=$2
  local pid; pid=$(lsof -ti :"$port" 2>/dev/null | head -1 || true)
  if [[ -n "$pid" ]]; then
    local cmd; cmd=$(ps -p "$pid" -o comm= 2>/dev/null || echo "unknown")
    check_warn "Port $port ($name) occupied by PID $pid ($cmd) — run npm run stop"
  else
    check_pass "Port $port ($name) free"
  fi
}

check_port 8081  "Metro"
check_port 8097  "Expo DevTools"
check_port 19000 "Expo Go"
check_port 19001 "Expo Go"

# ── Metro / Expo ───────────────────────────────────────────────────────────────
section "Expo / Metro"

if command -v npx &>/dev/null; then
  EXPO_INSTALLED=$(node -e "try{require('$ROOT/node_modules/expo/package.json');console.log('yes')}catch{console.log('no')}" 2>/dev/null)
  if [[ "$EXPO_INSTALLED" == "yes" ]]; then
    EXPO_VER=$(node -e "console.log(require('$ROOT/node_modules/expo/package.json').version)" 2>/dev/null || echo "unknown")
    check_pass "expo package installed ($EXPO_VER)"
  else
    check_fail "expo not installed in node_modules"
  fi
fi

# Check metro config
[[ -f "$ROOT/metro.config.js" ]] && check_pass "metro.config.js present" || check_warn "metro.config.js missing"

# Check for zombie Metro
METRO_PID=$(lsof -ti :8081 2>/dev/null | head -1 || true)
if [[ -n "$METRO_PID" ]]; then
  check_warn "Metro may be running on port 8081 (PID $METRO_PID) — stop it first"
else
  check_pass "Metro port 8081 is free"
fi

# ── Common RN issues ───────────────────────────────────────────────────────────
section "React Native Checks"

# Check for duplicate react-native
DUPES=$(find "$ROOT/node_modules" -name "react-native" -maxdepth 4 -type d 2>/dev/null | grep -v "react-native-" | wc -l)
if [[ "$DUPES" -gt 1 ]]; then
  check_warn "Multiple react-native copies in node_modules ($DUPES found) — may cause issues"
else
  check_pass "react-native — single copy"
fi

# Check gesture handler
[[ -d "$ROOT/node_modules/react-native-gesture-handler" ]] \
  && check_pass "react-native-gesture-handler installed" \
  || check_warn "react-native-gesture-handler missing"

# Check reanimated
[[ -d "$ROOT/node_modules/react-native-reanimated" ]] \
  && check_pass "react-native-reanimated installed" \
  || check_warn "react-native-reanimated missing"

# ── Logs ───────────────────────────────────────────────────────────────────────
section "Dev Logs"

if [[ -d "$LOG_DIR" ]]; then
  check_pass "logs/ directory exists"

  if [[ -f "$LOG_DIR/errors.log" ]]; then
    ERR_COUNT=$(grep -cvE '^===|^$' "$LOG_DIR/errors.log" 2>/dev/null || echo 0)
    if [[ "$ERR_COUNT" -gt 0 ]]; then
      check_warn "$ERR_COUNT error(s) in last session (logs/errors.log)"
      echo ""
      printf "  ${YELLOW}  Last 3 errors:${NC}\n"
      grep -vE '^===|^$' "$LOG_DIR/errors.log" 2>/dev/null | tail -3 | while IFS= read -r l; do
        printf "  ${RED}    › %s${NC}\n" "$l"
      done
    else
      check_pass "No errors in last session"
    fi
  else
    check_warn "No error log found — start the dev server first"
  fi
else
  check_warn "logs/ directory not found — start the dev server first"
fi

# ── Summary ────────────────────────────────────────────────────────────────────
echo ""
printf "  ${BOLD}── Summary ────────────────────────────────────────────${NC}\n"
printf "  ${GREEN}  PASS: %d${NC}  ${YELLOW}  WARN: %d${NC}  ${RED}  FAIL: %d${NC}\n" "$PASS" "$WARN" "$FAIL"
echo ""

if [[ "$FAIL" -gt 0 ]]; then
  printf "  ${RED}${BOLD}Fix the FAIL items above before starting the dev server.${NC}\n"
  exit 1
elif [[ "$WARN" -gt 0 ]]; then
  printf "  ${YELLOW}Some warnings found — app may have limited functionality.${NC}\n"
  printf "  ${CYAN}Run: npm run dev${NC}\n"
else
  printf "  ${GREEN}${BOLD}All checks passed.${NC}\n"
  printf "  ${CYAN}Run: npm run dev${NC}\n"
fi
echo ""
