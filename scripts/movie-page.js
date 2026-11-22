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
