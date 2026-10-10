/*
 * The six tracks. A track is a list of sections:
 *   ['s', n, dy]            straight of n segments, rising dy segment-lengths (negative = downhill)
 *   ['c', n, curve, dy]     curve: + right, − left (2 gentle · 4 medium · 6 sharp · 8 hairpin)
 *   ['j', h, land]          motocross jump: a steep ramp h segment-lengths high, then a landing slope `land` segments long
 *   ['w', n]                whoops: n small bumps in a row
 * The road always comes back to its starting height at the end of the lap.
 * theme: colors, background and roadside scenery (see art.js).
 */
(function (root) {
  'use strict';
  var TRACKS = [
    { id: 'coast', type: 'road', theme: 'coast', difficulty: 1,
      name: { zh: '夕陽海岸', en: 'Sunset Coast' },
      desc: { zh: '沿著海邊的高速賽道，長直線、緩彎和起伏的小丘。', en: 'A fast seaside run: long straights, sweeping bends and rolling hills.' },
      road: [['s', 90], ['c', 150, 2, 6], ['s', 120, -6], ['c', 180, -3, 12], ['s', 140], ['c', 150, 2, -12], ['c', 110, -2], ['s', 200, 10],
             ['c', 220, 3, -10], ['s', 120], ['c', 150, -4], ['s', 140, 14], ['c', 180, 2, -14], ['s', 100], ['c', 160, -3], ['s', 120, 6], ['c', 130, 4, -6], ['s', 140]] },
    { id: 'alpine', type: 'road', theme: 'alpine', difficulty: 2,
      name: { zh: '阿爾卑斯山道', en: 'Alpine Pass' },
      desc: { zh: '翻山越嶺：大上坡、大下坡，還有要減速的髮夾彎。', en: 'Over the mountains: big climbs, steep drops and hairpins that need the brakes.' },
      road: [['s', 80], ['c', 120, 3, 30], ['c', 100, -5, 10], ['s', 90, 20], ['c', 90, 8], ['s', 100, -10], ['c', 140, -3, -30], ['s', 120, -10],
             ['c', 80, -7], ['s', 80], ['c', 90, 6, 20], ['s', 140, 25], ['c', 120, -4, -20], ['c', 100, 5, -25], ['s', 160, -10], ['c', 90, -8], ['s', 120, 10],
             ['c', 130, 3, -10], ['s', 120]] },
    { id: 'city', type: 'road', theme: 'city', difficulty: 3,
      name: { zh: '霓虹城市', en: 'Neon City' },
      desc: { zh: '夜晚的市區街道：直角彎、S 彎接連不斷，路燈下全速衝刺。', en: 'City streets at night: right angles and S-bends one after another under the street lights.' },
      road: [['s', 100], ['c', 70, 7], ['s', 110], ['c', 70, -7], ['s', 80], ['c', 60, 5], ['c', 60, -5], ['c', 60, 5], ['s', 150, 8], ['c', 80, -8], ['s', 120, -8],
             ['c', 70, 6], ['s', 90], ['c', 120, -3], ['s', 160], ['c', 70, 7], ['s', 70], ['c', 70, 7], ['s', 130, 6], ['c', 60, -6], ['c', 60, 6], ['s', 100, -6],
             ['c', 80, -7], ['s', 140]] },
    { id: 'desert', type: 'dirt', theme: 'desert', difficulty: 1,
      name: { zh: '峽谷沙塵', en: 'Canyon Dust' },
      desc: { zh: '紅岩峽谷裡的越野賽道：寬彎道和好幾個大跳台。', en: 'Motocross in a red-rock canyon: wide turns and some big jumps.' },
      road: [['s', 70], ['c', 90, 3], ['s', 40], ['j', 5, 34], ['s', 50], ['c', 100, -4], ['s', 40], ['w', 6], ['s', 50], ['c', 90, 3, 6], ['s', 40], ['j', 4, 30],
             ['s', 30], ['c', 110, -3, -6], ['s', 60], ['j', 6, 40], ['s', 40], ['c', 90, 4], ['s', 70], ['c', 80, -2], ['s', 50]] },
    { id: 'forest', type: 'dirt', theme: 'forest', difficulty: 2,
      name: { zh: '泥濘森林', en: 'Muddy Woods' },
      desc: { zh: '樹林裡的泥巴路：連續小顛簸、急彎和林間跳台。', en: 'Mud between the trees: whoops, tight turns and jumps through the woods.' },
      road: [['s', 60], ['w', 8], ['s', 30], ['c', 80, 5], ['s', 40], ['j', 5, 32], ['s', 30], ['c', 70, -6], ['s', 50], ['w', 6], ['c', 90, 3, 8], ['s', 40],
             ['j', 4, 28], ['s', 20], ['j', 4, 28], ['s', 40], ['c', 80, -5, -8], ['s', 60], ['w', 8], ['s', 30], ['c', 70, 6], ['s', 40], ['j', 6, 38], ['s', 40], ['c', 90, -3], ['s', 50]] },
    { id: 'volcano', type: 'dirt', theme: 'volcano', difficulty: 3,
      name: { zh: '火山稜線', en: 'Volcano Ridge' },
      desc: { zh: '火山邊的黑色沙地：超大跳台、陡坡和急轉彎。', en: 'Black sand on a volcano: huge jumps, steep slopes and sharp turns.' },
      road: [['s', 60], ['c', 80, -4, 10], ['s', 40], ['j', 7, 44], ['s', 40], ['c', 70, 6], ['s', 30], ['w', 10], ['s', 30], ['c', 90, -5, -10], ['s', 40], ['j', 5, 34], ['s', 20],
             ['j', 5, 34], ['s', 50], ['c', 70, 7, 12], ['s', 40], ['j', 8, 48], ['s', 40], ['c', 80, -6, -12], ['s', 40], ['w', 8], ['s', 40], ['c', 90, 4], ['s', 60]] }
  ];
  // the riders: the four stars (pick one, the other three race against you) and four rivals
  var RIDERS = [
    { id: 'josh', name: 'Josh', star: true, num: 7, main: '#2fbf5a', alt: '#ffffff', helmet: '#2fbf5a', helmet2: '#ffd23a', stats: { top: 1.0, accel: 1.0, handling: 1.0, grip: 1.0 } },
    { id: 'jasper', name: 'Jasper', star: true, num: 11, main: '#2f6fde', alt: '#ffffff', helmet: '#1a2a6a', helmet2: '#5ad0ff', stats: { top: 1.035, accel: 0.95, handling: 0.97, grip: 0.98 } },
    { id: 'jeff', name: 'Jeff', star: true, num: 1, main: '#222630', alt: '#ff8a1a', helmet: '#ff8a1a', helmet2: '#222630', stats: { top: 0.98, accel: 1.12, handling: 0.98, grip: 1.04 } },
    { id: 'erin', name: 'Erin', star: true, num: 8, main: '#ff6fae', alt: '#ffffff', helmet: '#ffffff', helmet2: '#ff6fae', stats: { top: 0.975, accel: 1.03, handling: 1.12, grip: 1.03 } },
    { id: 'kenji', name: 'Kenji Arai', num: 46, main: '#e03030', alt: '#ffffff', helmet: '#ffffff', helmet2: '#e03030', stats: { top: 1.0, accel: 1.0, handling: 1.0, grip: 1.0 } },
    { id: 'luca', name: 'Luca Ferri', num: 93, main: '#f0c020', alt: '#202020', helmet: '#f0c020', helmet2: '#2a2a2a', stats: { top: 1.01, accel: 0.98, handling: 1.0, grip: 1.0 } },
    { id: 'max', name: 'Max Brandt', num: 21, main: '#7a3adf', alt: '#ffd23a', helmet: '#7a3adf', helmet2: '#ffffff', stats: { top: 0.99, accel: 1.02, handling: 1.02, grip: 1.0 } },
    { id: 'diego', name: 'Diego Ruiz', num: 33, main: '#ff7a2a', alt: '#1a6adf', helmet: '#1a6adf', helmet2: '#ff7a2a', stats: { top: 1.0, accel: 1.01, handling: 0.99, grip: 1.01 } }
  ];
  var api = { TRACKS: TRACKS, RIDERS: RIDERS };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.MOTO_DATA = api;
})(typeof window !== 'undefined' ? window : globalThis);
