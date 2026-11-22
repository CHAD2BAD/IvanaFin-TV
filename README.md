# IvanaFin for Samsung and Jellyfin web

<p align="center"><img src="cat.jpg" width="240" alt="Ivana"><br><sub>Ivana thanks you for downloading</sub></p>

IvanaFin is a [Jellyfin](https://jellyfin.org) app for Samsung smart TVs (Tizen), with its own look:
a big-tile home screen, full-screen film and show pages, a music library in the style of a TV music app,
and extras for Star Wars films and shows. It is the Samsung version of
[IvanaFin for Android TV / Fire TV](https://github.com/CHAD2BAD/IvanaFin-Android); LG TVs have
[IvanaFin for LG](https://github.com/CHAD2BAD/IvanaFin-webOS). The same look is also
available for Jellyfin in a browser: see [Jellyfin web](#jellyfin-web).

The Samsung app works with **any Jellyfin server**. Nothing needs to be installed on the server: the IvanaFin
look is built into the app.

> **Status:** early. The same scripts run on the author's Samsung S90D (Tizen 9); this any-server build is new.

## What you get

<p align="center"><img src="home.jpg" width="720" alt="IvanaFin home screen with four big tiles: Movies, TV, Songs and Other"><br><sub>The home screen on a Samsung TV</sub></p>

- **Home:** big tiles for your libraries. The first time, IvanaFin shows your biggest Movies, Shows and
  Music library, plus a library named **Other** if you have one. To choose the tiles yourself, open Jellyfin's
  **Settings > Home**: the library order and the *Display in My Media* ticks decide which tiles appear
  and in which order. This is saved on your server, so it is the same on every TV.
- **Film and show pages** in full screen, with cast, chapters (Scenes) and More Like This.
- **Music:** artist pages with Popular songs and Albums / EPs & Singles / Mixtapes rows. These come from
  [Deezer](https://www.deezer.com): the artist's name is sent to Deezer's free public API when the page opens.
- **Star Wars extras** for the official films and shows (matched by their TMDB id): Featured Planets,
  Characters and Starships rows with a card for each, the in-universe year, the opening crawl and
  "In Story Order". A library that is mostly Star Wars gets a timeline sort button.
- **Discover** (browse and request films and shows) - **needs Seerr set up first** (see below).

## Discover needs Seerr

<p align="center"><img src="discover.jpg" width="720" alt="IvanaFin Discover page: a featured film at the top and a Trending row of posters"><br><sub>Discover on a Samsung TV</sub></p>

Everything else works with a plain Jellyfin server, but **Discover only appears if your server has
[Seerr](https://github.com/seerr-team/seerr) set up**. Without it, the Discover tile and button are hidden.
To turn it on:

1. Set up the download side first. All of these are needed - Discover depends on them working together:
   - [Radarr](https://github.com/Radarr/Radarr) (films) and [Sonarr](https://github.com/Sonarr/Sonarr) (shows),
     with a download client (for example qBittorrent).
   - [Prowlarr](https://github.com/Prowlarr/Prowlarr), connected to Radarr and Sonarr: it gives them the
     indexers to search. Without it, requests are accepted but nothing is ever found.
   - [Cleanuparr](https://github.com/Cleanuparr/Cleanuparr), connected to Radarr and Sonarr: it removes
     stuck or stalled downloads and searches again. Without it, a request can sit at "Downloading" forever.

   Also recommended:
   - [FlareSolverr](https://github.com/FlareSolverr/FlareSolverr), added to Prowlarr: lets Prowlarr use
     indexers that sit behind Cloudflare's "checking your browser" page. Without it, those indexers fail.
   - [Recyclarr](https://github.com/recyclarr/recyclarr): keeps Radarr's and Sonarr's quality profiles in
     line with the [TRaSH Guides](https://trash-guides.info), so requests download in a sensible quality and size.
   - [Bazarr](https://github.com/morpheus65535/bazarr), connected to Radarr and Sonarr: downloads subtitles
     for what they bring in.
2. Install and set up [Seerr](https://github.com/seerr-team/seerr), connected to your Jellyfin server and to
   Radarr / Sonarr. In Seerr's settings:
   - **Users:** import your Jellyfin users (*Users > Import Jellyfin Users*). Every person who should
     request needs a Seerr user with the **Request** permission - without it Discover still opens, but
     requests are refused. Give **Auto-Approve** too if requests should download straight away instead of
     waiting for you to approve them.
   - **Services:** pick the default Radarr and Sonarr server, with a root folder and quality profile that
     really exist there (a wrong root folder makes every request fail).
3. Install the [Jellyfin Enhanced](https://github.com/n00bcodr/Jellyfin-Enhanced) plugin on your
   Jellyfin server and enter your Seerr address and API key in its settings (Samsung and web use it).
4. **Cancel button (recommended):** run the small [IvanaFin Seerr helper](seerr-helper) with Docker
   on the same machine as Jellyfin. It gives Discover a real **Cancel**: the request is removed in Seerr
   *and* the download is stopped in Radarr / Sonarr. Without it, the Cancel button isn't shown. (On Jellyfin
   web it only works when Jellyfin is opened over `http`, on your home network.)
5. Restart IvanaFin on the TV, or reload Jellyfin web.

## Install

Samsung only installs apps from its store, so this is installed in developer mode with
[Apps2Samsung](https://github.com/Apps2Samsung/Apps2Samsung) (Windows), which signs the
app for your TV:

1. Download `IvanaFin.wgt` from [Releases](../../releases).
2. Put the TV in developer mode: open **Apps**, press **1 2 3 4 5** on the remote, switch
   **Developer mode** on and enter your computer's IP address, then restart the TV.
3. Run Apps2Samsung on the computer, pick your TV and choose **Install a file...** with `IvanaFin.wgt`.
4. Open IvanaFin on the TV and sign in to your Jellyfin server.

IvanaFin installs next to the official Jellyfin app (it has its own app id). To update it, install a newer
`IvanaFin.wgt` the same way.

## Jellyfin web

The same IvanaFin look for Jellyfin in a **browser**, on your own server. It is added once, through the
[JavaScript Injector](https://github.com/n00bcodr/Jellyfin-JavaScript-Injector) plugin; your server then loads
IvanaFin from this repository, so it stays up to date by itself. It changes Jellyfin web for **everyone** who
uses your server in a browser, and brings the ElegantFin theme with IvanaFin's colours - if you already use a
theme in *Dashboard > General > Custom CSS*, remove it. Tested with Jellyfin 12.4.

> **Important:** IvanaFin web needs the **Desktop (Legacy)** display mode. After installing, each person opens
> Jellyfin in their browser, goes to **Settings > Display**, sets **Display mode** to **Desktop (Legacy)**, saves and
> reloads the page. This is remembered per browser, so do it once on every computer / browser.

**With the installer** (Windows, macOS, Linux)

1. In Jellyfin: **Dashboard > API Keys > +**, name it "IvanaFin", and copy the key.
2. Download [web/install.ps1](web/install.ps1) (*Download raw file* button) and run it with your server's address:

   ```
   powershell -ExecutionPolicy Bypass -File install.ps1 -Server http://<your-server>:8096
   ```

   On macOS / Linux use [PowerShell](https://learn.microsoft.com/powershell/scripting/install/installing-powershell):
   `pwsh -File install.ps1 -Server http://<your-server>:8096`

   It asks for the API key. If the JavaScript Injector plugin isn't there yet, it installs it and asks
   to restart Jellyfin once (in Docker, start the container again if it stops instead of restarting).
3. Open Jellyfin in your browser, set **Settings > Display > Display mode** to **Desktop (Legacy)**, and reload the
   page (**Ctrl+F5**).

**By hand**

1. **Dashboard > Plugins > Repositories** (or *Catalog* > the settings icon): add a repository named
   `n00bcodr Plugins` with the URL
   `https://raw.githubusercontent.com/n00bcodr/jellyfin-plugins/main/manifest.json`
2. **Dashboard > Plugins > Catalog**: install **JavaScript Injector**, then restart Jellyfin.
3. **Dashboard > Plugins > JavaScript Injector**: add a script named `IvanaFin`, paste this, make sure it is
   enabled, and save:

   ```js
   // IvanaFin for Jellyfin web - https://github.com/CHAD2BAD/IvanaFin-Samsung#jellyfin-web
   (function () {
     if (window.IvfWebLoader) return; window.IvfWebLoader = true;
     var s = document.createElement('script');
     s.src = 'https://cdn.jsdelivr.net/gh/CHAD2BAD/IvanaFin-Samsung@main/web/ivanafin.js';
     s.onerror = function () { console.error('IvanaFin could not be loaded from ' + s.src); };
     (document.head || document.documentElement).appendChild(s);
   })();
   ```
4. In Jellyfin, set **Settings > Display > Display mode** to **Desktop (Legacy)**, then reload the page (**Ctrl+F5**).

Updates arrive by themselves within about 12 hours of a new version here (that's how long the
[jsDelivr](https://www.jsdelivr.com) copy is kept).

**To remove it:** run the installer again with `-Uninstall` at the end, or delete the `IvanaFin` script under
**Dashboard > Plugins > JavaScript Injector**, then reload the page.

## Build it yourself

Windows PowerShell, with a Jellyfin server's web client on the same computer:

```
powershell -File build.ps1 [-WebDir <folder of jellyfin-web>]
```

This writes `IvanaFin.wgt` (unsigned). `-WebDir` defaults to `C:\Program Files\Jellyfin\Server\jellyfin-web`.
Use the web client of the same Jellyfin version as your server.

The web version: `powershell -File web\build.ps1` joins `scripts\` and `web\boot.js` into `web\ivanafin.js`,
the file Jellyfin web loads.

## Credits and licences

- **Jellyfin** web client (inside the `.wgt`) - GPL-2.0. The Tizen shell (`tizen.js`, `config.xml`) follows
  [jellyfin-tizen](https://github.com/jellyfin/jellyfin-tizen) - MPL-2.0.
- **ElegantFin** theme by lscambo13 (loaded from its CDN) - see its own licence.
- **JavaScript Injector** and **Jellyfin Enhanced** plugins by n00bcodr.
- **Star Wars facts** shown in the Planets / Characters / Starships rows are summarised from
  [Wookieepedia](https://starwars.fandom.com) (text under CC BY-SA 3.0). The pictures are copies from
  Wookieepedia kept in the [IvanaFin repo](https://github.com/CHAD2BAD/IvanaFin-Android/tree/main/extras/star-wars);
  they belong to their owners. Star Wars is a trademark of Lucasfilm Ltd. This project is not affiliated
  with Lucasfilm or Disney.
- **Deezer** data is used for artist pages through Deezer's public API; IvanaFin is not affiliated with Deezer.

This repository is under the **Mozilla Public License 2.0** (see [LICENSE](LICENSE)).
