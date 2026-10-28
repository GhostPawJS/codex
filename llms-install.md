# Installing ghostpaw-codex as an MCP server

ghostpaw-codex is a single self-contained binary with Node bundled. It stores
beliefs in one SQLite file and serves MCP over stdio with `ghostpaw-codex mcp`.
It needs no API keys or accounts.

## 1. Install the binary

Find the target for the machine with `uname -sm`:

| `uname -sm` prints | Target |
|---|---|
| `Linux x86_64` | `linux-x64` |
| `Linux aarch64` | `linux-arm64` |
| `Darwin arm64` | `darwin-arm64` |
| `Darwin x86_64` | `darwin-x64` |
| (Windows) | use the PowerShell line |

Run the line for that target. `install.sh` finds the latest release, checks
the archive against the release's `SHA256SUMS` and installs `ghostpaw-codex`
into `~/.local/bin`. On Windows, `install.ps1` installs it into
`%LOCALAPPDATA%\Programs\ghostpaw\bin`. Both scripts exit non-zero and install
nothing when the checksum does not match.

| Target | Latest release |
|---|---|
| linux-x64 | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target linux-x64` |
| linux-arm64 | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target linux-arm64` |
| darwin-arm64 | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target darwin-arm64` |
| darwin-x64 | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target darwin-x64` |
| Windows x64 (PowerShell) | `irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 \| iex` |

To pin a version, add `--version 0.6.0`:

```sh
curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh | sh -s -- --target linux-x64 --version 0.6.0
```

On Windows, set `$env:GHOSTPAW_VERSION = '0.6.0'` in the same PowerShell
session before the `irm` line.

The Linux binaries need glibc 2.28 or newer. On Alpine, other musl systems or
an unsupported CPU, a person can run `npx -y @ghostpaw/codex mcp` (Node 24+) as
the command instead. That fallback is meant for people on those systems.
Automated installs use the binary.

### Manual install with checksum verification

This block does what `install.sh` does. It runs in a subshell with `set -eu`,
so a failed lookup, download or checksum stops it before anything is
installed. Set `V=0.6.0` to pin a version, or leave it empty for the latest
release. The latest release is found from the github.com
`releases/latest` redirect, which avoids the GitHub API rate limit.

```sh
(
set -eu
V=""          # empty = latest release; for example V=0.6.0 to pin
T=linux-x64   # or linux-arm64, darwin-arm64, darwin-x64 (see uname -sm above)
R=https://github.com/GhostPawJS/codex/releases
if [ -z "$V" ]; then
  V=$(curl -fsSLI -o /dev/null -w '%{url_effective}' "$R/latest" | sed -n 's#.*/tag/v##p')
fi
[ -n "$V" ] || { echo "Could not find the latest release; set V=0.6.0 and run again." >&2; exit 1; }
A="ghostpaw-codex-$V-$T.tar.gz"
D=$(mktemp -d)
trap 'rm -rf "$D"' EXIT
cd "$D"
curl -fsSLO "$R/download/v$V/$A"
curl -fsSLO "$R/download/v$V/SHA256SUMS"
awk -v f="$A" '$2 == f || $2 == "*" f' SHA256SUMS > "$A.sha256"
[ -s "$A.sha256" ] || { echo "$A is not listed in SHA256SUMS" >&2; exit 1; }
if command -v sha256sum >/dev/null 2>&1; then
  sha256sum -c "$A.sha256"
else
  shasum -a 256 -c "$A.sha256"   # macOS
fi
tar -xzf "$A" ghostpaw-codex
mkdir -p "$HOME/.local/bin"
mv ghostpaw-codex "$HOME/.local/bin/ghostpaw-codex"
echo "Installed $HOME/.local/bin/ghostpaw-codex"
)
```

On Windows, download `ghostpaw-codex-<version>-windows-x64.zip` and
`SHA256SUMS` from the release, compare
`(Get-FileHash <zip> -Algorithm SHA256).Hash` with the listed value and extract
`ghostpaw-codex.exe` only if they match.

### Check the install

```sh
"$HOME/.local/bin/ghostpaw-codex" --version
```

The output looks like `ghostpaw-codex 0.6.0 (binary, linux-x64)`.

## 2. Find the absolute command path

GUI editors (VS Code and therefore Cline) often start without `~/.local/bin` on
PATH, so configure the absolute path. Print it with:

```sh
echo "$HOME/.local/bin/ghostpaw-codex"
```

```powershell
"$env:LOCALAPPDATA\Programs\ghostpaw\bin\ghostpaw-codex.exe"
```

Use the printed path in step 3. The database path works the same way:
`echo "$HOME/.ghostpaw/codex.db"` (Windows: `"$env:USERPROFILE\.ghostpaw\codex.db"`).

## 3. Add it to Cline

Cline reads `cline_mcp_settings.json`. In Cline, **MCP Servers → Installed →
Configure MCP Servers** opens it. Typical locations:

| Client | Typical settings file |
|---|---|
| VS Code extension, Linux | `~/.config/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| VS Code extension, macOS | `~/Library/Application Support/Code/User/globalStorage/saoudrizwan.claude-dev/settings/cline_mcp_settings.json` |
| VS Code extension, Windows | `%APPDATA%\Code\User\globalStorage\saoudrizwan.claude-dev\settings\cline_mcp_settings.json` |
| Cline CLI 3.x | `~/.cline/data/settings/cline_mcp_settings.json` (`CLINE_DIR`, `CLINE_DATA_DIR` or `CLINE_MCP_SETTINGS_PATH` move it) |

Merge this entry into the existing `mcpServers` object. Do not replace the
file, or other servers are lost. Replace both paths with the ones printed in
step 2. In JSON, Windows backslashes are written as `\\`.

```json
{
  "mcpServers": {
    "ghostpaw-codex": {
      "command": "/absolute/path/from/step-2/ghostpaw-codex",
      "args": ["mcp"],
      "env": {
        "GHOSTPAW_CODEX_DB": "/absolute/path/from/step-2/.ghostpaw/codex.db"
      },
      "disabled": false
    }
  }
}
```

`GHOSTPAW_CODEX_DB` must be an absolute path; its folder is created on first
use. Without it the database is `~/.ghostpaw/codex.db`.

Both the flat `{command, args, env}` entry above and a nested
`{"transport": {"type": "stdio", "command", "args", "env"}}` entry are
accepted. Cline's settings loader parses both and converts the flat form
(`legacyStdioRegistrationSchema` in
[sdk/packages/core/src/extensions/mcp/config-loader.ts](https://github.com/cline/cline/blob/main/sdk/packages/core/src/extensions/mcp/config-loader.ts)).

`cline mcp add` writes the nested form and has no option for environment
variables. Pass the database as an argument instead:

```sh
cline mcp add ghostpaw-codex --yes -- "$HOME/.local/bin/ghostpaw-codex" mcp --db "$HOME/.ghostpaw/codex.db"
```

## 4. Test it

From a terminal, use the same binary and database:

```sh
export GHOSTPAW_CODEX_DB="$HOME/.ghostpaw/codex.db"
"$HOME/.local/bin/ghostpaw-codex" belief add "The staging deploy runs at 14:00" --source observed --category fact
"$HOME/.local/bin/ghostpaw-codex" search "staging deploy"
```

For a headless check of the MCP tool, run `call` in the same shell. It runs the
handler the MCP server uses and prints the JSON result:

```sh
"$HOME/.local/bin/ghostpaw-codex" call search_codex '{"query":"staging deploy"}'
```

The result has `"ok": true` and `"summary": "Found 1 belief."`.

In Cline, the server shows seven tools (`search_codex`, `review_codex`,
`inspect_codex_item`, `remember_belief`, `revise_belief`, `retire_belief`,
`dismiss_proximity`). Ask: "Use search_codex to find what you know about the
staging deploy." The result lists the belief added above.
