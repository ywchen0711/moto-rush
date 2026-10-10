// Runs AI-only races on every track and prints lap times, crashes, airtime and how often riders leave the road.
//   node tools/sim.js [races per track]
'use strict';
const { TRACKS, RIDERS } = require('../js/tracks.js');
const { Track, Race, TYPES } = require('../js/world.js');
const N = +(process.argv[2] || 3);
let bad = 0;
for (const def of TRACKS) {
  const track = new Track(def), st = { laps: [], crash: 0, air: 0, airTime: 0, tricks: 0, off: 0, frames: 0, finished: 0, total: 0, maxAir: 0, spread: [] };
  for (let k = 0; k < N; k++) {
    const race = new Race(track, RIDERS, { laps: 3, player: -1, difficulty: 'normal', seed: 1000 + k * 77, countdown: 0 });
    for (let f = 0; f < 60 * 60 * 8 && race.state !== 'done'; f++) {
      race.update(1 / 60);
      race.riders.forEach((r) => {
        st.frames++; if (Math.abs(r.x) > 1) st.off++;
        if (r.air) { st.airTime += 1 / 60; st.maxAir = Math.max(st.maxAir, r.airT); }
        if (!Number.isFinite(r.x + r.dist + r.speed + r.y)) { bad++; console.log(def.id + ': NaN for ' + r.name); }
      });
      race.events.forEach((e) => { if (e.type === 'crash') st.crash++; if (e.type === 'trick') st.tricks++; });
      race.events.length = 0;
    }
    if (race.state !== 'done') race.end();
    race.riders.forEach((r) => { st.total++; if (!r.estimated) st.finished++; st.laps.push(...r.lapTimes); });
    const times = race.riders.map((r) => r.finishTime).sort((a, b) => a - b);
    st.spread.push(times[times.length - 1] - times[0]);
  }
  const L = st.laps.sort((a, b) => a - b), avg = L.reduce((a, b) => a + b, 0) / L.length;
  console.log(`${def.id.padEnd(8)} ${track.segs.length} segs · lap ${avg.toFixed(1)}s (${L[0].toFixed(1)}–${L[L.length - 1].toFixed(1)}) · finished ${st.finished}/${st.total}` +
    ` · crashes/race ${(st.crash / N).toFixed(1)} · off-road ${(st.off / st.frames * 100).toFixed(1)}% · air ${(st.airTime / N / 8).toFixed(1)}s/rider max ${st.maxAir.toFixed(2)}s · tricks ${(st.tricks / N).toFixed(1)}/race · field spread ${(st.spread.reduce((a, b) => a + b, 0) / N).toFixed(1)}s`);
  if (st.finished < st.total) { bad++; }
}
console.log(bad ? bad + ' PROBLEM(S)' : 'all races finished');
process.exit(bad ? 1 : 0);
