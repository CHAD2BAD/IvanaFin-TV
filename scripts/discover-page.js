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
      ':root{--ivf-dp:calc(100vw / 960)}@media (max-width:760px) and (orientation:portrait){:root{--ivf-dp:calc(100vw / 280)}}@media (max-height:500px) and (orientation:landscape){:root{--ivf-dp:calc(100vw / 640)}}',
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
      '.ivf-dsc-sub .dot{margin:0 ' + u(8) + ';opacity:.8}.ivf-dsc-sub .ivf-dd-tomato{width:1em;height:1em;vertical-align:-0.12em;margin-left:' + u(4) + '}',
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
      '.ivf-dsc-search{display:flex;justify-content:center;padding:' + u(8) + ' ' + u(Z.padX) + ' ' + u(10) + ';flex:none}',
      '.ivf-dsc-search input{width:calc(' + d + ' * 380);max-width:100%;box-sizing:border-box;padding:calc(' + d + ' * 9) calc(' + d + ' * 18);border-radius:999px;',
      'border:calc(' + d + ' * 1) solid rgba(255,255,255,.25);background:rgba(255,255,255,.1);color:#d1d5db;font:inherit;font-size:calc(' + d + ' * 13);outline:none}',
      '.ivf-dsc-search input:focus{border-color:#fff;background:rgba(255,255,255,.16)}',
      // grids (Movies, TV Shows, Search, Requests), once scrolled: posters fade out under the tabs / search box instead
      // of being cut at a hard line (round-5 beta, web search; round 6: Samsung + web Movies grid too)
      '.ivf-dsc-scroll.ivf-dsc-scd:not(.ivf-dsc-rows){-webkit-mask-image:linear-gradient(to bottom,transparent ' + u(14) + ',#000 ' + u(44) + ');mask-image:linear-gradient(to bottom,transparent ' + u(14) + ',#000 ' + u(44) + ')}'
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
  function showHero(item, card) {
    var hero = root.querySelector('.ivf-dsc-hero');
    if (card) prefetchNear(card);
    if (!hero || !item || heroFor === item) return;
    heroFor = item;
    hero.innerHTML = '<h2>' + esc(titleOf(item)) + '</h2>' +
      '<div class="ivf-dsc-sub">' + heroSub(item) + '</div>' +
      (item.overview ? '<div class="ivf-dsc-ov">' + esc(item.overview) + '</div>' : '');
    if (!TV) fitHero(hero);
    setBackdrop(item);
    // the "year • 7.7★ • 94%🍅" line waits (up to 0.8 s) for the ratings so it appears whole - the %
    // came a moment after the rest (they are usually ready: the neighbours are fetched ahead, below)
    var sub = hero.querySelector('.ivf-dsc-sub'), key = typeOf(item) + item.id;
    function redraw() { if (heroFor === item && sub.isConnected) { sub.innerHTML = heroSub(item); sub.style.visibility = ''; } }
    if (!(critics[key] && critics[key].done)) {
      sub.style.visibility = 'hidden';
      setTimeout(function () { if (heroFor === item) sub.style.visibility = ''; }, 800);
    }
    fetchCritic(item, redraw);
  }
  // the titles either side of the selected card, so their ratings are ready when you move there
  function prefetchNear(card) {
    var n = card, p = card;
    for (var i = 0; i < 3; i++) {
      n = n && n.nextElementSibling; p = p && p.previousElementSibling;
      if (n && n._item) fetchCritic(n._item);
      if (p && p._item) fetchCritic(p._item);
    }
  }
  // "year • 7.6★ • 83%🍅": TMDB rating + Rotten Tomatoes critics score (fetched once per title, kept)
  var critics = {};
  function heroSub(item) {
    var bits = [];
    var y = yearOf(item); if (y) bits.push(esc(String(y)));
    var c = critics[typeOf(item) + item.id] || {};
    // the title's own page's TMDB number once known (Discover's lists carry an older copy: Hexed 6.8 vs 8.2)
    var va = c.va != null ? c.va : item.voteAverage;
    if (va) bits.push(va.toFixed(1) + '★');
    if (c.rt != null) bits.push(c.rt + '%' + tomato(c.rt >= 60));
    return bits.join('<span class="dot">•</span>');
  }
  // both asked at once, once per title; [done] runs when both have answered (or failed)
  function fetchCritic(item, done) {
    var type = typeOf(item), key = type + item.id, c = critics[key];
    if (c) {
      if (done) { if (c.done) done(); else c.waiting.push(done); }
      return;
    }
    c = critics[key] = { waiting: done ? [done] : [], left: 2 };
    function one() { if (--c.left > 0) return; c.done = true; c.waiting.forEach(function (f) { f(); }); c.waiting = []; }
    get(type + '/' + item.id).then(function (m) {
      if (m && m.voteAverage != null) c.va = m.voteAverage;
      one();
    }, one);
    get(type === 'movie' ? 'movie/' + item.id + '/ratingscombined' : 'tv/' + item.id + '/ratings').then(function (r) {
      var rt = r && (r.rt || (r.criticsScore != null ? r : null));
      if (rt && rt.criticsScore != null) c.rt = rt.criticsScore;
      one();
    }, one);
  }
  // Web: shrink the overview text (down to 70%) until title + overview fit in the header
  function fitHero(hero) {
    var ov = hero.querySelector('.ivf-dsc-ov');
    if (!ov) return;
    ov.style.fontSize = ''; ov.style.display = ''; ov.style.webkitLineClamp = ''; ov.style.overflow = '';
    var base = parseFloat(getComputedStyle(ov).fontSize) || 14, size = base;
    while (hero.scrollHeight > hero.clientHeight + 1 && size > base * 0.7) {
      size -= base * 0.05;
      ov.style.fontSize = size + 'px';
    }
    // still too long at 70%: end it cleanly with "..." on the last line that fits (round 9: half a line
    // showed under the next row's heading)
    var over = hero.scrollHeight - hero.clientHeight;
    if (over > 1) {
      var lh = parseFloat(getComputedStyle(ov).lineHeight) || size * 1.4;
      var lines = Math.max(1, Math.floor((ov.offsetHeight - over) / lh));
      ov.style.display = '-webkit-box'; ov.style.webkitBoxOrient = 'vertical'; ov.style.webkitLineClamp = String(lines); ov.style.overflow = 'hidden';
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
        // the first titles of each row: their ratings are ready when the selection gets there
        items.slice(0, 4).forEach(function (i) { fetchCritic(i); });
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
    root.addEventListener('mouseover', function (e) { var c = e.target.closest('.ivf-dsc-card'); if (c && c._item && tab === 0 && !c.closest('.ivf-dd')) showHero(c._item, c); });
    root.addEventListener('focusin', function (e) {
      var c = e.target.closest('.ivf-dsc-card'); if (!c || c.closest('.ivf-dd')) return;
      if (c._item && tab === 0) showHero(c._item, c);
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
      // web (round 7): with a mouse nothing is selected, so a lone download icon didn't say what it does -
      // the first (main) button always shows its name
      TV ? '' : '.ivf-dd-btn:first-child .lbl{max-width:' + v(200) + ';padding:0 ' + v(6) + ' 0 ' + v(2) + '}.ivf-dd-btn:first-child:not(:hover){background:rgba(255,255,255,.12)}',
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
    // (round 7: TMDB listed a studio named "about:blank" - junk names are skipped)
    (list || []).forEach(function (x) { var n = x && x.name; if (n && !/^(about:blank|null|undefined|n\/a)$/i.test(n.trim()) && !seen[n]) { seen[n] = 1; out.push(n); } });
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
    // the Rotten Tomatoes score: asked at the same time as the page (usually already fetched for the
    // Discover header), and the info line waits for it (up to 1 s) so it appears whole
    if (first) fetchCritic({ id: id, mediaType: type }, function () {
      var c = critics[type + id];
      d.rating = c && c.rt != null ? { critic: c.rt } : null;
      d.ratingDone = true;
      var q = d.el.querySelector('.ivf-dd-quick');
      if (q && d.data) { q.innerHTML = quickHtml(d); q.style.visibility = ''; }
    });
    get(type + '/' + id).then(function (data) {
      if (details.indexOf(d) < 0) return;
      d.data = data;
      renderDetails(d, first);
      if (first && !d.ratingDone) {
        var q = d.el.querySelector('.ivf-dd-quick');
        if (q) { q.style.visibility = 'hidden'; setTimeout(function () { q.style.visibility = ''; }, 1000); }
      }
      checkCancel(d);
      if (first) startPolling(d);
      if (!first) return;
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
    // ★ = the TMDB rating everywhere (Discover header, title page, library pages); Rotten Tomatoes as the 🍅 %
    if (m.voteAverage) bits.push(m.voteAverage.toFixed(1) + '★');
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
