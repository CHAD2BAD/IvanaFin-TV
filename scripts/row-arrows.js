// IvanaFin (web only): round < > arrows on the sides of the sideways card rows in Music, Discover and the film /
// show pages (Cast & Crew, Special Features, Scenes, More Like This)
// (rows have no scrollbar, so with a mouse there was no way to see the cards off to the right).
// The arrows appear while the mouse is over a row, only on a side that has more cards, and
// scroll the row by most of its width.
(function () {
  'use strict';
  if ((typeof tizen !== 'undefined' || !!window.PalmSystem)) return; // TV: the remote scrolls the rows
  var STRIPS = '#ivf-music .strip, .ivf-dsc-strip, #ivf-movie .ivf-mv-strip, #ivf-show .ivf-tvs-strip';
  // the card pictures: the arrows sit on their middle (not the middle of picture + title + year below)
  var PICS = '.ivf-dsc-poster, .p, .pic, .ivf-mv-face, .ivf-tvs-face';
  var CHEVRON = {
    l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15.41 7.41 14 6l-6 6 6 6 1.41-1.41L10.83 12z"/></svg>',
    r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8.59 16.59 10 18l6-6-6-6-1.41 1.41L13.17 12z"/></svg>'
  };

  var st = document.createElement('style');
  // Music styles every button inside #ivf-music (id rule): repeat each arrow rule under that id so ours win
  function both(css) { return css.replace(/(^|\})([^{}]+)\{/g, function (m, b, sel) { return b + sel.split(',').map(function (x) { return x + ',#ivf-music ' + x.trim(); }).join(',') + '{'; }); }
  st.textContent = both([
    '.ivf-ra{position:absolute;z-index:6;width:44px;height:44px;margin-top:-22px;border:0;border-radius:50%;padding:0;cursor:pointer;',
    'display:flex;align-items:center;justify-content:center;background:rgba(0,0,0,.72);color:#fff;box-shadow:0 2px 10px rgba(0,0,0,.5);',
    'opacity:0;pointer-events:none;transition:opacity .15s,transform .15s}',
    '.ivf-ra svg{width:30px;height:30px;fill:currentColor}',
    '.ivf-ra.l{left:10px}.ivf-ra.r{right:10px}',
    '.ivf-ra-host:hover>.ivf-ra.on{opacity:1;pointer-events:auto}',
    '.ivf-ra:hover{background:rgba(30,30,30,.92);transform:scale(1.08)}'
  ].join(''));
  document.head.appendChild(st);

  function update(strip) {
    var host = strip.parentNode; if (!host || !host._ivfRa) return;
    var max = strip.scrollWidth - strip.clientWidth;
    host._ivfRa.l.classList.toggle('on', strip.scrollLeft > 4);
    host._ivfRa.r.classList.toggle('on', strip.scrollLeft < max - 4);
    // centred on the cards' pictures (the row title above and the names/years below don't count)
    var pic = strip.querySelector(PICS), top;
    if (pic && pic.offsetHeight) {
      var pr = pic.getBoundingClientRect(), hr = host.getBoundingClientRect();
      top = Math.round(pr.top - hr.top + pr.height / 2) + 'px';
    } else {
      top = strip.offsetTop + strip.offsetHeight / 2 + 'px';
    }
    host._ivfRa.l.style.top = top; host._ivfRa.r.style.top = top;
  }
  function arm(strip) {
    var host = strip.parentNode; if (!host) return;
    if (!host._ivfRa || !host.contains(host._ivfRa.l)) {
      if (getComputedStyle(host).position === 'static') host.style.position = 'relative';
      host.classList.add('ivf-ra-host');
      var mk = function (side) {
        var b = document.createElement('button');
        b.type = 'button'; b.className = 'ivf-ra ' + side; b.tabIndex = -1;
        b.title = side === 'l' ? 'Scroll left' : 'Scroll right';
        b.innerHTML = CHEVRON[side];
        b.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          var s = host.querySelector(STRIPS) || strip;
          // the prototype's scrollBy: Music switches off scrollBy on its own boxes (Jellyfin's TV code calls it)
          Element.prototype.scrollBy.call(s, { left: (side === 'l' ? -1 : 1) * Math.max(200, s.clientWidth * 0.85), behavior: 'smooth' });
        });
        host.appendChild(b);
        return b;
      };
      host._ivfRa = { l: mk('l'), r: mk('r') };
    }
    update(strip);
  }
  document.addEventListener('mouseover', function (e) {
    var s = e.target.closest && e.target.closest(STRIPS);
    if (!s) { var h = e.target.closest && e.target.closest('.ivf-ra-host'); s = h && h.querySelector(STRIPS); }
    if (s) arm(s);
  }, true);
  // scroll events don't bubble: listen while capturing
  document.addEventListener('scroll', function (e) {
    var s = e.target;
    if (s && s.matches && s.matches(STRIPS)) update(s);
  }, true);
  window.addEventListener('resize', function () {
    Array.prototype.forEach.call(document.querySelectorAll('.ivf-ra-host'), function (h) { var s = h.querySelector(STRIPS); if (s) update(s); });
  });
})();
