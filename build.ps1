# Builds everything in this repository:
#   IvanaFin.wgt      Samsung app          (samsung\build.ps1)
#   IvanaFin.ipk      LG app               (lg\build.ps1 - needs Node.js + npm install -g @webos-tools/cli)
#   web\ivanafin.js   Jellyfin web version (web\build.ps1)
#
#   powershell -File build.ps1 [-WebDir <folder of jellyfin-web>] [-Only samsung|lg|web]
param(
    [string]$WebDir = 'C:\Program Files\Jellyfin\Server\jellyfin-web',
    [ValidateSet('', 'samsung', 'lg', 'web')] [string]$Only = ''
)
$ErrorActionPreference = 'Stop'
foreach ($part in 'samsung', 'lg', 'web') {
    if ($Only -and $Only -ne $part) { continue }
    $script = Join-Path $PSScriptRoot "$part\build.ps1"
    if ($part -eq 'web') { & $script } else { & $script -WebDir $WebDir }
}
