/* PROJECT LEGACY — sound effects for the whole terminal.
 * Everything is synthesized with Web Audio: no files, nothing to license, works offline.
 * Hooked in centrally so every screen gets sound without per-screen code:
 *   - any button press ............ tap
 *   - a dialogue line appearing .... a voice blip per speaker (LEGACY chirp, SENTINEL low chime, SYSTEM teletype)
 *   - a step solved ................ success jingle (wraps Legacy.state.solve)
 *   - notices ...................... 'bad' buzz / 'good' chime
 *   - typing in a box .............. soft key ticks (throttled)
 * The header has an SFX ON/OFF toggle (prefs.sound). Music (Saturday mix, spa, finale) is not affected by it.
 * Browsers only allow sound after a tap, so nothing plays on a fresh page load until he touches something.
 * Buttons can opt out with data-sfx="off" (the finale's rhythm pads make their own sounds). */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var doc = g.document;
  var ac = null, out = null, enabled = true, lastTick = 0;

  function ensure() {
    var AC = g.AudioContext || g.webkitAudioContext;
    if (!AC) return false;
    if (!ac) { ac = new AC(); out = ac.createGain(); out.gain.value = 0.5; out.connect(ac.destination); }
    if (ac.state === 'suspended' && ac.resume) { try { ac.resume(); } catch (e) {} }
    return true;
  }
  function ready() { return enabled && ensure() && ac.state !== 'closed'; }

  function tone(t, freq, dur, vol, type, endFreq) {
    var o = ac.createOscillator(), gn = ac.createGain();
    o.type = type || 'sine';
    o.frequency.setValueAtTime(freq, t);
    if (endFreq) o.frequency.exponentialRampToValueAtTime(endFreq, t + dur);
    gn.gain.setValueAtTime(0.0001, t);
    gn.gain.exponentialRampToValueAtTime(vol, t + 0.005);
    gn.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(gn).connect(out); o.start(t); o.stop(t + dur + 0.02);
  }
  function noise(t, dur, vol, freq) {
    var len = Math.max(1, Math.floor(ac.sampleRate * dur)), b = ac.createBuffer(1, len, ac.sampleRate), d = b.getChannelData(0);
    for (var i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
    var s = ac.createBufferSource(), f = ac.createBiquadFilter(), gn = ac.createGain();
    s.buffer = b; f.type = 'bandpass'; f.frequency.value = freq || 3000; gn.gain.value = vol;
    s.connect(f).connect(gn).connect(out); s.start(t);
  }

  var SOUNDS = {
    tap: function (t) { tone(t, 1800, 0.035, 0.12, 'square', 1200); },
    key: function (t) { noise(t, 0.018, 0.25, 4200 + Math.random() * 1500); },
    legacy: function (t) { tone(t, 660, 0.07, 0.12, 'triangle', 880); tone(t + 0.07, 990, 0.09, 0.1, 'triangle'); },
    legacyLow: function (t) { tone(t, 520, 0.08, 0.1, 'triangle', 600); },              // lowercase LEGACY: smaller voice
    sentinel: function (t) { tone(t, 196, 0.6, 0.16, 'sine'); tone(t, 293.7, 0.6, 0.07, 'sine'); },
    system: function (t) { for (var i = 0; i < 5; i++) noise(t + i * 0.03, 0.015, 0.3, 2500); },
    solve: function (t) { [523.3, 659.3, 784, 1046.5].forEach(function (f, i) { tone(t + i * 0.08, f, 0.25, 0.13, 'triangle'); }); },
    good: function (t) { tone(t, 784, 0.15, 0.12, 'triangle'); tone(t + 0.1, 1175, 0.25, 0.12, 'triangle'); },
    bad: function (t) { tone(t, 140, 0.22, 0.14, 'sawtooth', 110); tone(t + 0.12, 120, 0.25, 0.12, 'sawtooth', 90); },
    unlock: function (t) { tone(t, 330, 0.5, 0.1, 'sine', 990); tone(t + 0.35, 1320, 0.4, 0.08, 'triangle'); },
    test: function (t) { [392, 523.3, 659.3, 784].forEach(function (f, i) { tone(t + i * 0.14, f, 0.5, 0.18, 'triangle'); }); }
  };

  function play(name) {
    if (!SOUNDS[name] || !ready()) return;
    try { SOUNDS[name](ac.currentTime + 0.01); } catch (e) { /* never break the game over a beep */ }
  }

  /** A dialogue beat appearing: { s: 'LEGACY'|'SENTINEL'|'SYSTEM', t } */
  function line(b) {
    if (!b || b.pause) return;
    if (b.s === 'SENTINEL') play('sentinel');
    else if (b.s === 'SYSTEM') play('system');
    else if (b.s === 'LEGACY') play(/[A-Z]/.test(b.t || '') ? 'legacy' : 'legacyLow');
    else play('legacyLow');
  }

  function setEnabled(on) { enabled = !!on; }

  // ---------- global hooks ----------
  // Unlock audio on the first touch, and tap on every button press.
  doc.addEventListener('pointerdown', function () { if (enabled) ensure(); }, true);
  doc.addEventListener('click', function (e) {
    var b = e.target && e.target.closest ? e.target.closest('button, summary') : null;
    if (!b || b.disabled || b.getAttribute('data-sfx') === 'off') return;
    play('tap');
  }, true);
  doc.addEventListener('input', function (e) {
    var el = e.target;
    if (!el || !/^(TEXTAREA|INPUT)$/.test(el.tagName) || el.type === 'range') return;
    var now = Date.now(); if (now - lastTick < 35) return; lastTick = now;
    play('key');
  }, true);

  // A step solved = the success jingle (only the first time).
  if (L.state && L.state.solve) {
    var solve = L.state.solve;
    L.state.solve = function (s, step) { var was = s && s.done && s.done[step]; solve.apply(this, arguments); if (!was) play('solve'); };
  }
  // Notices: wrong / right.
  if (L.ui && L.ui.notice) {
    var notice = L.ui.notice;
    L.ui.notice = function (kind) { if (kind === 'bad') play('bad'); else if (kind === 'good') play('good'); return notice.apply(this, arguments); };
  }

  // ---------- "turn your sound on" panel ----------
  /** A panel shown where sound matters, with a test button. Written for his Android phone. */
  function soundCheck(text, label) {
    var h = L.ui.h;
    var status = h('span.audio-status', { 'aria-live': 'polite' }, '');
    var test = h('button', { type: 'button', 'data-sfx': 'off' }, '🔊 TEST SOUND');
    test.addEventListener('click', function () {
      var was = enabled; enabled = true; play('test'); enabled = was;
      status.textContent = ac ? 'Hear that? If not, press volume-up now, while it plays.' : 'This browser has no sound. Every word is on screen anyway.';
    });
    return h('div.panel.instructions.sound-check', { role: 'note' },
      h('span.label', null, label || '🔊 SOUND ON'),
      h('p', null, text),
      h('p.muted', { style: 'margin:0.4rem 0' }, 'Tap TEST SOUND, then press volume-up on the side of the phone while it plays (that sets media volume, not the ringer). No headphones needed.'),
      h('div.actions', null, test, status));
  }

  L.sfx = { play: play, line: line, setEnabled: setEnabled, enabled: function () { return enabled; }, soundCheck: soundCheck };
})(globalThis);
