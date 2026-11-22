// IvanaFin playback tweaks for the web and the Samsung app (performance, 2026-11-14):
// 1. Soundtrack: browsers and the Samsung TV can't play DTS or TrueHD, so the server converts the sound
//    on the fly (slower start, slower skipping). When a file also has an English track the TV can play
//    (AC3 / E-AC3 / AAC...), that one is asked for instead. A track picked by hand in the player is kept.
// 2. Image subtitles (PGS, Blu-ray style): back to Jellyfin's default = the server burns them into the
//    picture, so they show at once (2026-11-22, user). Drawing them in the app (Jellyfin's "Render PGS
//    subtitles", which IvanaFin turned on 2026-11-14) made the first use of a big film wait minutes while
//    the server pulled the subtitles out of the whole file. Our earlier 'true' is undone once per device;
//    the setting can still be turned on by hand in Settings > Subtitles.
// 3. Paused = the player buttons and the progress bar stay on screen (2026-11-17, user). Jellyfin fades
//    them out after a few seconds even when paused; while the video is paused the hiding is undone.
// 4. The film or show logo at the top of the player instead of the typed title (2026-11-17, user: like the
//    Android app). No logo: the title stays.
(function () {
  'use strict';
  if (window.__ivfPlaybackTweaks) return;
  window.__ivfPlaybackTweaks = true;

  try {
    if (localStorage.getItem('ivf-pgs-burnin') === null) {
      localStorage.removeItem('subtitlerenderpgs');
      localStorage.setItem('ivf-pgs-burnin', '1');
    }
  } catch (e) {}

  var UNPLAYABLE = { dts: 1, truehd: 1, mlp: 1 };
  // given: the track the app asked for (it always names one - the default); only that default is replaced
  function pickAudio(streams, given) {
    var auds = streams.filter(function (s) { return s.Type === 'Audio'; });
    if (!auds.length) return null;
    var eng = auds.filter(function (s) { return s.Language === 'eng'; });
    var pool = eng.length ? eng : auds;
    var chosen = pool.filter(function (s) { return s.IsDefault; })[0] || pool[0];
    if (!UNPLAYABLE[(chosen.Codec || '').toLowerCase()]) return null; // the server's choice plays as it is
    if (given != null && given !== '' && +given !== chosen.Index) return null; // another track was picked by hand
    // never an extra: commentary, music-only score, audio description, sound effects, audience recordings...
    var EXTRA = /commentary|isolated|score|audio description|descriptive|visually impaired|\bsfx\b|effects|audience|workprint|karaoke/i;
    var ok = pool.filter(function (s) {
      return !UNPLAYABLE[(s.Codec || '').toLowerCase()] && !EXTRA.test((s.Title || '') + ' ' + (s.DisplayTitle || '')) &&
        // never fewer channels than the default (7.1 -> 5.1 is fine; surround -> stereo is not: then the
        // server converts the surround track instead, as before)
        (s.Channels || 0) >= Math.min(chosen.Channels || 2, 6);
    });
    if (!ok.length) return null;
    // closest to the track it replaces: same number of channels first, then the most words of its name in
    // common (fan editions carry several mixes - "1977 35mm stereo mix" in DTS and again in AC3), then the
    // most channels (5.1 beats stereo), then the order in the file
    var words = function (s) {
      return ((s.Title || '') + ' ' + (s.DisplayTitle || '')).toLowerCase().replace(/[^a-z0-9.]+/g, ' ').split(' ').filter(function (w) {
        return w.length > 2 && !/^(dts|dolby|digital|plus|truehd|ac3|eac3|aac|flac|pcm|english|eng|kbps|khz|default)$/.test(w);
      });
    };
    var target = words(chosen);
    var score = function (s) {
      var w = words(s), n = 0;
      for (var i = 0; i < target.length; i++) if (w.indexOf(target[i]) >= 0) n++;
      return n;
    };
    ok.forEach(function (s, i) { s._ivfOrder = i; });
    ok.sort(function (a, b) {
      return ((b.Channels === chosen.Channels) - (a.Channels === chosen.Channels)) ||
        (score(b) - score(a)) || ((b.Channels || 0) - (a.Channels || 0)) || (a._ivfOrder - b._ivfOrder);
    });
    return ok[0].Index;
  }

  // the web app asks for PlaybackInfo with an XMLHttpRequest: held back until the soundtrack is chosen
  var X = XMLHttpRequest.prototype, open = X.open, send = X.send, setHeader = X.setRequestHeader;
  X.open = function (method, url) {
    this._ivf = { method: method, url: String(url), async: arguments[2] !== false, headers: [] };
    return open.apply(this, arguments);
  };
  X.setRequestHeader = function (k, v) {
    if (this._ivf) this._ivf.headers.push([k, v]);
    return setHeader.apply(this, arguments);
  };
  X.send = function (body) {
    var r = this._ivf, xhr = this;
    try {
      var pm = r && /\/Items\/([0-9a-f]{32})\/PlaybackInfo/i.exec(r.url);
      if (pm) playingId = pm[1];
      var m = r && r.async && r.method === 'POST' && /\/Items\/([0-9a-f]{32})\/PlaybackInfo/i.exec(r.url);
      if (m && !/[?&]AudioStreamIndex=\d/i.test(r.url) && window.ApiClient) {
        var data = body ? JSON.parse(body) : {};
        ApiClient.getItem(ApiClient.getCurrentUserId(), m[1]).then(function (item) {
          var src = (item.MediaSources || [])[0];
          var want = src && pickAudio(src.MediaStreams || [], data.AudioStreamIndex);
          if (want == null) return send.call(xhr, body);
          data.AudioStreamIndex = want;
          open.call(xhr, 'POST', r.url + (r.url.indexOf('?') < 0 ? '?' : '&') + 'AudioStreamIndex=' + want, true);
          r.headers.forEach(function (h) { setHeader.call(xhr, h[0], h[1]); });
          send.call(xhr, JSON.stringify(data));
        }, function () { send.call(xhr, body); });
        return;
      }
    } catch (e) {}
    return send.apply(this, arguments);
  };

  // 4. logo at the top of the player
  var playingId = null, logoDone = null;
  function d(n) { return "calc(var(--ivf-dp, 100vw / 960) * " + n + ")"; }
  function osdLogo() {
    var header = document.querySelector(".skinHeader.osdHeader");
    var old = document.querySelector(".ivf-osd-logo");
    if (!header) { // left the player: the normal header again
      if (old) old.parentNode.removeChild(old);
      var t0 = document.querySelector(".skinHeader .pageTitle.ivf-logo-title");
      if (t0) { t0.classList.remove("ivf-logo-title"); t0.style.visibility = ""; }
      logoDone = null;
      return;
    }
    if (!playingId || !window.ApiClient || logoDone === playingId) return;
    logoDone = playingId;
    if (old) old.parentNode.removeChild(old);
    var id = playingId;
    ApiClient.getItem(ApiClient.getCurrentUserId(), id).then(function (item) {
      if (id !== playingId) return;
      var src = item.ImageTags && item.ImageTags.Logo ? { id: item.Id, tag: item.ImageTags.Logo } : item.ParentLogoItemId ? { id: item.ParentLogoItemId, tag: item.ParentLogoImageTag } : null;
      var h = document.querySelector(".skinHeader.osdHeader"), title = h && h.querySelector(".pageTitle");
      if (!src || !h) return;
      var img = document.createElement("img");
      img.className = "ivf-osd-logo";
      img.alt = "";
      // where the title starts (after the back arrow), as big as the Android logo box (240 x 120 dp less padding)
      var left = title ? title.getBoundingClientRect().left - h.getBoundingClientRect().left : 0;
      // fixed on the page, not inside the header (the header clips it on the web); fades with the header
      var top = title ? title.getBoundingClientRect().top : 0;
      img.style.cssText = "position:fixed;top:" + (top > 4 ? Math.max(8, top - 6) + "px" : d(16)) + ";left:" + (left ? left + "px" : d(16)) + ";max-width:" + d(208) + ";max-height:" + d(88) + ";object-fit:contain;object-position:left top;pointer-events:none;z-index:1001;transition:opacity .3s";
      img.onload = function () { if (title) { title.classList.add("ivf-logo-title"); title.style.visibility = "hidden"; } };
      img.onerror = function () { if (img.parentNode) img.parentNode.removeChild(img); };
      img.src = ApiClient.getScaledImageUrl(src.id, { type: "Logo", maxWidth: 600, tag: src.tag });
      document.body.appendChild(img);
      syncLogo();
    }, function () {});
  }
  // the logo shows and hides with the player header
  function syncLogo() {
    var img = document.querySelector(".ivf-osd-logo"), h = document.querySelector(".skinHeader.osdHeader");
    if (img) img.style.opacity = h && !h.classList.contains("osdHeader-hidden") && !h.classList.contains("hide") ? "1" : "0";
  }
  setInterval(osdLogo, 700);
  new MutationObserver(syncLogo).observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });

  // 3. keep the controls on screen while paused
  var held = false;
  function video() { var v = document.querySelector("video.htmlvideoplayer") || document.querySelector("video"); return v; }
  function pausedNow() { var v = video(); return !!(v && v.paused && !v.ended && v.readyState > 0 && document.querySelector(".videoOsdBottom")); }
  function unhide() {
    var b = document.querySelector(".videoOsdBottom"), h = document.querySelector(".skinHeader.osdHeader") || document.querySelector(".skinHeader");
    if (b) { b.classList.remove("videoOsdBottom-hidden"); b.classList.remove("hide"); }
    if (h) { h.classList.remove("osdHeader-hidden"); h.classList.remove("hide"); }
    held = true;
  }
  // Jellyfin hides by adding classes: undo it at once while paused
  new MutationObserver(function () { if (pausedNow()) { var b = document.querySelector(".videoOsdBottom"); if (b && (b.classList.contains("videoOsdBottom-hidden") || b.classList.contains("hide"))) unhide(); } })
    .observe(document.documentElement, { subtree: true, attributes: true, attributeFilter: ["class"] });
  document.addEventListener("pause", function (e) { if (e.target && e.target.tagName === "VIDEO") setTimeout(function () { if (pausedNow()) unhide(); }, 0); }, true);
  // playing again: let Jellyfin show the controls normally, so its own timer fades them out as usual
  document.addEventListener("playing", function (e) {
    if (!held || !e.target || e.target.tagName !== "VIDEO") return;
    held = false;
    // (Jellyfin listens for pointermove where it exists, else mousemove, and ignores tiny moves)
    var x = 40 + Math.round(Math.random() * 400), y = 40 + Math.round(Math.random() * 300);
    ["pointermove", "mousemove"].forEach(function (t) {
      try { document.dispatchEvent(t === "pointermove" && window.PointerEvent ? new PointerEvent(t, { bubbles: true, clientX: x, clientY: y, pointerType: "mouse" }) : new MouseEvent(t, { bubbles: true, clientX: x, clientY: y })); } catch (e) {}
    });
  }, true);
})();
