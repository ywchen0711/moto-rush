/*
 * All the pictures, painted pixel by pixel at start-up (no image files):
 *   riders on their bikes seen from behind (superbike and motocross), in lean frames, trick poses and crash bits
 *   roadside scenery for every theme, the start gantry, and the parallax backgrounds
 */
(function () {
  'use strict';
  var ART = window.MOTO_ART = {};
  function cv(w, h) { var c = document.createElement('canvas'); c.width = w; c.height = h; return c; }
  function pen(g) { return function (x, y, w, h, col) { if (!col) return; g.fillStyle = col; g.fillRect(x, y, w, h); }; }
  function shade(hex, f) {
    var n = parseInt(hex.slice(1, 7), 16), c = [n >> 16, (n >> 8) & 255, n & 255].map(function (v) { return Math.round(f < 0 ? v * (1 + f) : v + (255 - v) * f); });
    return '#' + c.map(function (v) { return ('0' + Math.max(0, Math.min(255, v)).toString(16)).slice(-2); }).join('');
  }
  ART.shade = shade;
  // a dark outline around everything drawn on a canvas
  function outline(c, col) {
    var g = c.getContext('2d'), W = c.width, H = c.height, id = g.getImageData(0, 0, W, H), d = id.data, s = new Uint8ClampedArray(d), rgb = col || [22, 18, 30];
    for (var y = 0; y < H; y++) for (var x = 0; x < W; x++) {
      var i = (y * W + x) * 4; if (s[i + 3] > 40) continue;
      if ((x > 0 && s[i - 1] > 40) || (x < W - 1 && s[i + 7] > 40) || (y > 0 && s[i - W * 4 + 3] > 40) || (y < H - 1 && s[i + W * 4 + 3] > 40)) { d[i] = rgb[0]; d[i + 1] = rgb[1]; d[i + 2] = rgb[2]; d[i + 3] = 255; }
    }
    g.putImageData(id, 0, 0);
    return c;
  }
  // ---------- a tiny 3×5 pixel font ----------
  var FONT = {
    A: '010101111101101', B: '110101110101110', C: '011100100100011', D: '110101101101110', E: '111100110100111', F: '111100110100100', G: '011100101101011',
    H: '101101111101101', I: '111010010010111', J: '001001001101010', K: '101101110101101', L: '100100100100111', M: '101111111101101', N: '110101101101101',
    O: '010101101101010', P: '110101110100100', Q: '010101101110011', R: '110101110101101', S: '011100010001110', T: '111010010010010', U: '101101101101111',
    V: '101101101101010', W: '101101111111101', X: '101101010101101', Y: '101101010010010', Z: '111001010100111',
    0: '111101101101111', 1: '010110010010111', 2: '110001010100111', 3: '110001010001110', 4: '101101111001001', 5: '111100110001110', 6: '011100110101010',
    7: '111001010010010', 8: '010101010101010', 9: '010101011001110', '!': '010010010000010', '.': '000000000000010', '-': '000000111000000', ' ': '000000000000000', '+': '000010111010000', '★': '010111111010101'
  };
  function text(g, str, x, y, col, s) {
    s = s || 1; g.fillStyle = col;
    String(str).toUpperCase().split('').forEach(function (ch, k) {
      var f = FONT[ch] || FONT[' '];
      for (var i = 0; i < 15; i++) if (f[i] === '1') g.fillRect(x + k * 4 * s + (i % 3) * s, y + Math.floor(i / 3) * s, s, s);
    });
  }
  ART.text = text;
  var textW = function (str, s) { return String(str).length * 4 * (s || 1) - (s || 1); };

  // ======================= riders =======================
  var TIRE = '#16161c', TIRE_L = '#34353f', METAL = '#a0a6b3', METAL_D = '#5d6270', BLACK = '#1b1b22';
  function roadBike(c) {                                   // a superbike from behind, rider tucked in
    var b = cv(34, 46), P = pen(b.getContext('2d')), lea = shade(c.main, -0.25);
    P(2, 13, 5, 2, BLACK); P(27, 13, 5, 2, BLACK);                                         // mirrors
    P(4, 15, 6, 11, shade(c.main, -0.15)); P(24, 15, 6, 11, shade(c.main, -0.15));            // fairing sides
    P(14, 33, 6, 13, TIRE); P(15, 34, 4, 11, TIRE_L); for (var y = 35; y < 45; y += 2) P(15, y, 4, 1, TIRE);
    P(8, 32, 4, 6, METAL); P(8, 37, 4, 1, METAL_D); P(22, 32, 4, 6, METAL); P(22, 37, 4, 1, METAL_D);   // exhausts
    P(11, 25, 12, 8, c.main); P(12, 26, 10, 1, shade(c.main, 0.35)); P(14, 29, 6, 2, '#ff3040'); P(15, 29, 4, 1, '#ffc0c0');
    P(13, 32, 8, 2, shade(c.main, -0.4));
    P(6, 24, 4, 6, lea); P(24, 24, 4, 6, lea); P(5, 29, 4, 4, BLACK); P(25, 29, 4, 4, BLACK); P(5, 26, 1, 2, '#e8e8e8'); P(28, 26, 1, 2, '#e8e8e8');
    P(11, 21, 12, 5, lea);
    P(13, 8, 8, 4, c.main); P(10, 11, 14, 11, c.main); P(10, 11, 2, 11, c.alt); P(22, 11, 2, 11, c.alt); P(12, 12, 2, 7, shade(c.main, 0.25));
    digits(P, c.num, 17, 13, c.alt);
    P(7, 13, 4, 6, c.main); P(23, 13, 4, 6, c.main); P(5, 17, 4, 3, BLACK); P(25, 17, 4, 3, BLACK);
    P(12, 1, 10, 10, c.helmet); P(11, 3, 12, 6, c.helmet); P(16, 1, 2, 10, c.helmet2); P(13, 2, 2, 2, shade(c.helmet, 0.5));
    return outline(b);
  }
  function mxBike(c, pose) {                               // a motocross bike, rider standing up; pose 1/2 = tricks
    var b = cv(34, 50), P = pen(b.getContext('2d')), pants = shade(c.main, -0.3), y;
    if (pose !== 1) P(0, 13, 34, 1, METAL);                                                   // handlebar
    P(13, 35, 8, 15, TIRE); for (y = 36; y < 50; y += 2) { P(12, y, 1, 1, TIRE); P(21, y, 1, 1, TIRE); P(14, y, 6, 1, TIRE_L); }
    P(12, 27, 10, 9, c.main); P(13, 28, 8, 1, shade(c.main, 0.4)); P(23, 30, 3, 6, METAL); P(23, 35, 3, 1, METAL_D);
    P(7, 26, 5, 7, '#f4f4f4'); P(22, 26, 5, 7, '#f4f4f4');
    P(13, 22, 8, 5, BLACK);
    if (pose === 2) {                                                                          // nac-nac: one leg kicked out
      P(0, 21, 12, 4, pants); P(0, 20, 3, 6, '#e8e8e8'); P(21, 21, 4, 7, pants); P(24, 25, 4, 6, pants); P(24, 30, 5, 10, '#e8e8e8'); P(24, 38, 5, 2, BLACK);
    } else {
      P(9, 21, 4, 7, pants); P(21, 21, 4, 7, pants); P(6, 25, 4, 6, pants); P(24, 25, 4, 6, pants);
      P(5, 30, 5, 10, '#e8e8e8'); P(24, 30, 5, 10, '#e8e8e8'); P(5, 38, 5, 2, BLACK); P(24, 38, 5, 2, BLACK);
    }
    P(10, 10, 14, 12, c.main); P(10, 19, 14, 2, c.alt);
    digits(P, c.num, 17, 12, c.alt);
    if (pose === 1) { P(5, 1, 4, 10, c.main); P(25, 1, 4, 10, c.main); P(5, -1, 4, 3, c.alt); P(25, -1, 4, 3, c.alt); }   // no hands!
    else { P(4, 11, 6, 4, c.main); P(24, 11, 6, 4, c.main); P(1, 12, 3, 3, c.alt); P(30, 12, 3, 3, c.alt); }
    P(12, 2, 10, 9, c.helmet); P(11, 4, 12, 5, c.helmet); P(10, 1, 14, 2, c.helmet2); P(16, 3, 2, 8, c.helmet2); P(13, 4, 2, 2, shade(c.helmet, 0.5));
    return outline(b);
  }
  var DIG = FONT;
  function digits(P, n, cx, y, col) {
    var s = String(n), w = s.length * 4 - 1, x0 = Math.round(cx - w / 2);
    s.split('').forEach(function (ch, k) { var f = DIG[ch]; for (var i = 0; i < 15; i++) if (f[i] === '1') P(x0 + k * 4 + (i % 3), y + Math.floor(i / 3), 1, 1, col); });
  }
  // lean frames: the bike drawn at 2× and turned around the tyre's contact point
  var FW = 132, FH = 112, PX = 66, PY = 108, LEANS = 17;
  function leanFrames(base) {
    var out = [];
    for (var i = 0; i < LEANS; i++) {
      var a = (i - (LEANS - 1) / 2) / ((LEANS - 1) / 2) * 0.8, f = cv(FW, FH), g = f.getContext('2d');
      g.imageSmoothingEnabled = false; g.translate(PX, PY); g.rotate(a);
      g.drawImage(base, -base.width, -base.height * 2, base.width * 2, base.height * 2);
      out.push(f);
    }
    return out;
  }
  function crashRider(c) {
    var b = cv(18, 18), P = pen(b.getContext('2d'));
    P(5, 1, 8, 7, c.helmet); P(8, 1, 2, 7, c.helmet2); P(3, 7, 12, 7, c.main); P(1, 9, 3, 3, BLACK); P(14, 9, 3, 3, BLACK); P(4, 13, 4, 4, shade(c.main, -0.3)); P(10, 13, 4, 4, shade(c.main, -0.3));
    return outline(b);
  }
  function crashBike(c) {
    var b = cv(40, 16), P = pen(b.getContext('2d'));
    P(1, 6, 10, 10, TIRE); P(29, 6, 10, 10, TIRE); P(3, 8, 6, 6, METAL_D); P(31, 8, 6, 6, METAL_D);
    P(8, 4, 24, 7, c.main); P(10, 5, 10, 2, shade(c.main, 0.4)); P(20, 2, 10, 3, BLACK); P(6, 10, 10, 2, METAL);
    return outline(b);
  }
  var riderCache = {};
  // everything needed to draw one rider (cached per rider and bike type)
  ART.rider = function (c, type) {
    var key = c.id + '|' + type;
    if (riderCache[key]) return riderCache[key];
    var r = { lean: leanFrames(type === 'dirt' ? mxBike(c, 0) : roadBike(c)), crashRider: crashRider(c), crashBike: crashBike(c) };
    if (type === 'dirt') r.tricks = [leanFrames(mxBike(c, 1))[8], leanFrames(mxBike(c, 2))[8]];
    return (riderCache[key] = r);
  };
  ART.RIDER = { FW: FW, FH: FH, PX: PX, PY: PY, LEANS: LEANS, ART_W: 68 };
  // a bigger picture of a rider for the menus
  ART.portrait = function (c, type) { return type === 'dirt' ? mxBike(c, 0) : roadBike(c); };

  // ======================= scenery =======================
  var S = {};
  S.palm = function () {
    var b = cv(34, 66), P = pen(b.getContext('2d'));
    for (var i = 0; i < 46; i++) { var x = 16 + Math.round(Math.sin(i / 14) * 3); P(x, 20 + i, 4, 1, i % 4 < 2 ? '#8a5a30' : '#a06a3a'); }
    var fr = [[-14, 4], [-12, -2], [-6, -6], [0, -8], [6, -6], [12, -2], [14, 4]];
    fr.forEach(function (f, k) { for (var t = 0; t <= 10; t++) { var x = 17 + f[0] * t / 10, y = 20 + f[1] * t / 10 + (t * t) / 12; P(Math.round(x) - 1, Math.round(y), 3, 2, k % 2 ? '#2f9e3a' : '#3fbf48'); } });
    P(15, 18, 5, 4, '#6a4a24'); P(14, 21, 2, 2, '#5a3a1a'); P(19, 21, 2, 2, '#5a3a1a');
    return outline(b);
  };
  function pineCanvas(snow) {
    var b = cv(30, 56), P = pen(b.getContext('2d'));
    P(13, 44, 4, 12, '#6a4424');
    for (var l = 0; l < 4; l++) { var top = 4 + l * 10, w = 6 + l * 5; for (var y = 0; y < 14; y++) { var ww = Math.round(w * y / 14) + 1; P(15 - ww, top + y, ww * 2, 1, y % 3 ? '#1f6a34' : '#25803e'); if (snow && y < 4) P(15 - ww, top + y, ww * 2, 1, '#f4f8ff'); } }
    return outline(b);
  }
  S.pine = function () { return pineCanvas(false); };
  S.snowpine = function () { return pineCanvas(true); };
  S.tree = function () {
    var b = cv(38, 52), P = pen(b.getContext('2d'));
    P(16, 30, 6, 22, '#6a4424'); P(17, 30, 2, 22, '#7d5530');
    [[19, 16, 16], [10, 22, 10], [28, 22, 10], [19, 8, 10], [12, 12, 9], [26, 12, 9]].forEach(function (c, k) {
      var g = b.getContext('2d'); g.fillStyle = k % 2 ? '#2f8a3a' : '#3aa046'; g.beginPath(); g.arc(c[0], c[1], c[2], 0, Math.PI * 2); g.fill();
    });
    P(12, 8, 4, 3, '#5ac060'); P(22, 5, 3, 2, '#5ac060');
    return outline(b);
  };
  S.deadtree = function () {
    var b = cv(30, 46), P = pen(b.getContext('2d'));
    P(13, 16, 4, 30, '#2a2226'); P(8, 10, 3, 12, '#2a2226'); P(10, 20, 4, 3, '#2a2226'); P(19, 6, 3, 14, '#2a2226'); P(16, 18, 4, 3, '#2a2226'); P(5, 6, 3, 6, '#2a2226'); P(21, 2, 3, 5, '#2a2226');
    return outline(b, [255, 120, 40]);
  };
  S.cactus = function () {
    var b = cv(22, 38), P = pen(b.getContext('2d'));
    P(8, 2, 6, 36, '#3a9a48'); P(9, 2, 2, 36, '#52b860'); P(2, 12, 5, 4, '#3a9a48'); P(2, 6, 4, 8, '#3a9a48'); P(15, 16, 5, 4, '#3a9a48'); P(16, 9, 4, 9, '#3a9a48'); P(10, 0, 2, 3, '#ff6aa0');
    return outline(b);
  };
  function rockCanvas(base, crack) {
    var b = cv(34, 22), g = b.getContext('2d'), P = pen(g);
    g.fillStyle = base; g.beginPath(); g.moveTo(1, 22); g.lineTo(5, 8); g.lineTo(12, 2); g.lineTo(22, 3); g.lineTo(30, 10); g.lineTo(33, 22); g.fill();
    P(10, 5, 8, 3, shade(base, 0.25)); P(22, 12, 8, 6, shade(base, -0.25));
    if (crack) { P(12, 10, 1, 8, crack); P(13, 13, 5, 1, crack); P(20, 6, 1, 7, crack); }
    return outline(b);
  }
  S.rock = function () { return rockCanvas('#8a8478'); };
  S.lavarock = function () { return rockCanvas('#2e2a2e', '#ff7a20'); };
  S.bush = function () {
    var b = cv(30, 16), g = b.getContext('2d');
    [[8, 10, 7], [16, 7, 8], [23, 10, 7]].forEach(function (c, k) { g.fillStyle = k === 1 ? '#3aa046' : '#2f8a3a'; g.beginPath(); g.arc(c[0], c[1], c[2], 0, Math.PI * 2); g.fill(); });
    return outline(b);
  };
  S.billboard = function (k) {
    var ads = [['MOTO RUSH', '#ff3a3a', '#ffffff'], ['GO FAST', '#2f6fde', '#ffd23a'], ['TURBO OIL', '#202028', '#ff8a1a'], ['JOSH JASPER', '#2fbf5a', '#ffffff'], ['PIXEL TYRES', '#ffd23a', '#202028']], a = ads[k % ads.length];
    var b = cv(66, 40), P = pen(b.getContext('2d'));
    P(8, 26, 3, 14, '#5a5a62'); P(55, 26, 3, 14, '#5a5a62');
    P(1, 2, 64, 26, a[1]); P(1, 2, 64, 2, shade(a[1], 0.35)); P(1, 26, 64, 2, shade(a[1], -0.35));
    var s = textW(a[0], 1) > 58 ? 1 : 2; text(b.getContext('2d'), a[0], Math.round(33 - textW(a[0], s) / 2), 15 - Math.round(2.5 * s), a[2], s);
    return outline(b);
  };
  S.tires = function () {
    var b = cv(16, 20), P = pen(b.getContext('2d'));
    for (var i = 0; i < 4; i++) { P(1, 16 - i * 5, 14, 5, '#1a1a20'); P(3, 17 - i * 5, 10, 2, '#34343c'); P(2, 16 - i * 5, 12, 1, i % 2 ? '#e8e8e8' : '#d03030'); }
    return outline(b);
  };
  S.hay = function () {
    var b = cv(30, 15), P = pen(b.getContext('2d'));
    P(1, 2, 28, 13, '#e8c050'); for (var x = 2; x < 28; x += 3) P(x, 3, 1, 11, '#c8a038'); P(1, 6, 28, 1, '#a07a2a'); P(1, 10, 28, 1, '#a07a2a'); P(1, 2, 28, 2, '#f8d870');
    return outline(b);
  };
  S.flag = function (k) {
    var b = cv(16, 42), P = pen(b.getContext('2d'));
    P(2, 0, 2, 42, '#d8d8d8');
    if (k % 2) for (var y = 0; y < 4; y++) for (var x = 0; x < 6; x++) P(4 + x * 2, 1 + y * 2, 2, 2, (x + y) % 2 ? '#111' : '#fff');
    else { P(4, 1, 11, 8, ['#ff3a3a', '#2f6fde', '#ffd23a'][k % 3]); P(4, 1, 11, 2, '#ffffff'); }
    return outline(b);
  };
  S.lamp = function () {
    var b = cv(16, 62), P = pen(b.getContext('2d'));
    P(7, 6, 2, 56, '#5a5e6a'); P(8, 4, 7, 2, '#5a5e6a'); P(11, 5, 5, 3, '#2a2c34'); P(12, 7, 3, 1, '#fff6c0'); P(5, 58, 6, 4, '#3a3d48');
    return outline(b);
  };
  S.building = function (k) {
    var w = 46 + (k % 3) * 6, h = 90 + (k * 37) % 50, b = cv(w, h), P = pen(b.getContext('2d'));
    var body = ['#2a2f48', '#33284a', '#24364a', '#3a2a3a'][k % 4];
    P(0, 0, w, h, body); P(0, 0, w, 3, shade(body, 0.3));
    for (var y = 6; y < h - 8; y += 7) for (var x = 4; x < w - 4; x += 6) { var on = ((x * 7 + y * 13 + k * 11) % 10) < 6; P(x, y, 3, 4, on ? (((x + y + k) % 3) ? '#ffe28a' : '#9ad8ff') : shade(body, -0.35)); }
    if (k % 2) { P(4, 10, w - 8, 8, ['#ff3aa0', '#3affd0', '#ffd23a'][k % 3]); text(b.getContext('2d'), ['HOTEL', 'BAR', 'NEON', 'CITY'][k % 4], 7, 12, '#ffffff', 1); }
    P(w / 2 - 4, h - 10, 8, 10, '#ffd88a');
    return b;
  };
  function chevron(dir) {
    var b = cv(22, 24), P = pen(b.getContext('2d'));
    P(9, 16, 4, 8, '#5a5e6a'); P(1, 1, 20, 15, '#ffd23a');
    for (var i = 0; i < 2; i++) for (var t = 0; t < 6; t++) { var x = dir > 0 ? 4 + i * 7 + t : 17 - i * 7 - t; P(x, 2 + t, 2, 1, '#151515'); P(x, 14 - t, 2, 1, '#151515'); }
    return outline(b);
  }
  S.chevronL = function () { return chevron(-1); };
  S.chevronR = function () { return chevron(1); };
  S.fans = function (k) {
    var b = cv(66, 24), P = pen(b.getContext('2d')), cols = ['#ff3a3a', '#2f6fde', '#ffd23a', '#2fbf5a', '#ff6fae', '#ffffff', '#ff8a1a'], skins = ['#f6d3b3', '#e0a878', '#a06842', '#6f4529'];
    for (var i = 0; i < 13; i++) { var x = 2 + i * 5, up = (i + k) % 3 === 0 ? 2 : 0; P(x, 8 - up, 4, 8, cols[(i * 3 + k) % cols.length]); P(x, 3 - up, 4, 4, skins[(i + k) % 4]); if ((i + k) % 4 === 0) P(x - 1, 0 - up, 2, 4, skins[(i + k) % 4]); }
    P(0, 15, 66, 9, '#e8e8e8'); P(0, 15, 66, 2, '#ff3a3a'); text(b.getContext('2d'), 'GO GO GO', 18, 18, '#2a2a34', 1);
    return outline(b);
  };
  S.gantry = function () {
    var b = cv(200, 72), g = b.getContext('2d'), P = pen(g);
    P(4, 10, 8, 62, '#d8d8de'); P(188, 10, 8, 62, '#d8d8de'); P(6, 10, 2, 62, '#ffffff'); P(190, 10, 2, 62, '#ffffff');
    P(0, 4, 200, 26, '#e02828'); P(0, 4, 200, 3, '#ff6a6a'); P(0, 27, 200, 3, '#900e0e');
    for (var x = 0; x < 200; x += 6) { P(x, 30, 3, 3, '#111'); P(x + 3, 30, 3, 3, '#fff'); P(x, 33, 3, 3, '#fff'); P(x + 3, 33, 3, 3, '#111'); }
    text(g, 'MOTO RUSH', 100 - textW('MOTO RUSH', 3) / 2, 10, '#ffffff', 3);
    P(30, 10, 4, 4, '#ffd23a'); P(166, 10, 4, 4, '#ffd23a');
    return outline(b);
  };
  S.sign = function () { return S.billboard(3); };
  var sceneCache = {};
  // one picture per kind (a few variants for billboards, buildings, fans and flags)
  ART.scenery = function (kind, variant) {
    var v = /billboard|building|fans|flag/.test(kind) ? (variant || 0) % ({ billboard: 5, building: 8, fans: 4, flag: 4 }[kind]) : 0, key = kind + v;
    return sceneCache[key] || (sceneCache[key] = S[kind](v));
  };

  // ======================= backgrounds =======================
  // each layer is painted small (480 wide) and drawn at 2× so it stays pixelly
  function layer(w, h, paint) { var c = cv(w, h); paint(c.getContext('2d'), pen(c.getContext('2d')), w, h); return c; }
  function ridge(g, w, h, base, amp, freq, col, seed) {
    g.fillStyle = col; g.beginPath(); g.moveTo(0, h);
    for (var x = 0; x <= w; x += 2) { var y = base - (Math.sin(x * freq + seed) * 0.6 + Math.sin(x * freq * 2.3 + seed * 2) * 0.3 + Math.sin(x * freq * 5.1 + seed) * 0.1) * amp; g.lineTo(x, Math.round(y)); }
    g.lineTo(w, h); g.fill();
  }
  var BG = {
    coast: { sky: ['#3a7ee0', '#ffd0a0'], sun: ['#ffb040', 0.7, 0.62, 26], layers: [
      [0.15, function (g, P, w, h) { P(0, h - 30, w, 30, '#2a78c8'); for (var x = 0; x < w; x += 7) P(x, h - 30 + (x * 13) % 26, 3, 1, '#9ad8ff'); ridge(g, w, h - 30, h - 32, 10, 0.03, '#3a6a8a', 1); }],
      [0.35, function (g, P, w, h) { ridge(g, w, h, h - 8, 10, 0.02, '#4aa050', 3); }]] },
    alpine: { sky: ['#3a78d8', '#cfeaff'], sun: ['#fff6c0', 0.25, 0.3, 14], layers: [
      [0.12, function (g, P, w, h) { ridge(g, w, h, h - 40, 45, 0.02, '#8a94a8', 2); g.globalCompositeOperation = 'source-atop'; P(0, 0, w, h - 62, '#f4f8ff'); g.globalCompositeOperation = 'source-over'; }],
      [0.3, function (g, P, w, h) { ridge(g, w, h, h - 14, 16, 0.035, '#3a7a40', 5); for (var x = 4; x < w; x += 9) { var y = h - 16 - ((x * 7) % 9); P(x, y, 3, 10, '#1f5a2c'); P(x - 1, y + 3, 5, 6, '#1f5a2c'); } }]] },
    city: { sky: ['#060818', '#3a1a5a'], moon: true, stars: true, layers: [
      [0.1, function (g, P, w, h) { for (var x = 0; x < w; x += 14) { var bh = 24 + (x * 37) % 40; P(x, h - bh, 12, bh, '#1a1838'); for (var y = h - bh + 3; y < h - 3; y += 5) for (var xx = x + 2; xx < x + 11; xx += 4) if ((xx * 3 + y * 7) % 5 < 2) P(xx, y, 2, 2, '#8a7ad8'); } }],
      [0.25, function (g, P, w, h) { for (var x = 0; x < w; x += 22) { var bh = 16 + (x * 53) % 30; P(x, h - bh, 20, bh, '#0e0c22'); if ((x / 22) % 3 === 0) P(x + 3, h - bh + 3, 14, 4, ['#ff3aa0', '#3affd0', '#ffd23a'][(x / 22) % 3 === 0 ? (x % 3) : 0]); } }]] },
    desert: { sky: ['#ff8a3a', '#ffe0a0'], sun: ['#fff0b0', 0.3, 0.55, 22], layers: [
      [0.12, function (g, P, w, h) { for (var x = 0; x < w; x += 60) { var mw = 30 + (x * 7) % 26, mh = 18 + (x * 11) % 22; P(x + 8, h - mh, mw, mh, '#b8503a'); P(x + 8, h - mh, mw, 3, '#d8704a'); P(x + 4, h - 8, mw + 10, 8, '#a8462e'); } }],
      [0.3, function (g, P, w, h) { ridge(g, w, h, h - 6, 7, 0.03, '#e8a060', 4); }]] },
    forest: { sky: ['#8ab8d8', '#e8f2ec'], layers: [
      [0.12, function (g, P, w, h) { ridge(g, w, h, h - 22, 20, 0.025, '#6a9a90', 1); }],
      [0.3, function (g, P, w, h) { ridge(g, w, h, h - 10, 6, 0.05, '#2a5a2e', 2); for (var x = 2; x < w; x += 7) { var t = 8 + (x * 13) % 10; P(x, h - 10 - t, 5, t, '#244e28'); P(x + 1, h - 13 - t, 3, 3, '#244e28'); } }]] },
    volcano: { sky: ['#1a060a', '#c84a20'], smoke: true, layers: [
      [0.08, function (g, P, w, h) { g.fillStyle = '#3a1e1e'; g.beginPath(); g.moveTo(w * 0.25, h); g.lineTo(w * 0.42, h - 70); g.lineTo(w * 0.5, h - 72); g.lineTo(w * 0.67, h); g.fill(); P(w * 0.43, h - 72, w * 0.07, 3, '#ff7a20'); for (var i = 0; i < 6; i++) P(w * 0.44 + i * 3, h - 69 + i * 9, 2, 8, '#ff5a10'); ridge(g, w, h, h - 18, 14, 0.03, '#2a1414', 6); }],
      [0.28, function (g, P, w, h) { ridge(g, w, h, h - 8, 8, 0.045, '#140c0e', 3); }]] }
  };
  var bgCache = {};
  ART.background = function (theme) {
    if (bgCache[theme]) return bgCache[theme];
    var d = BG[theme], out = { sky: d.sky, sun: d.sun, moon: d.moon, layers: d.layers.map(function (L) { return { speed: L[0], img: layer(480, 90, L[1]) }; }) };
    if (d.stars) out.stars = layer(480, 140, function (g, P, w, h) { for (var i = 0; i < 90; i++) P((i * 97) % w, (i * 53) % h, 1, 1, i % 7 ? '#c8d0ff' : '#ffffff'); });
    if (d.smoke) out.smoke = true;
    return (bgCache[theme] = out);
  };
})();
