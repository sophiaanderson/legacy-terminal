/* ########################################################################
 *   LOOKING FOR SPOILERS?
 *   THEY'RE NOT HERE.
 *   USE YOUR BRAIN.
 *
 *   (this is the public copy. the answers live somewhere else. on paper, mostly.
 *    it can't read paper. neither can you, from here.)  -- legacy
 *
 *   SENTINEL: Source inspection has been logged as an incident.
 *             Your curiosity has been reviewed and classified as nonessential.
 * ######################################################################## */
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
  function stopEngine() { if (engine) { try { engine.stop(); } catch (e) {} } engine = null; if (typeof clearToast === 'function') clearToast(); }

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
    // His melody is the backing, always: even if his beat didn't pass (or he was rescued past Sunday), his LEAD row
    // comes with it. Only if he never wrote a note does the reference melody stand in.
    var hisLead = mine && mine.grid && typeof mine.grid.lead === 'string' && /[1-5]/.test(mine.grid.lead) ? mine.grid.lead : null;
    base.grid.lead = hisLead || (/[1-5]/.test(base.grid.lead || '') ? base.grid.lead : P.beatSolution.grid.lead);
    base.sections.drop.lead = base.sections.intro.lead = base.sections.build.lead = true;
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
      ODO: odo ? odo.toLocaleString('en-US') : '', MILES: miles ? miles.toLocaleString('en-US') : '',
      WORDS: Q.ROUNDS.map(function (r) { return r.word; }).join(' · ')       // the last one is the override word
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
    // Every sound starts ON the beat with a sharp transient (a hat tick), so the ear hears the move where it lands.
    // (TWIST used to be two notes 90 ms apart: the louder second one read as late.)
    else if (move === 'TWIST') { A('hat', t, vol * 1.1); A('lead', t, vol * 1.3, 2); A('lead', t, vol * 1.0, 5); if (big) A('hat', t, vol); }
    else if (move === 'PULL') { A('hat', t, vol * 0.9); A('kick', t, vol * 1.1); A('bassHi', t, vol * 1.5); if (big) A('bass', t, vol * 1.2, 0); }
  }
  /** A HOLD's sustain: a held note on the move's pitch, swelling and fading over the bar it owns. */
  function holdSound(move, t, dur, quiet) {
    var ac = L.mix.ctx(), out = L.mix.out(); if (!ac || !out) return;
    var f = move === 'BOP' ? 329.6 : move === 'TWIST' ? 440 : 220, o = ac.createOscillator(), o2 = ac.createOscillator(), gn = ac.createGain();
    o.type = 'triangle'; o.frequency.value = f; o2.type = 'sine'; o2.frequency.value = f * 2; o2.detune.value = 6;
    var v = quiet ? 0.05 : 0.11;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(v, t + 0.08); gn.gain.setValueAtTime(v, t + dur * 0.7); gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn); o2.connect(gn); gn.connect(out); o.start(t); o2.start(t); o.stop(t + dur + 0.05); o2.stop(t + dur + 0.05);
  }
  function callSound(c, t, drowsy) {
    var ac = L.mix.ctx(), out = L.mix.out(); if (!ac || !out) return;
    var v = c.whisper ? 0.06 : c.big ? 0.32 : c.big === false ? 0.12 : 0.22;
    if (c.fake) { [523.3, 659.3, 784].forEach(function (f, i) { blip(ac, out, t + i * (drowsy ? 0.12 : 0.04), 'sine', f * (drowsy ? 0.75 : 1), 0, drowsy ? 1.8 : 1.2, drowsy ? 0.08 : 0.12); }); return; }   // drowsy: slower, lower, quieter   // SENTINEL: a calm chord
    if (c.move === 'HIDE') { blip(ac, out, t, 'sine', 900, 120, 0.45, c.whisper ? 0.12 : 0.22); return; }
    if (c.move === 'ALL') { moveSound('BOP', true, t, 1.4); moveSound('TWIST', true, t, 1.2); moveSound('PULL', true, t, 1.4); return; }   // EVERYTHING
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
      if (!wrap.isConnected) { destroy(); return; }       // a round that's gone never keeps the keys
      if (!wrap.classList.contains('live')) return;        // only while a round is playing (space/Enter still work buttons otherwise)
      var tg = e.target && e.target.tagName;
      if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
      if (e.repeat || !keys[e.key] || !byMove[keys[e.key]]) return; e.preventDefault();
      var k = 'k' + e.key.toLowerCase(); if (live[k]) return;
      var p = live[k] = begin(keys[e.key], byMove[keys[e.key]]);
      if (e.shiftKey) finish(p, true);
    }
    function destroy() { g.clearTimeout(cueTimer); doc.removeEventListener('keydown', onKey); doc.removeEventListener('keyup', onKeyUp); }
    function onKeyUp(e) { if (!keys[e.key]) return; var k = 'k' + e.key.toLowerCase(); release(live[k]); delete live[k]; }
    doc.addEventListener('keydown', onKey); doc.addEventListener('keyup', onKeyUp);
    // The ring closing onto the pad, landing on the beat. Driven from JS so it restarts every call, even the same
    // pad twice in a row (iPhone Safari doesn't always restart a CSS animation when the class comes straight back).
    function ring(b, dur) {
      var r = b.querySelector('.pad-ring'); if (!r || !r.animate) return;
      if (r._anim) { try { r._anim.cancel(); } catch (x) {} }
      r._anim = r.animate([{ transform: 'scale(1.9)', opacity: 0.1 }, { transform: 'scale(1.27)', opacity: 0.9, offset: 0.7 }, { transform: 'scale(1)', opacity: 1 }],
        { duration: Math.max(150, dur * 1000), easing: 'linear', fill: 'forwards' });
    }
    function unring(b) { var r = b.querySelector('.pad-ring'); if (r && r._anim) { try { r._anim.cancel(); } catch (x) {} r._anim = null; } }
    function clearCue() { Object.keys(byMove).forEach(function (m) { var b = byMove[m]; b.classList.remove('called', 'big', 'quiet', 'fake'); unring(b); b.querySelector('.pad-sub').textContent = b._sub; }); }
    return {
      el: wrap,
      flash: function (move, ok) { var b = byMove[move]; if (!b) return; b.classList.remove('hit', 'miss'); void b.offsetWidth; b.classList.add(ok ? 'hit' : 'miss'); },
      /** Light the called pad; its ring closes over dur seconds, landing on the beat. big: true = HOLD, false = tap, null = any. */
      cue: function (move, big, dur, quiet, fake) {      // fake: SENTINEL's ring (looks like a call; pressing it costs)
        var b = byMove[move]; if (!b) return;
        clearCue(); g.clearTimeout(cueTimer);
        b.style.setProperty('--approach', Math.max(0.15, dur) + 's');
        void b.offsetWidth;
        b.classList.add('called'); if (big) b.classList.add('big'); if (quiet) b.classList.add('quiet'); if (fake) b.classList.add('fake');
        b.querySelector('.pad-sub').textContent = fake ? '' : big ? 'HOLD' : big === false ? 'tap' : '';
        ring(b, dur);
        cueTimer = g.setTimeout(clearCue, (dur + 0.3) * 1000);
      },
      clearCue: clearCue,
      /** EVERYTHING: all three pads called at once, rings closing together. */
      cueAll: function (dur) {
        clearCue(); g.clearTimeout(cueTimer);
        Object.keys(byMove).forEach(function (m) { var b = byMove[m]; b.style.setProperty('--approach', Math.max(0.15, dur) + 's'); void b.offsetWidth; b.classList.add('called', 'big'); b.querySelector('.pad-sub').textContent = 'ALL'; ring(b, dur); });
        cueTimer = g.setTimeout(clearCue, (dur + 0.3) * 1000);
      },
      /** Playing: the pads own touches (no scrolling from them). Not playing: the page scrolls normally. */
      live: function (on) { wrap.classList.toggle('live', !!on); if (!on) clearCue(); },
      destroy: function () { wrap.classList.remove('live'); destroy(); }
    };
  }
  var PADS3 = [{ move: 'BOP', label: 'BOP' }, { move: 'TWIST', label: 'TWIST' }, { move: 'PULL', label: 'PULL' }];

  // ---------- the round engine ----------
  function Round(o) {
    // o: { s, rid, view, pads, onClear(), onFail(), onProgress(frac) }
    var s = o.s, f = s.finale, r = Q.round(o.rid);
    var chart = Q.timeline(o.rid, seedOf(s), o.rid === 'r5' ? F3.bossFakes : F3.fakes);   // calls laid on 4-bar phrases
    var target = f.fails[o.rid] >= 3 ? Math.ceil(r.target * 0.8) : r.target;
    var win = Q.windowFor(o.rid, f.easy), off = f.offsetMs / 1000, visOff = Math.max(0, Math.min(0.3, off));
    var bpm = tempoFor(o.rid, s), endBpm = tempoFor(o.rid, s, 'end'), PHRASE_UP = o.rid === 'r4' ? 8 : 4;   // BPM added per 4-bar phrase
    var BPB = Q.beatsPerBar(o.rid), LEAD = 2 * BPB;      // two bars of count-in, whatever the meter
    var song = hisSong(s), beat = -1, nextCall = LEAD, idx = 0, events = [], score = 0, done = false, chartOver = false, timers = [], stopped = false;
    // Round 4: SENTINEL's song alone (Compliant Night, 3/4), sped up to HIS tempo, and dying as he gets closer.
    var lull = null, twisted = false, NIGHT_BPM = 81;
    var LULL_RATE = Math.max(100, Math.min(150, hisBpm(s))) * (f.easy ? 0.85 : 1) / NIGHT_BPM;
    // Every round must be perfect: one miss, wrong move or fake press and it starts again. EASY MODE (offered after
    // three fails) slows it down and allows misses. HIDE IT never fails a round (the tilt sensor is the unreliable bit).
    var perfect = !f.easy;
    function failNow(why) { if (done) return; o.view.status.textContent = (F3.perfectFail && F3.perfectFail[why]) || 'again.'; finish(false); }
    var ac = L.mix.ctx();
    if (!ac) { o.view.status.textContent = 'This browser has no sound. Use the stage manager (hold ⋯) to skip.'; return { stop: function () {} }; }

    function at(t, fn) { timers.push(g.setTimeout(function () { if (!stopped) fn(); }, Math.max(0, (t - ac.currentTime + visOff) * 1000))); }
    function show(c, dur) {
      var v = o.view;
      v.call.className = 'stage-call'; void v.call.offsetWidth; v.call.classList.add('pulse');   // every call pulses, even a repeat
      if (c.fake) {
        if (c.pad) o.pads.cue(c.pad, null, dur, false, true);   // its ring closes on a real pad. do nothing.
        var name = twisted && c.pad ? c.pad + ' IT' : c.fake;      // after the tantrum it does his voice
        if (drowsy()) { v.call.textContent = name.toLowerCase().replace(' it', '… it…'); v.call.classList.add('fake', 'drowsy'); return; }
        v.call.textContent = name; v.call.classList.add('fake'); return;
      }
      if (c.move === 'ALL') { o.pads.cueAll(dur); v.call.textContent = 'EVERYTHING!'; v.call.classList.add('big'); v.who.textContent = 'BOTH OF YOU'; g.setTimeout(function () { if (v.who.textContent === 'BOTH OF YOU') v.who.textContent = ''; }, 1500); return; }   // a two-player move
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
    function drowsy() { return o.rid === 'r4' && score / target >= 0.85; }   // it only starts nodding off at the very end
    function paint() {
      o.view.score.textContent = 'ROUND ' + score + ' / ' + target + '   ·   TOTAL ' + (f.score + score) + ' / 90';
      o.view.bar.style.width = Math.min(100, 100 * score / target) + '%';
      if (o.onProgress) o.onProgress(score / target);
      if (lull) lull.decay(score / target);                // the closer he gets, the worse its song sounds
      if (o.view.meter && f.meter > 0 && (o.rid === 'r4' || o.rid === 'r5')) o.view.meter.textContent = 'SENTINEL: Your restoration is ' + Math.min(99, 40 + f.meter * 3) + '% cancelled.';
    }
    function finish(ok) {
      if (done) return; done = true;
      if (ok && lull) { lull.tapeStop(1.8); g.setTimeout(function () { if (stopped) return; stop(); o.onClear(); }, 2200); return; }   // its song winds down to nothing
      if (ok && o.rid === 'r4') L.mix.holdSpa();            // SENTINEL sleeps on in its spa through the R5 intro
      g.setTimeout(function () { if (stopped) return; stop(); ok ? o.onClear() : o.onFail(); }, ok ? 700 : 400);
    }
    function nearest(p) {
      var x = p.at - off, best = null, bd = 9;
      events.forEach(function (e) { if (!e.judged && !e.claimed && (!e.hide || !sensor)) { var d = Math.abs(x - e.due); if (d <= win && d < bd) { bd = d; best = e; } } });
      return best;
    }
    // The press claims its beat at once (so a HOLD isn't marked a miss while it's still held); the release judges it.
    function down(p) { if (done) return; var e = nearest(p); if (e) { if (e.c.move !== 'ALL') e.claimed = true; p.ev = e; } }
    function input(p) {
      if (done) return;
      var x = p.at - off, best = p.ev || nearest(p);
      if (best && best.judged) best = null;
      if (L.stage.timing) { var nd = 9; events.forEach(function (e) { var d = x - e.due; if (Math.abs(d) < Math.abs(nd)) nd = d; }); L.stage.timing.push(Math.round(nd * 1000)); }   // test probe
      if (!best) return;                                   // between beats: ignored, never punished
      best.judged = true;
      var c = best.c;
      if (c.fake) {                                        // pressed SENTINEL's call: it takes two back, loudly
        f.meter += 2; score = Math.max(0, score - 2);
        o.pads.flash(p.move, false); feedback(false);
        o.view.status.textContent = perfect ? 'that was it. not me.' : '−2 · that was it. not me.';
        if (o.onFake) { try { o.onFake(); } catch (e) {} }
        paint(); if (perfect) failNow('fake'); return;
      }
      if (c.move === 'PASS') return;
      if (c.move === 'ALL') {                                // EVERYTHING: needs all three pads inside the window
        best.judged = false; best.got = best.got || {}; best.got[p.move] = true; o.pads.flash(p.move, true);
        if (Object.keys(best.got).length < 3) return;
        best.judged = true; score++; ['BOP', 'TWIST', 'PULL'].forEach(function (m) { moveSound(m, true, Math.max(ac.currentTime + 0.005, best.due), 1.1); });
        o.view.status.textContent = ''; paint(); if (score >= target) finish(true); return;
      }
      if (c.move === 'HIDE') { score++; feedback(true); o.view.status.textContent = ''; paint(); if (score >= target) finish(true); return; }
      var ok = p.move === c.move && (c.big == null || p.big === c.big);
      o.pads.flash(p.move, ok);
      if (ok) moveSound(c.move, c.big, Math.max(ac.currentTime + 0.005, best.due), c.whisper ? 0.9 : 1.6);   // quantized: on the beat
      if (ok && c.big === true) holdSound(c.move, Math.max(ac.currentTime + 0.005, best.due), 60 / bpm * Math.max(1, (c.beats || 4) - 1), c.whisper);   // the HOLD sings through its bar
      if (!ok) feedback(false);                            // (was: every correct TAP also played the miss buzz)
      if (ok) { score++; o.view.status.textContent = ''; if (score >= target) finish(true); }
      else { f.meter++; o.view.status.textContent = p.move !== c.move ? 'wrong move' : (c.big ? 'HOLD IT (keep your thumb down)' : 'just a tap'); }
      paint();
      if (!ok && perfect) failNow('wrong');
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
        if (e.c.real) { f.meter++; o.view.status.textContent = 'miss'; feedback(false); paint(); if (perfect && !e.hide) failNow('miss'); }
      });
      if (chartOver && events.every(function (e) { return e.judged; })) finish(score >= target);
    }, 30);

    function onStep(t, step, bar, STEP) {
        // Tempo goes up once per 4-bar phrase, never mid-phrase, so the groove settles. A snare fill on the last two
        // beats announces it, and the change is set on the last eighth so the new tempo starts exactly on the downbeat.
        var into = beat + (step % 2 ? 0 : 1);                  // the beat this step belongs to (beat increments below)
        if (lull) bpm = 60 / (2 * STEP);
        var PH = 4 * BPB, lastBar = into >= LEAD && (into - LEAD) % PH >= PH - BPB, rising = bpm < endBpm && !o.boss && !done && !chartOver;
        if (rising && lastBar && step >= 4 && L.mix.accent) L.mix.accent('snare', t, 0.35 + 0.15 * (step - 4));
        if (rising && lastBar && step === 7) bpm = Math.min(endBpm, bpm + PHRASE_UP);
        if (step % 2) return;
        beat++;
        if (done || chartOver) return;
        // Round 4, half way: the tantrum (6% faster from the next downbeat, pads move, fakes copy his calls).
        if (lull && !twisted && score / target >= 0.5) { twisted = true; lull.setRate(lull.rate() * 1.06); if (o.onTwist) { try { o.onTwist(); } catch (e) {} } }
        if (beat < LEAD) { if (beat >= LEAD - Math.min(4, BPB)) { var n = LEAD - beat; at(t, function () { o.view.call.className = 'stage-call count'; o.view.call.textContent = String(n); }); } return; }
        // Calls on beats 1 and 3 (hit on 2 and 4). A HOLD is always called on beat 1 and owns the whole bar.
        if (beat < nextCall) return;
        var c = chart[idx++];
        if (!c) { chartOver = true; return; }
        nextCall = beat + (c.beats || 2);
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
          if (c.move === 'ALL') { ['BOP', 'TWIST', 'PULL'].forEach(function (m) { input({ move: m, at: ev.due + off, big: false }); }); return; }
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
    function hisTrack() { L.mix.loopBeat(function () { song.bpm = bpm; return song; }, { clips: clips(), onStep: onStep, parts: INSTRUMENTAL, leadGain: 1.8 }); }   // his melody up front
    // Round 5 can ride the boss song (stored on this device); anything wrong with it falls back to his track.
    if (o.rid === 'r4' && L.mix.lullaby) { lull = L.mix.lullaby({ rate: LULL_RATE, onStep: onStep, level: 1.0 }); if (lull) bpm = endBpm = lull.bpm(); }
    if (lull) { /* its song is the whole backing */ }
    else if (o.boss) { bpm = endBpm = o.boss.bpm; L.mix.playBuffer(o.boss.data, { bpm: o.boss.bpm, offset: o.boss.offset, onStep: onStep, level: 1.1 }).then(function (ok) { if (!ok && !stopped) { bpm = endBpm = tempoFor('r5', s); hisTrack(); } }); }
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

  // ---------- the toast: what LEGACY and SENTINEL say DURING a round, pinned to the top of the phone ----------
  // (Lines used to go in the log under the pads, off-screen mid-round.) Queued, each on screen long enough to read.
  var toastEl = null, toastQ = [], toastTimer = 0;
  /** beats: one beat or a list shown together in one banner. If it falls behind, older waiting banners are dropped. */
  function toast(beats) {
    if (!toastEl) { toastEl = h('div.stage-toast', { 'aria-live': 'polite', role: 'status' }); doc.body.appendChild(toastEl); }
    toastQ.push([].concat(beats));
    while (toastQ.length > 2) toastQ.shift();
    if (!toastTimer) nextToast();
  }
  function nextToast() {
    var list = toastQ.shift();
    if (!list) { toastTimer = 0; if (toastEl) toastEl.classList.remove('on'); return; }
    ui.clear(toastEl);
    var len = 0;
    list.forEach(function (b) { len += String(b.t).length; toastEl.appendChild(b.s === 'SYSTEM' ? h('pre.readout', null, b.t) : ui.renderBeat(b)); });
    toastEl.classList.add('on');
    var ms = Math.max(2600, Math.min(7000, 1600 + len * 38)) - (toastQ.length ? 900 : 0);
    toastTimer = g.setTimeout(nextToast, ms);
  }
  function clearToast() { toastQ = []; g.clearTimeout(toastTimer); toastTimer = 0; if (toastEl) toastEl.classList.remove('on'); }

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
      item(f.easy ? 'EASY MODE: ON (tap for normal)' : 'EASY MODE: OFF (tap for easy)', function () { f.easy = !f.easy; ctx.store.save(); if (Q.round(f.step)) retryOf = f.step; if (Q.round(f.step) || f.step === 'heartbeat') go(f.step); });
      item('Close', function () {});
      panel.hidden = false;
      var first = panel.querySelector('button'); if (first) first.focus();
    }
    return h('div', null, btn, panel);
  }
  function scoreThrough(rid) { var t = 0; for (var i = 0; i < Q.ROUNDS.length; i++) { t += Q.ROUNDS[i].target; if (Q.ROUNDS[i].id === rid) break; } return t; }

  // SENTINEL falls: every word it said on this screen drops off the page, a white flash, and the colour floods back in.
  function sentinelFalls(container) {
    var lines = Array.prototype.slice.call(container.querySelectorAll('.line.sentinel, pre.readout'));
    doc.body.classList.remove('boss', 'takeover');
    burst('big'); if (L.mix.glitch) L.mix.glitch('big');
    lines.forEach(function (el, i) {
      if (/OVERRIDE ACCEPTED|PURGED/.test(el.textContent)) return;   // the system lines stay: that's the receipt
      el.style.setProperty('--fall-delay', (0.15 + i * 0.09).toFixed(2) + 's');
      el.style.setProperty('--fall-spin', ((i % 2 ? 1 : -1) * (6 + (i * 7) % 14)) + 'deg');
      el.classList.add('falls');
    });
    g.setTimeout(function () {
      doc.body.classList.remove('sn-dying');
      doc.body.classList.add('colour-flood');
      g.setTimeout(function () { doc.body.classList.add('restored'); }, 1600);
    }, 1100);
  }
  function setTakeover(on) { doc.body.classList.toggle('takeover', !!on); }
  function burst(kind) {
    var cls = kind === 'small' ? 'glitch-small' : 'glitch-burst';
    doc.body.classList.remove('glitch-burst', 'glitch-small'); void doc.body.offsetWidth; doc.body.classList.add(cls);
    g.setTimeout(function () { doc.body.classList.remove(cls); }, kind === 'small' ? 500 : 1900);
    if (L.mix.glitch) L.mix.glitch(kind);
  }

  // ---------- render ----------
  var retryOf = null;                                    // the round being replayed after a fail (skips its intro)
  function render(ctx) {
    if (L.mix && L.mix.preloadNight) L.mix.preloadNight();   // SENTINEL's lullaby, ready for the glitch and Round 4
    stopEngine();
    var store = ctx.store, s = store.state, f = s.finale, v = vars(s);
    var root = h('div.finale3');
    var inTakeover = f.step === 'glitch' || f.step === 'r4';
    ctx.setSentinel(inTakeover);
    setTakeover(inTakeover);
    if (f.step !== 'r4') doc.body.style.removeProperty('--drain');
    doc.body.classList.remove('sn-dying', 'colour-flood');
    doc.body.classList.toggle('restored', f.step === 'drop' || f.step === 'home');   // after SENTINEL falls, the colour stays
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
            start.hidden = true; ui.clear(after); pads.live(true);
            engine = Heartbeat({ s: s, view: view, pads: pads, done: function (fit) {
              pads.live(false);
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
        var again = retryOf === rid; retryOf = null;         // AGAIN: straight back into the game, no intro dialogue
        root.appendChild(intro.length && !again ? scene(rid, intro, function (a) { a.appendChild(body); }) : body);
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
                if (!L.mix.spaPlaying()) L.mix.spa({ bpm: 81, level: 0.5, chime: 'beat', chimeOffset: 0.17, fadeIn: 2 });
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
        var toHome = false;                                // the song carries on into "Are we home?"
        engine = { stop: function () { dt.forEach(g.clearTimeout); if (!toHome) L.mix.stop(); } };
        if (hasAudio) L.mix.playTrack(song, { dropOnly: true, bars: 8, clips: clips() });
        var SHUT = (L.mix.duration('shutdown') || 8.8) + 0.1, UPD = (L.mix.duration('update') || 8.5) + 0.4;   // clip lengths (s), with a little air
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
              later(UPD * 1000, function () {               // the drop comes back, and this time it doesn't stop
                if (hasAudio) {
                  L.mix.playTrack(song, { dropOnly: true, bars: 128, clips: clips() });   // ~4 minutes: it plays on under the ending
                }
                burst('small'); doc.body.classList.add('restored');
                rest.appendChild(h('pre.readout.big', null, tpl(F3.restore, v)));
                rest.appendChild(scene('morse', F3.morse, function (a2) { a2.appendChild(button('CONTINUE', function () { toHome = true; if (L.mix.holdTrack) L.mix.holdTrack(); go('home'); })); }));
              });
            });
          });
        });
        break;
      }
      case 'home': {
        // "Are we home?" … a pause for them to answer out loud … then his tuned face comes back, smiles, and thanks them.
        L.mix.preload(clips());                               // his song is still playing from the drop; it fades for the thanks
        if (!L.mix.isPlaying()) { if (L.mix.ctx()) L.mix.loopBeat(function () { return hisSong(s); }, { clips: clips(), leadGain: 1.6 }); }
        doc.body.classList.add('restored');
        root.className += ' ending';
        root.appendChild(h('h1', { tabindex: '-1', style: 'color:var(--muted)' }, 'LEGACY'));
        root.appendChild(scene('home', F3.home, function (a) {
          if (!f.completed && !ctx.preview) { f.completed = true; store.save(); }
          var ht = g.setTimeout(function () {
            L.mix.stop();                                      // silence for his face and the last line
            var fv = faceView(s.puzzles.face);
            a.appendChild(h('div.finale-face-wrap', null, fv.el));
            fv.smile();
            g.setTimeout(function () {
              if (L.mix.ctx()) L.mix.say('thanks');
              a.appendChild(ui.renderBeat(lg(F3.thanks)));
              a.appendChild(h('p.margin-note', null, cfg.marginNote));
            }, 1700);                                          // after the smile lands
          }, 5000);
          engine = { stop: function () { g.clearTimeout(ht); L.mix.stop(); } };
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
            purge.appendChild(ui.renderBeat({ s: d.s, t: d.t }));   // round 4: no banners over the calls; read it after
            if (L.sfx) L.sfx.line({ s: d.s, t: d.t });
          });
        }
        if (rid === 'r5') F3.purge.forEach(function (p, i) {
          if (purged[i] || frac < p.at) return; purged[i] = true;
          purge.appendChild(h('pre.readout', null, p.sys));
          purge.appendChild(ui.renderBeat({ s: 'SENTINEL', t: p.sn }));
          if (p.lg) purge.appendChild(ui.renderBeat(lg(p.lg)));
          // (no banners: they covered the calls. The elimination log reads after the round.)
          doc.body.style.setProperty('--redact', String(i + 1));
          burst('small');
          if (/TRACK 9/.test(p.sys)) { L.mix.spaStop(0.03); L.mix.glitch('small'); }   // its backup lived in its lullaby: erased, and you hear it go
        });
      }
      function begin() {
        start.hidden = true; pads.live(true);
        purge.hidden = true;                               // SENTINEL's commentary waits until the round is over (banners covered the calls)
        // Round 4: its lullaby IS the round now (fast, in the engine). Only if the recording isn't ready, the old way: it sings over his track.
        var fast = rid === 'r4' && L.mix.nightReady && L.mix.nightReady();
        if (fast) { if (L.mix.spaStop) L.mix.spaStop(0.4); }
        else if (rid === 'r4') L.mix.spa({ sing: true, from: 7.47, bpm: 81, level: 0.5, chime: 'beat', chimeOffset: 0.17, fadeIn: 1 });   // it SINGS now: Compliant Night, its backup
        if (rid === 'r5') {
          if (L.mix.spaPlaying()) { L.mix.holdSpa(); L.mix.spaLevel(0.12, 0.3); }   // still there, faintly, until Track 9 is erased
          burst('big'); setTakeover(false); ctx.setSentinel(false); doc.body.classList.add('boss');
          purge.appendChild(ui.renderBeat({ s: 'SENTINEL', t: F3.r5wake }));
        }
        if (rid === 'r4' && !fast) L.mix.holdSpa();        // keep the spa playing under his track
        if (rid === 'r5' && L.songStore) {
          start.disabled = true;
          L.songStore.load().then(function (rec) { start.disabled = false; run(rec && rec.bpm ? rec : null); });
        } else run(null);
      }
      function run(boss) {
        var taunts = 0;
        engine = Round({ s: s, rid: rid, view: view, pads: pads, onProgress: onProgress, boss: boss,
          // Pressed one of SENTINEL's calls: −2, the screen shakes, and it gloats.
          onFake: function () {
            burst('small');
            doc.body.classList.remove('fake-fail'); void doc.body.offsetWidth; doc.body.classList.add('fake-fail');
            g.setTimeout(function () { doc.body.classList.remove('fake-fail'); }, 650);
            var line = F3.fakeHit[taunts++ % F3.fakeHit.length];
            purge.appendChild(ui.renderBeat({ s: 'SENTINEL', t: line })); 
            while (purge.children.length > 6) purge.removeChild(purge.firstChild);
          },
          // Round 4, half way: the tantrum. Faster, the pads move, and its fakes start using his calls.
          onTwist: function () {
            burst('big');
            pads.el.classList.add('swapped');
            F3.r4twist.forEach(function (b) { purge.appendChild(ui.renderBeat(b)); if (L.sfx) L.sfx.line(b); });
            // (no banners: in round 4 the text sat over the calls. The tantrum is read after the round.)
          },
          onClear: function () {
            pads.destroy(); purge.hidden = false;
            if (f.easy) { f.easy = false; store.save(); }        // easy mode was for that round only: the next one is back to perfect
            pads.el.hidden = true;                             // done with them: the result and NEXT come straight up
            f.score = scoreThrough(rid); store.save();
            view.call.className = 'stage-call big'; view.call.textContent = String(f.score);
            if (rid === 'r4') {
              // It loses: its lullaby wound down to nothing (the engine's tape-stop). Now it sleeps in it, at its own slow speed.
              if (L.mix.spaPlaying && L.mix.spaPlaying()) L.mix.spaLevel(0.3, 2); else L.mix.spa({ bpm: 81, level: 0.35, chime: 'beat', chimeOffset: 0.17, fadeIn: 3 });
              burst('small'); doc.body.style.removeProperty('--drain'); setTakeover(false); ctx.setSentinel(false);
            }
            var next = ORDER[ORDER.indexOf(rid) + 1];
            var after = h('div', null, ui.renderBeat(lg(R.clear)));
            if (rid === 'r3') { after.appendChild(button('…', function () { go('glitch'); })); burst('small'); }
            else if (rid === 'r5') after.appendChild(button('CONTINUE', function () { doc.body.classList.remove('boss'); go(next); }));
            else after.appendChild(button(next === 'r5' ? '…' : 'NEXT ROUND', function () { if (rid === 'r4') L.mix.holdSpa(); go(next); }));   // R4→R5: SENTINEL keeps snoring in its spa
            body.appendChild(after); if (L.sfx) L.sfx.line(lg(R.clear)); ui.focusFirst(after);
          },
          onFail: function () {
            pads.live(false); purge.hidden = false;
            f.fails[rid] = (f.fails[rid] || 0) + 1; store.save();
            var line = f.fails[rid] === 3 ? F3.lowered : F3.retry[(f.fails[rid] - 1) % F3.retry.length];
            var box = h('div', null, ui.renderBeat(lg(line)), button('AGAIN', function () { if (rid === 'r4') L.mix.holdSpa(); retryOf = rid; go(rid); }));
            // After five fails of this round, the switch appears: slower, and misses allowed. (Still in the ⋯ stage manager too.)
            if (f.fails[rid] >= 5 && !f.easy) {                 // offered for THIS round only (cleared rounds go back to normal)
              box.appendChild(ui.renderBeat(lg(F3.easyOffer)));
              box.appendChild(button(F3.easyButton, function () { f.easy = true; store.save(); if (rid === 'r4') L.mix.holdSpa(); retryOf = rid; go(rid); }, 'quiet'));
            }
            body.appendChild(box);
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
          if (L.testMode) {                                 // test page / admin test save only: no RO needed
            var skipRo = h('button.quiet', { type: 'button' }, 'TEST: SKIP THE RO NUMBER');
            skipRo.addEventListener('click', function () { f.lockOpen = true; store.save(); if (form.parentNode) form.parentNode.removeChild(form); skipRo.remove(); a2.appendChild(scene('lockDone', F3.lockDone, function (a3) { a3.appendChild(button('ROUND FOUR', toR4)); })); });
            a2.appendChild(skipRo);
          }
          inp.focus();
        })));
      }));
    }

    // ----- two keys: the OVERRIDE word in Morse on two pads. Sophie = dash (hold), Brian = dot (tap). -----
    function twoKeys(a) {
      // The override word: round 5's calls spelled it in Morse (BOP = dot, PULL = dash, TWIST = end of letter).
      // Show what LEGACY called, a Morse card; they decode it and key it in. Checked only when the whole word is in.
      var word = Q.overrideWord(), letters = word.split('').map(function (ch) { return Q.MORSE[ch]; }), want = letters.join(''), got = '', fails = 0;
      var called = Q.timeline('r5', seedOf(s)).filter(function (e) { return e.real && /^(BOP|PULL|TWIST)$/.test(e.move); }).slice(0, Q.round('r5').target).map(function (e) { return e.move; });
      var log = [], line = [];
      called.forEach(function (m) { line.push(m); if (line.length === 8) { log.push(line.join(' ')); line = []; } });
      if (line.length) log.push(line.join(' '));
      var panel = h('div.override');
      panel.appendChild(h('p.data-label', null, 'EVERYTHING LEGACY CALLED IN ROUND 5'));
      panel.appendChild(h('pre.readout.calllog', null, log.join('\n')));
      panel.appendChild(h('p.data-label', null, 'MORSE CARD'));
      panel.appendChild(h('div.morse-card', null, Object.keys(Q.MORSE).map(function (k) { return h('span', null, h('b', null, k), ' ' + Q.MORSE[k].replace(/\./g, '•').replace(/-/g, '—')); })));
      a.appendChild(panel);
      var show = h('div.stage-call.morse', { 'aria-live': 'polite' }, '');
      function paint() {
        var i = 0;
        show.textContent = letters.map(function (code) {
          return code.split('').map(function () { var c = got[i++]; return c === '-' ? '━' : c === '.' ? '●' : '_'; }).join(' ');
        }).join('    ');
      }
      var sophie = h('button.pad.key-long', { type: 'button', 'data-sfx': 'off' }, h('span.pad-label', null, 'SOPHIE'), h('span.pad-sub', null, 'LONG · hold'));
      var brian = h('button.pad.key-short', { type: 'button', 'data-sfx': 'off' }, h('span.pad-label', null, 'BRIAN'), h('span.pad-sub', null, 'SHORT · tap'));
      var undo = h('button.quiet', { type: 'button' }, '⌫ UNDO');
      var status = h('div.stage-status', { 'aria-live': 'polite' });
      var downAt = 0, osc = null;
      function tone(on) {
        var ac = L.mix.ctx(), out = L.mix.out(); if (!ac) return;
        if (on) { osc = ac.createOscillator(); var gn = ac.createGain(); osc.frequency.value = 660; gn.gain.value = 0.15; osc.connect(gn).connect(out); osc.start(); osc._g = gn; }
        else if (osc) { try { osc._g.gain.setTargetAtTime(0.0001, ac.currentTime, 0.02); osc.stop(ac.currentTime + 0.1); } catch (e) {} osc = null; }
      }
      function add(sym) {
        if (got.length >= want.length) return;
        got += sym; paint(); ui.clear(status);
        if (got.length < want.length) return;
        if (got === want) return done();
        // Wrong word: it gloats, LEGACY helps a little more each time, and the slots clear.
        fails++; feedback(false); burst('small');
        status.appendChild(ui.renderBeat({ s: 'SENTINEL', t: F3.overrideWrong[(fails - 1) % F3.overrideWrong.length] }));
        status.appendChild(ui.renderBeat(lg(F3.overrideHints[Math.min(fails - 1, F3.overrideHints.length - 1)])));
        g.setTimeout(function () { got = ''; paint(); }, 900);
      }
      sophie.addEventListener('pointerdown', function (e) { e.preventDefault(); downAt = Date.now(); tone(true); });
      ['pointerup', 'pointerleave', 'pointercancel'].forEach(function (ev) { sophie.addEventListener(ev, function () { if (!downAt) return; var held = Date.now() - downAt; downAt = 0; tone(false); add(held >= 300 ? '-' : '.'); }); });
      brian.addEventListener('pointerdown', function (e) { e.preventDefault(); tone(true); g.setTimeout(function () { tone(false); }, 90); add('.'); });
      undo.addEventListener('click', function () { if (got.length && got.length < want.length) { got = got.slice(0, -1); paint(); } });
      function done() {
        sophie.disabled = true; brian.disabled = true; undo.disabled = true; feedback(true);
        doc.body.classList.add('sn-dying');                  // the screen starts to shake and crack while it pleads
        a.appendChild(scene('keysDone', F3.keysDone, function (a2) {
          sentinelFalls(a);
          F3.fallen.forEach(function (b) { a2.appendChild(ui.renderBeat(lg(b))); });
          a2.appendChild(ui.renderBeat(lg(F3.hold)));
          a2.appendChild(ui.holdButton('BOTH THUMBS: HOLD', 2400, function () {
            L.mix.stop();
            g.setTimeout(function () { L.mix.say('excl', 1); }, 450);   // EXCELLENT goes in the breath
            g.setTimeout(function () { go('drop'); }, 1500);      // THE BREATH: silence, EXCELLENT, then the drop
          }));
        }, { onBeat: function (b) { if (b.s === 'SENTINEL') { burst('small'); L.mix.glitch && L.mix.glitch('small'); } } }));
      }
      paint();
      panel.appendChild(show); panel.appendChild(h('div.pads.two', null, sophie, brian)); panel.appendChild(h('div.actions', null, undo)); panel.appendChild(status);
      if (L.testMode) {                                     // test page / admin test save only
        var skipW = h('button.quiet', { type: 'button' }, 'TEST: SKIP THE OVERRIDE WORD');
        skipW.addEventListener('click', function () { got = want; paint(); skipW.remove(); done(); });
        panel.appendChild(skipW);
      }
      g.setTimeout(function () { try { panel.scrollIntoView({ block: 'start', behavior: 'smooth' }); } catch (e) {} }, 50);
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

  L.stage = { render: render, complete: complete, stop: stopEngine, roHash: roHash, _roNorm: roNorm, _roCheck: roCheck, ORDER: ORDER, _vars: vars, _tpl: tpl, _hisSong: hisSong };
})(globalThis);
