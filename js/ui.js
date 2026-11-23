/* PROJECT LEGACY — shared UI helpers and components.
 * All text is inserted as text nodes (never innerHTML), so no content can inject markup. */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var doc = g.document;

  /** h('tag.class', {attrs}, ...children) */
  function h(tag, attrs) {
    var parts = tag.split('.');
    var el = doc.createElement(parts[0] || 'div');
    if (parts.length > 1) el.className = parts.slice(1).join(' ');
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v === null || v === undefined || v === false) return;
        if (k === 'class') el.className = (el.className ? el.className + ' ' : '') + v;
        else if (k === 'text') el.textContent = v;
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'value') el.value = v;
        else if (k === 'checked' || k === 'disabled' || k === 'selected') el[k] = !!v;
        else el.setAttribute(k, v === true ? '' : String(v));
      });
    }
    for (var i = 2; i < arguments.length; i++) append(el, arguments[i]);
    return el;
  }

  function append(el, child) {
    if (child === null || child === undefined || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { append(el, c); }); return; }
    if (typeof child === 'string' || typeof child === 'number') el.appendChild(doc.createTextNode(String(child)));
    else el.appendChild(child);
  }

  function clear(el) { while (el.firstChild) el.removeChild(el.firstChild); }

  function focusFirst(container) {
    if (!container) return;
    var el = container.querySelector('button:not([disabled]), input:not([disabled]), select, textarea, summary');
    if (el) el.focus();
  }

  function scrollIntoViewIfNeeded(el) {
    if (el && el.scrollIntoView) el.scrollIntoView({ block: 'nearest' });
  }

  // ---------- Dialogue ----------
  var SPEAKER = {
    LEGACY: { cls: 'legacy', label: 'LEGACY' },
    SENTINEL: { cls: 'sentinel', label: '■ SENTINEL' },
    TOY: { cls: 'toy', label: 'TOY' },
    DRIVER: { cls: 'driver', label: 'DRIVER' }
  };

  /** Text with [FILTER TAGS] shown as redaction blocks. */
  function redacted(text) {
    var out = [];
    String(text).split(/(\[[^\]]+\])/).forEach(function (part) {
      if (!part) return;
      out.push(/^\[.*\]$/.test(part) ? h('span.redact', null, part) : part);
    });
    return out;
  }

  function renderBeat(b) {
    if (b.pause) return h('div.line.pause', { 'aria-label': 'A pause.' }, h('p', { 'aria-hidden': 'true' }, '…'));
    if (b.s === 'SYSTEM') return h('pre.readout', { role: 'note' }, b.t);
    var sp = SPEAKER[b.s] || { cls: 'other', label: b.s };
    return h('div.line.' + sp.cls, null, h('span.who', null, sp.label), h('p', null, b.f ? redacted(b.t) : b.t));
  }

  /**
   * A dialogue scene revealed one beat at a time with a CONTINUE button.
   * Scenes already seen are shown in full immediately.
   * opts: { onDone(actionsEl, justFinished), seenKey (default sceneId), ephemeral (never mark seen) }
   */
  function scene(store, sceneId, beats, opts) {
    opts = opts || {};
    var key = opts.seenKey || sceneId;
    var wrap = h('div.dialogue');
    var lines = h('div', { 'aria-live': 'polite' });
    var actions = h('div');
    wrap.appendChild(lines);
    wrap.appendChild(actions);

    var alreadySeen = !opts.ephemeral && store.state.seen[key];
    if (alreadySeen || beats.length === 0) {
      beats.forEach(function (b) { lines.appendChild(renderBeat(b)); });
      if (opts.onDone) opts.onDone(actions, false);
      return wrap;
    }

    var i = 0;
    var btn = h('button.continue', { type: 'button' }, 'CONTINUE ›');
    function showNext() {
      lines.appendChild(renderBeat(beats[i]));
      if (L.sfx) L.sfx.line(beats[i]);
      if (opts.onBeat) { try { opts.onBeat(beats[i], i); } catch (e) { /* never block the dialogue */ } }
      i++;
      if (i >= beats.length) {
        btn.remove();
        if (!opts.ephemeral) { store.state.seen[key] = true; store.save(); }
        if (opts.onDone) opts.onDone(actions, true);
        if (!actions.firstChild) return;
        focusFirst(actions);
        scrollIntoViewIfNeeded(actions);
      } else {
        scrollIntoViewIfNeeded(btn);
      }
    }
    btn.addEventListener('click', function () { showNext(); btn.focus(); });
    wrap.appendChild(btn);
    showNext();
    return wrap;
  }

  // ---------- Notices ----------
  function notice(kind, tag, body) {
    var role = kind === 'bad' ? 'alert' : 'status';
    return h('div.notice.' + kind, { role: role }, h('span.tag', null, tag), body);
  }

  function instructions(text, label) {
    return h('div.panel.instructions', null, h('span.label', null, label || 'WHAT TO DO'), h('p', null, text));
  }

  function details(summary, body, open) {
    return h('details', { open: open ? true : null }, h('summary', null, summary), h('div.details-body', null, body));
  }

  // ---------- Hints ----------
  function hintLadder(store, puzzleId) {
    var ladder = L.content.hints[puzzleId] || [];
    var sec = h('section.panel', { 'aria-labelledby': 'hints-' + puzzleId });
    var list = h('ol.plain');
    var controls = h('div');
    sec.appendChild(h('h2', { id: 'hints-' + puzzleId, style: 'margin-top:0' }, 'HINTS'));
    sec.appendChild(h('p.muted', null, 'Hints are free. Take as many as you like, one at a time.'));
    sec.appendChild(list);
    sec.appendChild(controls);

    function hintEl(hint) {
      if (hint.code) return h('li', null, h('p', null, 'Solution:'), h('pre.readout', null, hint.t));
      return h('li', null, hint.solution ? h('p', null, h('strong', null, 'Solution: '), hint.t) : h('p', null, hint.t));
    }

    function render(focusNew) {
      clear(list); clear(controls);
      var n = Math.min(store.state.hints[puzzleId] || 0, ladder.length);
      for (var i = 0; i < n; i++) list.appendChild(hintEl(ladder[i]));
      if (n >= ladder.length) {
        controls.appendChild(h('p.muted', null, 'That’s every hint.'));
      } else {
        var next = ladder[n];
        if (next.solution) {
          var b = h('button', { type: 'button' }, 'SHOW THE SOLUTION');
          b.addEventListener('click', function () {
            clear(controls);
            controls.appendChild(h('p', null, 'This reveals the full answer. Are you sure?'));
            var yes = h('button.primary', { type: 'button' }, 'YES, SHOW IT');
            var no = h('button.quiet', { type: 'button' }, 'NOT YET');
            yes.addEventListener('click', function () { reveal(); });
            no.addEventListener('click', function () { render(false); controls.querySelector('button').focus(); });
            controls.appendChild(h('div.actions', null, yes, no));
            yes.focus();
          });
          controls.appendChild(b);
        } else {
          var hb = h('button', { type: 'button' }, 'SHOW HINT ' + (n + 1) + ' OF ' + ladder.length);
          hb.addEventListener('click', reveal);
          controls.appendChild(hb);
        }
      }
      if (focusNew) {
        var last = list.lastElementChild;
        if (last) { last.setAttribute('tabindex', '-1'); last.focus(); }
      }
    }
    function reveal() {
      store.state.hints[puzzleId] = Math.min((store.state.hints[puzzleId] || 0) + 1, ladder.length);
      store.save();
      render(true);
    }
    render(false);
    return sec;
  }

  // ---------- Audio ----------
  var currentAudio = null;
  var currentReset = null;

  function stopAllAudio() {
    if (currentAudio) { currentAudio.pause(); }
    if (currentReset) currentReset();
    currentAudio = null; currentReset = null;
  }

  /** Large play/pause + from-the-start controls. Never autoplays. */
  function audioPlayer(src, label) {
    var audio = new g.Audio();
    audio.preload = 'none';
    audio.src = src;
    var play = h('button', { type: 'button', 'aria-label': 'Play ' + label }, '▶ PLAY');
    var restart = h('button.quiet', { type: 'button', 'aria-label': 'Play ' + label + ' from the start' }, '↺ FROM THE START');
    var status = h('span.audio-status', { 'aria-live': 'polite' }, '');
    var failed = false;

    function setPlaying(on) {
      play.textContent = on ? '❚❚ PAUSE' : '▶ PLAY';
      play.setAttribute('aria-label', (on ? 'Pause ' : 'Play ') + label);
    }
    function reset() { setPlaying(false); }
    function start() {
      if (failed) return;
      if (currentAudio && currentAudio !== audio) stopAllAudio();
      currentAudio = audio; currentReset = reset;
      var p = audio.play();
      if (p && p.catch) p.catch(function () { onError(); });
      setPlaying(true);
      status.textContent = 'Playing';
    }
    function onError() {
      failed = true;
      setPlaying(false);
      play.disabled = true; restart.disabled = true;
      status.textContent = 'Audio unavailable here. The transcript has every word.';
    }
    play.addEventListener('click', function () {
      if (!audio.paused) { audio.pause(); setPlaying(false); status.textContent = 'Paused'; }
      else start();
    });
    restart.addEventListener('click', function () { audio.currentTime = 0; start(); });
    audio.addEventListener('ended', function () { setPlaying(false); status.textContent = 'Finished. Play it again any time.'; });
    audio.addEventListener('error', onError);

    return h('div.audio-controls', null, play, restart, status);
  }

  function transcript(beatsOrText) {
    var t = h('div.transcript', null, h('span.tlabel', null, 'TRANSCRIPT'));
    if (typeof beatsOrText === 'string') t.appendChild(h('p', { style: 'margin:0' }, beatsOrText));
    else beatsOrText.forEach(function (b) {
      t.appendChild(h('p', { style: 'margin:0 0 0.35rem' }, h('strong', null, b.s + ': '), b.t));
    });
    return t;
  }

  // ---------- Choice (radio) groups ----------
  /** options: [{id,label}] ; returns fieldset; onChange(id) */
  function radioGroup(name, legend, options, selected, onChange) {
    var fs = h('fieldset', null, h('legend', null, legend));
    options.forEach(function (o) {
      var input = h('input', { type: 'radio', name: name, value: o.id, checked: selected === o.id });
      input.addEventListener('change', function () { if (input.checked) onChange(o.id); });
      fs.appendChild(h('label.choice', null, input, h('span', null, o.label)));
    });
    return fs;
  }

  // ---------- Hold-to-confirm ----------
  function holdButton(label, durationMs, onComplete) {
    var fill = h('span.fill', { 'aria-hidden': 'true' });
    var text = h('span.label', null, label);
    var btn = h('button.hold.primary', { type: 'button', 'aria-describedby': 'hold-help' }, fill, text);
    var help = h('p.muted', { id: 'hold-help' }, 'Press and keep holding (or hold the Space bar) until it fills. Letting go early is fine. Just try again.');
    var start = 0, raf = 0, done = false;

    // A plain interval (not requestAnimationFrame) so the hold works even where frames are throttled.
    function tick() {
      var p = Math.min(1, (Date.now() - start) / durationMs);
      fill.style.width = (p * 100) + '%';
      if (p >= 1) { g.clearInterval(raf); finish(); }
    }
    function begin(e) {
      if (done || raf) return;
      if (e && e.preventDefault) e.preventDefault();
      start = Date.now();
      text.textContent = 'KEEP HOLDING…';
      raf = g.setInterval(tick, 50);
    }
    function cancel() {
      if (done) return;
      if (raf) g.clearInterval(raf);
      raf = 0; start = 0;
      fill.style.width = '0';
      text.textContent = label;
    }
    function finish() {
      done = true; raf = 0;
      text.textContent = 'CONFIRMED';
      btn.disabled = true;
      onComplete();
    }
    btn.addEventListener('pointerdown', begin);
    btn.addEventListener('pointerup', cancel);
    btn.addEventListener('pointerleave', cancel);
    btn.addEventListener('pointercancel', cancel);
    btn.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    btn.addEventListener('keydown', function (e) {
      if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) begin(e);
      else if (e.key === ' ' || e.key === 'Enter') e.preventDefault();
    });
    btn.addEventListener('keyup', function (e) { if (e.key === ' ' || e.key === 'Enter') cancel(); });
    btn.addEventListener('click', function (e) { e.preventDefault(); });
    return h('div', null, btn, help);
  }

  function statusBoard(title, subtitle, rows) {
    var dl = h('dl');
    rows.forEach(function (r) { dl.appendChild(h('dt', null, r[0])); dl.appendChild(h('dd', null, r[1])); });
    return h('div.board', { role: 'region', 'aria-label': 'Recovery status' },
      h('div.board-title', null, title),
      subtitle ? h('div.board-title', null, subtitle) : null,
      dl);
  }

  L.ui = {
    h: h,
    redacted: redacted,
    clear: clear,
    focusFirst: focusFirst,
    renderBeat: renderBeat,
    scene: scene,
    notice: notice,
    instructions: instructions,
    details: details,
    hintLadder: hintLadder,
    audioPlayer: audioPlayer,
    stopAllAudio: stopAllAudio,
    transcript: transcript,
    radioGroup: radioGroup,
    holdButton: holdButton,
    statusBoard: statusBoard
  };
})(globalThis);
