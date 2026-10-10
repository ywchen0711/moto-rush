/*
 * Menus, input (keyboard, touch, gamepad), the game loop, results, championships and saved records.
 * An AI demo race runs behind the menus.
 */
(function () {
  'use strict';
  var M = window.MOTO, D = window.MOTO_DATA, ART = window.MOTO_ART, A = window.MOTO_AUDIO, RD = window.MOTO_RENDER;
  var $ = function (id) { return document.getElementById(id); };
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };

  var TX = {
    zh: {
      sub: '像素機車大賽', single: '單場比賽', champ: '錦標賽', trial: '計時賽', settings: '設定', help: '操作說明', back: '← 返回',
      singleD: '選一條賽道，和 7 位車手一決高下。', champD: '連跑三站，依名次拿積分，爭奪總冠軍。', trialD: '一個人跑，挑戰最快的單圈。',
      chooseTrack: '選擇賽道', chooseRider: '選擇車手', chooseCup: '選擇錦標賽', road: '公路賽', dirt: '越野賽',
      cupRoad: '公路錦標賽', cupDirt: '越野錦標賽', cupRoadD: '夕陽海岸 → 阿爾卑斯山道 → 霓虹城市', cupDirtD: '峽谷沙塵 → 泥濘森林 → 火山稜線',
      best: '最佳單圈', start: '出發！', stats: { top: '極速', accel: '加速', handling: '操控', grip: '抓地' },
      lang: 'English', sound: '音效', on: '開', off: '關', laps: '圈數', difficulty: '對手強度', easy: '簡單', normal: '普通', hard: '困難', autoGas: '自動油門',
      hud: { pos: '名次', lap: 'LAP', time: '總時間', lapTime: '本圈', best: '最佳', nitro: '氮氣', trickHint: '在空中按空白鍵做特技！' },
      go: 'GO!', final: '最後一圈！', perfect: '完美起步！', newBest: '最快單圈！', crash: '摔車了！', landBad: '特技沒做完！',
      results: '比賽結果', rider: '車手', total: '總時間', bestLap: '最佳單圈', retry: '再跑一次', next: '下一站 →', menu: '主選單', standings: '積分榜', pts: '分',
      champion: '總冠軍！', round: function (n, m) { return '第 ' + n + ' 站／共 ' + m + ' 站'; }, paused: '暫停', resume: '繼續', restart: '重新開始', quit: '離開比賽',
      place: function (n) { return '第 ' + n + ' 名'; }, you: '你', est: '預估', trialDone: '計時賽完成！',
      helpText: ['↑ 或 W：油門　↓ 或 S：煞車　← → 或 A D：轉向', '空白鍵或 Shift：氮氣加速（會慢慢補滿；緊跟在別人後面「吸尾流」或做完特技補得更快）',
        '越野賽：在空中按空白鍵做特技，但要在落地前做完，不然會摔車！', '急彎會把你往外甩：看到黃色箭頭就先放油門或煞車。', '撞到路邊的東西會摔車。起跑時在 GO 之前一點點按住油門，可以完美起步。',
        '手機：用螢幕上的按鈕。也支援遊戲手把。P 或 Esc：暫停。'],
      riders: { josh: '速度和操控都很平均的全能車手。', jasper: '極速最快，但轉彎要小心。', jeff: '起步加速最猛，抓地力強。', erin: '操控最靈活，過彎高手。' }
    },
    en: {
      sub: 'Pixel Motorbike Racing', single: 'Single Race', champ: 'Championship', trial: 'Time Trial', settings: 'Settings', help: 'How to Play', back: '← Back',
      singleD: 'Pick a track and race seven riders.', champD: 'Three races in a row; score points for every finish and fight for the title.', trialD: 'Ride alone and chase your fastest lap.',
      chooseTrack: 'Choose a Track', chooseRider: 'Choose a Rider', chooseCup: 'Choose a Championship', road: 'Superbike', dirt: 'Motocross',
      cupRoad: 'Superbike Cup', cupDirt: 'Motocross Cup', cupRoadD: 'Sunset Coast → Alpine Pass → Neon City', cupDirtD: 'Canyon Dust → Muddy Woods → Volcano Ridge',
      best: 'Best lap', start: 'Race!', stats: { top: 'Top speed', accel: 'Acceleration', handling: 'Handling', grip: 'Grip' },
      lang: '中文', sound: 'Sound', on: 'On', off: 'Off', laps: 'Laps', difficulty: 'Rivals', easy: 'Easy', normal: 'Normal', hard: 'Hard', autoGas: 'Auto throttle',
      hud: { pos: 'POS', lap: 'LAP', time: 'TIME', lapTime: 'LAP', best: 'BEST', nitro: 'NITRO', trickHint: 'SPACE IN THE AIR: TRICK!' },
      go: 'GO!', final: 'FINAL LAP!', perfect: 'PERFECT START!', newBest: 'FASTEST LAP!', crash: 'CRASH!', landBad: 'TRICK NOT FINISHED!',
      results: 'Results', rider: 'Rider', total: 'Time', bestLap: 'Best lap', retry: 'Race again', next: 'Next race →', menu: 'Main menu', standings: 'Standings', pts: 'pts',
      champion: 'CHAMPION!', round: function (n, m) { return 'Race ' + n + ' of ' + m; }, paused: 'Paused', resume: 'Resume', restart: 'Restart', quit: 'Quit race',
      place: function (n) { return ['1ST', '2ND', '3RD'][n - 1] || n + 'TH'; }, you: 'you', est: 'est.', trialDone: 'TIME TRIAL DONE!',
      helpText: ['↑ or W: throttle · ↓ or S: brake · ← → or A D: steer', 'Space or Shift: nitro (it refills slowly — faster when you tuck in right behind another rider, the slipstream, and when you land a trick)',
        'Motocross: press Space in the air for a trick — but finish it before you land, or you fall!', 'Sharp bends throw you outwards: ease off or brake when you see the yellow arrows.', 'Hitting things beside the road knocks you off. Hold the throttle just before GO for a perfect start.',
        'Phone: use the buttons on the screen. Gamepads work too. P or Esc: pause.'],
      riders: { josh: 'An all-rounder: good speed, good handling.', jasper: 'The fastest top speed — careful in the bends.', jeff: 'The strongest launch and lots of grip.', erin: 'The sharpest handling — a cornering expert.' }
    }
  };
  function load(k, d) { try { var v = localStorage.getItem('moto.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } }
  function save(k, v) { try { localStorage.setItem('moto.' + k, JSON.stringify(v)); } catch (e) { /* private mode */ } }
  var set = load('settings', { lang: (navigator.language || '').indexOf('zh') === 0 ? 'zh' : 'en', sound: true, laps: 3, difficulty: 'normal', autoGas: false });
  var fromLobby = (typeof location !== 'undefined' && (location.search.match(/[?&]lang=(zh|en)(?![a-z])/) || [])[1]);   // the lobby opens games with ?lang=zh|en
  if (fromLobby) { set.lang = fromLobby; save('settings', set); }
  var records = load('records', {});
  var T = function () { return TX[set.lang]; };
  A.on = set.sound;

  var canvas = $('cv'), view = new RD.Renderer(canvas), ui = $('ui');
  var tracks = {}; D.TRACKS.forEach(function (d) { tracks[d.id] = new M.Track(d); });
  var S = { screen: 'title', race: null, demo: null, mode: 'single', trackId: 'coast', riderId: load('rider', 'josh'), champ: null, paused: false, steer: 0, demoFollow: 0, demoT: 0, resultsShown: false };

  // ---------------- input ----------------
  var keys = {}, touch = {}, pad = {};
  var KEYMAP = { ArrowUp: 'gas', KeyW: 'gas', ArrowDown: 'brake', KeyS: 'brake', ArrowLeft: 'left', KeyA: 'left', ArrowRight: 'right', KeyD: 'right', Space: 'nitro', ShiftLeft: 'nitro', ShiftRight: 'nitro', KeyX: 'nitro' };
  addEventListener('keydown', function (e) {
    A.init();
    var k = KEYMAP[e.code];
    if (k) { keys[k] = true; if (S.race) e.preventDefault(); }
    if ((e.code === 'KeyP' || e.code === 'Escape') && S.race && S.race.state !== 'done') togglePause();
  });
  addEventListener('keyup', function (e) { var k = KEYMAP[e.code]; if (k) keys[k] = false; });
  addEventListener('blur', function () { keys = {}; touch = {}; });
  document.addEventListener('visibilitychange', function () { if (document.hidden && S.race && S.race.state === 'race' && !S.paused) togglePause(); });
  addEventListener('pointerdown', function () { A.init(); }, { capture: true });
  [].forEach.call(document.querySelectorAll('#touch [data-k]'), function (b) {
    var k = b.getAttribute('data-k');
    var on = function (e) { e.preventDefault(); touch[k] = true; b.classList.add('on'); A.init(); }, off = function (e) { e.preventDefault(); touch[k] = false; b.classList.remove('on'); };
    b.addEventListener('pointerdown', on); b.addEventListener('pointerup', off); b.addEventListener('pointercancel', off); b.addEventListener('pointerleave', off);
  });
  addEventListener('touchstart', function () { document.body.classList.add('touchy'); }, { once: true, passive: true });
  if (matchMedia && matchMedia('(pointer: coarse)').matches) document.body.classList.add('touchy');
  function readPad() {
    pad = {};
    var gp = navigator.getGamepads ? [].filter.call(navigator.getGamepads(), Boolean)[0] : null;
    if (!gp) return;
    var b = function (i) { return gp.buttons[i] && gp.buttons[i].pressed; };
    pad.steer = Math.abs(gp.axes[0]) > 0.15 ? gp.axes[0] : (b(15) ? 1 : 0) - (b(14) ? 1 : 0);
    pad.gas = b(0) || b(7); pad.brake = b(1) || b(6); pad.nitro = b(2) || b(5);
    if (b(9) && !pad.startWas && S.race) togglePause();
    pad.startWas = b(9);
  }
  function control(dt) {
    var me = S.race.me(), want = (keys.right || touch.right ? 1 : 0) - (keys.left || touch.left ? 1 : 0);
    if (pad.steer) want = pad.steer;
    S.steer += (want - S.steer) * Math.min(1, dt * (want ? 9 : 14));
    var brake = !!(keys.brake || touch.brake || pad.brake), nitro = !!(keys.nitro || touch.nitro || pad.nitro);
    return { steer: S.steer, gas: !!(keys.gas || touch.gas || pad.gas || (set.autoGas && !brake)), brake: brake, nitro: nitro && me && !me.air, trick: nitro && me && me.air };
  }

  // ---------------- races ----------------
  function riderById(id) { return D.RIDERS.filter(function (r) { return r.id === id; })[0]; }
  function startRace(trackId) {
    var me = riderById(S.riderId), track = tracks[trackId], entries = S.mode === 'trial' ? [me] : [me].concat(D.RIDERS.filter(function (r) { return r !== me; }));
    S.trackId = trackId;
    S.race = new M.Race(track, entries, { laps: S.mode === 'trial' ? 3 : set.laps, difficulty: set.difficulty, player: 0, mode: S.mode });
    S.paused = false; S.resultsShown = false; S.steer = 0; keys = {}; touch = {};
    view.reset();
    ui.innerHTML = ''; ui.className = 'racing';
    document.body.classList.add('inrace');
  }
  function handleEvents() {
    var race = S.race, me = race.me(), L = T(), fp = view.followPos || { x: RD.W / 2, y: RD.H * 0.8, ground: RD.H * 0.9, k: 1 };
    race.events.forEach(function (e) {
      var mine = e.r === me;
      if (e.type === 'count') { A.beep(false); view.say(String(e.n), '#ffffff', 0.9, 3); }
      if (e.type === 'go') { A.beep(true); view.say(L.go, '#7aff8a', 1, 3); }
      if (e.type === 'perfect') view.say(L.perfect, '#7ae0ff', 1.6, 2);
      if (e.type === 'final') view.say(L.final, '#ffd23a', 2, 2);
      if (e.type === 'lap' && mine) {
        A.lap();
        var rec = records[race.track.def.id] = records[race.track.def.id] || {};
        if (!rec.lap || e.time < rec.lap) { rec.lap = e.time; save('records', records); if (me.lapTimes.length > 1 || S.mode === 'trial') view.say(L.newBest + ' ' + view.clock(e.time), '#7ae0ff', 2, 1); }
      }
      if (e.type === 'crash' && mine) { A.crash(); view.bump(1); view.say(e.why === 'trick' ? L.landBad : L.crash, '#ff6a6a', 1.5, 2); view.burst(14, RD.COLORS[race.track.def.theme].dust || '#cccccc', fp.x, fp.ground, 60); }
      if (e.type === 'trick' && mine) { A.trick(); view.say(e.name[set.lang] + '!', '#ffd23a', 1.4, 2); }
      if (e.type === 'land') { A.land(e.hard); if (e.hard) view.bump(0.45); view.burst(e.hard ? 12 : 6, RD.COLORS[race.track.def.theme].dust || '#bbbbbb', fp.x, fp.ground, 70 * fp.k); }
      if (e.type === 'bump') { A.bump(); view.bump(0.25); }
      if (e.type === 'finish' && mine) {
        view.say(S.mode === 'trial' ? L.trialDone : L.place(e.place), e.place === 1 ? '#ffd23a' : '#ffffff', 5, 3);
        var rec2 = records[race.track.def.id] = records[race.track.def.id] || {};
        var key = 'race' + race.laps; if (!rec2[key] || me.finishTime < rec2[key]) { rec2[key] = me.finishTime; save('records', records); }
      }
    });
    race.events.length = 0;
    if (race.state === 'done' && !S.resultsShown) { S.resultsShown = true; setTimeout(showResults, 400); }
  }
  function togglePause() {
    if (!S.race) return;
    S.paused = !S.paused;
    if (S.paused) {
      var L = T();
      ui.className = 'overlay';
      ui.innerHTML = '<div class="panel small"><h2>' + L.paused + '</h2><div class="col">' +
        '<button class="big" data-act="resume">' + L.resume + '</button><button data-act="restart">' + L.restart + '</button><button data-act="quit">' + L.quit + '</button></div></div>';
    } else { ui.innerHTML = ''; ui.className = 'racing'; }
  }

  // ---------------- screens ----------------
  function demoRace() {
    var ids = Object.keys(tracks), t = tracks[ids[Math.floor(Math.random() * ids.length)]];
    S.demo = new M.Race(t, D.RIDERS, { laps: 99, player: -1, countdown: 0, difficulty: 'hard' });
    S.demoFollow = Math.floor(Math.random() * 8); S.demoT = 0;
    for (var i = 0; i < 60 * 8; i++) S.demo.update(1 / 60);
    view.reset();
  }
  function go(screen) { S.screen = screen; A.click(); render(); }
  function render() {
    var L = T(), h = '';
    document.body.classList.remove('inrace');
    ui.className = 'overlay';
    document.documentElement.lang = set.lang === 'zh' ? 'zh-Hant' : 'en';
    if (S.screen === 'title') {
      h = '<div class="title"><h1 class="logo">MOTO<span>RUSH</span></h1><p class="sub">' + L.sub + '</p><div class="col menu">' +
        btn('single', '🏁 ' + L.single, L.singleD) + btn('champ', '🏆 ' + L.champ, L.champD) + btn('trial', '⏱ ' + L.trial, L.trialD) +
        '<div class="row"><button data-go="settings">⚙ ' + L.settings + '</button><button data-go="help">❔ ' + L.help + '</button><button data-act="lang">' + L.lang + '</button></div></div></div>';
    } else if (S.screen === 'tracks') {
      h = '<div class="panel wide"><div class="head"><button data-go="title">' + L.back + '</button><h2>' + L.chooseTrack + '</h2></div><div class="grid tracks">' +
        D.TRACKS.map(function (d) {
          var rec = records[d.id] || {};
          return '<button class="card" data-track="' + d.id + '"><canvas class="map" data-map="' + d.id + '" width="120" height="120"></canvas><div>' +
            '<span class="tag ' + d.type + '">' + L[d.type] + '</span> <span class="stars">' + '★'.repeat(d.difficulty) + '<i>' + '★'.repeat(3 - d.difficulty) + '</i></span>' +
            '<h3>' + esc(d.name[set.lang]) + '</h3><p>' + esc(d.desc[set.lang]) + '</p><p class="rec">' + L.best + '：' + (rec.lap ? view.clock(rec.lap) : '—') + '</p></div></button>';
        }).join('') + '</div></div>';
    } else if (S.screen === 'cups') {
      h = '<div class="panel"><div class="head"><button data-go="title">' + L.back + '</button><h2>' + L.chooseCup + '</h2></div><div class="col">' +
        '<button class="card cup" data-cup="road"><span class="tag road">' + L.road + '</span><h3>🏆 ' + L.cupRoad + '</h3><p>' + L.cupRoadD + '</p></button>' +
        '<button class="card cup" data-cup="dirt"><span class="tag dirt">' + L.dirt + '</span><h3>🏆 ' + L.cupDirt + '</h3><p>' + L.cupDirtD + '</p></button></div></div>';
    } else if (S.screen === 'riders') {
      var type = S.mode === 'champ' ? S.champ.type : tracks[S.trackId].type;
      h = '<div class="panel wide"><div class="head"><button data-go="' + (S.mode === 'champ' ? 'cups' : 'tracks') + '">' + L.back + '</button><h2>' + L.chooseRider + '</h2></div><div class="grid riders">' +
        D.RIDERS.filter(function (r) { return r.star; }).map(function (r) {
          return '<button class="card rider' + (r.id === S.riderId ? ' on' : '') + '" data-rider="' + r.id + '" style="--c:' + bright(r) + '"><canvas data-portrait="' + r.id + '" data-type="' + type + '"></canvas><h3>' + r.name + ' <small>#' + r.num + '</small></h3><p>' + L.riders[r.id] + '</p>' +
            ['top', 'accel', 'handling', 'grip'].map(function (k) { var v = Math.round(30 + (r.stats[k] - 0.95) / 0.17 * 70); return '<div class="stat"><span>' + L.stats[k] + '</span><i><b style="width:' + Math.max(8, Math.min(100, v)) + '%"></b></i></div>'; }).join('') + '</button>';
        }).join('') + '</div><div class="foot">' + (S.mode === 'champ' ? '<span>' + (S.champ.type === 'road' ? L.cupRoad : L.cupDirt) + '</span>' : '<span>' + esc(tracks[S.trackId].def.name[set.lang]) + '</span>') +
        '<button class="big go" data-act="start">' + L.start + '</button></div></div>';
    } else if (S.screen === 'settings') {
      var opt = function (k, vals, names) { return '<div class="opt"><span>' + L[k] + '</span>' + vals.map(function (v, i) { return '<button class="' + (set[k] === v ? 'on' : '') + '" data-set="' + k + '" data-val="' + JSON.stringify(v).replace(/"/g, '&quot;') + '">' + names[i] + '</button>'; }).join('') + '</div>'; };
      h = '<div class="panel"><div class="head"><button data-go="title">' + L.back + '</button><h2>' + L.settings + '</h2></div>' +
        opt('lang', ['zh', 'en'], ['中文', 'English']) + opt('sound', [true, false], [L.on, L.off]) + opt('laps', [1, 3, 5], ['1', '3', '5']) +
        opt('difficulty', ['easy', 'normal', 'hard'], [L.easy, L.normal, L.hard]) + opt('autoGas', [false, true], [L.off, L.on]) + '</div>';
    } else if (S.screen === 'help') {
      h = '<div class="panel"><div class="head"><button data-go="title">' + L.back + '</button><h2>' + L.help + '</h2></div><ul class="help">' + L.helpText.map(function (t) { return '<li>' + esc(t) + '</li>'; }).join('') + '</ul></div>';
    }
    ui.innerHTML = h;
    [].forEach.call(ui.querySelectorAll('canvas[data-map]'), function (c) { drawMap(c, tracks[c.getAttribute('data-map')]); });
    [].forEach.call(ui.querySelectorAll('canvas[data-portrait]'), function (c) {
      var src = ART.portrait(riderById(c.getAttribute('data-portrait')), c.getAttribute('data-type'));
      c.width = src.width * 4; c.height = src.height * 4; var g = c.getContext('2d'); g.imageSmoothingEnabled = false; g.drawImage(src, 0, 0, c.width, c.height);
    });
    function btn(act, title, desc) { return '<button class="mode" data-act="' + act + '"><b>' + title + '</b><span>' + desc + '</span></button>'; }
  }
  function bright(r) {                       // the rider's most visible color, for bars on a dark panel
    var lum = function (h) { var n = parseInt(h.slice(1), 16); return 0.3 * (n >> 16) + 0.59 * ((n >> 8) & 255) + 0.11 * (n & 255); };
    return [r.main, r.helmet, r.alt].filter(function (c) { return lum(c) > 70 && lum(c) < 235; })[0] || r.main;
  }
  function drawMap(c, t) {
    var g = c.getContext('2d'), s = 92, th = RD.COLORS[t.def.theme];
    g.fillStyle = th.grass[0]; g.fillRect(0, 0, c.width, c.height);
    g.strokeStyle = th.road[0]; g.lineWidth = 9; g.lineJoin = 'round'; g.beginPath();
    t.map.forEach(function (p, i) { var x = 60 + p[0] * s, y = 60 + p[1] * s; if (i) g.lineTo(x, y); else g.moveTo(x, y); });
    g.closePath(); g.stroke(); g.strokeStyle = th.rumble[0]; g.lineWidth = 2; g.stroke();
    var p0 = t.map[0]; g.fillStyle = '#fff'; g.fillRect(56 + p0[0] * s, 56 + p0[1] * s, 8, 8);
  }
  function showResults() {
    var race = S.race, L = T(), me = race.me(), h = '';
    var rows = race.order.map(function (r) {
      return '<tr class="' + (r === me ? 'me' : '') + '"><td>' + r.place + '</td><td><i style="background:' + r.e.main + '"></i>' + esc(r.name) + (r === me ? ' <small>(' + L.you + ')</small>' : '') + '</td>' +
        '<td>' + view.clock(r.finishTime) + (r.estimated ? ' <small>' + L.est + '</small>' : '') + '</td><td>' + (r.best ? view.clock(r.best) : '—') + '</td></tr>';
    }).join('');
    var champ = '';
    if (S.mode === 'champ') {
      var C = S.champ, PTS = [10, 8, 6, 5, 4, 3, 2, 1];
      if (!race.scored) { race.scored = true; race.order.forEach(function (r) { C.pts[r.e.id] = (C.pts[r.e.id] || 0) + (PTS[r.place - 1] || 0); }); C.round++; }
      var table = D.RIDERS.slice().sort(function (a, b) { return (C.pts[b.id] || 0) - (C.pts[a.id] || 0); });
      var lastRound = C.round >= C.tracks.length;
      champ = '<div><h3>' + L.standings + ' · ' + L.round(C.round, C.tracks.length) + '</h3>' + (lastRound && table[0] === me.e ? '<p class="champ">🏆 ' + L.champion + '</p>' : '') +
        '<table class="res"><tbody>' + table.map(function (r, i) { return '<tr class="' + (r === me.e ? 'me' : '') + '"><td>' + (i + 1) + '</td><td><i style="background:' + r.main + '"></i>' + esc(r.name) + '</td><td>' + (C.pts[r.id] || 0) + ' ' + L.pts + '</td></tr>'; }).join('') + '</tbody></table></div>';
    }
    var next = S.mode === 'champ' && S.champ.round < S.champ.tracks.length;
    h = '<div class="panel wide results"><h2>' + L.results + ' — ' + esc(race.track.def.name[set.lang]) + '</h2>' +
      (S.mode === 'trial' ? '' : '<p class="bigplace">' + L.place(me.place) + '</p>') +
      '<div class="' + (champ ? 'cols' : '') + '"><table class="res"><thead><tr><th>#</th><th>' + L.rider + '</th><th>' + L.total + '</th><th>' + L.bestLap + '</th></tr></thead><tbody>' + rows + '</tbody></table>' + champ + '</div>' +
      '<div class="row">' + (next ? '<button class="big go" data-act="next">' + L.next + '</button>' : '<button class="big go" data-act="retry">' + L.retry + '</button>') +
      '<button data-act="quit">' + L.menu + '</button></div></div>';
    ui.className = 'overlay'; ui.innerHTML = h;
  }
  ui.addEventListener('click', function (e) {
    var el = e.target.closest('button'); if (!el) return;
    A.init();
    var act = el.getAttribute('data-act');
    if (el.hasAttribute('data-go')) return go(el.getAttribute('data-go'));
    if (el.hasAttribute('data-track')) { S.trackId = el.getAttribute('data-track'); return go('riders'); }
    if (el.hasAttribute('data-cup')) { var t = el.getAttribute('data-cup'); S.champ = { type: t, tracks: D.TRACKS.filter(function (d) { return d.type === t; }).map(function (d) { return d.id; }), round: 0, pts: {} }; return go('riders'); }
    if (el.hasAttribute('data-rider')) { S.riderId = el.getAttribute('data-rider'); save('rider', S.riderId); A.click(); return render(); }
    if (el.hasAttribute('data-set')) {
      set[el.getAttribute('data-set')] = JSON.parse(el.getAttribute('data-val')); save('settings', set); A.setOn(set.sound); A.click(); return render();
    }
    if (act === 'single') { S.mode = 'single'; go('tracks'); }
    if (act === 'trial') { S.mode = 'trial'; go('tracks'); }
    if (act === 'champ') { S.mode = 'champ'; go('cups'); }
    if (act === 'lang') { set.lang = set.lang === 'zh' ? 'en' : 'zh'; save('settings', set); render(); }
    if (act === 'start') { A.click(); startRace(S.mode === 'champ' ? S.champ.tracks[S.champ.round] : S.trackId); }
    if (act === 'next') startRace(S.champ.tracks[S.champ.round]);
    if (act === 'retry') { if (S.mode === 'champ') S.champ = { type: S.champ.type, tracks: S.champ.tracks, round: 0, pts: {} }; startRace(S.mode === 'champ' ? S.champ.tracks[0] : S.trackId); }
    if (act === 'resume') togglePause();
    if (act === 'restart') { S.paused = false; startRace(S.trackId); }
    if (act === 'quit') { S.race = null; S.paused = false; A.engine(0, false, false, false, true); demoRace(); go('title'); }
  });

  // ---------------- the loop ----------------
  var STEP = 1 / 60, acc = 0, last = performance.now();
  function frame() {
    var now = performance.now(), dt = Math.max(0, Math.min(0.1, (now - last) / 1000)); last = now;
    readPad();
    acc += dt;
    var n = 0;
    while (acc >= STEP && n < 5) {
      if (S.race && !S.paused) { S.race.update(STEP, control(STEP)); handleEvents(); }
      else if (!S.race && S.demo) S.demo.update(STEP);
      acc -= STEP; n++;
    }
    if (n === 5) acc = 0;
    if (S.race) {
      var me = S.race.me();
      view.draw(S.race, me, S.paused ? 0 : dt, { L: T().hud, lang: set.lang, trial: S.mode === 'trial', showTrickHint: S.race.track.type === 'dirt' && (me.lapsDone < 1) });
      var c = control(0);
      A.engine(me.speed / S.race.track.P.max, c.gas && S.race.state !== 'done', me.nitroOn, me.air, S.paused || me.crashT > 0);
    } else if (S.demo) {
      S.demoT += dt; if (S.demoT > 14) { S.demoT = 0; S.demoFollow = (S.demoFollow + 1) % 8; view.camY = null; }
      view.draw(S.demo, S.demo.riders[S.demoFollow], dt, null);
      A.engine(0, false, false, false, true);
    }
    requestAnimationFrame(frame);
  }
  demoRace();
  render();
  requestAnimationFrame(frame);
  // test hooks
  window.MOTO_GAME = { S: S, startRace: startRace, set: set, view: view, tracks: tracks, go: go, showResults: showResults };
})();
