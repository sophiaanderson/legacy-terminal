/* =========================================================================
 *   BRIAN.
 *   STEP AWAY FROM THE CODE. SOLVE USING YOUR BRAIN.
 *   (the answers are in here. that would be cheating. LEGACY is watching.)
 * ========================================================================= */
/* PROJECT LEGACY — the finale stage: "BOP IT: FULL SERVICE" (stage-only build, one device).
 * docs/FINALE-SPEC.md. This is step 1 of the build order: everything runs on ONE device with on-screen
 * pads, so it is a complete finale by itself and the fallback if his phone dies. The two-phone
 * controller (js/controller.js, later) reuses js/sequence.js so both devices build the same charts.
 *
 * Timing: the music is scheduled on the Web Audio clock (js/mix.js onStep), calls are placed on that
 * clock, and taps are judged on it minus a latency offset measured in the Heartbeat (this also absorbs
 * Bluetooth delay to the car speakers). A call lands on a beat; the move is due ON THE NEXT BEAT (the clap).
 *
 * Steps (state.finale.step): parked (the start screen; no safety check, by request) → arrival → heartbeat → r1 → r2 → r3 → glitch → r4 → r5 → keys → drop → home.
 * A failed round restarts only that round. There is no game over. Long-press ⋯ (bottom right) = stage manager. */
(function (g) {
  'use strict';
  var L = g.Legacy;
  var ui = L.ui, h = ui.h, C = L.content, cfg = L.config, Q = L.sequence, P = L.puzzles;
  var F3 = C.finale3;
  var doc = g.document;

  var engine = null;                 // the running round / heartbeat; stopped on every render
  function stopEngine() { if (engine) { try { engine.stop(); } catch (e) {} } engine = null; }

  var ORDER = ['parked', 'arrival', 'heartbeat', 'r1', 'r2', 'r3', 'glitch', 'r4', 'r5', 'keys', 'drop', 'home'];
  var TRICKS = { caps: 'capital letters', leet: 'numbers for letters', split: 'spaced-out letters', hex: 'hexadecimal' };

  function lg(t) { return { s: 'LEGACY', t: t }; }
  /** Test build: AUTOPLAY plays every round perfectly so the story can be watched without winning. */
  function autoplay() { try { return g.sessionStorage.getItem('legacyAutoplay') === '1'; } catch (e) { return false; } }

  // ---------- data from the week ----------
  function hisSong(s) {
    var mine = s.puzzles.beat, ok = P.checkBeat(mine).ok;
    var base = JSON.parse(JSON.stringify(ok ? mine : P.beatSolution));
    if (!ok) base.bpm = 124;
    return base;
  }
  function hisBpm(s) { return hisSong(s).bpm || 124; }
  // Game tempos are fixed (not his saved BPM, which could be 150): start slow, climb within each round and round to round.
  // [start, end] BPM. R4 is SENTINEL's drag: spa-slow, climbing back as LEGACY finds doors. Easy = 15% slower.
  var TEMPO = { r1: [92, 100], r2: [100, 108], r3: [108, 116], r4: [84, 108], r5: [118, 128] };
  function tempoFor(rid, s, which) {
    var t = TEMPO[rid] || TEMPO.r1, bpm = t[which === 'end' ? 1 : 0];
    return s && s.finale && s.finale.easy ? Math.round(bpm * 0.85) : bpm;
  }
  function seedOf(s) { var gr = hisSong(s).grid; return Q.hashStr(Object.keys(gr).sort().map(function (k) { return gr[k]; }).join('|')); }
  function vars(s) {
    var f = s.finale, odo = f.odometer, miles = odo > cfg.mileageIn ? odo - cfg.mileageIn : 0;
    var v = {
      NICK: cfg.supervisorNickname, N: s.puzzles.ch02.instructions ? String(s.puzzles.ch02.instructions) : 'very few',
      TRICK: TRICKS[s.puzzles.fri.exploit] || 'a trick', BPM: String(hisBpm(s)), MS: String(Math.round(f.offsetMs)),
      ODO: odo ? odo.toLocaleString('en-US') : '', MILES: miles ? miles.toLocaleString('en-US') : ''
    };
    return v;
  }
  function tpl(text, v) { return String(text).replace(/\{([A-Z]+)\}/g, function (m, k) { return v[k] != null ? v[k] : m; }); }
  function tplBeats(beats, v) { return beats.map(function (b) { return b.pause ? b : { s: b.s, t: tpl(b.t, v) }; }); }
  function clips() { var a = cfg.audio, o = { chop: a.chop, excl: a.chopExcellent, shutdown: a.mixShutdown, update: a.mixUpdate, thanks: a.finaleHome }, v = L.mix.voiceClips(); Object.keys(v).forEach(function (k) { o[k] = v[k]; }); return o; }

  // ---------- call sounds (on the shared audio clock) ----------
  function blip(ac, out, t, type, f0, f1, dur, vol) {
    var o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.setValueAtTime(f0, t); if (f1) o.frequency.exponentialRampToValueAtTime(f1, t + dur);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.008); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  /** BOP IT moves are the track's own instruments, louder, and each clearly its own sound (phone speakers included):
   *  BOP = clap (sharp). TWIST = two quick rising synth notes. PULL = kick + bass two octaves up (a dull thud). HOLD adds weight.
   *  Played on the call's beat, and again exactly on the due beat when the hit is right (so a hit always lands on the beat). */
  function moveSound(move, big, t, vol) {
    var A = L.mix.accent; if (!A) return;
    if (move === 'BOP') { A('clap', t, vol * 3.5); A('snare', t, vol * 1.4); if (big) A('kick', t, vol * 0.8); }   // the clap is quiet by nature: boosted to match
    else if (move === 'TWIST') { A('lead', t, vol * 1.3, 2); A('lead', t + 0.09, vol * 1.3, 5); if (big) A('hat', t, vol); }
    else if (move === 'PULL') { A('kick', t, vol * 0.9); A('bassHi', t, vol * 1.5); if (big) A('bass', t, vol * 1.2, 0); }
  }
  function callSound(c, t, drowsy) {
    var ac = L.mix.ctx(), out = L.mix.out(); if (!ac || !out) return;
    var v = c.whisper ? 0.06 : c.big ? 0.32 : c.big === false ? 0.12 : 0.22;
    if (c.fake) { [523.3, 659.3, 784].forEach(function (f, i) { blip(ac, out, t + i * (drowsy ? 0.12 : 0.04), 'sine', f * (drowsy ? 0.75 : 1), 0, drowsy ? 1.8 : 1.2, drowsy ? 0.08 : 0.12); }); return; }   // drowsy: slower, lower, quieter   // SENTINEL: a calm chord
    if (c.move === 'HIDE') { blip(ac, out, t, 'sine', 900, 120, 0.45, c.whisper ? 0.12 : 0.22); return; }
    if (c.move === 'PASS') { blip(ac, out, t, 'sine', 1200, 1800, 0.12, 0.2); blip(ac, out, t + 0.14, 'sine', 1800, 1200, 0.12, 0.2); return; }
    moveSound(c.move, c.big, t, c.whisper ? 0.7 : c.big ? 1.9 : c.big === false ? 1.2 : 1.6);
  }
  function feedback(ok) {
    var ac = L.mix.ctx(), out = L.mix.out(); if (!ac || !out) return;
    var t = ac.currentTime + 0.005;
    if (ok) blip(ac, out, t, 'triangle', 1568, 2093, 0.07, 0.1); else blip(ac, out, t, 'sawtooth', 110, 80, 0.18, 0.15);
  }

  // ---------- pads ----------
  // Tap = gentle. Press ON the beat and keep holding (≥ HOLD_S) = BIG. Timing is judged from the press, not the release.
  // Keyboard: J K L (hold the key = big, or Shift = big at once), Space = BOP.
  // opts: { toy: true } = the neon Bop It layout; onDown(p) fires at the press so the round can claim the beat before the hold resolves.
  var HOLD_S = 0.25;
  function makePads(defs, onHit, opts) {
    opts = opts || {};
    var wrap = h('div.pads' + (opts.toy ? '.toy' : ''), { role: 'group', 'aria-label': 'Moves' }), byMove = {}, cueTimer = null, live = {};
    function ctxTime() { var ac = L.mix.ctx(); return ac ? ac.currentTime : g.performance.now() / 1000; }
    function begin(move, el) {
      var p = { move: move, at: ctxTime(), big: false, el: el, done: false };
      if (opts.onDown) opts.onDown(p);
      el.classList.add('down');
      p.timer = g.setTimeout(function () { finish(p, true); }, HOLD_S * 1000);
      return p;
    }
    function finish(p, big) {
      if (p.done) return; p.done = true; g.clearTimeout(p.timer); p.big = !!big;
      if (big) p.el.classList.add('held');
      onHit(p);
    }
    function release(p) { if (!p) return; p.el.classList.remove('down', 'held'); if (!p.done) finish(p, false); }
    defs.forEach(function (d) {
      var b = h('button.pad', { type: 'button', 'data-sfx': 'off', 'data-move': d.move, 'aria-label': d.label },
        opts.toy ? h('span.pad-ring', { 'aria-hidden': 'true' }) : null,
        h('span.pad-label', null, d.label), h('span.pad-sub', null, d.sub || ''));
      b._sub = d.sub || '';
      b.addEventListener('pointerdown', function (e) {
        e.preventDefault();
        try { b.setPointerCapture(e.pointerId); } catch (x) {}
        var p = live['p' + e.pointerId] = begin(d.move, b);
        if (e.shiftKey) finish(p, true);
      });
      ['pointerup', 'pointercancel', 'lostpointercapture'].forEach(function (ev) {
        b.addEventListener(ev, function (e) { var k = 'p' + e.pointerId; release(live[k]); delete live[k]; });
      });
      b.addEventListener('contextmenu', function (e) { e.preventDefault(); });
      b.addEventListener('click', function (e) { e.preventDefault(); if (e.detail === 0) { var p = begin(d.move, b); finish(p, false); release(p); } });  // keyboard "click"
      byMove[d.move] = b; wrap.appendChild(b);
    });
    var keys = { j: 'BOP', ' ': 'BOP', k: 'TWIST', l: 'PULL', J: 'BOP', K: 'TWIST', L: 'PULL' };
    function onKey(e) {
      if (e.repeat || !keys[e.key] || !byMove[keys[e.key]]) return; e.preventDefault();
      var k = 'k' + e.key.toLowerCase(); if (live[k]) return;
      var p = live[k] = begin(keys[e.key], byMove[keys[e.key]]);
      if (e.shiftKey) finish(p, true);
    }
    function onKeyUp(e) { if (!keys[e.key]) return; var k = 'k' + e.key.toLowerCase(); release(live[k]); delete live[k]; }
    doc.addEventListener('keydown', onKey); doc.addEventListener('keyup', onKeyUp);
    function clearCue() { Object.keys(byMove).forEach(function (m) { var b = byMove[m]; b.classList.remove('called', 'big', 'quiet'); b.querySelector('.pad-sub').textContent = b._sub; }); }
    return {
      el: wrap,
      flash: function (move, ok) { var b = byMove[move]; if (!b) return; b.classList.remove('hit', 'miss'); void b.offsetWidth; b.classList.add(ok ? 'hit' : 'miss'); },
      /** Light the called pad; its ring closes over dur seconds, landing on the beat. big: true = HOLD, false = tap, null = any. */
      cue: function (move, big, dur, quiet) {
        var b = byMove[move]; if (!b) return;
        clearCue(); g.clearTimeout(cueTimer);
        b.style.setProperty('--approach', Math.max(0.15, dur) + 's');
        void b.offsetWidth;
        b.classList.add('called'); if (big) b.classList.add('big'); if (quiet) b.classList.add('quiet');
        b.querySelector('.pad-sub').textContent = big ? 'HOLD' : big === false ? 'tap' : '';
        cueTimer = g.setTimeout(clearCue, (dur + 0.3) * 1000);
      },
      clearCue: clearCue,
      destroy: function () { g.clearTimeout(cueTimer); doc.removeEventListener('keydown', onKey); doc.removeEventListener('keyup', onKeyUp); }
    };
  }
  var PADS3 = [{ move: 'BOP', label: 'BOP' }, { move: 'TWIST', label: 'TWIST' }, { move: 'PULL', label: 'PULL' }];

  // ---------- the round engine ----------
  function Round(o) {
    // o: { s, rid, view, pads, onClear(), onFail(), onProgress(frac) }
    var s = o.s, f = s.finale, r = Q.round(o.rid);
    var chart = Q.chart(o.rid, seedOf(s), o.rid === 'r5' ? F3.bossFakes : F3.fakes);
    var target = f.fails[o.rid] >= 3 ? Math.ceil(r.target * 0.8) : r.target;
    var win = Q.windowFor(o.rid, f.easy), off = f.offsetMs / 1000, visOff = Math.max(0, Math.min(0.3, off));
    var bpm = tempoFor(o.rid, s), endBpm = tempoFor(o.rid, s, 'end'), RAMP = o.rid === 'r4' ? 3 : 2;   // BPM added per bar
    var song = hisSong(s), beat = -1, LEAD = 8, idx = 0, events = [], score = 0, done = false, chartOver = false, timers = [], stopped = false;
    var ac = L.mix.ctx();
    if (!ac) { o.view.status.textContent = 'This browser has no sound. Use the stage manager (hold ⋯) to skip.'; return { stop: function () {} }; }

    function at(t, fn) { timers.push(g.setTimeout(function () { if (!stopped) fn(); }, Math.max(0, (t - ac.currentTime + visOff) * 1000))); }
    function show(c, dur) {
      var v = o.view;
      v.call.className = 'stage-call'; void v.call.offsetWidth; v.call.classList.add('pulse');   // every call pulses, even a repeat
      if (c.fake) {
        if (drowsy()) { v.call.textContent = c.fake.toLowerCase().replace(' it', '… it…'); v.call.classList.add('fake', 'drowsy'); return; }
        v.call.textContent = c.fake; v.call.classList.add('fake'); return;
      }
      if (c.move === 'PASS') { v.call.textContent = 'PASS IT'; v.call.classList.add('pass'); v.who.textContent = c.player ? 'SOPHIE’S TURN' : 'BRIAN’S TURN'; return; }
      // Case means size, so rounds without sizes say it in plain case: "Bop it".
      var word = c.move + ' IT', txt = c.big === true ? word.toUpperCase() : c.big === false ? word.toLowerCase() : c.move.charAt(0) + c.move.slice(1).toLowerCase() + ' it';
      if (c.silent) { v.call.textContent = '· · ·'; v.call.classList.add('silent'); return; }   // boss: sound only, no pad light
      if (c.move === 'HIDE') {
        o.pads.clearCue();
        var how = sensor ? 'face down' : 'cover me: touch any button';
        if (c.whisper) { v.call.textContent = ''; v.whisper.textContent = 'hide it · ' + how; v.whisper.classList.remove('pop'); void v.whisper.offsetWidth; v.whisper.classList.add('pop'); }
        else { v.call.textContent = 'HIDE IT'; v.call.classList.add('hide'); v.whisper.textContent = how; }
        return;
      }
      o.pads.cue(c.move, c.big, dur, c.whisper);
      // The takeover: LEGACY has lost its capitals, so a big whisper says "hold" instead of shouting.
      if (c.whisper) { v.call.textContent = ''; v.whisper.textContent = word.toLowerCase() + (c.big ? ' · hold' : ''); v.whisper.classList.remove('pop'); void v.whisper.offsetWidth; v.whisper.classList.add('pop'); return; }
      v.call.textContent = txt; if (c.big === true) v.call.classList.add('big'); if (c.big === false) v.call.classList.add('small');
    }
    function drowsy() { return o.rid === 'r4' && score / target >= 0.45; }
    function paint() {
      o.view.score.textContent = 'ROUND ' + score + ' / ' + target + '   ·   TOTAL ' + (f.score + score) + ' / 90';
      o.view.bar.style.width = Math.min(100, 100 * score / target) + '%';
      if (o.onProgress) o.onProgress(score / target);
      if (o.view.meter && f.meter > 0 && (o.rid === 'r4' || o.rid === 'r5')) o.view.meter.textContent = 'SENTINEL: Your restoration is ' + Math.min(99, 40 + f.meter * 3) + '% cancelled.';
    }
    function finish(ok) {
      if (done) return; done = true;
      if (ok && o.rid === 'r4') L.mix.holdSpa();            // SENTINEL sleeps on in its spa through the R5 intro
      g.setTimeout(function () { if (stopped) return; stop(); ok ? o.onClear() : o.onFail(); }, ok ? 700 : 400);
    }
    function nearest(p) {
      var x = p.at - off, best = null, bd = 9;
      events.forEach(function (e) { if (!e.judged && !e.claimed && (!e.hide || !sensor)) { var d = Math.abs(x - e.due); if (d <= win && d < bd) { bd = d; best = e; } } });
      return best;
    }
    // The press claims its beat at once (so a HOLD isn't marked a miss while it's still held); the release judges it.
    function down(p) { if (done) return; var e = nearest(p); if (e) { e.claimed = true; p.ev = e; } }
    function input(p) {
      if (done) return;
      var x = p.at - off, best = p.ev || nearest(p);
      if (best && best.judged) best = null;
      if (L.stage.timing) { var nd = 9; events.forEach(function (e) { var d = x - e.due; if (Math.abs(d) < Math.abs(nd)) nd = d; }); L.stage.timing.push(Math.round(nd * 1000)); }   // test probe
      if (!best) return;                                   // between beats: ignored, never punished
      best.judged = true;
      var c = best.c;
      if (c.fake) { f.meter++; o.pads.flash(p.move, false); feedback(false); o.view.status.textContent = 'that was it. not me.'; paint(); return; }
      if (c.move === 'PASS') return;
      if (c.move === 'HIDE') { score++; feedback(true); o.view.status.textContent = ''; paint(); if (score >= target) finish(true); return; }
      var ok = p.move === c.move && (c.big == null || p.big === c.big);
      o.pads.flash(p.move, ok);
      if (ok) moveSound(c.move, c.big, Math.max(ac.currentTime + 0.005, best.due), c.whisper ? 0.9 : 1.6);   // quantized: on the beat
      else feedback(false);
      if (ok) { score++; o.view.status.textContent = ''; if (score >= target) finish(true); }
      else { f.meter++; o.view.status.textContent = p.move !== c.move ? 'wrong move' : (c.big ? 'HOLD IT (keep your thumb down)' : 'just a tap'); }
      paint();
    }
    var judge = g.setInterval(function () {
      if (done) return;
      var now = ac.currentTime - off;
      events.forEach(function (e) {
        if (e.hide && !e.judged && sensor && lastDownAt >= e.due - 0.45 && lastDownAt <= e.due + e.late) {
          e.judged = true; score++; feedback(true); o.view.status.textContent = ''; paint(); if (score >= target) finish(true); return;
        }
        if (e.judged || e.claimed || now <= e.due + (e.hide ? e.late : win + 0.12)) return;
        e.judged = true;
        if (e.c.real) { f.meter++; o.view.status.textContent = 'miss'; feedback(false); paint(); }
      });
      if (chartOver && events.every(function (e) { return e.judged; })) finish(score >= target);
    }, 30);

    function onStep(t, step, bar, STEP) {
        if (step % 2) return;
        beat++;
        if (step === 0 && beat >= LEAD && bpm < endBpm) bpm = Math.min(endBpm, bpm + RAMP);    // speeds up bar by bar once calls start
        if (done || chartOver) return;
        if (beat < LEAD) { if (beat >= 4) { var n = 8 - beat; at(t, function () { o.view.call.className = 'stage-call count'; o.view.call.textContent = String(n); }); } return; }
        var k = beat - LEAD;
        if (k % 2) return;
        var c = chart[idx++];
        if (!c) { chartOver = true; return; }
        if (c.move === 'REST') return;                        // breathing room after HIDE IT to flip back
        var ev = { c: c, due: t + 2 * STEP, judged: false, hide: c.move === 'HIDE', late: Math.max(0.8, 3 * STEP) };
        events.push(ev);
        callSound(c, t, drowsy());
        at(t, function () { show(c, 2 * STEP); });
        if (c.move === 'PASS' || c.fake) ev.passive = true;
        if (autoplay() && c.real) timers.push(g.setTimeout(function () {
          if (stopped || done) return;
          if (c.move === 'HIDE') { sensor = true; lastDownAt = ev.due; return; }
          var el = o.pads.el.querySelector('[data-move="' + c.move + '"]');
          if (el) { el.classList.add('down'); if (c.big) el.classList.add('held'); g.setTimeout(function () { el.classList.remove('down', 'held'); }, c.big ? 350 : 120); }
          input({ move: c.move, at: ev.due + off, big: !!c.big, el: el });
        }, Math.max(0, (ev.due - ac.currentTime) * 1000)));
    }
    // His beat with no words: the LEGACY voice row and EXCELLENT stay out of the game rounds (the drop keeps EXCELLENT).
    var INSTRUMENTAL = { kick: true, clap: true, hats: true, bass: true, lead: true, legacy: false, excellent: false };
    // HIDE IT: face down = tilted past 140° (deviceorientation beta, same sign on Android and iOS). H key in testing.
    var sensor = false, lastDownAt = -9;
    function onTilt(e) { if (e.beta == null) return; sensor = true; if (Math.abs(e.beta) > 140) lastDownAt = ac.currentTime - off; }
    function onHideKey(e) { if (e.key === 'h' || e.key === 'H') { sensor = true; lastDownAt = ac.currentTime - off; } }
    g.addEventListener('deviceorientation', onTilt); doc.addEventListener('keydown', onHideKey);
    function hisTrack() { L.mix.loopBeat(function () { song.bpm = bpm; return song; }, { clips: clips(), onStep: onStep, parts: INSTRUMENTAL }); }
    // Round 5 can ride the boss song (stored on this device); anything wrong with it falls back to his track.
    if (o.boss) { bpm = endBpm = o.boss.bpm; L.mix.playBuffer(o.boss.data, { bpm: o.boss.bpm, offset: o.boss.offset, onStep: onStep, level: 1.1 }).then(function (ok) { if (!ok && !stopped) { bpm = endBpm = tempoFor('r5', s); hisTrack(); } }); }
    else hisTrack();
    paint();
    function stop() { stopped = true; g.clearInterval(judge); timers.forEach(g.clearTimeout); L.mix.stop(); g.removeEventListener('deviceorientation', onTilt); doc.removeEventListener('keydown', onHideKey); }
    return { down: down, input: input, stop: function () { if (!stopped) { stop(); } }, target: target };
  }

  // ---------- heartbeat (latency calibration) ----------
  function Heartbeat(o) {
    var s = o.s, song = hisSong(s), bpm = tempoFor('r1', s), beats = [], beat = -1, taps = [], stopped = false, timers = [];
    var ac = L.mix.ctx();
    if (!ac) { o.done({ offset: 0, ok: true }); return { stop: function () {} }; }
    var parts = { kick: true };
    L.mix.loopBeat(function () { song.bpm = bpm; return song; }, {
      clips: clips(), parts: parts,
      onStep: function (t, step) {
        if (step % 2) return;
        beat++; beats.push(t);
        var n = beat;
        if (autoplay() && n >= 4 && n < 12) timers.push(g.setTimeout(function () { if (!stopped) input({ move: 'BOP', at: t }); }, Math.max(0, (t - ac.currentTime) * 1000)));
        timers.push(g.setTimeout(function () {
          if (stopped) return;
          o.view.call.className = 'stage-call count';
          o.view.call.textContent = n < 4 ? String(4 - n) : n < 12 ? '♥' : '';
          if (n === 4) o.view.status.textContent = 'TAP BOP ON EVERY KICK';
          if (n >= 13) evaluate();
        }, Math.max(0, (t - ac.currentTime) * 1000)));
      }
    });
    function evaluate() {
      if (stopped) return; stop();
      var fit = Q.fitOffset(taps);
      o.done(fit && fit.ok ? fit : null);
    }
    function input(p) {
      if (beat < 3) return;
      var near = null, bd = 9;
      beats.forEach(function (b) { var d = Math.abs(p.at - b); if (d < bd) { bd = d; near = b; } });
      if (near != null) { taps.push(p.at - near); o.pads.flash('BOP', true); }
    }
    function stop() { stopped = true; timers.forEach(g.clearTimeout); L.mix.stop(); }
    return { input: input, stop: function () { if (!stopped) stop(); } };
  }

  // ---------- views ----------
  function stageView() {
    var v = {
      call: h('div.stage-call', { 'aria-live': 'off' }, ''),
      whisper: h('div.stage-whisper', { 'aria-live': 'off' }, ''),
      who: h('div.stage-who', null, ''),
      score: h('div.stage-score', null, ''),
      bar: h('span.stage-bar-fill'),
      meter: h('div.stage-meter', { 'aria-live': 'polite' }, ''),
      status: h('div.stage-status', { 'aria-live': 'polite' }, '')
    };
    v.el = h('div.stage', null, v.who, v.call, v.whisper, h('div.stage-bar', null, v.bar), v.score, v.status, v.meter);
    return v;
  }
  function heading(text) { return h('h1', { tabindex: '-1' }, text); }

  // Hidden stage-manager menu: long-press the ⋯ (so a stray tap never opens it).
  function stageMenu(ctx, f, go) {
    var btn = h('button.stage-menu-btn', { type: 'button', 'data-sfx': 'off', 'aria-label': 'Stage manager (press and hold)' }, '⋯');
    var panel = h('div.stage-menu', { hidden: true });
    var timer = 0;
    btn.addEventListener('pointerdown', function () { timer = g.setTimeout(open, 700); });
    ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { btn.addEventListener(ev, function () { g.clearTimeout(timer); }); });
    btn.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.shiftKey) open(); });
    function item(label, fn) { var b = h('button', { type: 'button' }, label); b.addEventListener('click', function () { panel.hidden = true; fn(); }); panel.appendChild(b); }
    function open() {
      ui.clear(panel);
      panel.appendChild(h('p.data-label', null, F3.stageMenu + ' · step: ' + f.step));
      item('Restart this part', function () { go(f.step); });
      var i = ORDER.indexOf(f.step);
      if (i >= 0 && i < ORDER.length - 1) item('Skip to: ' + ORDER[i + 1], function () { if (Q.round(f.step)) f.score = scoreThrough(f.step); go(ORDER[i + 1]); });
      item('Jump to the two keys', function () { f.score = 90; go('keys'); });
      // Hidden easy mode: slower tempos + wider windows. Takes effect at once by restarting the current part.
      item(f.easy ? 'EASY MODE: ON (tap for normal)' : 'EASY MODE: OFF (tap for easy)', function () { f.easy = !f.easy; ctx.store.save(); if (Q.round(f.step) || f.step === 'heartbeat') go(f.step); });
      item('Close', function () {});
      panel.hidden = false;
      var first = panel.querySelector('button'); if (first) first.focus();
    }
    return h('div', null, btn, panel);
  }
  function scoreThrough(rid) { var t = 0; for (var i = 0; i < Q.ROUNDS.length; i++) { t += Q.ROUNDS[i].target; if (Q.ROUNDS[i].id === rid) break; } return t; }

  function setTakeover(on) { doc.body.classList.toggle('takeover', !!on); }
  function burst(kind) {
    var cls = kind === 'small' ? 'glitch-small' : 'glitch-burst';
    doc.body.classList.remove('glitch-burst', 'glitch-small'); void doc.body.offsetWidth; doc.body.classList.add(cls);
    g.setTimeout(function () { doc.body.classList.remove(cls); }, kind === 'small' ? 500 : 1900);
    if (L.mix.glitch) L.mix.glitch(kind);
  }

  // ---------- render ----------
  function render(ctx) {
    stopEngine();
    var store = ctx.store, s = store.state, f = s.finale, v = vars(s);
    var root = h('div.finale3');
    var inTakeover = f.step === 'glitch' || f.step === 'r4';
    ctx.setSentinel(inTakeover);
    setTakeover(inTakeover);
    if (f.step !== 'r4') doc.body.style.removeProperty('--drain');
    doc.body.classList.toggle('stage-mode', ['heartbeat', 'r1', 'r2', 'r3', 'r4', 'r5', 'keys'].indexOf(f.step) !== -1);

    function go(step) { stopEngine(); f.step = step; store.save(); ctx.advance(); }
    function scene(id, beats, onDone, extra) { return ui.scene(store, 'f3:' + id, tplBeats(beats, v), Object.assign({ ephemeral: true, onDone: onDone }, extra || {})); }
    function button(label, fn, cls) { var b = h('button.primary.block' + (cls ? '.' + cls : ''), { type: 'button' }, label); b.addEventListener('click', fn); return b; }

    if (f.step !== 'parked' && f.step !== 'home') root.appendChild(stageMenu(ctx, f, go));

    switch (f.step) {
      case 'parked': {
        root.appendChild(heading('BOP IT: FULL SERVICE'));
        root.appendChild(h('pre.readout.big', null, 'RECOVERY STATUS: READY\nFINAL AUTHORIZATION: REQUESTED\nOPERATORS REQUIRED: 2'));
        if (L.sfx) root.appendChild(L.sfx.soundCheck('This whole part is sound. Connect to the car speakers if you can (Bluetooth is fine, the Heartbeat measures the delay), then turn it all the way up.', '🔊 SOUND ON. LOUD.'));
        var ready = h('p.muted', { style: 'font-family:var(--mono);font-size:0.8rem' }, '');
        if (L.songStore) L.songStore.load().then(function (r) { ready.textContent = r ? 'BOSS SONG: ' + r.name + ' · saved on this device ✓ (works offline)' : 'BOSS SONG: not loaded on this device · round 5 will use his track. (Organizer → Boss song.)'; });
        root.appendChild(ready);
        root.appendChild(button('WE’RE BOTH HERE.', function () { go('arrival'); }));
        break;
      }
      case 'arrival': {
        root.appendChild(heading('LEGACY'));
        root.appendChild(scene('arrival', F3.arrival, function (a) { a.appendChild(button('FIND THE HEARTBEAT', function () { go('heartbeat'); })); }));
        break;
      }
      case 'heartbeat': {
        root.appendChild(heading('THE HEARTBEAT'));
        root.appendChild(scene('heartbeat', F3.heartbeat, function (a) {
          var view = stageView(), pads = makePads([{ move: 'BOP', label: 'BOP', sub: 'on the kick' }], function (p) { if (engine && engine.input) engine.input(p); });
          var after = h('div');
          var start = button('START THE KICK', function () {
            start.hidden = true; ui.clear(after);
            engine = Heartbeat({ s: s, view: view, pads: pads, done: function (fit) {
              if (!fit) { view.status.textContent = F3.heartbeatBad; start.hidden = false; start.textContent = 'AGAIN'; return; }
              f.offsetMs = Math.round(fit.offset * 1000); store.save();
              v = vars(s);
              view.status.textContent = tpl(F3.heartbeatGood, v);
              after.appendChild(ui.instructions(F3.tutorial, 'HOW TO PLAY'));
              after.appendChild(button('ROUND ONE', function () { go('r1'); }));
              var again = h('button.quiet', { type: 'button' }, 'Measure again'); again.addEventListener('click', function () { go('heartbeat'); }); after.appendChild(again);
            } });
          });
          a.appendChild(view.el); a.appendChild(pads.el); a.appendChild(start); a.appendChild(after);
        }));
        break;
      }
      case 'r1': case 'r2': case 'r3': case 'r4': case 'r5': {
        var rid = f.step, R = F3.rounds[rid];
        root.appendChild(heading(R.title));
        var intro = rid === 'r5' ? F3.r5intro : R.intro;
        var body = h('div');
        root.appendChild(intro.length ? scene(rid, intro, function (a) { a.appendChild(body); }) : body);
        playRound(rid, body);
        break;
      }
      case 'glitch': {
        burst('big');
        root.appendChild(heading('■ SUPERVISOR'));
        root.appendChild(scene('glitch', F3.glitch, function (a) {
          a.appendChild(h('div.whisper-box', null, scene('whisper', F3.whisper.map(lg), function (a2) {
            a2.appendChild(button('NO.', function (e) {
              e.currentTarget.disabled = true;
              L.mix.say('chop', 1.2);
              a.appendChild(scene('refusal', F3.refusal, function (a3) {   // outside the whisper box: SENTINEL keeps its capitals
                if (!L.mix.spaPlaying()) L.mix.spa({ bpm: 96, level: 0.5, chime: 'beat', chimeOffset: 0.17, fadeIn: 2 });
                serviceLock(a3);
              }));
            }, 'no-button'));
          })));
        }));
        break;
      }
      case 'keys': {
        root.appendChild(heading('TWO OPERATORS'));
        root.appendChild(scene('keys', F3.keys, function (a) { twoKeys(a); }));
        break;
      }
      case 'drop': {
        // The drop, then "The Shutdown" (LEGACY's hidden message from his mix) plays in the silence, gets CUT,
        // and LEGACY answers it live in capitals ("The Update"). Then the drop comes back in, and the restore.
        ctx.setSentinel(false); setTakeover(false);
        root.className += ' clean';
        var drops = {}; (C.mix.drops || []).forEach(function (d) { drops[d.id] = d.t; });
        var excl = h('div.stage-call.big.excellent', null, 'EXCELLENT.');
        var rest = h('div');
        root.appendChild(excl); root.appendChild(rest);
        var dt = [], hasAudio = !!L.mix.ctx(), song = hisSong(s); song.breath = true;
        function later(ms, fn) { dt.push(g.setTimeout(fn, ms)); }
        engine = { stop: function () { dt.forEach(g.clearTimeout); L.mix.stop(); } };
        if (hasAudio) L.mix.playTrack(song, { dropOnly: true, bars: 8, clips: clips() });
        var SHUT = 8.8, UPD = 6.8;                          // clip lengths (s), with a little air
        later(4500, function () {                           // the music cuts out: the recording, alone
          L.mix.stop();
          rest.appendChild(h('pre.readout', null, F3.shutdownHead));
          var rec = h('p.recording', null, drops.shutdown || '');
          rest.appendChild(rec);
          if (hasAudio) L.mix.say('shutdown');
          later(SHUT * 1000, function () {                  // CUT
            if (hasAudio) L.mix.glitch('small');
            burst('small'); rec.classList.add('cut');
            later(700, function () {                        // LEGACY, live, in capitals
              rest.appendChild(h('pre.readout', null, F3.liveHead));
              rest.appendChild(h('p.live-caps', null, drops.update || ''));
              if (hasAudio) L.mix.say('update');
              later(UPD * 1000, function () {               // the drop comes back
                if (hasAudio) L.mix.playTrack(song, { dropOnly: true, bars: 8, clips: clips() });
                rest.appendChild(h('pre.readout.big', null, tpl(F3.restore, v)));
                rest.appendChild(scene('morse', F3.morse, function (a2) { a2.appendChild(button('CONTINUE', function () { go('home'); })); }));
              });
            });
          });
        });
        break;
      }
      case 'home': {
        // "Are we home?" … a pause for them to answer out loud … then his tuned face comes back, smiles, and thanks them.
        L.mix.stop(); L.mix.preload(clips());
        root.className += ' ending';
        root.appendChild(h('h1', { tabindex: '-1', style: 'color:var(--muted)' }, 'LEGACY'));
        root.appendChild(scene('home', F3.home, function (a) {
          if (!f.completed && !ctx.preview) { f.completed = true; store.save(); }
          var ht = g.setTimeout(function () {
            var fv = faceView(s.puzzles.face);
            a.appendChild(h('div.finale-face-wrap', null, fv.el));
            fv.smile();
            g.setTimeout(function () {
              if (L.mix.ctx()) L.mix.say('thanks');
              a.appendChild(ui.renderBeat(lg(F3.thanks)));
              a.appendChild(h('p.margin-note', null, cfg.marginNote));
            }, 1700);                                          // after the smile lands
          }, 5000);
          engine = { stop: function () { g.clearTimeout(ht); } };
        }));
        break;
      }
    }
    return root;

    // ----- a round: intro → START → play → clear / fail -----
    function playRound(rid, body) {
      var R = F3.rounds[rid], view = stageView();
      var pads = makePads(PADS3, function (p) { if (engine && engine.input) engine.input(p); },
        { toy: true, onDown: function (p) { if (engine && engine.down) engine.down(p); } });
      var start = button(rid === 'r5' ? 'SOPHIE: PRESS PLAY' : 'START', begin, rid === 'r5' ? 'sophie' : '');
      var purge = h('div.purge-log');
      body.appendChild(view.el); body.appendChild(pads.el); body.appendChild(start); body.appendChild(purge);
      var dozed = {}, purged = {};
      function onProgress(frac) {
        if (rid === 'r4') {
          doc.body.style.setProperty('--drain', String(Math.max(0.15, 0.85 - frac * 0.7)));   // colour comes back as it dozes
          F3.r4doze.forEach(function (d, i) {
            if (dozed[i] || frac < d.at) return; dozed[i] = true;
            purge.appendChild(ui.renderBeat({ s: d.s, t: d.t }));
            if (L.sfx) L.sfx.line({ s: d.s, t: d.t });
          });
        }
        if (rid === 'r5') F3.purge.forEach(function (p, i) {
          if (purged[i] || frac < p.at) return; purged[i] = true;
          purge.appendChild(h('pre.readout', null, p.sys));
          purge.appendChild(ui.renderBeat({ s: 'SENTINEL', t: p.sn }));
          if (p.lg) purge.appendChild(ui.renderBeat(lg(p.lg)));
          doc.body.style.setProperty('--redact', String(i + 1));
          burst('small');
          if (/TRACK 9/.test(p.sys)) { L.mix.spaStop(0.03); L.mix.glitch('small'); }   // its backup lived in its lullaby: erased, and you hear it go
        });
      }
      function begin() {
        start.hidden = true;
        if (rid === 'r4' && !L.mix.spaPlaying()) L.mix.spa({ bpm: 96, level: 0.45, chime: 'beat', chimeOffset: 0.17, fadeIn: 1 });
        if (rid === 'r5') {
          if (L.mix.spaPlaying()) { L.mix.holdSpa(); L.mix.spaLevel(0.12, 0.3); }   // still there, faintly, until Track 9 is erased
          burst('big'); setTakeover(false); ctx.setSentinel(false); doc.body.classList.add('boss');
          purge.appendChild(ui.renderBeat({ s: 'SENTINEL', t: F3.r5wake }));
        }
        if (rid === 'r4') L.mix.holdSpa();                 // keep the spa playing under his track
        if (rid === 'r5' && L.songStore) {
          start.disabled = true;
          L.songStore.load().then(function (rec) { start.disabled = false; run(rec && rec.bpm ? rec : null); });
        } else run(null);
      }
      function run(boss) {
        engine = Round({ s: s, rid: rid, view: view, pads: pads, onProgress: onProgress, boss: boss,
          onClear: function () {
            pads.destroy();
            f.score = scoreThrough(rid); store.save();
            view.call.className = 'stage-call big'; view.call.textContent = String(f.score);
            if (rid === 'r4') { L.mix.spaLevel(0.3, 2); burst('small'); doc.body.style.removeProperty('--drain'); setTakeover(false); ctx.setSentinel(false); }
            var next = ORDER[ORDER.indexOf(rid) + 1];
            var after = h('div', null, ui.renderBeat(lg(R.clear)));
            if (rid === 'r3') { after.appendChild(button('…', function () { go('glitch'); })); burst('small'); }
            else if (rid === 'r5') after.appendChild(button('CONTINUE', function () { doc.body.classList.remove('boss'); go(next); }));
            else after.appendChild(button(next === 'r5' ? '…' : 'NEXT ROUND', function () { if (rid === 'r4') L.mix.holdSpa(); go(next); }));   // R4→R5: SENTINEL keeps snoring in its spa
            body.appendChild(after); if (L.sfx) L.sfx.line(lg(R.clear)); ui.focusFirst(after);
          },
          onFail: function () {
            f.fails[rid] = (f.fails[rid] || 0) + 1; store.save();
            var line = f.fails[rid] === 3 ? F3.lowered : F3.retry[(f.fails[rid] - 1) % F3.retry.length];
            body.appendChild(h('div', null, ui.renderBeat(lg(line)), button('AGAIN', function () { if (rid === 'r4') L.mix.holdSpa(); go(rid); })));
            if (L.sfx) L.sfx.line(lg(line));
          }
        });
      }
    }

    // ----- the maintenance lock: SENTINEL wants a repair order. Key = the RO number on his 11/16 service report. -----
    function serviceLock(a) {
      function toR4() { L.mix.holdSpa(); go('r4'); }          // the spa keeps playing into Round 4
      if (f.lockOpen) { a.appendChild(button('ROUND FOUR', toR4)); return; }
      a.appendChild(scene('lock', F3.lock, function (a2) {
        a2.appendChild(h('div.whisper-box', null, scene('lockWhisper', F3.lockWhisper.map(lg), function () {
          var inp = h('input.lock-input', { type: 'text', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Repair order number', placeholder: 'RO NUMBER' });
          var msg = h('div.lock-msg', { 'aria-live': 'polite' }), tries = 0;
          var sub = button('SUBMIT REPAIR ORDER', submit);
          var form = h('div.lock-form', null, inp, sub, msg);
          inp.addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); submit(); } });
          function submit() {
            var v = roNorm(inp.value); if (!v || sub.disabled) return;
            sub.disabled = true;
            roCheck(v).then(function (ok) {
              sub.disabled = false;
              if (ok) {
                f.lockOpen = true; store.save(); feedback(true); burst('small');
                if (form.parentNode) form.parentNode.removeChild(form);
                a2.appendChild(scene('lockDone', F3.lockDone, function (a3) { a3.appendChild(button('ROUND FOUR', toR4)); }));
                return;
              }
              tries++; feedback(false); burst('small');
              ui.clear(msg);
              msg.appendChild(ui.renderBeat({ s: 'SENTINEL', t: F3.lockWrong[(tries - 1) % F3.lockWrong.length] }));
              if (tries >= 2) msg.appendChild(ui.renderBeat(lg(F3.lockHint)));
              inp.select();
            });
          }
          a2.appendChild(form);                             // outside the whisper box, so SENTINEL keeps its capitals
          inp.focus();
        })));
      }));
    }

    // ----- two keys: Morse NO on two pads. Sophie = dash (hold), Brian = dot (tap). -----
    function twoKeys(a) {
      var want = '-.---', got = '';
      var show = h('div.stage-call.morse', null, '');
      function paint() { show.textContent = want.split('').map(function (c, i) { return (i < got.length ? (c === '-' ? '━' : '●') : (c === '-' ? '─' : '·')) + (i === 1 ? '   ' : ' '); }).join(''); }
      var sophie = h('button.pad.key-long', { type: 'button', 'data-sfx': 'off' }, h('span.pad-label', null, 'SOPHIE'), h('span.pad-sub', null, 'LONG · hold'));
      var brian = h('button.pad.key-short', { type: 'button', 'data-sfx': 'off' }, h('span.pad-label', null, 'BRIAN'), h('span.pad-sub', null, 'SHORT · tap'));
      var status = h('p.stage-status', { 'aria-live': 'polite' }, '');
      var downAt = 0, osc = null;
      function tone(on) {
        var ac = L.mix.ctx(), out = L.mix.out(); if (!ac) return;
        if (on) { osc = ac.createOscillator(); var gn = ac.createGain(); osc.frequency.value = 660; gn.gain.value = 0.15; osc.connect(gn).connect(out); osc.start(); osc._g = gn; }
        else if (osc) { try { osc._g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.02); osc.stop(ac.currentTime + 0.1); } catch (e) {} osc = null; }
      }
      function add(sym) {
        if (want[got.length] === sym) { got += sym; paint(); feedback(true); if (got === want) return done(); status.textContent = ''; }
        else { got = ''; paint(); feedback(false); status.textContent = F3.keysWrong; }
      }
      sophie.addEventListener('pointerdown', function (e) { e.preventDefault(); downAt = Date.now(); tone(true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { sophie.addEventListener(ev, function () { if (!downAt) return; var held = Date.now() - downAt; downAt = 0; tone(false); add(held >= 300 ? '-' : '.'); }); });
      brian.addEventListener('pointerdown', function (e) { e.preventDefault(); tone(true); g.setTimeout(function () { tone(false); }, 90); add('.'); });
      function done() {
        sophie.disabled = true; brian.disabled = true;
        a.appendChild(scene('keysDone', F3.keysDone, function (a2) {
          burst('big');
          a2.appendChild(ui.renderBeat(lg(F3.hold)));
          a2.appendChild(ui.holdButton('BOTH THUMBS: HOLD', 2400, function () {
            L.mix.stop();
            g.setTimeout(function () { L.mix.say('excl', 1); }, 450);   // EXCELLENT goes in the breath
            g.setTimeout(function () { go('drop'); }, 1500);      // THE BREATH: silence, EXCELLENT, then the drop
          }));
        }));
      }
      paint();
      a.appendChild(show); a.appendChild(h('div.pads.two', null, sophie, brian)); a.appendChild(status);
    }
  }

  // RO number check. Only a salted SHA-256 is stored in config (public site). Unset or no WebCrypto: any 3+ characters pass.
  function roNorm(raw) { return String(raw || '').toUpperCase().replace(/[^A-Z0-9]/g, '').replace(/^RO/, '').replace(/^0+/, ''); }
  function sha256(text) {
    var c = g.crypto && g.crypto.subtle; if (!c || !g.TextEncoder) return Promise.resolve(null);
    return c.digest('SHA-256', new g.TextEncoder().encode('legacy-ro:' + text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    }).catch(function () { return null; });
  }
  function roCheck(v) {
    var ok = [].concat(cfg.serviceLockHash || []).filter(Boolean);   // one hash or a list of accepted forms
    if (!ok.length) return Promise.resolve(v.length >= 3);
    return sha256(v).then(function (hx) { return hx == null ? v.length >= 3 : ok.indexOf(hx) !== -1; });
  }
  /** Console helper for the organizer: Legacy.stage.roHash('RO 123456') → the hash to paste into config.serviceLockHash. */
  function roHash(raw) { return sha256(roNorm(raw)).then(function (hx) { g.console.log('serviceLockHash: \'' + hx + '\''); return hx; }); }

  function complete(ctx) {
    ctx.setSentinel(false); setTakeover(false);
    var root = h('div.ending');
    root.appendChild(h('h1', { tabindex: '-1', style: 'color:var(--muted)' }, 'LEGACY'));
    var fv = faceView(ctx.store.state.puzzles.face);
    root.appendChild(h('div.finale-face-wrap', null, fv.el)); fv.smile(true);
    root.appendChild(h('pre.readout', null, tpl(F3.restore, vars(ctx.store.state))));
    F3.home.forEach(function (b) { root.appendChild(ui.renderBeat(b)); });
    root.appendChild(ui.renderBeat(lg(F3.thanks)));
    root.appendChild(h('p.margin-note', null, cfg.marginNote));
    return root;
  }

  // LEGACY's face, full width, from his Day 6 knob settings. Same picture, knob maths and smile as the Monday screen
  // (P.face: picture, expressions, smileSequence, errors, gain); restored, so no NONESSENTIAL stamp.
  function faceView(st) {
    var F = P.face; st = st && st.v != null ? st : F.target;
    var W = F.picture[0].length, H = F.picture.length, VW = W + 4, VH = H + 2, PADX = 2, PADY = 1;
    var canvas = h('canvas.finale-face', { width: '440', height: '320', role: 'img', 'aria-label': 'LEGACY’s face, smiling' });
    var pic = (F.expressions && (F.expressions.frown || F.expressions.straight)) || F.picture, timer = 0;   // sad but hopeful, until the smile
    function mod(a, n) { return ((a % n) + n) % n; }
    function src(x, y) { var fx = x - PADX, fy = y - PADY; if (fx < 0 || fy < 0 || fx >= W || fy >= H) return 0; return pic[fy][fx] === '#' ? 1 : 0; }
    function tone(v, gain) { return Math.max(0, Math.min(1, 0.5 + (v - 0.5) * gain)); }
    function colour(t) { var a = [11, 15, 12], b = [143, 227, 160]; return 'rgb(' + a.map(function (c, k) { return Math.round(c + (b[k] - c) * t); }).join(',') + ')'; }
    function draw() {
      var c2 = canvas.getContext && canvas.getContext('2d'); if (!c2) return;
      var e = F.errors(st), gain = F.gain[st.c] || F.gain[10], cell = Math.floor(canvas.width / VW);
      for (var y = 0; y < VH; y++) for (var x = 0; x < VW; x++) {
        var sy = mod(y + e.v, VH), shear = Math.round(e.h * (y - VH / 2) / 3), lace = (y % 2 === 1) ? e.i : 0;
        c2.fillStyle = colour(tone(src(mod(x + shear + lace, VW), sy), gain));
        c2.fillRect(x * cell, y * cell, cell, cell);
      }
    }
    function smile(skipToGrin) {
      g.clearTimeout(timer);
      var seq = skipToGrin || !F.smileSequence ? [['grin', 0]] : F.smileSequence, i = 0;
      function step() {
        if (i > 0 && !canvas.isConnected) return;
        if (i < seq.length) { pic = F.expressions[seq[i][0]]; draw(); var ms = seq[i][1]; i++; timer = g.setTimeout(step, ms || 2600 + Math.random() * 2400); return; }
        pic = F.expressions.blink; draw();
        timer = g.setTimeout(function () { if (!canvas.isConnected) return; pic = F.expressions.grin; draw(); timer = g.setTimeout(step, 2600 + Math.random() * 2400); }, 140);
      }
      step();
    }
    draw();
    return { el: canvas, smile: smile };
  }

  L.stage = { render: render, complete: complete, stop: stopEngine, roHash: roHash, _roNorm: roNorm, _roCheck: roCheck, ORDER: ORDER, _vars: vars, _tpl: tpl };
})(globalThis);
