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
