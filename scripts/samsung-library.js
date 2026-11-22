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
