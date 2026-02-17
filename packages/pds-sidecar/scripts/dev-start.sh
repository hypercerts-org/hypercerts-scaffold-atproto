#!/usr/bin/env bash
# =============================================================================
# dev-start.sh — Local development startup script for PDS + Auth + MailHog
# =============================================================================
# Starts:
#   - MailHog (fake SMTP) via Docker on ports 1025 (SMTP) and 8025 (Web UI)
#   - PDS Core (@atproto/pds) on http://localhost:2583
#   - Auth Service (sidecar) on http://localhost:2584
#
# Usage:
#   cd packages/pds-sidecar
#   scripts/dev-start.sh
#
# Prerequisites:
#   - Node.js >= 20
#   - Docker (for MailHog)
#   - .env.dev configured with generated keys (run: node scripts/generate-pds-keys.mjs)
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

cd "$ROOT_DIR"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info()    { echo -e "${BLUE}[info]${NC}  $*"; }
log_ok()      { echo -e "${GREEN}[ok]${NC}    $*"; }
log_warn()    { echo -e "${YELLOW}[warn]${NC}  $*"; }
log_error()   { echo -e "${RED}[error]${NC} $*" >&2; }

# =============================================================================
# 1. Check prerequisites
# =============================================================================

log_info "Checking prerequisites..."

# Check Node.js >= 20
if ! command -v node &>/dev/null; then
  log_error "Node.js is not installed. Please install Node.js >= 20."
  exit 1
fi

NODE_VERSION=$(node --version | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 20 ]; then
  log_error "Node.js >= 20 is required (found: $(node --version))"
  exit 1
fi
log_ok "Node.js $(node --version)"

# Check Docker
if ! command -v docker &>/dev/null; then
  log_error "Docker is not installed. Docker is required to run MailHog."
  exit 1
fi
log_ok "Docker $(docker --version | cut -d' ' -f3 | tr -d ',')"

# =============================================================================
# 2. Create data directories
# =============================================================================

log_info "Creating data directories..."
mkdir -p ./data/pds/blobs
mkdir -p ./data/auth
log_ok "Data directories ready: ./data/pds/blobs, ./data/auth"

# =============================================================================
# 3. Check .env.dev configuration
# =============================================================================

ENV_FILE="$ROOT_DIR/.env.dev"

if [ ! -f "$ENV_FILE" ]; then
  log_error ".env.dev not found. Copy .env.example to .env.dev and configure it."
  exit 1
fi

# Check for unconfigured placeholder values (skip comment lines starting with #)
if grep -v '^\s*#' "$ENV_FILE" | grep -q '<generated>'; then
  log_warn ".env.dev contains unconfigured <generated> placeholders."
  echo ""
  echo "  Run the key generator and paste the output into .env.dev:"
  echo ""
  echo "    node scripts/generate-pds-keys.mjs"
  echo ""
  echo "  Then replace the <generated> values in .env.dev with the generated keys."
  echo ""
  exit 1
fi

log_ok ".env.dev looks configured"

# =============================================================================
# 4. Load .env.dev into the shell environment
# =============================================================================

log_info "Loading .env.dev..."
# Export all variables from .env.dev
set -a
# shellcheck disable=SC1090
source "$ENV_FILE"
set +a
log_ok "Environment loaded"

# =============================================================================
# 5. Start MailHog via Docker
# =============================================================================

log_info "Starting MailHog..."

MAILHOG_CONTAINER="mailhog-dev"

if docker ps --format '{{.Names}}' | grep -q "^${MAILHOG_CONTAINER}$"; then
  log_ok "MailHog already running (container: $MAILHOG_CONTAINER)"
elif docker ps -a --format '{{.Names}}' | grep -q "^${MAILHOG_CONTAINER}$"; then
  log_info "Restarting existing MailHog container..."
  docker start "$MAILHOG_CONTAINER" >/dev/null
  log_ok "MailHog restarted"
else
  log_info "Pulling and starting MailHog container..."
  docker run -d \
    --name "$MAILHOG_CONTAINER" \
    -p 1025:1025 \
    -p 8025:8025 \
    mailhog/mailhog >/dev/null
  log_ok "MailHog started"
fi

# =============================================================================
# 6. Build the sidecar packages
# =============================================================================

log_info "Building sidecar packages..."
npm run build --silent
log_ok "Build complete"

# =============================================================================
# 7. Start PDS Core in the background
# =============================================================================

log_info "Starting PDS Core on http://localhost:${PDS_PORT:-2583}..."

PDS_LOG_FILE="$ROOT_DIR/data/pds-core.log"
node packages/pds-core/dist/index.js >"$PDS_LOG_FILE" 2>&1 &
PDS_PID=$!
log_info "PDS Core PID: $PDS_PID (logs: $PDS_LOG_FILE)"

# =============================================================================
# 8. Wait for PDS health check
# =============================================================================

log_info "Waiting for PDS Core to be ready..."
PDS_PORT_VAL="${PDS_PORT:-2583}"
PDS_HEALTH_URL="http://localhost:${PDS_PORT_VAL}/xrpc/_health"
MAX_WAIT=30
WAITED=0

while true; do
  if curl -sf "$PDS_HEALTH_URL" >/dev/null 2>&1; then
    log_ok "PDS Core is ready"
    break
  fi

  # Check if process died
  if ! kill -0 "$PDS_PID" 2>/dev/null; then
    log_error "PDS Core process died. Check logs:"
    cat "$PDS_LOG_FILE"
    exit 1
  fi

  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    log_error "PDS Core did not start within ${MAX_WAIT}s. Check logs:"
    cat "$PDS_LOG_FILE"
    kill "$PDS_PID" 2>/dev/null || true
    exit 1
  fi

  sleep 1
  WAITED=$((WAITED + 1))
done

# =============================================================================
# 9. Start Auth Service in the background
# =============================================================================

AUTH_PORT_VAL="${AUTH_PORT:-2584}"
log_info "Starting Auth Service on http://localhost:${AUTH_PORT_VAL}..."

AUTH_LOG_FILE="$ROOT_DIR/data/auth-service.log"
node packages/auth-service/dist/index.js >"$AUTH_LOG_FILE" 2>&1 &
AUTH_PID=$!
log_info "Auth Service PID: $AUTH_PID (logs: $AUTH_LOG_FILE)"

# =============================================================================
# 10. Wait for Auth Service health check
# =============================================================================

log_info "Waiting for Auth Service to be ready..."
AUTH_HEALTH_URL="http://localhost:${AUTH_PORT_VAL}/health"
WAITED=0

while true; do
  if curl -sf "$AUTH_HEALTH_URL" >/dev/null 2>&1; then
    log_ok "Auth Service is ready"
    break
  fi

  # Check if process died
  if ! kill -0 "$AUTH_PID" 2>/dev/null; then
    log_error "Auth Service process died. Check logs:"
    cat "$AUTH_LOG_FILE"
    kill "$PDS_PID" 2>/dev/null || true
    exit 1
  fi

  if [ "$WAITED" -ge "$MAX_WAIT" ]; then
    log_error "Auth Service did not start within ${MAX_WAIT}s. Check logs:"
    cat "$AUTH_LOG_FILE"
    kill "$PDS_PID" 2>/dev/null || true
    kill "$AUTH_PID" 2>/dev/null || true
    exit 1
  fi

  sleep 1
  WAITED=$((WAITED + 1))
done

# =============================================================================
# 11. Print summary
# =============================================================================

echo ""
echo -e "${GREEN}✅ All services running:${NC}"
echo -e "   PDS:         http://localhost:${PDS_PORT_VAL}"
echo -e "   Auth:        http://localhost:${AUTH_PORT_VAL}"
echo -e "   MailHog:     http://localhost:8025"
echo ""
echo -e "   Logs:"
echo -e "   PDS:         $PDS_LOG_FILE"
echo -e "   Auth:        $AUTH_LOG_FILE"
echo ""
echo -e "${YELLOW}Next: Start the scaffold app:${NC}"
echo -e "   cd /Users/sharfy/Code/hypercerts-scaffold"
echo -e "   # Update .env.local: NEXT_PUBLIC_PDS_URL=http://localhost:${PDS_PORT_VAL}"
echo -e "   npm run dev"
echo -e "   # Then visit http://127.0.0.1:3000/login"
echo ""
echo -e "Press ${YELLOW}Ctrl+C${NC} to stop all services."
echo ""

# =============================================================================
# 12. Wait for Ctrl+C, then clean up
# =============================================================================

cleanup() {
  echo ""
  log_info "Shutting down services..."

  if kill -0 "$PDS_PID" 2>/dev/null; then
    kill "$PDS_PID" 2>/dev/null || true
    log_ok "PDS Core stopped"
  fi

  if kill -0 "$AUTH_PID" 2>/dev/null; then
    kill "$AUTH_PID" 2>/dev/null || true
    log_ok "Auth Service stopped"
  fi

  if docker ps --format '{{.Names}}' | grep -q "^${MAILHOG_CONTAINER}$"; then
    docker stop "$MAILHOG_CONTAINER" >/dev/null 2>&1 || true
    log_ok "MailHog stopped"
  fi

  log_ok "All services stopped. Goodbye!"
  exit 0
}

trap cleanup SIGINT SIGTERM

# Wait for background processes
wait "$PDS_PID" "$AUTH_PID" 2>/dev/null || true
