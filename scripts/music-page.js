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
      ':root{--ivf-dp:calc(100vw / 960)}@media (max-width:760px) and (orientation:portrait){:root{--ivf-dp:calc(100vw / 280)}}@media (max-height:500px) and (orientation:landscape){:root{--ivf-dp:calc(100vw / 640)}}',
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
      // (round 7: the tab names and Jellyfin's icons vanished over bright artist photos)
      R + '.nv:not(:focus){text-shadow:0 1px ' + d(4) + ' rgba(0,0,0,.85)}' + R + '.nv:not(:focus) .material-icons{filter:drop-shadow(0 1px ' + d(2) + ' rgba(0,0,0,.85))}',
      'html.ivf-music-on .skinHeader .headerButton,html.ivf-music-on header.MuiAppBar-root button{filter:drop-shadow(0 1px 3px rgba(0,0,0,.9))}',
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
      // (round 8: tabs still hard to read over pale artist photos - darken the photo's top under the bar)
      R + '.hart:not(.sq):not(.liked)::after{content:"";position:absolute;left:0;right:0;top:0;height:60%;pointer-events:none;background:linear-gradient(rgba(0,0,0,.75),rgba(0,0,0,.35) 45%,rgba(0,0,0,0))}',
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
      R + '.cd.ar .o{position:static;background:none;text-align:center;padding:' + d(14) + ' 0 0;font-weight:500;text-shadow:none}',
      // (round 7: the selected circle grows and its ring covered the name; long names stay on one line)
      R + '.cd.ar .o span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
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
      R + '.cd .ln{display:block;margin-top:' + d(10) + '; /* round 7: room for the grown cover ring */ font-size:' + d(11) + ';font-weight:500;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
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
      R + '.pop{margin:' + d(18) + ' 0 0}' + R + '.pop h2{font-size:' + d(16) + ';color:#fff;margin:0 0 ' + d(6) + ' ' + d(40) + '}',
      R + '.pop.cl .tr:nth-child(n+6){display:none}',
      R + '.pop .bt.sm{margin:' + d(6) + ' 0 0 ' + d(40) + '}',
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
      R + '.mx .mt{position:absolute;left:0;right:0;top:0;padding:' + d(8) + ';font-size:' + d(MU_TYPE.card) + ';line-height:1.2;font-weight:700;text-shadow:0 1px ' + d(3) + ' rgba(0,0,0,.85);padding-bottom:' + d(22) + ';background:linear-gradient(rgba(0,0,0,.9),rgba(0,0,0,.78) 60%,transparent); /* round 5+7: names over busy covers */z-index:1}',
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
      R + '.qr{display:flex;align-items:center;gap:' + d(8) + ';width:100%;height:' + d(44) + ';margin-left:' + d(-10) + ';padding:0 ' + d(10) + ';border-radius:' + d(4) + ';box-sizing:border-box}',
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
      R + '.nv:focus-visible{background:#fff;color:#000;box-shadow:none}' + R + '.nv:hover{color:#fff}' + R + '.nv:focus:not(:focus-visible){background:none;color:rgba(255,255,255,.6)}' + R + '.nv.on:focus:not(:focus-visible){color:#fff}',
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
    // Phone (2026-11-22): 16px side margins, tabs left-aligned with no spacer, the album cover smaller
    // with the title below it, 2 shortcut columns
    if (!TV) css = css.concat([
      '@media (max-width:760px) and (orientation:portrait){',
      [' .top', ' .hero', ' .sg', ' .row h2', ' .lh', ' .strip', ' .gd', ' .acts', ' .about', ' .bvh', ' .bwg', ' .bwh', ' .empty', ' .lt', ' .sbox', ' .sortm']
        .map(function (c) { return R.trim() + c; }).join(',') + '{padding-left:16px !important;padding-right:16px !important}',
      R + '.top::after{display:none}',
      R + '.top{flex-wrap:wrap;height:auto;gap:8px}',
      R + '.mini{width:100%;order:2}',
      R + '.nav{justify-content:flex-start;gap:4px}',
      R + '.hero{max-width:none;min-height:0;padding-bottom:16px}',
      R + '.hart{width:100%}',
      R + '.hart.sq{width:42vw;height:42vw;right:16px;top:calc(var(--ivf-mu-hd,0px) + 64px)}',
      '#' + ROOT_ID + ':has(.hart.sq) .hero{padding-top:calc(42vw + 80px)}',
      R + '.sg{grid-template-columns:repeat(2,minmax(0,1fr))}',
      R + '.pop{margin-left:0;margin-right:0}' + R + '.pop h2{margin-left:16px}' + R + '.pop .tl,' + R + '.tl{padding-left:6px;padding-right:6px}',
      '}'
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
    if (tapes.length >= 2) out.push({ key: 'tapes', name: 'Mixtapes Mix', sub: tapes.length + ' mixtapes', covers: shuffle(tapes).slice(0, 4).map(function (a) { return a.Id; }), albumIds: tapes.map(function (a) { return a.Id; }) });
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
      // Jellyfin only matches names: 'radiohead' found the artist but none of its albums or songs
      // (round 7). Add the matched artists' own albums and songs after the name matches.
      var ids = r[1].slice(0, 3).map(function (x) { return x.Id; }).join(',');
      if (!ids || t !== viewToken) return r;
      return Promise.all([
        getItems(q({ AlbumArtistIds: ids, Limit: 30 })),
        getItems({ ParentId: lib.id, IncludeItemTypes: 'Audio', Recursive: true, ArtistIds: ids, SortBy: 'PlayCount,SortName', SortOrder: 'Descending', Limit: 30, Fields: 'RunTimeTicks' })
      ]).then(function (x) {
        function add(list, more) { var seen = {}; list.forEach(function (i) { seen[i.Id] = 1; }); return list.concat(more.filter(function (i) { return !seen[i.Id] && (seen[i.Id] = 1); })).slice(0, 30); }
        return [add(r[0], x[0]), r[1], add(r[2], x[1])];
      }, function () { return r; });
    }).then(function (r) {
      if (!r || t !== viewToken) return;
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
        var a0 = by.filter(function (a) { return !used[a.Id] && !used[a.ImageTags.Primary]; })[0] || by[0];
        if (a0) { used[a0.Id] = used[a0.ImageTags.Primary] = 1; pic = cover(a0, 160); } // (by picture too: Bully and BULLY EP share a cover)
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
  function queueAlbumAfter(tid) {
    ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid() + '/Items/' + tid)).then(function (t) {
      if (!t || !t.AlbumId) return;
      return ApiClient.getJSON(ApiClient.getUrl('/Users/' + uid() + '/Items', { ParentId: t.AlbumId, IncludeItemTypes: 'Audio', Recursive: true, SortBy: 'ParentIndexNumber,IndexNumber,SortName' })).then(function (r) {
        var all = ((r && r.Items) || []).map(function (x) { return x.Id; }), i = all.indexOf(tid), rest = i >= 0 ? all.slice(i + 1) : [];
        if (!rest.length) return;
        var tries = 0, timer = setInterval(function () {
          var m = pm(), p = m && m.getCurrentPlayer(), st = p && m.getPlayerState(p), cur = st && st.NowPlayingItem;
          if (cur && cur.Id === tid) {
            clearInterval(timer);
            if (playFrom) rest.forEach(function (x) { playFrom.ids[x] = 1; });
            try { m.queue({ ids: rest, serverId: ApiClient.serverId() }, p); } catch (e) {}
            setTimeout(function () { loadQueue(); }, 500);
          } else if (++tries > 40) clearInterval(timer);
        }, 250);
      });
    }, function () {});
  }
  function playRow(el) {
    var tid = el.getAttribute('data-id');
    if (tid === now.id) { ctl('pp'); return; }
    var list = (view.data && view.data.tracks) || [];
    // (a song from Search: start it at once - the TV only lets audio start inside the key press - then queue the
    // rest of its album after it, so Next and Up next work; round 8: Next did nothing, Up next was empty)
    if (view.v === 'search') { playTracks([tid], 0); queueAlbumAfter(tid); return; }
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
    var from = npReturn && page.contains(npReturn) ? npReturn : null;
    npOpen = false; np.classList.remove('on'); npReturn = null;
    go({ v: 'artist', arg: id }, 'nohist');
    // Back from this artist: select the card/row that started the music (round 7: the focus was in
    // Now Playing, so nothing was remembered and Music Home selected its first card)
    if (from && stack.length && !stack[stack.length - 1].focusKey) stack[stack.length - 1].focusKey = keyOf(from);
  }
  function closeNow() {
    npOpen = false;
    np.classList.remove('on');
    np.classList.remove("ss", "ly");
    document.documentElement.classList.remove("ivf-mu-ss");
    moveJfHeader(page.scrollTop);
    var m = topEl.querySelector('.mini'), r = npReturn;
    npReturn = null;
    // opened by starting a song: back to that song's row (or the button that started it); if the
    // music has moved on to another song of this list, that song's row (round 7, LG)
    var cur = page.querySelector('.tr.on');
    if (cur && (!r || !page.contains(r) || r.classList.contains('tr'))) r = cur;
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
      if (h.style.transform) return; // moved up with a scrolled page: not its real height
      top = Math.max(top, Math.round(h.getBoundingClientRect().bottom));
    });
    // Jellyfin hides its bar for a moment while a page changes: measuring then gave 0 and the whole
    // page dropped ~74 px a moment later (round 7). Keep the last real height instead.
    if (top > 0) { lastHd = top; try { sessionStorage.setItem('ivf-mu-hd', top); } catch (e) {} }
    else top = lastHd;
    root.style.setProperty('--ivf-mu-hd', top + 'px');
  }
  var lastHd = 0; try { lastHd = +sessionStorage.getItem('ivf-mu-hd') || 0; } catch (e) {}
  if (!lastHd && !TV) lastHd = 74; // Desktop (legacy) bar height at 1080p, until the first real measurement
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

// Remote media keys in Music (round-7 beta, LG: Play/Pause on the remote did nothing on Now Playing).
// Handled here, before Jellyfin, so they work whatever the TV's browser does with them:
// Play 415 / Pause 19 / Play-Pause 10252 (Samsung) or 179 / Stop 413 / Next 417 (FF) / Previous 412 (REW)
(function () {
  window.addEventListener('keydown', function (e) {
    var M = window.IvfMusic, root = document.getElementById('ivf-music');
    if (!M || !root || root.classList.contains('ivf-off')) return;
    var k = e.keyCode, key = e.key || '';
    var act = k === 415 || key === 'MediaPlay' ? 'play' : k === 19 || key === 'MediaPause' || key === 'Pause' ? 'pause'
      : k === 10252 || k === 179 || key === 'MediaPlayPause' ? 'pp' : k === 413 || key === 'MediaStop' ? 'stop' : '';
    if (!act) return;
    var m = M.pm && M.pm(), p = m && m.getCurrentPlayer && m.getCurrentPlayer();
    if (!m || !p) return;
    e.preventDefault(); e.stopPropagation(); if (e.stopImmediatePropagation) e.stopImmediatePropagation();
    var s = M.state && M.state(), playing = !!(s && s.playing);
    try {
      if (act === 'play') { if (!playing) m.playPause(p); }
      else if (act === 'pause') { if (playing) m.playPause(p); }
      else if (act === 'pp') m.playPause(p);
      else if (act === 'stop') m.stop(p);
    } catch (x) {}
    if (M.refresh) setTimeout(M.refresh, 150);
  }, true);
})();
