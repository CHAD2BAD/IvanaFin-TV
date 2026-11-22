# Builds web\ivanafin.js: web\boot.js + every ..\scripts\*.js (alphabetical, each wrapped the way the JavaScript Injector
# plugin wraps its scripts), with the welcome picture filled in. Jellyfin web loads this one file
# (see install.ps1). Run after changing anything in scripts\ or web\boot.js, then commit web\ivanafin.js.
#
#   powershell -File web\build.ps1
$ErrorActionPreference = 'Stop'
$root = $PSScriptRoot
$cat = [IO.File]::ReadAllText((Join-Path $root '..\public\welcome-picture.b64')).Trim()
$sb = New-Object Text.StringBuilder
[void]$sb.Append("/* IvanaFin for Jellyfin web - https://github.com/CHAD2BAD/IvanaFin-TV (built file, do not edit) */`n")
[void]$sb.Append("(function () {`nif (window.IvfWebLoaded) return; // loaded twice: run once`nwindow.IvfWebLoaded = true;`n")
[void]$sb.Append([IO.File]::ReadAllText((Join-Path $root 'boot.js'))).Append("`n")
foreach ($f in Get-ChildItem (Join-Path $root '..\scripts') -Filter *.js | Sort-Object Name) {
    $js = [IO.File]::ReadAllText($f.FullName).Replace('__IVF_CAT_B64__', $cat)
    [void]$sb.Append("/* IvanaFin - $($f.BaseName) */`n(function() { try {`n").Append($js)
    [void]$sb.Append("`n} catch (e) { console.error('IvanaFin script $($f.BaseName) failed:', e); } })();`n")
}
[void]$sb.Append("})();`n")
$out = Join-Path $root 'ivanafin.js'
[IO.File]::WriteAllText($out, $sb.ToString(), (New-Object Text.UTF8Encoding $false))
"Built: $out" + ('  ({0:N0} KB)' -f ((Get-Item $out).Length / 1KB))
