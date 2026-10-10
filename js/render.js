/*
 * Drawing a race: a pseudo-3D road (segments projected toward the horizon, curves bend the view, hills lift it),
 * painted far → near so hills hide what is behind them, with scenery, riders, dust, nitro flames, speed lines,
 * a camera that rolls with the bike, and the HUD.
 */
(function () {
  'use strict';
  var M = window.MOTO, ART = window.MOTO_ART;
  var W = 960, H = 540, DEPTH = 1, CAM_H = 1500, PLAYER_Z = CAM_H * DEPTH * 1.25, DRAW = 240, SEG = M.SEG, ROAD_W = M.ROAD_W, OVER = 220;
  var BIKE_W = 398;                                       // world width of a bike (68 frame pixels)
  var R = ART.RIDER;
  var COLORS = {
    coast: { road: ['#6e6e74', '#68686e'], grass: ['#3fae49', '#38a043'], rumble: ['#f4f4f4', '#e03030'], lane: '#ffffff', fog: '#ffd8b0', fogD: 3.2 },
    alpine: { road: ['#62626a', '#5c5c64'], grass: ['#52a046', '#4a9440'], rumble: ['#f4f4f4', '#2f6fde'], lane: '#ffffff', fog: '#d8ecff', fogD: 3.6 },
    city: { road: ['#30303a', '#2b2b34'], grass: ['#40404e', '#3a3a48'], rumble: ['#ffd23a', '#22222c'], lane: '#ffd23a', fog: '#2a1a4a', fogD: 4, night: true },
    desert: { road: ['#c98a4c', '#c08244'], grass: ['#eab474', '#e2ac6a'], rumble: ['#f0e8d8', '#d84a2a'], rut: '#a86a36', fog: '#ffe0a8', fogD: 3.4, dust: '#e8b680' },
    forest: { road: ['#7e5634', '#744e2e'], grass: ['#3e8030', '#38762c'], rumble: ['#f0e8d8', '#2f6fde'], rut: '#5a3a1e', fog: '#e8f2ec', fogD: 3.8, dust: '#8a6440' },
    volcano: { road: ['#46393c', '#3f3336'], grass: ['#221c1e', '#2a2326'], rumble: ['#ff6a20', '#2a2226'], rut: '#2a2124', fog: '#7a2a18', fogD: 3.6, dust: '#5a4a4e' }
  };
  var lerp = M.lerp, clamp = M.clamp;
  var HUDF = '"Press Start 2P", monospace', ZHF = '"Noto Sans TC", "Microsoft JhengHei", "PingFang TC", sans-serif';

  function Renderer(canvas) {
    this.c = canvas; this.g = canvas.getContext('2d'); this.g.imageSmoothingEnabled = false;
    this.reset();
  }
  Renderer.prototype.reset = function () { this.sky = 0; this.camY = null; this.shake = 0; this.parts = []; this.msgs = []; this.t = 0; this.lastDist = null; };
  Renderer.prototype.say = function (text, color, dur, size) { this.msgs = this.msgs.filter(function (m) { return m.size !== size; }); this.msgs.push({ text: text, color: color || '#ffd23a', t: dur || 1.6, dur: dur || 1.6, size: size || 1 }); };
  Renderer.prototype.bump = function (amount) { this.shake = Math.max(this.shake, amount); };
  Renderer.prototype.burst = function (n, color, x, y, spread) {
    for (var i = 0; i < n; i++) this.parts.push({ x: x + (Math.random() - 0.5) * spread, y: y, vx: (Math.random() - 0.5) * 260, vy: -60 - Math.random() * 180, t: 0, life: 0.5 + Math.random() * 0.5, r: 4 + Math.random() * 6, c: color });
  };

  function project(p, cx, cy, cz) {
    p.camera.x = -cx; p.camera.y = p.world.y - cy; p.camera.z = p.world.z - cz;
    var sc = p.screen.scale = DEPTH / p.camera.z;
    p.screen.x = W / 2 + sc * p.camera.x * W / 2; p.screen.y = H / 2 - sc * p.camera.y * H / 2; p.screen.w = sc * ROAD_W * W / 2;
  }
  function poly(g, x1, y1, x2, y2, x3, y3, x4, y4, col) { g.fillStyle = col; g.beginPath(); g.moveTo(x1, y1); g.lineTo(x2, y2); g.lineTo(x3, y3); g.lineTo(x4, y4); g.closePath(); g.fill(); }

  // ---------------- one frame ----------------
  Renderer.prototype.draw = function (race, follow, dt, hud) {
    var g = this.g, T = race.track, th = COLORS[T.def.theme], segs = T.segs, N = segs.length, L = T.length, r = follow, self = this;
    this.t += dt;
    var camZ = r.dist - PLAYER_Z, camX = r.x * ROAD_W, targetY = r.y + CAM_H;
    this.followDist = r.dist;
    this.camY = this.camY == null ? targetY : this.camY + (targetY - this.camY) * Math.min(1, dt * 14);
    var camY = this.camY, camZm = M.mod(camZ, L), base = segs[Math.floor(camZm / SEG) % N], basePct = (camZm % SEG) / SEG;
    if (this.lastDist != null) this.sky += base.curve * (r.dist - this.lastDist) / SEG * 0.0016;
    this.lastDist = r.dist;
    this.shake = Math.max(0, this.shake - dt * 3);

    g.save();
    if (this.shake > 0) g.translate((Math.random() - 0.5) * this.shake * 14, (Math.random() - 0.5) * this.shake * 10);
    g.translate(W / 2, H * 0.86); g.rotate(-r.lean * 0.075); g.translate(-W / 2, -H * 0.86);   // the camera rolls with the bike
    this.background(T, th, camY);

    // project every segment from near to far
    var x = 0, dx = -base.curve * basePct, maxy = H, list = [], fIdx = Math.floor(M.mod(r.dist, L) / SEG) % N;
    this.followN = 0;
    for (var n = 0; n < DRAW; n++) {
      var s = segs[(base.index + n) % N], cz = camZm - (s.index < base.index ? L : 0);
      project(s.p1, camX - x, camY, cz); project(s.p2, camX - x - dx, camY, cz);
      x += dx; dx += s.curve;
      s.fog = 1 / Math.pow(Math.E, (n / DRAW) * (n / DRAW) * th.fogD);
      s.vis = s.p1.camera.z > DEPTH && s.p2.screen.y < s.p1.screen.y && s.p2.screen.y < maxy;
      s.n = n; if (s.index === fIdx) this.followN = n;
      if (s.vis) maxy = s.p2.screen.y;
      list.push(s);
    }
    // who rides on which segment
    var on = {}, followSeg = segs[Math.floor(M.mod(r.dist, L) / SEG) % N].index;
    race.riders.forEach(function (o) { if (o === r) return; var i = Math.floor(M.mod(o.dist, L) / SEG) % N; (on[i] = on[i] || []).push(o); });
    // paint from the horizon toward the camera
    for (var k = list.length - 1; k >= 0; k--) {
      s = list[k];
      if (s.vis) this.segment(s, th, T);
      if (s.p1.camera.z <= DEPTH * 40) continue;
      for (var j = 0; j < s.sprites.length; j++) this.sprite(s, s.sprites[j], th);
      if (on[s.index]) on[s.index].sort(function (a, b) { return b.dist - a.dist; }).forEach(function (o) { self.otherRider(o, s, T, hud); });
      if (s.index === followSeg) this.followRider(r, T, th, dt);
    }
    this.particles(dt);
    g.restore();
    this.speedLines(r, T);
    if (hud) this.hud(race, r, hud, dt);
  };

  Renderer.prototype.background = function (T, th, camY) {
    var g = this.g, bg = ART.background(T.def.theme), lift = clamp((camY - CAM_H) * 0.004, -30, 60);
    var gr = g.createLinearGradient(0, 0, 0, H / 2 + 40);
    gr.addColorStop(0, bg.sky[0]); gr.addColorStop(1, bg.sky[1]);
    g.fillStyle = gr; g.fillRect(-OVER, -OVER, W + OVER * 2, H + OVER * 2);
    if (bg.stars) g.drawImage(bg.stars, -OVER, -20, W + OVER * 2, 300);
    if (bg.sun) { var sx = W * bg.sun[1] - this.sky * 300 % W, sy = H * bg.sun[2] * 0.5 + lift; g.fillStyle = bg.sun[0]; g.globalAlpha = 0.25; g.beginPath(); g.arc(sx, sy, bg.sun[3] * 3.2, 0, Math.PI * 2); g.fill(); g.globalAlpha = 1; g.beginPath(); g.arc(sx, sy, bg.sun[3] * 2, 0, Math.PI * 2); g.fill(); }
    if (bg.moon) { g.fillStyle = '#f4f0d8'; g.beginPath(); g.arc(W * 0.78 - this.sky * 200 % W, 70, 26, 0, Math.PI * 2); g.fill(); g.fillStyle = bg.sky[0]; g.beginPath(); g.arc(W * 0.78 - this.sky * 200 % W + 10, 64, 22, 0, Math.PI * 2); g.fill(); }
    if (bg.smoke) { g.fillStyle = 'rgba(40,20,20,0.35)'; for (var i = 0; i < 6; i++) { var t = this.t * 6 + i * 40; g.beginPath(); g.arc(W * 0.45 + Math.sin(t / 40) * 30 - this.sky * 380 % W, H / 2 - 140 - (t % 240) * 0.6 + lift, 30 + (t % 240) * 0.2, 0, Math.PI * 2); g.fill(); } }
    var self = this;
    bg.layers.forEach(function (L) {
      var w = L.img.width * 2, h = L.img.height * 2, off = ((self.sky * L.speed * 8 * w) % w + w) % w, y = H / 2 - h + 6 + lift * (0.5 + L.speed);
      for (var x = -off - w; x < W + OVER; x += w) g.drawImage(L.img, x, y, w, h);
    });
  };

  Renderer.prototype.segment = function (s, th, T) {
    var g = this.g, p1 = s.p1.screen, p2 = s.p2.screen, d = s.dark ? 1 : 0, ramp = s.kind === 'ramp';
    g.fillStyle = th.grass[d]; g.fillRect(-OVER, p2.y, W + OVER * 2, p1.y - p2.y + 1);
    var r1 = p1.w / 7, r2 = p2.w / 7, road = ramp ? (d ? '#d8a868' : '#e0b070') : th.road[d];
    poly(g, p1.x - p1.w - r1, p1.y, p1.x - p1.w, p1.y, p2.x - p2.w, p2.y, p2.x - p2.w - r2, p2.y, th.rumble[d]);
    poly(g, p1.x + p1.w + r1, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x + p2.w + r2, p2.y, th.rumble[d]);
    poly(g, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, road);
    if (s.finish) {                                        // the chequered line
      for (var i = 0; i < 12; i++) for (var j = 0; j < 2; j++) {
        if ((i + j + s.index) % 2) continue;
        var a = -1 + i / 6, b = a + 1 / 6, t1 = j / 2, t2 = (j + 1) / 2;
        var y1 = lerp(p1.y, p2.y, t1), y2 = lerp(p1.y, p2.y, t2), xa = lerp(p1.x, p2.x, t1), xb = lerp(p1.x, p2.x, t2), wa = lerp(p1.w, p2.w, t1), wb = lerp(p1.w, p2.w, t2);
        poly(g, xa + a * wa, y1, xa + b * wa, y1, xb + b * wb, y2, xb + a * wb, y2, '#111');
      }
      poly(g, p1.x - p1.w, p1.y, p1.x + p1.w, p1.y, p2.x + p2.w, p2.y, p2.x - p2.w, p2.y, 'rgba(255,255,255,0.35)');
    } else if (th.lane) {
      if (!s.dark) [-1 / 3, 1 / 3].forEach(function (o) { var l1 = p1.w / 40, l2 = p2.w / 40; poly(g, p1.x + o * p1.w - l1, p1.y, p1.x + o * p1.w + l1, p1.y, p2.x + o * p2.w + l2, p2.y, p2.x + o * p2.w - l2, p2.y, th.lane); });
    } else if (!ramp) {
      [-0.32, 0.32].forEach(function (o) { var l1 = p1.w / 22, l2 = p2.w / 22; poly(g, p1.x + o * p1.w - l1, p1.y, p1.x + o * p1.w + l1, p1.y, p2.x + o * p2.w + l2, p2.y, p2.x + o * p2.w - l2, p2.y, th.rut); });
    }
    if (s.fog < 1) { g.globalAlpha = 1 - s.fog; g.fillStyle = th.fog; g.fillRect(-OVER, p2.y, W + OVER * 2, p1.y - p2.y + 1); g.globalAlpha = 1; }
  };

  Renderer.prototype.sprite = function (s, sp, th) {
    var g = this.g, sc = s.p1.screen.scale, img = ART.scenery(sp.kind, s.index * 7 + Math.round(sp.offset * 10)), dw, dh, x, y, cx;
    if (sp.kind === 'gantry') { dw = sc * ROAD_W * 2.7 * W / 2; cx = s.p1.screen.x; }
    else { dw = sc * M.SIZES[sp.kind][0] * W / 2; cx = s.p1.screen.x + sc * sp.offset * ROAD_W * W / 2; }
    dh = dw * img.height / img.width; x = cx - dw / 2; y = s.p1.screen.y - dh;
    if (dw < 1.2 || x > W + OVER || x + dw < -OVER || y > H) return;
    var between = s.n < this.followN && x < W / 2 + 70 && x + dw > W / 2 - 70;   // between the camera and you: see-through
    g.globalAlpha = between ? 0.35 : s.fog; g.drawImage(img, x, y, dw, dh); g.globalAlpha = 1;
    if (th.night && sp.kind === 'lamp' && dw < 60) this.glow(cx + dw * 0.2, y + dh * 0.1, Math.min(90, dw * 2.4), 'rgba(255,240,170,', 0.5 * s.fog);
  };
  Renderer.prototype.glow = function (x, y, rad, rgba, a) {
    var g = this.g, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, rgba + a + ')'); gr.addColorStop(1, rgba + '0)');
    g.globalCompositeOperation = 'lighter'; g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2); g.globalCompositeOperation = 'source-over';
  };

  // a rider somewhere up the road
  Renderer.prototype.otherRider = function (o, s, T, hud) {
    var L = T.length, pct = (M.mod(o.dist, L) % SEG) / SEG, p1 = s.p1.screen, p2 = s.p2.screen, sc = lerp(p1.scale, p2.scale, pct);
    if (!(sc > 0) || s.p1.camera.z <= DEPTH) return;
    var gx = lerp(p1.x, p2.x, pct) + sc * o.x * ROAD_W * W / 2, gy = lerp(p1.y, p2.y, pct), hy = (o.y - T.yAt(o.dist)) * sc * H / 2;
    var k = sc * W / 2 * BIKE_W / R.ART_W;
    if (gx < -200 || gx > W + 200 || k < 0.04) return;
    var behind = this.followDist != null && o.dist < this.followDist && Math.abs(gx - W / 2) < 90 * k;   // between the camera and you: see-through
    this.bike(o, gx, gy - hy, gy, k, behind ? 0.45 : s.fog, T);
    if (hud && s.fog > 0.6 && k > 0.35) {
      var g = this.g; g.font = '10px ' + HUDF; g.textAlign = 'center'; g.fillStyle = 'rgba(0,0,0,0.55)';
      var nm = o.name.split(' ')[0], w = g.measureText(nm).width + 8;
      g.fillRect(gx - w / 2, gy - hy - 92 * k - 14, w, 14); g.fillStyle = o.e.star ? '#ffd23a' : '#ffffff'; g.fillText(nm, gx, gy - hy - 92 * k - 3);
    }
  };
  // the rider the camera follows, always in the middle of the screen
  Renderer.prototype.followRider = function (r, T, th, dt) {
    var sc = DEPTH / PLAYER_Z, groundY = H / 2 - sc * (T.yAt(r.dist) - this.camY) * H / 2, bikeY = H / 2 - sc * (r.y - this.camY) * H / 2;
    var k = sc * W / 2 * BIKE_W / R.ART_W, P = T.P;
    this.bike(r, W / 2, bikeY, groundY, k, 1, T);
    // dust, grass and sparks behind the wheel
    var off = Math.abs(r.x) > 1, pct = r.speed / P.max;
    if (!r.air && r.crashT <= 0 && pct > 0.15 && (th.dust || off) && Math.random() < pct * 1.4) {
      var col = off ? th.grass[0] : th.dust;
      this.parts.push({ x: W / 2 + (Math.random() - 0.5) * 30 * k, y: groundY - 4, vx: (Math.random() - 0.5) * 300, vy: -40 - Math.random() * 120, t: 0, life: 0.45 + Math.random() * 0.3, r: (5 + Math.random() * 7) * k, c: col });
    }
    this.followPos = { x: W / 2, y: bikeY, ground: groundY, k: k };
  };
  Renderer.prototype.bike = function (o, x, y, groundY, k, alpha, T) {
    var g = this.g, art = ART.rider(o.e, T.type);
    g.globalAlpha = alpha * 0.35; g.fillStyle = '#000';
    var shw = (o.air ? Math.max(0.4, 1 - (groundY - y) / 300) : 1) * 26 * k;
    g.beginPath(); g.ellipse(x, groundY, shw, shw * 0.28, 0, 0, Math.PI * 2); g.fill();
    g.globalAlpha = alpha;
    if (o.crashT > 0) {                                     // tumbling rider, bike sliding away
      var t = 1.8 - o.crashT, slide = Math.min(1, t * 1.6);
      g.save(); g.translate(x + (o.x > 0 ? 1 : -1) * slide * 40 * k, groundY - 8 * k); g.rotate(slide * 1.2);
      g.drawImage(art.crashBike, -40 * k, -16 * k, 80 * k, 32 * k); g.restore();
      g.save(); g.translate(x - (o.x > 0 ? 1 : -1) * slide * 20 * k, groundY - 22 * k - Math.abs(Math.sin(t * 6)) * 30 * k * (1 - slide * 0.6)); g.rotate(o.spin);
      g.drawImage(art.crashRider, -18 * k, -18 * k, 36 * k, 36 * k); g.restore();
      g.globalAlpha = 1; return;
    }
    var img, rot = 0;
    if (o.trick && art.tricks) { img = art.tricks[o.trick.k % 2]; rot = Math.sin(o.trick.t * 9) * 0.12; }
    else { var a = clamp(o.lean * 0.75, -0.8, 0.8); img = art.lean[Math.round(a / 0.8 * (R.LEANS - 1) / 2 + (R.LEANS - 1) / 2)]; }
    var wob = o.air ? 0 : Math.sin(this.t * 40 + o.i) * 0.6 * Math.min(1, o.speed / 2000);
    if (rot) { g.save(); g.translate(x, y); g.rotate(rot); g.drawImage(img, -R.PX * k, -R.PY * k, R.FW * k, R.FH * k); g.restore(); }
    else g.drawImage(img, x - R.PX * k, y - R.PY * k + wob, R.FW * k, R.FH * k);
    if (o.nitroOn) {                                        // nitro flames from the exhausts
      var f = 0.7 + Math.random() * 0.5;
      [-13, 13].forEach(function (ex) { this.glow(x + ex * k, y - 15 * k, 16 * k * f, 'rgba(90,170,255,', 0.9); this.glow(x + ex * k, y - 13 * k, 9 * k * f, 'rgba(255,200,120,', 0.9); }, this);
    }
    if (COLORS[T.def.theme].night) this.glow(x, y - 32 * k, 10 * k, 'rgba(255,40,60,', 0.8);
    g.globalAlpha = 1;
  };
  Renderer.prototype.particles = function (dt) {
    var g = this.g;
    this.parts = this.parts.filter(function (p) { p.t += dt; return p.t < p.life; });
    this.parts.forEach(function (p) {
      p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 300 * dt;
      g.globalAlpha = 0.7 * (1 - p.t / p.life); g.fillStyle = p.c;
      g.beginPath(); g.arc(p.x, p.y, p.r * (1 + p.t * 1.5), 0, Math.PI * 2); g.fill();
    });
    g.globalAlpha = 1;
    if (this.parts.length > 160) this.parts.splice(0, this.parts.length - 160);
  };
  Renderer.prototype.speedLines = function (r, T) {
    var pct = r.speed / T.P.max, g = this.g;
    if (pct < 0.85 && !r.nitroOn) return;
    var a = Math.min(0.5, (pct - 0.8) * 1.5 + (r.nitroOn ? 0.25 : 0));
    g.strokeStyle = 'rgba(255,255,255,' + a + ')'; g.lineWidth = 2;
    for (var i = 0; i < 14; i++) {
      var ang = (i / 14) * Math.PI * 2 + this.t * 0.7, len = 60 + ((i * 37 + this.t * 900) % 120);
      var r0 = 330 + ((i * 53 + this.t * 1400) % 200);
      var cx = W / 2, cy = H * 0.45;
      g.beginPath(); g.moveTo(cx + Math.cos(ang) * r0, cy + Math.sin(ang) * r0 * 0.6); g.lineTo(cx + Math.cos(ang) * (r0 + len), cy + Math.sin(ang) * (r0 + len) * 0.6); g.stroke();
    }
  };

  // ---------------- the HUD ----------------
  function clock(t) { if (!(t >= 0)) t = 0; var m = Math.floor(t / 60), s = t - m * 60; return m + ':' + (s < 10 ? '0' : '') + s.toFixed(2); }
  Renderer.prototype.clock = clock;
  function label(g, txt, x, y, col, size, align, zh) {
    g.font = (zh ? 'bold ' + (size + 3) + 'px ' + ZHF : size + 'px ' + HUDF); g.textAlign = align || 'left';
    g.fillStyle = 'rgba(0,0,0,0.6)'; g.fillText(txt, x + 2, y + 2); g.fillStyle = col; g.fillText(txt, x, y);
  }
  Renderer.prototype.hud = function (race, r, H2, dt) {
    var g = this.g, T = race.track, L = H2.L, zh = H2.lang === 'zh';
    if (H2.trial !== true) {
      label(g, L.pos, 22, 30, '#c8d0e8', 10, 'left', zh);
      label(g, String(r.pos || 1), 22, 78, r.pos === 1 ? '#ffd23a' : '#ffffff', 40);
      label(g, '/' + race.riders.length, 22 + (r.pos >= 10 ? 84 : 46), 78, '#c8d0e8', 16);
    }
    var lap = Math.min(race.laps, Math.max(1, r.lapsDone + 1));
    label(g, L.lap + ' ' + lap + '/' + race.laps, W / 2, 34, '#ffffff', 16, 'center', zh && false);
    var cur = race.state === 'countdown' ? 0 : Math.max(0, race.time - r.lapStart);
    label(g, L.time, W - 22, 26, '#c8d0e8', 10, 'right', zh); label(g, clock(race.time), W - 22, 48, '#ffffff', 16, 'right');
    label(g, L.lapTime + ' ' + clock(r.finished ? r.lapTimes[r.lapTimes.length - 1] : cur), W - 22, 72, '#ffffff', 10, 'right', zh);
    if (r.best) label(g, L.best + ' ' + clock(r.best), W - 22, 92, '#7ae0ff', 10, 'right', zh);
    this.minimap(race, r, W - 120, 104, 98);
    // speed and nitro
    var kmh = Math.round(r.speed * T.P.kmh);
    label(g, String(kmh), W - 96, H - 40, r.nitroOn ? '#7ae0ff' : '#ffffff', 34, 'right');
    label(g, 'km/h', W - 22, H - 40, '#c8d0e8', 10, 'right');
    var bw = 170, bx = W - 22 - bw, by = H - 28;
    g.fillStyle = 'rgba(0,0,0,0.55)'; g.fillRect(bx - 2, by - 2, bw + 4, 14);
    var gr = g.createLinearGradient(bx, 0, bx + bw, 0); gr.addColorStop(0, '#2f8aff'); gr.addColorStop(1, '#7ae0ff');
    g.fillStyle = gr; g.fillRect(bx, by, bw * r.nitro, 10);
    label(g, L.nitro, bx - 8, by + 10, r.nitro > 0.25 ? '#7ae0ff' : '#8890a8', 10, 'right', zh);
    if (r.air && T.type === 'dirt' && !r.trick && r.airT < 0.5 && H2.showTrickHint) label(g, L.trickHint, W / 2, H * 0.22, '#ffd23a', 12, 'center', zh);
    // messages in the middle
    var self = this;
    this.msgs = this.msgs.filter(function (m) { m.t -= dt; return m.t > 0; });
    this.msgs.forEach(function (m) {
      var a = Math.min(1, m.t * 3, (m.dur - m.t) * 8), sz = m.size === 3 ? 64 : m.size === 2 ? 30 : 16, y = m.size === 3 ? H * 0.4 : m.size === 2 ? H * 0.3 : H * 0.62;
      g.globalAlpha = a; label(g, m.text, W / 2, y + (1 - a) * 10, m.color, zh && !/^[\x00-\x7F]*$/.test(m.text) ? sz * 0.8 : sz, 'center', zh && !/^[\x00-\x7F]*$/.test(m.text)); g.globalAlpha = 1;
    });
  };
  Renderer.prototype.minimap = function (race, r, x, y, s) {
    var g = this.g, map = race.track.map, L = race.track.length, N = map.length;
    g.fillStyle = 'rgba(0,0,0,0.35)'; g.fillRect(x - s / 2 - 6, y - 6, s + 12, s + 12);
    g.strokeStyle = '#ffffff'; g.lineWidth = 3; g.beginPath();
    for (var i = 0; i < N; i += 4) { var p = map[i]; if (i) g.lineTo(x + p[0] * s, y + s / 2 + p[1] * s); else g.moveTo(x + p[0] * s, y + s / 2 + p[1] * s); }
    g.closePath(); g.stroke();
    race.riders.forEach(function (o) {
      var p = map[Math.floor(M.mod(o.dist, L) / SEG) % N];
      g.fillStyle = o === r ? '#ffd23a' : o.e.main; g.beginPath(); g.arc(x + p[0] * s, y + s / 2 + p[1] * s, o === r ? 5 : 3.5, 0, Math.PI * 2); g.fill();
      if (o === r) { g.strokeStyle = '#000'; g.lineWidth = 1.5; g.stroke(); }
    });
  };

  window.MOTO_RENDER = { Renderer: Renderer, W: W, H: H, COLORS: COLORS, clock: clock };
})();
