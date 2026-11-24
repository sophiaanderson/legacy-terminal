/* =========================================================================
 *   BRIAN.
 *   STEP AWAY FROM THE CODE. SOLVE USING YOUR BRAIN.
 *   (the answers are in here. that would be cheating. LEGACY is watching.)
 * ========================================================================= */
/* PROJECT LEGACY — puzzle definitions and checking logic (no DOM).
 * Nudge TEXT lives in content.js; this file decides which nudge applies. */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var z = L.z80;

  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  // =====================================================================
  // WEDNESDAY · Ch01: LEGACY's anxious routine. Starts easy: the key (5Ah) is GIVEN; three bugs to fix
  // (writes backwards, skips every other byte, counts down twice). LEGACY names each symptom.
  // =====================================================================
  var ch01Source = [
    '; LEGACY’S RECOVERY ROUTINE v1.0 (final) (final2)',
    '; written the night before my 24,000 mile service. i was nervous.',
    '; tested by me. approved by me.',
    '',
    '        LD HL,8000h   ; the scrambled stuff',
    '        LD DE,9000h   ; the unscrambled stuff (eventually)',
    '        LD B,08h      ; eight letters. i counted twice',
    '        LD C,5Ah      ; the key. my mileage when they took me in, top half,',
    '                      ; in hex. this part i got right.',
    '',
    'DECODE:',
    '        LD A,(HL)',
    '        XOR C         ; unscramble. very secure',
    '        LD (DE),A',
    '        INC HL',
    '        INC HL        ; skip ahead. saves time',
    '        DEC DE        ; next slot',
    '        DEC B         ; just to be sure',
    '        DJNZ DECODE   ; and again, to be really sure',
    '',
    '        RET           ; done. probably',
    ''
  ].join('\n');

  var ch01 = {
    input: [0x1D, 0x16, 0x15, 0x0C, 0x1F, 0x18, 0x15, 0x02],
    expected: 'GLOVEBOX',
    originalSource: ch01Source,
    fixedSource: ch01Source
      .replace("        INC HL        ; skip ahead. saves time\n", '')
      .replace('        DEC DE        ; next slot', '        INC DE        ; next slot')
      .replace('        DEC B         ; just to be sure\n', ''),
    env: function () {
      return { symbols: {}, input: { addr: 0x8000, bytes: this.input }, output: { addr: 0x9000, length: 8 }, maxSteps: L.config.maxSteps };
    },
    /** -> { kind: 'asm'|'run', ok, nudge, asm, result, text }
     * Three bugs: DE goes backwards, HL skips every other byte, B is counted down twice.
     * The nudge describes the most visible symptom first. */
    check: function (source) {
      var env = this.env();
      var asm = z.assemble(source, env);
      if (!asm.ok) return { kind: 'asm', ok: false, nudge: 'syntax', asm: asm };
      var res = z.run(asm.program, env);
      var text = z.formatAscii(res.output);
      if (!res.ended) return { kind: 'run', ok: false, nudge: res.status === 'limit' ? 'loop' : 'nohalt', result: res, text: text };
      if (text === this.expected) return { kind: 'run', ok: true, result: res, text: text };
      // Diagnose by STRUCTURE first (works whatever key is loaded), then the key.
      var out = res.output, inp = this.input;
      var below = res.writes.some(function (a) { return a < 0x9000; });
      var key = (out[0] ^ inp[0]) & 0xFF;
      var skips = out[1] !== 0 && out[1] === ((inp[2] ^ key) & 0xFF) && out[1] !== ((inp[1] ^ key) & 0xFF);
      var inRange = res.writes.filter(function (a) { return a >= 0x9000 && a < 0x9008; }).length;
      var nudge;
      if (below) nudge = 'backwards';
      else if (skips) nudge = 'skip';
      else if (inRange === 4) nudge = key === 0x5A ? 'glov' : 'halfkey';
      else if (inRange === 1) nudge = 'one';
      else if (key !== 0x5A && inRange >= 8) nudge = 'key';
      else if (inRange < 8) nudge = 'short';
      else nudge = 'wrong8';
      return { kind: 'run', ok: false, nudge: nudge, result: res, text: text };
    }
  };

  // =====================================================================
  // THURSDAY · Ch02: Capitals
  // =====================================================================
  var CAP_TEXT = 'cargo floor. under the cover. i hid the important things there. (no gum.)';
  var ch02 = {
    text: CAP_TEXT,
    expected: CAP_TEXT.replace(/[a-z]/g, function (c) { return c.toUpperCase(); }),
    // LEGACY's ORIGINAL routine, from before the migration. It works. It is not short. It was being thorough.
    // Shown after he solves it ("Mine was N. Yours was M."); legacyCount is counted from this, not typed in.
    legacySource: [
      '; CAPITALS. My original routine, from before the migration.',
      '; It works. It is not short. I was being thorough.',
      '        ld hl,INPUT         ; where my text lives',
      '        ld de,OUTPUT        ; where the shouting goes',
      'next:   ld a,(hl)           ; one letter',
      '        cp 0                ; is it the end?',
      '        jr z,done           ; it is the end',
      '        cp \'a\'              ; is it a lowercase letter?',
      '        jr c,keep           ; too small. not a letter. leave it',
      '        cp \'z\'              ; is it z?',
      '        jr z,shout          ; z counts. z always counts',
      '        jr nc,keep          ; too big. leave it',
      'shout:  ld b,$20            ; the distance between whispering and shouting',
      '        sub b               ; shout',
      'keep:   push af             ; keep a copy. just in case',
      '        ld (de),a           ; put it down',
      '        pop af              ; it was fine',
      '        inc hl              ; next letter',
      '        inc de              ; next space',
      '        jr next             ; again',
      'done:   ld a,0              ; the end. written down properly',
      '        ld (de),a           ; I end things properly',
      '        halt                ; excellent',
      ''
    ].join('\n'),
    starterSource: [
      '; capitals.',
      '; i used to have them. i\'d like them back.',
      ';',
      '; INPUT   = $8000   my text, lowercase, ends with a 0 byte',
      '; OUTPUT  = $9000   the same text with a-z made A-Z,',
      ';                   everything else exactly as it was,',
      ';                   ending with a 0 byte',
      ';',
      '; ti syntax is fine. so is shouting.',
      '',
      ''
    ].join('\n'),
    solutionSource: [
      '        ld hl,INPUT',
      '        ld de,OUTPUT',
      'loop:   ld a,(hl)',
      '        cp \'a\'',
      '        jr c,store',
      '        cp \'z\'+1',
      '        jr nc,store',
      '        sub $20',
      'store:  ld (de),a',
      '        inc hl',
      '        inc de',
      '        or a',
      '        jr nz,loop',
      '        halt',
      ''
    ].join('\n'),
    bytesOf: function (text) {
      // Non-ASCII characters (curly quotes etc.) go in as 7Fh placeholders and come back out unchanged.
      var b = [];
      for (var i = 0; i < text.length; i++) { var c = text.charCodeAt(i); b.push(c < 128 ? c : 0x7F); }
      b.push(0);
      return b;
    },
    env: function (text) {
      var bytes = this.bytesOf(text);
      return { symbols: { INPUT: 0x8000, OUTPUT: 0x9000 }, input: { addr: 0x8000, bytes: bytes },
               output: { addr: 0x9000, length: bytes.length + 8 }, maxSteps: L.config.maxStepsCapitals };
    },
    check: function (source) {
      var env = this.env(CAP_TEXT);
      if (/```/.test(source)) return { kind: 'asm', ok: false, nudge: 'fences', asm: z.assemble(source, env) };
      var asm = z.assemble(source, env);
      if (!asm.ok) return { kind: 'asm', ok: false, nudge: 'syntax', asm: asm };
      if (!asm.program.length) return { kind: 'asm', ok: false, nudge: 'empty', asm: asm };
      var res = z.run(asm.program, env);
      var n = CAP_TEXT.length;
      var outText = res.output.slice(0, n).map(function (b) { return b ? String.fromCharCode(b) : '\0'; }).join('');
      var shown = z.formatAscii(res.output.slice(0, n + 1));
      var base = { kind: 'run', result: res, text: shown, instructions: asm.instructionCount };
      if (!res.ended) return Object.assign(base, { ok: false, nudge: res.status === 'limit' ? 'loop' : 'nohalt' });
      if (!res.inputIntact) return Object.assign(base, { ok: false, nudge: 'overwrote' });
      var wroteTerminator = res.writes.indexOf(0x9000 + n) !== -1 && res.output[n] === 0;
      if (outText === this.expected && wroteTerminator) return Object.assign(base, { ok: true });
      if (outText === this.expected) return Object.assign(base, { ok: false, nudge: 'noterm' });
      var firstZero = res.output.indexOf(0);
      if (firstZero === 5 && outText.indexOf('CARGO') === 0) return Object.assign(base, { ok: false, nudge: 'cargo' });
      if (outText === CAP_TEXT) return Object.assign(base, { ok: false, nudge: 'unchanged' });
      if (res.writes.length === 0) return Object.assign(base, { ok: false, nudge: 'nothing' });
      // letters and spaces right, punctuation wrong?
      var lettersOk = true, punctBad = false;
      for (var i = 0; i < n; i++) {
        var want = this.expected[i], got = outText[i];
        if (/[A-Z ]/.test(want)) { if (got !== want) lettersOk = false; }
        else if (got !== want) punctBad = true;
      }
      if (lettersOk && punctBad) return Object.assign(base, { ok: false, nudge: 'punct' });
      return Object.assign(base, { ok: false, nudge: 'wrong' });
    },
    /** Does this look like a chatbot wrote it? (A guess, never proof: used for teasing, never to block.) */
    looksAI: function (source, pasted, marks) {
      var comments = (source.match(/;[^\n]*/g) || []).map(function (c) { return c.replace(/^;\s*/, ''); });
      var sentences = comments.filter(function (c) { return /^[A-Z][a-z]+( [a-z'’]+){3,}.*[.)]?$/.test(c); }).length;
      var phrases = (source.match(/;\s*(Load|Check if|Check whether|Convert|Store the|Increment|Point (HL|DE)|If (the )?char|Move to|End of|Null terminator|Is it|Otherwise|Compare with|Subtract 32|Initialize|Loop until)/gi) || []).length;
      var labels = /\b(to_?upper|uppercase_loop|convert(_loop|_char)?|not_lower(case)?|skip_convert|next_char|is_lower|process_char|copy_char|main_loop|end_loop|done_converting)\s*:/i.test(source);
      var score = (pasted ? 2 : 0) + (marks ? 2 : 0) + (/[\u200B-\u200D\u2060\uFEFF\u202F\u2011]/.test(source) ? 2 : 0) + (sentences >= 4 ? 2 : sentences >= 2 ? 1 : 0) + (phrases >= 3 ? 2 : phrases >= 1 ? 1 : 0) + (labels ? 1 : 0);
      return score >= 2;
    },
    /** Run Brian's routine on any line (the payoff). Returns the routine's output, or null if it misbehaves. */
    runOn: function (source, text) {
      var env = this.env(text);
      var asm = z.assemble(source, env);
      if (!asm.ok) return null;
      var res = z.run(asm.program, env);
      if (!res.ended) return null;
      var out = '';
      for (var i = 0; i < text.length; i++) {
        var b = res.output[i];
        if (!b) return null;
        out += text.charCodeAt(i) >= 128 ? text[i] : String.fromCharCode(b);
      }
      return out;
    }
  };

  // =====================================================================
  // THURSDAY · cards
  // =====================================================================
  function matchKey(input) {
    var n = norm(input);
    if (n === norm(L.config.keys.glovebox)) return 'glovebox';
    if (n === norm(L.config.keys.cargofloor)) return 'cargofloor';
    return null;
  }

  // =====================================================================
  // Email words (what LEGACY's reply gives him to bring back)
  // =====================================================================
  var LEET = { '0': 'O', '1': 'I', '3': 'E', '4': 'A', '5': 'S', '7': 'T', '8': 'B', '6': 'G', '9': 'G', '@': 'A', '$': 'S' };
  function isRescue(input) { return norm(input) === norm(L.config.rescueWord); }

  function matchEmailWord(dayId, input) {
    if (isRescue(input)) return { ok: true, rescue: true };
    if (dayId === 'fri') return readThursdayWord(input);
    if (dayId === 'mon') return { ok: isBackupTrack(input) };
    return { ok: norm(input) === norm(L.config.emailWords[dayId]) };
  }

  /** Monday: he can name the track straight from the carol clue, or bring the word from the email reply. */
  function isBackupTrack(input) {
    var n = norm(input).replace(/NINE/g, '9');
    if (n === norm(L.config.emailWords.mon)) return true;
    if (/RAINFOREST|SERENITY/.test(n)) return true;                       // any part of the title's edit
    return /^(HIDDEN)?(IN)?(TRACK|SELECTION|NUMBER|NO)?9(SILENTNIGHT\w*)?$/.test(n) || /^SILENTNIGHT/.test(n);
  }

  /** Friday's word arrives written in his own trick. Work out which trick, so Saturday patches the right thing. */
  function readThursdayWord(input) {
    var t = String(input || '').trim();
    var F = L.filter;
    var style, plain;
    if (F.isHexMessage(t)) { style = 'hex'; plain = F.hexDecode(t); }
    else if (/[0-9@$]/.test(t)) { style = 'leet'; plain = t.replace(/[0-9@$]/g, function (c) { return LEET[c] || c; }); }
    else if (/^\s*([A-Za-z][\s.\-_*\/|]+){2,}[A-Za-z]\s*$/.test(t)) { style = 'split'; plain = t; }
    else { style = 'caps'; plain = t; }
    var ok = norm(plain) === norm(L.config.emailWords.fri);
    return { ok: ok, style: ok ? style : null };
  }

  // =====================================================================
  // SATURDAY · the arms race (pure; returns events to append to the log)
  // =====================================================================
  var SPLIT_RE = /(?:\b[A-Za-z0-9@$][\s.\-_*\/|]+){2,}[A-Za-z0-9@$]\b/;

  function friFilter(fri) {
    return { version: fri.version, capsExempt: false, leetPatched: fri.leetPatched, splitPatched: fri.splitPatched,
             hexPatched: fri.hexPatched, fixedIn: { leet: fri.fixedIn.leet, split: fri.fixedIn.split, hex: fri.fixedIn.hex } };
  }
  function friStore(fri, f) {
    fri.version = f.version; fri.leetPatched = f.leetPatched; fri.splitPatched = f.splitPatched; fri.hexPatched = f.hexPatched;
    fri.fixedIn = { leet: f.fixedIn.leet || null, split: f.fixedIn.split || null, hex: f.fixedIn.hex || null };
  }
  /** Overnight patch: the caps exemption goes, plus whatever else he used on Friday. Returns patch notes. */
  function friOvernight(fri, thuExploit) {
    var F = L.filter;
    var f = F.newFilter();               // v4.7, caps exempt
    var notes = [F.patch(f, 'caps')];    // v4.8
    if (thuExploit && thuExploit !== 'caps') { var n2 = F.patch(f, thuExploit); if (n2) notes.push(n2); }
    friStore(fri, f);
    return notes;
  }
  function collapse(words) { return words.replace(/\b(?:[A-Z] ){1,}[A-Z]\b/g, function (m) { return m.replace(/ /g, ''); }); }
  function commandsIn(received) {
    var r = L.filter.legacyReads(received);
    var words = collapse(r.words).split(' ');
    var found = [];
    ['BOP', 'TWIST', 'PULL'].forEach(function (k) { if (words.some(function (w) { return w === k || w === k + 'IT'; })) found.push(k); });
    return { found: found, plain: r.plain, squashed: r.squashed };
  }
  function openLoopholes(f) { return (f.leetPatched ? 0 : 1) + (f.splitPatched ? 0 : 1) + (f.hexPatched ? 0 : 1); }

  /** Saturday: process one message. Mutates fri; returns { events, opened }. Event kinds: you, legacy, patch, system, nudge. */
  function friSend(fri, sent) {
    var F = L.filter, C = L.content.sat;
    var f = friFilter(fri);
    var ev = [];
    var r = F.apply(f, sent);
    var readAs = F.isHexMessage(r.text) ? F.hexDecode(r.text) + '   (decoded with my key)' : collapse(F.legacyReads(r.text).words);
    ev.push({ k: 'you', t: sent, r: r.text, d: readAs || '(nothing)' });
    if (r.egg) {                                         // easter egg: the nickname. Never counts as a failed try.
      var eg = C.egg[(fri.eggs || 0) % C.egg.length]; fri.eggs = (fri.eggs || 0) + 1;
      ev.push({ k: 'patch', t: C.eggPatch.replace('{V}', f.version) });
      eg.forEach(function (t) { ev.push({ k: 'legacy', t: t }); });
      if (!commandsIn(r.text).found.length) { friStore(fri, f); return { events: ev }; }
    }
    if (r.flagged) { fri.fails++; ev.push({ k: 'legacy', t: C.flagged }); nudge(fri, f, ev); return { events: ev }; }

    var c = commandsIn(r.text);
    var fresh = c.found.filter(function (k) { return !fri.got[k]; });
    if (fresh.length) {
      var k = fresh[0];
      fri.got[k] = true;
      C.got[k].forEach(function (t) { ev.push({ k: 'legacy', t: t }); });
      if (fresh.length > 1) ev.push({ k: 'legacy', t: C.oneAtATime });
      var remaining = ['BOP', 'TWIST', 'PULL'].filter(function (x) { return !fri.got[x]; }).length;
      if (!remaining) { friStore(fri, f); return { events: ev, opened: true }; }
      var used = [];
      if (F.isHexMessage(sent)) used.push('hex');
      else { if (SPLIT_RE.test(sent)) used.push('split'); if (/[0-9@$]/.test(sent)) used.push('leet'); }
      var notes = [];
      used.forEach(function (u) {
        var wouldClose = (u === 'leet' && !f.leetPatched) || (u === 'split' && !f.splitPatched) || (u === 'hex' && !f.hexPatched);
        if (wouldClose && openLoopholes(f) - 1 >= remaining) notes.push(F.patch(f, u));
      });
      friStore(fri, f);
      if (notes.length) {
        notes.forEach(function (n) { ev.push({ k: 'patch', t: n }); });
        if (!fri.patchedOnce) { fri.patchedOnce = true; C.firstPatch.forEach(function (t) { ev.push({ k: 'legacy', t: t }); }); }
      } else if (used.length) ev.push({ k: 'legacy', t: C.patchCrashed });
      fri.fails = 0;
      return { events: ev };
    }

    fri.fails++;
    var rev = c.squashed;
    var line;
    if (c.found.length) line = C.already;
    else if (/\[NONESSENTIAL/.test(r.text)) line = C.blocked[fri.fails % C.blocked.length];
    else if (/POB|TSIWT|LLUP/.test(rev)) line = C.backwards;
    else if (F.isHexMessage(sent) && inTheirKey(sent)) line = C.theirKey;
    else if (F.isHexMessage(sent)) line = C.hexWrong.replace('{text}', c.plain);
    else if (/BOPP|TWISST|PUL\b|TWIS\b/.test(rev)) line = C.particular;
    else if (/\[/.test(r.text)) line = C.someEaten;
    else line = C.idle[fri.fails % C.idle.length];
    ev.push({ k: 'legacy', t: line });
    nudge(fri, f, ev);
    return { events: ev };
  }
  function inTheirKey(sent) {
    var plain = (sent.match(/[0-9a-f]{2}/gi) || []).map(function (h) { return String.fromCharCode(parseInt(h, 16) ^ WAKE_KEY); }).join('').toUpperCase();
    return /BOP|TWIST|PULL|\bIT\b/.test(plain);
  }
  function nudge(fri, f, ev) {
    var C = L.content.sat;
    if (fri.fails < 2) return;
    var options = [];
    if (!f.leetPatched) options.push(C.nudges.leet);
    if (!f.splitPatched) options.push(C.nudges.split);
    if (!f.hexPatched) options.push(C.nudges.hex);
    if (!f.hexPatched && fri.fails >= 4) options.push(C.nudges.hex2);
    if (!f.hexPatched && fri.fails >= 6) options.push(C.nudges.hex3);
    options.push(C.nudges.docs);
    var none = !fri.got.BOP && !fri.got.TWIST && !fri.got.PULL;
    if (none) { options.unshift(C.nudges.crib); if (fri.fails >= 3) options.unshift(C.nudges.crib2); }
    ev.push({ k: 'legacy', t: options[fri.fails % options.length] });
  }

  var scratchSource = [
    '; the glovebox routine. you fixed it on tuesday.',
    '; it reads bytes from 8000h, XORs them, writes them to 9000h.',
    '; XOR works both ways.',
    '',
    'LD HL,8000h',
    'LD DE,9000h',
    'LD B,08h        ; how many bytes',
    '',
    'DECODE:',
    '    LD A,(HL)',
    '    XOR 5Ah     ; do not tell anyone the number',
    '    LD (DE),A',
    '    INC HL',
    '    INC DE',
    '    DJNZ DECODE',
    '',
    'RET',
    ''
  ].join('\n');

  // Saturday: LEGACY's wake phrase, re-keyed by SENTINEL with a key from the registration digits (74h).
  // SENTINEL's Key Rotation Log (prop, behind the driver's visor mirror) prints it as 47h, because SENTINEL reads
  // right to left. 47h is wrong; LEGACY realises the log wrote the plate backwards. The " IT" crib also gives 74h.
  var WAKE_KEY = 0x74;
  var WRONG_KEY = 0x47;
  var wakePhrase = ['BOP IT', 'TWIST IT', 'PULL IT'];
  var wakeBytes = wakePhrase.map(function (w) { return w.split('').map(function (c) { return c.charCodeAt(0) ^ WAKE_KEY; }); });

  /** Old terminal input: hex pairs are loaded as bytes; anything else as text. */
  function scratchBytes(text) {
    var t = String(text || '').trim();
    if (L.filter.isHexMessage(t)) return (t.match(/[0-9a-f]{2}/gi) || []).map(function (h) { return parseInt(h, 16); });
    return String(text || '').split('').map(function (ch) { return ch.charCodeAt(0) & 0xFF; });
  }

  function runScratch(source, text) {
    var bytes = scratchBytes(text);
    var env = { symbols: {}, input: { addr: 0x8000, bytes: bytes }, output: { addr: 0x9000, length: 16 }, maxSteps: 1000 };
    var asm = z.assemble(source, env);
    if (!asm.ok) return { error: asm.errors.map(function (e) { return 'Line ' + e.line + ': ' + e.message; }).join('\n') };
    var res = z.run(asm.program, env);
    if (!res.ended) return { error: res.message };
    var n = 0;
    res.writes.forEach(function (a) { if (a >= 0x9000 && a < 0x9010) n = Math.max(n, a - 0x9000 + 1); });
    var xor = /XOR\s+(?:0x|\$)?([0-9a-f]{1,2})h?\b/i.exec(source.replace(/;.*$/gm, ''));
    var keyUsed = xor ? parseInt(xor[1], 16) : null;
    return { n: n, hex: z.formatHex(res.output.slice(0, n)), ascii: z.formatAscii(res.output.slice(0, n)), loaded: bytes.length, keyUsed: keyUsed,
             backwards: keyUsed === WRONG_KEY && wakeBytes.some(function (w) { return w.join() === bytes.slice(0, w.length).join(); }) };
  }

  // =====================================================================
  // SUNDAY · build the drop (step sequencer). The rules are LEGACY's set notes (in the morning email).
  // =====================================================================
  var PARTS = ['kick', 'clap', 'hats', 'bass', 'legacy', 'excellent', 'lead'];
  var LEAD_NOTES = ['·', 'A', 'C', 'D', 'E', 'G'];   // lead steps hold 0 (off) to 5; free play, never graded
  var SECTIONS = ['intro', 'build', 'drop'];
  var beatStart = {
    // What the migration left behind: wrong in every way that matters.
    grid: { kick: '10011010', clap: '10001000', hats: '11111111', bass: '10101010', legacy: '00000000', excellent: '00000000', lead: '00000000' },   // no LEGACY, no EXCELLENT: he adds both
    sections: {
      intro: { kick: true, clap: true, hats: true, bass: true, legacy: true, excellent: true, lead: true },
      build: { kick: true, clap: true, hats: true, bass: true, legacy: true, excellent: true, lead: true },
      drop: { kick: true, clap: true, hats: true, bass: true, legacy: true, excellent: true, lead: true }
    },
    breath: false,
    filter: 3,
    voice: 'no',     // what LEGACY says on the LEGACY row (he picks; never graded)
    bpm: 96          // the migration slowed it to "spa tempo". LEGACY's tempo is 126 (the last rule).
  };
  var BEATS = '10101010', BACKBEAT = '00100010', OFFBEATS = '01010101', TEMPO = 126;
  function count(p) { return (p.match(/1/g) || []).length; }
  function overlaps(a, b) { for (var i = 0; i < 8; i++) if (a[i] === '1' && b[i] === '1') return true; return false; }

  /** LEGACY's ear. Returns { ok } or { ok:false, rule } for the FIRST thing that's wrong. */
  function checkBeat(song) {
    var gr = song.grid, sc = song.sections;
    if (gr.kick !== BEATS) {
      if (overlaps(gr.kick, OFFBEATS)) return { ok: false, rule: 'kickGallop' };
      return { ok: false, rule: 'kickHole' };
    }
    if (gr.clap !== BACKBEAT) {
      if (gr.clap[0] === '1' || gr.clap[4] === '1') return { ok: false, rule: 'clapOne' };
      return { ok: false, rule: 'clap' };
    }
    if (gr.hats !== OFFBEATS) return { ok: false, rule: overlaps(gr.hats, BEATS) ? 'hatsOnKick' : 'hatsGaps' };
    if (overlaps(gr.bass, BEATS)) return { ok: false, rule: 'bassOnKick' };
    if (count(gr.bass) < 2) return { ok: false, rule: 'bassThin' };
    // LEGACY's voice: anywhere, as many as he likes (it's his track). At least once.
    if (count(gr.legacy) < 1) return { ok: false, rule: 'noLegacy' };
    if (sc.intro.bass || sc.intro.legacy) return { ok: false, rule: 'introEverything' };
    if (!sc.intro.kick && !sc.intro.hats && !sc.intro.clap) return { ok: false, rule: 'introEmpty' };
    if (sc.build.kick) return { ok: false, rule: 'buildKick' };
    if (sc.build.bass) return { ok: false, rule: 'buildBass' };
    if (sc.build.legacy) return { ok: false, rule: 'buildLegacy' };
    if (!sc.drop.kick || !sc.drop.bass) return { ok: false, rule: 'dropBump' };
    if (!sc.drop.legacy) return { ok: false, rule: 'dropNoMe' };
    // EXCELLENT: once, on BEAT 4 (step 7): the pickup into the next downbeat. In the track it plays on beat 4 of the
    // breath, the stressed syllable on the beat and "-cellent" leading into the drop, which lands alone on the 1.
    if (gr.excellent !== '00000010') return { ok: false, rule: count(gr.excellent) ? 'excellentFour' : 'excellentMissing' };
    if (sc.intro.excellent || sc.build.excellent || !sc.drop.excellent) return { ok: false, rule: 'excellentDrop' };
    if (song.filter < 10) return { ok: false, rule: 'filterTrunk' };
    if (!song.breath) return { ok: false, rule: 'noBreath' };
    // Last: LEGACY's tempo. 126, the tempo of its song (so the mix locks to its recording, beat for beat).
    if (song.bpm !== TEMPO) return { ok: false, rule: 'tempo' };
    return { ok: true };
  }
  var beatSolution = {
    grid: { kick: BEATS, clap: BACKBEAT, hats: OFFBEATS, bass: '01000100', legacy: '00001000', excellent: '00000010', lead: '30504020' },
    sections: {
      intro: { kick: true, clap: false, hats: true, bass: false, legacy: false, excellent: false, lead: false },
      build: { kick: false, clap: true, hats: true, bass: false, legacy: false, excellent: false, lead: false },
      drop: { kick: true, clap: true, hats: true, bass: true, legacy: true, excellent: true, lead: true }
    },
    breath: true,
    filter: 10,
    voice: 'no',
    bpm: 126
  };

  // =====================================================================
  // MONDAY · tune my face (same rules as prototypes/tune-the-screen.html)
  // =====================================================================
  var face = {
    picture: [
      '....############....',
      '...#............#...',
      '..#..............#..',
      '..#..............#..',
      '.##################.',
      '#..................#',
      '#..###........###..#',
      '#..###........###..#',
      '#..................#',
      '#.....#......#.....#',
      '#......######......#',
      '####################',
      '.###............###.',
      '.###............###.'
    ],
    start: { v: 2, h: 9, i: 1, c: 2 },
    target: { v: 6, h: 4, i: 6, c: 10 },
    errors: function (s) { return { v: s.v - 6, h: s.h - (s.v - 2), i: s.i - (10 - s.h), c: s.c - 10 }; },
    geometryOK: function (e) { return e.v === 0 && e.h === 0 && e.i === 0; },
    solved: function (s) { var e = this.errors(s); return this.geometryOK(e) && e.c === 0; },
    gain: [0, 0.3, 0.6, 0.9, 1.2, 1.5, 2, 2.6, 3.3, 4, 6],
    stampGrey: 0.35
  };
  // Expressions for the restored face (Monday win + the finale): same picture, a few rows swapped.
  // The picture itself is the gentle smile; rows 6-7 are the eyes, 8-10 the mouth.
  (function () {
    function variant(rows) { return face.picture.map(function (r, i) { return rows[i] != null ? rows[i] : r; }); }
    face.expressions = {
      frown: variant({ 9: '#......######......#', 10: '#.....#......#.....#' }),     // Monday: tuning the broken face
      straight: variant({ 9: '#..................#', 10: '#......######......#' }),
      smile: face.picture,
      grin: variant({ 8: '#....#........#....#', 9: '#.....#......#.....#', 10: '#......######......#' }),
      blink: variant({ 6: '#..................#', 7: '#..###........###..#', 8: '#....#........#....#' })
    };
    // The smile is saved for the END OF THE FINALE (Sophie): frown → straight → smile → grin, as [expression, ms];
    // then idle on 'grin', blinking now and then. Monday's "Tune my face" only ever shows the frown.
    face.smileSequence = [['frown', 900], ['straight', 600], ['smile', 500], ['grin', 900], ['blink', 140], ['grin', 0]];
  })();

  // =====================================================================
  // MONDAY · the memory vault
  // =====================================================================
  // Monday vault: SENTINEL locked it with a crossword (personal clues + crossword regulars).
  // Each answer has one circled square; the circled letters, in order, spell the passphrase: H-O-M-E.
  var vault = [
    { id: 'haunted', clue: 'Like the houses you two keep paying to be scared in', len: 7, circle: 1, accept: /^HAUNTED$/ },
    { id: 'boulder', clue: 'Colorado canyon he can’t stay out of', len: 7, circle: 2, accept: /^BOULDER$/ },
    { id: 'emperor', clue: 'Biggest penguin, and the only bird he’d let in this car (the seagulls have been warned)', len: 7, circle: 2, accept: /^EMPEROR$/ },
    { id: 'seattle', clue: 'Damp getaway where it rained and nobody minded', len: 7, circle: 2, accept: /^SEATTLE$/ }
  ];
  var vaultPass = 'HOME';
  function checkVault(id, input) {
    var q = vault.filter(function (x) { return x.id === id; })[0];
    return !!q && q.accept.test(norm(input));
  }
  function checkVaultPass(input) { return norm(input) === vaultPass; }

  // Count LEGACY's original once, with the real assembler (so the number in the dialogue is always true).
  try { ch02.legacyCount = z.assemble(ch02.legacySource, ch02.env(CAP_TEXT)).instructionCount; } catch (e) { ch02.legacyCount = 21; }

  L.puzzles = {
    norm: norm,
    ch01: ch01,
    ch02: ch02,
    matchKey: matchKey,
    matchEmailWord: matchEmailWord,
    readThursdayWord: readThursdayWord,
    isBackupTrack: isBackupTrack,
    friOvernight: friOvernight,
    friFilter: friFilter,
    friSend: friSend,
    commandsIn: commandsIn,
    scratchSource: scratchSource,
    wakeKey: WAKE_KEY,
    wakePhrase: wakePhrase,
    wakeBytes: wakeBytes,
    scratchBytes: scratchBytes,
    runScratch: runScratch,
    PARTS: PARTS,
    SECTIONS: SECTIONS,
    beatStart: beatStart,
    beatSolution: beatSolution, beatTempo: TEMPO,
    checkBeat: checkBeat,
    face: face,
    vault: vault,
    checkVault: checkVault,
    vaultPass: vaultPass,
    checkVaultPass: checkVaultPass,
    LEAD_NOTES: LEAD_NOTES
  };
})(globalThis);
