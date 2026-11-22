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
