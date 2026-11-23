// IvanaFin (Samsung app AND Jellyfin web): Home mirrors the Android IvanaFin home (IvanaFinLibraryHome + HomeTopButton):
//   centred [Search] [Discover] [Settings] pills (web: a Discover button in the middle of the top bar) over a grid of big tiles:
//   the libraries chosen in Jellyfin's Settings > Home (+ Games when switched on) - random picture, 35% darkening, big centred name, 4dp
//   corners, white 1.5dp outline when selected, no grow). No web header (logo, tabs, icons, clock) and no
//   Continue Watching row.
// Web extras: mouse hover = selection; in Discover, Esc/Backspace or the header Home tab return to this Home.
(function () {
  'use strict';
  // Shared (each IvanaFin script carries this; the first one to load installs it): Jellyfin moves
  // FORWARD with history.pushState, which fires no hashchange - scripts that wait for hashchange or
  // viewshow only react after the new page has been drawn (the stock tabs/header flash). 'ivf-nav'
  // fires the moment the address changes, forward or Back.
  if (!window.__ivfNavHook) {
    window.__ivfNavHook = true;
    ['pushState', 'replaceState'].forEach(function (fn) {
      var orig = history[fn];
      history[fn] = function () {
        var r = orig.apply(this, arguments);
        try { window.dispatchEvent(new Event('ivf-nav')); } catch (e) {}
        return r;
      };
    });
    window.addEventListener('popstate', function () { try { window.dispatchEvent(new Event('ivf-nav')); } catch (e) {} });
  }
  // Samsung app = no web header, our own Search/Settings pills. Jellyfin web in a browser keeps the full
  // header (menu, search, cast, user menu, Home/Discover tabs) and the grid sits just below it.
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);

  var STYLE_ID = 'ivf-shome-style';
  var LAST_KEY = 'ivf-shome-last';     // index of the last opened tile (sessionStorage)
  var root = null;                      // our Home overlay
  var mode = 'home';                    // 'home' | 'discover'
  // Every change of mode goes through here: while Discover shows, <html> gets .ivf-discover (no library
  // backdrop behind it), and the tab remembers Discover is open so a page refresh reopens it.
  var DISCOVER_OPEN_KEY = 'ivf-discover-open';
  function setMode(m) {
    mode = m;
    if (m !== 'discover' && window.IvfDiscover) window.IvfDiscover.hide(); // discover-page.js
    document.documentElement.classList.toggle('ivf-discover', m === 'discover');
    try { if (m === 'discover') sessionStorage.setItem(DISCOVER_OPEN_KEY, '1'); else sessionStorage.removeItem(DISCOVER_OPEN_KEY); } catch (x) {}
    syncDiscoverBack();
  }
  var built = '';                       // signature of the libraries we drew
  var COLS = 3;                         // like Android: up to 4 tiles 2 across, more 3 across (set in build)

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var d = 'var(--ivf-dp)';
    // All clients: Android's font (Roboto) everywhere, like the Fire TV app
    if (!document.getElementById('ivf-roboto')) {
      var f = document.createElement('link');
      f.id = 'ivf-roboto'; f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap';
      document.head.appendChild(f);
    }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      ':root{--ivf-dp:calc(100vw / 960)}@media (max-width:760px) and (orientation:portrait){:root{--ivf-dp:calc(100vw / 280)}}@media (max-height:500px) and (orientation:landscape){:root{--ivf-dp:calc(100vw / 640)}}',
      'html,html *:not(.material-icons):not([class*="material-icons"]):not(.md-icon):not(i){font-family:Roboto,"Noto Sans",sans-serif !important}',
      // While our Home is up the web's header is hidden (no logo, tabs, icons or clock)
      TV ? 'html.ivf-shome-on .skinHeader{display:none !important}' : '',
      // Samsung: no header (back / home / icons / clock) on title pages either - Android has none
      TV ? 'html.ivf-detail-on .skinHeader{display:none !important}' : '',
      // title pages (film / show): our page is up long before Jellyfin finishes its own hidden one
      // underneath - its loading circle would sit on top of ours
      'html.ivf-detail-on .docspinner{display:none !important}',
      // TV: no scrollbars anywhere (a thin white bar showed down the right edge of title pages; the
      // remote doesn't use them). Web keeps them for the mouse.
      TV ? '*{scrollbar-width:none !important}*::-webkit-scrollbar{display:none !important;width:0 !important;height:0 !important}' : '',
      // TV video player: no Jellyfin Enhanced extras (user request 2026-11-12) - its star/tomato
      // ratings beside "Ends at", its settings button and its "Bookmark current time" button (web
      // features that can't be used with the remote). Web keeps them.
      TV ? '#enhancedSettingsBtn,#jeBookmarkBtn{display:none !important}' : '',
      // Video player: no star / tomato ratings beside "Ends at" on ANY client (user 2026-11-14 - it was TV only)
      '#je-osd-rating-container,#je-playback-rating-badge,.je-playback-rating-badge{display:none !important}',
      // Web: the header is see-through, so hide the web's own Home under it and don't let the page
      // scroll (its cards stay in the page - the tiles read their names/pictures from them)
      // Web: grid straight under the header, equal side margins, matching gap at the bottom
      TV ? '' : 'html #ivf-shome{padding:0 calc(' + d + ' * 38) calc(' + d + ' * 22)}' +
        // small top gap so the selected tile's outline (drawn just outside it) isn't under the header
        // (same gap above the grid as below it: the tiles sit in the middle of the space under the bar)
        'html #ivf-shome .ivf-sh-grid{padding-top:calc(' + d + ' * 22);padding-bottom:0}' +
        // Discover: a pill in the middle of Jellyfin's top bar, level with its icons, only while Home shows
        '.ivf-hdr-dsc{position:absolute;left:50%;top:var(--ivf-hdr-mid,38px);transform:translate(-50%,-50%);z-index:2;display:inline-flex;align-items:center;gap:8px;height:44px;' +
        'padding:0 22px 0 16px;border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#d1d5db;font:inherit;font-size:17px;font-weight:500;line-height:1;cursor:pointer;outline:none}' +
        '.ivf-hdr-dsc:hover,.ivf-hdr-dsc:focus-visible{background:#d1d5db;color:#131414}' +
        '.ivf-hdr-dsc .material-icons{font-size:24px;color:inherit}' +
        'html:not(.ivf-shome-on) .ivf-hdr-dsc{display:none}',
      // Web: the header's frosted-glass blur smeared the selected tile's white outline into a glow
      // above it - on Home the header is plain black instead
      TV ? '' : 'html.ivf-shome-on .skinHeader{background:#000 !important;backdrop-filter:none !important}' +
        'html.ivf-shome-on .skinHeader::after,html.ivf-shome-on .skinHeader::before{display:none !important}',
      TV ? '' : 'html.ivf-shome-on #indexPage{visibility:hidden !important}' +
        'html.ivf-shome-on,html.ivf-shome-on body{overflow:hidden !important}',
      '#ivf-shome{position:fixed;inset:0;z-index:900;background:#000;display:flex;flex-direction:column;',
      'padding:0 calc(' + d + ' * 32) calc(' + d + ' * 32);box-sizing:border-box}', // Android: 32dp sides + bottom
      '#ivf-shome.ivf-hidden{display:none}',
      // Discover: plain black behind it, not a blurred library backdrop
      'html.ivf-discover .backdropContainer{display:none !important}',
      'html.ivf-discover .backgroundContainer{background:#000 !important}',
      // web: Discover gets the header's Back arrow like a library page (Jellyfin hides it on Home)
      TV ? '' : 'html.ivf-discover .skinHeader .headerBackButton{display:inline-flex !important}',
      // Reopening Discover after a refresh: keep the web's own Home out of sight (black) until
      // Discover is really showing - otherwise it flashes up while Enhanced adds its tab
      'html.ivf-discover-wait #indexPage{visibility:hidden !important}',
      // Samsung: no blur effects anywhere (frosted glass is very slow on the TV). The pause screen's
      // 50px blur becomes a plain dark tint; other blurred panels already have dark backgrounds.
      TV ? 'html *:not(#ivf-x),html *:not(#ivf-x)::before,html *:not(#ivf-x)::after{backdrop-filter:none !important;-webkit-backdrop-filter:none !important}' +
        '#pause-screen-content{background-color:rgba(0,0,0,.6) !important}' : '',
      // TV: no Jellyfin header over Discover (its buttons took the remote's selection); like our Home
      TV ? 'html.ivf-discover .skinHeader{display:none !important}' +
        'html.ivf-discover #indexPage{padding-top:20px !important}' : '', // and no space kept for it
      '.ivf-sh-bar{display:flex;justify-content:center;gap:calc(' + d + ' * 12);padding-top:calc(' + d + ' * 8)}',
      // androidx.tv Button with 14x6dp padding, 20dp icon, labelLarge text
      '.ivf-sh-btn{display:inline-flex;align-items:center;min-height:calc(' + d + ' * 40);box-sizing:border-box;gap:calc(' + d + ' * 6);padding:calc(' + d + ' * 6) calc(' + d + ' * 14);border:0;border-radius:999px;',
      'background:rgba(14,14,14,.9);color:#d1d5db;font:inherit;font-size:calc(' + d + ' * 14);font-weight:500;line-height:calc(' + d + ' * 20);',
      'letter-spacing:calc(' + d + ' * 0.1);cursor:pointer;outline:none}',
      '.ivf-sh-btn:focus,.ivf-sh-btn:hover{background:#d1d5db;color:#131414}',
      '.ivf-sh-btn .material-icons{font-size:calc(' + d + ' * 20);color:inherit}',
      '.ivf-sh-grid{flex:1;display:grid;grid-template-columns:repeat(' + COLS + ',1fr);grid-auto-rows:1fr;gap:calc(' + d + ' * 16);',
      'padding-top:calc(' + d + ' * 8);padding-bottom:0;min-height:0}',
      '.ivf-sh-tile{position:relative;border:0;padding:0;border-radius:calc(' + d + ' * 4);overflow:hidden;background:#000;cursor:pointer;outline:none;',
      'box-shadow:0 0 0 calc(' + d + ' * 1.5) transparent;transition:box-shadow .12s}',
      // TV: the remote's selection. Web: the tile under the mouse (or chosen with the arrow keys) only
      (TV ? '.ivf-sh-tile:focus,.ivf-sh-tile:hover' : '.ivf-sh-tile:focus-visible,.ivf-sh-tile:hover') +
        '{box-shadow:0 0 0 calc(' + d + ' * 1.5) #fff}',
      '.ivf-sh-img{position:absolute;inset:0;background:center/cover no-repeat;opacity:0}',
      '.ivf-sh-img.ivf-on{opacity:1}',
      '.ivf-sh-shade{position:absolute;inset:0;background:rgba(0,0,0,.35)}',
      '.ivf-sh-name{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;',
      'padding:0 calc(' + d + ' * 24);color:#fff;font-weight:700;line-height:1.15;text-shadow:0 calc(' + d + ' * 1) calc(' + d + ' * 3) rgba(0,0,0,.85),0 0 calc(' + d + ' * 16) rgba(0,0,0,.7)}' /* round 5: pale tile pictures */,
      // Phone (2026-11-22): tile names sized for the phone, not the TV (the inline size was cut off)
      '@media (max-width:760px) and (orientation:portrait){.ivf-sh-name{font-size:22px !important;padding:0 6px}#ivf-shome .ivf-sh-grid{grid-template-columns:repeat(2,1fr) !important}}',
      '@media (max-height:500px) and (orientation:landscape){.ivf-sh-name{font-size:24px !important}}'
    ].join('');
    document.head.appendChild(s);
  }

  function onHomeRoute() {
    var h = location.hash || '';
    return h === '' || h === '#' || h === '#/' || /^#\/home(\.html)?(\?|$)/.test(h);
  }

  // The web's own (hidden) library cards: order, names, and the random backdrop the tile script picked
  function webLibraryCards() {
    var home = document.querySelector('.homeSectionsContainer');
    if (!home) return [];
    return Array.prototype.filter.call(home.querySelectorAll('.card[data-id]'), function (c) {
      var t = c.getAttribute('data-type');
      return t === 'CollectionFolder' || t === 'UserView' || t === 'Folder';
    });
  }
  function cardName(c) {
    var el = c.querySelector('.ivf-tile-name span, .cardText-first, .cardText');
    return (el && el.textContent.trim()) || '';
  }
  function cardBackdrop(c) {
    var img = c.querySelector('.ivf-tile-img.ivf-on');
    var m = img && /url\(["']?([^"')]+)["']?\)/.exec(img.style.backgroundImage || '');
    return m ? m[1] : '';
  }

  // Coming back to Home: show the picture preloaded last time, preload another
  // Games tile: Steam "library hero" art (1920x620, art centred) of the Steam games in the PC's
  // ES-DE menu, a different one each visit. Same list as Android IvanaFinLibraryHome.kt GamesArt.
  // Each checked as a centre crop on 2026-11-11: CS2 + Halo MCC use portrait art (their heroes
  // crop to empty background); Mini Motorways + Stardew Valley left out.
  var GAMES_ART = ['1808500/library_hero.jpg', '2379780/library_hero.jpg', '1086940/library_hero.jpg',
    '2807960/library_hero.jpg', '1478500/library_hero.jpg', '311210/library_hero.jpg',
    '730/library_600x900_2x.jpg', '435150/library_hero.jpg', '2483190/library_hero.jpg',
    '553850/library_hero.jpg', '976730/library_600x900_2x.jpg', '686810/library_hero.jpg',
    '274170/library_hero.jpg', '219150/library_hero.jpg', '594650/library_hero.jpg',
    '1538550/library_hero.jpg', '3405340/library_hero.jpg', '1118520/library_hero.jpg',
    '1144200/library_hero.jpg', '252950/library_hero.jpg', '2075800/library_hero.jpg',
    '2001120/library_hero.jpg', '393380/library_hero.jpg', '489830/library_hero.jpg'];
  function randomGames(not) {
    var u;
    do { u = 'https://cdn.cloudflare.steamstatic.com/steam/apps/' + GAMES_ART[Math.floor(Math.random() * GAMES_ART.length)]; } while (u === not);
    return u;
  }
  var gamesUrl = randomGames('');       // shown now
  var gamesNext = '';                   // preloaded for the next visit
  function nextGamesPicture() {
    if (gamesNext) { gamesUrl = gamesNext; gamesNext = ''; }
    var u = randomGames(gamesUrl);
    var img = new Image();
    img.onload = function () { gamesNext = u; };
    img.src = u;
  }

  // Games tile press. Samsung: open the Moonlight app (OneLiberty moonlight-chrome-tizen, app id
  // MoonLightS.MoonlightWasm; needs the application.launch privilege, IvanaFin Tizen 1.0.3+), where
  // the PC's "IvanaFin Games" app is picked. Web: nothing to open - games stream to the TVs only.
  var MOONLIGHT_TIZEN = 'MoonLightS.MoonlightWasm';
  function gamesMessage(text) {
    var m = document.createElement('div');
    m.textContent = text;
    m.style.cssText = 'position:fixed;left:50%;bottom:6%;transform:translateX(-50%);z-index:99999;' +
      'background:rgba(20,20,20,.95);color:#fff;padding:.8em 1.6em;border-radius:999px;white-space:nowrap;font:500 calc(var(--ivf-dp,1px) * 18) Roboto,sans-serif';
    document.documentElement.appendChild(m);
    setTimeout(function () { m.remove(); }, 4000);
  }
  function openGames() {
    // LG webOS: Moonlight TV (mariotaku/moonlight-tv, app id com.limelight.webos) via the app's launcher
    if (window.PalmSystem && window.IvfLaunchApp) {
      window.IvfLaunchApp('com.limelight.webos', function () { gamesMessage('Games needs the Moonlight app on this TV'); });
      return;
    }
    if (typeof tizen === 'undefined' || !tizen.application) {
      gamesMessage('Games play on the TVs - open Games on the Fire TV or Samsung');
      return;
    }
    // Opened as an app-control request, Moonlight (launch_mode "caller") runs as IvanaFin's sub-app,
    // so closing it returns to IvanaFin instead of the TV's home screen. Plain launch() as a fallback.
    function plainLaunch() {
      try {
        tizen.application.launch(MOONLIGHT_TIZEN, function () {}, function () {
          gamesMessage('Games needs the Moonlight app on this TV');
        });
      } catch (err) {
        gamesMessage('Games needs the Moonlight app on this TV');
      }
    }
    try {
      var ctl = new tizen.ApplicationControl('http://tizen.org/appcontrol/operation/default', null, null, null, null);
      tizen.application.launchAppControl(ctl, MOONLIGHT_TIZEN, function () {}, plainLaunch,
        { onsuccess: function () {}, onfailure: function () {} });
    } catch (err) {
      plainLaunch();
    }
  }

  // Tile names never split a word ("Discove / r"): shrink a name until its widest word fits.
  // All sizes are reset, then all measured, then all set (text width grows with the font size, so one
  // measurement gives the scale): two layouts in all, not one per shrinking step per tile (slow on the TV)
  function fitNames() {
    if (!root) return;
    var names = Array.prototype.slice.call(root.querySelectorAll('.ivf-sh-name'));
    var bases = names.map(function (n) {
      var base = n.getAttribute('data-size');
      if (!base) { base = n.style.fontSize; n.setAttribute('data-size', base); }
      n.style.fontSize = base;
      return base;
    });
    var scales = names.map(function (n) {
      if (!n.clientWidth || n.scrollWidth <= n.clientWidth + 1) return 1; // fits (or hidden: done when shown)
      return Math.max(0.4, n.clientWidth / n.scrollWidth * 0.98);
    });
    names.forEach(function (n, i) {
      if (scales[i] < 1) n.style.fontSize = 'calc(' + bases[i] + ' * ' + scales[i].toFixed(3) + ')';
    });
  }
  window.addEventListener('resize', function () { fitNames(); });
  // (at the next frame: measured once the page has settled, not in the middle of building it, which
  // forced the browser to lay out the whole page an extra time during app start)
  var fitQueued = false;
  function fitNamesSoon() {
    if (fitQueued) return;
    fitQueued = true;
    requestAnimationFrame(function () { fitQueued = false; fitNames(); });
  }


  function setTilePicture(t, url) {
    var img = t.querySelector('.ivf-sh-img');
    if (!url || img.getAttribute('data-url') === url) return;
    img.setAttribute('data-url', url);
    img.style.backgroundImage = 'url("' + url + '")';
    // shown at once, no fade: the pictures are downloaded ahead, so they appear straight away; one
    // still downloading simply appears when it arrives (the browser doesn't always report a
    // downloaded picture as ready at once, which left tiles black for a moment)
    img.classList.add('ivf-on');
  }

  // Which tiles, in which order - works on any server, no library names in the code (2026-11-19):
  // - The web's own library cards already follow Jellyfin's Settings > Home: library order (OrderedViews)
  //   and the "Display in My Media" ticks (MyMediaExcludes). Saved on the server per user, so the web and
  //   the Samsung always match. Once a user has changed either, the tiles follow them.
  // - Never changed (a new friend): like Android's first sign-in - the biggest Movies, Shows and Music
  //   library, plus a mixed library named "Other".
  // - Playlists (a library Jellyfin adds once anyone makes a playlist) is never a tile.
  // - Games: only when the user's display preferences say so (CustomPrefs ivfGames = "1").
  var homeCfg = null, homeCfgFor = '', homeCfgBusy = false;
  function homeCfgKey() { return (ApiClient.serverId ? ApiClient.serverId() : '') + '|' + ApiClient.getCurrentUserId(); }
  function defaultPicks(views, userId) {
    function biggest(type) {
      var c = views.filter(function (v) { return (v.CollectionType || '') === type; });
      if (c.length <= 1) return Promise.resolve(c[0] ? c[0].Id : null);
      return Promise.all(c.map(function (v) {
        return ApiClient.getItems(userId, { ParentId: v.Id, Recursive: true, Limit: 0, EnableTotalRecordCount: true })
          .then(function (r) { return (r && r.TotalRecordCount) || 0; }, function () { return 0; });
      })).then(function (n) {
        var best = 0;
        n.forEach(function (x, i) { if (x > n[best]) best = i; });
        return c[best].Id;
      });
    }
    var other = views.filter(function (v) { return !v.CollectionType && (v.Name || '').trim().toLowerCase() === 'other'; })[0];
    return Promise.all([biggest('movies'), biggest('tvshows'), biggest('music')]).then(function (ids) {
      return ids.concat([other ? other.Id : null]).filter(Boolean);
    });
  }
  function loadHomeCfg() {
    var key = homeCfgKey();
    if (homeCfg && homeCfgFor === key) return homeCfg;
    if (homeCfgBusy) return null;
    homeCfgBusy = true;
    var userId = ApiClient.getCurrentUserId();
    Promise.all([
      ApiClient.getCurrentUser(),
      ApiClient.getUserViews({}, userId),
      ApiClient.getDisplayPreferences('usersettings', userId, 'emby').then(null, function () { return null; })
    ]).then(function (r) {
      var conf = (r[0] && r[0].Configuration) || {};
      var views = (r[1] && r[1].Items) || [];
      var types = {};
      views.forEach(function (v) { types[v.Id] = v.CollectionType || ''; });
      var changed = (conf.OrderedViews || []).length > 0 || (conf.MyMediaExcludes || []).length > 0;
      var games = !!(r[2] && r[2].CustomPrefs && r[2].CustomPrefs.ivfGames === '1');
      return (changed ? Promise.resolve(null) : defaultPicks(views, userId)).then(function (picks) {
        homeCfg = { types: types, picks: picks, games: games };
        homeCfgFor = key;
      });
    }).then(function () { homeCfgBusy = false; update(); }, function (err) {
      homeCfgBusy = false;
      console.warn('IvanaFin home: settings not read', err);
    });
    return null;
  }
  function homeOrder(cards, cfg) {
    var list = cards.map(function (c, i) { return { name: cardName(c), ci: i, id: c.getAttribute('data-id') }; })
      .filter(function (e) { return cfg.types[e.id] !== 'playlists'; });
    if (cfg.picks) list = cfg.picks.map(function (id) { return list.filter(function (e) { return e.id === id; })[0]; }).filter(Boolean);
    if (cfg.games) list.push({ name: 'Games', act: 'games' });
    // Phone (2026-11-22, user): no Music or Games tile - not needed on the phone
    if (isPhone()) list = list.filter(function (e) { return e.act !== 'games' && cfg.types[e.id] !== 'music'; });
    return list;
  }
  // the phone app / a phone browser, either way up (the same test as the phone sizes in every script)
  function isPhone() {
    try { return !TV && window.matchMedia('(max-width:760px) and (orientation:portrait), (max-height:500px) and (orientation:landscape)').matches; } catch (e) { return false; }
  }
  // Discover needs Jellyfin Enhanced (+ Seerr) on the server
  function hasDiscover() { return !!window.JellyfinEnhanced; }

  function build() {
    var cards = webLibraryCards();
    if (!cards.length) return false;
    var cfg = loadHomeCfg();
    if (!cfg) return false;
    var dsc = hasDiscover();
    // (no Discover tile any more: its trending pictures aren't fetched)
    var sig = cards.map(function (c) { return c.getAttribute('data-id') + ':' + cardName(c); }).join(',') +
      '|' + (cfg.picks || []).join(',') + (cfg.games ? '|games' : '') + (dsc ? '|dsc' : '') + (isPhone() ? '|phone' : '');
    if (!root) {
      addStyle();
      root = document.createElement('div');
      root.id = 'ivf-shome';
      root.className = 'ivf-hidden';
      document.documentElement.appendChild(root); // outside <body>, which the app rebuilds
      root.addEventListener('click', onClick);
    }
    if (sig !== built) {
      built = sig;
      var order = homeOrder(cards, cfg);
      COLS = order.length <= 1 ? 1 : order.length <= 4 ? 2 : 3;
      root.innerHTML =
        (TV
          ? '<div class="ivf-sh-bar">' +
            '<button type="button" class="ivf-sh-btn" data-act="search"><span class="material-icons search" aria-hidden="true"></span><span>Search</span></button>' +
            (dsc ? '<button type="button" class="ivf-sh-btn" data-act="discover"><span class="material-icons explore" aria-hidden="true"></span><span>Discover</span></button>' : '') +
            '<button type="button" class="ivf-sh-btn" data-act="settings"><span class="material-icons settings" aria-hidden="true"></span><span>Settings</span></button>' +
            '</div>'
          : '') + // web: a small Discover button sits in Jellyfin's top bar instead (syncHeaderDiscover)
        '<div class="ivf-sh-grid" style="grid-template-columns:repeat(' + COLS + ',1fr)">' +
        order.map(function (e, i) {
          // Discover (Seerr - Jellyfin Enhanced's Discover page may still be loading at this point) and
          // Games (random Steam art) are our own tiles; the others are the libraries
          if (e.act) {
            return '<button type="button" class="ivf-sh-tile" data-idx="' + i + '" data-act="' + e.act + '">' +
              '<div class="ivf-sh-img"></div><div class="ivf-sh-shade"></div>' +
              '<div class="ivf-sh-name" style="font-size:calc(var(--ivf-dp) * 45)">' + e.name + '</div></button>';
          }
          var size = e.name.length > 14 ? 36 : 45; // displaySmall / displayMedium
          return '<button type="button" class="ivf-sh-tile" data-idx="' + i + '" data-card="' + e.ci + '" data-id="' + cards[e.ci].getAttribute('data-id') + '">' +
            '<div class="ivf-sh-img"></div><div class="ivf-sh-shade"></div>' +
            '<div class="ivf-sh-name" style="font-size:calc(var(--ivf-dp) * ' + size + ')"></div></button>';
        }).join('') +
        '</div>';
      root.querySelectorAll('.ivf-sh-tile[data-card]').forEach(function (t) { t.querySelector('.ivf-sh-name').textContent = cardName(cards[+t.getAttribute('data-card')]); });
    }
    // Pictures: the same random backdrops the web tiles picked (they change every visit)
    root.querySelectorAll('.ivf-sh-tile[data-card]').forEach(function (t) {
      var c = cards[+t.getAttribute('data-card')];
      setTilePicture(t, c && cardBackdrop(c));
    });
    var games = root.querySelector('.ivf-sh-tile[data-act="games"]');
    if (games) setTilePicture(games, gamesUrl);
    fitNamesSoon();
    return true;
  }

  var kbUser = false; // web: the last thing used was the keyboard (not the mouse)
  if (!TV) {
    window.addEventListener('keydown', function (e) { if (/^(Tab|Arrow|Enter|Escape|Page)/.test(e.key || '')) kbUser = true; }, true);
    window.addEventListener('pointerdown', function () { kbUser = false; }, true);
  }
  function focusStart() {
    var last = -1;
    try { last = parseInt(sessionStorage.getItem(LAST_KEY) || '-1', 10); } catch (e) {}
    var tile = last >= 0 ? root.querySelector('.ivf-sh-tile[data-idx="' + last + '"]') : null;
    var target = tile || root.querySelector('.ivf-sh-btn[data-act="' + (last === -2 ? 'settings' : last === -3 ? 'discover' : 'search') + '"]');
    if (!target) target = root.querySelector('.ivf-sh-btn[data-act="search"]');
    if (target) target.focus();
  }

  // Web: start the grid where the header ends (its height changes with the window/tabs row)
  function placeBelowHeader() {
    if (TV || !root) return;
    if (window.scrollY) window.scrollTo(0, 0); // header back to its resting place
    // the lowest visible bar: Jellyfin 12's web bar is header.MuiAppBar-root (.skinHeader can be
    // there with no height, which put the top row of tiles under the bar)
    root.style.top = barBottom() + 'px';
  }
  function barBottom() {
    var bottom = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      if (!h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      // legacy bar: its box runs ~40px below its icons (empty tabs row) - measure the icons instead,
      // so the gap above the tiles LOOKS the same as the gap below them
      var b = h.getBoundingClientRect().bottom, ib = 0;
      if (h.classList.contains('skinHeader')) {
        Array.prototype.forEach.call(h.querySelectorAll('.headerTop button'), function (x) {
          if (x.offsetParent !== null && !x.classList.contains('ivf-hdr-dsc')) ib = Math.max(ib, x.getBoundingClientRect().bottom);
        });
      }
      bottom = Math.max(bottom, Math.round(ib || b));
    });
    return bottom;
  }
  // On a fresh load Jellyfin's bar can appear well after Home is drawn (the grid then sat under it):
  // re-measure whenever the page changes while Home is showing (cheap: two elements)
  function keepBelowHeader() {
    if (TV || !root || root.classList.contains('ivf-hidden')) return;
    var want = barBottom() + 'px';
    if (root.style.top !== want) root.style.top = want;
  }
  window.addEventListener('resize', placeBelowHeader);

  // Web: Discover as a small button in Jellyfin's top bar (legacy layout: .headerRight, before its icons)
  function syncHeaderDiscover() {
    if (TV || !hasDiscover()) return;
    var bar = document.querySelector('.skinHeader');
    var right = bar && bar.querySelector('.headerRight');
    if (!right) return;
    // level with the bar's icons (the bar's box is taller than its icon row)
    var hr = bar.getBoundingClientRect(), rr = right.getBoundingClientRect();
    if (rr.height) bar.style.setProperty('--ivf-hdr-mid', Math.round(rr.top - hr.top + rr.height / 2) + 'px');
    if (bar.querySelector('.ivf-hdr-dsc')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ivf-hdr-dsc';
    b.title = 'Discover';
    b.innerHTML = '<span class="material-icons explore" aria-hidden="true"></span><span>Discover</span>';
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      try { sessionStorage.setItem(LAST_KEY, '-3'); } catch (err) {}
      openDiscover(0);
    });
    bar.appendChild(b); // centred over the whole bar (position:absolute in the bar)
  }

  function show() {
    if (!root) return;
    syncHeaderDiscover();
    var wasHidden = root.classList.contains('ivf-hidden');
    root.classList.remove('ivf-hidden');
    document.documentElement.classList.add('ivf-shome-on');
    placeBelowHeader();
    if (!TV) { setTimeout(placeBelowHeader, 300); setTimeout(placeBelowHeader, 1200); } // (the bar can arrive late on a fresh load)
    if (wasHidden) {
      // (the next pictures were put in when Home was left - see hide(); this only fills in a tile
      // that has none yet)
      var games = root.querySelector('.ivf-sh-tile[data-act="games"]');
      if (games) setTilePicture(games, gamesUrl);
    }
    fitNamesSoon();
    // TV: something must always be selected for the remote. Web: only for someone using the keyboard
    // (round 7: Back to Home always started again on Movies) - mouse users get nothing preselected
    if ((TV || kbUser) && (wasHidden || !root.contains(document.activeElement))) {
      focusStart();
      holdFocus();
    }
  }
  // For the first moments after Home appears, the web (still switching pages behind it) can grab
  // focus for its own hidden page; take it straight back so a tile/button is always selected
  var holdTimer = null;
  function holdFocus() {
    clearInterval(holdTimer);
    var until = Date.now() + 1500;
    holdTimer = setInterval(function () {
      if (!root || root.classList.contains('ivf-hidden') || Date.now() > until) { clearInterval(holdTimer); return; }
      if (!root.contains(document.activeElement)) focusStart();
    }, 50);
  }
  function hide() {
    if (!root) return;
    var wasShown = !root.classList.contains('ivf-hidden');
    root.classList.add('ivf-hidden');
    document.documentElement.classList.remove('ivf-shome-on');
    // Leaving Home: put the next (already downloaded) Games picture in now, out of sight, like the
    // library tiles - swapping it on the way back showed it black for a moment
    if (wasShown) {
      if (window.IvfTileBackdrops) window.IvfTileBackdrops.advance(); // the library tiles too
      nextGamesPicture();
      var games = root.querySelector('.ivf-sh-tile[data-act="games"]');
      if (games) setTilePicture(games, gamesUrl);
    }
  }

  // After pressing a tile/button, keep our Home on screen until the next page is really showing
  // (otherwise the web's own Home flashes up for a moment)
  var leavingUntil = 0;
  function webHomeGone() {
    var idx = document.querySelector('#indexPage');
    return !idx || idx.classList.contains('hide') || idx.offsetParent === null;
  }

  function update() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    if (onHomeRoute() && mode === 'home') {
      // Show our Home straight away (last drawn tiles) - the web's Home underneath may still be
      // rebuilding after Back; tiles/pictures refresh as soon as its cards are there
      build();
      if (root && root.querySelector('.ivf-sh-tile')) show();
      return;
    }
    // Leaving Home: stay up until the web's own Home has really gone (no flash of it)
    if (leavingUntil && Date.now() < leavingUntil && !webHomeGone()) {
      setTimeout(update, 50);
      return;
    }
    leavingUntil = 0;
    // a page other than Home is showing: Discover goes too (round-4 beta: the avatar's Settings link
    // changes page with pushState, no hashchange - Settings showed over Discover's TV Shows grid)
    if (!onHomeRoute() && mode === 'discover') setMode('home');
    hide();
  }
  function leave() {
    leavingUntil = Date.now() + 2500;
    setTimeout(update, 50);
  }

  function go(path) {
    if (window.Emby && Emby.Page && Emby.Page.show) Emby.Page.show(path);
    else location.hash = '#' + path;
  }

  function onClick(e) {
    var btn = e.target.closest && e.target.closest('.ivf-sh-btn, .ivf-sh-tile');
    if (!btn) return;
    e.preventDefault(); e.stopPropagation();
    if (btn.classList.contains('ivf-sh-tile')) {
      try { sessionStorage.setItem(LAST_KEY, btn.getAttribute('data-idx')); } catch (err) {}
      if (btn.getAttribute('data-act') === 'discover') { openDiscover(0); return; } // Back returns to this tile
      if (btn.getAttribute('data-act') === 'games') { openGames(); return; }
      var card = webLibraryCards().filter(function (c) { return c.getAttribute('data-id') === btn.getAttribute('data-id'); })[0];
      var action = card && (card.querySelector('.itemAction') || card);
      leave();
      if (action) action.click(); // the web's own navigation to that library
      return;
    }
    var act = btn.getAttribute('data-act');
    // come back to Search (or to Settings -2, Discover -3), like Android
    try { sessionStorage.setItem(LAST_KEY, act === 'settings' ? '-2' : act === 'discover' ? '-3' : '-1'); } catch (err) {}
    if (act === 'search') { leave(); go('/search'); }
    else if (act === 'settings') { leave(); sessionStorage.removeItem('ivfSettingsRow'); go('/mypreferencesmenu'); }
    else if (act === 'discover') {
      openDiscover(0);
    }
  }

  // A Jellyfin Enhanced window (a title's "more info" page or its request dialog) is open over Discover.
  // These close through history.back() (X button) or Esc, so Back/popstate then belongs to the window:
  // it must close just the window and leave Discover where it was, not return to the home grid.
  function jeWindowOpen() {
    return !!document.querySelector('.je-more-info-modal, .jellyseerr-season-modal') ||
      document.body.classList.contains('jellyseerr-modal-is-open');
  }

  // Back to Home after using Discover's Search button (home-tabs.js sets the flag): reopen Discover
  // instead of showing the home grid. Returns true when it did.
  function backToDiscover() {
    var flag = null;
    try { flag = sessionStorage.getItem('ivf-return-discover'); sessionStorage.removeItem('ivf-return-discover'); } catch (x) {}
    if (!flag) return false;
    setMode('discover');
    hide();
    openDiscover(0);
    return true;
  }

  // Web (Jellyfin 12 top bar): Discover lives on the Home page, where Jellyfin shows no Back arrow.
  // Add one while Discover is open, made from the bar's own menu button (same look) with the arrow
  // icon, just before it - like the Back arrow on a library page.
  var ARROW_BACK = '<svg class="MuiSvgIcon-root MuiSvgIcon-fontSizeMedium" focusable="false" aria-hidden="true" viewBox="0 0 24 24" style="width:1em;height:1em;font-size:1.5rem;fill:currentColor;display:inline-block;flex-shrink:0"><path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20z"></path></svg>';
  function syncDiscoverBack() {
    var own = document.querySelector('.ivf-dsc-back');
    // Discover, and IvanaFin's film page (Jellyfin's bar has no Back arrow there either)
    var film = document.documentElement.classList.contains('ivf-movie-on');
    var bar = !TV && (mode === 'discover' || film) && document.querySelector('header.MuiAppBar-root .MuiToolbar-root');
    if (!bar) { if (own) own.remove(); return; }
    if (own && bar.contains(own)) return;
    if (own) own.remove();
    var btns = Array.prototype.slice.call(bar.querySelectorAll('button.MuiIconButton-root'));
    if (btns.some(function (b) { return b.getAttribute('aria-label') === 'Back'; })) return; // Jellyfin's own
    // the main menu button (admins), not "User Menu"
    var menu = btns.filter(function (b) { var l = b.getAttribute('aria-label') || ''; return /menu/i.test(l) && !/user/i.test(l); })[0];
    var model = menu || btns[0];
    if (!model) return;
    var b = model.cloneNode(false);
    b.classList.add('ivf-dsc-back');
    b.setAttribute('aria-label', 'Back');
    b.setAttribute('title', 'Back');
    b.removeAttribute('aria-describedby');
    b.innerHTML = ARROW_BACK;
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      if (mode !== 'discover') { history.back(); return; } // film page: back to wherever you came from
      if (window.IvfDiscover && window.IvfDiscover.closeTop()) return; // an open title page first
      leaveDiscover();
    });
    if (menu) menu.parentNode.insertBefore(b, menu);
    else bar.insertBefore(b, bar.firstChild);
  }

  // Discover -> the home grid (Back key, header Back button, side menu Home)
  function leaveDiscover() {
    setMode('home');
    var homeTab = document.querySelector('.headerTabs .emby-tab-button[data-index="0"], .emby-tabs .emby-tab-button[data-index="0"]');
    if (homeTab) homeTab.click();
    update();
  }

  // Jellyfin Enhanced adds its Discover tab a little after start-up: wait for it (up to 10s - after a
  // page refresh it can take a while)
  // Discover is IvanaFin's own page (discover-page.js, drawn like Android's), not Enhanced's tab
  function openDiscover(tries) {
    if (window.IvfDiscover && window.IvfDiscover.show()) {
      setMode('discover'); hide();
      document.documentElement.classList.remove('ivf-discover-wait');
      return;
    }
    if (tries < 100) { setTimeout(function () { openDiscover(tries + 1); }, 100); return; }
    // Discover never appeared: fall back to the home grid
    document.documentElement.classList.remove('ivf-discover-wait');
    setMode('home');
    update();
  }
  // Remote: our own arrow-key movement on Home (the web's spatial navigation would wander behind it)
  window.addEventListener('keydown', function (e) {
    var k = e.key || '';
    var back = k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || (e.keyCode === 10009 || e.keyCode === 461) || e.keyCode === 27 || e.keyCode === 8;
    // Back from Discover returns to our Home (not while typing in a search box on the web)
    var typing = e.target && /^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName || '');
    var remoteBack = (e.keyCode === 10009 || e.keyCode === 461) || k === 'GoBack' || k === 'BrowserBack';
    if (back && (!typing || remoteBack) && mode === 'discover' && onHomeRoute() && !jeWindowOpen()) {
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (window.IvfDiscover && window.IvfDiscover.back()) return; // from the posters, Back goes to the tabs first
      leaveDiscover();
      return;
    }
    if (!root || root.classList.contains('ivf-hidden') || leavingUntil) return;
    var dir = k === 'ArrowLeft' || e.keyCode === 37 ? 'l' : k === 'ArrowRight' || e.keyCode === 39 ? 'r'
      : k === 'ArrowUp' || e.keyCode === 38 ? 'u' : k === 'ArrowDown' || e.keyCode === 40 ? 'd' : '';
    if (!dir) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    var btns = Array.prototype.slice.call(root.querySelectorAll('.ivf-sh-btn'));
    var tiles = Array.prototype.slice.call(root.querySelectorAll('.ivf-sh-tile'));
    var a = document.activeElement;
    var bi = btns.indexOf(a), ti = tiles.indexOf(a);
    var target = null;
    if (bi >= 0) {
      if (dir === 'l') target = btns[bi - 1];
      else if (dir === 'r') target = btns[bi + 1];
      else if (dir === 'd') target = tiles[0]; // Down from any top button goes to the first library (Movies)
    } else if (ti >= 0) {
      var col = ti % COLS;
      if (dir === 'l' && col > 0) target = tiles[ti - 1];
      else if (dir === 'r' && col < COLS - 1) target = tiles[ti + 1];
      else if (dir === 'u') target = ti < COLS ? (btns.filter(function (b) { return b.getAttribute('data-act') === 'search'; })[0] || btns[0]) : tiles[ti - COLS];
      else if (dir === 'd') target = tiles[ti + COLS];
    } else {
      target = btns.filter(function (b) { return b.getAttribute('data-act') === 'search'; })[0] || tiles[0];
    }
    if (target) target.focus();
  }, true);

  // Back from a library (always opened from Home) goes to Home: put our Home up at once, before the web
  // draws its own Home. If it turns out not to be Home after all, drop it again.
  window.addEventListener('keydown', function (e) {
    var k = e.key || '';
    var back = k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || (e.keyCode === 10009 || e.keyCode === 461) || e.keyCode === 27 || e.keyCode === 8;
    if (!back || !root || !root.querySelector('.ivf-sh-tile')) return;
    if (!document.documentElement.classList.contains('ivf-lib-on')) return;
    setMode('home');
    leavingUntil = 0;
    show();
    setTimeout(function () { if (!onHomeRoute()) hide(); }, 1000);
  }, true);
  // Web: the header's Discover tab opens Discover (our grid steps aside); its Home tab (or the logo)
  // brings our Home back
  document.addEventListener('click', function (e) {
    if (!e.target.closest) return;
    // The logo / Home button always means the home grid, even after Discover's Search
    if (e.target.closest('.headerHomeButton, .pageTitleWithLogo')) { try { sessionStorage.removeItem('ivf-return-discover'); } catch (x) {} }
    if (mode === 'home' && e.target.closest('#je-native-tab-btn-recommendations')) {
      setMode('discover');
      hide();
      return;
    }
    if (mode !== 'discover') return;
    // Web: the header's Back button (shown on Discover like on a library) closes an open title page,
    // otherwise goes back to the home grid
    if (e.target.closest('.headerBackButton')) {
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      if (window.IvfDiscover && window.IvfDiscover.closeTop()) return;
      leaveDiscover();
      return;
    }
    // the side menu's Home: Discover sits on the Home page, so Jellyfin sees no page change - do it here
    if (e.target.closest('a[href="#/home"], a[href="#/home.html"], a[href="#/"]')) {
      try { sessionStorage.removeItem('ivf-return-discover'); } catch (x) {}
      leaveDiscover();
      return;
    }
    if (e.target.closest('.emby-tab-button[data-index="0"], .headerHomeButton, .pageTitleWithLogo')) {
      setMode('home');
      setTimeout(update, 0);
    }
  }, true);
  window.addEventListener('popstate', function () {
    if (mode === 'discover' && jeWindowOpen()) return; // closing a window over Discover: stay in Discover
    if (onHomeRoute() && backToDiscover()) return;     // back from Discover's Search
    if (onHomeRoute()) { setMode('home'); update(); }
  });

  // Leaving Home (to a library, Search, Settings...) resets Discover mode
  window.addEventListener('hashchange', function () {
    if (!onHomeRoute()) setMode('home');
    else if (mode !== 'discover' && backToDiscover()) return; // back from Discover's Search
    setTimeout(update, 0);
  });
  document.addEventListener('viewshow', function () { offHomeEndsDiscover(); setTimeout(update, 0); });
  window.addEventListener('ivf-nav', function () { setTimeout(offHomeEndsDiscover, 0); });
  // Any page other than Home ends Discover (round-4 beta: the avatar's Settings link changes page with
  // pushState - no hashchange - and Settings showed over Discover's TV Shows grid)
  function offHomeEndsDiscover() {
    if (onHomeRoute()) return;
    if (mode === 'discover' || (window.IvfDiscover && window.IvfDiscover.isShown())) setMode('home');
  }
  // One page watcher shared by all IvanaFin scripts (each used to watch the whole page on its own,
  // which added up on the Samsung TV). Whichever script loads first creates it.
  var ivfWatch = window.IvfWatch || (window.IvfWatch = (function () {
    var subs = [];
    new MutationObserver(function (recs) {
      // (the Music player's own clock / lyrics updates every second don't concern the other scripts)
      for (var j = 0; j < recs.length; j++) if (!recs[j].target.closest || !recs[j].target.closest('#ivf-music')) break;
      if (j === recs.length) return;
      for (var i = 0; i < subs.length; i++) subs[i]();
    }).observe(document.documentElement, { childList: true, subtree: true });
    return function (fn, ms) {
      var queued = false;
      subs.push(function () {
        if (queued) return;
        queued = true;
        setTimeout(function () { queued = false; fn(); }, ms);
      });
    };
  })());
  ivfWatch(function () { update(); syncDiscoverBack(); keepBelowHeader(); }, 120);
  // Page refreshed while Discover was showing (same tab): go straight back to Discover.
  // Styles now, not only when the grid is built: Discover's "no backdrop" rule is in them.
  addStyle();
  var reopen = false;
  try { reopen = sessionStorage.getItem(DISCOVER_OPEN_KEY) === '1'; } catch (x) {}
  if (reopen && onHomeRoute()) { document.documentElement.classList.add('ivf-discover-wait'); setMode('discover'); hide(); openDiscover(0); }
  else if (reopen) setMode('home');
  // title pages (film / show / person): html.ivf-detail-on
  function markDetail() { document.documentElement.classList.toggle('ivf-detail-on', /^#\/details(\?|$)/.test(location.hash || '')); }
  window.addEventListener('hashchange', markDetail);
  window.addEventListener('ivf-nav', markDetail); // at once on forward navigation too
  markDetail();
  update();
})();

// Samsung: Settings opened with the selection on the top bar's back arrow, which shows no highlight
// (round-4 beta) - select the first settings row instead.
(function () {
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem) || localStorage.getItem('layout') === 'tv';
  if (!TV) return;
  // round-5 beta: Back from a sub-page selected the first row (not the one opened), and after the
  // Jellyfin Enhanced dialog closed nothing was selected - the next Down landed on Sign Out.
  // Remember the row that was opened and select it again whenever the selection is lost.
  // Jellyfin's own Settings pages in IvanaFin's look (round-5 beta: a solid blue selected row and a purple
  // Save button didn't match the rest of the app): the selected row / button is light grey with dark
  // text like the Fire TV app, text boxes and drop-downs get a white ring
  var st = document.createElement('style');
  st.textContent =
    'html.layout-tv .page:not(.hide) a.listItem-border:focus,html.layout-tv .page:not(.hide) .listItem:focus,html.layout-tv .page:not(.hide) .listItem-border:focus .listItem{background:#d1d5db !important;color:#131414 !important;border-radius:8px !important}' +
    'html.layout-tv .page:not(.hide) a.listItem-border:focus *,html.layout-tv .page:not(.hide) .listItem:focus *{color:#131414 !important}' +
    'html.layout-tv .page:not(.hide) .button-submit,html.layout-tv .page:not(.hide) .raised.button-submit{background:#141414 !important;color:#d1d5db !important;border-radius:999px !important}' +
    'html.layout-tv .page:not(.hide) .button-submit:focus{background:#d1d5db !important;color:#131414 !important}' +
    // (a person page's heart / ... buttons: the blue fill looked like 'favourite' - round 5)
    'html.layout-tv .page:not(.hide) .detailButton:focus{background:#d1d5db !important;color:#131414 !important}html.layout-tv .page:not(.hide) .detailButton:focus .material-icons,html.layout-tv .page:not(.hide) .detailButton:focus .detailButton-icon{color:#131414 !important}' +
    'html.layout-tv .page:not(.hide) .emby-select-withcolor:focus,html.layout-tv .page:not(.hide) .emby-input:focus,html.layout-tv .page:not(.hide) .emby-textarea:focus{box-shadow:0 0 0 2px #fff !important;border-color:#fff !important}' +
    'html.layout-tv .page:not(.hide) .emby-checkbox:focus + span::before,html.layout-tv .page:not(.hide) .mdl-switch__input:focus + .mdl-switch__trackContainer{box-shadow:0 0 0 2px #fff !important}';
  document.head.appendChild(st);
  var KEY = 'ivfSettingsRow';
  function onSettings() { return /^#\/mypreferencesmenu/.test(location.hash); }
  function page() { return document.querySelector('.page:not(.hide)'); }
  function rows(p) { return Array.prototype.slice.call(p.querySelectorAll('a.listItem-border, .listItem, a[is="emby-linkbutton"]')); }
  function label(el) { return (el.textContent || '').replace(/\s+/g, ' ').trim(); }
  function pick(p) {
    var all = rows(p), want = sessionStorage.getItem(KEY);
    for (var i = 0; i < all.length; i++) if (want && label(all[i]) === want && all[i].offsetParent) return all[i];
    return all[0] || p.querySelector('button');
  }
  function lost() { var a = document.activeElement; var p = page(); return p && (!a || a === document.body || !p.contains(a)) && !document.querySelector('.dialogContainer, .dialog.opened, [role="dialog"]:not([hidden])') && !jePanelOpen(); }
  // (the Jellyfin Enhanced panel counts as an open dialog only while it is on screen)
  function jePanelOpen() { var je = document.getElementById('jellyfin-enhanced-panel'); return !!(je && je.getClientRects().length && getComputedStyle(je).display !== 'none'); }
  function restore() { if (!onSettings() || !lost()) return false; var el = pick(page()); if (el) el.focus(); return !!el; }
  document.addEventListener('click', function (e) {
    if (!onSettings()) return;
    var p = page(), r = e.target.closest && e.target.closest('a.listItem-border, .listItem, a[is="emby-linkbutton"]');
    if (p && r && p.contains(r)) sessionStorage.setItem(KEY, label(r));
  }, true);
  document.addEventListener('keydown', function (e) {
    if (!onSettings()) return;
    var k = e.keyCode;
    // nothing selected: the first arrow / OK only brings the selection back (never a blind jump)
    if ((k >= 37 && k <= 40 || k === 13) && lost()) { if (restore()) { e.preventDefault(); e.stopPropagation(); } return; }
    if (k === 13) { var a = document.activeElement; if (a && page() && page().contains(a) && rows(page()).indexOf(a) >= 0) sessionStorage.setItem(KEY, label(a)); }
    // Back closing a dialog: select the row again once it has gone
    if (k === 27 || k === 8 || (k === 10009 || k === 461)) [250, 700].forEach(function (ms) { setTimeout(restore, ms); });
  }, true);
  // Settings > Home: a drop-down with nothing saved (TV mode home screen) showed an empty box - show
  // Jellyfin's default (its first choice) instead (round-5 beta)
  document.addEventListener('viewshow', function () {
    if (location.hash.indexOf('#/mypreferenceshome') !== 0) return;
    setTimeout(function () {
      Array.prototype.forEach.call(document.querySelectorAll('.page:not(.hide) select'), function (s) { if (s.selectedIndex < 0 && s.options.length) s.selectedIndex = 0; });
    }, 600);
  });
  document.addEventListener('viewshow', function () {
    if (!onSettings()) return;
    // Jellyfin itself selects the first row on return - move to the remembered row instead
    [150, 600].forEach(function (ms) { setTimeout(function () {
      if (!onSettings()) return;
      var p = page(); if (!p) return;
      var all = rows(p), a = document.activeElement;
      if (lost() || a === all[0]) { var el = pick(p); if (el && el !== a) el.focus(); }
    }, ms); });
  });
})();

// Web: the top bar's icons get a soft dark shadow so they stay visible over pale pictures (round-4
// beta: RoboCop, Cruel Summer - the bar is see-through)
(function () {
  var st = document.createElement('style');
  st.textContent = '.skinHeader .headerButton,.skinHeader .headerUserButton,.skinHeader .pageTitle,header.MuiAppBar-root .MuiIconButton-root{filter:drop-shadow(0 1px 2px rgba(0,0,0,.85)) drop-shadow(0 0 6px rgba(0,0,0,.45))}' +
    // Jellyfin clips the button groups (overflow:hidden), which cut the round highlight of Back / Home /
    // Menu at the top and bottom (user 2026-11-13): room above and below, cancelled by a negative margin
    // so nothing moves
    '.skinHeader .headerLeft,.skinHeader .headerRight{padding-top:8px !important;padding-bottom:8px !important;margin-top:-8px !important;margin-bottom:-8px !important}';
  document.head.appendChild(st);
})();

// Person pages (Jellyfin's own): "Born: 11/02/1971" reads as April to an American - write the month
// out, "Born: 11 Feb 1971" (round-5 beta). Jellyfin writes the date day-first here (en-GB).
(function () {
  var MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  function fix() {
    Array.prototype.forEach.call(document.querySelectorAll('.page:not(.hide) .detailSectionContent p'), function (p) {
      if (p._ivfDate) return;
      var m = /^(Born|Died|Birth date|Death date): (\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(p.textContent || '');
      if (!m || +m[3] < 1 || +m[3] > 12) return;
      p._ivfDate = true;
      p.textContent = p.textContent.replace(m[0], m[1] + ': ' + (+m[2]) + ' ' + MON[+m[3] - 1] + ' ' + m[4]);
    });
  }
  document.addEventListener('viewshow', function () {
    if (!/^#\/details/.test(location.hash)) return;
    [300, 1000, 2500].forEach(function (ms) { setTimeout(fix, ms); });
    if (TV) [600, 1500].forEach(function (ms) { setTimeout(toTop, ms); });
  });
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem) || localStorage.getItem('layout') === 'tv';
  // Round-7 beta, person pages:
  // - Samsung/LG: the page opened scrolled down to its first card, so the name and bio were off the top.
  //   Scroll back to the top while the selected card stays on screen.
  function toTop() {
    var pg = document.querySelector('.page:not(.hide)'), a = document.activeElement;
    if (!pg || !pg.querySelector('.jellyseerr-person-discovery-section, .detailSectionContent .overview') || !a || !pg.contains(a)) return;
    var sc = pg.querySelector('.itemDetailPage, .padded-top-focusscale') || pg;
    [pg, sc, document.scrollingElement].forEach(function (s) {
      if (!s || !s.scrollTop) return;
      // room = how far the page can move down before the selected card leaves the bottom
      var room = window.innerHeight - a.getBoundingClientRect().bottom - 24;
      s.scrollTop -= Math.min(s.scrollTop, Math.max(0, room));
    });
  }
  // - Jellyfin Enhanced's "Go to More with X, not in the library" jump link looked like stray bold text
  //   with a thin blue outline: now a pill button like the others; the bio no longer spans the full width
  var st = document.createElement('style');
  st.textContent =
    '.jellyseerr-join-jump{display:inline-block !important;padding:.55em 1.2em !important;border-radius:999px !important;border:0 !important;' +
    'background:rgba(255,255,255,.08) !important;color:#d1d5db !important;font:inherit;font-size:.95em !important;font-weight:500 !important;cursor:pointer;outline:none !important;box-shadow:none !important;margin:.4em 0 1em !important}' +
    '.jellyseerr-join-jump:hover,.jellyseerr-join-jump:focus{background:#d1d5db !important;color:#131414 !important}' +
    '.jellyseerr-join-jump-go{font-weight:600}' +
    '.detailSectionContent .overview{max-width:72em}';
  document.head.appendChild(st);
  // - Samsung/LG: OK on a "More with X" card (not in the library) only opened Jellyfin Enhanced's
  //   overlay with a Request button one press away. OK now opens the title's page, like every other card.
  if (TV) document.addEventListener('keydown', function (e) {
    if (e.keyCode !== 13 && e.key !== 'Enter') return;
    var a = document.activeElement, card = a && a.classList && a.classList.contains('jellyseerr-poster-image') && a.closest('.jellyseerr-card');
    var link = card && card.querySelector('.jellyseerr-more-info-link');
    if (!link) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    link.click();
  }, true);
})();

// Jellyfin Enhanced's settings panel (a plugin page):
// - Shortcuts: each action's name sat at the far right, away from its key (round-5 beta) - names now
//   follow their keys, keys in a fixed-width column
// - Samsung: the keyboard shortcuts mean nothing on a TV remote (round-5 beta) - that tab and the
//   "Press ? or Esc to close" line are hidden and the panel opens on Playback Settings
(function () {
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem) || localStorage.getItem('layout') === 'tv';
  var st = document.createElement('style');
  st.textContent =
    '#shortcuts-content .shortcuts-container div[style*="space-between"]{justify-content:flex-start !important;gap:18px !important}' +
    '#shortcuts-content .shortcuts-container div[style*="space-between"]>div:first-child{min-width:96px}' +
    // its sparkle "Seerr Recommendations" top-bar button showed on some pages only (round-5 beta: the bar
    // looked different each time) - IvanaFin's Discover tile does that job, so it is hidden everywhere
    '#je-header-buttons-group,#je-native-tab-link-recommendations{display:none !important}' +
    (TV ? '#jellyfin-enhanced-panel .tab-button[data-tab="shortcuts"],#jellyfin-enhanced-panel option[value="shortcuts"],#jellyfin-enhanced-panel .close-helptext{display:none !important}' +
      '#jellyfin-enhanced-panel button:focus,#jellyfin-enhanced-panel input:focus,#jellyfin-enhanced-panel select:focus,#jellyfin-enhanced-panel textarea:focus{outline:3px solid #fff !important;outline-offset:3px !important}' : '');
  document.head.appendChild(st);
  if (!TV) return;
  new MutationObserver(function () {
    var p = document.getElementById('jellyfin-enhanced-panel');
    if (!p || p._ivfTv) return;
    p._ivfTv = true;
    setTimeout(function () {
      var b = p.querySelector('.tab-button[data-tab="playback"]');
      var sc = p.querySelector('.tab-button[data-tab="shortcuts"]');
      if (b && sc && sc.classList.contains('active')) { b.click(); b.focus(); }
    }, 50);
  }).observe(document.body, { childList: true });
  // the remote inside the panel (Jellyfin's own focus code doesn't reach it): Up / Down go to the previous /
  // next control on screen; Right from the tab list goes into its settings, Left goes back to the tabs
  document.addEventListener('keydown', function (e) {
    var p = document.getElementById('jellyfin-enhanced-panel'), a = document.activeElement;
    if (!p || !a || !p.contains(a)) return;
    var k = e.keyCode, up = k === 38, down = k === 40, left = k === 37, right = k === 39;
    if (!(up || down || left || right)) return;
    if ((left || right) && a.tagName === 'INPUT' && (a.type === 'range' || a.type === 'text' || a.type === 'number' || a.type === 'search')) return;
    var all = Array.prototype.filter.call(p.querySelectorAll('button, input, select, textarea, a[href], [tabindex="0"]'), function (el) { return !el.disabled && el.getClientRects().length && getComputedStyle(el).visibility !== 'hidden'; });
    var tabs = all.filter(function (el) { return el.classList.contains('tab-button'); });
    var pane = p.querySelector('.je-pane.active');
    var inPane = all.filter(function (el) { return pane && pane.contains(el); });
    var to = null, onTab = a.classList.contains('tab-button');
    if (right && onTab) to = inPane[0];
    else if (left && !onTab) to = p.querySelector('.tab-button.active');
    else if (up || down) { var list = onTab ? tabs : inPane.length ? inPane : all; var i = list.indexOf(a); to = list[i + (down ? 1 : -1)]; }
    if (to) { e.preventDefault(); e.stopPropagation(); to.focus(); if (to.scrollIntoView) to.scrollIntoView({ block: 'nearest' }); if (onTab && to.classList.contains('tab-button')) to.click(); }
  }, true);
})();

// Settings: the top bar's user button opens Settings - on Settings itself it seemed to do nothing
// (round-5 beta) - there it opens your Profile instead
(function () {
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('.headerUserButton');
    if (!b || !/^#\/mypreferencesmenu/.test(location.hash)) return;
    var prof = document.querySelector('.page:not(.hide) a.lnkUserProfile');
    if (!prof) return;
    e.preventDefault(); e.stopPropagation();
    location.hash = prof.getAttribute('href').replace(/^#/, '');
  }, true);
})();

// Web: Esc = Back on the pages that had none (round-7 beta: library grids, Settings and the video player
// ignored Esc while film pages, Search and Music already used it). Runs last (bubble phase), so a page
// or dialog that handles Esc itself wins; never while typing, in a dialog or on Home.
(function () {
  if (typeof tizen !== 'undefined' || !!window.PalmSystem) return;
  window.addEventListener('keydown', function (e) {
    if (e.defaultPrevented || !(e.key === 'Escape' || e.keyCode === 27) || e.ctrlKey || e.altKey || e.metaKey) return;
    var t = e.target;
    if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName || '') || t.isContentEditable)) return;
    if (document.fullscreenElement) return; // the browser's own Esc leaves full screen first
    if (document.querySelector('.dialogContainer .dialog, .je-more-info-modal, .jellyseerr-season-modal, #jellyfin-enhanced-panel, .ivf-dlg-on')) return;
    var h = location.hash || '';
    // (Music, Search, Discover and film/show pages handle Esc themselves)
    if (!/^#\/(movies|tv|list|livetv|collections|video|mypreferences|userprofile|playbackconfiguration|subtitles|dashboard|settings|preferences)/.test(h)) return;
    if (document.documentElement.classList.contains('ivf-music-on')) return;
    e.preventDefault();
    history.back();
  });
})();
