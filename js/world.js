/*
 * The game world without any drawing (runs in Node too — see tools/sim.js):
 *   Track: the road as a loop of segments (curve, height), with the roadside scenery
 *   Race:  the riders — physics (throttle, steering against the curve, nitro, slipstream, jumps, tricks, crashes),
 *          the AI, collisions, laps, positions and results
 * Units: a segment is SEG long; x across the road is −1 … 1 between the road edges; heights and distances in world units.
 */
(function (root) {
  'use strict';
  var SEG = 200, RUMBLE = 3, ROAD_W = 2000, G = 12000, TRICK_TIME = 0.55;
  // handling of the two kinds of bike
  var TYPES = {
    road: { max: 12000, accel: 5400, brake: -15000, decel: -2400, offDecel: -9500, offLimit: 3000, centrifugal: 0.32, turn: 2.4, kmh: 290 / 12000 },
    dirt: { max: 8600, accel: 5000, brake: -12000, decel: -2200, offDecel: -6500, offLimit: 2600, centrifugal: 0.27, turn: 2.6, kmh: 128 / 8600 }
  };
  // roadside things: world width, how much of that width you can hit, and 'soft' for things that bounce you back instead of knocking you off
  var SIZES = {
    palm: [1500, 0.22], pine: [1300, 0.25], snowpine: [1300, 0.25], tree: [1600, 0.22], deadtree: [1300, 0.2], cactus: [700, 0.45],
    rock: [1100, 0.75], lavarock: [1200, 0.75], bush: [900, 0], billboard: [2600, 0.9], tires: [520, 0.9, 'soft'], hay: [900, 0.95, 'soft'], flag: [420, 0.3],
    lamp: [520, 0.25], building: [3400, 0.95], chevronL: [650, 0.5], chevronR: [650, 0.5], fans: [2600, 0.9], gantry: [0, 0], sign: [1900, 0.9]
  };
  var TRICKS = [{ en: 'No-Hander', zh: '放雙手' }, { en: 'Nac-Nac', zh: '側踢腿' }, { en: 'Superman', zh: '超人飛' }, { en: 'Heel Clicker', zh: '腳跟互擊' }, { en: 'Cliffhanger', zh: '懸崖吊掛' }];

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var lerp = function (a, b, p) { return a + (b - a) * p; };
  var easeIn = function (a, b, p) { return a + (b - a) * p * p; };
  var easeInOut = function (a, b, p) { return a + (b - a) * (-Math.cos(p * Math.PI) / 2 + 0.5); };
  var mod = function (v, n) { return ((v % n) + n) % n; };
  function rng(seed) { var s = seed >>> 0 || 1; return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
  function hash(str) { var h = 2166136261; for (var i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  // ======================= the track =======================
  function Track(def) {
    var segs = this.segs = [], self = this;
    this.def = def; this.type = def.type; this.P = TYPES[def.type];
    var lastY = function () { return segs.length ? segs[segs.length - 1].p2.world.y : 0; };
    var add = function (curve, y, kind) {
      var n = segs.length;
      segs.push({ index: n, curve: curve, kind: kind || '', sprites: [], dark: Math.floor(n / RUMBLE) % 2 === 1,
        p1: { world: { y: lastY(), z: n * SEG }, camera: {}, screen: {} }, p2: { world: { y: y, z: (n + 1) * SEG }, camera: {}, screen: {} } });
    };
    var road = function (enter, hold, leave, curve, dy) {
      var y0 = lastY(), y1 = y0 + dy, tot = enter + hold + leave, i;
      for (i = 0; i < enter; i++) add(easeIn(0, curve, i / enter), easeInOut(y0, y1, (i + 1) / tot));
      for (i = 0; i < hold; i++) add(curve, easeInOut(y0, y1, (enter + i + 1) / tot));
      for (i = 0; i < leave; i++) add(easeInOut(curve, 0, i / leave), easeInOut(y0, y1, (enter + hold + i + 1) / tot));
    };
    var curveStarts = [];
    def.road.forEach(function (c) {
      var n = c[1], q = Math.floor(n / 4), i, y0;
      if (c[0] === 's') road(q, n - 2 * q, q, 0, (c[2] || 0) * SEG);
      if (c[0] === 'c') { curveStarts.push([segs.length, c[2]]); road(q, n - 2 * q, q, c[2], (c[3] || 0) * SEG); }
      if (c[0] === 'j') {                                   // a steep ramp, then the landing slope
        y0 = lastY(); var h = c[1] * SEG, land = c[2];
        for (i = 0; i < 8; i++) add(0, y0 + h * (i + 1) / 8, 'ramp');
        for (i = 0; i < land; i++) add(0, easeInOut(y0 + h, y0, (i + 1) / land), 'land');
      }
      if (c[0] === 'w') for (i = 0; i < n; i++) { y0 = lastY(); [70, 120, 70, 0].forEach(function (d) { add(0, y0 + d, 'whoop'); }); }
    });
    if (Math.abs(lastY()) > 1) road(25, 30, 25, 0, -lastY());   // back to the starting height
    this.length = segs.length * SEG;
    this.curveStarts = curveStarts;
    this.decorate();
    this.map = this.buildMap();
  }
  Track.prototype.segAt = function (dist) { return this.segs[Math.floor(mod(dist, this.length) / SEG) % this.segs.length]; };
  Track.prototype.yAt = function (dist) {
    var z = mod(dist, this.length), s = this.segs[Math.floor(z / SEG) % this.segs.length];
    return lerp(s.p1.world.y, s.p2.world.y, (z % SEG) / SEG);
  };
  // roadside scenery for each theme: [kind, weight] lists, how dense, and trackside rows
  var SCENERY = {
    coast: { far: [['palm', 6], ['bush', 3], ['rock', 2], ['billboard', 1]], density: 0.32, oneSide: 1 },
    alpine: { far: [['pine', 5], ['snowpine', 4], ['rock', 2], ['billboard', 1]], density: 0.4 },
    city: { far: [['building', 1]], density: 0, lamps: 9, buildings: true },
    desert: { far: [['cactus', 5], ['rock', 4], ['flag', 1], ['bush', 1]], density: 0.25, side: [['hay', 3], ['tires', 2]], sideEvery: 5 },
    forest: { far: [['tree', 5], ['pine', 3], ['bush', 3], ['flag', 1]], density: 0.45, side: [['hay', 3], ['tires', 1]], sideEvery: 5 },
    volcano: { far: [['lavarock', 4], ['deadtree', 3], ['rock', 2], ['flag', 1]], density: 0.28, side: [['tires', 3], ['hay', 1]], sideEvery: 5 }
  };
  function pickW(R, list) { var t = 0, i; for (i = 0; i < list.length; i++) t += list[i][1]; var x = R() * t; for (i = 0; i < list.length; i++) { x -= list[i][1]; if (x <= 0) return list[i][0]; } return list[0][0]; }
  Track.prototype.decorate = function () {
    var segs = this.segs, N = segs.length, sc = SCENERY[this.def.theme], R = rng(hash(this.def.id)), i, s;
    var put = function (i, kind, offset) { segs[mod(i, N)].sprites.push({ kind: kind, offset: offset }); };
    segs[0].finish = segs[1].finish = true;
    put(3, 'gantry', 0);
    for (i = 8; i < 40; i += 4) { put(i, 'fans', -1.75 - R() * 0.4); put(i + 2, 'fans', 1.75 + R() * 0.4); }
    for (i = 44; i < N - 6; i++) {
      s = segs[i];
      if (sc.density && R() < sc.density) {
        var side = sc.oneSide ? (R() < 0.75 ? sc.oneSide : -sc.oneSide) : (R() < 0.5 ? -1 : 1);
        put(i, pickW(R, sc.far), side * (1.45 + R() * 2.6));
      }
      if (sc.lamps && i % sc.lamps === 0) { put(i, 'lamp', -1.32); put(i, 'lamp', 1.32); }
      if (sc.buildings && i % 5 === 0) { put(i, 'building', -(2.3 + R() * 1.6)); put(i + 2, 'building', 2.3 + R() * 1.6); }
      if (sc.side && i % sc.sideEvery === 0 && s.kind !== 'ramp') { put(i, pickW(R, sc.side), -1.2); put(i, pickW(R, sc.side), 1.2); }
      if (!sc.side && !sc.lamps && i % 160 === 80) put(i, 'billboard', (R() < 0.5 ? -1 : 1) * 1.6);
    }
    // warning chevrons on the outside of sharper bends
    this.curveStarts.forEach(function (c) {
      if (Math.abs(c[1]) < 4) return;
      var out = c[1] > 0 ? -1.22 : 1.22, kind = c[1] > 0 ? 'chevronR' : 'chevronL';
      [-14, -8, -2].forEach(function (k) { put(c[0] + k, kind, out); });
    });
  };
  // a top-down outline for the minimap (curves integrated into a heading, the gap closed at the end)
  Track.prototype.buildMap = function () {
    // bends turn the heading; a small steady turn is added so the whole lap turns exactly once around
    var a = 0, x = 0, y = 0, pts = [], K = 0.0042, N = this.segs.length, total = 0;
    this.segs.forEach(function (s) { total += s.curve * K; });
    var extra = ((total >= 0 ? 1 : -1) * Math.PI * 2 - total) / N;
    this.segs.forEach(function (s) { a += s.curve * K + extra; x += Math.sin(a); y -= Math.cos(a); pts.push([x, y]); });
    var ex = pts[pts.length - 1][0], ey = pts[pts.length - 1][1], n = pts.length;
    pts = pts.map(function (p, i) { return [p[0] - ex * (i + 1) / n, p[1] - ey * (i + 1) / n]; });
    var minx = Infinity, maxx = -Infinity, miny = Infinity, maxy = -Infinity;
    pts.forEach(function (p) { minx = Math.min(minx, p[0]); maxx = Math.max(maxx, p[0]); miny = Math.min(miny, p[1]); maxy = Math.max(maxy, p[1]); });
    var sc = 1 / Math.max(maxx - minx, maxy - miny);
    return pts.map(function (p) { return [(p[0] - (minx + maxx) / 2) * sc, (p[1] - (miny + maxy) / 2) * sc]; });
  };

  // ======================= a race =======================
  var SKILL = { easy: 0.9, normal: 0.965, hard: 1.0 };
  function Race(track, entries, opt) {
    opt = opt || {};
    this.track = track; this.P = track.P; this.laps = opt.laps || 3; this.mode = opt.mode || 'race';
    this.time = 0; this.count = opt.countdown != null ? opt.countdown : 3.6; this.state = this.count > 0 ? 'countdown' : 'race';
    this.events = []; this.player = opt.player != null ? opt.player : 0; this.finished = 0; this.gasHeld = 0;
    var R = this.rand = rng(opt.seed || (Date.now() & 0xffffff)), base = SKILL[opt.difficulty || 'normal'], self = this;
    var slots = entries.map(function (_, i) { return i; });
    var mySlot = entries.length - 1;                                     // you start at the back of the grid
    if (this.player >= 0) { slots.splice(this.player, 1); slots.splice(mySlot, 0, this.player); }
    this.riders = entries.map(function (e, i) {
      var slot = slots.indexOf(i), row = Math.floor(slot / 2);
      return { e: e, i: i, name: e.name, ai: i !== self.player, stats: e.stats, dist: -(160 + row * 650), x: slot % 2 ? 0.38 : -0.38,
        speed: 0, y: 0, vy: 0, gyPrev: 0, air: false, airT: 0, lean: 0, nitro: 0.5, nitroOn: false, nitroWant: 0, draft: 0,
        crashT: 0, inv: 0, spin: 0, trick: null, lapsDone: -1, lapStart: 0, lapTimes: [], best: 0, finished: false, finishTime: 0, place: 0,
        skill: clamp(base + (R() - 0.5) * 0.04 + (e.star ? 0.012 : 0), 0.8, 1.02), skillTop: 1, lane: [-1, 0, 1][Math.floor(R() * 3)], laneT: 2 + R() * 4, bumpT: 0 };
    });
    this.riders.forEach(function (r) { r.gyPrev = r.y = track.yAt(r.dist); });
  }
  Race.prototype.ev = function (type, o) { o = o || {}; o.type = type; this.events.push(o); };
  Race.prototype.me = function () { return this.player >= 0 ? this.riders[this.player] : null; };

  Race.prototype.update = function (dt, ctl) {
    var self = this, me = this.me();
    if (this.state === 'countdown') {
      var before = Math.ceil(this.count);
      this.count -= dt;
      if (ctl && ctl.gas) this.gasHeld += dt; else this.gasHeld = 0;
      if (Math.ceil(this.count) !== before && this.count > 0 && before <= 3) this.ev('count', { n: Math.ceil(this.count) });
      if (this.count <= 0) {
        this.state = 'race'; this.ev('go');
        if (me && this.gasHeld > 0 && this.gasHeld < 0.75) { me.speed = this.P.max * 0.22; me.nitro = Math.min(1, me.nitro + 0.3); this.ev('perfect'); }
        this.riders.forEach(function (r) { if (r.ai) r.speed = self.P.max * 0.08 * self.rand(); });
      }
      return;
    }
    this.time += dt;
    this.riders.forEach(function (r) { self.drive(r, r.ai || r.finished ? self.think(r, dt) : ctl || {}, dt); });
    this.collide(dt);
    this.rank();
    if (this.state === 'race' && me && me.finished && this.time > me.finishTime + 6) this.end();
    if (this.state === 'race' && this.riders.every(function (r) { return r.finished; })) this.end();
  };

  Race.prototype.drive = function (r, c, dt) {
    var P = this.P, st = r.stats, T = this.track, seg = T.segAt(r.dist), steer = clamp(c.steer || 0, -1, 1), gy, gvy;
    r.inv -= dt; r.bumpT -= dt;
    if (r.crashT > 0) {                                     // tumbling: slide to a stop, then get back on
      r.crashT -= dt; r.spin += dt * 9; r.speed = Math.max(0, r.speed - 9000 * dt); r.dist += r.speed * dt;
      gy = T.yAt(r.dist); r.y = gy; r.vy = 0; r.gyPrev = gy; r.air = false; r.lean = 0;
      if (r.crashT <= 0) { r.x = clamp(r.x, -0.7, 0.7); r.speed = 0; r.inv = 1.6; }
      this.lapCheck(r);
      return;
    }
    var pct = r.speed / P.max;
    r.nitroOn = !!c.nitro && r.nitro > 0.02 && !r.air;
    if (r.nitroOn) r.nitro -= 0.45 * dt; else r.nitro = Math.min(1, r.nitro + 0.02 * dt);
    var max = P.max * st.top * (r.ai ? r.skill * r.skillTop : 1) * (r.nitroOn ? 1.25 : 1) * (r.draft > 0.4 ? 1.03 : 1);
    if (!r.air) {
      if (c.brake) r.speed += P.brake * dt;
      else if (c.gas) r.speed += P.accel * st.accel * (r.nitroOn ? 1.6 : 1) * (1 - 0.55 * Math.min(1, pct)) * dt;
      else r.speed += P.decel * dt;
      if (Math.abs(r.x) > 1 && r.speed > P.offLimit) r.speed += P.offDecel * dt;      // grass, sand, mud
    } else r.speed += P.decel * 0.1 * dt;
    if (r.speed > max) r.speed = Math.max(max, r.speed - 6000 * dt);
    r.speed = clamp(r.speed, 0, P.max * 1.4);
    pct = r.speed / P.max;
    var dx = dt * P.turn * st.handling * Math.min(1, 0.25 + pct);
    if (r.air) r.x += steer * dx * 0.35;
    else { r.x += steer * dx; r.x -= dx * pct * seg.curve * P.centrifugal / st.grip; }  // the bend pushes you outwards
    r.x = clamp(r.x, -3.2, 3.2);
    var leanT = r.air ? steer * 0.15 : clamp(steer * 0.5 + seg.curve * pct * 0.07, -0.95, 0.95);
    r.lean += (leanT - r.lean) * Math.min(1, dt * 7);
    r.dist += r.speed * dt;
    // up and down: follow the ground, or fly when it drops away faster than gravity
    gy = T.yAt(r.dist); gvy = (gy - r.gyPrev) / dt; r.gyPrev = gy;
    if (!r.air) {
      if (gvy < r.vy - G * dt * 1.5 && r.vy > 600) { r.air = true; r.airT = 0; r.y += r.vy * dt; if (!r.ai) this.ev('takeoff', { r: r }); }
      else { r.y = gy; r.vy = gvy; }
    } else {
      r.airT += dt; r.vy -= G * dt; r.y += r.vy * dt;
      if (c.trick && !r.trick && r.airT > 0.05) r.trick = { t: 0, k: Math.floor(this.rand() * TRICKS.length) };
      if (r.trick) r.trick.t += dt;
      if (r.y <= gy) {
        r.air = false; r.y = gy;
        if (r.trick && r.trick.t < TRICK_TIME) { this.crash(r, 'trick'); return; }
        if (r.trick) { r.nitro = Math.min(1, r.nitro + 0.35); this.ev('trick', { r: r, name: TRICKS[r.trick.k], air: r.airT }); }
        if (r.airT > 0.85) r.speed *= 0.94;
        if (!r.ai) this.ev('land', { r: r, air: r.airT, hard: r.airT > 0.85 });
        r.vy = gvy; r.trick = null;
      }
    }
    // hitting something at the roadside
    if (!r.air && Math.abs(r.x) > 1 && r.inv <= 0) {
      var hit = null;
      seg.sprites.forEach(function (s) {
        var sz = SIZES[s.kind]; if (!sz || !sz[1] || hit) return;
        var reach = sz[0] * sz[1] / ROAD_W / 2 + 0.06;
        if (Math.abs(r.x - s.offset) < reach) hit = { s: s, reach: reach, soft: sz[2] === 'soft' };
      });
      if (hit && hit.soft) {                                // hay bales and tyre walls: bounce back onto the track
        r.x = hit.s.offset - Math.sign(hit.s.offset) * (hit.reach + 0.04); r.speed *= 0.6; r.inv = 0.3;
        if (!r.ai) this.ev('bump');
      } else if (hit) this.crash(r, 'scenery');
    }
    this.lapCheck(r);
  };
  Race.prototype.crash = function (r, why) {
    r.crashT = 1.8; r.speed *= 0.55; r.nitroOn = false; r.trick = null; r.air = false; r.spin = 0;
    this.ev('crash', { r: r, why: why });
  };
  Race.prototype.lapCheck = function (r) {
    var L = this.track.length, n = r.dist >= 0 ? Math.floor(r.dist / L) : -1;
    if (n <= r.lapsDone) return;
    var cross = this.time - (r.dist - n * L) / Math.max(r.speed, 1);
    if (r.lapsDone >= 0 && !r.finished) {
      var lt = cross - r.lapStart; r.lapTimes.push(lt);
      var best = !r.best || lt < r.best; if (best) r.best = lt;
      this.ev('lap', { r: r, lap: n, time: lt, best: best });
    }
    r.lapsDone = n; r.lapStart = cross;
    if (n >= this.laps && !r.finished) {
      r.finished = true; r.finishTime = cross; r.place = ++this.finished;
      this.ev('finish', { r: r, place: r.place });
    } else if (!r.ai && n === this.laps - 1 && n > 0) this.ev('final');
  };

  // the computer riders: brake early enough for the next bend, take the inside line, go around slower bikes
  Race.prototype.think = function (r, dt) {
    var P = this.P, T = this.track, st = r.stats, pct = r.speed / P.max, me = this.me(), self = this;
    var stop = r.speed * r.speed / (2 * -P.brake), look = Math.ceil(stop / SEG) + 8, maxC = 0, sumC = 0;
    for (var i = 1; i <= look; i++) { var cv = T.segAt(r.dist + i * SEG).curve; maxC = Math.max(maxC, Math.abs(cv)); if (i <= 20) sumC += cv; }
    var hold = 0.98 * st.grip / Math.max(0.01, maxC * P.centrifugal);
    var target = P.max * st.top * r.skill * r.skillTop * clamp(hold, 0.3, 1);
    // keep the race close: riders far ahead of you ease off a little, those far behind push
    r.skillTop = 1;
    if (me && !me.finished && r !== me && me.dist > 0) { var gap = r.dist - me.dist; r.skillTop = gap > 9000 ? 0.97 : gap < -7000 ? 1.04 : 1; }
    r.laneT -= dt; if (r.laneT < 0) { r.lane = [-1, 0, 1][Math.floor(this.rand() * 3)]; r.laneT = 3 + this.rand() * 5; }
    var want = clamp(r.lane * 0.36 + (sumC / 20) * 0.09, -0.6, 0.6);
    this.riders.forEach(function (o) {
      if (o === r || o.crashT > 0) return;
      var d = o.dist - r.dist;
      if (d > 0 && d < 1300 && Math.abs(o.x - r.x) < 0.34) {
        var side = r.x <= o.x ? -1 : 1;
        if (Math.abs(o.x + side * 0.4) > 0.85) side = -side;
        want = o.x + side * 0.4;
        if (d < 420) target = Math.min(target, o.speed + 200);
      }
    });
    if (r.crashT > 0) return {};
    var seg = T.segAt(r.dist), ff = pct * seg.curve * P.centrifugal / st.grip;
    var steer = clamp((want - r.x) * 3.2 + ff, -1, 1);
    if (Math.abs(r.x) > 0.9) steer = clamp(steer - Math.sign(r.x) * 0.6, -1, 1);
    if (r.nitroWant > 0) r.nitroWant -= dt;
    else if (!r.air && maxC < 1.5 && r.nitro > 0.35 && pct > 0.45 && this.rand() < dt * 0.5) r.nitroWant = 1 + this.rand();
    return { steer: steer, gas: r.speed < target, brake: r.speed > target + 500, nitro: r.nitroWant > 0 && maxC < 2.5,
      trick: r.air && r.vy > 4600 && r.airT < 0.1 && this.rand() < 0.5 * r.skill };
  };

  Race.prototype.collide = function (dt) {
    var rs = this.riders, me = this.me(), i, j;
    rs.forEach(function (r) { r.draft = Math.max(0, r.draft - dt); });
    for (i = 0; i < rs.length; i++) for (j = i + 1; j < rs.length; j++) {
      var a = rs[i], b = rs[j];
      if (a.crashT > 0 || b.crashT > 0 || a.air !== b.air || a.finished && b.finished) continue;
      var d = b.dist - a.dist, ox = b.x - a.x;
      // slipstream: tucked in behind someone fills your nitro
      if (Math.abs(ox) < 0.25) { if (d > 250 && d < 1500) { a.draft += 2 * dt; a.nitro = Math.min(1, a.nitro + 0.1 * dt); } if (-d > 250 && -d < 1500) { b.draft += 2 * dt; b.nitro = Math.min(1, b.nitro + 0.1 * dt); } }
      if (Math.abs(d) > 150 || Math.abs(ox) > 0.17) continue;
      var back = d > 0 ? a : b, front = d > 0 ? b : a, rel = back.speed - front.speed, s = ox >= 0 ? 1 : -1;
      back.speed = Math.min(back.speed, front.speed * 0.96); front.speed += Math.max(0, rel) * 0.1;
      a.x -= s * 0.035; b.x += s * 0.035;
      if (rel > 4500 && back.inv <= 0) this.crash(back, 'rider');
      if ((a === me || b === me) && me.bumpT <= 0) { me.bumpT = 0.4; this.ev('bump'); }
    }
  };
  Race.prototype.rank = function () {
    var order = this.riders.slice().sort(function (a, b) {
      if (a.finished && b.finished) return a.finishTime - b.finishTime;
      if (a.finished !== b.finished) return a.finished ? -1 : 1;
      return b.dist - a.dist;
    });
    order.forEach(function (r, i) { r.pos = i + 1; });
    this.order = order;
  };
  // when you are done: everyone still riding gets an estimated time from their average speed
  Race.prototype.end = function () {
    var self = this, L = this.track.length;
    this.riders.forEach(function (r) {
      if (r.finished) return;
      var v = Math.max(1500, (r.dist + 800) / Math.max(1, self.time));
      r.finishTime = self.time + (self.laps * L - r.dist) / v; r.estimated = true;
    });
    this.riders.slice().sort(function (a, b) { return a.finishTime - b.finishTime; }).forEach(function (r, i) { r.place = i + 1; r.pos = i + 1; });
    this.order = this.riders.slice().sort(function (a, b) { return a.place - b.place; });
    this.state = 'done'; this.ev('done');
  };

  var api = { SEG: SEG, RUMBLE: RUMBLE, ROAD_W: ROAD_W, G: G, TYPES: TYPES, SIZES: SIZES, TRICKS: TRICKS, TRICK_TIME: TRICK_TIME, Track: Track, Race: Race, clamp: clamp, lerp: lerp, mod: mod };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MOTO = api;
})(typeof window !== 'undefined' ? window : globalThis);
