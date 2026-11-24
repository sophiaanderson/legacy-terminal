/* PROJECT LEGACY — progression state, date gates, persistence, organizer operations (no DOM). */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var VERSION = 2;

  // The week. Each day is a list of steps; progress is DERIVED: the current step is the first one
  // that isn't solved AND acknowledged. A day can't start before its 8am gate (unless overridden).
  var DAYS = [
    { id: 'wed', title: 'Emergency message', steps: ['intro', 'ch01', 'emailWed'] },
    { id: 'thu', title: 'Capitals', steps: ['ch02', 'keys', 'emailThu'] },
    { id: 'fri', title: 'Face and words', steps: ['face', 'emailFri'] },
    { id: 'sat', title: 'The arms race', steps: ['channel', 'emailSat'] },
    { id: 'sun', title: 'The drop', steps: ['beat', 'emailSun', 'mix', 'stir'] },
    { id: 'mon', title: 'Memory', steps: ['vault', 'emailMon', 'protocol'] }
  ];
  var STEPS = [];
  DAYS.forEach(function (d) { d.steps.forEach(function (s) { STEPS.push(s); }); });

  // Kept for the (paused) finale, unchanged from v1.
  var FINALE_SCENES = ['finaleArrival', 'finaleDetect', 'finaleRefuseCompromise', 'finaleContinue',
    'finalePurge1', 'finalePurge2', 'finalePurge3', 'finaleRestoreReady', 'finaleVerified', 'finaleEnding'];
  var FINALE_STEPS = ['parked', 'arrival', 'auth', 'confront', 'decision', 'purge', 'restore', 'verified', 'ending',
    // v3 stage ("BOP IT: FULL SERVICE"): js/stage.js
    'heartbeat', 'r1', 'r2', 'r3', 'glitch', 'r4', 'r5', 'keys', 'drop', 'home'];

  function flags(list, v) { var o = {}; list.forEach(function (k) { o[k] = v; }); return o; }

  function defaultPuzzles() {
    return {
      ch01: { source: null, runs: 0, unchangedRuns: 0 },
      ch02: { source: null, instructions: 0, pasted: false, marks: false, typed: 0 },
      keys: { glovebox: false, cargofloor: false },
      fri: { exploit: null },
      sat: { version: '4.8', leetPatched: false, splitPatched: false, hexPatched: false, fixedIn: { leet: null, split: null, hex: null },
             got: { BOP: false, TWIST: false, PULL: false }, decoded: { BOP: false, TWIST: false, PULL: false }, decodeFails: 0, eggs: 0, scratchRuns: 0, fails: 0, patchedOnce: false, scratchSrc: null, log: [] },
      beat: JSON.parse(JSON.stringify(L.puzzles ? L.puzzles.beatStart : { grid: {}, sections: {} })),
      face: { v: 2, h: 9, i: 1, c: 2 },
      vault: { haunted: false, boulder: false, emperor: false, seattle: false, open: false },
      memories: 0,
      sleepTalk: 0
    };
  }

  function defaultFinale() {
    return { organizerTriggered: false, step: 'parked', auth: { operator: false, witness: false }, purge: 0, completed: false,
             // v3 stage: running score (at the start of the current round), tap latency, fails per round, SENTINEL meter
             classic: false, score: 0, offsetMs: 0, meter: 0, fails: { r1: 0, r2: 0, r3: 0, r4: 0, r5: 0 }, odometer: 0, easy: false, lockOpen: false };
  }

  function defaults() {
    return {
      version: VERSION,
      done: flags(STEPS, false),
      acked: flags(STEPS, false),
      overrides: flags(DAYS.map(function (d) { return d.id; }), false),
      puzzles: defaultPuzzles(),
      seen: {},
      finale: defaultFinale(),
      prefs: { textScale: 0, sound: true },
      replay: null,          // REPLAY mode only: JSON { bot, thread } (js/replay.js)
      waitingVisits: 0,
      finaleReadyAt: 0,
      updatedAt: 0
    };
  }

  function isPlainObject(x) { return x !== null && typeof x === 'object' && !Array.isArray(x); }

  /** Rebuild `raw` in the shape of `def`, keeping only values of the right type. Never throws. */
  function sanitize(raw, def) {
    if (Array.isArray(def)) {
      // Variable-length lists of plain strings/objects (e.g. the Saturday log).
      if (!Array.isArray(raw)) return def.slice();
      return raw.filter(function (x) { return isPlainObject(x) && typeof x.k === 'string' && typeof x.t === 'string'; }).slice(-120)
        .map(function (x) { return { k: x.k, t: x.t, r: typeof x.r === 'string' ? x.r : '', d: typeof x.d === 'string' ? x.d : '' }; });
    }
    if (isPlainObject(def)) {
      var keys = Object.keys(def);
      if (keys.length === 0) {
        var m = {};
        if (isPlainObject(raw)) Object.keys(raw).forEach(function (k) { if (raw[k] === true) m[k] = true; });
        return m;
      }
      var out = {};
      keys.forEach(function (k) { out[k] = sanitize(isPlainObject(raw) ? raw[k] : undefined, def[k]); });
      return out;
    }
    if (def === null) return (typeof raw === 'string') ? raw : null;
    if (typeof def === 'number') return (typeof raw === 'number' && isFinite(raw)) ? raw : def;
    if (typeof raw === typeof def) return raw;
    return def;
  }

  function clampInt(v, lo, hi) { return Math.max(lo, Math.min(hi, Math.floor(v))); }

  function normalize(raw) {
    var s = sanitize(raw && raw.version === VERSION ? raw : null, defaults());
    s.version = VERSION;
    s.done.keys = s.puzzles.keys.glovebox && s.puzzles.keys.cargofloor;
    if (FINALE_STEPS.indexOf(s.finale.step) === -1) s.finale.step = 'parked';
    s.finale.purge = clampInt(s.finale.purge, 0, 3);
    s.finale.score = clampInt(s.finale.score, 0, 90);
    s.finale.offsetMs = clampInt(s.finale.offsetMs, -400, 400);
    s.finale.odometer = clampInt(s.finale.odometer, 0, 999999);
    s.prefs.textScale = clampInt(s.prefs.textScale, 0, 3);
    ['v', 'h', 'i', 'c'].forEach(function (k) { s.puzzles.face[k] = clampInt(s.puzzles.face[k], 0, 10); });
    Object.keys(s.puzzles.beat.grid).forEach(function (k) { if (!(k === 'lead' ? /^[0-5]{8}$/ : /^[01]{8}$/).test(s.puzzles.beat.grid[k])) s.puzzles.beat.grid[k] = '00000000'; });
    s.puzzles.beat.filter = clampInt(s.puzzles.beat.filter, 0, 10);
    s.puzzles.beat.bpm = clampInt(s.puzzles.beat.bpm, 80, 160);
    if (!/^(no|gum|bopit|brian|car|tweeter|beep)$/.test(s.puzzles.beat.voice)) s.puzzles.beat.voice = 'no';
    var t = s.puzzles.fri.exploit;
    if (t !== null && ['caps', 'leet', 'split', 'hex'].indexOf(t) === -1) s.puzzles.fri.exploit = null;
    return s;
  }

  // ---------- Persistence ----------
  var storageOk = true;

  function load() {
    var raw = null;
    try {
      var txt = g.localStorage.getItem(L.config.storageKey);
      raw = txt ? JSON.parse(txt) : null;
    } catch (e) { storageOk = false; raw = null; }
    return normalize(raw);
  }

  function save(state) {
    state.updatedAt = Date.now();
    try { g.localStorage.setItem(L.config.storageKey, JSON.stringify(state)); storageOk = true; }
    catch (e) { storageOk = false; }
  }

  function createStore(opts) {
    opts = opts || {};
    var persist = opts.persist !== false;
    var store = {
      persist: persist,
      state: opts.initial ? normalize(JSON.parse(JSON.stringify(opts.initial))) : (persist ? load() : defaults()),
      save: function () { if (persist) save(store.state); },
      replace: function (s) { store.state = normalize(s); store.save(); }
    };
    return store;
  }

  // ---------- Gates ----------
  function gateTime(dayId) {
    var p = String(L.config.gates[dayId] || '').split('-').map(Number);
    return new Date(p[0], (p[1] || 1) - 1, p[2] || 1, L.config.gateHour == null ? 8 : L.config.gateHour, L.config.gateMinute || 0, 0).getTime();
  }
  function now() { return (L.state && L.state._now) ? L.state._now() : Date.now(); }
  function unlocked(s, dayId) { return !!s.overrides[dayId] || now() >= gateTime(dayId); }

  // ---------- Progression ----------
  function stepDone(s, step) { return !!(s.done[step] && s.acked[step]); }
  function dayDone(s, dayId) { return dayById(dayId).steps.every(function (st) { return stepDone(s, st); }); }
  function dayById(id) { for (var i = 0; i < DAYS.length; i++) if (DAYS[i].id === id) return DAYS[i]; return null; }
  function dayIndex(id) { for (var i = 0; i < DAYS.length; i++) if (DAYS[i].id === id) return i; return -1; }
  function dayOfStep(step) { for (var i = 0; i < DAYS.length; i++) if (DAYS[i].steps.indexOf(step) !== -1) return DAYS[i]; return null; }

  function currentStep(s) {
    for (var i = 0; i < STEPS.length; i++) if (!stepDone(s, STEPS[i])) return STEPS[i];
    return null;
  }
  function remoteComplete(s) { return currentStep(s) === null; }

  /**
   * Where the player is: { kind: 'step', day, step } | { kind: 'locked', day } |
   * { kind: 'finale-ready' } | { kind: 'finale-live' } | { kind: 'complete' }
   */
  function where(s) {
    if (s.finale.completed) return { kind: 'complete' };
    var st = currentStep(s);
    if (st) {
      var d = dayOfStep(st);
      // A day that has been started stays open even if the clock goes backwards.
      var started = d.steps.some(function (x) { return s.done[x]; });
      if (!started && !unlocked(s, d.id)) return { kind: 'locked', day: d.id };
      return { kind: 'step', day: d.id, step: st };
    }
    return { kind: s.finale.organizerTriggered ? 'finale-live' : 'finale-ready' };
  }
  function phase(s) { var w = where(s); return w.kind === 'step' ? w.step : w.kind === 'locked' ? 'locked' : w.kind; }

  function solve(s, step) {
    s.done[step] = true;
    if (STEPS.every(function (x) { return s.done[x]; }) && !s.finaleReadyAt) s.finaleReadyAt = Date.now();
  }
  function ack(s, step) { s.acked[step] = true; }

  function acceptKey(s, which) {
    var already = s.puzzles.keys[which];
    s.puzzles.keys[which] = true;
    s.done.keys = s.puzzles.keys.glovebox && s.puzzles.keys.cargofloor;
    return !already;
  }

  /** LEGACY speaks lowercase until the capitals routine works. */
  function hasCapitals(s) { return !!s.done.ch02; }

  // ---------- Organizer operations ----------
  function markDayComplete(s, dayId) {
    var P = L.puzzles;
    var d = dayById(dayId);
    if (!d) return;
    var pz = s.puzzles;
    if (dayId === 'wed') pz.ch01.source = P.ch01.fixedSource;
    if (dayId === 'thu') { pz.ch02.source = P.ch02.solutionSource; pz.ch02.instructions = 14; pz.keys.glovebox = pz.keys.cargofloor = true; }
    if (dayId === 'fri') { if (!pz.fri.exploit) pz.fri.exploit = 'caps'; pz.face = { v: 6, h: 4, i: 6, c: 10 }; }
    if (dayId === 'sat') { pz.sat.got = { BOP: true, TWIST: true, PULL: true }; pz.sat.decoded = { BOP: true, TWIST: true, PULL: true }; }
    if (dayId === 'sun') { pz.beat = JSON.parse(JSON.stringify(P.beatSolution)); }
    if (dayId === 'mon') { pz.vault = { haunted: true, boulder: true, emperor: true, seattle: true, open: true }; pz.memories = 99; }
    d.steps.forEach(function (st) { solve(s, st); ack(s, st); });
  }

  function resetDay(s, dayId) {
    var d = dayById(dayId);
    if (!d) return;
    var fresh = defaultPuzzles();
    d.steps.forEach(function (st) { s.done[st] = false; s.acked[st] = false; });
    var map = { wed: ['ch01'], thu: ['ch02', 'keys'], fri: ['face', 'fri'], sat: ['sat'], sun: ['beat'], mon: ['vault', 'memories', 'sleepTalk'] };
    (map[dayId] || []).forEach(function (k) { s.puzzles[k] = fresh[k]; });
    Object.keys(s.seen).forEach(function (k) { if (k.indexOf(dayId + ':') === 0) delete s.seen[k]; });
    s.finaleReadyAt = 0;
    s.finale = defaultFinale();
    clearScenes(s, FINALE_SCENES);
  }

  /** Skip one step the same way playing it would leave things, so later days still work. Idempotent. */
  function skipStep(s, step) {
    if (STEPS.indexOf(step) === -1) return false;
    var P = L.puzzles, pz = s.puzzles;
    if (step === 'ch01') pz.ch01.source = P.ch01.fixedSource;
    if (step === 'ch02') { pz.ch02.source = P.ch02.solutionSource; pz.ch02.instructions = pz.ch02.instructions || 14; }
    if (step === 'keys') pz.keys.glovebox = pz.keys.cargofloor = true;   // done.keys is recomputed from these
    if (step === 'emailFri' && !pz.fri.exploit) pz.fri.exploit = 'caps';
    if (step === 'channel') { pz.sat.got = { BOP: true, TWIST: true, PULL: true }; pz.sat.decoded = { BOP: true, TWIST: true, PULL: true }; }
    if (step === 'beat') { var b = JSON.parse(JSON.stringify(P.beatSolution)); b.bpm = pz.beat.bpm || b.bpm; b.voice = pz.beat.voice || b.voice; pz.beat = b; }
    if (step === 'face') pz.face = JSON.parse(JSON.stringify(P.face.target));
    if (step === 'vault') { pz.vault = { haunted: true, boulder: true, emperor: true, seattle: true, open: true }; pz.memories = Math.max(pz.memories || 0, 99); }
    solve(s, step); ack(s, step);
    return true;
  }

  // ---------- Rescue links (Sophie texts Brian a link from #admin; opening it fixes HIS device) ----------
  // #help/<action>/<target>/<check>. The check only stops typos and guessing by accident: the site is public.
  var HELP_ACTIONS = { skip: 1, unlock: 1, day: 1 };
  function helpCheck(action, target) {
    var str = 'legacy-help|' + action + '|' + target, hsh = 0x811c9dc5;
    for (var i = 0; i < str.length; i++) { hsh ^= str.charCodeAt(i); hsh = Math.imul(hsh, 0x01000193) >>> 0; }
    return hsh.toString(36).slice(0, 5);
  }
  function helpPath(action, target) { return 'help/' + action + '/' + target + '/' + helpCheck(action, target); }
  function parseHelp(route) {
    var m = /^help\/([a-z]+)\/([A-Za-z0-9]+)\/([a-z0-9]+)$/.exec(String(route || ''));
    if (!m || !HELP_ACTIONS[m[1]] || helpCheck(m[1], m[2]) !== m[3]) return null;
    if (m[1] === 'skip' && STEPS.indexOf(m[2]) === -1) return null;
    if (m[1] !== 'skip' && !dayById(m[2])) return null;
    return { action: m[1], target: m[2] };
  }
  /** Apply a rescue. Never moves him backwards. Returns a short description of what changed. */
  function applyHelp(s, help) {
    if (help.action === 'skip') { var was = stepDone(s, help.target); skipStep(s, help.target); return { changed: !was }; }
    if (help.action === 'unlock') { var u = !s.overrides[help.target]; s.overrides[help.target] = true; return { changed: u }; }
    var changed = false;
    for (var i = 0; i < DAYS.length && DAYS[i].id !== help.target; i++) if (!dayDone(s, DAYS[i].id)) { markDayComplete(s, DAYS[i].id); changed = true; }
    return { changed: changed };
  }

  function clearScenes(s, list) { list.forEach(function (id) { delete s.seen[id]; }); }

  function setFinaleReady(s) { DAYS.forEach(function (d) { if (!dayDone(s, d.id)) markDayComplete(s, d.id); }); }

  function triggerFinale(s) {
    if (!remoteComplete(s)) return false;
    s.finale.organizerTriggered = true;
    return true;
  }
  function resetFinale(s) { s.finale = defaultFinale(); clearScenes(s, FINALE_SCENES); }

  // ---------- Transfer codes ----------
  var CODE_PREFIX = 'LEGACY2:';
  function exportCode(s) { return CODE_PREFIX + g.btoa(unescape(encodeURIComponent(JSON.stringify(s)))); }
  function importCode(code) {
    var c = String(code || '').trim();
    if (c.indexOf(CODE_PREFIX) !== 0) throw new Error('That isn’t a LEGACY transfer code from this version.');
    return normalize(JSON.parse(decodeURIComponent(escape(g.atob(c.slice(CODE_PREFIX.length).replace(/\s+/g, ''))))));
  }

  L.state = {
    VERSION: VERSION,
    DAYS: DAYS,
    STEPS: STEPS,
    FINALE_STEPS: FINALE_STEPS,
    defaults: defaults,
    normalize: normalize,
    load: load,
    save: save,
    storageOk: function () { return storageOk; },
    createStore: createStore,
    skipStep: skipStep,
    helpPath: helpPath,
    parseHelp: parseHelp,
    applyHelp: applyHelp,
    gateTime: gateTime,
    unlocked: unlocked,
    stepDone: stepDone,
    dayDone: dayDone,
    dayById: dayById,
    dayIndex: dayIndex,
    dayOfStep: dayOfStep,
    currentStep: currentStep,
    remoteComplete: remoteComplete,
    where: where,
    phase: phase,
    solve: solve,
    ack: ack,
    acceptKey: acceptKey,
    hasCapitals: hasCapitals,
    markDayComplete: markDayComplete,
    resetDay: resetDay,
    setFinaleReady: setFinaleReady,
    triggerFinale: triggerFinale,
    resetFinale: resetFinale,
    exportCode: exportCode,
    importCode: importCode,
    _now: null
  };
})(globalThis);
