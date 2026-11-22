# IvanaFin for Samsung - FRIENDS' build: works with any Jellyfin server.
# This build carries everything itself: jellyfin-web, the IvanaFin scripts (scripts\,
# joined like the JavaScript Injector plugin does) and the IvanaFin theme. No server address inside -
# the friend types theirs in on first start. Discover appears when their server has Jellyfin Enhanced.
#
#   powershell -File build.ps1        -> IvanaFin.wgt (unsigned; install with Apps2Samsung)
param(
    [string]$WebDir = 'C:\Program Files\Jellyfin\Server\jellyfin-web',
    [string]$ScriptsDir = (Join-Path $PSScriptRoot 'scripts')
)
$ErrorActionPreference = 'Stop'
$root  = $PSScriptRoot
$stage = Join-Path $root 'build'

# 1) Fresh staging folder: app shell + jellyfin-web exactly as installed (its own index.html, no plugins)
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null
Copy-Item (Join-Path $root 'config.xml'), (Join-Path $root 'index.html'), (Join-Path $root 'tizen.js'), (Join-Path $root 'icon.png') $stage
robocopy $WebDir (Join-Path $stage 'www') /E /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
$html = [IO.File]::ReadAllText((Join-Path $stage 'www\index.html'))
if ($html -match 'JavaScriptInjector|JellyfinEnhanced') { throw 'index.html on disk already has plugin tags' }

# 2) IvanaFin scripts in one file, each wrapped like the JavaScript Injector does (alphabetical)
$cat = [IO.File]::ReadAllText((Join-Path $root 'public\welcome-picture.b64')).Trim()
$sb = New-Object Text.StringBuilder
[void]$sb.Append([IO.File]::ReadAllText((Join-Path $root 'public\ivanafin-boot.js'))).Append("`n")
foreach ($f in Get-ChildItem $ScriptsDir -Filter *.js | Sort-Object Name) {
    $js = [IO.File]::ReadAllText($f.FullName).Replace('__IVF_CAT_B64__', $cat)
    [void]$sb.Append("/* IvanaFin - $($f.BaseName) */`n(function() { try {`n").Append($js)
    [void]$sb.Append("`n} catch (e) { console.error('IvanaFin script $($f.BaseName) failed:', e); } })();`n")
}
[IO.File]::WriteAllText((Join-Path $stage 'www\ivanafin.js'), $sb.ToString(), (New-Object Text.UTF8Encoding $false))

# 3) Same index.html changes as the official jellyfin-tizen build, + the IvanaFin scripts after Jellyfin
$csp = '<meta http-equiv="Content-Security-Policy" content="default-src * ''self'' ''unsafe-inline'' ''unsafe-eval'' data: blob: gap: file: filesystem: ws: wss:;">'
$html = $html.Replace('</head>', "$csp</head>")
$m = [regex]::Match($html, '<script defer="defer" src="main\.jellyfin\.bundle\.js[^"]*"></script>')
if (-not $m.Success) { throw 'main.jellyfin.bundle.js script tag not found' }
$shim = '<script src="$WEBAPIS/webapis/webapis.js"></script><script>window.appMode=''cordova'';</script><script src="../tizen.js" defer></script>'
$html = $html.Insert($m.Index + $m.Length, '<script defer="defer" src="ivanafin.js"></script>').Insert($m.Index, $shim)
$welcome = [IO.File]::ReadAllText((Join-Path $root 'welcome.html'))
if ($html -notmatch '<div class="splashLogo"></div>') { throw 'splashLogo element not found in index.html' }
$html = $html.Replace('<div class="splashLogo"></div>', $welcome)
[IO.File]::WriteAllBytes((Join-Path $stage 'www\ivf-welcome-cat.jpg'), [Convert]::FromBase64String($cat))
[IO.File]::WriteAllText((Join-Path $stage 'www\index.html'), $html, (New-Object Text.UTF8Encoding $false))

# 4) Unsigned .wgt (zip, '/' entry names - Tizen rejects '\')
Add-Type -AssemblyName System.IO.Compression, System.IO.Compression.FileSystem
$wgt = Join-Path $root 'IvanaFin.wgt'
if (Test-Path $wgt) { Remove-Item $wgt -Force }
$zip = [IO.Compression.ZipFile]::Open($wgt, 'Create')
try {
    Get-ChildItem $stage -Recurse -File | ForEach-Object {
        $name = $_.FullName.Substring($stage.Length + 1).Replace('\', '/')
        [void][IO.Compression.ZipFileExtensions]::CreateEntryFromFile($zip, $_.FullName, $name, 'Optimal')
    }
} finally { $zip.Dispose() }
"Built: $wgt" + ('  ({0:N1} MB)' -f ((Get-Item $wgt).Length / 1MB))
