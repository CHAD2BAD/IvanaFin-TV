// IvanaFin (Samsung TV app only): text boxes don't open the on-screen keyboard just by being selected.
// (user 2026-11-23: moving through Settings, every text box on the way popped the keyboard up, so a setting
// under three boxes meant closing the keyboard three times.) A text box is read-only while it is only
// selected - Up / Down / Left / Right move on as from any other option. OK on it unlocks it and opens the
// keyboard; leaving it (or Up / Down once the keyboard is closed) locks it again.
(function () {
  'use strict';
  if (typeof tizen === 'undefined' || window.__ivfTvTextBoxes) return;
  window.__ivfTvTextBoxes = true;

  var TEXT = { text: 1, search: 1, password: 1, email: 1, number: 1, url: 1, tel: 1, '': 1 };
  function isBox(el) {
    if (!el || !el.tagName) return false;
    if (el.tagName === 'TEXTAREA') return true;
    return el.tagName === 'INPUT' && TEXT[(el.getAttribute('type') || '').toLowerCase()] === 1;
  }
  // lock a box (remember whether the page itself made it read-only - those stay read-only)
  function lock(el) {
    if (!isBox(el) || el.hasAttribute('data-ivf-tvro') || el.disabled) return;
    if (el.readOnly) { el.setAttribute('data-ivf-tvro', 'page'); return; }
    el.setAttribute('data-ivf-tvro', '1');
    el.readOnly = true;
  }
  var opening = false;
  function relock(el) {
    if (opening || !el || el.getAttribute('data-ivf-tvro') !== 'open') return;
    el.setAttribute('data-ivf-tvro', '1');
    el.readOnly = true;
  }
  function lockAll(root) {
    if (!root || !root.querySelectorAll) return;
    if (isBox(root)) lock(root);
    var l = root.querySelectorAll('input, textarea');
    for (var i = 0; i < l.length; i++) lock(l[i]);
  }
  // new boxes are locked as soon as they appear, before anything can select them
  new MutationObserver(function (recs) {
    for (var i = 0; i < recs.length; i++) {
      var a = recs[i].addedNodes;
      for (var j = 0; j < a.length; j++) if (a[j].nodeType === 1) lockAll(a[j]);
    }
  }).observe(document.documentElement, { childList: true, subtree: true });
  lockAll(document.documentElement);

  // a box selected before it was locked (e.g. selected by the page as it opened): lock it, then select it
  // again so the keyboard goes away
  document.addEventListener('focusin', function (e) {
    var el = e.target;
    if (!isBox(el) || el.hasAttribute('data-ivf-tvro')) return;
    lock(el);
    if (el.readOnly) { el.blur(); el.focus(); }
  }, true);
  document.addEventListener('focusout', function (e) { relock(e.target); }, true);

  function open(el) {
    el.setAttribute('data-ivf-tvro', 'open');
    el.readOnly = false;
    // selecting it again makes the TV open its keyboard for it
    opening = true;
    el.blur();
    el.focus();
    opening = false;
    try { var n = el.value.length; el.setSelectionRange(n, n); } catch (x) {}
  }
  document.addEventListener('keydown', function (e) {
    var el = document.activeElement, k = e.keyCode;
    if (!isBox(el)) return;
    var st = el.getAttribute('data-ivf-tvro');
    if ((k === 13 || e.key === 'Enter') && st === '1') {
      e.preventDefault(); e.stopPropagation(); e.stopImmediatePropagation();
      open(el);
      return;
    }
    // keyboard closed, still on the box: Up / Down move on and lock it again
    if (st === 'open' && (k === 38 || k === 40)) relock(el);
  }, true);
  // a pointer (Samsung remote with pointer): clicking the box opens it too
  document.addEventListener('click', function (e) {
    var el = e.target;
    if (isBox(el) && el.getAttribute('data-ivf-tvro') === '1') open(el);
  }, true);
})();
