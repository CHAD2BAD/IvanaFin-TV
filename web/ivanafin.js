/* IvanaFin for Jellyfin web - https://github.com/CHAD2BAD/IvanaFin-Samsung (built file, do not edit) */
(function () {
if (window.IvfWebLoaded) return; // loaded twice: run once
window.IvfWebLoaded = true;
// IvanaFin for Jellyfin web: runs before the IvanaFin scripts (built into ivanafin.js).
// - The IvanaFin look (ElegantFin theme + its colours) comes with it, so nothing else is needed.
// - Discover appears when the server also has the Jellyfin Enhanced plugin (+ Seerr); that plugin puts
//   its own script into Jellyfin web, so nothing is loaded for it here.
(function () {
  'use strict';
  window.IvfBuild = 'web';

  var css = document.createElement('style');
  css.id = 'ivf-public-theme';
  css.textContent = '@import url("https://cdn.jsdelivr.net/gh/lscambo13/ElegantFin@main/Theme/ElegantFin-jellyfin-theme-build-latest-minified.css");' +
    ':root{--darkerGradientPoint:hsla(0,0%,0%,1);--darkerGradientPointAlpha:hsla(0,0%,0%,.85);' +
    '--lighterGradientPoint:hsla(0,0%,0%,1);--lighterGradientPointAlpha:hsla(0,0%,7%,.85);' +
    '--headerColor:hsla(0,0%,0%,.8);--drawerColor:hsla(0,0%,0%,.9);' +
    '--headerColorGradient:linear-gradient(180deg,hsla(0,0%,0%,.95) 30%,55%,transparent 90%);' +
    '--borderColor:hsla(0,0%,32%,1);--darkerBorderColor:hsla(0,0%,22%,1);--lighterBorderColor:hsla(0,0%,100%,.2);' +
    '--selectorBackgroundColor:hsla(0,0%,27%,1);--selectorBackgroundColorAlpha:hsla(0,0%,27%,.5);' +
    '--btnMiniPlayColor:hsla(0,0%,0%,.8);--btnMiniPlayBorderColor:hsla(0,0%,30%,.8)}';
  (document.head || document.documentElement).appendChild(css);
})();

/* IvanaFin - custom-rules */
(function() { try {
// IvanaFin: the user's own card / list rules, moved here from the server's branding Custom CSS
// on 2026-11-09 (backup: backup/branding-2026-11-09-before-rules-move.json) so they live in git
// next to the screens they affect. The Custom CSS now holds only the ElegantFin theme import and
// its colour variables. Applies to the web and the Samsung app alike (same as before the move).
(function () {
  'use strict';
  var STYLE_ID = 'ivf-custom-rules';
  if (document.getElementById(STYLE_ID)) return;
  var s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = [
    // rows of items centred
    '.itemsContainer:not(.scrollSlider){justify-content:center !important}',
    // card titles wrap instead of being cut off
    '.cardText,.cardText-first{white-space:normal !important;overflow:visible !important;text-overflow:unset !important;height:auto !important}',
    // no watched tick / unwatched count badges
    '.indicator.videoIndicator{display:none !important}',
    '.countIndicator{display:none !important}',
    // list descriptions shown in full
    '.listItem-overview{-webkit-line-clamp:unset !important;display:block !important;overflow:visible !important;white-space:normal !important;text-overflow:unset !important;max-height:none !important}',
    // no borders / shadows / outlines on cards (the selected one gets its own outline below)
    '.card,.card *,.cardBox,.cardScalable,.cardPadder-portrait,.cardImageContainer,.cardImageContainer::before,.cardImageContainer::after,.cardBox::before,.cardBox::after',
    '{border:none !important;box-shadow:none !important;outline:none !important}',
    '.cardOverlayContainer:after{content:none !important;background:none !important}',
    '.cardOverlayContainer{background:transparent !important}',
    // selected card: white outline drawn OUTSIDE the picture (a border inside it squeezed the poster)
    '.card:focus .cardBox.visualCardBox,.card:focus .cardBox:not(.visualCardBox) .cardScalable,.card:focus .cardScalable',
    '{border:none !important;box-shadow:0 0 0 3px var(--fullContrastColor) !important}',
    '.card{contain:none !important}',
    // posters and pictures: the same small corners as the Home tiles and episode pictures (user 2026-11-15;
    // ElegantFin rounds them 1em). People and artists stay round.
    // (no :is() - older Samsung TVs don't know it and would drop the whole rule)
    ['.cardBox', '.cardScalable', '.cardImageContainer', '.cardOverlayContainer'].map(function (c) {
      return '.card:not([data-type="Person"]):not([data-type="MusicArtist"]) ' + c;
    }).join(',') + '{border-radius:calc(var(--ivf-dp,0.10417vw) * 4) !important}'
  ].join('');
  (document.head || document.documentElement).appendChild(s);
})();

// IvanaFin (web): right-click on a poster opens Jellyfin's menu (Play, Add to favourites, ...).
// Windows reports touch support on this PC (navigator.maxTouchPoints 10), and then Jellyfin treats a
// right-click like a finger's long press: it switches to "select several" (tick on the poster)
// instead. A mouse right-click now presses the poster's own (hidden) menu button; a real long press
// with a finger still selects.
(function () {
  'use strict';
  if ((typeof tizen !== 'undefined' || !!window.PalmSystem) || window.__ivfRightClick) return;
  window.__ivfRightClick = true;
  var lastPointer = 'mouse';
  window.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; }, true);
  window.addEventListener('contextmenu', function (e) {
    var kind = e.pointerType || lastPointer;
    if (kind === 'touch' || kind === 'pen') return;
    var card = e.target && e.target.closest && e.target.closest('.card');
    var btn = card && card.querySelector('[data-action="menu"]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    btn.click();
  }, true);
})();

} catch (e) { console.error('IvanaFin script custom-rules failed:', e); } })();
/* IvanaFin - discover-page */
(function() { try {
// IvanaFin Discover page (web + Samsung), drawn like Android IvanaFin's DiscoverPage:
//   tabs  Discover | Search | Request | Movies | TV Shows   (text tabs, the open one underlined)
//   Discover tab: a header for the selected title (title, "year • rating★", 3-line overview, its
//   backdrop top-right fading out) over rows: Trending, Popular Movies, Upcoming Movies,
//   Popular TV Shows, Upcoming TV Shows. Other tabs: poster grids (Request = your requests).
// Data comes from Seerr through Jellyfin Enhanced's proxy (/JellyfinEnhanced/jellyseerr/...).
// A title opens IvanaFin's own details page, drawn like Android's DiscoverMovieDetails /
// DiscoverSeriesDetails: backdrop top-right, logo or title, "date • runtime • rating • 8.5★ • 83%🍅",
// round buttons that show their name when selected (Request / Pending / Go to, download progress,
// Trailer on web), tagline, 3-line overview (opens the full text), Director / Writer / Studio / Genre
// rows, then Cast & Crew, More Like This and Recommended rows. Request opens a one-screen dialog:
// title + Request at the top, Quality profile tile, and for TV shows a 3-across grid of season tiles
// with Select all. Requests go through Enhanced's own JE.jellyseerrAPI (requestMedia/requestTvSeasons).
// home-grid.js opens/closes it (window.IvfDiscover.show/hide) in place of Enhanced's Discover tab.
// Remote: arrow keys move between tabs, rows and posters (nearest item in that direction); Back
// goes from the content to the tabs, then (home-grid.js) out of Discover.
(function () {
  'use strict';
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var IMG = 'https://image.tmdb.org/t/p/';
  var TABS = ['Discover', 'Search', 'Request', 'Movies', 'TV Shows'];
  var ROWS = [
    { title: 'Trending', path: 'discover/trending' },
    { title: 'Popular Movies', path: 'discover/movies', type: 'movie' },
    { title: 'Upcoming Movies', path: 'discover/movies/upcoming', type: 'movie' },
    { title: 'Popular TV Shows', path: 'discover/tv', type: 'tv' },
    { title: 'Upcoming TV Shows', path: 'discover/tv/upcoming', type: 'tv' }
  ];
  var GRID_PATHS = { 3: { path: 'discover/movies', type: 'movie' }, 4: { path: 'discover/tv', type: 'tv' } };
  var root = null, body = null, tabsEl = null, shown = false, tab = 0;
  var cache = {};          // tab index -> built content element (kept while Discover is open)
  var heroFor = null;      // item shown in the Discover tab's header

  function get(path, query) {
    return ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('/JellyfinEnhanced/jellyseerr/' + path, query || {}), dataType: 'json' })
      .then(dropCancelled);
  }
  // Enhanced keeps Seerr answers for up to 10 minutes (JellyseerrResponseCacheTtlMinutes) and doesn't know
  // about a Cancel made through the IvanaFin helper, so for a while it still says "Pending · Downloading".
  // Titles cancelled here are remembered (this tab, 15 min) and their old request / download info dropped.
  var CANCEL_KEY = 'ivf-dsc-cancelled', CANCEL_MS = 15 * 60000;
  function cancelledMap() {
    var m = {}; try { m = JSON.parse(sessionStorage.getItem(CANCEL_KEY) || '{}') || {}; } catch (e) {}
    var now = Date.now(); Object.keys(m).forEach(function (k) { if (now - m[k] > CANCEL_MS) delete m[k]; });
    return m;
  }
  function markCancelled(type, id, on) {
    var m = cancelledMap(); if (on) m[type + ':' + id] = Date.now(); else delete m[type + ':' + id];
    try { sessionStorage.setItem(CANCEL_KEY, JSON.stringify(m)); } catch (e) {}
  }
  function dropCancelled(data) {
    var m = cancelledMap(); if (!data || !Object.keys(m).length) return data;
    function fix(i, type) {
      if (!i || !i.mediaInfo || !m[(i.mediaType || type) + ':' + i.id]) return;
      if (i.mediaInfo.status === 4 || i.mediaInfo.status === 5) { i.mediaInfo.requests = []; i.mediaInfo.downloadStatus = []; }
      else delete i.mediaInfo; // shows "Request" again, like Seerr itself after the Cancel
    }
    fix(data, data.firstAirDate !== undefined || data.seasons ? 'tv' : 'movie');
    (data.results || []).forEach(function (i) { fix(i, i.firstAirDate !== undefined ? 'tv' : 'movie'); });
    return data;
  }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function titleOf(i) { return i.title || i.name || ''; }
  function yearOf(i) { var d = i.releaseDate || i.firstAirDate || ''; return d ? d.slice(0, 4) : ''; }
  function typeOf(i, fallback) { return i.mediaType || fallback || (i.firstAirDate || i.name ? 'tv' : 'movie'); }

  // Sizes in dp (1/960 of the screen width). TV uses Android IvanaFin's own numbers (DiscoverItemCard
  // 172dp tall = 115 wide, 16dp apart; header 180dp with a 400dp-wide 14sp overview; rows 32dp apart so
  // only the header + one row show, like Android). Web keeps the denser layout.
  var Z = TV
    ? { padX: 40, tab: 16, tabGap: 30, heroH: 180, title: 28, sub: 14, ov: 14, ovW: 400, rowT: 20, rowGap: 32, cardW: 115, gap: 16, name: 13, year: 11.5, status: 9 }
    : { padX: 44, tab: 13, tabGap: 22, heroH: 132, title: 22, sub: 10.5, ov: 10, ovW: 0, rowT: 14, rowGap: 8, cardW: 84, gap: 10, name: 9.5, year: 8.5, status: 7.5 };
  function addStyle() {
    if (document.getElementById('ivf-dsc-style')) return;
    var d = 'var(--ivf-dp)';
    function u(n) { return 'calc(' + d + ' * ' + n + ')'; }
    var s = document.createElement('style');
    s.id = 'ivf-dsc-style';
    s.textContent = [
      ':root{--ivf-dp:calc(100vw / 960)}',
      // runs to the very top so the backdrop does too; on web Jellyfin's top bar floats over it, fading
      // from dark into the picture (same as the film page), and the content starts below the bar
      '#ivf-dsc{position:fixed;left:0;right:0;bottom:0;top:0;z-index:900;background:#000;color:#d1d5db;overflow:hidden;font-family:inherit}',
      '.ivf-dsc-page{box-sizing:border-box;padding-top:var(--ivf-dsc-top,0px)}',
      '.ivf-dd .ivf-dsc-scroll{box-sizing:border-box;padding-top:var(--ivf-dsc-top,0px) !important}',
      TV ? '' : 'html.ivf-dsc-on .skinHeader,html.ivf-dsc-on header.MuiAppBar-root{z-index:950 !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;' +
        'background:linear-gradient(to bottom,rgba(0,0,0,.75) 0%,rgba(0,0,0,.35) 55%,rgba(0,0,0,0) 100%) !important;border-bottom:0 !important;box-shadow:none !important}' +
        'html.ivf-dsc-on .skinHeader::before,html.ivf-dsc-on .skinHeader::after{display:none !important}' +
        // a title's page: scrolled content fades out just under the see-through bar (not under its links)
        '.ivf-dd .ivf-dsc-scroll{-webkit-mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-dsc-top,0px) - 6px),#000 calc(var(--ivf-dsc-top,0px) + 18px));' +
        'mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-dsc-top,0px) - 6px),#000 calc(var(--ivf-dsc-top,0px) + 18px))}',
      '#ivf-dsc.ivf-off{display:none}',
      // backdrop of the selected title: top-right, fades in from the left and out to the bottom
      '.ivf-dsc-bd{position:absolute;top:0;right:0;width:70vw;height:70vh;pointer-events:none;opacity:0;transition:opacity .35s}',
      '.ivf-dsc-bd.on{opacity:1}',
      '.ivf-dsc-bd div{position:absolute;top:0;right:0;height:100%;aspect-ratio:16/9;max-width:100%;background:center/cover no-repeat;',
      '-webkit-mask-image:linear-gradient(to right,transparent 0%,rgba(0,0,0,.15) 15%,rgba(0,0,0,.5) 32%,rgba(0,0,0,.85) 50%,#000 65%),linear-gradient(to bottom,#000 40%,transparent 100%);',
      '-webkit-mask-composite:source-in;mask-image:linear-gradient(to right,transparent 0%,rgba(0,0,0,.15) 15%,rgba(0,0,0,.5) 32%,rgba(0,0,0,.85) 50%,#000 65%),linear-gradient(to bottom,#000 40%,transparent 100%);mask-composite:intersect}',
      '.ivf-dsc-page{position:relative;height:100%;display:flex;flex-direction:column}',
      // tabs
      '.ivf-dsc-tabs{display:flex;gap:' + u(Z.tabGap) + ';padding:' + u(TV ? 14 : 2) + ' ' + u(Z.padX - 4) + ' ' + u(6) + ' ' + u(TV ? Z.padX - 4 : Z.padX - 8) + ';flex:none' + (TV ? '' : ';margin-top:calc(' + d + ' * -6);position:relative;top:calc(' + d + ' * -5)') + '}',
      '.ivf-dsc-tab{background:none;border:0;color:rgba(255,255,255,.72);font:inherit;font-size:' + u(Z.tab) + ';font-weight:500;padding:' + u(4) + ' ' + u(8) + ';',
      'border-radius:999px;cursor:pointer;position:relative;outline:none}',
      '.ivf-dsc-tab.sel{color:#d1d5db;font-weight:700}',
      '.ivf-dsc-tab.sel::after{content:"";position:absolute;left:30%;right:30%;bottom:calc(' + d + ' * -2);height:calc(' + d + ' * 2);border-radius:2px;background:#d1d5db}',
      '.ivf-dsc-tab:hover{color:#d1d5db}',
      (TV ? '.ivf-dsc-tab:focus' : '.ivf-dsc-tab:focus-visible') + '{background:#d1d5db;color:#131414}',
      (TV ? '.ivf-dsc-tab:focus::after' : '.ivf-dsc-tab:focus-visible::after') + '{display:none}',
      '.ivf-dsc-body{position:relative;flex:1;min-height:0;display:flex;flex-direction:column}',
      '.ivf-dsc-content{flex:1;min-height:0;display:flex;flex-direction:column}',
      // Discover tab: header (selected title) + rows
      '.ivf-dsc-hero{flex:none;height:' + u(Z.heroH) + ';padding:' + u(6) + ' ' + u(Z.padX) + ' 0;box-sizing:border-box;max-width:52%;overflow:hidden}',
      '.ivf-dsc-hero h2{margin:0;font-size:' + u(Z.title) + ';font-weight:700;line-height:1.15;text-shadow:0 1px 8px rgba(0,0,0,.6)}',
      '.ivf-dsc-sub{margin-top:' + u(4) + ';font-size:' + u(Z.sub) + ';font-weight:600;opacity:.95}',
      '.ivf-dsc-ov{margin-top:' + u(6) + ';font-size:' + u(Z.ov) + ';line-height:1.4;opacity:.92;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;text-shadow:0 1px 6px rgba(0,0,0,.7)' +
        (Z.ovW ? ';max-width:' + u(Z.ovW) : '') + '}',
      // web: the whole overview, never cut off - no 3-line limit; fitHero() makes the text smaller when a
      // long one wouldn't fit (the header keeps its height, so the rows never jump while browsing)
      TV ? '' : '.ivf-dsc-ov{display:block;-webkit-line-clamp:unset;overflow:visible}',
      '.ivf-dsc-scroll{flex:1;min-height:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding-bottom:calc(' + d + ' * 30)}',
      '.ivf-dsc-scroll::-webkit-scrollbar{display:none}',
      // Discover tab rows move a whole row at a time: each stop puts a row right under the header, so a
      // row is never half cut off by it. The spacer lets the last rows reach the top too.
      '.ivf-dsc-rows{scroll-snap-type:y mandatory;scroll-padding-top:' + u(8) + ';padding-bottom:0}',
      '.ivf-dsc-rows > .ivf-dsc-row{scroll-snap-align:start}',
      // a screen's height under the last row (no measuring - snapping still stops on the last row)
      '.ivf-dsc-rows > .ivf-dsc-spacer{flex:none;height:calc(100% - ' + u(8) + ')}',
      '.ivf-dsc-row{margin-top:' + u(Z.rowGap) + '}',
      '.ivf-dsc-row:first-child{margin-top:' + u(8) + '}',
      '.ivf-dsc-row h3{margin:0 0 ' + u(6) + ';padding:0 ' + u(Z.padX) + ';font-size:' + u(Z.rowT) + ';font-weight:600}',
      '.ivf-dsc-strip{display:flex;gap:' + u(Z.gap) + ';overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:' + u(6) + ' ' + u(Z.padX) + ' ' + u(4) + ';scroll-behavior:smooth}',
      '.ivf-dsc-strip::-webkit-scrollbar{display:none}',
      // poster card: white outline when selected (no grow on web - Firefox seams), title + year below
      // flex column from the top: a button centres its contents, so cards with a 2-line title shifted the rest
      '.ivf-dsc-card{flex:none;width:' + u(Z.cardW) + ';display:flex;flex-direction:column;align-items:stretch;justify-content:flex-start;align-self:flex-start;',
      'background:none;border:0;padding:0;color:#d1d5db;font:inherit;text-align:center;cursor:pointer;outline:none}',
      '.ivf-dsc-strip{align-items:flex-start}',
      '.ivf-dsc-poster{position:relative;width:100%;padding-top:150%;border-radius:calc(' + d + ' * 4);background:#151515 center/cover no-repeat;background-clip:padding-box;',
      'border:calc(' + d + ' * 1.5) solid transparent;box-sizing:border-box;transition:transform .12s,border-color .12s}',
      '.ivf-dsc-card:hover .ivf-dsc-poster,.ivf-dsc-card:focus .ivf-dsc-poster{border-color:#fff}',
      TV ? '.ivf-dsc-card:focus .ivf-dsc-poster{transform:scale(1.06)}' : '',
      // titles centred under the poster (the TV's own button styles left-aligned them)
      '.ivf-dsc-name{display:block;width:100%;text-align:center !important;margin-top:' + u(5) + ';font-size:' + u(Z.name) + ';font-weight:700;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-dsc-year{display:block;width:100%;text-align:center !important;font-size:' + u(Z.year) + ';opacity:.85;margin-top:' + u(1) + '}',
      '.ivf-dsc-status{position:absolute;left:' + u(4) + ';top:' + u(4) + ';padding:' + u(1.5) + ' ' + u(5) + ';border-radius:999px;',
      'font-size:' + u(Z.status) + ';font-weight:700;background:rgba(0,0,0,.75);color:#d1d5db}',
      // grid tabs
      '.ivf-dsc-grid{display:grid;grid-template-columns:repeat(auto-fill,' + u(Z.cardW) + ');justify-content:space-between;align-items:start;row-gap:' + u(Z.gap + 4) + ';',
      'column-gap:' + u(Z.gap) + ';padding:' + u(10) + ' ' + u(Z.padX) + ' 0}',
      '.ivf-dsc-msg{padding:' + u(30) + ' ' + u(Z.padX) + ';font-size:' + u(Z.tab - 1) + ';opacity:.75}',
      '.ivf-dsc-search{display:flex;justify-content:center;padding:' + u(8) + ' ' + u(Z.padX) + ' 0;flex:none}',
      '.ivf-dsc-search input{width:calc(' + d + ' * 380);max-width:100%;box-sizing:border-box;padding:calc(' + d + ' * 9) calc(' + d + ' * 18);border-radius:999px;',
      'border:calc(' + d + ' * 1) solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#d1d5db;font:inherit;font-size:calc(' + d + ' * 13);outline:none}',
      '.ivf-dsc-search input:focus{border-color:#fff;background:rgba(255,255,255,.16)}',
      // grids (Movies, TV Shows, Search, Requests), once scrolled: posters fade out under the tabs / search box instead
      // of being cut at a hard line (round-5 beta, web search; round 6: Samsung + web Movies grid too)
      '.ivf-dsc-scroll.ivf-dsc-scd:not(.ivf-dsc-rows){-webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 ' + u(36) + ');mask-image:linear-gradient(to bottom,transparent 0,#000 ' + u(36) + ')}'
    ].join('') + detailStyle(u);
    document.head.appendChild(s);
  }

  // ---- building blocks -------------------------------------------------------------------------
  function cardHtml(item, fallbackType, status) {
    var poster = item.posterPath ? IMG + 'w342' + item.posterPath : '';
    var y = yearOf(item);
    return '<button type="button" class="ivf-dsc-card" data-id="' + item.id + '" data-type="' + typeOf(item, fallbackType) + '">' +
      '<div class="ivf-dsc-poster"' + (poster ? ' style="background-image:url(\'' + poster + '\')"' : '') + '>' +
      (status ? '<span class="ivf-dsc-status">' + esc(status) + '</span>' : '') + '</div>' +
      '<div class="ivf-dsc-name">' + esc(titleOf(item)) + '</div>' + (y ? '<div class="ivf-dsc-year">' + y + '</div>' : '') +
      '</button>';
  }
  // Every card remembers its item, for the header and for opening it
  function attachItems(container, items) {
    var cards = container.querySelectorAll('.ivf-dsc-card:not([data-bound])');
    var map = {}; items.forEach(function (i) { map[String(i.id)] = i; });
    Array.prototype.forEach.call(cards, function (c) { c.setAttribute('data-bound', '1'); c._item = map[c.getAttribute('data-id')]; });
  }

  function setBackdrop(item) {
    var bd = root.querySelector('.ivf-dsc-bd');
    var url = item && item.backdropPath ? IMG + 'w1280' + item.backdropPath : '';
    if (!url) { bd.classList.remove('on'); return; }
    var img = new Image();
    img.onload = function () {
      if (heroFor !== item) return;
      bd.firstChild.style.backgroundImage = 'url("' + url + '")';
      bd.classList.add('on');
    };
    img.src = url;
  }
  function showHero(item) {
    var hero = root.querySelector('.ivf-dsc-hero');
    if (!hero || !item || heroFor === item) return;
    heroFor = item;
    var bits = [];
    var y = yearOf(item); if (y) bits.push(y);
    if (item.voteAverage) bits.push(item.voteAverage.toFixed(1) + '★');
    hero.innerHTML = '<h2>' + esc(titleOf(item)) + '</h2>' +
      (bits.length ? '<div class="ivf-dsc-sub">' + esc(bits.join('  •  ')) + '</div>' : '') +
      (item.overview ? '<div class="ivf-dsc-ov">' + esc(item.overview) + '</div>' : '');
    if (!TV) fitHero(hero);
    setBackdrop(item);
  }
  // Web: shrink the overview text (down to 70%) until title + overview fit in the header
  function fitHero(hero) {
    var ov = hero.querySelector('.ivf-dsc-ov');
    if (!ov) return;
    ov.style.fontSize = '';
    var base = parseFloat(getComputedStyle(ov).fontSize) || 14, size = base;
    while (hero.scrollHeight > hero.clientHeight + 1 && size > base * 0.7) {
      size -= base * 0.05;
      ov.style.fontSize = size + 'px';
    }
  }
  window.addEventListener('resize', function () {
    var hero = !TV && root && root.querySelector('.ivf-dsc-hero');
    if (hero) fitHero(hero);
  });

  // ---- tabs --------------------------------------------------------------------------------------
  function buildDiscover() {
    var el = document.createElement('div');
    el.className = 'ivf-dsc-content';
    el.innerHTML = '<div class="ivf-dsc-hero"></div><div class="ivf-dsc-scroll ivf-dsc-rows"></div>';
    var scroll = el.querySelector('.ivf-dsc-scroll');
    ROWS.forEach(function (r, ri) {
      var row = document.createElement('section');
      row.className = 'ivf-dsc-row';
      row.innerHTML = '<h3>' + esc(r.title) + '</h3><div class="ivf-dsc-strip"></div>';
      scroll.appendChild(row);
      get(r.path, { page: 1 }).then(function (res) {
        var items = ((res && res.results) || []).filter(function (i) { return i.posterPath; });
        var strip = row.querySelector('.ivf-dsc-strip');
        strip.innerHTML = items.map(function (i) { return cardHtml(i, r.type); }).join('');
        attachItems(strip, items);
        if (ri === 0 && items[0] && tab === 0) showHero(items[0]);
      }, function () { row.querySelector('.ivf-dsc-strip').innerHTML = '<div class="ivf-dsc-msg">Couldn\'t load this row.</div>'; });
    });
    // room under the last row so it can still snap to the top
    var spacer = document.createElement('div');
    spacer.className = 'ivf-dsc-spacer';
    scroll.appendChild(spacer);
    return el;
  }

  // Poster grid that loads the next page as you get near its end
  function buildGrid(path, type) {
    var el = document.createElement('div');
    el.className = 'ivf-dsc-content';
    el.innerHTML = '<div class="ivf-dsc-scroll"><div class="ivf-dsc-grid"></div></div>';
    var grid = el.querySelector('.ivf-dsc-grid');
    var page = 0, total = 1, busy = false, seen = {};
    function more() {
      if (busy || page >= total) return;
      busy = true;
      get(path, { page: page + 1 }).then(function (res) {
        page = res.page || page + 1; total = res.totalPages || page;
        // popularity lists shift between pages, so a title can come twice (round-5 beta: Ghost Soldier)
        var items = ((res && res.results) || []).filter(function (i) { return i.posterPath && !seen[i.id] && (seen[i.id] = 1); });
        grid.insertAdjacentHTML('beforeend', items.map(function (i) { return cardHtml(i, type); }).join(''));
        attachItems(grid, items);
      }).then(function () { busy = false; }, function () { busy = false; });
    }
    el._near = function (card) { // a card near the end got the selection: load more
      var cards = grid.querySelectorAll('.ivf-dsc-card');
      if (Array.prototype.indexOf.call(cards, card) > cards.length - 14) more();
    };
    el.querySelector('.ivf-dsc-scroll').addEventListener('scroll', function () {
      var s = this; if (s.scrollTop + s.clientHeight > s.scrollHeight - 600) more();
    });
    more();
    return el;
  }

  function buildSearch() {
    var el = document.createElement('div');
    el.className = 'ivf-dsc-content';
    el.innerHTML = '<div class="ivf-dsc-search"><input type="search" placeholder="Search for films and TV shows" autocomplete="off"></div>' +
      '<div class="ivf-dsc-scroll"><div class="ivf-dsc-grid"></div></div>';
    var input = el.querySelector('input'), grid = el.querySelector('.ivf-dsc-grid');
    var timer = null, last = '';
    function run() {
      var q = input.value.trim();
      if (q === last) return;
      last = q;
      if (!q) { grid.innerHTML = ''; return; }
      get('search', { query: q, page: 1 }).then(function (res) {
        if (input.value.trim() !== q) return;
        var items = ((res && res.results) || []).filter(function (i) { return (i.mediaType === 'movie' || i.mediaType === 'tv') && i.posterPath; });
        grid.innerHTML = items.length ? items.map(function (i) { return cardHtml(i); }).join('') : '<div class="ivf-dsc-msg">Nothing found for “' + esc(q) + '”.</div>';
        attachItems(grid, items);
      });
    }
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 400); });
    input.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.keyCode === 13) { clearTimeout(timer); run(); } });
    return el;
  }

  var STATUS = { 2: 'Requested', 3: 'Processing', 4: 'Partly available', 5: 'Available' };
  function buildRequests() {
    var el = document.createElement('div');
    el.className = 'ivf-dsc-content';
    el.innerHTML = '<div class="ivf-dsc-scroll"><div class="ivf-dsc-msg ivf-dsc-loading">Loading your requests...</div><div class="ivf-dsc-grid"></div></div>';
    var grid = el.querySelector('.ivf-dsc-grid');
    var loadingMsg = el.querySelector('.ivf-dsc-loading');
    get('request', { take: 60, skip: 0, filter: 'all', sort: 'added' }).then(function (res) {
      var reqs = (res && res.results) || [];
      if (loadingMsg && loadingMsg.parentNode) loadingMsg.parentNode.removeChild(loadingMsg);
      if (!reqs.length) { grid.outerHTML = '<div class="ivf-dsc-msg">No requests yet. Find something in Discover or Search and press Request.</div>'; return; }
      return Promise.all(reqs.map(function (r) {
        var m = r.media || {}; var type = m.mediaType || r.type;
        return get(type + '/' + m.tmdbId).then(function (det) {
          det.mediaType = type;
          return { item: det, status: STATUS[m.status] || (r.status === 3 ? 'Declined' : 'Requested') };
        }, function () { return null; });
      })).then(function (rows) {
        rows = rows.filter(function (x) { return x && x.item && x.item.posterPath; });
        grid.innerHTML = rows.map(function (x) { return cardHtml(x.item, x.item.mediaType, x.status); }).join('');
        attachItems(grid, rows.map(function (x) { return x.item; }));
      });
    }, function () { grid.outerHTML = '<div class="ivf-dsc-msg">Couldn\'t load your requests.</div>'; });
    return el;
  }

  function contentFor(i) {
    if (cache[i]) return cache[i];
    var el = i === 0 ? buildDiscover() : i === 1 ? buildSearch() : i === 2 ? buildRequests() : buildGrid(GRID_PATHS[i].path, GRID_PATHS[i].type);
    cache[i] = el;
    return el;
  }
  function selectTab(i, focusTab) {
    tab = i;
    Array.prototype.forEach.call(tabsEl.children, function (b, bi) { b.classList.toggle('sel', bi === i); });
    var el = contentFor(i);
    if (body.firstChild !== el) { body.innerHTML = ''; body.appendChild(el); }
    // the backdrop belongs to the Discover tab's header
    var bd = root.querySelector('.ivf-dsc-bd');
    if (i === 0 && heroFor) bd.classList.add('on'); else bd.classList.remove('on');
    if (focusTab) tabsEl.children[i].focus();
  }

  function build() {
    addStyle();
    root = document.createElement('div');
    root.id = 'ivf-dsc';
    root.className = 'ivf-off';
    root.innerHTML = '<div class="ivf-dsc-bd"><div></div></div><div class="ivf-dsc-page"><div class="ivf-dsc-tabs" role="tablist">' +
      TABS.map(function (t, i) { return '<button type="button" class="ivf-dsc-tab" data-tab="' + i + '">' + esc(t) + '</button>'; }).join('') +
      '</div><div class="ivf-dsc-body"></div></div>';
    document.body.appendChild(root);
    tabsEl = root.querySelector('.ivf-dsc-tabs');
    body = root.querySelector('.ivf-dsc-body');
    tabsEl.addEventListener('click', function (e) { var b = e.target.closest('.ivf-dsc-tab'); if (b) selectTab(+b.getAttribute('data-tab')); });
    // Web: the mouse wheel over the title / description / backdrop / tabs scrolled the page behind
    // (the top bar moved) instead of the rows: send it to the tab's own scroll box. On the Discover
    // tab the rows snap one at a time, so the wheel moves one row per notch.
    var wheelAt = 0;
    root.addEventListener('wheel', function (e) {
      if (TV || !e.deltaY || e.target.closest('.ivf-dsc-scroll') || e.target.closest('.ivf-dd')) return; // (its own box scrolls itself)
      var sc = body.querySelector('.ivf-dsc-scroll');
      e.preventDefault();
      if (!sc) return;
      var rows = sc.querySelectorAll('.ivf-dsc-row');
      if (!rows.length) { sc.scrollTop += e.deltaY; return; }
      if (Date.now() - wheelAt < 350) return; // one row per notch (a trackpad sends many small ones)
      wheelAt = Date.now();
      var base = rows[0].offsetTop, cur = 0;
      for (var i = 0; i < rows.length; i++) if (rows[i].offsetTop - base <= sc.scrollTop + 4) cur = i;
      var next = Math.max(0, Math.min(rows.length - 1, cur + (e.deltaY > 0 ? 1 : -1)));
      sc.scrollTo({ top: rows[next].offsetTop - base, behavior: 'smooth' });
    }, { passive: false });
    // On TV the selected tab opens as you move onto it (Android TV tabs)
    tabsEl.addEventListener('focusin', function (e) { var b = e.target.closest('.ivf-dsc-tab'); if (b && TV) selectTab(+b.getAttribute('data-tab')); });
    root.addEventListener('click', function (e) {
      var c = e.target.closest('.ivf-dsc-card'); if (!c || !c._item) return;
      openItem(c);
    });
    root.addEventListener('mouseover', function (e) { var c = e.target.closest('.ivf-dsc-card'); if (c && c._item && tab === 0 && !c.closest('.ivf-dd')) showHero(c._item); });
    root.addEventListener('focusin', function (e) {
      var c = e.target.closest('.ivf-dsc-card'); if (!c || c.closest('.ivf-dd')) return;
      if (c._item && tab === 0) showHero(c._item);
      var content = cache[tab]; if (content && content._near) content._near(c);
    });
  }
  function openItem(card) {
    openDetails(parseInt(card.getAttribute('data-id'), 10), card.getAttribute('data-type'), card);
  }

  // ---- details page (Android DiscoverMovieDetails / DiscoverSeriesDetails) ------------------------
  // Sizes in Android dp; the web uses ~70% of the TV size (like the Discover tab's denser layout).
  var DF = TV ? 1 : 0.72;
  function detailStyle(u) {
    function v(n) { return u(Math.round(n * DF * 100) / 100); }
    return [
      '.ivf-dd{position:absolute;inset:0;z-index:5;background:#000;overflow:hidden}',
      // backdrop like the show page (Backdrop.kt): top-right 70% x 70%, fades in from the left and out to the bottom
      '.ivf-dd-bd{position:absolute;top:0;right:0;width:70vw;height:70vh;pointer-events:none;opacity:0;transition:opacity .35s}',
      '.ivf-dd-bd.on{opacity:1}',
      '.ivf-dd-bd div{position:absolute;top:0;right:0;height:100%;aspect-ratio:16/9;max-width:100%;background:top right/cover no-repeat;',
      '-webkit-mask-image:linear-gradient(to right,transparent 0%,#000 60%),linear-gradient(to bottom,#000 0%,transparent 100%);-webkit-mask-composite:source-in;',
      'mask-image:linear-gradient(to right,transparent 0%,#000 60%),linear-gradient(to bottom,#000 0%,transparent 100%);mask-composite:intersect}',
      '.ivf-dd .ivf-dsc-scroll{position:relative;height:100%;padding-bottom:' + v(80) + '}',
      '.ivf-dd-head{padding:' + v(48) + ' ' + u(Z.padX) + ' ' + v(16) + ';display:flex;flex-direction:column;gap:' + v(4) + '}',
      '.ivf-dd-logo{display:block;height:' + v(60) + ';max-width:' + v(320) + ';object-fit:contain;object-position:left center;margin-left:' + v(8) + '}',
      '.ivf-dd-title{margin:0 0 0 ' + v(8) + ';max-width:75%;font-size:' + v(28) + ';font-weight:600;line-height:1.2;text-shadow:0 1px 8px rgba(0,0,0,.6)}',
      '.ivf-dd-quick{margin-left:' + v(8) + ';max-width:60%;font-size:' + v(15) + ';font-weight:500;opacity:.95}',
      '.ivf-dd-quick .dot{margin:0 ' + v(8) + ';opacity:.8}',
      '.ivf-dd-tomato{width:1em;height:1em;vertical-align:-0.12em;margin-left:' + v(4) + '}',
      '.ivf-dd-profslot:empty{display:none}',
      '.ivf-dd-prof{width:100%}',
      // round buttons (ExpandableFaButton): icon only, the name slides out when selected
      '.ivf-dd-btns{display:flex;align-items:center;gap:' + v(16) + ';padding:' + v(20) + ' 0 ' + v(20) + ' ' + v(8) + '}',
      '.ivf-dd-btn{display:inline-flex;align-items:center;height:' + v(40) + ';min-width:' + v(40) + ';padding:0 ' + v(4) + ';box-sizing:border-box;border:0;border-radius:999px;',
      'background:rgba(14,14,14,.9);color:#d1d5db;font:inherit;font-size:' + v(14) + ';font-weight:500;cursor:pointer;outline:none;transition:transform .12s,background .12s,color .12s}',
      '.ivf-dd-btn .material-icons{width:' + v(32) + ';text-align:center;font-size:' + v(20) + ';color:inherit}',
      '.ivf-dd-btn .lbl{max-width:0;overflow:hidden;white-space:nowrap;transition:max-width .18s,padding .18s}',
      '.ivf-dd-btn:focus,.ivf-dd-btn:hover{background:#d1d5db;color:#131414;transform:scale(1.1)}',
      '.ivf-dd-btn:focus .lbl,.ivf-dd-btn:hover .lbl{max-width:' + v(200) + ';padding:0 ' + v(6) + ' 0 ' + v(2) + '}',
      '.ivf-dd-btn[disabled]{opacity:.45;cursor:default}',
      '.ivf-dd-progress{font-size:' + v(15) + ';font-weight:500}',
      '.ivf-dd-tag{margin-left:' + v(8) + ';max-width:60%;font-size:' + v(16) + ';font-style:italic}',
      // overview: 3 lines, selectable; opens the full text
      '.ivf-dd-ov{display:block;max-width:60%;text-align:left;background:none;border:0;border-radius:' + v(8) + ';padding:' + v(4) + ' ' + v(8) + ';color:#d1d5db;font:inherit;',
      'font-size:' + v(14) + ';line-height:1.45;cursor:pointer;outline:none}',
      '.ivf-dd-ov span{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-dd-ov:focus,.ivf-dd-ov:hover{background:rgba(14,14,14,.9)}',
      // Director / Writer / Studio / Genre rows (IvanaFinDetailsGroup)
      '.ivf-dd-group{margin:' + v(8) + ' 0 0 ' + v(8) + ';max-width:60%;display:flex;flex-direction:column;gap:' + v(4) + ';font-size:' + v(14) + '}',
      '.ivf-dd-group div{display:flex;gap:' + v(16) + '}',
      '.ivf-dd-group b{flex:none;width:' + v(110) + ';font-weight:600;color:#9ca3af}',
      '.ivf-dd-group span{display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-dd .ivf-dsc-row{margin-top:' + v(16) + '}',
      '.ivf-dd .ivf-dsc-row h3{font-size:' + v(22) + ';font-weight:600;padding-left:calc(' + u(Z.padX) + ' + ' + v(8) + ')}' /* same left edge as the title (was 4.5px further right - round 5) */,
      // Cast & Crew: round photos, name + role below (PersonCard, 108dp wide)
      '.ivf-dd-person{flex:none;width:' + v(108) + ';display:flex;flex-direction:column;align-items:center;background:none;border:0;padding:0;color:#d1d5db;font:inherit;cursor:pointer;outline:none}',
      '.ivf-dd-face{width:100%;padding-top:100%;border-radius:50%;background:#1c1c1c center/cover no-repeat;border:' + v(1.5) + ' solid transparent;box-sizing:border-box;',
      'position:relative;transition:transform .12s,border-color .12s}',
      '.ivf-dd-face i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:' + v(30) + ';font-weight:600;opacity:.6}',
      '.ivf-dd-person:focus .ivf-dd-face,.ivf-dd-person:hover .ivf-dd-face{border-color:#fff' + (TV ? ';transform:scale(1.06)' : '') + '}',
      '.ivf-dd-pname{margin-top:' + v(6) + ';font-size:' + v(13) + ';font-weight:600;text-align:center;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-dd-prole{font-size:' + v(11.5) + ';opacity:.75;text-align:center;line-height:1.25;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-dd-msg{padding:' + v(120) + ' ' + u(Z.padX) + ';font-size:' + v(16) + ';opacity:.75}',
      // person page: Android's centred displaySmall title over the poster grid
      '.ivf-dp-title{margin:0;padding:' + v(40) + ' ' + u(Z.padX) + ' ' + v(6) + ';text-align:center;font-size:' + v(34) + ';font-weight:400;color:#d1d5db}',
      '.ivf-dp .ivf-dd-msg{padding-top:' + v(40) + '}',
      '.ivf-dd-back{position:absolute;top:calc(var(--ivf-dsc-top,0px) + ' + v(12) + ');left:' + v(12) + ';z-index:2}',
      // dialogs (BasicDialog): black glass box in the middle
      '.ivf-dd-dlg{position:absolute;inset:0;z-index:10;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}',
      '.ivf-dd-box{width:' + v(560) + ';max-width:90vw;max-height:86%;box-sizing:border-box;padding:' + v(20) + ';border-radius:' + v(16) + ';background:#000;',
      'border:1px solid rgba(255,255,255,.15);display:flex;flex-direction:column;gap:' + v(12) + ';overflow:hidden}',
      '.ivf-dd-box.small{width:' + v(360) + ';gap:' + v(4) + ';padding:' + v(16) + '}',
      '.ivf-dd-dtop{display:flex;align-items:center;gap:' + v(24) + '}',
      '.ivf-dd-dtitle{flex:1;font-size:' + v(22) + ';font-weight:600;line-height:1.25}',
      '.ivf-dd-req{flex:none;height:' + v(40) + ';padding:0 ' + v(20) + ';border:0;border-radius:999px;background:rgba(14,14,14,.9);color:#d1d5db;font:inherit;',
      'font-size:' + v(14) + ';font-weight:500;cursor:pointer;outline:none;transition:transform .12s}',
      '.ivf-dd-req:focus,.ivf-dd-req:hover{background:#d1d5db;color:#131414;transform:scale(1.1)}',
      '.ivf-dd-req[disabled]{opacity:.45;cursor:default;transform:none}',
      // season / profile tiles (SeasonTile): outlined, white when selected, grey fill when ticked
      '.ivf-dd-tile{display:flex;align-items:center;gap:' + v(8) + ';height:' + v(56) + ';padding:0 ' + v(12) + ';box-sizing:border-box;border-radius:' + v(12) + ';',
      'border:1px solid rgba(255,255,255,.18);background:transparent;color:#d1d5db;font:inherit;text-align:left;cursor:pointer;outline:none;transition:transform .12s}',
      '.ivf-dd-tile.on{background:rgba(255,255,255,.16)}',
      '.ivf-dd-tile:focus,.ivf-dd-tile:hover{background:#d1d5db;color:#131414;border-color:#fff;transform:scale(1.04)}',
      '.ivf-dd-tile[disabled]{color:rgba(255,255,255,.5);cursor:default;transform:none;background:transparent;border-color:rgba(255,255,255,.18)}',
      '.ivf-dd-tile .t{flex:1;min-width:0}',
      '.ivf-dd-tile .n{display:block;font-size:' + v(14) + ';font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-dd-tile .s{display:block;font-size:' + v(12) + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-dd-tile .material-icons{font-size:' + v(20) + ';color:inherit}',
      '.ivf-dd-tile .ok{color:#4caf50}',
      '.ivf-dd-hr{height:1px;background:rgba(255,255,255,.15);flex:none}',
      '.ivf-dd-shead{display:flex;align-items:center}',
      '.ivf-dd-shead span{flex:1;font-size:' + v(22) + ';font-weight:600}',
      '.ivf-dd-seasons{display:flex;flex-wrap:wrap;justify-content:center;gap:' + v(8) + ';overflow-y:auto;scrollbar-width:none;padding:' + v(4) + '}',
      '.ivf-dd-seasons::-webkit-scrollbar{display:none}',
      '.ivf-dd-third{width:calc((100% - ' + v(16) + ') / 3)}',
      '.ivf-dd-note{font-size:' + v(13) + ';opacity:.8}',
      '.ivf-dd-note.err{color:#ff8a80;opacity:1}',
      // option list (DialogPopup)
      '.ivf-dd-opt{display:flex;align-items:center;gap:' + v(10) + ';padding:' + v(10) + ' ' + v(12) + ';border:0;border-radius:' + v(8) + ';background:transparent;color:#d1d5db;',
      'font:inherit;font-size:' + v(15) + ';text-align:left;cursor:pointer;outline:none}',
      '.ivf-dd-opt:focus,.ivf-dd-opt:hover{background:#d1d5db;color:#131414}',
      '.ivf-dd-opt .material-icons{font-size:' + v(18) + ';width:' + v(18) + ';color:inherit}',
      '.ivf-dd-opt small{display:block;opacity:.7;font-size:' + v(12) + '}',
      '.ivf-dd-full{overflow-y:auto;scrollbar-width:none;font-size:' + v(15) + ';line-height:1.5;outline:none}',
      '.ivf-dd-full::-webkit-scrollbar{display:none}'
    ].join('');
  }

  var details = [];  // open details pages, newest last: { el, from (element to return to), data, type }
  var dialogs = [];  // open dialogs over the top details page, newest last
  function topDetail() { return details[details.length - 1] || null; }
  function topDialog() { return dialogs[dialogs.length - 1] || null; }
  function icon(n) { return '<span class="material-icons" aria-hidden="true">' + n + '</span>'; }

  function fmtRuntime(min) {
    if (!min) return '';
    var h = Math.floor(min / 60), m = Math.round(min % 60);
    return h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm';
  }
  function fmtDate(s) {
    if (!s) return '';
    var d = new Date(s.length === 10 ? s + 'T00:00:00' : s);
    return isNaN(d) ? s : d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
  }
  function certification(m) {
    var res = (m.releases && m.releases.results) || [];
    function pick(cc) { for (var i = 0; i < res.length; i++) if (res[i].iso_3166_1 === cc) return res[i]; return null; }
    var r = pick('GB') || pick('US') || res[0];
    var c = '';
    ((r && r.release_dates) || []).some(function (x) { c = x.certification; return !!c; });
    return c;
  }
  function tvCertification(t) {
    var res = (t.contentRatings && t.contentRatings.results) || [];
    for (var i = 0; i < res.length; i++) if (res[i].iso_3166_1 === 'GB') return res[i].rating;
    for (i = 0; i < res.length; i++) if (res[i].iso_3166_1 === 'US') return res[i].rating;
    return '';
  }
  function names(list) {
    var seen = {}, out = [];
    (list || []).forEach(function (x) { var n = x && x.name; if (n && !seen[n]) { seen[n] = 1; out.push(n); } });
    return out;
  }
  // Seerr media status: 1 unknown, 2 pending, 3 processing, 4 partly available, 5 available, 6 blocklisted, 7 deleted
  function availability(d) { return (d.mediaInfo && d.mediaInfo.status) || 1; }

  // "Downloading 42% · 12m left" (Android seerrDownloadProgressText)
  // ---- download progress next to the Pending button (Android seerrDownloadProgressText) ---------
  // "Downloading 42% · 12 min left" / "Queued" / "Paused" / "Importing", summed over all files.
  // Items: { size, left (bytes), status, secs (time left) }.
  function arrSecs(t) { // Radarr/Sonarr timeLeft "hh:mm:ss" or "d.hh:mm:ss"
    var m = /^(?:(\d+)\.)?(\d+):(\d+):(\d+)/.exec(t || '');
    return m ? (+(m[1] || 0)) * 86400 + (+m[2]) * 3600 + (+m[3]) * 60 + (+m[4]) : 0;
  }
  function fmtSecsLeft(s) { // Android formatSecondsLeft
    var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return h >= 24 ? Math.floor(h / 24) + 'd ' + (h % 24) + 'h' : h > 0 ? h + 'h ' + m + 'm' : m > 0 ? m + ' min' : '<1 min';
  }
  function progressFrom(items) {
    if (!items || !items.length) return '';
    var size = 0, left = 0, secs = 0, st = [];
    items.forEach(function (x) { size += x.size || 0; left += x.left || 0; secs = Math.max(secs, x.secs || 0); if (x.status) st.push(String(x.status).toLowerCase().replace(/\s+/g, '')); });
    function all(f) { return st.length && st.every(f); }
    var label = all(function (s) { return s === 'paused'; }) ? 'Paused'
      : all(function (s) { return s === 'queued' || s === 'delay'; }) ? 'Queued'
      : st.some(function (s) { return s === 'importpending' || s === 'importing'; }) && left === 0 ? 'Importing' : 'Downloading';
    var count = items.length > 1 ? ' ' + items.length + ' files' : '';
    if (size <= 0) return label + count;
    var pct = Math.max(0, Math.min(100, Math.floor((size - left) * 100 / size + 1e-6)));
    return label + count + ' ' + pct + '%' + (label === 'Downloading' && secs > 0 ? ' · ' + fmtSecsLeft(secs) + ' left' : '');
  }
  // From Seerr (refreshed by Seerr every minute, but Jellyfin Enhanced caches it for 10 minutes)
  function progressText(info) {
    var items = (info && info.downloadStatus && info.downloadStatus.length ? info.downloadStatus : info && info.downloadStatus4k) || [];
    return progressFrom(items.map(function (x) { return { size: x.size, left: x.sizeLeft, status: x.status, secs: arrSecs(x.timeLeft) }; }));
  }
  // Live, straight from Radarr/Sonarr through Jellyfin Enhanced's download queue (what its
  // Downloads page uses): the items for this title. Resolves to null if the queue can't be read.
  function liveProgress(d) {
    return ApiClient.ajax({ type: 'GET', url: ApiClient.getUrl('/JellyfinEnhanced/arr/queue'), dataType: 'json' }).then(function (r) {
      var tvdb = d.data && d.data.externalIds && d.data.externalIds.tvdbId;
      var mine = ((r && r.items) || []).filter(function (x) {
        var isTv = /series|episode|sonarr|tv/i.test((x.type || '') + ' ' + (x.source || ''));
        if (d.type === 'tv' ? !isTv : isTv) return false;
        return String(x.tmdbId) === String(d.id) || (tvdb && String(x.tvdbId) === String(tvdb));
      });
      return progressFrom(mine.map(function (x) {
        var size = x.totalSize || 0;
        return { size: size, left: x.sizeRemaining != null ? x.sizeRemaining : size * (1 - (x.progress || 0) / 100), status: x.status, secs: arrSecs(x.timeRemaining) };
      }));
    }, function () { return null; });
  }
  // Android needsSeerrStatusPolling: keep re-checking while it is on its way
  function needsPolling(info) {
    if (!info || info.status === 5) return false;
    return (info.status >= 2 && info.status <= 4) || !!(info.requests && info.requests.length);
  }
  function setProgress(d, text) {
    d.progress = text || '';
    var btns = d.el.querySelector('.ivf-dd-btns'); if (!btns) return;
    var span = btns.querySelector('.ivf-dd-progress:not(.ivf-dd-gone)');
    if (!text) { if (span) span.remove(); return; }
    if (!span) {
      span = document.createElement('span'); span.className = 'ivf-dd-progress';
      var first = btns.querySelector('.ivf-dd-btn');
      if (first && first.nextSibling) btns.insertBefore(span, first.nextSibling); else btns.appendChild(span);
    }
    span.textContent = text;
  }
  // Every 20 s while requested / downloading (Android SEERR_STATUS_POLL_MS): live progress; every
  // minute also Seerr's status, so Pending turns into Go to once it is in the library.
  function startPolling(d) {
    var tick = 0;
    function step() {
      if (details.indexOf(d) < 0) { clearInterval(d.poll); return; }
      if (!d.data || !needsPolling(d.data.mediaInfo)) return;
      tick++;
      liveProgress(d).then(function (t) { if (details.indexOf(d) >= 0) setProgress(d, t || progressText(d.data.mediaInfo)); }); // the live queue leaves out stuck items (no size yet) that Seerr still lists
      if (tick % 3 === 0) get(d.type + '/' + d.id).then(function (data) {
        if (details.indexOf(d) < 0) return;
        var before = availability(d.data); d.data = data;
        if (availability(data) !== before) renderDetails(d, false);
        checkCancel(d);
      }, function () {});
    }
    d.poll = setInterval(step, 20000);
    step();
  }

  function openDetails(id, type, from) {
    if (!id || !type) return;
    var el = document.createElement('div');
    el.className = 'ivf-dd';
    // (no Back button of its own on the web: the top bar's Back arrow already closes it - two arrows
    // one above the other looked like a mistake)
    el.innerHTML = '<div class="ivf-dd-bd"><div></div></div>' +
      '<div class="ivf-dsc-scroll"><div class="ivf-dd-msg">Loading…</div></div>';
    root.appendChild(el);
    var d = { el: el, from: from || document.activeElement, id: id, type: type, data: null };
    details.push(d);
    loadDetails(d, true);
  }

  function loadDetails(d, first) {
    var type = d.type, id = d.id;
    get(type + '/' + id).then(function (data) {
      if (details.indexOf(d) < 0) return;
      d.data = data;
      renderDetails(d, first);
      checkCancel(d);
      if (first) startPolling(d);
      if (!first) return;
      // ratings, then the rows, as they arrive
      get(type === 'movie' ? 'movie/' + id + '/ratingscombined' : 'tv/' + id + '/ratings').then(function (r) {
        var rt = r && (r.rt || (r.criticsScore != null || r.audienceScore != null ? r : null));
        if (!rt) return;
        d.rating = { critic: rt.criticsScore, audience: type === 'movie' && rt.audienceScore != null ? rt.audienceScore / 10 : null };
        var q = d.el.querySelector('.ivf-dd-quick');
        if (q) q.innerHTML = quickHtml(d);
      }, function () {});
      ['similar', 'recommendations'].forEach(function (rel) {
        get(type + '/' + id + '/' + rel, { page: 1 }).then(function (res) {
          var items = ((res && res.results) || []).filter(function (i) { return i.posterPath; });
          var row = d.el.querySelector('.ivf-dd-rel-' + rel);
          if (!row || !items.length) return;
          row.querySelector('.ivf-dsc-strip').innerHTML = items.map(function (i) { return cardHtml(i, type); }).join('');
          attachItems(row, items);
          row.style.display = '';
        }, function () {});
      });
    }, function () {
      if (details.indexOf(d) < 0) return;
      d.el.querySelector('.ivf-dsc-scroll').innerHTML = '<div class="ivf-dd-msg">Couldn\'t load this title.</div>';
    });
  }

  function quickHtml(d) {
    var m = d.data, bits = [];
    if (d.type === 'movie') {
      if (m.releaseDate) bits.push(esc(fmtDate(m.releaseDate)));
      if (m.runtime) bits.push(fmtRuntime(m.runtime));
      var c = certification(m); if (c) bits.push(esc(c));
    } else {
      if (m.firstAirDate) bits.push(esc(fmtDate(m.firstAirDate)));
      var rt = (m.episodeRunTime || []).filter(function (x) { return x > 0; });
      if (rt.length) bits.push(fmtRuntime(rt.reduce(function (a, b) { return a + b; }, 0) / rt.length));
      var tc = tvCertification(m); if (tc) bits.push(esc(tc));
      if (m.numberOfSeasons) bits.push(m.numberOfSeasons + (m.numberOfSeasons === 1 ? ' season' : ' seasons'));
    }
    var r = d.rating;
    if (r && r.audience != null) bits.push(r.audience.toFixed(1) + '★');
    else if (!r && m.voteAverage) bits.push(m.voteAverage.toFixed(1) + '★');
    if (r && r.critic != null) bits.push(r.critic + '%' + tomato(r.critic >= 60));
    return bits.join('<span class="dot">•</span>');
  }

  // Rotten Tomatoes mark drawn inline (TVs have no emoji font): red tomato when fresh, green splat when rotten
  function tomato(fresh) {
    return '<svg class="ivf-dd-tomato" viewBox="0 0 24 24" aria-hidden="true">' + (fresh
      ? '<circle cx="12" cy="13.5" r="9" fill="#fa320a"/><path d="M8 4.5l2.5 2L12 3.5l1.5 3L16 4.5l-1 3.5H9z" fill="#00912d"/>'
      : '<path d="M12 2.5l2.2 4.8 5.3-1.6-2.4 5 4.4 3.1-5.3 1.1.6 5.4-4.8-2.6-4.8 2.6.6-5.4-5.3-1.1 4.4-3.1-2.4-5 5.3 1.6z" fill="#0ac55a"/>') + '</svg>';
  }

  function buttonsHtml(d) {
    var a = availability(d.data), h = '';
    function btn(act, ic, label, disabled) {
      return '<button type="button" class="ivf-dd-btn" data-act="' + act + '"' + (disabled ? ' disabled' : '') + '>' + icon(ic) + '<span class="lbl">' + label + '</span></button>';
    }
    if (a === 2 || a === 3) h += btn(d.type === 'tv' ? 'request' : 'none', 'schedule', 'Pending');
    else if (a === 4 || a === 5) h += btn('goto', 'play_arrow', 'Go to');
    else if (a === 6) h += btn('none', 'block', 'Unavailable', true);
    else h += btn('request', 'download', 'Request');
    var p = d.progress || progressText(d.data.mediaInfo);
    if (p) h += '<span class="ivf-dd-progress">' + esc(p) + '</span>';
    if (a === 4) h += btn('request', 'download', 'Request');
    if (d.canCancel) h += btn('cancel', 'delete', 'Cancel');
    // Trailers open YouTube: web only (the Samsung app can't play them)
    var trailer = !TV && (d.data.relatedVideos || []).filter(function (v) { return v.site === 'YouTube' && v.type === 'Trailer'; })[0];
    if (trailer) h += btn('trailer', 'movie', 'Trailer');
    return h;
  }

  function renderDetails(d, first) {
    var m = d.data, isMovie = d.type === 'movie', title = isMovie ? m.title : m.name;
    var jf = m.mediaInfo && m.mediaInfo.jellyfinMediaId;
    var crew = (m.credits && m.credits.crew) || [];
    var groups = isMovie ? [
      ['Director', 'Directors', names(crew.filter(function (c) { return c.job === 'Director'; }))],
      ['Writer', 'Writers', names(crew.filter(function (c) { return c.department === 'Writing'; }))],
      ['Studio', 'Studios', names(m.productionCompanies)],
      ['Genre', 'Genres', names(m.genres)]
    ] : [
      ['Writer', 'Writers', names(m.createdBy)],
      ['Studio', 'Studios', names(m.networks)],
      ['Genre', 'Genres', names(m.genres)]
    ];
    var people = ((m.credits && m.credits.cast) || []).slice(0, 30).map(function (c) { return { id: c.id, name: c.name, role: c.character, img: c.profilePath }; })
      .concat(crew.filter(function (c) { return c.job === 'Director' || c.department === 'Writing' || c.job === 'Producer'; }).slice(0, 12)
        .map(function (c) { return { id: c.id, name: c.name, role: c.job, img: c.profilePath }; }));
    var h = '<div class="ivf-dd-head">' +
      (jf ? '<img class="ivf-dd-logo" alt="" src="' + ApiClient.getUrl('/Items/' + jf + '/Images/Logo', { maxHeight: 240 }) + '">' : '') +
      '<h1 class="ivf-dd-title"' + (jf ? ' style="display:none"' : '') + '>' + esc(title) + '</h1>' +
      '<div class="ivf-dd-quick">' + quickHtml(d) + '</div>' +
      '<div class="ivf-dd-btns">' + buttonsHtml(d) + '</div>' +
      (m.tagline ? '<div class="ivf-dd-tag">' + esc(m.tagline) + '</div>' : '') +
      (m.overview ? '<button type="button" class="ivf-dd-ov"><span>' + esc(m.overview) + '</span></button>' : '') +
      '<div class="ivf-dd-group">' + groups.filter(function (g) { return g[2].length; }).map(function (g) {
        return '<div><b>' + (g[2].length === 1 ? g[0] : g[1]) + '</b><span>' + esc(g[2].join(', ')) + '</span></div>';
      }).join('') + '</div></div>' +
      (people.length ? '<section class="ivf-dsc-row"><h3>Cast &amp; Crew</h3><div class="ivf-dsc-strip">' + people.map(function (p) {
        var ini = (p.name || '?').split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('');
        return '<button type="button" class="ivf-dd-person"' + (p.id ? ' data-pid="' + p.id + '" data-pname="' + esc(p.name) + '"' : '') + '><div class="ivf-dd-face"' + (p.img ? ' style="background-image:url(\'' + IMG + 'w185' + p.img + '\')"' : '') + '>' +
          (p.img ? '' : '<i>' + esc(ini) + '</i>') + '</div><div class="ivf-dd-pname">' + esc(p.name) + '</div>' +
          (p.role ? '<div class="ivf-dd-prole">' + esc(p.role) + '</div>' : '') + '</button>';
      }).join('') + '</div></section>' : '') +
      '<section class="ivf-dsc-row ivf-dd-rel-similar" style="display:none"><h3>More Like This</h3><div class="ivf-dsc-strip"></div></section>' +
      '<section class="ivf-dsc-row ivf-dd-rel-recommendations" style="display:none"><h3>Recommended</h3><div class="ivf-dsc-strip"></div></section>';
    var scroll = d.el.querySelector('.ivf-dsc-scroll');
    if (first) {
      scroll.innerHTML = h;
      var logo = scroll.querySelector('.ivf-dd-logo');
      if (logo) logo.onerror = function () { logo.remove(); scroll.querySelector('.ivf-dd-title').style.display = ''; };
      // backdrop
      if (m.backdropPath) {
        var url = IMG + 'w1280' + m.backdropPath, img = new Image();
        img.onload = function () { var bd = d.el.querySelector('.ivf-dd-bd'); bd.firstChild.style.backgroundImage = 'url("' + url + '")'; bd.classList.add('on'); };
        img.src = url;
      }
      wireDetails(d);
      if (TV) { var b = scroll.querySelector('.ivf-dd-btn'); if (b) focusEl(b); }
    } else {
      // after a request: only the status, buttons and progress change
      var focusedAct = document.activeElement && document.activeElement.getAttribute && document.activeElement.getAttribute('data-act');
      d.el.querySelector('.ivf-dd-btns').innerHTML = buttonsHtml(d);
      if (TV || focusedAct) { var nb = d.el.querySelector('.ivf-dd-btn:not([disabled])') || d.el.querySelector('.ivf-dd-ov'); if (nb) nb.focus({ preventScroll: true }); }
    }
  }

  function wireDetails(d) {
    d.el.addEventListener('click', function (e) {
      var b = e.target.closest('.ivf-dd-btn[data-act]');
      if (b && !b.disabled) {
        var act = b.getAttribute('data-act');
        if (act === 'request') openRequest(d);
        else if (act === 'goto') goTo(d);
        else if (act === 'cancel') cancelRequest(d);
        else if (act === 'trailer') {
          var t = (d.data.relatedVideos || []).filter(function (v) { return v.site === 'YouTube' && v.type === 'Trailer'; })[0];
          if (t) window.open(t.url, '_blank', 'noopener');
        }
        return;
      }
      if (e.target.closest('.ivf-dd-ov')) { openOverview(d); return; }
      var p = e.target.closest('.ivf-dd-person[data-pid]');
      if (p) openPerson(+p.getAttribute('data-pid'), p.getAttribute('data-pname'), p);
    });
  }

  // ---- Cancel request (Android ExpandableDiscoverButtons "Cancel") -----------------------------------
  // Enhanced's Seerr proxy can't delete requests, so this goes to the IvanaFin Seerr helper on the server
  // PC (jellyfin-web-custom/server/seerr-helper, port 5056). It checks the Jellyfin sign-in, applies Seerr's
  // rule (admins / request managers: any request; others: their own pending one) and also stops the
  // download in Radarr/Sonarr (user 2026-11-19). No helper (another server): no Cancel button.
  function helper(method, path, body) {
    var host = location.hostname;
    try { host = new URL(ApiClient.serverAddress()).hostname || host; } catch (e) {}
    return fetch('http://' + host + ':5056' + path, {
      method: method, body: body ? JSON.stringify(body) : undefined,
      headers: { 'Authorization': 'MediaBrowser Token="' + ApiClient.accessToken() + '"', 'Content-Type': 'application/json' }
    }).then(function (r) { return r.json().then(function (j) { if (!r.ok) throw j; return j; }); });
  }
  function checkCancel(d) {
    var info = d.data && d.data.mediaInfo;
    function set(can) { if (!!can === !!d.canCancel || details.indexOf(d) < 0) return; d.canCancel = !!can; renderDetails(d, false); }
    if (!info || info.status === 5 || !(info.requests || []).length) { set(false); return; }
    helper('GET', '/can-cancel?type=' + d.type + '&tmdbId=' + d.id).then(function (r) { set(r && r.can); }, function () { set(false); });
  }
  function cancelRequest(d) {
    var b = d.el.querySelector('.ivf-dd-btn[data-act="cancel"]'); if (b) b.disabled = true;
    var old = d.el.querySelector('.ivf-dd-cancel-msg'); if (old) old.remove();
    helper('POST', '/cancel', { type: d.type, tmdbId: d.id }).then(function () {
      markCancelled(d.type, d.id, true);
      if (details.indexOf(d) < 0) return;
      d.canCancel = false; d.progress = null;
      loadDetails(d, false); // Request again (or Partly available for a show that had seasons)
    }, function (err) {
      if (details.indexOf(d) < 0) return;
      if (b) b.disabled = false;
      var btns = d.el.querySelector('.ivf-dd-btns');
      if (btns) btns.insertAdjacentHTML('beforeend', '<span class="ivf-dd-progress ivf-dd-cancel-msg">' + esc((err && err.message) || 'Couldn\'t cancel.') + '</span>');
    });
  }

  // ---- Person page (Android DiscoverPersonPage): "Discover: <name>" over a grid of everything they were
  // in or made (Seerr combined credits), newest first; a poster opens its details page as usual.
  function openPerson(id, name, from) {
    if (!id) return;
    var el = document.createElement('div');
    el.className = 'ivf-dd ivf-dp';
    el.innerHTML = '<div class="ivf-dsc-scroll"><h1 class="ivf-dp-title">Discover: ' + esc(name || '') + '</h1>' +
      '<div class="ivf-dsc-grid"></div><div class="ivf-dd-msg">Loading…</div></div>';
    root.appendChild(el);
    var d = { el: el, from: from || document.activeElement, person: id };
    details.push(d);
    get('person/' + id + '/combined_credits').then(function (r) {
      if (details.indexOf(d) < 0) return;
      var seen = {};
      var items = ((r && r.cast) || []).concat((r && r.crew) || []).filter(function (i) {
        var k = (i.mediaType || '') + ':' + i.id;
        return i.posterPath && (i.mediaType === 'movie' || i.mediaType === 'tv') && !seen[k] && (seen[k] = 1);
      });
      items.sort(function (a, b) { var x = a.releaseDate || a.firstAirDate || '', y = b.releaseDate || b.firstAirDate || ''; return x < y ? 1 : x > y ? -1 : 0; });
      var grid = el.querySelector('.ivf-dsc-grid'), msg = el.querySelector('.ivf-dd-msg');
      grid.innerHTML = items.map(function (i) { return cardHtml(i, i.mediaType, STATUS[i.mediaInfo && i.mediaInfo.status]); }).join('');
      attachItems(grid, items);
      if (items.length) msg.remove(); else msg.textContent = 'No results';
      if (TV && items.length) focusEl(grid.querySelector('.ivf-dsc-card'));
    }, function () {
      if (details.indexOf(d) >= 0) el.querySelector('.ivf-dd-msg').textContent = 'Couldn\'t load this person.';
    });
  }

  // Go to: the title's own page in the library; Back from there reopens Discover (home-grid.js)
  function goTo(d) {
    var jf = d.data.mediaInfo && d.data.mediaInfo.jellyfinMediaId;
    if (!jf) return;
    // Seerr can still list a title that has since left the library: check first, or the web would
    // sit on a spinner forever
    ApiClient.getItem(ApiClient.getCurrentUserId(), jf).then(function () {
      try { sessionStorage.setItem('ivf-return-discover', '1'); } catch (x) {}
      // a plain hash change: home-grid.js sees it (hashchange) and puts Discover away
      location.hash = '#/details?id=' + jf + '&serverId=' + (ApiClient.serverId ? ApiClient.serverId() : '');
    }, function () {
      var btns = d.el.querySelector('.ivf-dd-btns');
      if (btns && !btns.querySelector('.ivf-dd-gone')) btns.insertAdjacentHTML('beforeend', '<span class="ivf-dd-progress ivf-dd-gone">Not in the library any more</span>');
    });
  }

  function closeTop() {
    var dlg = topDialog();
    if (dlg) {
      dialogs.pop(); dlg.el.remove();
      if (dlg.from && document.contains(dlg.from)) dlg.from.focus({ preventScroll: true });
      return true;
    }
    var d = details.pop();
    if (!d) return false;
    clearInterval(d.poll);
    d.el.remove();
    var back = d.from && document.contains(d.from) ? d.from : null;
    if (back) focusEl(back);
    else if (tabsEl) tabsEl.children[tab].focus();
    return true;
  }
  function closeAllDetails() {
    details.forEach(function (x) { clearInterval(x.poll); });
    dialogs.forEach(function (x) { x.el.remove(); }); dialogs = [];
    details.forEach(function (x) { x.el.remove(); }); details = [];
  }

  function openDialog(boxHtml, cls) {
    var d = topDetail();
    var el = document.createElement('div');
    el.className = 'ivf-dd-dlg';
    el.innerHTML = '<div class="ivf-dd-box' + (cls ? ' ' + cls : '') + '">' + boxHtml + '</div>';
    el.addEventListener('click', function (e) { if (e.target === el) closeTop(); }); // click outside closes (web)
    (d ? d.el : root).appendChild(el);
    var dlg = { el: el, from: document.activeElement };
    dialogs.push(dlg);
    return dlg;
  }

  // Full overview (ItemDetailsDialog): title, text, genres
  function openOverview(d) {
    var m = d.data;
    var g = names(m.genres);
    var dlg = openDialog('<div class="ivf-dd-dtitle">' + esc(m.title || m.name) + '</div>' +
      '<div class="ivf-dd-full" tabindex="-1">' + esc(m.overview || '') + (g.length ? '<p class="ivf-dd-note">' + esc(g.join(', ')) + '</p>' : '') + '</div>');
    dlg.el.querySelector('.ivf-dd-full').focus({ preventScroll: true });
  }

  // ---- request dialog (Android RequestMovie / RequestSeasons, IvanaFin one-screen layout) ----------
  var reqCache = {}; // 'movie'|'tv' -> { server, profiles }
  function requestOptions(type) {
    if (reqCache[type]) return Promise.resolve(reqCache[type]);
    var JE = window.JellyfinEnhanced, api = JE && JE.jellyseerrAPI;
    if (!api || !api.fetchAdvancedRequestData) return Promise.resolve({ server: null, profiles: [] });
    return api.fetchAdvancedRequestData(type).then(function (res) {
      var servers = (res && res.servers) || [];
      var s = servers.filter(function (x) { return x.isDefault && !x.is4k; })[0] || servers.filter(function (x) { return !x.is4k; })[0] || null;
      var out = { server: s, profiles: (s && s.qualityProfiles) || [] };
      if (s) reqCache[type] = out;
      return out;
    }, function () { return { server: null, profiles: [] }; });
  }

  function profileTileHtml(st) {
    var p = st.profile;
    if (!p) return '';
    var isDef = st.server && p.id === st.server.activeProfileId;
    return '<button type="button" class="ivf-dd-tile ivf-dd-prof"><span class="t"><span class="n">Quality profile</span><span class="s">' +
      esc(p.name + (isDef ? ' (Default)' : '')) + '</span></span>' + icon('arrow_drop_down') + '</button>';
  }

  function openRequest(d) {
    var m = d.data, isMovie = d.type === 'movie';
    var dlg = openDialog('<div class="ivf-dd-note">Loading…</div>');
    var box = dlg.el.querySelector('.ivf-dd-box');
    requestOptions(d.type).then(function (opt) {
      if (dialogs.indexOf(dlg) < 0) return;
      var st = { server: opt.server, profiles: opt.profiles, profile: null, selected: {} };
      st.profile = opt.profiles.filter(function (p) { return opt.server && p.id === opt.server.activeProfileId; })[0] || opt.profiles[0] || null;
      var title = isMovie ? m.title + (m.releaseDate ? ' (' + m.releaseDate.slice(0, 4) + ')' : '') : m.name;
      var seasons = isMovie ? [] : seasonRows(m);
      var h = '<div class="ivf-dd-dtop"><div class="ivf-dd-dtitle">' + esc(title) + '</div><button type="button" class="ivf-dd-req"' + (isMovie ? '' : ' disabled') + '>Request</button></div>' +
        '<div class="ivf-dd-profslot">' + profileTileHtml(st) + '</div>';
      if (!isMovie) {
        h += '<div class="ivf-dd-hr"></div><div class="ivf-dd-shead"><span>Seasons</span>' +
          '<button type="button" class="ivf-dd-tile ivf-dd-third ivf-dd-all"' + (seasons.some(function (s) { return s.editable; }) ? '' : ' disabled') + '><span class="t"><span class="n">Select all</span></span>' + icon('check_box_outline_blank') + '</button></div>' +
          '<div class="ivf-dd-seasons">' + seasons.map(function (s) {
            var ic = s.editable ? icon('check_box_outline_blank') : s.status === 5 ? '<span class="material-icons ok">check_circle</span>' : s.status === 4 ? icon('incomplete_circle') : icon('schedule');
            return '<button type="button" class="ivf-dd-tile ivf-dd-third ivf-dd-season' + (s.editable ? '' : ' on') + '" data-n="' + s.n + '"' + (s.editable ? '' : ' disabled') + '>' +
              '<span class="t"><span class="n">' + (s.n === 0 ? 'Specials' : 'Season ' + s.n) + '</span>' + (s.count ? '<span class="s">' + s.count + ' episodes</span>' : '') + '</span>' + ic + '</button>';
          }).join('') + '</div>';
      }
      h += '<div class="ivf-dd-note ivf-dd-status" style="display:none"></div>';
      box.innerHTML = h;
      var reqBtn = box.querySelector('.ivf-dd-req');
      function refreshSel() {
        var editable = seasons.filter(function (s) { return s.editable; });
        var any = false, allOn = editable.length > 0;
        Array.prototype.forEach.call(box.querySelectorAll('.ivf-dd-season:not([disabled])'), function (t) {
          var on = !!st.selected[t.getAttribute('data-n')];
          t.classList.toggle('on', on);
          t.querySelector('.material-icons').textContent = on ? 'check_box' : 'check_box_outline_blank';
          any = any || on; allOn = allOn && on;
        });
        var all = box.querySelector('.ivf-dd-all');
        if (all) { all.classList.toggle('on', allOn); all.querySelector('.material-icons').textContent = allOn ? 'check_box' : 'check_box_outline_blank'; }
        if (!isMovie) reqBtn.disabled = !any;
      }
      box.addEventListener('click', function (e) {
        var t = e.target.closest('button'); if (!t || t.disabled) return;
        if (t.classList.contains('ivf-dd-season')) { var n = t.getAttribute('data-n'); st.selected[n] = !st.selected[n]; refreshSel(); }
        else if (t.classList.contains('ivf-dd-all')) {
          var turnOn = !t.classList.contains('on');
          seasons.forEach(function (s) { if (s.editable) st.selected[s.n] = turnOn; });
          refreshSel();
        } else if (t.classList.contains('ivf-dd-prof')) chooseProfile(st, function () {
          box.querySelector('.ivf-dd-profslot').innerHTML = profileTileHtml(st);
          box.querySelector('.ivf-dd-prof').focus({ preventScroll: true });
        });
        else if (t === reqBtn) submitRequest(d, dlg, st, seasons);
      });
      // open with Quality profile selected (Android), else the first season / Request
      var first = box.querySelector('.ivf-dd-prof') || box.querySelector('.ivf-dd-season:not([disabled])') || reqBtn;
      if (TV && first) first.focus({ preventScroll: true });
    });
  }

  // Seasons with their state: already available / requested ones can't be picked again
  function seasonRows(t) {
    var info = t.mediaInfo || {}, status = {}, requested = {};
    (info.seasons || []).forEach(function (s) { status[s.seasonNumber] = s.status; });
    (info.requests || []).forEach(function (r) {
      if (r.status === 3) return; // declined
      (r.seasons || []).forEach(function (s) { requested[s.seasonNumber] = true; });
    });
    var rows = (t.seasons || []).map(function (s) {
      var st = status[s.seasonNumber] || (requested[s.seasonNumber] ? 2 : 1);
      return { n: s.seasonNumber, count: s.episodeCount, status: st, editable: st === 1 || st === 7 };
    });
    // Specials last (like the show page's season picker)
    return rows.filter(function (s) { return s.n !== 0; }).concat(rows.filter(function (s) { return s.n === 0; }));
  }

  function chooseProfile(st, done) {
    var dlg = openDialog('<div class="ivf-dd-dtitle" style="padding:0 0 calc(var(--ivf-dp) * 6) calc(var(--ivf-dp) * 8)">Quality profile</div>' +
      st.profiles.map(function (p, i) {
        var isDef = st.server && p.id === st.server.activeProfileId;
        return '<button type="button" class="ivf-dd-opt" data-i="' + i + '">' + icon(p === st.profile ? 'radio_button_checked' : 'radio_button_unchecked') +
          '<span>' + esc(p.name) + (isDef ? '<small>Default</small>' : '') + '</span></button>';
      }).join(''), 'small');
    dlg.el.addEventListener('click', function (e) {
      var o = e.target.closest('.ivf-dd-opt'); if (!o) return;
      st.profile = st.profiles[+o.getAttribute('data-i')];
      closeTop();
      done();
    });
    var sel = dlg.el.querySelector('.ivf-dd-opt[data-i="' + st.profiles.indexOf(st.profile) + '"]') || dlg.el.querySelector('.ivf-dd-opt');
    if (sel) sel.focus({ preventScroll: true });
  }

  function submitRequest(d, dlg, st, seasons) {
    var JE = window.JellyfinEnhanced, api = JE && JE.jellyseerrAPI;
    var note = dlg.el.querySelector('.ivf-dd-status'), btn = dlg.el.querySelector('.ivf-dd-req');
    function say(t, err) { note.textContent = t; note.className = 'ivf-dd-note ivf-dd-status' + (err ? ' err' : ''); note.style.display = ''; }
    if (!api || !api.requestMedia) { say('Requests aren\'t available right now.', true); return; }
    var settings = {};
    if (st.server && st.profile) {
      settings.serverId = st.server.id;
      settings.profileId = st.profile.id;
      // Root folder: one Sonarr/Radarr actually has (like Android: the one matching Seerr's default,
      // else the first). Seerr's saved default can be a path the *arr can't see (it once said
      // "E:\TV Shows" while Sonarr in Docker only knows /data/media/tv) and the request then fails.
      var folders = (st.server.rootFolders || []).map(function (f) { return f && f.path; }).filter(Boolean);
      var folder = folders.indexOf(st.server.activeDirectory) >= 0 ? st.server.activeDirectory : folders[0];
      if (folder) settings.rootFolder = folder;
    }
    btn.disabled = true;
    say('Requesting…');
    var p = d.type === 'movie'
      ? api.requestMedia(d.id, 'movie', settings, false, d.data)
      : api.requestTvSeasons(d.id, seasons.filter(function (s) { return st.selected[s.n]; }).map(function (s) { return s.n; }), settings, d.data, false);
    Promise.resolve(p).then(function () {
      markCancelled(d.type, d.id, false); // requested again: show the real state
      if (dialogs.indexOf(dlg) >= 0) closeTop();
      loadDetails(d, false); // the button turns into Pending
    }, function (err) {
      btn.disabled = false;
      var code = err && (err.status || (err.response && err.response.status));
      var msg = err && (err.responseJSON && err.responseJSON.message || err.message);
      say(code === 403 ? 'You don\'t have permission to request this.' : 'Couldn\'t request' + (msg ? ': ' + msg : '.'), true);
    });
  }

  // ---- remote / keyboard: nearest focusable item in the pressed direction ------------------------
  // Only the top layer counts: an open dialog, else the open details page, else the Discover page
  function scope() {
    var dlg = topDialog(), d = topDetail();
    return dlg ? dlg.el : d ? d.el : root;
  }
  function focusables() {
    var sc = scope(), sel = sc === root ? '.ivf-dsc-tab, .ivf-dsc-card, .ivf-dsc-search input' : 'button:not([disabled])';
    return Array.prototype.filter.call(sc.querySelectorAll(sel), function (e) {
      return e.getClientRects().length && (sc !== root || !e.closest('.ivf-dd'));
    });
  }
  function nearest(from, dir) {
    var a = from.getBoundingClientRect(), ax = a.left + a.width / 2, ay = a.top + a.height / 2;
    var best = null, bestScore = Infinity;
    focusables().forEach(function (e) {
      if (e === from) return;
      var r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
      var dx = x - ax, dy = y - ay, along, across;
      // On a details page, Up/Down measure sideways distance edge to edge (0 when they overlap), so the
      // wide overview under the buttons comes before a cast photo whose centre happens to be nearer
      if (scope() !== root && (dir === 'u' || dir === 'd')) dx = r.right < a.left ? r.right - a.left : r.left > a.right ? r.left - a.right : 0;
      if (dir === 'r') { if (r.left < a.right - 2 || Math.abs(dy) > a.height / 2) return; along = dx; across = dy; }
      else if (dir === 'l') { if (r.right > a.left + 2 || Math.abs(dy) > a.height / 2) return; along = -dx; across = dy; }
      else if (dir === 'd') { if (r.top < a.bottom - 2) return; along = dy; across = dx; }
      else { if (r.bottom > a.top + 2) return; along = -dy; across = dx; }
      var score = along + Math.abs(across) * 2.5;
      if (score < bestScore) { bestScore = score; best = e; }
    });
    return best;
  }
  function focusEl(e) {
    e.focus({ preventScroll: true });
    // keep it on screen: horizontally within its row, vertically within the scroll area
    var strip = e.closest('.ivf-dsc-strip');
    if (strip) {
      var sr = strip.getBoundingClientRect(), er = e.getBoundingClientRect(), pad = sr.width * 0.06;
      if (er.left < sr.left + pad) strip.scrollLeft -= (sr.left + pad - er.left);
      else if (er.right > sr.right - pad) strip.scrollLeft += (er.right - sr.right + pad);
    }
    var scroll = e.closest('.ivf-dsc-scroll');
    if (scroll && e.closest('.ivf-dd-head')) scroll.scrollTop = 0; // details header: show it from the top
    else if (scroll && scroll.classList.contains('ivf-dsc-rows') && e.closest('.ivf-dsc-row')) {
      // Discover tab: the selected row moves up to sit right under the header (whole rows only)
      var rb = scroll.getBoundingClientRect(), rr = e.closest('.ivf-dsc-row').getBoundingClientRect();
      var sp = parseFloat(getComputedStyle(scroll).scrollPaddingTop) || 0;
      if (Math.abs(rr.top - rb.top - sp) > 1) scroll.scrollTop += rr.top - rb.top - sp;
    } else if (scroll) {
      var box = scroll.getBoundingClientRect(), r2 = (e.closest('.ivf-dsc-row') || e).getBoundingClientRect();
      if (r2.top < box.top) scroll.scrollTop -= (box.top - r2.top) + 8;
      else if (r2.bottom > box.bottom) scroll.scrollTop += (r2.bottom - box.bottom) + 8;
    }
  }
  // Up/Down into another row of posters: its first item, with the row scrolled back to the start
  // (user request 2026-11-11 - not the poster above/below, not the one last selected there)
  function rowStart(from, to, dir) {
    if (!to || (dir !== 'u' && dir !== 'd')) return to;
    var strip = to.closest('.ivf-dsc-strip');
    if (!strip || strip === (from && from.closest('.ivf-dsc-strip'))) return to;
    var first = strip.querySelector('button:not([disabled])');
    if (!first) return to;
    // jump straight back (the strips scroll smoothly; mid-scroll, focusEl would mis-measure)
    strip.style.scrollBehavior = 'auto';
    strip.scrollLeft = 0;
    strip.style.scrollBehavior = '';
    return first;
  }
  function onKey(e) {
    if (!shown || root.classList.contains('ivf-off')) return;
    if (document.querySelector('.je-more-info-modal, .jellyseerr-season-modal') || document.body.classList.contains('jellyseerr-modal-is-open')) return;
    var k = e.key || '', kc = e.keyCode;
    var dir = k === 'ArrowLeft' || kc === 37 ? 'l' : k === 'ArrowRight' || kc === 39 ? 'r' : k === 'ArrowUp' || kc === 38 ? 'u' : k === 'ArrowDown' || kc === 40 ? 'd' : '';
    var a = document.activeElement;
    var inside = a && root.contains(a);
    if ((k === 'Enter' || kc === 13) && inside && a.classList.contains('ivf-dsc-tab')) { e.preventDefault(); selectTab(+a.getAttribute('data-tab')); return; }
    if (!dir) return;
    // A details page or dialog is open: move within it only
    var sc = scope();
    if (sc !== root) {
      e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      var full = sc.querySelector('.ivf-dd-full'); // full overview: Up/Down scroll the text
      if (full) { if (dir === 'u' || dir === 'd') full.scrollTop += (dir === 'd' ? 1 : -1) * full.clientHeight * 0.6; return; }
      if (!a || !sc.contains(a) || a.disabled) { var f0 = focusables()[0]; if (f0) focusEl(f0); return; }
      var nt = rowStart(a, nearest(a, dir), dir);
      if (nt) focusEl(nt);
      return;
    }
    if (inside && a.tagName === 'INPUT' && (dir === 'l' || dir === 'r')) return; // caret moves in the search box
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    if (!inside) { tabsEl.children[tab].focus(); return; }
    var onTab = a.classList.contains('ivf-dsc-tab');
    // Down from the tabs: into the open tab's page (its search box or first title)
    if (onTab && dir === 'd') {
      var first = body.querySelector('.ivf-dsc-search input, .ivf-dsc-card');
      if (first) focusEl(first);
      return;
    }
    if (onTab && dir === 'u') return;
    var t = rowStart(a, nearest(a, dir), dir);
    // Up from the page into the tabs: always the open tab (not whichever tab is nearest)
    if (t && !onTab && t.classList.contains('ivf-dsc-tab')) t = tabsEl.children[tab];
    if (t) focusEl(t);
  }
  window.addEventListener('keydown', onKey, true);

  // ---- open / close (called by home-grid.js) -----------------------------------------------------
  // Web: the page starts below Jellyfin's header (the lowest visible one; there can be several)
  function headerBottom() {
    if (TV) return 0;
    var b = 0;
    // Jellyfin 12's web header is header.MuiAppBar-root; older layouts use .skinHeader
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root, header.MuiAppBar-root .MuiToolbar-root'), function (h) {
      if (!h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      b = Math.max(b, Math.round(h.getBoundingClientRect().bottom));
    });
    return b;
  }
  function placeBelowHeader() { if (root) root.style.setProperty('--ivf-dsc-top', headerBottom() + 'px'); }
  // The top bar can still be appearing / changing size after Discover opens (a page refresh reopens
  // Discover before the bar is drawn - it measured 0 and the tabs sat under the bar): follow its size.
  var watchedHeaders = [];
  var headerRO = typeof ResizeObserver !== 'undefined' ? new ResizeObserver(function () { placeBelowHeader(); }) : null;
  function watchHeader() {
    if (TV) return;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      if (watchedHeaders.indexOf(h) >= 0) return;
      watchedHeaders.push(h);
      if (headerRO) headerRO.observe(h);
    });
    placeBelowHeader();
  }
  window.addEventListener('resize', placeBelowHeader);
  window.IvfDiscover = {
    show: function () {
      if (typeof ApiClient === 'undefined') return false;
      if (!root) build();
      root.classList.remove('ivf-off');
      document.documentElement.classList.add('ivf-dsc-on');
      placeBelowHeader();
      watchHeader();
      [300, 1000, 2500].forEach(function (ms) { setTimeout(watchHeader, ms); }); // the bar may appear later
      shown = true;
      selectTab(tab);
      // TV: start on the first title of the first row (like Android), else the tabs
      if (TV) {
        var tries = 0;
        (function first() {
          var c = root.querySelector('.ivf-dsc-content .ivf-dsc-card');
          if (c) { focusEl(c); return; }
          if (++tries < 60) setTimeout(first, 50); else tabsEl.children[tab].focus();
        })();
      }
      return true;
    },
    hide: function () {
      if (!root) return;
      root.classList.add('ivf-off');
      document.documentElement.classList.remove('ivf-dsc-on');
      shown = false;
      closeAllDetails();
    },
    isShown: function () { return shown; },
    // Back: closes an open dialog or details page first, then goes from the content to the tabs;
    // returns true when it did (home-grid then stays)
    back: function () {
      if (!shown) return false;
      if (closeTop()) return true;
      var a = document.activeElement;
      if (a && root.contains(a) && !a.classList.contains('ivf-dsc-tab')) { tabsEl.children[tab].focus(); return true; }
      return false;
    },
    // the header's Back button: closes an open dialog / title page; false when there is none
    closeTop: function () { return shown && !!closeTop(); }
  };
  // a different user signs in: start Discover afresh
  document.addEventListener('viewshow', function () {
    var uid = typeof ApiClient !== 'undefined' && ApiClient.getCurrentUserId && ApiClient.getCurrentUserId();
    if (uid && window.IvfDiscover._uid && uid !== window.IvfDiscover._uid) { cache = {}; heroFor = null; tab = 0; reqCache = {}; closeAllDetails(); }
    window.IvfDiscover._uid = uid;
  });
  // Discover grids: mark a scrolled grid so its top fades out under the tabs (CSS .ivf-dsc-scd, beta round 6)
  document.addEventListener('scroll', function (e) {
    var t = e.target; if (!t || !t.classList || !t.classList.contains('ivf-dsc-scroll')) return;
    var on = t.scrollTop > 4; if (on !== t.classList.contains('ivf-dsc-scd')) t.classList.toggle('ivf-dsc-scd', on);
  }, true);
})();

} catch (e) { console.error('IvanaFin script discover-page failed:', e); } })();
/* IvanaFin - episodes-play-on-click */
(function() { try {
// IvanaFin parity (9): clicking an episode plays it (resuming where you left off) instead of
// opening the episode page. Uses jellyfin-web's own item actions: episode cards/list rows are
// switched from data-action="link" to "resume" and given their resume position. The menu
// button / long-press still opens the episode's options (including going to its page).
(function () {
  'use strict';
  var pending = {}; // episodeId -> true while its user data is being fetched

  function switchToResume(root, ticks) {
    var els = [root].concat(Array.prototype.slice.call(root.querySelectorAll('[data-action]')));
    els.forEach(function (el) {
      if (el.getAttribute('data-action') === 'link') el.setAttribute('data-action', 'resume');
      if (el === root || el.classList.contains('itemAction')) el.setAttribute('data-positionticks', String(ticks || 0));
    });
    // Elements with the itemAction class but no own data-action read the card's
    root.querySelectorAll('.itemAction').forEach(function (el) { el.setAttribute('data-positionticks', String(ticks || 0)); });
    root.setAttribute('data-ivf-play', '1');
  }

  function scan() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    var nodes = document.querySelectorAll('[data-type="Episode"][data-id]:not([data-ivf-play])');
    var byId = {};
    for (var i = 0; i < nodes.length; i++) {
      var n = nodes[i];
      // Only item cards / list rows that would navigate (not the player's queue etc.)
      if (!n.matches('.card, .listItem')) continue;
      var link = n.getAttribute('data-action') === 'link' || n.querySelector('[data-action="link"]');
      if (!link) { n.setAttribute('data-ivf-play', 'skip'); continue; }
      var id = n.getAttribute('data-id');
      (byId[id] = byId[id] || []).push(n);
    }
    var ids = Object.keys(byId).filter(function (id) { return !pending[id]; });
    if (!ids.length) return;
    ids.forEach(function (id) { pending[id] = true; });
    ApiClient.getItems(ApiClient.getCurrentUserId(), { Ids: ids.join(','), EnableUserData: true, EnableImages: false })
      .then(function (r) {
        var ticks = {};
        ((r && r.Items) || []).forEach(function (it) {
          var ud = it.UserData || {};
          ticks[it.Id] = ud.Played ? 0 : (ud.PlaybackPositionTicks || 0);
        });
        ids.forEach(function (id) {
          (byId[id] || []).forEach(function (n) { if (n.isConnected) switchToResume(n, ticks[id] || 0); });
        });
      })
      .catch(function () {})
      .then(function () { ids.forEach(function (id) { delete pending[id]; }); });
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
  ivfWatch(function () { scan(); }, 100);
  scan();
})();

} catch (e) { console.error('IvanaFin script episodes-play-on-click failed:', e); } })();
/* IvanaFin - home-grid */
(function() { try {
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
      ':root{--ivf-dp:calc(100vw / 960)}',
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
      'padding:0 calc(' + d + ' * 24);color:#fff;font-weight:700;line-height:1.15;text-shadow:0 calc(' + d + ' * 1) calc(' + d + ' * 3) rgba(0,0,0,.85),0 0 calc(' + d + ' * 16) rgba(0,0,0,.7)}' /* round 5: pale tile pictures */
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
    return list;
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
      '|' + (cfg.picks || []).join(',') + (cfg.games ? '|games' : '') + (dsc ? '|dsc' : '');
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
    // TV only: something must always be selected for the remote (web has a mouse - nothing preselected)
    if (TV && (wasHidden || !root.contains(document.activeElement))) {
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
  });
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

} catch (e) { console.error('IvanaFin script home-grid failed:', e); } })();
/* IvanaFin - home-tabs */
(function() { try {
// IvanaFin parity: no Home tabs at all. Home and Favourites are hidden on Home, and so is Jellyfin Enhanced's
// "Seerr Recommendations" tab ("+ Discover"): Discover is opened from its home-grid tile, which clicks
// that hidden tab (home-grid.js openDiscover), so the tab must stay in the page - only out of sight.
// Favourites is hidden as soon as Home shows (not only once Jellyfin Enhanced has added its tab),
// so the old "Home | Favourites" bar doesn't flash while the app starts.
(function () {
  'use strict';
  function onHome() {
    var h = location.hash || '';
    return h === '' || h === '#' || h === '#/' || /^#\/home(\.html)?(\?|$)/.test(h);
  }
  // Discover page: Jellyfin Enhanced's "Seerr Recommendations" title (logo + text) is replaced by a large
  // Search button at the top centre - Jellyfin's search page shows Seerr results to request too. Back
  // from that search returns to Discover (home-grid.js reads the ivf-return-discover flag).
  // A selected Discover film gets the white outline (its picture takes the focus, not the card).
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var css = document.createElement('style');
  css.textContent =
    // the title row only holds the Search button now: logo and text hidden, no sticky, little space
    // full width with no side padding (Enhanced pads only one side), so the button is truly centred
    '.je-recommendations-title{position:static !important;top:auto !important;display:flex !important;justify-content:center;align-items:center;' +
    'box-sizing:border-box;width:100% !important;font-size:0 !important;margin:0 !important;' +
    'padding:12px 0 !important;min-height:0 !important}' +
    '.je-recommendations-title > :not(.ivf-disc-search){display:none !important}' +
    '.ivf-disc-search{display:flex;align-items:center;justify-content:center;margin:0 auto;box-sizing:border-box;min-width:420px;padding:18px 56px;border:0;border-radius:999px;' +
    'background:rgba(255,255,255,.16);color:#fff;font:inherit;font-size:30px;font-weight:600;letter-spacing:normal;line-height:1.2;text-align:center;cursor:pointer;' +
    'transition:background .12s,color .12s,transform .12s}' +
    '.ivf-disc-search:hover,.ivf-disc-search:focus-visible' + (TV ? ',.ivf-disc-search:focus' : '') + '{background:#fff;color:#000;outline:none;transform:scale(1.05)}' +
    // the word "Search" sits exactly in the middle; the icon hangs to its left without shifting it
    '.ivf-disc-search .ivf-ds-label{position:relative;display:inline-block}' +
    '.ivf-disc-search .ivf-ds-icon{position:absolute;right:100%;top:50%;transform:translateY(-50%);margin-right:14px;font-size:38px;line-height:1;color:inherit}' +
    // selected Discover film: white outline outside the poster, like the library posters
    '.jellyseerr-card:focus-within .cardScalable{box-shadow:0 0 0 3px #fff !important;border-radius:calc(var(--ivf-dp,0.10417vw) * 4)}' +
    '.jellyseerr-card .cardImageContainer:focus{outline:none !important}';
  document.head.appendChild(css);
  function addDiscoverSearch() {
    var title = document.querySelector('.je-recommendations-title');
    if (!title || title.querySelector('.ivf-disc-search')) return;
    var b = document.createElement('button');
    b.type = 'button';
    b.className = 'ivf-disc-search';
    b.innerHTML = '<span class="ivf-ds-label"><span class="material-icons search ivf-ds-icon" aria-hidden="true"></span>Search</span>';
    b.addEventListener('click', function (e) {
      e.preventDefault(); e.stopPropagation();
      try { sessionStorage.setItem('ivf-return-discover', '1'); } catch (x) {}
      location.hash = '#/search';
    });
    title.appendChild(b);
  }

  function fix() {
    addDiscoverSearch();
    var home = onHome();
    // Home and Favourites (native tabs 0 and 1) hidden on Home's tab bar; restored anywhere else
    document.querySelectorAll('.headerTabs .emby-tab-button[data-index="0"]:not([id^="je-native-tab-btn-"]), .headerTabs .emby-tab-button[data-index="1"]:not([id^="je-native-tab-btn-"]), .emby-tab-button[data-ivf-hidden]').forEach(function (b) {
      if (home) {
        if (b.style.display !== 'none') { b.style.display = 'none'; b.setAttribute('data-ivf-hidden', '1'); }
      } else if (b.hasAttribute('data-ivf-hidden')) {
        b.style.display = ''; b.removeAttribute('data-ivf-hidden');
      }
    });
    var je = document.getElementById('je-native-tab-btn-recommendations');
    if (!je) return;
    if (je.style.display !== 'none') je.style.display = 'none'; // the Discover tile opens it instead
    var walker = document.createTreeWalker(je, NodeFilter.SHOW_TEXT);
    var n;
    while ((n = walker.nextNode())) {
      if (/Recommendations|^\s*Discover\s*$/i.test(n.nodeValue) && n.nodeValue.trim() !== '+ Discover') n.nodeValue = '+ Discover';
    }
    // JE's tab bar may be a different element from the header's: hide Home and Favourites there too
    var bar = je.parentElement;
    if (bar && onHome()) {
      bar.querySelectorAll('.emby-tab-button[data-index="0"]:not([id^="je-native-tab-btn-"]), .emby-tab-button[data-index="1"]:not([id^="je-native-tab-btn-"])').forEach(function (b) {
        if (b.style.display !== 'none') { b.style.display = 'none'; b.setAttribute('data-ivf-hidden', '1'); }
      });
    }
  }
  var queued = false;
  new MutationObserver(function () {
    if (queued) return;
    queued = true;
    requestAnimationFrame(function () { queued = false; fix(); });
  }).observe(document.documentElement, { childList: true, subtree: true });
  window.addEventListener('hashchange', fix);
  fix();
})();

} catch (e) { console.error('IvanaFin script home-tabs failed:', e); } })();
/* IvanaFin - library-tile-backdrops */
(function() { try {
// IvanaFin parity (7): Home "My Media" tiles show a random backdrop from that library with the
// library name on top - a new pick every visit. The next pick is preloaded while you're on Home,
// so the swap is instant (like IvanaFin's tile backdrops).
(function () {
  'use strict';
  var STYLE_ID = 'ivf-tile-style';
  var STORE = 'ivf-tile-next';
  var next = {};      // libraryId -> { url } preloaded for the next visit
  var current = {};   // libraryId -> url shown now (avoid repeating it next time)
  var noPics = {};    // libraryId -> true when the library has no backdrops (e.g. an empty library): leave its own tile alone
  // Picks preloaded in the last session, so the tiles show a picture immediately at app start
  var stored = {};
  try { stored = JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { stored = {}; }
  function remember(libId, url) {
    try { stored[libId] = url; localStorage.setItem(STORE, JSON.stringify(stored)); } catch (e) {}
  }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      '.ivf-tile{position:absolute;inset:0;z-index:2;overflow:hidden;border-radius:inherit;background:#000;container-type:inline-size;pointer-events:none}',
      '.ivf-tile-img{position:absolute;inset:0;background-size:cover;background-position:center;opacity:0;transition:opacity .35s ease}',
      '.ivf-tile-img.ivf-on{opacity:1}',
      '.ivf-tile-shade{position:absolute;inset:0;background:rgba(0,0,0,.28)}',
      '.ivf-tile-name{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:center;padding:0 6%;',
      'color:#fff;font-weight:700;font-size:13cqw;line-height:1.05;text-shadow:0 2px 12px rgba(0,0,0,.85),0 0 3px rgba(0,0,0,.6)}',
      // Same size on every tile; a long name wraps onto a second line instead of shrinking
      '.ivf-tile-name span{display:block;max-width:100%;white-space:normal;overflow-wrap:break-word}'
    ].join('');
    document.head.appendChild(s);
  }

  function isLibraryCard(card) {
    var t = card.getAttribute('data-type');
    return t === 'CollectionFolder' || t === 'UserView' || t === 'Folder';
  }

  function cardName(card) {
    var el = card.querySelector('.cardText-first, .cardText');
    return (el && el.textContent.trim()) || card.getAttribute('data-name') || '';
  }

  function pickFor(libId) {
    var userId = ApiClient.getCurrentUserId();
    var base = { ParentId: libId, Recursive: true, SortBy: 'Random', Limit: 2, ImageTypes: 'Backdrop', EnableImageTypes: 'Backdrop', EnableUserData: false };
    function query(types) {
      var q = Object.assign({}, base);
      if (types) q.IncludeItemTypes = types;
      return ApiClient.getItems(userId, q).then(function (r) { return (r && r.Items) || []; });
    }
    // Music libraries: a random album cover (square, fits the tile) - same as Android
    // A cover's average colour, from the blurhash Jellyfin keeps for it (characters 2-5 = the average
    // colour as a base-83 number): near-black covers (e.g. Donda) make the tile a plain black box
    var B83 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz#$%*+,-.:;=?@[]^_{|}~';
    function nearBlack(i) {
      var h = i.ImageBlurHashes && i.ImageBlurHashes.Primary && i.ImageBlurHashes.Primary[i.ImageTags.Primary];
      if (!h || h.length < 6) return false;
      var v = 0;
      for (var k = 2; k < 6; k++) { var x = B83.indexOf(h.charAt(k)); if (x < 0) return false; v = v * 83 + x; }
      var r = (v >> 16) & 255, g = (v >> 8) & 255, b = v & 255;
      return 0.2126 * r + 0.7152 * g + 0.0722 * b < 45; // (45 since round 5: WAR, 43, showed as a black square with a faint word)
    }
    function albumCovers() {
      return ApiClient.getItems(userId, { ParentId: libId, Recursive: true, SortBy: 'Random', Limit: 8, IncludeItemTypes: 'MusicAlbum', ImageTypes: 'Primary', EnableImageTypes: 'Primary', EnableUserData: false })
        .then(function (r) {
          var all = ((r && r.Items) || []).filter(function (i) { return i.ImageTags && i.ImageTags.Primary; });
          var lit = all.filter(function (i) { return !nearBlack(i); });
          return (lit.length ? lit : all).slice(0, 2).map(function (i) {
            return ApiClient.getScaledImageUrl(i.Id, { type: 'Primary', fillWidth: 900, fillHeight: 900, quality: 90, tag: i.ImageTags.Primary });
          });
        });
    }
    // Picture libraries (any photos library): a random photo
    function photos() {
      return ApiClient.getItems(userId, { ParentId: libId, Recursive: true, SortBy: 'Random', Limit: 2, IncludeItemTypes: 'Photo', ImageTypes: 'Primary', EnableUserData: false })
        .then(function (r) {
          return ((r && r.Items) || []).filter(function (i) { return i.ImageTags && i.ImageTags.Primary; }).map(function (i) {
            return ApiClient.getScaledImageUrl(i.Id, { type: 'Primary', maxWidth: 1280, quality: 90, tag: i.ImageTags.Primary });
          });
        });
    }
    return query('Movie,Series').then(function (items) {
      if (items.length) return items;
      return albumCovers().then(function (urls) {
        if (urls.length) return { urls: urls };
        return photos().then(function (p) { return p.length ? { urls: p } : query(null); });
      });
    })
      .then(function (items) {
        if (items.urls) return items.urls.filter(function (u) { return u !== current[libId]; })[0] || items.urls[0];
        var urls = items.filter(function (i) { return i.BackdropImageTags && i.BackdropImageTags.length; })
          .map(function (i) {
            return ApiClient.getScaledImageUrl(i.Id, { type: 'Backdrop', fillWidth: 1280, quality: 90, tag: i.BackdropImageTags[0] });
          });
        // Prefer one that isn't on screen right now
        return urls.filter(function (u) { return u !== current[libId]; })[0] || urls[0] || null;
      });
  }

  function preload(libId) {
    return pickFor(libId).then(function (url) {
      if (!url) return;
      var img = new Image();
      img.onload = function () { next[libId] = { url: url }; remember(libId, url); };
      img.src = url;
    }).catch(function () {});
  }

  function show(layer, url) {
    var img = layer.querySelector('.ivf-tile-img');
    img.style.backgroundImage = 'url("' + url + '")';
    var probe = new Image();
    probe.onload = function () { img.classList.add('ivf-on'); };
    probe.src = url; // instant when it was preloaded
  }

  function decorate(card) {
    var libId = card.getAttribute('data-id');
    var box = card.querySelector('.cardScalable');
    if (!libId || !box || noPics[libId] || box.querySelector('.ivf-tile')) return;
    var layer = document.createElement('div');
    layer.className = 'ivf-tile';
    layer.setAttribute('data-lib', libId);
    layer.innerHTML = '<div class="ivf-tile-img"></div><div class="ivf-tile-shade"></div><div class="ivf-tile-name"></div>';
    var name = cardName(card);
    var nameEl = layer.querySelector('.ivf-tile-name');
    var span = document.createElement('span');
    span.textContent = name;
    nameEl.appendChild(span);
    box.appendChild(layer);

    var ready = next[libId] || (stored[libId] ? { url: stored[libId] } : null);
    delete next[libId];
    delete stored[libId];
    var shown = ready ? Promise.resolve(ready.url) : pickFor(libId);
    shown.then(function (url) {
      // no backdrops: keep the library's own picture, and remember so the watcher doesn't re-add the layer in a loop
      if (!url) { noPics[libId] = true; layer.remove(); return; }
      current[libId] = url;
      show(layer, url);
      preload(libId); // next visit's picture, loaded in the background
    }).catch(function () { noPics[libId] = true; layer.remove(); });
  }

  // Leaving Home (called by home-grid.js): every library tile takes its next, already downloaded
  // picture now, out of sight. Jellyfin keeps its Home page between visits, so the tiles only got
  // new pictures when it happened to rebuild them - mostly never on the TV.
  // The pictures after that are fetched a few seconds later: fetched at once, their 9 queries and 7
  // big pictures went out together with the page being opened (Samsung: Movies library waited on them)
  var preloadTimer = null, preloadIds = {};
  function advance() {
    Array.prototype.forEach.call(document.querySelectorAll('.ivf-tile[data-lib]'), function (layer) {
      var id = layer.getAttribute('data-lib'), n = next[id];
      if (!n) return;
      delete next[id];
      current[id] = n.url;
      show(layer, n.url);
      preloadIds[id] = 1; // and the one after that (below)
    });
    clearTimeout(preloadTimer);
    preloadTimer = setTimeout(function () {
      var ids = Object.keys(preloadIds);
      preloadIds = {};
      ids.forEach(preload);
    }, 3000);
  }
  window.IvfTileBackdrops = { advance: advance };

  function scan() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    var home = document.querySelector('.homeSectionsContainer');
    if (!home) return;
    var cards = home.querySelectorAll('.card[data-id]');
    for (var i = 0; i < cards.length; i++) {
      if (isLibraryCard(cards[i])) { addStyle(); decorate(cards[i]); }
    }
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
  ivfWatch(function () { scan(); }, 50);
  scan();
})();

} catch (e) { console.error('IvanaFin script library-tile-backdrops failed:', e); } })();
/* IvanaFin - movie-page */
(function() { try {
// IvanaFin (Samsung app): a film's page mirrors the Android IvanaFin movie page (MovieDetails +
// MovieDetailsHeader, measured on the Fire TV app at 1dp = 1/960 of the screen width):
//   backdrop top-right (fades from the left and towards the bottom)
//   logo (or title) top-left, 48dp from the top, 40dp from the left
//   "1979 • 2h 27m • GB-18 • 8.3★ • 91%🍅 • Ends at 11:14"
//   round buttons, 40dp, 16dp apart: [▶ Play] (or Resume + Restart) [Version] [Audio] [Subtitles] [⋮ More]
//     - each shows its name only while selected; selected = light grey (#d1d5db), dark text, 10% bigger
//   tagline (italic 14sp), the whole description (12sp, 16dp lines, 60% of the width)
//   rows: [Planets - Star Wars films, data in sw-planets.js], Cast & Crew (108dp round photos),
//   Special Features, Scenes, More Like This
// Audio / Subtitles open Android's "Choose Audio" / "Choose Subtitles" lists; More opens the item menu
// (Play, Choose Audio, Choose Subtitles, Add to playlist, Mark as watched, Favourite, Media Information).
// Playback uses Jellyfin's own (hidden) page underneath: its Play / Restart buttons, its audio and
// subtitle pickers (so the chosen tracks are used) and its scene / special-feature cards.
// Remote: Up/Down move between rows (returning to the item last selected in that row), Left/Right
// along a row; Back closes a list first, then leaves the page (Jellyfin's own Back).
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
  // Samsung and the web (the web keeps Jellyfin's top bar, sits below it, and is drawn at ~72% size
  // like the web Discover page; the mouse selects by hovering and nothing is preselected)
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var DF = TV ? 1 : 0.72;
  var STYLE_ID = 'ivf-movie-style';
  var ROOT_ID = 'ivf-movie';
  var root = null, cur = null; // cur = { id, item, rows: [[el...]], last: [idx...] }
  var dialogs = [];

  function d(n) { return 'calc(var(--ivf-dp) * ' + (Math.round(n * DF * 100) / 100) + ')'; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n) { return '<span class="material-icons" aria-hidden="true">' + n + '</span>'; }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      ':root{--ivf-dp:calc(100vw / 960)}',
      // Jellyfin's loading circle is for its own page loading underneath ours: never shown over a film
      'html.ivf-movie-on .docspinner{display:none !important}',
      // Jellyfin's own film page underneath is not laid out at all (its rows measuring themselves made
      // opening a film slow on the Samsung); its buttons still work when clicked from here
      'html.ivf-movie-on #itemDetailPage{display:none !important}',
      // the stock page stays underneath (its controls do the playing) but is never seen
      TV ? 'html.ivf-movie-on .skinHeader{display:none !important}'
        // Web: our page runs to the very top (the backdrop too) and Jellyfin's top bar floats over it,
        // fading from dark into the picture - like the web show page. No Jellyfin backdrop behind it
        // (it showed a different picture), no frosted blur; the content starts below the bar.
        : 'html.ivf-movie-on,html.ivf-movie-on body{overflow:hidden !important}html.ivf-movie-on .backdropContainer{display:none !important}html.ivf-movie-on .backgroundContainer{background:#000 !important}' +
          'html.ivf-movie-on .skinHeader,html.ivf-movie-on header.MuiAppBar-root{z-index:860 !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;' +
          'background:transparent !important;border-bottom:0 !important;box-shadow:none !important}' +
          'html.ivf-movie-on .skinHeader::before,html.ivf-movie-on .skinHeader::after{display:none !important}' +
          '#' + ROOT_ID + ' .ivf-mv-scroll{padding-top:var(--ivf-mv-top,0px)}' +
          // scrolled content fades out just under the see-through bar instead of sliding under its
          // links (the backdrop is a separate layer, so it still runs up behind the bar)
          '#' + ROOT_ID + ' .ivf-mv-scroll{-webkit-mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-mv-top,0px) - 6px),#000 calc(var(--ivf-mv-top,0px) + 18px));' +
          'mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-mv-top,0px) - 6px),#000 calc(var(--ivf-mv-top,0px) + 18px))}',
      '#' + ROOT_ID + '{position:fixed;left:0;right:0;bottom:0;top:0;z-index:850;background:#000;color:#d1d5db;overflow:hidden}',
      '#' + ROOT_ID + '.ivf-off{display:none}',
      // backdrop (2026-11-12, user design): the whole screen, darkened towards the bottom where the text
      // is (no extra darkening when scrolled to the rows - user choice)
      '.ivf-mv-bd{position:absolute;inset:0;pointer-events:none;opacity:0;transition:opacity .35s}',
      '.ivf-mv-bd.on{opacity:1}',
      '.ivf-mv-bd div{position:absolute;inset:0;background:center top/cover no-repeat}',
      '.ivf-mv-bd::after{content:"";position:absolute;inset:0;transition:background-color .8s cubic-bezier(.4,0,.2,1);background-color:rgba(0,0,0,0);',
      'background-image:linear-gradient(to top,rgba(0,0,0,.94) 0%,rgba(0,0,0,.72) 30%,rgba(0,0,0,.18) 60%,rgba(0,0,0,0) 80%)}',
      '.ivf-mv-scroll{position:relative;height:100%;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;' + (TV ? '' : 'scroll-behavior:smooth;') + 'padding-bottom:' + d(48) + ';box-sizing:border-box}',
      '.ivf-mv-scroll::-webkit-scrollbar{display:none}',
      // text stays readable over bright parts of the picture (round-4 beta: 2001, The Dark Knight Rises)
      // - a shadow, not darkening the picture (user's design)
      '.ivf-mv-scroll{text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 14px rgba(0,0,0,.6)}',
      // scrolled down to the rows: the picture darkens behind them so cast names read on bright pictures
      // (round-5 beta: 2001, Alien, Back to the Future - user 2026-11-13: yes, darker)
      '#' + ROOT_ID + '.ivf-mv-down .ivf-mv-bd::after{background-color:rgba(0,0,0,.55)}',
      // First screen (ElegantFin layout): logo/title, info line and buttons centred at the bottom, then the
      // tagline and description left-aligned across the full width;
      // Cast & Crew and the other rows start below it (scroll / Down)
      '.ivf-mv-head{display:flex;flex-direction:column;justify-content:flex-end;align-items:center;text-align:center;box-sizing:border-box;',
      'min-height:' + (TV ? '100vh' : 'calc(100vh - var(--ivf-mv-top,0px))') + ';padding:' + d(40) + ' ' + d(80) + ' ' + d(33) + ';text-shadow:0 1px 8px rgba(0,0,0,.55)}',
      '.ivf-mv-logo{display:block;height:' + d(60) + ';max-width:' + d(320) + ';object-fit:contain;object-position:center bottom;margin:0 auto ' + d(0) + '}',
      '.ivf-mv-title{margin:0 auto;font-size:' + d(28) + ';font-weight:600;line-height:' + d(36) + ';color:#fff;max-width:80%}',
      '.ivf-mv-quick{margin-top:' + d(3) + ';font-size:' + d(12) + ';font-weight:500;line-height:' + d(17) + ';letter-spacing:' + d(0.5) + '}',
      '.ivf-mv-quick .dot{margin:0 ' + d(8) + ';font-size:' + d(10) + ';vertical-align:' + d(2) + '}',
      '.ivf-mv-star{color:#f5c518}',
      '.ivf-mv-tomato{width:1em;height:1em;vertical-align:-0.12em;margin-left:' + d(1) + '}',
      // buttons (ExpandablePlayButton / ExpandableFaButton)
      '.ivf-mv-btns{display:flex;justify-content:center;align-items:center;gap:' + d(16) + ';padding:' + d(11) + ' 0 ' + d(4) + ' 0}',
      '.ivf-mv-btn{display:inline-flex;align-items:center;justify-content:center;height:' + d(32) + ';min-width:' + d(32) + ';padding:0 ' + d(4) + ';box-sizing:border-box;border:0;',
      'border-radius:999px;background:rgba(255,255,255,.14);color:#fff;font:inherit;font-size:' + d(12) + ';font-weight:500;letter-spacing:' + d(0.1) + ';cursor:pointer;outline:none;',
      'transition:transform .12s,background .12s,color .12s}',
      '.ivf-mv-btn .material-icons{width:' + d(26) + ';text-align:center;font-size:' + d(18) + ';color:inherit}',
      '.ivf-mv-btn.play .material-icons{font-size:' + d(22) + '}',
      '.ivf-mv-btn .lbl{max-width:0;overflow:hidden;white-space:nowrap;transition:max-width .18s,padding .18s}',
      '.ivf-mv-btn:focus{background:#d1d5db;color:#131414;transform:scale(1.1)}',
      '.ivf-mv-btn:focus .lbl{max-width:' + d(200) + ';padding:0 ' + d(6) + ' 0 ' + d(2) + '}',
      '.ivf-mv-tag{align-self:stretch;text-align:left;margin-top:' + d(10) + ';max-width:none;font-size:' + d(14) + ';font-style:italic;line-height:' + d(20) + ';letter-spacing:' + d(0.25) + ';',
      'white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-mv-ov{display:block;align-self:stretch;width:auto;max-width:none;margin:' + d(4) + ' ' + d(-4) + ' 0;padding:' + d(4) + ';box-sizing:border-box;text-align:left;background:none;border:0;border-radius:' + d(6) + ';',
      'color:#d1d5db;font:inherit;font-weight:400;font-size:' + d(12) + ';line-height:' + d(16) + ';letter-spacing:' + d(0.4) + ';outline:none;cursor:pointer}',
      '.ivf-mv-ov:focus{background:rgba(255,255,255,.14)}',
      // rows
      '.ivf-mv-row{margin-top:' + d(24) + '}',
      '.ivf-mv-row:first-of-type{margin-top:' + d(35) + '}',
      '.ivf-mv-row h3{margin:0 0 ' + d(8) + ' ' + d(40) + ';font-size:' + d(22) + ';font-weight:400;line-height:' + d(28) + ';color:#d1d5db}',
      '.ivf-mv-strip{display:flex;gap:' + d(16) + ';overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:' + d(8) + ' ' + d(40) + ';scroll-behavior:smooth;align-items:flex-start}',
      '.ivf-mv-strip::-webkit-scrollbar{display:none}',
      '.ivf-mv-row:not(.cast):not(.sw-planet):not(.sw-char) .ivf-mv-strip{padding-left:' + d(48) + '}',
      '.ivf-mv-item{flex:none;display:flex;flex-direction:column;align-items:center;background:none;border:0;padding:0;color:#d1d5db;font:inherit;cursor:pointer;outline:none}',
      // Cast & Crew (PersonCard: 108dp circle, name 14sp semi-bold, role 12sp, one line each)
      '.ivf-mv-person{width:' + d(108) + '}',
      '.ivf-mv-face{width:100%;padding-top:100%;border-radius:50%;background:#1c1c1c center/cover no-repeat;position:relative;box-shadow:0 0 0 ' + d(1.5) + ' transparent;transition:transform .12s}',
      '.ivf-mv-face i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:' + d(30) + ';font-weight:600;opacity:.6}',
      '.ivf-mv-person:focus .ivf-mv-face{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-mv-name{width:100%;margin-top:' + d(6) + ';font-size:' + d(14) + ';font-weight:600;line-height:' + d(18) + ';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-mv-role{width:100%;font-weight:400;font-size:' + d(12) + ';line-height:' + d(16) + ';letter-spacing:' + d(0.4) + ';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // Scenes / Special Features: 16:9 cards with the name + time under the picture
      '.ivf-mv-wide{width:' + d(213) + ';align-items:stretch;border-radius:calc(var(--ivf-dp) * 4);background:#121212;box-shadow:0 0 0 ' + d(1.5) + ' transparent;transition:transform .12s;overflow:visible}',
      '.ivf-mv-wide{position:relative}',
      '.ivf-mv-wide .pic{width:100%;padding-top:56.25%;border-radius:calc(var(--ivf-dp) * 4);background:#141414 center/cover no-repeat}',
      '.ivf-mv-wide .band{position:absolute;left:0;right:0;bottom:0;padding:' + d(4) + ' ' + d(4) + ' ' + d(6) + ';border-radius:0 0 calc(var(--ivf-dp) * 4) calc(var(--ivf-dp) * 4);background:rgba(0,0,0,.55)}',
      '.ivf-mv-wide .t{padding:0;font-size:' + d(14) + ';font-weight:500;line-height:' + d(20) + ';text-align:left;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-mv-wide .s{font-weight:400;padding:0;font-size:' + d(12) + ';line-height:' + d(16) + ';text-align:left}',
      '.ivf-mv-wide:focus{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      // More Like This posters (115dp wide, title + year under them)
      '.ivf-mv-poster{width:' + d(115) + '}',
      '.ivf-mv-poster .pic{width:100%;padding-top:150%;border-radius:calc(var(--ivf-dp) * 4);background:#141414 center/cover no-repeat;box-shadow:0 0 0 ' + d(1.5) + ' transparent;transition:transform .12s}',
      '.ivf-mv-poster:focus .pic{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-mv-poster .t{width:100%;margin-top:' + d(8) + ';font-size:' + d(14) + ';font-weight:600;line-height:' + d(18) + ';text-align:center;',
      'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-mv-poster .s{width:100%;font-weight:400;font-size:' + d(12) + ';line-height:' + d(16) + ';text-align:center}',
      // dialogs (DialogPopup: black, rounded, light grey selection)
      '.ivf-mv-dlg{position:fixed;inset:0;z-index:860;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}',
      '.ivf-mv-box{width:' + d(440) + ';max-height:92vh;overflow-y:auto;scrollbar-width:none;box-sizing:border-box;padding:' + d(12) + ' ' + d(14) + ' ' + d(14) + ';border-radius:' + d(28) + ';',
      'background:#0b0b0b;display:flex;flex-direction:column;gap:' + d(4) + '}',
      '.ivf-mv-box::-webkit-scrollbar{display:none}',
      '.ivf-mv-dtitle{padding:' + d(12) + ' ' + d(10) + ' ' + d(8) + ';font-size:' + d(22) + ';line-height:' + d(28) + ';color:#d1d5db}',
      '.ivf-mv-opt{display:flex;align-items:center;gap:' + d(14) + ';min-height:' + d(48) + ';padding:' + d(8) + ' ' + d(16) + ';box-sizing:border-box;border:0;border-radius:' + d(8) + ';',
      'background:transparent;color:#d1d5db;font:inherit;text-align:left;cursor:pointer;outline:none}',
      '.ivf-mv-opt:focus{background:#d1d5db;color:#131414}',
      '.ivf-mv-opt .material-icons{width:' + d(20) + ';font-size:' + d(20) + ';color:inherit;flex:none}',
      '.ivf-mv-opt .dotsel{width:' + d(20) + ';flex:none;text-align:center;font-size:' + d(14) + '}',
      '.ivf-mv-opt .h{font-size:' + d(16) + ';font-weight:500;line-height:' + d(22) + '}',
      '.ivf-mv-opt .sub{font-size:' + d(12) + ';line-height:' + d(16) + ';letter-spacing:' + d(0.4) + '}',
      '.ivf-mv-info{padding:0 ' + d(10) + ' ' + d(8) + ';font-size:' + d(13) + ';line-height:' + d(19) + ';outline:none}',
      '.ivf-mv-info b{display:block;overflow-wrap:anywhere;margin-top:' + d(10) + ';font-size:' + d(15) + ';font-weight:600}',
      '.ivf-mv-info span{display:block;color:#9ca3af}',
      // Star Wars Planets (2026-11-15): round planet pictures like the cast; OK opens the planet's card
      '.ivf-sw-planet .ivf-mv-face{background-color:#000}',
      '.ivf-sw-char .ivf-mv-face{background-position:center top}',
      // character names are never cut short: they wrap onto a second line (species only in the card)
      '.ivf-sw-char .ivf-mv-name{white-space:normal;overflow:visible;text-overflow:clip}',
      // starships: the whole picture on black (they are cut-outs and wide shots, not portraits)
      '.ivf-sw-ship .pic{background-color:#050505;background-size:contain}',
      '.ivf-mv-era{margin-top:' + d(2) + ';font-size:' + d(12) + ';font-weight:500;line-height:' + d(17) + ';letter-spacing:' + d(0.5) + ';color:#f5c518}',
      // opening crawl: starfield, blue intro, then the yellow text receding into space
      '.ivf-mv-dlg.crawl{background:#000}',
      '.ivf-mv-dlg.crawl .ivf-mv-box{width:100vw;height:100vh;max-height:none;border-radius:0;padding:0;background:#000;overflow:hidden}',
      '.ivf-crawl{position:relative;width:100%;height:100%;outline:none;overflow:hidden;background:#000 radial-gradient(1px 1px at 10% 20%,#fff,transparent),#000;' +
        'background-image:radial-gradient(1px 1px at 12% 18%,#fff 50%,transparent),radial-gradient(1px 1px at 33% 72%,#ddd 50%,transparent),radial-gradient(1.5px 1.5px at 58% 34%,#fff 50%,transparent),radial-gradient(1px 1px at 81% 61%,#ccc 50%,transparent),radial-gradient(1px 1px at 91% 12%,#fff 50%,transparent),radial-gradient(1px 1px at 47% 88%,#eee 50%,transparent),radial-gradient(1px 1px at 22% 51%,#bbb 50%,transparent),radial-gradient(1.5px 1.5px at 70% 83%,#fff 50%,transparent)}',
      '.ivf-crawl-intro{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;text-align:left;font-size:' + d(22) + ';line-height:1.4;color:#4bd5ee;opacity:0;animation:ivfIntro 6s ease-in-out .5s forwards}',
      '@keyframes ivfIntro{0%{opacity:0}15%{opacity:1}75%{opacity:1}100%{opacity:0}}',
      '.ivf-crawl-view{position:absolute;inset:0;perspective:' + d(300) + ';perspective-origin:50% 0;overflow:hidden}',
      '.ivf-crawl-text{position:absolute;left:50%;width:' + d(560) + ';margin-left:' + d(-280) + ';top:100%;transform-origin:50% 100%;transform:rotateX(28deg);color:#feda4a;font-size:' + d(26) + ';line-height:1.5;font-weight:600;text-align:justify;opacity:0;animation:ivfCrawl 60s linear 7s forwards}',
      '.ivf-crawl-text .ep,.ivf-crawl-text .ti{text-align:center}',
      '.ivf-crawl-text .ti{font-size:' + d(34) + ';margin:' + d(6) + ' 0 ' + d(18) + '}',
      '.ivf-crawl-text p{margin:0 0 ' + d(20) + '}',
      '@keyframes ivfCrawl{0%{opacity:1;top:100%}92%{opacity:1}100%{opacity:0;top:-170%}}',
    ].join('') + (TV ? '' : [
      // Web: the mouse pointer selects like the remote ...
      '.ivf-mv-btn:not(:focus):not(:hover){backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px)}', // frosted glass (web only - the TV has no blur)
      '.ivf-mv-btn:hover{background:#d1d5db;color:#131414;transform:scale(1.1)}',
      '.ivf-mv-btn:hover .lbl{max-width:' + d(200) + ';padding:0 ' + d(6) + ' 0 ' + d(2) + '}',
      '.ivf-mv-ov:hover{background:rgba(255,255,255,.14)}',
      '.ivf-mv-person:hover .ivf-mv-face,.ivf-mv-poster:hover .pic{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-mv-wide:hover{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-mv-opt:hover{background:#d1d5db;color:#131414}',
      // ... and a mouse click's leftover focus doesn't keep a button highlighted (only one at a time)
      '.ivf-mv-btns:hover .ivf-mv-btn:focus:not(:hover),.ivf-mv-btn:focus:not(:focus-visible):not(:hover){background:rgba(255,255,255,.14);color:#fff;transform:none}',
      '.ivf-mv-btns:hover .ivf-mv-btn:focus:not(:hover) .lbl,.ivf-mv-btn:focus:not(:focus-visible):not(:hover) .lbl{max-width:0;padding:0}',
      '.ivf-mv-item:focus:not(:focus-visible):not(:hover) .ivf-mv-face,.ivf-mv-item:focus:not(:focus-visible):not(:hover) .pic{box-shadow:none;transform:none}',
      '.ivf-mv-wide:focus:not(:focus-visible):not(:hover){box-shadow:none;transform:none}',
      '.ivf-mv-ov:focus:not(:focus-visible):not(:hover){background:none}'
    ].join(''));
    document.head.appendChild(s);
  }

  // ---- data ----------------------------------------------------------------------------------------
  function uid() { return ApiClient.getCurrentUserId(); }
  function imgUrl(id, type, q) { return ApiClient.getUrl('/Items/' + id + '/Images/' + type, q || {}); }
  function fmtRuntime(ticks) {
    var min = Math.round((ticks || 0) / 600000000);
    if (!min) return '';
    var h = Math.floor(min / 60), m = min % 60;
    return h ? h + 'h' + (m ? ' ' + m + 'm' : '') : m + 'm';
  }
  function fmtTime(date) {
    try { return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return date.getHours() + ':' + ('0' + date.getMinutes()).slice(-2); }
  }
  function fmtClock(ticks) { // 9m 23s / 1h 2m 3s (Android chapter times)
    var s = Math.round((ticks || 0) / 10000000), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), sec = s % 60;
    return (h ? h + 'h ' : '') + (h || m ? m + 'm ' : '') + sec + 's';
  }
  function tomato(fresh) {
    return '<svg class="ivf-mv-tomato" viewBox="0 0 24 24" aria-hidden="true">' + (fresh
      ? '<circle cx="12" cy="13.5" r="9" fill="#fa320a"/><path d="M8 4.5l2.5 2L12 3.5l1.5 3L16 4.5l-1 3.5H9z" fill="#00912d"/>'
      : '<path d="M12 2.5l2.2 4.8 5.3-1.6-2.4 5 4.4 3.1-5.3 1.1.6 5.4-4.8-2.6-4.8 2.6.6-5.4-5.3-1.1 4.4-3.1-2.4-5 5.3 1.6z" fill="#0ac55a"/>') + '</svg>';
  }
  function resumeTicks(it) { return (it.UserData && it.UserData.PlaybackPositionTicks) || 0; }

  // A film's details fetched ahead (poster selected / OK pressed) and its backdrop downloaded at once,
  // so the page appears quickly. Reused for 15 s (resume positions etc. stay fresh after that).
  var pre = null;
  function film(id) {
    if (pre && pre.id === id && Date.now() - pre.t < 15000) return pre.p;
    var p = load(id).then(function (d) {
      var bd = d && d.item && (d.item.BackdropImageTags || [])[0];
      if (bd) { var im = new Image(); im.src = imgUrl(id, 'Backdrop/0', { maxWidth: 1920, tag: bd }); }
      return d;
    });
    pre = { id: id, p: p, t: Date.now() };
    p['catch'](function () { if (pre && pre.p === p) pre = null; });
    return p;
  }
  function load(id) {
    var u = uid();
    var itemP = ApiClient.getItem(u, id);
    return Promise.all([
      itemP,
      ApiClient.getJSON(ApiClient.getUrl('/Items/' + id + '/Similar', { userId: u, limit: 18, fields: 'PrimaryImageAspectRatio' }))['catch'](function () { return { Items: [] }; }),
      ApiClient.getJSON(ApiClient.getUrl('/Users/' + u + '/Items/' + id + '/SpecialFeatures'))['catch'](function () { return []; }),
      // Star Wars (any server: by this item's id or its TMDB id): the story-order list
      itemP.then(function (it) { swItems[id] = it; return swFilm(id) && window.IvfSw ? window.IvfSw.timelineList() : []; })['catch'](function () { return []; })
    ]).then(function (r) {
      // one card per film: the IMAX / alternative-format copy is its own item (round-5 beta: The Dark
      // Knight listed itself and The Dark Knight Rises twice)
      var key = function (x) { return (x.Name || '').toLowerCase() + '|' + (x.ProductionYear || ''); };
      var seen = {}; seen[key(r[0])] = 1;
      var sim = ((r[1] && r[1].Items) || []).filter(function (x) { var k = key(x); if (seen[k]) return false; seen[k] = 1; return true; }).slice(0, 12);
      return { item: r[0], similar: sim, extras: r[2] || [], story: swFilm(id) ? swNeighbours(id, r[3] || []) : null };
    });
  }

  // ---- the stock page underneath (its controls do the work) ----------------------------------------
  function stockPage() {
    var ps = document.querySelectorAll('#itemDetailPage');
    for (var i = ps.length - 1; i >= 0; i--) if (!ps[i].classList.contains('hide')) return ps[i];
    return null;
  }
  function stock(sel) { var p = stockPage(); return p ? p.querySelector(sel) : null; }

  // ---- render --------------------------------------------------------------------------------------
  // swYear: Star Wars films start with the in-universe year ("19 BBY"), before the release year
  function quickLine(it, swYear) {
    var bits = swYear ? [esc(swYear)] : [];
    if (it.ProductionYear) bits.push(String(it.ProductionYear));
    var rt = fmtRuntime(it.RunTimeTicks); if (rt) bits.push(rt);
    if (it.OfficialRating) bits.push(esc(it.OfficialRating));
    if (it.CommunityRating) bits.push(it.CommunityRating.toFixed(1) + '<span class="ivf-mv-star">★</span>');
    if (it.CriticRating != null) bits.push(it.CriticRating + '%' + tomato(it.CriticRating >= 60));
    if (it.RunTimeTicks) bits.push('Ends at ' + esc(fmtTime(new Date(Date.now() + (it.RunTimeTicks - resumeTicks(it)) / 10000))));
    return bits.join('<span class="dot">●</span>');
  }

  function buttonsHtml(it) {
    var resume = resumeTicks(it) > 0;
    function b(act, ic, label, cls) {
      return '<button type="button" class="ivf-mv-btn' + (cls ? ' ' + cls : '') + '" data-act="' + act + '">' + icon(ic) + '<span class="lbl">' + label + '</span></button>';
    }
    var h = b('play', 'play_arrow', resume ? 'Resume' : 'Play', 'play');
    if (resume) h += b('restart', 'replay', 'Restart');
    if ((it.MediaSources || []).length > 1) h += b('version', 'video_file', 'Version');
    h += b('audio', 'volume_down', 'Audio') + b('subs', 'closed_caption', 'Subtitles') + b('info', 'info', 'Media Information') /* was More (user: only Media Information was needed) */;
    if ((swFilm(it.Id) || {}).crawl) h += b('crawl', 'subject', 'Opening Crawl');
    return h;
  }

  var shownBd = null; // backdrop address of the last page drawn
  function render(data) {
    var it = data.item, id = it.Id;
    var logo = it.ImageTags && it.ImageTags.Logo ? imgUrl(id, 'Logo', { maxHeight: 240, tag: it.ImageTags.Logo }) : '';
    var bdTag = (it.BackdropImageTags || [])[0];
    // one card per person: several roles (Lauren Tom x3 in Batman Beyond) are joined into one (beta round 6)
    var people = (function (list) { var by = {}, out = []; list.forEach(function (p) { var k = p.Id || p.Name; if (by[k]) { if (p.Role && (by[k].Role || '').split(' / ').indexOf(p.Role) < 0) by[k].Role = by[k].Role ? by[k].Role + ' / ' + p.Role : p.Role; return; } by[k] = Object.assign({}, p); out.push(by[k]); }); return out; })(it.People || []).slice(0, 40);
    var chapters = it.Chapters || [];
    // some files name chapters "第 01 章" (Chinese "Chapter 01" - Twin Peaks: FWWM, beta round 6)
    function chapName(n) { var m = /^\s*第\s*(\d+)\s*章\s*$/.exec(n || ''); return m ? 'Chapter ' + m[1] : n; }
    var h = '<div class="ivf-mv-bd"><div></div></div><div class="ivf-mv-scroll"><div class="ivf-mv-head">' +
      (logo ? '<img class="ivf-mv-logo" alt="" src="' + logo + '">' : '') +
      '<h1 class="ivf-mv-title"' + (logo ? ' style="display:none"' : '') + '>' + esc(it.Name) + '</h1>' +
      '<div class="ivf-mv-quick">' + quickLine(it, swFilm(id) && window.IvfSw && (window.IvfSw.place(it) || {}).year) + '</div>' +
      '<div class="ivf-mv-btns">' + buttonsHtml(it) + '</div>' +
      ((it.Taglines || [])[0] ? '<div class="ivf-mv-tag">' + esc(it.Taglines[0]) + '</div>' : '') +
      (it.Overview ? '<button type="button" class="ivf-mv-ov">' + esc(it.Overview) + '</button>' : '') +
      '</div>';
    h += swRowHtml(id, 'planet') + swRowHtml(id, 'char') + swRowHtml(id, 'ship');
    if (people.length) {
      h += '<section class="ivf-mv-row cast"><h3>Cast &amp; Crew</h3><div class="ivf-mv-strip">' + people.map(function (p) {
        var ini = (p.Name || '?').split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('');
        var pic = p.PrimaryImageTag ? imgUrl(p.Id, 'Primary', { maxHeight: 400, tag: p.PrimaryImageTag }) : '';
        return '<button type="button" class="ivf-mv-item ivf-mv-person" data-person="' + p.Id + '" title="' + esc(p.Name + (p.Role ? ' - ' + p.Role : '')) + '"><div class="ivf-mv-face"' + (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '>' +
          (pic ? '' : '<i>' + esc(ini) + '</i>') + '</div><div class="ivf-mv-name">' + esc(p.Name) + '</div><div class="ivf-mv-role">' + esc(p.Role || p.Type || '') + '</div></button>';
      }).join('') + '</div></section>';
    }
    if (data.extras.length) {
      h += '<section class="ivf-mv-row"><h3>Special Features</h3><div class="ivf-mv-strip">' + data.extras.map(function (x, i) {
        var pic = x.ImageTags && x.ImageTags.Primary ? imgUrl(x.Id, 'Primary', { maxWidth: 640, tag: x.ImageTags.Primary }) : '';
        return '<button type="button" class="ivf-mv-item ivf-mv-wide" data-extra="' + i + '"><div class="pic"' + (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '></div>' +
          '<div class="band"><div class="t">' + esc(x.Name) + '</div><div class="s">' + esc(fmtRuntime(x.RunTimeTicks)) + '</div></div></button>';
      }).join('') + '</div></section>';
    }
    if (chapters.length) {
      h += '<section class="ivf-mv-row"><h3>Scenes</h3><div class="ivf-mv-strip">' + chapters.map(function (c, i) {
        var pic = c.ImageTag ? imgUrl(id, 'Chapter/' + i, { maxWidth: 640, tag: c.ImageTag }) : '';
        return '<button type="button" class="ivf-mv-item ivf-mv-wide" data-chapter="' + i + '"><div class="pic"' + (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '></div>' +
          '<div class="band"><div class="t">' + esc(chapName(c.Name) || 'Scene ' + (i + 1)) + '</div><div class="s">' + (c.StartPositionTicks ? fmtClock(c.StartPositionTicks) : 'Start') + '</div></div></button>';
      }).join('') + '</div></section>';
    }
    h += swStoryRowHtml(data.story);
    if (data.similar.length) {
      h += '<section class="ivf-mv-row"><h3>More Like This</h3><div class="ivf-mv-strip">' + data.similar.map(function (s) {
        var pic = s.ImageTags && s.ImageTags.Primary ? imgUrl(s.Id, 'Primary', { maxHeight: 600, tag: s.ImageTags.Primary }) : '';
        return '<button type="button" class="ivf-mv-item ivf-mv-poster" data-go="' + s.Id + '"><div class="pic"' + (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '></div>' +
          '<div class="t">' + esc(s.Name) + '</div><div class="s">' + (s.ProductionYear || '') + '</div></button>';
      }).join('') + '</div></section>';
    }
    h += '</div>';
    root.innerHTML = h;
    // TV: Jellyfin's focus code calls scrollTo() on our scroll boxes (smooth), racing our own scrolling -
    // on the Samsung it sometimes won and the page opened ~180px down with Cast & Crew showing. Our code
    // only sets scrollTop/scrollLeft, so its scrollTo/scrollBy are switched off (like music-page.js).
    if (TV) Array.prototype.forEach.call(root.querySelectorAll('.ivf-mv-scroll, .ivf-mv-strip'), function (el) { el.scrollTo = el.scrollBy = function () {}; });
    // scrolled down to the rows: the backdrop dims behind them
    root.classList.remove('ivf-mv-down');
    root.querySelector('.ivf-mv-scroll').addEventListener('scroll', function () {
      // TV: Jellyfin's own focus code scrolls the box to centre whatever is selected - while a button
      // or the description is selected the page stays on its first screen
      var a = document.activeElement, head = root.querySelector('.ivf-mv-head');
      if (TV && this.scrollTop && a && head && head.contains(a)) { this.scrollTop = 0; return; }
      root.classList.toggle('ivf-mv-down', this.scrollTop > 40);
    });
    var lg = root.querySelector('.ivf-mv-logo');
    if (lg) lg.onerror = function () { lg.remove(); root.querySelector('.ivf-mv-title').style.display = ''; };
    if (bdTag) {
      var url = imgUrl(id, 'Backdrop/0', { maxWidth: 1920, tag: bdTag }), im = new Image();
      // redrawn with the same picture (e.g. back from the player): show it at once, no blink + fade
      if (shownBd === url) {
        var bd0 = root.querySelector('.ivf-mv-bd');
        bd0.style.transition = 'none'; bd0.firstChild.style.backgroundImage = 'url("' + url + '")'; bd0.classList.add('on');
      }
      shownBd = url;
      im.onload = function () { if (!cur || cur.id !== id) return; var bd = root.querySelector('.ivf-mv-bd'); bd.firstChild.style.backgroundImage = 'url("' + url + '")'; bd.classList.add('on'); };
      im.src = url;
    }
    // rows for the remote: buttons, overview, then each strip
    var rows = [Array.prototype.slice.call(root.querySelectorAll('.ivf-mv-btn'))];
    var ov = root.querySelector('.ivf-mv-ov'); if (ov) rows.push([ov]);
    Array.prototype.forEach.call(root.querySelectorAll('.ivf-mv-strip'), function (s) { rows.push(Array.prototype.slice.call(s.children)); });
    cur.rows = rows; cur.last = rows.map(function () { return 0; });
    if (TV) focusAt(0, 0); // web: nothing preselected (the arrow keys start at Play)
  }

  function focusAt(r, i) {
    var row = cur && cur.rows[r]; if (!row || !row.length) return;
    i = Math.max(0, Math.min(i, row.length - 1));
    var el = row[i];
    el.focus({ preventScroll: true });
    cur.last[r] = i; cur.row = r;
    var sc = root.querySelector('.ivf-mv-scroll');
    if (r <= 1) sc.scrollTop = 0;
    else {
      // the first screen is the full-height header: a row is brought up near the top of the screen
      // (below the web's top bar), not just nudged in at the bottom edge
      var sec = el.closest('.ivf-mv-row'), pad = parseFloat(getComputedStyle(sc).paddingTop) || 0;
      sc.scrollTop = Math.max(0, sec.offsetTop - pad - sc.clientHeight * 0.06);
    }
    var strip = el.closest('.ivf-mv-strip');
    if (strip) {
      var srect = strip.getBoundingClientRect(), er = el.getBoundingClientRect(), edge = srect.width * 0.05;
      if (er.left < srect.left + edge) strip.scrollLeft -= (srect.left + edge - er.left);
      else if (er.right > srect.right - edge) strip.scrollLeft += (er.right - srect.right + edge);
    }
  }

  // ---- actions -------------------------------------------------------------------------------------
  function play(fromStart) {
    var b = fromStart ? (stock('.btnReplay') || stock('.btnPlay')) : (stock('.btnResume') || stock('.btnPlay'));
    if (b) b.click();
  }
  function chooseTrack(kind) { // kind: 'audio' | 'subs'
    var it = cur.item, src = (it.MediaSources || [])[0] || {};
    var sel = stock(kind === 'audio' ? 'select.selectAudio' : 'select.selectSubtitles');
    var streams = (src.MediaStreams || []).filter(function (s) { return s.Type === (kind === 'audio' ? 'Audio' : 'Subtitle'); });
    var chosen = sel ? sel.value : '';
    var opts = streams.map(function (s) {
      // Android: "TrueHD Atmos 7.1" over "English Dolby Atmos 7.1 (Default)"
      var lang = s.Language ? languageName(s.Language) : '';
      var head = kind === 'audio'
        ? [codecName(s.Codec) + (/atmos/i.test((s.Profile || '') + ' ' + (s.Title || '') + ' ' + (s.DisplayTitle || '')) ? ' Atmos' : ''), s.ChannelLayout || (s.Channels ? s.Channels + 'ch' : '')].filter(Boolean).join(' ')
        : (lang || 'Unknown') + (s.IsForced ? ' (Forced)' : '');
      var sub = [lang, s.Title || '', s.IsDefault ? '(Default)' : ''].filter(Boolean).join(' ');
      if (kind === 'subs') sub = [s.Title || '', codecName(s.Codec), s.IsExternal ? 'External' : '', s.IsDefault ? '(Default)' : ''].filter(Boolean).join(' · ');
      return { value: String(s.Index), head: head || s.DisplayTitle || 'Track ' + s.Index, sub: sub };
    });
    if (kind === 'subs') opts.unshift({ value: '-1', head: 'None', sub: '' });
    if (!chosen) {
      var def = streams.filter(function (s) { return s.Index === (kind === 'audio' ? src.DefaultAudioStreamIndex : src.DefaultSubtitleStreamIndex); })[0];
      chosen = def ? String(def.Index) : (kind === 'subs' ? '-1' : '');
    }
    var dlg = openDialog('<div class="ivf-mv-dtitle">' + (kind === 'audio' ? 'Choose Audio' : 'Choose Subtitles') + '</div>' + opts.map(function (o) {
      return '<button type="button" class="ivf-mv-opt" data-v="' + esc(o.value) + '"><span class="dotsel">' + (o.value === chosen ? '●' : '') + '</span>' +
        '<span><span class="h" style="display:block">' + esc(o.head) + '</span>' + (o.sub ? '<span class="sub" style="display:block">' + esc(o.sub) + '</span>' : '') + '</span></button>';
    }).join(''));
    dlg.onPick = function (o) {
      if (sel) {
        if (!Array.prototype.some.call(sel.options, function (x) { return x.value === o.getAttribute('data-v'); })) { var n = document.createElement('option'); n.value = o.getAttribute('data-v'); sel.appendChild(n); }
        sel.value = o.getAttribute('data-v');
        sel.dispatchEvent(new Event('change', { bubbles: true }));
      }
      closeDialog();
    };
    var on = dlg.el.querySelector('.ivf-mv-opt[data-v="' + chosen + '"]') || dlg.el.querySelector('.ivf-mv-opt');
    if (on) on.focus();
  }
  function codecName(c) {
    c = (c || '').toLowerCase();
    return { truehd: 'TrueHD', eac3: 'EAC3', ac3: 'AC3', dts: 'DTS', 'dts-hd': 'DTS-HD', aac: 'AAC', flac: 'FLAC', opus: 'Opus', mp3: 'MP3', vorbis: 'Vorbis', pcm_s16le: 'PCM', pcm_s24le: 'PCM',
      subrip: 'SRT', srt: 'SRT', ass: 'ASS', ssa: 'SSA', pgssub: 'PGS', dvd_subtitle: 'VobSub', dvdsub: 'VobSub', mov_text: 'MOV Text', webvtt: 'WebVTT' }[c] || c.toUpperCase();
  }
  function languageName(code) {
    try { return new Intl.DisplayNames(['en'], { type: 'language' }).of(code.length === 3 ? ({ eng: 'en', fre: 'fr', fra: 'fr', ger: 'de', deu: 'de', spa: 'es', ita: 'it', jpn: 'ja', rus: 'ru', por: 'pt', dut: 'nl', nld: 'nl', swe: 'sv', dan: 'da', nor: 'no', fin: 'fi', pol: 'pl', chi: 'zh', zho: 'zh', kor: 'ko', ara: 'ar', hin: 'hi', tur: 'tr', gre: 'el', ell: 'el', heb: 'he', cze: 'cs', ces: 'cs', hun: 'hu' }[code] || code) : code) || code; } catch (e) { return code; }
  }
  function mediaInfo() {
    var it = cur.item, h = '';
    (it.MediaSources || []).forEach(function (src) {
      h += '<b>' + esc(it.Name) + '</b><span>' + esc([src.Name && src.Name !== it.Name ? src.Name : '', (src.Container || '').toUpperCase(), src.Size ? (src.Size / 1073741824).toFixed(2) + ' GB' : '', src.Bitrate ? Math.round(src.Bitrate / 1e6) + ' Mbps' : ''].filter(Boolean).join(' · ')) + '</span>';
      (src.MediaStreams || []).forEach(function (s) {
        if (s.Type !== 'Video' && s.Type !== 'Audio' && s.Type !== 'Subtitle') return;
        h += '<b>' + s.Type + '</b><span>' + esc(s.DisplayTitle || '') + '</span><span>' + esc([(s.Codec || '').toUpperCase(), s.Profile && s.Profile !== 'Unknown' ? s.Profile : '', s.Width ? s.Width + 'x' + s.Height : '', s.VideoRangeType && s.VideoRangeType !== 'SDR' ? s.VideoRangeType : '', s.ChannelLayout, s.BitRate ? Math.round(s.BitRate / 1000) + ' kbps' : '', s.Language].filter(Boolean).join(' · ')) + '</span>';
      });
    });
    var dlg = openDialog('<div class="ivf-mv-dtitle">Media Information</div><div class="ivf-mv-info" tabindex="-1">' + h + '</div>');
    dlg.el.querySelector('.ivf-mv-info').focus();
  }

  // ---- Star Wars extras (data: sw-planets.js, built from data/sw-planets-src) ------------------------
  // Featured Planets, Characters, Starships & Vehicles rows; a card for each (Left/Right step through
  // the row, Down reaches its "Seen in" links); the era + "In story order" (before / after on the Star
  // Wars timeline); the opening crawl (original 'story so far' text) for the saga episodes.
  var SW_KINDS = {
    planet: { set: 'planets', row: 'Featured Planets', facts: [['Region', 'region'], ['Climate', 'climate'], ['Terrain', 'terrain']], sub: 'region', more: 'planets' },
    char: { set: 'chars', row: 'Characters', facts: [['Species', 'species'], ['Homeworld', 'homeworld'], ['Allegiance', 'side']], sub: 'species', more: 'characters' },
    ship: { set: 'ships', row: 'Starships & Vehicles', facts: [['Type', 'type'], ['Maker', 'maker'], ['Length', 'length']], sub: 'type', more: 'starships' }
  };
  // the film's extras: by this server's item id, else by its TMDB id (sw-card.js IvfSw.film - any server)
  var swItems = {}; // item id -> item (for its TMDB id)
  function swFilm(id) { return window.IvfSw ? window.IvfSw.film(swItems[id] || id) : null; }
  function swList(id, kind) {
    var D = window.IvfSwPlanets, f = swFilm(id); if (!f) return [];
    var refs = kind === 'planet' ? f.planets : kind === 'ship' ? f.ships : f.chars;
    return (refs || []).map(function (r) {
      var slug = typeof r === 'string' ? r : r.id, e = D[SW_KINDS[kind].set][slug];
      return e ? Object.assign({ kind: kind, slug: slug }, e, r.as ? { name: r.as } : {}, r.image ? { image: r.image } : {}) : null;
    }).filter(Boolean);
  }
  // the pictures are stored on the Jellyfin server (the Samsung app couldn't load Wookieepedia's: its
  // picture server refuses requests without a Referer, and the Tizen app runs from a local file)
  function swImg(e, w) { return window.IvfSwCard ? window.IvfSwCard.imgAttr(e.image, w) : ''; } // sw-card.js looks up the picture's current place
  function swRowHtml(id, kind) {
    var list = swList(id, kind); if (!list.length) return '';
    var K = SW_KINDS[kind];
    return '<section class="ivf-mv-row sw sw-' + kind + '"><h3>' + K.row + '</h3><div class="ivf-mv-strip">' + list.map(function (e) {
      var pic = swImg(e, kind === 'ship' ? 480 : 320);
      if (kind === 'ship') return '<button type="button" class="ivf-mv-item ivf-mv-wide ivf-sw-ship" data-sw="ship:' + esc(e.slug) + '" title="' + esc(e.name) + '"><div class="pic"' + pic + '></div>' +
        '<div class="band"><div class="t">' + esc(e.name) + '</div><div class="s">' + esc(e.type) + '</div></div></button>';
      return '<button type="button" class="ivf-mv-item ivf-mv-person ivf-sw-' + kind + '" data-sw="' + kind + ':' + esc(e.slug) + '" title="' + esc(e.name) + '"><div class="ivf-mv-face"' + pic + '></div>' +
        '<div class="ivf-mv-name">' + esc(e.name) + '</div>' + (kind === 'char' ? '' : '<div class="ivf-mv-role">' + esc(e[K.sub]) + '</div>') + '</button>';
    }).join('') + '</div></section>';
  }
  // A card (sw-card.js): Back returns to the item last shown in the row
  function swDialog(kind, slug) {
    var list = swList(cur.id, kind), i = 0;
    list.forEach(function (e, k) { if (e.slug === slug) i = k; });
    if (!window.IvfSwCard) return;
    window.IvfSwCard.open({ list: list, index: i, currentId: cur.id, onClose: function (e) {
      if (!cur || !root) return;
      var card = root.querySelector('[data-sw="' + kind + ':' + e.slug + '"]'), r = -1, k = -1;
      if (!card) return;
      (cur.rows || []).forEach(function (row, ri) { var j = row.indexOf(card); if (j >= 0) { r = ri; k = j; } });
      if (TV && r >= 0) focusAt(r, k); else card.focus({ preventScroll: true });
    } });
  }

  // Era + before/after on the Star Wars timeline (SwTimeline / SwYear provider ids, see sw-timeline.js)
  function swEra(k) {
    return k <= -100 ? 'The High Republic' : k < -18.5 ? 'Fall of the Jedi' : k < -1 ? 'Reign of the Empire' : k < 5 ? 'Age of Rebellion' : k < 28 ? 'The New Republic' : 'Rise of the First Order';
  }
  // (the story-order list: sw-card.js IvfSw.timelineList - every Star Wars title on this server)
  // copies of one film (35mm, extended, novel-named edits) sit within 0.05 of each other: one entry each
  function swNeighbours(id, list) {
    var groups = [];
    list.forEach(function (x) { var g = groups[groups.length - 1]; if (g && x.k - g[0].k <= 0.05) g.push(x); else groups.push([x]); });
    var at = -1; groups.forEach(function (g, i) { if (g.some(function (x) { return x.id === id; })) at = i; });
    if (at < 0) return null;
    return { before: at > 0 ? groups[at - 1][0] : null, after: at < groups.length - 1 ? groups[at + 1][0] : null };
  }
  function swStoryRowHtml(nb) {
    if (!nb || (!nb.before && !nb.after)) return '';
    function card(x, label) {
      var pic = x.tag ? imgUrl(x.id, 'Primary', { maxHeight: 600, tag: x.tag }) : '';
      return '<button type="button" class="ivf-mv-item ivf-mv-poster" data-go="' + x.id + '"><div class="pic"' + (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '></div>' +
        '<div class="t">' + esc(x.name) + '</div><div class="s">' + label + (x.year ? ' · ' + esc(x.year) : '') + '</div></button>';
    }
    return '<section class="ivf-mv-row"><h3>In Story Order</h3><div class="ivf-mv-strip">' + (nb.before ? card(nb.before, 'Before') : '') + (nb.after ? card(nb.after, 'After') : '') + '</div></section>';
  }

  // Opening crawl (full screen; Back closes)
  function swCrawl() {
    var c = (swFilm(cur.id) || {}).crawl; if (!c) return;
    var dlg = openDialog('<div class="ivf-crawl" tabindex="-1"><div class="ivf-crawl-intro">A long time ago in a galaxy far,<br>far away....</div>' +
      '<div class="ivf-crawl-view"><div class="ivf-crawl-text"><div class="ep">' + esc(c.episode) + '</div><div class="ti">' + esc(c.title) + '</div>' +
      c.text.map(function (p) { return '<p>' + esc(p) + '</p>'; }).join('') + '</div></div></div>');
    dlg.el.classList.add('crawl');
    dlg.el.querySelector('.ivf-crawl').focus({ preventScroll: true });
  }

  function openDialog(html) {
    var el = document.createElement('div');
    el.className = 'ivf-mv-dlg';
    el.innerHTML = '<div class="ivf-mv-box">' + html + '</div>';
    var dlg = { el: el, from: document.activeElement, onPick: null };
    el.addEventListener('click', function (e) {
      if (e.target === el) { closeDialog(); return; }
      var o = e.target.closest('.ivf-mv-opt'); if (o && dlg.onPick) dlg.onPick(o);
    });
    // mouse wheel over the window scrolls only its own list (it reached the page behind and moved the
    // top bar)
    el.addEventListener('wheel', function (e) {
      e.preventDefault();
      var box = el.querySelector('.ivf-mv-box');
      if (box) box.scrollTop += e.deltaY;
    }, { passive: false });
    document.body.appendChild(el);
    dialogs.push(dlg);
    return dlg;
  }
  function closeDialog() {
    var dlg = dialogs.pop(); if (!dlg) return false;
    dlg.el.remove();
    if (dlg.from && document.contains(dlg.from)) {
      // a card in one of the rows: select it the remote's way (scrolls the row to it)
      var r = -1, k = -1;
      if (cur && cur.rows) cur.rows.forEach(function (row, ri) { var j = row.indexOf(dlg.from); if (j >= 0) { r = ri; k = j; } });
      if (r >= 0 && TV) focusAt(r, k); else dlg.from.focus({ preventScroll: true });
    }
    return true;
  }

  // ---- show / hide ---------------------------------------------------------------------------------
  function detailId() {
    var m = /^#\/details\?(?:.*&)?id=([0-9a-f]{32})/i.exec(location.hash || '');
    return m ? m[1].toLowerCase() : null;
  }
  var MOVIES_KEY = 'ivf-movie-ids', known = {};
  try { known = JSON.parse(localStorage.getItem(MOVIES_KEY) || '{}') || {}; } catch (e) {}
  // known[id]: 1 = a film, 0 = not a film (an item never seen is covered at once too, so the stock page
  // with its cast never flashes up before ours - 2026-11-12, seen on the Samsung TV)
  function remember(id, v) { if (v === undefined) v = 1; if (known[id] === v) return; known[id] = v; try { localStorage.setItem(MOVIES_KEY, JSON.stringify(known)); } catch (e) {} }

  function ensureRoot() {
    addStyle();
    if (root) return;
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'ivf-off';
    document.body.appendChild(root);
    root.addEventListener('click', onClick);
  }
  var lastPos = {}; // film id -> { row, last } (Back to a film returns to where you were)
  // only a Back (history step) returns to the old place; opening a film again from a library starts at
  // the top with Play selected (round-4 beta: it reopened scrolled down at Scenes / More Like This)
  var cameBack = false;
  window.addEventListener('popstate', function () { cameBack = true; }, true);
  function savePos() {
    if (!cur || !cur.rows) return;
    var sc = root && root.querySelector('.ivf-mv-scroll'), strips = root ? root.querySelectorAll('.ivf-mv-strip') : [];
    if (!sc) return; // (already blanked: keep what was saved before)
    lastPos[cur.id] = { row: cur.row || 0, last: (cur.last || []).slice(), top: sc ? sc.scrollTop : 0,
      lefts: Array.prototype.map.call(strips, function (s) { return s.scrollLeft; }) };
  }
  // the film being returned to with Back: kept until it is drawn - the page check runs twice on the way back
  // (address change + Jellyfin's viewshow) and the second one used to forget it was a Back (beta round 6:
  // Back from a cast member or a More Like This film landed on Play at the top)
  var backId = null;
  function hide() {
    if (!root) return;
    savePos();
    while (dialogs.length) closeDialog();
    root.classList.add('ivf-off');
    document.documentElement.classList.remove('ivf-movie-on');
    cur = null;
  }
  // Web: below Jellyfin's top bar (the lowest visible one), like the web Discover page
  function placeBelowHeader() {
    if (TV || !root) return;
    var b = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      if (!h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      b = Math.max(b, Math.round(h.getBoundingClientRect().bottom));
    });
    if (root.style.getPropertyValue('--ivf-mv-top') !== b + 'px') root.style.setProperty('--ivf-mv-top', b + 'px');
  }
  window.addEventListener('resize', placeBelowHeader);
  // On a fresh load Jellyfin's bar can appear after the film page is drawn (it measured 0, so the
  // page's top sat under the bar): follow it while the page is showing
  if (!TV) setTimeout(function () {
    if (window.IvfWatch) window.IvfWatch(function () { if (root && !root.classList.contains('ivf-off')) placeBelowHeader(); }, 200);
  }, 0);
  function showBlank() { savePos(); ensureRoot(); placeBelowHeader(); setTimeout(placeBelowHeader, 300); root.innerHTML = ''; root.classList.remove('ivf-off'); document.documentElement.classList.add('ivf-movie-on'); }

  var token = 0;
  function check() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    var id = detailId();
    if (cameBack) backId = id; else if (id !== backId) backId = null;
    cameBack = false;
    if (!id) { hide(); return; }
    if (cur && cur.id === id) return;
    // film to film (More Like This): a film seen before replaces this one without hide(), so keep
    // this one's place now - Back to it returns to the card you pressed, not Play
    savePos();
    while (dialogs.length) closeDialog(); // (a planet card left open stayed over the next film)
    var t = ++token;
    // anything not known to be something else: cover the stock page at once (no flash)
    if (known[id] !== 0) showBlank(); else hide();
    // a known film: straight to its details (usually already fetched when its poster was selected);
    // anything else: check it's a film first
    var p = known[id] ? film(id) : ApiClient.getItem(uid(), id).then(function (item) {
      return item && item.Type === 'Movie' ? film(id) : { notFilm: true };
    });
    p.then(function (data) {
      if (t !== token || detailId() !== id) return;
      if (!data || data.notFilm || !data.item || data.item.Type !== 'Movie') { remember(id, 0); hide(); return; }
      remember(id);
      showBlank();
      cur = { id: id, item: data.item };
      render(data);
      var lp = backId === id ? lastPos[id] : null; backId = null;
      if (TV && lp && cur.rows[lp.row]) { lp.last.forEach(function (v, k) { if (k < cur.last.length) cur.last[k] = v; }); focusAt(lp.row, lp.last[lp.row] || 0); }
      // web: the same scroll position (page and each row) as when you left
      if (!TV && lp) {
        var sc = root.querySelector('.ivf-mv-scroll');
        Array.prototype.forEach.call(root.querySelectorAll('.ivf-mv-strip'), function (s, k) { if (lp.lefts && lp.lefts[k]) s.scrollLeft = lp.lefts[k]; });
        if (sc && lp.top) { sc.scrollTop = lp.top; requestAnimationFrame(function () { sc.scrollTop = lp.top; }); }
      }
      keepFocus();
    }, function () { if (t === token) hide(); });
  }
  // Jellyfin's own (hidden) page focuses its Play button when it appears: take the focus back
  function keepFocus() {
    if (!TV) return;
    [300, 800, 1500].forEach(function (ms) {
      setTimeout(function () {
        if (!cur || !cur.rows || root.classList.contains('ivf-off') || dialogs.length) return;
        var a = document.activeElement;
        if (a && root.contains(a)) return;
        var r = cur.row || 0;
        focusAt(r, (cur.last || [])[r] || 0);
      }, ms);
    });
  }
  // Coming back to the page (e.g. after playback): refresh progress / buttons, keep the selection
  function refresh() {
    if (!cur) return;
    var id = cur.id, r = cur.row || 0, i = (cur.last || [])[r] || 0;
    load(id).then(function (data) {
      if (!cur || cur.id !== id) return;
      cur.item = data.item;
      render(data);
      if (TV) focusAt(r, i);
      keepFocus();
    });
  }

  function onClick(e) {
    var b = e.target.closest('button'); if (!b || !cur) return;
    var act = b.getAttribute('data-act');
    if (act === 'play') play(false);
    else if (act === 'restart') play(true);
    else if (act === 'audio') chooseTrack('audio');
    else if (act === 'subs') chooseTrack('subs');
    else if (act === 'info') mediaInfo();
    else if (act === 'version') { var sv = stock('select.selectSource'); if (sv) sv.focus(); }
    else if (b.classList.contains('ivf-mv-ov')) {
      var dlg = openDialog('<div class="ivf-mv-dtitle">' + esc(cur.item.Name) + '</div><div class="ivf-mv-info" tabindex="-1">' + esc(cur.item.Overview || '') +
        ((cur.item.Genres || []).length ? '<span style="margin-top:' + d(10) + '">' + esc(cur.item.Genres.join(', ')) + '</span>' : '') + '</div>');
      dlg.el.querySelector('.ivf-mv-info').focus();
    } else if (act === 'crawl') swCrawl();
    else if (b.hasAttribute('data-sw')) { var sw = b.getAttribute('data-sw').split(':'); swDialog(sw[0], sw[1]); }
    else if (b.hasAttribute('data-person')) location.hash = '#/details?id=' + b.getAttribute('data-person') + '&serverId=' + ApiClient.serverId();
    else if (b.hasAttribute('data-go')) location.hash = '#/details?id=' + b.getAttribute('data-go') + '&serverId=' + ApiClient.serverId();
    else if (b.hasAttribute('data-chapter')) {
      var cards = stockPage() && stockPage().querySelectorAll('#scenesContent .card, .scenesContent .card');
      var c = cards && cards[+b.getAttribute('data-chapter')];
      if (c) (c.querySelector('[data-action]') || c).click();
    } else if (b.hasAttribute('data-extra')) {
      var ex = stockPage() && stockPage().querySelectorAll('#specialsContent .card, .specialsContent .card');
      var x = ex && ex[+b.getAttribute('data-extra')];
      if (x) (x.querySelector('[data-action]') || x).click();
    }
  }

  // ---- remote --------------------------------------------------------------------------------------
  window.addEventListener('keydown', function (e) {
    if (!root || root.classList.contains('ivf-off')) return;
    if (window.IvfSwCard && window.IvfSwCard.isOpen()) return; // sw-card.js has the keys
    var k = e.key || '', kc = e.keyCode;
    var back = k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || (kc === 10009 || kc === 461) || kc === 27 || kc === 8;
    var dir = k === 'ArrowLeft' || kc === 37 ? 'l' : k === 'ArrowRight' || kc === 39 ? 'r' : k === 'ArrowUp' || kc === 38 ? 'u' : k === 'ArrowDown' || kc === 40 ? 'd' : '';
    if (dialogs.length) {
      var box = dialogs[dialogs.length - 1].el;
      if (back) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); closeDialog(); return; }
      if (!dir) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      var info = box.querySelector('.ivf-mv-info');
      var opts = Array.prototype.slice.call(box.querySelectorAll('.ivf-mv-opt'));
      if (!opts.length && info) { var sb = box.querySelector('.ivf-mv-box'); sb.scrollTop += (dir === 'd' ? 1 : dir === 'u' ? -1 : 0) * sb.clientHeight * 0.5; return; }
      var i = opts.indexOf(document.activeElement);
      var n = dir === 'd' ? i + 1 : dir === 'u' ? i - 1 : i;
      if (opts[n]) opts[n].focus();
      return;
    }
    // web: Esc / Backspace leave the film page (they did nothing; there was no other way back except
    // the top bar). Not while typing, and not while one of Jellyfin's own dialogs is open.
    if (!TV && back && !document.querySelector('.dialogContainer .dialog')) {
      var tg = document.activeElement && document.activeElement.tagName;
      if (tg !== 'INPUT' && tg !== 'TEXTAREA') { e.preventDefault(); e.stopPropagation(); history.back(); return; }
    }
    if (!dir || !cur || !cur.rows) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    var a = document.activeElement, r = -1, idx = -1;
    cur.rows.forEach(function (row, ri) { var j = row.indexOf(a); if (j >= 0) { r = ri; idx = j; } });
    if (r < 0) { focusAt(0, 0); return; }
    if (dir === 'l') focusAt(r, idx - 1);
    else if (dir === 'r') focusAt(r, idx + 1);
    else if (dir === 'u' && r > 0) focusAt(r - 1, cur.last[r - 1]);
    else if (dir === 'd' && r < cur.rows.length - 1) focusAt(r + 1, cur.last[r + 1]);
  }, true);

  // Opening a film from a poster: cover the stock page at once (no flash)
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-type="Movie"][data-id]');
    if (c && !c.closest('#' + ROOT_ID)) { remember(c.getAttribute('data-id')); film(c.getAttribute('data-id')); }
  }, true);
  // TV: a film poster that stays selected for a moment starts loading its page (not every poster
  // passed while scrolling)
  var preTimer = null;
  document.addEventListener('focusin', function (e) {
    clearTimeout(preTimer);
    var c = e.target.closest && e.target.closest('[data-type="Movie"][data-id]');
    if (!TV || !c || c.closest('#' + ROOT_ID)) return;
    remember(c.getAttribute('data-id'));
    preTimer = setTimeout(function () { if (document.activeElement === e.target) film(c.getAttribute('data-id')); }, 450);
  }, true);
  // Back from the player (or any history step) to a film we know: cover the stock page in the same
  // moment, before the browser draws Jellyfin's cached page (a setTimeout alone let it flash)
  function coverKnownNow() {
    var id = detailId();
    if (id && known[id] !== 0 && !(cur && cur.id === id)) showBlank();
  }
  window.addEventListener('ivf-nav', coverKnownNow); // forward (pushState) and Back
  window.addEventListener('hashchange', function () { coverKnownNow(); setTimeout(check, 0); });
  document.addEventListener('viewshow', function () {
    if (cur && detailId() === cur.id) { root.classList.remove('ivf-off'); document.documentElement.classList.add('ivf-movie-on'); refresh(); return; }
    setTimeout(check, 0);
  });
  // Playback starting hides the page (the player is its own route)
  check();
})();

} catch (e) { console.error('IvanaFin script movie-page failed:', e); } })();
/* IvanaFin - music-page */
(function() { try {
// IvanaFin (web + Samsung): the Music library, laid out like Spotify's TV app
// (reference pictures: design-refs/spotify-tv-home.png and spotify-tv-now-playing.png).
//   top bar:  now-playing pill (left; opens Now Playing) | Home / Search / Your Library | Welcome <name>
//   Home:     the selected item's picture large on the right fading into the dark, its name and
//             "Artist • Album • N songs" on the left; 2 x 4 shortcut cards (the 8 most recently
//             played albums); rows Recently added / Albums / Artists
//   Album, Liked Songs, Artist pages in the same style (picture top-right, title, Play / Shuffle,
//             tracks); Your Library = a grid of every album (or artist) with a sort pill; Search
//   Now Playing: full-screen picture, "PLAYING FROM ALBUM", cover + title, progress, controls,
//             About the artist. Opens only from the top-left pill.
// Music only plays inside Music: leaving Music stops it.
// Opens for the Music library route (#/music?...) and for any album's details page.
// Playing goes through Jellyfin's own player manager (found in its bundle); a hidden Jellyfin list
// ("play all from here") and the hidden Jellyfin now-playing bar are the fallback.
// Remote (Samsung): arrows move to the nearest item in that direction; OK opens/plays; Back:
// Now Playing -> page -> previous page -> Music Home -> out of Music.
(function () {
  'use strict';
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var DF = TV ? 1 : 0.72;
  var GREEN = 'var(--ma,#fa586a)'; // (name kept: the accent - taken from the page's picture, see palette())
  var BG = '#121212';
  var ROOT_ID = 'ivf-music';
  var R = '#' + ROOT_ID + ' ';
  var root = null, topEl = null, page = null, np = null, artEl = null;
  var lib = { id: null };
  var home = null;           // { liked, recent, added, all, artists }
  var view = null;           // { v: 'home'|'library'|'search'|'album'|'liked'|'artist', arg, data }
  var stack = [];            // previous views (with the item that had the focus)
  var now = { id: null, albumId: null, playing: false };
  var isOpen = false, npOpen = false;
  var libMode = 'albums', searchText = '';

  // One set of text sizes for all of Music (plan part 5) - the same list as the Android app's MuType
  var MU_TYPE = { hero: 32, page: 26, row: 16, body: 13, card: 11, label: 10 };
  function d(n) { return 'calc(var(--ivf-dp) * ' + (Math.round(n * DF * 100) / 100) + ')'; }
  function px(n) { return n * DF * window.innerWidth / 960; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function icon(n, cls) { return '<span class="material-icons' + (cls ? ' ' + cls : '') + '" aria-hidden="true">' + n + '</span>'; }
  function uid() { return ApiClient.getCurrentUserId(); }
  function imgUrl(id, type, q) { return ApiClient.getUrl('/Items/' + id + '/Images/' + type, q || {}); }
  function bgi(u) { return u ? ' style="background-image:url(\'' + u + '\')"' : ''; }
  function mmss(ticks) { var s = Math.round((ticks || 0) / 1e7); return Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2); }
  function longDur(ticks) {
    var s = Math.round((ticks || 0) / 1e7), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return h ? h + ' hr ' + m + ' min' : m + ' min ' + (s % 60) + ' sec';
  }
  function store(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } }
  function songs(n) { return n + (n === 1 ? ' song' : ' songs'); }
  function getItems(q) { return ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid() + '/Items', q)).then(function (r) { return (r && r.Items) || []; }, function () { return []; }); }
  function shuffle(a) { a = a.slice(); for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), x = a[i]; a[i] = a[j]; a[j] = x; } return a; }

  // ---- style ---------------------------------------------------------------------------------------
  function addStyle() {
    if (document.getElementById('ivf-music-style')) return;
    var s = document.createElement('style');
    s.id = 'ivf-music-style';
    var css = [
      ':root{--ivf-dp:calc(100vw / 960)}',
      // Jellyfin's own now-playing bar never shows (ours replaces it in Music; outside Music nothing plays)
      '.appfooter{visibility:hidden !important;pointer-events:none !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important}',
      // Jellyfin's own pages underneath are never seen: don't let the TV keep drawing them
      'html.ivf-music-on .mainAnimatedPages,html.ivf-music-on .backdropContainer{visibility:hidden !important}',
      'html.ivf-music-on header.MuiAppBar-root > .MuiToolbar-root ~ .MuiToolbar-root,html.ivf-music-on .alphaPicker-fixed-right,html.ivf-music-on .alphaPicker{display:none !important}',
      TV ? 'html.ivf-music-on .skinHeader{display:none !important}'
        : 'html.ivf-music-on .skinHeader,html.ivf-music-on header.MuiAppBar-root{z-index:950 !important;background:transparent !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;box-shadow:none !important;border-bottom:0 !important}' +
          // web: the top bar stays on Music pages (round-5 beta: it was missing on Now Playing opened from
          // Home, and gone after the screensaver); it fades away with the controls in the screensaver
          'html.ivf-music-on:not(.ivf-mu-ss) .skinHeader{opacity:1 !important;visibility:visible !important}' +
          'html.ivf-music-on .skinHeader{transition:opacity .9s !important}html.ivf-mu-ss .skinHeader{opacity:0 !important}' +
          'html.ivf-music-on .backdropContainer{display:none !important}html.ivf-music-on .backgroundContainer{background:#000 !important}' +
          // Now Playing: scrolled content fades out just under the see-through bar (the photo behind is its own layer)
          R + '.nps{-webkit-mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-mu-hd,0px) - 6px),#000 calc(var(--ivf-mu-hd,0px) + 18px));' +
          'mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-mu-hd,0px) - 6px),#000 calc(var(--ivf-mu-hd,0px) + 18px))}',
      '@property --mtc{syntax:"<color>";inherits:true;initial-value:#121212}',
      '#' + ROOT_ID + '{--mtc:' + BG + ';position:fixed;left:0;right:0;bottom:0;top:0;z-index:850;color:#fff;font-family:Roboto,"Segoe UI",sans-serif;font-weight:400;overflow:hidden;',
      'background:var(--mtc);transition:--mtc .7s ease}',
      '#' + ROOT_ID + '.ivf-off{display:none}',
      R + 'span,' + R + 'div{font-weight:inherit}',
      R + 'button{font-family:inherit;color:inherit;border:0;background:none;padding:0;margin:0;cursor:pointer;outline:none;text-align:left}',
      R + 'h1,' + R + 'h2{margin:0}',
      // ---- top bar ----
      // starts at the very top (under Jellyfin's see-through bar on web), so when the page scrolls its dark
      // background covers that bar's area too - no band of picture left showing above it
      R + '.top{position:absolute;left:0;right:0;top:0;z-index:5;height:calc(' + d(104) + ' + var(--ivf-mu-hd,0px));display:flex;align-items:flex-start;padding:calc(' + d(34) + ' + var(--ivf-mu-hd,0px)) ' + d(40) + ' 0;box-sizing:border-box;pointer-events:none;transition:background .2s}',
      R + '.top>*{pointer-events:auto}',
      // the dark backing fades in gradually as the page scrolls (--ivf-mu-sc 0..1), so it never sits as a block over the picture
      R + '.top::before{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;background:linear-gradient(var(--mtc) 82%,rgba(18,18,18,0));opacity:var(--ivf-mu-sc,0)}',
      R + '.mini{flex:none;width:' + d(200) + ';height:' + d(36) + ';display:flex;align-items:center;gap:' + d(10) + ';border-radius:' + d(4) + ';background:var(--mc,#2a2a2a);overflow:hidden;padding-right:' + d(10) + ';box-sizing:border-box}',
      R + '.mini.off{visibility:hidden}',
      R + '.mini .c{flex:none;width:' + d(36) + ';height:' + d(36) + ';background:#333 center/cover no-repeat}',
      R + '.mini .tx{flex:1;min-width:0}',
      R + '.mini .n{font-size:' + d(11) + ';line-height:' + d(14) + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.mini .a{font-size:' + d(8.5) + ';line-height:' + d(11) + ';color:rgba(255,255,255,.7);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.mini .pp{flex:none;display:flex}' + R + '.mini .pp .material-icons{font-size:' + d(18) + '}',
      R + '.nav{flex:1;display:flex;justify-content:center;gap:' + d(16) + '}',
      // a space as wide as the now-playing pill on the right keeps Home / Search / Your Library centred
      R + '.top::after{content:"";flex:none;width:' + d(200) + '}',
      R + '.nv{display:flex;align-items:center;gap:' + d(7) + ';height:' + d(36) + ';padding:0 ' + d(10) + ';border-radius:999px;color:rgba(255,255,255,.6);font-size:' + d(12) + ';font-weight:500}',
      R + '.nv .material-icons{font-size:' + d(18) + '}',
      R + '.nv.on{color:#fff}',
      // ---- page ----
      // the selected item's picture sits in its own layer behind the page, so it stays put while the page scrolls
      R + '.art{position:absolute;inset:0;overflow:hidden;pointer-events:none}',
      R + '.page{position:absolute;inset:0;padding-top:var(--ivf-mu-hd,0px);box-sizing:border-box;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}',
      R + '.page::-webkit-scrollbar{display:none}',
      R + '.pg{position:relative;min-height:100%;padding-bottom:' + d(48) + ';box-sizing:border-box}',
      // the selected item's picture, top-right, fading into the page on the left and at the bottom
      R + '.hart{position:absolute;right:0;top:0;width:66%;height:calc(' + d(340) + ' + var(--ivf-mu-hd,0px));background:transparent center 30%/cover no-repeat;opacity:.9;transition:opacity .4s}',
      R + '.hart{-webkit-mask-image:linear-gradient(90deg,transparent 0,#000 50%),linear-gradient(0deg,transparent 0,#000 55%);-webkit-mask-composite:source-in;' +
        'mask-image:linear-gradient(90deg,transparent 0,#000 50%),linear-gradient(0deg,transparent 0,#000 55%);mask-composite:intersect}',
      // album covers are square: shown whole on the right (not cropped to a wide strip, which zooms right in)
      // album covers (square): shown whole and sharp - rounded corners, a soft shadow, no fade (user
      // 2026-11-13: the colour fading into the cover looked odd) - small enough to sit above the
      // shortcut cards and the track list (same as the Android app)
      R + '.hart.sq{width:' + d(230) + ';height:' + d(230) + ';top:calc(' + d(24) + ' + var(--ivf-mu-hd,0px));right:' + d(40) + ';border-radius:' + d(8) + ';background-size:cover;background-position:center;opacity:1;' +
        'box-shadow:0 ' + d(8) + ' ' + d(24) + ' rgba(0,0,0,.45);-webkit-mask-image:none;mask-image:none}',
      R + '.hart.liked{background-image:linear-gradient(135deg,#450af5,#8e8ee5 60%,#c4efd9);background-size:cover}',
      R + '.hart .hk{position:absolute;right:22%;top:30%;font-size:' + d(110) + ';color:rgba(255,255,255,.9)}',
      R + '.hero{position:relative;padding:' + d(124) + ' ' + d(40) + ' 0;min-height:' + d(141) + ';box-sizing:content-box;max-width:52%}',
      R + '.hk2{font-size:' + d(10) + ';font-weight:500;color:rgba(255,255,255,.7);margin-bottom:' + d(4) + '}',
      R + '.ht{font-size:' + d(MU_TYPE.hero) + ';line-height:1.12;font-weight:700;letter-spacing:-0.01em;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;word-break:break-word}',
      R + '.hm{display:flex;align-items:center;gap:' + d(5) + ';margin-top:' + d(6) + ';font-size:' + d(11) + ';color:rgba(255,255,255,.75);white-space:nowrap;overflow:hidden}',
      R + '.hm .av{flex:none;width:' + d(16) + ';height:' + d(16) + ';border-radius:50%;background:#535353 center/cover no-repeat}',
      R + '.hm .av.liked{background:linear-gradient(135deg,#450af5,#c4efd9)}',
      // shortcut cards (2 x 4)
      R + '.sg{position:relative;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:' + d(10) + ' ' + d(18) + ';padding:' + d(2) + ' ' + d(40) + ' 0}',
      R + '.sc{display:flex;align-items:center;gap:' + d(10) + ';height:' + d(50) + ';background:var(--sct,rgba(255,255,255,.09));border-radius:' + d(4) + ';overflow:hidden;padding-right:' + d(10) + ';font-size:' + d(12) + ';font-weight:700}',
      R + '.sc .c{flex:none;width:' + d(50) + ';height:' + d(50) + ';background:#333 center/cover no-repeat;display:flex;align-items:center;justify-content:center}',
      R + '.sc .c.liked{background:linear-gradient(135deg,#450af5,#c4efd9)}' + R + '.sc .c .material-icons{font-size:' + d(22) + '}',
      R + '.sc .n{min-width:0;line-height:1.25;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      R + '.sc.on .n{color:' + GREEN + '}',
      // rows of square cards
      R + '.row{position:relative;margin-top:' + d(22) + '}',
      R + '.row h2,' + R + '.lh{font-size:' + d(16) + ';font-weight:700;padding:0 ' + d(40) + ';margin-bottom:' + d(8) + '}',
      R + '.strip{display:flex;gap:' + d(20) + ';overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:' + d(10) + ' ' + d(40) + ';margin:' + d(-7) + ' 0}', // (room for a selected card: it grows 6% and gets a ring - 3 cut the ring off)
      R + '.strip::-webkit-scrollbar{display:none}',
      R + '.cd{flex:none;position:relative;width:' + d(106) + ';border-radius:' + d(4) + '}',
      R + '.cd .p{display:block;width:100%;padding-top:100%;border-radius:' + d(4) + ';background:#282828 center/cover no-repeat}',
      R + '.cd .o{position:absolute;left:0;right:0;bottom:0;padding:' + d(26) + ' ' + d(8) + ' ' + d(7) + ';border-radius:0 0 ' + d(4) + ' ' + d(4) + ';background:linear-gradient(rgba(0,0,0,0),rgba(0,0,0,.6) 45%,rgba(0,0,0,.88)); /* round 5: titles on pale covers (Yeezus 2) */font-size:' + d(MU_TYPE.card) + ';font-weight:700;line-height:1.2;',
      'text-shadow:0 1px 3px rgba(0,0,0,.85)}' + R + '.cd .o>span{overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      R + '.cd.on .o{color:' + GREEN + '}',
      R + '.cd.ar .p{border-radius:50%}',
      R + '.cd.ar .o{position:static;background:none;text-align:center;padding:' + d(6) + ' 0 0;font-weight:500;text-shadow:none}',
      // Your Library grid
      R + '.lt{position:relative;display:flex;align-items:center;gap:' + d(10) + ';padding:' + d(110) + ' ' + d(40) + ' ' + d(14) + '}',
      // Sort by list under the sort chip
      R + '.sortm{position:absolute;right:' + d(40) + ';top:calc(100% - ' + d(6) + ');z-index:6;min-width:' + d(180) + ';padding:' + d(6) + ';border-radius:' + d(8) + ';background:#282828;box-shadow:0 ' + d(4) + ' ' + d(12) + ' rgba(0,0,0,.5)}',
      R + '.sortm .sk{padding:' + d(6) + ' ' + d(10) + ' ' + d(4) + ';font-size:' + d(9) + ';font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:rgba(255,255,255,.6)}',
      R + '.sortm .so{display:flex;align-items:center;justify-content:space-between;width:100%;box-sizing:border-box;padding:' + d(8) + ' ' + d(10) + ';border-radius:' + d(4) + ';font-size:' + d(11) + ';font-weight:500}',
      R + '.sortm .so.on{color:' + GREEN + '}' + R + '.sortm .so .material-icons{font-size:' + d(15) + '}',
      R + '.sortm .so:focus,' + R + '.sortm .so:hover{background:rgba(255,255,255,.12);box-shadow:none}',
      R + '.lt h1{font-size:' + d(MU_TYPE.page) + ';font-weight:700;margin-right:' + d(12) + '}',
      R + '.chip{height:' + d(26) + ';padding:0 ' + d(12) + ';border-radius:999px;background:#2a2a2a;font-size:' + d(11) + ';font-weight:500;display:inline-flex;align-items:center;gap:' + d(5) + '}',
      R + '.chip.on{background:var(--ma,#fff);color:var(--ma-ink,#000)}',
      R + '.lt .cnt{font-size:' + d(11) + ';color:rgba(255,255,255,.65);margin-right:' + d(6) + '}',
      R + '.chip .material-icons{font-size:' + d(15) + '}',
      R + '.chip.sort{margin-left:auto}',
      R + '.npf{margin-left:auto;display:flex;gap:' + d(8) + ';align-items:center}' + R + '.npf input{height:' + d(32) + ';width:' + d(200) + ';box-sizing:border-box;padding:0 ' + d(14) + ';border-radius:999px;border:' + d(1) + ' solid rgba(255,255,255,.35) !important;background:rgba(0,0,0,.35) !important;color:#fff;font:inherit;font-size:' + d(13) + ';outline:none;box-shadow:none !important}' + R + '.npf input:focus{border-color:#fff !important}',
      R + '.gd{display:grid;grid-template-columns:repeat(7,minmax(0,1fr));gap:' + d(16) + ' ' + d(18) + ';padding:' + d(3) + ' ' + d(40) + '}',
      R + '.gd .cd{width:auto;padding:' + d(7) + ' ' + d(7) + ' ' + d(9) + ';border-radius:' + d(8) + ';background:var(--sct,rgba(255,255,255,.06));transition:background .5s}',
      R + '.gd .cd .p{box-shadow:0 ' + d(3) + ' ' + d(10) + ' rgba(0,0,0,.3)}',
      // Search: Browse all - big colour tiles, each with a tilted cover
      R + '.bwh{font-size:' + d(MU_TYPE.row) + ';font-weight:700;padding:' + d(18) + ' ' + d(40) + ' ' + d(10) + '}',
      R + '.bwg{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:' + d(14) + ';padding:0 ' + d(40) + ' ' + d(30) + '}',
      R + '.bw{position:relative;height:' + d(96) + ';border-radius:' + d(8) + ';overflow:hidden;background:var(--bwc);padding:' + d(12) + ';text-align:left;font-size:' + d(16) + ';font-weight:700;line-height:1.15;color:#fff;transition:filter .2s}',
      R + '.bw span{position:relative;z-index:1;display:block;max-width:70%}',
      R + '.bw .p{position:absolute;right:' + d(-12) + ';bottom:' + d(-6) + ';width:' + d(66) + ';height:' + d(66) + ';border-radius:' + d(4) + ';background:#333 center/cover no-repeat;transform:rotate(25deg);box-shadow:0 ' + d(2) + ' ' + d(8) + ' rgba(0,0,0,.4)}',
      R + '.bw .p.ar{border-radius:50%}',
      R + '.bw .p.liked{background:linear-gradient(135deg,#450af5,#c4efd9);display:flex;align-items:center;justify-content:center}' + R + '.bw .p.liked .material-icons{font-size:' + d(30) + ';transform:rotate(-25deg)}',
      R + '.bw:hover{filter:brightness(1.12)}' + R + '.bw:focus{box-shadow:0 0 0 ' + d(3) + ' #fff}',
      R + '.bvh{padding:' + d(110) + ' ' + d(40) + ' ' + d(14) + '}' + R + '.bvh .k{font-size:' + d(11) + ';font-weight:700;color:rgba(255,255,255,.75)}' + R + '.bvh h1{font-size:' + d(MU_TYPE.hero) + ';font-weight:800;margin-top:' + d(2) + '}',
      R + '.cd .ln{display:block;margin-top:' + d(6) + ';font-size:' + d(11) + ';font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.cd .ls{display:block;font-size:' + d(MU_TYPE.label) + ';color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.cd.ar .ln,' + R + '.cd.ar .ls{text-align:center}',
      R + '.cd.on .ln{color:' + GREEN + '}',
      R + '.empty{padding:' + d(20) + ' ' + d(40) + ';font-size:' + d(13) + ';color:rgba(255,255,255,.6)}',
      // Search
      R + '.sbox{display:flex;align-items:center;gap:' + d(10) + ';margin:' + d(110) + ' ' + d(40) + ' ' + d(6) + ';height:' + d(44) + ';padding:0 ' + d(16) + ';background:#fff;color:#121212;border-radius:999px;max-width:' + d(520) + '}',
      R + '.sbox .material-icons{font-size:' + d(22) + ';color:#121212}',
      R + '.sbox input{flex:1;min-width:0;height:100%;border:0;outline:none;background:transparent;color:#121212;font:inherit;font-size:' + d(15) + '}',
      R + '.sbox input::-webkit-search-cancel-button{-webkit-appearance:none;display:none}',
      // (the theme gives a focused text field its own white box and border, which poked out of the
      // rounded search box - round-5 beta)
      R + '.sbox input,' + R + '.sbox input:focus{background:transparent !important;border:0 !important;box-shadow:none !important;outline:none !important}',
      R + '.sbox.fo{box-shadow:0 0 0 ' + d(3) + ' var(--ma,#fff)}',
      // Jellyfin's own volume pop-up (top right) covered Now Playing's close button; Music has its own
      // volume slider (round-5 beta)
      'html.ivf-music-on .iconOsd{display:none !important}',
      // album / artist page
      R + '.acts{position:relative;display:flex;align-items:center;gap:' + d(12) + ';padding:' + d(16) + ' ' + d(40) + ' ' + d(10) + '}',
      R + '.bt{height:' + d(36) + ';display:inline-flex;align-items:center;justify-content:center;gap:' + d(6) + ';padding:0 ' + d(18) + ';border-radius:999px;background:rgba(255,255,255,.12);font-size:' + d(12) + ';font-weight:700}',
      R + '.bt .material-icons{font-size:' + d(20) + '}',
      R + '.bt.pri{background:var(--ma,#fa586a);color:var(--ma-ink,#fff)}',
      R + '.bt.rd{width:' + d(36) + ';padding:0}',
      R + '.bt.fav.on{color:' + GREEN + '}',
      R + '.bt.fav .material-icons,' + R + '.ib.tfav .material-icons,' + R + '[data-np="fav"] .material-icons{font-variation-settings:"FILL" 0}',
      R + '.bt.fav.on .material-icons,' + R + '.ib.tfav.on .material-icons,' + R + '[data-np="fav"].on .material-icons{font-variation-settings:"FILL" 1}',
      // the track list has the page colour behind it (fading in over its first rows), so the picture
      // on the right never shows through the song lengths
      R + '.tl{position:relative;padding:' + d(6) + ' ' + d(34) + ' 0}',

      R + '.tr{display:grid;grid-template-columns:' + d(28) + ' minmax(0,1fr) auto;align-items:center;column-gap:' + d(12) + ';height:' + d(44) + ';padding:0 ' + d(10) + ';border-radius:' + d(4) + ';font-size:' + d(11) + ';color:rgba(255,255,255,.65);cursor:pointer;outline:none}',
      R + '.tr .n{display:flex;justify-content:flex-end;align-items:center;font-size:' + d(12) + ';font-variant-numeric:tabular-nums}',
      R + '.tr .n .pl{display:none;font-size:' + d(16) + ';color:#fff}',
      R + '.tr .nm{min-width:0}',
      R + '.tr .a{font-size:' + d(MU_TYPE.body) + ';line-height:' + d(18) + ';color:#fff;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.tr .b{line-height:' + d(15) + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.tr .t{display:flex;align-items:center;gap:' + d(10) + ';font-variant-numeric:tabular-nums}',
      R + '.tr .ib{display:inline-flex;visibility:hidden;color:rgba(255,255,255,.7)}' + R + '.tr .ib .material-icons{font-size:' + d(16) + '}',
      R + '.tr .ib.on{visibility:visible;color:' + GREEN + '}',
      R + '.tr.on .a{color:' + GREEN + '}',
      R + '.tr.on .n .num{display:none}' + R + '.tr.on .n .eq{display:inline-flex}',
      R + '.disc{display:flex;align-items:center;gap:' + d(10) + ';height:' + d(34) + ';padding:' + d(8) + ' ' + d(10) + ' 0;font-size:' + d(12) + ';font-weight:700;color:rgba(255,255,255,.7)}',
      R + '.disc .material-icons{font-size:' + d(16) + '}',
      R + '.eq{display:none;align-items:flex-end;gap:' + d(1.5) + ';height:' + d(12) + '}',
      R + '.eq i{display:block;width:' + d(2.5) + ';height:100%;background:' + GREEN + ';transform-origin:bottom;animation:ivfMuEq .9s ease-in-out infinite}',
      R + '.eq i:nth-child(2){animation-delay:-.3s}' + R + '.eq i:nth-child(3){animation-delay:-.6s}' + R + '.eq i:nth-child(4){animation-delay:-.45s}',
      R + '.paused .eq i{animation-play-state:paused}',
      '@keyframes ivfMuEq{0%,100%{transform:scaleY(.25)}50%{transform:scaleY(1)}}',
      R + '.about{position:relative;margin:' + d(26) + ' ' + d(40) + ' 0;max-width:' + d(560) + ';font-size:' + d(12) + ';line-height:1.5;color:rgba(255,255,255,.75)}',
      R + '.about h2{font-size:' + d(16) + ';color:#fff;margin-bottom:' + d(6) + '}',
      R + '.about p{margin:0;overflow:hidden;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical}',
      // artist page: Popular (5 rows until See more), About card (photo + bio, select to read it all)
      R + '.pop{margin:' + d(18) + ' ' + d(30) + ' 0}' + R + '.pop h2{font-size:' + d(16) + ';color:#fff;margin:0 0 ' + d(6) + ' ' + d(10) + '}',
      R + '.pop.cl .tr:nth-child(n+6){display:none}',
      R + '.pop .bt.sm{margin:' + d(6) + ' 0 0 ' + d(10) + '}',
      R + '.about{max-width:none}',
      R + '.abt{display:flex;gap:' + d(20) + ';width:' + d(760) + ';max-width:100%;padding:' + d(16) + ';border:0;border-radius:' + d(8) + ';background:#242424;color:inherit;font:inherit;text-align:left;cursor:pointer;outline:none}',
      R + '.abt:focus-visible,' + R + '.abt:hover{box-shadow:0 0 0 ' + d(2) + ' #fff}',
      R + '.abt .ph{flex:none;width:' + d(170) + ';height:' + d(170) + ';border-radius:' + d(6) + ';background:#333 center/cover no-repeat}',
      R + '.abt .tx{display:flex;flex-direction:column;min-width:0}',
      R + '.abt .an{font-size:' + d(18) + ';font-weight:700;color:#fff;margin-bottom:' + d(6) + '}',
      R + '.abt .ao{font-size:' + d(12) + ';line-height:1.5;color:rgba(255,255,255,.8);white-space:pre-line;overflow:hidden;display:-webkit-box;-webkit-line-clamp:6;-webkit-box-orient:vertical}',
      R + '.abt .rm{margin-top:' + d(6) + ';font-size:' + d(11) + ';font-weight:700;color:#fff}',
      R + '.abt.open .ao{display:block;-webkit-line-clamp:unset}' + R + '.abt.open .rm{display:none}',
      // ---- Now Playing ----
      R + '.np{position:absolute;inset:0;z-index:10;background:#000;display:none}',
      R + '.np.on{display:block}',
      R + '.npbg{position:absolute;inset:0;background:#333 center 25%/cover no-repeat}',
      R + '.npbg::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,.22),rgba(0,0,0,.28)),var(--npw,rgba(60,60,60,.55));transition:background .7s}',
      R + '.nps{position:absolute;inset:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none}' + R + '.nps::-webkit-scrollbar{display:none}',
      R + '.npin{position:relative;padding:0 ' + d(60) + ' ' + d(40) + '}',
      R + '.npt{display:flex;align-items:center;gap:' + d(10) + ';padding-top:calc(' + d(40) + ' + var(--ivf-mu-hd,0px));height:' + d(32) + '}',
      R + '.npt .lg{width:' + d(28) + ';height:' + d(28) + ';border-radius:50%;background:rgba(255,255,255,.85);color:#555;display:flex;align-items:center;justify-content:center}',
      R + '.npt .lg .material-icons{font-size:' + d(18) + '}',
      R + '.npt .k{font-size:' + d(8) + ';letter-spacing:.12em;color:rgba(255,255,255,.75)}',
      R + '.npt .al{font-size:' + d(MU_TYPE.card) + ';font-weight:700;margin-top:' + d(2) + '}',
      R + '.npx{position:absolute;right:' + d(40) + ';top:calc(' + d(36) + ' + var(--ivf-mu-hd,0px));width:' + d(36) + ';height:' + d(36) + ';border-radius:50%;display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.3)}',
      R + '.npx .material-icons{font-size:' + d(24) + '}',
      R + '.npm{display:flex;align-items:center;gap:' + d(18) + ';margin-top:' + d(189) + '}',
      R + '.npm .c{flex:none;width:' + d(87) + ';height:' + d(87) + ';border-radius:' + d(3) + ';background:#333 center/cover no-repeat;box-shadow:0 ' + d(4) + ' ' + d(14) + ' rgba(0,0,0,.35)}',
      R + '.npm .tx{min-width:0}',
      R + '.npm .n{font-size:' + d(MU_TYPE.hero) + ';font-weight:700;line-height:1.15;overflow:hidden;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical}',
      R + '.npm .a{display:block;font-size:' + d(12) + ';margin-top:' + d(4) + ';padding:' + d(2) + ' ' + d(4) + ';margin-left:' + d(-4) + ';border-radius:' + d(4) + ';color:rgba(255,255,255,.85)}',
      // links to an artist: the name on Now Playing and the album header's artist
      R + '.hm{padding:' + d(3) + ';margin-left:' + d(-3) + '}', // (room for the artist link's focus ring)
      R + '.arl{display:inline-flex;align-items:center;gap:' + d(5) + ';color:#fff;font-weight:700;font-size:inherit;padding:' + d(2) + ' ' + d(5) + ' ' + d(2) + ' ' + d(2) + ';border-radius:999px}',
      R + '.arl:hover,' + R + '.npm .a:hover{text-decoration:underline}',
      R + '.npp{margin-top:' + d(20) + '}',
      R + '.npbar{display:block;width:100%;height:' + d(14) + ';position:relative;border-radius:' + d(3) + '}',
      R + '.npbar i{position:absolute;left:0;right:0;top:50%;height:' + d(2.5) + ';margin-top:' + d(-1.25) + ';background:rgba(255,255,255,.3);border-radius:999px;overflow:hidden}',
      R + '.npbar b{display:block;height:100%;width:0;background:#fff}',
      R + '.nptm{display:flex;justify-content:space-between;font-size:' + d(10) + ';color:rgba(255,255,255,.85);font-variant-numeric:tabular-nums;margin-top:' + d(2) + '}',
      R + '.npc{position:relative;display:flex;align-items:center;justify-content:center;margin-top:' + d(6) + ';height:' + d(53) + '}',
      R + '.npc .hf{position:absolute;left:0;top:50%;margin-top:' + d(-17) + '}',
      R + '.npc .pill{display:flex;align-items:center;gap:' + d(22) + ';height:100%;padding:0 ' + d(26) + ';border-radius:' + d(8) + ';background:rgba(40,40,40,.72)}',
      R + '.ic{width:' + d(34) + ';height:' + d(34) + ';border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:rgba(255,255,255,.85);position:relative}',
      R + '.ic .material-icons{font-size:' + d(20) + '}',
      R + '.ic.big{background:#fff;color:#000}' + R + '.ic.big .material-icons{font-size:' + d(24) + '}',
      R + '.ic.act{color:' + GREEN + '}',
      'html.ivf-music-on .actionSheet .actionSheetMenuItem:focus,html.ivf-music-on .actionSheet .listItem:focus{background:#d1d5db !important;color:#131414 !important}',
      'html.ivf-music-on .actionSheet .actionSheetMenuItem:focus .material-icons,html.ivf-music-on .actionSheet .listItem:focus .material-icons{color:#131414 !important}',
      R + '.ic.act::after{content:"";position:absolute;bottom:' + d(1) + ';left:50%;width:' + d(4) + ';height:' + d(4) + ';margin-left:' + d(-2) + ';border-radius:50%;background:' + GREEN + '}',
      R + '.ic.hf.on{color:' + GREEN + '}',
      R + '.npab{margin-top:' + d(34) + '}',
      R + '.npab h2{font-size:' + d(16) + ';font-weight:700;margin-bottom:' + d(10) + '}',
      R + '.abc{display:block;position:relative;width:' + d(410) + ';height:' + d(250) + ';border-radius:' + d(8) + ';overflow:hidden;background:#333 center 20%/cover no-repeat}',
      R + '.abc::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 35%,rgba(0,0,0,.85))}',
      R + '.abc .tx{position:absolute;left:' + d(18) + ';right:' + d(18) + ';bottom:' + d(14) + ';z-index:1}',
      R + '.abc .an{font-size:' + d(16) + ';font-weight:700}',
      R + '.abc .ao{margin-top:' + d(4) + ';font-size:' + d(MU_TYPE.card) + ';line-height:1.45;color:rgba(255,255,255,.85);overflow:hidden;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical}',
      // ---- selection: white outline, like the pictures ----
      R + '.fx:focus{box-shadow:0 0 0 ' + d(2) + ' #fff}',
      R + '.nv:focus{background:#fff;color:#000;box-shadow:none}',
      R + '.cd:focus{box-shadow:none}' + R + '.cd:focus .p{box-shadow:0 0 0 ' + d(2) + ' ' + BG + ',0 0 0 ' + d(4) + ' #fff}', // (gap + ring: a plain white ring vanished on white pictures)
      R + '.tr:focus{background:rgba(255,255,255,.1)}',
      R + '.tr:focus .n .num{display:none}' + R + '.tr:focus .n .pl{display:inline}' + R + '.tr.on:focus .n .eq{display:none}',
      R + '.bt.pri:focus{box-shadow:0 0 0 ' + d(2) + ' ' + BG + ',0 0 0 ' + d(4) + ' #fff}',
      // the selected chip is white too: a plain white ring vanished into it, so a gap then the ring
      R + '.chip.on:focus{box-shadow:0 0 0 ' + d(2) + ' ' + BG + ',0 0 0 ' + d(4) + ' #fff}',
      R + '.ic:focus{background:rgba(255,255,255,.2);color:#fff}' + R + '.ic.big:focus{background:#fff;color:#000;box-shadow:0 0 0 ' + d(3) + ' rgba(255,255,255,.45)}',
      R + '.npbar:focus{box-shadow:none}' + R + '.npbar:focus i{height:' + d(7) + ';margin-top:' + d(-3.5) + ';box-shadow:0 0 0 ' + d(2.5) + ' rgba(255,255,255,.4)}' /* round-5 beta: a selected bar was hard to spot */,
      R + '.abc:focus{box-shadow:0 0 0 ' + d(3) + ' #fff}',
      // ---- motion (plan part 1; 2026-11-13): only cheap animations - transform and opacity ----
      // focus lift: the selected card grows with a little spring
      R + '.cd .p{position:relative;transition:transform .16s cubic-bezier(.34,1.45,.64,1)}' + R + '.cd:focus .p{transform:scale(1.06)}',
      R + '.sc{transition:transform .16s cubic-bezier(.34,1.45,.64,1)}' + R + '.sc:focus{transform:scale(1.04)}',
      // pages fade and slide in 16 dp (from the left on Back); Now Playing grows in
      R + '.pg{animation:ivfMuIn .22s ease-out}' + R + '.page.bk .pg{animation-name:ivfMuBk}',
      '@keyframes ivfMuIn{from{opacity:0;transform:translateX(' + d(16) + ')}to{opacity:1;transform:none}}',
      '@keyframes ivfMuBk{from{opacity:0;transform:translateX(' + d(-16) + ')}to{opacity:1;transform:none}}',
      R + '.np.on{animation:ivfNpIn .28s ease-out}',
      '@keyframes ivfNpIn{from{opacity:0}to{opacity:1}}',
      // the playing album's card: bouncing bars in a dark pill (still while paused)
      R + '.eqb{display:none;position:absolute;right:' + d(6) + ';top:' + d(6) + ';padding:' + d(5) + ' ' + d(6) + ';border-radius:999px;background:rgba(0,0,0,.6)}',
      R + '.cd.on .eqb{display:flex}' + R + '.cd.on .eqb .eq{display:inline-flex}' + R + '.cd.ar.on .eqb{top:auto;bottom:' + d(6) + ';right:50%;transform:translateX(50%)}',
      R + '.sc .eqb{position:static;margin-left:auto;background:none;padding:0}' + R + '.sc.on .eqb{display:flex}' + R + '.sc.on .eqb .eq{display:inline-flex}',
      // Made for you mix cards: 2 x 2 covers, the name on top
      // (the picture box gets its height from padding, so the four covers are placed absolutely)
      R + '.mx .p{overflow:hidden}' + R + '.mx .p i{position:absolute;left:0;top:0;width:50%;height:50%;background:#333 center/cover no-repeat}',
      R + '.mx .p i:nth-child(2){left:50%}' + R + '.mx .p i:nth-child(3){top:50%}' + R + '.mx .p i:nth-child(4){left:50%;top:50%}',
      R + '.mx .mt{position:absolute;left:0;right:0;top:0;padding:' + d(8) + ';font-size:' + d(MU_TYPE.card) + ';line-height:1.2;font-weight:700;text-shadow:0 1px ' + d(3) + ' rgba(0,0,0,.85);padding-bottom:' + d(18) + ';background:linear-gradient(rgba(0,0,0,.82),rgba(0,0,0,.55) 55%,transparent); /* round 5: names over busy covers */z-index:1}',
      R + '.mx .ls{display:block;margin-top:' + d(6) + ';font-size:' + d(MU_TYPE.label) + ';color:rgba(255,255,255,.6);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // ---- Now Playing (plan part 2) ----
      // moving background (Apple Music style, user: colour blur only): a tiny copy of the cover
      // stretched over the screen (it blurs by itself - no blur filter, the TV is slow at those)
      // slowly turning, with soft colour blobs from the cover's colours drifting under it
      R + '.npbg{background:var(--npe,#1a1a1a);overflow:hidden;transition:background-color .9s}',
      R + '.npbg::after{background:linear-gradient(rgba(0,0,0,.2),rgba(0,0,0,.55))}',
      R + '.npbg .tiny{position:absolute;left:-25%;top:-25%;width:150%;height:150%;background:center/cover no-repeat;opacity:.8;will-change:transform;animation:ivfNpDrift ' + (TV ? 90 : 48) + 's linear infinite}',
      R + '.npbg .bl{position:absolute;left:0;top:0;width:84vw;height:84vw;margin:-42vw 0 0 -42vw;border-radius:50%;opacity:.38;will-change:transform;animation:ivfNpB1 ' + (TV ? 90 : 48) + 's linear infinite;background:radial-gradient(closest-side,var(--c,#fa586a),transparent)}',
      R + '.npbg .bl.b2{animation-name:ivfNpB2;--c:var(--npw2,#555)}' + R + '.npbg .bl.b1{--c:var(--npa,#fa586a)}' + R + '.npbg .bl.b3{animation-name:ivfNpB3;--c:var(--npe2,#333)}',
      '@keyframes ivfNpDrift{0%{transform:scale(1) rotate(0)}25%{transform:scale(1.07) rotate(6deg) translate(3%,2%)}50%{transform:scale(1.03) rotate(0) translate(0,4%)}75%{transform:scale(1.07) rotate(-6deg) translate(-3%,2%)}100%{transform:scale(1) rotate(0)}}',
      '@keyframes ivfNpB1{0%{transform:translate(20vw,25vh)}33%{transform:translate(80vw,40vh)}66%{transform:translate(45vw,85vh)}100%{transform:translate(20vw,25vh)}}',
      '@keyframes ivfNpB2{0%{transform:translate(85vw,75vh)}33%{transform:translate(25vw,80vh)}66%{transform:translate(70vw,15vh)}100%{transform:translate(85vw,75vh)}}',
      '@keyframes ivfNpB3{0%{transform:translate(50vw,10vh)}50%{transform:translate(10vw,60vh)}100%{transform:translate(50vw,10vh)}}',
      // a bigger cover, like the Android app
      R + '.npm{margin-top:' + d(36) + '}' + R + '.npm .c{width:' + d(240) + ';height:' + d(240) + ';border-radius:' + d(6) + '}',
      // Lyrics button (right of the controls) and the full-screen lyrics
      R + '.npc .lyb{position:absolute;right:0;top:50%;margin-top:' + d(-17) + '}',
      // lyrics on the song screen (user 2026-11-13): the space on the right, between the album line and
      // the progress bar; the line being sung bright, the rest dimmed, faded out at the panel's edges
      R + '.npli{display:none;position:absolute;left:60%;right:' + d(60) + ';top:calc(' + d(108) + ' + var(--ivf-mu-hd,0px));height:' + d(240) + ';overflow:hidden;' +
        '-webkit-mask-image:linear-gradient(transparent,#000 8%,#000 90%,transparent);mask-image:linear-gradient(transparent,#000 8%,#000 90%,transparent)}',
      R + '.np.lyi .npli{display:block}' + R + '.np.lyi .npm{max-width:57%}',
      // web: a light blur smooths the stretched cover's blocky look (the TV has no blur - it's slow at it)
      TV ? '' : R + '.npbg .tiny{filter:blur(' + d(10) + ')}',
      R + '.npli .lli{transition:transform .6s ease;padding:' + d(14) + ' 0}',
      R + '.npli .lnn{margin:0 0 ' + d(10) + ';font-size:' + d(19) + ';line-height:1.3;font-weight:700;color:#fff;opacity:.45;transition:opacity .3s}',
      R + '.npli .lnn.on{opacity:1}' + R + '.npli .lnn.past{opacity:.3}',
      R + '.npli .none{font-size:' + d(16) + ';font-weight:700;color:rgba(255,255,255,.6);padding-top:' + d(80) + '}',
      R + '.lyb.act{color:' + GREEN + '}',
      // web volume: a mute button and a slider, left of the Lyrics button
      R + '.npvol{position:absolute;right:' + d(44) + ';top:50%;margin-top:' + d(-17) + ';display:flex;align-items:center;gap:' + d(6) + '}',
      R + '.npvol .vsl{width:' + d(90) + ';accent-color:#fff;cursor:pointer}',
      R + '.npl{position:absolute;inset:0;display:none}' + R + '.np.ly .npl{display:block}' + R + '.np.ly .nps{visibility:hidden}',
      R + '.nplh{position:absolute;left:' + d(60) + ';top:calc(' + d(40) + ' + var(--ivf-mu-hd,0px));display:flex;align-items:center;gap:' + d(12) + '}',
      R + '.nplh .c{width:' + d(40) + ';height:' + d(40) + ';border-radius:' + d(4) + ';background:#333 center/cover no-repeat}' + R + '.nplh .n{font-size:' + d(13) + ';font-weight:700}' + R + '.nplh .a{font-size:' + d(11) + ';color:rgba(255,255,255,.75)}',
      R + '.npl .lls{position:absolute;left:' + d(60) + ';right:' + d(160) + ';top:calc(' + d(110) + ' + var(--ivf-mu-hd,0px));bottom:0;overflow:hidden}',
      R + '.npl .lli{transition:transform .5s ease}' + R + '.npl .lnn{font-size:' + d(26) + ';line-height:1.25;font-weight:700;margin:0 0 ' + d(14) + ';opacity:.5;transition:opacity .3s}',
      R + '.npl .lnn.on{opacity:1}' + R + '.npl .lnn.past{opacity:.35}' + R + '.npl .none{position:absolute;left:' + d(60) + ';top:45%;font-size:' + d(22) + ';font-weight:700;color:rgba(255,255,255,.7)}',
      R + '.npl .lfx{position:absolute;inset:0;outline:none;cursor:default}' + R + '.npl .lfx:focus{box-shadow:none}',
      // hold Left/Right on the progress bar: the time it will jump to
      R + '.npbar .bub{position:absolute;top:' + d(-22) + ';width:' + d(44) + ';margin-left:' + d(-22) + ';padding:' + d(2) + ' 0;border-radius:' + d(4) + ';background:#fff;color:#000;font-size:' + d(11) + ';font-weight:700;text-align:center;display:none}',
      R + '.npbar.scr .bub{display:block}',
      // Up next
      R + '.npq{margin-top:' + d(30) + '}' + R + '.npq h2{font-size:' + d(16) + ';font-weight:700;margin-bottom:' + d(6) + '}',
      R + '.qr{display:flex;align-items:center;gap:' + d(8) + ';width:' + d(640) + ';max-width:100%;height:' + d(44) + ';margin-left:' + d(-10) + ';padding:0 ' + d(10) + ';border-radius:' + d(4) + ';box-sizing:border-box}',
      R + '.qr .qx{flex:1;min-width:0}' + R + '.qr .qt{font-size:' + d(13) + ';white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' + R + '.qr .qa{font-size:' + d(11) + ';color:rgba(255,255,255,.65);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      R + '.qr .qd{font-size:' + d(11) + ';color:rgba(255,255,255,.65);font-variant-numeric:tabular-nums}',
      R + '.qr .qb{width:' + d(28) + ';height:' + d(28) + ';border-radius:50%;display:inline-flex;align-items:center;justify-content:center;color:rgba(255,255,255,.8);visibility:hidden}' + R + '.qr .qb .material-icons{font-size:' + d(18) + '}',
      R + '.qr:focus-within .qb,' + R + '.qr:hover .qb{visibility:visible}' + R + '.qr:focus-within,' + R + '.qr:hover{background:rgba(255,255,255,.1)}' + R + '.qr .qb:focus{background:rgba(255,255,255,.25);color:#fff;box-shadow:none}',
      R + '.qr .qm{flex:1;min-width:0;display:flex;align-items:center;gap:' + d(12) + ';height:100%;border-radius:' + d(4) + '}' + R + '.qr .qm:focus{box-shadow:none}',
      // the screensaver (60 s without a key): the controls fade, cover + title + time drift round the screen
      R + '.nps{transition:opacity .9s}' + R + '.np.ss .nps,' + R + '.np.ss .npl{opacity:0}',
      R + '.npss{position:absolute;left:0;top:0;width:' + d(420) + ';display:flex;align-items:center;gap:' + d(18) + ';opacity:0;visibility:hidden;transition:opacity .9s;animation:ivfSs 120s linear infinite;animation-play-state:paused}',
      R + '.np.ss .npss{opacity:1;visibility:visible;animation-play-state:running}',
      R + '.npss .c{flex:none;width:' + d(150) + ';height:' + d(150) + ';border-radius:' + d(6) + ';background:#333 center/cover no-repeat;box-shadow:0 ' + d(6) + ' ' + d(18) + ' rgba(0,0,0,.4)}',
      R + '.npss .tx{flex:1;min-width:0}' + R + '.npss .n{font-size:' + d(20) + ';font-weight:700;line-height:1.2}' + R + '.npss .a{font-size:' + d(12) + ';color:rgba(255,255,255,.8);margin-top:' + d(4) + '}',
      R + '.npss i{display:block;height:' + d(2.5) + ';margin-top:' + d(12) + ';border-radius:999px;background:rgba(255,255,255,.3);overflow:hidden}' + R + '.npss i b{display:block;height:100%;width:0;background:#fff}',
      R + '.npss .tm{font-size:' + d(10) + ';color:rgba(255,255,255,.8);margin-top:' + d(4) + ';font-variant-numeric:tabular-nums}',
      '@keyframes ivfSs{0%{transform:translate(8vw,10vh)}25%{transform:translate(52vw,58vh)}50%{transform:translate(50vw,12vh)}75%{transform:translate(6vw,60vh)}100%{transform:translate(8vw,10vh)}}'
    ];
    if (TV) css = css.concat([
      R + '.top::before{display:none}',
      // TV: scrolled lists on their own layers, no smooth-scroll animation (the Samsung's graphics are slow at those)
      R + '.page,' + R + '.strip,' + R + '.nps{transform:translateZ(0);-webkit-transform:translateZ(0);will-change:transform}',
      R + '.top{transition:none}',
      // a song's "..." (Right from the row): shown on the selected row only. Hidden with opacity, not
      // visibility: Chrome blurs the row first, and a visibility:hidden button then refuses the focus
      R + '.tr .tmore{visibility:visible;opacity:0}' + R + '.tr:focus .tmore,' + R + '.tr .tmore:focus{opacity:1}' + R + '.tr .tmore{width:' + d(28) + ';height:' + d(28) + ';align-items:center;justify-content:center;border-radius:50%}' + R + '.tr .tmore:focus{background:rgba(255,255,255,.25);color:#fff;box-shadow:none}',
      R + '.tr:focus-within{background:rgba(255,255,255,.1)}'
    ]);
    else css = css.concat([
      // web: the tabs and the picture scroll away with the page (see the scroll handler), so nothing
      // passes behind the tabs and no dark backing is needed
      R + '.top::before{display:none}',
      // web: the mouse selects; a click's leftover focus doesn't stay outlined
      R + '.fx:focus:not(:focus-visible){box-shadow:none}',
      R + '.nv:hover{color:#fff}' + R + '.nv:focus:not(:focus-visible){background:none;color:rgba(255,255,255,.6)}' + R + '.nv.on:focus:not(:focus-visible){color:#fff}',
      R + '.sc:hover{filter:brightness(1.22)}' + R + '.mini:hover{filter:brightness(1.15)}',
      R + '.cd:hover .p{box-shadow:0 0 0 ' + d(2) + ' ' + BG + ',0 0 0 ' + d(4) + ' #fff}' + R + '.cd:focus:not(:focus-visible) .p{box-shadow:none}' + R + '.cd:hover:focus .p{box-shadow:0 0 0 ' + d(2) + ' ' + BG + ',0 0 0 ' + d(4) + ' #fff}',
      // the lift follows the mouse on the web (a click's leftover focus doesn't keep a card grown)
      R + '.cd:hover .p{transform:scale(1.06)}' + R + '.cd:focus:not(:focus-visible):not(:hover) .p{transform:none}' + R + '.sc:hover{transform:scale(1.04)}' + R + '.sc:focus:not(:focus-visible):not(:hover){transform:none}',
      R + '.chip:hover{filter:brightness(1.25)}' + R + '.bt:hover{filter:brightness(1.2);transform:scale(1.04)}',
      R + '.tr:hover{background:rgba(255,255,255,.1)}' + R + '.tr:hover .ib{visibility:visible}',
      R + '.tr:hover .n .num{display:none}' + R + '.tr:hover .n .pl{display:inline}' + R + '.tr.on:hover .n .eq{display:none}',
      R + '.tr:focus:not(:focus-visible):not(:hover){background:none}',
      R + '.tr:focus:not(:focus-visible):not(:hover) .n .pl{display:none}',
      R + '.tr:not(.on):focus:not(:focus-visible):not(:hover) .n .num{display:inline}',
      R + '.tr.on:focus:not(:focus-visible):not(:hover) .n .eq{display:inline-flex}',
      R + '.ic:hover{color:#fff;background:rgba(255,255,255,.12)}' + R + '.ic.big:hover{background:#fff;color:#000;transform:scale(1.06)}',
      R + '.ic:focus:not(:focus-visible):not(:hover){background:none;color:rgba(255,255,255,.85)}' + R + '.ic.big:focus:not(:focus-visible){background:#fff;color:#000;box-shadow:none}',
      R + '.ic.act:focus:not(:focus-visible),' + R + '.ic.act:hover{color:' + GREEN + '}',
      R + '.npbar{cursor:pointer}' + R + '.npbar:hover i{height:' + d(5) + ';margin-top:' + d(-2.5) + '}' + R + '.npbar:hover b{background:' + GREEN + '}',
      // (the About the artist card opens the artist's page)
      R + '.abc:focus:not(:focus-visible){box-shadow:none}' + R + '.abc:hover{box-shadow:0 0 0 ' + d(2) + ' #fff}'
    ]);
    s.textContent = css.join('');
    document.head.appendChild(s);
  }

  // ---- Jellyfin's own player, driven from hidden elements ----------------------------------------
  var hid = null;
  function hidden(html, then) {
    // a fresh wrapper each time, filled before it joins the page (Jellyfin only upgrades it that way)
    if (hid) hid.remove();
    hid = document.createElement('div');
    hid.style.cssText = 'position:fixed;left:-9999px;top:0;width:10px;height:10px;overflow:hidden';
    hid.innerHTML = html;
    document.body.appendChild(hid);
    var c = hid.firstChild, t0 = Date.now();
    // wait until Jellyfin has upgraded it to its list element (it then handles the clicks)
    (function wait() {
      if (Object.getPrototypeOf(c) !== HTMLDivElement.prototype || Date.now() - t0 > 2500) { then(c); return; }
      setTimeout(wait, 40);
    })();
  }
  // Jellyfin's player manager - the same object its own controls use - found once in its bundle.
  // It works in both layouts (the TV layout has no now-playing bar at all). The hidden Jellyfin
  // list/bar below stay as a fallback in case a Jellyfin update moves it.
  var pmObj = null, pmTried = 0;
  function pm() {
    if (pmObj) return pmObj;
    if (Date.now() - pmTried < 5000) return null;
    pmTried = Date.now();
    try {
      var chunk = window.webpackChunk, req = null;
      if (!chunk || !chunk.push) return null;
      chunk.push([['ivf-pm-' + pmTried], {}, function (r) { req = r; }]);
      if (!req || !req.m) return null;
      var ids = Object.keys(req.m);
      for (var i = 0; i < ids.length && !pmObj; i++) {
        var src = '';
        try { src = Function.prototype.toString.call(req.m[ids[i]]); } catch (e) { continue; }
        if (src.length < 20000 || src.indexOf('getCurrentPlayer') < 0 || src.indexOf('setRepeatMode') < 0 || src.indexOf('nextTrack') < 0 || src.indexOf('getPlayerState') < 0) continue;
        var ex = req(ids[i]);
        for (var k in ex) {
          var v = ex[k];
          if (v && typeof v === 'object' && typeof v.playPause === 'function' && typeof v.getPlayerState === 'function' && typeof v.getCurrentPlayer === 'function') { pmObj = v; break; }
        }
      }
    } catch (e) {}
    return pmObj;
  }
  // Starting songs opens Now Playing once the player has the new song (same as Android); Back
  // from it returns to what was selected when the song was started
  var npAutoTimer = null, npReturn = null;
  function openNowWhenPlaying(ids, start) {
    var want = ids[start || 0], tries = 0, from = document.activeElement;
    clearInterval(npAutoTimer);
    // the page already has the song's details: show Now Playing at once with them
    var known = view && view.data && view.data.tracks && view.data.tracks.filter(function (t) { return t.Id === want; })[0];
    if (known && isOpen) {
      pending = pendingFrom(known); pendingUntil = Date.now() + 10000;
      refresh();
      if (!npOpen) { npReturn = from; openNow(); }
      return;
    }
    npAutoTimer = setInterval(function () {
      tries++;
      if (shownState && (now.id === want || tries > 6) && now.id && isOpen) {
        clearInterval(npAutoTimer);
        if (!npOpen) { npReturn = from; openNow(); }
      } else if (tries > 20 || !isOpen) clearInterval(npAutoTimer);
    }, 250);
  }
  // where the queue came from, for Now Playing's "PLAYING FROM ..." line: a mix, radio or playlist;
  // otherwise the song's album (round-5 beta: On Repeat said "PLAYING FROM ALBUM VULTURES 1")
  var playFrom = null;
  function playTracks(ids, start, from) {
    if (!ids.length) return;
    // (an album or song list started here is remembered too, k null: a song NOT in the list was started somewhere
    // else - Jellyfin's own song menu, e.g. Instant mix - and says "NOW PLAYING", not a wrong "FROM ALBUM" - round 6)
    playFrom = { k: from ? from.k : null, n: from ? from.n : '', ids: {} };
    ids.forEach(function (i) { playFrom.ids[i] = 1; });
    openNowWhenPlaying(ids, start);
    // Web: Jellyfin's play() does real work at once (stopping the song that's playing, setting up the
    // new one) - let the browser draw Now Playing first, then start the player.
    // TV (Samsung): start it right here - its browser only lets audio start inside the key press
    // itself; started a moment later, nothing plays and Jellyfin's loading circle spins forever.
    if (TV) { startPlayer(ids, start); return; }
    requestAnimationFrame(function () { setTimeout(function () { startPlayer(ids, start); }, 0); });
  }
  function startPlayer(ids, start) {
    var m = pm();
    if (m) {
      try { m.play({ ids: ids, startIndex: start || 0, serverId: ApiClient.serverId() }); setTimeout(refresh, 800); return; } catch (e) {}
    }
    hidden('<div is="emby-itemscontainer" class="itemsContainer">' + ids.map(function (id) {
      return '<div class="listItem" data-action="playallfromhere" data-isfolder="false" data-id="' + id + '" data-serverid="' + ApiClient.serverId() + '" data-type="Audio" data-mediatype="Audio"><div class="listItemBody itemAction">.</div></div>';
    }).join('') + '</div>', function (c) { var a = c.querySelectorAll('.itemAction')[start || 0]; if (a) a.click(); setTimeout(refresh, 600); });
  }
  function jfMenu(id, type, folder, anchor) {
    hidden('<div is="emby-itemscontainer" class="itemsContainer"><div class="card" data-isfolder="' + (folder ? 'true' : 'false') + '" data-id="' + id + '" data-serverid="' + ApiClient.serverId() + '" data-type="' + type + '">' +
      '<button type="button" class="itemAction" data-action="menu">.</button></div></div>', function (c) {
        // web: Jellyfin opens its menu beside the pressed element - put the (invisible) one where the
        // "..." button is, or the menu sat in the top-left corner (round-5 beta)
        var r = anchor && anchor.getBoundingClientRect && anchor.getBoundingClientRect();
        if (r && r.width) {
          hid.style.cssText = 'position:fixed;left:' + r.left + 'px;top:' + r.top + 'px;width:' + r.width + 'px;height:' + r.height + 'px;overflow:hidden;opacity:0;pointer-events:none';
          var b = c.querySelector('.itemAction'); b.style.cssText = 'display:block;width:' + r.width + 'px;height:' + r.height + 'px';
        }
        c.querySelector('.itemAction').click();
      });
  }
  function jfBar(sel) { return document.querySelector('.nowPlayingBar ' + sel); }
  function jfClick(sel) { var b = jfBar(sel); if (b) { b.click(); setTimeout(refresh, 150); return true; } return false; }
  function jfActive() {
    var nb = document.querySelector('.nowPlayingBar'), f = nb && nb.closest('.appfooter');
    if (!nb || nb.classList.contains('nowPlayingBar-hidden') || nb.classList.contains('hide') || (f && f.classList.contains('hide'))) return false;
    var t = nb.querySelector('.nowPlayingBarText');
    return !!(t && t.textContent.trim());
  }
  function btnOn(b) { return !!b && /(^|\s|-)active\b|Active\b/.test(b.className); }

  // What's playing: { id, albumId, album, artistId, name, artist, img, big, t0, t1, pct, playing, shuffle, repeat, fav } or null
  // The song just started, shown until the player reports it (Now Playing appears at once)
  var pending = null, pendingUntil = 0;
  function playState() {
    var real = playerState();
    if (pending) {
      if ((real && real.id === pending.id) || Date.now() > pendingUntil) pending = null;
      else return pending;
    }
    return real;
  }
  function pendingFrom(t) {
    var aa = (t.AlbumArtists && t.AlbumArtists[0]) || (t.ArtistItems && t.ArtistItems[0]) || {};
    var cover = function (h) {
      return t.AlbumId && t.AlbumPrimaryImageTag ? imgUrl(t.AlbumId, "Primary", { maxHeight: h, tag: t.AlbumPrimaryImageTag })
        : (t.ImageTags && t.ImageTags.Primary ? imgUrl(t.Id, "Primary", { maxHeight: h, tag: t.ImageTags.Primary }) : "");
    };
    var dur = t.RunTimeTicks || 0;
    return {
      id: t.Id, albumId: t.AlbumId || null, album: t.Album || "", artistId: aa.Id || null,
      name: t.Name || "", artist: (t.Artists || []).join(", ") || t.AlbumArtist || "",
      img: cover(120), big: cover(400), pos: 0, dur: dur, t0: mmss(0), t1: dur ? mmss(dur) : "-:--", pct: 0,
      playing: true, shuffle: false, repeat: "RepeatNone", fav: !!(t.UserData && t.UserData.IsFavorite)
    };
  }
  function playerState() {
    var m = pm();
    if (m) {
      try {
        var p = m.getCurrentPlayer(); if (!p) return null;
        var st = m.getPlayerState(p) || {}, it = st.NowPlayingItem; if (!it) return null;
        var ps = st.PlayState || {}, pos = ps.PositionTicks || 0, dur = it.RunTimeTicks || 0;
        var aa = (it.AlbumArtists && it.AlbumArtists[0]) || (it.ArtistItems && it.ArtistItems[0]) || {};
        var cover = function (h) {
          return it.AlbumId && it.AlbumPrimaryImageTag ? imgUrl(it.AlbumId, 'Primary', { maxHeight: h, tag: it.AlbumPrimaryImageTag })
            : (it.ImageTags && it.ImageTags.Primary ? imgUrl(it.Id, 'Primary', { maxHeight: h, tag: it.ImageTags.Primary }) : '');
        };
        return {
          id: it.Id, albumId: it.AlbumId || null, album: it.Album || '', artistId: aa.Id || null,
          name: it.Name || '', artist: (it.Artists || []).join(', ') || it.AlbumArtist || '',
          img: cover(120), big: cover(400), pos: pos, dur: dur,
          t0: mmss(pos), t1: dur ? mmss(dur) : '-:--', pct: dur ? Math.min(100, pos / dur * 100) : 0,
          playing: !ps.IsPaused, shuffle: ps.ShuffleMode === 'Shuffle', repeat: ps.RepeatMode || 'RepeatNone',
          fav: !!(it.UserData && it.UserData.IsFavorite)
        };
      } catch (e) { return null; }
    }
    if (!jfActive()) return null;
    var txt = jfBar('.nowPlayingBarText'), divs = txt ? txt.children : [];
    var im = jfBar('.nowPlayingImage'), u = /url\(["']?([^"')]+)/.exec(im ? im.style.backgroundImage : '');
    var time = ((jfBar('.nowPlayingBarCurrentTime') || {}).textContent || '').split('/');
    var ps2 = jfBar('.nowPlayingBarPositionSlider');
    var ppIcon = jfBar('.playPauseButton .material-icons'), rp = jfBar('.toggleRepeatButton'), rpIcon = rp && rp.querySelector('.material-icons');
    var rb = jfBar('.nowPlayingBarUserDataButtons [data-id]');
    return {
      id: rb ? rb.getAttribute('data-id') : null, albumId: undefined, album: '', artistId: null, name: divs[0] ? divs[0].textContent : '',
      artist: (txt && txt.querySelector('.nowPlayingBarSecondaryText') || {}).textContent || '',
      img: u ? u[1] : '', big: u ? u[1].replace(/height=\d+/, 'height=400') : '', pos: 0, dur: 0,
      t0: (time[0] || '').trim() || '0:00', t1: (time[1] || '').trim() || '-:--', pct: ps2 ? parseFloat(ps2.value) || 0 : 0,
      playing: !!(ppIcon && ppIcon.classList.contains('pause')), shuffle: btnOn(jfBar('.btnShuffleQueue')),
      repeat: rpIcon && rpIcon.classList.contains('repeat_one') ? 'RepeatOne' : btnOn(rp) ? 'RepeatAll' : 'RepeatNone', fav: false
    };
  }
  // play/pause, prev, next, stop, shuffle, repeat, seek (percent), skip (seconds, +/-)
  function ctl(a, val) {
    var m = pm(), p = m && m.getCurrentPlayer();
    if (m && p) {
      try {
        if (a === 'pp') m.playPause(p);
        // Previous: restart the song when it has played 3 s+ or nothing comes before it (round-5 beta:
        // it did nothing on the first / only song); otherwise the song before
        else if (a === 'prev') { var ps = playState(); if ((ps && ps.pos >= 3e7) || m.getCurrentPlaylistIndex(p) <= 0) m.seekPercent(0, p); else m.previousTrack(p); }
        else if (a === 'next') m.nextTrack(p);
        else if (a === 'stop') m.stop(p);
        else if (a === 'shuffle') m.toggleQueueShuffleMode(p);
        else if (a === 'repeat') { var r = m.getRepeatMode(p); m.setRepeatMode(r === 'RepeatNone' ? 'RepeatAll' : r === 'RepeatAll' ? 'RepeatOne' : 'RepeatNone', p); }
        else if (a === 'seek') m.seekPercent(val, p);
        else if (a === 'skip') {
          var s = playState();
          if (s && s.dur) m.seekPercent(Math.max(0, Math.min(99.5, (s.pos + val * 1e7) / s.dur * 100)), p);
        }
        setTimeout(refresh, 150);
        return true;
      } catch (e) {}
    }
    var sel = { pp: '.playPauseButton', prev: '.previousTrackButton', next: '.nextTrackButton', stop: '.stopButton', shuffle: '.btnShuffleQueue', repeat: '.toggleRepeatButton' }[a];
    if (sel) return jfClick(sel);
    if (a === 'seek') {
      var sl = jfBar('.nowPlayingBarPositionSlider');
      if (sl) { sl.value = val; sl.dispatchEvent(new Event('input', { bubbles: true })); sl.dispatchEvent(new Event('change', { bubbles: true })); }
    }
    return false;
  }
  function stopMusic() { if (playState()) ctl('stop'); }

  // ---- picture colour (the now-playing pill takes its tint from the cover) -------------------------
  var colours = {};
  function coverColour(url, done) {
    if (colours[url] !== undefined) { done(colours[url]); return; }
    var im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
      try {
        var c = document.createElement('canvas'); c.width = c.height = 24;
        var x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 24);
        var p = x.getImageData(0, 0, 24, 24).data, r = 0, g = 0, b = 0, w = 0;
        for (var i = 0; i < p.length; i += 4) {
          var k = 1 + (Math.max(p[i], p[i + 1], p[i + 2]) - Math.min(p[i], p[i + 1], p[i + 2])) / 32;
          r += p[i] * k; g += p[i + 1] * k; b += p[i + 2] * k; w += k;
        }
        r /= w * 255; g /= w * 255; b /= w * 255;
        var mx = Math.max(r, g, b), mn = Math.min(r, g, b), hh = 0, ss = 0, l = (mx + mn) / 2, dd = mx - mn;
        if (dd) { ss = dd / (1 - Math.abs(2 * l - 1)); hh = (mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4) * 60; if (hh < 0) hh += 360; }
        colours[url] = 'hsl(' + Math.round(hh) + ',' + Math.round(Math.min(ss, 0.4) * 100) + '%,' + Math.round(Math.max(0.14, Math.min(l, 0.22)) * 100) + '%)';
      } catch (e) { colours[url] = null; }
      done(colours[url]);
    };
    im.onerror = function () { colours[url] = null; done(null); };
    im.src = url;
  }

  // ---- page colour (2026-11-12, Apple Music style) -------------------------------------------------
  // Each album / artist page (and Home, following the selected card) takes its colours from the
  // picture: a deep tone of its most vivid colour washes the page from the top (--mtc), the same hue,
  // bright, is the accent for Play, the playing song, favourites (--ma, text on it: --ma-ink).
  var palettes = {};
  var DEFAULT_PAL = { edge: BG, acc: '#fa586a', ink: '#fff' }; // no picture: Apple's pink accent
  var LIKED_PAL = { edge: 'hsl(252,48%,27%)', acc: 'hsl(252,90%,74%)', ink: '#111', wash: 'hsla(252,48%,34%,.62)' }; // Liked Songs: purple
  function palette(url, done) {
    if (!url) { done(DEFAULT_PAL); return; }
    if (url === 'liked') { done(LIKED_PAL); return; }
    if (palettes[url]) { done(palettes[url]); return; }
    var im = new Image();
    im.crossOrigin = 'anonymous';
    im.onload = function () {
      var pal = DEFAULT_PAL;
      try {
        var c = document.createElement('canvas'); c.width = c.height = 24;
        var x = c.getContext('2d'); x.drawImage(im, 0, 0, 24, 24);
        var p = x.getImageData(0, 0, 24, 24).data, px = [];
        for (var i = 0; i < p.length; i += 4) {
          var r = p[i] / 255, g = p[i + 1] / 255, b = p[i + 2] / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), dd = mx - mn;
          var h = 0;
          if (dd) { h = (mx === r ? ((g - b) / dd) % 6 : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4) * 60; if (h < 0) h += 360; }
          var s = mx ? dd / mx : 0; // HSV saturation
          // vivid and not too dark / not white
          px.push({ h: h, s: s, v: mx, score: s * (mx > 0.18 ? Math.min(1, mx * 1.3) : 0) * (mx > 0.97 && s < 0.08 ? 0 : 1) });
        }
        px.sort(function (a, b2) { return b2.score - a.score; });
        var top = px.slice(0, Math.max(8, Math.round(px.length * 0.12))), sx = 0, sy = 0, ss = 0;
        top.forEach(function (q) { sx += Math.cos(q.h * Math.PI / 180) * q.score; sy += Math.sin(q.h * Math.PI / 180) * q.score; ss += q.s; });
        var hue = Math.round((Math.atan2(sy, sx) * 180 / Math.PI + 360) % 360), sat = ss / top.length;
        // The page colour is the cover's own background: the commonest colour round its edge (the
        // outer 2 of 24 pixels), so the page carries the cover on. Black stays black; light colours
        // are taken down only as far as white text needs. The accent (Play, playing song) is the
        // cover's most vivid colour.
        var buckets = {}, best = null, edgeN = 0, edgeDark = 0;
        for (var k = 0; k < 576; k++) {
          var ex = k % 24, ey = (k / 24) | 0;
          if (ex >= 2 && ex <= 21 && ey >= 2 && ey <= 21) continue;
          var R = p[k * 4], G = p[k * 4 + 1], B = p[k * 4 + 2], key = (R >> 5) + ',' + (G >> 5) + ',' + (B >> 5);
          edgeN++;
          if (R < 39 && G < 39 && B < 39) { edgeDark++; continue; } // black is counted apart: the page is black only if most of the edge is
          var bk = buckets[key] || (buckets[key] = { n: 0, r: 0, g: 0, b: 0 });
          bk.n++; bk.r += R; bk.g += G; bk.b += B;
          if (!best || bk.n > best.n) best = bk;
        }
        if (!best) best = { n: 1, r: 0, g: 0, b: 0 };
        var er = best.r / best.n / 255, eg = best.g / best.n / 255, eb = best.b / best.n / 255;
        // A light, colourless edge (white paper, grey) gave a dull grey page even when the cover is
        // clearly red or gold (user 2026-11-13: G.O.O.D. Morning, Gold Digging): then the page takes
        // the cover's main colour - the hue (12 steps of 30 degrees) that covers most of it - if that
        // fills at least 8% of the cover
        if (Math.max(er, eg, eb) - Math.min(er, eg, eb) < 0.12 && edgeDark < edgeN * 0.6) {
          var hb = [], hbest = null;
          for (var k2 = 0; k2 < 576; k2++) {
            var R2 = p[k2 * 4], G2 = p[k2 * 4 + 1], B2 = p[k2 * 4 + 2], mx2 = Math.max(R2, G2, B2), c2 = mx2 - Math.min(R2, G2, B2);
            if (c2 < 51 || mx2 < 40) continue; // greys, whites and near-black don't count
            var h2 = (mx2 === R2 ? ((G2 - B2) / c2) % 6 : mx2 === G2 ? (B2 - R2) / c2 + 2 : (R2 - G2) / c2 + 4) * 60; if (h2 < 0) h2 += 360;
            var bin = Math.floor(h2 / 30) % 12, hk = hb[bin] || (hb[bin] = { n: 0, r: 0, g: 0, b: 0 });
            hk.n++; hk.r += R2; hk.g += G2; hk.b += B2;
          }
          // each hue counted with its two neighbours (a brown-to-gold bear spans two steps)
          for (var bi = 0; bi < 12; bi++) {
            var pool = { n: 0, r: 0, g: 0, b: 0 };
            [11, 0, 1].forEach(function (o) { var q = hb[(bi + o) % 12]; if (q) { pool.n += q.n; pool.r += q.r; pool.g += q.g; pool.b += q.b; } });
            if (!hbest || pool.n > hbest.n) hbest = pool;
          }
          if (hbest && hbest.n >= 576 * 0.08) { er = hbest.r / hbest.n / 255; eg = hbest.g / hbest.n / 255; eb = hbest.b / hbest.n / 255; }
        }
        // Still colourless, but the whole cover leans one way (user 2026-11-13: Yandhi - a dark grey
        // turntable with a faint violet cast should give a purple page): the hue the cover's faint
        // tints point to, when they agree (60%+) and the cover isn't plain black & white
        var tintHue = null;
        if (Math.max(er, eg, eb) - Math.min(er, eg, eb) < 0.12 && edgeDark < edgeN * 0.6) {
          var tx = 0, ty = 0, tw = 0, csum = 0;
          for (var k3 = 0; k3 < 576; k3++) {
            var R3 = p[k3 * 4], G3 = p[k3 * 4 + 1], B3 = p[k3 * 4 + 2], mx3 = Math.max(R3, G3, B3), c3 = mx3 - Math.min(R3, G3, B3);
            csum += c3;
            if (c3 < 8) continue;
            var h3 = (mx3 === R3 ? ((G3 - B3) / c3) % 6 : mx3 === G3 ? (B3 - R3) / c3 + 2 : (R3 - G3) / c3 + 4) * 60;
            tx += Math.cos(h3 * Math.PI / 180) * c3; ty += Math.sin(h3 * Math.PI / 180) * c3; tw += c3;
          }
          if (tw && csum / 576 >= 7 && Math.sqrt(tx * tx + ty * ty) / tw >= 0.6) tintHue = Math.round((Math.atan2(ty, tx) * 180 / Math.PI + 360) % 360);
        }
        var emx = Math.max(er, eg, eb), emn = Math.min(er, eg, eb), el = (emx + emn) / 2, ed = emx - emn, eh = 0;
        if (ed) {
          eh = (emx === er ? ((eg - eb) / ed) % 6 : emx === eg ? (eb - er) / ed + 2 : (er - eg) / ed + 4) * 60; if (eh < 0) eh += 360;
        }
        eh = Math.round(eh);
        if (tintHue !== null) { eh = tintHue; ed = Math.max(ed, 0.2); } // (strong enough to show as a colour)
        var vivid = sat >= 0.14, as = Math.round(Math.max(0.55, Math.min(0.9, sat * 1.1)) * 100), yg = hue > 40 && hue < 170;
        var acc = vivid ? 'hsl(' + hue + ',' + as + '%,' + (yg ? 52 : 62) + '%)' : '#fff', ink = vivid && yg ? '#fff' : '#111';
        if (edgeDark >= edgeN * 0.6) pal = { edge: '#000', acc: acc, ink: ink, wash: 'rgba(34,34,34,.88)' }; // (cards: dark grey, so they still show on a black page)
        else {
          var eyg = eh > 40 && eh < 170 && ed > 0.12;
          var nl = Math.max(0.14, Math.min(el, eyg ? 0.24 : 0.3)); // yellows / greens look brighter: a bit darker
          // keep the colour's strength (chroma), not its HSL saturation: a near-white edge with a faint
          // tint becomes grey when darkened, not a strong colour
          var es2 = Math.round(Math.min(0.75, ed / (1 - Math.abs(2 * nl - 1))) * 100), el2 = Math.round(nl * 100);
          pal = { edge: 'hsl(' + eh + ',' + es2 + '%,' + el2 + '%)', acc: acc, ink: ink, wash: 'hsla(' + eh + ',' + es2 + '%,' + Math.min(el2 + 8, 36) + '%,.7)' };
        }      } catch (e) { pal = DEFAULT_PAL; }
      palettes[url] = pal;
      done(pal);
    };
    im.onerror = function () { palettes[url] = DEFAULT_PAL; done(DEFAULT_PAL); };
    im.src = url;
  }
  // a page colour from a hue (Search, Browse tiles)
  function huePal(h) { return { edge: 'hsl(' + h + ',45%,22%)', acc: 'hsl(' + h + ',85%,66%)', ink: '#111', wash: 'hsla(' + h + ',45%,32%,.62)', tile: 'hsl(' + h + ',62%,40%)' }; }
  function applyPal(pal) {
    tintFor = null;
    if (!root) return;
    root.style.setProperty('--mtc', pal.edge); root.style.setProperty('--ma', pal.acc); root.style.setProperty('--ma-ink', pal.ink);
  }
  // album / artist cards in a grid: each card washed with its own cover's colour
  function tintCards(scope) {
    Array.prototype.forEach.call(scope.querySelectorAll('.gd .cd[data-k]'), function (el) {
      var hh = heroes[el.getAttribute('data-k')];
      if (hh && hh.tint) palette(hh.tint, function (pal) { if (pal.wash) el.style.setProperty('--sct', pal.wash); });
    });
  }
  var tintFor = null;
  function setTint(url) {
    var mine = tintFor = url || '';
    palette(url, function (pal) {
      if (!root || tintFor !== mine) return;
      root.style.setProperty('--mtc', pal.edge);
      root.style.setProperty('--ma', pal.acc);
      root.style.setProperty('--ma-ink', pal.ink);
    });
  }
  // a small copy of a picture is plenty to read its colours
  function tintUrl(item, type) {
    type = type || 'Primary';
    if (type === 'Backdrop') return item && item.BackdropImageTags && item.BackdropImageTags.length ? imgUrl(item.Id, 'Backdrop/0', { maxWidth: 96, tag: item.BackdropImageTags[0] }) : '';
    return item && item.ImageTags && item.ImageTags.Primary ? imgUrl(item.Id, 'Primary', { maxWidth: 96, tag: item.ImageTags.Primary }) : '';
  }

  // ---- data ----------------------------------------------------------------------------------------
  var ALBUM_Q = { IncludeItemTypes: 'MusicAlbum', Recursive: true, Fields: 'ChildCount,PrimaryImageAspectRatio,ProviderIds', ImageTypeLimit: 1, EnableImageTypes: 'Primary' };
  function q(extra) { var o = {}, k; for (k in ALBUM_Q) o[k] = ALBUM_Q[k]; for (k in extra) o[k] = extra[k]; o.ParentId = lib.id; return o; }
  function libraryId() {
    if (lib.id) return Promise.resolve(lib.id);
    var saved = store('ivf-music-lib');
    if (saved) { lib.id = saved; return Promise.resolve(saved); }
    return ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid() + '/Views')).then(function (r) {
      var v = ((r && r.Items) || []).filter(function (x) { return x.CollectionType === 'music'; })[0];
      if (v) { lib.id = v.Id; store('ivf-music-lib', v.Id); }
      return lib.id;
    });
  }
  function loadArtists() {
    return ApiClient.getJSON(ApiClient.getUrl('/Artists/AlbumArtists', { ParentId: lib.id, userId: uid(), SortBy: 'SortName', Fields: 'PrimaryImageAspectRatio', ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop' }))
      .then(function (r) { return (r && r.Items) || []; }, function () { return []; });
  }
  function loadHome() {
    return libraryId().then(function (id) {
      if (!id) { home = { liked: 0, recent: [], added: [], all: [], artists: [] }; return; }
      return Promise.all([
        ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid() + '/Items', { ParentId: id, IncludeItemTypes: 'Audio', Recursive: true, Filters: 'IsFavorite', Limit: 1 }))
          .then(function (r) { return (r && r.TotalRecordCount) || 0; }, function () { return 0; }),
        getItems({ ParentId: id, IncludeItemTypes: 'Audio', Recursive: true, Filters: 'IsPlayed', SortBy: 'DatePlayed', SortOrder: 'Descending', Limit: 1500, EnableImages: false }),
        getItems(q({ SortBy: 'DateCreated,SortName', SortOrder: 'Descending', Limit: 24 })),
        getItems(q({ SortBy: 'SortName', SortOrder: 'Ascending' })),
        loadArtists()
      ]).then(function (r) {
        var all = r[3], byId = {}, seen = {}, recent = [];
        all.forEach(function (a) { byId[a.Id] = a; });
        r[1].forEach(function (t) { if (t.AlbumId && !seen[t.AlbumId] && byId[t.AlbumId] && recent.length < 8) { seen[t.AlbumId] = 1; recent.push(byId[t.AlbumId]); } });
        r[2].forEach(function (a) { if (!seen[a.Id] && recent.length < 8) { seen[a.Id] = 1; recent.push(a); } });
        // Jump back in: the albums played most recently
        var jump = [], jseen = {};
        r[1].forEach(function (t) { if (t.AlbumId && !jseen[t.AlbumId] && byId[t.AlbumId] && jump.length < 20) { jseen[t.AlbumId] = 1; jump.push(byId[t.AlbumId]); } });
        home = { liked: r[0], recent: recent, played: recent.slice(), added: r[2], all: all, artists: r[4], jump: jump, mixes: buildMixes(r[1], all) };
        pickShortcuts();
        // the era mixes' songs are picked now: on the Samsung a song must start inside the key press,
        // so there's no time to ask the server once the card is pressed
        home.mixes.forEach(function (m) {
          if (!m.albumIds) return;
          getItems({ ParentId: id, AlbumIds: m.albumIds.join(','), IncludeItemTypes: 'Audio', Recursive: true, SortBy: 'Random', Limit: 60, EnableImages: false })
            .then(function (t) { m.songIds = t.map(function (x) { return x.Id; }); });
        });
      });
    });
  }
  // Made for you (plan part 4; same as the Android app), from the play history (songs, last played
  // first) and the albums: On Repeat (most played of the songs played in the last 30 days), Forgotten
  // Favourites (played 3+ times, not for 3 months), one mix per decade, Mixtapes & More
  function buildMixes(played, all) {
    var nowMs = Date.now(), DAY = 864e5, out = [];
    function lp(t) { var d0 = t.UserData && t.UserData.LastPlayedDate; return d0 ? Date.parse(d0) : 0; }
    function pc(t) { return (t.UserData && t.UserData.PlayCount) || 0; }
    function covers(list) { var s = {}, c = []; list.forEach(function (t) { if (t.AlbumId && !s[t.AlbumId] && c.length < 4) { s[t.AlbumId] = 1; c.push(t.AlbumId); } }); return c; }
    var rep = played.filter(function (t) { return lp(t) > nowMs - 30 * DAY; }).sort(function (x, y) { return pc(y) - pc(x); }).slice(0, 25);
    if (rep.length >= 5) out.push({ key: 'repeat', name: 'On Repeat', sub: 'Your top songs', covers: covers(rep), songIds: rep.map(function (t) { return t.Id; }) });
    var fg = played.filter(function (t) { return pc(t) >= 3 && lp(t) && lp(t) < nowMs - 90 * DAY; }).sort(function (x, y) { return pc(y) - pc(x); }).slice(0, 25);
    if (fg.length >= 5) out.push({ key: 'forgotten', name: 'Forgotten Favourites', sub: 'Loved, then left', covers: covers(fg), songIds: fg.map(function (t) { return t.Id; }) });
    var decs = {};
    all.forEach(function (a) { if (albumType(a) !== 'mixtape' && a.ProductionYear) { var dd = Math.floor(a.ProductionYear / 10) * 10; (decs[dd] = decs[dd] || []).push(a); } });
    Object.keys(decs).sort().forEach(function (dd) {
      var al = decs[dd];
      if (al.length >= 2) out.push({ key: 'era' + dd, name: dd + 's Mix', sub: al.length + ' albums', covers: shuffle(al).slice(0, 4).map(function (a) { return a.Id; }), albumIds: al.map(function (a) { return a.Id; }) });
    });
    var tapes = all.filter(function (a) { return albumType(a) === 'mixtape'; });
    if (tapes.length >= 2) out.push({ key: 'tapes', name: 'Mixtapes & More Mix', sub: tapes.length + ' mixtapes', covers: shuffle(tapes).slice(0, 4).map(function (a) { return a.Id; }), albumIds: tapes.map(function (a) { return a.Id; }) });
    return out;
  }
  function mixCard(m) {
    var c0 = m.covers[0];
    heroes['mix:' + m.key] = { title: m.name, meta: 'Mix • ' + esc(m.sub), art: c0 ? imgUrl(c0, 'Primary', { maxWidth: 2000 }) : '', sq: true, tint: c0 ? imgUrl(c0, 'Primary', { maxWidth: 96 }) : '' };
    var cells = '';
    for (var i = 0; i < 4; i++) { var id = m.covers[i] || m.covers[i % Math.max(1, m.covers.length)]; cells += '<i' + (id ? bgi(imgUrl(id, 'Primary', { maxWidth: 120 })) : '') + '></i>'; }
    return '<button type="button" class="fx cd mx" data-k="mix:' + m.key + '"><span class="p">' + cells + '<span class="mt">' + esc(m.name) + '</span></span><span class="ls">' + esc(m.sub) + '</span></button>';
  }
  function playMix(key) {
    var m = home && home.mixes.filter(function (x) { return x.key === key; })[0];
    if (m && m.songIds && m.songIds.length) playTracks(m.songIds.slice(), 0, { k: 'MIX', n: m.name });
  }
  var EQ = '<span class="eqb"><span class="eq"><i></i><i></i><i></i><i></i></span></span>';
  // Home's 8 shortcut cards (and the hero rotation): all 8 picked at random from the whole library
  // (the first used to be the last album played - user: make it cycle like the rest) - a new mix each time Music opens or Home is chosen in the top bar
  // (Back to Home keeps the same mix)
  function pickShortcuts() {
    if (!home) return;
    var pool = home.all.slice();
    for (var i = pool.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = pool[i]; pool[i] = pool[j]; pool[j] = t; }
    home.recent = pool.slice(0, 8);
  }

  // What the hero shows for an item: { kind, title, meta (html), art, artCls }
  var heroes = {};
  function albumHero(a) {
    var p = a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 2000, tag: a.ImageTags.Primary }) : '';
    var aa = (a.AlbumArtists || [])[0];
    var av = aa ? '<span class="av"' + bgi(imgUrl(aa.Id, 'Primary', { maxWidth: 48 })) + '></span>' : '';
    var bits = [esc(a.AlbumArtist || (aa && aa.Name) || ''), 'Album'];
    if (a.ChildCount) bits.push(songs(a.ChildCount));
    return { title: a.Name, meta: av + bits.filter(Boolean).join(' • '), art: p, sq: true, tint: tintUrl(a) };
  }
  function artistArt(a, w) {
    if (a.BackdropImageTags && a.BackdropImageTags.length) return imgUrl(a.Id, 'Backdrop/0', { maxWidth: w || 1280, tag: a.BackdropImageTags[0] });
    return a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: w || 1000, tag: a.ImageTags.Primary }) : '';
  }
  function artistHero(a) {
    var p = a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 48, tag: a.ImageTags.Primary }) : '';
    return { title: a.Name, meta: '<span class="av"' + bgi(p) + '></span>Artist', art: artistArt(a), tint: tintUrl(a, a.BackdropImageTags && a.BackdropImageTags.length ? 'Backdrop' : 'Primary') };
  }
  function likedHero(n) { return { title: 'Liked Songs', meta: '<span class="av liked"></span>Playlist • ' + songs(n), art: '', liked: true, tint: 'liked' }; }

  // ---- cards ---------------------------------------------------------------------------------------
  function cover(a, w) { return a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: w, tag: a.ImageTags.Primary }) : ''; }
  function shortcut(k, name, c, liked) {
    return '<button type="button" class="fx sc" data-k="' + k + '"><span class="c' + (liked ? ' liked' : '') + '"' + bgi(c) + '>' + (liked ? icon('favorite') : '') + '</span><span class="n">' + esc(name) + '</span>' + (liked ? '' : EQ) + '</button>';
  }
  function card(a) {
    heroes['album:' + a.Id] = albumHero(a);
    return '<button type="button" class="fx cd" data-k="album:' + a.Id + '" data-album="' + a.Id + '"><span class="p"' + bgi(cover(a, 240)) + '>' + EQ + '</span><span class="o"><span>' + esc(a.Name) + '</span></span></button>';
  }
  function artistCard(a) {
    heroes['artist:' + a.Id] = artistHero(a);
    var p = a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 240, tag: a.ImageTags.Primary }) : '';
    return '<button type="button" class="fx cd ar" data-k="artist:' + a.Id + '"><span class="p"' + bgi(p) + '></span><span class="o"><span>' + esc(a.Name) + '</span></span></button>';
  }
  function gridCard(a) {
    heroes['album:' + a.Id] = albumHero(a);
    return '<button type="button" class="fx cd" data-k="album:' + a.Id + '" data-album="' + a.Id + '"><span class="p"' + bgi(cover(a, 240)) + '>' + EQ + '</span>' +
      '<span class="ln">' + esc(a.Name) + '</span><span class="ls">' + (a.ProductionYear ? a.ProductionYear + ' • ' : '') + esc(a.AlbumArtist || 'Album') + '</span></button>';
  }
  function gridArtist(a) {
    heroes['artist:' + a.Id] = artistHero(a);
    var p = a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 240, tag: a.ImageTags.Primary }) : '';
    return '<button type="button" class="fx cd ar" data-k="artist:' + a.Id + '"><span class="p"' + bgi(p) + '></span><span class="ln">' + esc(a.Name) + '</span><span class="ls">Artist</span></button>';
  }
  function row(title, html, cls) { return html ? '<section class="row' + (cls ? ' ' + cls : '') + '"><h2>' + esc(title) + '</h2><div class="strip">' + html + '</div></section>' : ''; }
  function heroHtml(h, extra) {
    return '<div class="hart' + (h.liked ? ' liked' : '') + (h.sq ? ' sq' : '') + '"' + bgi(h.art) + '>' + (h.liked ? icon('favorite', 'hk') : '') + '</div>' +
      '<div class="hero">' + (extra || '') + '<h1 class="ht">' + esc(h.title) + '</h1><div class="hm">' + h.meta + '</div></div>';
  }

  // ---- views ---------------------------------------------------------------------------------------
  function render(v) {
    if (v.v === 'home') return renderHome();
    if (v.v === 'library') return renderLibrary();
    if (v.v === 'search') return renderSearch();
    if (v.v === 'album' || v.v === 'liked' || v.v === 'playlist') return renderAlbum(v);
    if (v.v === 'artist') return renderArtist(v);
    if (v.v === 'browse') return renderBrowse(v);
  }
  function renderHome() {
    heroes = {};
    heroes.liked = likedHero(home.liked);
    var sc = home.recent.map(function (a) { heroes['album:' + a.Id] = albumHero(a); return shortcut('album:' + a.Id, a.Name, cover(a, 120)); }).join('');
    setTint(home.recent[0] ? heroes['album:' + home.recent[0].Id].tint : '');
    // the hero starts on the first card (the most recently played album)
    var first = home.recent[0] ? heroes['album:' + home.recent[0].Id] : { title: 'Music', meta: '', art: '' };
    heroKey = home.recent[0] ? 'album:' + home.recent[0].Id : null;
    // Albums holds the whole collection (116 cards = over half the page): only the first ones are
    // drawn now, the rest are added just after the page shows (Samsung: Music opened ~1 s sooner)
    var albums = home.all.map(card);
    page.innerHTML = '<div class="pg">' + heroHtml(first) + '<div class="sg">' + sc + '</div>' +
      row('Made for you', (home.mixes || []).map(mixCard).join('')) +
      row('Jump back in', (home.jump || []).map(card).join('')) +
      row('Recently added', home.added.map(card).join('')) +
      row('Albums', albums.slice(0, ALBUMS_FIRST).join(''), 'albs') +
      row('Artists', home.artists.map(artistCard).join('')) + '</div>';
    albumsRest = albums.length > ALBUMS_FIRST ? albums.slice(ALBUMS_FIRST).join('') : '';
    if (albumsRest) {
      var later = window.requestIdleCallback ? function (f) { requestIdleCallback(f, { timeout: 1500 }); } : function (f) { setTimeout(f, 700); };
      later(fillAlbums);
    }
    Array.prototype.forEach.call(page.querySelectorAll('.sc[data-k^="album:"]'), function (el) {
      var hh = heroes[el.getAttribute('data-k')];
      if (hh && hh.tint) palette(hh.tint, function (pal) { if (pal.wash) el.style.setProperty('--sct', pal.wash); });
    });
    markPlaying();
  }
  var ALBUMS_FIRST = 20, albumsRest = '';
  // adds Home's remaining album cards (any time before they could be needed: Back to a card among them)
  function fillAlbums() {
    if (!albumsRest) return;
    var strip = page && page.querySelector('.row.albs .strip'), html = albumsRest;
    albumsRest = '';
    if (!strip) return; // (Home was left meanwhile; it draws afresh next time)
    strip.insertAdjacentHTML('beforeend', html);
    markPlaying();
  }
  var SORTS = [
    { label: 'Recents', by: 'DateCreated,SortName', order: 'Descending' },
    { label: 'Alphabetical', by: 'SortName', order: 'Ascending' },
    { label: 'Creator', by: 'AlbumArtist,SortName', order: 'Ascending' },
    { label: 'Release date', by: 'ProductionYear,SortName', order: 'Descending' }
  ];
  // A-Z key: the title without a leading The/A/An, compared as text (2001 before 808s, like Spotify)
  function azKey(a) { return (a.Name || '').replace(/^(the|a|an)\s+/i, '').toLowerCase(); }
  function sortIdx() { var i = parseInt(store('ivf-music-sort'), 10); return i >= 0 && i < SORTS.length ? i : 0; }
  // the sort chip opens a "Sort by" list (it used to change the order on each press, with no list)
  var sortMenu = null;
  function openSortMenu(chip) {
    closeSortMenu();
    var cur = sortIdx();
    sortMenu = document.createElement('div');
    sortMenu.className = 'sortm';
    sortMenu.innerHTML = '<div class="sk">Sort by</div>' + SORTS.map(function (s, i) {
      return '<button type="button" class="fx so' + (i === cur ? ' on' : '') + '" data-sort="' + i + '"><span>' + esc(s.label) + '</span>' + (i === cur ? icon('check') : '') + '</button>';
    }).join('');
    chip.parentNode.appendChild(sortMenu);
    var f = sortMenu.querySelector('.so.on') || sortMenu.querySelector('.so');
    if (f) f.focus({ preventScroll: true });
  }
  function closeSortMenu(refocus) {
    if (!sortMenu) return false;
    if (sortMenu.parentNode) sortMenu.parentNode.removeChild(sortMenu);
    sortMenu = null;
    var c = refocus && page.querySelector('[data-lib="sort"]');
    if (c) c.focus({ preventScroll: true });
    return true;
  }
  // web: a click anywhere else closes the list
  document.addEventListener('mousedown', function (e) {
    if (sortMenu && !sortMenu.contains(e.target) && !(e.target.closest && e.target.closest('[data-lib="sort"]'))) closeSortMenu();
  }, true);
  // New playlist: the button turns into a name box + Create (Enter in the box also creates)
  function newPlaylistForm(btn) {
    var f = document.createElement('span');
    f.className = 'npf';
    f.innerHTML = '<input class="fx" type="text" placeholder="Playlist name" autocomplete="off"><button type="button" class="fx chip" data-lib="mkpl">Create</button>';
    btn.replaceWith(f);
    var inp = f.querySelector('input');
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.keyCode === 13) { e.preventDefault(); e.stopPropagation(); makePlaylist(inp); } }, true);
    inp.focus();
  }
  function makePlaylist(inp) {
    var name = inp && inp.value.trim();
    if (!name) { if (inp) inp.focus(); return; }
    inp.disabled = true;
    var cb = inp.parentNode.querySelector('[data-lib="mkpl"]'); if (cb) cb.textContent = 'Creating…';
    ApiClient.ajax({ type: 'POST', url: ApiClient.getUrl('/Playlists'), contentType: 'application/json',
      data: JSON.stringify({ Name: name, Ids: [], UserId: uid(), MediaType: 'Audio', IsPublic: false }) }).then(function () {}, function () {});
    // the server answers before the new playlist can be found - look again until it is there (it took ~6 s; max ~10 s)
    var tries = 0;
    (function check() {
      setTimeout(function () {
        if (!view || view.v !== 'library' || libMode !== 'playlists') return;
        loadPlaylists().then(function (l) {
          if (l.some(function (x) { return x.Name === name; }) || ++tries >= 15) renderLibrary(true); else check();
        });
      }, 700);
    })();
  }
  function renderLibrary(keepFocus) {
    sortMenu = null;
    var s = SORTS[sortIdx()], t = ++viewToken;
    var head = '<div class="lt"><h1>Your Library</h1>' +
      '<button type="button" class="fx chip' + (libMode === 'albums' ? ' on' : '') + '" data-lib="albums">Albums</button>' +
      '<button type="button" class="fx chip' + (libMode === 'artists' ? ' on' : '') + '" data-lib="artists">Artists</button>' +
      '<button type="button" class="fx chip' + (libMode === 'playlists' ? ' on' : '') + '" data-lib="playlists">Playlists</button>' +
      (libMode === 'albums' ? '<button type="button" class="fx chip sort" data-lib="sort">' + icon('swap_vert') + esc(s.label) + '</button>' : '') +
      // a new, empty playlist (round-5 beta: there was no way to make one from here)
      (libMode === 'playlists' ? '<button type="button" class="fx chip sort" data-lib="newpl">' + icon('add') + 'New playlist</button>' : '') + '</div>';
    var pls = libMode === 'playlists';
    var p = libMode === 'albums' ? getItems(q({ SortBy: s.by, SortOrder: s.order })) : pls ? loadPlaylists() : Promise.resolve(home.artists);
    return p.then(function (items) {
      if (t !== viewToken) return;
      if (libMode === 'albums' && s.label === 'Alphabetical') items = items.slice().sort(function (x, y) { return azKey(x).localeCompare(azKey(y)); });
      var foc = keepFocus && document.activeElement && document.activeElement.getAttribute('data-lib');
      var noun = pls ? 'playlist' : libMode === 'albums' ? 'album' : 'artist';
      page.innerHTML = '<div class="pg">' + head.replace('</h1>', '</h1><span class="cnt">' + items.length + ' ' + noun + (items.length === 1 ? '' : 's') + '</span>') +
        (pls && !items.length ? '<div class="empty">No playlists yet. Choose New playlist, or use … on a song and choose Add to playlist.</div>' : '') +
        '<div class="gd">' + items.map(libMode === 'albums' ? gridCard : pls ? gridPlaylist : gridArtist).join('') + '</div></div>';
      var pre = pls ? 'playlist:' : libMode === 'albums' ? 'album:' : 'artist:';
      startCycle(view, items.map(function (x) { var hh = heroes[pre + x.Id]; return hh && hh.tint; }));
      tintCards(page);
      markPlaying();
      if (foc) { var b = page.querySelector('[data-lib="' + foc + '"]'); if (b) b.focus({ preventScroll: true }); }
    });
  }
  // Playlists (plan part 4): Jellyfin's playlists - the same ones the Android app and phone apps show
  function loadPlaylists() {
    return getItems({ IncludeItemTypes: 'Playlist', Recursive: true, SortBy: 'SortName', Fields: 'ChildCount' })
      .then(function (l) { return l.filter(function (x) { return !x.MediaType || x.MediaType === 'Audio' || x.MediaType === 'Unknown'; }); });
  }
  function gridPlaylist(a) {
    var pic = imgUrl(a.Id, 'Primary', { maxWidth: 240 });
    heroes['playlist:' + a.Id] = { title: a.Name, meta: 'Playlist', art: imgUrl(a.Id, 'Primary', { maxWidth: 2000 }), sq: true, tint: imgUrl(a.Id, 'Primary', { maxWidth: 96 }) };
    return '<button type="button" class="fx cd" data-k="playlist:' + a.Id + '"><span class="p"' + bgi(pic) + '></span>' +
      '<span class="ln">' + esc(a.Name) + '</span><span class="ls">Playlist' + (a.ChildCount ? ' • ' + songs(a.ChildCount) : '') + '</span></button>';
  }
  var searchTimer = null;
  function renderSearch() {
    startCycle(view, ((home && home.all) || []).map(function (a) { return tintUrl(a); }));
    page.innerHTML = '<div class="pg"><label class="sbox">' + icon('search') + '<input class="fx" type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" placeholder="What do you want to listen to?"></label><div class="sres"></div></div>';
    var inp = page.querySelector('input'), box = page.querySelector('.sbox');
    inp.value = searchText;
    inp.addEventListener('focus', function () { box.classList.add('fo'); });
    inp.addEventListener('blur', function () { box.classList.remove('fo'); });
    inp.addEventListener('input', function () { clearTimeout(searchTimer); searchTimer = setTimeout(runSearch, 350); });
    inp.addEventListener('keydown', function (e) { if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 65376) { clearTimeout(searchTimer); runSearch(); } });
    // (returned: Back to Search puts the selection back once the results are there)
    return runSearch();
  }
  function runSearch() {
    var inp = page.querySelector('.sbox input'); if (!inp) return;
    var term = searchText = inp.value.trim(), out = page.querySelector('.sres'), t = ++viewToken;
    if (!term) { out.innerHTML = browseAll(); return Promise.resolve(); }
    return Promise.all([
      getItems(q({ SearchTerm: term, Limit: 30 })),
      ApiClient.getJSON(ApiClient.getUrl('/Artists/AlbumArtists', { ParentId: lib.id, userId: uid(), SearchTerm: term, Limit: 20, ImageTypeLimit: 1, EnableImageTypes: 'Primary,Backdrop' })).then(function (r) { return (r && r.Items) || []; }, function () { return []; }),
      getItems({ ParentId: lib.id, IncludeItemTypes: 'Audio', Recursive: true, SearchTerm: term, Limit: 30, Fields: 'RunTimeTicks' })
    ]).then(function (r) {
      if (t !== viewToken) return;
      view.data = { tracks: r[2] };
      // Artists and Albums first, then the songs (round-5 beta: below up to 30 songs they were never seen)
      var h = row('Artists', r[1].map(artistCard).join('')) + row('Albums', r[0].map(card).join(''));
      h += r[2].length ? '<section class="row"><h2>Songs</h2><div class="tl">' + trackRows(r[2], true) + '</div></section>' : '';
      out.innerHTML = h || '<div class="empty">No results for "' + esc(term) + '"</div>';
      markPlaying();
    });
  }
  // ---- Browse (Search, nothing typed) ----
  function decadeOf(a) { return a.ProductionYear ? Math.floor(a.ProductionYear / 10) * 10 : 0; }
  function browseLists() {
    var all = (home && home.all) || [], L = [];
    if (home && home.liked) L.push({ k: 'liked', name: 'Liked Songs', hue: 262, liked: true });
    if (home && home.added.length) L.push({ k: 'recent', name: 'Recently added', hue: 14, items: home.added });
    var decs = {};
    all.forEach(function (a) { var dd = decadeOf(a); if (dd) (decs[dd] = decs[dd] || []).push(a); });
    var dhues = [158, 200, 330, 40, 280];
    Object.keys(decs).sort().forEach(function (dd, i) { L.push({ k: 'd' + dd, name: dd + 's', hue: dhues[i % dhues.length], items: decs[dd] }); });
    [['album', 'Albums', 4, ['album', 'compile']], ['ep', 'EPs & Singles', 186, ['ep', 'single']], ['mix', 'Mixtapes & More', 300, ['mixtape']]].forEach(function (t) {
      var it = all.filter(function (a) { return t[3].indexOf(albumType(a)) >= 0; });
      if (it.length) L.push({ k: 't' + t[0], name: t[1], hue: t[2], items: it });
    });
    if (home && home.artists.length) L.push({ k: 'artists', name: 'Artists', hue: 96, artists: home.artists });
    return L;
  }
  function browseAll() {
    var used = {}; // each tile shows a different cover (the newest one not shown yet)
    return '<div class="bwh">Browse all</div><div class="bwg">' + browseLists().map(function (b) {
      var c = '', cls = 'p', pic = '';
      if (b.liked) { cls += ' liked'; c = icon('favorite'); }
      else if (b.items) {
        var by = b.items.filter(function (a) { return a.ImageTags && a.ImageTags.Primary; }).sort(function (x, y) { return (y.ProductionYear || 0) - (x.ProductionYear || 0); });
        var a0 = by.filter(function (a) { return !used[a.Id]; })[0] || by[0];
        if (a0) { used[a0.Id] = 1; pic = cover(a0, 160); }
      }
      else if (b.artists) { cls += ' ar'; var a = b.artists[0]; pic = a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 160, tag: a.ImageTags.Primary }) : ''; }
      return '<button type="button" class="fx bw" data-k="browse:' + b.k + '" style="--bwc:' + huePal(b.hue).tile + '"><span>' + esc(b.name) + '</span><span class="' + cls + '"' + bgi(pic) + '>' + c + '</span></button>';
    }).join('') + '</div>';
  }
  function renderBrowse(v) {
    var b = browseLists().filter(function (x) { return x.k === v.arg; })[0];
    if (!b) { page.innerHTML = '<div class="pg"><div class="empty">Nothing here</div></div>'; return; }
    applyPal(huePal(b.hue));
    var list = b.artists ? b.artists.map(gridArtist) : b.items.slice().sort(function (x, y) { return (y.ProductionYear || 0) - (x.ProductionYear || 0); }).map(gridCard);
    page.innerHTML = '<div class="pg"><div class="bvh"><div class="k">' + (b.artists ? 'Artists' : 'Collection') + '</div><h1>' + esc(b.name) + '</h1>' +
      '<div class="k">' + list.length + (b.artists ? (list.length === 1 ? ' artist' : ' artists') : (list.length === 1 ? ' album' : ' albums')) + '</div></div><div class="gd">' + list.join('') + '</div></div>';
    tintCards(page);
    markPlaying();
    if (TV && v.focusAfter) { v.focusAfter = false; var f = page.querySelector('.gd .cd'); if (f) focusEl(f); }
  }
  function trackRows(tracks, showAlbum, albumOnly) { // albumOnly: artist page Popular - the album is the only sub line (as Android)
    var discs = {}; tracks.forEach(function (t) { discs[t.ParentIndexNumber || 1] = 1; });
    var multi = !showAlbum && Object.keys(discs).length > 1, lastDisc = null, h = '';
    tracks.forEach(function (t, i) {
      var disc = t.ParentIndexNumber || 1;
      if (multi && disc !== lastDisc) { h += '<div class="disc">' + icon('album') + '<span>Disc ' + disc + '</span></div>'; lastDisc = disc; }
      var tf = t.UserData && t.UserData.IsFavorite;
      var sub = albumOnly ? esc(t.Album || '') : esc((t.Artists || []).join(', ') || t.AlbumArtist || '') + (showAlbum && t.Album ? ' • ' + esc(t.Album) : '');
      h += '<div class="fx tr" tabindex="0" role="button" data-i="' + i + '" data-id="' + t.Id + '">' +
        '<span class="n"><span class="num">' + (showAlbum ? i + 1 : (t.IndexNumber || i + 1)) + '</span>' + icon('play_arrow', 'pl') + '<span class="eq"><i></i><i></i><i></i><i></i></span></span>' +
        '<span class="nm"><div class="a">' + esc(t.Name) + '</div><div class="b">' + sub + '</div></span>' +
        '<span class="t">' + (TV ? '' : '<button type="button" class="ib tfav' + (tf ? ' on' : '') + '" tabindex="-1" title="' + (tf ? 'Remove from favourites' : 'Add to favourites') + '">' + icon(tf ? 'favorite' : 'favorite_border') + '</button>') +
        '<span>' + mmss(t.RunTimeTicks) + '</span>' + '<button type="button" class="' + (TV ? 'fx ' : '') + 'ib tmore" tabindex="-1" title="More">' + icon('more_horiz') + '</button>' + '</span></div>';
    });
    return h;
  }
  var viewToken = 0;
  function renderAlbum(v) {
    var t = ++viewToken, liked = v.v === 'liked', pl = v.v === 'playlist';
    var p = liked
      ? getItems({ ParentId: lib.id, IncludeItemTypes: 'Audio', Recursive: true, Filters: 'IsFavorite', SortBy: 'AlbumArtist,Album,ParentIndexNumber,IndexNumber', Fields: 'RunTimeTicks' })
        .then(function (tracks) { return { item: null, tracks: tracks, more: [] }; })
      : pl ? Promise.all([ApiClient.getItem(uid(), v.arg), getItems({ ParentId: v.arg, Fields: 'RunTimeTicks,ArtistItems' })])
        .then(function (r) { return { item: r[0], tracks: r[1].filter(function (x) { return x.Type === 'Audio'; }), more: [], playlist: true }; })
      : ApiClient.getItem(uid(), v.arg).then(function (item) {
        var artist = (item.AlbumArtists || [])[0];
        return Promise.all([
          getItems({ ParentId: v.arg, SortBy: 'ParentIndexNumber,IndexNumber,SortName', Fields: 'ArtistItems,RunTimeTicks' }),
          artist ? getItems({ AlbumArtistIds: artist.Id, IncludeItemTypes: 'MusicAlbum', Recursive: true, SortBy: 'ProductionYear,SortName', SortOrder: 'Descending', Limit: 30, Fields: 'ChildCount' }) : []
        ]).then(function (r) { return { item: item, tracks: r[0], more: r[1].filter(function (a) { return a.Id !== v.arg; }) }; });
      });
    page.innerHTML = '<div class="pg"></div>';
    return p.then(function (data) {
      if (t !== viewToken || view !== v) return;
      v.data = data;
      var it = data.item, tracks = data.tracks, total = 0;
      tracks.forEach(function (x) { total += x.RunTimeTicks || 0; });
      var h;
      if (liked) h = likedHero(tracks.length);
      else if (pl) h = { title: it.Name, meta: 'Playlist • ' + songs(tracks.length) + (total ? ', ' + longDur(total) : ''), art: imgUrl(it.Id, 'Primary', { maxWidth: 2000 }), sq: true, tint: imgUrl(it.Id, 'Primary', { maxWidth: 96 }) };
      else {
        h = albumHero(it);
        var aa = (it.AlbumArtists || [])[0];
        // the artist (picture + name) is a link to the artist's page
        var who = esc(it.AlbumArtist || (aa && aa.Name) || '');
        h.meta = (aa ? '<button type="button" class="fx arl" data-k="artist:' + aa.Id + '"><span class="av"' + bgi(imgUrl(aa.Id, 'Primary', { maxWidth: 48 })) + '></span>' + who + '</button>' : '') +
          [aa ? '' : who, it.ProductionYear || '', songs(tracks.length) + (total ? ', ' + longDur(total) : '')].filter(Boolean).join(' • ').replace(/^/, aa ? '• ' : ''); // (the link's own right padding is the space before the dot - round 5: double gap)
      }
      setTint(h.tint);
      var fav = it && it.UserData && it.UserData.IsFavorite;
      var html = '<div class="pg">' + heroHtml(h, '<div class="hk2">' + (liked || pl ? 'Playlist' : 'Album') + '</div>') +
        '<div class="acts"><button type="button" class="fx bt pri" data-act="play">' + icon('play_arrow') + '<span>Play</span></button>' +
        '<button type="button" class="fx bt" data-act="shuffle">' + icon('shuffle') + '<span>Shuffle</span></button>' +
        (pl ? '<button type="button" class="fx bt" data-act="pldel">' + icon('delete') + '<span>Delete</span></button>' : liked ? '' :
          '<button type="button" class="fx bt rd" data-act="radio" title="Radio: similar songs">' + icon('radio') + '</button>' +
          '<button type="button" class="fx bt rd fav' + (fav ? ' on' : '') + '" data-act="fav" title="' + (fav ? 'Remove from favourites' : 'Add to favourites') + '">' + icon(fav ? 'favorite' : 'favorite_border') + '</button>' +
          '<button type="button" class="fx bt rd" data-act="more" title="More">' + icon('more_horiz') + '</button>') + '</div>' +
        '<div class="tl">' + (tracks.length ? trackRows(tracks, liked || pl) : '<div class="empty">' + (liked ? 'Songs you like will appear here. Select the heart on Now Playing.' : pl ? 'No songs yet. Use … on a song and choose Add to playlist.' : 'No songs') + '</div>') + '</div>';
      if (data.more.length && it) html += row('More by ' + (it.AlbumArtist || ''), data.more.map(card).join(''));
      page.innerHTML = html + '</div>';
      markPlaying();
      if (!liked && !pl) prefetchRadio(v.arg);
      if (TV && v.focusAfter) { v.focusAfter = false; var b = page.querySelector('.bt'); if (b) focusEl(b); }
    });
  }
  // Artist page sections. Server data from jellyfin-web-custom/backup/music-artist-data.ps1:
  // album ProviderIds.IvfType (album/compile/ep/single/mixtape), artist ProviderIds.IvfPopular (track ids)
  var DISCOGRAPHY = [['Albums', ['album', 'compile']], ['EPs & Singles', ['ep', 'single']], ['Mixtapes & More', ['mixtape']]];
  // Other servers (2026-11-19, like Android IvfMusicExtras): no IvfType / IvfPopular ids, so the artist page
  // asks Deezer (free, no account) for the artist's top tracks and release types, matched by title. Deezer
  // sends no CORS headers, so JSONP (works in browsers and the Samsung app). Server ids always win.
  function albumType(a) {
    var t = a.ProviderIds && a.ProviderIds.IvfType;
    return t || dzTypes[a.Id] || guessType(a) || 'album';
  }
  // Spotify's rule when nothing else knows: 1-3 songs under 30 min = single, 4-6 under 30 min = EP
  function guessType(a) {
    var n = a.ChildCount, min = (a.RunTimeTicks || 0) / 600000000;
    if (!n || !a.RunTimeTicks || min >= 30) return null;
    return n <= 3 ? 'single' : n <= 6 ? 'ep' : null;
  }
  var dzTypes = {}, dzArtists = {}, dzSeq = 0;
  function dzNorm(s) { return String(s || '').toLowerCase().replace(/\s*[(\[][^)\]]*[)\]]/g, '').replace(/[^0-9a-zÀ-￿]/g, ''); }
  var EP_SUFFIX = /\s*-?\s*\b(EP|Single)$/i;
  function dzRelKey(t) { return dzNorm(String(t || '').replace(EP_SUFFIX, '')); }
  function dzGet(path) {
    return new Promise(function (ok) {
      var cb = 'ivfDz' + (++dzSeq), s = document.createElement('script'), done = false;
      function end(v) { if (done) return; done = true; try { delete window[cb]; } catch (e) { window[cb] = undefined; } s.remove(); ok(v); }
      window[cb] = function (d) { end(d && !d.error ? d : null); };
      s.onerror = function () { end(null); };
      setTimeout(function () { end(null); }, 10000);
      s.src = 'https://api.deezer.com/' + path + (path.indexOf('?') < 0 ? '?' : '&') + 'output=jsonp&callback=' + cb;
      document.head.appendChild(s);
    });
  }
  // the artist on Deezer (exact name match only - never a different artist): { top: [titles], rel: [[title, type]] } or null
  function dzArtist(name) {
    var key = dzNorm(name);
    if (!key) return Promise.resolve(null);
    if (dzArtists[key]) return dzArtists[key];
    dzArtists[key] = dzGet('search/artist?limit=10&q=' + encodeURIComponent(name)).then(function (r) {
      var hit = ((r && r.data) || []).filter(function (x) { return dzNorm(x.name) === key; })[0];
      if (!hit) return null;
      return Promise.all([dzGet('artist/' + hit.id + '/top?limit=50'), dzGet('artist/' + hit.id + '/albums?limit=300')]).then(function (x) {
        return {
          top: ((x[0] && x[0].data) || []).map(function (t) { return t.title; }),
          rel: ((x[1] && x[1].data) || []).map(function (r) { return [r.title, r.record_type]; })
        };
      });
    });
    return dzArtists[key];
  }
  // like the original library's script: a release Deezer doesn't have is a mixtape, unless its title says EP
  function dzLearnTypes(albums, dz) {
    if (!dz.rel.length) return;
    var by = {};
    dz.rel.forEach(function (r) { by[dzRelKey(r[0])] = r[1]; });
    albums.forEach(function (a) {
      if (a.ProviderIds && a.ProviderIds.IvfType) return;
      dzTypes[a.Id] = by[dzRelKey(a.Name)] || (EP_SUFFIX.test(a.Name || '') ? 'ep' : 'mixtape');
    });
  }
  // up to 10 of the artist's songs in Deezer's popularity order (each title once)
  function dzPopular(songs, dz) {
    var left = songs.slice(), out = [];
    for (var i = 0; i < dz.top.length && out.length < 10; i++) {
      var k = dzNorm(dz.top[i]); if (!k) continue;
      for (var j = 0; j < left.length; j++) if (dzNorm(left[j].Name) === k) { out.push(left.splice(j, 1)[0]); break; }
    }
    return out;
  }
  function discCard(a) {
    heroes['album:' + a.Id] = albumHero(a);
    return '<button type="button" class="fx cd" data-k="album:' + a.Id + '" data-album="' + a.Id + '"><span class="p"' + bgi(cover(a, 240)) + '>' + EQ + '</span>' +
      '<span class="ln">' + esc(a.Name) + '</span><span class="ls">' + (a.ProductionYear || '') + '</span></button>';
  }
  function renderArtist(v) {
    var t = ++viewToken;
    page.innerHTML = '<div class="pg"></div>';
    return ApiClient.getItem(uid(), v.arg).then(function (a) {
      var pop = ((a.ProviderIds && a.ProviderIds.IvfPopular) || '').split(',').filter(Boolean);
      return Promise.all([
        a,
        getItems({ AlbumArtistIds: v.arg, IncludeItemTypes: 'MusicAlbum', Recursive: true, SortBy: 'ProductionYear,SortName', SortOrder: 'Descending', Fields: 'ChildCount,ProviderIds' }),
        ApiClient.getItems(uid(), { AlbumArtistIds: v.arg, IncludeItemTypes: 'Audio', Recursive: true, Limit: 0 }).then(function (r) { return r.TotalRecordCount || 0; }, function () { return 0; }),
        pop.length ? getItems({ Ids: pop.join(','), Fields: 'RunTimeTicks' }).then(function (list) {
          var by = {}; list.forEach(function (x) { by[x.Id] = x; });
          return pop.map(function (id) { return by[id]; }).filter(Boolean); // keep Deezer's order
        }) : []
      ]);
    }).then(function (r) {
      // other servers: no IvfPopular / IvfType ids - ask Deezer
      var a = r[0], albums = r[1];
      var needDz = !r[3].length || albums.some(function (al) { return !(al.ProviderIds && al.ProviderIds.IvfType); });
      if (!needDz || t !== viewToken) return r;
      return dzArtist(a.Name).then(function (dz) {
        if (!dz) return r;
        dzLearnTypes(albums, dz);
        if (r[3].length || !dz.top.length) return r;
        return getItems({ ArtistIds: v.arg, IncludeItemTypes: 'Audio', Recursive: true, Fields: 'RunTimeTicks' }).then(function (songs) {
          return [r[0], r[1], r[2], dzPopular(songs, dz)];
        }, function () { return r; });
      });
    }).then(function (r) {
      if (!r || t !== viewToken || view !== v) return;
      var a = r[0], albums = r[1], songCount = r[2], popular = r[3];
      v.data = { item: a, albums: albums, tracks: popular }; // tracks: the Popular rows play from this list
      var h = artistHero(a);
      // ("Artist" is already written above the name - the line under it just counts)
      setTint(h.tint);
      h.meta = h.meta.replace('Artist', albums.length + (albums.length === 1 ? ' album' : ' albums') + (songCount ? ' • ' + songs(songCount) : ''));
      var html = '<div class="pg">' + heroHtml(h, '<div class="hk2">Artist</div>') +
        '<div class="acts"><button type="button" class="fx bt pri" data-act="aplay">' + icon('play_arrow') + '<span>Play</span></button>' +
        '<button type="button" class="fx bt" data-act="ashuffle">' + icon('shuffle') + '<span>Shuffle</span></button>' +
        '<button type="button" class="fx bt" data-act="radio">' + icon('radio') + '<span>Radio</span></button></div>';
      // Popular: 5 shown, See more for the rest
      if (popular.length) {
        html += '<section class="pop' + (popular.length > 5 ? ' cl' : '') + '"><h2>Popular</h2><div class="tl">' + trackRows(popular, true, true) + '</div>' +
          (popular.length > 5 ? '<button type="button" class="fx bt sm" data-act="popmore">' + icon('expand_more') + '<span>See more</span></button>' : '') + '</section>';
      }
      DISCOGRAPHY.forEach(function (d) {
        html += row(d[0], albums.filter(function (al) { return d[1].indexOf(albumType(al)) >= 0; }).map(discCard).join(''));
      });
      if (a.Overview) {
        var p = a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 400, tag: a.ImageTags.Primary }) : '';
        html += '<section class="about"><h2>About</h2><button type="button" class="fx abt" data-act="about"><span class="ph"' + bgi(p) + '></span>' +
          '<span class="tx"><span class="an">' + esc(a.Name) + '</span><span class="ao">' + esc(a.Overview) + '</span><span class="rm">Read more</span></span></button></section>';
      }
      page.innerHTML = html + '</div>';
      markPlaying();
      prefetchRadio(v.arg);
      if (TV && v.focusAfter) { v.focusAfter = false; var b = page.querySelector('.bt'); if (b) focusEl(b); }
    });
  }

  // ---- moving between views ------------------------------------------------------------------------
  function keyOf(el) { return el && (el.getAttribute('data-k') || el.getAttribute('data-act') || el.getAttribute('data-lib') || el.getAttribute('data-id')); }
  function go(v, push) {
    if (push && view) {
      if (push !== 'nohist') histPush();
      var a = document.activeElement;
      view.focusKey = page.contains(a) ? keyOf(a) : null;
      view.scroll = page.scrollTop;
      stack.push(view);
    }
    page.classList.remove("bk"); // (forward: the page slides in from the right)
    view = v;
    if (v.v === 'home') pickShortcuts();
    v.focusAfter = TV;
    page.scrollTop = 0;
    artEl.innerHTML = '';
    topEl.style.transform = artEl.style.transform = '';
    moveJfHeader(0);
    topEl.style.setProperty('--ivf-mu-sc', '0');
    markNav();
    saveState();
    var r = render(v);
    if (TV && (v.v === 'home' || v.v === 'library' || v.v === 'search')) Promise.resolve(r).then(function () { focusDefault(); });
  }
  // The Music page you're on, kept for this browser tab: a reload opens it again (the address only
  // ever shows an album - see open() - so it can't say which Music page you were on)
  var STATE = 'ivf-music-state';
  function saveState() {
    if (!view) return;
    try {
      sessionStorage.setItem(STATE, JSON.stringify({ hash: location.hash, homeHash: homeHash, view: { v: view.v, arg: view.arg },
        stack: stack.map(function (s) { return { v: s.v, arg: s.arg }; }) }));
    } catch (e) {}
  }
  function readState() { try { return JSON.parse(sessionStorage.getItem(STATE) || 'null'); } catch (e) { return null; } }
  function clearState() { try { sessionStorage.removeItem(STATE); } catch (e) {} }
  // Web: every Music page (and Now Playing) is a browser history entry, so the browser's back button,
  // Jellyfin's Back arrow and Esc all step back one Music page instead of leaving Music.
  // (TV: the remote's Back key is handled by the keydown handler as before - no extra entries.)
  var muDepth = 0;
  function histPush() {
    if (TV) return;
    try { history.pushState({ ivfMu: ++muDepth }, '', location.href); } catch (e) { muDepth--; }
  }
  function stepBack() {
    if (!TV && muDepth > 0) { history.back(); return true; } // popstate below does the step
    return back();
  }
  // Jellyfin's own menus/dialogs (the "..." menu) step history back themselves when they close: that
  // step isn't a Back press (round-4 beta: More > View album artist, then Esc, skipped the album)
  var dialogAt = 0;
  function markDialog(e) { if (e.target && e.target.closest && e.target.closest('.dialogContainer, .actionSheet, .dialog')) dialogAt = Date.now(); }
  document.addEventListener('click', markDialog, true);
  document.addEventListener('keydown', function (e) { if ((e.key === 'Escape' || e.keyCode === 27) && document.querySelector('.dialogContainer .dialog')) dialogAt = Date.now(); }, true);
  window.addEventListener('popstate', function () {
    if (TV || !isOpen || muDepth <= 0) return;
    if (Date.now() - dialogAt < 1500) { dialogAt = 0; return; }
    muDepth--;
    back();
  });
  function back() {
    if (npOpen && np.classList.contains("ly")) { closeLyrics(); return true; } // lyrics first, then Now Playing
    if (npOpen) { closeNow(); return true; }
    if (stack.length) {
      var v = stack.pop();
      artEl.innerHTML = '';
      page.classList.add("bk"); // Back: the page slides in from the left
      view = v;
      saveState();
      markNav();
      var r = render(v);
      Promise.resolve(r).then(function () {
        if (v.v === 'home') fillAlbums(); // (the card to go back to may be one of the later albums)
        page.scrollTop = v.scroll || 0;
        var el = v.focusKey && page.querySelector('[data-k="' + v.focusKey + '"],[data-act="' + v.focusKey + '"],[data-lib="' + v.focusKey + '"],[data-id="' + v.focusKey + '"]');
        if (TV) { if (el) focusEl(el, true); else focusDefault(); }
        if (v.v === 'home' && el && heroes[v.focusKey]) setHero(v.focusKey);
      });
      return true;
    }
    if (view && view.v !== 'home') { go({ v: 'home' }); return true; }
    return false;
  }
  function markNav() {
    var top = function (x) { return x && (x.v === 'home' || x.v === 'library' || x.v === 'search'); }, cur = top(view) ? view.v : 'home';
    if (!top(view)) for (var si = stack.length - 1; si >= 0; si--) if (top(stack[si])) { cur = stack[si].v; break; } // the tab this page was opened from
    Array.prototype.forEach.call(topEl.querySelectorAll('.nv'), function (n) { n.classList.toggle('on', n.getAttribute('data-nav') === cur); });
  }
  function openKey(k) {
    if (k.indexOf('mix:') === 0) { playMix(k.slice(4)); return; }
    if (k.indexOf('playlist:') === 0) { go({ v: 'playlist', arg: k.slice(9) }, true); return; }
    if (k === 'liked') go({ v: 'liked' }, true);
    else if (k.indexOf('album:') === 0) go({ v: 'album', arg: k.slice(6) }, true);
    else if (k.indexOf('artist:') === 0) go({ v: 'artist', arg: k.slice(7) }, true);
    else if (k === 'browse:liked') go({ v: 'liked' }, true);
    else if (k.indexOf('browse:') === 0) go({ v: 'browse', arg: k.slice(7) }, true);
  }

  // hero follows the selected card (Home only)
  var heroKey = null, heroTimer = null;
  function setHero(k, fade) {
    if (!view || view.v !== 'home' || k === heroKey || !heroes[k]) return;
    heroKey = k;
    var h = heroes[k], art = artEl.querySelector('.hart'), ht = page.querySelector('.hero .ht'), hm = page.querySelector('.hero .hm');
    if (!art || !ht) return;
    if (fade) { // the rotation: fade the old picture out, then the new one in
      art.style.opacity = '0';
      setTimeout(function () { if (heroKey !== k) return; showHero(h, art, ht, hm); art.style.opacity = ''; }, 400);
      return;
    }
    art.style.opacity = '';
    showHero(h, art, ht, hm);
  }
  function showHero(h, art, ht, hm) {
    art.className = 'hart' + (h.liked ? ' liked' : '') + (h.sq ? ' sq' : '');
    art.style.backgroundImage = h.art ? 'url("' + h.art + '")' : '';
    art.innerHTML = h.liked ? icon('favorite', 'hk') : '';
    ht.textContent = h.title; hm.innerHTML = h.meta;
    setTint(h.tint);
  }
  function heroSoon(k) { lastHeroUser = Date.now(); clearTimeout(heroTimer); heroTimer = setTimeout(function () { setHero(k); }, TV ? 140 : 90); }
  // Home: the hero rotates through the recent albums (the shortcut cards) every 7 s; selecting or
  // pointing at a card shows that one and holds the rotation for 15 s
  var lastHeroUser = 0;
  // Library / Search: the page colour moves through the albums every 7 s (in a shuffled order,
  // starting with the first one shown)
  var cycle = null;
  function startCycle(v, tints) {
    tints = tints.filter(Boolean);
    var rest = tints.slice(1);
    for (var i = rest.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = rest[i]; rest[i] = rest[j]; rest[j] = t; }
    cycle = { v: v, tints: tints.slice(0, 1).concat(rest), i: 0 };
    setTint(cycle.tints[0] || '');
  }
  setInterval(function () {
    if (!cycle || !isOpen || npOpen || view !== cycle.v || document.hidden || cycle.tints.length < 2) return;
    cycle.i = (cycle.i + 1) % cycle.tints.length;
    setTint(cycle.tints[cycle.i]);
  }, 7000);
  setInterval(function () {
    if (!isOpen || npOpen || !view || view.v !== 'home' || document.hidden || !home || !home.recent.length) return;
    if (Date.now() - lastHeroUser < 15000) return;
    var keys = home.recent.map(function (a) { return 'album:' + a.Id; });
    setHero(keys[(keys.indexOf(heroKey) + 1) % keys.length], true);
  }, 7000);

  // ---- playing -------------------------------------------------------------------------------------
  function ids(list) { return list.map(function (t) { return t.Id; }); }
  function onPageClick(e) {
    var el = e.target.closest('button, .tr'); if (!el || !view) return;
    var tr = e.target.closest('.tr');
    if (el.classList.contains('tfav') && tr) { setFav(tr.getAttribute('data-id'), !el.classList.contains('on'), el, true); return; }
    if (el.classList.contains('tmore') && tr) { jfMenu(tr.getAttribute('data-id'), 'Audio', false, el); return; }
    if (tr) { playRow(tr); return; }
    var so = el.getAttribute('data-sort');
    if (so != null) { store('ivf-music-sort', so); closeSortMenu(true); renderLibrary(true); return; }
    var l = el.getAttribute('data-lib');
    if (l === 'sort') { if (sortMenu) closeSortMenu(true); else openSortMenu(el); return; }
    if (l === 'newpl') { newPlaylistForm(el); return; }
    if (l === 'mkpl') { makePlaylist(el.parentNode.querySelector('input')); return; }
    closeSortMenu();
    var k = el.getAttribute('data-k');
    if (k) { openKey(k); return; }
    if (l) { libMode = l; renderLibrary(true); return; }
    var act = el.getAttribute('data-act'), data = view.data || {};
    if (act !== 'pldel' && delArmed) { delArmed.querySelector('span:last-child').textContent = 'Delete'; delArmed = null; }
    if (act === 'radio') { playRadio(view.arg); return; }
    if (act === 'pldel') { // a playlist: press Delete twice
      if (delArmed !== el) { delArmed = el; el.querySelector('span:last-child').textContent = 'Press again to delete'; return; }
      delArmed = null;
      ApiClient.ajax({ type: 'DELETE', url: ApiClient.getUrl('/Items/' + view.arg) }).then(function () { stepBack(); }, function () { el.querySelector('span:last-child').textContent = 'Could not delete'; });
      return;
    }
    var plFrom = view.v === 'liked' ? { k: 'PLAYLIST', n: 'Liked Songs' } : view.v === 'playlist' && data.item ? { k: 'PLAYLIST', n: data.item.Name } : null;
    if (act === 'play') { if (listPlaying()) ctl('pp'); else playTracks(ids(data.tracks || []), 0, plFrom); }
    else if (act === 'shuffle') playTracks(shuffle(ids(data.tracks || [])), 0, plFrom);
    else if (act === 'fav' && data.item) setFav(data.item.Id, !el.classList.contains('on'), el);
    else if (act === 'more' && data.item) jfMenu(data.item.Id, 'MusicAlbum', true, el);
    else if (act === 'popmore') {
      var sec = el.closest('.pop'), open = sec.classList.toggle('cl') === false;
      el.querySelector('.material-icons').textContent = open ? 'expand_less' : 'expand_more';
      el.querySelector('span:last-child').textContent = open ? 'Show less' : 'See more';
      // the list grew/shrank around the button: keep it selected and on screen (round-4 beta: the
      // selection went off the bottom, so nothing looked selected)
      if (TV) setTimeout(function () { focusEl(el); }, 30);
    }
    else if (act === 'about') el.classList.toggle('open');
    else if (act === 'aplay' || act === 'ashuffle') {
      // the artist's songs: newest album first (a queue of at most 200 - longer lists choke the player)
      getItems({ AlbumArtistIds: view.arg, IncludeItemTypes: 'Audio', Recursive: true, Limit: 200,
        SortBy: act === 'ashuffle' ? 'Random' : 'ProductionYear,Album,ParentIndexNumber,IndexNumber', SortOrder: act === 'ashuffle' ? 'Ascending' : 'Descending,Ascending,Ascending,Ascending' })
        .then(function (t) { playTracks(ids(t), 0); });
    }
  }
  var delArmed = null;
  // Radio (plan part 4): Jellyfin's Instant Mix - similar songs to an album, artist or song. Fetched
  // when the page opens: on the Samsung a song only starts inside the key press itself.
  var radioCache = {};
  function prefetchRadio(id) {
    if (!id || radioCache[id]) return radioCache[id];
    var c = radioCache[id] = {};
    c.p = ApiClient.getJSON(ApiClient.getUrl('/Items/' + id + '/InstantMix', { UserId: uid(), Limit: 50 }))
      .then(function (r) { c.ids = ((r && r.Items) || []).filter(function (x) { return x.Type === 'Audio'; }).map(function (x) { return x.Id; }); return c.ids; }, function () { delete radioCache[id]; return []; });
    return c;
  }
  function playRadio(id) {
    var c = prefetchRadio(id);
    var from = { k: 'RADIO', n: (view && view.data && view.data.item && view.data.item.Name) || '' };
    if (c && c.ids) { if (c.ids.length) playTracks(c.ids.slice(), 0, from); return; }
    if (c) c.p.then(function (l) { if (l.length) playTracks(l.slice(), 0, from); });
  }
  // Radio after the queue (user 2026-11-13: on): near the end of the last song, similar songs are
  // added to the queue so the music keeps going (once per song)
  var radioFor = null;
  function radioTail(s) {
    if (!s || !s.playing || !s.dur || s.id === radioFor || s.dur - s.pos > 20e7 || s.repeat !== 'RepeatNone') return;
    var m = pm(), p = m && m.getCurrentPlayer();
    if (!m || !p || !m.getPlaylist) return;
    radioFor = s.id;
    Promise.resolve(m.getPlaylist(p)).then(function (list) {
      list = list || [];
      if (m.getCurrentPlaylistIndex(p) < list.length - 1) return;   // more songs still to come
      var have = {}; list.forEach(function (x) { have[x.Id] = 1; });
      ApiClient.getJSON(ApiClient.getUrl('/Items/' + s.id + '/InstantMix', { UserId: uid(), Limit: 50 })).then(function (r) {
        var add = shuffle(((r && r.Items) || []).filter(function (x) { return x.Type === 'Audio' && !have[x.Id]; }).map(function (x) { return x.Id; })).slice(0, 25);
        if (add.length) {
          if (playFrom) add.forEach(function (i) { playFrom.ids[i] = 1; }); // (radio songs belong to the same source)
          m.queue({ ids: add, serverId: ApiClient.serverId() }, p);
        }
      });
    }, function () {});
  }
  function listPlaying() { var t = view && view.data && view.data.tracks; return !!(t && now.id && t.some(function (x) { return x.Id === now.id; })); }
  function playRow(el) {
    var tid = el.getAttribute('data-id');
    if (tid === now.id) { ctl('pp'); return; }
    var list = (view.data && view.data.tracks) || [];
    if (view.v === 'search') { playTracks([tid], 0); return; }
    var from = view.v === 'liked' ? { k: 'PLAYLIST', n: 'Liked Songs' } : view.v === 'playlist' && view.data.item ? { k: 'PLAYLIST', n: view.data.item.Name } : null;
    playTracks(ids(list), +el.getAttribute('data-i'), from);
  }
  function setFav(itemId, on, btn, track) {
    return ApiClient.ajax({ type: on ? 'POST' : 'DELETE', url: ApiClient.getUrl('/Users/' + uid() + '/FavoriteItems/' + itemId) }).then(function () {
      if (btn) {
        btn.classList.toggle('on', on);
        var ic = btn.querySelector('.material-icons'); if (ic) ic.textContent = on ? 'favorite' : 'favorite_border';
        btn.title = on ? 'Remove from favourites' : 'Add to favourites';
      }
      if (track && home) { home.liked = Math.max(0, home.liked + (on ? 1 : -1)); heroes.liked = likedHero(home.liked); }
      if (track) favOverride[itemId] = on;
    }, function () {});
  }
  var favOverride = {};
  // Jellyfin's TV layout scrolls the box around whatever gets the focus (scrollTo on it); our pages
  // do their own scrolling, so those calls are switched off on our scroll boxes
  function ownScroll(el) { if (el && !el._ivfOwn) { el._ivfOwn = true; el.scrollTo = el.scrollBy = function () {}; } }
  function markPlaying() {
    if (!page) return;
    Array.prototype.forEach.call(page.querySelectorAll('.strip'), ownScroll);
    // a freshly drawn page's picture moves to the fixed layer behind the page
    var hh = page.querySelector('.hart'); if (hh && artEl) { artEl.innerHTML = ''; artEl.appendChild(hh); }
    Array.prototype.forEach.call(page.querySelectorAll('.tr'), function (t) {
      var on = t.getAttribute('data-id') === now.id;
      t.classList.toggle('on', on); t.classList.toggle('paused', on && !now.playing);
    });
    Array.prototype.forEach.call(page.querySelectorAll('[data-k^="album:"]'), function (c) {
      var on = !!now.albumId && c.getAttribute('data-k') === 'album:' + now.albumId;
      c.classList.toggle('on', on); c.classList.toggle('paused', on && !now.playing); // (the card's bars stop while paused)
    });
    var pb = page.querySelector('.bt[data-act="play"]');
    if (pb) {
      var p = listPlaying() && now.playing;
      pb.querySelector('.material-icons').textContent = p ? 'pause' : 'play_arrow';
      pb.querySelector('span:last-child').textContent = p ? 'Pause' : 'Play';
    }
  }

  // ---- top bar + Now Playing -----------------------------------------------------------------------
  function topHtml() {
    return '<button type="button" class="fx mini off" data-top="now"><span class="c"></span><span class="tx"><div class="n"></div><div class="a"></div></span><span class="pp" data-top="pp">' + icon('play_arrow') + '</span></button>' +
      '<nav class="nav">' +
      '<button type="button" class="fx nv" data-nav="home">' + icon('home') + '<span>Home</span></button>' +
      '<button type="button" class="fx nv" data-nav="search">' + icon('search') + '<span>Search</span></button>' +
      '<button type="button" class="fx nv" data-nav="library">' + icon('library_music') + '<span>Your Library</span></button></nav>';
  }
  function npHtml() {
    function b(act, ic, cls, title) { return '<button type="button" class="fx ic' + (cls ? ' ' + cls : '') + '" data-np="' + act + '" title="' + title + '">' + icon(ic) + '</button>'; }
    return '<div class="npbg"><div class="tiny"></div><div class="bl b1"></div><div class="bl b2"></div>' + (TV ? '' : '<div class="bl b3"></div>') + '</div><div class="nps"><div class="npin">' +
      '<div class="npt"><span class="lg">' + icon('album') + '</span><div><div class="k">PLAYING FROM ALBUM</div><div class="al"></div></div></div>' +
      // the lyrics, in the space on the right (the Lyrics button turns them on / off)
      '<div class="npli"><div class="lli"></div></div>' +
      (TV ? '' : '<button type="button" class="fx npx" data-np="close" title="Close">' + icon('expand_more') + '</button>') +
      // (the artist name opens the artist's page, like the About the artist card)
      '<div class="npm"><span class="c"></span><div class="tx"><div class="n"></div><button type="button" class="fx a" data-np="about"></button></div></div>' +
      '<div class="npp"><button type="button" class="fx npbar" data-np="seek" title="Seek"><i><b></b></i><span class="bub"></span></button><div class="nptm"><span class="t0">-:--</span><span class="t1">-:--</span></div></div>' +
      '<div class="npc">' + b('fav', 'favorite_border', 'hf', 'Like') + '<div class="pill">' + b('shuffle', 'shuffle', '', 'Shuffle') + b('prev', 'skip_previous', '', 'Previous') +
      b('pp', 'play_arrow', 'big', 'Play') + b('next', 'skip_next', '', 'Next') + b('repeat', 'repeat', '', 'Repeat') + '</div>' +
      // web: volume (mute button + slider); the TVs use the remote's volume
      (TV ? '' : '<div class="npvol">' + b('mute', 'volume_up', 'vmb', 'Mute') + '<input class="vsl" type="range" min="0" max="100" step="1" value="100" title="Volume"></div>') +
      b('lyrics', 'mic', 'lyb', 'Lyrics') + '</div>' +
      // Up next: the coming songs (select one to play it; move it up/down or remove it)
      '<section class="npq" style="display:none"><h2>Up next</h2><div class="ql"></div></section>' +
      '<section class="npab"><h2>About the artist</h2><button type="button" class="fx abc" data-np="about"><div class="tx"><div class="an"></div><div class="ao"></div></div></button></section>' +
      '</div></div>' +
      // the screensaver
      '<div class="npss"><span class="c"></span><div class="tx"><div class="n"></div><div class="a"></div><i><b></b></i><div class="tm"></div></div></div>';
  }
  function openNow() {
    if (!shownState) return;
    if (!npOpen) histPush();
    var wasOpen = npOpen;
    // where the cover was: the album picture on the page (a song started there) or the mini player
    var from = !wasOpen && (npReturn ? artEl.querySelector('.hart.sq') : topEl.querySelector('.mini .c'));
    var fr = from && from.getBoundingClientRect();
    npOpen = true;
    np.classList.add('on');
    if (fr && fr.width > 0) flyCover(fr);
    lastAct = Date.now(); np.classList.remove("ss", "ly");
    loadQueue();
    moveJfHeader(0);   // Now Playing has its own scrolling: Jellyfin's bar is back at the top
    np.querySelector('.nps').scrollTop = 0;
    refresh();
    if (TV || document.activeElement === topEl.querySelector('.mini')) focusEl(np.querySelector('[data-np="pp"]'));
  }
  // Now Playing opening (plan part 1): its cover flies from [fr] into place - one transform, ~450 ms
  function flyCover(fr) {
    var c = np.querySelector('.npm .c'), to = c.getBoundingClientRect();
    if (!to.width) return;
    c.style.transition = 'none';
    c.style.transformOrigin = '0 0';
    c.style.transform = 'translate(' + (fr.left - to.left) + 'px,' + (fr.top - to.top) + 'px) scale(' + (fr.width / to.width) + ',' + (fr.height / to.height) + ')';
    void c.offsetWidth; // (start from there)
    requestAnimationFrame(function () {
      c.style.transition = 'transform .45s cubic-bezier(.2,.8,.2,1)';
      c.style.transform = '';
      setTimeout(function () { c.style.transition = ''; c.style.transformOrigin = ''; }, 500);
    });
  }
  // About the artist / the artist's name on Now Playing: close Now Playing and open the artist's page.
  // On the web Now Playing's history entry becomes the artist page's (no extra Back press needed).
  function openArtistFromNow() {
    var id = shownState && shownState.artistId;
    if (!id) return;
    npOpen = false; np.classList.remove('on'); npReturn = null;
    go({ v: 'artist', arg: id }, 'nohist');
  }
  function closeNow() {
    npOpen = false;
    np.classList.remove('on');
    np.classList.remove("ss", "ly");
    document.documentElement.classList.remove("ivf-mu-ss");
    moveJfHeader(page.scrollTop);
    var m = topEl.querySelector('.mini'), r = npReturn;
    npReturn = null;
    // opened by starting a song: back to that song's row (or the button that started it)
    if (r && page.contains(r)) { if (TV) focusEl(r); return; }
    if (TV) { if (!m.classList.contains('off')) focusEl(m); else focusDefault(); }
  }
  var artists = {};
  function aboutArtist(id) {
    if (!id) return Promise.resolve(null);
    if (artists[id]) return artists[id];
    return (artists[id] = ApiClient.getItem(uid(), id).then(null, function () { return null; }));
  }
  var albumYears = {};
  function albumYear(id) {
    if (!id) return Promise.resolve(0);
    if (albumYears[id]) return albumYears[id];
    return (albumYears[id] = ApiClient.getItem(uid(), id).then(function (a) { return (a && a.ProductionYear) || 0; }, function () { return 0; }));
  }
  // Now Playing shows the artist as they looked when the album came out. The artist's backdrops are
  // dated in ProviderIds.IvfEras: "year:backdropIndex,..." (each picture is used from that year until
  // the next one) - set by jellyfin-web-custom/backup/artist-eras.ps1. No dates: the first backdrop.
  function eraArt(a, year, w) {
    var eras = ((a.ProviderIds && a.ProviderIds.IvfEras) || '').split(',').map(function (x) { var p = x.split(':'); return { y: +p[0], i: +p[1] }; })
      .filter(function (e) { return e.y && a.BackdropImageTags && e.i < a.BackdropImageTags.length; }).sort(function (x, y) { return x.y - y.y; });
    if (!eras.length || !year) return artistArt(a, w);
    var pick = eras[0];
    eras.forEach(function (e) { if (e.y <= year) pick = e; });
    return imgUrl(a.Id, 'Backdrop/' + pick.i, { maxWidth: w, tag: a.BackdropImageTags[pick.i] });
  }
  // Only touch the page when something really changed (writing the same values twice a second
  // made the Samsung TV redo layout all the time)
  var shown = {}, shownState = null, seeking = false;
  function put(key, v, fn) { if (shown[key] === v) return; shown[key] = v; fn(v); }
  function refresh() {
    if (!root || !isOpen) return;
    var s = playState(), mini = topEl.querySelector('.mini');
    shownState = s;
    var fav = s ? (favOverride[s.id] !== undefined ? favOverride[s.id] : s.fav) : false;
    put('on', !!s, function (v) {
      mini.classList.toggle('off', !v);
      // between two songs (Next, an Up next row) there is briefly no song at all: close only when the
      // music has really stopped (round-5 beta: Next closed Now Playing)
      if (!v && npOpen) setTimeout(function () { if (npOpen && !playState()) closeNow(); }, 1500);
      if (!v && TV && document.activeElement === mini) focusEl(topEl.querySelector('.nv.on') || topEl.querySelector('.nv'));
    });
    put('img', s ? s.img : '', function (v) {
      mini.querySelector('.c').style.backgroundImage = v ? 'url("' + v + '")' : '';
      mini.style.removeProperty('--mc');
      if (v) coverColour(v, function (c) { if (c && shown.img === v) mini.style.setProperty('--mc', c); });
    });
    put('n', s ? s.name : '', function (v) { mini.querySelector('.n').textContent = v; np.querySelector('.npm .n').textContent = v; });
    put('a', s ? s.artist : '', function (v) { mini.querySelector('.a').textContent = v; np.querySelector('.npm .a').textContent = v; });
    put('pp', !!(s && s.playing), function (v) {
      mini.querySelector('.pp .material-icons').textContent = v ? 'pause' : 'play_arrow';
      var b = np.querySelector('[data-np="pp"]'); b.querySelector('.material-icons').textContent = v ? 'pause' : 'play_arrow'; b.title = v ? 'Pause' : 'Play';
    });
    if (npOpen || shown.npInit !== true) {
      shown.npInit = true;
      put('big', s ? s.big : '', function (v) { np.querySelector('.npm .c').style.backgroundImage = v ? 'url("' + v + '")' : ''; });
      var pf = s && playFrom && playFrom.ids[s.id] ? playFrom : null, known = !!(pf && pf.k);
      put('alk', known ? 'PLAYING FROM ' + pf.k : pf || !playFrom ? 'PLAYING FROM ALBUM' : 'NOW PLAYING', function (v) { np.querySelector('.npt .k').textContent = v; });
      put('al', known ? pf.n : s ? (s.album || s.name) : '', function (v) { np.querySelector('.npt .al').textContent = v; });
      if (!scrub) put('t0', s ? s.t0 : '-:--', function (v) { np.querySelector('.t0').textContent = v; });
      put('t1', s ? s.t1 : '-:--', function (v) { np.querySelector('.t1').textContent = v; });
      if (!seeking) put('pct', s ? Math.round(s.pct * 10) / 10 : 0, function (v) { np.querySelector('.npbar b').style.width = v + '%'; });
      put('sh', !!(s && s.shuffle), function (v) { np.querySelector('[data-np="shuffle"]').classList.toggle('act', v); });
      put('rp', s ? s.repeat : 'RepeatNone', function (v) {
        var b = np.querySelector('[data-np="repeat"]');
        b.classList.toggle('act', v !== 'RepeatNone');
        b.querySelector('.material-icons').textContent = v === 'RepeatOne' ? 'repeat_one' : 'repeat';
      });
      put('fav', fav, function (v) { var b = np.querySelector('[data-np="fav"]'); b.classList.toggle('on', v); b.querySelector('.material-icons').textContent = v ? 'favorite' : 'favorite_border'; b.title = v ? 'Remove from favourites' : 'Add to favourites'; });
      // the moving background: a tiny copy of the cover + colour blobs from the cover's colours
      put('npal', s ? s.albumId || '' : '', function (aid) {
        np.querySelector('.npbg .tiny').style.backgroundImage = aid ? 'url("' + imgUrl(aid, 'Primary', { maxWidth: 64 }) + '")' : (s && s.img ? 'url("' + s.img + '")' : '');
        palette(aid ? imgUrl(aid, 'Primary', { maxWidth: 96 }) : '', function (pal) {
          if (shown.npal !== aid) return;
          var edge = pal.edge === '#000' || pal.edge === BG ? '#1a1a1a' : pal.edge;
          np.style.setProperty('--npe', edge); np.style.setProperty('--npe2', edge);
          np.style.setProperty('--npa', pal.acc || '#fa586a'); np.style.setProperty('--npw2', pal.wash || '#3c3c3c');
        });
      });
      // the screensaver's copy of the song
      put('ssn', s ? s.id + '|' + s.big : '', function () {
        var ss = np.querySelector('.npss');
        ss.querySelector('.c').style.backgroundImage = s && s.big ? 'url("' + s.big + '")' : '';
        ss.querySelector('.n').textContent = s ? s.name : ''; ss.querySelector('.a').textContent = s ? s.artist : '';
      });
      if (np.classList.contains('ss')) {
        put('sst', s ? s.t0 + ' / ' + s.t1 : '', function (v) { np.querySelector('.npss .tm').textContent = v; });
        put('ssp', s ? Math.round(s.pct) : 0, function (v) { np.querySelector('.npss i b').style.width = v + '%'; });
      }
      // Up next: drawn again when the song changes (or after a change to the queue)
      put('q', s ? s.id + '|' + s.shuffle : '', function () { loadQueue(); });
      if (np.classList.contains('lyi') && s) lyricsAt(s.pos);
      // web: the volume slider follows the player (also when changed elsewhere)
      if (!TV) put('vol', playerVolume(), function (vs) { var v = JSON.parse(vs), sl = np.querySelector('.vsl'), mb = np.querySelector('[data-np="mute"] .material-icons'); if (!sl) return; if (document.activeElement !== sl) sl.value = v.muted ? 0 : v.level; mb.textContent = v.muted || !v.level ? 'volume_off' : v.level < 50 ? 'volume_down' : 'volume_up'; });
      put('artist', s ? (s.artistId || '') + '|' + (s.albumId || '') : '', function (key) {
        var id = key.split('|')[0], aid = key.split('|')[1];
        var abc = np.querySelector('.abc');
        // (the background is the moving colour blur now - user 2026-11-13; the artist's photo stays on the About card)
        if (id !== shown.npArtistId || !id) {
          shown.npArtistId = id;
          abc.style.backgroundImage = ''; abc.querySelector('.an').textContent = s ? s.artist : ''; abc.querySelector('.ao').textContent = '';
        }
        Promise.all([aboutArtist(id), albumYear(aid)]).then(function (r) {
          var a = r[0];
          if (!a || shown.artist !== key) return;
          // the artist as they looked when this album came out (dated photos), else their main photo
          var dated = !!(a.ProviderIds && a.ProviderIds.IvfEras) && !!r[1];
          var pic = dated ? eraArt(a, r[1], 900) : a.ImageTags && a.ImageTags.Primary ? imgUrl(a.Id, 'Primary', { maxWidth: 900, tag: a.ImageTags.Primary }) : eraArt(a, r[1], 900);
          if (pic) abc.style.backgroundImage = 'url("' + pic + '")';
          abc.querySelector('.an').textContent = a.Name;
          abc.querySelector('.ao').textContent = a.Overview || '';
        });
      });
    }
    setNow(s ? s.id : null, !!(s && s.playing), s ? s.albumId : null);
    radioTail(s);
  }
  var lastNowId = null;
  function setNow(id, playing, albumId) {
    var changed = id !== now.id || playing !== now.playing;
    now.id = id; now.playing = playing;
    if (id && id !== lastNowId) {
      lastNowId = id; changed = true;
      if (albumId !== undefined) now.albumId = albumId;
      else ApiClient.getItem(uid(), id).then(function (it) { if (now.id === id) { now.albumId = it.AlbumId || null; markPlaying(); } }, function () {});
    }
    if (!id && lastNowId) { now.albumId = null; lastNowId = null; changed = true; }
    if (changed) markPlaying();
  }
  function onNpClick(e) {
    var b = e.target.closest('[data-np]'); if (!b) return;
    var a = b.getAttribute('data-np');
    if (a === 'close') { stepBack(); return; }
    if (a === 'about') { openArtistFromNow(); return; }
    if (a === 'lyrics') { openLyrics(); return; }
    if (a === 'mute') { var vm = pm(), vp = vm && vm.getCurrentPlayer(); if (vm && vp) { try { vm.toggleMute(vp); } catch (er) {} setTimeout(refresh, 100); } return; }
    if (a === 'lypp') { ctl('pp'); return; }
    if (a === 'qplay' || a === 'qup' || a === 'qdn' || a === 'qrm') { queueAct(a, b.getAttribute('data-q')); return; }
    if (a === 'fav') { var s = shownState; if (s) setFav(s.id, !b.classList.contains('on'), null, true).then(refresh); return; }
    if (a === 'seek') {
      if (!e.clientX) return;   // OK on the remote: Left/Right seek instead
      var r = b.getBoundingClientRect(), pct = Math.max(0, Math.min(100, (e.clientX - r.left) / r.width * 100));
      seeking = true; setTimeout(function () { seeking = false; }, 700);
      b.querySelector('b').style.width = pct + '%';
      ctl('seek', pct); return;
    }
    ctl(a);
  }

  // ---- Now Playing extras (plan part 2; 2026-11-13) ---------------------------------------------------
  // Web volume (user 2026-11-13: "no volume slider"): Jellyfin's player volume 0-100 and mute
  function playerVolume() {
    var m = pm(), p = m && m.getCurrentPlayer();
    if (!m || !p) return '{"level":100,"muted":false}';
    try { return JSON.stringify({ level: Math.round(m.getVolume(p)), muted: !!m.isMuted(p) }); } catch (e) { return '{"level":100,"muted":false}'; }
  }
  function setVolume(v) {
    var m = pm(), p = m && m.getCurrentPlayer();
    if (!m || !p) return;
    try { if (m.isMuted(p) && v > 0) m.setMute(false, p); m.setVolume(v, p); } catch (e) {}
    var mb = np.querySelector('[data-np="mute"] .material-icons');
    if (mb) mb.textContent = !v ? 'volume_off' : v < 50 ? 'volume_down' : 'volume_up';
  }
  // Up next: Jellyfin's play queue after the song that's playing (in play order, so shuffle shows)
  var queueList = [];
  function loadQueue(tries) {
    tries = tries || 0;
    var m = pm(), p = m && m.getCurrentPlayer(), sec = np && np.querySelector('.npq');
    if (!sec) return;
    // (a song just started: the player may not have its queue yet - ask again a moment later)
    var again = function () { if (tries < 4) setTimeout(function () { loadQueue(tries + 1); }, 1000); };
    if (!m || !p || !m.getPlaylist) { sec.style.display = 'none'; again(); return; }
    Promise.resolve(m.getPlaylist(p)).then(function (list) {
      queueList = list || [];
      var i = m.getCurrentPlaylistIndex(p), next = queueList.slice(i + 1, i + 21), shuf = shownState && shownState.shuffle;
      if (!queueList.length || i < 0) again();
      // the player's position can lag behind the song shown (Up next kept the new song on top - round-5 beta)
      else if (shownState && queueList[i] && queueList[i].Id !== shownState.id && tries < 4) { setTimeout(function () { loadQueue(tries + 1); }, 500); }
      var hadFocus = sec.contains(document.activeElement) ? document.activeElement.getAttribute('data-q') : null;
      sec.style.display = next.length ? '' : 'none';
      sec.querySelector('.ql').innerHTML = next.map(function (x, k) {
        var q = esc(x.PlaylistItemId), who = esc((x.Artists || []).join(', ') || x.AlbumArtist || '');
        function qb(act, ic, t) { return '<button type="button" class="fx qb" data-np="' + act + '" data-q="' + q + '" title="' + t + '">' + icon(ic) + '</button>'; }
        return '<div class="qr"><button type="button" class="fx qm" data-np="qplay" data-q="' + q + '"><span class="qx"><div class="qt">' + esc(x.Name) + '</div><div class="qa">' + who + '</div></span>' +
          '<span class="qd">' + (x.RunTimeTicks ? mmss(x.RunTimeTicks) : '') + '</span></button>' +
          // (an empty space where a row has no Move up / Move down, so every row's time lines up)
          (!shuf && k > 0 ? qb('qup', 'arrow_upward', 'Move up') : '<span class="qb"></span>') +
          (!shuf && k < next.length - 1 ? qb('qdn', 'arrow_downward', 'Move down') : '<span class="qb"></span>') + qb('qrm', 'close', 'Remove') + '</div>';
      }).join('');
      if (hadFocus) { var f = sec.querySelector('.qm[data-q="' + hadFocus + '"]') || sec.querySelector('.qm'); if (f) focusEl(f); else focusEl(np.querySelector('[data-np="pp"]')); }
    }, function () { sec.style.display = 'none'; });
  }
  function queueAct(a, q) {
    var m = pm(), p = m && m.getCurrentPlayer();
    if (!m || !p || !q) return;
    try {
      if (a === 'qplay') m.setCurrentPlaylistItem(q, p);
      else if (a === 'qrm') m.removeFromPlaylist([q], p);
      else {
        var i = -1; queueList.forEach(function (x, k) { if (x.PlaylistItemId === q) i = k; });
        if (i >= 0) m.movePlaylistItem(q, a === 'qup' ? i - 1 : i + 1, p);
      }
    } catch (e) {}
    setTimeout(function () { loadQueue(); refresh(); }, 300);
  }
  // Lyrics: from the server (the LrcLib plugin fetches them); synced ones follow the song
  // (user 2026-11-13: on the song screen itself, in the empty space on the right - not a new screen.
  // The Lyrics button turns them on/off; they stay on for the next songs.)
  var lyr = { id: null, lines: [], synced: false, cur: -2 };
  function openLyrics() {
    if (np.classList.contains('lyi')) { np.classList.remove('lyi'); np.querySelector('[data-np="lyrics"]').classList.remove('act'); return; }
    np.classList.add('lyi');
    np.querySelector('[data-np="lyrics"]').classList.add('act');
    loadLyrics();
  }
  function loadLyrics() {
    var s = shownState; if (!s) return;
    var box = np.querySelector('.lli');
    if (lyr.id !== s.id) {
      lyr = { id: s.id, lines: [], synced: false, cur: -2 };
      box.innerHTML = ''; box.style.transform = '';
      ApiClient.getJSON(ApiClient.getUrl('/Audio/' + s.id + '/Lyrics')).then(function (r) {
        if (lyr.id !== s.id) return;
        lyr.lines = (r && r.Lyrics) || [];
        lyr.offset = (r && r.Metadata && r.Metadata.Offset) || 0;
        lyr.synced = lyr.lines.some(function (l) { return l.Start != null; });
        drawLyrics();
      }, function () { if (lyr.id === s.id) drawLyrics(); });
    }
  }
  function drawLyrics() {
    var box = np.querySelector('.lli');
    box.innerHTML = lyr.lines.length
      ? lyr.lines.map(function (l, i) { return '<p class="lnn' + (lyr.synced ? '' : ' on') + '" data-i="' + i + '">' + (esc(l.Text) || '♪') + '</p>'; }).join('')
      : '<div class="none">No lyrics for this song</div>';
    lyr.cur = -2;
    if (shownState) lyricsAt(shownState.pos);
  }
  function lyricsAt(pos) {
    if (shownState && shownState.id !== lyr.id) { loadLyrics(); return; } // next song: its lyrics
    var box = np.querySelector('.lli'), panel = np.querySelector('.npli');
    if (!lyr.synced) {
      // plain lyrics: they move down slowly with the song
      var s = shownState, over = box.offsetHeight - panel.offsetHeight;
      if (s && s.dur && over > 0) box.style.transform = 'translateY(' + (-Math.round(over * Math.min(1, s.pos / s.dur))) + 'px)';
      return;
    }
    var t = (pos || 0) + (lyr.offset || 0), cur = -1;
    lyr.lines.forEach(function (l, i) { if (l.Start != null && l.Start <= t) cur = i; });
    if (cur === lyr.cur) return;
    lyr.cur = cur;
    var ps = np.querySelectorAll('.lli .lnn');
    Array.prototype.forEach.call(ps, function (p, i) { p.classList.toggle('on', i === cur); p.classList.toggle('past', i < cur); });
    // the line being sung sits about a third of the way down the panel
    var target = ps[Math.max(0, cur)];
    var y = target ? target.offsetTop - panel.offsetHeight * 0.33 : 0;
    box.style.transform = 'translateY(' + (-Math.max(0, Math.round(y))) + 'px)';
  }
  function lyricsScroll(dir) { // plain (unsynced) lyrics: Up/Down move them
    var box = np.querySelector('.lli'), m = /translateY\((-?[\d.]+)px\)/.exec(box.style.transform), y = m ? +m[1] : 0;
    y = Math.min(0, y - dir * px(80));
    box.style.transform = 'translateY(' + y + 'px)';
  }
  function closeLyrics() { np.classList.remove('ly'); focusEl(np.querySelector('[data-np="lyrics"]')); }
  // Hold Left/Right on the progress bar: skips faster the longer it's held; the song moves when you let go
  var scrub = null, scrubT = null;
  function scrubKey(dir) {
    var s = playState(); if (!s || !s.dur) return;
    var t = Date.now();
    if (!scrub || t - scrub.last > 600) scrub = { to: s.pos, n: 0 };
    scrub.n++;
    var step = scrub.n === 1 ? 10 : scrub.n < 10 ? 5 : scrub.n < 25 ? 10 : 20;
    scrub.to = Math.max(0, Math.min(s.dur - 5e6, scrub.to + (dir === 'r' ? 1 : -1) * step * 1e7));
    scrub.last = t;
    var bar = np.querySelector('.npbar'), pct = scrub.to / s.dur * 100, bub = bar.querySelector('.bub');
    seeking = true; bar.classList.add('scr');
    bar.querySelector('b').style.width = pct + '%'; bub.style.left = pct + '%'; bub.textContent = mmss(scrub.to);
    np.querySelector('.t0').textContent = mmss(scrub.to);
    clearTimeout(scrubT); scrubT = setTimeout(scrubDone, 500);
  }
  function scrubDone() {
    clearTimeout(scrubT);
    if (!scrub) return;
    var s = playState(), to = scrub.to;
    scrub = null;
    // the time bubble stays a moment after the last press, so you can read where you landed (round 5)
    var bar = np.querySelector('.npbar'); clearTimeout(bar._scrT); bar._scrT = setTimeout(function () { if (!scrub) bar.classList.remove('scr'); }, 1200);
    if (s && s.dur) ctl('seek', to / s.dur * 100);
    shown.t0 = null; shown.pct = null;
    setTimeout(function () { seeking = false; }, 700);
  }
  // The screensaver: 60 s without a key press (or the mouse) on Now Playing; the first key only wakes it
  var lastAct = Date.now();
  function wake() { lastAct = Date.now(); document.documentElement.classList.remove('ivf-mu-ss'); if (np && np.classList.contains('ss')) { np.classList.remove('ss'); return true; } return false; }
  window.addEventListener('keydown', function (e) {
    if (!isOpen || !npOpen) return;
    if (wake()) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
  }, true);
  window.addEventListener('keyup', function (e) {
    var k = e.key || '', kc = e.keyCode;
    if (scrub && (k === 'ArrowLeft' || k === 'ArrowRight' || kc === 37 || kc === 39)) scrubDone();
  }, true);
  ['mousemove', 'mousedown', 'wheel', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, function () { if (npOpen) wake(); }, { passive: true, capture: true }); });
  setInterval(function () {
    if (!isOpen || !npOpen || !np || np.classList.contains('ss') || document.hidden) return;
    if (Date.now() - lastAct > 60000) { np.classList.add('ss'); document.documentElement.classList.add('ivf-mu-ss'); refresh(); }
  }, 1000);

  // ---- open / close --------------------------------------------------------------------------------
  function ensureRoot() {
    addStyle();
    if (root) return;
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'ivf-off';
    root.innerHTML = '<div class="art"></div><div class="page"></div><div class="top"></div><div class="np"></div>';
    artEl = root.querySelector('.art'); page = root.querySelector('.page'); topEl = root.querySelector('.top'); np = root.querySelector('.np');
    topEl.innerHTML = topHtml(); np.innerHTML = npHtml();
    ownScroll(page); ownScroll(np.querySelector('.nps'));
    document.body.appendChild(root);
    topEl.addEventListener('click', function (e) {
      if (e.target.closest('[data-top="pp"]') && !TV) { e.stopPropagation(); ctl('pp'); return; }
      if (e.target.closest('[data-top="now"]')) { openNow(); return; }
      var n = e.target.closest('[data-nav]'); if (!n) return;
      var to = n.getAttribute('data-nav');
      stack = [];
      if (to === 'home') go({ v: 'home' });
      else go({ v: to }, false);
      if (to !== 'home') stack = [{ v: 'home' }];
    });
    page.addEventListener('click', onPageClick);
    np.addEventListener('click', onNpClick);
    // web: dragging the volume slider
    np.addEventListener('input', function (e) { if (e.target.classList && e.target.classList.contains('vsl')) setVolume(+e.target.value); });
    page.addEventListener('scroll', function () {
      // all clients: the tabs and the picture stay where they are on the page and scroll away with it
      // (TV: selecting a tab scrolls the page back to the top - see reveal())
      var t = 'translateY(' + (-page.scrollTop) + 'px)'; topEl.style.transform = t; artEl.style.transform = t;
      moveJfHeader(page.scrollTop);
    }, { passive: true });
    // the hero follows the selected (remote) or pointed-at (mouse) card on Home
    page.addEventListener('focusin', function (e) { var k = e.target.getAttribute && e.target.getAttribute('data-k'); if (k) heroSoon(k); });
    if (!TV) page.addEventListener('mouseover', function (e) { var c = e.target.closest && e.target.closest('[data-k]'); if (c) heroSoon(c.getAttribute('data-k')); });
  }
  function measure() {
    if (!root || TV) return;
    var top = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      if (!h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      top = Math.max(top, Math.round(h.getBoundingClientRect().bottom));
    });
    root.style.setProperty('--ivf-mu-hd', top + 'px');
  }
  window.addEventListener('resize', measure);
  var barTimer = null, homeHash = null;
  function open(albumId) {
    ensureRoot();
    var first = !isOpen;
    isOpen = true;
    root.classList.remove('ivf-off');
    document.documentElement.classList.add('ivf-music-on');
    measure(); setTimeout(measure, 300);
    if (!barTimer) barTimer = setInterval(refresh, TV ? 1000 : 500);
    shown = {}; refresh();
    if (home) pickShortcuts();
    var ready = home ? Promise.resolve() : loadHome();
    ready.then(function () {
      // a reload: back to the Music page you were on
      var saved = first ? readState() : null;
      if (saved && saved.view && saved.hash === location.hash) {
        homeHash = saved.homeHash || null; lastHash = location.hash;
        stack = saved.stack || [];
        go(saved.view);
      } else if (albumId) { stack = [{ v: 'home' }]; go({ v: 'album', arg: albumId }); }
      else if (first || !view) { stack = []; heroKey = null; go({ v: 'home' }); }
      // Jellyfin's Music library page doesn't load the list element the fallback player and the
      // "..." menus are driven through; an album's page does. Swap the address to an album
      // (replace: Back still goes Home) and remember it, so Music stays on its Home.
      var r = route(), any = home.recent[0] || home.all[0];
      if (!albumId && r && r.lib !== undefined && any) {
        known[any.Id] = 1;
        homeHash = '#/details?id=' + any.Id + '&serverId=' + ApiClient.serverId();
        lastHash = homeHash;
        location.replace(homeHash);
        saveState();
      }
      // Jellyfin's own (hidden) page underneath may grab the focus as it appears: take it back
      if (TV && first) [60, 400, 900, 1600].forEach(function (ms) {
        setTimeout(function () { if (isOpen && !root.contains(document.activeElement) && !document.querySelector('.dialogContainer .dialog')) focusDefault(); }, ms);
      });
    });
  }
  // Web: Jellyfin's own top bar (back / home / menu ... user) scrolls away with the Music page too
  function moveJfHeader(y) {
    if (TV) return;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      h.style.transform = y ? 'translateY(' + (-y) + 'px)' : '';
    });
  }
  function close() {
    if (!isOpen) return;
    muDepth = 0; // entries left behind are dead (same address)
    moveJfHeader(0);
    isOpen = false;
    stopMusic();   // Music only plays while you're in Music
    if (npOpen) { npOpen = false; np.classList.remove('on'); }
    root.classList.add('ivf-off');
    document.documentElement.classList.remove('ivf-music-on', 'ivf-mu-ss');
    if (barTimer) clearInterval(barTimer); barTimer = null;
    view = null; stack = []; home = null; heroKey = null;   // fresh Recently played next time
    clearState();
  }

  // ---- routes --------------------------------------------------------------------------------------
  var KEY = 'ivf-album-ids', known = {};
  try { known = JSON.parse(store(KEY) || '{}') || {}; } catch (e) {}
  function remember(id) { if (known[id]) return; known[id] = 1; store(KEY, JSON.stringify(known)); }
  function route() {
    var h = location.hash || '';
    var m = /^#\/music\?(?:.*&)?topParentId=([0-9a-f]{32})/i.exec(h);
    if (m) return { lib: m[1].toLowerCase() };
    if (/^#\/music(\?|$)/.test(h)) return { lib: null };
    m = /^#\/details\?(?:.*&)?id=([0-9a-f]{32})/i.exec(h);
    if (m) return { details: m[1].toLowerCase() };
    return null;
  }
  var token = 0, lastHash = '';
  function check() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    var r = route();
    if (!r) { lastHash = ''; homeHash = null; close(); return; }
    // the same address again (Jellyfin's viewshow after a hashchange), or the album address Music
    // swapped itself to: stay where we are
    if (isOpen && (location.hash === lastHash || location.hash === homeHash)) return;
    var prevHash = lastHash;
    lastHash = location.hash;
    var t = ++token;
    if (r.lib !== undefined) {
      if (r.lib && r.lib !== lib.id) { lib.id = r.lib; home = null; store('ivf-music-lib', r.lib); }
      open(null); return;
    }
    var id = r.details;
    if (known[id]) open(id);
    ApiClient.getItem(uid(), id).then(function (item) {
      if (t !== token) return;
      if (item && item.Type === 'MusicAlbum') { if (!known[id]) { remember(id); open(id); } }
      else if (item && item.Type === 'MusicArtist' && isOpen && prevHash) {
        // Jellyfin's "..." menu > View album artist inside Music: show Music's own artist page, not
        // Jellyfin's (Music used to close, losing the mini player). Keep the address Music was on;
        // the entry Jellyfin added becomes this artist page's history step.
        lastHash = prevHash;
        try { history.replaceState(history.state, '', prevHash); } catch (e) {}
        if (!TV) muDepth++;
        go({ v: 'artist', arg: id }, 'nohist');
      }
      else { delete known[id]; close(); }
    }, function () { if (t === token) close(); });
  }

  // ---- remote (Samsung): move to the nearest item in the arrow's direction --------------------------
  function visible(el) { return el.offsetParent !== null || el.getClientRects().length > 0; }
  function candidates() {
    var scope = npOpen ? np : root;
    return Array.prototype.filter.call(scope.querySelectorAll('.fx'), function (el) {
      if (!npOpen && np.contains(el)) return false;
      if (el.classList.contains('off')) return false;
      // a song's ... button is reached only from its own row (Right), never by Up/Down
      if (el.classList.contains('tmore') && document.activeElement !== el) return false;
      // Up next's move/remove buttons: only from their own row (they're hidden until it's selected)
      if (el.classList.contains('qb') && !el.closest('.qr').contains(document.activeElement)) return false;
      return visible(el);
    });
  }
  function focusDefault() {
    if (!root) return;
    if (npOpen) { focusEl(np.querySelector('[data-np="pp"]')); return; }
    var el = page.querySelector('.sc, .bt, .sbox input, .chip.on, .cd, .tr') || topEl.querySelector('.nv.on');
    if (el) focusEl(el);
  }
  function focusEl(el, keepScroll) {
    if (!el) return;
    el.focus({ preventScroll: true });
    if (!keepScroll) reveal(el);
  }
  function reveal(el) {
    var strip = el.closest('.strip');
    if (strip) {
      var sr = strip.getBoundingClientRect(), er = el.getBoundingClientRect(), pad = px(40);
      if (er.left < sr.left + pad) strip.scrollLeft -= (sr.left + pad - er.left);
      else if (er.right > sr.right - pad) strip.scrollLeft += (er.right - sr.right + pad);
    }
    // a tab in the top bar (which scrolls away with the page): back to the top of the page
    if (!npOpen && topEl.contains(el)) { page.scrollTop = 0; return; }
    var box = npOpen ? np.querySelector('.nps') : page.contains(el) ? page : null;
    if (!box) return;
    if (npOpen) { if (el.closest('.npq')) { var qb2 = box.getBoundingClientRect(), qr2 = el.getBoundingClientRect(); if (qr2.bottom > qb2.bottom - px(24)) box.scrollTop += qr2.bottom - qb2.bottom + px(24); else if (qr2.top < qb2.top + px(96)) box.scrollTop -= qb2.top + px(96) - qr2.top; return; } box.scrollTop = el.classList.contains('abc') ? box.scrollHeight : 0; return; }
    // the hero, its buttons and Home's shortcut cards: the page's top stays in view
    if (el.closest('.sg') || el.closest('.acts') || el.closest('.lt') || el.closest('.sbox')) { page.scrollTop = 0; return; }
    var unit = el.closest('.row') && el.closest('.strip') ? el.closest('.row') : el;
    var b = box.getBoundingClientRect(), r = unit.getBoundingClientRect(), topPad = px(96), botPad = px(24);
    if (r.bottom > b.bottom - botPad) box.scrollTop += r.bottom - b.bottom + botPad;
    else if (r.top < b.top + topPad) box.scrollTop -= b.top + topPad - r.top;
  }
  function move(dir) {
    var a = document.activeElement, list = candidates();
    if (!a || list.indexOf(a) < 0) { focusDefault(); return; }
    var ar = a.getBoundingClientRect(), acx = (ar.left + ar.right) / 2, acy = (ar.top + ar.bottom) / 2, tol = 2;
    var inTop = topEl.contains(a), best = null;
    var opts = [];
    list.forEach(function (c) {
      if (c === a) return;
      var r = c.getBoundingClientRect(), cx = (r.left + r.right) / 2, cy = (r.top + r.bottom) / 2, gap, side;
      if (dir === 'r') { if (r.left < ar.right - tol) return; if (r.bottom <= ar.top || r.top >= ar.bottom) return; gap = r.left - ar.right; side = Math.abs(cy - acy); }
      else if (dir === 'l') { if (r.right > ar.left + tol) return; if (r.bottom <= ar.top || r.top >= ar.bottom) return; gap = ar.left - r.right; side = Math.abs(cy - acy); }
      else if (dir === 'd') { if (r.top < ar.bottom - tol) return; gap = r.top - ar.bottom; side = Math.abs(cx - acx); if (r.right < 0 || r.left > window.innerWidth) side += 1e5; }
      else { if (r.bottom > ar.top + tol) return; gap = ar.top - r.bottom; side = Math.abs(cx - acx); if (r.right < 0 || r.left > window.innerWidth) side += 1e5; }
      // to/from a full-width track row, line up left edges (Up from a song goes to Play, not "...")
      if ((dir === 'u' || dir === 'd') && (ar.width > window.innerWidth * 0.4 || r.width > window.innerWidth * 0.4)) side = Math.abs(r.left - ar.left) + (side >= 1e5 ? 1e5 : 0);
      opts.push({ el: c, gap: Math.max(0, gap), side: side });
    });
    if (!opts.length) return;
    // nearest row (or column) first, then the closest item in it
    var minGap = Math.min.apply(null, opts.map(function (o) { return o.gap; }));
    opts.filter(function (o) { return o.gap <= minGap + px(12); }).forEach(function (o) { if (!best || o.side < best.side) best = o; });
    var to = best.el;
    // into the top bar from the page: the page's own tab; out of the top bar: back where we were
    if (dir === 'u' && !inTop && topEl.contains(to) && !to.classList.contains('mini')) to = topEl.querySelector('.nv.on') || to;
    // up into the Library tabs (Albums / Artists / Playlists): the selected tab, not the nearest one
    // (round-5 beta: from an artist card Up went to Albums, so the next Right only got back to Artists)
    if (dir === 'u' && to.classList.contains('chip') && !to.classList.contains('sort') && !a.classList.contains('chip') && to.parentNode) { var on = to.parentNode.querySelector('.chip.on'); if (on && visible(on)) to = on; }
    if (dir === 'd' && inTop && lastPageFocus && page.contains(lastPageFocus) && visible(lastPageFocus)) {
      var lr = lastPageFocus.getBoundingClientRect();
      if (lr.bottom > 0 && lr.top < window.innerHeight) to = lastPageFocus;
    }
    focusEl(to);
  }
  var lastPageFocus = null;
  document.addEventListener('focusin', function (e) { if (page && page.contains(e.target)) lastPageFocus = e.target; }, true);
  window.addEventListener('keydown', function (e) {
    if (!isOpen) return;
    if (document.querySelector('.dialogContainer .dialog')) return; // Jellyfin's menu has the keys
    var k = e.key || '', kc = e.keyCode, a = document.activeElement;
    var typing = a && a.tagName === 'INPUT';
    function stop() { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); }
    var back2 = k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || (kc === 10009 || kc === 461) || kc === 27 || (TV && (k === 'Backspace' || kc === 8) && !typing);
    if (back2) {
      if (typing && !TV) return;
      if (closeSortMenu(true)) { stop(); return; }
      if (stepBack()) stop();
      return;
    }
    // the Sort by list: Up/Down move through it (Left/Right stay put)
    if (sortMenu && a && sortMenu.contains(a)) {
      var sd = k === 'ArrowUp' || kc === 38 ? -1 : k === 'ArrowDown' || kc === 40 ? 1 : k === 'ArrowLeft' || kc === 37 || k === 'ArrowRight' || kc === 39 ? 0 : null;
      if (sd !== null) {
        stop();
        var opts = Array.prototype.slice.call(sortMenu.querySelectorAll('.so')), oi = opts.indexOf(a) + sd;
        if (oi >= 0 && oi < opts.length) opts[oi].focus({ preventScroll: true });
        return;
      }
    }
    if (!TV) return;
    if ((k === 'Enter' || kc === 13) && a && a.classList && a.classList.contains('tr')) { stop(); playRow(a); return; }
    if ((k === 'Enter' || kc === 13) && a && a.classList && a.classList.contains('mini')) { stop(); openNow(); return; }
    if ((k === 'Enter' || kc === 13) && a && a.tagName === 'BUTTON' && root.contains(a)) { stop(); a.click(); return; }
    var dir = k === 'ArrowLeft' || kc === 37 ? 'l' : k === 'ArrowRight' || kc === 39 ? 'r' : k === 'ArrowUp' || kc === 38 ? 'u' : k === 'ArrowDown' || kc === 40 ? 'd' : '';
    if (!dir) return;
    if (typing && (dir === 'l' || dir === 'r')) return;   // the caret moves in the search box
    stop();
    if (a && a.classList && a.classList.contains("npbar") && (dir === "l" || dir === "r")) { scrubKey(dir); return; }
    // lyrics: Up/Down scroll plain lyrics, Left/Right skip 10 s
    if (a && a.classList && a.classList.contains("lfx")) { if (dir === "l" || dir === "r") ctl("skip", dir === "r" ? 10 : -10); else if (!lyr.synced) lyricsScroll(dir === "d" ? 1 : -1); return; }
    // a song row: Right goes to its "..." button (the song menu: Play next, Add to queue, Add to playlist, Instant mix)
    if (a && a.classList && a.classList.contains("tr") && dir === "r") { var tm = a.querySelector(".tmore"); if (tm) { focusEl(tm); return; } }
    if (a && a.classList && a.classList.contains("tmore")) { var row = a.closest(".tr"); if (row) { focusEl(row); if (dir !== "l") move(dir); return; } }
    move(dir);
  }, true);

  // Opening an album from a card elsewhere (e.g. Search): cover the stock page at once
  document.addEventListener('click', function (e) {
    var c = e.target.closest && e.target.closest('[data-type="MusicAlbum"][data-id]');
    if (c && !c.closest('#' + ROOT_ID) && !(hid && hid.contains(c))) remember(c.getAttribute('data-id'));
  }, true);
  // Web: Jellyfin's Back arrow in the top bar steps back one Music page (Now Playing -> page ->
  // previous page -> Music Home); only on Music Home does it leave Music
  document.addEventListener('click', function (e) {
    if (!isOpen || TV || !e.target.closest) return;
    if (!e.target.closest('.headerBackButton, header.MuiAppBar-root button[aria-label="Back"]')) return;
    if (stepBack()) { e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation(); }
  }, true);
  window.IvfMusic = { pm: pm, state: playState, refresh: refresh, view: function () { return view; } };
  window.addEventListener('hashchange', function () { setTimeout(check, 0); });
  document.addEventListener('viewshow', function () { setTimeout(check, 0); });
  check();
})();

} catch (e) { console.error('IvanaFin script music-page failed:', e); } })();
/* IvanaFin - playback-tweaks */
(function() { try {
// IvanaFin playback tweaks for the web and the Samsung app (performance, 2026-11-14):
// 1. Soundtrack: browsers and the Samsung TV can't play DTS or TrueHD, so the server converts the sound
//    on the fly (slower start, slower skipping). When a file also has an English track the TV can play
//    (AC3 / E-AC3 / AAC...), that one is asked for instead. A track picked by hand in the player is kept.
// 2. Image subtitles (PGS, Blu-ray style): back to Jellyfin's default = the server burns them into the
//    picture, so they show at once (2026-11-22, user). Drawing them in the app (Jellyfin's "Render PGS
//    subtitles", which IvanaFin turned on 2026-11-14) made the first use of a big film wait minutes while
//    the server pulled the subtitles out of the whole file. Our earlier 'true' is undone once per device;
//    the setting can still be turned on by hand in Settings > Subtitles.
// 3. Paused = the player buttons and the progress bar stay on screen (2026-11-17, user). Jellyfin fades
//    them out after a few seconds even when paused; while the video is paused the hiding is undone.
// 4. The film or show logo at the top of the player instead of the typed title (2026-11-17, user: like the
//    Android app). No logo: the title stays.
(function () {
  'use strict';
  if (window.__ivfPlaybackTweaks) return;
  window.__ivfPlaybackTweaks = true;

  try {
    if (localStorage.getItem('ivf-pgs-burnin') === null) {
      localStorage.removeItem('subtitlerenderpgs');
      localStorage.setItem('ivf-pgs-burnin', '1');
    }
  } catch (e) {}

  var UNPLAYABLE = { dts: 1, truehd: 1, mlp: 1 };
  // given: the track the app asked for (it always names one - the default); only that default is replaced
  function pickAudio(streams, given) {
    var auds = streams.filter(function (s) { return s.Type === 'Audio'; });
    if (!auds.length) return null;
    var eng = auds.filter(function (s) { return s.Language === 'eng'; });
    var pool = eng.length ? eng : auds;
    var chosen = pool.filter(function (s) { return s.IsDefault; })[0] || pool[0];
    if (!UNPLAYABLE[(chosen.Codec || '').toLowerCase()]) return null; // the server's choice plays as it is
    if (given != null && given !== '' && +given !== chosen.Index) return null; // another track was picked by hand
    // never an extra: commentary, music-only score, audio description, sound effects, audience recordings...
    var EXTRA = /commentary|isolated|score|audio description|descriptive|visually impaired|\bsfx\b|effects|audience|workprint|karaoke/i;
    var ok = pool.filter(function (s) {
      return !UNPLAYABLE[(s.Codec || '').toLowerCase()] && !EXTRA.test((s.Title || '') + ' ' + (s.DisplayTitle || '')) &&
        // never fewer channels than the default (7.1 -> 5.1 is fine; surround -> stereo is not: then the
        // server converts the surround track instead, as before)
        (s.Channels || 0) >= Math.min(chosen.Channels || 2, 6);
    });
    if (!ok.length) return null;
    // closest to the track it replaces: same number of channels first, then the most words of its name in
    // common (fan editions carry several mixes - "1977 35mm stereo mix" in DTS and again in AC3), then the
    // most channels (5.1 beats stereo), then the order in the file
    var words = function (s) {
      return ((s.Title || '') + ' ' + (s.DisplayTitle || '')).toLowerCase().replace(/[^a-z0-9.]+/g, ' ').split(' ').filter(function (w) {
        return w.length > 2 && !/^(dts|dolby|digital|plus|truehd|ac3|eac3|aac|flac|pcm|english|eng|kbps|khz|default)$/.test(w);
      });
    };
    var target = words(chosen);
    var score = function (s) {
      var w = words(s), n = 0;
      for (var i = 0; i < target.length; i++) if (w.indexOf(target[i]) >= 0) n++;
      return n;
    };
    ok.forEach(function (s, i) { s._ivfOrder = i; });
    ok.sort(function (a, b) {
      return ((b.Channels === chosen.Channels) - (a.Channels === chosen.Channels)) ||
        (score(b) - score(a)) || ((b.Channels || 0) - (a.Channels || 0)) || (a._ivfOrder - b._ivfOrder);
    });
    return ok[0].Index;
  }

  // the web app asks for PlaybackInfo with an XMLHttpRequest: held back until the soundtrack is chosen
  var X = XMLHttpRequest.prototype, open = X.open, send = X.send, setHeader = X.setRequestHeader;
  X.open = function (method, url) {
    this._ivf = { method: method, url: String(url), async: arguments[2] !== false, headers: [] };
    return open.apply(this, arguments);
  };
  X.setRequestHeader = function (k, v) {
    if (this._ivf) this._ivf.headers.push([k, v]);
    return setHeader.apply(this, arguments);
  };
  X.send = function (body) {
    var r = this._ivf, xhr = this;
    try {
      var pm = r && /\/Items\/([0-9a-f]{32})\/PlaybackInfo/i.exec(r.url);
      if (pm) playingId = pm[1];
      var m = r && r.async && r.method === 'POST' && /\/Items\/([0-9a-f]{32})\/PlaybackInfo/i.exec(r.url);
      if (m && !/[?&]AudioStreamIndex=\d/i.test(r.url) && window.ApiClient) {
        var data = body ? JSON.parse(body) : {};
        ApiClient.getItem(ApiClient.getCurrentUserId(), m[1]).then(function (item) {
          var src = (item.MediaSources || [])[0];
          var want = src && pickAudio(src.MediaStreams || [], data.AudioStreamIndex);
          if (want == null) return send.call(xhr, body);
          data.AudioStreamIndex = want;
          open.call(xhr, 'POST', r.url + (r.url.indexOf('?') < 0 ? '?' : '&') + 'AudioStreamIndex=' + want, true);
          r.headers.forEach(function (h) { setHeader.call(xhr, h[0], h[1]); });
          send.call(xhr, JSON.stringify(data));
        }, function () { send.call(xhr, body); });
        return;
      }
    } catch (e) {}
    return send.apply(this, arguments);
  };

  // 4. logo at the top of the player
  var playingId = null, logoDone = null;
  function d(n) { return "calc(var(--ivf-dp, 100vw / 960) * " + n + ")"; }
  function osdLogo() {
    var header = document.querySelector(".skinHeader.osdHeader");
    var old = document.querySelector(".ivf-osd-logo");
    if (!header) { // left the player: the normal header again
      if (old) old.parentNode.removeChild(old);
      var t0 = document.querySelector(".skinHeader .pageTitle.ivf-logo-title");
      if (t0) { t0.classList.remove("ivf-logo-title"); t0.style.visibility = ""; }
      logoDone = null;
      return;
    }
    if (!playingId || !window.ApiClient || logoDone === playingId) return;
    logoDone = playingId;
    if (old) old.parentNode.removeChild(old);
    var id = playingId;
    ApiClient.getItem(ApiClient.getCurrentUserId(), id).then(function (item) {
      if (id !== playingId) return;
      var src = item.ImageTags && item.ImageTags.Logo ? { id: item.Id, tag: item.ImageTags.Logo } : item.ParentLogoItemId ? { id: item.ParentLogoItemId, tag: item.ParentLogoImageTag } : null;
      var h = document.querySelector(".skinHeader.osdHeader"), title = h && h.querySelector(".pageTitle");
      if (!src || !h) return;
      var img = document.createElement("img");
      img.className = "ivf-osd-logo";
      img.alt = "";
      // where the title starts (after the back arrow), as big as the Android logo box (240 x 120 dp less padding)
      var left = title ? title.getBoundingClientRect().left - h.getBoundingClientRect().left : 0;
      // fixed on the page, not inside the header (the header clips it on the web); fades with the header
      var top = title ? title.getBoundingClientRect().top : 0;
      img.style.cssText = "position:fixed;top:" + (top > 4 ? Math.max(8, top - 6) + "px" : d(16)) + ";left:" + (left ? left + "px" : d(16)) + ";max-width:" + d(208) + ";max-height:" + d(88) + ";object-fit:contain;object-position:left top;pointer-events:none;z-index:1001;transition:opacity .3s";
      img.onload = function () { if (title) { title.classList.add("ivf-logo-title"); title.style.visibility = "hidden"; } };
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      img.src = ApiClient.getScaledImageUrl(src.id, { type: "Logo", maxWidth: 600, tag: src.tag });
      document.body.appendChild(img);
      syncLogo();
    }, function () {});
  }
  // the logo shows and hides with the player header
  function syncLogo() {
    var img = document.querySelector(".ivf-osd-logo"), h = document.querySelector(".skinHeader.osdHeader");
    if (img) img.style.opacity = h && !h.classList.contains("osdHeader-hidden") && !h.classList.contains("hide") ? "1" : "0";
  }
  setInterval(osdLogo, 700);
  new MutationObserver(syncLogo).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // 3. keep the controls on screen while paused
  var held = false;
  function video() { var v = document.querySelector("video.htmlvideoplayer") || document.querySelector("video"); return v; }
  function pausedNow() { var v = video(); return !!(v && v.paused && !v.ended && v.readyState > 0 && document.querySelector(".videoOsdBottom")); }
  function unhide() {
    var b = document.querySelector(".videoOsdBottom"), h = document.querySelector(".skinHeader.osdHeader") || document.querySelector(".skinHeader");
    if (b) { b.classList.remove("videoOsdBottom-hidden"); b.classList.remove("hide"); }
    if (h) { h.classList.remove("osdHeader-hidden"); h.classList.remove("hide"); }
    held = true;
  }
  // Jellyfin hides by adding classes: undo it at once while paused
  new MutationObserver(function () { if (pausedNow()) { var b = document.querySelector(".videoOsdBottom"); if (b && (b.classList.contains("videoOsdBottom-hidden") || b.classList.contains("hide"))) unhide(); } })
    .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });
  document.addEventListener("pause", function (e) { if (e.target && e.target.tagName === "VIDEO") setTimeout(function () { if (pausedNow()) unhide(); }, 0); }, true);
  // playing again: let Jellyfin show the controls normally, so its own timer fades them out as usual
  document.addEventListener("playing", function (e) {
    if (!held || !e.target || e.target.tagName !== "VIDEO") return;
    held = false;
    // (Jellyfin listens for pointermove where it exists, else mousemove, and ignores tiny moves)
    var x = 40 + Math.round(Math.random() * 400), y = 40 + Math.round(Math.random() * 300);
    ["pointermove", "mousemove"].forEach(function (t) {
      try { document.dispatchEvent(t === "pointermove" && window.PointerEvent ? new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerType: "mouse" }) : new MouseEvent(t, { bubbles: true, clientX: x, clientY: y })); } catch (e) {}
    });
  }, true);
})();

} catch (e) { console.error('IvanaFin script playback-tweaks failed:', e); } })();
/* IvanaFin - query-cache-saver */
(function() { try {
// IvanaFin query-cache saver (performance, 2026-11-18): Jellyfin web keeps a copy of its data cache in the
// browser's storage (IndexedDB "keyval-store", key "jellyfin-query-cache") so the next start can show things
// at once. It rewrites the WHOLE copy (2.3 MB, 176 queries) every time any one query changes - about 26 times
// in the first 15 s of a start, ~120 ms of blocked screen each on the Samsung (most of the slow start).
// Here only the newest copy is kept and written once things go quiet (5 s, at most every 30 s), and when the
// app is hidden or closed. The copy also keeps only the 60 most recently updated queries (the rest are simply
// fetched again when needed), so reading it back at start is cheaper too.
(function () {
  'use strict';
  if (window.__ivfQueryCacheSaver) return;
  window.__ivfQueryCacheSaver = true;
  if (!window.IDBObjectStore) return;

  var KEY = 'jellyfin-query-cache', KEEP = 60, QUIET = 5000, MAX_WAIT = 30000;
  var realPut = IDBObjectStore.prototype.put;
  var pending = null, db = null, store = '', timer = 0, firstAt = 0;

  function trim(v) {
    try {
      var qs = v && v.clientState && v.clientState.queries;
      if (qs && qs.length > KEEP) {
        qs = qs.slice().sort(function (a, b) {
          return ((b.state && b.state.dataUpdatedAt) || 0) - ((a.state && a.state.dataUpdatedAt) || 0);
        }).slice(0, KEEP);
        var cs = {}; for (var k in v.clientState) cs[k] = v.clientState[k];
        cs.queries = qs;
        var out = {}; for (var j in v) out[j] = v[j];
        out.clientState = cs;
        return out;
      }
    } catch (e) {}
    return v;
  }

  function flush() {
    clearTimeout(timer); timer = 0; firstAt = 0;
    if (!pending || !db) return;
    var v = pending; pending = null;
    try { realPut.call(db.transaction(store, 'readwrite').objectStore(store), trim(v), KEY); } catch (e) {}
  }

  IDBObjectStore.prototype.put = function (value, key) {
    if (key !== KEY) return realPut.apply(this, arguments);
    // the caller only waits for its transaction to finish; with no request in it, it finishes right away
    pending = value; db = this.transaction.db; store = this.name;
    var now = Date.now();
    if (!firstAt) firstAt = now;
    clearTimeout(timer);
    timer = setTimeout(flush, Math.max(0, Math.min(QUIET, firstAt + MAX_WAIT - now)));
    return null;
  };

  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'hidden') flush(); });
  window.addEventListener('pagehide', flush);
})();

} catch (e) { console.error('IvanaFin script query-cache-saver failed:', e); } })();
/* IvanaFin - row-arrows */
(function() { try {
// IvanaFin (web only): round < > arrows on the sides of the sideways card rows in Music, Discover and the film /
// show pages (Cast & Crew, Special Features, Scenes, More Like This)
// (rows have no scrollbar, so with a mouse there was no way to see the cards off to the right).
// The arrows appear while the mouse is over a row, only on a side that has more cards, and
// scroll the row by most of its width.
(function () {
  'use strict';
  if ((typeof tizen !== 'undefined' || !!window.PalmSystem)) return; // TV: the remote scrolls the rows
  var STRIPS = '#ivf-music .strip, .ivf-dsc-strip, #ivf-movie .ivf-mv-strip, #ivf-show .ivf-tvs-strip';
  // the card pictures: the arrows sit on their middle (not the middle of picture + title + year below)
  var PICS = '.ivf-dsc-poster, .p, .pic, .ivf-mv-face, .ivf-tvs-face';
  var CHEVRON = {
    l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
    r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>'
  };

  var st = document.createElement('style');
  // Music styles every button inside #ivf-music (id rule): repeat each arrow rule under that id so ours win
  function both(css) { return css.replace(/(^|\})([^{}]+)\{/g, function (m, b, sel) { return b + sel.split(',').map(function (x) { return x + ',#ivf-music ' + x.trim(); }).join(',') + '{'; }); }
  st.textContent = both([
    '.ivf-ra{position:absolute;z-index:6;width:44px;height:44px;margin-top:-22px;border:0;border-radius:50%;padding:0;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.5);',
    'opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}',
    '.ivf-ra svg{width:30px;height:30px;fill:currentColor}',
    '.ivf-ra.l{left:10px}.ivf-ra.r{right:10px}',
    '.ivf-ra-host:hover>.ivf-ra.on{opacity:1;pointer-events:auto}',
    '.ivf-ra:hover{background:rgba(30,30,30,.92);transform:scale(1.08)}'
  ].join(''));
  document.head.appendChild(st);

  function update(strip) {
    var host = strip.parentNode; if (!host || !host._ivfRa) return;
    var max = strip.scrollWidth - strip.clientWidth;
    host._ivfRa.l.classList.toggle('on', strip.scrollLeft > 4);
    host._ivfRa.r.classList.toggle('on', strip.scrollLeft < max - 4);
    // centred on the cards' pictures (the row title above and the names/years below don't count)
    var pic = strip.querySelector(PICS), top;
    if (pic && pic.offsetHeight) {
      var pr = pic.getBoundingClientRect(), hr = host.getBoundingClientRect();
      top = Math.round(pr.top - hr.top + pr.height / 2) + 'px';
    } else {
      top = strip.offsetTop + strip.offsetHeight / 2 + 'px';
    }
    host._ivfRa.l.style.top = top; host._ivfRa.r.style.top = top;
  }
  function arm(strip) {
    var host = strip.parentNode; if (!host) return;
    if (!host._ivfRa || !host.contains(host._ivfRa.l)) {
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.classList.add('ivf-ra-host');
      var mk = function (side) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ivf-ra ' + side; b.tabIndex = -1;
        b.title = side === 'l' ? 'Scroll left' : 'Scroll right';
        b.innerHTML = CHEVRON[side];
        b.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          var s = host.querySelector(STRIPS) || strip;
          // the prototype's scrollBy: Music switches off scrollBy on its own boxes (Jellyfin's TV code calls it)
          Element.prototype.scrollBy.call(s, { left: (side === 'l' ? -1 : 1) * Math.max(200, s.clientWidth * 0.85), behavior: 'smooth' });
        });
        host.appendChild(b);
        return b;
      };
      host._ivfRa = { l: mk('l'), r: mk('r') };
    }
    update(strip);
  }
  document.addEventListener('mouseover', function (e) {
    var s = e.target.closest && e.target.closest(STRIPS);
    if (!s) { var h = e.target.closest && e.target.closest('.ivf-ra-host'); s = h && h.querySelector(STRIPS); }
    if (s) arm(s);
  }, true);
  // scroll events don't bubble: listen while capturing
  document.addEventListener('scroll', function (e) {
    var s = e.target;
    if (s && s.matches && s.matches(STRIPS)) update(s);
  }, true);
  window.addEventListener('resize', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.ivf-ra-host'), function (h) { var s = h.querySelector(STRIPS); if (s) update(s); });
  });
})();

} catch (e) { console.error('IvanaFin script row-arrows failed:', e); } })();
/* IvanaFin - samsung-library */
(function() { try {
// IvanaFin (Samsung app AND Jellyfin web): library pages mirror the Android IvanaFin library (poster grid
// only): no toolbar (play, shuffle, view, sort, filter), no A-Z strip; 5 posters per row across the screen
// with small margins, like the Fire TV. Samsung also hides the header (back/tabs/icons/clock) and the
// count + page buttons; the web keeps Jellyfin's top bar and its page buttons (big libraries come in
// pages there) and is drawn at ~72% size like its other pages. (File name kept for the deploy name.)
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
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var STYLE_ID = 'ivf-slib-style';

  var COLS = TV ? 5 : 7; // web: smaller posters, 7 per row (same ~72% density as its other pages)
  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var d = TV ? 'var(--ivf-dp)' : '(var(--ivf-dp) * 0.72)'; // web: ~72% of the TV size
    var L = 'html.ivf-lib-on ';
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      ':root{--ivf-dp:calc(100vw / 960)}',
      // No "press" shrink when choosing a poster/card (ElegantFin: .emby-button:active scale(.98),
      // .cardScalable:active scale(1)); the focus grow stays
      '.card:active,.card.emby-button:active{transform:none !important;filter:none !important}',
      '.card-hoverable .cardScalable:active{transform:none !important}',
      // ElegantFin's pointer-hover zooms (picture 1.025 -> back to 1 over the play button; card 1.02):
      // the Samsung remote acts as a pointer, so pressing OK showed as the picture zooming smaller
      '.card-hoverable:hover .cardScalable,.card-hoverable:hover .itemSelectionPanel{transform:none !important}',
      '.cardImageContainer{transform:none !important;transition:none !important}',
      // Highlighted poster: same size as the others (no grow, no shrink) - just the white outline
      '.itemsContainer .card,.itemsContainer .card:focus,.itemsContainer .card:focus-within{transform:none !important}',
      '.itemsContainer .card .cardScalable,.itemsContainer .card:focus .cardScalable{transform:none !important}',
      '.itemsContainer .card > .cardBox{transition:none !important;transform:none !important}',
      '.itemsContainer .card:focus > .cardBox{transform:none !important}',
      // The theme's white outline is a border INSIDE the poster frame, so highlighting squeezed the
      // picture smaller. No border at all; the outline is drawn OUTSIDE the picture instead.
      // (the server's custom CSS has .card:focus .cardBox:not(.visualCardBox) .cardScalable{border:3px solid white !important},
      // specificity 0,5,0 - :not(#ivf-x) adds an id's weight so these rules always win)
      '.itemsContainer .card .cardScalable:not(#ivf-x),.itemsContainer .card:focus .cardScalable:not(#ivf-x),',
      '.itemsContainer .card .cardBox:not(#ivf-x),.itemsContainer .card:focus .cardBox:not(#ivf-x){border:0 none !important}',
      '.itemsContainer .card:focus .cardScalable:not(#ivf-x){box-shadow:0 0 0 3px #fff !important}',
      // Pressing OK moves focus away while the next page opens, so the focus grow (scale 1.07) would
      // animate back down = a visible "shrink". Keep a pressed card grown until the page has changed.
      '.card.ivf-pressed>.cardBox{transform:none !important;transition:none !important}',
      // leaving a library for a title page: the library is hidden at once (see styleNow)
      // (opacity, NOT visibility:hidden: hiding the focused poster makes the browser drop its focus, so
      // Back to the library had nothing to return to - no poster selected, next press = top-left)
      'html.ivf-lib-leaving .page.libraryPage:not(#itemDetailPage):not(.homePage){opacity:0 !important;pointer-events:none !important}',
      // (no raised z-index any more: posters don't grow, and a raised poster showed THROUGH the next
      // page for a moment - e.g. in the middle of a show's page)
      TV ? L + '.skinHeader{display:none !important}' : '',
      L + '.alphaPicker,' + L + '.alphaPickerContainer{display:none !important}',
      TV ? L + '.ivf-lib-toolbar{display:none !important}'
        : L + '.btnSort,' + L + '.btnFilter,' + L + '.btnSelectView,' + L + '.btnShuffle,' + L + '.btnPlay,' + L + '.btnNewCollection{display:none !important}',
      // web (Jellyfin 12 desktop): the toolbar row in the top bar - keep the library name and the
      // Previous / Next page buttons, hide the item count, Play All, Shuffle, Filter, Sort and View settings
      TV ? '' : L + '.MuiToolbar-root .MuiChip-root,' + L + '.MuiToolbar-root button[title="Play All"],' + L + '.MuiToolbar-root button[title="Shuffle"],' +
        L + '.MuiToolbar-root button[title="Filter"],' + L + '.MuiToolbar-root button[title="Sort"],' + L + '.MuiToolbar-root button[title="View settings"],' +
        L + '.alphaPicker-fixed-right{display:none !important}',
      // web: no "1-38 of 38" + menu row above the posters (the one under them is enough), so the
      // posters start right under the top bar
      TV ? '' : L + '.page:not(.hide).libraryPage .itemsViewSettingsContainer{display:none !important}',
      // web, Desktop (legacy) layout: Jellyfin's own header (back, menu, title, icons) stays, but not its
      // Shows / Suggestions / Upcoming ... tabs, and not the "1-12 of 12" row above the posters (the
      // row under them keeps the page buttons for big libraries)
      // ... and that header stays at the top of the page and scrolls away with it (fixed, it followed
      // the page down and blurred the posters scrolling under it)
      // (every web page, not only libraries)
      TV ? '' : 'html:not(.layout-tv) .skinHeader{position:absolute !important}' +
        L + '.skinHeader .headerTabs{display:none !important}' +
        L + '.page:not(.hide).libraryPage .pageTabContent .ivf-lib-toolbar:has(~ .itemsContainer){display:none !important}',
      // web: the mouse pointer selects like the remote (white outline just outside the poster)
      TV ? '' : L + '.itemsContainer .card:hover .cardScalable:not(#ivf-x){box-shadow:0 0 0 3px #fff !important}',
      // Android's library grid (measured on the Fire TV app): posters start 36dp from the top, 32dp from
      // the left and 16dp from the right, 170dp wide with 16dp between them; title 14sp semi-bold +
      // year 12sp centred under each poster
      // web: just a small gap under Jellyfin's top bar (the page kept ~80px for a tabs row that isn't shown).
      // In some layouts the page starts BEHIND the bar, so padUnderHeader() adds the bar's overlap.
      L + '.page:not(.hide).libraryPage{padding-top:calc(var(--ivf-lib-under,0px) + ' + d + ' * ' + (TV ? 36 : 16) + ') !important}',
      // 5 posters per row (the theme lays this out as a 4-column grid; force a plain 5-across wrap),
      // top-aligned (Samsung: a 2-line title lifted its poster above the rest of the row)
      L + '.page:not(.hide).libraryPage .itemsContainer.vertical-wrap{display:flex !important;flex-wrap:wrap !important;align-items:flex-start !important;grid-template-columns:none !important;',
      // (web: equal gaps both sides, 24 + 24 = Android's 32 + 16, so the posters keep their size)
      'padding-left:calc(' + d + ' * ' + (TV ? 32 : 24) + ') !important;padding-right:calc(' + d + ' * ' + (TV ? 16 : 24) + ') !important;margin:0 !important;width:auto !important;justify-content:flex-start !important;box-sizing:border-box;',
      'gap:0 !important;column-gap:calc(' + d + ' * 16) !important;row-gap:calc(' + d + ' * 25) !important}',
      L + '.page:not(.hide).libraryPage .itemsContainer.vertical-wrap > .card{width:calc((100% - ' + d + ' * ' + (16 * (COLS - 1)) + ') / ' + COLS + ') !important;max-width:none !important;min-width:0 !important;',
      'flex:0 0 calc((100% - ' + d + ' * ' + (16 * (COLS - 1)) + ') / ' + COLS + ') !important;margin:0 !important;padding:0 !important;box-sizing:border-box}',
      L + '.page:not(.hide).libraryPage .itemsContainer.vertical-wrap > .card > .cardBox{margin:0 !important;padding:0 !important}',
      L + '.page:not(.hide).libraryPage .itemsContainer.vertical-wrap > .card .cardScalable{margin:0 !important}',
      L + '.page:not(.hide).libraryPage .itemsContainer .cardScalable{border-radius:calc(var(--ivf-dp) * 4) !important;overflow:hidden}',
      L + '.page:not(.hide).libraryPage .itemsContainer .cardFooter{padding-top:calc(' + d + ' * 8) !important}',
      L + '.page:not(.hide).libraryPage .itemsContainer .cardText{font-size:calc(' + d + ' * 12) !important;line-height:calc(' + d + ' * 16) !important;font-weight:400 !important;letter-spacing:calc(' + d + ' * 0.4) !important;color:#d1d5db !important;opacity:.9;padding:0 calc(' + d + ' * 4) !important}',
      L + '.page:not(.hide).libraryPage .itemsContainer .cardText-first{font-size:calc(' + d + ' * 14) !important;line-height:calc(' + d + ' * 20) !important;font-weight:600 !important;letter-spacing:calc(' + d + ' * 0.25) !important;opacity:1}',
      // no extra side padding from the page/tab wrappers around the grid
      L + '.page:not(.hide).libraryPage .pageTabContent,' + L + '.page:not(.hide).libraryPage .padded-left{padding-left:0 !important}',
      L + '.page:not(.hide).libraryPage .pageTabContent,' + L + '.page:not(.hide).libraryPage .padded-right{padding-right:0 !important}'
    ].join('');
    document.head.appendChild(s);
  }

  function onLibraryRoute() {
    return /^#\/(movies|tv|list|musicvideos)(\.html)?(\?|$)/.test(location.hash || '');
  }

  var offTimer = null, offWaits = 0;
  function libraryStillShown() {
    // (Jellyfin also gives title pages and Home the libraryPage class - those don't count)
    var p = document.querySelector('.page.libraryPage:not(.hide):not(#itemDetailPage):not(.homePage)');
    return !!(p && p.getClientRects().length);
  }
  function update() {
    var on = onLibraryRoute();
    addStyle(); // (also holds the no-press-shrink rule used on every page)
    clearTimeout(offTimer);
    if (on) offWaits = 0;
    if (!on && libraryStillShown() && offWaits < 30) {
      // The address has moved on (e.g. into a show) but the library is still on screen while the next
      // page loads: keep its styling (else its toolbar and A-Z picker flash up), look again shortly
      // (at most ~4.5 s, in case a library page ever lingers)
      offWaits++;
      offTimer = setTimeout(update, 150);
      return;
    }
    offWaits = 0;
    document.documentElement.classList.toggle('ivf-lib-on', on);
    if (!on) return;
    // Tag the toolbar rows (paging + play/shuffle/view/sort/filter) of the visible library page
    var page = document.querySelector('.page.libraryPage:not(.hide)');
    if (!page) return;
    page.querySelectorAll('.btnSort, .btnFilter, .btnSelectView, .btnShuffle, .btnPlay, .paging, .itemsViewSettingsContainer').forEach(function (el) {
      var row = el.closest('.itemsViewSettingsContainer') || el.closest('.flex.align-items-center.justify-content-center') || el.parentElement;
      if (row && row !== page && !row.classList.contains('ivf-lib-toolbar') && !row.querySelector('.itemsContainer')) row.classList.add('ivf-lib-toolbar');
    });
    if (!TV) padUnderHeader(page);
    upgradePosters(page);
  }

  // Web: how far the visible top bar reaches over the page's top edge (0 when the page starts below it)
  function padUnderHeader(page) {
    var bottom = 0;
    var scroller = document.scrollingElement || document.documentElement;
    var sy = scroller.scrollTop || 0;
    Array.prototype.forEach.call(document.querySelectorAll('header.MuiAppBar-root, .skinHeader'), function (h) {
      var cs = getComputedStyle(h);
      if (!h.getClientRects().length || cs.visibility === 'hidden') return;
      // a fixed bar always covers the top of the screen; one that scrolls with the page (legacy
      // header, see above) covers the top of the page - measure it in page terms
      bottom = Math.max(bottom, Math.round(h.getBoundingClientRect().bottom + (cs.position === 'fixed' ? 0 : sy)));
    });
    var top = Math.round(page.getBoundingClientRect().top);
    top += sy; // the page's top edge in the document, not where it is scrolled to
    var under = Math.max(0, bottom - top);
    var want = under + 'px';
    if (document.documentElement.style.getPropertyValue('--ivf-lib-under') !== want) document.documentElement.style.setProperty('--ivf-lib-under', want);
  }

  // Jellyfin asks the server for posters sized for ITS grid (e.g. 213x320 on the web), but ours draws
  // them bigger (5 or 7 per row), so they looked soft. Ask again at the size actually on screen (x the
  // screen's pixel density), rounded up to 100px steps so the server's image cache is reused.
  function wantedUrl(url, box) {
    if (!url || url.indexOf('/Images/') < 0 || !box.width) return null;
    var dpr = Math.max(1, window.devicePixelRatio || 1);
    var w = Math.ceil(box.width * dpr / 100) * 100, h = Math.ceil(box.height * dpr / 100) * 100;
    var m = /[?&](?:fillWidth|maxWidth|width)=(\d+)/i.exec(url);
    if (m && +m[1] >= w) return null; // already sharp enough
    var u = url.replace(/([?&])(fillWidth|fillHeight|maxWidth|maxHeight|width|height)=\d+&?/gi, '$1').replace(/[?&]$/, '');
    return u + (u.indexOf('?') < 0 ? '?' : '&') + 'fillWidth=' + w + '&fillHeight=' + h;
  }
  // Each picture is checked once (per picture address and window size): measuring every poster on every
  // page change was one of the slowest things on the Samsung TV.
  var sizeGen = 0;
  function upgradePosters(page) {
    Array.prototype.forEach.call(page.querySelectorAll('.itemsContainer .card img'), function (img) {
      var src = img.getAttribute('src');
      if (img._ivfSeen === src + '|' + sizeGen) return;
      var n = wantedUrl(src, img.getBoundingClientRect());
      if (n) { img.removeAttribute('srcset'); img.setAttribute('src', n); src = n; }
      if (n || img.getBoundingClientRect().width) img._ivfSeen = src + '|' + sizeGen; // not laid out yet: look again later
    });
    Array.prototype.forEach.call(page.querySelectorAll('.itemsContainer .card .cardImageContainer'), function (box) {
      var bg = box.style.backgroundImage;
      if (!bg || box._ivfSeen === bg + '|' + sizeGen) return;
      var mm = /url\(["']?([^"')]+)["']?\)/.exec(bg);
      var r = box.getBoundingClientRect();
      var nb = mm && wantedUrl(mm[1], r);
      if (nb) { box.style.backgroundImage = 'url("' + nb + '")'; bg = box.style.backgroundImage; }
      if (nb || r.width) box._ivfSeen = bg + '|' + sizeGen;
    });
  }
  window.addEventListener('resize', function () {
    sizeGen++;
    var page = onLibraryRoute() && document.querySelector('.page.libraryPage:not(.hide)');
    if (page) upgradePosters(page);
  });

  function pressed(card) {
    if (!card || !card.classList.contains('show-animation')) return;
    card.classList.add('ivf-pressed');
    setTimeout(function () { card.classList.remove('ivf-pressed'); }, 2500);
  }
  document.addEventListener('click', function (e) { pressed(e.target.closest && e.target.closest('.card')); }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.keyCode !== 13) return;
    var a = document.activeElement;
    pressed(a && a.closest && a.closest('.card'));
  }, true);

  // Back to a library (e.g. from a show): switch the library styling on in the same moment, before the
  // browser draws Jellyfin's cached page with its tabs/toolbar (a setTimeout alone let it flash)
  // Only ever switches the styling ON at once (arriving at a library). Leaving a library, the address
  // changes before the next page has replaced it - switching OFF here showed the library's toolbar and
  // A-Z picker again for a moment; update() (on viewshow, once the new page is up) switches it off.
  function styleNow() {
    addStyle();
    if (onLibraryRoute()) document.documentElement.classList.add('ivf-lib-on');
    // Into a film/show from a library: hide the library page at once. During Jellyfin's page switch it
    // stays visible for a frame or more under the still-empty title page (on the TV the poster that was
    // pressed showed in the middle of the show's page). Back out: shown again at once.
    var html = document.documentElement;
    if (/^#\/details(\?|$)/.test(location.hash || '')) {
      if (html.classList.contains('ivf-lib-on')) html.classList.add('ivf-lib-leaving');
    } else html.classList.remove('ivf-lib-leaving');
  }
  window.addEventListener('ivf-nav', styleNow); // forward (pushState) and Back
  window.addEventListener('hashchange', function () { styleNow(); setTimeout(update, 0); });
  document.addEventListener('viewshow', function () { setTimeout(update, 0); });
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
  ivfWatch(function () { update(); }, 100);
  update();

  // Web, Desktop (legacy) layout: Jellyfin's top bar scrolls away with the page on EVERY page (the
  // CSS above makes it part of the page). Pages that scroll inside their own full-screen panel
  // (show page, Music, Discover...) don't move the page itself, so the bar is moved up by the panel's
  // scroll here. While the bar moves, the fades our full-screen pages drew at the top of the screen
  // (for content passing under a see-through bar) are switched off.
  if (!TV) {
    var hdrY = -1;
    var legacyBar = function () {
      var h = document.querySelector('.skinHeader');
      return h && !document.querySelector('header.MuiAppBar-root') && !document.documentElement.classList.contains('layout-tv') ? h : null;
    };
    var moveBar = function (y) {
      var h = legacyBar();
      document.documentElement.classList.toggle('ivf-hdr-moves', !!h);
      if (!h) return;
      y = Math.max(0, Math.round(y));
      if (y === hdrY) return;
      hdrY = y;
      h.style.transform = y ? 'translateY(-' + y + 'px)' : '';
    };
    var fx = document.createElement('style');
    fx.textContent = 'html.ivf-hdr-moves .ivf-mv-scroll,html.ivf-hdr-moves .ivf-tvs-scroll,html.ivf-hdr-moves .ivf-dsc-scroll,html.ivf-hdr-moves .nps{-webkit-mask-image:none !important;mask-image:none !important}';
    document.head.appendChild(fx);
    document.addEventListener('scroll', function (e) {
      var t = e.target;
      // film and show pages (2026-11-12, user request): the bar's buttons stay fixed in place; the page
      // scrolls under it and fades out there (their .ivf-mv-scroll / .ivf-tvs-scroll mask)
      var de = document.documentElement;
      // (and Discover - round-4 beta: its tabs were left half under the moving bar)
      if (de.classList.contains('ivf-movie-on') || de.classList.contains('ivf-show-on') || de.classList.contains('ivf-dsc-on')) {
        moveBar(0);
        de.classList.remove('ivf-hdr-moves');
        return;
      }
      if (!t || t === document || t === document.documentElement || t === document.body) return moveBar(0); // the page itself: CSS does it
      if ((document.scrollingElement || document.documentElement).scrollTop > 0) return; // page already scrolled
      if (t.clientHeight < innerHeight * 0.6) return; // a row of posters, a list... not the page's main panel
      // a pop-up window's list (Media Information, Audio, Subtitles, Season...): the bar stays put
      if (t.closest && t.closest('.ivf-mv-dlg, .ivf-dialog, .ivf-dd-dlg, .dialogContainer, [role="dialog"]')) return;
      moveBar(t.scrollTop);
    }, true);
    window.addEventListener('ivf-nav', function () { moveBar(0); });
    moveBar(0);
    // Mouse wheel over the top bar: our full-screen pages scroll inside their own box, so the wheel
    // reached the page behind (only the bar moved away). Send it to the box under the bar instead.
    document.addEventListener('wheel', function (e) {
      var bar = e.target && e.target.closest && e.target.closest('.skinHeader');
      if (!bar || !e.deltaY) return;
      var under = document.elementsFromPoint(e.clientX, e.clientY).filter(function (el) { return !bar.contains(el) && el !== bar; })[0];
      for (var el = under; el && el !== document.body && el !== document.documentElement; el = el.parentElement) {
        var oy = getComputedStyle(el).overflowY;
        if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
          e.preventDefault();
          el.scrollTop += e.deltaY;
          return;
        }
      }
    }, { passive: false, capture: true });
  }
})();

} catch (e) { console.error('IvanaFin script samsung-library failed:', e); } })();
/* IvanaFin - search-page */
(function() { try {
// IvanaFin (Samsung app): Search mirrors the Android IvanaFin SearchPage (measured on the Fire TV app,
// 1dp = 1/960 of the screen width): a centred 280dp x 40dp search box with a round filter button
// beside it, then one row per kind of result - Movies, TV Shows, Episodes, Collections, People - with
// the row name (22sp) over 115dp posters (title 14sp semi-bold + year 12sp), 16dp apart.
// The filter button chooses which kinds are searched (remembered on this TV).
// Remote: Up/Down move between the box and the rows (back to the item last selected in a row),
// Left/Right along a row; OK on the box starts typing (the TV's keyboard). Back leaves Search.
// Replaces Jellyfin's own TV search page (on-screen A-Z letters + suggestions) - Samsung only.
(function () {
  'use strict';
  // Samsung and the web (the web keeps Jellyfin's top bar - its search icon opens this - sits below
  // it and is drawn at ~72% size like the web Discover page; the mouse selects by hovering)
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var DF = TV ? 1 : 0.72;
  var ROOT_ID = 'ivf-search', STYLE_ID = 'ivf-search-style', TYPES_KEY = 'ivf-search-types';
  var KINDS = [
    { type: 'Movie', title: 'Movies' },
    { type: 'Series', title: 'TV Shows' },
    { type: 'Episode', title: 'Episodes' },
    { type: 'BoxSet', title: 'Collections' },
    { type: 'Person', title: 'People' }
  ];
  var root = null, rows = [], last = [], query = '', timer = null, token = 0, dialog = null;
  var enabled = {};
  try { enabled = JSON.parse(localStorage.getItem(TYPES_KEY) || 'null') || {}; } catch (e) { enabled = {}; }
  KINDS.forEach(function (k) { if (enabled[k.type] === undefined) enabled[k.type] = true; });

  function d(n) { return 'calc(var(--ivf-dp) * ' + (Math.round(n * DF * 100) / 100) + ')'; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      ':root{--ivf-dp:calc(100vw / 960)}',
      TV ? 'html.ivf-search-on .skinHeader{display:none !important}'
        // Web: the top bar is see-through - no Jellyfin backdrop behind it (it showed a different picture
        // above our page) and a plain black bar, like the web Home and Discover pages
        : 'html.ivf-search-on .backdropContainer{display:none !important}html.ivf-search-on .backgroundContainer{background:#000 !important}' +
          'html.ivf-search-on .skinHeader{background:#000 !important;backdrop-filter:none !important}' +
          'html.ivf-search-on .skinHeader::before,html.ivf-search-on .skinHeader::after{display:none !important}',
      '#' + ROOT_ID + '{position:fixed;left:0;right:0;bottom:0;top:var(--ivf-sr-top,0px);z-index:850;background:#000;color:#d1d5db;overflow:hidden}',
      '#' + ROOT_ID + '.ivf-off{display:none}',
      '.ivf-sr-top{display:flex;justify-content:center;align-items:center;gap:' + d(12) + ';padding-top:' + d(16) + '}',
      '.ivf-sr-box{position:relative;width:' + d(280) + ';height:' + d(40) + ';box-sizing:border-box;border-radius:' + d(20) + ';background:#0e0e0e;display:flex;align-items:center;overflow:hidden}',
      '.ivf-sr-box .material-icons{position:absolute;left:' + d(12) + ';font-size:' + d(22) + ';color:#d1d5db}',
      '.ivf-sr-box input{flex:1;height:100%;border:0;outline:none;background:transparent;color:#d1d5db;font:inherit;font-size:' + d(16) + ';padding:0 ' + d(14) + ' 0 ' + d(46) + ';box-sizing:border-box;caret-color:#d1d5db}',
      '.ivf-sr-box input::-webkit-search-cancel-button,.ivf-sr-box input::-webkit-search-decoration{-webkit-appearance:none;display:none}',
      // Android has a voice button left of the box: keep its space so the box sits where it does there
      '.ivf-sr-mic{width:' + d(40) + ';height:' + d(40) + ';flex:none}',
      '.ivf-sr-box::after{content:"";position:absolute;left:0;right:0;bottom:0;height:' + d(2) + ';background:transparent}',
      '.ivf-sr-box:focus-within::after{background:#d1d5db}',
      '.ivf-sr-filter{width:' + d(40) + ';height:' + d(40) + ';border:0;border-radius:50%;background:#0e0e0e;color:#d1d5db;cursor:pointer;outline:none;display:flex;align-items:center;justify-content:center;transition:transform .12s}',
      '.ivf-sr-filter .material-icons{font-size:' + d(22) + ';color:inherit}',
      '.ivf-sr-filter:focus{background:#d1d5db;color:#131414;transform:scale(1.1)}',
      '.ivf-sr-scroll{position:absolute;top:' + d(68) + ';left:0;right:0;bottom:0;overflow-y:auto;overflow-x:hidden;scrollbar-width:none;padding-bottom:' + d(44) + ';box-sizing:border-box;scroll-behavior:smooth}',
      '.ivf-sr-scroll::-webkit-scrollbar{display:none}',
      '.ivf-sr-row{margin-top:' + d(12) + '}',
      '.ivf-sr-row h3{margin:0 0 ' + d(2) + ' ' + d(56) + ';font-size:' + d(22) + ';font-weight:400;line-height:' + d(28) + ';color:#d1d5db}',
      '.ivf-sr-strip{display:flex;gap:' + d(16) + ';overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:' + d(14) + ' ' + d(40) + ' ' + d(14) + ' ' + d(64) + ';scroll-behavior:smooth;align-items:flex-start}', // (room for the grown, ringed poster - round 5: its ring was cut at the top)
      '.ivf-sr-strip::-webkit-scrollbar{display:none}',
      '.ivf-sr-card{flex:none;width:' + d(115) + ';display:flex;flex-direction:column;align-items:center;background:none;border:0;padding:0;color:#d1d5db;font:inherit;cursor:pointer;outline:none}',
      '.ivf-sr-card.wide{width:' + d(213) + '}',
      '.ivf-sr-pic{width:100%;padding-top:150%;border-radius:calc(var(--ivf-dp) * 4);background:#141414 center/cover no-repeat;box-shadow:0 0 0 ' + d(1.5) + ' transparent;transition:transform .12s}',
      '.ivf-sr-card.wide .ivf-sr-pic{padding-top:56.25%}',
      '.ivf-sr-card.person .ivf-sr-pic{border-radius:50%;padding-top:100%}',
      '.ivf-sr-card:focus .ivf-sr-pic{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-sr-t{width:100%;margin-top:' + d(8) + ';font-size:' + d(14) + ';font-weight:600;line-height:' + d(18) + ';letter-spacing:' + d(0.25) + ';text-align:center;',
      'display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}',
      '.ivf-sr-s{width:100%;font-size:' + d(12) + ';font-weight:400;line-height:' + d(16) + ';letter-spacing:' + d(0.4) + ';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-sr-msg{margin:' + d(24) + ' 0 0 ' + d(56) + ';font-size:' + d(16) + ';color:#d1d5db}', // (was grey #9ca3af - hard to read, round 5)
      '',
      // filter dialog (DialogPopup)
      '.ivf-sr-dlg{position:fixed;inset:0;z-index:860;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}',
      '.ivf-sr-dbox{width:' + d(360) + ';box-sizing:border-box;padding:' + d(12) + ' ' + d(14) + ' ' + d(14) + ';border-radius:' + d(28) + ';background:#0b0b0b;display:flex;flex-direction:column;gap:' + d(4) + '}',
      '.ivf-sr-dtitle{padding:' + d(12) + ' ' + d(10) + ' ' + d(8) + ';font-size:' + d(22) + ';line-height:' + d(28) + '}',
      '.ivf-sr-opt{display:flex;align-items:center;gap:' + d(14) + ';min-height:' + d(48) + ';padding:0 ' + d(16) + ';border:0;border-radius:' + d(8) + ';background:transparent;color:#d1d5db;',
      'font:inherit;font-size:' + d(16) + ';text-align:left;cursor:pointer;outline:none}',
      '.ivf-sr-opt:focus{background:#d1d5db;color:#131414}',
      '.ivf-sr-opt .material-icons{font-size:' + d(22) + ';color:inherit}'
    ].join('') + (TV ? '' : [
      // Web: the mouse pointer selects like the remote; a click's leftover focus doesn't stay highlighted
      '.ivf-sr-card:hover .ivf-sr-pic{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-sr-card:focus:not(:focus-visible):not(:hover) .ivf-sr-pic{box-shadow:none;transform:none}',
      '.ivf-sr-filter:hover{background:#d1d5db;color:#131414;transform:scale(1.1)}',
      '.ivf-sr-filter:focus:not(:focus-visible):not(:hover){background:#0e0e0e;color:#d1d5db;transform:none}',
      '.ivf-sr-opt:hover{background:#d1d5db;color:#131414}'
    ].join(''));
    document.head.appendChild(s);
  }

  // Web: below Jellyfin's top bar (the lowest visible one), like the web Discover page
  function placeBelowHeader() {
    if (TV || !root) return;
    var b = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      if (!h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      b = Math.max(b, Math.round(h.getBoundingClientRect().bottom));
    });
    root.style.setProperty('--ivf-sr-top', b + 'px');
  }
  window.addEventListener('resize', placeBelowHeader);

  function onSearchRoute() { return /^#\/search(\.html)?(\?|$)/.test(location.hash || ''); }

  function build() {
    addStyle();
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'ivf-off';
    root.innerHTML = '<div class="ivf-sr-top"><span class="ivf-sr-mic"></span><label class="ivf-sr-box"><span class="material-icons" aria-hidden="true">search</span>' +
      '<input type="search" autocomplete="off" spellcheck="false" enterkeyhint="search"></label>' +
      '<button type="button" class="ivf-sr-filter" title="Search for"><span class="material-icons" aria-hidden="true">tune</span></button></div>' +
      '<div class="ivf-sr-scroll"></div>';
    document.body.appendChild(root);
    var input = root.querySelector('input');
    input.addEventListener('input', function () { clearTimeout(timer); timer = setTimeout(run, 400); });
    input.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' || e.keyCode === 13 || e.keyCode === 65376) { clearTimeout(timer); run(); }
    });
    root.querySelector('.ivf-sr-filter').addEventListener('click', openFilter);
    root.addEventListener('click', function (e) {
      var c = e.target.closest('.ivf-sr-card'); if (!c) return;
      location.hash = '#/details?id=' + c.getAttribute('data-id') + '&serverId=' + ApiClient.serverId();
    });
  }

  function imgFor(it, wide) {
    var tags = it.ImageTags || {};
    if (it.Type === 'Person') return it.PrimaryImageTag || tags.Primary ? ApiClient.getUrl('/Items/' + it.Id + '/Images/Primary', { maxHeight: 400, tag: it.PrimaryImageTag || tags.Primary }) : '';
    if (wide && tags.Primary) return ApiClient.getUrl('/Items/' + it.Id + '/Images/Primary', { maxWidth: 640, tag: tags.Primary });
    if (tags.Primary) return ApiClient.getUrl('/Items/' + it.Id + '/Images/Primary', { maxHeight: 600, tag: tags.Primary });
    if (it.SeriesPrimaryImageTag) return ApiClient.getUrl('/Items/' + it.SeriesId + '/Images/Primary', { maxHeight: 600, tag: it.SeriesPrimaryImageTag });
    return '';
  }
  function subtitle(it) {
    if (it.Type === 'Series') return it.ProductionYear ? it.ProductionYear + (it.EndDate ? ' - ' + it.EndDate.slice(0, 4) : (it.Status === 'Continuing' ? ' - Present' : '')) : '';
    if (it.Type === 'Episode') return (it.SeriesName || '') + (it.ParentIndexNumber != null ? ' · S' + it.ParentIndexNumber + ':E' + (it.IndexNumber || '') : '');
    if (it.Type === 'Person') return '';
    return it.ProductionYear ? String(it.ProductionYear) : '';
  }
  function cardHtml(it) {
    var wide = it.Type === 'Episode', pic = imgFor(it, wide);
    return '<button type="button" class="ivf-sr-card' + (wide ? ' wide' : '') + (it.Type === 'Person' ? ' person' : '') + '" data-id="' + it.Id + '">' +
      '<div class="ivf-sr-pic"' + (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '></div>' +
      '<div class="ivf-sr-t">' + esc(it.Name) + '</div><div class="ivf-sr-s">' + esc(subtitle(it)) + '</div></button>';
  }

  // People: music tags turn every song credit into a "person" ("Artist A ft Artist B", "Artist A & Artist B",
  // "(Artist) Album") - pictureless entries with a credit-list name are dropped (beta round 6)
  var CREDIT = /\b(feat|ft)\b\.?|[;&,()\[\]]|\swith\s|\sx\s/i;
  function realPeople(list) {
    return list.filter(function (p) { return p.PrimaryImageTag || (p.ImageTags && p.ImageTags.Primary) || !CREDIT.test(p.Name || ''); });
  }
  function run() {
    var q = root.querySelector('input').value.trim();
    if (q === query) return;
    query = q;
    var sc = root.querySelector('.ivf-sr-scroll');
    if (!q) { sc.innerHTML = ''; setRows(); return; }
    var t = ++token, u = ApiClient.getCurrentUserId();
    var kinds = KINDS.filter(function (k) { return enabled[k.type]; });
    sc.innerHTML = '<div class="ivf-sr-msg">Searching…</div>';
    Promise.all(kinds.map(function (k) {
      var url = k.type === 'Person'
        ? ApiClient.getUrl('/Persons', { searchTerm: q, userId: u, limit: 50, fields: 'PrimaryImageAspectRatio' })
        : ApiClient.getUrl('/Users/' + u + '/Items', { searchTerm: q, IncludeItemTypes: k.type, Recursive: true, Limit: 50, Fields: 'PrimaryImageAspectRatio,ProductionYear', EnableTotalRecordCount: false });
      return ApiClient.getJSON(url).then(function (r) { return { k: k, items: k.type === 'Person' ? realPeople((r && r.Items) || []) : (r && r.Items) || [] }; }, function () { return { k: k, items: [] }; });
    })).then(function (res) {
      if (t !== token) return;
      // one card per film: the IMAX / alternative copy is its own item (The Dark Knight twice - beta round 6)
      res.forEach(function (r) {
        var seen = {};
        r.items = r.items.filter(function (it) { if (it.Type !== 'Movie' && it.Type !== 'Series') return true; var key = (it.Name || '').toLowerCase() + '|' + (it.ProductionYear || '') + '|' + it.Type; if (seen[key]) return false; seen[key] = 1; return true; });
      });
      res = res.filter(function (r) { return r.items.length; });
      sc.innerHTML = res.length ? res.map(function (r) {
        return '<section class="ivf-sr-row"><h3>' + esc(r.k.title) + '</h3><div class="ivf-sr-strip">' + r.items.map(cardHtml).join('') + '</div></section>';
      }).join('') : '<div class="ivf-sr-msg">No results</div>';
      setRows();
    });
  }
  function setRows() {
    rows = [[root.querySelector('input'), root.querySelector('.ivf-sr-filter')]];
    Array.prototype.forEach.call(root.querySelectorAll('.ivf-sr-strip'), function (s) { rows.push(Array.prototype.slice.call(s.children)); });
    last = rows.map(function () { return 0; });
  }
  function focusAt(r, i) {
    var row = rows[r]; if (!row || !row.length) return;
    i = Math.max(0, Math.min(i, row.length - 1));
    var el = row[i];
    el.focus({ preventScroll: true });
    last[r] = i;
    var sc = root.querySelector('.ivf-sr-scroll');
    if (r === 0) { sc.scrollTop = 0; return; }
    var sec = el.closest('.ivf-sr-row'), box = sc.getBoundingClientRect(), rb = sec.getBoundingClientRect();
    if (rb.bottom > box.bottom - 8) sc.scrollTop += rb.bottom - box.bottom + 24;
    else if (rb.top < box.top + 8) sc.scrollTop -= box.top - rb.top + 8;
    var strip = el.closest('.ivf-sr-strip'), sr = strip.getBoundingClientRect(), er = el.getBoundingClientRect(), pad = sr.width * 0.05;
    if (er.left < sr.left + pad) strip.scrollLeft -= (sr.left + pad - er.left);
    else if (er.right > sr.right - pad) strip.scrollLeft += (er.right - sr.right + pad);
  }

  function openFilter() {
    var el = document.createElement('div');
    el.className = 'ivf-sr-dlg';
    function draw() {
      el.innerHTML = '<div class="ivf-sr-dbox"><div class="ivf-sr-dtitle">Search for</div>' + KINDS.map(function (k) {
        return '<button type="button" class="ivf-sr-opt" data-t="' + k.type + '"><span class="material-icons" aria-hidden="true">' + (enabled[k.type] ? 'check_box' : 'check_box_outline_blank') + '</span>' + k.title + '</button>';
      }).join('') + '</div>';
    }
    draw();
    el.addEventListener('click', function (e) {
      if (e.target === el) { closeFilter(); return; }
      var o = e.target.closest('.ivf-sr-opt'); if (!o) return;
      var t = o.getAttribute('data-t'); enabled[t] = !enabled[t];
      try { localStorage.setItem(TYPES_KEY, JSON.stringify(enabled)); } catch (x) {}
      draw();
      var again = el.querySelector('.ivf-sr-opt[data-t="' + t + '"]'); if (again) again.focus();
      query = ''; // search again with the new kinds when the list closes
    });
    document.body.appendChild(el);
    dialog = el;
    el.querySelector('.ivf-sr-opt').focus();
  }
  function closeFilter() {
    if (!dialog) return;
    dialog.remove(); dialog = null;
    root.querySelector('.ivf-sr-filter').focus();
    run();
  }

  window.addEventListener('keydown', function (e) {
    if (!root || root.classList.contains('ivf-off')) return;
    var k = e.key || '', kc = e.keyCode;
    var back = k === 'Escape' || k === 'GoBack' || k === 'BrowserBack' || (kc === 10009 || kc === 461) || kc === 27;
    var dir = k === 'ArrowLeft' || kc === 37 ? 'l' : k === 'ArrowRight' || kc === 39 ? 'r' : k === 'ArrowUp' || kc === 38 ? 'u' : k === 'ArrowDown' || kc === 40 ? 'd' : '';
    if (dialog) {
      if (back) { e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation(); closeFilter(); return; }
      if (dir === 'u' || dir === 'd') {
        e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
        var opts = Array.prototype.slice.call(dialog.querySelectorAll('.ivf-sr-opt')), i = opts.indexOf(document.activeElement);
        var n = opts[i + (dir === 'd' ? 1 : -1)]; if (n) n.focus();
      }
      return;
    }
    // web: Esc leaves Search like the film / show pages (it did nothing once a result had been opened and closed -
    // beta round 6, t14); while typing in the box it stays (the TV handles Back itself)
    if (back && !TV) {
      var ae = document.activeElement;
      if (ae && ae.tagName === 'INPUT' && ae.value) return;
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      history.back();
      return;
    }
    if (!dir) return;
    var a = document.activeElement, r = -1, idx = -1;
    rows.forEach(function (row, ri) { var j = row.indexOf(a); if (j >= 0) { r = ri; idx = j; } });
    // typing: Left/Right move the caret inside the box
    if (a && a.tagName === 'INPUT' && (dir === 'l' && a.selectionStart > 0 || dir === 'r' && a.selectionEnd < a.value.length)) return;
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (r < 0) { focusAt(0, 0); return; }
    if (dir === 'l') focusAt(r, idx - 1);
    else if (dir === 'r') focusAt(r, idx + 1);
    else if (dir === 'u' && r > 0) focusAt(r - 1, r - 1 === 0 ? 0 : last[r - 1]);
    else if (dir === 'd' && r < rows.length - 1) { if (a && a.blur && a.tagName === 'INPUT') a.blur(); focusAt(r + 1, last[r + 1]); }
  }, true);

  function update() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    var on = onSearchRoute();
    if (!on) {
      if (root && !root.classList.contains('ivf-off')) { root.classList.add('ivf-off'); document.documentElement.classList.remove('ivf-search-on'); if (dialog) { dialog.remove(); dialog = null; } }
      return;
    }
    if (!root) build();
    if (!root.classList.contains('ivf-off')) return;
    root.classList.remove('ivf-off');
    placeBelowHeader(); setTimeout(placeBelowHeader, 300);
    document.documentElement.classList.add('ivf-search-on');
    if (!rows.length) setRows();
    // coming back from a result: the item you opened is selected again; otherwise the search box
    var had = false;
    rows.forEach(function (row, ri) { if (ri > 0 && row[last[ri]] && document.contains(row[last[ri]]) && !had && root._lastRow === ri) { focusAt(ri, last[ri]); had = true; } });
    if (!had) focusAt(0, 0);
  }
  // remember which row the opened result was in
  document.addEventListener('click', function (e) {
    if (!root || !e.target.closest) return;
    var c = e.target.closest('#' + ROOT_ID + ' .ivf-sr-card'); if (!c) return;
    rows.forEach(function (row, ri) { var j = row.indexOf(c); if (j >= 0) { root._lastRow = ri; last[ri] = j; } });
  }, true);
  window.addEventListener('hashchange', function () { setTimeout(update, 0); });
  document.addEventListener('viewshow', function () { setTimeout(update, 0); });
  // Jellyfin's own search page grabs the focus when it appears: take it back
  document.addEventListener('focusin', function (e) {
    if (!TV) return; // web: the top bar must stay usable
    if (!root || root.classList.contains('ivf-off') || dialog) return;
    if (!root.contains(e.target)) setTimeout(function () { if (!root.contains(document.activeElement) && !dialog) focusAt(0, 0); }, 0);
  }, true);
  update();
})();

} catch (e) { console.error('IvanaFin script search-page failed:', e); } })();
/* IvanaFin - series-page */
(function() { try {
// IvanaFin parity (8): TV show page mirrors IvanaFin's season page (Android TV app):
//   centred logo -> [Season N v] [> Play next episode] (equal pills, centred) -> season overview
//   -> 4-column episode grid (16:9 picture, "N. Title", full overview, then "46m  * 6.5  Ends at 14:31" - Prime order)
//   -> Cast & Crew (round photos, like the film page).
// Since 2026-11-12 the page is IvanaFin's OWN full-screen layer (#ivf-show), like movie-page.js: it no
// longer waits for, hides or rearranges Jellyfin's details page (that page still loads underneath but
// is never seen and nothing here depends on it). Sizes use the app's dp scale (1dp = 100vw/960).
// Episodes play on click via jellyfin-web's own "resume" item action (emby-itemscontainer).
// Remote: own row/grid navigation (Left/Right along a row, Up/Down between rows, Up from the top row
// of episodes = Season button, Down from the buttons = episode 1); Back = Jellyfin's own Back.
(function () {
  'use strict';
  // Shared nav hook (see movie-page.js): 'ivf-nav' fires the moment the address changes
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
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var DF = TV ? 1 : 0.72; // Cast & Crew uses the film page's (web: denser) sizes
  var STYLE_ID = 'ivf-series-style';
  var ROOT_ID = 'ivf-show';
  var COLS = 4;
  var root = null;     // the layer
  var state = null;    // the built page: { id, series, seasons, nextUp, allEpisodes, seasonId, panel, lastEpIdx, lastKind, lastRow, rowIdx, scroll }
  var shownId = null;  // id of the show the layer is showing (null = layer off)

  function dd(n) { return 'calc(var(--ivf-dp) * ' + n + ')'; }
  function d(n) { return dd(Math.round(n * DF * 100) / 100); }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var R = '#' + ROOT_ID;
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      ':root{--ivf-dp:calc(100vw / 960)}',
      // Jellyfin's page underneath is never seen: no loading circle over ours either
      'html.ivf-show-on .docspinner{display:none !important}',
      // ...and not laid out at all (its rows measuring themselves cost time on the Samsung)
      'html.ivf-show-on #itemDetailPage{display:none !important}',
      TV ? 'html.ivf-show-on .skinHeader{display:none !important}'
        // Web: the layer runs to the very top and Jellyfin's top bar floats over it, fading into the
        // backdrop (same as the film page)
        : 'html.ivf-show-on,html.ivf-show-on body{overflow:hidden !important}html.ivf-show-on .backdropContainer{display:none !important}html.ivf-show-on .backgroundContainer{background:#000 !important}' +
          'html.ivf-show-on .skinHeader,html.ivf-show-on header.MuiAppBar-root{z-index:860 !important;backdrop-filter:none !important;-webkit-backdrop-filter:none !important;' +
          'background:transparent !important;border-bottom:0 !important;box-shadow:none !important}' +
          'html.ivf-show-on .skinHeader::before,html.ivf-show-on .skinHeader::after{display:none !important}' +
          // scrolled content fades out just under the see-through bar
          R + ' .ivf-tvs-scroll{-webkit-mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-tvs-top,0px) - 6px),#000 calc(var(--ivf-tvs-top,0px) + 18px));' +
          'mask-image:linear-gradient(to bottom,transparent calc(var(--ivf-tvs-top,0px) - 6px),#000 calc(var(--ivf-tvs-top,0px) + 18px))}',
      R + '{position:fixed;left:0;right:0;top:0;bottom:0;z-index:850;background:#000;color:#d1d5db;overflow:hidden}',
      R + '.ivf-off{display:none}',
      R + ' .ivf-tvs-page{position:absolute;left:0;right:0;top:0;bottom:0}',
      R + ' .ivf-tvs-scroll{position:relative;height:100%;overflow-y:auto;overflow-x:hidden;box-sizing:border-box;',
      'padding:' + (TV ? dd(19) : 'max(' + dd(19) + ',var(--ivf-tvs-top,0px))') + ' ' + dd(40) + ' ' + dd(48) + ' ' + dd(48) + '}',
      TV ? R + ' .ivf-tvs-scroll{scrollbar-width:none}' + R + ' .ivf-tvs-scroll::-webkit-scrollbar{display:none}' : '',
      '@keyframes ivfShowIn{from{opacity:0}to{opacity:1}}',
      R + ' .ivf-tvs-in{animation:ivfShowIn .25s ease both}',
      '.ivf-hide{display:none !important}',
      // Backdrop (2026-11-13, user: "the film page treatment"): the whole screen, darkened towards the
      // bottom where the logo and text sit - the film page's gradient (movie-page.js .ivf-mv-bd)
      '.ivf-backdrop{position:absolute;inset:0;z-index:0;pointer-events:none}',
      '.ivf-bd-fit{position:absolute;inset:0}',
      '.ivf-bd-img{position:absolute;inset:0;background:transparent center top/cover no-repeat}',
      // (2026-11-14 layout: logo at the top, episodes from about a third down - the picture shows clearly behind
      // the logo and darkens where the episodes start, so their text reads on any picture; same as Android)
      '.ivf-backdrop::after{content:"";position:absolute;inset:0;background-image:linear-gradient(to bottom,rgba(0,0,0,.1) 0%,rgba(0,0,0,.3) 25%,rgba(0,0,0,.72) 45%,rgba(0,0,0,.9) 100%)}',
      // scrolled down to the episodes: the picture darkens a little so their text reads easily (user
      // 2026-11-13; the film page keeps no extra darkening - the user's earlier choice)
      '.ivf-backdrop::before{content:"";position:absolute;inset:0;z-index:1;background:#000;opacity:0;transition:opacity .8s cubic-bezier(.4,0,.2,1)}',
      // (.55 since round 5: episode text was still hard to read on bright pictures - Jackass, Batman Beyond)
      '.ivf-tvs-page.ivf-dim .ivf-backdrop::before{opacity:.55}',
      // The header (user 2026-11-14: back to the old layout): logo at the top, info line, the Season / Play Next
      // Episode buttons under it - the episodes follow straight below on the first screen
      '.ivf-tvs-head{display:flex;flex-direction:column;align-items:center;text-align:center;box-sizing:border-box;padding:0 ' + d(32) + '}',
      '.ivf-tvs-quick{margin-top:' + d(3) + ';font-size:' + d(12) + ';font-weight:500;line-height:' + d(17) + ';letter-spacing:' + d(0.5) + '}',
      '.ivf-tvs-quick .dot{margin:0 ' + d(8) + ';font-size:' + d(10) + ';vertical-align:' + d(2) + '}',
      '.ivf-tvs-quick .star{color:#f5c518}',
      '.ivf-tvs-ov{align-self:stretch;text-align:left;margin:' + d(10) + ' 0 0;font-size:' + d(12) + ';line-height:' + d(16) + ';letter-spacing:' + d(0.4) + ';color:#d1d5db;',
      'overflow:hidden;display:-webkit-box;-webkit-line-clamp:5;-webkit-box-orient:vertical}',
      // episode / cast text readable over bright parts of the picture (round-4 beta: Masters of the Air, TNG)
      '#ivf-show .ivf-ep,#ivf-show .ivf-tvs-person,#ivf-show .ivf-series{text-shadow:0 1px 3px rgba(0,0,0,.9),0 0 14px rgba(0,0,0,.6)}',
      // Panel
      '.ivf-series{position:relative;z-index:1;display:flex;flex-direction:column;gap:' + dd(12) + ';padding-top:' + dd(24) + ';width:100%;box-sizing:border-box}',
      '.ivf-series .ivf-items{display:flex !important;flex-direction:column !important;gap:' + dd(12) + ';width:100% !important;flex-wrap:nowrap !important}',
      '.ivf-logo{display:flex;justify-content:center}',
      '.ivf-logo img{display:block;height:' + dd(60) + ';max-width:' + dd(320) + ';object-fit:contain}',
      '.ivf-logo h1{margin:0;font-size:' + dd(28) + ';font-weight:700;color:#fff;text-align:center}',
      '.ivf-bar{display:flex;justify-content:center;align-items:center;gap:' + dd(16) + ';padding:' + dd(8) + ' 0}',
      // androidx.tv Button look: dark pill, white + slightly larger when focused (the old show page buttons)
      '.ivf-pill{width:' + dd(220) + ';display:inline-flex;align-items:center;justify-content:center;gap:' + dd(6) + ';',
      'padding:' + dd(10) + ' ' + dd(16) + ';min-height:' + dd(44) + ';box-sizing:border-box;border:0;border-radius:999px;cursor:pointer;font:inherit;',
      'font-size:' + dd(16) + ';font-weight:500;line-height:' + dd(24) + ';letter-spacing:' + dd(0.15) + ';white-space:nowrap;',
      'background:rgba(14,14,14,.9) !important;color:#d1d5db !important;transition:transform .12s,background .12s,color .12s}',
      '.ivf-pill:hover,.ivf-pill:focus{background:#d1d5db !important;color:#131414 !important;transform:scale(1.1);outline:none}',
      '.ivf-pill .material-icons{font-size:' + dd(22) + ';color:inherit !important}',
      '.ivf-pill span{color:inherit !important}',
      '.ivf-season-overview{margin:' + dd(8) + ' 0 0;font-size:' + dd(14) + ';line-height:1.45;color:#d1d5db}',
      // Episode grid: 4 columns, 16dp gap, 28dp between rows
      '.ivf-ep-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));column-gap:' + dd(16) + ';row-gap:' + dd(28) + ';padding-top:' + dd(8) + '}',
      '.ivf-ep-meta{margin-top:auto}',
      '.ivf-ep{display:flex;flex-direction:column;gap:' + dd(6) + ';height:100%;width:100%;text-align:left;background:none !important;border:0;padding:0;color:inherit;font:inherit;cursor:pointer}',
      '.ivf-ep:focus{outline:none}',
      // No overflow:hidden and the picture stops at the border's inner edge (padding-box): a scaled,
      // rounded box with overflow:hidden is clipped with a coarse mask in Firefox, which let the
      // picture's square corners show past the white outline as small triangles
      '.ivf-ep-img{position:relative;width:100%;padding-top:56.25%;border-radius:' + dd(4) + ';background:#151515 center/cover no-repeat;background-clip:padding-box;',
      'border:' + dd(1.5) + ' solid transparent;box-sizing:border-box;transition:transform .12s,border-color .12s}',
      '.ivf-ep:hover .ivf-ep-img,.ivf-ep:focus .ivf-ep-img{transform:scale(1.06);border-color:#fff}',
      '.ivf-ep-progress{position:absolute;left:0;right:0;bottom:0;height:' + dd(4) + ';background:rgba(255,255,255,.25);',
      'border-radius:0 0 ' + dd(2.5) + ' ' + dd(2.5) + ';overflow:hidden}',
      '.ivf-ep-progress div{height:100%;background:#d1d5db}',
      '.ivf-ep-title{letter-spacing:' + dd(0.1) + ';margin-top:' + dd(4) + ';font-size:' + dd(14) + ';font-weight:600;line-height:1.3;color:#d1d5db}',
      '.ivf-ep-meta{font-weight:400;letter-spacing:' + dd(0.4) + ';display:flex;flex-wrap:wrap;align-items:center;column-gap:' + dd(14) + ';row-gap:' + dd(2) + ';font-size:' + dd(12) + ';color:#d1d5db}',
      '.ivf-ep-meta > span{white-space:nowrap}','.ivf-ep-overview + .ivf-ep-meta{margin-top:' + dd(4) + '}',
      '.ivf-ep-meta .material-icons{font-size:' + dd(14) + ';color:#00A4DC;margin-right:' + dd(4) + ';vertical-align:middle}',
      '.ivf-ep-overview{font-weight:400;letter-spacing:' + dd(0.4) + ';font-size:' + dd(12) + ';line-height:' + dd(16) + ';color:#9ca3af;overflow-wrap:anywhere;padding-right:' + dd(4) + ';box-sizing:border-box}' /* round 5: lines ran past the card edge */,
      // Cast & Crew (film page's PersonCard: 108dp circle, name 14sp semi-bold, role 12sp, one line each)
      '.ivf-tvs-cast{margin-top:' + dd(24) + '}',
      '.ivf-tvs-cast h3{margin:0 0 ' + d(8) + ';font-size:' + d(22) + ';font-weight:400;line-height:' + d(28) + ';color:#d1d5db}',
      '.ivf-tvs-strip{display:flex;gap:' + d(16) + ';overflow-x:auto;overflow-y:hidden;scrollbar-width:none;padding:' + d(8) + ' ' + d(8) + ';margin:0 -' + d(8) + ';align-items:flex-start}',
      '.ivf-tvs-strip::-webkit-scrollbar{display:none}',
      '.ivf-tvs-person{flex:none;width:' + d(108) + ';display:flex;flex-direction:column;align-items:center;background:none;border:0;padding:0;color:#d1d5db;font:inherit;cursor:pointer;outline:none}',
      '.ivf-tvs-face{width:100%;padding-top:100%;border-radius:50%;background:#1c1c1c center/cover no-repeat;position:relative;box-shadow:0 0 0 ' + d(1.5) + ' transparent;transition:transform .12s}',
      '.ivf-tvs-face i{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;font-style:normal;font-size:' + d(30) + ';font-weight:600;opacity:.6}',
      '.ivf-tvs-person:focus .ivf-tvs-face{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-tvs-name{width:100%;margin-top:' + d(6) + ';font-size:' + d(14) + ';font-weight:600;line-height:' + d(18) + ';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      '.ivf-tvs-role{width:100%;font-weight:400;font-size:' + d(12) + ';line-height:' + d(16) + ';letter-spacing:' + d(0.4) + ';text-align:center;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
      // Star Wars rows (per season): planets round on black, characters from the top of the picture,
      // starships in a wide frame, In Story Order as posters; the era line under the info line (gold, as on films)
      
      '.ivf-tvs-planet .ivf-tvs-face{background-color:#000}',
      '.ivf-tvs-char .ivf-tvs-face{background-position:center top}',
      // character names are never cut short: they wrap onto a second line (species only in the card)
      '.ivf-tvs-char .ivf-tvs-name{white-space:normal;overflow:visible;text-overflow:clip}',
      '.ivf-tvs-wide{width:' + d(176) + '}',
      '.ivf-tvs-wide .ivf-tvs-face{padding-top:56.25%;border-radius:' + d(6) + ';background-color:#050505;background-size:contain}',
      '.ivf-tvs-poster{width:' + d(124) + '}',
      '.ivf-tvs-poster .ivf-tvs-face{padding-top:150%;border-radius:' + d(4) + '}',
      '.ivf-tvs-poster:focus .ivf-tvs-face{transform:scale(1.06)}',
      // Season picker dialog (like IvanaFin's DialogPopup)
      '.ivf-dialog{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center}',
      '.ivf-dialog-box{min-width:' + dd(300) + ';max-height:80vh;overflow:auto;padding:' + dd(16) + ';border-radius:' + dd(16) + ';background:#000;',
      'border:1px solid rgba(255,255,255,.15);display:flex;flex-direction:column;gap:' + dd(4) + '}',
      '.ivf-dialog-title{font-size:' + dd(18) + ';font-weight:600;padding:' + dd(4) + ' ' + dd(12) + ' ' + dd(10) + ';color:#d1d5db}',
      '.ivf-dialog-opt{display:flex;align-items:center;gap:' + dd(10) + ';padding:' + dd(10) + ' ' + dd(12) + ';border:0;border-radius:' + dd(8) + ';',
      'background:transparent !important;color:#d1d5db !important;font:inherit;font-size:' + dd(15) + ';text-align:left;cursor:pointer}',
      '.ivf-dialog-opt:hover,.ivf-dialog-opt:focus{background:#d1d5db !important;color:#131414 !important;outline:none}',
      '.ivf-dialog-opt .material-icons{font-size:' + dd(18) + ';width:' + dd(18) + ';color:inherit !important}'
    ].join('') + (TV ? '' : [
      // Web only (not the Samsung app): Season / Play Next Episode pills about two-thirds the TV size
      '.ivf-bar{gap:' + dd(12) + '}',
      '.ivf-pill{width:' + dd(144) + ';min-height:' + dd(30) + ';padding:' + dd(6) + ' ' + dd(10) + ';',
      'gap:' + dd(4) + ';font-size:' + dd(11) + ';line-height:' + dd(16) + '}',
      '.ivf-pill .material-icons{font-size:' + dd(15) + '}',
      // Only one pill highlighted at a time: a mouse click's leftover focus doesn't count, and while
      // the mouse is over the buttons, only the one under it is highlighted
      '.ivf-pill:focus:not(:focus-visible):not(:hover),.ivf-bar:hover .ivf-pill:focus:not(:hover)',
      '{background:rgba(14,14,14,.9) !important;color:#d1d5db !important;transform:none}',
      // The selected episode picture doesn't grow on web (just the white outline, like library posters):
      // Firefox draws a scaled rounded box in pieces and showed hairline seams at its corners
      '.ivf-ep:hover .ivf-ep-img,.ivf-ep:focus .ivf-ep-img{transform:none}',
      '.ivf-ep:focus:not(:focus-visible):not(:hover) .ivf-ep-img{border-color:transparent}',
      '.ivf-tvs-person:hover .ivf-tvs-face{box-shadow:0 0 0 ' + d(2) + ' #fff;transform:scale(1.1)}',
      '.ivf-tvs-person:focus:not(:focus-visible):not(:hover) .ivf-tvs-face{box-shadow:none;transform:none}'
    ].join(''));
    document.head.appendChild(s);
  }

  function esc(t) {
    return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function uid() { return ApiClient.getCurrentUserId(); }
  function signedIn() { return typeof ApiClient !== 'undefined' && ApiClient.getCurrentUserId && !!ApiClient.getCurrentUserId(); }
  function detailId() {
    var m = /^#\/details\?(?:.*&)?id=([0-9a-f]{32})/i.exec(location.hash || '');
    return m ? m[1].toLowerCase() : null;
  }

  function fmtDuration(min) {
    return min >= 60 ? Math.floor(min / 60) + 'h' + (min % 60 ? ' ' + (min % 60) + 'm' : '') : min + 'm'; // Android: "1h", not "1h 0m"
  }
  function fmtTime(dt) {
    try { return dt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); } catch (e) { return dt.getHours() + ':' + ('0' + dt.getMinutes()).slice(-2); }
  }
  function seasonLabel(s) {
    return s.Name || (s.IndexNumber === 0 ? 'Specials' : 'Season ' + s.IndexNumber);
  }
  function resumeTicks(ep) {
    var ud = ep.UserData || {};
    return ud.Played ? 0 : (ud.PlaybackPositionTicks || 0);
  }

  // Attributes jellyfin-web's itemShortcuts needs to play an item on click
  function playAttrs(ep, serverId, cls) {
    return 'class="itemAction ' + cls + '" data-action="resume" data-id="' + ep.Id + '" data-serverid="' + esc(serverId) +
      '" data-type="Episode" data-mediatype="Video" data-isfolder="false" data-positionticks="' + resumeTicks(ep) + '"';
  }

  function detailsLine(ep) {
    var parts = [];
    var mins = ep.RunTimeTicks ? Math.round(ep.RunTimeTicks / 600000000) : 0;
    if (mins) parts.push('<span>' + fmtDuration(mins) + '</span>');
    if (ep.CommunityRating) parts.push('<span><span class="material-icons star" aria-hidden="true"></span>' + ep.CommunityRating.toFixed(1) + '</span>');
    if (ep.RunTimeTicks) {
      var remaining = (ep.RunTimeTicks - resumeTicks(ep)) / 10000; // ms
      parts.push('<span>Ends at ' + esc(fmtTime(new Date(Date.now() + remaining))) + '</span>');
    }
    return parts.length ? '<div class="ivf-ep-meta">' + parts.join('') + '</div>' : '';
  }

  // Picture addresses (shared by the page and the background preload, so the preload is reused)
  function episodeImgUrl(ep, series) {
    return ep.ImageTags && ep.ImageTags.Primary
      ? ApiClient.getScaledImageUrl(ep.Id, { type: 'Primary', fillWidth: 640, quality: 90, tag: ep.ImageTags.Primary })
      : (series.BackdropImageTags && series.BackdropImageTags.length
        ? ApiClient.getScaledImageUrl(series.Id, { type: 'Backdrop', fillWidth: 640, quality: 90, tag: series.BackdropImageTags[0] }) : '');
  }
  function backdropUrl(series) {
    return series.BackdropImageTags && series.BackdropImageTags.length
      ? ApiClient.getScaledImageUrl(series.Id, { type: 'Backdrop', maxWidth: 1920, quality: 85, tag: series.BackdropImageTags[0] }) : '';
  }
  function logoUrl(series) {
    return series.ImageTags && series.ImageTags.Logo
      ? ApiClient.getScaledImageUrl(series.Id, { type: 'Logo', maxWidth: 900, quality: 90, tag: series.ImageTags.Logo }) : '';
  }

  function episodeHtml(ep, serverId, series) {
    var ud = ep.UserData || {};
    var img = episodeImgUrl(ep, series);
    var pct = !ud.Played && ud.PlayedPercentage ? Math.max(2, Math.min(100, ud.PlayedPercentage)) : 0;
    var title = (ep.IndexNumber != null ? ep.IndexNumber + '. ' : '') + (ep.Name || '');
    return '<button type="button" ' + playAttrs(ep, serverId, 'ivf-ep') + '>' +
      '<div class="ivf-ep-img"' + (img ? ' style="background-image:url(\'' + img + '\')"' : '') + '>' +
      (pct ? '<div class="ivf-ep-progress"><div style="width:' + pct + '%"></div></div>' : '') +
      '</div>' +
      '<div class="ivf-ep-title">' + esc(title) + '</div>' +
      (ep.Overview ? '<div class="ivf-ep-overview">' + esc(ep.Overview) + '</div>' : '') +
      detailsLine(ep) +
      '</button>';
  }

  function episodesOf(all, seasonId) {
    return all.filter(function (e) { return e.SeasonId === seasonId; });
  }

  // Draws a season from the show's already-loaded episode list
  function renderSeason(st, seasonId, focusFirst) {
    st.seasonId = seasonId;
    swSeriesNow = st.series;
    var season = st.seasons.filter(function (s) { return s.Id === seasonId; })[0] || {};
    var label = st.panel.querySelector('.ivf-season-label');
    if (label) label.textContent = seasonLabel(season);
    var ov = st.panel.querySelector('.ivf-season-overview');
    ov.textContent = season.Overview || '';
    ov.classList.toggle('ivf-hide', !season.Overview);
    var grid = st.panel.querySelector('.ivf-ep-grid');
    grid.innerHTML = episodesOf(st.allEpisodes || [], seasonId).map(function (ep) { return episodeHtml(ep, ApiClient.serverId(), st.series); }).join('');
    // Star Wars: this season's rows + era (redrawn only when the season changes - not on a progress refresh)
    var era = st.panel.querySelector('.ivf-tvs-era'), rows = st.panel.querySelector('.ivf-tvs-swrows');
    if (rows && st.swSeasonId !== seasonId) {
      st.swSeasonId = seasonId;
      ['planet', 'char', 'ship', 'story'].forEach(function (k) { delete st.rowIdx[k]; });
      rows.innerHTML = swRowsHtml(seasonId);
      swFillStory(st);
      var sy = swSeason(seasonId);
      era.innerHTML = sy && sy.year ? esc(sy.year) + (quickLine(st.series) ? '<span class="dot">●</span>' : '') : '';
    }
    if (focusFirst) { var f = grid.querySelector('.ivf-ep'); if (f) focusEl(f); }
  }

  // ---- Loading a show's data: everything in parallel, cached briefly, can start before the click --
  var CACHE_MS = 2 * 60 * 1000;
  var dataCache = {}; // seriesId -> { t, p }
  function loadSeriesData(seriesId, fresh) {
    var c = dataCache[seriesId];
    if (!fresh && c && Date.now() - c.t < CACHE_MS) return c.p;
    var userId = uid();
    var p = Promise.all([
      ApiClient.getItem(userId, seriesId),
      ApiClient.getSeasons(seriesId, { userId: userId, Fields: 'Overview' }).then(function (r) { return (r && r.Items) || []; }),
      ApiClient.getNextUpEpisodes({ SeriesId: seriesId, UserId: userId, Limit: 1, EnableUserData: true, DisableFirstEpisode: false })
        .then(function (r) { return ((r && r.Items) || [])[0] || null; })['catch'](function () { return null; }),
      ApiClient.getEpisodes(seriesId, { userId: userId, Fields: 'Overview', EnableUserData: true })
        .then(function (r) { return (r && r.Items) || []; })['catch'](function () { return []; })
    ]).then(function (res) {
      var dt = { series: res[0], seasons: res[1], nextUp: res[2], allEpisodes: res[3] };
      if (dt.series && dt.series.Type === 'Series' && dt.seasons.length) {
        dt.startSeason = startSeasonId(dt.seasons, dt.nextUp);
        // No next-up yet (never watched): first episode of the start season
        if (!dt.nextUp) dt.nextUp = episodesOf(dt.allEpisodes, dt.startSeason)[0] || null;
      }
      return dt;
    });
    p['catch'](function () { delete dataCache[seriesId]; });
    dataCache[seriesId] = { t: Date.now(), p: p };
    return p;
  }

  // Warm the browser's image cache for the first screen (logo, backdrop, first row of episodes)
  function preloadPictures(dt) {
    if (!dt || !dt.series || dt.series.Type !== 'Series') return;
    var urls = [logoUrl(dt.series), backdropUrl(dt.series)];
    episodesOf(dt.allEpisodes || [], dt.startSeason).slice(0, 4).forEach(function (ep) { urls.push(episodeImgUrl(ep, dt.series)); });
    urls.forEach(function (u) { if (u) { var im = new Image(); im.src = u; } });
  }
  function prefetch(seriesId) {
    if (!signedIn()) return;
    loadSeriesData(seriesId).then(preloadPictures, function () {});
  }

  // IvanaFin resolveStartSeason: next-up episode's season, else the first regular season
  function startSeasonId(seasons, nextUp) {
    if (nextUp && nextUp.SeasonId && seasons.some(function (s) { return s.Id === nextUp.SeasonId; })) return nextUp.SeasonId;
    var regular = seasons.filter(function (s) { return s.IndexNumber > 0; })[0];
    return (regular || seasons[0]).Id;
  }

  // Season picker: centred list dialog with the show's name as title (IvanaFin DialogPopup)
  function openSeasonDialog(st) {
    var dlg = document.createElement('div');
    dlg.className = 'ivf-dialog';
    dlg.innerHTML = '<div class="ivf-dialog-box" role="dialog"><div class="ivf-dialog-title">' + esc(st.series.Name) + '</div>' +
      // Specials (season 0) at the bottom of the list, regular seasons in order above
      st.seasons.filter(function (s) { return s.IndexNumber !== 0; })
        .concat(st.seasons.filter(function (s) { return s.IndexNumber === 0; })).map(function (s) {
        var cur = s.Id === st.seasonId;
        return '<button type="button" class="ivf-dialog-opt" data-season="' + s.Id + '"><span class="material-icons ' + (cur ? 'check' : '') + '" aria-hidden="true">' +
          '</span><span>' + esc(seasonLabel(s)) + '</span></button>';
      }).join('') + '</div>';
    var opener = document.activeElement;
    function close() {
      window.removeEventListener('keydown', onKey, true);
      dlg.remove();
      if (opener && opener.focus) opener.focus();
    }
    function onKey(e) {
      var k = e.key || '';
      if (k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || (e.keyCode === 10009 || e.keyCode === 461) || e.keyCode === 27 || e.keyCode === 8) {
        e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        close();
      } else if (k === 'ArrowDown' || k === 'ArrowUp' || e.keyCode === 40 || e.keyCode === 38) {
        // keep focus inside the dialog
        var opts = Array.prototype.slice.call(dlg.querySelectorAll('.ivf-dialog-opt'));
        var i = opts.indexOf(document.activeElement);
        var down = k === 'ArrowDown' || e.keyCode === 40;
        var n = i < 0 ? 0 : Math.max(0, Math.min(opts.length - 1, i + (down ? 1 : -1)));
        e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
        opts[n].focus();
      } else if (k === 'ArrowLeft' || k === 'ArrowRight' || e.keyCode === 37 || e.keyCode === 39) {
        e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
      }
    }
    dlg.addEventListener('click', function (e) {
      var o = e.target.closest('.ivf-dialog-opt');
      e.preventDefault(); e.stopPropagation();
      if (!o) { if (e.target === dlg) close(); return; }
      var id = o.getAttribute('data-season');
      window.removeEventListener('keydown', onKey, true);
      dlg.remove();
      // Web and TV: the page stays where it is (user 2026-11-19: it jumped down to the episodes) -
      // the Season button keeps the focus, no scroll; Down then goes on to episode 1.
      if (id !== st.seasonId) {
        st.lastEpIdx = 0; st.lastKind = 'season';
        renderSeason(st, id, false);
      }
      if (opener && opener.focus) opener.focus({ preventScroll: true });
    });
    window.addEventListener('keydown', onKey, true);
    document.body.appendChild(dlg);
    var cur = dlg.querySelector('.check');
    (cur ? cur.parentNode : dlg.querySelector('.ivf-dialog-opt')).focus();
  }

  function logoHtml(series) {
    var url = logoUrl(series);
    if (url) return '<div class="ivf-logo"><img src="' + url + '" alt="' + esc(series.Name) + '"></div>';
    return '<div class="ivf-logo"><h1>' + esc(series.Name) + '</h1></div>';
  }

  // the info line under the logo, like the Android app's: year · age rating · ★ rating
  function quickLine(s) {
    var bits = [];
    if (s.ProductionYear) bits.push(String(s.ProductionYear));
    if (s.OfficialRating) bits.push(esc(s.OfficialRating));
    if (s.CommunityRating) bits.push(s.CommunityRating.toFixed(1) + '<span class="star">★</span>');
    return bits.join('<span class="dot">●</span>');
  }
  function castHtml(series) {
    // one card per person: several roles (Lauren Tom x3 in Batman Beyond) are joined into one (beta round 6)
    var people = (function (list) { var by = {}, out = []; list.forEach(function (p) { var k = p.Id || p.Name; if (by[k]) { if (p.Role && (by[k].Role || '').split(' / ').indexOf(p.Role) < 0) by[k].Role = by[k].Role ? by[k].Role + ' / ' + p.Role : p.Role; return; } by[k] = Object.assign({}, p); out.push(by[k]); }); return out; })(series.People || []).slice(0, 40);
    if (!people.length) return '';
    return '<section class="ivf-tvs-cast" data-row="cast"><h3>Cast &amp; Crew</h3><div class="ivf-tvs-strip">' + people.map(function (p) {
      var ini = (p.Name || '?').split(/\s+/).map(function (w) { return w.charAt(0); }).slice(0, 2).join('');
      var pic = p.PrimaryImageTag ? ApiClient.getUrl('/Items/' + p.Id + '/Images/Primary', { maxHeight: 400, tag: p.PrimaryImageTag }) : '';
      return '<button type="button" class="ivf-tvs-person" data-person="' + p.Id + '" title="' + esc(p.Name + (p.Role ? ' - ' + p.Role : '')) + '"><div class="ivf-tvs-face"' +
        (pic ? ' style="background-image:url(\'' + pic + '\')"' : '') + '>' + (pic ? '' : '<i>' + esc(ini) + '</i>') + '</div>' +
        '<div class="ivf-tvs-name">' + esc(p.Name) + '</div><div class="ivf-tvs-role">' + esc(p.Role || p.Type || '') + '</div></button>';
    }).join('') + '</div></section>';
  }

  // ---- Star Wars shows, per season (data: sw-planets.js "seasons"; the card: sw-card.js) -------------
  // Above Cast & Crew: Featured Planets, Characters, Starships & Vehicles and In Story Order for the season
  // on screen (they change with the Season button), and its era under the info line - like the film page.
  var SW_KINDS = {
    planet: { set: 'planets', row: 'Featured Planets', sub: 'region' },
    char: { set: 'chars', row: 'Characters', sub: 'species' },
    ship: { set: 'ships', row: 'Starships & Vehicles', sub: 'type' }
  };
  // this server's season id, else (any server) the whole show by the series' TMDB id - sw-card.js IvfSw.season
  var swSeriesNow = null; // the show on screen (set by renderSeason)
  function swSeason(seasonId) { return window.IvfSw ? window.IvfSw.season(seasonId, swSeriesNow) : null; }
  function swList(seasonId, kind) {
    var D = window.IvfSwPlanets, s = swSeason(seasonId); if (!s) return [];
    var refs = kind === 'planet' ? s.planets : kind === 'ship' ? s.ships : s.chars;
    return (refs || []).map(function (r) {
      var slug = typeof r === 'string' ? r : r.id, e = D[SW_KINDS[kind].set][slug];
      return e ? Object.assign({ kind: kind, slug: slug }, e, r.as ? { name: r.as } : {}, r.image ? { image: r.image } : {}) : null;
    }).filter(Boolean);
  }
  function swEra(k) {
    return k <= -100 ? 'The High Republic' : k < -18.5 ? 'Fall of the Jedi' : k < -1 ? 'Reign of the Empire' : k < 5 ? 'Age of Rebellion' : k < 28 ? 'The New Republic' : 'Rise of the First Order';
  }
  function swRowHtml(seasonId, kind) {
    var list = swList(seasonId, kind); if (!list.length) return '';
    var K = SW_KINDS[kind];
    return '<section class="ivf-tvs-cast ivf-tvs-sw" data-row="' + kind + '"><h3>' + K.row + '</h3><div class="ivf-tvs-strip">' + list.map(function (e) {
      var pic = window.IvfSwCard ? window.IvfSwCard.imgAttr(e.image, kind === 'ship' ? 480 : 320) : ''; // sw-card.js looks up the picture's current place
      return '<button type="button" class="ivf-tvs-person ivf-tvs-' + kind + (kind === 'ship' ? ' ivf-tvs-wide' : '') + '" data-sw="' + kind + ':' + esc(e.slug) + '" title="' + esc(e.name) + '">' +
        '<div class="ivf-tvs-face"' + pic + '></div>' +
        '<div class="ivf-tvs-name">' + esc(e.name) + '</div>' + (kind === 'char' ? '' : '<div class="ivf-tvs-role">' + esc(e[K.sub]) + '</div>') + '</button>';
    }).join('') + '</div></section>';
  }
  function swRowsHtml(seasonId) {
    return swSeason(seasonId) ? swRowHtml(seasonId, 'planet') + swRowHtml(seasonId, 'char') + swRowHtml(seasonId, 'ship') + '<div class="ivf-tvs-story"></div>' : '';
  }
  // In Story Order: the titles just before and after this season on the Star Wars timeline (SwTimeline
  // provider ids, see sw-timeline.js); the show's own entry is replaced by the season's place
  // (the story-order list: sw-card.js IvfSw.timelineList - every Star Wars title on this server)
  // copies of one film (35mm, extended, novel-named edits) sit within 0.05 of each other: one entry each
  function swNeighbours(seriesId, k, list) {
    var others = list.filter(function (x) { return x.id !== seriesId; }), groups = [];
    others.forEach(function (x) { var g = groups[groups.length - 1]; if (g && x.k - g[0].k <= 0.05) g.push(x); else groups.push([x]); });
    var before = null, after = null;
    groups.forEach(function (g) { if (g[0].k <= k) before = g[0]; else if (!after) after = g[0]; });
    return { before: before, after: after };
  }
  function swStoryHtml(nb) {
    if (!nb || (!nb.before && !nb.after)) return '';
    function card(x, label) {
      var pic = x.tag ? ApiClient.getScaledImageUrl(x.id, { type: 'Primary', maxHeight: 600, quality: 90, tag: x.tag }) : '';
      return '<button type="button" class="ivf-tvs-person ivf-tvs-poster" data-go="' + x.id + '" title="' + esc(x.name) + '"><div class="ivf-tvs-face"' + (pic ? ' style="background-image:url(&quot;' + pic + '&quot;)"' : '') + '></div>' +
        '<div class="ivf-tvs-name">' + esc(x.name) + '</div><div class="ivf-tvs-role">' + label + (x.year ? ' · ' + esc(x.year) : '') + '</div></button>';
    }
    return '<section class="ivf-tvs-cast ivf-tvs-sw" data-row="story"><h3>In Story Order</h3><div class="ivf-tvs-strip">' + (nb.before ? card(nb.before, 'Before') : '') + (nb.after ? card(nb.after, 'After') : '') + '</div></section>';
  }
  function swFillStory(st) {
    var s = swSeason(st.seasonId), box = st.panel.querySelector('.ivf-tvs-story'), seasonId = st.seasonId;
    if (!s || !box) return;
    if (!window.IvfSw) return;
    window.IvfSw.timelineList().then(function (list) {
      if (st.seasonId !== seasonId || !st.panel.contains(box)) return;
      box.innerHTML = swStoryHtml(swNeighbours(st.series.Id.toLowerCase(), s.k, list));
    });
  }
  function openSw(st, card) {
    var ks = card.getAttribute('data-sw').split(':'), kind = ks[0], slug = ks[1], list = swList(st.seasonId, kind), i = 0;
    list.forEach(function (e, k) { if (e.slug === slug) i = k; });
    if (!window.IvfSwCard) return;
    window.IvfSwCard.open({ list: list, index: i, currentId: st.series.Id, onClose: function (e) {
      if (state !== st) return;
      var c = st.panel.querySelector('[data-sw="' + kind + ':' + e.slug + '"]');
      if (c) { if (TV) focusEl(c); else c.focus({ preventScroll: true }); }
    } });
  }

  function nextUpHtml(nextUp) {
    return '<button type="button" ' + playAttrs(nextUp, ApiClient.serverId(), 'ivf-pill ivf-play-next') +
      '><span class="material-icons play_arrow" aria-hidden="true"></span><span>Play Next Episode</span></button>';
  }

  // The page's content (inside the layer): backdrop + scroll box with the panel
  function build(dt) {
    var series = dt.series, seasons = dt.seasons, nextUp = dt.nextUp;
    var wrap = document.createElement('div');
    wrap.className = 'ivf-tvs-page';
    var bd = backdropUrl(series);
    // emby-itemscontainer gives the play buttons jellyfin-web's own click -> play handling
    wrap.innerHTML =
      (bd ? '<div class="ivf-backdrop"><div class="ivf-bd-fit"><div class="ivf-bd-img" style="background-image:url(\'' + bd + '\')"></div></div></div>' : '') +
      '<div class="ivf-tvs-scroll"><div class="ivf-series">' +
      '<div is="emby-itemscontainer" class="ivf-items" data-multiselect="false">' +
      // the header: logo, info line, buttons (episodes follow straight below - 2026-11-14 layout)
      '<div class="ivf-tvs-head">' + logoHtml(series) +
      // Star Wars: the season's in-universe year ("22 BBY") starts the info line, before the release year
      '<div class="ivf-tvs-quick"><span class="ivf-tvs-era"></span>' + quickLine(series) + '</div>' +
      ((seasons.length > 1 || nextUp) ? '<div class="ivf-bar">' +
      // Only one season: no Season button (nothing to choose)
      (seasons.length > 1 ? '<button type="button" class="ivf-pill ivf-season-btn"><span class="ivf-season-label"></span><span class="material-icons arrow_drop_down" aria-hidden="true"></span></button>' : '') +
      (nextUp ? nextUpHtml(nextUp) : '') +
      '</div>' : '') +
      '</div>' +
      '<p class="ivf-season-overview ivf-hide"></p>' +
      '<div class="ivf-ep-grid"></div>' +
      '</div><div class="ivf-tvs-swrows"></div>' + castHtml(series) + '</div></div>';
    var st = { id: series.Id.toLowerCase(), series: series, seasons: seasons, nextUp: nextUp, allEpisodes: dt.allEpisodes || [], page: wrap,
      panel: wrap.querySelector('.ivf-series'), scrollEl: wrap.querySelector('.ivf-tvs-scroll'), lastEpIdx: 0, rowIdx: {}, scroll: 0 };
    var logo = wrap.querySelector('.ivf-logo img');
    if (logo) logo.onerror = function () { logo.parentNode.innerHTML = '<h1>' + esc(series.Name) + '</h1>'; };
    // Remember which episode / person was last selected (Back from the player / a person returns there)
    wrap.addEventListener('focusin', function (e) {
      var ep = e.target.closest && e.target.closest('.ivf-ep');
      if (ep) { st.lastEpIdx = Array.prototype.indexOf.call(st.panel.querySelectorAll('.ivf-ep'), ep); st.lastKind = 'ep'; }
      // a card in one of the rows under the episodes (Star Wars rows, Cast & Crew): remember row + place
      var pc = e.target.closest && e.target.closest('.ivf-tvs-person'), sec = pc && pc.closest('.ivf-tvs-cast');
      if (sec) { st.lastRow = sec.getAttribute('data-row'); st.rowIdx[st.lastRow] = Array.prototype.indexOf.call(sec.querySelectorAll('.ivf-tvs-person'), pc); st.lastKind = 'row'; }
      if (e.target.classList && e.target.classList.contains('ivf-pill')) st.lastKind = e.target.classList.contains('ivf-season-btn') ? 'season' : 'next';
    });
    wrap.addEventListener('click', function (e) {
      if (e.target.closest('.ivf-season-btn')) {
        e.preventDefault(); e.stopPropagation();
        openSeasonDialog(st);
        return;
      }
      var sw = e.target.closest('[data-sw]');
      if (sw) { openSw(st, sw); return; }
      var go = e.target.closest('[data-go]');
      if (go) { location.hash = '#/details?id=' + go.getAttribute('data-go') + '&serverId=' + ApiClient.serverId(); return; }
      var pc = e.target.closest('.ivf-tvs-person[data-person]');
      if (pc) location.hash = '#/details?id=' + pc.getAttribute('data-person') + '&serverId=' + ApiClient.serverId();
    });
    renderSeason(st, dt.startSeason);
    // TV: Jellyfin's own focus code scrolls the box around whatever gets the focus (scrollTo); this
    // page does its own scrolling (focusEl), so those calls are switched off - with the full-screen
    // first screen they opened the page scrolled down (same fix as the film page)
    if (TV) st.scrollEl.scrollTo = st.scrollEl.scrollBy = function () {};
    st.scrollEl.addEventListener('scroll', function () { wrap.classList.toggle('ivf-dim', st.scrollEl.scrollTop > 0); }, { passive: true });
    return st;
  }

  // Resolve once the logo, backdrop and first row of episode pictures have loaded (or after maxMs)
  function waitForPictures(el, maxMs) {
    var urls = [];
    var logo = el.querySelector('.ivf-logo img');
    if (logo) urls.push(logo.src);
    var bgs = el.querySelectorAll('.ivf-bd-img, .ivf-ep-img');
    for (var i = 0; i < bgs.length && i < 5; i++) {
      var m = /url\(["']?([^"')]+)["']?\)/.exec(bgs[i].style.backgroundImage || '');
      if (m) urls.push(m[1]);
    }
    return new Promise(function (resolve) {
      var left = urls.length;
      if (!left) { resolve(); return; }
      var t = setTimeout(resolve, maxMs);
      urls.forEach(function (u) {
        var im = new Image();
        im.onload = im.onerror = function () { if (--left === 0) { clearTimeout(t); resolve(); } };
        im.src = u;
      });
    });
  }

  // ---- the layer -------------------------------------------------------------------------------------
  function ensureRoot() {
    addStyle();
    if (root) return;
    root = document.createElement('div');
    root.id = ROOT_ID;
    root.className = 'ivf-off';
    document.body.appendChild(root);
  }
  // Web: content starts below Jellyfin's top bar (the lowest visible one), like the film page
  function placeBelowHeader() {
    if (TV || !root) return;
    var b = 0;
    Array.prototype.forEach.call(document.querySelectorAll('.skinHeader, header.MuiAppBar-root'), function (h) {
      if (!h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      b = Math.max(b, Math.round(h.getBoundingClientRect().bottom));
    });
    if (root.style.getPropertyValue('--ivf-tvs-top') !== b + 'px') root.style.setProperty('--ivf-tvs-top', b + 'px');
  }
  window.addEventListener('resize', placeBelowHeader);
  function layerOn() {
    ensureRoot();
    root.classList.remove('ivf-off');
    document.documentElement.classList.add('ivf-show-on');
    placeBelowHeader(); setTimeout(placeBelowHeader, 300);
  }
  // Black layer at once (a show we know is opening): the stock page underneath never shows
  function showBlank(id) {
    layerOn();
    if (!state || state.id !== id) root.innerHTML = '';
    shownId = id;
  }
  function hide() {
    if (!root || root.classList.contains('ivf-off')) { shownId = null; return; }
    if (state && state.scrollEl) state.scroll = state.scrollEl.scrollTop;
    var dlg = document.querySelector('.ivf-dialog'); if (dlg) dlg.remove();
    root.classList.add('ivf-off');
    document.documentElement.classList.remove('ivf-show-on');
    var left = shownId;
    shownId = null;
    if (TV && left) backToCard(left);
  }
  // TV, Back to a library/grid: the focus was inside this (now hidden) layer, and Jellyfin tried to put
  // it back there - so nothing was selected (round-4 beta, Batman Beyond / Mandalorian and Boba Fett).
  // Select the show's own poster again (the grid can be redrawn meanwhile, e.g. Star Wars re-sorts).
  // (Jellyfin sometimes selects the grid's FIRST poster itself on the way back - that is not the user moving on,
  // so only a key pressed since Back stops this; beta round 6: Band of Brothers / Jackass -> Agatha)
  var lastKeyAt = 0;
  window.addEventListener('keydown', function () { lastKeyAt = Date.now(); }, true);
  function backToCard(id) {
    var leftAt = Date.now() + 50; // (the Back key itself is still being handled)
    [60, 300, 800, 1500].forEach(function (ms) {
      setTimeout(function () {
        if (shownId) return; // a show page is up again
        if (lastKeyAt > leftAt) return; // the user has moved on
        var a = document.activeElement;
        if (a && a.closest && a.closest('.card[data-id="' + id + '"]')) return; // already there
        var cards = document.querySelectorAll('.card[data-id="' + id + '"]');
        for (var i = 0; i < cards.length; i++) {
          var c = cards[i];
          if (!c.getClientRects().length || c.closest('.hide')) continue;
          c.focus({ preventScroll: true });
          var r = c.getBoundingClientRect();
          if (r.top < 80 || r.bottom > innerHeight - 20) c.scrollIntoView({ block: 'center' });
          return;
        }
      }, ms);
    });
  }

  // ---- No flash: shows are known before their page opens --------------------------------------------
  // Library/search cards say data-type="Series", and every show opened before is remembered.
  var SERIES_KEY = 'ivf-series-ids';
  var knownSeries = {};
  try { knownSeries = JSON.parse(localStorage.getItem(SERIES_KEY) || '{}') || {}; } catch (e) { knownSeries = {}; }
  function rememberSeries(id) {
    if (!id || knownSeries[id]) return;
    knownSeries[id] = 1;
    try { localStorage.setItem(SERIES_KEY, JSON.stringify(knownSeries)); } catch (e) {}
  }
  function forgetSeries(id) {
    if (!knownSeries[id]) return;
    delete knownSeries[id];
    try { localStorage.setItem(SERIES_KEY, JSON.stringify(knownSeries)); } catch (e) {}
  }

  // ---- open / leave ----------------------------------------------------------------------------------
  var token = 0;
  function open(id) {
    var t = ++token;
    // Back to the page already built (from the player, a person page...): show it as it was, then
    // bring progress and Play Next Episode up to date in place
    if (state && state.id === id && root && root.contains(state.page)) {
      layerOn();
      shownId = id;
      if (state.scrollEl.scrollTop !== state.scroll) state.scrollEl.scrollTop = state.scroll;
      restoreFocus(state);
      keepFocus(state);
      var st = state;
      loadSeriesData(id, true).then(function (dt) {
        if (t !== token || state !== st || !dt.series || dt.series.Type !== 'Series') return;
        st.allEpisodes = dt.allEpisodes || st.allEpisodes;
        st.series = dt.series;
        var a = document.activeElement, wasEp = a && a.classList && a.classList.contains('ivf-ep'), wasNext = a && a.classList && a.classList.contains('ivf-play-next');
        var nb = st.panel.querySelector('.ivf-play-next');
        if (nb && dt.nextUp && dt.nextUp.Id !== nb.getAttribute('data-id')) {
          var tmp = document.createElement('div'); tmp.innerHTML = nextUpHtml(dt.nextUp);
          nb.parentNode.replaceChild(tmp.firstChild, nb);
          if (wasNext) focusEl(st.panel.querySelector('.ivf-play-next'));
        }
        st.nextUp = dt.nextUp || st.nextUp;
        renderSeason(st, st.seasonId);
        if (wasEp && TV) restoreFocus(st);
      }, function () {});
      return;
    }
    showBlank(id);
    loadSeriesData(id).then(function (dt) {
      if (t !== token || detailId() !== id) return;
      if (!dt.series || dt.series.Type !== 'Series' || !dt.seasons.length) {
        forgetSeries(id);
        if (shownId === id) hide();
        return;
      }
      rememberSeries(id);
      var st = build(dt);
      // fade the finished page in once its first pictures are there (max 400 ms)
      return waitForPictures(st.page, 400).then(function () {
        if (t !== token || detailId() !== id) return;
        state = st;
        layerOn();
        shownId = id;
        root.innerHTML = '';
        st.page.classList.add('ivf-tvs-in');
        root.appendChild(st.page);
        if (TV) focusEl(st.panel.querySelector('.ivf-play-next') || st.panel.querySelector('.ivf-season-btn') || st.panel.querySelector('.ivf-ep'));
        keepFocus(st);
      });
    })['catch'](function (e) { console.warn('IvanaFin show page:', e); if (t === token) hide(); });
  }
  function restoreFocus(st) {
    if (!TV) return;
    var a = document.activeElement;
    if (a && st.page.contains(a)) return;
    focusEl(lastTarget(st));
  }
  // What was selected before leaving the page (an episode, a person, a button), else Play Next Episode
  function lastTarget(st) {
    var p = st.panel, eps = p.querySelectorAll('.ivf-ep');
    var first = p.querySelector('.ivf-play-next') || p.querySelector('.ivf-season-btn') || eps[0];
    if (st.lastKind === 'ep') return eps[st.lastEpIdx] || first;
    if (st.lastKind === 'row') {
      var sec = p.querySelector('.ivf-tvs-cast[data-row="' + st.lastRow + '"]'), items = sec ? sec.querySelectorAll('.ivf-tvs-person') : [];
      return items[st.rowIdx[st.lastRow] || 0] || items[0] || first;
    }
    if (st.lastKind === 'season') return p.querySelector('.ivf-season-btn') || first;
    return first;
  }
  // Jellyfin's own (hidden) page focuses its buttons when it appears underneath: take the focus back
  function keepFocus(st) {
    if (!TV) return;
    [300, 800, 1500].forEach(function (ms) {
      setTimeout(function () {
        if (state !== st || shownId !== st.id || document.querySelector('.ivf-dialog')) return;
        var a = document.activeElement;
        if (a && st.page.contains(a)) return;
        focusEl(lastTarget(st));
      }, ms);
    });
  }

  function check() {
    if (!signedIn()) return;
    var id = detailId();
    if (!id) { hide(); return; }
    if (shownId === id) return;
    if (knownSeries[id] || (state && state.id === id)) { open(id); return; }
    // not known as a show: off now (a film / person page), and look at what it is
    hide();
    var t = ++token;
    ApiClient.getItem(uid(), id).then(function (item) {
      if (t !== token || detailId() !== id || !item || item.Type !== 'Series') return;
      rememberSeries(id);
      open(id);
    }, function () {});
  }

  // ---- focus + remote --------------------------------------------------------------------------------
  function focusEl(el) {
    if (!el || !state) return;
    el.focus({ preventScroll: true });
    var sc = state.scrollEl;
    if (el.classList.contains('ivf-pill')) { sc.scrollTop = 0; return; }
    var box = sc.getBoundingClientRect(), r = el.getBoundingClientRect();
    var person = el.classList.contains('ivf-tvs-person');
    var top = person ? el.closest('.ivf-tvs-cast').getBoundingClientRect().top : r.top;
    var m = box.height * 0.06;
    if (r.bottom > box.bottom - m) sc.scrollTop += r.bottom - box.bottom + m;
    if (top < box.top + m) sc.scrollTop -= box.top + m - top;
    if (person) {
      var strip = el.parentNode, sr = strip.getBoundingClientRect(), pad = sr.width * 0.05;
      if (r.left < sr.left + pad) strip.scrollLeft -= sr.left + pad - r.left;
      else if (r.right > sr.right - pad) strip.scrollLeft += r.right - sr.right + pad;
    }
  }
  window.addEventListener('keydown', function (e) {
    if (!shownId || !state || !root || root.classList.contains('ivf-off') || document.querySelector('.ivf-dialog')) return;
    if (window.IvfSwCard && window.IvfSwCard.isOpen()) return; // sw-card.js has the keys
    var k = e.key || '', kc = e.keyCode;
    var back = k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || (kc === 10009 || kc === 461) || kc === 27 || kc === 8;
    // web: Esc / Backspace leave the show page (not while typing or while a Jellyfin dialog is open)
    if (!TV && back && !document.querySelector('.dialogContainer .dialog')) {
      var tg = document.activeElement && document.activeElement.tagName;
      if (tg !== 'INPUT' && tg !== 'TEXTAREA') { e.preventDefault(); e.stopPropagation(); history.back(); }
      return;
    }
    var dir = k === 'ArrowLeft' || kc === 37 ? 'l' : k === 'ArrowRight' || kc === 39 ? 'r' : k === 'ArrowUp' || kc === 38 ? 'u' : k === 'ArrowDown' || kc === 40 ? 'd' : '';
    if (!dir) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    var st = state, p = st.panel, a = document.activeElement;
    var pills = Array.prototype.slice.call(p.querySelectorAll('.ivf-pill'));
    var eps = Array.prototype.slice.call(p.querySelectorAll('.ivf-ep'));
    // the rows under the episodes, top to bottom (Star Wars rows, then Cast & Crew); each keeps its place
    var rows = Array.prototype.slice.call(p.querySelectorAll('.ivf-tvs-cast')).map(function (sec) {
      return { key: sec.getAttribute('data-row'), items: Array.prototype.slice.call(sec.querySelectorAll('.ivf-tvs-person')) };
    }).filter(function (r) { return r.items.length; });
    function rowItem(r) { return r ? r.items[st.rowIdx[r.key] || 0] || r.items[0] : null; }
    var below = rowItem(rows[0]);
    var topBtn = p.querySelector('.ivf-season-btn') || p.querySelector('.ivf-play-next');
    var lastRowStart = eps.length ? Math.floor((eps.length - 1) / COLS) * COLS : 0;
    var i, ri = -1, target = null;
    rows.forEach(function (r, n) { if (r.items.indexOf(a) >= 0) ri = n; });
    if ((i = pills.indexOf(a)) >= 0) {
      if (dir === 'l') target = pills[i - 1];
      else if (dir === 'r') target = pills[i + 1];
      else if (dir === 'd') target = eps[0] || below; // Down from the buttons always goes to episode 1
    } else if ((i = eps.indexOf(a)) >= 0) {
      var col = i % COLS;
      if (dir === 'l') target = col > 0 ? eps[i - 1] : null;
      else if (dir === 'r') target = col < COLS - 1 ? eps[i + 1] : null;
      else if (dir === 'u') target = i >= COLS ? eps[i - COLS] : topBtn; // top row: Season (or Play Next Episode)
      else if (dir === 'd') target = eps[i + COLS] || (i < lastRowStart ? eps[eps.length - 1] : below);
    } else if (ri >= 0) {
      var items = rows[ri].items; i = items.indexOf(a);
      if (dir === 'l') target = items[i - 1];
      else if (dir === 'r') target = items[i + 1];
      else if (dir === 'u') target = ri > 0 ? rowItem(rows[ri - 1]) : eps.length ? (st.lastEpIdx >= lastRowStart && eps[st.lastEpIdx] ? eps[st.lastEpIdx] : eps[lastRowStart]) : topBtn;
      else if (dir === 'd') target = rowItem(rows[ri + 1]);
    } else {
      // nothing of ours selected (e.g. the mouse was used): start at the top
      target = topBtn || eps[0] || below;
    }
    if (target) focusEl(target);
  }, true);

  // ---- starting early -------------------------------------------------------------------------------
  function opening(card) {
    var id = card.getAttribute('data-id');
    if (!id) return;
    rememberSeries(id.toLowerCase());
    prefetch(id); // starts loading now, while the web is still switching pages
  }
  document.addEventListener('click', function (e) {
    var card = e.target.closest && e.target.closest('[data-type="Series"][data-id]');
    if (card && !card.closest('#' + ROOT_ID)) opening(card);
  }, true);
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter' && e.keyCode !== 13) return;
    var card = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-type="Series"][data-id]');
    if (card && !card.closest('#' + ROOT_ID)) opening(card);
  }, true);
  // Highlighting a show (remote focus or mouse hover) loads its page in the background
  var hoverTimer = null;
  function onHighlight(e) {
    var card = e.target.closest && e.target.closest('[data-type="Series"][data-id]');
    if (!card || card.closest('#' + ROOT_ID)) return;
    clearTimeout(hoverTimer);
    hoverTimer = setTimeout(function () { prefetch(card.getAttribute('data-id')); }, 250);
  }
  document.addEventListener('focusin', onHighlight, true);
  document.addEventListener('mouseover', onHighlight, true);

  // A known show: cover the stock page in the same moment the address changes (forward or Back),
  // before the browser draws Jellyfin's page; anything else: our layer goes away at once
  function onNav() {
    var id = detailId();
    if (id && shownId === id) return;
    if (id && (knownSeries[id] || (state && state.id === id)) && signedIn()) open(id);
    else hide();
  }
  window.addEventListener('ivf-nav', onNav);
  window.addEventListener('hashchange', function () { onNav(); setTimeout(check, 0); });
  document.addEventListener('viewshow', function () { setTimeout(check, 0); });
  // One page watcher shared by all IvanaFin scripts (see samsung-library.js)
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
  // (signed in later than this script loaded, fresh page load straight onto a show...)
  ivfWatch(function () { check(); if (shownId && !TV) placeBelowHeader(); }, 200);
  check();
})();

} catch (e) { console.error('IvanaFin script series-page failed:', e); } })();
/* IvanaFin - sw-card */
(function() { try {
// IvanaFin (Samsung app AND Jellyfin web): the Star Wars card - a planet, character or starship from the
// Featured Planets / Characters / Starships & Vehicles rows on film pages (movie-page.js) and show pages
// (series-page.js). Data: sw-planets.js (window.IvfSwPlanets).
//   window.IvfSwCard.open({ list: [entry...], index, currentId, onClose(entry) })
//     entry = { kind: 'planet'|'char'|'ship', slug, name, image (server path), facts..., bio, seenIn: [{name, id}] }
//   Left/Right step through the list; Down/Up move between the card and its "Also in" links (OK opens that
//   film or show); Back / Esc / a click outside closes it. While it is open it takes every key first.
(function () {
  'use strict';
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var DF = TV ? 1 : 0.72;
  var KINDS = {
    planet: { facts: [['Region', 'region'], ['Climate', 'climate'], ['Terrain', 'terrain']], more: 'planets' },
    char: { facts: [['Species', 'species'], ['Homeworld', 'homeworld'], ['Allegiance', 'side']], more: 'characters' },
    ship: { facts: [['Type', 'type'], ['Maker', 'maker'], ['Length', 'length']], more: 'starships' }
  };
  var cur = null; // { el, box, list, i, currentId, onClose }

  function d(n) { return 'calc(var(--ivf-dp, 100vw / 960) * ' + (Math.round(n * DF * 100) / 100) + ')'; }
  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function addStyle() {
    if (document.getElementById('ivf-swc-style')) return;
    var s = document.createElement('style');
    s.id = 'ivf-swc-style';
    s.textContent = [
      '.ivf-swc{position:fixed;inset:0;z-index:2000;background:rgba(0,0,0,.6);display:flex;align-items:center;justify-content:center;color:#d1d5db;font-family:inherit}',
      '.ivf-swc-box{width:' + d(640) + ';max-height:92vh;overflow-y:auto;scrollbar-width:none;box-sizing:border-box;padding:' + d(12) + ' ' + d(14) + ' ' + d(14) + ';border-radius:' + d(28) + ';background:#0b0b0b}',
      '.ivf-swc-box::-webkit-scrollbar{display:none}',
      '.ivf-pl{display:flex;gap:' + d(22) + ';padding:' + d(16) + ' ' + d(12) + ' ' + d(8) + ';outline:none}',
      '.ivf-pl-img{flex:none;width:' + d(170) + ';height:' + d(170) + ';border-radius:50%;background:#000 center/cover no-repeat}',
      '.ivf-pl.ship .ivf-pl-img{width:' + d(220) + ';height:' + d(150) + ';border-radius:' + d(10) + ';background-size:contain;background-color:#050505}',
      '.ivf-pl.char .ivf-pl-img{background-position:center top}',
      '.ivf-pl-txt{flex:1;min-width:0}',
      '.ivf-pl-name{font-size:' + d(24) + ';line-height:' + d(30) + ';font-weight:600;color:#fff}',
      '.ivf-pl-facts{display:grid;grid-template-columns:auto 1fr;gap:' + d(2) + ' ' + d(12) + ';margin:' + d(8) + ' 0 ' + d(12) + ';font-size:' + d(12) + ';line-height:' + d(17) + '}',
      '.ivf-pl-facts dt{color:#9ca3af}',
      '.ivf-pl-facts dd{margin:0;color:#e5e7eb}',
      '.ivf-pl-bio{font-size:' + d(13) + ';line-height:' + d(20) + ';color:#d1d5db}',
      '.ivf-pl-seen{margin-top:' + d(12) + ';font-size:' + d(12) + ';line-height:' + d(17) + ';color:#9ca3af}',
      '.ivf-pl-seen button,.ivf-pl-seen span{display:inline-block;margin:' + d(4) + ' ' + d(6) + ' 0 0;padding:' + d(2) + ' ' + d(10) + ';border:0;border-radius:999px;background:rgba(255,255,255,.1);color:#d1d5db;font:inherit;font-size:' + d(12) + ';line-height:' + d(18) + ';cursor:pointer;outline:none}',
      '.ivf-pl-seen span{cursor:default;background:none;padding-left:0}',
      '.ivf-pl-seen button:focus,.ivf-pl-seen button:hover{background:#d1d5db;color:#131414}',
      '.ivf-pl-foot{display:flex;justify-content:space-between;margin-top:' + d(10) + ';font-size:' + d(10) + ';line-height:' + d(14) + ';color:#6b7280}'
    ].join('');
    document.head.appendChild(s);
  }

  // the pictures are stored on the Jellyfin server (the Samsung app couldn't load Wookieepedia's: its
  // picture server refuses requests without a Referer, and the Tizen app runs from a local file)
  // Jellyfin sometimes reshuffles the root folder's backdrop LIST (2026-11-16 and again by 2026-11-17),
  // and pictures are asked for by their place in it, so the place in the data can go stale. A picture's
  // tag never changes, so its current place is looked up by tag: one list request per session. Until the
  // list arrives, pictures are drawn empty and the elements carrying data-swimg are filled in afterwards.
  var places = null, loading = false;
  function loadPlaces() {
    var D = window.IvfSwPlanets;
    if (places || loading || !window.ApiClient || !D) return;
    var any = null;
    ['planets', 'chars', 'ships'].some(function (k) { var o = D[k] || {}; for (var x in o) if (o[x] && o[x].image) { any = o[x].image; return true; } return false; });
    var m = any && /Items\/(\w+)\/Images/.exec(any); if (!m) return;
    loading = true;
    ApiClient.getJSON(ApiClient.getUrl('Items/' + m[1] + '/Images')).then(function (list) {
      places = {}; (list || []).forEach(function (x) { if (x.ImageType === 'Backdrop') places[x.ImageTag] = x.ImageIndex; });
      Array.prototype.forEach.call(document.querySelectorAll('[data-swimg]'), function (el) {
        var a = el.getAttribute('data-swimg').split('|'), u = url(a[0], +a[1]); if (u) el.style.backgroundImage = 'url("' + u + '")';
      });
      loading = false;
    }, function () { places = {}; loading = false; });
  }
  function url(image, w) {
    if (/^https?:\/\//.test(String(image))) return image; // GitHub copies (any server): nothing to look up
    if (!places) { loadPlaces(); return ''; }
    var p = String(image).split('?tag='), n = places[p[1]];
    return ApiClient.getUrl(n == null ? p[0] : p[0].replace(/\/\d+$/, '/' + n), { maxWidth: w, quality: 90, tag: p[1] });
  }
  // attributes for a picture element: its style (once places are known) + data-swimg to fill it in later
  function attr(image, w) { var u = url(image, w); return ' data-swimg="' + esc(image + '|' + w) + '"' + (u ? ' style="background-image:url(&quot;' + esc(u) + '&quot;)"' : ''); }
  setTimeout(loadPlaces, 0);
  function html(e, many) {
    var K = KINDS[e.kind];
    function fact(k, v) { return v ? '<dt>' + k + '</dt><dd>' + esc(v) + '</dd>' : ''; }
    // "Also in": as the title is on THIS server (its id, else the same TMDB title); not here = plain text
    var seen = (e.seenIn || []).map(resolve).filter(function (s) { return !cur || s.id !== cur.currentId; });
    return '<div class="ivf-pl ' + e.kind + '" tabindex="-1"><div class="ivf-pl-img"' + attr(e.image, 600) + '></div><div class="ivf-pl-txt">' +
      '<div class="ivf-pl-name">' + esc(e.name) + '</div>' +
      '<dl class="ivf-pl-facts">' + K.facts.map(function (f) { return fact(f[0], e[f[1]]); }).join('') + '</dl>' +
      '<div class="ivf-pl-bio">' + esc(e.bio) + '</div>' +
      (seen.length ? '<div class="ivf-pl-seen">Also in: ' + seen.map(function (s) {
        return s.id ? '<button type="button" class="ivf-pl-link" data-go="' + esc(s.id) + '">' + esc(s.name) + '</button>' : '<span>' + esc(s.name) + '</span>';
      }).join('') + '</div>' : '') +
      '<div class="ivf-pl-foot"><span>' + (many ? (TV ? '◀ ▶ more ' + K.more + (seen.length ? ' · ▼ also in' : '') : '← → more ' + K.more) : (TV && seen.length ? '▼ also in' : '')) + '</span><span>Picture: Wookieepedia</span></div></div></div>';
  }
  function show(n) {
    if (!cur || n < 0 || n >= cur.list.length) return;
    cur.i = n;
    cur.box.innerHTML = html(cur.list[n], cur.list.length > 1);
    cur.box.scrollTop = 0;
    cur.box.querySelector('.ivf-pl').focus({ preventScroll: true });
  }
  function close() {
    if (!cur) return;
    var c = cur; cur = null;
    c.el.remove();
    if (c.onClose) c.onClose(c.list[c.i]);
  }
  function open(o) {
    close();
    addStyle();
    var el = document.createElement('div');
    el.className = 'ivf-swc';
    el.innerHTML = '<div class="ivf-swc-box"></div>';
    document.body.appendChild(el);
    cur = { el: el, box: el.firstChild, list: o.list || [], i: 0, currentId: o.currentId, onClose: o.onClose };
    el.addEventListener('click', function (e) {
      if (e.target === el) { close(); return; }
      var l = e.target.closest('.ivf-pl-link'); if (!l) return;
      var go = l.getAttribute('data-go');
      cur.onClose = null; close();
      location.hash = '#/details?id=' + go + '&serverId=' + ApiClient.serverId();
    });
    el.addEventListener('wheel', function (e) { e.preventDefault(); cur && (cur.box.scrollTop += e.deltaY); }, { passive: false });
    show(Math.max(0, Math.min(o.index || 0, cur.list.length - 1)));
  }

  window.addEventListener('keydown', function (e) {
    if (!cur) return;
    var k = e.key || '', kc = e.keyCode;
    var back = k === 'Escape' || k === 'Backspace' || k === 'GoBack' || k === 'BrowserBack' || (kc === 10009 || kc === 461) || kc === 27 || kc === 8;
    var dir = k === 'ArrowLeft' || kc === 37 ? 'l' : k === 'ArrowRight' || kc === 39 ? 'r' : k === 'ArrowUp' || kc === 38 ? 'u' : k === 'ArrowDown' || kc === 40 ? 'd' : '';
    if (!back && !dir) return; // OK / Enter reach the focused link (a button)
    e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
    if (back) { close(); return; }
    var links = Array.prototype.slice.call(cur.box.querySelectorAll('.ivf-pl-link')), li = links.indexOf(document.activeElement);
    if (li >= 0) {
      if (dir === 'u') cur.box.querySelector('.ivf-pl').focus({ preventScroll: true });
      else if (dir === 'l' && links[li - 1]) links[li - 1].focus();
      else if (dir === 'r' && links[li + 1]) links[li + 1].focus();
      return;
    }
    if (dir === 'l' || dir === 'r') show(cur.i + (dir === 'r' ? 1 : -1));
    else if (dir === 'd' && links.length) links[0].focus();
  }, true);
  // leaving the page (Back in the browser, a link elsewhere) closes it
  window.addEventListener('hashchange', function () { if (cur) { cur.onClose = null; close(); } });

  window.IvfSwCard = { open: open, close: close, isOpen: function () { return !!cur; }, imgAttr: attr };

  // ---- Star Wars on ANY server (same rules as Android SwPlanets.kt) ------------------------------------
  // The data's films / seasons are keyed by the original library's item ids; other servers have other ids,
  // so films are also found by TMDB id (tmdbFilms) and shows by the series' TMDB id (shows: the whole show's
  // planets / characters / ships for every season). Era + story order: the item's own SwTimeline / SwYear
  // ids, else the bundled timeline by TMDB id.
  function D() { return window.IvfSwPlanets || {}; }
  function hex(id) { return String(id || '').replace(/-/g, '').toLowerCase(); }
  function tmdbOf(item) { return (item && item.ProviderIds && (item.ProviderIds.Tmdb || item.ProviderIds.tmdb)) || ''; }
  function film(item) {
    var d = D(), f = d.films || {};
    if (!item) return null;
    var own = f[hex(item.Id || item)];
    if (own) return own;
    var key = (d.tmdbFilms || {})[tmdbOf(item)];
    return (key && f[key]) || null;
  }
  function season(seasonId, series) {
    var d = D();
    return (seasonId && (d.seasons || {})[hex(seasonId)]) || (series && (d.shows || {})[tmdbOf(series)]) || null;
  }
  function place(item) {
    var p = item && item.ProviderIds, k = p && parseFloat(p.SwTimeline);
    if (k === k) return { k: k, year: p.SwYear || '' };
    var t = (D().timeline || {})[tmdbOf(item)];
    return t ? { k: t.k, year: t.year || '' } : null;
  }
  // every film and show on this server, once per 10 minutes: { id, name, k, year, tag, series, tmdb }
  var idx = null;
  function index() {
    if (idx && Date.now() - idx.t < 600000) return idx.p;
    var p = ApiClient.getJSON(ApiClient.getUrl('/Users/' + ApiClient.getCurrentUserId() + '/Items', {
      Recursive: true, IncludeItemTypes: 'Movie,Series', Fields: 'ProviderIds', ImageTypeLimit: 1, EnableImageTypes: 'Primary', EnableUserData: false
    })).then(function (r) {
      var list = ((r && r.Items) || []).map(function (x) {
        var pl = place(x);
        return { id: x.Id, name: x.Name, k: pl ? pl.k : NaN, year: pl ? pl.year : '', tag: x.ImageTags && x.ImageTags.Primary, series: x.Type === 'Series', tmdb: tmdbOf(x) };
      });
      idx.list = list;
      return list;
    })['catch'](function () { idx = null; return []; });
    idx = { t: Date.now(), p: p, list: null };
    return p;
  }
  // the story-order list: titles with a place, sorted
  function timelineList(exceptId) {
    return index().then(function (list) {
      return list.filter(function (x) { return x.k === x.k && x.id !== exceptId; }).sort(function (a, b) { return a.k - b.k; });
    });
  }
  function resolve(link) {
    var list = idx && idx.list;
    if (!list) { index(); return link; }
    if (link.id && list.some(function (x) { return hex(x.id) === hex(link.id); })) return link;
    // same TMDB id, same kind first (a film and a show can share a number); then either kind (the
    // original library's Obi-Wan / Ahsoka / Acolyte / Skeleton Crew are films, TV shows elsewhere)
    var same = link.tmdb ? list.filter(function (y) { return y.tmdb === link.tmdb; }) : [];
    var x = same.filter(function (y) { return !!y.series === !!link.series; })[0] || (link.tmdb && D().shows && D().shows[link.tmdb] ? same[0] : null);
    return x ? { name: x.name, id: x.id, series: x.series } : { name: link.name, id: null };
  }
  window.IvfSw = { film: film, season: season, place: place, index: index, timelineList: timelineList, resolve: resolve };
  setTimeout(function () { if (window.ApiClient && ApiClient.getCurrentUserId && ApiClient.getCurrentUserId()) index(); }, 3000);
})();

} catch (e) { console.error('IvanaFin script sw-card failed:', e); } })();
/* IvanaFin - sw-planets */
(function() { try {
// IvanaFin: Star Wars extras for film and show pages (planets, starships, characters, opening crawls).
// GENERATED from data/sw-planets-src by build.ts - edit there. Same data as the Android app (any server).
window.IvfSwPlanets = {"version":"2026-11-19","credit":"Pictures: Wookieepedia (starwars.fandom.com)","planets":{"tatooine":{"name":"Tatooine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/0.webp","region":"Outer Rim","climate":"Hot and arid","terrain":"Desert, canyons, rocky bluffs","bio":"A desert world baking under two suns, far from the heart of the galaxy. With almost no surface water, its people farm moisture from the air, trade in junk and scrap, and live under the shadow of the Hutt crime lords who run the place. Podracing, Jawa sandcrawlers, Tusken Raiders and the wretched hive of Mos Eisley all call it home. It is where Anakin Skywalker grew up a slave, where Obi-Wan Kenobi kept watch in exile, and where Luke Skywalker stared at the twin sunset and dreamed of something more.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"alderaan":{"name":"Alderaan","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/1.webp","region":"Core Worlds","climate":"Temperate","terrain":"Grasslands, snowy mountains","bio":"A peaceful, beautiful Core World of green plains and snow-capped mountains, known for its art, culture and its refusal to keep weapons. Home of the royal House of Organa, it raised Princess Leia after Bail and Breha Organa adopted her. Alderaan quietly supported the growing Rebellion, and paid for it: Grand Moff Tarkin chose it as the first target of the Death Star's superlaser, destroying the entire planet in a single shot to show the galaxy what resistance would cost.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"yavin-4":{"name":"Yavin 4","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/2.webp","region":"Outer Rim","climate":"Temperate, humid","terrain":"Jungle, rainforest, volcanoes","bio":"A jungle-covered moon circling the orange gas giant Yavin. Ancient stone temples, built long ago by the vanished Massassi people, rise above the treetops. The Rebel Alliance hid its main base inside the largest of them, and it was from here that X-wings and Y-wings launched to attack the first Death Star. Luke Skywalker's one-in-a-million shot saved the moon, and the medal ceremony in the temple's great hall closed the battle that changed the war.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"hoth":{"name":"Hoth","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/3.webp","region":"Outer Rim","climate":"Frozen","terrain":"Ice plains, glaciers, mountains","bio":"A remote ice world battered by blizzards, where nights get cold enough to kill a person in hours. Its only notable natives are the tauntauns the rebels rode and the wampas that hunted them. The Rebel Alliance carved Echo Base into its glaciers, hoping nobody would look this far out. An Imperial probe droid found them anyway, and Darth Vader's AT-AT walkers marched across the snowfields in one of the Empire's greatest victories of the war.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"dagobah":{"name":"Dagobah","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/4.webp","region":"Outer Rim","climate":"Murky, wet","terrain":"Swamps, bogs, gnarled forests","bio":"A misty swamp world thick with twisted trees, bogs and creatures, and almost no technology at all. Its overwhelming life gives it a strong presence in the Force, which made it the perfect hiding place for Jedi Master Yoda after the fall of the Republic. Here he trained Luke Skywalker, lifted his X-wing out of the swamp and sent him into the dark-side cave, and here, years later, he finally passed into the Force.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"bespin":{"name":"Bespin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/5.webp","region":"Outer Rim","climate":"Gas giant, calm upper atmosphere","terrain":"Gas clouds","bio":"A huge gas giant with a thin band of breathable air high in its pink and orange clouds. Floating there is Cloud City, a mining colony that skims valuable Tibanna gas, run by the smooth-talking administrator Lando Calrissian. It looked like a safe harbour for Han, Leia and Chewbacca, until Darth Vader arrived first. Han was frozen in carbonite, and in the depths of the city Luke lost his hand and learned the truth about his father.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"endor":{"name":"Endor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/6.webp","region":"Outer Rim","climate":"Temperate","terrain":"Ancient forests, mountains, savannas","bio":"The forest moon of Endor, a green world of giant trees orbiting a gas giant, home to the small but fierce Ewoks in their treetop villages. The Empire protected the second Death Star with a shield generator built here. A strike team led by Han Solo and Leia, with Ewoks hurling rocks and swinging logs, brought down the shield while the rebel fleet attacked above. The celebration in the Ewok village marked the end of the Emperor.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"kashyyyk":{"name":"Kashyyyk","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/7.webp","region":"Mid Rim","climate":"Temperate, humid","terrain":"Forests of wroshyr trees, wetlands, coasts","bio":"The forest homeworld of the Wookiees, covered in towering wroshyr trees with whole cities built high in their branches. Wookiees are strong, loyal and long-lived; Chewbacca was born here. During the Clone Wars, Yoda led clone troopers alongside Wookiee warriors against the droid army on its shores, until Order 66 turned the clones on him. Under the Empire many Wookiees were enslaved, and Kashyyyk became a symbol of the Empire's cruelty.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"}]},"naboo":{"name":"Naboo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/8.webp","region":"Mid Rim","climate":"Temperate","terrain":"Rolling plains, lakes, swamps, hills","bio":"A lush green world of lakes, meadows and graceful domed cities, shared by the human Naboo and the Gungans living in bubble cities underwater. Its elected Queen Padmé Amidala faced the Trade Federation's invasion and won it back with the Gungan army's help. Naboo is also where a quiet senator named Sheev Palpatine came from. Padmé and Anakin married in secret by one of its lakes, and the whole planet mourned at her funeral.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"coruscant":{"name":"Coruscant","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/9.webp","region":"Core Worlds","climate":"Temperate, controlled","terrain":"City covering the whole planet","bio":"The capital of the galaxy, a planet covered from pole to pole by one endless city of skyscrapers thousands of levels deep, with air traffic streaming between the towers. It held the Galactic Senate and the Jedi Temple for a thousand generations. Its glittering upper levels hide dangerous underworld streets far below. As the Republic became the Empire, the Temple was stormed in Order 66 and Coruscant became the Imperial Center.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"},{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"kamino":{"name":"Kamino","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/10.webp","region":"Wild Space","climate":"Stormy","terrain":"Global ocean","bio":"An ocean world lashed by endless rain and storms, hidden just beyond the galaxy's edge and deleted from the Jedi Archives. The tall, elegant Kaminoans live in cities raised on stilts above the waves and are famous for one thing: cloning. Obi-Wan Kenobi found an army of clone troopers being grown here from the bounty hunter Jango Fett, secretly ordered for the Republic ten years earlier. That army fought the Clone Wars.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"geonosis":{"name":"Geonosis","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/11.webp","region":"Outer Rim","climate":"Hot, dry","terrain":"Rocky desert, mesas, canyons","bio":"A harsh red desert planet circled by a ring of asteroids, home to the winged insect-like Geonosians who live in towering hives and run vast droid factories. Count Dooku gathered the Separatist leaders here. Obi-Wan, Anakin and Padmé were sentenced to death in its execution arena, and the Jedi charged in to rescue them. When the clone army arrived to finish the battle, the Clone Wars had begun.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"utapau":{"name":"Utapau","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/12.webp","region":"Outer Rim","climate":"Arid, windy","terrain":"Sinkholes, plains, oceans underground","bio":"A dry, windswept world dotted with huge sinkholes, where cities cling to the walls of the pits and the tall Pau'ans and short Utai live side by side. General Grievous hid the Separatist Council here near the end of the Clone Wars. Obi-Wan Kenobi rode a lizard-like varactyl after him through the city and finally defeated him, just before the clone troopers were ordered to turn on the Jedi.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"cato-neimoidia":{"name":"Cato Neimoidia","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/13.webp","region":"Colonies","climate":"Temperate, misty","terrain":"Rocky arches, chasms","bio":"One of the wealthy colony worlds of the Neimoidians, the species behind the Trade Federation. Their ornate bridge cities hang beneath vast natural rock arches over misty chasms. During the Clone Wars it was a Separatist stronghold, and it was here that Jedi Master Plo Koon was flying with his clone pilots when Order 66 came through and his own wingmen shot him down.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"mygeeto":{"name":"Mygeeto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/14.webp","region":"Outer Rim","climate":"Frozen","terrain":"Ice, crystal formations, cities","bio":"A frozen world of glittering crystal and huge cities, home to the vaults of the InterGalactic Banking Clan, one of the Separatists' richest backers. Late in the Clone Wars, Jedi Master Ki-Adi-Mundi led clone troopers in a battle across a broken bridge in its icy ruins. When Order 66 was given, his troopers turned and gunned him down mid-charge.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"saleucami":{"name":"Saleucami","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/15.webp","region":"Outer Rim","climate":"Hot","terrain":"Desert, craters, swamps","bio":"A hot Outer Rim world pocked with craters and dotted with strange plant life, where the Separatists retreated late in the Clone Wars. The Republic besieged it, and Jedi Master Stass Allie was riding a speeder bike on patrol when Order 66 was given. The clone troopers riding behind her opened fire. Saleucami is also where the clone deserter Cut Lawquane settled down with a farm and a family.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"felucia":{"name":"Felucia","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/16.webp","region":"Outer Rim","climate":"Humid","terrain":"Giant fungi, jungle","bio":"A strange and colourful jungle world of giant mushrooms, glowing plants and enormous flowers, many of them hungry. It changed hands many times during the Clone Wars. Jedi Master Aayla Secura was marching through its jungles with Commander Bly and his clone troopers when Order 66 came through, and Bly's men shot her in the back. Few planets look as alien, or as beautiful.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"mustafar":{"name":"Mustafar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/17.webp","region":"Outer Rim","climate":"Hot","terrain":"Volcanoes, rivers of lava","bio":"A small fiery world of erupting volcanoes and rivers of lava, mined for its rare minerals. Anakin Skywalker, newly turned Darth Vader, killed the Separatist leaders here, and then fought Obi-Wan Kenobi across a collapsing mining complex. He was left burning on its black sands, and survived only inside his suit. Years later Vader built his dark castle on Mustafar, over a place strong in the dark side.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"polis-massa":{"name":"Polis Massa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/18.webp","region":"Outer Rim","climate":"None","terrain":"Asteroid field","bio":"The broken remains of a planet that shattered long ago, now a field of asteroids. The Kallidahin, quiet researchers, built a medical and archaeological station here to study the lost world. After Mustafar, Obi-Wan and Yoda brought Padmé to the station in secret, where she gave birth to Luke and Leia and died. It was here that Yoda, Obi-Wan and Bail Organa decided to split up the twins and hide them.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"mandalore":{"name":"Mandalore","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/19.webp","region":"Outer Rim","climate":"Arid","terrain":"Desert, domed cities","bio":"The homeworld of the Mandalorians, a culture of warriors famous for their armour, their jetpacks and their code. By the Clone Wars, Mandalore had become a peaceful world ruled from its domed capital, Sundari, until Maul and the Death Watch took over. At the end of the war, Ahsoka Tano and Republic clones besieged the planet to capture Maul, and Order 66 arrived in the middle of it. Later the Empire bombed Mandalore into ruin.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"jakku":{"name":"Jakku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/20.webp","region":"Western Reaches","climate":"Hot, dry","terrain":"Desert, badlands","bio":"A harsh desert world littered with the wreckage of huge Star Destroyers and rebel ships, left over from the last great battle of the Galactic Civil War. Scavengers make a living stripping the wrecks for parts and trading them for food portions at Niima Outpost. Rey grew up alone here waiting for her family to return, until she met BB-8, Finn and an old ship called the Millennium Falcon.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"takodana":{"name":"Takodana","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/21.webp","region":"Mid Rim","climate":"Temperate","terrain":"Forests, lakes","bio":"A green, peaceful world of forests and lakes, best known for Maz Kanata's castle, a neutral meeting place for smugglers, pirates and travellers that she has kept for a thousand years. Han Solo brought Rey, Finn and BB-8 here for help. In its vaults Rey found Luke's old lightsaber and had her first vision. Then the First Order attacked, and the castle was destroyed.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"d-qar":{"name":"D'Qar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/22.webp","region":"Outer Rim","climate":"Temperate","terrain":"Jungle, grasslands","bio":"A green, quiet world in the Outer Rim that hid the main base of General Leia Organa's Resistance. Poe Dameron's X-wings launched from here to destroy Starkiller Base. Not long after, the First Order found the base, and the Resistance had to flee while its bombers attacked a dreadnought above the planet, the desperate escape that begins the chase across the galaxy.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"hosnian-prime":{"name":"Hosnian Prime","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/23.webp","region":"Core Worlds","climate":"Temperate","terrain":"City-covered","bio":"A city-covered Core World that became the capital of the New Republic in the years after the Empire fell, home to its Senate. The New Republic thought the First Order was just a nuisance. The First Order proved otherwise: Starkiller Base fired across the galaxy and destroyed Hosnian Prime and its whole star system, wiping out the Republic's government and fleet in a single moment.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"ilum":{"name":"Starkiller Base (Ilum)","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/24.webp","region":"Unknown Regions","climate":"Frigid","terrain":"Snow, ice, forests","bio":"Once Ilum, a sacred snow planet where young Jedi went to find the kyber crystals for their first lightsabers. Decades later, the First Order hollowed it out and turned it into Starkiller Base, a superweapon able to drain a star and fire across the galaxy. It destroyed the Hosnian system before the Resistance attacked. Han Solo died on its bridge, and Rey and Finn fought Kylo Ren in its snowy forest as the planet tore itself apart.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"ahch-to":{"name":"Ahch-To","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/25.webp","region":"Unknown Regions","climate":"Temperate, oceanic","terrain":"Ocean, rocky islands","bio":"A remote ocean world of rocky green islands, home to the very first Jedi Temple, where the Jedi Order began. Luke Skywalker went into exile here with his X-wing at the bottom of the sea, living alongside the porgs and the Lanai caretakers. Rey found him at the top of the island's steps and convinced him, slowly, to teach her. It is also where Luke made his final stand from across the galaxy.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"lah-mu":{"name":"Lah'mu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/26.webp","region":"Outer Rim","climate":"Temperate","terrain":"Black sand plains, grasslands","bio":"A quiet, rainy farm world of black volcanic soil and grassy plains on the edge of the galaxy. The scientist Galen Erso hid here with his wife Lyra and their daughter Jyn to escape the Empire's weapons programme. Director Orson Krennic found them anyway, killed Lyra and took Galen back to finish the Death Star. Little Jyn hid in a cave until Saw Gerrera came for her.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"wobani":{"name":"Wobani","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/27.webp","region":"Mid Rim","climate":"Cold, damp","terrain":"Mud, swamps","bio":"A grim, muddy Imperial prison world where prisoners work in labour camps under heavy guard. Jyn Erso was being held here under a false name when a Rebel team led by Cassian Andor and the reprogrammed droid K-2SO broke her out of a transport, because the Rebellion needed her help to reach her father's old friend Saw Gerrera.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"jedha":{"name":"Jedha","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/28.webp","region":"Mid Rim","climate":"Cold","terrain":"Desert, mesas","bio":"A cold desert moon and one of the galaxy's oldest holy places, where pilgrims of many faiths, including believers in the Force, came to Jedha City. The Empire occupied it to strip out its kyber crystals, the heart of the Death Star's weapon. Saw Gerrera's partisans fought the Empire in its streets. Tarkin then tested the Death Star on Jedha City, wiping it from the face of the moon.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"eadu":{"name":"Eadu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/29.webp","region":"Outer Rim","climate":"Stormy, rainy","terrain":"Jagged mountains, rocky plains","bio":"A dark, storm-lashed world of jagged rock where rain hardly ever stops. The Empire built a research base on a landing platform here where Galen Erso and his scientists worked on the Death Star. Jyn Erso went to find her father, but a Rebel bombing raid hit the base and Galen died in her arms in the rain, after Krennic had already executed his team.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"scarif":{"name":"Scarif","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/30.webp","region":"Outer Rim","climate":"Tropical","terrain":"Islands, beaches, palm forests","bio":"A tropical paradise of turquoise lagoons and palm-covered islands, protected by a shield gate. It hid the Empire's main data vault, the Citadel, holding the Death Star plans. Jyn Erso, Cassian Andor and Rogue One fought their way onto its beaches with Rebel fleet support to steal the plans, and none of them came home. The Death Star fired on the Citadel, but the plans were already on their way to Princess Leia.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"cantonica":{"name":"Cantonica (Canto Bight)","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/31.webp","region":"Outer Rim","climate":"Arid","terrain":"Desert, an artificial sea","bio":"A desert planet turned into a playground for the super-rich, built around Canto Bight, a glittering casino city by an artificial sea. Its wealthy guests made their money selling weapons to both sides of the war, and children work in its stables caring for the racing fathiers. Finn and Rose came here looking for a codebreaker, and ended up freeing the fathiers in a stampede through the city.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"crait":{"name":"Crait","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/32.webp","region":"Outer Rim","climate":"Cold, dry","terrain":"Salt flats over red mineral soil","bio":"A small mineral world covered in white salt that leaves a red trail where anything moves across it. The Rebellion once had an old outpost here, and the last of the Resistance took shelter in it after fleeing D'Qar. The First Order came with walkers and a battering ram cannon. Luke Skywalker walked out alone to face Kylo Ren, buying time for the Resistance to escape.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"corellia":{"name":"Corellia","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/33.webp","region":"Core Worlds","climate":"Temperate","terrain":"Cities, shipyards, plains","bio":"An industrial Core World famous for its shipyards, which have built many of the galaxy's starships, from Corellian corvettes to the YT-1300 freighter that became the Millennium Falcon. Its gritty streets are run by gangs, and young street thieves work for the likes of Lady Proxima. Han Solo grew up here, and fled by joining the Imperial Navy, leaving Qi'ra behind. Corellians are known as great pilots, and stubborn ones.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"mimban":{"name":"Mimban","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/34.webp","region":"Mid Rim","climate":"Wet","terrain":"Mud, swamp, jungle","bio":"A grey, muddy world wrapped in fog where the Empire fought a long, miserable war against the locals to take its minerals. Han Solo served as an infantryman in its trenches after being thrown out of flight school. In the mud he met Tobias Beckett's crew, and was thrown into a pit with a 'beast' that turned out to be a Wookiee named Chewbacca.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"vandor":{"name":"Vandor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/35.webp","region":"Mid Rim","climate":"Cold","terrain":"Snowy mountains, frozen lakes","bio":"A cold world of snowy peaks and frozen lakes, a quiet stop on the edge of nowhere. Tobias Beckett's crew, with Han and Chewbacca, tried to steal a cargo of coaxium from an Imperial conveyor train winding through its mountains. Enfys Nest's raiders arrived, the train went over a cliff, and Beckett's crew lost the cargo and some of its own, leaving them in debt to Dryden Vos.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"kessel":{"name":"Kessel","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/36.webp","region":"Outer Rim","climate":"Polluted","terrain":"Mines, barren rock","bio":"A poisoned mining world near a black hole cluster called the Maw. Slaves and droids dig up its rare spice for the Pyke Syndicate. Han, Chewbacca, Lando and L3-37 raided its mines to steal unrefined coaxium, then fled through the Maw on the Kessel Run, the famous route Han made in 'less than twelve parsecs' by taking a dangerous short cut in the Millennium Falcon.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"savareen":{"name":"Savareen","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/37.webp","region":"Outer Rim","climate":"Dry, windy","terrain":"Desert, coasts","bio":"A dry, windswept planet on the edge of a sea, where a small community runs an old coaxium refinery. Han and Chewbacca landed the battered Millennium Falcon here to refine the stolen fuel. The deal turned into a showdown: Enfys Nest's real mission was revealed, Beckett betrayed Han, and on these sands Han Solo shot first.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"ajan-kloss":{"name":"Ajan Kloss","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/38.webp","region":"Outer Rim","climate":"Humid","terrain":"Jungle, caves","bio":"A jungle moon of thick forest and hidden caves. Years earlier, Leia trained here as a Jedi under her brother Luke. Later it became the final base of the Resistance, where Rey continued her training with Leia, and where the Resistance gathered its last ships before flying to Exegol. Leia died here, at peace, after reaching out to her son Ben one last time.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"exegol":{"name":"Exegol","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/39.webp","region":"Unknown Regions","climate":"Stormy","terrain":"Barren rock, lightning storms","bio":"A dark, hidden world deep in the Unknown Regions, wrapped in lightning storms and hard to find without a Sith wayfinder. It was the secret home of the Sith Eternal, the cult that kept Palpatine alive and built his fleet of planet-killing Star Destroyers. Rey faced the Emperor in the ancient Sith citadel here, while ordinary people across the galaxy flew in to fight his fleet.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"pasaana":{"name":"Pasaana","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/40.webp","region":"Mid Rim","climate":"Hot, dry","terrain":"Desert, canyons","bio":"A desert world of red canyons and sand, home of the cheerful Aki-Aki people, who celebrate a festival of colours once every 42 years. Rey, Finn, Poe and Chewbacca arrived during the festival, looking for clues to Exegol. They found Lando Calrissian, the abandoned ship of a Sith hunter and a dagger, and Rey fought Kylo Ren's TIE fighter in the desert with a single cut.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"kijimi":{"name":"Kijimi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/41.webp","region":"Mid Rim","climate":"Frigid","terrain":"Snowy mountains, cities","bio":"A cold, snowy mountain world with a crowded city built into the cliffs, full of thieves and smugglers. It is where Poe Dameron once ran spice, and where his old partner Zorii Bliss still worked. The team came here to find a droidsmith to crack a message in C-3PO's memory. Shortly after they left, the First Order destroyed Kijimi with one of its new Star Destroyers.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"kef-bir":{"name":"Kef Bir","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/42.webp","region":"Outer Rim","climate":"Oceanic","terrain":"Ocean, grasslands, cliffs","bio":"An ocean moon in the Endor system with crashing waves and grassy cliffs. The wreckage of the second Death Star fell here and is still rusting in the sea. Rey went inside it to find the Emperor's wayfinder, then fought Kylo Ren on its broken hull among the huge waves. As Leia called out to her son, Rey ran him through, then healed him.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"nevarro":{"name":"Nevarro","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/43.webp","region":"Outer Rim","climate":"Hot","terrain":"Volcanic rock, lava fields, ash","bio":"A volcanic world of black rock and lava rivers on the Hydian Way. After the Empire fell, its city became a haven for bounty hunters working through Greef Karga's Guild. It is where Din Djarin, the Mandalorian, took the job that led him to Grogu. Karga later cleaned up the town and turned Nevarro into a thriving trading port, and its people never forgot Din and Grogu.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"nal-hutta":{"name":"Nal Hutta","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/44.webp","region":"Hutt Space (Outer Rim)","climate":"Hot, humid","terrain":"Swamps, bogs","bio":"The homeworld of the Hutts, a hot, steamy planet of swamps and greasy rain deep in Hutt Space, far from galactic law. The Grand Hutt Council of the most powerful crime families rules from its palaces, and it has long been a refuge for smugglers, bounty hunters and anyone who wants to stay out of reach of the Republic. Jabba the Hutt was a member of one of its great clans.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"nar-shaddaa":{"name":"Nar Shaddaa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/45.webp","region":"Hutt Space (Outer Rim)","climate":"Polluted","terrain":"City covering the whole moon","bio":"The 'Smuggler's Moon', circling Nal Hutta. Its entire surface is one vertical city of neon, towers and grime, a darker cousin of Coruscant run by Hutt crime lords. Smugglers, bounty hunters and gangsters of every kind do business in its crowded streets, and anything can be bought there. It was home to the bounty hunter Aurra Sing.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"adelphi":{"name":"Adelphi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/46.webp","region":"Outer Rim","climate":"Tropical","terrain":"Beaches, jungles, mountains","bio":"A warm coastal world of beaches and jungle in the Outer Rim. In the early days of the New Republic it hosted one of its outposts, home of the Adelphi Rangers, the X-wing squadron of pilots such as Captain Carson Teva, who kept watch on the lawless edges of the galaxy as Imperial warlords lingered in the shadows.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"shakari":{"name":"Shakari","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/47.webp","region":"Outer Rim","climate":"Varied","terrain":"Moon","bio":"A small moon in the Shakari system of the Outer Rim. In the days of the New Republic it was quietly in the grip of the Imperial warlord Janu Coin. Din Djarin and Grogu, with the Lasat rebel veteran Zeb Orrelios, came looking for Rotta the Hutt, and picked up a lead from Hugo Durant, a fry cook working his little food stand.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"phostera":{"name":"Phostera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/48.webp","region":"Outer Rim","climate":"Frigid","terrain":"Snowy mountains","bio":"A frozen, mountainous world where, after the Battle of Jakku, the Imperial remnant of Commander Barro hid in a base and ran the local towns like his own kingdom, squeezing them for protection money. The Mandalorian, Din Djarin, working as a bounty hunter for the New Republic, raided Barro's stronghold and brought his rule to an end.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"daiyu":{"name":"Daiyu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/49.webp","region":"Expansion Region","climate":"Temperate, rainy","terrain":"Neon city","bio":"A rainy, crowded world under the Empire's control, where its main city glows with neon signs and noodle stalls and is crawling with spice dealers, fake Jedi and bounty hunters. Obi-Wan Kenobi left Tatooine for the first time in ten years to come here when young Leia Organa was kidnapped and held in the city, and he had to rescue her while Inquisitors hunted him.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"mapuzo":{"name":"Mapuzo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/50.webp","region":"Mid Rim","climate":"Dry","terrain":"Plains, mountains, rock formations","bio":"Once a lush, living world, Mapuzo had been stripped into a dusty wasteland by Imperial mining. Obi-Wan and Leia fled here from Daiyu on a cargo transport and found help from Tala, an Imperial officer secretly working with the Path, a network smuggling Jedi to safety. It is also where Darth Vader caught up with his old master for the first time in ten years, and dragged him through fire.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"nur":{"name":"Nur","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/51.webp","region":"Outer Rim","climate":"Ocean","terrain":"Oceans, no land","bio":"An ocean moon in the Mustafar system, covered in deep water with no land at all. The Empire built the Fortress Inquisitorius here, a grim underwater stronghold for the Inquisitors who hunted the last Jedi, where captured Jedi were held in its depths. Young Leia was taken here as a prisoner, and Obi-Wan slipped into the fortress to get her out.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"jabiim":{"name":"Jabiim","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/52.webp","region":"Outer Rim","climate":"Rainy","terrain":"Rocky plains, caves","bio":"An obscure, rocky mining world in the Outer Rim. In the time of the Empire, a hidden base of the Path, a secret network that smuggled Jedi and other Force-sensitives away from the Inquisitors, was run here by Tala Durith and Roken. Obi-Wan and Leia led the refugees here, and a few brave people held off the Inquisitors so the rest could escape.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"arcana":{"name":"Arcana","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/53.webp","region":"Outer Rim","climate":"Cold","terrain":"Barren rock","bio":"A barren world holding an ancient stronghold built by the Nightsisters of Dathomir thousands of years ago. Inside, Ahsoka Tano found a puzzle-locked star map believed to show the way to Grand Admiral Thrawn, who had vanished from the galaxy. Retrieving it set off a race between Ahsoka and Morgan Elsbeth's allies that ended in another galaxy.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"seatos":{"name":"Seatos","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/54.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, oceans","bio":"A world of forests and seas with mysterious ruins built by an ancient species from another galaxy. The ruins hid a giant hyperspace ring meant to carry travellers to another galaxy, powered by the star map. Ahsoka followed Morgan Elsbeth here, Sabine Wren and Ahsoka fought Baylan Skoll and Shin Hati, and Sabine traded the map for the chance to find Ezra.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"peridea":{"name":"Peridea","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/55.webp","region":"Another galaxy","climate":"Varied","terrain":"Wastelands, grasslands, mountains","bio":"A planet in a whole other galaxy, ringed by the bones of the giant space whales called purrgil. Jedi children told legends of it. It was once the heart of an old witch kingdom of the Dathomiri, now in ruins, and home of the little Noti people. Ezra Bridger and Grand Admiral Thrawn were stranded here after Lothal was freed, until Sabine and Ahsoka came.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"lothal":{"name":"Lothal","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/56.webp","region":"Outer Rim","climate":"Temperate","terrain":"Grassy plains, rock spires, cities","bio":"A rolling grassland world with tall rock spires, once a farming planet before the Empire scarred it with factories. It was home to Ezra Bridger and the rebel crew of the Ghost, who freed it from the Empire. Ezra disappeared with Grand Admiral Thrawn in the battle, and years later Hera, Sabine and Ahsoka looked out from Lothal, still waiting for him to come home.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"dathomir":{"name":"Dathomir","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/57.webp","region":"Outer Rim","climate":"Temperate","terrain":"Red forests, swamps, rocky plains","bio":"A blood-red world of twisted forests and swamps, home to the Nightsisters, witches who wield a dark magic, and their Nightbrothers. Darth Maul and Savage Opress came from here. Count Dooku's droids wiped out most of the Nightsisters during the Clone Wars, but their magic lingered, and Morgan Elsbeth's people believed it could bring back those who were thought lost.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"},{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"at-attin":{"name":"At Attin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/58.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, hills, neat suburbs","bio":"A hidden planet of tidy towns and woods, sealed behind a barrier that blocks out the stars, where people work as 'analysts' in the Great Work of the Old Republic. To the rest of the galaxy it is a legend: a treasure world full of riches. Wim, Neel, Fern and KB come from here, and when they stumble on a buried starship they set off pirates and all on a trail back home.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"borgo-prime":{"name":"Borgo Prime","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/59.webp","region":"Outer Rim","climate":"None","terrain":"Asteroid, docks","bio":"Starport Borgo, a pirate haven built into an asteroid on the Braxant Run, with crowded markets, dodgy cantinas and docks where almost anything can be bought or sold. Maz Kanata marked it on a smugglers' map long ago. The At Attin kids landed here aboard the Onyx Cinder, a long way from home, in a port run by pirates.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"lanupa":{"name":"Lanupa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/60.webp","region":"Outer Rim","climate":"Frigid","terrain":"Mountains","bio":"A cold mountain world once known as Battle World. Its Skull Ridge Mountain was a terrifying pirate stronghold with acid baths and fighting pits, until it was turned into a luxury hotel and spa with mud baths, bacta soaks and buffets, much to SM-33's disgust. It is also home of the trash crabs, which wear bits of scrap as shells.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"at-achrann":{"name":"At Achrann","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/61.webp","region":"Unknown","climate":"Temperate","terrain":"Forests","bio":"One of the nine hidden 'Jewels of the Old Republic', a sister world to At Attin that looks very much like it from the ground. By the New Republic Era it had fallen into war between two tribes, the Troik and the Hattan. The kids landed here thinking it was home, and Neel found it was anything but.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"observatory-moon":{"name":"Observatory Moon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/62.webp","region":"Unknown","climate":"Cold","terrain":"Rocky","bio":"A cold, rocky moon circling a gas giant, home to an old observatory run by the wise astronomer Kh'ymm. Jod Na Nawood brought the lost At Attin kids here in hope she could find their planet among the stars. She helped them, but quietly called in New Republic X-wings to arrest Jod, and the kids had to escape with the coordinates.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"ueda":{"name":"Ueda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/63.webp","region":"Outer Rim","climate":"Temperate, coastal","terrain":"Forested island chains","bio":"A remote world of green island chains linked by land bridges, a haven for wanderers of every species. Its port village, Point Ueda, has a landing pad and a little noodle shop. It is where the story of the High Republic's fall begins: a masked assassin walked into a cantina here and challenged Jedi Master Indara to a fight.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"olega":{"name":"Olega","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/64.webp","region":"Mid Rim","climate":"Temperate","terrain":"Island chains, cities","bio":"A world of island chains far from Coruscant, home to Olega City and a temple of the Jedi Order in the High Republic Era. Jedi Master Torbin had taken a vow of silence and meditated here for years when the assassin Mae Aniseya came to kill him. Master Sol, Jecki, Yord and Osha confronted Mae here, but she slipped away.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"carlac":{"name":"Carlac","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/65.webp","region":"Outer Rim","climate":"Cold","terrain":"Blue-sand deserts, snowy forests, mountains","bio":"A peaceful, sparsely populated cold world of blue-sand deserts and snowy forests, with monasteries in its north and a small colony in its south. When a Republic prison transport came down in its wilds, the crash set the Jedi and the twin sisters Osha and Mae on a collision course.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"khofar":{"name":"Khofar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/66.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, jungle, ravines","bio":"A wild planet of forests, jungles and deep ravines in the Outer Rim. The Wookiee Jedi Master Kelnacca lived here alone in a jungle hut. Mae came to kill him, and Master Sol and his Jedi were close behind her. In its forest, a masked dark-side warrior appeared, and in the fight that followed many Jedi lost their lives.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"brendok":{"name":"Brendok","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/67.webp","region":"Wild Space","climate":"Temperate","terrain":"Mountains, forests","bio":"A mysterious planet in Wild Space that died during a catastrophe and somehow came back to life. A group of Jedi led by Master Indara came to find out why, and found a coven of witches led by Mother Aniseya, with twin girls, Osha and Mae, created through the Force. The night that followed destroyed the coven and set the story of The Acolyte in motion.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"bal-demnic":{"name":"Bal'demnic","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/68.webp","region":"Outer Rim","climate":"Oceanic","terrain":"Vast oceans, islands","bio":"An unexplored ocean world of vast seas and island chains, once known only by a catalogue number. It is famous for its cortosis, a rare ore that can short out a lightsaber. A former Jedi turned Sith known as the Stranger hid here, and Osha was brought to his island to be tempted by the dark side.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"janix":{"name":"Janix","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/69.webp","region":"Mid Rim","climate":"Temperate","terrain":"Jungle, mountains, a city in a crater","bio":"A world of jungles and mountains whose capital is a neon-lit, shadowy city of skyscrapers built inside a giant crater. It governs itself with a fragile peace between its defence force and the crime syndicates that quietly run the streets. After the Clone Wars, Maul came here to rebuild his criminal empire, just as the Empire and its Inquisitors arrived.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"oba-diah":{"name":"Oba Diah","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/70.webp","region":"Outer Rim","climate":"Harsh","terrain":"Jutting obsidian mountains","bio":"The homeworld of the Pykes, a world of jagged black mountains at the end of the Kessel Run. From their high fortress the Pyke Syndicate controls the spice from Kessel and sends it out across the galaxy, making them one of the most powerful crime families around and important partners, and rivals, for anyone like Maul hoping to build a criminal empire.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"kenari":{"name":"Kenari","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/71.webp","region":"Mid Rim","climate":"Temperate","terrain":"Forests, mining wastelands","bio":"A forest world wrecked by Republic mining, where the only survivors were tribes of orphaned children living wild in the woods. Cassian Andor was born here as Kassa. When a Republic ship crashed nearby, the scavengers Maarva and Clem Andor found him and took him away to Ferrix, and Kenari was later poisoned beyond saving.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"ferrix":{"name":"Ferrix","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/72.webp","region":"Outer Rim","climate":"Temperate","terrain":"Salvage yards, industrial town","bio":"A tough, close-knit salvage town of workshops and scrapyards, where a bell rings to start and end the working day. Cassian grew up here with Maarva and his droid B2EMO. When the Empire tightened its grip, Maarva's funeral speech, played from a hologram, turned Ferrix's quiet anger into a riot against the stormtroopers.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"aldhani":{"name":"Aldhani","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/73.webp","region":"Core Worlds","climate":"Temperate","terrain":"Highlands, grassy plains","bio":"A highland world where the native Dhani gather once every three years to watch a meteor shower they call the Eye. The Empire built a garrison here holding a whole sector's payroll, and a small rebel cell led by Vel Sartha, with Cassian among them, robbed it during the Eye, a heist that shook the Empire.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"narkina-5":{"name":"Narkina 5","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/74.webp","region":"Outer Rim","climate":"Oceanic","terrain":"Shallow sea, rocky islands","bio":"A water moon hiding a grim Imperial prison where inmates build machine parts in shifts on electrified floors, competing against each other for scraps. Cassian was sent here on a trumped-up charge, and with Kino Loy led a breakout across the sea. One way out!","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"ghorman":{"name":"Ghorman","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/75.webp","region":"Colonies","climate":"Temperate","terrain":"Mountains, valleys, cities","bio":"A proud, cultured world known for its fine silk and fashion, and for the spiders that make it. The Empire secretly wanted its minerals, so Director Krennic and the ISB stirred up trouble to justify a crackdown. The massacre in its main square made Ghorman a rallying cry and led Mon Mothma to denounce the Emperor.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"mina-rau":{"name":"Mina-Rau","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/76.webp","region":"Outer Rim","climate":"Temperate","terrain":"Farmland, grasslands, hills","bio":"A quiet farming world of grain fields and slow seasons. Cassian and Bix tried to make a peaceful life here, working the harvest, until the Empire's new automated harvesters, and the Rebellion's needs, caught up with them.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"ryloth":{"name":"Ryloth","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/77.webp","region":"Outer Rim","climate":"Hot and arid","terrain":"Mountains, plains, caves","bio":"The homeworld of the Twi'leks, a dry, rocky planet with cities carved into cliffs. The Separatists invaded it in the Clone Wars and the Republic, with the freedom fighter Cham Syndulla, won it back. Cham's daughter Hera grew up here and became one of the Rebellion's greatest pilots.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"umbara":{"name":"Umbara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/78.webp","region":"Expansion Region","climate":"Dark","terrain":"Glowing jungle, dark cities","bio":"A world that never sees full daylight, lit only by strange glowing plants. During the Clone Wars Captain Rex and the 501st fought a brutal campaign there under the Jedi General Pong Krell, who turned out to be a traitor sending clones to fight each other, one of the darkest stories of the war.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"onderon":{"name":"Onderon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/79.webp","region":"Inner Rim","climate":"Temperate","terrain":"Jungle, walled cities","bio":"A jungle world with a great walled capital, Iziz. When a puppet king handed it to the Separatists, a group of rebels led by Steela and Saw Gerrera fought to free it, with help from Anakin, Obi-Wan and Ahsoka. Saw learned his rebel ways, and lost his sister, here.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"florrum":{"name":"Florrum","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/80.webp","region":"Outer Rim","climate":"Hot and dry","terrain":"Sulphur deserts, geysers","bio":"A smelly desert world of sulphur pits and geysers, home base of the pirate Hondo Ohnaka and his gang. Hondo once held Count Dooku for ransom here, and later Ahsoka and a group of younglings landed in his hands.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"serenno":{"name":"Serenno","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/81.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, mountains","bio":"A wealthy forest world, home of the aristocratic House of Dooku. Count Dooku ruled from its grand palace during the Clone Wars, and both Republic agents and bounty hunters came here to get at him.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"atollon":{"name":"Atollon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/82.webp","region":"Outer Rim","climate":"Arid","terrain":"Dry plains, mesas","bio":"A dry, out-of-the-way planet where Phoenix Squadron set up Chopper Base in Rebels, home to giant spider-like krykna and a mysterious being called the Bendu, who taught Kanan to see beyond the light and the dark. Grand Admiral Thrawn finally found the base and laid siege to it.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"garel":{"name":"Garel","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/83.webp","region":"Outer Rim","climate":"Temperate","terrain":"Cities, spaceport","bio":"A busy spaceport world where the rebel crew of the Ghost often met contacts and ran missions, and where the Empire ran an important cargo hub.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"malachor":{"name":"Malachor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/84.webp","region":"Outer Rim","climate":"Cold","terrain":"Ruined Sith temple, ash plains","bio":"A dead world scarred by an ancient battle, holding a Sith temple that can become a superweapon. Ezra, Kanan and Ahsoka came here looking for answers, and found Maul and the Inquisitors. Here Ahsoka faced her old master, Darth Vader, and Kanan lost his sight.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"ord-mantell":{"name":"Ord Mantell","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/85.webp","region":"Mid Rim","climate":"Temperate","terrain":"Cities, scrap fields","bio":"A rough port world full of smugglers and scrap. Clone Force 99 often came here to see Cid, a Trandoshan dealer who handed out jobs from her parlour. Han Solo famously ran into a bounty hunter here years later.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"pabu":{"name":"Pabu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/86.webp","region":"Outer Rim","climate":"Temperate","terrain":"Island towns, seas","bio":"A peaceful island town built on a rock in the sea, a haven for refugees from the Clone Wars and the Empire. Clone Force 99 and Omega hid here for a time, and Omega finally found something like a home.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"wayland":{"name":"Wayland","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/87.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, mountains","bio":"A misty mountain world where the Empire hid a secret cloning laboratory deep inside Mount Tantiss. Dr Hemlock held Omega and other test subjects there, and it was where the Bad Batch's final battle took place.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"bracca":{"name":"Bracca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/88.webp","region":"Mid Rim","climate":"Temperate","terrain":"Ship scrapyards","bio":"A grey junkyard world where the old warships of the Clone Wars are cut up for parts by the Scrapper Guild. The Bad Batch visited, and it was where a young Cal Kestis hid as a scrapper after Order 66.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"arvala-7":{"name":"Arvala-7","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/89.webp","region":"Outer Rim","climate":"Hot, dry","terrain":"Desert, hardened mud","bio":"A barren desert world where the Mandalorian found his bounty: a small green child in a floating cradle. Here he met the Ugnaught Kuiil (\"I have spoken\"), learned to ride a blurrg, and teamed up with IG-11 to raid the camp where the child was kept.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"sorgan":{"name":"Sorgan","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/90.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, lakes, krill ponds","bio":"A quiet forest world with villages that farm shrimp-like krill in ponds. Din Djarin came looking for somewhere to hide with Grogu, met the ex-rebel Cara Dune, and together they trained the villagers to fight off raiders and their stolen AT-ST.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"trask":{"name":"Trask","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/91.webp","region":"Outer Rim","climate":"Wet","terrain":"Oceans, estuary","bio":"A wet estuary moon full of fishing boats and sea creatures. Din Djarin brought the Frog Lady and her eggs here, nearly lost Grogu to a sea monster, and met Bo-Katan Kryze and her Mandalorians, who told him about the Jedi.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"corvus":{"name":"Corvus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/92.webp","region":"Outer Rim","climate":"Grey","terrain":"Burned forests, walled city","bio":"A grey, burned forest world around the walled city of Calodan, ruled by the Imperial magistrate Morgan Elsbeth. Din Djarin took Grogu here to find Ahsoka Tano, who fought her way into the city to free its people.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"concordia":{"name":"Concordia","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/93.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, mountains, mines","bio":"A forest moon of Mandalore, home to the Death Watch's hideouts in its abandoned mines during the Clone Wars, and later a refuge for Mandalorians after their homeworld was ruined.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"shili":{"name":"Shili","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/94.webp","region":"Expansion Region","climate":"Temperate","terrain":"Colourful grasslands, forests","bio":"The homeworld of the Togruta, a world of bright red and white grasslands. In Tales of the Jedi a baby Ahsoka Tano is shown here with her mother, and her first brush with the Force on a hunt.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"}]},"raxus-secundus":{"name":"Raxus Secundus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/95.webp","region":"Outer Rim","climate":"Temperate","terrain":"Forests, hills, oceans","bio":"The beautiful capital of the Separatists during the Clone Wars, where their parliament met, and a world that features in Count Dooku's turn away from the Jedi in Tales of the Jedi.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"duro":{"name":"Duro","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/96.webp","region":"Core Worlds","climate":"Temperate","terrain":"Polluted cities, orbital stations","bio":"The homeworld of the Duros, a blue-skinned people of starship pilots and travellers. The bounty hunter Cad Bane grew up here, and in Tales of the Underworld his past catches up with him.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"muunilinst":{"name":"Muunilinst","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/97.webp","region":"Outer Rim","climate":"Temperate","terrain":"Cities, plains","bio":"The homeworld of the InterGalactic Banking Clan, run by the tall, thin Muuns. In the 2003 Clone Wars, Obi-Wan led a huge assault on it, while Anakin fought a dogfight in the skies above.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]},"hypori":{"name":"Hypori","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/98.webp","region":"Outer Rim","climate":"Harsh","terrain":"Barren rock","bio":"A barren world with a Separatist droid factory, where General Grievous made his first appearance in the 2003 Clone Wars, hunting a group of Jedi through a crashed Republic ship and showing how dangerous he was.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]},"mon-cala":{"name":"Mon Cala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/99.webp","region":"Outer Rim","climate":"Oceanic","terrain":"Global ocean","bio":"An ocean world, home of the Mon Calamari, who build great curved star cruisers, and the Quarren. Its people fought beneath its waves in the Clone Wars and later built the Rebel fleet's biggest ships.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"nelvaan":{"name":"Nelvaan","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/100.webp","region":"Outer Rim","climate":"Frozen","terrain":"Snowy mountains, caves","bio":"A frozen world of the wolf-like Nelvaanians. In the 2003 Clone Wars, Anakin goes through a vision-filled trial in a cave here, glimpsing the dark future waiting for him, before freeing the Nelvaanians from a Separatist laboratory.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]},"christophsis":{"name":"Christophsis","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/288.webp","region":"Outer Rim","climate":"Temperate","terrain":"Crystal forests, crystal cities","bio":"A dazzling world where whole cities and forests are made of glittering crystal. Its battle opened the Clone Wars on screen: Anakin and Obi-Wan held off a Separatist droid army in its glassy streets, and a young Togruta Padawan named Ahsoka Tano arrived in the middle of it to meet her new master.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"teth":{"name":"Teth","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/289.webp","region":"Wild Space","climate":"Temperate","terrain":"Jungle, tall mesas","bio":"A jungle world of towering stone mesas, one of them topped by an old monastery. Jabba's kidnapped son Rotta was hidden there, and Anakin and Ahsoka led their clones straight up the cliff walls under fire to rescue the smelly little Huttlet.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"rodia":{"name":"Rodia","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/290.webp","region":"Outer Rim","climate":"Hot, humid","terrain":"Jungles, swamps, oceans","bio":"The steamy home of the Rodians, green-skinned hunters like Greedo. During the Clone Wars its starving people were tempted by Separatist food, until Padmé and Jar Jar exposed the trap and Nute Gunray himself was captured in Rodia's capital.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"maridun":{"name":"Maridun","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/291.webp","region":"Outer Rim","climate":"Temperate","terrain":"Grassy plains, savannah","bio":"A quiet grassland world where the peaceful Lurmen lived in a tree village. Ahsoka and Aayla Secura sheltered a wounded Anakin there, and when the Separatists came to test a terrible new weapon on the village, the pacifist Lurmen finally chose to defend themselves.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"malastare":{"name":"Malastare","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/292.webp","region":"Mid Rim","climate":"Temperate","terrain":"Forests, rocky plains","bio":"Home of the Dugs and a famous podracing world. During the Clone Wars a Republic electro-proton bomb cracked its surface and woke the Zillo Beast, a giant creature that was shipped to Coruscant for study and broke loose through the capital.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"vanqor":{"name":"Vanqor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/293.webp","region":"Outer Rim","climate":"Temperate","terrain":"Rocky wastes, caves","bio":"A rocky, gundark-infested world where the sabotaged Star Destroyer Endurance came down. Mace Windu, Anakin and a group of clone cadets survived the crash, and the young Boba Fett, who had caused it, slipped away with Aurra Sing.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"mortis":{"name":"Mortis","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/294.webp","region":"Wild Space","climate":"Changing","terrain":"Floating mountains, forests, molten caverns","bio":"A strange world inside a crystal monolith, where the Force itself takes shape as the Father, the light Daughter and the dark Son. Its seasons change in moments. Anakin was tested there as the Chosen One, and saw his own dark future before the memory was taken away.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"lola-sayu":{"name":"Lola Sayu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/295.webp","region":"Outer Rim","climate":"Harsh","terrain":"Volcanic cliffs, caves","bio":"A cracked, slowly crumbling volcanic world that glows purple from orbit, home to the Citadel, an old prison built to hold rogue Jedi. The Separatists took it over, and Anakin, Obi-Wan and Ahsoka broke in to rescue Even Piell and Captain Tarkin. Piell died there, but the secret he carried got home.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"trandosha":{"name":"Trandosha","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/296.webp","region":"Mid Rim","climate":"Temperate","terrain":"Forests, jungles","bio":"The home of the reptilian Trandoshans, a species of hunters and the old enemies of the Wookiees next door on Kashyyyk. Its moon Wasskah became the hunting ground where captured Jedi younglings, Ahsoka among them, were released as prey.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"wasskah":{"name":"Wasskah","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/297.webp","region":"Mid Rim","climate":"Temperate","terrain":"Forests, jungle islands","bio":"A forested moon of Trandosha used by Garnac's hunters as a private game reserve, with captured younglings as the prey. Ahsoka organised the other prisoners to survive, and with the help of a captured Chewbacca and a Wookiee rescue party they turned the hunt around.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"aleen":{"name":"Aleen","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/298.webp","region":"Mid Rim","climate":"Temperate","terrain":"Rocky mesas, deserts, underground caverns","bio":"A rocky world of the small Aleena, hit by violent earthquakes during the Clone Wars. R2-D2 and C-3PO went down with the Republic's aid mission and found the cause in the caverns below, where the underground Kindalo had been disturbed.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"zygerria":{"name":"Zygerria","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/299.webp","region":"Outer Rim","climate":"Temperate","terrain":"Plains, mesas, highlands","bio":"The home of a feline slaving empire that the Jedi had once crushed. During the Clone Wars Queen Miraj Scintel tried to revive it with Dooku's help, selling a whole colony of Togruta; Anakin, Ahsoka and Obi-Wan went undercover in her palace to free them.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"kadavo":{"name":"Kadavo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/300.webp","region":"Wild Space","climate":"Cold","terrain":"Volcanic","bio":"A gloomy volcanic world where the Zygerrians ran a slave processing centre perched over a fiery pit. Obi-Wan and Captain Rex were held there among the Togruta prisoners, until Anakin, Ahsoka and Plo Koon's fleet came to free them.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"abafar":{"name":"Abafar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/301.webp","region":"Outer Rim","climate":"Hot, dry","terrain":"Endless white desert","bio":"A blank, blinding world with no horizon, known as the Void, where the only thing worth taking is rhydonium fuel. Colonel Gascon and R2-D2's droid squad got lost in its whiteness hunting a Separatist encryption module.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"zanbar":{"name":"Zanbar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/302.webp","region":"Outer Rim","climate":"Temperate","terrain":"Swamps, rocky plateaus","bio":"A swampy moon of tall rocky plateaus where Death Watch hid a camp during the Clone Wars. After Maul and Savage joined them it became a base of the Shadow Collective, and the Separatists attacked it when Dooku and Sidious came to deal with Maul.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"scipio":{"name":"Scipio","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/303.webp","region":"Outer Rim","climate":"Frigid","terrain":"Icy hills and mountains","bio":"The snowy headquarters of the InterGalactic Banking Clan, neutral ground where both sides of the war kept their money. Padmé's old friend Rush Clovis rose to run its banks with Palpatine's secret help, and his rule ended in a crash on Coruscant.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"bardotta":{"name":"Bardotta","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/304.webp","region":"Colonies","climate":"Cold","terrain":"Mountains, highlands","bio":"A remote world of art and music, ruled by a queen who follows the advice of the mystical Dagoyan Order, who have little love for the Jedi. When its elders began to vanish, Queen Julia asked her old friend Jar Jar Binks for help, and he and Mace Windu found the Frangawl cult and Mother Talzin behind it.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"moraband":{"name":"Moraband","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/305.webp","region":"Outer Rim","climate":"Hot","terrain":"Red desert, tombs of Sith Lords","bio":"The ancient Sith homeworld, once called Korriban: a red, wind-blasted valley of tombs and giant statues. Guided by Qui-Gon's voice, Yoda faced the spirits of the dead Sith there and resisted Darth Sidious's illusions.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"anaxes":{"name":"Anaxes","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/306.webp","region":"Outer Rim","climate":"Temperate","terrain":"Canyons, forests, shipyards","bio":"A key Republic shipyard world, fought over for most of the Clone Wars. When the Separatists started predicting every Republic move, Rex and Anakin's mission with the Bad Batch began here, and its war room led them to the captured Echo.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"skako-minor":{"name":"Skako Minor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/307.webp","region":"Core Worlds","climate":"Temperate","terrain":"Canyons, fungal forests, cliffs","bio":"A cliff-covered world of the Poletec, who live high above the ground and ride the eagle-like keeradaks. The Separatists kept Echo, half-dead and wired into their computers, in a Techno Union base there until Rex and the Bad Batch broke him out.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"stygeon-prime":{"name":"Stygeon Prime","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/308.webp","region":"Outer Rim","climate":"Cold, stormy","terrain":"Mountains, ice","bio":"A storm-blasted world home to the Spire, an Imperial prison for the Empire's most dangerous enemies. The Ghost crew broke in to rescue Jedi Master Luminara Unduli, only to find she was already dead and her image used as bait by the Grand Inquisitor.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"seelos":{"name":"Seelos","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/309.webp","region":"Outer Rim","climate":"Hot, dry","terrain":"Salt flats, mountains","bio":"A blinding white salt desert where Captain Rex, Wolffe and Gregor were living out their old age in a refitted AT-TE, hunting giant joopa worms. The Ghost crew found them there, and Rex rejoined the fight against the Empire.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"concord-dawn":{"name":"Concord Dawn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/310.webp","region":"Outer Rim","climate":"Temperate","terrain":"Farmland, rocky moons","bio":"An old Mandalorian farming world, home of the Journeyman Protectors who once kept the peace there. Under the Empire its Protectors, led by Fenn Rau, guarded the hyperspace lanes and shot down rebel ships, until Sabine and Kanan won Rau to their side.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"lira-san":{"name":"Lira San","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/311.webp","region":"Wild Space","climate":"Temperate","terrain":"Grassland, rock spires","bio":"The legendary homeworld of the Lasat, hidden at the centre of a star cluster and found only by following an ancient prophecy. Zeb and the last Lasat survivors found it, and after the war Zeb settled there among his own people at last.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"krownest":{"name":"Krownest","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/312.webp","region":"Outer Rim","climate":"Frigid","terrain":"Snowy forests, mountains","bio":"A cold, wild world where Sabine Wren's family, Clan Wren, lived in their fortress after leaving Mandalore. Sabine came home there with the Darksaber, and her mother Ursa had to choose between the Empire and her daughter.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"mykapo":{"name":"Mykapo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/313.webp","region":"Outer Rim","climate":"Temperate","terrain":"Mountains, settlements","bio":"A small Outer Rim world whose teenage resistance fighters, the Iron Squadron, held out against the Empire in an old Republic corvette. The Ghost crew helped them escape Thrawn's blockade and join the Rebellion.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"chandrila":{"name":"Chandrila","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/314.webp","region":"Core Worlds","climate":"Temperate","terrain":"Rolling hills, lakes","bio":"A peaceful, green Core World known for its democracy, home of Mon Mothma. Her daughter Leida's lavish wedding there was the cover for dangerous meetings, as Mon worked to keep her funding of the Rebellion hidden from the Empire.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"dantooine":{"name":"Dantooine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/315.webp","region":"Outer Rim","climate":"Temperate","terrain":"Grasslands, forests, lakes","bio":"A quiet, grassy world on the edge of the galaxy. In the Clone Wars Mace Windu fought a droid army there with his bare hands, and later the Rebellion hid a base on Dantooine; Leia named it to Tarkin, knowing it had already been abandoned.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]}},"ships":{"millennium-falcon":{"name":"Millennium Falcon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/101.webp","type":"Modified YT-1300 light freighter","maker":"Corellian Engineering Corporation","length":"34.5 m","bio":"The fastest hunk of junk in the galaxy. Lando Calrissian lost her to Han Solo in a game of sabacc, and Han and Chewbacca turned the battered freighter into a legend: the Kessel Run in under twelve parsecs, the rescue of Princess Leia, the attack on the second Death Star. Decades later a young scavenger named Rey found her sitting under a tarp on Jakku.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"tantive-iv":{"name":"Tantive IV","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/102.webp","type":"CR90 corvette","maker":"Corellian Engineering Corporation","length":"150 m","bio":"Bail Organa's diplomatic ship, which carried baby Leia home to Alderaan. Years later, with the stolen Death Star plans aboard, it was chased down by Darth Vader's Star Destroyer above Tatooine, just after Leia hid the plans and a message inside R2-D2. Leia used it again in her final years as general of the Resistance.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"ds-1-orbital-battle-station":{"name":"Death Star","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/103.webp","type":"Battle station","maker":"Imperial Military Department of Military Research","length":"About 120 km across","bio":"The Empire's ultimate weapon, a moon-sized battle station with a superlaser that can destroy a planet. Built in secret over twenty years, partly from Galen Erso's designs, it destroyed Jedha City, Scarif and Alderaan. Galen had hidden a fatal flaw inside it: a small exhaust port leading to the reactor, which Luke Skywalker hit with a pair of proton torpedoes.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"ds-2-death-star-ii-mobile-battle-station":{"name":"Death Star II","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/104.webp","type":"Battle station","maker":"Imperial Military Department of Military Research","length":"About 200 km across","bio":"A bigger second Death Star, built above the forest moon of Endor and deliberately left half-finished as bait. The Emperor let the Rebels learn its location and waited for them with a fully working superlaser. It was destroyed when Lando Calrissian and Wedge Antilles flew into its core, while inside, Darth Vader turned on the Emperor.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"t-65b-x-wing-starfighter":{"name":"X-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/105.webp","type":"T-65B space superiority fighter","maker":"Incom Corporation","length":"12.5 m","bio":"The Rebel Alliance's workhorse fighter, with four wings that split into an X for combat and a droid socket for an astromech like R2-D2. Luke Skywalker flew one as Red Five to destroy the first Death Star, crash-landed one in Dagobah's swamp, and watched Yoda lift it out with the Force.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"t-65-x-wing-starfighter":{"name":"X-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/106.webp","type":"T-65 X-wing starfighter","maker":"Incom Corporation","length":"12.5 m","bio":"The classic X-wing, the fighter that won the Galactic Civil War and became the backbone of the New Republic's patrols. Pilots like Wedge Antilles and Luke Skywalker made it famous, and years later its sight still means help is coming, or trouble, for anyone hiding from the law.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"btl-y-wing-starfighter":{"name":"Y-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/107.webp","type":"Starfighter-bomber","maker":"Koensayr Manufacturing","length":"16 m","bio":"A tough, slow fighter-bomber first built for the Republic during the Clone Wars. By the time of the Rebellion many were old and patched together, but they still carried heavy bombs. Gold Squadron flew Y-wings in the Death Star trench run, and Y-wings attacked the shield gate at Scarif.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"tie-ln-space-superiority-starfighter":{"name":"TIE fighter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/108.webp","type":"Space superiority starfighter","maker":"Sienar Fleet Systems","length":"7.2 m","bio":"The Empire's standard fighter, recognisable by its screaming twin ion engines and big hexagonal wings. Cheap and built in huge numbers, it has no shields and no hyperdrive, and its pilots are expected to win through sheer numbers. Its scream is one of the most famous sounds in the galaxy.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"tie-advanced-x1":{"name":"TIE Advanced x1","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/109.webp","type":"Prototype starfighter","maker":"Sienar Fleet Systems","length":"9.2 m","bio":"Darth Vader's personal fighter, an improved TIE with bent wings, shields and a hyperdrive. Vader flew it in the Death Star trench, picking off Rebel pilots one by one and almost catching Luke, until Han Solo came back in the Falcon and sent him spinning off into space.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"imperial-i-class-star-destroyer":{"name":"Star Destroyer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/110.webp","type":"Imperial I-class Star Destroyer","maker":"Kuat Drive Yards","length":"1,600 m","bio":"The dagger-shaped symbol of Imperial power, bristling with guns and carrying TIE fighters, walkers and thousands of troops. The sight of one sliding overhead was enough to make whole systems surrender. The first shot of Star Wars is one of these chasing Tantive IV.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"sandcrawler":{"name":"Sandcrawler","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/111.webp","type":"Mobile fortress","maker":"Corellia Mining Corporation","length":"About 40 m","bio":"Huge rusting treaded vehicles left behind on Tatooine from an old mining operation, now used as rolling homes and workshops by the Jawas. They wander the deserts collecting scrap and stray droids to sell. One of them picked up R2-D2 and C-3PO and sold them to Owen Lars.","seenIn":[{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"executor":{"name":"Executor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/112.webp","type":"Executor-class Star Dreadnought","maker":"Kuat Drive Yards","length":"19,000 m","bio":"Darth Vader's flagship, a Super Star Destroyer many times the size of a normal Star Destroyer. Vader used it to lead the hunt for the Rebels after Hoth and to chase the Millennium Falcon. At the Battle of Endor an A-wing crashed into its bridge and the giant ship plunged into the second Death Star.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"all-terrain-armored-transport":{"name":"AT-AT walker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/113.webp","type":"All Terrain Armored Transport","maker":"Kuat Drive Yards","length":"About 22 m tall","bio":"The Empire's giant four-legged walkers, heavily armoured and almost impossible to stop with blaster fire. At the Battle of Hoth they marched across the snow towards Echo Base. The Rebels' snowspeeders learned to trip them with harpoons and tow cables, and Luke brought one down with a grenade from underneath.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"t-47-airspeeder":{"name":"Snowspeeder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/114.webp","type":"Modified T-47 airspeeder","maker":"Incom Corporation","length":"5.3 m","bio":"Small two-seat airspeeders the Rebels adapted to fly in Hoth's freezing cold. With a pilot in front and a gunner facing backwards working the tow cable, they took on the Imperial walkers. Wedge Antilles and his gunner tripped the first AT-AT by wrapping a cable round its legs.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"slave-i":{"name":"Slave I","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/115.webp","type":"Modified Firespray-31 patrol craft","maker":"Kuat Systems Engineering","length":"21.5 m","bio":"The ship of the bounty hunters Jango Fett and then his son Boba. It flies standing upright and lands lying flat, and it is full of hidden weapons, including seismic charges. Boba Fett used it to follow the Millennium Falcon to Cloud City and carried the frozen Han Solo away to Jabba.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"all-terrain-scout-transport":{"name":"AT-ST walker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/116.webp","type":"All Terrain Scout Transport","maker":"Kuat Drive Yards","length":"8.6 m tall","bio":"A lighter two-legged walker used by the Empire for patrols and support. On Endor they guarded the shield generator and stomped through the forest after the Rebels, until the Ewoks dropped logs and boulders on them and Chewbacca took one over.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"tydirium":{"name":"Tydirium","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/117.webp","type":"Lambda-class T-4a shuttle","maker":"Sienar Fleet Systems","length":"20 m","bio":"A stolen Imperial shuttle that the Rebel strike team used to slip down to the forest moon of Endor. Its old clearance code got them past the Imperial fleet, even though Darth Vader sensed Luke aboard and let them through anyway.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"74-z-speeder-bike":{"name":"Speeder bike","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/118.webp","type":"74-Z speeder bike","maker":"Aratech Repulsor Company","length":"3.3 m","bio":"Fast, light hover bikes used by Imperial scout troopers. On Endor, Luke and Leia stole two of them and raced scouts through the giant trees at deadly speed, in one of the most famous chases in the saga.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"home-one":{"name":"Home One","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/119.webp","type":"MC80 star cruiser","maker":"Mon Calamari Shipyards","length":"1,300 m","bio":"The Rebel Alliance's command ship, a curved Mon Calamari star cruiser. Admiral Ackbar led the attack on the second Death Star from its bridge, and it was there that he realised the Rebels had flown into a trap.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"rz-1-a-wing-interceptor":{"name":"A-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/120.webp","type":"RZ-1 interceptor","maker":"Kuat Systems Engineering","length":"6.9 m","bio":"A tiny, very fast interceptor with little armour, flown by the Rebellion's most daring pilots. At the Battle of Endor an A-wing crashed into the bridge of the Executor, bringing down Darth Vader's Super Star Destroyer.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"a-sf-01-b-wing-starfighter":{"name":"B-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/121.webp","type":"Heavy assault starfighter","maker":"Slayn & Korpil","length":"16.9 m","bio":"An odd-looking but powerful heavy fighter, a long rotating wing with the cockpit at one end, built to attack big capital ships. B-wings joined the Rebel fleet at the Battle of Endor, and Rebels in Phoenix Squadron helped bring the first ones to the Alliance.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"khetanna":{"name":"Khetanna","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/122.webp","type":"Luxury sail barge","maker":"Ubrikkian Industries","length":"30 m","bio":"Jabba the Hutt's luxury sail barge, which carried him and his court out to the Great Pit of Carkoon to feed Luke, Han and Chewbacca to the Sarlacc. Luke had a lightsaber hidden in R2-D2, and the barge ended up in flames after Leia strangled Jabba with her chain.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"j-type-327-nubian-royal-starship":{"name":"Naboo royal starship","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/123.webp","type":"J-type 327 Nubian","maker":"Theed Palace Space Vessel Engineering Corps","length":"76 m","bio":"Queen Amidala's gleaming chrome ship, built to carry the queen in style. It broke through the Trade Federation blockade of Naboo with its hyperdrive damaged, forcing a landing on Tatooine, where the Jedi met a young slave named Anakin Skywalker. R2-D2 saved it during the escape by fixing its shields.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"n-1-starfighter":{"name":"Naboo N-1 starfighter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/124.webp","type":"Royal N-1","maker":"Theed Palace Space Vessel Engineering Corps","length":"11 m","bio":"Elegant yellow and chrome fighters flown by the Royal Naboo Security Forces. Young Anakin hid in one during the Battle of Naboo, took off by accident, flew into the droid control ship and blew it up from the inside, shutting down the whole droid army.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"anakin-skywalker-s-podracer":{"name":"Anakin's podracer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/125.webp","type":"Podracer","maker":"Radon-Ulzer engines","length":"7 m engines","bio":"The podracer nine-year-old Anakin Skywalker built himself from scrap, two huge engines pulling a tiny cockpit. He raced it in the Boonta Eve Classic on Tatooine against the cheating champion Sebulba, and won, which freed him from slavery and let him leave with the Jedi.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"scimitar":{"name":"Scimitar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/126.webp","type":"Sith Infiltrator","maker":"Republic Sienar Systems","length":"26.5 m","bio":"Darth Maul's personal ship, sleek and dark, with a cloaking device. Maul flew it to Tatooine to hunt down Queen Amidala and the Jedi, and landed it there before his first clash with Qui-Gon Jinn in the desert.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"lucrehulk-class-droid-control-ship":{"name":"Droid control ship","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/127.webp","type":"Lucrehulk-class battleship","maker":"Hoersch-Kessel Drive","length":"3,170 m","bio":"A huge ring-shaped Trade Federation ship that sent signals controlling the entire droid army on Naboo. When young Anakin blew up its reactor from inside, every battle droid on the planet shut down at once.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"radiant-vii":{"name":"Radiant VII","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/128.webp","type":"Republic cruiser","maker":"Corellian Engineering Corporation","length":"115 m","bio":"The red diplomatic cruiser that carried Qui-Gon Jinn and Obi-Wan Kenobi to the Trade Federation blockade of Naboo, flying the colours of a ship of peace. The Trade Federation shot it down as soon as the Jedi were aboard their flagship.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"delta-7-aethersprite-class-light-interceptor":{"name":"Jedi starfighter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/129.webp","type":"Delta-7 Aethersprite","maker":"Kuat Systems Engineering","length":"8 m","bio":"A small wedge-shaped fighter used by the Jedi at the start of the Clone Wars, too small for a hyperdrive, so it docks with a ring to jump. Obi-Wan flew one to Kamino and Geonosis and dodged Jango Fett's seismic charges in an asteroid field.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]},"low-altitude-assault-transport-infantry":{"name":"Republic gunship","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/130.webp","type":"LAAT/i gunship","maker":"Rothana Heavy Engineering","length":"17.7 m","bio":"The clone army's gunship, carrying troops and walkers into battle with heavy guns on every side. Gunships swooped into the Geonosis arena to rescue the trapped Jedi in the first battle of the Clone Wars, and flew in almost every battle after.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"acclamator-i-class-assault-ship":{"name":"Acclamator assault ship","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/131.webp","type":"Assault ship","maker":"Rothana Heavy Engineering","length":"752 m","bio":"The first big warships of the Republic's new clone army, carrying troops, walkers and gunships. At the end of Attack of the Clones rows of them lift off from Coruscant, carrying clone troopers to war.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"punworcca-116-class-interstellar-sloop":{"name":"Dooku's solar sailer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/132.webp","type":"Punworcca 116 sloop","maker":"Huppla Pasa Tisc Shipwrights","length":"15.2 m","bio":"Count Dooku's elegant Geonosian ship, pulled through space by a huge sail. Dooku escaped Geonosis in it after defeating Anakin and Obi-Wan and dueling Yoda, and flew it to Coruscant to report to his master, Darth Sidious.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"}]},"j-type-star-skiff":{"name":"Naboo star skiff","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/133.webp","type":"J-type star skiff","maker":"Theed Palace Space Vessel Engineering Corps","length":"29 m","bio":"Senator Padmé Amidala's sleek chrome ship. She and Anakin flew it from Naboo to Tatooine and then on to Geonosis to rescue Obi-Wan, where they were captured themselves.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"}]},"invisible-hand":{"name":"Invisible Hand","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/134.webp","type":"Providence-class dreadnought","maker":"Free Dac Volunteers Engineering Corps","length":"1,088 m","bio":"General Grievous's flagship. During the Battle of Coruscant, Anakin and Obi-Wan fought their way aboard to rescue Chancellor Palpatine, and Anakin killed Count Dooku there. The burning ship broke in half and Anakin crash-landed what was left of it on Coruscant.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"venator-class-star-destroyer":{"name":"Venator Star Destroyer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/135.webp","type":"Venator-class Star Destroyer","maker":"Kuat Drive Yards","length":"1,137 m","bio":"The Republic's main warship during the Clone Wars, a carrier for hundreds of fighters with a red hull and twin towers. Hundreds of them clashed with the Separatist fleet in the skies over Coruscant at the start of Revenge of the Sith.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"arc-170-starfighter":{"name":"ARC-170","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/136.webp","type":"Heavy starfighter","maker":"Incom Corporation","length":"12.7 m","bio":"A big three-seat clone fighter with wings that open in combat. Clone pilots flew them alongside Anakin and Obi-Wan above Coruscant, and Commander Cody's pilots used them to shoot down Jedi Master Plo Koon when Order 66 came through.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"eta-2-actis-class-light-interceptor":{"name":"Jedi interceptor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/137.webp","type":"Eta-2 Actis interceptor","maker":"Kuat Systems Engineering","length":"5.5 m","bio":"The tiny, agile fighters flown by the Jedi in the last months of the Clone Wars, with wings that open in combat. Anakin and Obi-Wan led the charge to rescue the Chancellor in a pair of them, with buzz droids chewing at Obi-Wan's ship.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"theta-class-t-2c-shuttle":{"name":"Theta-class shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/138.webp","type":"Imperial shuttle","maker":"Cygnus Spaceworks","length":"18.5 m","bio":"A shuttle with three fold-up wings, forerunner of the Empire's famous Lambda shuttles. Darth Sidious flew to Mustafar in one to find his new apprentice burning, and brought Darth Vader back to Coruscant.","seenIn":[{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"hex-kom-rk-class":{"name":"Hex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/139.webp","type":"Modified Kom'rk-class fighter","maker":"Mandalorian design","length":"About 40 m","bio":"A Mandalorian Kom'rk-class fighter-transport, the kind flown by Mandalore's warriors and their allies, seen during Maul's attempt to rebuild his criminal empire on Janix after the Clone Wars.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"lambda-class-t-4a-shuttle":{"name":"Imperial shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/140.webp","type":"Lambda-class T-4a","maker":"Sienar Fleet Systems","length":"20 m","bio":"The Empire's classic three-winged shuttle, used to ferry officers and Imperial dignitaries from ship to ship. Darth Vader and the Emperor both travelled in them, and the folding wings make them one of the most recognisable shapes in the galaxy.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"scythe-phi-class":{"name":"The Scythe","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/141.webp","type":"Phi-class shuttle","maker":"Sienar Fleet Systems","length":"25.8 m","bio":"The Inquisitors' ship, a sharp grey shuttle used by the hunters of the last Jedi. Reva and her fellow Inquisitors used it to chase Obi-Wan and young Leia across the galaxy.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"sw-0608":{"name":"Rogue One","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/142.webp","type":"Zeta-class cargo shuttle","maker":"Telgorn Corporation","length":"35.5 m","bio":"A stolen Imperial cargo shuttle that carried Jyn Erso's team to Scarif. Bodhi Rook gave it the call sign 'Rogue One' as it slipped past the shield gate, and the name stuck to the whole unauthorised mission.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"ut-60d-u-wing-starfighter-support-craft":{"name":"U-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/143.webp","type":"UT-60D gunship","maker":"Incom Corporation","length":"24 m","bio":"A Rebel troop carrier and gunship. Cassian Andor and K-2SO flew Jyn Erso in one to Jedha and Eadu, and U-wings dropped Rebel soldiers onto the beaches of Scarif.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"profundity":{"name":"Profundity","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/144.webp","type":"MC75 star cruiser","maker":"Mon Calamari Shipyards","length":"1,204 m","bio":"Admiral Raddus's flagship, which led the Rebel fleet to Scarif when he heard Rogue One had gone in alone. It received the Death Star plans, then was captured by Darth Vader, who slaughtered its crew in a dark corridor as the plans slipped away to the Tantive IV.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"lightmaker":{"name":"Lightmaker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/145.webp","type":"Hammerhead corvette","maker":"Corellian Engineering Corporation","length":"315 m","bio":"A small Rebel corvette with a hammer-shaped bow. At Scarif its crew rammed a disabled Star Destroyer into a second one, pushing both into the shield gate and destroying it, so the Death Star plans could be sent out.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"all-terrain-armored-cargo-transport":{"name":"AT-ACT walker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/146.webp","type":"Armored cargo transport","maker":"Kuat Drive Yards","length":"About 33 m tall","bio":"Huge cargo-carrying walkers used on Scarif and in Jedha's mines. During the Battle of Scarif they lumbered along the beaches firing on the Rebel troops in the palm groves.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"20-t-railcrawler-conveyex-transport":{"name":"Conveyex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/147.webp","type":"Railcrawler train","maker":"Kuat Drive Yards","length":"230 m","bio":"An Imperial armoured train winding around the mountains of Vandor, carrying the hugely valuable fuel coaxium. Beckett's crew tried to steal a carriage of it while hanging off the side, until Enfys Nest's raiders arrived and the heist went badly wrong.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"first-light":{"name":"First Light","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/148.webp","type":"Nau'ur-class yacht","maker":"Kalevala Spaceworks","length":"About 400 m","bio":"The luxury yacht of Dryden Vos, a crime lord of the Crimson Dawn syndicate, full of art and dangerous guests. It is where Han meets Qi'ra again after years apart, and where the story's betrayals come to a head.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"all-terrain-heavy-hauler":{"name":"AT-hauler","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/149.webp","type":"Cargo hauler","maker":"Kuat-Entralla Drive Yards","length":"29.6 m","bio":"An Imperial cargo lifter with long gripping arms. Beckett's crew used one to try to snatch a carriage of coaxium from the conveyex on Vandor.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"ghost":{"name":"Ghost","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/150.webp","type":"VCX-100 light freighter","maker":"Corellian Engineering Corporation","length":"43.9 m","bio":"Hera Syndulla's ship, home of the rebel crew of Rebels and part of the Rebellion for years. Hera flies it again in Ahsoka, with her son Jacen aboard, and it can be spotted in Rogue One and The Rise of Skywalker.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"eye-of-sion":{"name":"Eye of Sion","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/151.webp","type":"Prototype ship","maker":"Santhe Shipyards","length":"Large","bio":"A great old ship carrying Morgan Elsbeth, Baylan Skoll and Shin Hati, launched through the hyperspace ring on Seatos to another galaxy. It landed on Peridea, where the Nightsisters had been waiting to bring back Grand Admiral Thrawn.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"baylan-s-shuttle":{"name":"Baylan's shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/152.webp","type":"Eta-class shuttle","maker":"Kuat Systems Engineering","length":"Small","bio":"The shuttle of the former Jedi Baylan Skoll and his apprentice Shin Hati, mercenaries hired by Morgan Elsbeth to find the map to Thrawn.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"chimaera":{"name":"Chimaera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/153.webp","type":"Modified Imperial I-class Star Destroyer","maker":"Kuat Drive Yards","length":"1,600 m","bio":"Grand Admiral Thrawn's flagship, last seen being dragged into hyperspace by space whales at the Liberation of Lothal. It survived, stranded with Thrawn in another galaxy, and in Ahsoka he finally brings it home.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"finalizer":{"name":"Finalizer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/154.webp","type":"Resurgent-class Star Destroyer","maker":"Kuat-Entralla Engineering","length":"2,916 m","bio":"Kylo Ren's First Order command ship, a giant new Star Destroyer. It led the raid on Tuanul village on Jakku, and it is where Finn and Poe escaped in a stolen TIE fighter.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"black-one":{"name":"Black One","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/155.webp","type":"Modified T-70 X-wing","maker":"Incom-FreiTek","length":"12.5 m","bio":"Poe Dameron's black X-wing, the best ship in the Resistance flown by its best pilot. Poe led the raid on Starkiller Base in it, and took out a First Order dreadnought's defences single-handed before it was destroyed in the attack on D'Qar.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"upsilon-class-command-shuttle":{"name":"Kylo Ren's shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/156.webp","type":"Upsilon-class command shuttle","maker":"Sienar-Jaemus Fleet Systems","length":"19 m","bio":"A tall black shuttle with huge folding wings, carrying Kylo Ren on First Order business, like his arrival in the village of Tuanul on Jakku where he looked for the map to Luke Skywalker.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"tie-fo-space-superiority-fighter":{"name":"First Order TIE fighter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/157.webp","type":"TIE/fo fighter","maker":"Sienar-Jaemus Fleet Systems","length":"6.7 m","bio":"The First Order's updated TIE fighter, sleeker and better armed than the old Imperial ones. Finn and Poe stole a two-seat version to escape from the Finalizer, and crashed it on Jakku.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"eravana":{"name":"Eravana","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/158.webp","type":"Baleen-class heavy freighter","maker":"Corellian Engineering Corporation","length":"426 m","bio":"Han Solo's huge freighter during his smuggling days after the war. It caught the Millennium Falcon with Rey and Finn aboard, and was the place where Han carried a cargo of very dangerous rathtars.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"raddus":{"name":"Raddus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/159.webp","type":"MC85 star cruiser","maker":"Mon Calamari Shipyards","length":"3,438 m","bio":"The Resistance's flagship, named after the admiral who died at Scarif. It led the long chase after D'Qar, and Vice Admiral Holdo turned it around and jumped to lightspeed straight through Snoke's flagship, cutting it in half.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"supremacy":{"name":"Supremacy","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/160.webp","type":"Mega-class Star Dreadnought","maker":"Kuat-Entralla Engineering","length":"13,240 m wide","bio":"Supreme Leader Snoke's enormous flying-wing flagship, a mobile capital for the First Order. In its throne room Kylo Ren killed Snoke and fought his guards beside Rey, before Holdo rammed the Raddus through the ship at lightspeed.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"v-4x-d-ski-speeder":{"name":"Ski speeder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/161.webp","type":"V-4X-D speeder","maker":"Roche Machines","length":"7.3 m","bio":"Battered old speeders the Resistance found in the Rebel base on Crait, with a keel that scrapes the ground. Racing across the salt flats they kicked up the red crystal dust underneath, and Finn nearly flew one into the First Order's battering-ram cannon.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"mg-100-starfortress-sf-17":{"name":"Resistance bomber","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/162.webp","type":"MG-100 StarFortress","maker":"Slayn & Korpil","length":"29.7 m","bio":"Slow, heavy bombers carrying racks of bombs in their bellies. At D'Qar the bombers attacked a First Order dreadnought and destroyed it, but every one of them was lost. Rose Tico's sister Paige dropped the bombs that finished it off.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"tie-vn-space-superiority-fighter":{"name":"TIE silencer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/163.webp","type":"TIE/vn fighter","maker":"Sienar-Jaemus Fleet Systems","length":"17.4 m","bio":"Kylo Ren's personal fighter in The Last Jedi, long and arrow-shaped. He used it to attack the Raddus, but hesitated when he sensed his mother aboard.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"steadfast-resurgent-class":{"name":"Steadfast","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/164.webp","type":"Resurgent-class Star Destroyer","maker":"Kuat-Entralla Engineering","length":"2,916 m","bio":"The First Order's flagship in The Rise of Skywalker, where Allegiant General Pryde ran the fleet and General Hux turned out to be a spy for the Resistance. Chewbacca was held prisoner aboard, and Rey and her friends slipped onto it to rescue him.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"xyston-class-star-destroyer":{"name":"Sith Star Destroyer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/165.webp","type":"Xyston-class Star Destroyer","maker":"Kuat-Entralla Engineering","length":"2,406 m","bio":"The thousands of red-marked Star Destroyers built in secret on Exegol for the Final Order, each armed with a superlaser able to destroy a planet. One showed its power by destroying Kijimi, before ordinary people across the galaxy flew to Exegol to stop the fleet.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"kylo-ren-s-tie-whisper":{"name":"TIE whisper","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/166.webp","type":"TIE/wi interceptor","maker":"Sienar-Jaemus Fleet Systems","length":"15.9 m","bio":"Kylo Ren's fighter in The Rise of Skywalker, with wings swept forward. He flew it across the desert of Pasaana towards Rey, who flipped over it with a single slash of her lightsaber.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"din-djarin-s-n-1-starfighter":{"name":"Din Djarin's N-1","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/167.webp","type":"Rebuilt N-1 starfighter","maker":"Theed Palace Space Vessel Engineering Corps","length":"11 m","bio":"An old Naboo starfighter rebuilt by Peli Motto for Din Djarin after his Razor Crest was destroyed, with a hot-rodded engine and a seat for Grogu. It is now the Mandalorian's ship.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"guillotine-starship":{"name":"Guillotine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/168.webp","type":"Modified Flarestar fighter","maker":"Surronian Engineering","length":"17.2 m","bio":"A heavily modified fighter that Din Djarin and Grogu run into on their travels during The Mandalorian and Grogu.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"carson-teva-s-x-wing":{"name":"Carson Teva's X-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/169.webp","type":"T-65C-A2 X-wing","maker":"Incom Corporation","length":"13.4 m","bio":"The X-wing of Captain Carson Teva, a New Republic pilot of the Adelphi Rangers, who keeps watch on the Outer Rim and works with Din Djarin.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"onyx-cinder":{"name":"Onyx Cinder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/170.webp","type":"Pirate ship","maker":"Unknown","length":"55 m","bio":"An old pirate ship found buried in the woods of At Attin by Wim and his friends. When they accidentally flew it out into space with the droid pirate SM-33 aboard, it carried them across the galaxy, pirates in pursuit, looking for the way back home.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"silvo-s-pirate-frigate":{"name":"Pirate frigate","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/171.webp","type":"Frigate","maker":"Unknown","length":"Large","bio":"The pirate ship once commanded by Captain Silvo and taken over by Brutus, which hunted the Onyx Cinder and the kids, hoping to follow them to the hidden treasure planet of At Attin.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"polan-gx-8":{"name":"Jedi transport","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/172.webp","type":"Polan-717 transport","maker":"Lantillian Shipwrights","length":"78.6 m","bio":"The white and gold transport ships of the Jedi in the High Republic era, carrying Master Sol and his team from planet to planet on the trail of the assassin Mae.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"jedi-vector":{"name":"Jedi Vector","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/173.webp","type":"Starfighter","maker":"Valkeri Enterprises","length":"14.6 m","bio":"A sleek starfighter designed for the Jedi of the High Republic, built to work with a Jedi's reflexes, flown by Jedi on missions of their own.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"dte-csa-17-calaboose-prison-ship":{"name":"Prison ship","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/174.webp","type":"Calaboose prison ship","maker":"Kazellan Corporation","length":"126 m","bio":"A Republic prison transport of the High Republic era. One of them came down on Carlac, setting off a hunt through the planet's snowy wilds.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"twilight":{"name":"Twilight","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/316.webp","type":"G9 Rigger-class light freighter","maker":"Corellian Engineering Corporation","length":"34.1 m","bio":"A battered freighter Anakin and Ahsoka grabbed from a Hutt hangar on Teth while escaping with Jabba's son. Anakin kept it, patched it and flew it all through the war, its long folding wing and wobbly engines easy to spot. Obi-Wan finally lost it in the snows of Mandalore.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"malevolence":{"name":"Malevolence","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/317.webp","type":"Subjugator-class heavy cruiser","maker":"Free Dac Volunteers Engineering Corps","length":"4,845 m","bio":"General Grievous's secret flagship, almost five kilometres long, with twin ion cannons that could knock out a whole Republic fleet in one shot. Plo Koon survived its first attack; Anakin, Ahsoka and Obi-Wan later rescued Padmé from inside it and steered it into a dead moon.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"munificent-class-star-frigate":{"name":"Munificent-class Frigate","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/318.webp","type":"Star frigate","maker":"Hoersch-Kessel Drive Inc.","length":"825 m","bio":"The Banking Clan's long, spine-shaped warship, built to collect debts by force and then turned into a mainstay of the Separatist fleet. Its huge forward cannons could hit a planet from orbit, and squadrons of them guarded the blockades of Christophsis and Ryloth.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"v-19-torrent-starfighter":{"name":"V-19 Torrent","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/319.webp","type":"Starfighter","maker":"Slayn & Korpil","length":"6 m","bio":"An early-war Republic fighter with folding wings that gave it a gull-like look. Clone pilots flew it at Christophsis, against the Malevolence and over Ryloth before the Z-95 Headhunter and the ARC-170 took over its jobs.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"all-terrain-tactical-enforcer":{"name":"AT-TE","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/320.webp","type":"Six-legged assault walker","maker":"Rothana Heavy Engineering","length":"22 m","bio":"The Republic's six-legged tank, which droids nicknamed \"six legs\". Slow but nearly unstoppable, it could carry a squad inside, climb cliffs with magnetic feet and fire a heavy mass-driver cannon from its back. AT-TEs marched on Geonosis, Christophsis and Anaxes.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"barc-speeder":{"name":"BARC Speeder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/321.webp","type":"Speeder bike","maker":"Aratech Repulsor Company","length":"4.6 m","bio":"A long, heavy speeder bike used by clone scouts and commandos, with blasters in the nose and room for a gunner pod. Clones raced them across Geonosis and Saleucami, and the Empire's later speeder bikes were built from the same idea.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"coronet":{"name":"Coronet","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/322.webp","type":"Royal starliner","maker":"Kalevala Spaceworks","length":"","bio":"Duchess Satine's graceful liner, a symbol of peaceful Mandalore. On her voyage to the Senate it became a trap: assassin droids crawled through the hull and a traitor senator tried to poison her, while Obi-Wan and Anakin hunted the killers through its decks.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"endurance":{"name":"Endurance","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/323.webp","type":"Venator-class Star Destroyer","maker":"Kuat Drive Yards","length":"1,137 m","bio":"Admiral Kilian's Star Destroyer, sabotaged by a disguised young Boba Fett who wanted Mace Windu dead. Its crippled hull crashed on Vanqor, where Mace and Anakin crawled out of the wreck and Boba made his escape with Aurra Sing.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"xanadu-blood":{"name":"Xanadu Blood","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/324.webp","type":"Modified Rogue-class starfighter","maker":"Baktoid Armor Workshop","length":"12.7 m","bio":"Cad Bane's sleek, dagger-shaped ship, given to him by Darth Sidious as part of the payment for stealing a Jedi holocron. Bane flew it from heist to heist, kidnapping Force-sensitive children for the Sith and slipping away from the Jedi again and again.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"providence-class-dreadnought":{"name":"Separatist Dreadnought","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/325.webp","type":"Providence-class carrier/destroyer","maker":"Free Dac Volunteers Engineering Corps","length":"1,088 m","bio":"The Separatist answer to the Venator: a big carrier-destroyer packed with droid fighters, landing craft and heavy guns. Grievous's own Invisible Hand was one, and these warships led the fleets above Mon Cala, Umbara and Ryloth.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"trident-class-assault-ship":{"name":"Trident Assault Ship","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/326.webp","type":"Aquatic assault ship","maker":"Colicoid Creation Nest","length":"88.7 m","bio":"A squid-shaped Separatist warship that flew through space and swam through oceans, its long tentacles grabbing submarines. Tridents spearheaded the Quarren and Separatist attack on the underwater cities of Mon Cala.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"eta-class-shuttle":{"name":"Eta-class Shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/327.webp","type":"Diplomatic shuttle","maker":"Cygnus Spaceworks","length":"14.2 m","bio":"A boxy Republic shuttle used by senators and Jedi envoys. Anakin, Obi-Wan and Ahsoka used one for the daring landing on Lola Sayu to break Even Piell out of the Citadel prison.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"crucible":{"name":"Crucible","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/328.webp","type":"Paladin-class training ship","maker":"","length":"99 m","bio":"An ancient Jedi ship that carried younglings to Ilum for the Gathering, where they found the crystals for their first lightsabers. Its teacher, the droid professor Huyang, had flown it for centuries; on Ahsoka's trip, Hondo Ohnaka's pirates tried to steal it.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"clone-z-95-starfighter":{"name":"Z-95 Headhunter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/329.webp","type":"Starfighter","maker":"Incom Corporation","length":"16.7 m","bio":"A tough little Republic fighter flown by clone pilots in the later Clone Wars, the ancestor of the X-wing. Headhunters flew in Plo Koon's Wolfpack, over Umbara and Ringo Vinda, and in Ahsoka's final mission to Mandalore.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"gozanti-class-cruiser":{"name":"Gozanti-class Cruiser","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/330.webp","type":"Armed transport","maker":"Corellian Engineering Corporation","length":"64 m","bio":"A rugged, stubby transport that turned up everywhere: as a Hutt and pirate freighter in the Clone Wars, as Black Sun and Separatist ships, and later as the Empire's TIE fighter carrier. Smugglers, slavers and Imperials all trusted it to haul anything.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"all-terrain-reconnaissance-transport":{"name":"AT-RT","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/331.webp","type":"Scout walker","maker":"Kuat Drive Yards","length":"2.9 m","bio":"An open, two-legged walker ridden by a single clone scout, with a blaster cannon in front. AT-RTs ran through the dark jungles of Umbara and the streets of Onderon, the ancestors of the Empire's scout walkers.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"btl-b-y-wing-starfighter-bomber":{"name":"BTL-B Y-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/332.webp","type":"Starfighter-bomber","maker":"Koensayr Manufacturing","length":"23.4 m","bio":"The first Y-wings, built for the Republic in the Clone Wars with smooth armour plating and a gunner behind the pilot. Anakin's Shadow Squadron flew them against the Malevolence, and the same tough design was still flying for the Rebellion decades later.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"kom-rk-class-fighter-transport":{"name":"Mandalorian Gauntlet","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/333.webp","type":"Kom'rk-class fighter/transport","maker":"MandalMotors","length":"68 m","bio":"Death Watch's big Mandalorian fighter, whose wings fold up around the hull for landing. Pre Vizsla's warriors and later Maul's Shadow Collective flew them; decades later Bo-Katan Kryze led the Nite Owls in one of her own.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"taylander-shuttle":{"name":"Taylander Shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/334.webp","type":"Civilian shuttle","maker":"Gallofree Yards","length":"43.5 m","bio":"An ordinary civilian shuttle found all over the galaxy, which made it perfect for slipping through unnoticed. In the last year of the Clone Wars it carried senators and Banking Clan agents, and later the early rebels flew them on undercover missions.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"hh-87-starhopper":{"name":"HH-87 Starhopper","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/335.webp","type":"Starfighter","maker":"MandalMotors","length":"6.8 m","bio":"A fast, long-range fighter long used by the Hutt Clans and the criminals who worked for them. In the Clone Wars bounty hunters and Hutt patrols flew the curved little ship through the underworld.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"marauder-omicron-class":{"name":"Havoc Marauder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/336.webp","type":"Modified Omicron-class attack shuttle","maker":"Cygnus Space Workshops","length":"30.3 m","bio":"Clone Force 99's ship and, as Omega said, their home. Tech modified it to fly missions no ordinary clone ship could, and after the Empire took over it carried the Bad Batch to Ord Mantell, Pabu and back to Kamino until it was lost in a crash.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"phantom":{"name":"Phantom","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/337.webp","type":"VCX-series auxiliary starfighter","maker":"Corellian Engineering Corporation","length":"11.6 m","bio":"The Ghost's little attack shuttle, docked in the back of the freighter and used for raids, rescues and getaways. Ezra, Sabine and Zeb flew it all over Lothal until it was lost at Reklam Station; Hera later named its replacement the Phantom II.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"sentinel-class-landing-craft":{"name":"Sentinel Landing Craft","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/338.webp","type":"Troop transport","maker":"Sienar Fleet Systems","length":"38 m","bio":"A heavy Imperial troop transport with folding wings, used by Agent Kallus and the Grand Inquisitor to drop stormtroopers onto Lothal. Its arrival usually meant the Ghost crew had to run, fast.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"all-terrain-defense-pod":{"name":"AT-DP","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/339.webp","type":"Bipedal walker","maker":"Kuat Drive Yards","length":"7.5 m","bio":"The Empire's two-legged patrol walker, the backbone of small garrisons like Lothal's. Each carried a driver and a gunner and kept the farmers and street kids in line; the rebels became experts at tripping them up.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"phantom-ii":{"name":"Phantom II","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/340.webp","type":"Modified Sheathipede-class shuttle","maker":"Haor Chall Engineering","length":"10.5 m","bio":"An old Separatist shuttle the Spectres found on Agamar and rebuilt to replace their lost Phantom. It docked in the back of the Ghost and flew Ezra, Sabine and Kanan on countless missions in the last years before the Rebellion went to war.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"arquitens-class-command-cruiser":{"name":"Imperial Light Cruiser","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/341.webp","type":"Arquitens-class command cruiser","maker":"Kuat Drive Yards","length":"230 m","bio":"A small Imperial warship used to patrol trade routes and blockade worlds. Commander Sato's rebels and the Ghost crew fought them over Lothal and Ibaar, and Agent Kallus and Admiral Konstantine used them to hunt the fleet.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"sphyrna-class-hammerhead-corvette":{"name":"Hammerhead Corvette","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/342.webp","type":"Sphyrna-class corvette","maker":"Corellian Engineering Corporation","length":"117 m","bio":"An old armed transport with a flat, hammer-shaped bow. Commander Sato's Phoenix Squadron flew them as warships, and years later the Rebellion used one to push the disabled Star Destroyer into the shield gate at Scarif.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"blade-wing":{"name":"Blade Wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/343.webp","type":"Prototype B-wing starfighter","maker":"Quarrie","length":"16.9 m","bio":"The first B-wing, built in secret by the Mon Calamari engineer Quarrie on the planet Shantipole. Hera tamed its tricky gyroscopic cockpit and flew it to break the Imperial blockade of Ibaar, proving the design that would one day fight at Endor.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"tie-d-defender-multi-role-starfighter":{"name":"TIE Defender","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/344.webp","type":"Advanced TIE starfighter","maker":"Sienar Fleet Systems","length":"9.2 m","bio":"Grand Admiral Thrawn's pet project: a three-winged TIE with shields and a hyperdrive, far deadlier than a standard fighter. The rebels raided the Lothal factory building it, Ezra and Sabine stole the Defender Elite prototype, and the liberation of Lothal ended the programme.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"614-ava-speeder-bike":{"name":"Lothal Speeder Bike","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/345.webp","type":"614-AvA speeder bike","maker":"Aratech Repulsor Company","length":"4.4 m","bio":"The Empire's patrol bike on Lothal, ridden by scout troopers through Capital City and across the grasslands. Ezra and his friends stole them so often that they became as much rebel transport as Imperial.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"luthen-rael-s-fondor-haulcraft":{"name":"The Fondor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/346.webp","type":"Modified V-21.1 Chevlex","maker":"Fondor Yards","length":"25.8 m","bio":"Luthen Rael's harmless-looking courier ship, hiding blades of laser light, a tractor-beam trick and a droid copilot. Luthen used it to slip past Imperial patrols, and its sudden escape from a Star Destroyer showed Cassian how far the antiques dealer would go.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"tie-avenger-prototype":{"name":"TIE Avenger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/347.webp","type":"Prototype TIE fighter","maker":"Sienar Fleet Systems","length":"13.4 m","bio":"A secret Imperial fighter with folding wings and a hyperdrive, tested in Sienar's yards. Cassian Andor stole one in a daring escape a year after Narkina 5, then flew it to Yavin 4, where the squabbling rebel factions nearly shot him down.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"alpha-3-nimbus-class-v-wing-starfighter":{"name":"V-wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/348.webp","type":"Starfighter","maker":"Kuat Systems Engineering","length":"7.9 m","bio":"A small, nimble fighter with tall folding wings, flown by clone pilots at the end of the Clone Wars and by the early Imperial Navy after it. Crosshair's Imperial units and the patrols that hunted the Bad Batch flew them.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"rho-class-transport-shuttle":{"name":"Rho-class Shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/349.webp","type":"Transport shuttle","maker":"Cygnus Spaceworks","length":"43 m","bio":"A big military shuttle with folding wings, used by the Republic and then the Empire to move troops and prisoners. The Bad Batch saw them carry clones off Kamino and children to Mount Tantiss.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"razor-crest":{"name":"Razor Crest","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/350.webp","type":"ST-70 assault ship","maker":"Corellian Engineering Corporation","length":"24.3 m","bio":"Din Djarin's battered old patrol ship and home, with carbonite storage in the hold and a sleeping cubby where Grogu played with the controls. Repaired again and again, it carried them across the Outer Rim until Moff Gideon's cruiser blasted it to pieces on Tython.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"gideon-s-light-cruiser":{"name":"Moff Gideon's Cruiser","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/351.webp","type":"Class 546 light cruiser","maker":"Kuat Drive Yards","length":"380 m","bio":"The Imperial warship from which Moff Gideon hunted Grogu. Din Djarin, Bo-Katan, Cara and Fennec stormed it to rescue the child, and when the dark troopers closed in, a lone X-wing landed and Luke Skywalker cut his way down the corridor.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"bo-katan-kryze-s-gauntlet-starfighter":{"name":"Bo-Katan's Gauntlet","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/352.webp","type":"Kom'rk-class fighter/transport","maker":"MandalMotors","length":"52 m","bio":"Bo-Katan Kryze's Mandalorian fighter, flown by her Nite Owls as they hunted for the Darksaber and the people to free Mandalore. She raided Imperial ships with it, sat alone in it at her ruined castle, and led the fleet home from it.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"t-6-shuttle":{"name":"T-6 Shuttle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/353.webp","type":"Jedi shuttle","maker":"Slayn & Korpil","length":"22.8 m","bio":"An elegant Jedi transport whose spinning ring of wings kept the cockpit level. Old and slow by the Clone Wars, it still carried Jedi on diplomatic missions, and Dooku and Qui-Gon used one; its cockpit design later turned up in the B-wing.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"}]},"undicur-class-jumpspeeder":{"name":"Jedi Jumpspeeder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/354.webp","type":"Undicur-class jumpspeeder","maker":"Kuat Vehicles","length":"1.8 m","bio":"A light speeder bike favoured by Jedi on solo missions. After Order 66 survivors like the young Jedi Lyco Strata still rode them, and Asajj Ventress's journey with Lyco across the empty worlds of the Outer Rim began on one.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"flitknot-speeder-bike":{"name":"Flitknot Speeder","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/355.webp","type":"Speeder bike","maker":"Huppla Pasa Tisc Shipwrights Collective","length":"3.2 m","bio":"A light, insect-like Geonosian speeder used by the Separatists; Count Dooku fled the arena battle on Geonosis on one. After the war such bikes ended up with drifters and bounty hunters all over the Outer Rim.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"ginivex-class-starfighter":{"name":"Ventress's Fanblade","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/356.webp","type":"Ginivex-class starfighter","maker":"Huppla Pasa Tisc Shipwrights Collective","length":"13 m","bio":"Asajj Ventress's personal fighter, whose huge fan of wings could open like a sail and close for speed. Built by Geonosian shipwrights, it carried Count Dooku's assassin from one Clone Wars battlefield to the next.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]}},"chars":{"luke-skywalker":{"name":"Luke Skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/175.webp","species":"Human","homeworld":"Tatooine","side":"Rebel Alliance, Jedi","bio":"A farm boy from Tatooine who dreamed of flying, until two droids and an old hermit pulled him into the Rebellion. He destroyed the first Death Star, trained with Yoda, learned that Darth Vader was his father, and refused to give up on him. Decades later, broken by his failure with Ben Solo, he hid on Ahch-To until Rey came for him.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"leia-skywalker-organa-solo":{"name":"Leia Organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/176.webp","species":"Human","homeworld":"Alderaan","side":"Rebel Alliance, Resistance","bio":"Princess of Alderaan, senator, and a leader of the Rebellion from her teens. Captured with the Death Star plans, she watched her planet destroyed and never broke. She was Luke's twin sister, married Han Solo, and, after the New Republic failed to listen, founded the Resistance and led it as General Organa.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"han-solo":{"name":"Han Solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/177.webp","species":"Human","homeworld":"Corellia","side":"Smuggler, Rebel Alliance","bio":"A Corellian street kid turned smuggler, captain of the Millennium Falcon with his best friend Chewbacca. He only meant to deliver a couple of passengers to Alderaan, but came back to save Luke at the Death Star, fell for Leia, and was frozen in carbonite. Years later he faced his own son, Kylo Ren, on Starkiller Base.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"chewbacca":{"name":"Chewbacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/178.webp","species":"Wookiee","homeworld":"Kashyyyk","side":"Rebel Alliance, Resistance","bio":"A Wookiee warrior over two hundred years old, who fought beside Yoda in the Clone Wars and then became Han Solo's co-pilot and lifelong friend after Han freed him on Mimban. Loyal, fierce and a brilliant mechanic, he flew the Falcon for decades and received the medal he missed out on after the Battle of Yavin.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"obi-wan-kenobi":{"name":"Obi-Wan Kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/179.webp","species":"Human","homeworld":"Stewjon","side":"Jedi Order","bio":"Qui-Gon Jinn's apprentice, who took on young Anakin Skywalker and became his master, brother and friend. After Anakin fell he left him burning on Mustafar and went into exile on Tatooine to watch over Luke. As old Ben Kenobi he gave Luke his father's lightsaber, then let Vader strike him down to become one with the Force.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"anakin-skywalker":{"name":"Anakin Skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/180.webp","species":"Human","homeworld":"Tatooine","side":"Jedi Order, Galactic Empire","bio":"A slave boy from Tatooine who might be the Chosen One of Jedi prophecy. He became a Jedi hero of the Clone Wars, secretly married Padmé, and, terrified of losing her, fell to the dark side and became Darth Vader, the Emperor's enforcer. His son Luke never gave up on him, and in the end Anakin turned on the Emperor and saved him.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"c-3po":{"name":"C-3PO","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/181.webp","species":"Protocol droid","homeworld":"Tatooine","side":"Rebel Alliance, Resistance","bio":"A fussy, anxious protocol droid fluent in over six million forms of communication. Young Anakin built him from scrap on Tatooine. After his memory was wiped he spent the rest of the saga beside R2-D2, complaining all the way through the Rebellion, the Resistance and more adventures than any droid should have to bear.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"r2-d2":{"name":"R2-D2","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/182.webp","species":"Astromech droid","homeworld":"Naboo","side":"Rebel Alliance, Resistance","bio":"A brave, stubborn little astromech who saved Queen Amidala's ship on his first adventure and never stopped saving people. He carried Leia's message and the Death Star plans to Obi-Wan, flew with Luke to the Death Star and Dagobah, and holds more secrets than anyone in the saga, including the map that led Rey to Luke.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"wilhuff-tarkin":{"name":"Grand Moff Tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/183.webp","species":"Human","homeworld":"Eriadu","side":"Galactic Empire","bio":"A cold, ruthless Imperial governor who believed fear would keep the galaxy in line. He took control of the Death Star from Krennic, tested it on Jedha and Scarif, and destroyed Alderaan in front of Leia. He refused to evacuate the station at Yavin, sure of victory, and died when Luke's torpedoes found their mark.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"yoda":{"name":"Yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/184.webp","species":"Unknown","homeworld":"Unknown","side":"Jedi Order","bio":"The small, ancient Grand Master of the Jedi Order, about nine hundred years old, who trained Jedi for centuries. He duelled Count Dooku and the Emperor himself, then went into exile on Dagobah after the fall of the Republic. There he trained Luke, before passing into the Force, and still appeared to guide Luke as a spirit.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"lando-calrissian":{"name":"Lando Calrissian","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/185.webp","species":"Human","homeworld":"Socorro","side":"Smuggler, Rebel Alliance","bio":"A smooth-talking gambler and the original owner of the Millennium Falcon, which he lost to Han in a game of sabacc. As administrator of Cloud City he betrayed Han to Vader, then turned on the Empire, rescued his friend and flew the Falcon into the second Death Star. Decades later he helped rally the galaxy to Exegol.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"boba-fett":{"name":"Boba Fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/186.webp","species":"Human","homeworld":"Kamino","side":"Bounty hunter","bio":"An unaltered clone of the bounty hunter Jango Fett, raised as his son, who saw his father killed by Mace Windu on Geonosis. He grew into the galaxy's most feared bounty hunter, caught Han Solo for Jabba, and fell into the Sarlacc pit, only to climb out years later and take over Jabba's old palace on Tatooine.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"},{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"darth-sidious":{"name":"Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/187.webp","species":"Human","homeworld":"Naboo","side":"Sith, Galactic Empire","bio":"A quiet senator from Naboo who was secretly the Sith Lord Darth Sidious. He started the Clone Wars, played both sides, became Supreme Chancellor and then Emperor, and turned Anakin Skywalker into Darth Vader. Thrown down the Death Star's reactor shaft, he somehow survived on Exegol, until Rey stood against him.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"jabba-desilijic-tiure":{"name":"Jabba the Hutt","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/188.webp","species":"Hutt","homeworld":"Nal Hutta","side":"Hutt Clan","bio":"A huge, greedy Hutt crime lord who ruled Tatooine's criminal underworld from his desert palace. He put a price on Han Solo's head, kept Han frozen in carbonite as a wall decoration, and tried to feed Luke to his rancor and the Sarlacc. Leia strangled him with the chain he had used to keep her prisoner.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"wicket-wystri-warrick":{"name":"Wicket","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/189.webp","species":"Ewok","homeworld":"Endor","side":"Bright Tree Village","bio":"A curious young Ewok who found Leia in the forest of Endor after a speeder bike crash and brought her to his village. Thanks to him, the Ewoks joined the Rebels against the Empire, helping to bring down the shield generator protecting the second Death Star.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"qui-gon-jinn":{"name":"Qui-Gon Jinn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/190.webp","species":"Human","homeworld":"Coruscant","side":"Jedi Order","bio":"A wise Jedi Master who followed the Force rather than the Council's rules. He found young Anakin on Tatooine, freed him and insisted he be trained. He was killed by Darth Maul on Naboo, but he had learned how to keep his identity after death, and later taught Yoda and Obi-Wan how to become one with the Force.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"padme-amidala":{"name":"Padmé Amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/191.webp","species":"Human","homeworld":"Naboo","side":"Naboo, Galactic Republic","bio":"Elected Queen of Naboo at fourteen, she fought to free her planet from the Trade Federation, then became a senator who tried to stop the Clone Wars through diplomacy. She secretly married Anakin Skywalker. After his fall she died giving birth to the twins Luke and Leia, still believing there was good in him.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"jar-jar-binks":{"name":"Jar Jar Binks","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/192.webp","species":"Gungan","homeworld":"Naboo","side":"Gungans, Galactic Republic","bio":"A clumsy Gungan outcast whose life was saved by Qui-Gon, and who joined the Jedi on their adventure. He helped unite the Gungans with the Naboo, became a representative in the Senate, and, without meaning to, proposed giving Chancellor Palpatine the emergency powers he needed to become Emperor.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"maul":{"name":"Darth Maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/193.webp","species":"Zabrak","homeworld":"Dathomir","side":"Sith, Crimson Dawn","bio":"Darth Sidious's red-and-black tattooed apprentice, with a double-bladed lightsaber. He killed Qui-Gon Jinn on Naboo and was cut in half by Obi-Wan, but survived on hatred and robotic legs. He later took over Mandalore and led the Crimson Dawn syndicate, until he finally fell to Obi-Wan on Tatooine.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"},{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"mace-windu":{"name":"Mace Windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/194.webp","species":"Human","homeworld":"Haruun Kal","side":"Jedi Order","bio":"One of the greatest Jedi Masters of the Order, with a purple lightsaber and a fighting style that drew close to the dark side. He led the Jedi charge on Geonosis and killed Jango Fett. When he went to arrest Palpatine, he had the Sith Lord beaten until Anakin turned on him.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"shmi-skywalker-lars":{"name":"Shmi Skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/195.webp","species":"Human","homeworld":"Tatooine","side":"Tatooine","bio":"Anakin's mother, a slave on Tatooine who raised him alone and let him go with the Jedi to give him a better life. She was later freed and married the farmer Cliegg Lars. When Tusken Raiders kidnapped her, Anakin came too late, and her death in his arms set him on his dark path.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"}]},"dooku":{"name":"Count Dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/196.webp","species":"Human","homeworld":"Serenno","side":"Sith, Separatists","bio":"A Jedi Master and nobleman who left the Order, became Darth Tyranus, Sidious's apprentice, and led the Separatists in the Clone Wars. He cut off Anakin's arm on Geonosis, duelled Yoda and fled. On the Invisible Hand, Palpatine had Anakin kill him.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"},{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"}]},"jango-fett":{"name":"Jango Fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/197.webp","species":"Human","homeworld":"Concord Dawn","side":"Bounty hunter","bio":"The bounty hunter chosen to be the template for the Republic's clone army. As his payment he asked for one unaltered clone to raise as his son, Boba. He fought Obi-Wan on Kamino and was killed by Mace Windu in the Geonosis arena.","seenIn":[{"name":"Attack of the Clones","id":"1294572266a0e6ba0c2b8452d72b00ee","tmdb":"1894"}]},"grievous":{"name":"General Grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/198.webp","species":"Kaleesh (cyborg)","homeworld":"Kalee","side":"Separatists","bio":"A cyborg general of the Separatist droid armies, with a terrible cough and a collection of lightsabers taken from fallen Jedi. He kidnapped Chancellor Palpatine at the start of Revenge of the Sith and fought Obi-Wan with four arms on Utapau, until Obi-Wan finished him with a blaster.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"}]},"bail-prestor-organa":{"name":"Bail Organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/199.webp","species":"Human","homeworld":"Alderaan","side":"Galactic Republic, Rebel Alliance","bio":"The senator of Alderaan, one of the founders of the Rebellion, and Leia's adopted father. He was a friend to the Jedi, rescued Yoda after Order 66, and raised Leia as his own daughter. He died when the Death Star destroyed Alderaan.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Revenge of the Sith","id":"12939c2faac58dcb8b6f9cae47d56ef1","tmdb":"1895"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"owen-lars":{"name":"Owen Lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/200.webp","species":"Human","homeworld":"Tatooine","side":"Moisture farmer","bio":"Anakin's stepbrother, a moisture farmer on Tatooine who raised Luke as his nephew with his wife Beru, wanting to keep him safe and away from the Jedi. Stormtroopers searching for the droids killed them both.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"reva-sevander":{"name":"Reva","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/201.webp","species":"Human","homeworld":"Unknown","side":"Inquisitorius","bio":"The Third Sister, a ruthless Inquisitor obsessed with finding Obi-Wan Kenobi. She was secretly one of the younglings who survived Anakin's attack on the Jedi Temple during Order 66, and her real target was Darth Vader himself.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"grand-inquisitor":{"name":"The Grand Inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/202.webp","species":"Pau'an","homeworld":"Utapau","side":"Inquisitorius","bio":"The leader of the Inquisitors, the Empire's hunters of surviving Jedi, and once a Jedi Temple Guard himself. He hunted Obi-Wan and later the rebels of the Ghost, until he lost a duel to Kanan Jarrus.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"fifth-brother":{"name":"The Fifth Brother","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/203.webp","species":"Unknown","homeworld":"Unknown","side":"Inquisitorius","bio":"A tall, powerful Inquisitor who hunted the last Jedi alongside the Grand Inquisitor, appearing in Obi-Wan Kenobi and Rebels.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"tala-durith":{"name":"Tala Durith","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/204.webp","species":"Human","homeworld":"Mapuzo","side":"Galactic Empire (secretly the Path)","bio":"An Imperial officer disgusted by the Empire's cruelty who secretly helped the Path smuggle Jedi to safety. She sheltered Obi-Wan and Leia on Mapuzo and gave her life at the Path's base on Jabiim so the others could escape.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"jyn-erso":{"name":"Jyn Erso","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/205.webp","species":"Human","homeworld":"Vallt","side":"Rebel Alliance","bio":"The daughter of Galen Erso, raised by the extremist Saw Gerrera after her mother was killed and her father taken by the Empire. A prisoner when the Rebels found her, she led the mission that stole the Death Star plans from Scarif. 'Rebellions are built on hope.'","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"cassian-jeron-andor":{"name":"Cassian Andor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/206.webp","species":"Human","homeworld":"Kenari","side":"Rebel Alliance","bio":"A thief from Ferrix who became one of the Rebellion's most dedicated agents, willing to do terrible things for the cause. After the Aldhani heist and escaping an Imperial prison, he gave everything to the Rebellion, and died on Scarif alongside Jyn after the plans were sent.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"k-2so":{"name":"K-2SO","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/207.webp","species":"Reprogrammed security droid","homeworld":"Unknown","side":"Rebel Alliance","bio":"An Imperial security droid reprogrammed by Cassian Andor, who says exactly what he thinks, usually the odds of failure. He fought his way through the Citadel tower on Scarif to buy Jyn and Cassian time.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"chirrut-imwe":{"name":"Chirrut Îmwe","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/208.webp","species":"Human","homeworld":"Jedha","side":"Guardians of the Whills","bio":"A blind warrior monk of the Guardians of the Whills, who once guarded the Kyber Temple on Jedha. A believer in the Force, though not a Jedi, he walked through blaster fire on Scarif chanting 'I am one with the Force, and the Force is with me.'","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"baze-malbus":{"name":"Baze Malbus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/209.webp","species":"Human","homeworld":"Jedha","side":"Guardians of the Whills","bio":"Chirrut's closest friend and protector, a former Guardian of the Whills who lost his faith and swapped it for a huge repeating blaster. After Chirrut died on Scarif, Baze took up his words and walked out to join him.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"bodhi-rook":{"name":"Bodhi Rook","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/210.webp","species":"Human","homeworld":"Jedha","side":"Galactic Empire (defector)","bio":"An Imperial cargo pilot who defected to carry Galen Erso's message to the Rebels. He flew the stolen shuttle on the mission to Scarif, named it Rogue One, and connected the stolen plans to the fleet before he died.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"orson-callan-krennic":{"name":"Director Krennic","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/211.webp","species":"Human","homeworld":"Lexrul","side":"Galactic Empire","bio":"The ambitious director of the Death Star project, who forced Galen Erso to build it. He hoped it would win him the Emperor's favour, but Tarkin took the credit. Krennic died on Scarif when the Death Star fired on its own archive.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"saw-gerrera":{"name":"Saw Gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/212.webp","species":"Human","homeworld":"Onderon","side":"Partisans","bio":"A veteran fighter who learned rebellion in the Clone Wars on Onderon, then waged a brutal guerrilla war against the Empire. Too extreme for the other rebels, he raised the young Jyn Erso, and died on Jedha as the Death Star's blast swept over it.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"galen-walton-erso":{"name":"Galen Erso","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/213.webp","species":"Human","homeworld":"Grange","side":"Galactic Empire (unwilling)","bio":"A brilliant scientist forced by Krennic to design the Death Star's superlaser. He secretly built a weakness into the station and sent word to the Rebels, then died in his daughter Jyn's arms on Eadu.","seenIn":[{"name":"Rogue One","id":"5e4e1f7cb893acd1865bab92a59845eb","tmdb":"330459"}]},"qi-ra":{"name":"Qi'ra","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/214.webp","species":"Human","homeworld":"Corellia","side":"Crimson Dawn","bio":"Han Solo's childhood love from the streets of Corellia, separated from him when he escaped. She became a lieutenant of the Crimson Dawn syndicate, and in the end chose to take its leadership rather than leave with Han, answering to Maul himself.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"tobias-beckett":{"name":"Tobias Beckett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/215.webp","species":"Human","homeworld":"Glee Anselm","side":"Criminal","bio":"A veteran thief who took young Han under his wing on Mimban and taught him to trust no one. He led the doomed coaxium heists for Dryden Vos, betrayed Han, and was shot by him in their final confrontation.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"dryden-vos":{"name":"Dryden Vos","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/216.webp","species":"Near-human","homeworld":"Unknown","side":"Crimson Dawn","bio":"A charming but deadly crime lord of the Crimson Dawn syndicate who ran his business from his luxury yacht, the First Light. He gave Han's crew one last chance to make good, and was killed by Qi'ra.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"l3-37":{"name":"L3-37","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/217.webp","species":"Droid","homeworld":"Unknown","side":"Droid rights","bio":"Lando's self-built droid co-pilot, a fierce campaigner for droid rights. She freed the droids in Kessel's mines, was fatally damaged, and her memory was uploaded into the Millennium Falcon's navigation computer, helping Han make the Kessel Run.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"enfys-nest":{"name":"Enfys Nest","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/218.webp","species":"Human","homeworld":"Unknown","side":"Cloud-Riders","bio":"The masked leader of the Cloud-Riders, a band of marauders who turn out to be fighting the crime syndicates rather than serving them. On Savareen she revealed herself as a young woman fighting for the beginnings of a rebellion.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"mitth-raw-nuruodo":{"name":"Grand Admiral Thrawn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/219.webp","species":"Chiss","homeworld":"Rentor","side":"Galactic Empire","bio":"A brilliant Chiss strategist who studies his enemies' art to understand how they think. He hunted the rebels in Rebels until Ezra Bridger called space whales to drag his flagship away. Stranded in another galaxy for years, he returns in Ahsoka, ready to rebuild the Empire.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"ezra-bridger":{"name":"Ezra Bridger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/220.webp","species":"Human","homeworld":"Lothal","side":"Rebel Alliance, Jedi","bio":"A street kid from Lothal who joined the crew of the Ghost and became Kanan Jarrus's Jedi apprentice. To free his homeworld he sacrificed himself, vanishing with Thrawn into another galaxy. Sabine Wren and Ahsoka set out to bring him home.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"hera-syndulla":{"name":"Hera Syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/221.webp","species":"Twi'lek","homeworld":"Ryloth","side":"Rebel Alliance, New Republic","bio":"The Twi'lek pilot and captain of the Ghost, leader of the Rebels crew and a general in the Rebellion and New Republic. Daughter of the freedom fighter Cham Syndulla, she raised her son Jacen, Kanan's son, and never gave up looking for Ezra.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"sabine-wren":{"name":"Sabine Wren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/222.webp","species":"Human","homeworld":"Krownest","side":"Rebel Alliance, Mandalorian","bio":"A Mandalorian artist and explosives expert from the Ghost crew. She helped unite Mandalore's clans, and, after the war, trained with Ahsoka Tano as a Jedi apprentice, setting out to find her missing friend Ezra.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"ahsoka-tano":{"name":"Ahsoka Tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/223.webp","species":"Togruta","homeworld":"Shili","side":"Jedi, Rebel Alliance","bio":"Anakin Skywalker's apprentice in the Clone Wars, who left the Jedi Order after being framed for a crime. She survived Order 66, helped the rebels of the Ghost, duelled her old master Darth Vader, and later hunts Grand Admiral Thrawn across two galaxies.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"baylan-skoll":{"name":"Baylan Skoll","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/224.webp","species":"Human","homeworld":"Unknown","side":"Mercenary (former Jedi)","bio":"A former Jedi who survived Order 66 and lost faith in the Order, now a mercenary with his own plans for the galaxy's future. He and his apprentice Shin Hati helped Morgan Elsbeth reach Peridea, chasing a power older than the Jedi and Sith.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"shin-hati":{"name":"Shin Hati","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/225.webp","species":"Human","homeworld":"Unknown","side":"Mercenary","bio":"Baylan Skoll's apprentice, a skilled and ambitious fighter who serves alongside him as a mercenary for Morgan Elsbeth and clashes with Sabine Wren, eventually striking out on her own on Peridea.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"morgan-elsbeth":{"name":"Morgan Elsbeth","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/226.webp","species":"Human","homeworld":"Dathomir","side":"Galactic Empire, Nightsisters","bio":"A Nightsister survivor of Dathomir's destruction who became an Imperial industrialist and Thrawn's loyal ally. As magistrate of Corvus she clashed with Ahsoka, and later she built the ship and found the way to bring Thrawn home.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"huyang":{"name":"Huyang","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/227.webp","species":"Architect droid","homeworld":"Unknown","side":"Jedi","bio":"An ancient droid who has taught Jedi younglings to build their lightsabers for thousands of years, including Ahsoka. He travels with her in Ahsoka, with an encyclopaedic memory and plenty of opinions.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"wim":{"name":"Wim","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/228.webp","species":"Human","homeworld":"At Attin","side":"At Attin","bio":"A daydreaming boy from At Attin who wants nothing more than to be a Jedi. He finds the buried pirate ship Onyx Cinder in the woods and accidentally launches himself and his friends into a galaxy-wide adventure.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"neel":{"name":"Neel","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/229.webp","species":"Myykian","homeworld":"At Attin","side":"At Attin","bio":"Wim's best friend, a gentle, blue elephant-like boy who is happy to follow along on adventures but is always ready to admit he'd rather be home.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"fern":{"name":"Fern","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/230.webp","species":"Human","homeworld":"At Attin","side":"At Attin","bio":"A bold, rebellious girl from At Attin and the natural leader of the group, daughter of a government official, who always wants to be in charge of the adventure.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"kb":{"name":"KB","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/231.webp","species":"Human","homeworld":"At Attin","side":"At Attin","bio":"Fern's quiet, clever best friend, who has cybernetic implants and is the best of the kids at fixing machines and working out what's going on.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"sm-33":{"name":"SM-33","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/232.webp","species":"Pirate droid","homeworld":"Unknown","side":"Onyx Cinder crew","bio":"A battered old pirate droid, first mate of the Onyx Cinder, who wakes up when the kids find the ship and decides to serve its new 'captain', with a habit of wanting to fight everyone.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"jod-na-nawood":{"name":"Jod Na Nawood","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/233.webp","species":"Human","homeworld":"Unknown","side":"Pirate","bio":"A pirate with many names, including Crimson Jack and Captain Silvo, who has some talent with the Force. He joins the kids claiming to be a Jedi, but really has his eye on the treasure of At Attin.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"din-djarin":{"name":"Din Djarin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/234.webp","species":"Human","homeworld":"Aq Vetina","side":"Mandalorian","bio":"The Mandalorian, a foundling raised by the Mandalorians who never removes his helmet. A bounty hunter who was meant to deliver a child to the Empire, he instead protected him, became his father, and the two of them became Din Djarin and Grogu.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"grogu":{"name":"Grogu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/235.webp","species":"Same species as Yoda","homeworld":"Unknown","side":"Mandalorian","bio":"A small green child of Yoda's species, raised in the Jedi Temple and rescued during Order 66. Strong with the Force and fond of frogs, he was found by the Mandalorian, trained briefly by Luke, and chose to stay with Din Djarin as his apprentice and son.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"rey":{"name":"Rey","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/236.webp","species":"Human","homeworld":"Jakku","side":"Resistance, Jedi","bio":"A scavenger from Jakku who waited years for a family that never came back. Strong in the Force, she found Luke Skywalker on Ahch-To and learned she was Palpatine's granddaughter. She defeated him on Exegol and chose her own name: Rey Skywalker.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"finn":{"name":"Finn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/237.webp","species":"Human","homeworld":"Unknown","side":"Resistance","bio":"A First Order stormtrooper, FN-2187, who refused to kill on Jakku and escaped with Poe Dameron. He became a hero of the Resistance and later found that the Force had guided his choices all along.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"poe-dameron":{"name":"Poe Dameron","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/238.webp","species":"Human","homeworld":"Yavin 4","side":"Resistance","bio":"The Resistance's best pilot, flying his X-wing Black One against the First Order. Hot-headed and brave, he learned to lead instead of only fight, and became general of the Resistance.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"ben-solo":{"name":"Kylo Ren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/239.webp","species":"Human","homeworld":"Chandrila","side":"First Order","bio":"The son of Han Solo and Leia Organa, who turned to the dark side and became Kylo Ren, idolising his grandfather Darth Vader. He killed his father, overthrew Snoke and led the First Order, until his mother's love brought him back as Ben Solo to save Rey.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"bb-8":{"name":"BB-8","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/240.webp","species":"Astromech droid","homeworld":"Hosnian Prime","side":"Resistance","bio":"Poe Dameron's rolling ball of a droid, who carried the map to Luke Skywalker across Jakku and into the arms of Rey. Loyal, brave and surprisingly expressive.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"snoke":{"name":"Snoke","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/241.webp","species":"Artificial","homeworld":"Exegol","side":"First Order","bio":"The mysterious Supreme Leader of the First Order, who turned Ben Solo to the dark side. He was secretly a creation of Palpatine's on Exegol, and Kylo Ren cut him in half in his own throne room.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"armitage-hux":{"name":"General Hux","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/242.webp","species":"Human","homeworld":"Arkanis","side":"First Order","bio":"A fanatical young First Order general who commanded Starkiller Base and gave the order to destroy the Hosnian system. He despised Kylo Ren so much that he eventually became a spy for the Resistance.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"},{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"phasma":{"name":"Captain Phasma","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/243.webp","species":"Human","homeworld":"Parnassos","side":"First Order","bio":"The chrome-armoured commander of the First Order's stormtroopers, responsible for Finn's training, who later fought her former trooper on Snoke's flagship.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"maz-kanata":{"name":"Maz Kanata","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/244.webp","species":"Unknown","homeworld":"Takodana","side":"Neutral","bio":"A tiny, ancient pirate queen who has run a castle on Takodana for a thousand years. She kept Luke's old lightsaber in her vaults and gave Rey her first push towards her destiny.","seenIn":[{"name":"The Force Awakens","id":"5991a8045a105b2af417e8e4a47b8a2c","tmdb":"140607"}]},"rose-tico":{"name":"Rose Tico","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/245.webp","species":"Human","homeworld":"Hays Minor","side":"Resistance","bio":"A Resistance maintenance worker whose sister Paige died bombing a dreadnought. She joined Finn on a mission to Canto Bight and saved him on Crait, believing in saving what we love rather than fighting what we hate.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"amilyn-holdo":{"name":"Vice Admiral Holdo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/246.webp","species":"Human","homeworld":"Gatalenta","side":"Resistance","bio":"A Resistance commander who took charge after Leia was injured. Mistrusted by Poe, she quietly saved the Resistance by staying aboard the Raddus and ramming it through Snoke's flagship at lightspeed.","seenIn":[{"name":"The Last Jedi","id":"5eb3cd99b986f5c779c031b3c825c288","tmdb":"181808"}]},"zorii-bliss":{"name":"Zorii Bliss","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/247.webp","species":"Human","homeworld":"Kijimi","side":"Spice Runners of Kijimi","bio":"The masked leader of the Spice Runners of Kijimi and Poe Dameron's old partner from his smuggling days, who helped the heroes get into the First Order's flagship.","seenIn":[{"name":"The Rise of Skywalker","id":"67e4f6e42a548f875fdaeb4ce8795dbe","tmdb":"181812"}]},"osha-aniseya":{"name":"Osha","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/248.webp","species":"Human","homeworld":"Brendok","side":"Jedi (former)","bio":"One of twin sisters created through the Force by a coven on Brendok, who was taken in by the Jedi after the coven was destroyed. She left the Order and worked as a mechanic, until her sister's murders dragged her back into the Jedi's world.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"mae-ho-aniseya":{"name":"Mae","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/249.webp","species":"Human","homeworld":"Brendok","side":"Acolyte","bio":"Osha's twin, raised by the coven and taught to hate the Jedi for what happened on Brendok. She became an assassin hunting the Jedi involved, guided by a mysterious master.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"sol":{"name":"Master Sol","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/250.webp","species":"Human","homeworld":"Coruscant","side":"Jedi Order","bio":"A kind, respected Jedi Master who once trained Osha and was part of the mission to Brendok. As the assassin closes in on the Jedi from that mission, he has to face what really happened there.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"qimir":{"name":"Qimir","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/251.webp","species":"Human","homeworld":"Unknown","side":"Sith","bio":"Also called the Stranger, a former Jedi Padawan turned Sith who poses as a harmless smuggler while secretly training Mae. He hides on the ocean world of Bal'demnic.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"jecki-lon":{"name":"Jecki Lon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/252.webp","species":"Theelin-human","homeworld":"Unknown","side":"Jedi Order","bio":"Master Sol's calm, skilled Padawan, who joins the hunt for the assassin and fights bravely when the mission turns deadly.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"yord-fandar":{"name":"Yord Fandar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/253.webp","species":"Human","homeworld":"Alderaan","side":"Jedi Order","bio":"A by-the-book Jedi Knight and old friend of Osha's from her days as a Padawan, who goes with Master Sol on the hunt for the assassin.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"indara":{"name":"Master Indara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/254.webp","species":"Human","homeworld":"Coruscant","side":"Jedi Order","bio":"A Jedi Master who led the mission to Brendok, and the first target of the assassin, ambushed in a cantina on Ueda.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"vernestra-rwoh":{"name":"Vernestra Rwoh","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/255.webp","species":"Mirialan","homeworld":"Coruscant","side":"Jedi Order","bio":"A Jedi Master of the High Republic who became a Jedi Knight at just fifteen. In The Acolyte she sits on the Jedi Council, and the Stranger has a connection to her past.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"rex":{"name":"Captain Rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/357.webp","species":"Human (clone)","homeworld":"Kamino","side":"Republic, Rebel Alliance","bio":"CT-7567, captain of the 501st Legion and Anakin's right hand through the Clone Wars, and the clone who came closest to Ahsoka. When Order 66 came he fought his own chip long enough to tell her to find Fives, and they survived together. Years later he came out of retirement on Seelos to fight for the Rebellion.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"plo-koon":{"name":"Plo Koon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/358.webp","species":"Kel Dor","homeworld":"Dorin","side":"Jedi Order","bio":"A gentle Jedi Master in a breathing mask who found the infant Ahsoka on Shili and brought her to the Temple. He led his clone Wolfpack from the cockpit of his own fighter and was loved by his men, until they shot him down over Cato Neimoidia at Order 66.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"asajj-ventress":{"name":"Asajj Ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/359.webp","species":"Dathomirian Zabrak","homeworld":"Dathomir","side":"Separatists, then bounty hunter","bio":"A Nightsister orphan trained as a Jedi, then as Count Dooku's assassin with twin curved lightsabers. Dooku betrayed her, Grievous wiped out her sisters, and she became a bounty hunter who helped Ahsoka and loved Quinlan Vos. After the war she was still out there, protecting the Jedi who had survived.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"cody":{"name":"Commander Cody","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/360.webp","species":"Human (clone)","homeworld":"Kamino","side":"Republic, Empire","bio":"CC-2224, Obi-Wan's loyal clone commander of the 212th Attack Battalion, steady, clever and dryly funny. He fought beside Obi-Wan on Christophsis, Ryloth and Utapau, where he gave the order to fire on him when Order 66 came.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"barriss-offee":{"name":"Barriss Offee","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/361.webp","species":"Mirialan","homeworld":"Mirial","side":"Jedi Order, then her own","bio":"Luminara Unduli's serious, gifted Padawan, and Ahsoka's friend through the brain-worm horrors of Geonosis. Losing faith in a Jedi Order at war, she bombed the Temple and let Ahsoka take the blame. Freed from prison by the Empire, she refused to become an Inquisitor and found a quiet life as a healer.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"}]},"luminara-unduli":{"name":"Luminara Unduli","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/362.webp","species":"Mirialan","homeworld":"Mirial","side":"Jedi Order","bio":"A calm, precise Jedi Master with tattoos across her face, Barriss Offee's teacher. She guarded the captive Nute Gunray, fought on Geonosis and Kashyyyk, and was caught by the Empire after Order 66. Even her death was used against the Jedi: the Inquisitor kept her image alive to lure survivors to the Spire.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"ki-adi-mundi":{"name":"Ki-Adi-Mundi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/363.webp","species":"Cerean","homeworld":"Cerea","side":"Jedi Order","bio":"A tall-domed Jedi Master on the High Council, thoughtful and a little proud. He led the ground assault on the second battle of Geonosis, raced Anakin to the droid factory, and fell on Mygeeto when his clones turned on him at Order 66.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"poggle-the-lesser":{"name":"Poggle the Lesser","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/364.webp","species":"Geonosian","homeworld":"Geonosis","side":"Separatists","bio":"Archduke of Geonosis, whose droid foundries armed the Separatist army. After the first battle he rebuilt the factories, and in the second battle of Geonosis the Jedi had to capture him to find the Geonosian queen. He was killed on Mustafar with the rest of the Separatist Council.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"satine-kryze":{"name":"Satine Kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/365.webp","species":"Human","homeworld":"Kalevala","side":"New Mandalorians","bio":"The pacifist Duchess of Mandalore, who led her people away from their warrior past and kept her world neutral in the Clone Wars. She and Obi-Wan had loved each other long before, and the feeling never quite went away. Maul killed her in front of him to break him.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"cad-bane":{"name":"Cad Bane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/366.webp","species":"Duros","homeworld":"Duro","side":"Bounty hunter","bio":"The galaxy's most feared bounty hunter, with a wide-brimmed hat, rocket boots and a slow, menacing drawl. He held the Senate hostage, stole a holocron from inside the Jedi Temple and kidnapped Force-sensitive children for Sidious. Decades later Boba Fett finally outdrew him on Tatooine.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"aurra-sing":{"name":"Aurra Sing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/367.webp","species":"Palliduvan","homeworld":"Nar Shaddaa","side":"Bounty hunter","bio":"A pale, chalk-white bounty hunter with a long sniper rifle and an antenna in her head. After Jango's death she took charge of the young Boba Fett, helping him try to kill Mace Windu, and she ran with Cad Bane and the Hutts through the war.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"lux-bonteri":{"name":"Lux Bonteri","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/368.webp","species":"Human","homeworld":"Onderon","side":"Separatists, then Onderon rebels","bio":"The son of a Separatist senator who wanted peace. After Dooku had his mother killed, Lux turned against the Separatists, briefly trusted Death Watch, and then led the rebellion that freed Onderon with Saw and Steela Gerrera. Ahsoka was very fond of him.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"savage-opress":{"name":"Savage Opress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/369.webp","species":"Dathomirian Zabrak","homeworld":"Dathomir","side":"Nightbrothers, then Maul","bio":"A Nightbrother transformed by Mother Talzin's magic into a towering, horned warrior and sent to Dooku as an apprentice and assassin. Sent to find his lost brother, he brought Maul back from Lotho Minor, and fought beside him until Darth Sidious killed him on Mandalore.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"talzin":{"name":"Mother Talzin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/370.webp","species":"Dathomirian Zabrak","homeworld":"Dathomir","side":"Nightsisters","bio":"The witch-queen of the Nightsisters of Dathomir and the mother of Maul, wielding dark, ancient magick. She plotted for years against Dooku and Sidious, rebuilt Maul's mind and body, and was finally killed by Grievous's blade while trying to take Dooku's place.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"father-mortis":{"name":"The Father","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/371.webp","species":"Force wielder","homeworld":"Mortis","side":"Balance","bio":"The ancient guardian of Mortis, who held his children, the light Daughter and the dark Son, in balance. Old and dying, he called Anakin there to test whether he truly was the Chosen One, and hoped he would take his place.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"daughter":{"name":"The Daughter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/372.webp","species":"Force wielder","homeworld":"Mortis","side":"Light side","bio":"The embodiment of the light side of the Force on Mortis, gentle and bright. She gave her own life force to bring Ahsoka back after the Son killed her, a gift that stayed with Ahsoka for the rest of her life.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"son":{"name":"The Son","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/373.webp","species":"Force wielder","homeworld":"Mortis","side":"Dark side","bio":"The embodiment of the dark side on Mortis, able to take the shape of a winged gargoyle. He showed Anakin his future as Darth Vader and longed to escape Mortis, until his own father killed him.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"even-piell":{"name":"Even Piell","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/374.webp","species":"Lannik","homeworld":"Lannik","side":"Jedi Order","bio":"A small, scarred and very tough Jedi Master on the High Council. Captured with Captain Tarkin and held in the Citadel, he shared half of a vital secret route with Tarkin before he died on Lola Sayu during the rescue.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"lee-char":{"name":"Prince Lee-Char","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/375.webp","species":"Mon Calamari","homeworld":"Mon Cala","side":"Mon Calamari monarchy","bio":"The young heir to the throne of Mon Cala, unsure of himself after his father's murder. During the Quarren rebellion and the Separatist invasion he found his courage, united both peoples and became king, with Captain Ackbar beside him.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"kit-fisto":{"name":"Kit Fisto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/376.webp","species":"Nautolan","homeworld":"Glee Anselm","side":"Jedi Order","bio":"A cheerful Nautolan Jedi Master with head-tentacles and a wide grin, at home under water. He fought in the oceans of Mon Cala, survived Grievous's lair, and fell in Palpatine's office alongside Mace Windu when the Jedi tried to arrest the Chancellor.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"fives":{"name":"Fives","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/377.webp","species":"Human (clone)","homeworld":"Kamino","side":"Republic","bio":"CT-5555, a cadet of Domino Squad who became an ARC trooper in the 501st. Investigating why his friend Tup killed a Jedi, he found the inhibitor chips in every clone's head and the plot behind them. No one believed him, and he was shot before he could warn anyone.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"pong-krell":{"name":"Pong Krell","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/378.webp","species":"Besalisk","homeworld":"Ojom","side":"Jedi Order, secretly Dooku","bio":"A four-armed Jedi general who took command of the 501st on Umbara and sent its clones on suicidal attacks. He had seen the Jedi's fall coming and secretly turned to the dark side; when Rex's men discovered his treachery, they arrested him and Dogma shot him.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"steela-gerrera":{"name":"Steela Gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/379.webp","species":"Human","homeworld":"Onderon","side":"Onderon rebels","bio":"Saw's older sister, a natural leader and sharpshooter who took command of Onderon's rebels and freed their world from its Separatist king. In the final battle she fell from a cliff, and Ahsoka could not hold on to her.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"hondo-ohnaka":{"name":"Hondo Ohnaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/380.webp","species":"Weequay","homeworld":"Florrum","side":"Pirate","bio":"A charming, greedy, endlessly talkative pirate who captured Count Dooku, Anakin and Obi-Wan in a single week and somehow never stopped being likeable. Years later he was still around, still scheming, and still claiming to be Ezra's good friend.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"pre-vizsla":{"name":"Pre Vizsla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/381.webp","species":"Human","homeworld":"Mandalore","side":"Death Watch","bio":"The leader of Death Watch and owner of the Darksaber, the black blade of ancient Mandalorian rulers. He wanted to bring back Mandalore's warrior past and overthrow Satine, and allied with Maul to do it, until Maul took the Darksaber and his head in single combat.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"bo-katan-kryze":{"name":"Bo-Katan Kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/382.webp","species":"Human","homeworld":"Kalevala","side":"Nite Owls, Mandalore","bio":"Satine's fierce younger sister, a Death Watch lieutenant who turned on Maul when he took Mandalore. She fought beside Ahsoka in the siege of Mandalore, led the clans against the Empire, and years later united the scattered Mandalorians to retake their homeworld.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"trace-martez":{"name":"Trace Martez","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/383.webp","species":"Human","homeworld":"Coruscant","side":"Smuggler","bio":"A young pilot and mechanic from Coruscant's lower levels, who fixes ships and dreams of flying away. Ahsoka crashed into her life after leaving the Jedi Order, and the friendship that began with a broken speeder survived spice runners, Pykes and the fall of the Republic.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"rafa-martez":{"name":"Rafa Martez","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/384.webp","species":"Human","homeworld":"Coruscant","side":"Smuggler","bio":"Trace's older sister, a sharp-tongued schemer who always has a deal on the go. Her spice-running job for the Pykes nearly got them all killed, but she and Ahsoka learned to trust each other, and the sisters stood by Ahsoka when the Republic fell.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"hunter":{"name":"Hunter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/385.webp","species":"Human (clone)","homeworld":"Kamino","side":"Clone Force 99","bio":"The leader of the Bad Batch, a clone with super-sensitive senses who can track anything. When the Empire rose he refused its orders and took on the care of Omega, becoming as much her father as her sergeant.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"echo":{"name":"Echo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/386.webp","species":"Human (clone)","homeworld":"Kamino","side":"Republic, Clone Force 99","bio":"Once a by-the-book trooper from Domino Squad, thought killed at the Citadel. The Separatists kept him alive as a half-machine computer, until Rex and the Bad Batch rescued him on Skako Minor. He joined them, then left to help other clones escape the Empire.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"kanan-jarrus":{"name":"Kanan Jarrus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/387.webp","species":"Human","homeworld":"Coruscant","side":"Jedi, Rebel Alliance","bio":"Caleb Dume, a Padawan who survived Order 66 and hid as a drifter with a new name. Hera brought him back into the fight, and he became Ezra's master. Blinded by Maul on Malachor, he learned to see through the Force, and gave his life on Lothal to save Hera and their unborn son.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"garazeb-orrelios":{"name":"Zeb","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/388.webp","species":"Lasat","homeworld":"Lasan","side":"Rebel Alliance","bio":"Garazeb Orrelios, a huge, grumpy Lasat warrior and former Honor Guard of Lasan, whose world the Empire burned. The Ghost crew's muscle, Ezra's grudging roommate, and in the end the one who made peace with Kallus, the man who destroyed his people.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"c1-10p":{"name":"Chopper","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/389.webp","species":"Astromech droid","homeworld":"","side":"Rebel Alliance","bio":"Chopper, Hera's grumpy, cranky old astromech, built from mismatched parts and proud of it. He electrocutes his friends, cheats at games and complains constantly, but he has saved the Ghost crew more times than any of them like to admit.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"alexsandr-kallus":{"name":"Agent Kallus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/390.webp","species":"Human","homeworld":"Coruscant","side":"Empire, then Rebellion","bio":"An Imperial Security Bureau agent who hunted the Ghost crew across Lothal, carrying a bo-rifle taken from a Lasat warrior. Stranded on an icy moon with Zeb, he began to doubt, became the rebel spy Fulcrum, and finally joined the Rebellion openly.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"maketh-tua":{"name":"Minister Tua","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/391.webp","species":"Human","homeworld":"Lothal","side":"Empire","bio":"Lothal's Imperial minister, a careerist who kept the planet's factories running for the Empire. After too many failures against the rebels she tried to defect and asked the Ghost crew to get her off Lothal, but she was killed before she could escape.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"seventh-sister":{"name":"The Seventh Sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/392.webp","species":"Mirialan","homeworld":"Mirial","side":"Inquisitorius","bio":"A cold, playful Inquisitor who hunted Ezra with her spidery probe droids and her spinning lightsaber. She and the Fifth Brother fought the rebels over Garel and Malachor, where Maul killed her.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"bendu":{"name":"The Bendu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/393.webp","species":"Force being","homeworld":"Atollon","side":"The middle","bio":"An enormous, ancient creature on Atollon who stands between the light and the dark side of the Force. He taught the blinded Kanan to see again, then lost patience with the war on his world and scattered both rebels and Empire with a storm.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"arihnda-pryce":{"name":"Governor Pryce","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/394.webp","species":"Human","homeworld":"Lothal","side":"Empire","bio":"A Lothal mining heiress who rose to become the planet's Imperial governor. Ruthless and ambitious, she brought in Grand Admiral Thrawn to destroy the rebels and ordered Lothal's fuel depot blown up rather than lose it, the blast that killed Kanan. She died in the liberation of Lothal.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"rukh":{"name":"Rukh","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/395.webp","species":"Noghri","homeworld":"Honoghr","side":"Thrawn","bio":"Thrawn's silent Noghri bodyguard and assassin, a master tracker who moves almost invisibly. He hunted the rebels across Lothal for his master, and was finally caught in the shield of the Imperial complex during the liberation of Lothal.","seenIn":[{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"mon-mothma":{"name":"Mon Mothma","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/396.webp","species":"Human","homeworld":"Chandrila","side":"Rebel Alliance","bio":"A senator from Chandrila who opposed Palpatine's war powers from the start. For years she secretly funded the rebellion while playing the loyal senator, until she denounced the Emperor in the Senate and fled, becoming the leader of the Rebel Alliance.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"},{"name":"Rebels","id":"049270492ac22f426375fe95deab7f36","series":true,"tmdb":"60554"}]},"luthen-rael":{"name":"Luthen Rael","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/397.webp","species":"Human","homeworld":"Fondor","side":"Rebellion","bio":"An antiques dealer on Coruscant and, in secret, the man building the rebellion one cell at a time. He used anyone and sacrificed anything, himself included, to light the fire. He recruited Cassian for the Aldhani heist and paid for it all with his own life.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"dedra-meero":{"name":"Dedra Meero","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/398.webp","species":"Human","homeworld":"Coruscant","side":"Empire","bio":"A brilliant, ambitious ISB supervisor who was the first Imperial to see that the scattered rebel attacks were connected. She hunted the man she called Axis, ran the Ghorman project, and was brought down by her own obsession.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"syril-karn":{"name":"Syril Karn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/399.webp","species":"Human","homeworld":"Coruscant","side":"Empire","bio":"A rigid, ambitious corporate deputy inspector humiliated by Cassian on Ferrix, who spent years trying to catch him. He fell for Dedra Meero, went undercover for the ISB on Ghorman, and died there when he finally understood what the Empire was.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"bix-caleen":{"name":"Bix Caleen","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/400.webp","species":"Human","homeworld":"Ferrix","side":"Rebellion","bio":"A salvage dealer on Ferrix and Cassian's on-and-off love, who passed his messages to Luthen. Tortured by the ISB, she slowly rebuilt herself with Cassian's help, and at the end she carried his future away to safety.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"kleya-marki":{"name":"Kleya Marki","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/401.webp","species":"Human","homeworld":"Coruscant","side":"Rebellion","bio":"Luthen's assistant in his antiques shop and in everything else: his partner in building the rebellion, raised by him since childhood. Cool, clever and unflinching, she kept the network alive when Luthen fell and passed the warning about the Death Star to Yavin.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"vel-sartha":{"name":"Vel Sartha","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/402.webp","species":"Human","homeworld":"Chandrila","side":"Rebellion","bio":"Mon Mothma's cousin, a rich girl turned rebel who led the heist team on Aldhani. Later she became a leader of the rebel cell on Yavin, and the partner of Cinta Kaz.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"b2emo":{"name":"B2EMO","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/403.webp","species":"Salvage droid","homeworld":"Ferrix","side":"Andor family","bio":"Bee, the old, slow-talking salvage droid of Maarva Andor's household on Ferrix, who adored Cassian and Maarva. Nervous and loyal, he stayed with the people of Ferrix through the uprising and later rebuilt his life with the rebels.","seenIn":[{"name":"Andor","id":"f5cab3dbec95f7d23748bf1cabd79bd9","series":true,"tmdb":"83867"}]},"omega":{"name":"Omega","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/404.webp","species":"Human (clone)","homeworld":"Kamino","side":"Clone Force 99","bio":"A young clone girl raised on Kamino, one of the few unaltered copies of Jango Fett. She escaped with the Bad Batch, became their sister and their heart, and was hunted by the Empire for the value of her blood until her family freed her and the other children from Mount Tantiss.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"wrecker":{"name":"Wrecker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/405.webp","species":"Human (clone)","homeworld":"Kamino","side":"Clone Force 99","bio":"The Bad Batch's huge, cheerful demolitions expert, who loves explosions and his stuffed toy Lula. He is the strongest clone in the squad and the softest with Omega.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"tech":{"name":"Tech","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/406.webp","species":"Human (clone)","homeworld":"Kamino","side":"Clone Force 99","bio":"The Bad Batch's genius, with goggles and an answer for everything, who can hack any computer and fly anything. He fell during a mission on Eriadu, and was later found alive as a captive at Mount Tantiss.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"crosshair":{"name":"Crosshair","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/407.webp","species":"Human (clone)","homeworld":"Kamino","side":"Empire, then Clone Force 99","bio":"The Bad Batch's sharpshooter, who obeyed his inhibitor chip and his orders and joined the Empire, hunting his own brothers. Slowly he realised the Empire would never value the clones, and he came back to his squad for the last fight at Mount Tantiss.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"},{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"ciddarin-scaleback":{"name":"Cid","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/408.webp","species":"Trandoshan","homeworld":"Ord Mantell","side":"Herself","bio":"A former Jedi informant who runs a dingy parlour on Ord Mantell, taking jobs and handing out dangerous work to the Bad Batch for a cut. Shrewd and greedy, she cared about them more than she admitted, until she sold them out.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"royce-hemlock":{"name":"Dr. Royce Hemlock","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/409.webp","species":"Human","homeworld":"","side":"Empire","bio":"The Empire's chief scientist at Mount Tantiss, cold and polite, running Project Necromancer's clone experiments for Palpatine. He wanted Omega's blood and anyone else's that would serve, until the Bad Batch came for the children he was holding.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"nala-se":{"name":"Nala Se","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/410.webp","species":"Kaminoan","homeworld":"Kamino","side":"Kaminoan cloners","bio":"The Kaminoan chief medical scientist who looked after the clones from birth, and who secretly kept Omega safe. She knew the truth about the inhibitor chips, helped hide it from Fives, and paid with her freedom to protect the girl she raised.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"edmon-rampart":{"name":"Admiral Rampart","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/411.webp","species":"Human","homeworld":"","side":"Empire","bio":"An Imperial vice admiral who replaced the clones with recruited stormtroopers and ordered the destruction of Kamino's cloning city to cover it up. He was exposed and arrested when the Bad Batch released the recordings.","seenIn":[{"name":"The Bad Batch","id":"22ac508176d3562ab31021ea6183a126","series":true,"tmdb":"105971"}]},"fennec-shand":{"name":"Fennec Shand","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/412.webp","species":"Human","homeworld":"","side":"Bounty hunter, Boba Fett","bio":"An elite assassin left for dead on Tatooine, rebuilt by Boba Fett and sworn to his service. She became his right hand, then his partner in running Jabba's old territory in Mos Espa.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"greef-karga":{"name":"Greef Karga","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/413.webp","species":"Human","homeworld":"Nevarro","side":"Bounty Hunters' Guild, Nevarro","bio":"The head of the guild of bounty hunters on Nevarro, who gave Din Djarin the job that led to Grogu. After a rocky start he became a true friend, cleaned up Nevarro and became its high magistrate.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"gideon":{"name":"Moff Gideon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/414.webp","species":"Human","homeworld":"","side":"Imperial Remnant","bio":"An Imperial warlord with the Darksaber, hunting Grogu for the power in his blood. He chased Din Djarin across the Outer Rim, captured Grogu, and returned for one last attempt to destroy the Mandalorians on Mandalore itself.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"carasynthia-dune":{"name":"Cara Dune","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/415.webp","species":"Human","homeworld":"Alderaan","side":"New Republic","bio":"A former Rebel shock trooper from Alderaan who drifted after the war, until she met Din Djarin on Sorgan. She fought beside him to protect Grogu and became a marshal of the New Republic on Nevarro.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"the-armorer":{"name":"The Armorer","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/416.webp","species":"Human","homeworld":"Mandalore","side":"Children of the Watch","bio":"The leader and blacksmith of Din Djarin's covert of Mandalorians, who forges their beskar armour and keeps their ways. She sent Din to find the Jedi for Grogu, and later forged Grogu's own armour.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"kuiil":{"name":"Kuiil","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/417.webp","species":"Ugnaught","homeworld":"Arvala-7","side":"Himself","bio":"An old Ugnaught moisture farmer who had served out his time as an Imperial indentured worker, and who only wanted peace. He helped Din Djarin find and later protect Grogu, rebuilt IG-11 to care for him, and died saving the child. \"I have spoken.\"","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"ig-11":{"name":"IG-11","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/418.webp","species":"Assassin droid","homeworld":"","side":"Bounty hunter, then protector","bio":"A cold assassin droid sent after Grogu and shot by Din Djarin. Rebuilt by Kuiil as a nurse droid, he became Grogu's protector and gave his own life for him on Nevarro; later his parts helped protect the town as its marshal.","seenIn":[{"name":"The Mandalorian and Boba Fett","id":"624b3b264ad9458ab12baea9a5becd58","series":true,"tmdb":"82856"}]},"fourth-sister":{"name":"The Fourth Sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/419.webp","species":"Nogratu","homeworld":"","side":"Inquisitorius","bio":"An Inquisitor, once a Jedi herself, who recruited Barriss Offee into the Inquisitorius and trained her. She later joined the hunt for Obi-Wan Kenobi.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"jocasta-nu":{"name":"Jocasta Nu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/420.webp","species":"Human","homeworld":"Coruscant","side":"Jedi Order","bio":"The Jedi Order's chief librarian, guardian of the Temple archives, who once insisted that if something was not in the archives, it did not exist. She was an old friend of Dooku and remembered him as he had been.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"}]},"yaddle":{"name":"Yaddle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/421.webp","species":"Yoda's species","homeworld":"","side":"Jedi Order","bio":"A small Jedi Master of Yoda's species who sat on the High Council. She worried about Dooku's growing anger, discovered that he had turned to the dark side, and died fighting him rather than let it pass.","seenIn":[{"name":"Tales of the Jedi","id":"92de455435d7c5619ae78be6acaa72aa","series":true,"tmdb":"203085"}]},"lyco-strata":{"name":"Lyco Strata","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/422.webp","species":"Human","homeworld":"","side":"Jedi survivor","bio":"A young Jedi Padawan who survived Order 66 and was hiding from the Empire when Asajj Ventress found him. She took him under her protection on a dangerous journey toward the Path, the network that helped Jedi escape.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"quinlan-vos":{"name":"Quinlan Vos","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/423.webp","species":"Kiffar","homeworld":"Kiffu","side":"Jedi Order","bio":"A rule-bending Jedi Master who can read memories from objects he touches. He was sent to kill Dooku with Asajj Ventress, fell in love with her, was pulled to the dark side and saved by her sacrifice.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"durge":{"name":"Durge","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/424.webp","species":"Gen'Dai","homeworld":"","side":"Separatists","bio":"A huge, nearly unkillable Gen'Dai bounty hunter in armour, who could survive almost any wound by pulling himself back together. In the early Clone Wars he served the Separatists, chasing Obi-Wan through the battle of Muunilinst.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"}]},"shaak-ti":{"name":"Shaak Ti","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/425.webp","species":"Togruta","homeworld":"Shili","side":"Jedi Order","bio":"A calm, graceful Togruta Jedi Master on the High Council, who watched over the clones' training on Kamino and defended them as if they were her own. In the Battle of Coruscant she protected the Chancellor from General Grievous.","seenIn":[{"name":"Clone Wars (2003)","id":"0782cdab66355d25e7c6d0ba7837c3b2","series":true,"tmdb":"3122"},{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"firmus-piett":{"name":"Admiral Piett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/740.webp","species":"Human","homeworld":"Axxila","side":"Galactic Empire","bio":"First officer of Vader's flagship, the Executor. When Admiral Ozzel bungled the attack on Hoth, Vader choked him and promoted Piett on the spot. A careful officer who learned to survive Vader's temper, he commanded the Executor at Endor and died when a crippled A-wing crashed into its bridge.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"lobot":{"name":"Lobot","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/741.webp","species":"Human","homeworld":"Bespin","side":"Cloud City","bio":"Lando Calrissian's quiet aide on Cloud City, wired into the city's computers by a cybernetic implant around his head. He rarely spoke, but he was fiercely loyal to Lando, and when the Empire took over Cloud City he led the city's security guards to help Leia and Chewbacca escape.","seenIn":[{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"wedge-antilles":{"name":"Wedge Antilles","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/742.webp","species":"Human","homeworld":"Corellia","side":"Rebel Alliance","bio":"A Corellian pilot who flew with Luke at the Battle of Yavin, fought on Hoth as Rogue Three and helped Lando blow up the second Death Star at Endor. One of the few rebel pilots to survive all three great battles, he became a legend of the Alliance and later trained new pilots for the New Republic.","seenIn":[{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"},{"name":"The Empire Strikes Back","id":"87d40bf3a66a5d8092342cd243ad9a62","tmdb":"1891"}]},"beru-whitesun-lars":{"name":"Beru Lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/743.webp","species":"Human","homeworld":"Tatooine","side":"Lars family","bio":"Owen Lars' wife, who raised Luke on their moisture farm on Tatooine and saw more of his father in him than Owen liked. She gently argued that Luke should be allowed to leave and become a pilot. Stormtroopers hunting the stolen Death Star plans burned the farm and killed her and Owen.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"},{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"biggs-darklighter":{"name":"Biggs Darklighter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/744.webp","species":"Human","homeworld":"Tatooine","side":"Rebel Alliance","bio":"Luke's best friend from Tatooine. He went to the Imperial Academy, defected to the Rebellion and flew as Red Three at the Battle of Yavin, where he was overjoyed to find Luke among the pilots. He covered Luke's run down the Death Star trench and was shot down by Vader moments before the end.","seenIn":[{"name":"Star Wars","id":"8d7d8273479c759b262f22846ee9ecb1","tmdb":"11"}]},"saun-dann":{"name":"Trader Saun Dann","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/745.webp","species":"Human","homeworld":"Kashyyyk (trader)","side":"Rebel sympathiser","bio":"A cheerful trader who sold goods to the Wookiees of Kashyyyk and quietly helped the Rebellion. On Life Day, with Imperial troops searching Chewbacca's family home, he dropped in with presents and talked the soldiers round, buying the family time until Chewbacca and Han could arrive.","seenIn":[{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"}]},"mallatobuck":{"name":"Malla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/746.webp","species":"Wookiee","homeworld":"Kashyyyk","side":"Chewbacca's family","bio":"Chewbacca's wife, who waits for him at their tree house on Kashyyyk with their son Lumpy and his father Itchy. On Life Day she worries whether Chewie will make it home through the Imperial blockade, keeps the family going while stormtroopers search the house, and welcomes Han and Chewie at last.","seenIn":[{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"}]},"lumpawaroo":{"name":"Lumpy","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/747.webp","species":"Wookiee","homeworld":"Kashyyyk","side":"Chewbacca's family","bio":"Chewbacca and Malla's young son, called Lumpy. He waits impatiently for his father to come home for Life Day, watches holo-cartoons to pass the time and outwits an Imperial trooper by building a translator to fake an order calling him back to base.","seenIn":[{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"}]},"attichitcuk":{"name":"Itchy","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/748.webp","species":"Wookiee","homeworld":"Kashyyyk","side":"Chewbacca's family","bio":"Chewbacca's elderly father, known as Itchy. A veteran of the Battle of Kashyyyk in the Clone Wars, he lives with Malla and Lumpy and spends Life Day waiting with them for Chewbacca to come home through the Imperial blockade.","seenIn":[{"name":"Holiday Special","id":"7e4b2a21577e5fd2d80361b9d53fee1c","tmdb":"74849"}]},"gial-ackbar":{"name":"Admiral Ackbar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/749.webp","species":"Mon Calamari","homeworld":"Mon Cala","side":"Rebel Alliance","bio":"A Mon Calamari admiral and brilliant tactician who led the rebel fleet at Endor from his flagship Home One. When the fleet arrived to find the Death Star shield still up and the Imperial fleet waiting, he was the first to realise it was a trap. He served the Rebellion and the Resistance for decades.","seenIn":[{"name":"Return of the Jedi","id":"996a9da88ba79e9c5d1f4afc2adc718f","tmdb":"1892"}]},"quarsh-panaka":{"name":"Captain Panaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/750.webp","species":"Human","homeworld":"Naboo","side":"Royal Naboo Security Forces","bio":"Head of Queen Amidala's security. When the Trade Federation invaded Naboo he got the Queen off the planet, through the blockade to Tatooine and on to Coruscant, guarding her decoy and the real queen alike. He then led the palace guards in the battle to take back Theed.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"sebulba":{"name":"Sebulba","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/751.webp","species":"Dug","homeworld":"Malastare","side":"Podracer","bio":"A Dug podracer, champion of the Boonta Eve race and a notorious cheat who fitted his huge orange podracer with hidden weapons and smashed rivals off the track. He sabotaged young Anakin's pod and tried to wreck him during the race, but crashed out on the final lap as Anakin won.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"watto":{"name":"Watto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/752.webp","species":"Toydarian","homeworld":"Toydaria","side":"Mos Espa junk dealer","bio":"A Toydarian junk dealer in Mos Espa who owned Shmi and Anakin Skywalker as slaves. Jedi mind tricks did not work on him, so Qui-Gon won Anakin's freedom by betting on the Boonta Eve podrace. Watto lost his bet when Anakin won, but kept Shmi.","seenIn":[{"name":"The Phantom Menace","id":"7016653547efd124d432a19774bbdbc9","tmdb":"1893"}]},"devon-izara":{"name":"Devon Izara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/753.webp","species":"Twi'lek","homeworld":"Unknown","side":"Jedi Order, Shadow Collective","bio":"A Twi'lek Padawan who survived Order 66 and hid with her master, Eeko-Dio Daki, on Janix. When the Empire's Inquisitors killed him, she was taken in by Maul, who saw a chance to train an apprentice of his own, and she turned toward the dark side to get her revenge.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"rook-kast":{"name":"Rook Kast","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/754.webp","species":"Human","homeworld":"Mandalore","side":"Shadow Collective","bio":"A Mandalorian super commando and one of Maul's most loyal followers, ever since Death Watch joined his Shadow Collective. After the Clone Wars she leads his Mandalorian warriors on Janix as he rebuilds his criminal empire under the Empire's nose.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"rio-durant":{"name":"Rio Durant","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/755.webp","species":"Ardennian","homeworld":"Ardennia","side":"Beckett's gang","bio":"A cheerful four-armed Ardennian pilot in Tobias Beckett's crew who welcomed Han into the gang. He flew the AT-hauler during the train heist on Vandor, where he was shot while piloting and died, leaving the crew without a pilot.","seenIn":[{"name":"Solo: A Star Wars Story","id":"0a16888797ee77d8d96605e9e43608da","tmdb":"348350"}]},"haja-estree":{"name":"Haja Estree","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/756.webp","species":"Human","homeworld":"Unknown","side":"The Path","bio":"A con man on Daiyu who pretended to be a Jedi, charging desperate people for fake Force miracles. When Obi-Wan exposed him, he admitted the truth, then pointed Obi-Wan toward the kidnapped Leia and later risked his life helping the Path smuggle refugees away from the Empire.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"kawlan-roken":{"name":"Roken","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/757.webp","species":"Human","homeworld":"Unknown","side":"The Path","bio":"Leader of the Path, an underground network smuggling surviving Jedi and Force-sensitive refugees out of the Empire's reach. His wife was killed by the Inquisitors. He helped Obi-Wan and Leia escape Mapuzo and led the refugees' escape from Jabiim under Imperial fire.","seenIn":[{"name":"Obi-Wan Kenobi","id":"452e6a8d6554512a69fe8e81c2c0e475","tmdb":"92830"}]},"eleventh-brother":{"name":"Eleventh Brother","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/758.webp","species":"Humanoid","homeworld":"Unknown","side":"Inquisitorius","bio":"A former Jedi turned Inquisitor, one of the Empire's Jedi hunters, who wears a stone-like mask. He was sent with Marrok to Janix to hunt down Maul and the young Jedi survivor Devon Izara.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"},{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"marrok":{"name":"Marrok","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/759.webp","species":"Humanoid","homeworld":"Unknown","side":"Inquisitorius, Morgan Elsbeth","bio":"A masked warrior once known as the First Brother, a Jedi who became an Inquisitor. After hunting Maul on Janix he vanished from the Inquisitorius and resurfaced in Morgan Elsbeth's service, duelling Ahsoka and Sabine until Sabine destroyed him and he dissolved in green Nightsister smoke.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"brander-lawson":{"name":"Brander Lawson","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/760.webp","species":"Human","homeworld":"Janix","side":"Janix police","bio":"An honest police captain on Janix who, with his droid partner Two-Boots, tries to hold back the crime gangs flooding his city. When Maul arrives and the Empire follows him, Lawson is caught between them while trying to protect his son Rylee.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"eeko-dio-daki":{"name":"Eeko-Dio Daki","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/761.webp","species":"Mosyk","homeworld":"Unknown","side":"Jedi Order","bio":"A gentle Jedi Master who escaped Order 66 with his Padawan, Devon Izara, and hid on Janix. He tried to keep her away from anger and the dark side, but the Inquisitors found them, and his death set her on the path to Maul.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"looti-vario":{"name":"Looti Vario","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/762.webp","species":"Aleena","homeworld":"Unknown","side":"Vario syndicate","bio":"A small but ambitious Aleena crime boss on Janix who rises by allying with Maul's Shadow Collective, and ends up in the middle of a war between Maul, the Pykes and the Empire.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"rylee-lawson":{"name":"Rylee Lawson","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/763.webp","species":"Human","homeworld":"Janix","side":"Lawson family","bio":"Captain Brander Lawson's young son, a keen athlete who wishes his father spent less time at work. When Maul and the Empire bring their war to Janix, Rylee's life is turned upside down along with his father's.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"2b0t":{"name":"Two-Boots","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/764.webp","species":"Droid","homeworld":"Janix","side":"Janix police","bio":"Captain Lawson's police droid partner on Janix, nicknamed Two-Boots, a dry-witted Tactical Defense Droid who backs Lawson up as the city's crime war gets out of hand.","seenIn":[{"name":"Maul - Shadow Lord","id":"f63c42afa8a2035810f52e5c69d843cf"}]},"vane":{"name":"Vane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/765.webp","species":"Nikto","homeworld":"Unknown","side":"Pirates","bio":"A Nikto pirate who survived the attack on Nevarro by abandoning his captain, Gorian Shard. He later turned up with Brutus' crew, and joined the hunt for the lost planet At Attin and its fabled riches.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"fara":{"name":"Fara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/766.webp","species":"Human","homeworld":"At Attin","side":"At Attin","bio":"Fern's mother, a teacher and government undersecretary on At Attin. When the children vanished into space aboard the Onyx Cinder, she searched with Wim's father Wendle, and learned that her perfect planet's peace was built on secrets kept from its people.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"brutus":{"name":"Brutus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/767.webp","species":"Shistavanen","homeworld":"Unknown","side":"Pirates","bio":"A wolf-like Shistavanen pirate, first mate to the down-on-his-luck Captain Silvo until he led a mutiny and took the crew for himself. Hearing of At Attin, a lost world full of Old Republic credits, he hunted Jod Na Nawood and the children to find it.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"wendle":{"name":"Wendle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/768.webp","species":"Human","homeworld":"At Attin","side":"At Attin","bio":"Wim's father, a hard-working At Attin man who struggles to connect with his dreamy son. When Wim and the others disappear on the Onyx Cinder, he joins Fara in the search, then fights alongside the children when pirates attack.","seenIn":[{"name":"Skeleton Crew","id":"0997202e34f2a7a443d51655f87e831a","tmdb":"202879"}]},"embo":{"name":"Embo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/769.webp","species":"Kyuzo","homeworld":"Phatrong","side":"Bounty hunter","bio":"A Kyuzo bounty hunter famous for his wide-brimmed metal hat, which he throws as a weapon and uses as a shield. A Clone Wars veteran who rode with Sugi and Cad Bane, he was still hiring out his skills in the years after the Empire fell.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"rotta":{"name":"Rotta the Hutt","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/770.webp","species":"Hutt","homeworld":"Tatooine","side":"Hutt Clan","bio":"Jabba the Hutt's son, kidnapped as a baby in the Clone Wars and rescued by Anakin and Ahsoka, who nicknamed him Stinky. Grown up and powerful, he becomes caught up in Din Djarin and Grogu's mission after the fall of the Empire.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"jacen-syndulla":{"name":"Jacen Syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/771.webp","species":"Human-Twi'lek","homeworld":"Lothal","side":"New Republic","bio":"Hera Syndulla and the late Jedi Kanan Jarrus's son, born after the war. Force-sensitive like his father, he spends time with Ahsoka and Sabine and dreams of becoming a Jedi.","seenIn":[{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"sash-ketter":{"name":"Sash Ketter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/772.webp","species":"Human","homeworld":"Unknown","side":"New Republic","bio":"A New Republic X-wing pilot in the Adelphi Rangers who flies alongside Carson Teva and his squadron.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"carson-teva":{"name":"Carson Teva","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/773.webp","species":"Human","homeworld":"Torolis","side":"New Republic","bio":"A New Republic X-wing captain and Rebel veteran with the Adelphi Rangers. One of the few officers who took the threat of the Imperial remnant seriously, he worked with Din Djarin, Ahsoka and Hera when his superiors would not listen.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"},{"name":"Ahsoka","id":"c2102f58ab290ca8116036b438d63186","tmdb":"114461"}]},"ward":{"name":"Colonel Ward","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/774.webp","species":"Human","homeworld":"Unknown","side":"New Republic","bio":"A Rebel veteran and New Republic colonel who commands the Adelphi Rangers. She recruits Din Djarin to take on Imperial remnant warlords on the Outer Rim, sending him and Grogu on a dangerous new mission.","seenIn":[{"name":"The Mandalorian and Grogu","id":"1cd8ebdeb1ad37a05b78d3a0b548b80f","tmdb":"1228710"}]},"bazil":{"name":"Bazil","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/775.webp","species":"Tynnan","homeworld":"Tynna","side":"Jedi ally","bio":"A small Tynnan tracker who helped the Jedi. He could sniff out a trail when no one else could, and led Sol, Osha and the others through the jungles of Khofar to find Master Kelnacca.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"kelnacca":{"name":"Kelnacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/776.webp","species":"Wookiee","homeworld":"Kashyyyk","side":"Jedi Order","bio":"A Wookiee Jedi Master who lived alone in the jungles of Khofar, carrying the secret of what happened on Brendok sixteen years before. He was one of the four Jedi targeted by Mae, and was killed by the Stranger before Sol could reach him.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"aniseya":{"name":"Mother Aniseya","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/777.webp","species":"Human","homeworld":"Brendok","side":"Brendok coven","bio":"The leader of a coven of Force witches hiding on Brendok, who used the Force to create the twins Osha and Mae. When four Jedi arrived wanting to test the girls, she tried to keep her family together, and died the night the coven's fortress burned.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"torbin":{"name":"Torbin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/778.webp","species":"Human","homeworld":"Bonadan","side":"Jedi Order","bio":"Master Indara's Padawan on Brendok, sixteen years before the series. Haunted by what happened there, he later withdrew into meditation and silence at the Jedi Temple, until Mae came hunting him.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"koril":{"name":"Mother Koril","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/779.webp","species":"Zabrak","homeworld":"Brendok","side":"Brendok coven","bio":"A Zabrak witch of Brendok's coven, who carried the twins Osha and Mae and raised them with Mother Aniseya. Fiercely protective and distrustful of the Jedi, she was killed in the fire that destroyed the coven.","seenIn":[{"name":"The Acolyte","id":"9879c0154e2259fede91a0430ed02cdd","tmdb":"114479"}]},"tera-sinube":{"name":"Tera Sinube","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/780.webp","species":"Cosian","homeworld":"Cosia","side":"Jedi Order","bio":"An elderly Cosian Jedi Master with a cane that hid a lightsaber, and an expert on Coruscant's criminal underworld. He helped Ahsoka track down her stolen lightsaber and taught her that patience can beat speed.","seenIn":[{"name":"The Clone Wars","id":"e958edd41f7be22b9028d11095ea714d","series":true,"tmdb":"4194"}]},"coleman-kcaj":{"name":"Coleman Kcaj","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/781.webp","species":"Ongree","homeworld":"Skustell","side":"Jedi Order","bio":"An Ongree Jedi Master with wide-set eyes who joined the Jedi High Council during the Clone Wars, and one of the few Jedi Masters who survived the purge that followed.","seenIn":[]},"c-21-highsinger":{"name":"C-21 Highsinger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/782.webp","species":"Droid","homeworld":"Unknown","side":"Bounty hunter","bio":"A tall, thin bounty hunter droid of mysterious origin with twin blasters, who worked with Boba Fett's Krayt's Claw in the Clone Wars and later hunted Cad Bane's old friends as the Empire rose.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"latts-razzi":{"name":"Latts Razzi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/783.webp","species":"Theelin","homeworld":"Korbori","side":"Bounty hunter","bio":"A Theelin bounty hunter who fights with a grappling boa she wears like a scarf. She rode with Boba Fett's Krayt's Claw during the Clone Wars and later crossed paths with Asajj Ventress.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"gilad-pellaeon":{"name":"Captain Pellaeon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/784.webp","species":"Human","homeworld":"Corellia","side":"Galactic Empire","bio":"Admiral Thrawn's loyal right-hand officer, a Clone Wars veteran who recruited promising people for Thrawn's cause. He found Morgan Elsbeth on Corvus and brought her into Thrawn's service.","seenIn":[{"name":"Tales of the Empire","id":"913ec0612bdcacc02f7fb559e1b0b23a","series":true,"tmdb":"251091"}]},"wing":{"name":"Wing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/785.webp","species":"Human","homeworld":"Corvus","side":"Calodan","bio":"A man from Calodan on Corvus who knew Morgan Elsbeth when she was building her new life there. Ruled by her, his city was turned toward Imperial industry and stripped of its forests.","seenIn":[]},"tay-grutty":{"name":"Tay Grutty","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/786.webp","species":"Human","homeworld":"Unknown","side":"Lazlo's gang","bio":"A member of the Duros crook Lazlo's gang, which young Cad Bane joined after a casino raid. He stuck with the gang after Lazlo died and rode with Bane as he began to make his name.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]},"niro":{"name":"Niro","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/787.webp","species":"Duros","homeworld":"Unknown","side":"Police","bio":"Cad Bane's childhood friend from the streets. When a gang raid went wrong, Niro was caught and Bane escaped. Years later Niro became a lawman, and the two old friends met again on opposite sides of the law.","seenIn":[{"name":"Tales of the Underworld","id":"4edb7a174729645122d6e4b273cfdf20","series":true,"tmdb":"288055"}]}},"films":{"8d7d8273479c759b262f22846ee9ecb1":{"planets":["tatooine","alderaan","yavin-4"],"ships":["millennium-falcon","tantive-iv","ds-1-orbital-battle-station","t-65b-x-wing-starfighter","btl-y-wing-starfighter","tie-ln-space-superiority-starfighter","tie-advanced-x1","imperial-i-class-star-destroyer","sandcrawler"],"chars":[{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/697.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/702.webp"},{"id":"han-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/708.webp"},{"id":"chewbacca"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/717.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/739.webp"},{"id":"c-3po"},{"id":"r2-d2"},{"id":"wilhuff-tarkin"},{"id":"owen-lars"},{"id":"beru-whitesun-lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/799.webp"},{"id":"wedge-antilles","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/801.webp"},{"id":"biggs-darklighter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/803.webp"}],"crawl":{"episode":"Episode IV","title":"A NEW HOPE","text":["The Galactic Empire rules the galaxy through fear. A small band of rebels fights back from hidden bases.","Rebel spies have stolen the plans for the Empire's newest weapon, a battle station able to destroy an entire planet.","Now Princess Leia races home with the plans aboard her ship, as an Imperial Star Destroyer closes in behind her...."]}},"7e4b2a21577e5fd2d80361b9d53fee1c":{"planets":["kashyyyk","tatooine"],"ships":["millennium-falcon"],"chars":[{"id":"chewbacca"},{"id":"han-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/712.webp"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/701.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/706.webp"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/730.webp"},{"id":"c-3po"},{"id":"r2-d2"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/878.webp"},{"id":"mallatobuck","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/867.webp"},{"id":"attichitcuk","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/869.webp"},{"id":"lumpawaroo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/868.webp"},{"id":"saun-dann","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/870.webp"}]},"87d40bf3a66a5d8092342cd243ad9a62":{"planets":["hoth","dagobah","bespin"],"ships":["millennium-falcon","executor","all-terrain-armored-transport","t-47-airspeeder","slave-i","t-65b-x-wing-starfighter","imperial-i-class-star-destroyer"],"chars":[{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/698.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/703.webp"},{"id":"han-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/709.webp"},{"id":"chewbacca"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/794.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/804.webp"},{"id":"lando-calrissian","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/797.webp"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/727.webp"},{"id":"c-3po"},{"id":"r2-d2"},{"id":"darth-sidious","as":"Emperor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/734.webp"},{"id":"obi-wan-kenobi"},{"id":"firmus-piett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/808.webp"},{"id":"wedge-antilles","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/802.webp"},{"id":"lobot","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/809.webp"}],"crawl":{"episode":"Episode V","title":"THE EMPIRE STRIKES BACK","text":["The Rebels destroyed the Death Star, but the Empire has struck back hard, hunting them from one hiding place to the next.","Luke Skywalker and his friends have taken refuge on the frozen world of Hoth, under constant watch for Imperial patrols.","Darth Vader, determined to find young Skywalker, has sent thousands of probe droids out across the galaxy...."]}},"996a9da88ba79e9c5d1f4afc2adc718f":{"planets":["tatooine","dagobah","endor"],"ships":["ds-2-death-star-ii-mobile-battle-station","millennium-falcon","khetanna","tydirium","74-z-speeder-bike","home-one","all-terrain-scout-transport","rz-1-a-wing-interceptor","a-sf-01-b-wing-starfighter"],"chars":[{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/699.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/704.webp"},{"id":"han-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/710.webp"},{"id":"chewbacca"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/721.webp"},{"id":"darth-sidious","as":"Emperor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/735.webp"},{"id":"yoda"},{"id":"lando-calrissian","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/725.webp"},{"id":"jabba-desilijic-tiure"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/728.webp"},{"id":"wicket-wystri-warrick"},{"id":"c-3po"},{"id":"r2-d2"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/793.webp"},{"id":"gial-ackbar","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/810.webp"}],"crawl":{"episode":"Episode VI","title":"RETURN OF THE JEDI","text":["Luke Skywalker has come home to Tatooine to rescue his friend Han Solo from the palace of the vile gangster Jabba the Hutt.","Far away, the Empire is secretly building a second, even more powerful Death Star above the forest moon of Endor.","Once it is finished, the Emperor plans to crush the Rebellion for good. The Rebel fleet is gathering for one last stand...."]}},"d9111d44298e583aff033f5687d64d83":{"planets":["naboo","tatooine","coruscant"],"ships":["j-type-327-nubian-royal-starship","n-1-starfighter","anakin-skywalker-s-podracer","scimitar","lucrehulk-class-droid-control-ship","radiant-vii"],"chars":[{"id":"qui-gon-jinn"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/713.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/718.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/811.webp"},{"id":"jar-jar-binks"},{"id":"maul"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/731.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/805.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/813.webp"},{"id":"shmi-skywalker-lars"},{"id":"c-3po","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/815.webp"},{"id":"r2-d2"},{"id":"watto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/816.webp"},{"id":"quarsh-panaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/818.webp"},{"id":"sebulba","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/817.webp"}],"crawl":{"episode":"Episode I","title":"THE PHANTOM MENACE","text":["The Galactic Republic has stood for a thousand generations, but its Senate is slow and its grip on the outer worlds is slipping.","Angry at new taxes on the trade routes, the greedy Trade Federation has surrounded the peaceful planet of Naboo with a fleet of battleships, daring the Republic to stop them.","Hoping to end the crisis quietly, the Chancellor has sent two Jedi Knights to talk the Federation's leaders down...."]}},"7016653547efd124d432a19774bbdbc9":{"planets":["naboo","tatooine","coruscant"],"ships":["j-type-327-nubian-royal-starship","n-1-starfighter","anakin-skywalker-s-podracer","scimitar","lucrehulk-class-droid-control-ship","radiant-vii"],"chars":[{"id":"qui-gon-jinn"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/713.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/718.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/811.webp"},{"id":"jar-jar-binks"},{"id":"maul"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/731.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/805.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/813.webp"},{"id":"shmi-skywalker-lars"},{"id":"c-3po","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/815.webp"},{"id":"r2-d2"},{"id":"watto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/816.webp"},{"id":"quarsh-panaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/818.webp"},{"id":"sebulba","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/817.webp"}],"crawl":{"episode":"Episode I","title":"THE PHANTOM MENACE","text":["The Galactic Republic has stood for a thousand generations, but its Senate is slow and its grip on the outer worlds is slipping.","Angry at new taxes on the trade routes, the greedy Trade Federation has surrounded the peaceful planet of Naboo with a fleet of battleships, daring the Republic to stop them.","Hoping to end the crisis quietly, the Chancellor has sent two Jedi Knights to talk the Federation's leaders down...."]}},"61ca46dc3893eb0e00e6026472978ee6":{"planets":["naboo","tatooine","coruscant"],"ships":["j-type-327-nubian-royal-starship","n-1-starfighter","anakin-skywalker-s-podracer","scimitar","lucrehulk-class-droid-control-ship","radiant-vii"],"chars":[{"id":"qui-gon-jinn"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/713.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/718.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/811.webp"},{"id":"jar-jar-binks"},{"id":"maul"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/731.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/805.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/813.webp"},{"id":"shmi-skywalker-lars"},{"id":"c-3po","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/815.webp"},{"id":"r2-d2"},{"id":"watto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/816.webp"},{"id":"quarsh-panaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/818.webp"},{"id":"sebulba","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/817.webp"}],"crawl":{"episode":"Episode I","title":"THE PHANTOM MENACE","text":["The Galactic Republic has stood for a thousand generations, but its Senate is slow and its grip on the outer worlds is slipping.","Angry at new taxes on the trade routes, the greedy Trade Federation has surrounded the peaceful planet of Naboo with a fleet of battleships, daring the Republic to stop them.","Hoping to end the crisis quietly, the Chancellor has sent two Jedi Knights to talk the Federation's leaders down...."]}},"31ac269603eaf30a9e7692bc086e32cc":{"planets":["coruscant","naboo","kamino","tatooine","geonosis"],"ships":["slave-i","delta-7-aethersprite-class-light-interceptor","low-altitude-assault-transport-infantry","acclamator-i-class-assault-ship","punworcca-116-class-interstellar-sloop","j-type-star-skiff"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/874.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/812.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/714.webp"},{"id":"yoda"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/876.webp"},{"id":"dooku"},{"id":"jango-fett"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/729.webp"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/738.webp"},{"id":"jar-jar-binks","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/819.webp"},{"id":"shmi-skywalker-lars"},{"id":"c-3po"},{"id":"r2-d2"}],"crawl":{"episode":"Episode II","title":"ATTACK OF THE CLONES","text":["Ten years have passed since the Battle of Naboo. Thousands of star systems, led by the charismatic Count Dooku, are breaking away from the Republic.","With too few Jedi to keep the peace, the Senate argues over whether to build an army for the first time in a thousand years.","Senator Padmé Amidala, who has spoken against an army, is returning to Coruscant for the vote. Someone wants to make sure she never arrives...."]}},"1294572266a0e6ba0c2b8452d72b00ee":{"planets":["coruscant","naboo","kamino","tatooine","geonosis"],"ships":["slave-i","delta-7-aethersprite-class-light-interceptor","low-altitude-assault-transport-infantry","acclamator-i-class-assault-ship","punworcca-116-class-interstellar-sloop","j-type-star-skiff"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/874.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/812.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/714.webp"},{"id":"yoda"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/876.webp"},{"id":"dooku"},{"id":"jango-fett"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/729.webp"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/738.webp"},{"id":"jar-jar-binks","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/819.webp"},{"id":"shmi-skywalker-lars"},{"id":"c-3po"},{"id":"r2-d2"}],"crawl":{"episode":"Episode II","title":"ATTACK OF THE CLONES","text":["Ten years have passed since the Battle of Naboo. Thousands of star systems, led by the charismatic Count Dooku, are breaking away from the Republic.","With too few Jedi to keep the peace, the Senate argues over whether to build an army for the first time in a thousand years.","Senator Padmé Amidala, who has spoken against an army, is returning to Coruscant for the vote. Someone wants to make sure she never arrives...."]}},"4ac54cc28bb53c55567d6c4b3adac727":{"planets":["coruscant","naboo","kamino","tatooine","geonosis"],"ships":["slave-i","delta-7-aethersprite-class-light-interceptor","low-altitude-assault-transport-infantry","acclamator-i-class-assault-ship","punworcca-116-class-interstellar-sloop","j-type-star-skiff"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/874.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/812.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/714.webp"},{"id":"yoda"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/876.webp"},{"id":"dooku"},{"id":"jango-fett"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/729.webp"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/738.webp"},{"id":"jar-jar-binks","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/819.webp"},{"id":"shmi-skywalker-lars"},{"id":"c-3po"},{"id":"r2-d2"}],"crawl":{"episode":"Episode II","title":"ATTACK OF THE CLONES","text":["Ten years have passed since the Battle of Naboo. Thousands of star systems, led by the charismatic Count Dooku, are breaking away from the Republic.","With too few Jedi to keep the peace, the Senate argues over whether to build an army for the first time in a thousand years.","Senator Padmé Amidala, who has spoken against an army, is returning to Coruscant for the vote. Someone wants to make sure she never arrives...."]}},"12939c2faac58dcb8b6f9cae47d56ef1":{"planets":["coruscant","mandalore","utapau","kashyyyk","cato-neimoidia","mygeeto","saleucami","felucia","mustafar","polis-massa","alderaan","naboo","tatooine"],"ships":["invisible-hand","venator-class-star-destroyer","arc-170-starfighter","eta-2-actis-class-light-interceptor","tantive-iv","theta-class-t-2c-shuttle"],"chars":[{"id":"anakin-skywalker"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/715.webp"},{"id":"padme-amidala"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/798.webp"},{"id":"yoda"},{"id":"mace-windu"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/820.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/821.webp"},{"id":"bail-prestor-organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/822.webp"},{"id":"chewbacca"},{"id":"c-3po"},{"id":"r2-d2"}],"crawl":{"episode":"Episode III","title":"REVENGE OF THE SITH","text":["The Clone Wars have raged for three years across countless worlds, and the Jedi have become generals.","In a daring strike on the capital, the cyborg General Grievous has kidnapped Supreme Chancellor Palpatine from the heart of Coruscant.","As the Separatist flagship tries to escape the battle above the city, Obi-Wan Kenobi and Anakin Skywalker lead a desperate mission to bring the Chancellor home...."]}},"1f659b6dcc219d1e2d2bb8536187bfa7":{"planets":["coruscant","utapau","kashyyyk","cato-neimoidia","mygeeto","saleucami","felucia","mustafar","polis-massa","alderaan","naboo","tatooine"],"ships":["invisible-hand","venator-class-star-destroyer","arc-170-starfighter","eta-2-actis-class-light-interceptor","tantive-iv","theta-class-t-2c-shuttle"],"chars":[{"id":"anakin-skywalker"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/715.webp"},{"id":"padme-amidala"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/798.webp"},{"id":"yoda"},{"id":"mace-windu"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/820.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/821.webp"},{"id":"bail-prestor-organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/822.webp"},{"id":"chewbacca"},{"id":"c-3po"},{"id":"r2-d2"}],"crawl":{"episode":"Episode III","title":"REVENGE OF THE SITH","text":["The Clone Wars have raged for three years across countless worlds, and the Jedi have become generals.","In a daring strike on the capital, the cyborg General Grievous has kidnapped Supreme Chancellor Palpatine from the heart of Coruscant.","As the Separatist flagship tries to escape the battle above the city, Obi-Wan Kenobi and Anakin Skywalker lead a desperate mission to bring the Chancellor home...."]}},"74cb73a1efea7b071acd177f6201fe1a":{"planets":["coruscant","utapau","kashyyyk","cato-neimoidia","mygeeto","saleucami","felucia","mustafar","polis-massa","alderaan","naboo","tatooine"],"ships":["invisible-hand","venator-class-star-destroyer","arc-170-starfighter","eta-2-actis-class-light-interceptor","tantive-iv","theta-class-t-2c-shuttle"],"chars":[{"id":"anakin-skywalker"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/715.webp"},{"id":"padme-amidala"},{"id":"darth-sidious","as":"Chancellor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/798.webp"},{"id":"yoda"},{"id":"mace-windu"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/820.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/821.webp"},{"id":"bail-prestor-organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/822.webp"},{"id":"chewbacca"},{"id":"c-3po"},{"id":"r2-d2"}],"crawl":{"episode":"Episode III","title":"REVENGE OF THE SITH","text":["The Clone Wars have raged for three years across countless worlds, and the Jedi have become generals.","In a daring strike on the capital, the cyborg General Grievous has kidnapped Supreme Chancellor Palpatine from the heart of Coruscant.","As the Separatist flagship tries to escape the battle above the city, Obi-Wan Kenobi and Anakin Skywalker lead a desperate mission to bring the Chancellor home...."]}},"5991a8045a105b2af417e8e4a47b8a2c":{"planets":["jakku","takodana","d-qar","hosnian-prime","ilum","ahch-to"],"ships":["millennium-falcon","finalizer","black-one","upsilon-class-command-shuttle","tie-fo-space-superiority-fighter","eravana"],"chars":[{"id":"rey","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/849.webp"},{"id":"finn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/859.webp"},{"id":"poe-dameron","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/851.webp"},{"id":"ben-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/853.webp"},{"id":"han-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/792.webp"},{"id":"leia-skywalker-organa-solo"},{"id":"chewbacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/855.webp"},{"id":"bb-8"},{"id":"snoke","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/857.webp"},{"id":"armitage-hux","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/858.webp"},{"id":"phasma"},{"id":"maz-kanata"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/788.webp"}],"crawl":{"episode":"Episode VII","title":"THE FORCE AWAKENS","text":["Luke Skywalker has disappeared. In his absence, the First Order has risen from the ashes of the Empire, determined to hunt him down.","General Leia Organa leads a small Resistance against it, hoping to find her brother and bring him back.","She has sent her best pilot to the desert world of Jakku, where an old friend may hold a clue to where Luke has gone...."]}},"5e4e1f7cb893acd1865bab92a59845eb":{"planets":["lah-mu","wobani","jedha","eadu","mustafar","yavin-4","scarif"],"ships":["sw-0608","ut-60d-u-wing-starfighter-support-craft","ds-1-orbital-battle-station","profundity","lightmaker","all-terrain-armored-cargo-transport","tantive-iv"],"chars":[{"id":"jyn-erso"},{"id":"cassian-jeron-andor"},{"id":"k-2so"},{"id":"chirrut-imwe"},{"id":"baze-malbus"},{"id":"bodhi-rook"},{"id":"orson-callan-krennic"},{"id":"saw-gerrera"},{"id":"galen-walton-erso"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/825.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/722.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/707.webp"}]},"5eb3cd99b986f5c779c031b3c825c288":{"planets":["d-qar","ahch-to","cantonica","crait"],"ships":["raddus","supremacy","millennium-falcon","v-4x-d-ski-speeder","mg-100-starfortress-sf-17","tie-vn-space-superiority-fighter"],"chars":[{"id":"rey","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/850.webp"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/789.webp"},{"id":"ben-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/854.webp"},{"id":"finn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/860.webp"},{"id":"poe-dameron","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/852.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/791.webp"},{"id":"rose-tico","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/861.webp"},{"id":"amilyn-holdo"},{"id":"snoke"},{"id":"armitage-hux"},{"id":"chewbacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/856.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/807.webp"}],"crawl":{"episode":"Episode VIII","title":"THE LAST JEDI","text":["The First Order has struck back after the loss of Starkiller Base, and the Republic it destroyed cannot help.","Supreme Leader Snoke's fleet is closing in on the Resistance as it tries to escape its base on D'Qar.","Meanwhile, Rey has found Luke Skywalker on a distant island, and hopes he will return to fight for the galaxy...."]}},"0a16888797ee77d8d96605e9e43608da":{"planets":["corellia","mimban","vandor","kessel","savareen"],"ships":["millennium-falcon","first-light","20-t-railcrawler-conveyex-transport","all-terrain-heavy-hauler"],"chars":[{"id":"han-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/711.webp"},{"id":"chewbacca"},{"id":"qi-ra"},{"id":"tobias-beckett"},{"id":"lando-calrissian","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/726.webp"},{"id":"l3-37"},{"id":"dryden-vos"},{"id":"enfys-nest"},{"id":"maul"},{"id":"rio-durant","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/824.webp"}]},"67e4f6e42a548f875fdaeb4ce8795dbe":{"planets":["ajan-kloss","mustafar","pasaana","kijimi","kef-bir","exegol","tatooine"],"ships":["millennium-falcon","steadfast-resurgent-class","xyston-class-star-destroyer","kylo-ren-s-tie-whisper","tantive-iv"],"chars":[{"id":"rey"},{"id":"ben-solo"},{"id":"finn"},{"id":"poe-dameron"},{"id":"darth-sidious","as":"Emperor Palpatine","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/736.webp"},{"id":"leia-skywalker-organa-solo"},{"id":"chewbacca"},{"id":"lando-calrissian"},{"id":"c-3po"},{"id":"bb-8"},{"id":"zorii-bliss"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/790.webp"}],"crawl":{"episode":"Episode IX","title":"THE RISE OF SKYWALKER","text":["A strange voice is broadcasting across the galaxy, the voice of the long-dead Emperor Palpatine.","General Leia Organa sends her agents searching for the source, while Rey continues her Jedi training.","Supreme Leader Kylo Ren hunts for the Emperor too, determined to destroy anyone who could threaten his rule...."]}},"452e6a8d6554512a69fe8e81c2c0e475":{"planets":["tatooine","alderaan","daiyu","mapuzo","jabiim","mustafar","nur"],"ships":["scythe-phi-class","imperial-i-class-star-destroyer","lambda-class-t-4a-shuttle"],"chars":[{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/716.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/723.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/705.webp"},{"id":"reva-sevander"},{"id":"grand-inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/737.webp"},{"id":"fifth-brother","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/827.webp"},{"id":"tala-durith"},{"id":"bail-prestor-organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/823.webp"},{"id":"owen-lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/829.webp"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/700.webp"},{"id":"haja-estree","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/826.webp"},{"id":"kawlan-roken","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/830.webp"},{"id":"fourth-sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/828.webp"},{"id":"beru-whitesun-lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/800.webp"}]},"c2102f58ab290ca8116036b438d63186":{"planets":["arcana","corellia","seatos","lothal","dathomir","peridea"],"ships":["ghost","eye-of-sion","baylan-s-shuttle","chimaera"],"chars":[{"id":"ahsoka-tano"},{"id":"sabine-wren"},{"id":"hera-syndulla"},{"id":"ezra-bridger"},{"id":"mitth-raw-nuruodo"},{"id":"baylan-skoll"},{"id":"shin-hati"},{"id":"morgan-elsbeth"},{"id":"huyang"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/796.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/845.webp"},{"id":"marrok","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/877.webp"},{"id":"jacen-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/848.webp"},{"id":"carson-teva","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/846.webp"}]},"0997202e34f2a7a443d51655f87e831a":{"planets":["at-attin","borgo-prime","lanupa","observatory-moon","at-achrann"],"ships":["onyx-cinder","silvo-s-pirate-frigate","t-65-x-wing-starfighter"],"chars":[{"id":"wim"},{"id":"neel"},{"id":"fern"},{"id":"kb"},{"id":"sm-33"},{"id":"jod-na-nawood"},{"id":"brutus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/844.webp"},{"id":"fara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/842.webp"},{"id":"wendle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/843.webp"},{"id":"vane"}]},"9879c0154e2259fede91a0430ed02cdd":{"planets":["ueda","olega","carlac","brendok","khofar","coruscant","bal-demnic"],"ships":["polan-gx-8","jedi-vector","dte-csa-17-calaboose-prison-ship"],"chars":[{"id":"osha-aniseya"},{"id":"mae-ho-aniseya"},{"id":"sol"},{"id":"qimir"},{"id":"jecki-lon"},{"id":"yord-fandar"},{"id":"indara"},{"id":"vernestra-rwoh"},{"id":"bazil","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/862.webp"},{"id":"kelnacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/863.webp"},{"id":"torbin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/864.webp"},{"id":"aniseya","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/865.webp"},{"id":"koril","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/866.webp"}]},"1cd8ebdeb1ad37a05b78d3a0b548b80f":{"planets":["nal-hutta","nar-shaddaa","nevarro","adelphi","shakari","phostera"],"ships":["din-djarin-s-n-1-starfighter","guillotine-starship","carson-teva-s-x-wing"],"chars":[{"id":"din-djarin"},{"id":"grogu"},{"id":"ward","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/871.webp"},{"id":"rotta","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/872.webp"},{"id":"garazeb-orrelios"},{"id":"carson-teva","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/847.webp"},{"id":"embo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/873.webp"},{"id":"sash-ketter"}]},"f63c42afa8a2035810f52e5c69d843cf":{"planets":["janix","oba-diah"],"ships":["hex-kom-rk-class","imperial-i-class-star-destroyer","low-altitude-assault-transport-infantry"],"chars":[{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/831.webp"},{"id":"devon-izara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/832.webp"},{"id":"brander-lawson","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/833.webp"},{"id":"rylee-lawson","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/834.webp"},{"id":"eeko-dio-daki","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/835.webp"},{"id":"looti-vario","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/836.webp"},{"id":"2b0t","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/837.webp"},{"id":"rook-kast","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/838.webp"},{"id":"marrok","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/839.webp"},{"id":"eleventh-brother","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/841.webp"}]}},"seasons":{"4e25cef5f54d5f2f90b6cb71ddb75bd7":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 1","k":-21.85,"year":"22 BBY","planets":["christophsis","teth","rodia","maridun","ryloth","florrum","naboo","coruscant"],"ships":["twilight","malevolence","venator-class-star-destroyer","low-altitude-assault-transport-infantry","munificent-class-star-frigate","v-19-torrent-starfighter"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/545.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/546.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/547.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/548.webp"},{"id":"r2-d2"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/549.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/550.webp"},{"id":"plo-koon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/551.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/552.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/553.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/554.webp"},{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/555.webp"}]},"6e0df4672f75b925a4905bf0b228922b":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 2","k":-21.5,"year":"22–21 BBY","planets":["felucia","malastare","geonosis","saleucami","mandalore","concordia","coruscant"],"ships":["venator-class-star-destroyer","low-altitude-assault-transport-infantry","all-terrain-tactical-enforcer","acclamator-i-class-assault-ship","barc-speeder","coronet"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/545.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/546.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/547.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/548.webp"},{"id":"cody","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/556.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/552.webp"},{"id":"barriss-offee","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/663.webp"},{"id":"luminara-unduli","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/664.webp"},{"id":"ki-adi-mundi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/665.webp"},{"id":"poggle-the-lesser","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/666.webp"},{"id":"satine-kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/560.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/553.webp"}]},"07fb96c773baac8c6b1d5b49e8ff738a":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 3","k":-21.2,"year":"21 BBY","planets":["vanqor","florrum","mandalore","alderaan","kamino","raxus-secundus","dathomir","serenno"],"ships":["slave-i","endurance","xanadu-blood","coronet","venator-class-star-destroyer"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/561.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/562.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/563.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/564.webp"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/565.webp"},{"id":"cad-bane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/566.webp"},{"id":"aurra-sing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/667.webp"},{"id":"satine-kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/568.webp"},{"id":"lux-bonteri","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/569.webp"},{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/570.webp"},{"id":"savage-opress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/571.webp"},{"id":"talzin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/572.webp"}]},"75cb3ca6455917547bf43666b078e364":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 4","k":-20.8,"year":"21–20 BBY","planets":["mortis","lola-sayu","mon-cala","trandosha","wasskah","naboo","aleen"],"ships":["venator-class-star-destroyer","providence-class-dreadnought","trident-class-assault-ship","arc-170-starfighter","eta-class-shuttle"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/561.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/562.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/563.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/573.webp"},{"id":"father-mortis"},{"id":"daughter"},{"id":"son"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/574.webp"},{"id":"even-piell","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/668.webp"},{"id":"lee-char"},{"id":"kit-fisto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/575.webp"},{"id":"chewbacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/669.webp"}]},"ea9187faa6916d1c39f902449a3f2b08":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 5","k":-20.3,"year":"20 BBY","planets":["umbara","zygerria","kadavo","onderon","ilum","florrum","abafar","coruscant"],"ships":["crucible","venator-class-star-destroyer","clone-z-95-starfighter","gozanti-class-cruiser","all-terrain-reconnaissance-transport","btl-b-y-wing-starfighter-bomber"],"chars":[{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/563.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/561.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/562.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/573.webp"},{"id":"fives","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/576.webp"},{"id":"pong-krell"},{"id":"saw-gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/577.webp"},{"id":"steela-gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/578.webp"},{"id":"lux-bonteri","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/569.webp"},{"id":"cad-bane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/566.webp"},{"id":"hondo-ohnaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/579.webp"},{"id":"huyang","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/580.webp"},{"id":"r2-d2"}]},"6b0f9ba4587ba08e8f333f846fc81438":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Specials","k":-20.2,"year":"20 BBY","planets":["utapau","coruscant"],"ships":["gozanti-class-cruiser","venator-class-star-destroyer"],"chars":[{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/563.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/561.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/581.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/582.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/583.webp"},{"id":"kit-fisto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/575.webp"},{"id":"ki-adi-mundi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/879.webp"},{"id":"plo-koon"},{"id":"shaak-ti"},{"id":"tera-sinube"}]},"fef670a60f014adeedd5e22786b6c513":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 6","k":-19.6,"year":"19 BBY","planets":["dathomir","mandalore","florrum","zanbar","kamino","scipio","bardotta","coruscant"],"ships":["kom-rk-class-fighter-transport","taylander-shuttle","clone-z-95-starfighter","venator-class-star-destroyer","hh-87-starhopper"],"chars":[{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/584.webp"},{"id":"savage-opress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/571.webp"},{"id":"pre-vizsla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/585.webp"},{"id":"satine-kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/568.webp"},{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/570.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/562.webp"},{"id":"barriss-offee","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/586.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/561.webp"},{"id":"fives","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/576.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/587.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/583.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/582.webp"}]},"54035552db0925d5b46efbcb4b1bc0e6":{"series":"e958edd41f7be22b9028d11095ea714d","label":"Season 7","k":-19.1,"year":"19 BBY","planets":["dagobah","moraband","anaxes","skako-minor","coruscant","mandalore"],"ships":["marauder-omicron-class","venator-class-star-destroyer","all-terrain-tactical-enforcer","arc-170-starfighter","clone-z-95-starfighter"],"chars":[{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/881.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/589.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/590.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/591.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/592.webp"},{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/670.webp"},{"id":"bo-katan-kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/594.webp"},{"id":"trace-martez","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/595.webp"},{"id":"rafa-martez","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/596.webp"},{"id":"hunter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/597.webp"},{"id":"wrecker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/600.webp"},{"id":"tech"},{"id":"crosshair","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/601.webp"},{"id":"echo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/671.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/599.webp"}]},"bb228d91798b972898713c1e5156d05e":{"series":"049270492ac22f426375fe95deab7f36","label":"Season 1","k":-4.9,"year":"5 BBY","planets":["lothal","kessel","garel","stygeon-prime","mustafar"],"ships":["ghost","phantom","tie-ln-space-superiority-starfighter","imperial-i-class-star-destroyer","sentinel-class-landing-craft","all-terrain-defense-pod"],"chars":[{"id":"ezra-bridger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/602.webp"},{"id":"kanan-jarrus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/603.webp"},{"id":"hera-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/604.webp"},{"id":"sabine-wren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/605.webp"},{"id":"garazeb-orrelios","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/606.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/607.webp"},{"id":"grand-inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/608.webp"},{"id":"alexsandr-kallus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/609.webp"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/610.webp"},{"id":"lando-calrissian","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/672.webp"},{"id":"maketh-tua","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/611.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/612.webp"}]},"2880827e5009f28cb36367e005680d2a":{"series":"049270492ac22f426375fe95deab7f36","label":"Season 2","k":-3.5,"year":"4–3 BBY","planets":["lothal","garel","atollon","seelos","concord-dawn","lira-san","ryloth","malachor"],"ships":["ghost","phantom-ii","rz-1-a-wing-interceptor","tie-advanced-x1","arquitens-class-command-cruiser","sphyrna-class-hammerhead-corvette","blade-wing"],"chars":[{"id":"ezra-bridger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/602.webp"},{"id":"kanan-jarrus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/603.webp"},{"id":"hera-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/604.webp"},{"id":"sabine-wren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/605.webp"},{"id":"garazeb-orrelios","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/606.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/607.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/612.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/613.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/673.webp"},{"id":"fifth-brother"},{"id":"seventh-sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/614.webp"},{"id":"alexsandr-kallus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/609.webp"},{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/674.webp"}]},"c68ffb4b92d5e5d3f1051296c82dbd1a":{"series":"049270492ac22f426375fe95deab7f36","label":"Season 3","k":-2,"year":"3–2 BBY","planets":["atollon","lothal","tatooine","krownest","geonosis","dathomir","ryloth","mykapo"],"ships":["ghost","chimaera","phantom-ii","rz-1-a-wing-interceptor","btl-y-wing-starfighter","tie-d-defender-multi-role-starfighter"],"chars":[{"id":"ezra-bridger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/675.webp"},{"id":"kanan-jarrus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/616.webp"},{"id":"hera-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/617.webp"},{"id":"sabine-wren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/618.webp"},{"id":"garazeb-orrelios","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/619.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/620.webp"},{"id":"mitth-raw-nuruodo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/621.webp"},{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/676.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/677.webp"},{"id":"bendu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/622.webp"},{"id":"alexsandr-kallus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/623.webp"},{"id":"arihnda-pryce","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/624.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/625.webp"}]},"7e2cc7d306ced34a2f7711d24b79526a":{"series":"049270492ac22f426375fe95deab7f36","label":"Season 4","k":-0.9,"year":"1 BBY","planets":["lothal","mandalore","yavin-4","malachor","lira-san"],"ships":["ghost","chimaera","tie-d-defender-multi-role-starfighter","btl-y-wing-starfighter","614-ava-speeder-bike","imperial-i-class-star-destroyer"],"chars":[{"id":"ezra-bridger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/675.webp"},{"id":"kanan-jarrus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/616.webp"},{"id":"hera-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/617.webp"},{"id":"sabine-wren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/618.webp"},{"id":"garazeb-orrelios","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/619.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/620.webp"},{"id":"mitth-raw-nuruodo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/621.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/626.webp"},{"id":"rukh","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/627.webp"},{"id":"arihnda-pryce","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/624.webp"},{"id":"alexsandr-kallus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/623.webp"},{"id":"mon-mothma","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/678.webp"}]},"d93a7a594158c0931b12ea1530c191e8":{"series":"f5cab3dbec95f7d23748bf1cabd79bd9","label":"Season 1","k":-5,"year":"5–1 BBY","planets":["kenari","ferrix","aldhani","narkina-5","coruscant","chandrila","ghorman","mina-rau","yavin-4"],"ships":["luthen-rael-s-fondor-haulcraft","tie-avenger-prototype","t-65b-x-wing-starfighter","btl-y-wing-starfighter","lambda-class-t-4a-shuttle","imperial-i-class-star-destroyer"],"chars":[{"id":"cassian-jeron-andor"},{"id":"luthen-rael"},{"id":"mon-mothma"},{"id":"dedra-meero"},{"id":"syril-karn"},{"id":"bix-caleen"},{"id":"kleya-marki"},{"id":"vel-sartha"},{"id":"b2emo"},{"id":"k-2so"},{"id":"saw-gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/696.webp"},{"id":"orson-callan-krennic"}]},"4fb29d37529eaffad6ea7739abb699c4":{"series":"22ac508176d3562ab31021ea6183a126","label":"Season 1","k":-18.9,"year":"19–18 BBY","planets":["kamino","ord-mantell","pabu","wayland","ryloth","bracca","coruscant"],"ships":["marauder-omicron-class","alpha-3-nimbus-class-v-wing-starfighter","venator-class-star-destroyer","imperial-i-class-star-destroyer","rho-class-transport-shuttle"],"chars":[{"id":"omega","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/628.webp"},{"id":"hunter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/629.webp"},{"id":"wrecker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/630.webp"},{"id":"tech"},{"id":"echo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/631.webp"},{"id":"crosshair","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/632.webp"},{"id":"ciddarin-scaleback","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/633.webp"},{"id":"royce-hemlock","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/634.webp"},{"id":"nala-se","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/635.webp"},{"id":"edmon-rampart","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/636.webp"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/637.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/638.webp"}]},"38c0ebf13c6a5b1a1ab0e5a3e37f20e2":{"series":"624b3b264ad9458ab12baea9a5becd58","label":"Season 1","k":9,"year":"9 ABY","planets":["arvala-7","nevarro","sorgan","tatooine","trask","corvus","mandalore","concordia","adelphi"],"ships":["razor-crest","din-djarin-s-n-1-starfighter","slave-i","gideon-s-light-cruiser","bo-katan-kryze-s-gauntlet-starfighter","carson-teva-s-x-wing"],"chars":[{"id":"din-djarin"},{"id":"grogu"},{"id":"boba-fett"},{"id":"fennec-shand"},{"id":"greef-karga"},{"id":"bo-katan-kryze"},{"id":"gideon"},{"id":"carasynthia-dune"},{"id":"the-armorer"},{"id":"kuiil"},{"id":"ig-11"},{"id":"ahsoka-tano"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/695.webp"}]},"59638c493a4322f38e12517359a66821":{"series":"913ec0612bdcacc02f7fb559e1b0b23a","label":"Season 1","k":-18.95,"year":"19–9 BBY","planets":["dathomir","corvus","mustafar","nur","coruscant"],"ships":["scythe-phi-class","imperial-i-class-star-destroyer"],"chars":[{"id":"morgan-elsbeth","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/639.webp"},{"id":"barriss-offee","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/640.webp"},{"id":"fourth-sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/641.webp"},{"id":"grand-inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/642.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/643.webp"},{"id":"mitth-raw-nuruodo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/644.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/679.webp"},{"id":"gilad-pellaeon"},{"id":"eleventh-brother"}]},"ec1e758cfde0aa28d794bec4cdc09f02":{"series":"92de455435d7c5619ae78be6acaa72aa","label":"Season 1","k":-68,"year":"68–18 BBY","planets":["shili","coruscant","raxus-secundus","naboo"],"ships":["t-6-shuttle","venator-class-star-destroyer"],"chars":[{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/645.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/646.webp"},{"id":"qui-gon-jinn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/680.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/647.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/648.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/649.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/650.webp"},{"id":"plo-koon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/651.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/652.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/653.webp"},{"id":"jocasta-nu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/681.webp"},{"id":"yaddle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/682.webp"}]},"1f8f9311e18c0eee0cf7f3892dca266f":{"series":"4edb7a174729645122d6e4b273cfdf20","label":"Season 1","k":-20,"year":"20–19 BBY","planets":["duro","dathomir"],"ships":["undicur-class-jumpspeeder","flitknot-speeder-bike"],"chars":[{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/654.webp"},{"id":"lyco-strata","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/655.webp"},{"id":"quinlan-vos","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/656.webp"},{"id":"cad-bane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/657.webp"},{"id":"talzin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/658.webp"},{"id":"tay-grutty"},{"id":"niro"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/880.webp"},{"id":"c-21-highsinger"},{"id":"latts-razzi"}]},"3442428289e0d7376b94f9d91b5ec67c":{"series":"0782cdab66355d25e7c6d0ba7837c3b2","label":"Season 1","k":-21.9,"year":"22–19 BBY","planets":["muunilinst","dantooine","ilum","yavin-4","mon-cala","hypori","nelvaan","coruscant"],"ships":["delta-7-aethersprite-class-light-interceptor","eta-2-actis-class-light-interceptor","v-19-torrent-starfighter","low-altitude-assault-transport-infantry","acclamator-i-class-assault-ship","ginivex-class-starfighter"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/683.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/684.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/685.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/686.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/687.webp"},{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/688.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/689.webp"},{"id":"durge","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/690.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/691.webp"},{"id":"shaak-ti","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/692.webp"},{"id":"kit-fisto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/693.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/694.webp"}]}},"tmdbFilms":{"11":"8d7d8273479c759b262f22846ee9ecb1","1891":"87d40bf3a66a5d8092342cd243ad9a62","1892":"996a9da88ba79e9c5d1f4afc2adc718f","1893":"d9111d44298e583aff033f5687d64d83","1894":"31ac269603eaf30a9e7692bc086e32cc","1895":"1f659b6dcc219d1e2d2bb8536187bfa7","74849":"7e4b2a21577e5fd2d80361b9d53fee1c","140607":"5991a8045a105b2af417e8e4a47b8a2c","181808":"5eb3cd99b986f5c779c031b3c825c288","181812":"67e4f6e42a548f875fdaeb4ce8795dbe","330459":"5e4e1f7cb893acd1865bab92a59845eb","348350":"0a16888797ee77d8d96605e9e43608da","1228710":"1cd8ebdeb1ad37a05b78d3a0b548b80f"},"timeline":{"11":{"k":0,"year":"0 BBY"},"1891":{"k":3,"year":"3 ABY"},"1892":{"k":4,"year":"4 ABY"},"1893":{"k":-31.99,"year":"32 BBY"},"1894":{"k":-21.99,"year":"22 BBY"},"1895":{"k":-18.99,"year":"19 BBY"},"3122":{"k":-21.9,"year":"22–19 BBY","series":true},"4194":{"k":-21.8,"year":"22–19 BBY","series":true},"60554":{"k":-4.9,"year":"5–0 BBY","series":true},"82856":{"k":9,"year":"9 ABY","series":true},"83867":{"k":-5,"year":"5–1 BBY","series":true},"92830":{"k":-9,"year":"9 BBY","series":true},"105971":{"k":-18.9,"year":"19–18 BBY","series":true},"114461":{"k":11,"year":"11 ABY","series":true},"114479":{"k":-132,"year":"132 BBY","series":true},"115036":{"k":9,"year":"9 ABY","series":true},"140607":{"k":34,"year":"34 ABY"},"181808":{"k":34.1,"year":"34 ABY"},"181812":{"k":35,"year":"35 ABY"},"202879":{"k":9.2,"year":"9 ABY","series":true},"203085":{"k":-68,"year":"68–18 BBY","series":true},"251091":{"k":-18.95,"year":"19–9 BBY","series":true},"288055":{"k":-20,"year":"20–19 BBY","series":true},"330459":{"k":-0.1,"year":"0 BBY"},"348350":{"k":-13,"year":"13–10 BBY"},"1228710":{"k":10,"year":"10 ABY"}},"shows":{"3122":{"series":"0782cdab66355d25e7c6d0ba7837c3b2","k":-21.9,"year":"22–19 BBY","planets":["muunilinst","dantooine","ilum","yavin-4","mon-cala","hypori","nelvaan","coruscant"],"ships":["delta-7-aethersprite-class-light-interceptor","eta-2-actis-class-light-interceptor","v-19-torrent-starfighter","low-altitude-assault-transport-infantry","acclamator-i-class-assault-ship","ginivex-class-starfighter"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/683.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/684.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/685.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/686.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/687.webp"},{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/688.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/689.webp"},{"id":"durge","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/690.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/691.webp"},{"id":"shaak-ti","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/692.webp"},{"id":"kit-fisto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/693.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/694.webp"}]},"4194":{"series":"e958edd41f7be22b9028d11095ea714d","k":-21.8,"year":"22–19 BBY","planets":["christophsis","teth","rodia","maridun","ryloth","florrum","naboo","coruscant","felucia","malastare","geonosis","saleucami","mandalore","concordia","vanqor","alderaan","kamino","raxus-secundus","dathomir","serenno","mortis","lola-sayu","mon-cala","trandosha","wasskah","aleen","umbara","zygerria","kadavo","onderon","ilum","abafar","utapau","zanbar","scipio","bardotta","dagobah","moraband","anaxes","skako-minor"],"ships":["twilight","malevolence","venator-class-star-destroyer","low-altitude-assault-transport-infantry","munificent-class-star-frigate","v-19-torrent-starfighter","all-terrain-tactical-enforcer","acclamator-i-class-assault-ship","barc-speeder","coronet","slave-i","endurance","xanadu-blood","providence-class-dreadnought","trident-class-assault-ship","arc-170-starfighter","eta-class-shuttle","crucible","clone-z-95-starfighter","gozanti-class-cruiser","all-terrain-reconnaissance-transport","btl-b-y-wing-starfighter-bomber","kom-rk-class-fighter-transport","taylander-shuttle","hh-87-starhopper","marauder-omicron-class"],"chars":[{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/545.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/546.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/547.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/548.webp"},{"id":"r2-d2"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/549.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/550.webp"},{"id":"plo-koon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/551.webp"},{"id":"padme-amidala","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/552.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/553.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/554.webp"},{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/555.webp"},{"id":"cody","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/556.webp"},{"id":"barriss-offee","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/663.webp"},{"id":"luminara-unduli","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/664.webp"},{"id":"ki-adi-mundi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/665.webp"},{"id":"poggle-the-lesser","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/666.webp"},{"id":"satine-kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/560.webp"},{"id":"boba-fett","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/565.webp"},{"id":"cad-bane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/566.webp"},{"id":"aurra-sing","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/667.webp"},{"id":"lux-bonteri","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/569.webp"},{"id":"savage-opress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/571.webp"},{"id":"talzin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/572.webp"},{"id":"father-mortis"},{"id":"daughter"},{"id":"son"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/574.webp"},{"id":"even-piell","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/668.webp"},{"id":"lee-char"},{"id":"kit-fisto","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/575.webp"},{"id":"chewbacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/669.webp"},{"id":"fives","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/576.webp"},{"id":"pong-krell"},{"id":"saw-gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/577.webp"},{"id":"steela-gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/578.webp"},{"id":"hondo-ohnaka","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/579.webp"},{"id":"huyang","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/580.webp"},{"id":"shaak-ti"},{"id":"tera-sinube"},{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/584.webp"},{"id":"pre-vizsla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/585.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/587.webp"},{"id":"bo-katan-kryze","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/594.webp"},{"id":"trace-martez","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/595.webp"},{"id":"rafa-martez","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/596.webp"},{"id":"hunter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/597.webp"},{"id":"wrecker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/600.webp"},{"id":"tech"},{"id":"crosshair","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/601.webp"},{"id":"echo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/671.webp"}]},"60554":{"series":"049270492ac22f426375fe95deab7f36","k":-4.9,"year":"5–0 BBY","planets":["lothal","kessel","garel","stygeon-prime","mustafar","atollon","seelos","concord-dawn","lira-san","ryloth","malachor","tatooine","krownest","geonosis","dathomir","mykapo","mandalore","yavin-4"],"ships":["ghost","phantom","tie-ln-space-superiority-starfighter","imperial-i-class-star-destroyer","sentinel-class-landing-craft","all-terrain-defense-pod","phantom-ii","rz-1-a-wing-interceptor","tie-advanced-x1","arquitens-class-command-cruiser","sphyrna-class-hammerhead-corvette","blade-wing","chimaera","btl-y-wing-starfighter","tie-d-defender-multi-role-starfighter","614-ava-speeder-bike"],"chars":[{"id":"ezra-bridger","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/602.webp"},{"id":"kanan-jarrus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/603.webp"},{"id":"hera-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/604.webp"},{"id":"sabine-wren","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/605.webp"},{"id":"garazeb-orrelios","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/606.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/607.webp"},{"id":"grand-inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/608.webp"},{"id":"alexsandr-kallus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/609.webp"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/610.webp"},{"id":"lando-calrissian","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/672.webp"},{"id":"maketh-tua","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/611.webp"},{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/612.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/613.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/673.webp"},{"id":"fifth-brother"},{"id":"seventh-sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/614.webp"},{"id":"maul","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/674.webp"},{"id":"mitth-raw-nuruodo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/621.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/677.webp"},{"id":"bendu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/622.webp"},{"id":"arihnda-pryce","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/624.webp"},{"id":"rukh","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/627.webp"},{"id":"mon-mothma","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/678.webp"}]},"82856":{"series":"624b3b264ad9458ab12baea9a5becd58","k":9,"year":"9 ABY","planets":["arvala-7","nevarro","sorgan","tatooine","trask","corvus","mandalore","concordia","adelphi"],"ships":["razor-crest","din-djarin-s-n-1-starfighter","slave-i","gideon-s-light-cruiser","bo-katan-kryze-s-gauntlet-starfighter","carson-teva-s-x-wing"],"chars":[{"id":"din-djarin"},{"id":"grogu"},{"id":"boba-fett"},{"id":"fennec-shand"},{"id":"greef-karga"},{"id":"bo-katan-kryze"},{"id":"gideon"},{"id":"carasynthia-dune"},{"id":"the-armorer"},{"id":"kuiil"},{"id":"ig-11"},{"id":"ahsoka-tano"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/695.webp"}]},"83867":{"series":"f5cab3dbec95f7d23748bf1cabd79bd9","k":-5,"year":"5–1 BBY","planets":["kenari","ferrix","aldhani","narkina-5","coruscant","chandrila","ghorman","mina-rau","yavin-4"],"ships":["luthen-rael-s-fondor-haulcraft","tie-avenger-prototype","t-65b-x-wing-starfighter","btl-y-wing-starfighter","lambda-class-t-4a-shuttle","imperial-i-class-star-destroyer"],"chars":[{"id":"cassian-jeron-andor"},{"id":"luthen-rael"},{"id":"mon-mothma"},{"id":"dedra-meero"},{"id":"syril-karn"},{"id":"bix-caleen"},{"id":"kleya-marki"},{"id":"vel-sartha"},{"id":"b2emo"},{"id":"k-2so"},{"id":"saw-gerrera","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/696.webp"},{"id":"orson-callan-krennic"}]},"92830":{"series":null,"k":-9,"year":"9 BBY","planets":["tatooine","alderaan","daiyu","mapuzo","jabiim","mustafar","nur"],"ships":["scythe-phi-class","imperial-i-class-star-destroyer","lambda-class-t-4a-shuttle"],"chars":[{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/716.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/723.webp"},{"id":"leia-skywalker-organa-solo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/705.webp"},{"id":"reva-sevander"},{"id":"grand-inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/737.webp"},{"id":"fifth-brother","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/827.webp"},{"id":"tala-durith"},{"id":"bail-prestor-organa","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/823.webp"},{"id":"owen-lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/829.webp"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/700.webp"},{"id":"haja-estree","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/826.webp"},{"id":"kawlan-roken","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/830.webp"},{"id":"fourth-sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/828.webp"},{"id":"beru-whitesun-lars","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/800.webp"}]},"105971":{"series":"22ac508176d3562ab31021ea6183a126","k":-18.9,"year":"19–18 BBY","planets":["kamino","ord-mantell","pabu","wayland","ryloth","bracca","coruscant"],"ships":["marauder-omicron-class","alpha-3-nimbus-class-v-wing-starfighter","venator-class-star-destroyer","imperial-i-class-star-destroyer","rho-class-transport-shuttle"],"chars":[{"id":"omega","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/628.webp"},{"id":"hunter","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/629.webp"},{"id":"wrecker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/630.webp"},{"id":"tech"},{"id":"echo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/631.webp"},{"id":"crosshair","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/632.webp"},{"id":"ciddarin-scaleback","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/633.webp"},{"id":"royce-hemlock","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/634.webp"},{"id":"nala-se","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/635.webp"},{"id":"edmon-rampart","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/636.webp"},{"id":"wilhuff-tarkin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/637.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/638.webp"}]},"114461":{"series":null,"k":11,"year":"11 ABY","planets":["arcana","corellia","seatos","lothal","dathomir","peridea"],"ships":["ghost","eye-of-sion","baylan-s-shuttle","chimaera"],"chars":[{"id":"ahsoka-tano"},{"id":"sabine-wren"},{"id":"hera-syndulla"},{"id":"ezra-bridger"},{"id":"mitth-raw-nuruodo"},{"id":"baylan-skoll"},{"id":"shin-hati"},{"id":"morgan-elsbeth"},{"id":"huyang"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/796.webp"},{"id":"c1-10p","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/845.webp"},{"id":"marrok","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/877.webp"},{"id":"jacen-syndulla","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/848.webp"},{"id":"carson-teva","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/846.webp"}]},"114479":{"series":null,"k":-132,"year":"132 BBY","planets":["ueda","olega","carlac","brendok","khofar","coruscant","bal-demnic"],"ships":["polan-gx-8","jedi-vector","dte-csa-17-calaboose-prison-ship"],"chars":[{"id":"osha-aniseya"},{"id":"mae-ho-aniseya"},{"id":"sol"},{"id":"qimir"},{"id":"jecki-lon"},{"id":"yord-fandar"},{"id":"indara"},{"id":"vernestra-rwoh"},{"id":"bazil","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/862.webp"},{"id":"kelnacca","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/863.webp"},{"id":"torbin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/864.webp"},{"id":"aniseya","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/865.webp"},{"id":"koril","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/866.webp"}]},"115036":{"series":"624b3b264ad9458ab12baea9a5becd58","k":9,"year":"9 ABY","planets":["arvala-7","nevarro","sorgan","tatooine","trask","corvus","mandalore","concordia","adelphi"],"ships":["razor-crest","din-djarin-s-n-1-starfighter","slave-i","gideon-s-light-cruiser","bo-katan-kryze-s-gauntlet-starfighter","carson-teva-s-x-wing"],"chars":[{"id":"din-djarin"},{"id":"grogu"},{"id":"boba-fett"},{"id":"fennec-shand"},{"id":"greef-karga"},{"id":"bo-katan-kryze"},{"id":"gideon"},{"id":"carasynthia-dune"},{"id":"the-armorer"},{"id":"kuiil"},{"id":"ig-11"},{"id":"ahsoka-tano"},{"id":"luke-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/695.webp"}]},"202879":{"series":null,"k":9.2,"year":"9 ABY","planets":["at-attin","borgo-prime","lanupa","observatory-moon","at-achrann"],"ships":["onyx-cinder","silvo-s-pirate-frigate","t-65-x-wing-starfighter"],"chars":[{"id":"wim"},{"id":"neel"},{"id":"fern"},{"id":"kb"},{"id":"sm-33"},{"id":"jod-na-nawood"},{"id":"brutus","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/844.webp"},{"id":"fara","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/842.webp"},{"id":"wendle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/843.webp"},{"id":"vane"}]},"203085":{"series":"92de455435d7c5619ae78be6acaa72aa","k":-68,"year":"68–18 BBY","planets":["shili","coruscant","raxus-secundus","naboo"],"ships":["t-6-shuttle","venator-class-star-destroyer"],"chars":[{"id":"ahsoka-tano","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/645.webp"},{"id":"dooku","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/646.webp"},{"id":"qui-gon-jinn","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/680.webp"},{"id":"anakin-skywalker","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/647.webp"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/648.webp"},{"id":"yoda","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/649.webp"},{"id":"mace-windu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/650.webp"},{"id":"plo-koon","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/651.webp"},{"id":"darth-sidious","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/652.webp"},{"id":"rex","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/653.webp"},{"id":"jocasta-nu","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/681.webp"},{"id":"yaddle","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/682.webp"}]},"251091":{"series":"913ec0612bdcacc02f7fb559e1b0b23a","k":-18.95,"year":"19–9 BBY","planets":["dathomir","corvus","mustafar","nur","coruscant"],"ships":["scythe-phi-class","imperial-i-class-star-destroyer"],"chars":[{"id":"morgan-elsbeth","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/639.webp"},{"id":"barriss-offee","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/640.webp"},{"id":"fourth-sister","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/641.webp"},{"id":"grand-inquisitor","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/642.webp"},{"id":"grievous","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/643.webp"},{"id":"mitth-raw-nuruodo","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/644.webp"},{"id":"anakin-skywalker","as":"Darth Vader","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/679.webp"},{"id":"gilad-pellaeon"},{"id":"eleventh-brother"}]},"288055":{"series":"4edb7a174729645122d6e4b273cfdf20","k":-20,"year":"20–19 BBY","planets":["duro","dathomir"],"ships":["undicur-class-jumpspeeder","flitknot-speeder-bike"],"chars":[{"id":"asajj-ventress","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/654.webp"},{"id":"lyco-strata","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/655.webp"},{"id":"quinlan-vos","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/656.webp"},{"id":"cad-bane","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/657.webp"},{"id":"talzin","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/658.webp"},{"id":"tay-grutty"},{"id":"niro"},{"id":"obi-wan-kenobi","image":"https://raw.githubusercontent.com/CHAD2BAD/IvanaFin-Android/main/extras/star-wars/880.webp"},{"id":"c-21-highsinger"},{"id":"latts-razzi"}]}}};

} catch (e) { console.error('IvanaFin script sw-planets failed:', e); } })();
/* IvanaFin - sw-timeline */
(function() { try {
// IvanaFin (Samsung app AND Jellyfin web): Star Wars library - "Sort: Release date / Star Wars timeline".
// A title's in-universe place: its hidden provider ids SwTimeline (sort key in years, BBY negative) and
// SwYear (label, "32 BBY"), else - on any server - the bundled timeline by TMDB id (sw-card.js IvfSw.place).
// A library gets the button when it is mostly Star Wars (like Android: 3+ titles and 75%+ of a random 60).
// Timeline order: titles by SwTimeline, the year under each poster becomes the in-universe year; titles
// without one (documentaries, Holiday Special, Visions) follow at the end in release order.
// The choice is remembered on this TV / browser. Android IvanaFin has the same button.
(function () {
  'use strict';
  var TV = (typeof tizen !== 'undefined' || !!window.PalmSystem);
  var KEY = 'ivf-sw-sort';
  var STYLE_ID = 'ivf-swt-style';
  var libs = {}; // library id -> Promise of { itemId: { key, label } } (null: not a Star Wars library)
  var libId = null, data = null;

  function mode() { try { return localStorage.getItem(KEY) === 'timeline' ? 'timeline' : 'release'; } catch (e) { return 'release'; } }
  function setMode(m) { try { localStorage.setItem(KEY, m); } catch (e) {} }

  function addStyle() {
    if (document.getElementById(STYLE_ID)) return;
    var d = TV ? 'var(--ivf-dp)' : '(var(--ivf-dp) * 0.72)';
    function u(n) { return 'calc(' + d + ' * ' + n + ')'; }
    var s = document.createElement('style');
    s.id = STYLE_ID;
    s.textContent = [
      // TV: above the posters on the right. Web: in the middle of Jellyfin's top bar (no row of its own,
      // so the posters start right under the bar); placeInHeader() keeps it centred on the bar.
      TV ? '.ivf-swt-bar{display:flex;justify-content:flex-end;padding:0 ' + u(16) + ' ' + u(12) + ' ' + u(32) + '}'
        // web: inside Jellyfin's top bar (it scrolls away with the bar), vertically centred on the
        // bar's own back/menu and right-hand buttons (placeInHeader measures them)
        : '.ivf-swt-bar{position:absolute;left:50%;top:var(--ivf-swt-top,50%);transform:translate(-50%,-50%);z-index:5;display:flex}' +
          // slimmer pill so it fits inside the bar
          '.ivf-swt-bar .ivf-swt-btn{min-height:' + u(26) + ';padding:' + u(3) + ' ' + u(12) + ';font-size:' + u(12) + ';line-height:' + u(16) + '}' +
          '.ivf-swt-bar .ivf-swt-btn .material-icons{font-size:' + u(16) + '}',
      // same pill as the home Search / Settings buttons (Android HomeTopButton)
      '.ivf-swt-btn{display:inline-flex;align-items:center;gap:' + u(6) + ';min-height:' + u(40) + ';box-sizing:border-box;padding:' + u(6) + ' ' + u(14) + ';',
      'border:0;border-radius:999px;background:rgba(14,14,14,.9);color:#d1d5db;font:inherit;font-size:' + u(14) + ';font-weight:500;line-height:' + u(20) + ';',
      'letter-spacing:' + u(0.1) + ';cursor:pointer;outline:none}',
      '.ivf-swt-btn .material-icons{font-size:' + u(20) + ';color:inherit}',
      '.ivf-swt-btn:focus,.ivf-swt-btn:hover{background:#d1d5db;color:#131414}',
      TV ? '' : '.ivf-swt-btn:focus:not(:focus-visible):not(:hover){background:rgba(14,14,14,.9);color:#d1d5db}'
    ].join('');
    document.head.appendChild(s);
  }

  function hashLib() {
    var m = /[?&](?:parentId|topParentId)=([0-9a-f]{32})/i.exec(location.hash || '');
    return m ? m[1].toLowerCase() : null;
  }
  // Is this library mostly Star Wars? Then every title's place, read once per library
  function load(id) {
    if (libs[id]) return libs[id];
    var uid = ApiClient.getCurrentUserId(), sw = window.IvfSw;
    if (!sw) return Promise.resolve(null);
    function items(q) {
      return ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid + '/Items', Object.assign({ ParentId: id, Recursive: true, IncludeItemTypes: 'Movie,Series', Fields: 'ProviderIds', EnableImages: false, EnableUserData: false }, q)))
        .then(function (r) { return (r && r.Items) || []; });
    }
    libs[id] = items({ SortBy: 'Random', Limit: 60 }).then(function (sample) {
      var n = sample.filter(function (x) { return sw.place(x); }).length;
      if (n < 3 || n < sample.length * 0.75) return null;
      return items({}).then(function (all) {
        var map = {};
        all.forEach(function (it) { var pl = sw.place(it); if (pl) map[it.Id] = { key: pl.k, label: pl.year }; });
        return map;
      });
    })['catch'](function () { delete libs[id]; return null; });
    return libs[id];
  }

  function onStarWarsPage() { return !!(libId && data && hashLib() === libId); }

  function apply(page) {
    var grid = page.querySelector('.itemsContainer.vertical-wrap') || page.querySelector('.itemsContainer');
    if (!grid || !data) return;
    var list = grid.children;
    if (!list.length) return;
    // nothing changed since the last run (same cards, same order choice, button there): skip - this ran
    // on every page change and was among the slowest things on the Samsung TV
    var tlNow = mode() === 'timeline';
    if (apply._grid === grid && apply._first === list[0] && apply._last === list[list.length - 1] &&
        apply._n === list.length && apply._tl === tlNow && page.querySelector('.ivf-swt-bar')) {
      if (!TV) placeInHeader(page.querySelector('.ivf-swt-bar'));
      return;
    }
    var cards = Array.prototype.slice.call(grid.querySelectorAll(':scope > .card[data-id]'));
    if (!cards.length) return;
    // remember Jellyfin's own (release) order and year text once per card
    cards.forEach(function (c, i) {
      if (c._ivfIndex == null) c._ivfIndex = i;
      var y = c.querySelector('.cardText-secondary, .cardText:not(.cardText-first)');
      if (y && c._ivfYear == null) c._ivfYear = y.textContent;
    });
    var tl = mode() === 'timeline';
    var sorted = cards.slice().sort(function (a, b) {
      if (!tl) return a._ivfIndex - b._ivfIndex;
      var da = data[a.getAttribute('data-id')], db = data[b.getAttribute('data-id')];
      if (da && db) return da.key - db.key;
      if (da) return -1;
      if (db) return 1;
      return a._ivfIndex - b._ivfIndex; // extras: release order, at the end
    });
    var changed = sorted.some(function (c, i) { return cards[i] !== c; });
    // moving a card drops its focus: put it back after the re-sort
    var had = document.activeElement;
    if (changed) sorted.forEach(function (c) { grid.appendChild(c); });
    if (had && had !== document.activeElement && grid.contains(had)) {
      // Jellyfin's own first selection (its first card, release order) means "start of the grid":
      // that's our first card now. Anything else (e.g. the poster you came Back to) stays selected.
      (had === cards[0] && changed ? sorted[0] : had).focus({ preventScroll: true });
    }
    // TV: arriving with nothing selected (Jellyfin's own first selection was lost in the re-sort), so
    // select the first poster - the remote needs something selected
    if (TV && (!document.activeElement || document.activeElement === document.body) && sorted[0]) {
      setTimeout(function () {
        if (document.activeElement === document.body && document.contains(sorted[0])) sorted[0].focus({ preventScroll: true });
      }, 200);
    }
    sorted.forEach(function (c) {
      var y = c.querySelector('.cardText-secondary, .cardText:not(.cardText-first)');
      if (!y) return;
      var d = data[c.getAttribute('data-id')];
      // timeline: titles outside the story (extras) show no year; a no-break space keeps the row height
      var want = tl ? (d && d.label ? d.label : ' ') : c._ivfYear;
      if (want != null && y.textContent !== want) y.textContent = want;
    });
    // the Sort pill above the grid
    var bar = TV ? page.querySelector('.ivf-swt-bar') : document.querySelector('.ivf-swt-bar');
    if (!bar) {
      addStyle();
      bar = document.createElement('div');
      bar.className = 'ivf-swt-bar';
      bar.innerHTML = '<button type="button" class="ivf-swt-btn emby-button"><span class="material-icons" aria-hidden="true">sort</span><span class="ivf-swt-lbl"></span></button>';
      grid.parentNode.insertBefore(bar, grid);
      bar.querySelector('button').addEventListener('click', function () {
        setMode(mode() === 'timeline' ? 'release' : 'timeline');
        apply(TV ? page : (document.querySelector('.page.libraryPage:not(.hide)') || page));
      });
    }
    bar.querySelector('.ivf-swt-lbl').textContent = 'Order: ' + (tl ? 'Star Wars timeline' : 'Release date');
    if (!TV) placeInHeader(bar);
    apply._grid = grid; apply._first = list[0]; apply._last = list[list.length - 1]; apply._n = list.length; apply._tl = tl;
  }

  // Web: put the button inside the visible top bar, at the height of the bar's own buttons
  function placeInHeader(bar) {
    var head = null;
    Array.prototype.forEach.call(document.querySelectorAll('header.MuiAppBar-root, .skinHeader'), function (h) {
      if (head || !h.getClientRects().length || getComputedStyle(h).visibility === 'hidden') return;
      if (h.getBoundingClientRect().height > 0) head = h;
    });
    if (!head) return;
    if (bar.parentNode !== head) head.appendChild(bar);
    var hr = head.getBoundingClientRect(), mid = 0;
    // the middle of the bar's round icon buttons (back arrow, menu, search, user...)
    Array.prototype.some.call(head.querySelectorAll('.headerButton, .headerRight button, button'), function (b) {
      if (bar.contains(b)) return false;
      var r = b.getBoundingClientRect();
      if (!r.height || r.height > 80) return false;
      mid = r.top + r.height / 2 - hr.top;
      return true;
    });
    var want = mid ? Math.round(mid) + 'px' : '50%';
    if (bar.style.getPropertyValue('--ivf-swt-top') !== want) bar.style.setProperty('--ivf-swt-top', want);
  }
  // Web: the button sits in the top bar, which every page shares - take it out when Star Wars is left
  function removeFromHeader() {
    if (TV) return;
    Array.prototype.forEach.call(document.querySelectorAll('.ivf-swt-bar'), function (b) { b.parentNode.removeChild(b); });
  }

  function check() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    if (!/^#\/(list|movies|tv)/.test(location.hash || '')) { removeFromHeader(); return; }
    var id = hashLib();
    if (!id) { removeFromHeader(); return; }
    load(id).then(function (map) {
      if (hashLib() !== id) return;
      libId = id; data = map;
      if (!onStarWarsPage()) { removeFromHeader(); return; }
      var page = document.querySelector('.page.libraryPage:not(.hide)');
      if (page) apply(page);
    });
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
  ivfWatch(function () { check(); }, 120);
  window.addEventListener('hashchange', function () { setTimeout(check, 0); });
  // a different user signs in: read their library again
  document.addEventListener('viewshow', function () {
    var uid = typeof ApiClient !== 'undefined' && ApiClient.getCurrentUserId && ApiClient.getCurrentUserId();
    if (uid && check._uid && uid !== check._uid) { libs = {}; data = null; libId = null; }
    check._uid = uid;
  });
  check();
})();

} catch (e) { console.error('IvanaFin script sw-timeline failed:', e); } })();
/* IvanaFin - welcome-screen */
(function() { try {
// IvanaFin welcome screen: shown once per app session while Home loads (icon font, library tile
// pictures, "+ Discover" tab). The cat (welcome-cat-source.jpg), "Welcome to IvanaFin", a random fun line and bouncing dots;
// at least 5s (time for the app to finish loading), never more than 10s, then fades into Home.
(function () {
  'use strict';
  var KEY = 'ivf-welcome-done';
  // The Samsung IvanaFin app draws the same welcome screen from its first frame (#ivf-welcome-static);
  // this script takes it over. Anywhere it isn't wanted, remove that copy.
  var staticEl = document.getElementById('ivf-welcome-static');
  window.__ivfWelcomeAdopted = true;
  function dropStatic() {
    if (!staticEl || !staticEl.parentNode) return;
    staticEl.classList.add('ivf-out');
    setTimeout(function () { staticEl.remove(); }, 500);
  }
  var seen = false;
  try { seen = !!sessionStorage.getItem(KEY); sessionStorage.setItem(KEY, '1'); } catch (e) {}
  var h = location.hash || '';
  var isHome = h === '' || h === '#' || h === '#/' || /^#\/home(\.html)?(\?|$)/.test(h);
  if (seen || !isHome) { dropStatic(); return; }

  var CAT = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD/2wBDAAYEBQUFBAYFBQUHBgYHCQ8KCQgICRMNDgsPFhMXFxYTFRUYGyMeGBohGhUVHikfISQlJygnGB0rLismLiMmJyb/2wBDAQYHBwkICRIKChImGRUZJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJiYmJib/wAARCAFoAWgDASIAAhEBAxEB/8QAHwAAAQUBAQEBAQEAAAAAAAAAAAECAwQFBgcICQoL/8QAtRAAAgEDAwIEAwUFBAQAAAF9AQIDAAQRBRIhMUEGE1FhByJxFDKBkaEII0KxwRVS0fAkM2JyggkKFhcYGRolJicoKSo0NTY3ODk6Q0RFRkdISUpTVFVWV1hZWmNkZWZnaGlqc3R1dnd4eXqDhIWGh4iJipKTlJWWl5iZmqKjpKWmp6ipqrKztLW2t7i5usLDxMXGx8jJytLT1NXW19jZ2uHi4+Tl5ufo6erx8vP09fb3+Pn6/8QAHwEAAwEBAQEBAQEBAQAAAAAAAAECAwQFBgcICQoL/8QAtREAAgECBAQDBAcFBAQAAQJ3AAECAxEEBSExBhJBUQdhcRMiMoEIFEKRobHBCSMzUvAVYnLRChYkNOEl8RcYGRomJygpKjU2Nzg5OkNERUZHSElKU1RVVldYWVpjZGVmZ2hpanN0dXZ3eHl6goOEhYaHiImKkpOUlZaXmJmaoqOkpaanqKmqsrO0tba3uLm6wsPExcbHyMnK0tPU1dbX2Nna4uPk5ebn6Onq8vP09fb3+Pn6/9oADAMBAAIRAxEAPwCpBNqUuFLtWlbWl+TlnYiuhi0kBsqBWmkUcEW1sZxWdymhvw7KWmoubhRkjgmu68QajamxkRMMxXpXCW6+VJ5iH8qknvS3DGk1GW4ldHK3GnzyTyMuQCagXSLkNkk11RkQrkVXknAGKNS9DnJNMlbjNXdK0jEuXPFaO5Wp8Um3gGh3C6MvWNLjL/KapRacUXgVrXcpL9c03zCV4FGw1YxZLJw2VJBrQ0uae2cbmOBUjFj1WnrD5i9KXMTymhLfyS8o3IrMvLq7bIJOKmhhMRJ3Uk2JARkUXtsKzIba9uFTAY1rpezpZluc1ix4STBI61r3EqJaDpii9x2M6DUrtrghicVfe8vA37snn3rIaaPduDCpDfYwQwyKfMHKaEd1fiUGQHFac1wz2x5wcVzMuqyEEZpsOoM/yluvaocebc2hUcNEXI5pllJycZrRE8rRHLfrWI85XBxUl5cvHaBxxVJ9DKS6lgwzyyZ3UC1m8wAsazrLUpWjLDtTbPVLiW65zgGqIRt3FrMIhzTLeKZRjccVK925QZ9KZHcnByaW4zX0nKsdxrfsJAGZDXLW8xjjDg810Ojzx3K7wPmFNkmf42uPI0aY5wW4ryBBnJPevR/idc7LSOAH7xrzePcMZPFIaNzwda/aNdjYjKxjNeovx0rjPh1a/LPdEdTgV2U3Arhqu8zupK0DU8KW/m6kZiOI1/WvIfjrqf8AaHjFbNGylqgX8epr2zw0Ba6TcXknAwWJ9gK+ZNZvG1XxNfXrHPmTEj6Zrvw8bROOs7yK9zGXitrNB80zgYr3iwt10zw5a2oGCsYJrx/wlZnVPGdrABlIOTXsXiKcRwso4CjAraRkjhtYl8y4b61nPwtT3Db5iarznC1mUQxLvmz2FbFlHkis2zTv61vWEfI4qUM1LKPAFakS8Cq1smAKvRrViJEWplFIi1KBQA3bRUgFFAHn6a845qC51iSQ9azVgUp1qEqAcGo0L1N6y1Yg4bvV/wC0xOpYnmuXjdAcdDRPOyj5WNK62EdIl1EDgtVe8u4gflIrmxM55yaY0z55BNKw7nRRX8QGWIFSW97FKxAYVys7sy4UGr2mWswQsM5NSosVyzd3zG58uMFvoK19NsdVukzHaSH3IxWt4D0q3+3NNdoGf+HcK9g06G0WMBVQVsoLqS5voeNxeG9YnO0wlPrWraeDNTEfzMAa9cENuOQFpJLi2iHzMoquSIuaR47eeDNYAJRlNc/eaBrVoDuhY/Tmvc7vU7FFO6ZB+Nc1qWr6eN371T9KORC5n3PEriLUIZgZEYc9xV7ULwtYqmcNiu11GexuwdoB/CsO50yC5GFqJQRakcbH5jAncaVBIDuOSK6ZdFWE88inz6aEiyq5Aqb2GYcKM+DsJFaseksVEyLVyyijZNoTkVuacwWIo4AxU8xSRQtNNSe2IdcOK3LDwra3kKrPKAp6j0qO2ZFcmp5JtjAo5HtmkpWBo1E8GaBY2s5knH3OOlYfhfQdMk8RpbyKpTYWAPc1cy08R3SH865K91aXTvFdv9mYlk64rTnTI5D2Sfwpo0qBTaoPwrmdd8D2sQElm23ccbTUieKL+4RCoVMjqKrT6xePOg84nZ27VXMieW2piXWh3Nq4hYZB7it3R7KO2thtX5j1rQtLr7YoWZQZW9B0qW5QQI3oozU31A8f+JM4l1URdQgrlFTCZPJrX8TXAn1q4cnOGxVG1Xz7mKED7zCpb6lJHo/g61Nvo8fGC3Nas4LMF6k8U+yi8izjjAwFUCp9Oh8/UYY+vzZNcC96R6D92JZ8dXg0P4e3TA7XaHy1+pr5m0wHLzN2ya9o/aH1LytOsdKRuZG3sB6DpXjEmYNLbH3pPlH4168FZWPMk7s9E+C1j5kt9q8i9SQpNdH4puOCoNWPAdgNL8HW6EYeUbjWF4gm8y4IzUsaMcdSTVa4OSF9atHgVUxvm+lS9hl20j4UYrodPj6cVkWUeSOK6KyjwBSQF+BeKtxrUMS1ajHtVASKKkApAMU6gBcUUZooA8lgtboffyKmXT5Gfk8GutbSpJAMDFTRaK4xmsOZPoVZnKf2SMg7uanTRS/vXXLpCgZJ6Vds7SEKSSMClzW6Dtc4h9GSMfdoi0qNzgpXXRzafLcyRs6ny+vNXbK0t7keZCAVHcUueQ+Q4S40UqMpH+laWh2Kn5ZFwRXdmxRYSSgwBXNSmGC5d/MVAOuTitIyd7sORNDiPIOxVx7ir1rc3sQ3R3Eg9ic1gN4n0qOfY0oODya07fxHpMigrIpHrmt41IswdKZoza7q8YwmH98VXOpXlx81yT9Kmj1XS5lASVCTSXElqUwZFGfej2sNjX6vPl5jA16/eNMpXLT6nI/BlwfrXQeJLSQWzSREMAM9a8V8QatPBcsoyrA+tZTqX2KhST3PTdNvju2ytkZ9a6e0EflB0INfPsPiy5jILN8wrr9E8cq8YWSTB+tZq73Lkktj2J4YniyDz1NRo0ATy2Ga4/TPEyTgL5mc+9dTpk9tKoO4c07GdxLeKOJ3bA68VTvL5I5SqHk9q17swBSVGfpXH6v5yzl0jIFS0Unc047xxGXdsDNNfVl8w5f5RXH6nqn2eMRsxye1SaCk+pu0pysC9T6ms2XY7JvEEcFu0hYcDgVz9k7Xl817LwWPX0FQS2BaXkkxg5Oe9Vr278lRDCMA0J2C1zsxq8Num0SDgcVpaZqMEtkZW++T3rzTeSyhmOT1rVtL94gsYPyLTUhOJ6xojgp5578CrGuT+XplxN3CmuW0nVc2scamuivl+0aNJGerpWiZi0eFXDma6lc92JJrQ8KokmuQK3IBzWZ4qiksd6RHBDcmneErvbqVrM3rg0pbMqO6Pamb5cAcCtXwpDvu5Jz0QYFZJbMYZcYIzXQaW66f4fub1/lwjOT9BWFGN5HTVlZHgnxn1P8AtPxvLCrZS2AjA+nWubtLU32tadpyjILhmFQ3kz6hr91eOcmSQtn8a6z4U2P27xXPfMMpbDANen0PPR6nqW200+OBeBGgFefXzmS4Jz3rsvE9z8jDPWuIPLE1maEMxwtQ2q5ctT7o8Yqayj+6KljNbT4+ldBbJgCszT48AGtqBcAVSEWI1qygqKMVYQUwHAUtKOlFACYopaKQHDt450+Sw/0aVPPUcqT3rLsPHt41yYZtnzcJ6E188S3l3Zyu0MhYE5zmrcXiC6khjVid6PnIrJw00Nro+iz4yvI0Zbi3VXzgYPBrLu/F1zsdZNsaHqVbpXldr4muXjDyrux69RXSWmiyavCkrzbQ/wA2Aaz9SjeW9sVdJp55gZu6nINdtomuPa20VvZxnyyclnPQVw9hpi2tr5AC3Gw9zyKyte14rK2mWUDqUX5mB5BotfYObueteJfGsFrZmNbhFkYYO3mvPJo47lHnk1llD/MQTXmlxBrV7JhPMcJnk5qOO21+WVrdEl8tVyc0+ST6gppdDulstDujJH/aUqkNhnzUd3pN3aIW0jUIbmAcZ38159BHqslwE+zzC2jYbzg/NXpmi63pOjPDD/ZihrgYIk9aXK4j50zJsLrxAb77IlnIHzw4ziuut01toQ0u4OTyzHgVoah4qSLT2uLa3ijOOMrjNcdqvj15yixjCquWx60NX6CUjQ1yfV8mGO7bBHrXl/iJ7oXTxyrvYfxV0Ud3rOozefEjkEnBPAq0PD1zdQb5iGmfqewqorl3DmueXys+T2pLe5eOZTuIGa7LVPDFrYI015qUEPfaDk1ydwLZ5dtsTIB3xjNbppmLudHp2syIyqr7fU16LoOvu+xUcnAxxXiYuVibaBlv5Vv6PrUsGArbalxHzH0XpGoCUASH860L+2gnhyHGa8c0XxFMxXzJ67ex1uERqZJR07moaGjJ1Xwxd3V6WEiiDP4mtqdoNH061srfBYt85FQX+v2xQiNgx7Yrmr3UjLOm+Tkc1g9zZbHT3dywhZiMA1Rt7JWXz7g7f7qmsW58QQhghbISsjVvE8kiiGJ8bupqUncp7HRy3MDXOyMgqnU+tD3DSvthXgcE1zFncfIpL/Meg9alW8uJCy7vKhT7zDvWliGdxouoiO4jh8wcHk5r0rT9WQoiOQ6d6+fbLVIpboJbnCqeWJ6122l61IFC/e+lDJaPVb7SfCepWkj3kKBmHXoa4NfB9m0zvpt0PkbKqaoalrF19nwgOAOtY9p4iuIp0KvtIPzc1FSrKLXYzUT1nTY5xaRxTL86/KferHxN1RNL8DSW6HEs6BAB+tc9oHiaK5TmQEjrWjrM2n6vEkF44kXsK1jyw95DlJyVjwS1Iit5p26gE1658IrD7H4Xe9dcSXTE59q1n+GWh6hYkx3DRK3J21ux6SumaVFYWXzxwrgH1rp5k1cwSaOO8ST75CuawMYWtfVra6Nw26JuvpWVOjxjDKR9RU3uWUZPmkArTsI8sOKz4RukJNbmnR9OKQzYs48AVqRLxVO1XgVoRLViJUFTqKYgqQUALR3paSgAopKKAPieRWxvP3TUtsFODjirCaVdStsCv0zzU01hPbIA4wuOtZN2Rstw80oqhcZzXWaRrU1vbBFcgKPWuHLSo2QNwFWBfuoCFDz6VjJNmikjpj4huobiRw7FX9+lZ02s3BmYqxLydWPWsx5C0e7lR61C5D7SjZNVFWJdmdpY+J57K1jh2LgDLMepNWl8UxzW7qCEllIBx1xXBz3BwFPTvSxtGsqT5IA9KLCPXP8AhKtO0yzhVokcykcsvSuW8S6jp+tX0M9mxSdZ1CdgQetcZe3j3z7HyFH3SOtVrSZk1eInO2IZC5q4xtqQ2enfExX0/wANW2yb7r9V9xXEeEC1/LJbum4MMmtXxZfyX3hSCO5fM0j5C9SBWX4Rtbq00+51EHAhcIwPUg018Iup6lo0aI7WUoVFW3LjFefeJda1W0k+zW8xSLJG4eldRqF21jd29wG3R3FuU+nFeX6jqL3DOrHlWIoirsHoXLbRrvVpS89wzEnjcc1f1XwzdaVYl4YzIW+8w5xW14Hihu9LZGfbMvKE1J4i8QTafi3kwWzhx6j1p8zvZBbQ81FszCQnO5e1NjeSNsYNaTXSyag0irhHPpVu6gjQgog55rS5IuiXTmQByVrcu9VWCMBZSzHjrWFEEtkYn7zDIJrJaZprlACSAahq7KTsdrY6i7o0jNwOmaoapqz+cCp57CoIUdYvLWqs1uu7c7fMO1Soq5Tk7FyC6LqTIcE9c1NptjJe3gAf5M9ak03T45oGctkEcVtaZZmxIBON3Sk7LYFdlmDTWhJkGWVR+VZuqXsa2EkYO0k812EYZbTYAMEZb6VyU1lbTLc3suFjTOxT0JpIbMTQoZ53LhyiA/nXonhu5ggdFm+b1zXDaQ0x3MihIs8seKe2oSJclFkzk4yKbjdiTPVPEd5DPagWwSNQOorzO8aaKdtshJJqebU5BABubbiq2nyLeTGRz07VnKN0B2PheG4jsWlMmHbmtNNZFvJ+8k3MPes7T71FtvJQYOO9cvqM1wuoMFXcWNY1ad0rDW56/wCE/F1xPcSQuT5KjjNat343WBjGjD0rhtGjax0Jrh1/eSCuSSe4+3O10/ybsgVnL2kYpXBJM928Pa5Dd3O65CMp6kjpXXyw+Hr1VDwwuo6nArwfS55nKRW5K766WaW5sbbzJpyEHXmroznFO6E43dkdtqun+FQxS3REf/ZqxY+GNLa2EqXBLHoAeleIav4x8qYiJxt9c1WtPiXqsUscdm+QnLZPUVpCU73Zs6Gm57rc6P5H+pfcB61WVGU4I5FcvpXj9dQsUuCuG6MM9DXZ+Dr2LUo5LiZBtXpkVp7eLlyo55Qa3Il96lHStyW3guWICCMetZl7DFAwVJQ7egrdyS3ISK1IaQOG6daKadwEooNFMDwyQabLLujUAYzgDpWTrFnbXsflWuCUPIFXpJrWFPLVcxhDulHXNVdFntVunMfIU55PLV5SqyejN7HFXFnJE7IYyMdeKoyRYO7HQ1642nW148jSRbBtzyOa4DX9Pktrtgq7YWPBrqs4kp3KemxoysjjcG7U++02NYt8a4x6UmkA/aeeQOK6CWBGjIHemtgOAlUrLhufarTjMQVRgEVf1SxVX3qKnt7ZTCAR2qrjM61hVcMcZx3rNVC+peYnGD0rWuI3BIWqdv5cV0CT81UtAepPrlyfspkLndgKB6VoaDey3OmSWxYFZRhvrWHrn73bGvQHNO0edYCFBI9aGvcF9o39Z1SX+xLeCTKz2xKnPcVwyFnlZs9TXU+ILiO4tgzYLYxkVyyApIHU55qqexM1ZnoHgxx5CxM3lkg4Y96x/FCveakUUszKdprSsYQllDPCTk9qmjs2M32tUPqwNTzJO47aFnRvD1tFbCS4Ku5UEL3qxc2Vlcxl402Ooxtp805WCMqSruMrjsKsRRSNbtIU/eOp2KOpPrSu2FkcD4igeK7WOMkhh09Kp6daPuUkHJPArrBoGoT30UIQyzE7nbHTPaurtPCoXCxICsJzLJjqfQVreyI6nG2lvJE435IPOKZqdsiwyEZDnt6V2DaRKLlpgmIAcYxksfQVp6X4UN351xdRlU3bVXHU1KaWozkfCluywCWfJTO1V9a37yEIRPIcDOAtdPBoERm+zW0WVi6t2FOl8PSTO1w6kxRDCqB1NQ9ykzk7x52tTFbEjf1+lcxf/brj/R0XbGDjA716JD4avbklYwygtyfapofCUq3LzOrLEnTjlqaaQN3PPLqN7PTxHMAGI4UVh2SyC63kHaOckV6JqXhTUbm7MzIyx9gaz9U0O5trUQhVSQ9eO1WiTGiuWnjK7FVegJqpafubpwGyM9RUt3GbIRpJIpzUN66rDvhwWx2pNaDT1NxdQjt7cuzjNJoMi3l99pYblHQGuBuruaQ7GY12Phe4NpbqJ1KbhlSwxmoa7lXuehz37SWqxYAUdqx7q1ivplI+VV5OKyrzV3kTyLRdznv2FX9DZrSJnuZVZm7elRKzepag3sjt9KhihjRkI+UcZrmfHfiCTcbSJsqBzirNxqHmRxiA8DrivP8AxPNILmSRlILHAz3obT0RpTjyu7MTUrwsCDncx4rN+1vBJmNsetSz5Ztx5IH5Vjzud3XvW0YinJo9G+H2qO94LRwWEx4HvX0JplxPomjINmGYZxjmvmn4VX9vZ+I7e4vVzDGcj617nrfiZJYzcJKPKUZFcFe0Z+7uXGm6iu9i/f8AibUc7prlbdD2zir+hXgvrqForjzPU5618+eJfEz316QJWEQbk561c0LxZc6ZLBHZyMzu4yc9BSdF2Tb1HyR2R9ZJYW0arJNKg7nJxWVeXemiR1jlGV6Y6V5zea1qF5cRGWVlhCDcM9aig1F5tQEcDfKp53VLxcr2SOf2dtz0OKRZU3pyDRVjS5YjZrvRQu3qaK9CE7xTZi0fJ730y7o1ClFbnf0P1qTT9SSG9WV7ePzNwyUPBq/4i05LKJ2jjysxyG/pXGwh4LtVbO0n8q5VBbGlz1p9X83kptcrg1h61HHdRBSce/pUauWjikzyAOaS8k8qCSQnIxmuh6gkYWnwG3lcOQdp4Yd62lcFOuciube/QzvsPysuauWN4WiOTnFStgE1uRY489Qaz7S9+4AeOlVdcvfOcIvQHtWWJWTBU96pITZ0s7oAW4xXNXkn+kl0PSrM9w5tRyQc1mOc896uImyxFP5gYOeagWVo5sjpmlto2d+Ka8Z81lq0Sa1w8VxYFUI8z3rK062d7nY4OAcmrtjFI20KudxrptB0xZ53byju2ge2c0r8o3qaGnQsVhhSPIGNuO9dHeW629oUChZcZf29q2PDmgKrp5qfPH8zf4VrNoKXV8kE3+pPMg7v7fSsNL3LucjYaMfJtru5UnzD+6jHVs9z7V13h7wwzub64G7ywVVezNXRDS45NQVto8tAFCgcADtXU2kEaDBAVccD0ochWOVsPD21ZDtCs5xkCr82hRpb+Synyx92FTjcfVjXRvc29sgOQfTNZsmpRST5Vg3OM9ianmGolTTfDFr5i3F06naPljUcLWm2n2wiCQKF6hcDoPX61Xv9QZYQka8nj5jirNlI7RDMirxzRzBylb+zoLeExKCWflscVbt7G2NptYhAeuDyarancxxIfmBJ/iJrHe/mABWZcfyHsKGxpHUQw2FsgjjRS57VKLW2kXOFP0rlIr6OL948xI7k8Zp1v4st1m8qJWcj0FLmHynSS6bE5LeTn04rkfEfhV7nzLhzsAHCAda6i214zgfKqg1YmnNwmN6+wqkyWj5c8XeHr4X7MRhV7Z6VR0TQdTv7n7JYQPcyN97A+VB6segHua+gtb8N21+5eeQQRE5kYJyfp71zeqSw2Fo2jaVGLeLbvKIcmTHVmPc9/wCVaSqWQRg5M4zSvCWh+Hp/tuomPWdSyNkGM28R9fWQj8vrWhqtrN4piEcrCO5jY7ZFQDA9MDsK07eyVpdyyKHhXIDYIz6/rmtrQ9He0mDE5xhgfrWLk5O5tyxieP6nYan4flFpcW7Ix5EgGVkHqD6VQk1ckGIyYHc19I6raadcaRJHqNrHPGASu7qnHUHtXyHey7ruZEbK+YwX6ZrWCUg53E7a012KzaLazOT6niui8V6XJqHh+z1m1QFWByoryiZ2MgjQ9MLXv2mxB/AumQ5GYossPWufEN0kpI6aLVTRnhU0zqrxFcNnnjmobewluXAK4X1rsta02J71po4sMTyAKaIY7aRYxEWYjoBVrEJr3ROhr7xFpNgtsigKM+tb8eoRxJ9nkyytwc1Db2pQG6uDhcfKlYuoXRaY7V4z1rjac5XOuNlGxD4u0dYcX1qxaBuqj+E0zwJZte6rHuHyRncSas212Xja1uDuik4xW54fit9KiZUPL87q6HVfs3F7nM6Vp3Wx6EPPeNFCh9p4x1xT7aWO0umluE+VO3QmucsNU2PlJeeo5ra+1QalFsuE+cdGHeuG1txVKd9Ub6eI5ZlQOdqn7iKe1FZGg6VF9sE93IVROcdgKKpKo9bnJp2ORa6i1HQ45SnzdHU9jXJ6pp4XcyjnGRW3pLAWRVThXAqHUDnT3ZvvR16bV9TNEGnT7rVUfqBzUGqXSrYTxMeo4NYtpfsrvsbAGRz6VBql2WtgpOSxzTAyldlIYH2q7b3BS3lVSc1njJIA61qW1nttizfeamxIypHJY5PNEETTShR0NOmhbzigrW0y1YKAoBc1XQXUrahCEhRV5xVA2cpAbaQCeK6h9KnnjVRG3mO4RVxzk11b+E2a3jjQl2jUHEaZz6/yprQN2eeRWhjjQ4xk4qRLIrPvK5Hpiu/sI7HSz5zaKb1FAMm/llPXp6V3elQeG/EumNcWlnFHJjawZcFT61PP2L5e55HpWlqQMAAk8E9s13XgzS4o55DOAAz4X3x6VD4X0o32q3tpPbrJa287J5qkg4B9a6qbTtL0+4E7aosEMPzjf82D0FQ3cfKbG+30+1lnkIDO/T2qrpmpxXGos52g445rntYu59UJOlXE1zBF96RIl2g+w7msTT9Rezcy3JcqCQXe2Ma/99j/AApcrYWseqpfRwQu2cu5456Uw6wSAEkAULuJNebz+IrMRb2kmhQ8eZuEkf8A30On40ljfTSiZILiO5LLlUBw+PUA9R9M1Lgxpo7e51drhZGyNq/dGfX/ACPzqJNSEcqxW6hpivzSnkD2Arz6715bdyiMQwP7wEYKegI7U218SwR+YTLtRR26nFTyss9Jhu0H7y4nxzyT1/8ArVdj1mGVRHbLhe7ue1eUWGvJevK0jhlJDBc9B/k11EGrW8ESIzje68KP4RRawmrm5qN88jOLeLzmHV2zhfbFY89lrUhNw1xmRjgKB90etXLG4jdHfzcA/r/9etO0MxieZIwqMOCx7e2au9ydjldUa6hX97NhIxkjaXZj7YFYkd5qV3KVtormGJfv/IFP0JB/Su+vp7d5RFNEtwOg9Cf61ialqElqAsEIXb91FO4j8MfyqklYV2V7A3Pk7kN7cMvJWMFB+J5rpPDsus3FyoSyW3iwWM80rMFA6kk9foK5zT7zX767S3VJ5J5OYLCDhmH9+Vv4E/U+3WulttE1Ozt7iO/nUTXZ+Z0YN8o5Hyj7uOeO+BUadC7PdnXz3FtqEJs5X8pWGElHGD7/AF6iuHfSdRsLqaC/hhurRcskq5WRPcH0p+ipqCWkljfHM1pJtViflkQ9we45/StyK8ljgWC5UyFQVBPO5en5jv60PXcE+W9jIt9KiNx59qV2MuCDxwemfQ8da6K1gKRqrrnA2n6diKox20duVKkKSflwcYz1H074NaDyiIYP8WcCh6IW7MTxtMzaY1jbsFmuCIUOOAW718tXelzWesS2pYS+Sxyw6HFfSOr3jSXM0qHItbdpB6mQjA/TNeGS4R7i4cEvI5HP61cZcqGoc7KGkaX50vmS8nOcV6BaapNHBHp8ch3EYArmtPXjcvy1uaHChvhPJjav8Rrkqy53qd8IKEdDpUsHWzWe6CliOFFZN6qRoZIo1z646Vs3V1FKipGxIPYms64YSW7Q4wa5Vobo5W6u7liY2bINVJImkjyePerl3blJSO9CRnaAenrXSmuhm00ZrwMqCQA4U9qtvNI1iTGxBiPP0px3AGPgA0+JVyQTww2n3rTpczb6FW11SWEcYc9s1oN4nvIIwVUICcHvXKTZSdl6bTUdzM7REbutaeyi2ZObSOzOsa5fBUh1FVg7jODRXJ6Db3N3cxxK7BXbnHpRTk4wdjDmudpp0qpAqA5+WqWs3Ij06UE/MwxWZHetb37Rs3y78VT8QXZbbEp4xmtDnMy2LNIEXq3Wpr+J1cKR9KfpiCL99IOewovDPLJuRRgetVYOgWluiHdIQW64q1JOzJthRnI7KM1BbWM02XcOwA5x2r0fwX8PLrVXguIY2jjTBLuDsYfXv+FVZdRXZ5na2t7eXLNDbSM46ptwa9I8D+Db6+jNzLGEiQ/vPM4B+h9a9X0nwHY6e6PLO0gTlVi5+b15PT8K1ZrbSIpHSVmc7eInPI9cL3FS5pbDUbnPWGk6dpxjRY0unGdsk7ADP93H41szG+gtlkhtrZ8cEIOBzWRqVtp5EM2nv5LpINig/Kyngq34VVOvrBqhFuwW13ujoOfmXA4rFybLSJJn064unhuLdbe7z94r8rg9FJ9Qa5DxHcDw3exavp0RxvEVxHnAKg4B+uTmrvjrW0Ub1KASpkv/AHGHeuE8Ta09/wCGZknfLSBMH1PTNXHUHodroeuxpc6pJlGSWb5UB65UcVBZaF/wlWuyFpT/AGdbn5nXo7DsPYdPxrjPCsN3eRSeUjSMo2rjoTj7xI7AfnwK9Ps9um6MlnFKsaoi78cYUDPPqSRmqkuUE7nT2VlY6VDDb21xDboCFRWxj3z61T1O3sNVtJrS6jSSF+DJAwJHv9a5SFjNfkTLJNtQYaTgLnnNdPYzOZ4ksIVdIRg+WcAcd+5NY3dzTQ4K7+HFvF5raFeX1vLnO6bGCPf1+lUo/BWsJmBoQrY3BomxGW9RjmNvcceor2+KA3M6RzoSu0s3mduKivRo+mwNNb+VBKxzh2+Vj/StFNozsmeOw+FNcZZE1aIXcP8Aq1uXwsuO6tj8OefWua1vwTrNlj7LHI9pI3LMPmQD+E/0PQ/nXtf/AAktvDZStJbZkjYgoRyCT/8Aq4ptzqwWG3aZ0FnMvEmMg9yp9vUfj1o9qPkPENE8Na3Ek90beRY2jYcgjoMjH4gCqa3mpxS77uGVcjuCP89K+hL7yY4AyyIYem0jOxjyPqO4Nc46aHPqrWt2sUaypmNuOTxkfy/Kk5pvVDStscBpniNY/wB67KFztVTnNb6654lvbVX0qyuFtgcGZI85Oa6qbTdE02ETjSYXQLy7DI5PP5nvQ3iG2mhEdpeWtvGwxsibkduR61Lt0C5Q0O81ZJkXVNH3q/DTjCSL9ccH8qv+JBpmmQ+aUSaEoHVQ2A3OccVnrrAcmOS/jkdW2kq2CR/9an3WnRapA0dxe5jKHJBHHb8O9VfoSUfDPiaaKy1C2s5Sb/VLpmeRBgqMZUE+gxXTeCYLlTIdQlMzSp5hYn7rdMfrWJp2gpo2pWkcZWZDz53AYnnGT+Nbul3dtZ2pPmB5fMIkZumSeMevrScV0HzNmheXCJfxAjMZbaVA/iPU/wAhTLt83cUTMpdM+aeyAfzPSpZls9/miZARIrAluvHBqhrFimySGGcxs5BZlPJA64NICtNqgfVBbwZMSybQT3Y//WzU2v6qtplCQZNoJ9s9BWHpGyxvWublwyRFpFwcjJGP5AAVz2o6ub2aaWTG0MSxHPPTH5nFVa4J2Oj02RGhllkIk81iuB3GMZryvxfZCx1ZoVGIwcjPvzXo+jT+ZhU6KM4K4PtXKePLACRbh0bCnnjrVNXiVCVpHOWThlDyNsiHf1+lWZLl5pVWDcFX7qKKwLi4d5AT8qjhVHavXPhFrHhySL7DdWcSagv3ZJBnfWUaXNLc6pVeWN7FDQNE13VI1aOyeMf3pBipda0m+0O5Ed4oO8cMOles3ms2lp8hdVx2FZXiO1h1zTXh4Mm3dE/v6VrLCws0nqYxxUuZX2PILpImBY4Gazycn5MbfQ1oalpN5bQSzzq+yM7SccVzzXGMgcA1wqLR3uSYs5LP1zg44pI3YNuJ6dKgE5Y7MYouZfLtmYn2FaK+xlKy1Me7kBndh3NVG3SMEXqTSTSAEnNS6KRPqUUf95gOa7VE4ZTPTfAenxRRxs0QJ6kkUV1mk28cMMNtEoZyBuNFedU0kJaniErtNdmRerNmmyxvPcFiCQKnsYtzFm6A4rQeMKOBxXoJGRTERRAfyzW3omi3OpOrQW0sybgGMWCV/AmotIsLq+uktoIJJnYjEaLnNfQ3gTwzD4e0qPUtasfs0inMUXmMN59SD2qrpasPIo+A/h3ZaNCmraoZi5XMdtOm0n3ODjFWfE+q6iLaQabcwWsUbYWGNOPcfWrninXpLqKW58zKoOFBxgeleW3Xie2eCWX7O8LZDYbA3jsRisHJyLSsdTa+J4rm2Mnmst5buUdc7eQeVP4Hg1zvjjXxdWpmiu1WWNN0TMhYhgeRx14rnpZYitw6RMpmG4N1wf8AZNYcUhkeQzSeYWIBjXqncHOeuOvpmko63GaWj+Lrp7gq0rSI3Dh2CkH061De6mtpLbpGNrMSZWR8hiSTx6dax9R0lTIr2K4LndsOPkA5wT70y9Dl4TKojWPDsAMcgYqny30Gk+pf16/ku5Bbygw/Lx82QxPeucuXmu5rbSbb53dxvIHan6lqHmFZGG0IMDmtLwBbyNftczrueQlY8/wD39ulaxVldmcnd2R6TpNsNM0q10axVUd1/eyDqz9T/KtGx0hmumN85lUqMID/ABYpmjJDBMxCmWVpAzEjJXPB/nXeWujBIlkdxuAyuB37EH1rFu7K2Rm6JpC3zLczgrBjhc4z75/CtuA6ZaQC3UqSAMMOp5/+tWdqV5/Z2h3QgzsbLpg9M9f1ryOfxRctqEO3c6FDwv1/x/nUO/QtK+56F4i8cpZXDxIw3ODjnIHHf8RXmWp6/c+IdPa0gcxTKwBJ5Qn3HUAjPrTZYpNRne7abcoYS4AxuHce9Z9h5Wk3jPCoaOdw49FPUj9Mg/WqjHqwbtsd94Xbf4dgs9bnYTtjypn+Yxg9FYj7ydOeq5rotA0h7ZJ1vHd7F12PbSpkxkHIdT/nIqt4M06K/t99zAdiuWjRxtKn1X8O3SuwlRIdP+yRjLBSsYJxkf3f8PShyJ1POY9RmTxLLoF0AIR8of8AheI8jB9xyp7HjvXa6loXh+W3hjYxyPAA6HGTyOo+tc1pGmxX8t5a3OVlO5bWQjDDI+aM+h7j3HvWLBp9+8gie7dns3JhbP8ArYT95D7g/N+dTuUzqbjTyQsglzAQVkQklXB747GufbwzYPctviCIzYyoww9PriltrjVl1pYbmXFhv2g4x24z+PFdy9hF9ijmUrIwX5WzVIl3OZuvCkLJkLGJCpw3Tca59tIaS3lCXTRyMWJUNjb7fXv+NdJ44vxBp6FJSLqEDhRyw9fqK5K01CS7Vbh2KSPkSE8BTj0pgiDQNf1GHWYtN1LmCRCqyHoCDx+legjSouZOJImBZu/Jzz+Ga5fXY9MitY3ncJJEu5HBxzx/hV/wf420i8tUgurqOC4T9224jDehouFi1f2ZS7Vo3JAX5MDPI/8Armsqe6uAtwPtbM+NjOSMAYy2P1roNbYNbiWLDKzBzsbqOhIP0P6CvORdJ/wkF3EzMYEBZVIxnnnH5YpoRqR3aXUaB2McT8oP4mA5B9s8e+K46+uUs7mNHdpEM5eQew4H0q7JdPMtu12PssZVnDKeqAnH0zxz6Csi7uIri2ZJYxlm3K5X+EDj6VrGJLZ3Xh/UYpbhAdqs/wB0AknHrW1r2lLqFjJEGYEj7x9a4LwxMUuIiHyOBvGcn2r1AAz2wUg+2KpITep4FqlpNp148F0MYPBHQ1HbzPFKksDsjIcgqcGvWfFPhxL+Er5RZ8dR1rzq48L6zabyLdig6Z61Dj2No1O51mieNw1qYtVgEsyf6t/Ue9bsnxLsYLURw2LBxyCT0NeSSwXifft5FYf7NJmZkIMT5HcilzzRfJBnaeIvHt9rVkbExxwwFtx2jk1ym8YyWyazZPNLfIjZ9MVat7e6fnyHP4VEk5as1jKMdEWoiM7iay9SlmuJCEJCDoK2YbC5lBDIy+2K07HQ9zAOv6U4JRd2Y1J82iOCe3lxyDU+jLLHqlsApJMgwK9Vj8KQSIMqKl0vwYh1i3aOIuyOGIA6V0X0OVrU73w/YEWySSIfNcAj2FFddpmmtsG5lXOB16UV5M4uTujZOx4pqPhbT9AsE1C8ug8Z+4ijO8+hz0rDs7hdSd4rTQQ4znO8kdOBXS6ne/2igtbw77V2+UOPu+lXLK60zToltbK1KyYwXU/MMdq7OfTUduhe+Gy6jpd6w1GzS1kYEwzeRuKe2Sccjoe1dX4v1FprR4ofPllAxy/Q981R8NXdu8ZliLPcKN3zsw5z6njiuPvtW1OHXb5iwMEmcM/Ck/7IwSfrTu5biskc5banf3t1c6N50siqC0hbPbsB3H41m3Ok3ySPKitGANyuTk47ewq+11Pp1/cTXJVkuTzIwOSMdBWq99HfW6LLhAxAxnnP/wBYCqbtqhLU4FNQvLe7EE3mGFsYXdzjp17Z6/jW/wDZoNRtFiX9yGJJccden4dK1L7SbYr5zxqJCCwAHI+tWLVba0jjeTBEY3bR3AwAP61Epp7FKJmS2p0yybEpIHVj69z+X9K5XUNQe4VizYUnjntWj4s1TlrZSQjLn68/4VxVzPJICv3U9O9XTg3qxSlbRD3lN1dKijKg5+teh+GyYjDb2yh938LnHPpXn2nqE/eMD6D3r0z4fWsAj+1XBfZnMYY/pjHP4VrPYyiepaJb2dnKjSt5V26AEMeMe/59fStLUfE0FnZtE74lXgMe9Y2py2Z04N5rO6g7WIxXkPirVbqR/LjnYopO1weR6g1zWu7Gy2udvP4nS7Wa0aZVyWI+bPJ6j6V55q1rfx3Uci/LGxDLIjcI2eD+Y/Wq1rfFgDdQ734IfGNw6ZyK6Eai8loI5o4ywGCJP4h9apLkHe5PBq5XT1dd0MqcSLjOD34+tP0AC+1KLdZI67usZ2jn9M/lXNPMJZMOPLOcZPIr1LwF4TEtgt6knlyqcxyo2Vb/AGTz0+velJ21BI7q08uysYo4gUCAZDDGP8Kxtf1hoLiHzPmhk+9/sn1B7V0VvE0wEch2ygY5Fc94u0dpbNoniIcHKEDp9P8ACuXVu5qrJGmgS7K6hCoEzqouNv8AER9yYfyNZF/BLDcm8hUbi/mMh+6W/ix9f60zwLcMtp9kdyZbcnO7pg9vcGujlsjPG0CHAl+eI/3W9D9en5Vonchq2hj6Pp66zZaiibRHj923qDyPxB/Wqy69La6IqRbXltsq6L1ABwa6bTAmm6dDOibYZQRKMcxtnkH/AD2964TxJbJYa3Le2e4i4DP8vKq2Ocj0qkyTG1K8N8gcTJOQh8t93YjODXGQ6i9tfELLiNgBtYdWzVrWbhrKQXVttW3k5KKOA3I4HauclQGZtrKNvYHjHJFbKOhN7G/rlreeK/GNloELeXFgFucAA8kn6Cum8ffD7wxpOjW8el3MrakoGWDZBHckDp/OuatLjz9ZhvQuzzrZADnHTg8ipde1l7SUwQ273U2BlF4Cj3NaKVlZHPO/MVfA/ifU9L1SPRb2ZpoJW2xFznacdPoa9QTw9b3WsR3/AJa5ySBjg5xnNeC31xM11HdmMRyRSKwCHvkcA17VrviZtB0pZiha4MfyoOTmoktUzWLbRX8f2+lWNvEjRxGRcFIi3Tryfb/CvO/EJ8ywhMLERDjJGCT64rLNr4n8VXxvnikdWOC7cKorqxoS2miubl1kkVC3qqkdK12J3Od0DWHg1C0jmJCLIMt6Zr6D01EeBDuBBA5FfO8tsscUdwM8/MM9/wDJr2H4a639r0VUkJaaA7T/AEqmSd3FBHk5RSPU1FPplrcyLvjyRToLW7umDl/Kj67e5rXjtAqbWYk+1TuVsYFzotiwwLRCT3K1kXfhy1KlY7VCf92u/ECKoGMk0zyNxbcgHpTsF2eaWng+Ez75YEC/St2Pw7ZRptEC/lXUtEq8Km7H5UBF29MtRZCbZxcnh238wsIxj0ApBokEf/LPBrrmjKnAA+lJHYzXDfJCSfYdKh2Q7tnNR6aq4C8/hXVeHtDcLu2hGYfMzcYFaWn+Hrk/P5YVh0LVtQ6FOuPNusD0UVhNynoloUrLUm07SrWGMEsrN6k0VYg0uOCHPnM7A9SaK0jFpbEtnx8HmvozA7uGT7y9Cjf0rS8PWt21yd03mPDyGY7WH+Neu+IPh/ofie5bVtMmfTdSlGXMPMU5xxuX+H8K881fTtf8OTCHVNPlgP3ROi5jx7EcVz8ykrxN4u+52Xh4sNDvnlBldXUbXPyjjtxXmvizU7tL8tOiC1bhWGd30HoK9Y8NbrnwYC6/ekYncRz715p4ojUXBe6jDhT8gxnB7dKqMrMLXMDVj5toiyo7Mikpgfc7kmm6BNGJFjl3FY48qW6AZ/qf5VZPlxRCIq53rukyOee1VLiQJscRhUGMAdsf5NVzaWFym9OCYlmbldpB55LHgH8qy72UIqkuMbc/XpVcahP9nKttIjbGR6Vkatds0JLHaqjJPrWai2zS6RHr8a3qo6yJHtXG7Gc1zk1nFGqhpDIe2B1rodNljvNIaRPkeM/MPTNUstMzIuPNQcjpmuuN4qxzuz1GaVaCVo1mUpGD8wI6iu+0dvKiRLZnW3TpuGSPfNcjY6lJHLHF9mM+DgoRyfxrvdKsJpWS7uUFtblflhJwfxHaolcasUfEOqP5R8qfPrjvx6VwOozSNLvZY8d/Rq9E165soI3RcBSMfKf515zciCWY+VGWwfTGamG5ctjQtLeGO1MkExkjY5Mb9j7GnWdrDPcg+fJEQM/MOKjEgjhGbAKuMFowR/I0+3iXaGgbJPqc4/Ht+NVJhFG/Hp9sGUvGkmP7rYB+o/wr2HwrdxLokSwIA0Y2vnqPQH1+teMaMGM+2YNHk4xzgn6jgV6t4cs5Lex81ZN0TjBQ/eQ/1Fcs7muhvW8z+edufUf/AFqnvtSRoTBKCeM7WFZjxuBuBxnngfrmmTxG7Qq0oeQD5SrYcfn1rFXtoU7N6k/hyyVri5nRRslwCBwCfXHY4/OumtLbpDIDlTwfWovCFj5diBKcknO7oT+FaM77LtxnO1dwreEdLmMnrYwtclWK7ksCPlvhsD7sYkA4P1IGPqo9a811S4YQTWt6whmhfHlj7wx0P0/pXZeL5mu9KkubdHaS3nDgr1GCM15b46vjqcEWqWJMssLeTcKg3EA/rjNOOrsPZGfqUVjqDoBmOVSS20cOAOcfzrlLvcjmfzN52hDx+VS25upbw2wMhfAYKwIGO/NNvVuLYszQgq2TgnIP1rqStoZPXU3tFjc+H7a9Kq7WjtvAPJQmtK6s7K/hEkcrKSAdpJwSffpXCjxFPBYtaKmzdxkdhU2g2d3qsi2+n3czuTl1BKqo9Se1SqctWyZpSa5dzX0zRjq3iS00m3jaXypRJckchEBzgn1Jr13V9OitIZLq6RQzDaGk6KPYVd8B6DpHhDRPMunjN3J80zZySfSsPXtSfVb1Zz5ccIfCedHlQvbAPfvU3u9CoqyMS01LerwWezYzEAAYGB71z3i69upitlCAGchZWJG0e2fWuj1nU7S0kEUaRzOEztjbIP4jvn6CvP8AWdRmlkkzGsgUFU4PJPX9a1iuopMk1iaC2sIrEEM0eDndyaueBdUudJ1aG4kGIZDhkHU1z2nWF3fXglZWbA3HIx9K27mxl8gXRbATG0A1rotDPfU+ldLnhu7dJoZFdHGRg1qxj+6uF9fWvAvCniubSlhML+Y3V4WOFYf0NexeGvE9lrcG+I+XKDhoifmH+IpAbxPXIINJtAzxz6DmpRtPOMj3OKCQw5PHovekBVkUYJY89gKayYQE/KOw7mrbxfITlYv51NZrYqV8+Qsx6E1zVK6i+VFqN9TNSNs5SJpCeOma1LVNQKJ5URQLkE9K3rT+ztqlMZU8ds1c+UR/u04rNU3Ud3IfNboZMDaguN65A61JLqPk48xM571eYL5eH4LdqpzoHi5Uuq/wHgVuqbitGTczn16MSlDwnqfWiue1+Pa+XCkseAp+4KK53WqQdnqacqZseGhuhOEZVj+7uTav1JrZv20+4tZLS7kWeGRdrRNyuK4FPGV9PczabPaoj2+fMUTqQAOnP0/wp6+LHkG5tPlXsrsgP5YpwrU4qxDjK5DNpkWjNPa2UpazuCZI97Asp7qMdq8z8V2y79wA3lua9B1K7mv7d87baVTuR2BC4+mK818T35jytwBuck5H8QGcke1TKUZfCbQv1OPkklaVyTkMQMewIoklXepOArcDPY/5zTJJYSA6Nwen41E5QxNvJ3elNXNBylBBMA2TtJx+lYt2rMyowyjc4HcU28nkiDqrcY4Oe1UNJunLFZQWDDCE9jXRCFlcxnLoW7Mta3S7f9XMSki+3/1qtadEy3MpkiXCEqp6ZFS2lsJIw0gPBzTjcQtcfPIIo0654J9sVpczSL9hcyxnKWuUJwHLbfyNb15cXsdoojRsEcBTk/rWFZTm9vFMRAgj6npXSWqpEXuT++OMACQMAPy4rKRojgNdaSKbFyWV2/gAqjBLtALBf+BNlh9AKveLna71E/uzgdNvNZdvbO5VFlKMf7gOa1jblId7mrDIjkAo3Pvtyfarlu6ByULgE87iMii1tJYYgkkryf8AXVNw/XkVYit0ZwvlxK2ee6t9fSsZNM2SaOt0iJ0tBItu7oRkhl3D88cV2Wm3V7LYp9kQxxdGXcDj6GuU0OJbYCN7H7Pt/wCWkcrH9Mf1ruLKGOCwa5XfI7dcDANc09tS09Tb0uW0kiAuo2EgHODgVde00+aMva43L/eOa4oeJHs9yzQKI88Bm/ka1NG1f7VcfKXVHH3CuP51Kd9gatuehaOEeyA4+7zg9KxfEEskDT/Z5U+0NCQm7qT6e9a+hLi2CEFWx1B7VzvxDhltrRbuDedvJYkHHuK7Ir3Dmb985W8vWS8tr8Ei0uIxHcpv+649fx71x2uaVN4f1ZDp9uJbDUZd0pL8DPXFbej3Gl3sMukzRu7T5kDScE57VuxWOn6/p4028gkQ2z7UbdycdCDUWNb23OY0fwdNayzNJcLdQyEvF5iDegPUZ71U1zTltmNpJGpViCqkZP4e1etWltb29liUgrEmMkc4rxTUdbU+J9aubk+bFGUjhGc7QASTj+tJxnfQcXEpRaGtzO3+hwxwKDjzYB82fQjmt3R9NsrBCYbXCEZO0ck/zrPttetpMSCXzAB8vOAKdFrsouJJAVSPkBsYpXmtGXaL1Rr3ItuZNlwhH3i2AFFY+o6tA9vlFYspyeQ2Md8Hr9BWdq3jRXt5rSOEAyAgydetcpNqAIHmksFB4zjFbQTe5jLQ6mTUN7Rp9nQxkgOwbJVfU46euB3qytjAZlvYWUxpwkUiYOB654Hb3rz99Smd2O8BQQ20dKkj1e43hTM8hPJNa8pnc6LWdRK3kzooeaVMKsK4Vcdx6/U1WN5qI00W7221XB+YjOPxqWyv4xEZJUVgRk7gP5+lU7rxMxkZY4xIjgKFbBx+VNA9CXw8wivCJAHZlwOcAV0sGom21RSkgiCthWHG3nrxXMW067d8iMXkXAYcAf59qrGSaPAXcfmyvv8AgaGmxJo948NeLn3bNQYyoQMf3lJ7mvRLJJ7lVkgVSrDIb2r5gtH1meBfstnIWQ8lV3Zr3fwT4+tJ7WC11P8A4lt3GNpE42I2B2P9KwnzPQuy6HYvpt7Mw3jPbk0230S7L7JAVJPL56fStSHVSUVlkhlU8ko+ePrVqHU7aYglgq9yTiuf2NJv3mHNLoVrbShCo8yVpCoyPc0+e5vIleGKMsijO7rV0X9s5KW0yD3NR3JLRDypVB6njOfxreNOCXuMi76nNXGtXUO4zKyHoC3Az6VBa+IC26Ocrjrkmr2sRXrQ5EMLY5wWrkLm5VZCJNj8/OggJUfj3rkqOpTluaq0kbl/LFeqNk8SbfmORyw9M+lFcmWRonltJkihZiMBD972BopKu3ug5bbGVY6/4dvJpJPsV5cuo2SzPbBV3j+IAd61W8SWs7R29tbGRWISMqGUlccEnGAajbStQkJtdStrhbZgB5qw7Au32HvW7DpuswoV1DyYYI8ImX+ZxjGVHY9K51GT2QXRmXbaw0ahVtUiXjZJKfnbsM9D9aopBcSSSPNYW0OGwDat5hIPqSKs6z4Km1Q/Z7PUpY43UPLcF2+XHYKMD8aq6f4a07QbgRnxUVuVOWklO4n0BGeKtU2nroF1YzNZ8GWt5HKVhgjuZASWAJYfQnjP1rz3U/BWvQqXgiLRKDkSMARj6evbFfQUNza/ZTGk4MmcldoYDPc0XUVhKn7wB+OSqYBr0YumlqzPmkfHOpzlN9uciUfK47r7GtHStLmtIEuLmIPFKN0ZDcqa9z8QeDfBF7qX2i5spxcuQSI/3QI9wOufXrXn/iTRL7TrC4dIF+yJJiJXGX2//Wq41Yy0iFtbsyXukW2wiLGMdqzLW3SW9xKNxPReg/GoI3uZImkS0mkijJLFYztGOTn0qWCY7oi1wsLTDJk25x9KpJjujoooYopEEMCsgHIQck/XsKme7k+ZDEYBjgA5H6Uy1ltYLby7e73uerEEt9aiuXcxZ86Ru+7aayZojlNRUyX5LneM9BxT7a9jtJCAhXdgZDDI/SquqNIbnCtub0bGKbArCZEuQgBPOccfnW6V0ZN2Z0iatbSgIGIbGASepq9Z211NjNozx54ccY/wq3pNrYNZjZYwEkf6wbSaLS+ltrg24VGjz96I4K/UDqK53a+hum7HRaZDqMcaIhZYR0Eznj8epHtXU2gEttsa7lkf+Ir0HsMnFc3aFBFmWR3Lc7fT8q0bG9nWURQnZu43EcD296xlYaNazsNMW4DyAyyZ4dxlvwzn9K6aG1s7VBJFGN3fPOKwUHkjzNxZu7VJaalcXV9FZRJnJy3AwBSjpoEtT0LS5leNGA25H5VX8RwLcWkkYG7eOaNNcqnkBssvr1qHVZJ1hfkcetdcX7pzNaniuq2zWN9LCJjG6ncsinaCPSm6dr15a3UEss8aS7troDkMK2PF6qyTCWRSxOfug/l3ryW91OTT5SmGCqe5yVNHJzao057bnt2t+LbKLw1Le+aQDHk54IrwpoLk3kuvXLLEJ0YRQhskg9CaqX99qmswrBAjvEWDBe7Gq92NQ05PI1CzuVlXp5owBWkovlsgpSipXkT6ZLIl48eRsYE4NWtSv2WPYsh2jpz0rnDdNIGbBjdOaY0rOF3kkUOF3dg5pXsW1uCcknnPFLE8ErbriTag7DvWdI7eWflx6CmQJvcK2cGtOUycjpbabRGAVsKO5PerRt7Rh5loUYn8cVnW+nhrd3C/Ki5OagaF7cia2kKEfl+IrMrm7i3NrqtzIYRGdvT61v6H4Nu9plvYtq44INV9F1cMwWX5XHYn9RW3qepz21qJFfzo8/MoBx9DVXewrLco3ds1oRCCoQdedxP5VDcukkCESb2XghR09h61QlvvPl84BVOeg/r61JHcFXDnAx2B/mBTJJF1a7iJjttyYPLselb2leM/EFqFV5HljB6OAR/48KpWuoi6IiXTzdSdmiwuB+VbLaablC9xCIXZCQrgFjxwMgVDs9y4nR6R8QWhTfNawgh+WCFT/wCOEfyrs7D4h6VdInnS+TIwyGOGz/KvGWtVSHYXB+bJ2g8HPqcU6NIFgnWRdzDlCOOe9Yygnoaqx77b69Z3SkWuqW5Z+hY4wfoatxarqNrkyjzbf/nomSo/wr5pScpNJ5Uzx4GQAcZ9a3NK1zWNPRnj1ZVjwCvz9R3yBWDw6+yyj6CbxBG8B8kKXx90jr781zeqRXcwNzb6mSxO9oFUAD8e1efxfEFwQk0PmYGfMVAu73IrrPD3jfRrzEMixo5GCpXBpOnJ/ETa2xBPcWyBpLqSVZhwEXOST3BFFaeoaYDbyFJ/tFncDhlAyh/DpRWToyQuZHptpfNOpQljjjdg5J/Cq96qCMxy75HYYUH5gn/16WO7lkURRuU3DAUYB/HHSpUSW2DLHH507HDSSfcQfyzXq8qOcwXstTvLR4I7qO3tIwS7P8uB3GaxvKtdODfZ7R71pZBEk6r5okJx8zccema6/Wv9GsvlZ7pwctEkZKE/h6e/WvNNW1PUV1CSxiu54wpDMLRAvkx57ex5+lebiNDWBel1PT7i9OnRarObnOfKRAQeehxg4qWa7DRSvunh2PsCMgjY+pBJOR9Ko6ZNDKbhYmlMrSEZ8kOy46ZPU9OTxWms8soK7rPecBXIyD65B6CvPNh9oliMqlykhTliDvKn3J4Fa9taWl0iH7KsyIQQXUEeuaNA09tRlYXMySRIQypFHhZT3PPYYror6K5htglpapgDOzOMAetb06Mpe90IlJLQqR6JoyxvHLZQokwYyKq43FupPqTiudvPA/gSG6huY9It98cezYM7SPUj1rYuftaAvPcRl2X5Rnge5rn70j7KYYZHmmz99fWtp15QXKiYxvqcrrvgPS5ILmXQZJra5O5kt8gxlsZCjuBXG3vgrXLK1Sa+hdi7YxBLyPqK9jiJtYlM+wEDgt1JNOS8ZpkRYMvJyOM4Gep9KxjiZLc0sfM3ifSTbsXEcoK9Q8fQ/WsaJFmTLRgleqs+M19ey6bpN/F5Op6dBMpOSGA61kyfCnwFdSzTR6W6TuuAsFwyLn1x2r0KOIUtGZyXU+cNNu2ij8q32g/3UBOPzq7aK/2tZrmNDznLcN+Y6V63efAaCyu7C7t7uS9g84fa7eVtuEPdWHce9amm/DrRrPw7/ZOqsl3cJLJsukG11UkEDI74GOaupyx1bHGfQ4C1vd0YC+WqDnOc/lWhpcjfajcSnCqMIBya9D07wl4Wa0FrDYxRN5ikO33m28dfeurGg6HbJG4s4y0ZIG0YyT1rKKjJc1xudtLHlN3dTLbofLcbyAo2k9f50/Q72XS7uaa4tJUkI+QyLx04JP8ASvW7jT7KUBvJTAHGR0rN1HTIZowdg4OcnuemK19kt0yPaGf4cnWSeK5nxlhuO49Km8R36qSiYGaxdVt/sk4uNzBIxnZnhm9x/Sq6arbagpgbKzrkAOMFsdTTWisJ66nHeIIZLid2Kqc8sdvpXmfibToooXkAGG+YZPXJx/8AXr1fWXwHCg7dpGPWuC8SW7OkhYdR8o9K0i+gnqUdHEen6clwoJZVHI6gdc1s6ne2+p2MMkwWVSAS2P1rlzc70hhX5VA2N24qzHJshms3AEX8BB65qXe5orWRnappljKCUXBHOV4rAuLZY32hsirUl3OLny5G2kZGz1qk90ZVDMNp9K0imTJoqSxl5AmeAa0rG3ik3wE7ZMfKT61UiwzEcD3xU82EmDbvMUEdutW9UZp2NWKR1tzAwIKtllNUJ4zK5aQY/uonQVftmF2PKZ1WbGYpD/EP7p96jnM1q2ya1l/3kGQfxrPVDsZ2oRtbJbzr8rhsD3FdGJnutI8yJMnZ8y+o7/lXO3f2i9dZWgZIIv4T1+tb+lOhtgiPtJHysO31p9ENGE2YyMdfapYsspQkLu6tTb0lLhoXXyyrfMB0/CnoyFQMceoqhI3tGikt1+RXy35Gt46ndeU0QfaSOm88D61zel3UsR/cS+cveKTv9D2rTu1guYHntZNk6cvA4HP/ANf3HWs2aIkd5rgOWZwG6BznFNvCEiiZ+4LMfotN065ia2WZ96oXXIHIBJwR9Kq67dJ9oS3XlYkO73J/+tUlFB5R5i4HQAEetNf5NiA/dHP5mq6FmfgFnY8Ada2rTw14gvtrw6RdFCM7zGVAH1NFi72M7zX4JcnHvTI5HDhlJVgcgjrXX2/gS/jVpNRuIbVEG4qGDMR7dq6rw14Y0KJvMidZ5l6NM36jsKnmUXZkOVyHwLJ4htoA93IYbGbkLKufxx70V0s8t5BHNaRywTKoyMgMy+1FbIxep6ki2UQ82WRUwc4B5qOO+a7ugkJMkMOCI2OAeePxrzq716I3ANndvujOSxGQKW78YGOPy1RjM2DvR1DfU+nWsHiIoOVnS+IriS5tZrfzZ7Z5DtVUfAXnkn1xWRaWOn2z28QaaQwrtjlfJJ929c+npWbomuE3BKySM4XascsW5R75PWusju7hIg5SJWdfldVG5fcelcsoOq7lp8pjz6VPM8arCyWKfcjT5GPvgcmtvT9DsSY/t0rKi/MNpy0n1NP0aSSO4kKuzAjkuOQa07a3jmuSzAeUvLknGa2p4aMdSXNslvNR8mNLfT4FVFG3Crg1B514iyMzlmxnYOSTVh54JJnwoVV6Y4Jps80aDz3PlswIbnhhXQ42RBykEOpPcSS6jG21cu656qOgqtb31mZXaISRJkynI7DgAe/+NN1+7a18y4S4CGQY8ong88f5965CbVTNFKx3ImdgUDlTnr7ivHqrWyOmJtm5bWL2ZFn8vaMrvGAfwrpdNRIYTHJKWG0DryO/WuF0HV7i61EWFxES54jYDaQP/wBVdvaadey+WXkVVHKg8Eiso05PZFNl5peD5eXj43YTke1a1ostqu8qYwemeTUdhE8MceR844bjB49as3b7o2Al2Js69d1dkKEo6mTmiG+1mGOPypr5Y3fhQ3esCZ1n3Tvcfu0GPlOBuPfmuf1mznvbmU21xELpVG7afm25wMDt+FJbWa3qRWojmhazz5okkIJJ6nHT6Vz1JuTsy4qx0O5GiD2q5wQFZun4etXkv54rZEYjOSQT79TzXO3+oLHtigilKRYXAICj3JPAqJ9TW3CS3E8cuRlUL5Jb9OgrNNx2Ktc7O3v1TDPlh3OOKnfU/Mf7uxcccc1xtvqMjzHzZtp4JjXkjPQVtxxuSoC4U/eYNnHtW9KrPZESijO8SapFHuijjLSNwBjNeZanfXFvfokYf7U+UUp/CD1P4d69C1RPtN+UibzkQYHzbUT8utYes6JDAJZ2B4T5jtCceldMnLdkqxm6bqlvqVvKjkCeE7Wz/F71ha9CDG5GOnFZmoSvHHOY5fI8pxtWMY3cHj9axX1HU/speWVCC+FXOTjFbQncHEyr2Fxe7ST1+VfbvSySmRPNdcSwIWUDjdirr3NrNulkIVidq575q08EbwphRkIx+oxWzkCRymr7JQl9AAC2M57VmTrukVgNu4YOPWuqOnJ5bR/wHtWbNZyfZmVkyYG+8O4rSMkTKL3KVtCpA8w7R3qO4b53GOOhP9a0fLdQECcHoxqpKyw3TRyx5VwM5qkyWhkEzxMuTuU8EDtWpa6/JE/lzL5sY/vdRWRNA0e5CpKnlfpUQiYncpyKGkxXaOrm1OwmUsApRhzjr+Irn1uTbXZ8nlMnBFVkLD2pmQHLYxQkkNybLNxPvYM34E9R7VCXU87gp9RVYmQsSRxUtvH5jYxg0yS4lysQUiRWOegFatomqXi7vsMjLtx5p+X5ff1q54dsIcI7RKSO+P1r0SzWNo12qvmL0IHDCob7F6nJ6XpyCPyLidWyfMGwnls9Oa6C18L6RPcedco0zkgyEydPwHar2n2sBvp5WVUjUbVBGRk8n/CrUyWMe5wgSRUGXL4J+nqK56ila6ZakbPh7TdO0hg9vp9vGB/y1Ee4n8TzW4b9baTzIbliz/8ALNgcY/Guds7qUWu2MEsBwrnGKhl1K3uEMfniD+8rnOT7ZrSltciRb1SeVpfOjuA0LnDBF+79c9qyG1EW1yTCIjtzkLJyPqtUrm7MJZFbzomBKkjGD6HH864jWL6czoJpNsqN2GCPxpzSsCO/uhC7HUrC4YFwDJGpxj1/CiuLtdWk2Fll2bsBtv8AhRTTuh2OktXuppWCRiDIwroxHH+0pzVXUIrl3dZZFlY/eAXHHrTWkAgBupnhcnAwNpA+ven2NlHdSrdNItxBG2AXbAPtxya8g0Os+HOhwuWujK07IQPL3EBT6GvQJpZuYSIoh6R8157b6xZW7CC3KxlOCIl25z9K6PTEluZFkkSSNW65bmvQoSTWhlJHWWTKkIVI8n6dT9aV5pGUQJjn+EdPxqjqF28KCGD5ABgZ60Wm2CEI8v74/MzE9PxrrINNVhhQ9GIPJz1NUL24S4BhIdOwwMiql5O7JiAAjrk5z9TWXd3FwkLBijEAnrk/TipYFTxBZWwEomid43UZQP3/ALwPb3rl7aKWabasjNHGNsbtg59mrSubpZYX852QA4HXA/rV3Q4oGjUynCDrs9fXivNnBTqWRsnZGno1hF5sdzhBLEctjt9PaulMZlctEQo6hf8ACstGjgH7iRZFPZvSr0FwkaB3+UnoorshSUdDJu5p2rTxICVJUiq2pKJYWCOYyRxiqk2oLjAfrz70iSedy4DdwQ1atK1hGB4iaS3sxcP5MdwpG2VeN3b9Qelc1deJriSeMW6JHDYkM7N/y0x64/rXXeIYZ3tWkto4pSgyY5TwfofWvNba6nYSWUKos80gaX5Qo29MHivLrU7SOiDujqtO8WW11Ar3MMNqLokM87E557Y7U29gsJbzdGEulUZYxrgp3wD0rEvy32aTSLnT4PPCqsci/KU9CPcfrW1o4uofKtnQ7DxI2Rlz6mublu7Is6TThBIiSRJGse4EKvLfX1q3qdzNHavGgKyOOODwKj0q2ET7kj2A88mr93iZ0BOxh0OMkivTo0uWJzyldmZp9ottaGfG+RemQRtH09c1h67PDHpE11qEZjiBJjhUkeY3bPc4rrbmMNbl5Ttt4lLfKcEn3ryfx3Ne6ipSPc0W/jdk5H4VtOKSEtzzyB2upJ2VSIfMJ2Z557VPcwywIr3H7n5SEhHLDNXdPa3tZPs8cTGVTuIH3Qff1o1qOaFI5WQmW4Y/M3audrU1TOXlSSQpGFC7c87e9TtfzWVsqhHkX7pkbtzV5rZlkRQgGP51sw2UctrsZeDxWsZXFY5YasJcbQSf5VaspxPMYgMl1Oc1VvtHa2um2j5Qe1NgWa1nSVPmbeM+9a6dBq5JDL5SxrIMo42j2IOKZqNrDMqyx/fHT/69NCZlniJJUuzRH8f6is64mmWV2Vjtqra6Et6al1WWeIKy4ZOMVSnKo23pUDzvkc7T3qFpHk5PNWkQ2K8mMhTxSL85pqIWJx0q4saqBjnNAkiLbxwOasW0YYqB1qxDavyccYz9afBDhgQCMHn2qJMpI6bw+jBgpHXpXU27iP5jxu9PWud0k7FQE4PY1uROhyjjOTke1TEpl1XbDbThT19hSahJDDpbFopOONwb5R/hVCa88mPeHwB8pJXP51g6tqEfl+W5Mqv2Riu36U3sI27LWXgg2zMcAd/m3D09qfcXFpsSWCJijH5wcECuOa/aWZR5nmIqgKSMHFTyXsaQE7ipPUVENBsvaxqcEVvNErgpIdvlgkEVyBLlsbiR2yc1Ld3BuJOu/njI5rS0rTS5WSdfovtWlnJk7CaVby3MyLhgg+8cUV1FuiqAkSgKeMiitlBJENiTJbyybm09rhB8pZZDwasW1vbLII4pCsCjcYwGH6k1iJqHn4acv8h5XJGT+FPTU5MkxyyoqnIUvx/KvF5Xsb3Oms7iCG8E0rxGNMBE+7z7nFeh6NLNKEuLkpEjcooPJ/z6144+p3Vy6gTjru/cruJrptB1GAyKZFlZc7fMnkyB6nGc1tRlyOzJkrno09x5lyCXHl5/hPyge5qtdagqSkLGXjHTJxuqoNTgVC6iJ0iGAX4X64rJm12EJJdXyqkTDCY6t/uj0ru5kjKxpXGpSCNpijKOiheAfauaupr6Y+ZJcCCInIXGMCsrVPElqqBreWSNixG5V5HoBnpXNapq5unMRmnRT97c3auedRvRFqJuavf2s1yI0ml9yzfKDXQ+G9Vt4YsFy7FcFWPBrye5kbAEUg8onjcMn8a2/C9/GtykdwSVHYdKyjCz5i3sez2mtosf/Huvswq5cakpjBMgOR02dK5O1v7OONTHAHJpXuhO452Z7V2J6GdjokvkkJM0gIHQEdamW8hcCOPK9zg5rm4VBb/WHH0q7HcLbAmM84wSSKaEa7zoJApZ9v8A016VkXVnCb8XTJGqEFSwTpnuKp6xqaeQzNKBxjGM1jp4hE1mbS3WSRuilwcZ9MmsKqTRUbmgIrtrsuoMxB+R2HQelb2lAWimTyt0jHjPIrnNOv1QHe6LJ0Ks2ee9b1jcyyDKhXQnrXPSpK9y5NnT2KSkq/l4U9cn71WpJEW4CIrOw9O341jRTTFNi7owOhNSwTZc73Jz97ntXoIxHau85tnhVlSMn16/41zU1siOhBI39Sozn61s6g8DRndOW3t8qjtWYsq2xz5bM4PRhQ1cZQj0yxtY7id4QzgH94RjmuB1S4bUtVNwyslpAcRjH3sV3epSJdQeW27bnotcZ4ivrWCyWJXUSbvuIfuisppFRKohMsondQgfkAdqukH7sQGFrDj1MzFCOFXtmta1uA0b89azgaDZ7USKGlGB0yDzWfc2MCxsYpWaQdMLjHvWw2JEyOMciqaod2CeSe4rYRz9zD5UYOP9Vxn27fl/WszUAp/eKBhxu47N3rob8xRxqJTgYIbnqD1xXPXMO1HRWBUfPGc9R/8AXH8qpITZgyMXl28jmrUcTFARSSQZcN3q1BGwGTVtkJEUEYDHcMe9W4IGkJAHIp8UDSZKj6Vft41SMAjDfqKm5ViRTFAvznHGcVAGjSfaJN3f6imySRMJQ/zSKQvXqKpGQfaCVAAHT8qljudTBIGQANzjIrRhnLjeODj865a3uCvzd61YLsLCQx2gjikhl0XQVW+YDHZhxj3rltSu/PuMKoVUPCg52/Q+lS6peq0iqgHPBI/rWdHG0px0BPU9qpkE0GWY4Xv1qSWN8kZ68HNNE6QgpENzdz2p0btI25zk01AVy1Y2yK+8gMw6e1b0B3qAo4HU+tY1rzwo47mta1y4IHEQ/wDHq2SS2INHcGg2r90dW6Z9hRSooKgynA9PSiqA52a3+dpFzj6YqGK2nkbAB2k8npXS2EMd2nllQcdSK2rWwjjAAQE+9eZGLZtdHOw6e5XC4ReOnFa9lbw26hpU8wKPlVR1+taphjX+Hr7UMVVCu3Ax+dWqSQrnNavqs8sZgeTyYxyPlzj0FYV3rd06pbGUMi4IO0ZFa+v2yY3/AMX51xlxC7SPg8DvS5dRl65mnuZklJBMYz0GBj1qM/6l5rlmZ5GzgenrUKQlYhhGzjJyccU2YvKSDkt3HoKLAOM6M4yrkdB82K3bK4MMQVEjjCjqQDWBHCBtJkz3IA/rUolQSBQ2B1IHSk1cD0PRLi7mKmQoq467R09q6aI27jD+WMdcnrXl1nrDgiMu8aZwdg7V0VnPB5RdWLZ/vHGK1g+4mjtHIx5SFNo5JU8AfWse/wBRsLZwp2k5xvL9PwrmZ78MxSJ3DMf4XPNY13ePPcCOSTGP7g3YpykJI6XWtWhX5GZYcrnKtuNYkWpmNBFE7srZxk4xXO31wJbjYrbiP4iDx+FQzTOwAUn6jisXFyK2On028aO+R58yf9Myea7rTNbso9vlxqeeVY15DaTXSEMr5wejVq2mrxJKgYu0g/DBpJOL0G9T2W11aa4lxkBW6bs4FWftYjYtvV85yM4zXGaXqgmgDxZJ6N2rUF5F9nYxFN2OSeK6FK5m0W7rVB5itHgMg+tV4dZhkzuBV+VJft64rnpXMkrASxxsOrM/FY15qttFOFzI5j43DofejmsOx1c1zHBHJJArEbiqZYDORkn9a8x1W9juL1kSHYnPQ5Oc9au6rq32raQjiGMHYgOFye5rnklXzC6Bi3XOetQ3ca0L0Mm1mVPlVRzk1qWF9khR0rnoZAFZ3y2Twv8AWpILlgzOOecfSp5SrncRXCkYDdqjlc7gMkKTwRWDZXgJDMc8gU65v28xUUqwUliSeKtAyTWbhIyYdgfDYG7oDWRFceYojlYEBiVIHA9qivbqWWU5OeeR6/jVSLdsb5/vHOKsglKkMSRgLwRUkZYMARkD+VMEjHKTHI7E9qGZgdrYzjAx6UrsZrW8ihdyDn0qxIpe3aRThiNw/CqFi4KkZwecVYYubVSg55Bp3GZ8h3s2Vw4J/HPeq6rkOx4b0pQxEu3POKFJxjuaTJHwscqMkirjSytGEBwFBwaZBCEUO7BVA5Jqtd6hHtEduM/7RpqLYN2GTOoYM/UjgDvUTTvJxnavTAqvks2WOTTk5rVRsRcspVuA/kKppVuD36D9asRqWgBAZiQnYetbNgAQHc4UdB61jW3QE856Cta1ILAuwCDqaYGksvytI/Cr69qKjibzGSQrtiB/dof1Y0U7gGgXlvCrGY4lPfsK6SO4jdQyEEHnrXBT24UGSIkoOx7VoaDqqxIY5WYkdAf6CuGDtozVo7Euce9RScjk1FFcrKm4cD6U7O6tSTP1CBZIzkZrjtTs5I3LDGM+ld1PtI5FZF9CrqRt61nKPUpM4qV1C7s7mPfNVlk3liWG8/yrQv4RHIygZBqits/mcLUKwwzK56knoAB2pz4U7WG5jxz2q7FaMcJgs35AVfh0Y5G4EnqaVx2Mu1huCf3fC5x8ozXQANBa8ncQPpV6z0wAKoXpzirN3ZBo9vlgH1FFmBxlzcNyN8ir7DvVaORlicl/wNaWo2TxvtyQpOTWVc7UTAyx9fSgRWVwHPVgewNWEiDYOOO4qOC3kkBbAUepNXF2QALsLZ/i/wDrU2xCragxb8hFzx61CIwMMOCT7n8aLuVWIRGLbe2eKjGVOBuJNLUZr6dqTwgxm43ZPAYdTW0NRlaHa8rE+m3IP0rm7C23SI+0O3p6VtiHywZN4VvpnFJOz0GQz+VDEzXM0kzH5lUE8fWsXUtRa4RYliSMDoV6n6+tTayJXkbMjLHgfe6ms3aY+WwfXvVp3EMTznIR2AX19Kegj3bRJuAByV71G8u87VXYPQGmqSrKquBGfQc0xD5QoGU6MMfjTIy0SsNuc9yelRM2XKqwwOlSRK8h+Yn3GKYE9rM4P3QSaJWkLM67flPNXbe0yhz19TTWttu1eeCScU0MygTkttIz+tIoKnaBnPapXjO8dRzxUTN84z8pB6imSTRNnG/ORjHHb0pSCZCD9309KaqyFgB0J/Or8FqzEZBHNIaHWkLbeOnXNLMZUyhO01fRBGvFUb2eIZd2AA600mNlOOEyOSBzmiSaC1LA/vZeyjoPrVWe/kbKQHy0A7dTVHcTyTz61qo9zO5ZmuZZm3O3TgAdBUXfOaYDThzViHqc+wqRcCowQKkTg0ATx1cg65NU46uRHA/nTA0YTyDWnbYnO0j92n3iO5/uisq0+d+W2gdSf4R/jW1bFYowEwmeRn+Af3j70xGgGUb5Jx8ikbgvf0QUVHBmUxsBhE/1at/Ee7GigCpnHTpVaaxeRt1onzd1BxV9Yf735VPCTG4KjA749K5JJM2K2nXlxAixSxOCOpNbP2xVXlhn0zU8MUN9G/ynK9DWbqmntEuVVmNKLaWorC3F9ujZgeneuek1aczkbfk9cZqrevOh2tlVPQN1qg2ZOSSMd6TlcDRu72KRwdhHqx/wq1p4tpXHO5sZIFYEjEcdvc1Na3E0RIikEYPXipt1A7KCKJW4AGauxhB3wK5+wvyCMkEd2bittJldAQcj1rRWAtfalQFY12n+93NJ55K8Jlj/ABGoogGPAGKlDBVPP4UwKU8UUhYyDNc7qtgUbcFwOtdNK4U7iAT6VTuE+0OWdgqDsalxC5x0hmHXhAelR4LN82c/XmtTUo4zIRHzj06VnwxNJJjJ61mMgWEu5Cp071pWlpJJt4OTxmrlvYMoyBkmti0hSNRgClqxjbHT9hA9sVomzjRMscn+VMD7RxgChnZwu5jgdK0UUgMLVbITyEqDt9R1rn7u1ZCwUHAPrzXaTtsUgEc1jXUSsCxxgclR3oaA5UjaSepHpSEFhnHJ4NW7iMMwGABntU1va7yCTwB0pk2KUduWfAHXkVt2NltCliOKltrVE+bHNXlK4x2p2KFSJRgHpUF1D5inBwBVreOvbtVWeeNVAYgliaqwjIurUptJ6N2qoLZvM2le9Xry6LzZYYCLke9VlukEod2H0JpWEaVvAgCnaKtnaBzgcVjS61bRkBcuVBGB0rGu9Vurk4LbV9Fq1ETkbWo6tHATGmHfGK56WeSZ90jZ5z9Khzk5JznvS1pYm49TjpTvl79ajpwpiHjFOBqMdacD270wJF/WpFqJamSgCePrVyAEkBeSen+NVIgc8VoWyjG5uV6cdWPoKBF+2UJs2jdz8v8AtN6/StBAZdwLZijO6V/7zelU4QysYxgSsPmbtEvpWhCFWNI4l3An92h/iP8AePtVIC4GL/KRgEDzCvYdkFFOtwsYALkhDkn+83rRQA8J604JUypTglcZ0C2crW8gcZI7j1rcliiuLYTKT81Ye2rNq7xMOWKA525oT7ktXMbVra3NwUkjwx/iFc7e2JjbKsCo9K7PWofOiDqADgk8VyzNIiGJ1OzNZvcDEcFpCNv50w7wSONo9a0DHh2YVLBZLNEZO5OBnvQgMqKZwwJLHHatrTdRJIQuW9ielNGkvg5GPpUsGkFfmIxjtTTYG1BepHjc3J6Y5pt1fiMhVG9z0UDNZ3ksi+h9qoXs8iFiAwPQH2q+YVjR1C/MMG9/lf0rOTUiyb5ZMnptrIubmSYbCSQvrTY16se1K4Fu7vTKpblQTwg4p9jMkUfmt1P3c1Ql+ZgTwOtMkkZgqngHt7UgOwtbhJI1Vfmz1NXBMgwgPTriuRtr1oYdinHPWtSK8GVII56+wqkM2XlwKiMpPzOxJ9PSqE96m0vn5V/U1mtqYZTycnk4qkhXNieYAZLde3pWVNfIQWDfLz0rOvNQd12qdinjHeqatiNgTx6e9Aiea4LnKjGeg9BU1lOw4zyT1rPeaKMEs4JHHFRrqEatkKeKXK2FzrRIBGD2/nThMoVmdgFFchJrFwcBAAoHGapTXU8py8rfTNaKImzrLzW4lCrG6krWHc6rvOUUnPXNZJ5NLVcorluW+mcenvVdmLElmJJptFOwhaUUlLQAopw96SgUAOHJp1Npw+vNADhSj0po4FOFMB61PHUKDjJ6VPH15FAFmEAcnp7d6vW5kEo8sZkxxjooqrCpZgo+96+grRhCxKFUEo3XHV/b6VSEWrfCrxllzz6yN6fStqziO9mc/vCPmI7f7IrMtI8MSSN2MDH8PsK0ozhVRTgDljmmBMXGGPUUVCSZCFQHaDx7migDXC5qRUz0FFFcR0EqQ+1TJD2oooAlEAxgis7U9ES7X5G8oAdh1oootcDnb3RJLNfnckYJz2qnA2yRVIyo4A9KKKzejEbEcocbwAMngUyaYKdgYEn0ooreOxDGxKvVmBJPSq+oQxtG2QMiiim0gObltDk7R1qBopBkFaKKiwxCjZJ25JpggdnztoooSAmazl4PSn4WHClskUUVaihXILnULeNWViSx6AVk3F7uP7kbRjnNFFXyom5VMshOS5JzmkaR2OWYmiimIbRRRTAKKKKACloooABS0UUALSiiigBRS0UUAOFKOKKKAFHqaevPJ6CiimBKvvVmJSW2qMk0UUwL0KiNf9noSOre1aNsrbueGI5P9weg96KKpCNS3UfcUAkDAGf0qXKuD8+1V6kfxf8A1qKKALCOYotzgl/4V7qD/U0UUUAf/9k=';
  var LINES = [
    'Fluffing the cushions…',
    'Dimming the lights…',
    'Popping the popcorn…',
    'Chasing the remote under the sofa…',
    'Warming up the projector…',
    'Finding the comfy blanket…',
    'Shooing the cat off the remote…',
    'Rolling out the red carpet…',
    'Queueing up something good…',
    'Putting the kettle on…'
  ];
  var greeting = 'Welcome to IvanaFin';

  var style = document.createElement('style');
  style.textContent = [
    '.ivf-welcome{position:fixed;inset:0;z-index:2147483000;background:#000;display:flex;flex-direction:column;align-items:center;justify-content:center;',
    'gap:4vh;opacity:1;transition:opacity .45s ease;font-family:inherit;color:#fff;pointer-events:none}',
    '.ivf-welcome.ivf-out{opacity:0}',
    '.ivf-welcome-glow{position:absolute;width:95vh;height:95vh;border-radius:50%;background:radial-gradient(circle,rgba(0,164,220,.18) 0%,transparent 65%);',
    'animation:ivfGlow 3s ease-in-out infinite}',
    '.ivf-welcome-cat{position:relative;width:44vh;height:44vh;border-radius:50%;background:center/cover no-repeat;',
    'box-shadow:0 0 0 .8vh rgba(255,255,255,.9),0 1.5vh 6vh rgba(0,0,0,.8);animation:ivfBreathe 2.6s ease-in-out infinite, ivfIn .6s ease-out both}',
    '.ivf-welcome-hi{position:relative;font-size:8.5vh;font-weight:700;letter-spacing:.02em;animation:ivfIn .6s .15s ease-out both}',
    '.ivf-welcome-line{position:relative;font-size:4.2vh;opacity:.8;min-height:5.4vh;animation:ivfIn .6s .3s ease-out both;transition:opacity .3s}',
    '.ivf-welcome-dots{position:relative;display:flex;gap:2vh;margin-top:1.5vh;animation:ivfIn .6s .45s ease-out both}',
    '.ivf-welcome-dots span{width:2.2vh;height:2.2vh;border-radius:50%;background:#fff;animation:ivfDot 1.2s ease-in-out infinite}',
    '.ivf-welcome-dots span:nth-child(2){animation-delay:.15s}',
    '.ivf-welcome-dots span:nth-child(3){animation-delay:.3s}',
    '@keyframes ivfBreathe{0%,100%{transform:scale(1)}50%{transform:scale(1.05)}}',
    '@keyframes ivfGlow{0%,100%{transform:scale(.9);opacity:.7}50%{transform:scale(1.1);opacity:1}}',
    '@keyframes ivfDot{0%,80%,100%{transform:translateY(0);opacity:.35}40%{transform:translateY(-2vh);opacity:1}}',
    '@keyframes ivfIn{from{opacity:0;transform:translateY(2vh)}to{opacity:1;transform:none}}'
  ].join('');
  (document.head || document.documentElement).appendChild(style);

  var el = staticEl;
  if (!el) {
    el = document.createElement('div');
    el.className = 'ivf-welcome';
    el.innerHTML = '<div class="ivf-welcome-glow"></div>' +
      '<div class="ivf-welcome-cat" style="background-image:url(\'' + CAT + '\')"></div>' +
      '<div class="ivf-welcome-hi"></div>' +
      '<div class="ivf-welcome-line"></div>' +
      '<div class="ivf-welcome-dots"><span></span><span></span><span></span></div>';
    document.documentElement.appendChild(el); // outside <body>, which the app rebuilds while starting
  }
  var hi = el.querySelector('.ivf-welcome-hi');
  var lineEl = el.querySelector('.ivf-welcome-line');
  hi.textContent = greeting;
  var lineIdx = Math.max(0, LINES.indexOf(lineEl.textContent));
  if (!lineEl.textContent) { lineIdx = Math.floor(Math.random() * LINES.length); lineEl.textContent = LINES[lineIdx]; }
  var lineTimer = setInterval(function () {
    lineEl.style.opacity = '0';
    setTimeout(function () {
      lineIdx = (lineIdx + 1 + Math.floor(Math.random() * (LINES.length - 1))) % LINES.length;
      lineEl.textContent = LINES[lineIdx];
      lineEl.style.opacity = '';
    }, 300);
  }, 2200);

  var start = window.__ivfWelcomeStart || Date.now(); // the Samsung app records when it was opened
  var fontsReady = !(document.fonts && document.fonts.ready);
  if (!fontsReady) document.fonts.ready.then(function () { fontsReady = true; });

  function tilesReady() {
    var tiles = document.querySelectorAll('.homeSectionsContainer .ivf-tile');
    if (!tiles.length) return false;
    for (var i = 0; i < tiles.length; i++) {
      if (!tiles[i].querySelector('.ivf-tile-img.ivf-on')) return false;
    }
    return true;
  }

  var done = false;
  function finish() {
    if (done) return;
    done = true;
    clearInterval(lineTimer);
    el.classList.add('ivf-out');
    setTimeout(function () { el.remove(); style.remove(); }, 500);
  }
  (function tick() {
    if (done) return;
    var t = Date.now() - start;
    var discover = !!document.getElementById('je-native-tab-btn-recommendations') || t > 4500;
    if ((t > 5000 && fontsReady && tilesReady() && discover) || t > 10000) { finish(); return; }
    setTimeout(tick, 100);
  })();
})();

} catch (e) { console.error('IvanaFin script welcome-screen failed:', e); } })();
})();
