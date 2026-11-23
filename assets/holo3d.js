/* "Where it fits": a 3D line drawing of a 1:10 scale crawler, drawn on a canvas.
   It turns slowly, then moves in close to the part this product belongs to, holds,
   and pulls back again, looping like a short GIF. No external libraries.
   Each .holo element carries data-fit="rims hubs" (zones to light up) and data-label. */
(function () {
  'use strict';
  var TAU = Math.PI * 2;

  /* ---------- geometry helpers: every shape becomes a list of 3D line segments ---------- */
  function Model() { this.parts = {}; }
  Model.prototype.seg = function (k, a, b) { (this.parts[k] = this.parts[k] || []).push([a[0], a[1], a[2], b[0], b[1], b[2]]); };
  Model.prototype.poly = function (k, pts, closed) { for (var i = 0; i < pts.length - 1; i++) this.seg(k, pts[i], pts[i + 1]); if (closed) this.seg(k, pts[pts.length - 1], pts[0]); };
  // a circle around an axis ('x','y','z') through centre c
  function ring(c, axis, r, n, phase) {
    var pts = [];
    for (var i = 0; i < n; i++) {
      var a = phase + i / n * TAU, u = Math.cos(a) * r, v = Math.sin(a) * r;
      pts.push(axis === 'x' ? [c[0], c[1] + u, c[2] + v] : axis === 'y' ? [c[0] + u, c[1], c[2] + v] : [c[0] + u, c[1] + v, c[2]]);
    }
    return pts;
  }
  function add(a, b) { return [a[0] + b[0], a[1] + b[1], a[2] + b[2]]; }
  function lerp(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  Model.prototype.box = function (k, c, w, h, d) {
    var x = w / 2, y = h / 2, z = d / 2, v = [];
    for (var i = 0; i < 8; i++) v.push([c[0] + (i & 1 ? x : -x), c[1] + (i & 2 ? y : -y), c[2] + (i & 4 ? z : -z)]);
    var e = [[0, 1], [2, 3], [4, 5], [6, 7], [0, 2], [1, 3], [4, 6], [5, 7], [0, 4], [1, 5], [2, 6], [3, 7]];
    for (var j = 0; j < 12; j++) this.seg(k, v[e[j][0]], v[e[j][1]]);
  };
  // cylinder between two points with n sides, drawn as end rings + side lines
  Model.prototype.tube = function (k, a, b, r, n, rings) {
    n = n || 10; rings = rings || 2;
    var d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]) || 1;
    d = [d[0] / L, d[1] / L, d[2] / L];
    var t = Math.abs(d[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0];
    var u = [d[1] * t[2] - d[2] * t[1], d[2] * t[0] - d[0] * t[2], d[0] * t[1] - d[1] * t[0]], ul = Math.hypot(u[0], u[1], u[2]);
    u = [u[0] / ul, u[1] / ul, u[2] / ul];
    var w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]];
    var R = [];
    for (var s = 0; s < rings; s++) {
      var c = lerp(a, b, rings === 1 ? 0 : s / (rings - 1)), pts = [];
      for (var i = 0; i < n; i++) { var an = i / n * TAU, cs = Math.cos(an) * r, sn = Math.sin(an) * r; pts.push([c[0] + u[0] * cs + w[0] * sn, c[1] + u[1] * cs + w[1] * sn, c[2] + u[2] * cs + w[2] * sn]); }
      this.poly(k, pts, true); R.push(pts);
    }
    for (var q = 0; q < n; q += Math.max(1, Math.floor(n / 6))) this.seg(k, R[0][q], R[R.length - 1][q]);
  };
  Model.prototype.spring = function (k, a, b, r, turns) {
    var d = [b[0] - a[0], b[1] - a[1], b[2] - a[2]], L = Math.hypot(d[0], d[1], d[2]);
    d = [d[0] / L, d[1] / L, d[2] / L];
    var u = [0, 0, 1], w = [d[1] * u[2] - d[2] * u[1], d[2] * u[0] - d[0] * u[2], d[0] * u[1] - d[1] * u[0]], pts = [];
    for (var i = 0; i <= turns * 14; i++) { var t = i / (turns * 14), an = t * turns * TAU, p = lerp(a, b, t); pts.push([p[0] + (u[0] * Math.cos(an) + w[0] * Math.sin(an)) * r, p[1] + (u[1] * Math.cos(an) + w[1] * Math.sin(an)) * r, p[2] + (u[2] * Math.cos(an) + w[2] * Math.sin(an)) * r]); }
    this.poly(k, pts, false);
  };

  /* ---------- the crawler (units ≈ cm, 1:10 scale; x forward, y up, z sideways) ---------- */
  function buildCrawler() {
    var m = new Model(), R = 5.6, W = 4.6, WB = 15.6, TR = 11.2, AH = R;
    var wheels = [[WB, AH, TR], [WB, AH, -TR], [-WB, AH, TR], [-WB, AH, -TR]];
    wheels.forEach(function (c) {
      var s = c[2] > 0 ? 1 : -1, o = [c[0], c[1], c[2] + s * W / 2], i = [c[0], c[1], c[2] - s * W / 2];
      // tyre: sidewalls, shoulders and tread blocks
      m.poly('tyres', ring(o, 'z', R, 36, 0), true); m.poly('tyres', ring(i, 'z', R, 36, 0), true);
      m.poly('tyres', ring(add(o, [0, 0, -s * 0.5]), 'z', R + 0.25, 36, 0), true); m.poly('tyres', ring(add(i, [0, 0, s * 0.5]), 'z', R + 0.25, 36, 0), true);
      for (var t = 0; t < 18; t++) {
        var a = t / 18 * TAU, a2 = a + 0.12, z1 = o[2] - s * 0.5, z2 = c[2] + (t % 2 ? 0.6 : -0.6) * s;
        m.seg('tyres', [c[0] + Math.cos(a) * (R + 0.25), c[1] + Math.sin(a) * (R + 0.25), z1], [c[0] + Math.cos(a2) * (R + 0.25), c[1] + Math.sin(a2) * (R + 0.25), z2]);
        m.seg('tyres', [c[0] + Math.cos(a) * (R + 0.25), c[1] + Math.sin(a) * (R + 0.25), i[2] + s * 0.5], [c[0] + Math.cos(a2) * (R + 0.25), c[1] + Math.sin(a2) * (R + 0.25), z2]);
      }
      // rim: lips, beadlock ring with bolts, spokes
      var ro = add(o, [0, 0, -s * 0.3]);
      m.poly('rims', ring(ro, 'z', 3.7, 28, 0), true); m.poly('rims', ring(add(i, [0, 0, s * 0.3]), 'z', 3.7, 28, 0), true);
      m.poly('rims', ring(ro, 'z', 3.2, 28, 0), true);
      for (var b = 0; b < 12; b++) m.poly('rims', ring([c[0] + Math.cos(b / 12 * TAU) * 3.45, c[1] + Math.sin(b / 12 * TAU) * 3.45, ro[2]], 'z', 0.12, 5, 0), true);
      for (var sp = 0; sp < 6; sp++) { var an = sp / 6 * TAU; m.seg('rims', [c[0] + Math.cos(an) * 1.1, c[1] + Math.sin(an) * 1.1, ro[2]], [c[0] + Math.cos(an + 0.25) * 3.2, c[1] + Math.sin(an + 0.25) * 3.2, ro[2]]); }
      // hub: hex + nut
      m.poly('hubs', ring(ro, 'z', 1.0, 6, 0), true); m.poly('hubs', ring(add(ro, [0, 0, -s * 0.8]), 'z', 1.0, 6, 0), true);
      m.poly('hubs', ring(add(ro, [0, 0, s * 0.2]), 'z', 0.5, 6, 0.5), true);
      for (var h = 0; h < 6; h++) m.seg('hubs', ring(ro, 'z', 1.0, 6, 0)[h], ring(add(ro, [0, 0, -s * 0.8]), 'z', 1.0, 6, 0)[h]);
    });
    // axles: pumpkin (diff), tubes, knuckles at the front
    [WB, -WB].forEach(function (x) {
      var front = x > 0, pz = 1.6;
      m.tube('diff', [x - 2.2, AH, pz], [x + 2.2, AH, pz], 2.3, 16, 3);
      m.poly('diff', ring([x, AH, pz + 2.1], 'z', 1.4, 12, 0), true);
      m.tube('axles', [x, AH, pz - 2.3], [x, AH, -TR + W / 2 + 1.2], 0.75, 10, 3);
      m.tube('axles', [x, AH, pz + 2.3], [x, AH, TR - W / 2 - 1.2], 0.75, 10, 3);
      [1, -1].forEach(function (s) {
        var kz = s * (TR - W / 2 - 1.0);
        if (front) { m.box('knuckles', [x, AH, kz], 1.6, 3.4, 1.4); m.tube('knuckles', [x, AH + 1.7, kz], [x - 1.6, AH + 2.0, kz], 0.25, 6, 2); }
        else m.tube('axles', [x, AH, kz - s * 0.4], [x, AH, kz + s * 0.4], 1.0, 10, 2);
      });
      // links: two lower, one upper triangulated
      var cx = front ? 4 : -4;
      [1, -1].forEach(function (s) { m.tube('links', [x, AH - 1.2, s * 3.8], [cx, AH + 0.2, s * 3.4], 0.32, 6, 2); });
      m.tube('links', [x - (front ? 0.5 : -0.5), AH + 2.2, 1.0], [cx, AH + 3.4, 2.6], 0.3, 6, 2);
      m.tube('links', [x - (front ? 0.5 : -0.5), AH + 2.2, 1.0], [cx, AH + 3.4, -2.6], 0.3, 6, 2);
      // shocks: body, shaft, spring
      [1, -1].forEach(function (s) {
        var lo = [x - (front ? 0.8 : -0.8), AH + 0.6, s * 5.8], top = [x - (front ? 3.4 : -3.4), AH + 8.2, s * 5.0], mid = lerp(lo, top, 0.45);
        m.tube('shocks', mid, top, 0.7, 10, 3); m.tube('shocks', lo, mid, 0.22, 6, 2);
        m.spring('shocks', lerp(lo, top, 0.18), lerp(lo, top, 0.88), 1.05, 7);
      });
    });
    // chassis ladder rails + crossmembers, skid
    [3.2, -3.2].forEach(function (z) { m.poly('chassis', [[-21, 9.6, z], [21, 9.6, z], [21, 11.8, z], [-21, 11.8, z]], true); m.seg('chassis', [-21, 10.7, z], [21, 10.7, z]); });
    [-19, -10, 0, 10, 19].forEach(function (x) { m.seg('chassis', [x, 9.6, 3.2], [x, 9.6, -3.2]); m.seg('chassis', [x, 11.8, 3.2], [x, 11.8, -3.2]); });
    m.box('skid', [0, 7.0, 0], 9, 1.0, 6.2);
    // transmission with spur gear, motor + pinion, driveshafts
    m.box('transmission', [0, 9.6, 0], 5.2, 4.4, 4.0);
    m.poly('gears', ring([-0.8, 10.6, 2.4], 'z', 2.2, 40, 0), true); m.poly('gears', ring([-0.8, 10.6, 2.4], 'z', 1.9, 40, 0), true);
    for (var g = 0; g < 20; g++) { var ga = g / 20 * TAU; m.seg('gears', [-0.8 + Math.cos(ga) * 1.9, 10.6 + Math.sin(ga) * 1.9, 2.4], [-0.8 + Math.cos(ga) * 2.2, 10.6 + Math.sin(ga) * 2.2, 2.4]); }
    m.poly('gears', ring([1.9, 12.2, 2.4], 'z', 0.7, 14, 0), true);
    m.tube('motor', [1.9, 12.2, -2.2], [1.9, 12.2, -8.2], 1.8, 16, 4);
    for (var f = 0; f < 6; f++) { var fa = f / 6 * TAU; m.seg('motor', [1.9 + Math.cos(fa) * 1.8, 12.2 + Math.sin(fa) * 1.8, -8.2], [1.9 + Math.cos(fa) * 1.8, 12.2 + Math.sin(fa) * 1.8, -8.8]); }
    m.tube('driveshafts', [2.6, 8.4, 0], [WB - 2.3, AH, 1.6], 0.42, 8, 3);
    m.tube('driveshafts', [-2.6, 8.4, 0], [-WB + 2.3, AH, 1.6], 0.42, 8, 3);
    [[2.6, 8.4, 0], [WB - 2.3, AH, 1.6], [-2.6, 8.4, 0], [-WB + 2.3, AH, 1.6]].forEach(function (p) { m.box('driveshafts', p, 0.9, 0.9, 0.9); });
    // electronics: ESC with fan, receiver + antenna, servo + horn + steering link, battery
    m.box('esc', [-7.5, 13.4, -1.8], 3.4, 1.6, 3.0); m.poly('esc', ring([-7.5, 14.25, -1.8], 'y', 1.1, 14, 0), true);
    m.box('receiver', [-7.0, 13.2, 2.6], 2.4, 1.2, 1.8); m.tube('receiver', [-7.6, 13.8, 3.2], [-7.6, 20.5, 3.2], 0.1, 4, 2);
    m.box('servo', [WB - 1.0, AH + 4.2, -2.6], 2.0, 3.8, 4.0);
    m.box('servo', [WB - 1.0, AH + 5.4, -2.6], 2.0, 0.3, 5.6);                 // mounting tabs
    m.tube('servo', [WB - 1.0, AH + 6.1, -1.6], [WB - 1.0, AH + 6.6, -1.6], 0.45, 10, 2); // output spline
    [-4.9, -0.3].forEach(function (z) { m.poly('servo', ring([WB - 1.0, AH + 5.6, z], 'y', 0.22, 6, 0), true); });
    m.box('steering', [WB - 1.0, AH + 6.4, -2.6], 2.6, 0.3, 0.6);
    m.tube('steering', [WB - 2.2, AH + 6.4, -2.6], [WB - 1.6, AH + 2.0, -(TR - W / 2 - 1.0)], 0.22, 6, 2);
    m.tube('steering', [WB - 1.6, AH + 2.0, TR - W / 2 - 1.0], [WB - 1.6, AH + 2.0, -(TR - W / 2 - 1.0)], 0.22, 6, 2);
    m.box('battery', [-1.5, 13.2, 0], 10.5, 2.2, 3.6);
    // body shell: side profile extruded across the width, with windows
    var prof = [[-23, 12.2], [-23, 17.5], [-9, 17.8], [-7.5, 25], [6, 25.2], [10, 19.6], [22.5, 18.4], [24, 15], [24, 12.4]];
    [7.6, -7.6].forEach(function (z) { m.poly('body', prof.map(function (p) { return [p[0], p[1], z]; }), true); });
    prof.forEach(function (p) { m.seg('body', [p[0], p[1], 7.6], [p[0], p[1], -7.6]); });
    [7.65, -7.65].forEach(function (z) { m.poly('body', [[-6.4, 18.4, z], [-5.6, 23.8, z], [0, 24, z], [0, 18.6, z]], true); m.poly('body', [[1, 18.6, z], [1, 24, z], [5.4, 24, z], [8.4, 19.4, z]], true); });
    [[-15.6, 12.2], [15.6, 12.2]].forEach(function (c) { [7.6, -7.6].forEach(function (z) { var arc = []; for (var a = 0; a <= 12; a++) { var an = Math.PI * a / 12; arc.push([c[0] + Math.cos(an) * 7.2, c[1] + Math.sin(an) * 2.8, z]); } m.poly('body', arc, false); }); });
    // bumpers, winch, lights, rear rack
    m.tube('bumper', [25.5, 9.5, 8], [25.5, 9.5, -8], 0.45, 8, 2); m.tube('bumper', [25.5, 9.5, 8], [22.5, 11.5, 6], 0.4, 6, 2); m.tube('bumper', [25.5, 9.5, -8], [22.5, 11.5, -6], 0.4, 6, 2);
    m.tube('bumper', [-24.5, 10.5, 7], [-24.5, 10.5, -7], 0.45, 8, 2);
    m.box('winch', [24.8, 10.9, 0], 2.2, 2.2, 5.6); m.tube('winch', [25.6, 10.9, 2.0], [25.6, 10.9, -2.0], 1.0, 12, 4);
    m.poly('winch', [[26.6, 10.4, 0], [28.2, 9.4, 0], [28.2, 8.2, 0], [27.4, 7.8, 0]], false);
    m.box('lights', [-1, 25.9, 0], 2.0, 0.9, 11); for (var l = -4; l <= 4; l += 2) m.poly('lights', ring([0.05, 25.9, l], 'x', 0.38, 10, 0), true);
    [5.6, -5.6].forEach(function (z) { m.poly('lights', ring([24.05, 16.4, z], 'x', 0.9, 14, 0), true); m.poly('lights', ring([24.15, 16.4, z], 'x', 0.5, 10, 0), true); });
    // transmitter (shown only for radio parts)
    m.box('transmitter', [6, 34, 14], 6, 8, 2.2); m.tube('transmitter', [6, 38, 14], [6, 41.5, 14], 0.2, 4, 2); m.poly('transmitter', ring([7.6, 33, 15.2], 'z', 1.3, 16, 0), true);
    return m;
  }

  /* zones a product can light up (several parts can make one zone) */
  var ZONES = { wheels: ['tyres', 'rims', 'hubs'], tyres: ['tyres'], rims: ['rims'], hubs: ['hubs'], axles: ['axles', 'diff'], diff: ['diff'], knuckles: ['knuckles'],
    links: ['links'], shocks: ['shocks'], chassis: ['chassis'], skid: ['skid'], transmission: ['transmission', 'gears'], gears: ['gears'], motor: ['motor'],
    esc: ['esc'], electronics: ['esc', 'receiver'], driveshafts: ['driveshafts'], drivetrain: ['transmission', 'gears', 'driveshafts', 'axles', 'diff'],
    receiver: ['receiver'], radio: ['receiver', 'transmitter'], servo: ['servo'], steering: ['steering', 'knuckles', 'servo'], battery: ['battery'],
    body: ['body'], bumper: ['bumper'], winch: ['winch'], lights: ['lights'], motoresc: ['motor', 'esc'], all: [] };

  /* ---------- camera + drawing ---------- */
  function project(p, cam, W, H) {
    var x = p[0] - cam.tx, y = p[1] - cam.ty, z = p[2] - cam.tz;
    var ca = Math.cos(cam.az), sa = Math.sin(cam.az), ce = Math.cos(cam.el), se = Math.sin(cam.el);
    var x1 = x * ca - z * sa, z1 = x * sa + z * ca;              // turn around the vertical axis
    var y2 = y * ce + z1 * se, z2 = -y * se + z1 * ce;           // tilt: camera looks down from above
    var depth = cam.dist + z2; if (depth < 1) depth = 1;
    var f = cam.f * H / depth;
    return [W / 2 + x1 * f, H * 0.56 - y2 * f, depth];
  }
  function bounds(segs) {
    var mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9];
    segs.forEach(function (s) { for (var i = 0; i < 6; i++) { var k = i % 3; mn[k] = Math.min(mn[k], s[i]); mx[k] = Math.max(mx[k], s[i]); } });
    return { c: [(mn[0] + mx[0]) / 2, (mn[1] + mx[1]) / 2, (mn[2] + mx[2]) / 2], size: Math.max(mx[0] - mn[0], mx[1] - mn[1], mx[2] - mn[2]) };
  }
  function ease(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function mix(a, b, t) { return a + (b - a) * t; }
  function angMix(a, b, t) { var d = ((b - a + Math.PI) % TAU + TAU) % TAU - Math.PI; return a + d * t; }

  var MODEL = null;
  function start(el) {
    MODEL = MODEL || buildCrawler();
    var keys = (el.getAttribute('data-fit') || 'all').split(/\s+/), lit = {};
    keys.forEach(function (k) { (ZONES[k] || [k]).forEach(function (p) { lit[p] = 1; }); });
    var showTx = !!lit.transmitter;
    var litSegs = [], allKeys = Object.keys(MODEL.parts);
    allKeys.forEach(function (k) { if (lit[k]) litSegs = litSegs.concat(MODEL.parts[k]); });
    var focus = litSegs.length ? bounds(litSegs) : { c: [0, 12, 0], size: 50 };
    // parts that repeat around the rig (wheels, shocks, links...): zoom on the front one facing us
    if (litSegs.length && focus.size > 22) {
      var near = litSegs.filter(function (s) { return (s[0] + s[3]) > 0 && (s[2] + s[5]) > 0; });
      if (near.length > 12 && bounds(near).size < focus.size * 0.8) focus = bounds(near);
    }
    var wide = { tx: 0, ty: 12, tz: 0, dist: 95, f: 1.55, el: 0.36 };
    // look at the part from its own side (outside of the rig)
    var c = focus.c, sideAz = Math.atan2(c[2] || 0.0001, c[0] || 0.0001);
    // stand outside the part, looking in towards the middle of the rig, a little from the front
    var closeAz = (Math.abs(c[0]) + Math.abs(c[2]) < 3) ? -0.75 : Math.atan2(-c[0], -c[2]) + (c[0] >= 0 ? -0.35 : 0.35);
    var close = { tx: c[0], ty: c[1], tz: c[2], dist: Math.max(22, Math.min(62, focus.size * 2.6 + 14)), f: 1.55, el: c[1] > 20 ? 0.55 : 0.28 };
    if (keys[0] === 'all') close = wide;

    var cv = document.createElement('canvas'); cv.className = 'holo-cv'; el.querySelector('.holo-stage').appendChild(cv);
    var ctx = cv.getContext('2d'), dpr = Math.min(2, window.devicePixelRatio || 1), W = 0, H = 0;
    function size() { var r = cv.getBoundingClientRect(); W = r.width; H = r.height; cv.width = W * dpr; cv.height = H * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); }
    size(); window.addEventListener('resize', size);
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var LOOP = 11000, t0 = performance.now(), visible = true;
    if ('IntersectionObserver' in window) new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(el);
    var tag = el.querySelector('.holo-tag');

    function camAt(ms) {
      var t = (ms % LOOP) / LOOP, baseAz = -0.9 + (ms % LOOP) / LOOP * 0.0;
      var spinAz = -2.6 + t / 0.34 * 2.2;       // turn around the rig
      if (t < 0.34) return { cam: { tx: wide.tx, ty: wide.ty, tz: wide.tz, dist: wide.dist, f: wide.f, el: wide.el, az: spinAz }, z: 0 };
      if (t < 0.52) { var k = ease((t - 0.34) / 0.18); return { cam: { tx: mix(wide.tx, close.tx, k), ty: mix(wide.ty, close.ty, k), tz: mix(wide.tz, close.tz, k), dist: mix(wide.dist, close.dist, k), f: wide.f, el: mix(wide.el, close.el, k), az: angMix(-0.4, closeAz, k) }, z: k }; }
      if (t < 0.86) { var h = (t - 0.52) / 0.34; return { cam: { tx: close.tx, ty: close.ty, tz: close.tz, dist: close.dist, f: wide.f, el: close.el, az: closeAz + Math.sin(h * Math.PI) * 0.18 }, z: 1 }; }
      var b = ease((t - 0.86) / 0.14); return { cam: { tx: mix(close.tx, wide.tx, b), ty: mix(close.ty, wide.ty, b), tz: mix(close.tz, wide.tz, b), dist: mix(close.dist, wide.dist, b), f: wide.f, el: mix(close.el, wide.el, b), az: angMix(closeAz, -2.6, b) }, z: 1 - b };
    }

    function draw(now) {
      if (!visible && !reduce) { requestAnimationFrame(draw); return; }
      var st = reduce ? { cam: { tx: close.tx, ty: close.ty, tz: close.tz, dist: close.dist, f: wide.f, el: close.el, az: closeAz }, z: 1 } : camAt(now - t0);
      var cam = st.cam; ctx.clearRect(0, 0, W, H);
      // ground grid
      ctx.lineWidth = 1;
      for (var g = -40; g <= 40; g += 8) {
        var a = project([g, 0, -40], cam, W, H), b = project([g, 0, 40], cam, W, H), c2 = project([-40, 0, g], cam, W, H), d2 = project([40, 0, g], cam, W, H);
        ctx.strokeStyle = 'rgba(160,175,190,0.07)'; ctx.beginPath(); ctx.moveTo(a[0], a[1]); ctx.lineTo(b[0], b[1]); ctx.moveTo(c2[0], c2[1]); ctx.lineTo(d2[0], d2[1]); ctx.stroke();
      }
      var pulse = 0.75 + 0.25 * Math.sin(now / 420);
      allKeys.forEach(function (k) {
        if (k === 'transmitter' && !showTx) return;
        var on = lit[k] || keys[0] === 'all', segs = MODEL.parts[k];
        var dim = k === 'body' ? 0.16 : 0.24, alpha = on ? (keys[0] === 'all' ? 0.55 : 0.95 * pulse) : dim * (1 - 0.45 * st.z);
        ctx.strokeStyle = on ? 'rgba(236,244,250,' + alpha + ')' : 'rgba(170,186,200,' + alpha + ')';
        ctx.lineWidth = on && keys[0] !== 'all' ? 1.5 : 0.8;
        if (on && keys[0] !== 'all') { ctx.shadowColor = 'rgba(200,225,245,0.9)'; ctx.shadowBlur = 8; } else ctx.shadowBlur = 0;
        ctx.beginPath();
        for (var i = 0; i < segs.length; i++) { var s = segs[i], p = project([s[0], s[1], s[2]], cam, W, H), q = project([s[3], s[4], s[5]], cam, W, H); ctx.moveTo(p[0], p[1]); ctx.lineTo(q[0], q[1]); }
        ctx.stroke();
      });
      ctx.shadowBlur = 0;
      // callout: thin ring + leader line to the label once zoomed in
      if (keys[0] !== 'all' && st.z > 0.6 && tag) {
        var fp = project(focus.c, cam, W, H), op = Math.min(1, (st.z - 0.6) / 0.4);
        ctx.strokeStyle = 'rgba(236,244,250,' + 0.55 * op + ')'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.arc(fp[0], fp[1], 6, 0, TAU); ctx.stroke();
        var lx = W - 18, ly = 22; ctx.beginPath(); ctx.moveTo(fp[0] + 6, fp[1] - 4); ctx.lineTo(fp[0] + 26, ly + 8); ctx.lineTo(lx - tag.offsetWidth - 8, ly + 8); ctx.stroke();
        tag.style.opacity = op;
      } else if (tag) tag.style.opacity = keys[0] === 'all' ? 1 : 0;
      if (!reduce) requestAnimationFrame(draw);
    }
    requestAnimationFrame(draw);
  }

  function init() {
    var els = document.querySelectorAll('.holo[data-fit]');
    if (!els.length || !document.createElement('canvas').getContext) return;
    els.forEach(function (el) { el.classList.add('live'); try { start(el); } catch (e) { el.classList.remove('live'); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
