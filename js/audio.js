/*
 * Sound, all synthesized: the engine (two oscillators through a filter, revving up through six gears),
 * a wind/nitro hiss, landings, crashes, bumps and the start beeps.
 */
(function () {
  'use strict';
  var A = window.MOTO_AUDIO = { on: true, ctx: null };
  var eng, noise, master;
  A.init = function () {
    if (A.ctx) { if (A.ctx.state === 'suspended') A.ctx.resume(); return; }
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
    var c = A.ctx = new AC();
    master = c.createGain(); master.gain.value = A.on ? 0.7 : 0; master.connect(c.destination);
    var buf = c.createBuffer(1, c.sampleRate * 2, c.sampleRate), d = buf.getChannelData(0);
    for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    A.noiseBuf = buf;
    // engine
    var o1 = c.createOscillator(), o2 = c.createOscillator(), f = c.createBiquadFilter(), gn = c.createGain();
    o1.type = 'sawtooth'; o2.type = 'square'; o2.detune.value = 8; f.type = 'lowpass'; f.frequency.value = 900; f.Q.value = 4; gn.gain.value = 0;
    o1.connect(f); o2.connect(f); f.connect(gn); gn.connect(master); o1.start(); o2.start();
    eng = { o1: o1, o2: o2, f: f, g: gn };
    // wind / nitro hiss
    var ns = c.createBufferSource(), nf = c.createBiquadFilter(), ng = c.createGain();
    ns.buffer = buf; ns.loop = true; nf.type = 'bandpass'; nf.frequency.value = 1200; nf.Q.value = 0.6; ng.gain.value = 0;
    ns.connect(nf); nf.connect(ng); ng.connect(master); ns.start();
    noise = { f: nf, g: ng };
  };
  A.setOn = function (on) { A.on = on; if (master) master.gain.setTargetAtTime(on ? 0.7 : 0, A.ctx.currentTime, 0.05); };
  // pct: speed 0–1 · gas: throttle held · nitro · air: wheel spinning free
  A.engine = function (pct, gas, nitro, air, quiet) {
    if (!eng) return;
    var t = A.ctx.currentTime, gear = Math.min(5, Math.floor(pct * 6)), within = pct * 6 - gear;
    var rpm = pct < 0.02 ? 0.12 : 0.28 + within * 0.72 * (0.85 + gear * 0.03);
    if (air) rpm = Math.min(1, rpm + 0.25);
    var hz = 38 + rpm * 150 + gear * 6;
    eng.o1.frequency.setTargetAtTime(hz, t, 0.04); eng.o2.frequency.setTargetAtTime(hz * 0.5, t, 0.04);
    eng.f.frequency.setTargetAtTime(500 + rpm * 1800 + (gas ? 600 : 0), t, 0.05);
    eng.g.gain.setTargetAtTime(quiet ? 0 : 0.05 + (gas ? 0.05 : 0.015) + rpm * 0.02, t, 0.06);
    noise.g.gain.setTargetAtTime(quiet ? 0 : pct * 0.04 + (nitro ? 0.09 : 0), t, 0.08);
    noise.f.frequency.setTargetAtTime(nitro ? 2600 : 900 + pct * 900, t, 0.1);
  };
  function burst(dur, freq, vol, q) {
    if (!A.ctx || !A.on) return;
    var c = A.ctx, s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain(), t = c.currentTime;
    s.buffer = A.noiseBuf; f.type = 'bandpass'; f.frequency.value = freq; f.Q.value = q || 1;
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + dur);
  }
  function tone(type, f0, f1, dur, vol) {
    if (!A.ctx || !A.on) return;
    var c = A.ctx, o = c.createOscillator(), g = c.createGain(), t = c.currentTime;
    o.type = type; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + dur);
  }
  A.beep = function (high) { tone('square', high ? 880 : 440, high ? 880 : 440, high ? 0.5 : 0.18, 0.12); };
  A.crash = function () { burst(0.7, 500, 0.6, 0.7); tone('sawtooth', 160, 40, 0.5, 0.15); };
  A.land = function (hard) { tone('sine', hard ? 120 : 90, 40, 0.25, hard ? 0.5 : 0.3); burst(0.2, 300, hard ? 0.3 : 0.15); };
  A.bump = function () { tone('square', 200, 90, 0.08, 0.12); burst(0.1, 2400, 0.12); };
  A.trick = function () { tone('triangle', 660, 1320, 0.25, 0.15); setTimeout(function () { tone('triangle', 990, 1980, 0.2, 0.12); }, 90); };
  A.lap = function () { tone('square', 660, 660, 0.1, 0.08); setTimeout(function () { tone('square', 990, 990, 0.18, 0.08); }, 110); };
  A.click = function () { tone('square', 520, 780, 0.06, 0.06); };
})();
