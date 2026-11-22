# IvanaFin for Jellyfin web - installer.
# Adds IvanaFin to your Jellyfin server's web pages through the JavaScript Injector plugin (installs that
# plugin too if needed). Your server then loads IvanaFin from GitHub, so it stays up to date by itself.
#
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Server http://192.168.1.10:8096
#   powershell -ExecutionPolicy Bypass -File install.ps1 -Server http://192.168.1.10:8096 -Uninstall
#
# You need an API key: Jellyfin Dashboard > API Keys > + (the script asks for it if you leave out -ApiKey).
# Works with Windows PowerShell 5.1 and PowerShell 7 (Windows, macOS, Linux: pwsh -File install.ps1 ...).
param(
    [Parameter(Mandatory)] [string]$Server,
    [string]$ApiKey,
    [switch]$Uninstall,
    [switch]$Restart,     # restart Jellyfin without asking when the plugin was just installed
    [string]$Source = 'https://cdn.jsdelivr.net/gh/CHAD2BAD/IvanaFin-TV@main/web/ivanafin.js'
)
$ErrorActionPreference = 'Stop'
$Server = $Server.TrimEnd('/')
if (-not $ApiKey) { $ApiKey = (Read-Host 'Jellyfin API key (Dashboard > API Keys)').Trim() }
$h = @{ Authorization = "MediaBrowser Token=`"$ApiKey`"" }
$InjectorId   = 'f5a34f7b2e8a4e6aa7223a216a81b374'
$InjectorName = 'JavaScript Injector'
$RepoUrl      = 'https://raw.githubusercontent.com/n00bcodr/jellyfin-plugins/main/manifest.json'
$ScriptName   = 'IvanaFin'

function Api($path, $method = 'Get', $body) {
    $p = @{ Uri = "$Server$path"; Method = $method; Headers = $h }
    if ($null -ne $body) { $p.ContentType = 'application/json; charset=utf-8'; $p.Body = [Text.Encoding]::UTF8.GetBytes((ConvertTo-Json -InputObject $body -Depth 8)) }
    try { Invoke-RestMethod @p | ForEach-Object { $_ } }   # (unrolls JSON lists in PowerShell 5.1)
    catch {
        $msg = $_.Exception.Message
        try { $msg += ' ' + (New-Object IO.StreamReader($_.Exception.Response.GetResponseStream())).ReadToEnd() } catch {}
        throw "$method $path failed: $msg"
    }
}

# 1) Server + key
try { $info = Api '/System/Info' } catch { throw "Can't reach $Server with that API key ($($_.Exception.Message))." }
"Jellyfin $($info.Version) at $Server ($($info.ServerName))"

# 2) JavaScript Injector plugin
function Injector { @(Api '/Plugins') | Where-Object { (($_.Id -replace '-', '') -eq $InjectorId) -or ($_.Name -eq $InjectorName) } | Select-Object -First 1 }
$plugin = Injector
if (-not $plugin -and $Uninstall) { 'JavaScript Injector is not installed - nothing to remove.'; return }
if (-not $plugin) {
    $repos = @(Api '/Repositories')
    if (-not ($repos | Where-Object { $_.Url -eq $RepoUrl })) {
        'Adding the plugin repository "n00bcodr Plugins" (JavaScript Injector, Jellyfin Enhanced)...'
        $repos += [pscustomobject]@{ Name = 'n00bcodr Plugins'; Url = $RepoUrl; Enabled = $true }
        Api '/Repositories' 'Post' $repos | Out-Null
    }
    'Installing the JavaScript Injector plugin...'
    Api ('/Packages/Installed/' + [Uri]::EscapeDataString($InjectorName) + '?repositoryUrl=' + [Uri]::EscapeDataString($RepoUrl)) 'Post' | Out-Null
    $ok = $false
    for ($i = 0; $i -lt 30 -and -not $ok; $i++) {
        Start-Sleep 2
        $ok = [bool](@(Api '/Plugins') | Where-Object { $_.Name -eq $InjectorName })
        if (-not $ok) { $ok = [bool]((Api '/System/Info').HasPendingRestart) }
    }
    if (-not $ok) { throw 'The plugin did not install. Install "JavaScript Injector" yourself under Dashboard > Plugins > Catalog, restart Jellyfin, then run this again.' }
    ''
    'JavaScript Injector is installed. Jellyfin has to restart once to load it.'
    if (-not $Restart) { $a = Read-Host 'Restart Jellyfin now? (y/n)' } else { $a = 'y' }
    if ($a -notmatch '^[yY]') { 'Restart Jellyfin yourself, then run this script again.'; return }
    try { Api '/System/Restart' 'Post' | Out-Null } catch {}
    'Waiting for Jellyfin to come back...'
    Start-Sleep 5
    for ($i = 0; $i -lt 60; $i++) {
        try { $plugin = Injector; if ($plugin) { break } } catch {}
        Start-Sleep 3
    }
    if (-not $plugin) { throw 'Jellyfin did not come back with the plugin loaded. (In Docker, start the container again if it stopped.) Then run this script again.' }
}

# 3) The IvanaFin script in the plugin: one small loader for the file on GitHub
$cfgPath = "/Plugins/$($plugin.Id)/Configuration"
$cfg = Api $cfgPath
$list = @($cfg.CustomJavaScripts | Where-Object { $_ -and $_.Name -ne $ScriptName })
if ($Uninstall) {
    $cfg.CustomJavaScripts = $list
    Api $cfgPath 'Post' $cfg | Out-Null
    'IvanaFin removed. Reload Jellyfin in the browser (Ctrl+F5).'
    return
}
$loader = @"
// IvanaFin for Jellyfin web - https://github.com/CHAD2BAD/IvanaFin-TV#jellyfin-web
(function () {
  if (window.IvfWebLoader) return; window.IvfWebLoader = true;
  var s = document.createElement('script');
  s.src = '$Source';
  s.onerror = function () { console.error('IvanaFin could not be loaded from ' + s.src); };
  (document.head || document.documentElement).appendChild(s);
})();
"@
$list += [pscustomobject]@{ Name = $ScriptName; Script = $loader; Enabled = $true; RequiresAuthentication = $false }
$cfg.CustomJavaScripts = $list
Api $cfgPath 'Post' $cfg | Out-Null
$check = @((Api $cfgPath).CustomJavaScripts | Where-Object { $_.Name -eq $ScriptName -and $_.Enabled })
if (-not $check) { throw 'Saving the script in JavaScript Injector failed.' }
''
'IvanaFin is installed.'
'Now open Jellyfin in your browser: Settings > Display > Display mode = Desktop (Legacy), save, and reload the page (Ctrl+F5).'
'(This is remembered per browser - do it once on every computer / browser.)'
'For Discover, see "Discover needs Seerr" in the README.'
