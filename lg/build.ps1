# IvanaFin for LG (webOS): works with any Jellyfin server.
# The app carries everything itself: jellyfin-web, the IvanaFin scripts (..\scripts\, joined like the
# JavaScript Injector plugin does) and the IvanaFin theme. No server address inside - the user types
# theirs in on first start. Discover appears when the server has Jellyfin Enhanced.
#
#   powershell -File lg\build.ps1 [-WebDir <folder of jellyfin-web>]   -> IvanaFin.ipk
#   Needs Node.js and LG's CLI:  npm install -g @webos-tools/cli
param(
    [string]$WebDir = 'C:\Program Files\Jellyfin\Server\jellyfin-web',
    [string]$ScriptsDir = (Join-Path $PSScriptRoot '..\scripts')
)
$ErrorActionPreference = 'Stop'
$shell   = $PSScriptRoot                                          # LG app shell: appinfo.json, webos.js, icons
$root    = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path     # shared files (public\, welcome.html) + output
$stage   = Join-Path $root 'build\lg'
$version = (Get-Content (Join-Path $root 'public\VERSION')).Trim()
$utf8    = New-Object Text.UTF8Encoding $false

# 1) Fresh staging folder: app shell + jellyfin-web exactly as installed (its own index.html, no plugins)
if (Test-Path $stage) { Remove-Item $stage -Recurse -Force }
New-Item -ItemType Directory $stage | Out-Null
Copy-Item (Join-Path $shell 'icon.png'), (Join-Path $shell 'largeIcon.png') $stage
$info = [IO.File]::ReadAllText((Join-Path $shell 'appinfo.json')) -replace '"version":\s*"[^"]*"', "`"version`": `"$version`""
[IO.File]::WriteAllText((Join-Path $stage 'appinfo.json'), $info, $utf8)
robocopy $WebDir (Join-Path $stage 'www') /E /NFL /NDL /NJH /NJS /NP | Out-Null
if ($LASTEXITCODE -ge 8) { throw "robocopy failed ($LASTEXITCODE)" }
$html = [IO.File]::ReadAllText((Join-Path $stage 'www\index.html'))
if ($html -match 'JavaScriptInjector|JellyfinEnhanced') { throw 'index.html on disk already has plugin tags' }
[IO.File]::WriteAllText((Join-Path $stage 'www\webos.js'), [IO.File]::ReadAllText((Join-Path $shell 'webos.js')).Replace('__IVF_VERSION__', $version), $utf8)

# 2) IvanaFin scripts in one file, each wrapped like the JavaScript Injector does (alphabetical)
$cat = [IO.File]::ReadAllText((Join-Path $root 'public\welcome-picture.b64')).Trim()
$sb = New-Object Text.StringBuilder
[void]$sb.Append([IO.File]::ReadAllText((Join-Path $root 'public\ivanafin-boot.js'))).Append("`n")
foreach ($f in Get-ChildItem $ScriptsDir -Filter *.js | Sort-Object Name) {
    $js = [IO.File]::ReadAllText($f.FullName).Replace('__IVF_CAT_B64__', $cat)
    [void]$sb.Append("/* IvanaFin - $($f.BaseName) */`n(function() { try {`n").Append($js)
    [void]$sb.Append("`n} catch (e) { console.error('IvanaFin script $($f.BaseName) failed:', e); } })();`n")
}
[IO.File]::WriteAllText((Join-Path $stage 'www\ivanafin.js'), $sb.ToString(), $utf8)

# 3) index.html: open CSP, NativeShell adapter before jellyfin-web, IvanaFin scripts after it,
#    IvanaFin welcome screen instead of Jellyfin's splash logo
$csp = '<meta http-equiv="Content-Security-Policy" content="default-src * ''self'' ''unsafe-inline'' ''unsafe-eval'' data: blob: gap: file: filesystem: ws: wss:;">'
$html = $html.Replace('</head>', "$csp</head>")
$m = [regex]::Match($html, '<script defer="defer" src="main\.jellyfin\.bundle\.js[^"]*"></script>')
if (-not $m.Success) { throw 'main.jellyfin.bundle.js script tag not found' }
$shim = '<script>window.appMode=''cordova'';</script><script src="webos.js"></script>'
$html = $html.Insert($m.Index + $m.Length, '<script defer="defer" src="ivanafin.js"></script>').Insert($m.Index, $shim)
$welcome = [IO.File]::ReadAllText((Join-Path $root 'welcome.html'))
if ($html -notmatch '<div class="splashLogo"></div>') { throw 'splashLogo element not found in index.html' }
$html = $html.Replace('<div class="splashLogo"></div>', $welcome)
[IO.File]::WriteAllBytes((Join-Path $stage 'www\ivf-welcome-cat.jpg'), [Convert]::FromBase64String($cat))
[IO.File]::WriteAllText((Join-Path $stage 'www\index.html'), $html, $utf8)

# 4) Package with LG's ares-package (-n: no minify, jellyfin-web is already minified)
$out = Join-Path $root 'out'
if (Test-Path $out) { Remove-Item $out -Recurse -Force }
& ares-package -n -o $out $stage
if ($LASTEXITCODE -ne 0) { throw "ares-package failed ($LASTEXITCODE)" }
$ipk = Join-Path $root 'IvanaFin.ipk'
Move-Item (Get-ChildItem $out -Filter *.ipk | Select-Object -First 1).FullName $ipk -Force
Remove-Item $out -Recurse -Force
"Built: $ipk" + ('  ({0:N1} MB, version {1})' -f ((Get-Item $ipk).Length / 1MB), $version)
