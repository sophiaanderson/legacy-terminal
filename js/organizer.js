/* PROJECT LEGACY — organizer panel (open the app with #organizer).
 * The PIN is a convenience so Brian doesn't wander in by accident. It is not security:
 * the site is public and everything (including the email words) is readable in the source. */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var ui = L.ui, h = ui.h, S = L.state, C = L.content, cfg = L.config;
  var UNLOCK_KEY = 'projectLegacyOrganizerUnlocked';

  function isUnlocked() { try { return g.sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; } }
  function unlock() { try { g.sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) { /* ignore */ } }

  var STEP_NAMES = {
    intro: 'Opening', ch01: 'Ch01 debug (GLOVEBOX)', emailWed: 'Email: Bop It', ch02: 'Ch02 capitals', keys: 'Cards GLV-41 + CGO-82',
    emailThu: 'Email: lowercase test', emailFri: 'Email: filter (say it back)', channel: 'Arms race (BOP/TWIST/PULL)',
    emailSat: 'Email: margins', beat: 'Build the drop', emailSun: 'Email: name the track', mix: 'Full Service (the mix)', stir: 'The glitch (SENTINEL stirs)', face: 'Tune my face', vault: 'Memory vault',
    emailMon: 'The backup (track 9)', protocol: 'Protocol readout'
  };

  function render(ctx) {
    var root = h('div');
    if (!isUnlocked()) {
      root.appendChild(h('h1', { tabindex: '-1' }, 'ORGANIZER'));
      var pin = h('input', { type: 'password', id: 'pin', inputmode: 'numeric', autocomplete: 'off' });
      var msg = h('div', { 'aria-live': 'polite' });
      var form = h('form', null, h('label.field', { for: 'pin' }, 'PIN'), pin, h('div.actions', null, h('button.primary', { type: 'submit' }, 'UNLOCK')), msg);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var bad = function () { ui.clear(msg); msg.appendChild(ui.notice('bad', 'WRONG PIN', h('p', { style: 'margin:0' }, 'Try again.'))); };
        if (!g.crypto || !g.crypto.subtle) { bad(); return; }
        g.crypto.subtle.digest('SHA-256', new TextEncoder().encode('legacy-organizer:' + pin.value.trim())).then(function (buf) {
          var hx = Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
          if (hx === cfg.organizerPinHash) { unlock(); ctx.rerender(); } else bad();
        }).catch(bad);
      });
      root.appendChild(form);
      root.appendChild(h('p', null, h('a', { href: '#' }, 'Back to the terminal')));
      return root;
    }

    var store = ctx.store, s = store.state;
    function act(label, fn) {
      fn(s); store.save(); ctx.rerender();
      setTimeout(function () { var f = g.document.getElementById('org-flash'); if (f) { ui.clear(f); f.appendChild(ui.notice('ok', 'DONE', h('p', { style: 'margin:0' }, label))); } }, 0);
    }

    root.appendChild(h('h1', { tabindex: '-1' }, 'ORGANIZER PANEL'));
    root.appendChild(h('p', null, h('a', { href: '#' }, '← Back to the terminal'), ' · ', h('a', { href: '#admin' }, 'Admin (rescue links, answers, bot status) ›')));
    root.appendChild(h('p.muted', null, 'Everything here affects only THIS device’s browser. Brian’s progress lives on his device.'));
    root.appendChild(h('div', { id: 'org-flash', 'aria-live': 'polite' }));

    // ---- Progress ----
    var w = S.where(s);
    root.appendChild(h('h2', null, 'PROGRESS ON THIS DEVICE'));
    root.appendChild(h('pre.readout', null,
      'NOW: ' + (w.kind === 'step' ? w.day.toUpperCase() + ' · ' + (STEP_NAMES[w.step] || w.step) : w.kind === 'locked' ? w.day.toUpperCase() + ' (waiting for 8am)' : w.kind.toUpperCase()) + '\n' +
      'THURSDAY TRICK: ' + (s.puzzles.fri.exploit || '—') + '\n' +
      'FINALE: ' + (s.finale.completed ? 'COMPLETE' : s.finale.organizerTriggered ? 'LIVE (step: ' + s.finale.step + ')' : 'not started') + '\n' +
      'LAST SAVED: ' + (s.updatedAt ? new Date(s.updatedAt).toLocaleString() : 'never')));

    var tbody = h('tbody');
    S.DAYS.forEach(function (d, i) {
      var gate = new Date(S.gateTime(d.id));
      var open = S.unlocked(s, d.id);
      var steps = d.steps.map(function (st) { return (S.stepDone(s, st) ? '✓ ' : s.done[st] ? '◐ ' : '☐ ') + (STEP_NAMES[st] || st); }).join('\n');
      var complete = h('button', { type: 'button', disabled: S.dayDone(s, d.id) }, 'Mark complete');
      complete.addEventListener('click', function () { act(d.title + ' marked complete.', function (x) { S.markDayComplete(x, d.id); }); });
      var reset = h('button.quiet', { type: 'button' }, 'Reset');
      reset.addEventListener('click', function () { act(d.title + ' reset.', function (x) { S.resetDay(x, d.id); }); });
      var override = h('button.quiet', { type: 'button' }, s.overrides[d.id] ? 'Re-lock to 8am' : 'Unlock now');
      override.addEventListener('click', function () { act(d.title + (s.overrides[d.id] ? ' back on its 8am gate.' : ' unlocked early.'), function (x) { x.overrides[d.id] = !x.overrides[d.id]; }); });
      tbody.appendChild(h('tr', null,
        h('td', null, h('strong', null, (i + 1) + '. ' + d.id.toUpperCase() + ' · ' + d.title), h('br'),
          h('span.muted', null, 'Opens ' + gate.toLocaleString([], { weekday: 'short', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }) + (open ? ' · OPEN' : ' · locked') + (s.overrides[d.id] ? ' (override)' : '')),
          h('pre', { style: 'margin:0.4rem 0 0;font-family:var(--mono);font-size:0.85rem;white-space:pre-wrap' }, steps)),
        h('td', null, complete, ' ', override, ' ', reset)));
    });
    root.appendChild(h('table.org-table', null, tbody));

    // ---- Email words ----
    root.appendChild(h('h2', null, 'EMAIL WORDS'));
    root.appendChild(h('p', null, 'LEGACY’s auto-replies give Brian these words to type into the terminal. They must match apps-script/Phase3.gs.'));
    root.appendChild(h('pre.readout', null, Object.keys(cfg.emailWords).map(function (k) { return k.toUpperCase() + '  ' + cfg.emailWords[k] + (k === 'fri' ? '   (arrives in his style: VERIFIED / V3R1F13D / V E R I F I E D / hex)' : ''); }).join('\n')));
    root.appendChild(ui.notice('info', 'IF THE EMAIL BOT BREAKS', h('p', { style: 'margin:0' }, 'Text Brian “' + cfg.rescueWord + '”. Every email step accepts it.')));

    // ---- Finale ----
    root.appendChild(h('h2', null, 'LIVE FINALE'));
    root.appendChild(h('p', null, 'The finale starts only from here. On your phone: “Set this device to FINALE READY”, then “Begin live finale”.'));
    var ready = S.remoteComplete(s);
    var setReady = h('button', { type: 'button', disabled: ready }, 'Set this device to FINALE READY');
    setReady.addEventListener('click', function () { act('Every day marked complete on this device.', S.setFinaleReady); });
    var begin = h('button.primary', { type: 'button', disabled: !ready || s.finale.organizerTriggered || s.finale.completed }, 'Begin live finale');
    begin.addEventListener('click', function () { S.triggerFinale(s); store.save(); g.location.hash = ''; });
    var preview = h('button', { type: 'button' }, 'Preview finale (nothing saved)');
    preview.addEventListener('click', function () { g.location.hash = '#finale-preview'; });
    var resetF = h('button.quiet', { type: 'button' }, 'Reset finale');
    resetF.addEventListener('click', function () { act('Finale reset to not started.', S.resetFinale); });
    root.appendChild(h('div.actions', null, setReady, begin, preview, resetF));
    var mode = h('button', { type: 'button' }, s.finale.classic ? 'Mode: CLASSIC buttons (switch to BOP IT stage)' : 'Mode: BOP IT stage (switch to classic buttons)');
    mode.addEventListener('click', function () { act(s.finale.classic ? 'Finale mode: BOP IT stage.' : 'Finale mode: classic buttons.', function (st) { st.finale.classic = !st.finale.classic; }); });
    var easy = h('button', { type: 'button' }, s.finale.easy ? 'Timing: EASY (switch to normal)' : 'Timing: NORMAL (switch to easy)');
    easy.addEventListener('click', function () { act('Timing changed.', function (st) { st.finale.easy = !st.finale.easy; }); });
    root.appendChild(h('div.actions', null, mode, easy));

    // ---- Boss song (round 5): stored on THIS device only, never uploaded ----
    root.appendChild(h('h2', null, 'BOSS SONG (ROUND 5)'));
    root.appendChild(h('p', null, 'Load the Confidence Man MP3 here, on the phone that will run the finale. It’s saved inside this browser (not on the website), so it plays offline in the car. Without it, round 5 uses his own track.'));
    var bossStatus = h('p', { 'aria-live': 'polite', style: 'font-family:var(--mono)' }, 'Checking…');
    var bossFile = h('input', { type: 'file', accept: 'audio/*', id: 'boss-file' });
    var bossBpm = h('input', { type: 'number', id: 'boss-bpm', inputmode: 'decimal', step: '0.1', placeholder: 'BPM e.g. 140', style: 'max-width:9rem' });
    var bossOff = h('input', { type: 'number', id: 'boss-off', inputmode: 'decimal', step: '0.01', placeholder: 'first beat (sec)', style: 'max-width:9rem' });
    var bossSave = h('button.primary', { type: 'button' }, 'Save boss song');
    var bossClear = h('button.quiet', { type: 'button' }, 'Remove');
    function bossRefresh() { L.songStore.load().then(function (r) { bossStatus.textContent = r ? '✓ Saved on this device: ' + r.name + ' (' + (r.size / 1048576).toFixed(1) + ' MB) · ' + r.bpm + ' BPM · first beat at ' + r.offset + ' s' : 'Not loaded on this device.'; if (r) { bossBpm.value = r.bpm; bossOff.value = r.offset; } }); }
    bossSave.addEventListener('click', function () {
      var bpm = parseFloat(bossBpm.value), off = parseFloat(bossOff.value) || 0, file = bossFile.files && bossFile.files[0];
      if (!(bpm >= 60 && bpm <= 200)) { bossStatus.textContent = 'Enter the song’s BPM (60–200).'; return; }
      bossStatus.textContent = 'Saving…';
      (file ? L.songStore.save(file, bpm, off) : L.songStore.setMap(bpm, off)).then(bossRefresh).catch(function (e) { bossStatus.textContent = 'Could not save: ' + e; });
    });
    bossClear.addEventListener('click', function () { L.songStore.clear().then(bossRefresh); });
    root.appendChild(h('div.actions', null, h('label', { for: 'boss-file' }, 'MP3 '), bossFile));
    root.appendChild(h('div.actions', null, h('label', { for: 'boss-bpm' }, 'BPM '), bossBpm, h('label', { for: 'boss-off' }, ' First downbeat (s) '), bossOff));
    root.appendChild(h('div.actions', null, bossSave, bossClear));
    root.appendChild(bossStatus);
    if (L.songStore) bossRefresh(); else bossStatus.textContent = 'Song storage unavailable in this browser.';

    // ---- Transfer ----
    root.appendChild(h('h2', null, 'TRANSFER PROGRESS (OPTIONAL)'));
    root.appendChild(h('p', null, 'Export on one device, paste and Import on the other. Import replaces this device’s progress.'));
    var codeBox = h('textarea.plain', { id: 'xfer', 'aria-label': 'Transfer code', spellcheck: 'false' });
    var exp = h('button', { type: 'button' }, 'Export this device');
    exp.addEventListener('click', function () { codeBox.value = S.exportCode(s); codeBox.select(); });
    var imp = h('button', { type: 'button' }, 'Import code');
    var xmsg = h('div', { 'aria-live': 'polite' });
    imp.addEventListener('click', function () {
      try { store.replace(S.importCode(codeBox.value)); ctx.rerender(); }
      catch (e) { ui.clear(xmsg); xmsg.appendChild(ui.notice('bad', 'IMPORT FAILED', h('p', { style: 'margin:0' }, e.message || 'The code could not be read.'))); }
    });
    root.appendChild(codeBox);
    root.appendChild(h('div.actions', null, exp, imp));
    root.appendChild(xmsg);

    // ---- Script preview ----
    root.appendChild(h('h2', null, 'SCRIPT PREVIEW'));
    Object.keys(C.scenes).forEach(function (k) { root.appendChild(ui.details('Scene: ' + k, C.scenes[k].map(ui.renderBeat))); });

    // ---- Full reset ----
    root.appendChild(h('h2', null, 'RESET EVERYTHING'));
    var full = h('button.quiet', { type: 'button' }, 'Reset the full game on this device');
    var fmsg = h('div');
    full.addEventListener('click', function () {
      ui.clear(fmsg);
      var yes = h('button', { type: 'button' }, 'Yes, erase all progress');
      var no = h('button.quiet', { type: 'button' }, 'Cancel');
      yes.addEventListener('click', function () { store.replace(S.defaults()); ctx.rerender(); });
      no.addEventListener('click', function () { ui.clear(fmsg); });
      fmsg.appendChild(ui.notice('info', 'ARE YOU SURE?', [h('p', null, 'This erases all progress on this device.'), h('div.actions', null, yes, no)]));
      yes.focus();
    });
    root.appendChild(full);
    root.appendChild(fmsg);
    return root;
  }

  L.organizer = { render: render, isUnlocked: isUnlocked };
})(globalThis);
