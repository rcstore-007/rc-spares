/* Fix & upgrade page: search, tabs and opening guides. */
(function () {
  'use strict';
  var $ = function (id) { return document.getElementById(id); };
  var list = $('glist'), q = $('gq'), clr = $('gclear'), count = $('gcount'), none = $('gnone');
  if (!list || !q) return;
  var guides = [].slice.call(list.querySelectorAll('.guide'));
  var tabs = [].slice.call(document.querySelectorAll('.gtab'));
  var kind = 'all';
  var STOP = { my: 1, the: 1, is: 1, a: 1, an: 1, and: 1, to: 1, it: 1, of: 1, on: 1, in: 1, car: 1, rc: 1, truck: 1, rig: 1, i: 1, its: 1, im: 1, very: 1, too: 1, so: 1, with: 1, when: 1, why: 1, how: 1, what: 1, does: 1, do: 1, keeps: 1, keep: 1, getting: 1, get: 1, after: 1, for: 1, at: 1, be: 1, are: 1, was: 1 };
  function stem(w) {
    if (w.length > 5) w = w.replace(/(ing|ies|ed|es)$/, '');
    if (w.length > 3) w = w.replace(/s$/, '');
    return w;
  }
  function tokens(s) {
    return s.toLowerCase().replace(/[^a-z0-9.\s]/g, ' ').split(/\s+/).filter(function (w) { return w && !STOP[w]; }).map(stem);
  }

  function apply() {
    var t = tokens(q.value), shown = 0;
    clr.hidden = !q.value;
    if (t.length) {
      var sc = guides.map(function (g) {
        var key = g.getAttribute('data-key'), txt = g.getAttribute('data-text'), s = 0;
        t.forEach(function (w) { if (key.indexOf(w) >= 0) s += 3; else if (txt.indexOf(w) >= 0) s += 1; });
        return [s, g];
      });
      var top = Math.max.apply(null, sc.map(function (x) { return x[0]; }));
      sc.sort(function (a, b) { return b[0] - a[0]; });
      sc.forEach(function (x) {
        var ok = top > 0 && x[0] >= Math.max(1, top * 0.45);
        x[1].hidden = !ok; if (ok) shown++;
        list.appendChild(x[1]);
      });
      count.textContent = shown ? (shown === 1 ? '1 result' : shown + ' results') : '';
      if (shown === 1) open(sc[0][1], true);
    } else {
      guides.forEach(function (g) { list.appendChild(g); var ok = kind === 'all' || g.getAttribute('data-kind') === kind; g.hidden = !ok; if (ok) shown++; });
      count.textContent = shown + ' topics';
    }
    none.hidden = shown > 0;
  }

  function open(g, on) {
    var b = g.querySelector('.gq'), body = g.querySelector('.gbody');
    var show = on === undefined ? body.hidden : on;
    body.hidden = !show; b.setAttribute('aria-expanded', show ? 'true' : 'false');
    g.classList.toggle('open', show);
    if (show && history.replaceState) history.replaceState(null, '', '#' + g.id);
  }

  list.addEventListener('click', function (e) {
    var b = e.target.closest('.gq'); if (b) open(b.closest('.guide'));
  });
  q.addEventListener('input', function () {
    if (q.value) { kind = 'all'; tabs.forEach(function (x) { var on = x.getAttribute('data-kind') === 'all'; x.classList.toggle('on', on); x.setAttribute('aria-pressed', on); }); }
    apply();
  });
  clr.addEventListener('click', function () { q.value = ''; apply(); q.focus(); });
  tabs.forEach(function (b) {
    b.addEventListener('click', function () {
      kind = b.getAttribute('data-kind'); q.value = '';
      tabs.forEach(function (x) { x.classList.toggle('on', x === b); x.setAttribute('aria-pressed', x === b); });
      apply();
    });
  });
  $('gchips').addEventListener('click', function (e) {
    var c = e.target.closest('.gchip'); if (!c) return;
    q.value = c.textContent; apply();
  });

  function fromHash() {
    var id = decodeURIComponent(location.hash.slice(1)), g = id && document.getElementById(id);
    if (g && g.classList.contains('guide')) {
      q.value = ''; kind = 'all'; apply(); open(g, true);
      setTimeout(function () { g.scrollIntoView({ block: 'start' }); window.scrollBy(0, -80); }, 50);
    }
  }
  window.addEventListener('hashchange', fromHash);
  apply(); fromHash();
})();
