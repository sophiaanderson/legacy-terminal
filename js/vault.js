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
/* PROJECT LEGACY: the organizer bundle loader (public, harmless on its own).
 *
 * Before the finale the public site can't carry the email bot, the prop texts or the answer sheet in the clear.
 * They ship inside js/org.bin, AES-encrypted with the admin PIN (scripts/package-site.py). When Sophie unlocks
 * #admin, the bundle is decrypted and kept on HER phone only (localStorage), then loaded on every visit from
 * here, so admin REPLAY shows every email and reply on screen, and the answers-filled run works.
 * Brian's phone never has the PIN, so for him this file does nothing.
 * Must load after bot.js / props.js (stand-ins on the public site) and before replay.js.
 */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var KEY = 'legacyOrgBundle', ITER = 200000;
  var BUNDLE_ID = '6a564d6badd4def0';                      // replaced with org.bin's hash by scripts/package-site.py
  var ID_KEY = 'legacyOrgBundleId', PASS_KEY = 'legacyOrgPin';   // Sophie's phone only: so a new build refreshes itself

  function stored() { try { return g.localStorage.getItem(KEY); } catch (e) { return null; } }
  function load() {
    var code = stored();
    if (!code) return false;
    var id = null, pin = null;
    try { id = g.localStorage.getItem(ID_KEY); pin = g.localStorage.getItem(PASS_KEY); } catch (e) { /* ignore */ }
    if (BUNDLE_ID !== 'dev' && id !== BUNDLE_ID && pin) {
      // New build: fetch and decrypt the new bundle, then reload once, so admin replay always runs the current emails/answers.
      unlock(pin).then(function (ok) { if (ok) g.location.reload(); });
      return false;
    }
    try { (0, eval)(code); return true; } catch (e) { return false; }   // eslint-disable-line no-eval
  }

  /** Decrypt js/org.bin (openssl enc -aes-256-cbc -pbkdf2 -md sha256 format) with the PIN and keep it. */
  function unlock(pin) {
    if (!g.crypto || !g.crypto.subtle || !g.fetch) return Promise.resolve(false);
    var enc = new TextEncoder();
    return g.fetch('js/org.bin', { cache: 'no-store' }).then(function (r) { if (!r.ok) throw new Error('no bundle'); return r.arrayBuffer(); })
      .then(function (buf) {
        var all = new Uint8Array(buf);
        if (String.fromCharCode.apply(null, all.slice(0, 8)) !== 'Salted__') throw new Error('bad bundle');
        var salt = all.slice(8, 16), ct = all.slice(16);
        return g.crypto.subtle.importKey('raw', enc.encode('legacy-bundle:' + pin), 'PBKDF2', false, ['deriveBits'])
          .then(function (base) { return g.crypto.subtle.deriveBits({ name: 'PBKDF2', hash: 'SHA-256', salt: salt, iterations: ITER }, base, 384); })
          .then(function (bits) {
            var b = new Uint8Array(bits);
            return g.crypto.subtle.importKey('raw', b.slice(0, 32), 'AES-CBC', false, ['decrypt'])
              .then(function (k) { return g.crypto.subtle.decrypt({ name: 'AES-CBC', iv: b.slice(32, 48) }, k, ct); });
          });
      })
      .then(function (plain) {
        var code = new TextDecoder().decode(plain);
        try { g.localStorage.setItem(KEY, code); g.localStorage.setItem(ID_KEY, BUNDLE_ID); g.localStorage.setItem(PASS_KEY, pin); } catch (e) { return false; }
        return true;
      })
      .catch(function () { return false; });   // local copies (test.html) have no org.bin: the plain files are already loaded
  }
  function forget() { try { g.localStorage.removeItem(KEY); g.localStorage.removeItem(ID_KEY); g.localStorage.removeItem(PASS_KEY); } catch (e) { /* ignore */ } }

  L.orgBundle = { loaded: load(), unlock: unlock, forget: forget, has: function () { return !!stored(); } };
})(globalThis);
