#!/usr/bin/env bash
# 1. Relative path: scripts/install.sh
# 2. Description: One-click secure installer and updater for SwISD worker nodes (Raspberry Pi).
# 3. Expects: Root privileges, internet access, and a valid Ed25519 public key embedded below.
# 4. Provides: Atomic, cryptographically verified deployment of the SwISD headless core, with version short-circuit and rollback preservation.
# 5. SPDX-License-Identifier: MPL-2.0
# 6. Copyright (c) 2026 Homahuki GmbH

set -euo pipefail

# --- CONFIGURATION ---
REPO="hideosnes/swisd"
INSTALL_DIR="/opt/swisd"
SERVICE_NAME="swisd-app"

# EMBEDDED PUBLIC KEY (PEM FORMAT)
read -r -d '' SWISD_PUBKEY_PEM <<'EOF' || true
-----BEGIN PUBLIC KEY-----
MCowBQYDK2VwAyEAQqTUJL3N9AJGTYSoZHOZL5B2KN5aL7WUVzmnJ9VqQMs=
-----END PUBLIC KEY-----
EOF

# --- PREREQUISITES ---
echo "[1/7] Checking prerequisites..."
if [ "$EUID" -ne 0 ]; then
  echo "Error: This script must be run as root (use sudo)." >&2
  exit 1
fi

# Install jq for JSON parsing if missing
if ! command -v jq &> /dev/null; then
  echo "   Installing jq..."
  apt-get update -qq && apt-get install -y -qq jq > /dev/null
fi

# --- NODE.JS GATE ---
echo "[2/7] Ensuring Node.js 22+ is installed..."
if ! command -v node &> /dev/null; then
  echo "   Node.js not found. Installing via NodeSource..."
  curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
  apt-get install -y -qq nodejs > /dev/null
else
  NODE_VER=$(node -v | cut -d. -f1 | tr -d 'v')
  if [ "$NODE_VER" -lt 22 ]; then
    echo "   Node.js version $NODE_VER is too old. Upgrading..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | bash -
    apt-get install -y -qq nodejs > /dev/null
  fi
fi
echo "   Node.js $(node -v) ready."

# --- FETCH LATEST RELEASE ---
echo "[3/7] Fetching latest release from GitHub..."
RELEASE_JSON=$(curl -s "https://api.github.com/repos/$REPO/releases/latest")
TAG_NAME=$(echo "$RELEASE_JSON" | jq -r '.tag_name')
VERSION=${TAG_NAME#v}

if [ -z "$TAG_NAME" ] || [ "$TAG_NAME" == "null" ]; then
  echo "Error: Failed to fetch latest release tag." >&2
  exit 1
fi
echo "   Target version: $VERSION"

# --- VERSION SHORT-CIRCUIT ---
RELEASE_DIR="$INSTALL_DIR/releases/$VERSION"
if [ -L "$INSTALL_DIR/current" ]; then
  CURRENT_TARGET=$(readlink "$INSTALL_DIR/current")
  if [ "$CURRENT_TARGET" = "$RELEASE_DIR" ]; then
    echo "   Version $VERSION is already current. Nothing to do."
    exit 0
  fi
fi

# --- DOWNLOAD ARTIFACTS ---
WORK_DIR=$(mktemp -d)
cd "$WORK_DIR"
echo "[4/7] Downloading artifacts..."

TARBALL="swisd-${VERSION}.tar.gz"
SHA_FILE="${TARBALL}.sha256"
SIG_FILE="${TARBALL}.sig"

# Helper to download asset
download_asset() {
  local name=$1
  local url=$(echo "$RELEASE_JSON" | jq -r ".assets[] | select(.name==\"$name\") | .browser_download_url")
  if [ -z "$url" ] || [ "$url" == "null" ]; then
    echo "Error: Asset $name not found in release $TAG_NAME" >&2
    exit 1
  fi
  curl -sL -o "$name" "$url"
}

download_asset "$TARBALL"
download_asset "$SHA_FILE"
download_asset "$SIG_FILE"

# --- CRYPTOGRAPHIC VERIFICATION ---
echo "[5/7] Verifying integrity and authenticity..."

# 1. SHA-256 Check
echo "$(cat "$SHA_FILE")  $TARBALL" | sha256sum -c - > /dev/null || {
  echo "Error: SHA-256 checksum mismatch!" >&2
  exit 1
}

# 2. Ed25519 Signature Check
echo "$SWISD_PUBKEY_PEM" > pubkey.pem
if ! openssl pkeyutl -verify -pubin -inkey pubkey.pem -rawin -in "$TARBALL" -sigfile "$SIG_FILE" > /dev/null; then
  echo "Error: Ed25519 signature verification failed! The artifact may be tampered." >&2
  exit 1
fi
echo "   Cryptographic verification passed."

# --- FILESYSTEM LAYOUT ---
echo "[6/7] Preparing filesystem..."
mkdir -p "$INSTALL_DIR"/{releases,state,supervisor,models}
# CRITICAL: Do NOT mkdir current/previous. They are symlinks.

mkdir -p "$RELEASE_DIR"
tar -xzf "$TARBALL" -C "$RELEASE_DIR"

# Install production dependencies (tarball does not include node_modules)
echo "   Installing production dependencies..."
cd "$RELEASE_DIR"
npm ci --omit=dev --silent > /dev/null
cd - > /dev/null

# Create swisd user if missing (must happen before chown)
if ! id -u swisd &>/dev/null; then
  echo "   Creating swisd system user..."
  useradd --system --home-dir "$INSTALL_DIR" --shell /usr/sbin/nologin swisd
fi

# Generate persistent admin token if missing
ENV_FILE="$INSTALL_DIR/state/swisd.env"
if [ ! -f "$ENV_FILE" ]; then
  echo "   Generating persistent admin token..."
  TOKEN=$(openssl rand -base64 32)
  echo "SWISD_ADMIN_TOKEN=$TOKEN" > "$ENV_FILE"
  chown swisd:swisd "$ENV_FILE"
  chmod 600 "$ENV_FILE"
fi

# Preserve previous release for manual rollback
if [ -L "$INSTALL_DIR/current" ]; then
  OLD_TARGET=$(readlink "$INSTALL_DIR/current")
  if [ "$OLD_TARGET" != "$RELEASE_DIR" ]; then
    echo "   Preserving previous release for rollback..."
    ln -sfnT "$OLD_TARGET" "$INSTALL_DIR/previous"
  fi
fi

# Atomic Symlink Swap (The -T flag prevents the symlink-inside-directory trap)
echo "   Promoting $VERSION to current..."
ln -sfnT "$RELEASE_DIR" "$INSTALL_DIR/current"
chown -R swisd:swisd "$INSTALL_DIR"

# --- SERVICE INSTALLATION ---
echo "[7/7] Installing systemd service..."
# Fetch the service unit matching the release tag
SERVICE_URL="https://raw.githubusercontent.com/$REPO/$TAG_NAME/systemd/$SERVICE_NAME.service"
curl -sL -o "/etc/systemd/system/$SERVICE_NAME.service" "$SERVICE_URL"

systemctl daemon-reload

# Restart if already running, else enable and start
if systemctl is-active --quiet "$SERVICE_NAME"; then
  echo "   Restarting $SERVICE_NAME..."
  systemctl restart "$SERVICE_NAME"
else
  echo "   Enabling and starting $SERVICE_NAME..."
  systemctl enable --now "$SERVICE_NAME"
fi

# --- CLEANUP & VERIFY ---
cd /
rm -rf "$WORK_DIR"

echo ""
echo "=========================================="
echo " SwISD $VERSION installed successfully."
echo " Service: $SERVICE_NAME.service"
echo "=========================================="
echo ""
echo "Verifying boot sequence..."
sleep 3
systemctl status "$SERVICE_NAME" --no-pager -l