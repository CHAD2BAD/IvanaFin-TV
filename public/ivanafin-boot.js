// IvanaFin for Samsung and LG (any-server builds): runs before the IvanaFin scripts.
// - The IvanaFin look (ElegantFin theme + its colours) is built into the app, so it works on any server.
// - Discover needs the Jellyfin Enhanced plugin (+ Seerr) on the server. Once signed in, its script is
//   loaded from whichever server the app is connected to; a server without it just has no Discover.
(function () {
  'use strict';
  window.IvfBuild = 'public';

  // Theme: same as the owner's server branding CSS
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

  // Jellyfin Enhanced from the connected server (once per server)
  var loadedFor = null;
  function tryEnhanced() {
    var api = window.ApiClient;
    if (!api || !api.accessToken || !api.accessToken() || !api.serverAddress || !api.serverAddress()) return;
    var srv = api.serverAddress();
    if (loadedFor === srv || window.JellyfinEnhanced) return;
    loadedFor = srv;
    var s = document.createElement('script');
    s.defer = true;
    s.src = srv.replace(/\/+$/, '') + '/JellyfinEnhanced/script';
    s.onerror = function () { s.remove(); }; // no plugin on this server: no Discover
    document.body.appendChild(s);
  }
  setInterval(tryEnhanced, 1500);
})();
