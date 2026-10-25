#!/bin/sh
# Install the ghostpaw-codex binary from GitHub Releases.
#
#   curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh | sh
#   curl -fsSL .../install.sh | sh -s -- --version 0.4.0 --dir /usr/local/bin
#
# Checks the archive against the release's SHA256SUMS before installing.
# With the GitHub CLI installed and GHOSTPAW_VERIFY=attestation set, it also
# checks the build provenance attestation (gh attestation verify).
# Env: GHOSTPAW_INSTALL_DIR (default ~/.local/bin), GHOSTPAW_VERSION, GHOSTPAW_VERIFY.
set -eu

LIB=codex
REPO="GhostPawJS/$LIB"
BIN="ghostpaw-$LIB"
VERSION="${GHOSTPAW_VERSION:-}"
DIR="${GHOSTPAW_INSTALL_DIR:-$HOME/.local/bin}"

while [ $# -gt 0 ]; do
	case "$1" in
	--version) VERSION="${2#v}"; shift 2 ;;
	--dir) DIR="$2"; shift 2 ;;
	-h | --help) sed -n '2,11p' "$0" 2>/dev/null || true; exit 0 ;;
	*) echo "install.sh: unknown option $1" >&2; exit 2 ;;
	esac
done

say() { printf '%s\n' "$*" >&2; }
die() { say "install.sh: $*"; exit 1; }
need() { command -v "$1" >/dev/null 2>&1 || die "needs $1"; }
need curl
need tar
need uname

case "$(uname -s)" in
Linux) OS=linux ;;
Darwin) OS=darwin ;;
*) die "unsupported OS $(uname -s); on Windows use install.ps1" ;;
esac
case "$(uname -m)" in
x86_64 | amd64) ARCH=x64 ;;
aarch64 | arm64) ARCH=arm64 ;;
*) die "unsupported CPU $(uname -m)" ;;
esac
if [ "$OS" = linux ] && [ -e /etc/alpine-release ]; then
	die "Alpine/musl is not supported: the binary needs glibc 2.28+. Use 'npx @ghostpaw/$LIB' instead."
fi

if [ -z "$VERSION" ]; then
	URL=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "https://github.com/$REPO/releases/latest")
	VERSION="${URL##*/v}"
	if [ -z "$VERSION" ] || [ "$VERSION" = "$URL" ]; then die "could not find the latest release"; fi
fi
ASSET="$BIN-$VERSION-$OS-$ARCH.tar.gz"
BASE="${GHOSTPAW_BASE_URL:-https://github.com/$REPO/releases/download/v$VERSION}"

TMP=$(mktemp -d)
trap 'rm -rf "$TMP"' EXIT INT TERM
say "Downloading $ASSET"
curl -fsSL -o "$TMP/$ASSET" "$BASE/$ASSET" || die "download failed: $BASE/$ASSET"
curl -fsSL -o "$TMP/SHA256SUMS" "$BASE/SHA256SUMS" || die "download failed: $BASE/SHA256SUMS"

EXPECTED=$(awk -v f="$ASSET" '$2 == f || $2 == "*" f { print $1 }' "$TMP/SHA256SUMS")
[ -n "$EXPECTED" ] || die "$ASSET is not listed in SHA256SUMS"
if command -v sha256sum >/dev/null 2>&1; then
	ACTUAL=$(sha256sum "$TMP/$ASSET" | awk '{ print $1 }')
else
	ACTUAL=$(shasum -a 256 "$TMP/$ASSET" | awk '{ print $1 }')
fi
[ "$EXPECTED" = "$ACTUAL" ] || die "checksum mismatch for $ASSET"
say "SHA256 ok"

if [ "${GHOSTPAW_VERIFY:-}" = attestation ]; then
	need gh
	gh attestation verify "$TMP/$ASSET" -R "$REPO" >/dev/null || die "attestation check failed"
	say "Attestation ok"
fi

tar -xzf "$TMP/$ASSET" -C "$TMP" "$BIN"
mkdir -p "$DIR"
mv "$TMP/$BIN" "$DIR/$BIN"
chmod 755 "$DIR/$BIN"
say "Installed $DIR/$BIN $("$DIR/$BIN" --version)"
case ":$PATH:" in
*":$DIR:"*) ;;
*) say "Add $DIR to your PATH to run $BIN" ;;
esac
