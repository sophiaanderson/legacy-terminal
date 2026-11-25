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
/* PROJECT LEGACY — Saturday's sound engine: a live step sequencer + LEGACY's track.
 * Everything is synthesized with Web Audio except LEGACY's voice clips. No visuals (the Saturday glitch adds static bursts via glitch()).
 * Also SENTINEL's spa music (spa / spaStop / spaLevel), used by the Saturday stir and the finale takeover.
 * The song is read fresh on every step, so edits are heard immediately while looping.
 *
 * Musically: 124 BPM, A minor. Bass riff and lead are both in A minor pentatonic, so any lead
 * the player writes sits on top of the bass. Build = 4 bars: riser + snare roll that doubles
 * each bar (quarters → eighths → sixteenths → 32nds) + a low-pass filter opening up to the FILTER
 * setting. The breath = the last half-bar of the build is silent. Drop opens on an impact. */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});

  var BPM = 124;                    // default; the song's own tempo (song.bpm) wins
  var STEP = 60 / BPM / 2;          // 8 steps per bar (eighth notes); recomputed per step from song.bpm
  var BAR = STEP * 8;
  function stepFor(song) { var b = Math.max(70, Math.min(170, (song && song.bpm) || BPM)); return 60 / b / 2; }
  var A1 = 55;
  var BASS_NOTES = [0, 0, 7, 0, 3, 0, 7, 10];        // A minor riff: A A E A C A E G
  // In the Suno mashup his bass follows HER chords: the root of each bar (mix.suno.roots), with octave jumps in place
  // of the riff's passing notes (E/C/G clash with her pedal and her F/D/E changes). His rhythm, her harmony.
  var MASH_BASS = [0, 0, 12, 0, 0, 0, 12, 0];
  var LEAD_SEMIS = [null, 12, 15, 17, 19, 22];       // lead steps 1..5 = A C D E G (an octave up from the bass)

  var songSrc = null;
  var ac = null, master = null, comp = null, beatBus = null, filt = null, timer = 0, nb = null, playing = false, mode = null;
  var buffers = {}, htmlClips = {};
  var listeners = null;

  function filterHz(k) { return 260 * Math.pow(18000 / 260, Math.max(0, Math.min(10, k)) / 10); }

  function buildBuses() {
    master = ac.createGain(); master.gain.value = 1.0; master.connect(comp);
    filt = ac.createBiquadFilter(); filt.type = 'lowpass'; filt.Q.value = 6; filt.frequency.value = 18000; filt.connect(master);
    beatBus = ac.createGain(); beatBus.gain.value = 1.0; beatBus.connect(filt);
  }
  function ensure() {
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return false;
    if (!ac) {
      ac = new AC();
      comp = ac.createDynamicsCompressor();
      comp.threshold.value = -14; comp.ratio.value = 4;
      comp.connect(ac.destination);
      buildBuses();
      nb = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
      var d = nb.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    }
    if (ac.state === 'suspended' && ac.resume) ac.resume();
    return true;
  }

  function loadClip(name, url) {
    if (!url || buffers[name] || htmlClips[name]) return;
    var fallback = function () { var a = new g.Audio(); a.preload = 'auto'; a.src = url; htmlClips[name] = a; };
    try {
      g.fetch(url).then(function (r) { if (!r.ok) throw new Error('http'); return r.arrayBuffer(); })
        .then(function (ab) { return new Promise(function (res, rej) { ac.decodeAudioData(ab, res, rej); }); })
        .then(function (buf) { buffers[name] = buf; })
        .catch(fallback);
    } catch (e) { fallback(); }
  }
  function preload(clips) { if (!ensure()) return; Object.keys(clips || {}).forEach(function (k) { loadClip(k, clips[k]); }); }

  // ---------- instruments (all into the beat bus, which runs through the filter) ----------
  function kick(t) {
    var o = ac.createOscillator(), gn = ac.createGain();
    o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.11);
    gn.gain.setValueAtTime(1.0, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.4);
    o.connect(gn).connect(beatBus); o.start(t); o.stop(t + 0.45);
  }
  function noiseHit(t, type, freq, q, vol, dur, dest) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = nb; f.type = type; f.frequency.value = freq; if (q) f.Q.value = q;
    gn.gain.setValueAtTime(vol, t); gn.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f).connect(gn).connect(dest || beatBus); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.02);
  }
  function clap(t) { noiseHit(t, 'bandpass', 1500, 1.2, 0.7, 0.05); noiseHit(t + 0.012, 'bandpass', 1500, 1.2, 0.6, 0.05); noiseHit(t + 0.025, 'bandpass', 1300, 1, 0.55, 0.18); }
  function snare(t, vol) { noiseHit(t, 'bandpass', 1900, 0.8, vol, 0.09); var o = ac.createOscillator(), gn = ac.createGain(); o.frequency.value = 190; gn.gain.setValueAtTime(vol * 0.5, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 0.07); o.connect(gn).connect(beatBus); o.start(t); o.stop(t + 0.08); }
  function hat(t) { noiseHit(t, 'highpass', 8000, 0, 0.22, 0.05); }
  function bass(t, step, oct, root) {   // oct: optional octaves up (the finale's PULL uses 2). root: semitones from A (mashup)
    var o = ac.createOscillator(), f = ac.createBiquadFilter(), gn = ac.createGain();
    var semi = root == null ? BASS_NOTES[step % 8] : root + MASH_BASS[step % 8];
    o.type = 'sawtooth'; o.frequency.value = A1 * Math.pow(2, semi / 12 + (oct || 0));
    f.type = 'lowpass'; f.frequency.setValueAtTime(1200, t); f.frequency.exponentialRampToValueAtTime(220, t + STEP * 0.9);
    gn.gain.setValueAtTime(0.38, t); gn.gain.exponentialRampToValueAtTime(0.001, t + STEP * 0.95);
    o.connect(f).connect(gn).connect(beatBus); o.start(t); o.stop(t + STEP);
  }
  function lead(t, n) {
    var semi = LEAD_SEMIS[n]; if (semi == null) return;
    var freq = A1 * 4 * Math.pow(2, (semi - 12) / 12);   // A3 and up
    var f = ac.createBiquadFilter(), gn = ac.createGain();
    f.type = 'lowpass'; f.Q.value = 4; f.frequency.setValueAtTime(4200, t); f.frequency.exponentialRampToValueAtTime(700, t + STEP * 1.6);
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(0.16, t + 0.01); gn.gain.exponentialRampToValueAtTime(0.001, t + STEP * 1.7);
    f.connect(gn).connect(beatBus);
    [-7, 0, 7].forEach(function (cents) {           // a little supersaw: three detuned saws
      var o = ac.createOscillator(); o.type = 'sawtooth'; o.frequency.value = freq; o.detune.value = cents;
      o.connect(f); o.start(t); o.stop(t + STEP * 1.8);
    });
  }
  /** A louder copy of one of the track's own instruments, straight to the master (past the filter): the finale's
   *  Bop It calls and hits. name: 'kick'|'clap'|'hat'|'snare'|'bass'|'lead'. n = lead note (1..5) or bass step. */
  function accent(name, t, vol, n) {
    if (!ensure()) return;
    var save = beatBus, gn = ac.createGain();
    gn.gain.value = vol == null ? 1.6 : vol; gn.connect(master);
    beatBus = gn;                                        // the instruments write to beatBus synchronously
    try {
      if (name === 'kick') kick(t); else if (name === 'clap') clap(t); else if (name === 'hat') hat(t);
      else if (name === 'snare') snare(t, 0.6); else if (name === 'bass') bass(t, n || 0); else if (name === 'bassHi') bass(t, 0, 2); else if (name === 'lead') lead(t, n || 3);
    } finally { beatBus = save; }
    g.setTimeout(function () { try { gn.disconnect(); } catch (e) {} }, Math.max(0, (t - ac.currentTime) * 1000) + 1500);
  }
  function riser(t, dur) {
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = nb; s.loop = true; f.type = 'bandpass'; f.Q.value = 3;
    f.frequency.setValueAtTime(300, t); f.frequency.exponentialRampToValueAtTime(9000, t + dur);
    gn.gain.setValueAtTime(0.02, t); gn.gain.exponentialRampToValueAtTime(0.32, t + dur * 0.98); gn.gain.setValueAtTime(0.0001, t + dur);
    s.connect(f).connect(gn).connect(master); s.start(t); s.stop(t + dur + 0.05);   // riser bypasses the filter so it's always heard
    var o = ac.createOscillator(), g2 = ac.createGain();
    o.type = 'sawtooth'; o.frequency.setValueAtTime(110, t); o.frequency.exponentialRampToValueAtTime(880, t + dur);
    g2.gain.setValueAtTime(0.0001, t); g2.gain.exponentialRampToValueAtTime(0.06, t + dur * 0.98); g2.gain.setValueAtTime(0.0001, t + dur);
    o.connect(g2).connect(master); o.start(t); o.stop(t + dur + 0.05);
  }
  function impact(t) {
    var o = ac.createOscillator(), gn = ac.createGain();
    o.frequency.setValueAtTime(90, t); o.frequency.exponentialRampToValueAtTime(30, t + 1.2);
    gn.gain.setValueAtTime(0.9, t); gn.gain.exponentialRampToValueAtTime(0.001, t + 1.5);
    o.connect(gn).connect(master); o.start(t); o.stop(t + 1.6);
    noiseHit(t, 'lowpass', 2000, 0, 0.5, 0.8, master);
  }
  function duck(t, dur) {
    try { beatBus.gain.setTargetAtTime(0.22, t, 0.08); beatBus.gain.setTargetAtTime(1.0, t + dur + 0.1, 0.4); } catch (e) { /* ignore */ }
  }
  /** Voice clip at time t. maxDur trims it (chops). Story clips duck the beat. */
  function voice(name, t, maxDur, vol, rate) {
    rate = rate || 1;
    if (buffers[name]) {
      var s = ac.createBufferSource(), gn = ac.createGain();
      s.buffer = buffers[name]; gn.gain.value = vol || 1.6; s.playbackRate.value = rate;
      s.connect(gn).connect(master);
      var dur = maxDur ? Math.min(maxDur, buffers[name].duration) : buffers[name].duration;
      s.start(t, 0, dur);
      if (!maxDur) duck(t, dur);
      return;
    }
    var a = htmlClips[name];
    if (!a) return;
    if (!maxDur) duck(t, a.duration && isFinite(a.duration) ? a.duration : 7);
    g.setTimeout(function () { try { a.currentTime = 0; a.playbackRate = rate; var p = a.play(); if (p && p.catch) p.catch(function () {}); if (maxDur) g.setTimeout(function () { a.pause(); }, maxDur * 1000); } catch (e) {} }, Math.max(0, (t - ac.currentTime) * 1000));
  }

  /** A line of LEGACY's song. The previous line's reverb tail fades as this one starts, so lines stay tight. */
  var lastSong = null;
  function songVoice(name, t, inDrop) {
    if (lastSong) { try { lastSong.gain.setTargetAtTime(0, t, 0.04); } catch (e) { /* ignore */ } lastSong = null; }
    if (!buffers[name]) { voice(name, t, 30, 1.8); return; }   // not decoded yet: plain clip (a maxDur also means no duck)
    var s = ac.createBufferSource(), gn = ac.createGain();
    s.buffer = buffers[name]; gn.gain.value = 1.8; s.connect(gn).connect(master); s.start(t);
    lastSong = gn;                          // no ducking: her voice sits on top of his track at full volume
  }

  // ---------- scheduling ----------
  // Each bar: { section, parts, song, riser, impact, story, storyIndex, buildBar (0-3 or -1), dropBar (-1 or n), loop }
  function schedule(planFn, t0) {
    var t = t0 || ac.currentTime + 0.12, bar = 0, step = 0;
    timer = g.setInterval(function () {
      if (!ac) return;
      var horizon = ac.currentTime + 0.2;
      while (t < horizon) {
        var b = planFn(bar);
        if (!b) {
          var endAt = t;
          g.clearInterval(timer); timer = 0;
          g.setTimeout(function () { var cb = listeners && listeners.onEnd; stop(); if (cb) cb(); }, Math.max(0, (endAt - ac.currentTime) * 1000 + 1200));
          return;
        }
        var song = b.song, pat = song.grid;
        STEP = stepFor(song); BAR = STEP * 8;
        if (step === 0) {
          // Filter: loop = the knob; intro open; build sweeps from muffled up to the knob; drop = the knob.
          try {
            if (b.loop) filt.frequency.setTargetAtTime(filterHz(song.filter), t, 0.05);
            else if (b.section === 'intro') filt.frequency.setValueAtTime(18000, t);
            else if (b.section === 'build') {
              if (b.buildBar === 0) { filt.frequency.setValueAtTime(420, t); filt.frequency.exponentialRampToValueAtTime(Math.max(430, filterHz(song.filter)), t + BAR * 4 - 0.01); }
            } else if (b.dropBar === 0) filt.frequency.setValueAtTime(filterHz(song.filter), t);
          } catch (e) { /* ignore */ }
          if (b.riser) riser(t, BAR * 4);
          if (b.impact) impact(t);
          if (listeners && listeners.onBar) (function (bb, at) { g.setTimeout(function () { if (playing && listeners && listeners.onBar) listeners.onBar(bb); }, Math.max(0, (at - ac.currentTime) * 1000)); })(b, t);
        }
        if (listeners && listeners.onStep) { try { listeners.onStep(t, step, bar, STEP); } catch (e) { /* ignore */ } }
        if (b.events) b.events.forEach(function (ev) { if (ev.step === step) songVoice(ev.name, t + 0.02, b.drop); });
        // The breath: last half-bar of the build is silence.
        var silent = b.section === 'build' && b.buildBar === 3 && song.breath && step >= 4;
        // EXCELLENT lands in the breath on BEAT 4 (step 7): the stressed syllable on a beat, "-cellent" as the pickup
        // into the drop, and beat 3 left silent so the breath is heard first. (In the loop it plays on its grid step: the one.)
        if (silent && pat.excellent && pat.excellent[step] === '1' && song.sections.drop.excellent) voice('excl', t, 0.9, 1.9, Math.max(0.85, Math.min(1.45, (song.bpm || BPM) / 110)));
        if (!silent) {
          var on = function (p) { return b.parts[p] && pat[p] && pat[p][step] === '1'; };
          if (on('kick')) kick(t);
          if (on('clap')) clap(t);
          if (on('hats')) hat(t);
          if (on('bass')) bass(t, step, 0, b.root);
          if (b.parts.lead && pat.lead && pat.lead[step] !== '0') lead(t, +pat.lead[step]);
          // Voice chops speed up with the tempo (and get a little chipmunky past ~140, which is the point).
          var vr = Math.max(0.85, Math.min(1.45, (song.bpm || BPM) / 110));
          if (on('legacy') && !b.story) voice(chopName(song), t, Math.min(0.95, STEP * 3 * vr), 1.7, vr);   // never longer than three steps
          // "excellent": every bar while looping. In the track it goes IN THE BREATH (below); with no breath, on the drop's one.
          // EXCELLENT (on its grid step, beat 4): every bar while looping; drop-only loop: last bar of the phrase (pickup
          // into the impact); in the track it plays in THE BREATH (below), or on the drop's first bar if he skipped the breath.
          if (on('excellent') && (b.loop || (b.sectionLoop && b.section === 'drop' ? b.dropBar === 3 : (b.dropBar === 0 && !song.breath)))) voice('excl', t, 0.8, 1.8, vr);
          // The song: his EXCELLENT gets its own bar (beat 4), and LEGACY answers it on the next line.
          if (b.excl && step === 6) voice('excl', t, 0.8, 1.8, vr);
          // Snare roll in the build: 2, 4, 8, 16 hits per bar, getting louder.
          if (b.section === 'build' && b.buildBar >= 0) {
            var per = [2, 4, 8, 16][b.buildBar], sub = per / 8, vol = 0.18 + 0.12 * b.buildBar;
            if (per <= 8) { if (step % (8 / per) === 0) snare(t, vol); }
            else for (var k = 0; k < sub; k++) snare(t + k * STEP / sub, vol);
          }
        }
        step++;
        t += STEP;
        if (step === 8) { step = 0; bar++; }
      }
    }, 40);
  }

  function chopName(song) { var k = 'chop_' + ((song && song.voice) || 'no'); return (buffers[k] || htmlClips[k]) ? k : 'chop'; }
  /** Clip map for every LEGACY-row voice (keys chop_<id>). */
  function voiceClips() { var o = {}, v = (L.config && L.config.audio && L.config.audio.voices) || {}; Object.keys(v).forEach(function (k) { o['chop_' + k] = v[k]; }); return o; }
  /** Preview one lead note (1..5) or a voice chop right now. */
  function note(n) { if (!ensure()) return; STEP = stepFor({ bpm: 124 }); lead(ac.currentTime + 0.02, n); }

  var ALL_ON = { kick: true, clap: true, hats: true, bass: true, legacy: true, excellent: true, lead: true };

  /** Loop one bar forever, reading the song fresh each step. getSong() -> { grid, filter, ... } */
  function loopBeat(getSong, opts) {
    stop();
    if (!ensure()) { if (opts && opts.onError) opts.onError(); return false; }
    preload(opts && opts.clips);
    playing = true; mode = 'loop'; listeners = opts || {};
    var parts = (opts && opts.parts) || ALL_ON;
    schedule(function () { return { loop: true, section: 'loop', parts: typeof parts === 'function' ? parts() : parts, song: getSong(), buildBar: -1, dropBar: -1 }; });
    return true;
  }

  /** Loop ONE section (intro / build / drop), reading the song fresh every bar so edits are heard live.
   *  Build = its 4 bars (riser, snare roll, filter sweep, the breath); drop = 4-bar phrases with the impact on bar 1. */
  function loopSection(getSong, sec, opts) {
    stop();
    if (!ensure()) { if (opts && opts.onError) opts.onError(); return false; }
    preload(opts && opts.clips);
    playing = true; mode = 'section:' + sec; listeners = opts || {};
    schedule(function (n) {
      var song = getSong(), i = n % 4;
      if (sec === 'build') return { section: 'build', parts: song.sections.build, song: song, riser: i === 0, buildBar: i, dropBar: -1, sectionLoop: true };
      if (sec === 'drop') return { section: 'drop', parts: song.sections.drop, song: song, impact: i === 0, buildBar: -1, dropBar: i, sectionLoop: true };
      return { section: 'intro', parts: song.sections.intro, song: song, buildBar: -1, dropBar: -1, sectionLoop: true };
    });
    return true;
  }

  /** Pure: LEGACY's hidden song laid over HIS track (no audio needed, so it's testable).
   *  sections: [{ part: 'intro' | 'build' | 'drop', bars: [lineId, ...] }]. Spoken verses ride his intro groove,
   *  each build is his 4-bar build with no words (riser, snare roll, filter sweep, the breath + his EXCELLENT),
   *  each drop hits with a chant. Lines start on the next free BEAT: never sped up, never pitch-shifted, never
   *  overlapping. lenOf(id) = seconds before the next line may start (her voice; the reverb tail is faded when the
   *  next line comes in). Every section rounds up to a multiple of 4 bars. His LEGACY-row chop is off throughout.
   *  Returns the list of bars; a bar's .events = [{ name, step, si, line }] to start inside it. */
  function songTimeline(song, sections, lenOf) {
    var stepSec = 60 / Math.max(70, Math.min(170, song.bpm || BPM)) / 2, bars = [];
    function noVoice(p) { var o = {}; Object.keys(p).forEach(function (k) { o[k] = p[k]; }); o.legacy = false; return o; }
    sections.forEach(function (sec, si) {
      if (sec.part === 'build') {
        for (var b = 0; b < 4; b++) bars.push({ section: 'build', parts: noVoice(song.sections.build), song: song, riser: b === 0, buildBar: b, dropBar: -1, storyIndex: -1 });
        return;
      }
      var drop = sec.part === 'drop', parts = noVoice(drop ? song.sections.drop : song.sections.intro);
      var cursor = drop ? 8 : (si === 0 ? 8 : 4), events = {};          // drops: let the impact land first
      (sec.bars || []).forEach(function (id) {
        var st = Math.ceil(cursor / 2) * 2, len = Math.max(2, Math.ceil(((lenOf(id) || 1.6) + 0.05) / stepSec));
        (events[Math.floor(st / 8)] = events[Math.floor(st / 8)] || []).push({ name: 'song:' + id, step: st % 8, si: si, line: id });
        cursor = st + len;
      });
      var n = Math.max(drop ? 8 : 4, Math.ceil((cursor + (drop ? 8 : 4)) / 8));
      n = Math.ceil(n / 4) * 4;
      for (var i = 0; i < n; i++) bars.push({ section: drop ? 'drop' : 'intro', parts: parts, song: song, impact: drop && i === 0,
        buildBar: -1, dropBar: drop ? i : -1, storyIndex: sec.bars ? si : -1, events: events[i] || null, drop: drop });
    });
    return bars;
  }

  /** Pure: his track laid over Suno's structure (see content mix.suno). Returns the list of bars.
   *  His LEGACY row and EXCELLENT stay silent: the words are hers. Builds are his 4-bar builds (riser, snare roll,
   *  filter sweep, the breath). Drops marked with impact hit on their first bar. */
  function mashupBars(song, suno, endBar) {
    var bars = [];
    function quietVoices(p) { var o = {}; Object.keys(p).forEach(function (k) { o[k] = p[k]; }); o.legacy = false; o.excellent = false; return o; }
    for (var n = 0; n < endBar; n++) {
      var k = 0; while (k + 1 < suno.map.length && suno.map[k + 1][0] <= n) k++;
      var m = suno.map[k], sec = m[1], i = n - m[0];
      var r = 0; (suno.roots || []).forEach(function (x) { if (x[0] <= n) r = x[1]; });
      bars.push({ section: sec, parts: quietVoices(song.sections[sec]), song: song, n: n, root: r, riser: sec === 'build' && i === 0,
        buildBar: sec === 'build' ? i : -1, dropBar: sec === 'drop' ? (m[2] ? i : i + 1) : -1, impact: sec === 'drop' && !!m[2] && i === 0 });
    }
    return bars;
  }

  /** Sunday's mix: Suno's vocal + backing (lows cut: bass swap) beat-matched over his track at 126 BPM, phrase-aligned.
   *  opts: { full (play past Sunday's end, after the finale), onBar, onEnd, onError }. Returns false if the
   *  recordings aren't decoded yet (the caller falls back to playTrack with the line clips). */
  function playMashup(song, suno, opts) {
    opts = opts || {};
    if (!ensure()) { if (opts.onError) opts.onError(); return false; }
    if (!buffers['suno:backing'] || !buffers['suno:vocal']) return false;
    stop();
    playing = true; mode = 'mashup'; listeners = opts;
    var bpm = suno.playBpm || suno.bpm, off = suno.playBar0 != null ? suno.playBar0 : suno.bar0;
    var s126 = JSON.parse(JSON.stringify(song)); s126.bpm = bpm;
    var endBar = opts.full ? suno.end : suno.sundayEnd, barSec = 240 / bpm;
    var bars = mashupBars(s126, suno, endBar), t0 = ac.currentTime + 0.25, tEnd = t0 + endBar * barSec;
    mashSources = [];
    [['suno:backing', 0.9, true], ['suno:vocal', 1.5, false]].forEach(function (c) {
      var src = ac.createBufferSource(), gn = ac.createGain(), node = src;
      src.buffer = buffers[c[0]];
      if (c[2]) { var hp = ac.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 170; hp.Q.value = 0.7; src.connect(hp); node = hp; }
      node.connect(gn).connect(master);
      gn.gain.setValueAtTime(c[1], t0); gn.gain.setValueAtTime(c[1], tEnd - 0.35); gn.gain.linearRampToValueAtTime(0.0001, tEnd);
      src.start(t0, off); src.stop(tEnd + 0.05);
      mashSources.push(src);
    });
    schedule(function (n) { return bars[n] || null; }, t0);
    return true;
  }
  var mashSources = [];

  function clipDur(name) {
    if (buffers[name]) return buffers[name].duration;
    var a = htmlClips[name]; return a && isFinite(a.duration) && a.duration > 0 ? a.duration : 0;
  }

  /** The whole track: 4 bars intro, 4 bars build, then the drop (8 bars).
   *  With opts.story (LEGACY's hidden song: [{ bars: [lineId | '>' | '>X', ...] }, ...]) the drop carries the song:
   *  two bars of his drop, then one line per free downbeat. A line clip ('song:' + id) that runs past a bar holds the
   *  next downbeat too, so lines never overlap or drift at any tempo, and are never sped up or pitch-shifted.
   *  '>'  = a bar for HIS voice chop (his LEGACY row, exactly as he programmed it).
   *  '>X' = his EXCELLENT, on beat 4 of that bar. Then two bars of his drop to finish.
   *  The drop is planned bar by bar while it plays: by then (16 bars in) every clip has loaded and its length is known. */
  function playTrack(song, opts) {
    stop();
    if (!ensure()) { if (opts && opts.onError) opts.onError(); return false; }
    preload(opts && opts.clips);
    playing = true; mode = 'track'; listeners = opts || {};
    var bars = [], i;
    if (opts && opts.dropOnly) {      // the finale: straight into the drop (impact + EXCELLENT on the one)
      for (i = 0; i < (opts.bars || 8); i++) bars.push({ section: 'drop', parts: song.sections.drop, song: song, impact: i === 0, buildBar: -1, dropBar: i });
      schedule(function (n) { return bars[n] || null; });
      return true;
    }
    for (i = 0; i < 4; i++) bars.push({ section: 'intro', parts: song.sections.intro, song: song, buildBar: -1, dropBar: -1 });
    for (i = 0; i < 4; i++) bars.push({ section: 'build', parts: song.sections.build, song: song, riser: i === 0, buildBar: i, dropBar: -1 });
    var story = (opts && opts.story) || [];
    if (story.length) {                // LEGACY's song: the whole arrangement replaces the plain intro/build/drop
      var lens = (opts && opts.lens) || {};
      var tl = songTimeline(song, story, function (id) { return lens[id] || clipDur('song:' + id); });
      schedule(function (n) { return tl[n] || null; });
    } else {
      for (i = 0; i < 8; i++) bars.push({ section: 'drop', parts: song.sections.drop, song: song, impact: i === 0, buildBar: -1, dropBar: i });
      schedule(function (n) { return bars[n] || null; });
    }
    return true;
  }

  /** The finale boss song: a decoded MP3 (ArrayBuffer) with a beat map. onStep fires for every eighth note
   *  on the audio clock, exactly like loopBeat, so the calls ride the real song. Resolves true/false. */
  function playBuffer(ab, opts) {
    stop();
    opts = opts || {};
    if (!ensure() || !ab) return Promise.resolve(false);
    return new Promise(function (res, rej) { ac.decodeAudioData(ab.slice(0), res, rej); }).then(function (buf) {
      playing = true; mode = 'song'; listeners = opts;
      var src = ac.createBufferSource(), gn = ac.createGain();
      src.buffer = buf; gn.gain.value = opts.level || 1; src.connect(gn).connect(master);
      var startAt = opts.startAt || 0, t0 = ac.currentTime + 0.15;
      src.start(t0, startAt); songSrc = src;
      src.onended = function () { if (songSrc === src && listeners && listeners.onEnd) listeners.onEnd(); };
      var st = 60 / (opts.bpm || 120) / 2, first = t0 + (opts.offset || 0) - startAt;
      var k = Math.max(0, Math.ceil((t0 - first) / st)), t = first + k * st, si = k % 8, bar = Math.floor(k / 8);
      timer = g.setInterval(function () {
        if (!ac || !playing) return;
        while (t < ac.currentTime + 0.2) {
          if (listeners && listeners.onStep) { try { listeners.onStep(t, si, bar, st); } catch (e) {} }
          si++; if (si === 8) { si = 0; bar++; } t += st;
        }
      }, 40);
      return true;
    }).catch(function () { return false; });
  }

  function stop() {
    playing = false; mode = null;
    if (songSrc) { try { songSrc.stop(); } catch (e) {} songSrc = null; }
    mashSources.forEach(function (x) { try { x.stop(); } catch (e) {} }); mashSources = []; lastSong = null;
    if (timer) g.clearInterval(timer);
    timer = 0;
    Object.keys(htmlClips).forEach(function (k) { try { htmlClips[k].pause(); } catch (e) {} });
    if (ac) { try { master.disconnect(); } catch (e) {} buildBuses(); }
    listeners = null;
    if (spaHold) spaHold = false; else if (spaState) spaStop(0.8);
    if (carolState) carolStop(0.6);
  }

  // ---------- the glitch: static bursts + a tape-stop whine (Saturday, when SENTINEL stirs) ----------
  function glitch(intensity) {
    if (!ensure()) return;
    if (ac.state === 'suspended') { try { ac.resume(); } catch (e) {} }
    var t = ac.currentTime + 0.02, n = intensity === 'small' ? 3 : 9;
    for (var i = 0; i < n; i++) {
      var at = t + i * (0.05 + Math.random() * 0.09);
      noiseHit(at, i % 2 ? 'highpass' : 'bandpass', 900 + Math.random() * 5000, 0.7, 0.55, 0.03 + Math.random() * 0.07, master);
    }
    var o = ac.createOscillator(), gn = ac.createGain(), end = t + (intensity === 'small' ? 0.35 : 0.9);
    o.type = 'square'; o.frequency.setValueAtTime(intensity === 'small' ? 600 : 1400, t); o.frequency.exponentialRampToValueAtTime(40, end);
    gn.gain.setValueAtTime(0.12, t); gn.gain.exponentialRampToValueAtTime(0.001, end);
    o.connect(gn).connect(master); o.start(t); o.stop(end + 0.05);
  }

  // ---------- SENTINEL's spa music: "Rainforest Serenity Vol. 4" ----------
  // Fully synthesized (no samples, so nothing to license, works offline). Warm major-7th pads in D,
  // a rain bed, the occasional bird, and a meditation chime. Runs on its own bus and timer, so it can
  // sit under LEGACY's dialogue (Saturday) or over his track (the finale takeover).
  // opts: { bpm (96), level (0..1, 0.55), chime: 'bar'|'beat'|'none', chimeOffset (sec, finale: off the grid), fadeIn (sec) }
  var spaState = null, spaHold = false;
  var SPA_CHORDS = [            // semitones above D3: Dmaj9, Bm9, Gmaj7(9), A6sus
    [0, 4, 7, 11, 16], [-3, 0, 4, 7, 11], [-7, -3, 0, 4, 9], [-5, 0, 2, 4, 7]
  ];
  var D3 = 146.83;
  var SPA_BELLS = [0, 2, 4, 7, 9, 12, 14, 16];   // D major pentatonic, two octaves up
  function makeVerb() {
    var len = Math.floor(ac.sampleRate * 3.2), ir = ac.createBuffer(2, len, ac.sampleRate);
    for (var c = 0; c < 2; c++) { var d = ir.getChannelData(c); for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 3.2); }
    var cv = ac.createConvolver(); cv.buffer = ir; return cv;
  }
  function spaPad(st, t, chord, dur) {
    chord.forEach(function (semi, n) {
      [-5, 5].forEach(function (cents) {
        var o = ac.createOscillator(), gn = ac.createGain();
        o.type = n === 0 ? 'triangle' : 'sine';
        o.frequency.value = D3 * Math.pow(2, semi / 12); o.detune.value = cents;
        gn.gain.setValueAtTime(0.0001, t);
        gn.gain.exponentialRampToValueAtTime(0.045, t + Math.min(1.8, dur * 0.4));
        gn.gain.setValueAtTime(0.045, t + dur - 0.2);
        gn.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1.8);
        o.connect(gn).connect(st.padBus); o.start(t); o.stop(t + dur + 1.9);
      });
    });
    // a soft sub on the root
    var sub = ac.createOscillator(), sg = ac.createGain();
    sub.frequency.value = D3 / 2 * Math.pow(2, chord[0] / 12);
    sg.gain.setValueAtTime(0.0001, t); sg.gain.exponentialRampToValueAtTime(0.07, t + 1.2); sg.gain.exponentialRampToValueAtTime(0.0001, t + dur + 1);
    sub.connect(sg).connect(st.padBus); sub.start(t); sub.stop(t + dur + 1.1);
  }
  function spaBell(st, t, semi, vol) {
    var f = D3 * 4 * Math.pow(2, semi / 12);
    [[1, 1], [2.76, 0.35], [5.4, 0.12]].forEach(function (p) {     // bell-ish inharmonic partials
      var o = ac.createOscillator(), gn = ac.createGain();
      o.frequency.value = f * p[0];
      gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol * p[1], t + 0.006);
      gn.gain.exponentialRampToValueAtTime(0.0001, t + 2.4 / p[0] + 0.3);
      o.connect(gn).connect(st.bellBus); o.start(t); o.stop(t + 2.8);
    });
  }
  function spaBird(st, t) {
    var o = ac.createOscillator(), gn = ac.createGain(), base = 2600 + Math.random() * 1800, n = 2 + Math.floor(Math.random() * 4);
    o.type = 'sine';
    gn.gain.setValueAtTime(0.0001, t);
    for (var i = 0; i < n; i++) {
      var at = t + i * 0.13;
      o.frequency.setValueAtTime(base, at); o.frequency.exponentialRampToValueAtTime(base * (1.3 + Math.random() * 0.4), at + 0.07);
      gn.gain.setValueAtTime(0.0001, at); gn.gain.exponentialRampToValueAtTime(0.03, at + 0.015); gn.gain.exponentialRampToValueAtTime(0.0001, at + 0.1);
    }
    o.connect(gn).connect(st.bellBus); o.start(t); o.stop(t + n * 0.13 + 0.1);
  }
  // "Silent Night" (Gruber, 1818: public domain), as written. 3/4, in D. Notes: [semitones above D, beats]. 24 bars.
  // Harmony per bar: I / IV / V.
  var SILENT_NIGHT = [[7,1.5],[9,.5],[7,1],[4,3],[7,1.5],[9,.5],[7,1],[4,3],[14,2],[14,1],[11,3],[12,2],[12,1],[7,3],
    [9,2],[9,1],[12,1.5],[11,.5],[9,1],[7,1.5],[9,.5],[7,1],[4,3],[9,2],[9,1],[12,1.5],[11,.5],[9,1],[7,1.5],[9,.5],[7,1],[4,3],
    [14,2],[14,1],[17,1.5],[14,.5],[11,1],[12,3],[16,3],[12,1.5],[7,.5],[4,1],[7,1.5],[5,.5],[2,1],[0,6]];
  // In D the melody's "C" is the leading-tone-free major scale: map C-major semitones onto D major (same intervals).
  var SN_I = [0, 4, 7, 11, 14], SN_IV = [-7, -3, 0, 4, 7], SN_V = [-5, -1, 2, 5, 9];
  var SN_HARM = [SN_I, SN_I, SN_I, SN_I, SN_V, SN_V, SN_I, SN_I, SN_IV, SN_IV, SN_I, SN_I, SN_IV, SN_IV, SN_I, SN_I,
    SN_V, SN_V, SN_I, SN_I, SN_I, SN_V, SN_I, SN_I];
  // Silent Night, as written: a soft music-box melody over simple I/IV/V chords, 3/4, looping. Background only
  // (Monday's carols step). Its own bus; stop() and carolStop() end it.
  var carolState = null;
  function carolNote(bus, t, f, dur, vol, type) {
    var o = ac.createOscillator(), gn = ac.createGain();
    o.type = type; o.frequency.value = f;
    gn.gain.setValueAtTime(0.0001, t); gn.gain.exponentialRampToValueAtTime(vol, t + 0.015);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(bus); o.start(t); o.stop(t + dur + 0.05);
  }
  function carol(opts) {
    if (!ensure()) return false;
    carolStop(0.1);
    opts = opts || {};
    var st = carolState = { timer: 0 }, now = ac.currentTime, beat = 60 / (opts.bpm || 84);
    st.out = ac.createGain(); st.out.connect(comp);
    st.out.gain.setValueAtTime(0.0001, now); st.out.gain.exponentialRampToValueAtTime(opts.level || 0.35, now + 1.5);
    var D4 = D3 * 2, idx = 0, tMel = now + 0.2, bar = 0, tBar = now + 0.2;
    st.timer = g.setInterval(function () {
      if (!ac || carolState !== st) return;
      var horizon = ac.currentTime + 0.4;
      while (tMel < horizon) {
        var n = SILENT_NIGHT[idx], f = D4 * Math.pow(2, n[0] / 12), d = n[1] * beat;
        carolNote(st.out, tMel, f, Math.max(0.5, d * 1.3), 0.16, 'triangle');
        carolNote(st.out, tMel, f * 2, Math.max(0.3, d * 0.8), 0.03, 'sine');      // a little shine
        tMel += d; idx++;
        if (idx >= SILENT_NIGHT.length) { idx = 0; tMel += beat * 3; }
      }
      while (tBar < horizon) {
        var pos = bar % 25, chord = pos === 24 ? null : SN_HARM[pos];
        if (chord) chord.slice(0, 3).forEach(function (semi) { carolNote(st.out, tBar, D3 * Math.pow(2, semi / 12), beat * 3 * 1.1, 0.045, 'sine'); });
        if (chord) carolNote(st.out, tBar, D3 / 2 * Math.pow(2, chord[0] / 12), beat * 2.5, 0.07, 'sine');   // bass on the one
        bar++; tBar += beat * 3;
      }
    }, 60);
    return true;
  }
  function carolStop(fade) {
    var st = carolState; if (!st) return;
    carolState = null; g.clearInterval(st.timer);
    var f = fade == null ? 1.2 : Math.max(0.02, fade), now = ac.currentTime;
    try { st.out.gain.cancelScheduledValues(now); st.out.gain.setValueAtTime(Math.max(0.0001, st.out.gain.value), now); st.out.gain.exponentialRampToValueAtTime(0.0001, now + f); } catch (e) {}
    g.setTimeout(function () { try { st.out.disconnect(); } catch (e) {} }, f * 1000 + 100);
  }

  // The real thing (11/24): "Compliant Night (Serenity Edit)", SENTINEL's lullaby. Its instrumental, looped, IS its sleep
  // music (audio/night/sleep-loop.m4a, 40 bars at 81 BPM, seam crossfaded). opts.sing plays the whole song once, with
  // SENTINEL singing (audio/night/song.m4a), from opts.from seconds. Falls back to the synthesized spa until decoded.
  function nightClips() { var a = (L.config && L.config.audio) || {}; return { 'night:loop': a.nightLoop, 'night:song': a.nightSong }; }
  function preloadNight() { if (ensure()) preload(nightClips()); }
  function spaRecorded(opts) {
    var buf = buffers[opts.sing ? 'night:song' : 'night:loop'];
    if (!buf) return false;
    var st = spaState = { recorded: true, src: ac.createBufferSource(), out: ac.createGain() }, now = ac.currentTime;
    st.out.connect(comp);
    var lvl = (opts.level == null ? 0.55 : opts.level) * 1.4;
    st.out.gain.setValueAtTime(0.0001, now); st.out.gain.exponentialRampToValueAtTime(lvl, now + (opts.fadeIn == null ? 2.5 : Math.max(0.05, opts.fadeIn)));
    st.src.buffer = buf; st.src.loop = !opts.sing; st.src.connect(st.out);
    st.src.onended = function () { if (spaState === st) spaState = null; };
    st.src.start(now, opts.sing ? (opts.from || 0) : 0);
    return true;
  }

  function spa(opts) {
    if (!ensure()) return false;
    if (spaState) spaStop(0.3);
    opts = opts || {};
    preloadNight();
    if (spaRecorded(opts)) return true;
    var st = spaState = { bpm: opts.bpm || 96, chime: opts.chime || 'bar', chimeOffset: opts.chimeOffset || 0, timer: 0, beat: 0 };
    st.out = ac.createGain(); st.out.connect(comp);
    var lvl = opts.level == null ? 0.55 : opts.level, now = ac.currentTime;
    st.out.gain.setValueAtTime(0.0001, now); st.out.gain.exponentialRampToValueAtTime(lvl, now + (opts.fadeIn == null ? 2.5 : Math.max(0.05, opts.fadeIn)));
    var verb = makeVerb(), wet = ac.createGain(); wet.gain.value = 0.55; verb.connect(wet).connect(st.out);
    var tone = ac.createBiquadFilter(); tone.type = 'lowpass'; tone.frequency.value = 1600; tone.connect(st.out); tone.connect(verb);
    st.padBus = ac.createGain(); st.padBus.connect(tone);
    // slow "breathing" swell on the pads
    var lfo = ac.createOscillator(), lg = ac.createGain(); lfo.frequency.value = 0.08; lg.gain.value = 0.25; st.padBus.gain.value = 0.85;
    lfo.connect(lg).connect(st.padBus.gain); lfo.start(now); st.lfo = lfo;
    st.bellBus = ac.createGain(); st.bellBus.gain.value = 0.8; st.bellBus.connect(st.out); st.bellBus.connect(verb);
    // rain: looped noise, band-passed, gently swelling
    var rain = ac.createBufferSource(), rf = ac.createBiquadFilter(), rg = ac.createGain();
    rain.buffer = nb; rain.loop = true; rf.type = 'bandpass'; rf.frequency.value = 3200; rf.Q.value = 0.6; rg.gain.value = 0.05;
    rain.connect(rf).connect(rg).connect(st.out); rain.start(now); st.rain = rain;
    var rl = ac.createOscillator(), rlg = ac.createGain(); rl.frequency.value = 0.05; rlg.gain.value = 0.02; rl.connect(rlg).connect(rg.gain); rl.start(now); st.rainLfo = rl;

    var beatDur = 60 / st.bpm, t = now + 0.1;
    st.timer = g.setInterval(function () {
      if (!ac || spaState !== st) return;
      while (t < ac.currentTime + 0.3) {
        var b = st.beat, barBeat = b % 4;
        if (b % 8 === 0) spaPad(st, t, SPA_CHORDS[(b / 8) % SPA_CHORDS.length], beatDur * 8);
        if (st.chime === 'beat' || (st.chime === 'bar' && barBeat === 0)) spaBell(st, t + st.chimeOffset, b % 16 === 0 ? 0 : 12, b % 16 === 0 ? 0.09 : 0.05);
        if (Math.random() < 0.35) spaBell(st, t + beatDur * (Math.random() < 0.5 ? 0.5 : 0), SPA_BELLS[Math.floor(Math.random() * SPA_BELLS.length)], 0.025 + Math.random() * 0.025);
        if (Math.random() < 0.12) spaBird(st, t + Math.random() * beatDur);
        st.beat++; t += beatDur;
      }
    }, 60);
    return true;
  }
  function spaStop(fade) {
    var st = spaState; if (!st) return;
    spaState = null;
    g.clearInterval(st.timer);
    var f = fade == null ? 1.5 : Math.max(0.02, fade), now = ac.currentTime;
    try { st.out.gain.cancelScheduledValues(now); st.out.gain.setValueAtTime(Math.max(0.0001, st.out.gain.value), now); st.out.gain.exponentialRampToValueAtTime(0.0001, now + f); } catch (e) {}
    g.setTimeout(function () { try { if (st.recorded) st.src.stop(); else { st.rain.stop(); st.lfo.stop(); st.rainLfo.stop(); } st.out.disconnect(); } catch (e) {} }, f * 1000 + 100);
  }
  function spaLevel(v, ramp) {
    if (!spaState) return;
    var now = ac.currentTime; try { spaState.out.gain.setTargetAtTime(Math.max(0.0001, v), now, (ramp || 0.5) / 3); } catch (e) {}
  }

  L.mix = { BPM: BPM, glitch: glitch, loopBeat: loopBeat, playTrack: playTrack, stop: stop, preload: preload,
            spa: spa, spaStop: spaStop, spaLevel: spaLevel, preloadNight: preloadNight,
            carol: carol, carolStop: carolStop, carolPlaying: function () { return !!carolState; },
            accent: accent,
            /** The shared AudioContext and its output (the finale's call sounds use the same clock). */
            ctx: function () { return ensure() ? ac : null; }, out: function () { return comp; },
            /** Play a loaded voice clip now (e.g. the "I said no." chop). */
            voiceClips: voiceClips, note: note, playBuffer: playBuffer, loopSection: loopSection,
            duration: clipDur, songTimeline: songTimeline, mashupBars: mashupBars, playMashup: playMashup,
            say: function (name, maxDur) { if (ensure()) voice(name, ac.currentTime + 0.02, maxDur || 0, 1.8); },
            spaPlaying: function () { return !!spaState; },
            /** Let the spa keep playing through the next stop() (e.g. a screen change that re-renders). */
            holdSpa: function () { spaHold = true; },
            isPlaying: function () { return playing; }, mode: function () { return mode; },
            loaded: function () { return { decoded: Object.keys(buffers), fallback: Object.keys(htmlClips) }; } };
})(globalThis);
