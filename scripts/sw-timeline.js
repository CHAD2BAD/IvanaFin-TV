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
      TV ? '' : '.ivf-swt-btn:focus:not(:focus-visible):not(:hover){background:rgba(14,14,14,.9);color:#d1d5db}',
      // phone app layout: the button alone in Jellyfin's second bar
      TV ? '' : '.ivf-swt-tb{justify-content:center !important;min-height:52px !important}.ivf-swt-tb > :not(.ivf-swt-bar){display:none !important}' +
        '.ivf-swt-tb .ivf-swt-bar{position:static;transform:none}.ivf-swt-tb .ivf-swt-btn{min-height:36px;padding:6px 16px;font-size:14px;line-height:20px;background:rgba(255,255,255,.12)}' +
        '.ivf-swt-tb .ivf-swt-btn .material-icons{font-size:18px}body:has(.ivf-swt-tb) [class*="alphaPicker"]{display:none !important}'
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
      return ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid + '/Items', Object.assign({ ParentId: id, Recursive: true, IncludeItemTypes: 'Movie,Series', Fields: 'ProviderIds,PremiereDate', EnableImages: false, EnableUserData: false }, q)))
        .then(function (r) { return (r && r.Items) || []; });
    }
    libs[id] = items({ SortBy: 'Random', Limit: 60 }).then(function (sample) {
      var n = sample.filter(function (x) { return sw.place(x); }).length;
      if (n < 3 || n < sample.length * 0.75) return null;
      return items({}).then(function (all) {
        var map = {};
        // release dates too: the page isn't always in release order (the phone app's layout sorts by name)
        var dates = {};
        Object.defineProperty(map, '_dates', { value: dates });
        all.forEach(function (it) {
          var pl = sw.place(it); if (pl) map[it.Id] = { key: pl.k, label: pl.year };
          var t = it.PremiereDate ? Date.parse(it.PremiereDate) : NaN; if (!isNaN(t)) dates[it.Id] = t;
        });
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
      if (!tl) {
        var ta = data._dates && data._dates[a.getAttribute('data-id')], tb = data._dates && data._dates[b.getAttribute('data-id')];
        if (ta != null && tb != null && ta !== tb) return ta - tb;
        if (ta != null && tb == null) return -1;
        if (tb != null && ta == null) return 1;
        return a._ivfIndex - b._ivfIndex;
      }
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
      // timeline: titles outside the story (extras, documentaries, Visions) say so - round 7: a blank
      // line looked like missing data
      var want = tl ? (d && d.label ? d.label : 'Not in the timeline') : c._ivfYear;
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
    // Jellyfin's newer (phone app) layout: its second bar (library name, view, sort, filter, page arrows)
    // becomes just this button, centred (user 2026-11-22)
    var tb = head.matches('header.MuiAppBar-root') && head.querySelectorAll(':scope > .MuiToolbar-root')[1];
    if (tb) {
      if (bar.parentNode !== tb) tb.appendChild(bar);
      tb.classList.add('ivf-swt-tb');
      return;
    }
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
    Array.prototype.forEach.call(document.querySelectorAll('.ivf-swt-tb'), function (t) { t.classList.remove('ivf-swt-tb'); });
  }

  function check() {
    if (typeof ApiClient === 'undefined' || !ApiClient.getCurrentUserId || !ApiClient.getCurrentUserId()) return;
    if (!/^#\/(list|movies|tv|mixed)/.test(location.hash || '')) { removeFromHeader(); return; }
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
