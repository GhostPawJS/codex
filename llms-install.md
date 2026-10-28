# Installing ghostpaw-codex as an MCP server

ghostpaw-codex is a single self-contained binary (Node is bundled). It stores
beliefs in one SQLite file and serves MCP over stdio with `ghostpaw-codex mcp`.
No API keys or accounts are needed.

## 1. Install the binary

Pick the line for the machine. Each line downloads the latest release archive,
checks it against the release's `SHA256SUMS` and installs `ghostpaw-codex`
into `~/.local/bin` (Windows: `%LOCALAPPDATA%\Programs\ghostpaw\bin`). The
script exits non-zero and installs nothing if the checksum does not match.

| OS and CPU | Command |
|---|---|
| Linux x64 | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target linux-x64` |
| Linux arm64 | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target linux-arm64` |
| macOS Apple silicon | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target darwin-arm64` |
| macOS Intel | `curl -fsSL https://raw.githubusercontent.com/GhostPawJS/codex/main/install.sh \| sh -s -- --target darwin-x64` |
| Windows x64 (PowerShell) | `irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 \| iex` |

Linux binaries need glibc 2.28 or newer. On Alpine or other musl systems use
`npx -y @ghostpaw/codex mcp` as the command instead (Node 24+).

### Manual install with checksum verification

```sh
V=$(curl -fsSL https://api.github.com/repos/GhostPawJS/codex/releases/latest | sed -n 's/.*"tag_name": *"v\([^"]*\)".*/\1/p')
T=linux-x64   # or linux-arm64, darwin-arm64, darwin-x64
A="ghostpaw-codex-$V-$T.tar.gz"
curl -fsSLO "https://github.com/GhostPawJS/codex/releases/download/v$V/$A"
curl -fsSLO "https://github.com/GhostPawJS/codex/releases/download/v$V/SHA256SUMS"
grep " \*\?$A\$" SHA256SUMS | sha256sum -c -   # macOS: shasum -a 256 -c -
mkdir -p ~/.local/bin && tar -xzf "$A" -C ~/.local/bin ghostpaw-codex
```

On Windows, download `ghostpaw-codex-<version>-windows-x64.zip` and
`SHA256SUMS` from the latest release, compare
`(Get-FileHash <zip> -Algorithm SHA256).Hash` with the listed value and extract
`ghostpaw-codex.exe`.

### Check the install

```sh
~/.local/bin/ghostpaw-codex --version
```

The output looks like `ghostpaw-codex 0.6.0 (binary, linux-x64)`.

## 2. Find the absolute command path

GUI editors (VS Code and therefore Cline) often start without `~/.local/bin` on
PATH, so configure the absolute path:

| OS | Command path |
|---|---|
| Linux | `/home/<user>/.local/bin/ghostpaw-codex` |
| macOS | `/Users/<user>/.local/bin/ghostpaw-codex` |
| Windows | `C:\Users\<user>\AppData\Local\Programs\ghostpaw\bin\ghostpaw-codex.exe` |

Print it on Linux or macOS with `echo "$HOME/.local/bin/ghostpaw-codex"`, on
Windows with `"$env:LOCALAPPDATA\Programs\ghostpaw\bin\ghostpaw-codex.exe"`.

## 3. Add it to Cline

Open Cline, choose **MCP Servers → Installed → Configure MCP Servers**, and add
this entry to `cline_mcp_settings.json` (replace the command with the path from
step 2; in JSON, Windows backslashes are written as `\\`):

```json
{
  "mcpServers": {
    "ghostpaw-codex": {
      "command": "/home/<user>/.local/bin/ghostpaw-codex",
      "args": ["mcp"],
      "env": {
        "GHOSTPAW_CODEX_DB": "/home/<user>/.ghostpaw/codex.db"
      },
      "disabled": false,
      "autoApprove": []
    }
  }
}
```

`GHOSTPAW_CODEX_DB` must be an absolute path; its folder is created on first
use. Without it the database is `~/.ghostpaw/codex.db`.

## 4. Test it

From a terminal, the same binary and database:

```sh
GHOSTPAW_CODEX_DB=/home/<user>/.ghostpaw/codex.db ~/.local/bin/ghostpaw-codex belief add "The staging deploy runs at 14:00" --source observed --category fact
GHOSTPAW_CODEX_DB=/home/<user>/.ghostpaw/codex.db ~/.local/bin/ghostpaw-codex search "staging deploy"
```

In Cline, the server shows seven tools (`search_codex`, `review_codex`,
`inspect_codex_item`, `remember_belief`, `revise_belief`, `retire_belief`,
`dismiss_proximity`). Ask: "Use search_codex to find what you know about the
staging deploy." The result lists the belief added above.
