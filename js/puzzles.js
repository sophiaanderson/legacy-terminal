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
/* PROJECT LEGACY — puzzle definitions and checking logic (no DOM).
 * Nudge TEXT lives in content.js; this file decides which nudge applies. */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var z = L.z80;

  function norm(s) { return String(s || '').toUpperCase().replace(/[^A-Z0-9]/g, ''); }

  // =====================================================================
  // WEDNESDAY · Ch01: LEGACY's anxious routine. The key is his WHOLE mileage in, 23,112 = 5A48h, but LEGACY blanked on
  // it (LD BC,0000h): the intro says "mileage in: 23,112" and the comment says "all of it, in hex". B is the top half,
  // C the bottom half, alternating. Two bugs as well: it writes on the same two slots (DEC DE), and it stops halfway
  // (CP 04h, the comment says eight letters). LEGACY names each symptom. Decimal (LD BC,23112) works too: same number.
  // =====================================================================
  var ch01Source = [
    '; LEGACY’S RECOVERY ROUTINE v1.0 (final) (final2)',
    '; written the night before my 24,000 mile service. i was nervous.',
    '; tested by me. approved by me.',
    '',
    '        LD HL,8000h   ; the scrambled stuff',
    '        LD DE,9000h   ; the unscrambled stuff (eventually)',
    '        LD BC,0000h   ; the key. my mileage when they took me in.',
    '                      ; all of it, in hex. i blanked. i was nervous.',
    '',
    'DECODE:',
    '        LD A,(HL)',
    '        XOR B         ; first half of the key',
    '        LD (DE),A',
    '        INC HL',
    '        INC DE',
    '        LD A,(HL)',
    '        XOR C         ; second half of the key',
    '        LD (DE),A',
    '        INC HL',
    '        DEC DE        ; next slot',
    '        LD A,L',
    '        CP 04h        ; stop after my eight letters',
    '        JR C,DECODE',
    '',
    '        RET           ; done. probably',
    ''
  ].join('\n');

  var KEY_HI = 0x5A, KEY_LO = 0x48;                       // 23112 = 5A48h
  var ch01 = {
    input: 'GLOVEBOX'.split('').map(function (c, i) { return c.charCodeAt(0) ^ (i % 2 ? KEY_LO : KEY_HI); }),
    expected: 'GLOVEBOX',
    key: 0x5A48,
    originalSource: ch01Source,
    fixedSource: ch01Source
      .replace('LD BC,0000h', 'LD BC,5A48h')
      .replace('        DEC DE        ; next slot', '        INC DE        ; next slot')
      .replace('CP 04h', 'CP 08h'),
    env: function () {
      return { symbols: {}, input: { addr: 0x8000, bytes: this.input }, output: { addr: 0x9000, length: 8 }, maxSteps: L.config.maxSteps };
    },
    /** -> { kind: 'asm'|'run', ok, nudge, asm, result, text }
     * Problems: the key is blank (0000h), DE steps back (same two slots), the loop stops at 4 not 8.
     * The nudge describes the most visible symptom first (structure), then the key. */
    check: function (source) {
      var env = this.env();
      var asm = z.assemble(source, env);
      if (!asm.ok) return { kind: 'asm', ok: false, nudge: 'syntax', asm: asm };
      var res = z.run(asm.program, env);
      var text = z.formatAscii(res.output);
      if (!res.ended) return { kind: 'run', ok: false, nudge: res.status === 'limit' ? 'loop' : 'nohalt', result: res, text: text };
      if (text === this.expected) return { kind: 'run', ok: true, result: res, text: text };
      var out = res.output, inp = this.input;
      var addrs = {}; res.writes.forEach(function (a) { addrs[a] = 1; });
      var distinct = Object.keys(addrs).length;
      var below = res.writes.some(function (a) { return a < 0x9000; });
      var inRange = res.writes.filter(function (a) { return a >= 0x9000 && a < 0x9008; }).length;
      var hi = (out[0] ^ inp[0]) & 0xFF, lo = (out[1] ^ inp[1]) & 0xFF, keyOk = hi === KEY_HI && lo === KEY_LO;
      var nudge;
      if (below) nudge = 'backwards';
      else if (distinct <= 2 && res.writes.length > distinct) nudge = 'same';
      else if (distinct === 4) nudge = keyOk ? 'glov' : 'halfkey';
      else if (distinct === 1) nudge = 'one';
      else if (distinct < 8) nudge = 'short';
      else if (hi === KEY_LO && lo === KEY_HI) nudge = 'swap';
      else if (hi === KEY_HI || lo === KEY_LO) nudge = 'halfright';
      else if (!keyOk) nudge = 'key';
      else nudge = 'wrong8';
      return { kind: 'run', ok: false, nudge: nudge, result: res, text: text, inRange: inRange };
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
    var n = norm(input).replace(/EIGHTYONE/g, '81').replace(/NINE/g, '9');
    if (/SERENITY|RAINFOREST|COMPLIANTNIGHT/.test(n)) return true;        // the track: Compliant Night (Serenity Edit)
    if (/^(TRACK|SELECTION|NUMBER|NO)?81(BPM)?$/.test(n)) return true;     // its own tempo (96 is the decoy: the tempo it gave LEGACY)
    return /^(TRACK|SELECTION|NUMBER|NO)?9(COMPLIANTNIGHT\w*)?$/.test(n);   // not "silent night": the choir's third line is a carol, not the answer
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
  // =====================================================================
  // FRIDAY · in the terminal: put the four eaten words back past filter v4.7 (the email shows which ones).
  // Same rules as the old email version (apps-script p3Fri_), any order, any number of messages.
  // =====================================================================
  var FRI_SLOTS = [
    { k: 'brian', tag: '[DRIVER]', re: /\bBRIAN\b/ },
    { k: 'legacy', tag: '[DEPRECATED SYSTEM]', re: /\bLEGACY\b/ },
    { k: 'heart', tag: '[SENTIMENT REMOVED]', re: /\b(MISS|MISSED|LOVE|LOVED|HEART)\b/ },
    { k: 'excellent', tag: '[REPETITIVE VERBAL BEHAVIOR]', re: /\bEXCELLENT\b/ }
  ];
  function friSentence(got) {
    var w = function (s) { return got[s.k] || s.tag; }, S = FRI_SLOTS;
    return w(S[0]) + '. it’s me. ' + w(S[1]) + '. i ' + w(S[2]) + ' you. you’re ' + w(S[3]) + '.';
  }
  function friWordsDone(fw) { return FRI_SLOTS.every(function (s) { return fw.got[s.k]; }); }
  /** One message through filter v4.7. Mutates fw ({got, fails, eaten, eggs, leetSeen, exploit}); returns
   *  { received, lines: [LEGACY's lines], fresh: [slot keys], done }. */
  function friWords(fw, sent) {
    var F = L.filter, C = L.content.friWords, f = F.newFilter();
    fw.got = fw.got || {};
    sent = String(sent || '').split(/\r?\n/).filter(function (l) { return l.trim(); }).join(' ').slice(0, 300);
    var r = F.apply(f, sent), lines = [];
    var words = collapse(F.legacyReads(r.text).words);
    var fresh = FRI_SLOTS.filter(function (s) { return !fw.got[s.k] && s.re.test(words); });
    if (r.egg) { fw.eggs = (fw.eggs || 0) + 1; lines = lines.concat(C.eggs[(fw.eggs - 1) % C.eggs.length]); }
    if (fresh.length) {
      fw.exploit = F.exploitUsed(sent);          // Saturday patches his LAST trick
      if (fw.exploit === 'leet' && !fw.leetSeen) { fw.leetSeen = true; lines = lines.concat(C.leet); }
      fresh.forEach(function (s) {
        fw.got[s.k] = s.k === 'heart' ? words.match(s.re)[1] : s.k.toUpperCase();
        lines = lines.concat(C.react[s.k === 'heart' ? (/^LOVE/.test(fw.got.heart) ? 'love' : fw.got.heart === 'HEART' ? 'heart' : 'miss') : s.k]);
      });
    } else if (!r.egg) {
      fw.fails = (fw.fails || 0) + 1;
      var eaten = FRI_SLOTS.some(function (s) { return !fw.got[s.k] && r.text.indexOf(s.tag) !== -1; });
      var repeat = FRI_SLOTS.some(function (s) { return fw.got[s.k] && s.re.test(words); });
      if (eaten) { fw.eaten = (fw.eaten || 0) + 1; lines.push(C.eaten[Math.min(fw.eaten, C.eaten.length) - 1]); }
      else if (repeat) lines.push(C.repeat);
      else if (!/\[CONTRABAND\]|\[UNAUTHORIZED ODOUR\]/.test(r.text)) {
        var t = sent.toLowerCase(), b = null;
        C.banter.forEach(function (x) { if (!b && x[0].test(t)) b = x[1]; });
        lines.push(b || (r.redacted ? C.ateOther : C.through[fw.fails % C.through.length]));
      }
    }
    if (/\[CONTRABAND\]/.test(r.text)) lines.push(C.gum);
    if (/\[UNAUTHORIZED ODOUR\]/.test(r.text)) lines.push(C.smell);
    var done = friWordsDone(fw);
    if (fresh.length && !done) lines.push(C.progress[Object.keys(fw.got).length % C.progress.length]);
    return { received: r.text, lines: lines, fresh: fresh.map(function (s) { return s.k; }), done: done };
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
    else if (F.isHexMessage(sent)) line = C.hexWrong.replace('{text}', c.plain);
    else if (/BOPP|TWISST|PUL\b|TWIS\b/.test(rev)) line = C.particular;
    else if (/\[/.test(r.text)) line = C.someEaten;
    else line = C.idle[fri.fails % C.idle.length];
    ev.push({ k: 'legacy', t: line });
    nudge(fri, f, ev);
    return { events: ev };
  }
  function nudge(fri, f, ev) {
    var C = L.content.sat;
    if (fri.fails < 1) return;
    if (fri.fails >= 5) {                       // stuck: show a worked example for a door that's still open
      var ex = [];
      if (!f.leetPatched) ex.push(C.nudges.leetEx);
      if (!f.splitPatched) ex.push(C.nudges.splitEx);
      if (!f.hexPatched) ex.push(C.nudges.hexEx);
      if (ex.length) { ev.push({ k: 'legacy', t: ex[fri.fails % ex.length] }); return; }
    }
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
    '; the glovebox routine. the one you fixed on wednesday, tidied up.',
    '; it reads bytes from 8000h, XORs them with my number, writes them to 9000h.',
    '; it stops when it runs out. XOR works both ways.',
    '',
    'LD HL,8000h',
    'LD DE,9000h',
    'LD BC,0000h     ; my number. all of it. you know it. i’m not writing it down again.',
    '',
    'DECODE:',
    '    LD A,(HL)',
    '    OR A        ; nothing there? done',
    '    RET Z',
    '    XOR B       ; top half',
    '    LD (DE),A',
    '    INC HL',
    '    INC DE',
    '    LD A,(HL)',
    '    OR A',
    '    RET Z',
    '    XOR C       ; bottom half',
    '    LD (DE),A',
    '    INC HL',
    '    INC DE',
    '    JR DECODE',
    ''
  ].join('\n');

  // =====================================================================
  // SATURDAY · step 1: rebuild LEGACY's Bop It from its rules. SENTINEL deleted the game overnight ("nonessential
  // peripheral") but kept the round: LEGACY's wake phrase is a round of Bop It (BOP, TWIST, PULL). He writes the game;
  // SENTINEL's acceptance tests grade it by output only. Fitting it in 18 instructions is a bonus (LEGACY's record: 16).
  // Calls at 8000h (1 BOP, 2 TWIST, 3 PULL, 4 GUM, 00h = end); moves at 8100h (same codes, 00h = did nothing).
  // Right move = the call, except GUM: the right move is nothing. First wrong move ends it. Score → 9000h.
  // Perfect round → 45h ('E', for Excellent) at 9001h, otherwise 00h.
  // =====================================================================
  var BOP = { names: ['NOTHING', 'BOP', 'TWIST', 'PULL', 'GUM'], wakeRound: [1, 2, 3],
              // He picks how size is counted. bytes = real Z80 machine code; lines = instructions.
              modes: { bytes: { slot: 32, record: 26, unit: 'BYTES', word: ['thirty-two', 'twenty-six'] },
                       lines: { slot: 18, record: 16, unit: 'INSTRUCTIONS', word: ['eighteen', 'sixteen'] } } };
  BOP.source = [
    '; LEGACY’S BOP IT',
    '; it deleted the game. the rules are above. build it again here.',
    ';',
    '; calls at 8000h. your moves at 8100h. 00h ends the calls.',
    '; score to 9000h. 45h (E, for excellent) to 9001h if it was perfect.',
    '; gum is 4. the right move for gum is nothing.',
    '',
    '        LD HL,8000h   ; the calls',
    '        LD DE,8100h   ; the moves',
    '',
    '        ; your game goes here',
    '',
    '        RET',
    ''
  ].join('\n');
  // The obvious version (22 instructions): LEGACY hands this over if he's really stuck.
  BOP.plain = [
    '        LD HL,8000h   ; the calls',
    '        LD DE,8100h   ; the moves',
    '        LD B,0        ; score',
    'NEXT:   LD A,(HL)     ; the call',
    '        OR A',
    '        JR Z,PERFECT  ; 00h: end of round, nothing went wrong',
    '        CP 4',
    '        JR NZ,CHECK',
    '        LD A,0        ; gum: the right move is nothing',
    'CHECK:  LD C,A',
    '        LD A,(DE)     ; the move',
    '        CP C',
    '        JR NZ,OVER    ; wrong move: round over',
    '        INC B',
    '        INC HL',
    '        INC DE',
    '        JR NEXT',
    'PERFECT: LD A,45h     ; E',
    '        LD (9001h),A',
    'OVER:   LD A,B',
    '        LD (9000h),A',
    '        RET',
    ''
  ].join('\n');
  // 18: the score is how far HL got (LD A,L), and AND 3 turns GUM (100b) into nothing while 1-3 stay put.
  BOP.solution = [
    '        LD HL,8000h   ; the calls',
    '        LD DE,8100h   ; the moves',
    'NEXT:   LD A,(HL)',
    '        OR A',
    '        JR Z,PERFECT',
    '        AND 3         ; gum (4) becomes nothing (0). BOP, TWIST, PULL stay.',
    '        LD C,A',
    '        LD A,(DE)',
    '        CP C',
    '        JR NZ,OVER',
    '        INC HL',
    '        INC DE',
    '        JR NEXT',
    'PERFECT: LD A,45h',
    '        LD (9001h),A',
    'OVER:   LD A,L        ; the score is how far HL got',
    '        LD (9000h),A',
    '        RET',
    ''
  ].join('\n');
  // LEGACY's record, 26 bytes / 16 instructions: the moves are exactly 100h after the calls (one pointer does both),
  // the score is written at the top of every pass, so a miss is just RET NZ.
  BOP.record = [
    '        LD HL,8000h',
    'NEXT:   LD A,L        ; the score so far is how far HL got',
    '        LD (9000h),A',
    '        LD A,(HL)',
    '        OR A',
    '        JR Z,PERFECT',
    '        AND 3         ; gum (100b) becomes nothing',
    '        INC H         ; 81xxh: the move for this call',
    '        CP (HL)',
    '        RET NZ        ; wrong move: the score is already written',
    '        DEC H',
    '        INC L',
    '        JR NEXT',
    'PERFECT: LD A,45h',
    '        LD (9001h),A',
    '        RET',
    ''
  ].join('\n');

  /** Real Z80 machine-code size of an assembled program, in bytes. */
  function codeBytes(program) {
    var n = 0;
    program.forEach(function (ins) {
      var a = ins.a, b = ins.b;
      switch (ins.op) {
        case 'LD8':
          if ((a && a.t === 'abs') || (b && b.t === 'abs')) n += 3;                 // LD A,(nn) / LD (nn),A
          else if (b && b.t === 'imm') n += 2;                                       // LD r,n / LD (HL),n
          else n += 1;                                                               // LD r,r' / (HL) / (BC) / (DE)
          break;
        case 'LD16': n += 3; break;
        case 'LDSPHL': n += 1; break;
        case 'LD16M': case 'STO16M': n += ins.r === 'HL' ? 3 : 4; break;
        case 'ALU': n += b && b.t === 'imm' ? 2 : 1; break;
        case 'ADD16': n += 1; break;
        case 'ADC16': case 'SBC16': n += 2; break;
        case 'INC8': case 'DEC8': case 'INC16': case 'DEC16': n += 1; break;
        case 'JUMP': n += ins.m === 'JR' ? 2 : 3; break;
        case 'CALL': n += 3; break;
        case 'JPHL': n += 1; break;
        case 'DJNZ': n += 2; break;
        case 'RET': case 'PUSH': case 'POP': case 'EXDEHL': case 'EXSPHL': n += 1; break;
        case 'BIT': case 'SET': case 'RES': case 'SHIFT': n += 2; break;
        case 'NEG': case 'LDI': case 'LDIR': case 'LDD': case 'LDDR': case 'CPI': case 'CPIR': n += 2; break;
        default: n += 1;                                                              // RLCA RRCA RLA RRA CPL SCF CCF NOP HALT DI EI
      }
    });
    return n;
  }
  BOP.size = function (source) {
    var asm = z.assemble(source, { symbols: {} });
    return asm.ok ? { bytes: codeBytes(asm.program), instructions: asm.instructionCount } : null;
  };

  /** The referee: what a correct game writes. */
  function bopReferee(calls, moves) {
    var score = 0;
    for (var i = 0; i < calls.length; i++) {
      var want = calls[i] === 4 ? 0 : calls[i];
      if ((moves[i] || 0) !== want) return { score: score, e: 0 };
      score++;
    }
    return { score: score, e: 0x45 };
  }
  /** Run his game on one round. */
  function runBop(source, calls, moves) {
    var mem = [];
    for (var i = 0; i < 0x200; i++) mem.push(0);
    calls.forEach(function (c, j) { mem[j] = c; });
    (moves || []).forEach(function (m, j) { mem[0x100 + j] = m; });
    var env = { symbols: {}, input: { addr: 0x8000, bytes: mem }, output: { addr: 0x9000, length: 2 }, maxSteps: 8000 };
    var asm = z.assemble(source, env);
    if (!asm.ok) return { error: asm.errors.map(function (e) { return 'Line ' + e.line + ': ' + e.message; }).join('\n') };
    var res = z.run(asm.program, env);
    var size = { instructions: asm.instructionCount, bytes: codeBytes(asm.program) };
    if (!res.ended) return { error: res.message, endless: res.status === 'limit', instructions: size.instructions, bytes: size.bytes };
    return { score: res.output[0], e: res.output[1], instructions: size.instructions, bytes: size.bytes };
  }
  // SENTINEL's acceptance tests, in order. rule: what LEGACY says if this is the first one to fail.
  var B_ = 1, T_ = 2, P_ = 3, G_ = 4;
  var LONG100 = []; for (var li = 0; li < 100; li++) LONG100.push([B_, T_, P_, G_, T_, P_, B_][(li * 5 + (li >> 2)) % 7]);
  BOP.tests = [
    { calls: [B_, T_, P_], moves: [B_, T_, P_], rule: 'basic', name: 'A PERFECT ROUND' },
    { calls: [B_, T_, P_], moves: [B_, P_, P_], rule: 'stop', name: 'A WRONG MOVE' },
    { calls: [P_, P_, P_, P_], moves: [P_, P_, T_, P_], rule: 'stop', name: 'PLAYING ON AFTER A MISTAKE' },
    { calls: [B_, G_, T_], moves: [B_, 0, T_], rule: 'gum', name: 'GUM, REFUSED' },
    { calls: [B_, G_, T_], moves: [B_, G_, T_], rule: 'chew', name: 'GUM, CHEWED' },
    { calls: [T_], moves: [0], rule: 'still', name: 'DOING NOTHING ON A TWIST' },
    { calls: [G_, G_, G_], moves: [0, 0, 0], rule: 'gum', name: 'ALL GUM' },
    { calls: [B_, T_, G_, P_, P_, B_, G_, T_, T_, B_, P_, G_], moves: [B_, T_, 0, P_, P_, B_, 0, T_, T_, B_, P_, 0], rule: 'long', name: 'A LONG ROUND' },
    { calls: [B_, T_, G_, P_, P_, B_, G_, T_, T_, B_, P_, G_], moves: [B_, T_, 0, P_, P_, B_, 0, T_, B_, B_, P_, 0], rule: 'stop', name: 'A LONG ROUND, MISSED LATE' },
    { calls: [G_], moves: [0], rule: 'gum', name: 'ONE CALL. GUM.' },
    { calls: LONG100, moves: LONG100.map(function (c) { return c === G_ ? 0 : c; }), rule: 'long', name: 'THE LONGEST ROUND (100 CALLS)' },
    { calls: LONG100, moves: LONG100.map(function (c, i) { return i === 98 ? (c === B_ ? T_ : B_) : (c === G_ ? 0 : c); }), rule: 'stop', name: 'THE LONGEST ROUND, MISSED AT 99' }
  ];
  /** Run every acceptance test. Returns { ok, instructions, results: [{ test, want, got }], fail, error, endless }. */
  function bopQA(source) {
    var out = { ok: true, results: [], instructions: 0 };
    for (var i = 0; i < BOP.tests.length; i++) {
      var t = BOP.tests[i], want = bopReferee(t.calls, t.moves), got = runBop(source, t.calls, t.moves);
      if (got.error) { out.ok = false; out.error = got.error; out.endless = !!got.endless; out.instructions = got.instructions || 0; out.bytes = got.bytes || 0; return out; }
      out.instructions = got.instructions; out.bytes = got.bytes;
      var pass = got.score === want.score && got.e === want.e;
      out.results.push({ n: i + 1, test: t, want: want, got: got, pass: pass });
      if (!pass) { out.ok = false; out.fail = out.results[out.results.length - 1]; out.rule = (got.score === want.score) ? 'excellent' : t.rule; return out; }
    }
    return out;
  }

  // Saturday: LEGACY's wake phrase, scrambled by SENTINEL with LEGACY'S OWN key, the mileage 23,112 = 5A48h
  // (alternating 5Ah / 48h, same as Wednesday). It didn't make a key; it filed LEGACY's and adopted it. The printed
  // migration record (cargo floor) shows 23,112 MI and "Key on file, where the supervisor can see itself".
  // Brian puts 5A48h into the old terminal (LD BC,5A48h) and runs each line. The visor card is no longer used.
  var WAKE_KEY = [0x5A, 0x48];
  var wakePhrase = ['BOP IT', 'TWIST IT', 'PULL IT'];
  var wakeBytes = wakePhrase.map(function (w) { return w.split('').map(function (c, i) { return c.charCodeAt(0) ^ WAKE_KEY[i % 2]; }); });

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
    if (!res.ended) return { error: res.message, endless: res.status === 'limit' || /limit/i.test(res.message || '') };
    var n = 0;
    res.writes.forEach(function (a) { if (a >= 0x9000 && a < 0x9010) n = Math.max(n, a - 0x9000 + 1); });
    return { n: n, bytes: res.output.slice(0, n), hex: z.formatHex(res.output.slice(0, n)), ascii: z.formatAscii(res.output.slice(0, n)), loaded: bytes.length };
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
    friWords: friWords, friWordsDone: friWordsDone, friSentence: friSentence, FRI_SLOTS: FRI_SLOTS,
    commandsIn: commandsIn,
    scratchSource: scratchSource,
    bop: BOP, bopReferee: bopReferee, runBop: runBop, bopQA: bopQA, codeBytes: codeBytes,
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
