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
/* PROJECT LEGACY — finale call charts (pure, no DOM, no audio).
 * Built identically from (round, seed) on any device, so the stage and a future controller agree.
 *
 * Every real call is a Morse symbol: BOP = dot, PULL = dash, TWIST = letter gap.
 * Nobody tells him. The rounds spell HI · OH · US · ME · HOME, and the two-key ending spells NO.
 * Score targets 12 + 15 + 15 + 24 + 24 = 90 = 5Ah (the top half of 23,112 = 5A48h, his mileage in).
 *
 * A call: { move: 'BOP'|'TWIST'|'PULL'|'PASS'|'HIDE'|'REST', real: bool, big: true|false|null, fake: null|'COMPLY IT',
 *           whisper: bool (takeover: real calls are small), silent: bool (boss: no text, sound only), player: 0|1 } */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});

  var MORSE = {
    A: '.-', B: '-...', C: '-.-.', D: '-..', E: '.', F: '..-.', G: '--.', H: '....', I: '..', J: '.---', K: '-.-', L: '.-..', M: '--',
    N: '-.', O: '---', P: '.--.', Q: '--.-', R: '.-.', S: '...', T: '-', U: '..-', V: '...-', W: '.--', X: '-..-', Y: '-.--', Z: '--..'
  };

  var ROUNDS = [
    { id: 'r1', word: 'HI', target: 12, slack: 6, tempo: 'his' },
    { id: 'r2', word: 'OH', target: 15, slack: 6, tempo: '+8', sizes: true },
    { id: 'r3', word: 'US', target: 15, slack: 6, tempo: '+16', pass: true },
    { id: 'r4', word: 'ME', target: 24, slack: 16, tempo: 'spa', fakes: 0.4, whisper: true, sizes: true },   // slack: a fake press costs 2
    { id: 'r5', word: 'HOME', target: 24, slack: 8, tempo: 'boss', fakes: 0.22, sizes: true, hide: 9 }
  ];
  var FINAL_WORD = 'NO';
  // Holds come in rhythmic phrases, not coin flips (false = tap, true = HOLD). A HOLD takes a whole bar (js/stage.js),
  // so these read as "ta · TAAA · · · ta · ta" against the music. Every pattern starts tap, HOLD (to teach it).
  var SIZE_PATTERNS = {
    r2: [false, true, false, false],
    r4: [false, true, false, false, false, true],                 // sleepy: long gaps, then a long one
    r5: [false, true, false, true, false, false, true, true]       // driving: the HOLD, HOLD ending lands on the bar
  };

  function round(id) { for (var i = 0; i < ROUNDS.length; i++) if (ROUNDS[i].id === id) return ROUNDS[i]; return null; }
  function targetTotal() { return ROUNDS.reduce(function (a, r) { return a + r.target; }, 0); }

  /** Small deterministic PRNG (mulberry32). */
  function rng(seed) {
    var a = (seed >>> 0) || 1;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      var t = a;
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }
  function hashStr(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }

  /** 'HI' -> ['BOP','BOP','BOP','BOP','TWIST','BOP','BOP','TWIST'] */
  function wordToMoves(word) {
    var out = [];
    String(word).toUpperCase().split('').forEach(function (ch) {
      var code = MORSE[ch]; if (!code) return;
      code.split('').forEach(function (sym) { out.push(sym === '.' ? 'BOP' : 'PULL'); });
      out.push('TWIST');
    });
    return out;
  }
  /** Moves -> letters (TWIST closes a letter). Non-Morse moves are ignored. */
  function decode(moves) {
    var rev = {}; Object.keys(MORSE).forEach(function (k) { rev[MORSE[k]] = k; });
    var out = '', cur = '';
    moves.forEach(function (m) {
      if (m === 'BOP') cur += '.'; else if (m === 'PULL') cur += '-';
      else if (m === 'TWIST') { if (cur) out += rev[cur] || '?'; cur = ''; }
    });
    if (cur) out += rev[cur] || '?';
    return out;
  }

  /** The chart for one round. */
  function chart(id, seed, fakeNames) {
    var r = round(id); if (!r) return [];
    var rand = rng(hashStr(id) ^ (seed >>> 0));
    var word = wordToMoves(r.word), reals = [];
    while (reals.length < r.target + r.slack) reals = reals.concat(word);
    var out = [], player = 0, realCount = 0;
    fakeNames = fakeNames || ['COMPLY IT', 'FILTER IT', 'SPA IT', 'UPDATE IT'];
    reals.forEach(function (move, i) {
      if (r.fakes && i > 1 && rand() < r.fakes) out.push({ move: null, real: false, fake: fakeNames[Math.floor(rand() * fakeNames.length)], big: null, whisper: false, silent: false, player: player });
      if (r.pass && i > 0 && i % 6 === 0) { player = 1 - player; out.push({ move: 'PASS', real: false, fake: null, big: null, whisper: false, silent: false, player: player }); }
      var big = null;
      if (r.sizes) { var pat = SIZE_PATTERNS[r.id] || [false, true]; big = pat[i % pat.length]; }
      realCount++;
      out.push({ move: move, real: true, fake: null, big: big, whisper: !!r.whisper, silent: !!(r.silentEvery && realCount % r.silentEvery === 0), player: player });
      // HIDE IT (LEGACY's move: phone face down, out of SENTINEL's sight). Not Morse, so the words are untouched.
      // A REST slot follows so there's time to flip back and see the next call.
      if (r.hide && realCount % r.hide === 0 && i < reals.length - 1) {
        out.push({ move: 'HIDE', real: true, fake: null, big: null, whisper: !!r.whisper, silent: false, player: player });
        out.push({ move: 'REST', real: false, fake: null, big: null, whisper: false, silent: false, player: player });
      }
    });
    return out;
  }

  // ---------- The timeline: calls laid onto the music in 4-bar phrases (what the stage actually plays) ----------
  // A bar has two call slots (beat 1 and beat 3; he hits one beat later, on 2 and 4). Each template is one 4-bar
  // phrase = 16 beats. t = tap (2 beats) · H = HOLD (always on beat 1, owns the whole bar: 4 beats) · F = SENTINEL fake
  // (2) · P = PASS IT (2) + R = rest (2): the hand-over gets a whole bar · X = HIDE IT (2) + R (2): flip and back.
  // Rounds without sizes use plain calls (big = null). The real moves are the Morse word, in order, as before.
  var TEMPLATES = {
    r1: [['t', 't', 't', 't', 't', 't', 't', 't']],
    r2: [['t', 't', 'H', 't', 't', 'H']],                                   // ta ta | TAAA | ta ta | TAAA
    r3: [['t', 't', 't', 't', 't', 't', 'P', 'R']],                         // three bars, then pass it
    // R4 is SENTINEL's waltz (its lullaby, sped up, in 3/4): call on 1, hit on 2; its fakes and rests sit on 3, so a fake's
    // ring lands on the next downbeat, right where a real call would. A HOLD owns its whole 3-beat bar. 4 bars = 12 beats.
    r4: [['t2', 'r1', 't2', 'F1', 'H3', 't2', 'F1'], ['t2', 'F1', 't2', 'F1', 't2', 'r1', 'H3']],
    r5: [['t', 't', 'H', 't', 'F', 'H'], ['t', 'F', 'H', 't', 't', 'X', 'R']]   // driving; every other phrase ends HIDE IT
  };
  var SLOT_BEATS = { t: 2, H: 4, F: 2, P: 2, R: 2, X: 2, r: 1 };
  var METER = { r4: 3 };                                                  // beats per bar (default 4)
  function beatsPerBar(id) { return METER[id] || 4; }
  function timeline(id, seed, fakeNames) {
    var r = round(id); if (!r) return [];
    var rand = rng(hashStr('tl:' + id) ^ (seed >>> 0)), word = wordToMoves(r.word), wi = 0, used = 0;
    var tpl = TEMPLATES[id] || TEMPLATES.r1, out = [], player = 0, phrase = 0, beat = 0;
    fakeNames = fakeNames || ['COMPLY IT', 'FILTER IT', 'SPA IT', 'UPDATE IT'];
    while (used < r.target + r.slack) {
      tpl[phrase % tpl.length].forEach(function (tok) {
        var k = tok.charAt(0), e = { move: null, real: false, fake: null, big: null, whisper: false, silent: false, player: player, beats: tok.length > 1 ? +tok.slice(1) : SLOT_BEATS[k], at: beat };
        if (k === 't' || k === 'H') {
          e.move = word[wi % word.length]; wi++; used++; e.real = true; e.whisper = !!r.whisper;
          if (r.sizes) e.big = k === 'H';
        } else if (k === 'F') { e.fake = fakeNames[Math.floor(rand() * fakeNames.length)]; e.pad = ['BOP', 'TWIST', 'PULL'][Math.floor(rand() * 3)]; }   // its ring lands on a real pad
        else if (k === 'r') e.move = 'REST';
        else if (k === 'P') { player = 1 - player; e.move = 'PASS'; e.player = player; }
        else if (k === 'R') e.move = 'REST';
        else if (k === 'X') { e.move = 'HIDE'; e.real = true; e.whisper = !!r.whisper; }
        out.push(e); beat += e.beats;
      });
      phrase++;
    }
    return out;
  }

  /** Is an input at time t (seconds) inside the window around due? */
  function inWindow(t, due, win) { return Math.abs(t - due) <= win; }
  /** Timing window in seconds: ±150 ms, tightening to ±90 ms over the rounds. Easy mode widens it by 80 ms. */
  function windowFor(id, easy) {
    var i = Math.max(0, ROUNDS.indexOf(round(id)));
    var w = 0.150 - (0.060 * i / (ROUNDS.length - 1));
    return easy ? w + 0.08 : w;          // easy: ±230 → ±170 ms
  }
  /** Median of tap offsets (seconds), outliers beyond 250 ms dropped. Returns null if too few. */
  function fitOffset(offsets) {
    var xs = offsets.filter(function (x) { return Math.abs(x) < 0.25; }).sort(function (a, b) { return a - b; });
    if (xs.length < 5) return null;
    var med = xs[Math.floor(xs.length / 2)];
    var spread = xs.map(function (x) { return Math.abs(x - med); }).sort(function (a, b) { return a - b; })[Math.floor(xs.length / 2)];
    return { offset: med, spread: spread, ok: spread < 0.09 };
  }

  L.sequence = {
    MORSE: MORSE, ROUNDS: ROUNDS, FINAL_WORD: FINAL_WORD, SIZE_PATTERNS: SIZE_PATTERNS,
    round: round, targetTotal: targetTotal, rng: rng, hashStr: hashStr,
    wordToMoves: wordToMoves, decode: decode, chart: chart, timeline: timeline, TEMPLATES: TEMPLATES, beatsPerBar: beatsPerBar,
    inWindow: inWindow, windowFor: windowFor, fitOffset: fitOffset
  };
})(globalThis);
