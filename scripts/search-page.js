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
