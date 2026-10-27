# Install the ghostpaw-codex binary on Windows from GitHub Releases.
#
#   irm https://raw.githubusercontent.com/GhostPawJS/codex/main/install.ps1 | iex
#
# Checks the zip against the release's SHA256SUMS before installing.
# Env: GHOSTPAW_INSTALL_DIR (default %LOCALAPPDATA%\Programs\ghostpaw\bin), GHOSTPAW_VERSION.
$ErrorActionPreference = 'Stop'
$Lib = 'codex'
$Repo = "GhostPawJS/$Lib"
$Bin = "ghostpaw-$Lib"
$Version = $env:GHOSTPAW_VERSION
$Dir = if ($env:GHOSTPAW_INSTALL_DIR) { $env:GHOSTPAW_INSTALL_DIR } else { Join-Path $env:LOCALAPPDATA 'Programs\ghostpaw\bin' }

if ($env:PROCESSOR_ARCHITECTURE -ne 'AMD64') { throw "Only Windows x64 builds exist so far (found $env:PROCESSOR_ARCHITECTURE)" }
if ($Version) { $Version = $Version.TrimStart('v') }
if (-not $Version) {
	$Version = (Invoke-RestMethod "https://api.github.com/repos/$Repo/releases/latest").tag_name.TrimStart('v')
}
$Asset = "$Bin-$Version-windows-x64.zip"
$Base = "https://github.com/$Repo/releases/download/v$Version"
$Tmp = Join-Path ([System.IO.Path]::GetTempPath()) ([System.Guid]::NewGuid())
New-Item -ItemType Directory -Path $Tmp | Out-Null
try {
	Write-Host "Downloading $Asset"
	Invoke-WebRequest "$Base/$Asset" -OutFile (Join-Path $Tmp $Asset) -UseBasicParsing
	Invoke-WebRequest "$Base/SHA256SUMS" -OutFile (Join-Path $Tmp 'SHA256SUMS') -UseBasicParsing
	$Line = Get-Content (Join-Path $Tmp 'SHA256SUMS') | Where-Object { $_ -match "\s\*?$([regex]::Escape($Asset))$" }
	if (-not $Line) { throw "$Asset is not listed in SHA256SUMS" }
	$Expected = ($Line -split '\s+')[0].ToLower()
	$Actual = (Get-FileHash (Join-Path $Tmp $Asset) -Algorithm SHA256).Hash.ToLower()
	if ($Expected -ne $Actual) { throw "checksum mismatch for $Asset" }
	Write-Host 'SHA256 ok'
	Expand-Archive (Join-Path $Tmp $Asset) -DestinationPath $Tmp -Force
	New-Item -ItemType Directory -Path $Dir -Force | Out-Null
	Copy-Item (Join-Path $Tmp "$Bin.exe") (Join-Path $Dir "$Bin.exe") -Force
} finally {
	Remove-Item $Tmp -Recurse -Force -ErrorAction SilentlyContinue
}
$UserPath = [Environment]::GetEnvironmentVariable('Path', 'User')
if (-not ($UserPath -split ';' | Where-Object { $_ -eq $Dir })) {
	[Environment]::SetEnvironmentVariable('Path', "$UserPath;$Dir", 'User')
	Write-Host "Added $Dir to your user PATH (open a new terminal)"
}
$env:PATH = "$Dir;$env:PATH"
Write-Host "Installed $(Join-Path $Dir "$Bin.exe") $(& (Join-Path $Dir "$Bin.exe") --version)"
