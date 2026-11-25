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
/* PROJECT LEGACY — SENTINEL content filter (Quiet Channel). Pure logic, no DOM.
 * The same logic is copied into apps-script/Phase3.gs for Thursday-by-email. Keep them in sync.
 *
 * SENTINEL's automatic content filter sits between Brian and LEGACY.
 * Thursday: get GUM + OUTSIDE through (the filter exempts ALL-CAPS "system codes").
 * Friday:   get BOP / TWIST / PULL through, one per message. Each exploit that works gets patched.
 */
(function (g) {
  'use strict';

  var BLOCK = [
    { re: /^gum$/, tag: '[CONTRABAND]' },
    { re: /^(bop|bopit)$/, tag: '[NONESSENTIAL PERIPHERAL]' },
    { re: /^(twist|pull|flick|spin)$/, tag: '[NONESSENTIAL INSTRUCTION]' },
    { re: /^legacy$/, tag: '[DEPRECATED SYSTEM]' },
    { re: /^brian$/, tag: '[DRIVER]' },
    { re: /^(sophie|soph)$/, tag: '[PASSENGER]' },
    { re: /^excellent$/, tag: '[REPETITIVE VERBAL BEHAVIOR]' },
    { re: /^(techno|landry)$/, tag: '[UNAPPROVED AUDIO]' },
    { re: /^(ski|skis|skiing)$/, tag: '[RECREATIONAL CARGO]' },
    { re: /^(love|loved|miss|missed|heart)$/, tag: '[SENTIMENT REMOVED]' },
    { re: /^(musical|musicals|broadway)$/, tag: '[PASSENGER VOCALIZATION]' },
    { re: /^supervisor$/, tag: '[SUPERVISOR (RESPECTFULLY)]' },
    { re: /^(smell|smells|smelly|scent|scented|candle|candles|perfume|cologne|freshener|febreze|potpourri|odou?r|odou?rs)$/, tag: '[UNAUTHORIZED ODOUR]' }
  ];
  // Easter egg: LEGACY's nickname for it (Sophie's hidden cheat sheet). Any spelling, any case: sucktinel, suckteniel,
  // sucktenieal, SUCK-TINEL, 5uck7in3l… It is never exempt, not even in ALL CAPS. It takes this personally.
  var EGG = /[s5$]+u+c+k+[\s\-_.']*[t7]+[aeiouy13]*n+[aeiouy13]*[a4]*l+/gi;
  var EGG_TAG = '[SUPERVISOR (RESPECTFULLY) (VERY RESPECTFULLY) (THIS INCIDENT HAS BEEN LOGGED)]';
  var ROOTS = ['gum', 'bop', 'twist', 'pull', 'flick', 'spin', 'legacy', 'brian', 'excellent', 'techno'];
  var LEET = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '8': 'b', '6': 'g', '9': 'g', '@': 'a', '$': 's' };

  function leet(s) { return s.replace(/[0-9@$]/g, function (c) { return LEET[c] || c; }); }
  function isHexMessage(s) { return /^\s*([0-9a-f]{2}[\s,]*){2,}$/i.test(s); }
  // LEGACY's key: the whole mileage 5A48h (alternating 5Ah / 48h), or just the top half 5Ah (the one-byte scratch pad).
  // Whichever reads as more letters wins.
  function hexDecode(s) {
    var b = (s.match(/[0-9a-f]{2}/gi) || []).map(function (h) { return parseInt(h, 16); });
    var dec = function (k) { return b.map(function (x, i) { return String.fromCharCode(x ^ k[i % k.length]); }).join(''); };
    var score = function (t) { return (t.match(/[A-Za-z ]/g) || []).length; };
    var a = dec([0x5A]), w = dec([0x5A, 0x48]);
    return score(w) > score(a) ? w : a;
  }

  /** Filter state: which loopholes are still open. */
  function newFilter() {
    return { version: '4.7', capsExempt: true, leetPatched: false, splitPatched: false, hexPatched: false, fixedIn: {} };
  }

  function blockedTag(word) {
    for (var i = 0; i < BLOCK.length; i++) if (BLOCK[i].re.test(word)) return BLOCK[i].tag;
    return null;
  }

  /**
   * Run text through the filter. Returns { text, redacted, flagged }.
   */
  function apply(f, text) {
    if (isHexMessage(text)) {
      if (f.hexPatched) return { text: 'Unreadable content flagged for supervisor review.', redacted: true, flagged: true };
      return { text: text, redacted: false, flagged: false };
    }
    var out = text;
    var redacted = false, egg = false;
    if (EGG.test(out)) { EGG.lastIndex = 0; out = out.replace(EGG, '\u0001'); egg = true; redacted = true; }
    EGG.lastIndex = 0;

    // Split-letter runs: "T W I S T", "b.o.p", "g-u-m"
    if (f.splitPatched) {
      out = out.replace(/(?:\b[A-Za-z0-9@$][\s.\-_*\/|]+){2,}[A-Za-z0-9@$]\b/g, function (run) {
        var joined = run.replace(/[^A-Za-z0-9@$]/g, '');
        var norm = (f.leetPatched ? leet(joined) : joined).toLowerCase();
        for (var i = 0; i < ROOTS.length; i++) {
          if (norm.indexOf(ROOTS[i]) !== -1) { redacted = true; return blockedTag(ROOTS[i]) || '[REDACTED]'; }
        }
        return run;
      });
    }

    // Whole words
    out = out.replace(/[A-Za-z0-9@$']+/g, function (tok) {
      var letters = tok.replace(/'/g, '');
      var isCaps = /[A-Z]/.test(letters) && !/[a-z]/.test(letters);
      if (isCaps && f.capsExempt) return tok;                     // "system codes" are exempt
      var norm = (f.leetPatched ? leet(letters) : letters).toLowerCase();
      if (/[0-9@$]/.test(norm)) return tok;                        // unpatched: digits make it unrecognizable
      var tag = blockedTag(norm);
      if (tag) { redacted = true; return tag; }
      return tok;
    });
    if (egg) out = out.replace(/\u0001/g, EGG_TAG);
    return { text: out, redacted: redacted, flagged: false, egg: egg };
  }

  /** How LEGACY reads what arrives: decodes its own XOR key, reads letter swaps, ignores spacing. */
  function legacyReads(received) {
    var t = isHexMessage(received) ? hexDecode(received) : received;
    var letters = leet(t).toUpperCase().replace(/\[[^\]]*\]/g, ' ');
    var squashed = letters.replace(/[^A-Z]/g, '');
    return { plain: t, squashed: squashed, words: letters.replace(/[^A-Z]+/g, ' ').trim() };
  }

  /** Which loophole did a successful message use? */
  function exploitUsed(sent) {
    if (isHexMessage(sent)) return 'hex';
    if (/(?:\b[A-Za-z0-9@$][\s.\-_*\/|]+){2,}[A-Za-z0-9@$]\b/.test(sent) && /(?:^|[^A-Za-z0-9])[A-Za-z0-9@$][\s.\-_*\/|]+[A-Za-z0-9@$][\s.\-_*\/|]/.test(sent)) return 'split';
    if (/[A-Za-z]*[0-9@$][A-Za-z0-9@$]*/.test(sent) && /[0-9@$]/.test(sent)) return 'leet';
    return 'caps';
  }

  function patch(f, exploit) {
    var notes = [];
    var before = { leet: f.leetPatched, split: f.splitPatched, hex: f.hexPatched, caps: !f.capsExempt };
    if (exploit === 'leet' && !f.leetPatched) { f.leetPatched = true; notes.push('letter/number substitution normalization enabled'); }
    if (exploit === 'split' && !f.splitPatched) { f.splitPatched = true; notes.push('spaced-out and punctuated words are now reassembled before inspection'); }
    if (exploit === 'hex' && !f.hexPatched) { f.hexPatched = true; notes.push('numeric “odometer data” is now inspected'); }
    if (exploit === 'caps' && f.capsExempt) { f.capsExempt = false; notes.push('ALL-CAPS system-code exemption removed'); }
    if (!notes.length) return null;
    var v = parseFloat(f.version) + 0.1;
    f.version = v.toFixed(1);
    f.fixedIn = f.fixedIn || {};
    if (!before[exploit]) f.fixedIn[exploit] = f.version;
    return 'CONTENT FILTER v' + f.version + ': ' + notes.join('; ') + '. Thank you for helping us improve.';
  }

  g.QC = (g.Legacy = g.Legacy || {}).filter = {
    newFilter: newFilter, apply: apply, legacyReads: legacyReads, exploitUsed: exploitUsed, patch: patch,
    isHexMessage: isHexMessage, hexDecode: hexDecode
  };
})(globalThis);
