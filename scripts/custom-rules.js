// IvanaFin: the user's own card / list rules, moved here from the server's branding Custom CSS
// on 2026-11-09 (backup: backup/branding-2026-11-09-before-rules-move.json) so they live in git
// next to the screens they affect. The Custom CSS now holds only the ElegantFin theme import and
// its colour variables. Applies to the web and the Samsung app alike (same as before the move).
(function () {
  'use strict';
  var STYLE_ID = 'ivf-custom-rules';
  if (document.getElementById(STYLE_ID)) return;
  var s = document.createElement('style');
  s.id = STYLE_ID;
  s.textContent = [
    // rows of items centred
    '.itemsContainer:not(.scrollSlider){justify-content:center !important}',
    // card titles wrap instead of being cut off
    '.cardText,.cardText-first{white-space:normal !important;overflow:visible !important;text-overflow:unset !important;height:auto !important}',
    // no watched tick / unwatched count badges
    '.indicator.videoIndicator{display:none !important}',
    '.countIndicator{display:none !important}',
    // list descriptions shown in full
    '.listItem-overview{-webkit-line-clamp:unset !important;display:block !important;overflow:visible !important;white-space:normal !important;text-overflow:unset !important;max-height:none !important}',
    // no borders / shadows / outlines on cards (the selected one gets its own outline below)
    '.card,.card *,.cardBox,.cardScalable,.cardPadder-portrait,.cardImageContainer,.cardImageContainer::before,.cardImageContainer::after,.cardBox::before,.cardBox::after',
    '{border:none !important;box-shadow:none !important;outline:none !important}',
    '.cardOverlayContainer:after{content:none !important;background:none !important}',
    '.cardOverlayContainer{background:transparent !important}',
    // selected card: white outline drawn OUTSIDE the picture (a border inside it squeezed the poster)
    '.card:focus .cardBox.visualCardBox,.card:focus .cardBox:not(.visualCardBox) .cardScalable,.card:focus .cardScalable',
    '{border:none !important;box-shadow:0 0 0 3px var(--fullContrastColor) !important}',
    '.card{contain:none !important}',
    // posters and pictures: the same small corners as the Home tiles and episode pictures (user 2026-11-15;
    // ElegantFin rounds them 1em). People and artists stay round.
    // (no :is() - older Samsung TVs don't know it and would drop the whole rule)
    ['.cardBox', '.cardScalable', '.cardImageContainer', '.cardOverlayContainer'].map(function (c) {
      return '.card:not([data-type="Person"]):not([data-type="MusicArtist"]) ' + c;
    }).join(',') + '{border-radius:calc(var(--ivf-dp,0.10417vw) * 4) !important}'
  ].join('');
  (document.head || document.documentElement).appendChild(s);
})();

// IvanaFin (web): right-click on a poster opens Jellyfin's menu (Play, Add to favourites, ...).
// Windows reports touch support on this PC (navigator.maxTouchPoints 10), and then Jellyfin treats a
// right-click like a finger's long press: it switches to "select several" (tick on the poster)
// instead. A mouse right-click now presses the poster's own (hidden) menu button; a real long press
// with a finger still selects.
(function () {
  'use strict';
  if ((typeof tizen !== 'undefined' || !!window.PalmSystem) || window.__ivfRightClick) return;
  window.__ivfRightClick = true;
  var lastPointer = 'mouse';
  window.addEventListener('pointerdown', function (e) { lastPointer = e.pointerType || 'mouse'; }, true);
  window.addEventListener('contextmenu', function (e) {
    var kind = e.pointerType || lastPointer;
    if (kind === 'touch' || kind === 'pen') return;
    var card = e.target && e.target.closest && e.target.closest('.card');
    var btn = card && card.querySelector('[data-action="menu"]');
    if (!btn) return;
    e.preventDefault();
    e.stopPropagation();
    btn.click();
  }, true);
})();
