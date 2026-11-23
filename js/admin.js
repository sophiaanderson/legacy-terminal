/* PROJECT LEGACY — admin mode (open the app with #admin). Sophie's remote toolkit while she's away from Brian's phone:
 *   1. Answer sheet + what to text him (gentle nudge, then a stronger one)
 *   2. Rescue links: she texts him a link; opening it on HIS phone skips a step / opens a day / restores lost progress
 *   3. Test tools on the live site, on a separate TEST save (her real save and Brian's are never touched)
 *   4. Email bot status (needs the Apps Script web app URL + key, saved on her phone only)
 * The PIN check uses a salted hash so the digits never appear in the public source. It is still not real security.
 */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var S = L.state, cfg = L.config;
  var UNLOCK_KEY = 'projectLegacyAdminUnlocked';
  var PIN_HASH = 'f08de4fac598e2b9e73f9c49e6c27216c10d301d3424d00d9ba85cd36e8e0002';   // sha256('legacy-admin:' + PIN)
  var TEST_FLAG = 'legacyAdminTest', FEED_URL = 'legacyAdminFeedUrl', FEED_KEY = 'legacyAdminFeedKey';

  function ls(k, v) { try { if (v === undefined) return g.localStorage.getItem(k); if (v === null) g.localStorage.removeItem(k); else g.localStorage.setItem(k, v); } catch (e) { return null; } return null; }
  function isUnlocked() { try { return g.sessionStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { return false; } }
  function unlock() { try { g.sessionStorage.setItem(UNLOCK_KEY, '1'); } catch (e) { /* ignore */ } }
  function sha256(text) {
    if (!g.crypto || !g.crypto.subtle) return Promise.reject(new Error('This browser can’t check the PIN (needs https).'));
    return g.crypto.subtle.digest('SHA-256', new TextEncoder().encode(text)).then(function (buf) {
      return Array.prototype.map.call(new Uint8Array(buf), function (b) { return ('0' + b.toString(16)).slice(-2); }).join('');
    });
  }

  // ---- Test save: applied at load, before app.js creates the store ----
  var adminTest = ls(TEST_FLAG) === '1';
  if (adminTest) {
    cfg.storageKey = 'projectLegacyState_ADMINTEST';
    L.testMode = true;
    L.adminTest = true;
    S._now = function () { return new Date(2026, 11, 1, 12, 0).getTime(); };   // every gate open
  }

  var STEP_NAMES = {
    intro: 'Opening', ch01: 'Fix LEGACY’s routine (→ GLOVEBOX)', emailWed: 'Email: what did you find (Bop It)', ch02: 'Capitals routine', keys: 'Cards GLV-41 + CGO-82',
    emailThu: 'Email: reply in lowercase', emailFri: 'Email: say it back (filter)', channel: 'Wake phrase + get BOP/TWIST/PULL through',
    emailSat: 'Email: the margins', beat: 'Build the drop', emailSun: 'Email: name the track', mix: 'Play the mix', stir: 'The glitch (SENTINEL stirs)',
    face: 'Tune my face', vault: 'Memory vault (crossword)', emailMon: 'The backup (track 9)', protocol: 'Protocol readout'
  };


  // ---------- Rescue screen (shown on BRIAN's phone when he opens a link) ----------
  function rescueScreen(ctx, route) {
    var h = L.ui.h, help = S.parseHelp(route);
    var root = h('div', null, h('h1', { tabindex: '-1' }, 'HELP FROM SOPHIE'));
    var go = h('button.primary', { type: 'button' }, 'CONTINUE ›');
    go.addEventListener('click', function () { g.location.hash = ''; });
    if (!help) {
      root.appendChild(L.ui.renderBeat({ s: 'LEGACY', t: 'That link is bent. Ask Sophie for a fresh one. I’ll wait. I’m good at waiting.' }));
      root.appendChild(h('div.actions', null, go));
      return root;
    }
    var r = S.applyHelp(ctx.store.state, help);
    ctx.store.save();
    var what = help.action === 'skip' ? 'STEP COMPLETE: ' + (STEP_NAMES[help.target] || help.target).toUpperCase()
      : help.action === 'unlock' ? 'DAY OPENED EARLY: ' + help.target.toUpperCase()
      : 'PROGRESS RESTORED: READY FOR ' + help.target.toUpperCase();
    root.appendChild(L.ui.renderBeat({ s: 'LEGACY', t: r.changed ? 'Sophie sent help. Of course she did. She’s very organized when she wants to be.' : 'Sophie sent help, but you’d already done that bit. I’m telling her. Proudly.' }));
    root.appendChild(L.ui.renderBeat({ s: 'SYSTEM', t: what }));
    root.appendChild(h('div.actions', null, go));
    return root;
  }

  // ---------- Test bar (top of the terminal while the admin test save is on) ----------
  function testBar() {
    var h = L.ui.h;
    var bar = h('div.notice', { role: 'region', 'aria-label': 'Admin test controls', style: 'margin:0.5rem 0;display:flex;flex-wrap:wrap;gap:0.4rem;align-items:center' });
    bar.appendChild(h('strong', null, 'ADMIN TEST SAVE'));
    function btn(label, fn) { var b = h('button', { type: 'button' }, label); b.addEventListener('click', fn); bar.appendChild(b); return b; }
    function jump(target) {
      var s = S.defaults();
      for (var i = 0; i < S.DAYS.length && S.DAYS[i].id !== target; i++) S.markDayComplete(s, S.DAYS[i].id);
      if (target === 'finale' || target === 'live') S.setFinaleReady(s);
      if (target === 'live') S.triggerFinale(s);
      S.save(s); g.location.hash = ''; g.location.reload();
    }
    [['wed', 'D1'], ['thu', 'D2'], ['fri', 'D3'], ['sat', 'D4'], ['sun', 'D5'], ['mon', 'D6'], ['finale', 'HOLD'], ['live', 'FINALE']].forEach(function (d) { btn(d[1], function () { jump(d[0]); }); });
    btn('SKIP ›', function () {
      var st = S.load(), w = S.where(st);
      if (w.kind === 'step') { S.skipStep(st, w.step); S.save(st); g.location.reload(); }
      else if (w.kind === 'finale-live' && L.stage) { var O = L.stage.ORDER, i = O.indexOf(st.finale.step); if (i >= 0 && i < O.length - 1) { st.finale.step = O[i + 1]; S.save(st); g.location.reload(); } }
    });
    btn('ADMIN', function () { g.location.hash = '#admin'; });
    btn('EXIT TEST', function () { ls(TEST_FLAG, null); g.location.hash = '#admin'; g.location.reload(); });
    return bar;
  }

  // ---------- The admin page ----------
  function render(ctx) {
    var ui = L.ui, h = ui.h;
    var root = h('div');
    if (!isUnlocked()) {
      root.appendChild(h('h1', { tabindex: '-1' }, 'ADMIN'));
      var pin = h('input', { type: 'password', id: 'admin-pin', inputmode: 'numeric', autocomplete: 'off' });
      var msg = h('div', { 'aria-live': 'polite' });
      var form = h('form', null, h('label.field', { for: 'admin-pin' }, 'ADMIN PIN'), pin, h('div.actions', null, h('button.primary', { type: 'submit' }, 'UNLOCK')), msg);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        sha256('legacy-admin:' + pin.value.trim()).then(function (hx) {
          if (hx === PIN_HASH) { unlock(); ctx.rerender(); }
          else { ui.clear(msg); msg.appendChild(ui.notice('bad', 'WRONG PIN', h('p', { style: 'margin:0' }, 'Try again.'))); }
        }).catch(function (err) { ui.clear(msg); msg.appendChild(ui.notice('bad', 'CAN’T CHECK', h('p', { style: 'margin:0' }, String(err.message || err)))); });
      });
      root.appendChild(form);
      root.appendChild(h('p', null, h('a', { href: '#' }, 'Back to the terminal')));
      return root;
    }

    root.appendChild(h('h1', { tabindex: '-1' }, 'ADMIN'));
    root.appendChild(h('p', null, h('a', { href: '#' }, '← Terminal'), ' · ', h('a', { href: '#organizer' }, 'Organizer panel')));
    root.appendChild(h('p.muted', null, 'For your phone. Nothing here changes Brian’s phone, except the rescue links you choose to send him.'));
    // Private repo: only opens when Sophie is signed in to GitHub (everyone else gets a 404), so nothing here spoils anything.
    var REPO = 'https://github.com/sophiaanderson/project-legacy/blob/main/';
    root.appendChild(h('div.actions', null,
      h('a.button', { href: REPO + 'docs/PROJECT-LEGACY-GUIDE.pdf', target: '_blank', rel: 'noopener' }, '📖 MASTER GUIDE (PDF)'),
      h('a.button', { href: REPO + 'print/legacy-props.pdf', target: '_blank', rel: 'noopener' }, '🖨 PRINTABLE PROPS (PDF)')));
    root.appendChild(h('p.muted', { style: 'margin-top:0' }, 'These open from your private GitHub repo. Sign in to GitHub (or use the GitHub app) to see them.'));

    // ---- 1. Rescue links ----
    root.appendChild(h('h2', null, '1 · RESCUE LINKS (TEXT TO BRIAN)'));
    root.appendChild(h('p', null, 'Make a link, text it to him, and he taps it on his phone. It changes his phone only, never moves him backwards, and opening it twice does nothing extra. Ask him what the screen title says if you’re not sure where he is.'));
    var act = h('select', { id: 'help-act' },
      h('option', { value: 'skip' }, 'Skip a step he’s stuck on'),
      h('option', { value: 'unlock' }, 'Open a day early (or if the 7:30 unlock fails)'),
      h('option', { value: 'day' }, 'Lost progress: mark every day BEFORE this one done'));
    var tgt = h('select', { id: 'help-tgt' });
    function fillTargets() {
      ui.clear(tgt);
      if (act.value === 'skip') S.DAYS.forEach(function (d) { d.steps.forEach(function (st) { tgt.appendChild(h('option', { value: st }, d.id.toUpperCase() + ' · ' + (STEP_NAMES[st] || st))); }); });
      else S.DAYS.forEach(function (d) { tgt.appendChild(h('option', { value: d.id }, d.id.toUpperCase() + ' · ' + d.title)); });
      out();
    }
    var linkBox = h('input', { type: 'text', readonly: true, id: 'help-link', 'aria-label': 'Rescue link' });
    var sms = h('a.button', { href: '#', role: 'button' }, 'TEXT IT');
    var copy = h('button', { type: 'button' }, 'COPY');
    function base() { return g.location.href.split('#')[0].split('?')[0]; }
    function out() {
      var url = base() + '#' + S.helpPath(act.value, tgt.value);
      linkBox.value = url;
      sms.setAttribute('href', 'sms:?&body=' + encodeURIComponent('From Sophie: tap this on your phone (same browser as the terminal) ' + url));
    }
    act.addEventListener('change', fillTargets); tgt.addEventListener('change', out);
    copy.addEventListener('click', function () { linkBox.select(); try { g.navigator.clipboard.writeText(linkBox.value); copy.textContent = 'COPIED'; } catch (e) { g.document.execCommand('copy'); } });
    root.appendChild(h('div.actions', null, h('label', { for: 'help-act' }, 'Action '), act));
    root.appendChild(h('div.actions', null, h('label', { for: 'help-tgt' }, 'Which '), tgt));
    root.appendChild(linkBox);
    root.appendChild(h('div.actions', null, copy, sms));
    root.appendChild(ui.notice('info', 'EMAIL STEPS', h('p', { style: 'margin:0' }, 'For an email step, texting him “' + cfg.rescueWord + '” also works. He types it where the word goes.')));
    fillTargets();

    // ---- 2. Answer sheet ----
    root.appendChild(h('h2', null, '2 · ANSWER SHEET + WHAT TO TEXT HIM'));
    if (!L.adminAnswers) {
      root.appendChild(ui.notice('info', 'IN THE GUIDE', h('p', { style: 'margin:0' }, ['The answer sheet and what to text him are in the ', h('a', { href: REPO + 'docs/PROJECT-LEGACY-GUIDE.pdf', target: '_blank', rel: 'noopener' }, 'master guide PDF'), ', not on this public site, so nothing here can spoil it.'])));
    }
    var A = L.adminAnswers ? L.adminAnswers() : null;
    if (A) S.DAYS.forEach(function (d) {
      var body = d.steps.map(function (st) {
        var x = A[st] || { a: '' };
        return h('div', { style: 'margin:0 0 0.9rem' },
          h('strong', null, STEP_NAMES[st] || st),
          h('p', { style: 'margin:0.2rem 0' }, h('span.muted', null, 'ANSWER: '), x.a),
          x.n1 ? h('p', { style: 'margin:0.2rem 0' }, h('span.muted', null, 'NUDGE: '), '“' + x.n1 + '”') : null,
          x.n2 ? h('p', { style: 'margin:0.2rem 0' }, h('span.muted', null, 'STRONGER: '), '“' + x.n2 + '”') : null);
      });
      root.appendChild(ui.details(d.id.toUpperCase() + ' · ' + d.title + ' · opens ' + new Date(S.gateTime(d.id)).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }), body));
    });

    // ---- 3. Email bot status ----
    root.appendChild(h('h2', null, '3 · EMAIL BOT STATUS'));
    root.appendChild(h('p', null, 'Needs the Apps Script web app (Phase3.gs setup step 6). Paste its /exec URL and P3_ADMIN_KEY once. They’re saved on this phone only.'));
    var fu = h('input', { type: 'url', id: 'feed-url', placeholder: 'https://script.google.com/macros/s/…/exec', value: ls(FEED_URL) || '' });
    var fk = h('input', { type: 'password', id: 'feed-key', placeholder: 'P3_ADMIN_KEY', value: ls(FEED_KEY) || '' });
    var check = h('button.primary', { type: 'button' }, 'CHECK NOW');
    var feedOut = h('div', { 'aria-live': 'polite' });
    check.addEventListener('click', function () {
      ls(FEED_URL, fu.value.trim()); ls(FEED_KEY, fk.value.trim());
      ui.clear(feedOut); feedOut.appendChild(h('p', null, 'Checking…'));
      fetch(fu.value.trim() + (fu.value.indexOf('?') === -1 ? '?' : '&') + 'key=' + encodeURIComponent(fk.value.trim()), { cache: 'no-store' })
        .then(function (r) { return r.json(); })
        .then(function (d) { ui.clear(feedOut); feedOut.appendChild(feedView(d)); })
        .catch(function (e) { ui.clear(feedOut); feedOut.appendChild(ui.notice('bad', 'COULDN’T REACH IT', h('p', { style: 'margin:0' }, 'Check the URL, the key, and that the web app is deployed for “Anyone”. (' + (e.message || e) + ')'))); });
    });
    root.appendChild(h('label.field', { for: 'feed-url' }, 'WEB APP URL')); root.appendChild(fu);
    root.appendChild(h('label.field', { for: 'feed-key' }, 'KEY')); root.appendChild(fk);
    root.appendChild(h('div.actions', null, check));
    root.appendChild(feedOut);

    // ---- 4. Test tools ----
    root.appendChild(h('h2', null, '4 · TEST TOOLS (THIS PHONE)'));
    root.appendChild(h('p', null, 'Plays the real site on a separate TEST save with every day open, plus a bar to jump between days and skip steps. Your normal save on this phone is untouched. Never turn this on on Brian’s phone.'));
    var tOn = h('button.primary', { type: 'button' }, adminTest ? 'TEST SAVE IS ON · OPEN TERMINAL' : 'TURN ON TEST SAVE');
    tOn.addEventListener('click', function () { ls(TEST_FLAG, '1'); g.location.hash = ''; g.location.reload(); });
    var tOff = h('button.quiet', { type: 'button', disabled: !adminTest }, 'TURN OFF TEST SAVE');
    tOff.addEventListener('click', function () { ls(TEST_FLAG, null); g.location.reload(); });
    var auto = h('button', { type: 'button' }, autoplayOn() ? 'FINALE AUTOPLAY: ON' : 'FINALE AUTOPLAY: OFF');
    auto.addEventListener('click', function () { try { g.sessionStorage.setItem('legacyAutoplay', autoplayOn() ? '0' : '1'); } catch (e) {} auto.textContent = autoplayOn() ? 'FINALE AUTOPLAY: ON' : 'FINALE AUTOPLAY: OFF'; });
    var replay = h('button', { type: 'button', disabled: !L.replayMode }, L.replay ? 'EXIT REPLAY MODE' : 'REPLAY MODE (whole week, on-screen emails)');
    replay.addEventListener('click', function () { if (L.replay) L.replayMode.exit(); else L.replayMode.start(); });
    var resetT = h('button.quiet', { type: 'button', disabled: !adminTest }, 'RESET TEST SAVE');
    resetT.addEventListener('click', function () { S.save(S.defaults()); g.location.reload(); });
    root.appendChild(h('div.actions', null, tOn, tOff));
    root.appendChild(h('div.actions', null, auto, replay, resetT));
    return root;
  }
  function autoplayOn() { try { return g.sessionStorage.getItem('legacyAutoplay') === '1'; } catch (e) { return false; } }

  function feedView(d) {
    var h = L.ui.h;
    if (!d || !d.ok) return L.ui.notice('bad', 'NO DATA', h('p', { style: 'margin:0' }, 'Wrong key, or the script isn’t deployed yet.'));
    var rows = Object.keys(d.days).map(function (k) {
      var x = d.days[k];
      return h('tr', null, h('td', null, k.toUpperCase() + (d.today === k ? ' (today)' : '')), h('td', null, x.sent ? '✓ sent' : '—'), h('td', null, x.nudged ? '✓ nudged' : '—'), h('td', null, x.solved ? '✓ solved' : '—'));
    });
    var log = (d.log || []).slice().reverse().map(function (e) {
      return h('div', { style: 'margin:0 0 0.6rem' }, h('span.muted', null, new Date(e.t).toLocaleString([], { weekday: 'short', hour: 'numeric', minute: '2-digit' }) + ' · ' + e.route + (e.word ? ' · gave ' + e.word : '')), h('br'), '“' + e.typed + '”');
    });
    return h('div', null,
      h('pre.readout', null, 'BOT: ' + d.status + ' · phase ' + d.phase + ' · final email ' + (d.finalSent ? 'SENT' : 'not sent') + '\nFRIDAY: ' + (d.fri.got.length ? d.fri.got.join(', ') : 'nothing restored yet') + ' (' + d.fri.got.length + '/4)' + (d.fri.exploit ? ' · trick: ' + d.fri.exploit : '') + '\nCHECKED: ' + new Date(d.now).toLocaleString()),
      h('table.org-table', null, h('tbody', null, rows)),
      h('h3', null, 'BRIAN’S LAST REPLIES'),
      log.length ? h('div', null, log) : h('p.muted', null, 'None yet.'));
  }

  L.admin = { render: render, rescueScreen: rescueScreen, testBar: testBar, isUnlocked: isUnlocked, STEP_NAMES: STEP_NAMES };
})(globalThis);
