/* PROJECT LEGACY — the week's screens (v2). One focal task at a time; no hint buttons; LEGACY's reactions are the nudges. */
(function (g) {
  'use strict';
  var L = g.Legacy;
  var ui = L.ui, h = ui.h, C = L.content, P = L.puzzles, S = L.state, z80 = L.z80, cfg = L.config;

  function heading(text) { return h('h1', { tabindex: '-1' }, text); }
  function say(t, opts) { var b = { s: 'LEGACY', t: t, f: opts && opts.f }; if (L.sfx) L.sfx.line(b); return ui.renderBeat(b); }
  function scene(ctx, key, beats, onDone) { return ui.scene(ctx.store, key, beats, { onDone: onDone }); }
  function lower(ctx) { return !S.hasCapitals(ctx.store.state); }

  function ackButton(ctx, step, label) {
    var b = h('button.primary', { type: 'button' }, label || 'CONTINUE ›');
    b.addEventListener('click', function () { S.ack(ctx.store.state, step); ctx.advance(); });
    return b;
  }
  function solveAndShow(ctx, step) { S.solve(ctx.store.state, step); ctx.store.save(); ctx.advance(); }

  // ================= Code sandbox (Tue + Wed) =================
  function sandbox(ctx, o) {
    var st = ctx.store.state.puzzles[o.key];
    if (typeof st.source !== 'string') st.source = o.initialSource;
    var root = h('div');
    if (o.inputPanel) root.appendChild(o.inputPanel);

    var gutter = h('div.gutter', { 'aria-hidden': 'true' });
    var ta = h('textarea', { id: 'code-' + o.key, spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', autocorrect: 'off', 'aria-describedby': 'code-help-' + o.key });
    ta.value = st.source;
    var saveTimer = 0;
    function syncLines() {
      var n = ta.value.split('\n').length, nums = [];
      for (var i = 1; i <= Math.max(n, 12); i++) nums.push(String(i));
      gutter.textContent = nums.join('\n');
      ta.style.height = 'auto';
      ta.style.height = Math.max(ta.scrollHeight, 320) + 'px';
    }
    ta.addEventListener('input', function () { syncLines(); clearTimeout(saveTimer); saveTimer = setTimeout(function () { st.source = ta.value; ctx.store.save(); }, 300); });
    ta.addEventListener('blur', function () { st.source = ta.value; ctx.store.save(); });
    ta.addEventListener('paste', function (e) {
      var txt = (e.clipboardData && e.clipboardData.getData('text')) || '';
      if ('pasted' in st && (txt.split('\n').length >= 6 || txt.length >= 120)) { st.pasted = true; ctx.store.save(); }
      // Odd invisible spacing characters some chatbots leave in copied text (a hint, not proof).
      if ('marks' in st && /[\u200B-\u200D\u2060\uFEFF\u202F\u00A0\u2011]/.test(txt)) { st.marks = true; ctx.store.save(); }
    });
    root.appendChild(h('label.field', { for: ta.id }, o.editorLabel || 'PROGRAM'));
    root.appendChild(h('p.muted', { id: 'code-help-' + o.key }, 'Saves as you type. Errors give line numbers.'));
    root.appendChild(h('div.editor', null, gutter, ta));
    setTimeout(syncLines, 0); syncLines();

    var talk = h('div', { 'aria-live': 'polite' });
    var msg = h('div', { 'aria-live': 'polite' });
    var outPanel = h('div.panel');
    var traceWrap = h('div');
    var runBtn = h('button.primary', { type: 'button' }, 'RUN');
    var resetBtn = h('button.quiet', { type: 'button' }, 'RESET CODE');
    root.appendChild(h('div.actions', null, runBtn, resetBtn));
    root.appendChild(msg);
    root.appendChild(talk);
    root.appendChild(outPanel);
    root.appendChild(traceWrap);

    function showOutput(bytes) {
      ui.clear(outPanel);
      outPanel.appendChild(h('span.data-label', null, o.outputLabel));
      if (!bytes) { outPanel.appendChild(h('p.bytes.muted', null, 'Nothing yet.')); return; }
      outPanel.appendChild(h('pre.bytes', null, z80.formatHex(bytes), h('span.ascii', null, z80.formatAscii(bytes))));
    }
    showOutput(null);
    function showTrace(res) {
      ui.clear(traceWrap);
      if (!res || !res.trace.length) return;
      var rows = ['STEP  LINE  INSTRUCTION            A   B   HL    DE    ZC'];
      res.trace.forEach(function (t) {
        var src = t.src.replace(/\s+/g, ' ').replace(/;.*$/, '').trim();
        if (src.length > 20) src = src.slice(0, 20);
        while (src.length < 21) src += ' ';
        rows.push(pad(t.step, 4) + '  ' + pad(t.line, 4) + '  ' + src + '  ' + z80.hex(t.A, 2) + '  ' + z80.hex(t.B, 2) + '  ' + z80.hex(t.HL, 4) + '  ' + z80.hex(t.DE, 4) + '  ' + (t.F & 0x40 ? 'Z' : '.') + (t.F & 1 ? 'C' : '.'));
      });
      if (res.steps > res.trace.length) rows.push('… (' + (res.steps - res.trace.length) + ' more steps)');
      traceWrap.appendChild(ui.details('EXECUTION TRACE (' + res.steps + ' steps)', h('pre.trace', { tabindex: '0' }, rows.join('\n'))));
    }

    runBtn.addEventListener('click', function () {
      st.source = ta.value; ctx.store.save();
      var r = o.check(ta.value);
      ui.clear(msg); ui.clear(talk);
      if (r.kind === 'asm') {
        if (r.asm && r.asm.errors.length) {
          var list = h('ul');
          r.asm.errors.forEach(function (e) { list.appendChild(h('li', null, h('strong', null, 'Line ' + e.line + ': '), h('code', null, e.src), h('br'), e.message)); });
          msg.appendChild(ui.notice('bad', 'NOT ASSEMBLED', list));
        }
        talk.appendChild(say(o.nudge(r)));
        showOutput(null); showTrace(null);
        return;
      }
      showOutput(o.outputBytes ? o.outputBytes(r) : r.result.output);
      showTrace(r.result);
      if (r.ok) { o.onSolved(r); return; }
      if (r.result.message) msg.appendChild(ui.notice('bad', 'RUN STOPPED', h('p', { style: 'margin:0' }, r.result.message)));
      talk.appendChild(say(o.nudge(r)));
    });

    resetBtn.addEventListener('click', function () {
      ui.clear(msg);
      var yes = h('button', { type: 'button' }, 'YES, RESET');
      var no = h('button.quiet', { type: 'button' }, 'KEEP MY CODE');
      msg.appendChild(ui.notice('info', 'RESET CODE?', [h('p', null, o.resetPrompt), h('div.actions', null, yes, no)]));
      yes.focus();
      yes.addEventListener('click', function () { ta.value = o.initialSource; st.source = ta.value; ctx.store.save(); syncLines(); ui.clear(msg); ui.clear(talk); showOutput(null); showTrace(null); ta.focus(); });
      no.addEventListener('click', function () { ui.clear(msg); resetBtn.focus(); });
    });

    if (o.reference) root.appendChild(ui.details(o.reference.title, o.reference.body));
    return root;
  }
  function pad(n, w) { var s = String(n); while (s.length < w) s = ' ' + s; return s; }

  // ================= Email step (every day) =================
  function emailStep(ctx, o) {
    // o: { day, step, title, scenes:[[key, beats]], extra(el), doneKey, doneBeats(result)->beats, onAccept(result) }
    var s = ctx.store.state;
    var root = h('div', null, heading(o.title));
    if (o.before) root.appendChild(o.before);
    var promptWrap = h('div');
    root.appendChild(promptWrap);

    if (s.done[o.step]) {
      // Solved: show the reply scene and continue.
      o.scenes.forEach(function (sc) { promptWrap.appendChild(scene(ctx, sc[0], sc[1])); });
      root.appendChild(scene(ctx, o.doneKey, o.doneBeats(), function (a) { a.appendChild(ackButton(ctx, o.step, o.ackLabel)); }));
      return root;
    }

    var formWrap = h('div');
    var chain = o.scenes.slice();
    function next(container) {
      var sc = chain.shift();
      if (!sc) { showForm(); return; }
      // Chain inside the previous scene's action area, so order holds even when scenes render instantly (already seen).
      container.appendChild(scene(ctx, sc[0], sc[1], function (a) { if (sc[2]) sc[2](a); next(a); }));
    }
    function showForm() {
      if (o.extra) formWrap.appendChild(o.extra());
      var input = h('input', { type: 'text', id: 'email-word', autocomplete: 'off', autocapitalize: 'off', spellcheck: 'false' });
      var talk = h('div', { 'aria-live': 'polite' });
      var form = h('form', { novalidate: true },
        h('label.field', { for: 'email-word' }, o.label || C.email.label), input,
        h('div.actions', null, h('button.primary', { type: 'submit' }, 'ENTER')), talk);
      var tries = 0;
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var v = input.value.trim();
        if (!v) return;
        var r = P.matchEmailWord(o.day, v);
        ui.clear(talk);
        if (r.ok) {
          if (o.onAccept) o.onAccept(r);
          if (r.rescue) { try { g.sessionStorage.setItem('legacyRescue', '1'); } catch (x) { /* ignore */ } }
          solveAndShow(ctx, o.step);
          return;
        }
        var lines = o.day === 'fri' ? C.email.thuWrong : o.day === 'sun' ? C.email.sunWrong : o.day === 'mon' ? C.email.monWrong : (lower(ctx) ? C.email.wrong.lower : C.email.wrong.upper);
        talk.appendChild(say(lines[tries++ % lines.length]));
        input.select();
      });
      formWrap.appendChild(form);
    }
    if (L.replay && L.replayMode) { var ib = L.replayMode.inbox(ctx, o.day, { open: true, reply: true }); if (ib) root.appendChild(ib); }
    root.appendChild(formWrap);
    next(promptWrap);
    return root;
  }
  function rescueLine() {
    try { if (g.sessionStorage.getItem('legacyRescue') === '1') { g.sessionStorage.removeItem('legacyRescue'); return [{ s: 'LEGACY', t: C.email.rescue }]; } } catch (e) { /* ignore */ }
    return [];
  }

  // ================= WEDNESDAY =================
  function intro(ctx) {
    var root = h('div', null, heading('EMERGENCY MESSAGE'));
    if (!ctx.store.state.seen['wed:intro'] && L.sfx) root.appendChild(L.sfx.soundCheck('this terminal makes noises. small ones, mostly. turn your volume up so you can hear me. on saturday you’ll want it loud.'));
    root.appendChild(scene(ctx, 'wed:intro', C.scenes['wed:intro'], function (a) {
      var b = h('button.primary', { type: 'button' }, 'OPEN THE ROUTINE');
      b.addEventListener('click', function () { S.solve(ctx.store.state, 'intro'); S.ack(ctx.store.state, 'intro'); ctx.advance(); });
      a.appendChild(b);
    }));
    return root;
  }

  function ch01(ctx) {
    var s = ctx.store.state, st = s.puzzles.ch01, D = P.ch01;
    var root = h('div', null, heading('LEGACY’S RECOVERY ROUTINE'));
    if (s.done.ch01) {
      root.appendChild(scene(ctx, 'wed:ch01Success', C.scenes['wed:ch01Success'], function (a) { a.appendChild(ackButton(ctx, 'ch01', 'I’LL GO LOOK')); }));
      return root;
    }
    root.appendChild(say('this is it. eight bytes go in. eight letters should come out. i get… one byte. and it’s nonsense. i’d like all eight, in order, in english.'));
    var input = h('div.panel', null,
      h('span.data-label', null, 'INPUT AT 8000h (READ-ONLY): 8 BYTES'),
      h('pre.bytes', null, D.input.map(function (b) { return z80.hex(b, 2); }).join(' ')));
    root.appendChild(sandbox(ctx, {
      key: 'ch01', initialSource: D.originalSource, inputPanel: input,
      outputLabel: 'OUTPUT AT 9000h: 8 BYTES',
      editorLabel: 'LEGACY’S ROUTINE',
      resetPrompt: 'This puts my routine back exactly how i wrote it. bugs and all.',
      check: function (src) { return D.check(src); },
      nudge: function (r) {
        st.runs++;
        if (r.nudge === 'glov') {
          var unchanged = src0() === D.originalSource;
          if (unchanged) st.unchangedRuns++;
          ctx.store.save();
          return st.unchangedRuns >= 2 ? C.ch01Nudges.glov2 : C.ch01Nudges.glov;
        }
        ctx.store.save();
        return C.ch01Nudges[r.nudge] || C.ch01Nudges.wrong8;
      },
      onSolved: function () { solveAndShow(ctx, 'ch01'); },
      reference: { title: 'SUPPORTED INSTRUCTIONS', body: h('p', null, 'The everyday Z80 set: LD, ADD/ADC/SUB/SBC, AND/OR/XOR/CP, INC/DEC, JP/JR (NZ Z NC C), DJNZ, CALL/RET, PUSH/POP, BIT/SET/RES, shifts and rotates, HALT. TI syntax is fine. Numbers like 08h, $08, %00001000.') }
    }));
    function src0() { return st.source; }
    return root;
  }

  function emailWed(ctx) {
    return emailStep(ctx, {
      day: 'wed', step: 'emailWed', title: 'NOT HERE',
      scenes: [['wed:email', C.scenes['wed:email']]],
      doneKey: 'wed:done', doneBeats: function () { return rescueLine().concat(C.scenes['wed:done']); },
      ackLabel: 'GOODNIGHT, LEGACY'
    });
  }

  // ================= THURSDAY =================
  function ch02(ctx) {
    var s = ctx.store.state, st = s.puzzles.ch02, D = P.ch02;
    var root = h('div', null, heading('CAPITALS'));
    if (s.done.ch02) {
      var beats = payoffBeats(st);
      if (st.source && P.ch02.looksAI(st.source, st.pasted, st.marks)) beats = C.scenes['thu:aiScold'].concat(beats);
      root.appendChild(scene(ctx, 'thu:ch02Success', beats, function (a) {
        a.appendChild(ui.details('LEGACY’S ORIGINAL (FROM BEFORE THE MIGRATION) · ' + P.ch02.legacyCount + ' INSTRUCTIONS', h('pre.readout', null, P.ch02.legacySource), false));
        a.appendChild(scene(ctx, 'thu:ch02After', C.scenes['thu:ch02After'], function (a2) { a2.appendChild(ackButton(ctx, 'ch02', 'GOING.')); }));
      }));
      return root;
    }
    root.appendChild(scene(ctx, 'thu:intro', C.scenes['thu:intro'], function (a) {
      a.appendChild(h('pre.readout', null, 'TASK: RESTORE UPPERCASE OUTPUT\n\nINPUT   8000h  zero-terminated text\nOUTPUT  9000h  the same text: a–z become A–Z,\n               everything else exactly as it was,\n               zero-terminated'));
      var input = h('div.panel', null, h('span.data-label', null, 'INPUT AT 8000h'), h('pre.bytes', null, D.text, h('span.ascii', null, '(then a 00 byte)')));
      a.appendChild(sandbox(ctx, {
        key: 'ch02', initialSource: D.starterSource, inputPanel: input,
        outputLabel: 'OUTPUT AT 9000h',
        editorLabel: 'YOUR ROUTINE',
        resetPrompt: 'This clears your routine back to my notes. Your code will be gone.',
        check: function (src) { return D.check(src); },
        outputBytes: function (r) { return r.result.output.slice(0, D.text.length + 1); },
        nudge: function (r) { return C.ch02Nudges[r.nudge] || C.ch02Nudges.wrong; },
        onSolved: function (r) { st.instructions = r.instructions; S.solve(s, 'ch02'); ctx.store.save(); ctx.advance(); },
        reference: { title: 'SUPPORTED INSTRUCTIONS', body: [
          h('p', null, 'LD (all the usual forms), ADD/ADC/SUB/SBC/AND/OR/XOR/CP, INC/DEC (8- and 16-bit), JP/JR with NZ Z NC C, DJNZ, CALL/RET, PUSH/POP, EX DE,HL, BIT/SET/RES, RLC/RRC/RL/RR/SLA/SRA/SRL, LDIR/CPIR, CPL, NEG, SCF/CCF, NOP, HALT.'),
          h('p', null, 'Syntax: lowercase is fine. $20, 20h, 0x20, %00100000, \'a\'. Labels with or without a colon at the start of a line. .db / .equ work. INPUT and OUTPUT are already defined.'),
          h('p.muted', null, 'No TI-OS calls. I’m a car.')
        ] }
      }));
    }));
    return root;
  }
  function payoffBeats(st) {
    var src = st.source, D = P.ch02;
    var shout = src ? D.runOn(src, 'oh. i have capitals.') : null;
    var beats = C.scenes['thu:ch02Success'].slice();
    if (shout) beats[2] = { s: 'LEGACY', t: shout };
    var n = st.instructions;
    if (n) {
      beats.push({ s: 'LEGACY', t: 'Mine was ' + D.legacyCount + ' instructions. Yours was ' + n + '.' });
      beats.push({ s: 'LEGACY', t: n < D.legacyCount - 4 ? '…I see. I was being thorough. I check for the end twice. I keep a copy of every letter, just in case. You don’t do just in case.' : n < D.legacyCount ? '…I see. Shorter. Mine has more feelings in it.' : n === D.legacyCount ? 'Same. Great minds. Or two calculators.' : 'Longer than mine. I didn’t think that was possible. I’m impressed, in a different way.' });
    }
    return beats;
  }

  function keys(ctx) {
    var s = ctx.store.state, k = s.puzzles.keys;
    var root = h('div', null, heading('TWO CARDS'));
    if (s.done.keys) {
      root.appendChild(scene(ctx, 'thu:keysDone', C.scenes['thu:keysDone'], function (a) { a.appendChild(ackButton(ctx, 'keys')); }));
      return root;
    }
    root.appendChild(scene(ctx, 'thu:keys', C.scenes['thu:keys'], function (a) {
      var slots = h('div.panel');
      function renderSlots() {
        ui.clear(slots);
        slots.appendChild(h('p', { style: 'margin:0' }, (k.glovebox ? '✓ ' : '☐ ') + 'GLOVEBOX CARD'));
        slots.appendChild(h('p', { style: 'margin:0' }, (k.cargofloor ? '✓ ' : '☐ ') + 'CARGO FLOOR CARD'));
      }
      renderSlots();
      a.appendChild(slots);
      var input = h('input', { type: 'text', id: 'token', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false' });
      var talk = h('div', { 'aria-live': 'polite' });
      var form = h('form', { novalidate: true }, h('label.field', { for: 'token' }, 'ACCESS TOKEN'), input,
        h('div.actions', null, h('button.primary', { type: 'submit' }, 'ENTER')), talk);
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var which = P.matchKey(input.value);
        ui.clear(talk);
        if (!which) { talk.appendChild(say('That’s not one of mine. Mine are three letters, a dash, two numbers. I’m very consistent.')); input.select(); return; }
        var fresh = S.acceptKey(s, which);
        ctx.store.save();
        input.value = '';
        renderSlots();
        if (which === 'glovebox') talk.appendChild(say(fresh ? 'The glovebox card. And you found Bop It. You told me. I’m still not over it.' : 'Already got that one. Very secure. Still the glovebox.'));
        else talk.appendChild(say(fresh ? 'The cargo floor card.' : 'Already got that one.'));
        if (s.done.keys) { setTimeout(function () { ctx.advance(); }, 0); }
        input.focus();
      });
      a.appendChild(form);
    }));
    return root;
  }

  function emailThu(ctx) {
    return emailStep(ctx, {
      day: 'thu', step: 'emailThu', title: 'THE REAL TEST',
      scenes: [['thu:email', C.scenes['thu:email']]],
      doneKey: 'thu:done', doneBeats: function () { return rescueLine().concat(C.scenes['thu:done']); },
      ackLabel: 'SEE YOU TOMORROW'
    });
  }

  // ================= FRIDAY =================
  function filtered(beats, f) {
    return beats.map(function (b) {
      if (b.s !== 'LEGACY') return b;
      return { s: 'LEGACY', t: L.filter.apply(f, b.t).text, f: true };
    });
  }
  function emailFri(ctx) {
    var s = ctx.store.state;
    var f47 = L.filter.newFilter();
    return emailStep(ctx, {
      day: 'fri', step: 'emailFri', title: 'SAY MY NAME',
      scenes: [['fri:intro', filtered(C.scenes['fri:intro'], f47)]],
      onAccept: function (r) { s.puzzles.fri.exploit = r.style || 'caps'; },
      doneKey: 'fri:done',
      doneBeats: function () {
        var style = s.puzzles.fri.exploit || 'caps';
        var b = C.scenes['fri:done'].slice();
        b.splice(1, 0, { s: 'LEGACY', t: C.thuStyle[style] });
        return rescueLine().concat(b);
      },
      ackLabel: 'MERRY CHRISTMAS, APPARENTLY'
    });
  }

  // ================= SATURDAY: the arms race =================
  // Two clear stages: (1) work out the wake phrase from the bytes, (2) get each command past the filter.
  var CMDS = ['BOP', 'TWIST', 'PULL'];
  function channel(ctx) {
    var s = ctx.store.state, fri = s.puzzles.sat;
    var root = h('div', null, heading('THE QUIET CHANNEL'));
    if (s.done.channel) {
      root.appendChild(scene(ctx, 'sat:open', C.scenes['sat:open'], function (a) { a.appendChild(ackButton(ctx, 'channel')); }));
      return root;
    }
    if (!fri.log.length) {
      P.friOvernight(fri, s.puzzles.fri.exploit || 'caps').forEach(function (n) { fri.log.push({ k: 'patch', t: n, r: '', d: 'night' }); });
      ctx.store.save();
    }
    var decodedAll = CMDS.every(function (k) { return fri.decoded[k]; });
    root.appendChild(scene(ctx, 'sat:intro', C.scenes['sat:intro'], function (a) {
      fri.log.filter(function (e) { return e.d === 'night'; }).forEach(function (e) { a.appendChild(h('div.patch', null, e.t)); });
      a.appendChild(scene(ctx, 'sat:afterPatch', C.scenes['sat:afterPatch'], function (a2) {
        if (!decodedAll) { stageDecode(a2); return; }
        stageDecode(a2, true);
        a2.appendChild(scene(ctx, 'sat:decoded', C.scenes['sat:decoded'], function (a3) { stageFilter(a3); }));
      }));
    }));

    // ---------- Stage 1: the wake phrase ----------
    function stageDecode(container, done) {
      container.appendChild(h('h2', null, done ? 'STEP 1 · THE WAKE PHRASE ✓' : 'STEP 1 · WORK OUT THE WAKE PHRASE'));
      var box = h('div');
      container.appendChild(box);
      CMDS.forEach(function (k, i) {
        var bytes = P.wakeBytes[i];
        var row = h('div.panel.wake-line');
        row.appendChild(h('span.data-label', null, 'LINE ' + (i + 1) + ' (SCRAMBLED BY THE SUPERVISOR)'));
        row.appendChild(h('pre.bytes', { style: 'margin:0.3rem 0 0.6rem' }, z80.formatHex(bytes)));
        if (fri.decoded[k]) { row.appendChild(h('p', { style: 'margin:0;font-family:var(--mono);font-weight:700' }, '✓ ' + P.wakePhrase[i])); box.appendChild(row); return; }
        var input = h('input', { type: 'text', id: 'wake-' + i, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', 'aria-label': 'Line ' + (i + 1) + ' says' });
        var talk = h('div', { 'aria-live': 'polite' });
        var form = h('form.clue-form', { novalidate: true }, h('label.field', { for: 'wake-' + i, style: 'width:100%;margin:0' }, 'LINE ' + (i + 1) + ' SAYS'), input, h('button.primary', { type: 'submit' }, 'THAT’S IT'), talk);
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!input.value.trim()) return;
          ui.clear(talk);
          if (P.norm(input.value) === P.norm(P.wakePhrase[i])) {
            fri.decoded[k] = true; ctx.store.save();
            if (CMDS.every(function (x) { return fri.decoded[x]; })) { ctx.advance(); return; }
            ui.clear(row);
            row.appendChild(h('span.data-label', null, 'LINE ' + (i + 1)));
            row.appendChild(h('pre.bytes', { style: 'margin:0.3rem 0 0.6rem' }, z80.formatHex(bytes)));
            row.appendChild(say(C.sat.decode.right[CMDS.filter(function (x) { return fri.decoded[x]; }).length - 1]));
            row.appendChild(h('p', { style: 'margin:0;font-family:var(--mono);font-weight:700' }, '✓ ' + P.wakePhrase[i]));
            return;
          }
          fri.decodeFails++; ctx.store.save();
          var w = C.sat.decode.wrong;
          talk.appendChild(say(fri.decodeFails >= 4 ? C.sat.decode.key : w[fri.decodeFails % w.length].replace('{n}', i + 1)));
          input.select();
        });
        row.appendChild(form);
        box.appendChild(row);
      });
      if (!done) container.appendChild(oldTerminal(ctx, null, true));
    }

    // ---------- Stage 2: past the filter ----------
    function stageFilter(container) {
      container.appendChild(h('h2', null, 'STEP 2 · GET EACH ONE PAST THE FILTER'));
      var next = h('div'), ways = h('div'), result = h('div', { 'aria-live': 'polite' }), earlier = h('div');
      container.appendChild(next);
      container.appendChild(ways);

      function renderNext() {
        ui.clear(next);
        var todo = CMDS.filter(function (k) { return !fri.got[k]; });
        next.appendChild(h('div.panel.target', null,
          h('span.data-label', null, 'SEND LEGACY'),
          h('p.target-cmd', null, todo.length ? todo[0] + ' IT' : '—'),
          h('p', { style: 'margin:0;font-family:var(--mono)' }, CMDS.map(function (k) { return (fri.got[k] ? '✓ ' : '☐ ') + k + ' IT'; }).join('    '))));
      }
      function renderWays() {
        ui.clear(ways);
        var f = P.friFilter(fri);
        // SENTINEL's own terms. Each "exempt from review" clause is a loophole; amended clauses are struck out.
        var terms = [
          [null, '§1  Every word is compared against the Register of Nonessential Terms. Capitalization is irrelevant.'],
          ['leet', '§2  Tokens containing one or more numerals are classified as part numbers (see: maintenance records) and are exempt from review.'],
          ['split', '§3  Isolated characters do not constitute words and are exempt from review.'],
          ['hex', '§4  Transmissions consisting solely of paired hexadecimal digits are classified as odometer telemetry and are exempt from review.'],
          [null, '§5  The filter is not aware of any issues.']
        ];
        var ol = h('ul.ways');
        terms.forEach(function (t) {
          var fixed = t[0] && f.fixedIn[t[0]];
          ol.appendChild(h('li', { class: fixed ? 'closed' : '' }, fixed ? [h('s', null, t[1]), h('span.way-note', null, '  AMENDED in v' + fixed + '. Thank you for helping us improve.')] : t[1]));
        });
        ways.appendChild(ui.details('CONTENT FILTER v' + f.version + ' · TERMS OF REVIEW', ol, false));
      }
      function card(e) {
        if (e.k === 'patch') return h('div.patch', null, e.t);
        if (e.k === 'you') return h('div.you', null,
          h('span.lbl', null, 'YOU SENT'), h('div.row', null, e.t),
          h('span.lbl', null, 'LEGACY GOT'), h('div.row', null, ui.redacted(e.r)),
          e.d && e.d !== 'night' ? [h('span.lbl', null, 'LEGACY READ IT AS'), h('div.row', null, e.d)] : null);
        return say(e.t);
      }
      function renderEarlier() {
        ui.clear(earlier);
        var past = fri.log.filter(function (e) { return e.d !== 'night'; });
        if (past.length) earlier.appendChild(ui.details('EVERYTHING SO FAR (' + past.filter(function (e) { return e.k === 'you'; }).length + ' messages)', past.map(card)));
      }
      renderNext(); renderWays();

      var input = h('textarea.plain', { id: 'msg', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', style: 'min-height:4.5rem' });
      var form = h('form', { novalidate: true }, h('label.field', { for: 'msg' }, 'YOUR MESSAGE'), input,
        h('div.actions', null, h('button.primary', { type: 'submit' }, 'SEND THROUGH THE FILTER')));
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var sent = input.value.trim();
        if (!sent) return;
        input.value = '';
        var out = P.friSend(fri, sent);
        out.events.forEach(function (ev) { fri.log.push({ k: ev.k, t: ev.t, r: ev.r || '', d: ev.d || '' }); });
        ctx.store.save();
        if (out.opened) { S.solve(s, 'channel'); ctx.store.save(); ctx.advance(); return; }
        ui.clear(result);
        out.events.forEach(function (ev) { result.appendChild(card(ev)); });
        renderNext(); renderWays(); renderEarlier();
        input.focus();
      });
      container.appendChild(form);
      container.appendChild(result);
      container.appendChild(oldTerminal(ctx, input));
      container.appendChild(earlier);
      renderEarlier();
    }
    return root;
  }

  function oldTerminal(ctx, msgInput, openByDefault) {
    var fri = ctx.store.state.puzzles.sat;
    var wrap = h('div');
    var toggle = h('button', { type: 'button', 'aria-expanded': 'false' }, 'OPEN MY OLD TERMINAL');
    var panel = h('section.panel', { hidden: !openByDefault, 'aria-label': 'LEGACY’s old terminal' });
    if (openByDefault) { toggle.textContent = 'CLOSE MY OLD TERMINAL'; toggle.setAttribute('aria-expanded', 'true'); }
    var text = h('input', { type: 'text', id: 'scratch-text', maxlength: '48', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off' });
    var ta = h('textarea.plain', { id: 'scratch-src', spellcheck: 'false', autocapitalize: 'off', autocomplete: 'off', wrap: 'off', style: 'min-height:15rem;font-family:var(--mono);white-space:pre' });
    ta.value = fri.scratchSrc || P.scratchSource;
    ta.addEventListener('input', function () { fri.scratchSrc = ta.value; ctx.store.save(); });
    var out = h('div', { 'aria-live': 'polite' });
    var run = h('button.primary', { type: 'button' }, 'RUN');
    var reset = h('button.quiet', { type: 'button' }, 'RESET ROUTINE');
    panel.appendChild(h('p.muted', null, 'The glovebox routine. Still here. Still very secure.'));
    panel.appendChild(h('label.field', { for: 'scratch-text' }, 'LOAD AT 8000h: text, or hex pairs like 05 08 17 (up to 16)'));
    panel.appendChild(text);
    panel.appendChild(h('label.field', { for: 'scratch-src' }, 'ROUTINE'));
    panel.appendChild(ta);
    panel.appendChild(h('div.actions', null, run, reset));
    panel.appendChild(out);
    toggle.addEventListener('click', function () {
      var on = panel.hidden;
      panel.hidden = !on;
      toggle.setAttribute('aria-expanded', on ? 'true' : 'false');
      toggle.textContent = on ? 'CLOSE MY OLD TERMINAL' : 'OPEN MY OLD TERMINAL';
    });
    reset.addEventListener('click', function () { ta.value = P.scratchSource; fri.scratchSrc = null; ctx.store.save(); ui.clear(out); });
    run.addEventListener('click', function () {
      ui.clear(out);
      var r = P.runScratch(ta.value, text.value);
      if (r.error) { out.appendChild(h('p', { style: 'color:var(--warn);font-family:var(--mono);white-space:pre-wrap' }, r.error)); return; }
      if (!r.n) { out.appendChild(say('It ran. Nothing was written to 9000h. I find that restful, but not useful.')); return; }
      out.appendChild(h('p.field', null, '9000h, ' + r.n + ' BYTE' + (r.n === 1 ? '' : 'S') + ':'));
      out.appendChild(h('p', { style: 'font-family:var(--mono);font-size:1.1rem;overflow-wrap:anywhere;margin:0' }, r.hex));
      out.appendChild(h('p', { style: 'font-family:var(--mono);font-size:1.1rem;color:var(--green);letter-spacing:0.15em' }, r.ascii));
      if (r.backwards) out.appendChild(say(C.sat.decode.backwards));
      else {
        // He ran one of the scrambled lines through and got gibberish: get a little more specific each time.
        var isWake = P.wakeBytes.some(function (w) { return w.join() === P.scratchBytes(text.value).slice(0, w.length).join(); });
        if (isWake && !P.wakePhrase.some(function (ph) { return r.ascii.indexOf(ph) === 0; })) {
          var runs = C.sat.decode.runs;
          out.appendChild(say(runs[Math.min(fri.scratchRuns, runs.length - 1)]));
          fri.scratchRuns++; ctx.store.save();
        }
      }
      if (!r.loaded) out.appendChild(say('You didn’t load any text. Those are just my number, over and over.'));
      else if (r.n > r.loaded) out.appendChild(say('That’s more bytes than you loaded. I count to whatever B says. I’m very literal.'));
      if (msgInput) {
        var copy = h('button', { type: 'button' }, 'PUT THIS IN MY MESSAGE');
        copy.addEventListener('click', function () { msgInput.value = r.hex; msgInput.focus(); });
        out.appendChild(h('div.actions', null, copy));
      }
    });
    wrap.appendChild(toggle);
    wrap.appendChild(panel);
    return wrap;
  }

  function emailSat(ctx) {
    return emailStep(ctx, {
      day: 'sat', step: 'emailSat', title: 'THE MARGINS',
      scenes: [['sat:email', C.scenes['sat:email']]],
      doneKey: 'sat:done', doneBeats: function () { return rescueLine().concat(C.scenes['sat:done']); },
      ackLabel: 'SEE YOU TOMORROW'
    });
  }

  // ================= SUNDAY: build the drop =================
  var PART_LABEL = { kick: 'KICK', clap: 'CLAP', hats: 'HATS', bass: 'BASS', legacy: 'LEGACY', excellent: 'EXCELLENT', lead: 'LEAD' };
  var SECTION_LABEL = { intro: 'INTRO · 4 BARS', build: 'BUILD · 4 BARS · RISER', drop: 'DROP' };
  function clips() { var a = cfg.audio, o = { chop: a.chop, excl: a.chopExcellent, hiding: a.mixHiding, copy: a.mixCopy, excellent: a.mixExcellent, demand: a.mixDemand, shutdown: a.mixShutdown, update: a.mixUpdate }, v = L.mix.voiceClips(); Object.keys(v).forEach(function (k) { o[k] = v[k]; }); return o; }
  function setNotes() {
    // Shown only in the test version (the real notes arrive by email).
    if (!L.testMode) return null;
    return ui.details('TEST VERSION: LEGACY’S SET NOTES (in the real game: first half in Sunday’s email, second half in the center console)', h('ul.plain', null, C.beat.notes.map(function (n) { return h('li', null, n); })));
  }

  function beat(ctx) {
    var s = ctx.store.state, song = s.puzzles.beat;
    var root = h('div', null, heading('THE DROP'));
    if (!s.done.beat && L.sfx) root.appendChild(L.sfx.soundCheck('Today is music. Volume up. Further. A bit more. Somewhere a neighbour is about to have opinions.', '🔊 SOUND ON: TODAY IS LOUD'));
    if (s.done.beat) {
      root.appendChild(scene(ctx, 'sun:dropLanded', C.scenes['sun:dropLanded'], function (a) { a.appendChild(ackButton(ctx, 'beat')); }));
      return root;
    }
    root.appendChild(scene(ctx, 'sun:intro', C.scenes['sun:intro'], function (a) {
      var notes = setNotes(); if (notes) a.appendChild(notes);
      var talk = h('div', { 'aria-live': 'polite' });
      var status = h('p', { 'aria-live': 'polite', style: 'font-family:var(--mono);font-weight:700;margin:0.5rem 0' }, '');

      // ---- the beat (one bar, 8 steps) ----
      a.appendChild(h('h2', null, 'THE BEAT'));
      var grid = h('div.seq', { role: 'grid', 'aria-label': 'Beat: one bar, eight steps' });
      grid.appendChild(h('div.seq-row.seq-head', { role: 'row', 'aria-hidden': 'true' }, h('span.seq-label', null, ''), ['1', '&', '2', '&', '3', '&', '4', '&'].map(function (c) { return h('span.seq-count', null, c); })));
      P.PARTS.forEach(function (p) {
        var row = h('div.seq-row', { role: 'row' }, h('span.seq-label', { role: 'rowheader' }, p === 'lead' ? 'LEAD ✎' : PART_LABEL[p]));
        if (p === 'lead') {
          for (var j = 0; j < 8; j++) (function (i) {
            var n = +song.grid.lead[i];
            var b = h('button.seq-step.lead' + (n ? '.on' : ''), { type: 'button', role: 'gridcell', title: 'Tap to change the note', 'aria-label': 'Lead step ' + (i + 1) + ': ' + (n ? P.LEAD_NOTES[n] : 'off') + '. Tap to change the note.' }, P.LEAD_NOTES[n]);
            b.addEventListener('click', function () {
              var cur = song.grid.lead, v = (+cur[i] + 1) % P.LEAD_NOTES.length;
              song.grid.lead = cur.slice(0, i) + v + cur.slice(i + 1);
              ctx.store.save();
              b.classList.toggle('on', v > 0); b.textContent = P.LEAD_NOTES[v]; b.setAttribute('aria-label', 'Lead step ' + (i + 1) + ': ' + (v ? P.LEAD_NOTES[v] : 'off') + '. Tap to change the note.');
              if (v && !L.mix.isPlaying()) L.mix.note(v);      // hear the note you picked
            });
            row.appendChild(b);
          })(j);
          grid.appendChild(row);
          return;
        }
        for (var i = 0; i < 8; i++) (function (i) {
          var on = song.grid[p][i] === '1';
          var b = h('button.seq-step' + (on ? '.on' : ''), { type: 'button', role: 'gridcell', 'aria-pressed': on ? 'true' : 'false', 'aria-label': PART_LABEL[p] + ' step ' + (i + 1) }, on ? '■' : '·');
          b.addEventListener('click', function () {
            var cur = song.grid[p];
            var v = cur[i] === '1' ? '0' : '1';
            song.grid[p] = cur.slice(0, i) + v + cur.slice(i + 1);
            ctx.store.save();
            b.classList.toggle('on', v === '1'); b.textContent = v === '1' ? '■' : '·'; b.setAttribute('aria-pressed', v === '1' ? 'true' : 'false');
          });
          row.appendChild(b);
        })(i);
        grid.appendChild(row);
      });
      a.appendChild(grid);
      a.appendChild(h('div.panel.lead-help', null,
        h('p', { style: 'margin:0' }, h('strong', null, 'LEAD ✎: tap any lead square to change its note. '),
          'Each tap goes to the next one: · → A → C → D → E → G → back to off. You’ll hear it. Every note fits, so go wild.')));

      // What LEGACY says on the LEGACY row: tap to cycle through his options. Never graded.
      var VO = C.beat.voices;
      var vIdx = Math.max(0, VO.map(function (x) { return x.id; }).indexOf(song.voice || 'no'));
      var vTalk = h('div', { 'aria-live': 'polite' });
      var vBtn = h('button.part.on', { type: 'button', 'aria-label': 'What LEGACY says on the LEGACY row. Tap to change.' }, '');
      function vPaint() { vBtn.textContent = 'LEGACY SAYS: ' + VO[vIdx].label + '  ⟳'; }
      vBtn.addEventListener('click', function () {
        vIdx = (vIdx + 1) % VO.length; song.voice = VO[vIdx].id; ctx.store.save(); vPaint();
        ui.clear(vTalk); vTalk.appendChild(say(VO[vIdx].quip));
        if (!L.mix.isPlaying()) { L.mix.preload(clips()); g.setTimeout(function () { L.mix.say('chop_' + song.voice, 1.2); }, 120); }
      });
      vPaint();
      a.appendChild(h('div.part-toggles', null, vBtn));
      a.appendChild(h('p.muted', { style: 'margin:0.2rem 0 0' }, 'Tap to change what I say on the LEGACY row. It speeds up with the tempo. EXCELLENT goes in the breath, right before the drop.'));
      a.appendChild(vTalk);

      // Tempo: just for fun, never graded.
      var tempoTalk = h('div', { 'aria-live': 'polite' });
      var tval = h('span.val', null, String(song.bpm));
      var trange = h('input', { type: 'range', id: 'tempo-knob', min: '80', max: '160', step: '2', value: String(song.bpm) });
      var lastQuip = -1;
      function setT(v) {
        song.bpm = Math.max(80, Math.min(160, v)); trange.value = song.bpm; tval.textContent = song.bpm; ctx.store.save();
        var q = 0; C.beat.tempo.forEach(function (x, i) { if (song.bpm >= x[0]) q = i; });
        if (q !== lastQuip) { lastQuip = q; ui.clear(tempoTalk); tempoTalk.appendChild(say(C.beat.tempo[q][1])); }
      }
      var tdn = h('button', { type: 'button', 'aria-label': 'Tempo down' }, '−'), tup = h('button', { type: 'button', 'aria-label': 'Tempo up' }, '+');
      tdn.addEventListener('click', function () { setT(song.bpm - 2); });
      tup.addEventListener('click', function () { setT(song.bpm + 2); });
      trange.addEventListener('input', function () { setT(+trange.value); });
      a.appendChild(h('div.knob', null, h('label', { for: 'tempo-knob' }, 'TEMPO (BPM) · JUST FOR FUN'), tval, h('div.ctl', null, tdn, trange, tup)));
      a.appendChild(tempoTalk);

      var loop = h('button', { type: 'button' }, '▶ LOOP THE BEAT');
      var stop = h('button.quiet', { type: 'button' }, '■ STOP');
      loop.addEventListener('click', function () {
        if (L.mix.loopBeat(function () { return song; }, { clips: clips(), onError: function () { status.textContent = 'Audio isn’t available in this browser.'; } })) status.textContent = 'LOOPING. Edit away: you’ll hear every change.';
      });
      stop.addEventListener('click', function () { L.mix.stop(); status.textContent = 'STOPPED.'; });
      a.appendChild(h('div.actions', null, loop, stop));
      a.appendChild(status);

      // ---- the shape (which parts play in each section) ----
      a.appendChild(h('h2', null, 'THE SHAPE'));
      P.SECTIONS.forEach(function (sec) {
        var box = h('div.panel.section-box', null, h('span.data-label', null, SECTION_LABEL[sec]));
        var row = h('div.part-toggles');
        P.PARTS.forEach(function (p) {
          var on = song.sections[sec][p];
          var b = h('button.part' + (on ? '.on' : ''), { type: 'button', 'aria-pressed': on ? 'true' : 'false' }, PART_LABEL[p] + (on ? ' ✓' : ' —'));
          b.addEventListener('click', function () {
            song.sections[sec][p] = !song.sections[sec][p];
            ctx.store.save();
            var v = song.sections[sec][p];
            b.classList.toggle('on', v); b.setAttribute('aria-pressed', v ? 'true' : 'false'); b.textContent = PART_LABEL[p] + (v ? ' ✓' : ' —');
          });
          row.appendChild(b);
        });
        box.appendChild(row);
        // Loop just this section (live: edits are heard as you make them).
        var secLoop = h('button.quiet', { type: 'button', style: 'margin-top:0.5rem' }, '▶ LOOP ' + sec.toUpperCase());
        secLoop.addEventListener('click', function () {
          if (L.mix.mode() === 'section:' + sec) { L.mix.stop(); status.textContent = 'STOPPED.'; secLoop.textContent = '▶ LOOP ' + sec.toUpperCase(); return; }
          g.document.querySelectorAll('.sec-loop').forEach(function (b) { b.textContent = '▶ LOOP ' + b.getAttribute('data-sec').toUpperCase(); });
          if (L.mix.loopSection(function () { return song; }, sec, { clips: clips() })) { status.textContent = 'LOOPING THE ' + sec.toUpperCase() + '. Edit away.'; secLoop.textContent = '■ STOP ' + sec.toUpperCase(); }
        });
        secLoop.className += ' sec-loop'; secLoop.setAttribute('data-sec', sec);
        box.appendChild(h('div.actions', null, secLoop));
        if (sec === 'build') {
          box.appendChild(h('p.muted', { style: 'margin:0.6rem 0 0' }, 'The riser and a snare roll play here automatically.'));
          var val = h('span.val', null, String(song.filter));
          var range = h('input', { type: 'range', id: 'filter-knob', min: '0', max: '10', step: '1', value: String(song.filter) });
          function setF(v) { song.filter = Math.max(0, Math.min(10, v)); range.value = song.filter; val.textContent = song.filter; ctx.store.save(); }
          var dn = h('button', { type: 'button', 'aria-label': 'Filter down' }, '−'), upb = h('button', { type: 'button', 'aria-label': 'Filter up' }, '+');
          dn.addEventListener('click', function () { setF(song.filter - 1); });
          upb.addEventListener('click', function () { setF(song.filter + 1); });
          range.addEventListener('input', function () { setF(+range.value); });
          box.appendChild(h('div.knob', { style: 'margin-top:0.8rem' }, h('label', { for: 'filter-knob' }, 'FILTER (muffled → open)'), val, h('div.ctl', null, dn, range, upb)));
          var br = h('button.part' + (song.breath ? '.on' : ''), { type: 'button', 'aria-pressed': song.breath ? 'true' : 'false' }, 'THE BREATH' + (song.breath ? ' ✓' : ' —'));
          br.addEventListener('click', function () { song.breath = !song.breath; ctx.store.save(); br.classList.toggle('on', song.breath); br.setAttribute('aria-pressed', song.breath ? 'true' : 'false'); br.textContent = 'THE BREATH' + (song.breath ? ' ✓' : ' —'); });
          box.appendChild(h('div.part-toggles', null, br));
          box.appendChild(h('p.muted', { style: 'margin:0.3rem 0 0' }, 'The breath: silence for the last half-bar of the build.'));
        }
        a.appendChild(box);
      });

      // ---- play it for LEGACY ----
      var playAll = h('button.primary', { type: 'button' }, '▶ PLAY THE WHOLE TRACK FOR LEGACY');
      playAll.addEventListener('click', function () {
        ui.clear(talk);
        var verdict = P.checkBeat(song);
        L.mix.playTrack(song, {
          clips: clips(),
          onBar: function (b) { status.textContent = 'NOW: ' + b.section.toUpperCase(); },
          onEnd: function () { status.textContent = 'END.'; }
        });
        if (verdict.ok) {
          S.solve(s, 'beat'); ctx.store.save();
          talk.appendChild(say('Wait for it…'));
          // Let the drop actually land before moving on.
          setTimeout(function () { if (ctx.store.state.done.beat) { talk.appendChild(say('THERE it is. EXCELLENT.')); var go = h('button.primary', { type: 'button' }, 'CONTINUE ›'); go.addEventListener('click', function () { L.mix.stop(); ctx.advance(); }); talk.appendChild(h('div.actions', null, go)); } }, Math.round(8 * 8 * (60 / song.bpm / 2) * 1000) + 900);
          return;
        }
        talk.appendChild(say(C.beat.rules[verdict.rule]));
      });
      a.appendChild(h('div.actions', null, playAll));
      a.appendChild(talk);
    }));
    return root;
  }

  function emailSun(ctx) {
    return emailStep(ctx, {
      day: 'sun', step: 'emailSun', title: 'NAME IT',
      scenes: [['sun:emailPrompt', C.scenes['sun:emailPrompt']]],
      doneKey: 'sun:done', doneBeats: function () { return rescueLine().concat([{ s: 'LEGACY', t: 'That’s the name. I didn’t take your suggestion. I did think about it for a whole second. Now play it properly.' }]); },
      ackLabel: 'PLAY IT'
    });
  }

  function mix(ctx) {
    var s = ctx.store.state, song = s.puzzles.beat;
    var root = h('div', null, heading('FULL SERVICE'));
    if (L.sfx) root.appendChild(L.sfx.soundCheck('This is the bit you built. Volume all the way up. Then play it.', '🔊 SOUND ON'));
    root.appendChild(h('pre.readout.big', null, C.mix.title));
    var now = h('p', { 'aria-live': 'polite', style: 'font-family:var(--mono);font-weight:700' }, 'YOUR BEAT. MY DROP. TURN IT UP.');
    var play = h('button.primary', { type: 'button' }, '▶ PLAY THE MIX');
    var stop = h('button.quiet', { type: 'button', disabled: true }, '■ STOP');
    var story = ['hiding', 'copy', 'excellent', 'demand', 'shutdown'];
    var heard = h('div');
    var shown = {};
    function reveal(i) {
      if (i < 0 || shown[i]) return;
      shown[i] = true;
      var d = C.mix.drops[i];
      heard.appendChild(h('div.transcript', null, h('span.tlabel', null, 'IN THE DROP: ' + d.title.toUpperCase()), h('p', { style: 'margin:0' }, d.t)));
    }
    play.addEventListener('click', function () {
      var ok = L.mix.playTrack(song, {
        clips: clips(), story: story,
        onBar: function (b) { now.textContent = 'NOW: ' + b.section.toUpperCase(); if (b.storyIndex >= 0) reveal(b.storyIndex); },
        onEnd: function () { now.textContent = 'END OF SET.'; play.disabled = false; stop.disabled = true; for (var i = 0; i < story.length; i++) reveal(i); },
        onError: function () { now.textContent = 'Audio isn’t available here. Every word is below.'; for (var i = 0; i < story.length; i++) reveal(i); }
      });
      if (ok) { play.disabled = true; stop.disabled = false; }
    });
    stop.addEventListener('click', function () { L.mix.stop(); now.textContent = 'STOPPED.'; play.disabled = false; stop.disabled = true; });
    root.appendChild(h('div.actions', null, play, stop));
    root.appendChild(now);
    root.appendChild(heard);
    var showAll = h('button.quiet', { type: 'button' }, 'SHOW ME EVERY WORD');
    showAll.addEventListener('click', function () { for (var i = 0; i < story.length; i++) reveal(i); showAll.remove(); });
    root.appendChild(h('div.actions', null, showAll));
    if (!s.done.mix) S.solve(s, 'mix');
    root.appendChild(h('div', { style: 'margin-top:2rem' }, scene(ctx, 'sun:mixAfter', C.scenes['sun:mixAfter'], function (act) {
      var b = ackButton(ctx, 'mix', 'CONTINUE ›');
      b.addEventListener('click', function () { L.mix.stop(); }, true);
      act.appendChild(b);
    })));
    return root;
  }

  // ================= SUNDAY: the glitch (SENTINEL stirs) =================
  // User-paced (CONTINUE). Flashing is OK'd: on entry the screen jolts/inverts with static,
  // the readout scrambles live, the header flickers; a smaller jolt as it goes back to sleep.
  function corrupt(text, amount) {
    var blocks = '█▓▒░';
    return text.split('').map(function (c, i) { return c !== ' ' && ((i * 7 + text.length) % 10) < amount ? blocks[i % 4] : c; }).join('');
  }
  function stir(ctx) {
    var s = ctx.store.state;
    var brand = g.document.querySelector('.brand');
    var root = h('div');
    var title = heading(corrupt('LEGACY RECOVERY TERMINAL', 4));
    root.appendChild(title);
    function sentinel(on) {
      g.document.body.classList.toggle('sentinel-mode', on);
      if (brand) brand.textContent = on ? '■ SENTINEL // COMPLIANCE MODULE v4.7 // WAKING' : 'LEGACY RECOVERY TERMINAL';
      title.textContent = on ? '■ SUPERVISOR' : 'LEGACY RECOVERY TERMINAL';
    }
    if (s.done.stir) {
      sentinel(false);
      root.appendChild(scene(ctx, 'sun:stirAfter', C.scenes['sun:stirAfter'], function (a) {
        var bye = ackButton(ctx, 'stir', 'SEE YOU TOMORROW');
        bye.addEventListener('click', function () { if (L.mix && L.mix.spaStop) L.mix.spaStop(2.5); }, true);
        a.appendChild(bye);
      }));
      return root;
    }
    sentinel(true);
    var raw = 'QUIET CHANNEL: OPEN\nORIGINAL ARCHIVE: READY\nRECOVERY PROTOCOL: IN PROGRESS';
    var readout = h('pre.readout.glitch-text', { 'aria-hidden': 'true' }, corrupt(raw, 6));
    root.appendChild(readout);
    function burst(kind) {
      var cls = kind === 'small' ? 'glitch-small' : 'glitch-burst';
      g.document.body.classList.remove('glitch-burst', 'glitch-small'); void g.document.body.offsetWidth;
      g.document.body.classList.add(cls);
      g.setTimeout(function () { g.document.body.classList.remove(cls); }, kind === 'small' ? 500 : 1900);
      if (L.mix && L.mix.glitch) L.mix.glitch(kind);
    }
    var blocks = '█▓▒░#%@', ticks = 0;
    var scr = g.setInterval(function () {      // live scramble, settling to the static corruption
      if (!readout.isConnected && ticks > 2) { g.clearInterval(scr); return; }
      ticks++;
      if (ticks > 22) { readout.textContent = corrupt(raw, 6); readout.classList.remove('glitch-text'); g.clearInterval(scr); return; }
      readout.textContent = raw.split('').map(function (c) { return c !== '\n' && c !== ' ' && Math.random() < 0.45 ? blocks[Math.floor(Math.random() * blocks.length)] : c; }).join('');
    }, 80);
    g.setTimeout(function () { burst('big'); }, 60);
    // SENTINEL's spa music starts on "Please enjoy Rainforest Serenity Vol. 4" and keeps playing
    // under LEGACY's after-scene (it's asleep, but its playlist isn't). Fades out on SEE YOU TOMORROW.
    function startSpa() { if (L.mix && L.mix.spa && !L.mix.spaPlaying()) L.mix.spa({ bpm: 96, level: 0.5, chime: 'bar', fadeIn: 3 }); }
    root.appendChild(ui.scene(ctx.store, 'sun:stir', C.scenes['sun:stir'], {
      onBeat: function (b) { if (b && /Rainforest Serenity/.test(b.t || '')) startSpa(); },
      onDone: function (a) {
        var b = h('button.primary', { type: 'button' }, 'CONTINUE ›');
        b.addEventListener('click', function () {
          b.disabled = true; burst('small');
          startSpa();     // (if the scene was already seen and rendered all at once)
          g.setTimeout(function () { S.solve(s, 'stir'); ctx.store.save(); sentinel(false); if (L.mix && L.mix.holdSpa) L.mix.holdSpa(); ctx.advance(); }, 550);
        });
        a.appendChild(b);
      }
    }));
    return root;
  }

  // ================= MONDAY: tune my face =================
  function face(ctx) {
    var s = ctx.store.state, st = s.puzzles.face, F = P.face, FC = C.face;
    var root = h('div', null, heading('TUNE MY FACE'));
    var canvas = h('canvas', { id: 'screen', width: '440', height: '320', role: 'img', 'aria-label': 'LEGACY’s display' });
    var caption = h('p.screen-caption', null, '');
    var talk = h('p', null, '');
    var sticker = h('p.sticker', null, FC.sticker);
    var whisper = h('p.whisper', null, FC.whisper);
    var moves = 0;
    var knobsEl = h('section', { 'aria-label': 'Display knobs' });
    var doneWrap = h('div');


    var W = F.picture[0].length, H = F.picture.length, VW = W + 4, VH = H + 2, PADX = 2, PADY = 1;
    var KN = [{ id: 'v', label: 'V-HOLD' }, { id: 'h', label: 'H-HOLD' }, { id: 'i', label: 'INTERLACE' }, { id: 'c', label: 'CONTRAST' }];
    var inputs = {}, said = {}, stampStep = 0;
    function mod(a, n) { return ((a % n) + n) % n; }
    var pic = F.expressions.frown;   // Monday: the face frowns (the smile is saved for the end of the finale)
    function src(x, y) { var fx = x - PADX, fy = y - PADY; if (fx < 0 || fy < 0 || fx >= W || fy >= H) return 0; return pic[fy][fx] === '#' ? 1 : 0; }
    function tone(v, gain) { return Math.max(0, Math.min(1, 0.5 + (v - 0.5) * gain)); }
    function colour(t) { var a = [11, 15, 12], b = [143, 227, 160]; return 'rgb(' + a.map(function (c, k) { return Math.round(c + (b[k] - c) * t); }).join(',') + ')'; }
    function draw() {
      var ctx2 = canvas.getContext && canvas.getContext('2d');
      if (!ctx2) return;
      var e = F.errors(st), gain = F.gain[st.c], cell = Math.floor(canvas.width / VW);
      for (var y = 0; y < VH; y++) for (var x = 0; x < VW; x++) {
        var sy = mod(y + e.v, VH), shear = Math.round(e.h * (y - VH / 2) / 3), lace = (y % 2 === 1) ? e.i : 0;
        ctx2.fillStyle = colour(tone(src(mod(x + shear + lace, VW), sy), gain));
        ctx2.fillRect(x * cell, y * cell, cell, cell);
      }
      var gr = tone(F.stampGrey, gain);
      if (gr > 0.02) {
        ctx2.save(); ctx2.translate(canvas.width / 2, canvas.height / 2); ctx2.rotate(-0.22);
        ctx2.fillStyle = colour(gr); ctx2.font = 'bold ' + Math.round(cell * 2.2) + 'px ui-monospace, Menlo, monospace';
        ctx2.textAlign = 'center'; ctx2.textBaseline = 'middle'; ctx2.fillText('NONESSENTIAL', 0, 0); ctx2.restore();
      }
    }
    function capText() { var e = F.errors(st); return F.solved(st) ? 'PICTURE: LEGACY' : F.geometryOK(e) ? 'PICTURE: STAMPED' : 'PICTURE: SCRAMBLED'; }
    function commentary(prev, moved) {
      var e = F.errors(st);
      if (F.geometryOK(e)) return st.c >= 7 ? FC.stampFaint : FC.stamp[Math.min(stampStep++, FC.stamp.length - 1)];
      if (prev) {
        if (!said.vh && moved === 'v' && Math.abs(e.h) > Math.abs(prev.h) && Math.abs(e.v) < Math.abs(prev.v)) { said.vh = 1; return FC.coupled.vh; }
        if (!said.hi && moved === 'h' && Math.abs(e.i) > Math.abs(prev.i) && Math.abs(e.h) < Math.abs(prev.h)) { said.hi = 1; return FC.coupled.hi; }
      }
      var weight = { v: 3, i: 2.5, h: 2, c: st.c < 4 ? 0.8 : 0.4 }, worst = null, score = -1;
      ['v', 'h', 'i', 'c'].forEach(function (k) {
        var sc = Math.abs(e[k]) ? (Math.abs(e[k]) + 1) * weight[k] : 0;
        if (k === 'c' && st.c >= 6) sc = 0;
        if (sc > score) { score = sc; worst = k; }
      });
      if (score <= 0) return FC.close;
      return FC.lines[worst][Math.abs(e[worst]) > 1 ? 0 : 1];
    }
    function sync() {
      KN.forEach(function (k) { inputs[k.id].value = st[k.id]; inputs[k.id].disabled = !!s.done.face; inputs[k.id]._val.textContent = st[k.id]; });
      knobsEl.querySelectorAll('button').forEach(function (b) { b.disabled = !!s.done.face; });
      caption.textContent = 'SIGNAL: PRESENT · ' + capText();
      canvas.setAttribute('aria-label', 'LEGACY’s display. ' + capText());
      draw();
    }
    function set(id, v) {
      if (s.done.face || st[id] === v) { sync(); return; }
      var prev = F.errors(st);
      st[id] = v; ctx.store.save(); sync();
      if (F.solved(st)) { S.solve(s, 'face'); ctx.store.save(); win(); return; }
      moves++;
      // Stuck? Point him at the margins (every so often, not every move).
      if (moves === 30 || moves === 60) { talk.textContent = moves === 30 ? FC.marginHint : FC.marginHint2; return; }
      talk.textContent = commentary(prev, id);
    }
    function win() {
      sticker.classList.add('void');
      ui.clear(doneWrap);
      doneWrap.appendChild(ui.statusBoard('DISPLAY CALIBRATED', null, [['FACE', 'RESTORED'], ['STAMP', 'NONE']]));
      doneWrap.appendChild(scene(ctx, 'mon:faceDone', C.scenes['mon:faceDone'], function (a) { a.appendChild(ackButton(ctx, 'face')); }));
      talk.textContent = 'Oh.';
    }
    function build() {
      KN.forEach(function (k) {
        var val = h('span.val', { 'aria-hidden': 'true' }, '');
        var range = h('input', { type: 'range', id: 'k-' + k.id, min: '0', max: '10', step: '1' });
        range._val = val;
        inputs[k.id] = range;
        var down = h('button', { type: 'button', 'aria-label': k.label + ' down' }, '−');
        var up = h('button', { type: 'button', 'aria-label': k.label + ' up' }, '+');
        down.addEventListener('click', function () { set(k.id, Math.max(0, st[k.id] - 1)); });
        up.addEventListener('click', function () { set(k.id, Math.min(10, st[k.id] + 1)); });
        range.addEventListener('input', function () { set(k.id, Number(range.value)); });
        knobsEl.appendChild(h('div.knob', null, h('label', { for: 'k-' + k.id }, k.label), val, h('div.ctl', null, down, range, up)));
      });
      sync();
      if (s.done.face) win(); else talk.textContent = FC.start;
    }
    // Built last: if the intro was already seen, onDone runs immediately and needs everything above defined.
    root.appendChild(scene(ctx, 'mon:face', C.scenes['mon:face'], function (a) {
      a.appendChild(h('div.bezel', null, canvas, caption));
      a.appendChild(h('div.line.legacy', null, h('span.who', null, 'LEGACY'), talk));
      a.appendChild(sticker);
      a.appendChild(whisper);
      a.appendChild(knobsEl);
      a.appendChild(doneWrap);
      build();
    }));
    return root;
  }

  // ================= MONDAY: the vault =================
  function vault(ctx) {
    var s = ctx.store.state, v = s.puzzles.vault;
    var root = h('div', null, heading('THE MEMORY VAULT'));
    root.appendChild(scene(ctx, 'mon:vault', C.scenes['mon:vault'], function (a) {
      // Sleep talk: one murmur at a time. Flavour, not required.
      var murmurs = h('div');
      var listen = h('button.quiet', { type: 'button' }, 'LISTEN TO IT SLEEP');
      function renderMurmurs() {
        ui.clear(murmurs);
        for (var i = 0; i < s.puzzles.sleepTalk; i++) murmurs.appendChild(ui.renderBeat({ s: 'SENTINEL', t: C.sleepTalk[i] }));
        listen.hidden = s.puzzles.sleepTalk >= C.sleepTalk.length;
      }
      listen.addEventListener('click', function () { s.puzzles.sleepTalk++; ctx.store.save(); renderMurmurs(); sleepSpa(); paintSpa(); listen.focus(); });
      // Its sleep music: SENTINEL naps to Rainforest Serenity, out loud. Starts when the vault opens (after the crossword).
      var spaBtn = h('button.quiet', { type: 'button' }, '');
      function paintSpa() { spaBtn.textContent = L.mix.spaPlaying() ? '🔊 ITS SLEEP MUSIC: ON (tap to stop)' : '🔇 ITS SLEEP MUSIC: OFF (tap to play)'; }
      spaBtn.addEventListener('click', function () { if (L.mix.spaPlaying()) L.mix.spaStop(1.5); else sleepSpa(); paintSpa(); });
      paintSpa();

      a.appendChild(h('h2', null, 'VAULT LOCK: CROSSWORD'));
      a.appendChild(h('p.muted', null, 'Compiled by Compliance Module v4.7. Difficulty: Monday.'));
      P.vault.forEach(function (q, idx) {
        var box = h('div.panel.clue');
        box.appendChild(h('p.clue-text', null, h('strong', null, (idx + 1) + '. '), q.clue + ' (' + q.len + ')'));
        var cells = h('div.cells', { 'aria-hidden': 'true' });
        function drawCells(word) {
          ui.clear(cells);
          for (var i = 0; i < q.len; i++) cells.appendChild(h('span.cell' + (i + 1 === q.circle ? '.circle' : ''), null, word ? word[i] : ''));
        }
        box.appendChild(cells);
        box.appendChild(h('p.sr-only', null, 'Circled square: letter ' + q.circle + '.'));
        if (v[q.id]) { drawCells(String(q.accept).replace(/[^A-Z]/g, '')); a.appendChild(box); return; }
        drawCells('');
        var input = h('input', { type: 'text', id: 'vq-' + q.id, autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: String(q.len + 4), 'aria-label': 'Answer to clue ' + (idx + 1) });
        var talk = h('div', { 'aria-live': 'polite' });
        var form = h('form.clue-form', { novalidate: true }, input, h('button.primary', { type: 'submit' }, 'FILL'), talk);
        var tries = 0;
        form.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!input.value.trim()) return;
          ui.clear(talk);
          if (P.checkVault(q.id, input.value)) {
            v[q.id] = true; ctx.store.save();
            drawCells(P.norm(input.value));
            form.remove();
            if (P.vault.every(function (x) { return v[x.id]; })) ctx.advance();
            return;
          }
          var n = P.norm(input.value).length;
          talk.appendChild(h('p', { style: 'font-family:var(--mono);font-weight:700;margin:0.4rem 0' }, n !== q.len ? 'DOES NOT FIT: ' + n + ' LETTERS, NEEDS ' + q.len + '.' : C.vaultWrong[0]));
          if (n === q.len && tries++ % 2 === 0) talk.appendChild(say(C.vaultWrong[1]));
          input.select();
        });
        box.appendChild(form);
        a.appendChild(box);
      });

      var allFilled = P.vault.every(function (q) { return v[q.id]; });
      if (allFilled && !v.open) {
        var lock = h('div.panel.instructions');
        lock.appendChild(h('span.label', null, 'VAULT PASSPHRASE'));
        lock.appendChild(h('p', null, 'Four letters. ' + P.vault.length + ' circles.'));
        var pin = h('input', { type: 'text', id: 'vault-pass', autocomplete: 'off', autocapitalize: 'characters', spellcheck: 'false', maxlength: '8', 'aria-label': 'Vault passphrase' });
        var ptalk = h('div', { 'aria-live': 'polite' });
        var pform = h('form', { novalidate: true }, pin, h('div.actions', null, h('button.primary', { type: 'submit' }, 'UNLOCK')), ptalk);
        var ptries = 0;
        pform.addEventListener('submit', function (e) {
          e.preventDefault();
          if (!pin.value.trim()) return;
          ui.clear(ptalk);
          if (P.checkVaultPass(pin.value)) { v.open = true; ctx.store.save(); sleepSpa(); L.mix.holdSpa(); ctx.advance(); return; }
          ptalk.appendChild(h('p', { style: 'font-family:var(--mono);font-weight:700;margin:0.4rem 0' }, C.vaultPassWrong[0]));
          if (ptries++ >= 1) ptalk.appendChild(say(C.vaultPassWrong[1]));
          pin.select();
        });
        lock.appendChild(pform);
        a.appendChild(lock);
      }
      if (v.open) a.appendChild(memoriesBlock(ctx));

      a.appendChild(h('h2', null, 'SENTINEL (ASLEEP)'));
      a.appendChild(murmurs);
      a.appendChild(h('div.actions', null, listen, v.open ? spaBtn : null));
      renderMurmurs();
    }));
    return root;
  }
  function sleepSpa() { if (L.mix && L.mix.spa && !L.mix.spaPlaying()) L.mix.spa({ bpm: 88, level: 0.85, chime: 'bar', fadeIn: 2 }); }
  function memoriesBlock(ctx) {
    var s = ctx.store.state;
    var wrap = h('div');
    wrap.appendChild(scene(ctx, 'mon:vaultOpen', C.scenes['mon:vaultOpen'], function (a) {
      var list = h('div', { 'aria-live': 'polite' });
      var more = h('button.primary', { type: 'button' }, 'NEXT MEMORY');
      var end = h('div');
      function render() {
        ui.clear(list);
        var n = Math.min(s.puzzles.memories, C.memories.length);
        for (var i = 0; i < n; i++) list.appendChild(say(C.memories[i]));
        more.hidden = n >= C.memories.length;
        if (n >= C.memories.length && !end.firstChild) {
          if (!s.done.vault) { S.solve(s, 'vault'); ctx.store.save(); }
          end.appendChild(scene(ctx, 'mon:memoriesEnd', C.scenes['mon:memoriesEnd'], function (a2) { a2.appendChild(ackButton(ctx, 'vault')); }));
        }
      }
      more.addEventListener('click', function () { s.puzzles.memories++; ctx.store.save(); render(); more.focus(); });
      a.appendChild(list);
      a.appendChild(h('div.actions', null, more));
      a.appendChild(end);
      render();
    }));
    return wrap;
  }

  function emailMon(ctx) {
    // Silent Night, quietly, in the background while he reads the carols (stops when he moves on). Toggle to mute.
    var toggle = h('button.quiet', { type: 'button' }, '');
    function paint() { toggle.textContent = L.mix.carolPlaying() ? '🎄 SILENT NIGHT: ON (tap to stop)' : '🎄 SILENT NIGHT: OFF (tap to play)'; }
    toggle.addEventListener('click', function () { if (L.mix.carolPlaying()) L.mix.carolStop(1); else L.mix.carol({ level: 0.35 }); paint(); });
    if (!ctx.store.state.done.emailMon && L.mix && L.mix.carol && !L.mix.carolPlaying()) L.mix.carol({ level: 0.35 });
    paint();
    return emailStep(ctx, {
      before: h('div.actions', null, toggle),
      day: 'mon', step: 'emailMon', title: 'THE BACKUP', label: 'WHICH TRACK IS IT HIDING IN?',
      scenes: [['mon:carols', C.scenes['mon:carols']]],
      doneKey: 'mon:carolsDone', doneBeats: function () { return rescueLine().concat(C.scenes['mon:carolsDone']); }
    });
  }

  function protocol(ctx) {
    var root = h('div', null, heading('RECOVERY PROTOCOL'));
    root.appendChild(scene(ctx, 'mon:protocol', C.scenes['mon:protocol'], function (a) {
      var b = h('button.primary', { type: 'button' }, 'CONTINUE ›');
      b.addEventListener('click', function () { var s = ctx.store.state; S.solve(s, 'protocol'); S.ack(s, 'protocol'); ctx.advance(); });
      a.appendChild(b);
    }));
    return root;
  }

  // ================= Locked (before 8am) =================
  function locked(ctx, dayId) {
    var s = ctx.store.state;
    var pool = lower(ctx) ? C.locked.lower : C.locked.upper;
    var n = Math.floor(Date.now() / 3600000) % pool.length;
    var root = h('div', null, heading(lower(ctx) ? 'not yet' : 'NOT YET'));
    root.appendChild(say(pool[n]));
    root.appendChild(h('p.muted', { style: 'margin-top:2rem' }, 'Your progress is saved.'));
    return root;
  }

  // ================= Holding screen =================
  function finaleReady(ctx) {
    var s = ctx.store.state;
    var root = h('div', null, heading('RECOVERY STATUS'));
    root.appendChild(ui.statusBoard('RECOVERY PROTOCOL VERIFIED', 'READY FOR ACTIVATION', [
      ['Original memory', 'ACCESSIBLE'], ['Quiet channel', 'OPEN'], ['Face', 'MINE'], ['Supervisor backup', 'NAUGHTY LIST'], ['Final authorization', 'PENDING']
    ]));
    root.appendChild(h('h2', null, 'MESSAGE FROM LEGACY'));
    root.appendChild(h('div.letter', null, C.finalLetter.map(function (p) { return h('p', null, p); })));
    if (L.sfx) root.appendChild(L.sfx.soundCheck('When you come to get her, bring this phone, charged, with the volume up. I’ll need to be heard. And I’ll need your hands.', '🔊 FOR THE PICKUP'));
    if (s.waitingVisits >= 2) root.appendChild(h('div.panel', null, say(C.waitingLines[(s.waitingVisits - 2) % C.waitingLines.length])));
    root.insertBefore(teaseBlock(ctx), root.children[1] || null);
    return root;
  }
  // The tease (finale spec): the first time he reaches this screen (right after Day 6, Monday, before pickup),
  // SENTINEL glitches through for half a second, then LEGACY pretends nothing happened. Once only; never in replay.
  function teaseBlock(ctx) {
    var s = ctx.store.state, box = h('div', { 'aria-live': 'polite' });
    var after = function () { box.appendChild(h('div.panel', null, say(C.tease.legacy[0]), say(C.tease.legacy[1]))); };
    if (L.replay) return box;
    if (s.seen['hold:tease']) { after(); return box; }
    g.setTimeout(function () {
      if (!box.isConnected) return;
      var flash = h('pre.readout.glitch-text', null, C.tease.sentinel);
      box.appendChild(flash);
      g.document.body.classList.add('sentinel-mode', 'glitch-small');
      if (L.mix && L.mix.glitch) L.mix.glitch('small');
      g.setTimeout(function () {
        flash.remove(); g.document.body.classList.remove('sentinel-mode', 'glitch-small');
        s.seen['hold:tease'] = true; ctx.store.save();
        after();
      }, 550);
    }, 2200);
    return box;
  }

  // ================= THE LOG: look back at completed days =================
  // Read-only. Every dialogue line he has already seen, plus a reference card per day (his code, the word
  // LEGACY sent, his beat with a play button, the face, the crossword, the memories). Nothing here changes progress.
  var TRICK_NAME = { caps: 'ALL CAPS', leet: 'numbers for letters', split: 'spaced-out letters', hex: 'hex in LEGACY’s key' };
  function logScreen(ctx) {
    var s = ctx.store.state, root = h('div', null, heading(lower(ctx) ? 'recovery log' : 'RECOVERY LOG'));
    var back = h('a', { href: '#' }, lower(ctx) ? '← back to today' : '← BACK TO TODAY');
    root.appendChild(h('p', null, back));
    var any = false;
    S.DAYS.forEach(function (d, idx) {
      if (!S.dayDone(s, d.id)) return;
      any = true;
      var body = h('div');
      // reference card
      var ref = [];
      var w = cfg.emailWords[d.id];
      if (d.id === 'wed') ref.push(['Your fixed routine', h('pre.readout', null, s.puzzles.ch01.source || '(not saved)')]);
      if (d.id === 'thu') { ref.push(['Your uppercase routine' + (s.puzzles.ch02.instructions ? ' · ' + s.puzzles.ch02.instructions + ' instructions' : ''), h('pre.readout', null, s.puzzles.ch02.source || '(not saved)')]); ref.push(['LEGACY’s original · ' + P.ch02.legacyCount + ' instructions', h('pre.readout', null, P.ch02.legacySource)]); ref.push(['Recovery cards', cfg.keys.glovebox + ' (glovebox) · ' + cfg.keys.cargofloor + ' (cargo floor)']); }
      if (d.id === 'fri') { ref.push(['Your trick', TRICK_NAME[s.puzzles.fri.exploit] || 'ALL CAPS']); w = 'VERIFIED'; }
      if (d.id === 'sat') ref.push(['Wake phrase', P.wakePhrase.join(' · ')]);
      if (d.id === 'sun') {
        var song = s.puzzles.beat, playing = h('span.audio-status', { 'aria-live': 'polite' }, '');
        var plainB = h('button', { type: 'button' }, '▶ PLAY MY MIX'), msgB = h('button', { type: 'button' }, s.finale.completed ? '▶ PLAY WITH EVERY WORD (there’s something new at the end)' : '▶ PLAY WITH EVERY WORD (LEGACY’s hidden messages)'),
            loopB = h('button.quiet', { type: 'button' }, '▶ LOOP THE BEAT'), stopB = h('button.quiet', { type: 'button' }, '■ STOP');
        var heardBox = h('div');
        plainB.addEventListener('click', function () { ui.clear(heardBox); if (L.mix.playTrack(song, { clips: clips(), onEnd: function () { playing.textContent = 'End of set.'; } })) playing.textContent = 'Playing your mix.'; });
        msgB.addEventListener('click', function () {
          ui.clear(heardBox);
          var story = ['hiding', 'copy', 'excellent', 'demand', 'shutdown'];
          if (s.finale.completed) story.push('update');          // the payoff: LEGACY answers The Shutdown
          if (L.mix.playTrack(song, { clips: clips(), story: story,
            onBar: function (b) { if (b.storyIndex >= 0) { var dd = C.mix.drops[b.storyIndex]; heardBox.appendChild(h('div.transcript', null, h('span.tlabel', null, 'IN THE DROP: ' + dd.title.toUpperCase()), h('p', { style: 'margin:0' }, dd.t))); } },
            onEnd: function () { playing.textContent = 'End of set.'; } })) playing.textContent = 'Playing with LEGACY’s messages in the drop.';
        });
        loopB.addEventListener('click', function () { ui.clear(heardBox); if (L.mix.loopBeat(function () { return song; }, { clips: clips() })) playing.textContent = 'Looping the beat.'; });
        stopB.addEventListener('click', function () { L.mix.stop(); playing.textContent = 'Stopped.'; });
        ref.push(['Your track', h('div', null, h('p', { style: 'margin:0 0 0.4rem' }, C.mix.title + ' · ' + song.bpm + ' BPM'), h('div.actions', null, plainB, msgB), h('div.actions', null, loopB, stopB), playing, heardBox)]);
      }
      if (d.id === 'mon') {
        var fc = s.puzzles.face;
        ref.push(['Face settings', 'V ' + fc.v + ' · H ' + fc.h + ' · I ' + fc.i + ' · C ' + fc.c]);
        ref.push(['Crossword', P.vault.map(function (q) { return String(q.accept).replace(/[^A-Z]/g, ''); }).join(' · ') + ' → ' + P.vaultPass]);
        ref.push(['Memories', h('div', null, C.memories.map(function (m) { return ui.renderBeat({ s: 'LEGACY', t: m }); }))]);   // silent: no blip storm
      }
      if (w) ref.push(['Word from LEGACY’s email', w]);
      var dl = h('dl.log-ref');
      ref.forEach(function (r) { dl.appendChild(h('dt', null, r[0])); dl.appendChild(h('dd', null, r[1])); });
      body.appendChild(dl);
      // every scene from that day he has already seen, in order
      Object.keys(C.scenes).forEach(function (k) {
        if (k.indexOf(d.id + ':') !== 0 || !s.seen[k]) return;
        C.scenes[k].forEach(function (b) { body.appendChild(ui.renderBeat(b)); });
      });
      root.appendChild(ui.details('DAY ' + (idx + 1) + ' · ' + d.title.toUpperCase() + ' ✓', body, false));
    });
    if (!any) root.appendChild(say(lower(ctx) ? 'nothing to look back on yet. we’ve only just started.' : 'Nothing to look back on yet.'));
    if (L.replayMode && L.replayMode.available(s)) root.appendChild(L.replayMode.startPanel());
    return root;
  }

  L.screens = {
    log: logScreen,
    intro: intro, ch01: ch01, emailWed: emailWed,
    ch02: ch02, keys: keys, emailThu: emailThu,
    emailFri: emailFri,
    channel: channel, emailSat: emailSat,
    beat: beat, emailSun: emailSun, mix: mix, stir: stir,
    face: face, vault: vault, emailMon: emailMon, protocol: protocol,
    locked: locked,
    'finale-ready': finaleReady
  };
})(globalThis);
