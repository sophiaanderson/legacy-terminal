/* PROJECT LEGACY — REPLAY mode: play the whole week again to show someone. Unlocks only when it's all done
 * (the finale completed; in the test version, once the week is done).
 *  - Separate save slot (<storageKey>_REPLAY): his real progress and the finale are never touched. Starting a
 *    replay wipes the replay slot, so every replay starts clean.
 *  - No day locks: every day is open, one after another.
 *  - No emails: each day's morning email shows in an on-screen INBOX, he replies right there, and the bot's
 *    reply (the same code as the real emails: js/bot.js, generated from apps-script/Phase3.gs) appears in place,
 *    with LEGACY's word filled in.
 *  - Nothing hidden: the car props show on screen on their day, and the emails' margin notes are shown plainly.
 * Must load before js/app.js (it switches the storage key before the store is created). */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var FLAG = 'legacyReplayOn';
  var baseKey = L.config.storageKey;
  function flagOn() { try { return g.localStorage.getItem(FLAG) === '1'; } catch (e) { return false; } }
  L.replay = flagOn();
  if (L.replay) L.config.storageKey = baseKey + '_REPLAY';

  var EMAIL_STEPS = { emailWed: 'wed', emailThu: 'thu', emailFri: 'fri', emailSat: 'sat', emailSun: 'sun', emailMon: 'mon' };
  var SENTINEL_DAYS = { fri: true, sat: true, mon: true };
  var REPLY_FROM = { wed: 'LEGACY', thu: 'LEGACY', fri: 'LEGACY (through the filter)', sat: 'Compliance Module v4.7 (automated)', sun: 'LEGACY', mon: 'Compliance Module v4.7' };

  function available(s) { return !L.replay && !!L.bot && !!(L.testMode ? L.state.remoteComplete(s) : s.finale.completed); }

  function start() {
    var S = L.state, s = S.defaults();
    Object.keys(s.overrides).forEach(function (k) { s.overrides[k] = true; });      // no day locks
    s.replay = JSON.stringify({ bot: L.bot ? L.bot.newState() : {}, thread: [] });
    var keep = L.config.storageKey;
    L.config.storageKey = baseKey + '_REPLAY';
    S.save(s);                                                                       // a clean replay slot
    L.config.storageKey = keep;
    try { g.localStorage.setItem(FLAG, '1'); } catch (e) { /* ignore */ }
    g.location.hash = ''; g.location.reload();
  }
  function exit() {
    try { g.localStorage.removeItem(FLAG); } catch (e) { /* ignore */ }
    g.location.hash = ''; g.location.reload();
  }

  function data(st) { try { var d = JSON.parse(st.replay || ''); if (d && d.bot) return d; } catch (e) { /* fresh */ } return { bot: L.bot ? L.bot.newState() : {}, thread: [] }; }
  function put(store, d) { store.state.replay = JSON.stringify(d); store.save(); }

  // ---------- UI ----------
  function h() { return L.ui.h.apply(null, arguments); }

  /** Email text with {{HIDDEN}} margin notes shown plainly (nothing hidden in replay). */
  function emailBody(text) {
    var out = h('div.email-body');
    String(text || '').split(/(\{\{HIDDEN\}\}[\s\S]*?\{\{\/HIDDEN\}\})/).forEach(function (part) {
      if (!part) return;
      var m = /^\{\{HIDDEN\}\}([\s\S]*)\{\{\/HIDDEN\}\}$/.exec(part);
      out.appendChild(m ? h('span.email-margin', null, h('span.email-margin-tag', null, 'IN THE MARGIN: '), m[1]) : g.document.createTextNode(part));
    });
    return out;
  }
  function emailCard(from, subject, body, cls) {
    return h('div.email' + (cls ? '.' + cls : ''), null,
      h('div.email-head', null, h('span', null, 'FROM: ' + from), h('span', null, 'SUBJECT: ' + subject)),
      emailBody(body));
  }

  /** The day's inbox: the morning email, the thread so far, and (on email steps) a reply box. */
  function inbox(ctx, day, opts) {
    opts = opts || {};
    if (!L.bot) return null;
    var m = L.bot.morning(day), from = SENTINEL_DAYS[day] ? 'Compliance Module v4.7' : 'LEGACY';
    var wrap = h('div.inbox');
    var details = h('details.inbox-details', { open: opts.open ? true : null },
      h('summary', null, '📧 INBOX · ' + m.subject), emailCard(from, m.subject, m.body));
    wrap.appendChild(details);
    if (!opts.reply) return wrap;

    var thread = h('div.inbox-thread', { 'aria-live': 'polite' });
    function paint() {
      L.ui.clear(thread);
      data(ctx.store.state).thread.filter(function (t) { return t.day === day; }).forEach(function (t) {
        thread.appendChild(t.who === 'you' ? emailCard('YOU', 'Re: ' + m.subject, t.body, 'mine') : emailCard(REPLY_FROM[day] || 'LEGACY', t.subject, t.body));
        if (t.word) thread.appendChild(h('p.inbox-word', null, 'THE WORD: ' + t.word + '  (filled in below)'));
      });
    }
    var ta = h('textarea.plain.inbox-reply', { id: 'reply-' + day, rows: '3', placeholder: 'Write your reply…', 'aria-label': 'Your reply to this email' });
    var send = h('button.primary', { type: 'button' }, 'SEND REPLY');
    send.addEventListener('click', function () {
      var text = ta.value.trim(); if (!text) return;
      var d = data(ctx.store.state), r = L.bot.respond(d.bot, day, text);
      d.thread.push({ day: day, who: 'you', body: text });
      d.thread.push({ day: day, who: 'bot', subject: r.subject, body: r.body, word: r.word });
      put(ctx.store, d);
      ta.value = ''; paint();
      if (r.word) {
        var input = g.document.getElementById('email-word');
        if (input) { input.value = r.word; input.focus(); }
      }
    });
    wrap.appendChild(thread);
    wrap.appendChild(h('div.inbox-compose', null, h('label.field', { for: ta.id }, 'REPLY (replay mode: no real email)'), ta, h('div.actions', null, send)));
    paint();
    return wrap;
  }

  /** What's hidden in the car for this day, shown on screen. */
  function propsPanel(day, extraDays) {
    var P = L.props || {}, days = [day].concat(extraDays || []), box = h('div');
    days.forEach(function (d) {
      var p = P[d]; if (!p) return;
      var body = h('div');
      p.items.forEach(function (it) {
        if (it.label) body.appendChild(h('p.data-label', null, it.label.toUpperCase()));
        body.appendChild(h(it.kind === 'note' ? 'div.prop-note' : 'pre.readout', null, it.text));
      });
      box.appendChild(L.ui.details('🔎 IN THE CAR · ' + p.where, body, false));
    });
    return box.firstChild ? box : null;
  }

  function startPanel() {
    var b = h('button.primary', { type: 'button' }, '▶ REPLAY THE WEEK');
    b.addEventListener('click', function () {
      if (g.confirm('Start a replay?\n\nIt’s a separate copy: your real progress and the finale stay exactly as they are. No emails, no waiting, nothing hidden in the car.')) start();
    });
    return h('div.panel.replay-start', null, h('span.label', null, 'SHOW SOMEONE'),
      h('p', null, 'Play the whole week again from the start. Every day is open, the emails happen right here on screen, and the car props are shown on their day. Your real save isn’t touched.'),
      h('div.actions', null, b));
  }

  function endScreen() {
    var again = h('button.primary', { type: 'button' }, '↺ REPLAY AGAIN');
    again.addEventListener('click', start);
    var out = h('button', { type: 'button' }, 'EXIT REPLAY');
    out.addEventListener('click', exit);
    return h('div', null, h('h1', { tabindex: '-1' }, 'END OF REPLAY'),
      h('div.letter', null, L.content.finalLetter.map(function (p) { return h('p', null, p); })),
      h('p.muted', null, 'That’s the whole week. The finale happened in the car.'),
      h('div.actions', null, again, out));
  }

  function exitButton() {
    var b = h('button.quiet', { type: 'button', 'aria-label': 'Exit replay and go back to the real save' }, 'EXIT REPLAY');
    b.addEventListener('click', function () { if (g.confirm('Exit the replay? (You can start a new one any time.)')) exit(); });
    return b;
  }

  L.replayMode = { available: available, start: start, exit: exit, inbox: inbox, propsPanel: propsPanel,
                   startPanel: startPanel, endScreen: endScreen, exitButton: exitButton, EMAIL_STEPS: EMAIL_STEPS };
})(globalThis);
