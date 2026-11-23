/* PROJECT LEGACY — Z80 assembler + interpreter (v2).
 *
 * A whitelist interpreter for the everyday Z80 instruction set, with TI-style syntax
 * ($hex, %bin, 'a' literals, .db / .equ, lowercase). Player source is parsed into plain
 * instruction objects and executed by a switch statement. Nothing the player types is
 * ever evaluated as JavaScript.
 *
 * API (unchanged from v1, so the Friday "old terminal" keeps working):
 *   assemble(source, env) -> { ok, program, labels, errors, instructionCount }
 *       env.symbols: { NAME: value } predefined constants/addresses
 *   run(program, env) -> { status, ended, message, regs, flags, steps, trace, writes, output, inputIntact }
 *       env.input: { addr, bytes }   env.output: { addr, length }   env.maxSteps
 */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});

  var R8 = ['A', 'B', 'C', 'D', 'E', 'H', 'L'];
  var R16 = ['BC', 'DE', 'HL', 'SP'];
  var CONDS = ['NZ', 'Z', 'NC', 'C', 'PO', 'PE', 'P', 'M'];
  var REGISTER_NAMES = R8.concat(R16, ['AF', 'F', 'I', 'R', 'IX', 'IY', 'IXH', 'IXL', 'IYH', 'IYL']);
  var MNEMONICS = ['LD', 'ADD', 'ADC', 'SUB', 'SBC', 'AND', 'OR', 'XOR', 'CP', 'INC', 'DEC', 'JP', 'JR', 'DJNZ',
    'CALL', 'RET', 'PUSH', 'POP', 'EX', 'BIT', 'SET', 'RES', 'RLCA', 'RRCA', 'RLA', 'RRA', 'RLC', 'RRC', 'RL', 'RR',
    'SLA', 'SRA', 'SRL', 'CPL', 'NEG', 'SCF', 'CCF', 'NOP', 'HALT', 'DI', 'EI', 'LDI', 'LDIR', 'LDD', 'LDDR', 'CPI', 'CPIR'];
  var DIRECTIVES = ['DB', 'DEFB', 'BYTE', 'DW', 'DEFW', 'WORD', 'EQU', 'ORG', 'END', 'LIST', 'NOLIST', 'DEFINE', 'TEXT', 'ASCII', 'ASCIZ'];

  var NOT_AVAILABLE = {
    BCALL: 'There’s no TI-OS in here. I’m a car. Write the bytes to memory yourself and stop with HALT.',
    B_CALL: 'There’s no TI-OS in here. I’m a car. Write the bytes to memory yourself and stop with HALT.',
    RST: 'RST isn’t available. There’s no OS to call. I’m a car.',
    OUT: 'OUT isn’t available. There are no ports in here. Write to memory instead.',
    IN: 'IN isn’t available. There are no ports in here. Read from memory instead.',
    EXX: 'EXX isn’t available. One set of registers is plenty. I barely use the ones I have.',
    IM: 'IM isn’t available. No interrupts. Nobody interrupts me in here.',
    RETI: 'RETI isn’t available. No interrupts in here.',
    RETN: 'RETN isn’t available. No interrupts in here.',
    DAA: 'DAA isn’t available. No decimal arithmetic. I count in hex, like a normal car.',
    RLD: 'RLD isn’t available in this sandbox.',
    RRD: 'RRD isn’t available in this sandbox.',
    STOP: 'Use HALT to stop the program.'
  };

  var DATA_BASE = 0xA000;     // where .db data lives
  var STACK_TOP = 0xFFFF;     // SP starts here (empty)

  // ---------- small helpers ----------
  function hex(n, width) {
    var s = (n >>> 0).toString(16).toUpperCase();
    while (s.length < width) s = '0' + s;
    return s;
  }
  function hexAddr(n) { return hex(n, 4) + 'h'; }

  /** Parse a numeric literal. Returns an integer, or null if the token isn't a number. */
  function parseNumber(tok) {
    var t = String(tok).trim();
    var m;
    if ((m = /^'(\\?.)'$/.exec(t))) return charCode(m[1]);
    if (/^[0-9]+$/.test(t)) return parseInt(t, 10);
    if ((m = /^([0-9][0-9a-f]*)h$/i.exec(t))) return parseInt(m[1], 16);
    if ((m = /^(?:0x|\$|#|&)([0-9a-f]+)$/i.exec(t))) return parseInt(m[1], 16);
    if ((m = /^%([01]+)$/.exec(t))) return parseInt(m[1], 2);
    if ((m = /^0b([01]+)$/i.exec(t))) return parseInt(m[1], 2);
    if ((m = /^([01]+)b$/i.exec(t))) return parseInt(m[1], 2);
    return null;
  }
  function charCode(s) {
    if (s.length === 2 && s[0] === '\\') return { n: 10, t: 9, r: 13, '0': 0, '\\': 92, "'": 39, '"': 34 }[s[1]] !== undefined ? { n: 10, t: 9, r: 13, '0': 0, '\\': 92, "'": 39, '"': 34 }[s[1]] : s.charCodeAt(1) & 0xFF;
    return s.charCodeAt(0) & 0xFF;
  }

  function levenshtein(a, b) {
    var dp = [], i, j;
    for (i = 0; i <= a.length; i++) dp[i] = [i];
    for (j = 0; j <= b.length; j++) dp[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      dp[i][j] = Math.min(dp[i - 1][j] + 1, dp[i][j - 1] + 1, dp[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      // Swapped neighbours (XRO for XOR) count as one typo.
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) dp[i][j] = Math.min(dp[i][j], dp[i - 2][j - 2] + 1);
    }
    return dp[a.length][b.length];
  }
  function suggest(name, candidates) {
    var best = null, bestD = 99, limit = name.length >= 5 ? 2 : 1;
    candidates.forEach(function (c) { var d = levenshtein(name, c); if (d <= limit && d < bestD) { bestD = d; best = c; } });
    return best;
  }
  function isIdentifier(t) { return /^[A-Za-z_.][A-Za-z0-9_.]*$/.test(t) && !/^\.+$/.test(t); }

  /** Strip a ; comment, respecting quotes. */
  function stripComment(line) {
    var q = null;
    for (var i = 0; i < line.length; i++) {
      var c = line[i];
      if (q) { if (c === '\\') { i++; continue; } if (c === q) q = null; }
      else if (c === "'" || c === '"') {
        // 'x' char literal or "string"
        if (c === "'" && line[i + 2] !== "'" && !(line[i + 1] === '\\' && line[i + 3] === "'")) continue; // stray apostrophe (e.g. AF')
        q = c;
      } else if (c === ';') return line.slice(0, i);
    }
    return line;
  }

  /** Split operands on commas, respecting quotes. */
  function splitOperands(rest) {
    var out = [], cur = '', q = null;
    for (var i = 0; i < rest.length; i++) {
      var c = rest[i];
      if (q) { cur += c; if (c === '\\' && i + 1 < rest.length) { cur += rest[++i]; continue; } if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; cur += c; continue; }
      if (c === ',') { out.push(cur.trim()); cur = ''; continue; }
      cur += c;
    }
    if (cur.trim() !== '' || out.length) out.push(cur.trim());
    return out;
  }

  /** Uppercase everything outside quotes and remove whitespace outside quotes. */
  function normOperand(o) {
    var out = '', q = null;
    for (var i = 0; i < o.length; i++) {
      var c = o[i];
      if (q) { out += c; if (c === '\\' && i + 1 < o.length) { out += o[++i]; continue; } if (c === q) q = null; continue; }
      if (c === "'" || c === '"') { q = c; out += c; continue; }
      if (/\s/.test(c)) continue;
      out += c.toUpperCase();
    }
    return out;
  }

  // ---------- assembler ----------
  function assemble(source, env) {
    env = env || {};
    var symbols = {};
    Object.keys(env.symbols || {}).forEach(function (k) { symbols[k.toUpperCase()] = env.symbols[k]; });
    var predefined = Object.keys(symbols);

    var lines = String(source || '').replace(/\r\n?/g, '\n').split('\n');
    var errors = [];
    var parsed = [];          // code lines
    var codeLabels = {};      // NAME -> instruction index
    var dataLabels = {};      // NAME -> address
    var equs = [];            // deferred: { name, expr, line, src }
    var dataLines = [];       // { line, src, kind, operands, addr }
    var dataPtr = DATA_BASE;

    function err(lineNo, src, message) { errors.push({ line: lineNo, src: String(src).trim(), message: message }); }
    function defined(name) { return codeLabels.hasOwnProperty(name) || dataLabels.hasOwnProperty(name) || symbols.hasOwnProperty(name); }
    function badLabel(name, lineNo, raw) {
      if (REGISTER_NAMES.indexOf(name) !== -1 || MNEMONICS.indexOf(name) !== -1 || CONDS.indexOf(name) !== -1) {
        err(lineNo, raw, name + ' can’t be used as a label name (it’s a register or instruction).'); return true;
      }
      if (predefined.indexOf(name) !== -1) { err(lineNo, raw, name + ' is already defined by the recovery system (' + hexAddr(symbols[name]) + '). Pick a different label name.'); return true; }
      if (defined(name)) { err(lineNo, raw, 'The label ' + name + ' is defined twice.'); return true; }
      return false;
    }

    // ---- Pass 1: labels, directives, split mnemonic/operands ----
    lines.forEach(function (raw, i) {
      var lineNo = i + 1;
      var text = stripComment(raw);
      if (!text.trim()) return;
      if (/^\s*#/.test(text)) return; // #include, #define … : harmless TI boilerplate, ignored
      var startsAtCol0 = /^[^\s]/.test(text);
      text = text.trim();

      var pending = [];
      var m;
      while ((m = /^([A-Za-z_.][A-Za-z0-9_.]*)\s*:(?!=)\s*/.exec(text))) {
        pending.push(m[1].toUpperCase().replace(/^\./, ''));
        text = text.slice(m[0].length);
      }
      // TI-style: a label at column 0 with no colon
      if (!pending.length && startsAtCol0) {
        m = /^([A-Za-z_][A-Za-z0-9_]*)(\s+|$)/.exec(text);
        if (m) {
          var up = m[1].toUpperCase();
          var nextTok = text.slice(m[0].length).trim().split(/\s+/)[0] || '';
          var nextUp = nextTok.toUpperCase().replace(/^\./, '');
          var isOp = MNEMONICS.indexOf(up) !== -1 || DIRECTIVES.indexOf(up) !== -1 || NOT_AVAILABLE[up];
          if (!isOp && (nextTok === '' || nextTok === '=' || MNEMONICS.indexOf(nextUp) !== -1 || DIRECTIVES.indexOf(nextUp) !== -1)) {
            pending.push(up);
            text = text.slice(m[0].length).trim();
          }
        }
      }

      // NAME = value  /  NAME .equ value
      var eq = /^=\s*(.+)$/.exec(text) || /^\.?equ\s+(.+)$/i.exec(text);
      if (eq && pending.length) {
        var nm = pending.pop();
        pending.forEach(function (p) { if (!badLabel(p, lineNo, raw)) codeLabels[p] = parsed.length; });
        if (!badLabel(nm, lineNo, raw)) { equs.push({ name: nm, expr: eq[1].trim(), line: lineNo, src: raw }); symbols[nm] = 0; }
        return;
      }

      var sp = text.search(/\s/);
      var word = sp === -1 ? text : text.slice(0, sp);
      var mnemonic = word.toUpperCase().replace(/^\./, '');
      var rest = sp === -1 ? '' : text.slice(sp + 1).trim();

      if (/^(DB|DEFB|BYTE|TEXT|ASCII|ASCIZ|DW|DEFW|WORD)$/.test(mnemonic)) {
        pending.forEach(function (p) { if (!badLabel(p, lineNo, raw)) dataLabels[p] = dataPtr; });
        var ops = splitOperands(rest);
        var size = 0;
        var wide = /^(DW|DEFW|WORD)$/.test(mnemonic);
        ops.forEach(function (o) {
          var sm = /^"((?:[^"\\]|\\.)*)"$/.exec(o.trim());
          if (sm) size += unescapeStr(sm[1]).length; else size += wide ? 2 : 1;
        });
        if (mnemonic === 'ASCIZ') size += 1;
        dataLines.push({ line: lineNo, src: raw, kind: mnemonic, operands: ops, addr: dataPtr });
        dataPtr += size;
        return;
      }
      if (/^(ORG|END|LIST|NOLIST)$/.test(mnemonic)) return; // accepted and ignored
      if (mnemonic === 'EQU') { err(lineNo, raw, 'EQU needs a name in front of it, like  COUNT .equ 10'); return; }

      pending.forEach(function (p) { if (!badLabel(p, lineNo, raw)) codeLabels[p] = parsed.length; });
      if (!text) return;
      var operands = rest === '' ? [] : splitOperands(rest).map(normOperand);
      parsed.push({ line: lineNo, src: raw.trim(), mnemonic: mnemonic, operands: operands });
    });

    // ---- Expressions ----
    function evalExpr(expr, ctx) {
      // returns { v } or { error }
      var s = expr;
      var terms = [];
      var re = /\s*([+\-]?)\s*('(?:\\.|[^'])'|\$[0-9A-Fa-f]+|%[01]+|0[xX][0-9A-Fa-f]+|[0-9][0-9A-Fa-f]*[hH]|[01]+[bB]|[0-9]+|[A-Za-z_.][A-Za-z0-9_.]*)\s*/y;
      var pos = 0, first = true;
      while (pos < s.length) {
        re.lastIndex = pos;
        var m = re.exec(s);
        if (!m || (!first && !m[1])) return { error: 'Invalid operand: ' + expr + ' isn’t a number or a label.' };
        var tok = m[2], sign = m[1] === '-' ? -1 : 1, val = parseNumber(tok);
        if (val === null) {
          var name = tok.toUpperCase().replace(/^\./, '');
          if (REGISTER_NAMES.indexOf(name) !== -1) return { error: 'Invalid operand: ' + name + ' is a register here, not a value.' };
          if (symbols.hasOwnProperty(name)) val = symbols[name];
          else if (dataLabels.hasOwnProperty(name)) val = dataLabels[name];
          else if (codeLabels.hasOwnProperty(name)) return { error: 'Invalid operand: ' + name + ' is a label in your code, not a data address.' };
          else {
            var sug = suggest(name, Object.keys(symbols).concat(Object.keys(dataLabels), Object.keys(codeLabels)));
            return { error: 'Unknown label: ' + name + (sug ? '. Did you mean ' + sug + '?' : '.') };
          }
        }
        terms.push(sign * val);
        pos = re.lastIndex; first = false;
      }
      if (!terms.length) return { error: 'Invalid operand: there’s an empty operand (an extra comma?).' };
      return { v: terms.reduce(function (a, b) { return a + b; }, 0) };
    }

    // EQUs (in order; may reference earlier ones and data labels)
    equs.forEach(function (e) {
      var r = evalExpr(e.expr);
      if (r.error) err(e.line, e.src, r.error); else symbols[e.name] = r.v & 0xFFFF;
    });

    // Data bytes
    var data = [];
    dataLines.forEach(function (d) {
      var bytes = [];
      var wide = /^(DW|DEFW|WORD)$/.test(d.kind);
      d.operands.forEach(function (o) {
        var sm = /^"((?:[^"\\]|\\.)*)"$/.exec(o.trim());
        if (sm) { unescapeStr(sm[1]).split('').forEach(function (c) { bytes.push(c.charCodeAt(0) & 0xFF); }); return; }
        if (o.trim() === '') { err(d.line, d.src, 'Invalid operand: there’s an empty value (an extra comma?).'); return; }
        var r = evalExpr(o.trim());
        if (r.error) { err(d.line, d.src, r.error); return; }
        if (wide) { bytes.push(r.v & 0xFF, (r.v >> 8) & 0xFF); }
        else {
          if (r.v > 255 || r.v < -128) { err(d.line, d.src, 'Invalid operand: ' + o.trim() + ' doesn’t fit in a byte (0–255).'); return; }
          bytes.push(r.v & 0xFF);
        }
      });
      if (d.kind === 'ASCIZ') bytes.push(0);
      data.push({ addr: d.addr, bytes: bytes });
    });

    // ---- Pass 2: instructions ----
    var program = [];

    function classify(o, p) {
      // returns operand descriptor or { error }
      if (o === '') return { error: 'Invalid operand: there’s an empty operand (an extra comma?).' };
      if (R8.indexOf(o) !== -1) return { t: 'r8', r: o };
      if (R16.indexOf(o) !== -1) return { t: 'r16', r: o };
      if (o === 'AF') return { t: 'af' };
      if (/^(IX|IY|IXH|IXL|IYH|IYL|I|R|AF')$/.test(o)) return { error: o + ' isn’t available in this sandbox. Use A, B, C, D, E, H, L and BC, DE, HL.' };
      var pm = /^\((.*)\)$/.exec(o);
      if (pm) {
        var inner = pm[1];
        if (inner === 'HL' || inner === 'BC' || inner === 'DE') return { t: 'ind', r: inner };
        if (inner === 'SP') return { t: 'indsp' };
        if (/^I[XY]/.test(inner)) return { error: 'IX and IY aren’t available in this sandbox. Use (HL).' };
        if (inner === 'C') return { error: '(C) is a port. There are no ports in here.' };
        var ev = evalExpr(inner);
        if (ev.error) return ev;
        return { t: 'abs', a: ev.v & 0xFFFF };
      }
      var e = evalExpr(o);
      if (e.error) return e;
      return { t: 'imm', v: e.v };
    }

    parsed.forEach(function (p) {
      var ops = p.operands;
      var fail = function (msg) { err(p.line, p.src, msg); };
      var ins = { line: p.line, src: p.src, m: p.mnemonic };

      function want(n, forms) {
        if (ops.length !== n) {
          fail(p.mnemonic + ' expects ' + (n === 0 ? 'no operands' : n === 1 ? 'one operand' : n + ' operands separated by a comma') + (forms ? '. For example: ' + forms : '') + '.');
          return false;
        }
        return true;
      }
      function op(i) { var c = classify(ops[i], p); if (c.error) { fail(c.error); return null; } return c; }
      function imm8(c) { if (c.v > 255 || c.v < -128) { fail('Invalid operand: ' + ops[ops.length - 1] + ' doesn’t fit in a byte (0–255).'); return false; } c.v &= 0xFF; return true; }
      function src8ok(c) { return c.t === 'r8' || (c.t === 'ind' && c.r === 'HL') || c.t === 'imm'; }
      function codeTarget(tok) {
        var name = tok.replace(/^\./, '');
        if (codeLabels.hasOwnProperty(name)) return codeLabels[name];
        if (parseNumber(name) !== null) { fail('Jumps need a label here, not an address: ' + tok + '. Put a label on the line you want, like  LOOP:'); return null; }
        if (dataLabels.hasOwnProperty(name)) { fail(name + ' is data, not code. Jumping into data is how I lost my capitals.'); return null; }
        var s = suggest(name, Object.keys(codeLabels));
        fail('Unknown label: ' + name + (s ? '. Did you mean ' + s + '?' : '. Define it with a colon, e.g. ' + name + ':'));
        return null;
      }

      var M = p.mnemonic, a, b;
      switch (M) {
        case 'LD': {
          if (!want(2, 'LD A,(HL)')) return;
          a = op(0); if (!a) return; b = op(1); if (!b) return;
          if (a.t === 'imm') { fail('Invalid operand: the first operand of LD is where the value goes, so it can’t be a number.'); return; }
          if ((a.t === 'r8' || (a.t === 'ind' && a.r === 'HL')) && src8ok(b)) {
            if (a.t === 'ind' && b.t === 'ind') { fail('LD (HL),(HL) isn’t a real instruction. Go through A.'); return; }
            if (b.t === 'imm' && !imm8(b)) return;
            ins.op = 'LD8'; ins.a = a; ins.b = b; break;
          }
          if (a.t === 'r8' && a.r === 'A' && (b.t === 'ind' || b.t === 'abs')) { ins.op = 'LD8'; ins.a = a; ins.b = b; break; }
          if ((a.t === 'ind' || a.t === 'abs') && b.t === 'r8' && b.r === 'A') { ins.op = 'LD8'; ins.a = a; ins.b = b; break; }
          if (a.t === 'r16' && b.t === 'imm') { ins.op = 'LD16'; ins.r = a.r; ins.v = b.v & 0xFFFF; break; }
          if (a.t === 'r16' && a.r === 'SP' && b.t === 'r16' && b.r === 'HL') { ins.op = 'LDSPHL'; break; }
          if (a.t === 'r16' && b.t === 'abs') { ins.op = 'LD16M'; ins.r = a.r; ins.a = b.a; break; }
          if (a.t === 'abs' && b.t === 'r16') { ins.op = 'STO16M'; ins.r = b.r; ins.a = a.a; break; }
          if (a.t === 'r8' && b.t === 'r16') { fail('Invalid operand: ' + a.r + ' holds one byte and ' + b.r + ' holds two. Did you mean LD ' + a.r + ',(' + b.r + ')?'); return; }
          if (a.t === 'r8' && (b.t === 'ind' || b.t === 'abs')) { fail('Only A can be loaded from (' + (b.r || hexAddr(b.a)) + '). Use LD A,' + ops[1] + ' first.'); return; }
          if (a.t === 'r16' && b.t === 'r16') { fail('LD ' + a.r + ',' + b.r + ' isn’t a real instruction. Copy one byte at a time, or PUSH ' + b.r + ' then POP ' + a.r + '.'); return; }
          fail('Invalid operand: LD ' + ops[0] + ',' + ops[1] + ' isn’t a real Z80 instruction.');
          return;
        }
        case 'ADD': case 'ADC': case 'SUB': case 'SBC': case 'AND': case 'OR': case 'XOR': case 'CP': {
          if (ops.length === 2 && ops[0] === 'HL' && (M === 'ADD' || M === 'ADC' || M === 'SBC')) {
            b = op(1); if (!b) return;
            if (b.t !== 'r16') { fail(M + ' HL needs a register pair: BC, DE, HL or SP.'); return; }
            ins.op = M + '16'; ins.r = b.r; break;
          }
          var srcTok;
          if (ops.length === 2) {
            if (ops[0] !== 'A') { fail('Invalid operand: 8-bit ' + M + ' always works on A. Write ' + M + ' A,' + ops[1] + (M === 'ADD' || M === 'ADC' || M === 'SBC' ? '' : ' or just ' + M + ' ' + ops[1]) + '.'); return; }
            srcTok = 1;
          } else if (ops.length === 1) srcTok = 0;
          else { want(1, M + ' B'); return; }
          b = op(srcTok); if (!b) return;
          if (!src8ok(b)) { fail('Invalid operand: ' + M + ' works with a register, (HL), or a number.'); return; }
          if (b.t === 'imm' && !imm8(b)) return;
          ins.op = 'ALU'; ins.alu = M; ins.b = b; break;
        }
        case 'INC': case 'DEC': {
          if (!want(1, M + ' A')) return;
          a = op(0); if (!a) return;
          if (a.t === 'r8' || (a.t === 'ind' && a.r === 'HL')) { ins.op = M + '8'; ins.a = a; break; }
          if (a.t === 'r16') { ins.op = M + '16'; ins.r = a.r; break; }
          fail('Invalid operand: ' + M + ' works on a register, a register pair, or (HL).');
          return;
        }
        case 'JP': case 'JR': case 'CALL': {
          if (ops.length === 1 && M === 'JP' && ops[0] === '(HL)') { ins.op = 'JPHL'; break; }
          var cond = null, tgt;
          if (ops.length === 2) { cond = ops[0]; tgt = ops[1]; }
          else if (ops.length === 1) tgt = ops[0];
          else { want(1, M + ' LOOP'); return; }
          if (cond !== null) {
            if (CONDS.indexOf(cond) === -1) { fail('Unknown condition: ' + cond + '. Conditions are NZ, Z, NC, C' + (M === 'JR' ? '' : ', PO, PE, P, M') + '.'); return; }
            if (M === 'JR' && ['NZ', 'Z', 'NC', 'C'].indexOf(cond) === -1) { fail('JR only takes NZ, Z, NC or C. Use JP for ' + cond + '.'); return; }
          }
          var t = codeTarget(tgt); if (t === null) return;
          ins.op = M === 'CALL' ? 'CALL' : 'JUMP'; ins.cond = cond; ins.target = t; ins.label = tgt; break;
        }
        case 'DJNZ': {
          if (!want(1, 'DJNZ LOOP')) return;
          var t2 = codeTarget(ops[0]); if (t2 === null) return;
          ins.op = 'DJNZ'; ins.target = t2; ins.label = ops[0]; break;
        }
        case 'RET': {
          if (ops.length > 1) { want(0); return; }
          if (ops.length === 1 && CONDS.indexOf(ops[0]) === -1) { fail('Unknown condition: ' + ops[0] + '. Conditions are NZ, Z, NC, C, PO, PE, P, M.'); return; }
          ins.op = 'RET'; ins.cond = ops[0] || null; break;
        }
        case 'PUSH': case 'POP': {
          if (!want(1, M + ' HL')) return;
          if (['BC', 'DE', 'HL', 'AF'].indexOf(ops[0]) === -1) { fail(M + ' works with BC, DE, HL or AF.'); return; }
          ins.op = M; ins.r = ops[0]; break;
        }
        case 'EX': {
          if (!want(2, 'EX DE,HL')) return;
          if ((ops[0] === 'DE' && ops[1] === 'HL') || (ops[0] === 'HL' && ops[1] === 'DE')) { ins.op = 'EXDEHL'; break; }
          if (ops[0] === '(SP)' && ops[1] === 'HL') { ins.op = 'EXSPHL'; break; }
          fail('Only EX DE,HL and EX (SP),HL are available.'); return;
        }
        case 'BIT': case 'SET': case 'RES': {
          if (!want(2, M + ' 5,A')) return;
          var bn = parseNumber(ops[0]);
          if (bn === null || bn < 0 || bn > 7) { fail('Invalid operand: the bit number must be 0–7.'); return; }
          a = op(1); if (!a) return;
          if (!(a.t === 'r8' || (a.t === 'ind' && a.r === 'HL'))) { fail('Invalid operand: ' + M + ' works on a register or (HL).'); return; }
          ins.op = M; ins.bit = bn; ins.a = a; break;
        }
        case 'RLC': case 'RRC': case 'RL': case 'RR': case 'SLA': case 'SRA': case 'SRL': {
          if (!want(1, M + ' A')) return;
          a = op(0); if (!a) return;
          if (!(a.t === 'r8' || (a.t === 'ind' && a.r === 'HL'))) { fail('Invalid operand: ' + M + ' works on a register or (HL).'); return; }
          ins.op = 'SHIFT'; ins.sh = M; ins.a = a; break;
        }
        case 'RLCA': case 'RRCA': case 'RLA': case 'RRA': case 'CPL': case 'NEG': case 'SCF': case 'CCF':
        case 'NOP': case 'HALT': case 'DI': case 'EI': case 'LDI': case 'LDIR': case 'LDD': case 'LDDR': case 'CPI': case 'CPIR':
          if (!want(0)) return;
          ins.op = M; break;
        default: {
          if (NOT_AVAILABLE[M]) { fail('Unknown instruction: ' + NOT_AVAILABLE[M]); return; }
          if (/^B_?CALL\(/i.test(p.mnemonic)) { fail('Unknown instruction: ' + NOT_AVAILABLE.BCALL); return; }
          var s3 = suggest(M, MNEMONICS);
          if (ops.length === 0 && isIdentifier(M) && !s3) { fail('Unknown instruction: ' + M + '. If this is meant to be a label, add a colon: ' + M + ':'); return; }
          fail('Unknown instruction: ' + M + (s3 ? '. Did you mean ' + s3 + '?' : '.'));
          return;
        }
      }
      program.push(ins);
    });

    errors.sort(function (x, y) { return x.line - y.line; });
    program.data = data;
    var labels = {};
    Object.keys(codeLabels).forEach(function (k) { labels[k] = codeLabels[k]; });
    return { ok: errors.length === 0, program: program, labels: labels, dataLabels: dataLabels, errors: errors, instructionCount: program.length };
  }

  function unescapeStr(s) {
    return s.replace(/\\(.)/g, function (_, c) { return { n: '\n', t: '\t', r: '\r', '0': '\0' }[c] || c; });
  }

  // ---------- interpreter ----------
  var FS = 0x80, FZ = 0x40, FH = 0x10, FPV = 0x04, FN = 0x02, FC = 0x01;

  function parity(v) { v &= 0xFF; var p = 0; while (v) { p ^= v & 1; v >>= 1; } return p === 0; }
  function szp(v) { return (v & 0x80 ? FS : 0) | (v === 0 ? FZ : 0) | (parity(v) ? FPV : 0); }

  function run(program, env) {
    var mem = new Uint8Array(0x10000);
    var inAddr = env.input ? env.input.addr : 0x8000, inBytes = env.input ? env.input.bytes : [];
    var outAddr = env.output ? env.output.addr : 0x9000, outLen = env.output ? env.output.length : 0;
    var maxSteps = env.maxSteps || 1000;
    var i;
    (program.data || []).forEach(function (d) { for (var k = 0; k < d.bytes.length; k++) mem[(d.addr + k) & 0xFFFF] = d.bytes[k]; });
    for (i = 0; i < inBytes.length; i++) mem[inAddr + i] = inBytes[i];

    var r = { A: 0, F: 0, B: 0, C: 0, D: 0, E: 0, H: 0, L: 0, SP: STACK_TOP };
    var pc = 0, steps = 0, trace = [], writes = [];
    var status = null, message = '';
    var callDepth = 0;

    function get16(p) {
      if (p === 'SP') return r.SP;
      if (p === 'AF') return (r.A << 8) | r.F;
      return (r[p[0]] << 8) | r[p[1]];
    }
    function set16(p, v) {
      v &= 0xFFFF;
      if (p === 'SP') { r.SP = v; return; }
      if (p === 'AF') { r.A = v >> 8; r.F = v & 0xFF; return; }
      r[p[0]] = v >> 8; r[p[1]] = v & 0xFF;
    }
    function write(addr, v, ins) {
      addr &= 0xFFFF;
      mem[addr] = v & 0xFF;
      writes.push(addr);
    }
    function rd(o) {
      switch (o.t) {
        case 'r8': return r[o.r];
        case 'ind': return mem[get16(o.r)];
        case 'abs': return mem[o.a];
        case 'imm': return o.v & 0xFF;
      }
      return 0;
    }
    function wr(o, v, ins) {
      v &= 0xFF;
      if (o.t === 'r8') r[o.r] = v;
      else if (o.t === 'ind') write(get16(o.r), v, ins);
      else if (o.t === 'abs') write(o.a, v, ins);
    }
    function push16(v, ins) { r.SP = (r.SP - 1) & 0xFFFF; write(r.SP, (v >> 8) & 0xFF, ins); r.SP = (r.SP - 1) & 0xFFFF; write(r.SP, v & 0xFF, ins); }
    function pop16() { var lo = mem[r.SP]; r.SP = (r.SP + 1) & 0xFFFF; var hi = mem[r.SP]; r.SP = (r.SP + 1) & 0xFFFF; return (hi << 8) | lo; }
    function cond(c) {
      switch (c) {
        case null: case undefined: return true;
        case 'NZ': return !(r.F & FZ);
        case 'Z': return !!(r.F & FZ);
        case 'NC': return !(r.F & FC);
        case 'C': return !!(r.F & FC);
        case 'PO': return !(r.F & FPV);
        case 'PE': return !!(r.F & FPV);
        case 'P': return !(r.F & FS);
        case 'M': return !!(r.F & FS);
      }
      return false;
    }
    function alu(kind, v) {
      var a = r.A, res, c = r.F & FC ? 1 : 0;
      switch (kind) {
        case 'ADD': case 'ADC': {
          var cin = kind === 'ADC' ? c : 0;
          res = a + v + cin;
          r.F = (res & 0x80 ? FS : 0) | ((res & 0xFF) === 0 ? FZ : 0) | (((a & 0xF) + (v & 0xF) + cin) & 0x10 ? FH : 0) |
            (((a ^ ~v) & (a ^ res) & 0x80) ? FPV : 0) | (res > 0xFF ? FC : 0);
          r.A = res & 0xFF; return;
        }
        case 'SUB': case 'SBC': case 'CP': {
          var bin = kind === 'SBC' ? c : 0;
          res = a - v - bin;
          var f = (res & 0x80 ? FS : 0) | ((res & 0xFF) === 0 ? FZ : 0) | (((a & 0xF) - (v & 0xF) - bin) & 0x10 ? FH : 0) |
            (((a ^ v) & (a ^ res) & 0x80) ? FPV : 0) | FN | (res < 0 ? FC : 0);
          r.F = f;
          if (kind !== 'CP') r.A = res & 0xFF;
          return;
        }
        case 'AND': r.A = a & v; r.F = szp(r.A) | FH; return;
        case 'OR': r.A = a | v; r.F = szp(r.A); return;
        case 'XOR': r.A = a ^ v; r.F = szp(r.A); return;
      }
    }
    function shift(kind, v) {
      var c = r.F & FC ? 1 : 0, out, res;
      switch (kind) {
        case 'RLC': out = v >> 7; res = ((v << 1) | out) & 0xFF; break;
        case 'RRC': out = v & 1; res = ((v >> 1) | (out << 7)) & 0xFF; break;
        case 'RL': out = v >> 7; res = ((v << 1) | c) & 0xFF; break;
        case 'RR': out = v & 1; res = ((v >> 1) | (c << 7)) & 0xFF; break;
        case 'SLA': out = v >> 7; res = (v << 1) & 0xFF; break;
        case 'SRA': out = v & 1; res = ((v >> 1) | (v & 0x80)) & 0xFF; break;
        case 'SRL': out = v & 1; res = v >> 1; break;
      }
      r.F = szp(res) | (out ? FC : 0);
      return res;
    }

    while (status === null) {
      if (pc >= program.length) {
        status = 'no-halt';
        message = 'Program did not halt: execution ran past the last instruction. End your program with HALT.';
        break;
      }
      if (steps >= maxSteps) {
        status = 'limit';
        message = 'Execution limit reached: ' + maxSteps + ' instructions ran without the program stopping. The loop may never end.';
        break;
      }
      var ins = program[pc];
      steps++;
      var next = pc + 1, v, res, t;
      switch (ins.op) {
        case 'LD8': wr(ins.a, rd(ins.b), ins); break;
        case 'LD16': set16(ins.r, ins.v); break;
        case 'LDSPHL': r.SP = get16('HL'); break;
        case 'LD16M': set16(ins.r, mem[ins.a] | (mem[(ins.a + 1) & 0xFFFF] << 8)); break;
        case 'STO16M': v = get16(ins.r); write(ins.a, v & 0xFF, ins); write(ins.a + 1, v >> 8, ins); break;
        case 'ALU': alu(ins.alu, rd(ins.b)); break;
        case 'ADD16': case 'ADC16': case 'SBC16': {
          var hl = get16('HL'), rr = get16(ins.r), cy = r.F & FC ? 1 : 0;
          if (ins.op === 'ADD16') { res = hl + rr; r.F = (r.F & (FS | FZ | FPV)) | (res > 0xFFFF ? FC : 0); }
          else if (ins.op === 'ADC16') { res = hl + rr + cy; r.F = (res & 0x8000 ? FS : 0) | ((res & 0xFFFF) === 0 ? FZ : 0) | (res > 0xFFFF ? FC : 0); }
          else { res = hl - rr - cy; r.F = (res & 0x8000 ? FS : 0) | ((res & 0xFFFF) === 0 ? FZ : 0) | FN | (res < 0 ? FC : 0); }
          set16('HL', res); break;
        }
        case 'INC8': v = (rd(ins.a) + 1) & 0xFF; wr(ins.a, v, ins); r.F = (r.F & FC) | (v & 0x80 ? FS : 0) | (v === 0 ? FZ : 0) | (v === 0x80 ? FPV : 0) | ((v & 0xF) === 0 ? FH : 0); break;
        case 'DEC8': v = (rd(ins.a) - 1) & 0xFF; wr(ins.a, v, ins); r.F = (r.F & FC) | FN | (v & 0x80 ? FS : 0) | (v === 0 ? FZ : 0) | (v === 0x7F ? FPV : 0) | ((v & 0xF) === 0xF ? FH : 0); break;
        case 'INC16': set16(ins.r, get16(ins.r) + 1); break;
        case 'DEC16': set16(ins.r, get16(ins.r) - 1); break;
        case 'JUMP': if (cond(ins.cond)) next = ins.target; break;
        case 'JPHL': {
          // Only meaningful if HL holds a code index (e.g. from a jump table). Treat out of range as running off the end.
          next = get16('HL'); break;
        }
        case 'DJNZ': r.B = (r.B - 1) & 0xFF; if (r.B !== 0) next = ins.target; break;
        case 'CALL': if (cond(ins.cond)) { push16(next, ins); callDepth++; next = ins.target; } break;
        case 'RET':
          if (cond(ins.cond)) {
            if (callDepth === 0) { status = 'ret'; break; }
            callDepth--; next = pop16();
          }
          break;
        case 'PUSH': push16(get16(ins.r), ins); break;
        case 'POP': set16(ins.r, pop16()); break;
        case 'EXDEHL': t = get16('DE'); set16('DE', get16('HL')); set16('HL', t); break;
        case 'EXSPHL': t = mem[r.SP] | (mem[(r.SP + 1) & 0xFFFF] << 8); v = get16('HL'); write(r.SP, v & 0xFF, ins); write(r.SP + 1, v >> 8, ins); set16('HL', t); break;
        case 'BIT': v = rd(ins.a); r.F = (r.F & FC) | FH | ((v >> ins.bit) & 1 ? 0 : FZ | FPV) | (ins.bit === 7 && (v & 0x80) ? FS : 0); break;
        case 'SET': wr(ins.a, rd(ins.a) | (1 << ins.bit), ins); break;
        case 'RES': wr(ins.a, rd(ins.a) & ~(1 << ins.bit), ins); break;
        case 'SHIFT': wr(ins.a, shift(ins.sh, rd(ins.a)), ins); break;
        case 'RLCA': v = r.A >> 7; r.A = ((r.A << 1) | v) & 0xFF; r.F = (r.F & (FS | FZ | FPV)) | (v ? FC : 0); break;
        case 'RRCA': v = r.A & 1; r.A = ((r.A >> 1) | (v << 7)) & 0xFF; r.F = (r.F & (FS | FZ | FPV)) | (v ? FC : 0); break;
        case 'RLA': v = r.A >> 7; r.A = ((r.A << 1) | (r.F & FC ? 1 : 0)) & 0xFF; r.F = (r.F & (FS | FZ | FPV)) | (v ? FC : 0); break;
        case 'RRA': v = r.A & 1; r.A = ((r.A >> 1) | (r.F & FC ? 0x80 : 0)) & 0xFF; r.F = (r.F & (FS | FZ | FPV)) | (v ? FC : 0); break;
        case 'CPL': r.A = (~r.A) & 0xFF; r.F |= FH | FN; break;
        case 'NEG': v = r.A; r.A = 0; alu('SUB', v); break;
        case 'SCF': r.F = (r.F & (FS | FZ | FPV)) | FC; break;
        case 'CCF': r.F = (r.F & (FS | FZ | FPV)) | (r.F & FC ? 0 : FC); break;
        case 'NOP': case 'DI': case 'EI': break;
        case 'LDI': case 'LDD': case 'LDIR': case 'LDDR': {
          var step = (ins.op === 'LDI' || ins.op === 'LDIR') ? 1 : -1;
          write(get16('DE'), mem[get16('HL')], ins);
          set16('HL', get16('HL') + step); set16('DE', get16('DE') + step); set16('BC', get16('BC') - 1);
          r.F = (r.F & (FS | FZ | FC)) | (get16('BC') !== 0 ? FPV : 0);
          if ((ins.op === 'LDIR' || ins.op === 'LDDR') && get16('BC') !== 0) next = pc;
          break;
        }
        case 'CPI': case 'CPIR': {
          v = mem[get16('HL')]; res = (r.A - v) & 0xFF;
          set16('HL', get16('HL') + 1); set16('BC', get16('BC') - 1);
          r.F = (r.F & FC) | FN | (res & 0x80 ? FS : 0) | (res === 0 ? FZ : 0) | (get16('BC') !== 0 ? FPV : 0);
          if (ins.op === 'CPIR' && get16('BC') !== 0 && res !== 0) next = pc;
          break;
        }
        case 'HALT': status = 'halt'; break;
        default:
          status = 'error'; message = 'Line ' + ins.line + ': internal error (unsupported operation).';
      }
      if (trace.length < 400) trace.push({ step: steps, line: ins.line, src: ins.src, A: r.A, B: r.B, C: r.C, HL: get16('HL'), DE: get16('DE'), F: r.F });
      if (status === null) pc = next;
    }

    var out = [];
    for (i = 0; i < outLen; i++) out.push(mem[outAddr + i]);
    var intact = true;
    for (i = 0; i < inBytes.length; i++) if (mem[inAddr + i] !== inBytes[i]) intact = false;

    return {
      status: status,
      ended: status === 'halt' || status === 'ret',
      message: message,
      regs: { A: r.A, B: r.B, C: r.C, D: r.D, E: r.E, H: r.H, L: r.L, HL: get16('HL'), DE: get16('DE'), BC: get16('BC'), SP: r.SP },
      flags: { Z: !!(r.F & FZ), C: !!(r.F & FC), S: !!(r.F & FS), PV: !!(r.F & FPV) },
      steps: steps,
      trace: trace,
      writes: writes,
      output: out,
      inputIntact: intact,
      peek: function (addr, n) { return Array.prototype.slice.call(mem, addr, addr + n); }
    };
  }

  function formatHex(bytes) { return bytes.map(function (b) { return hex(b, 2); }).join(' '); }
  function formatAscii(bytes) {
    return bytes.map(function (b) {
      if (b === 0) return '·';
      if (b >= 32 && b < 127) return String.fromCharCode(b);
      return '?';
    }).join('');
  }

  L.z80 = {
    assemble: assemble,
    run: run,
    parseNumber: parseNumber,
    formatHex: formatHex,
    formatAscii: formatAscii,
    hex: hex,
    hexAddr: hexAddr
  };
})(globalThis);
