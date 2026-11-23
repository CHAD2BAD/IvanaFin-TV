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
      // (round 7: the window changed size with every planet as you moved Left/Right - one steady size, the hint line at its foot)
      '.ivf-pl{min-height:' + d(400) + '}',
      '.ivf-pl-txt{flex:1;min-width:0;display:flex;flex-direction:column}','.ivf-pl-foot{margin-top:auto !important}',
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
