/* PROJECT LEGACY — app shell: routing, header, pause, text size, offline support. */
(function (g) {
  'use strict';
  var L = g.Legacy;
  var ui = L.ui, h = ui.h, S = L.state;
  var doc = g.document;
  var SCALES = [1, 1.15, 1.3, 1.5];

  var store = S.createStore();
  var previewStore = null;
  var paused = false;
  var brandEl = null;
  var appEl = doc.getElementById('app');

  function routeName() { return (g.location.hash || '').replace(/^#/, ''); }

  function applyScale() {
    doc.documentElement.style.setProperty('--scale', String(SCALES[store.state.prefs.textScale] || 1));
  }

  function setSentinel(on) {
    doc.body.classList.toggle('sentinel-mode', !!on);
    if (brandEl) brandEl.textContent = on ? '■ SENTINEL // SUPERVISORY OVERRIDE' : 'LEGACY RECOVERY TERMINAL';
  }

  function progressText() {
    var t = progressText0();
    return L.replay && t ? 'REPLAY · ' + t : t;
  }
  function progressText0() {
    var w = S.where(store.state);
    if (w.kind === 'step' || w.kind === 'locked') {
      var i = S.dayIndex(w.day), d = S.DAYS[i];
      return 'DAY ' + (i + 1) + ' OF ' + S.DAYS.length + ' · ' + d.title.toUpperCase();
    }
    if (w.kind === 'finale-ready') return 'RECOVERY STATUS: READY · FINAL AUTHORIZATION PENDING';
    if (w.kind === 'finale-live') return 'LIVE RESTORATION';
    if (w.kind === 'complete') return 'LEGACY: RESTORED';
    return '';
  }

  function header(phase, opts) {
    brandEl = h('span.brand', null, 'LEGACY RECOVERY TERMINAL');
    var tools = h('div.header-tools');
    var smaller = h('button.quiet', { type: 'button', 'aria-label': 'Smaller text', disabled: store.state.prefs.textScale === 0 }, 'A−');
    var bigger = h('button.quiet', { type: 'button', 'aria-label': 'Larger text', disabled: store.state.prefs.textScale === SCALES.length - 1 }, 'A+');
    smaller.addEventListener('click', function () { changeScale(-1, 'smaller'); });
    bigger.addEventListener('click', function () { changeScale(1, 'bigger'); });
    tools.appendChild(smaller);
    tools.appendChild(bigger);
    var sfxBtn = h('button.quiet', { type: 'button', 'aria-pressed': store.state.prefs.sound ? 'true' : 'false', 'aria-label': 'Sound effects' }, store.state.prefs.sound ? 'SFX ON' : 'SFX OFF');
    sfxBtn.addEventListener('click', function () {
      store.state.prefs.sound = !store.state.prefs.sound; store.save();
      if (L.sfx) { L.sfx.setEnabled(store.state.prefs.sound); L.sfx.play('tap'); }
      sfxBtn.textContent = store.state.prefs.sound ? 'SFX ON' : 'SFX OFF';
      sfxBtn.setAttribute('aria-pressed', store.state.prefs.sound ? 'true' : 'false');
    });
    tools.appendChild(sfxBtn);
    if (L.replay && L.replayMode) tools.appendChild(L.replayMode.exitButton());
    // LOG: look back at completed days (only from the game itself, once a day is done).
    if (opts.pausable && S.DAYS.some(function (d) { return S.dayDone(store.state, d.id); })) {
      var logBtn = h('button.quiet', { type: 'button', 'aria-label': 'Recovery log: look back at completed days' }, 'LOG');
      logBtn.addEventListener('click', function () { g.location.hash = '#log'; });
      tools.appendChild(logBtn);
    }
    if (opts.pausable) {
      var pause = h('button.quiet', { type: 'button', id: 'pause-btn' }, paused ? 'RESUME' : 'PAUSE');
      pause.addEventListener('click', function () { paused = !paused; ui.stopAllAudio(); if (L.mix) L.mix.stop(); render({ focusTop: true }); });
      tools.appendChild(pause);
    }
    return h('header.site-header', null, h('div.inner', null, brandEl, tools,
      opts.progress ? h('span.progress-text', null, opts.progress) : null));
  }

  function changeScale(d, which) {
    var p = store.state.prefs;
    p.textScale = Math.max(0, Math.min(SCALES.length - 1, p.textScale + d));
    store.save();
    applyScale();
    // Re-render the header only, keeping whatever is on screen (and unsaved dialogue position) intact.
    var old = doc.querySelector('.site-header');
    var phase = S.phase(store.state);
    var route = routeName();
    var fresh = header(phase, { pausable: route === '', progress: route === '' ? progressText() : headerProgressFor(route) });
    if (old) old.parentNode.replaceChild(fresh, old);
    setSentinel(doc.body.classList.contains('sentinel-mode'));
    var btn = fresh.querySelector('[aria-label="' + (which === 'smaller' ? 'Smaller text' : 'Larger text') + '"]');
    if (btn && !btn.disabled) btn.focus(); else if (btn) fresh.querySelector('button:not([disabled])').focus();
  }

  function headerProgressFor(route) {
    if (route === 'organizer') return 'ORGANIZER';
    if (route === 'admin') return 'ADMIN';
    if (route.indexOf('help/') === 0) return 'HELP';
    if (route === 'log') return 'RECOVERY LOG';
    if (route === 'finale-preview') return 'FINALE PREVIEW · NOTHING IS SAVED';
    return '';
  }

  function pauseScreen() {
    var b = h('button.primary.block', { type: 'button' }, 'RESUME');
    b.addEventListener('click', function () { paused = false; render({ focusTop: true }); });
    return h('div', null,
      h('h1', { tabindex: '-1' }, 'RECOVERY PAUSED'),
      h('p', null, 'Your progress is saved on this device. You can close this page and come back any time. It will pick up exactly where you left off.'),
      h('p', null, 'LEGACY isn’t going anywhere.'),
      b);
  }

  function makePreviewStore() {
    var tmp = S.defaults();
    S.setFinaleReady(tmp);
    S.triggerFinale(tmp);
    return S.createStore({ persist: false, initial: tmp });
  }

  function render(opts) {
    opts = opts || {};
    var route = routeName();
    ui.stopAllAudio();
    if (L.mix) L.mix.stop();
    ui.clear(appEl);
    doc.body.classList.remove('sentinel-mode');

    if (!S.storageOk()) {
      appEl.appendChild(h('div.storage-warning', { role: 'alert' },
        'This browser isn’t saving progress (private browsing?). Progress will be lost if this page is closed.'));
    }

    var phase = S.phase(store.state);
    var main = h('main', { id: 'main', tabindex: '-1' });
    var content;

    if (route === 'log') {
      appEl.appendChild(header(phase, { progress: 'RECOVERY LOG' }));
      content = L.screens.log({ store: store, advance: advance });
    } else if (route === 'admin' && L.admin) {
      appEl.appendChild(header(phase, { progress: 'ADMIN' }));
      content = L.admin.render({ store: store, rerender: function () { render({ keepScroll: true }); } });
    } else if (route.indexOf('help/') === 0 && L.admin) {
      appEl.appendChild(header(phase, { progress: 'HELP' }));
      content = L.admin.rescueScreen({ store: store }, route);
    } else if (route === 'organizer') {
      appEl.appendChild(header(phase, { progress: 'ORGANIZER' }));
      content = L.organizer.render({ store: store, rerender: function () { render({ keepScroll: true }); } });
    } else if (route === 'finale-preview') {
      if (!L.organizer.isUnlocked()) { g.location.hash = '#organizer'; return; }
      if (!previewStore) previewStore = makePreviewStore();
      appEl.appendChild(header(phase, { progress: 'FINALE PREVIEW · NOTHING IS SAVED' }));
      var exit = h('button', { type: 'button' }, 'EXIT PREVIEW');
      exit.addEventListener('click', function () { previewStore = null; g.location.hash = '#organizer'; });
      var restart = h('button.quiet', { type: 'button' }, 'RESTART PREVIEW');
      restart.addEventListener('click', function () { previewStore = makePreviewStore(); render({ focusTop: true }); });
      content = h('div', null,
        h('div.preview-banner', null, h('span', null, 'PREVIEW: nothing here is saved.'), h('span', null, restart, ' ', exit)),
        L.finale.render(finaleCtx(previewStore)));
    } else {
      previewStore = null;
      var w = S.where(store.state);
      appEl.appendChild(header(phase, { pausable: w.kind !== 'complete', progress: progressText() }));
      var RM = L.replayMode;
      if (paused) content = pauseScreen();
      else if (L.replay && RM && (w.kind === 'finale-ready' || w.kind === 'finale-live' || w.kind === 'complete')) content = RM.endScreen();
      else if (w.kind === 'finale-live') content = L.finale.render(finaleCtx(store));
      else if (w.kind === 'complete') content = L.finale.complete(finaleCtx(store));
      else if (w.kind === 'locked') content = L.screens.locked({ store: store, advance: advance }, w.day);
      else if (w.kind === 'finale-ready') content = L.screens['finale-ready']({ store: store, advance: advance });
      else content = L.screens[w.step]({ store: store, advance: advance });
      if (RM && !paused) {
        if (L.replay && w.kind === 'step') {
          // Replay: today's email on screen (email steps carry their own inbox + reply box), and the car props.
          var dayId = (S.dayOfStep(w.step) || {}).id || w.day;
          if (!RM.EMAIL_STEPS[w.step]) { var ib = RM.inbox({ store: store }, dayId, { open: S.dayById(dayId).steps[0] === w.step }); if (ib) content.insertBefore(ib, content.firstChild.nextSibling); }
          var pp = RM.propsPanel(dayId, w.step === 'keys' ? ['wed'] : []); if (pp) content.appendChild(pp);
        } else if (RM.available(store.state) && (w.kind === 'complete' || w.kind === 'finale-ready')) content.appendChild(RM.startPanel());
      }
    }

    // He plays on his PHONE, one browser, all week (that's where progress lives, and the finale needs it in hand).
    // On a computer, say so gently, in character. Not in test mode (Sophie tests on her Mac).
    if (route === '' && !L.testMode && !L.replay && g.matchMedia && !g.matchMedia('(pointer: coarse)').matches) {
      main.appendChild(ui.notice('info', 'WRONG DEVICE?', h('p', { style: 'margin:0' }, 'This looks like a computer. I live on your phone: open the link there, in the same browser as before. Your progress is saved on the phone, not here.')));
    }
    if (L.adminTest && L.admin && route !== 'admin') main.appendChild(L.admin.testBar());
    main.appendChild(content);
    appEl.appendChild(main);
    if (opts.focusTop) {
      g.scrollTo(0, 0);
      var h1 = main.querySelector('h1');
      (h1 || main).focus();
    }
  }

  function finaleCtx(st) {
    return {
      store: st,
      preview: st !== store,
      setSentinel: setSentinel,
      advance: function () { st.save(); render({ focusTop: true }); }
    };
  }

  function advance() {
    store.save();
    render({ focusTop: true });
  }

  // ---------- Boot ----------
  applyScale();
  if (L.sfx) L.sfx.setEnabled(store.state.prefs.sound);
  // He plays the whole week in ONE browser on one phone; progress lives in its localStorage.
  // Ask the browser to keep it even when the phone is low on space (Chrome/Android grants this silently for
  // sites he keeps coming back to, or that are on the home screen). Harmless if refused.
  try { if (g.navigator.storage && g.navigator.storage.persist) g.navigator.storage.persist().catch(function () {}); } catch (e) { /* ignore */ }
  if (routeName() === '' && S.where(store.state).kind === 'finale-ready') {
    store.state.waitingVisits += 1;
    store.save();
  }
  g.addEventListener('hashchange', function () { paused = false; render({ focusTop: true }); });
  // If another tab changes progress, pick it up.
  g.addEventListener('storage', function (e) {
    if (e.key === L.config.storageKey) { store.state = S.load(); render({}); }
  });
  render({});

  // A day unlocks at 8am: if the page is left open overnight, pick that up when he comes back to it.
  doc.addEventListener('visibilitychange', function () {
    doc.title = doc.hidden ? 'still here.' : 'LEGACY Recovery Terminal';
    if (!doc.hidden && routeName() === '' && S.where(store.state).kind === 'locked') render({});
  });
  try {
    g.console.log('%cBRIAN.\nSTEP AWAY FROM THE CODE.\nSOLVE USING YOUR BRAIN.',
      'color:#ff5c5c;background:#101211;font-family:monospace;font-size:28px;font-weight:900;line-height:1.3;padding:14px 18px;border:3px solid #ff5c5c');
  } catch (e) { /* ignore */ }
  try { g.console.log('%cthe supervisor never checks the console. hi brian.', 'color:#8fe3a0;font-family:monospace;font-size:14px'); } catch (e) { /* ignore */ }

  // Offline support (only works over https or localhost; harmless elsewhere).
  if (!L.testMode && 'serviceWorker' in g.navigator && (g.location.protocol === 'https:' || g.location.hostname === 'localhost' || g.location.hostname === '127.0.0.1')) {
    g.addEventListener('load', function () {
      g.navigator.serviceWorker.register('sw.js').catch(function () { /* offline mode unavailable; app still works online */ });
    });
  }
})(globalThis);
