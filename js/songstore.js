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
/* PROJECT LEGACY — the boss song (round 5), kept ON THE FINALE DEVICE ONLY.
 * The Confidence Man track is copyrighted, so it never goes on the public site. Sophie loads the MP3 once
 * (Organizer → BOSS SONG) on the phone that runs the finale; it's saved in IndexedDB and plays fully offline.
 * Record: { data: ArrayBuffer, name, size, bpm, offset (sec to the first downbeat), savedAt } */
(function (g) {
  'use strict';
  var L = (g.Legacy = g.Legacy || {});
  var DB = 'legacy-finale', STORE = 'files', KEY = 'boss';

  function open() {
    return new Promise(function (res, rej) {
      if (!g.indexedDB) { rej(new Error('no indexedDB')); return; }
      var r = g.indexedDB.open(DB, 1);
      r.onupgradeneeded = function () { r.result.createObjectStore(STORE); };
      r.onsuccess = function () { res(r.result); };
      r.onerror = function () { rej(r.error); };
    });
  }
  function tx(mode, fn) {
    return open().then(function (db) {
      return new Promise(function (res, rej) {
        var t = db.transaction(STORE, mode), out;
        out = fn(t.objectStore(STORE));
        t.oncomplete = function () { res(out && 'result' in out ? out.result : true); };
        t.onerror = function () { rej(t.error); };
      });
    });
  }
  function save(file, bpm, offset) {
    return file.arrayBuffer().then(function (data) {
      try { if (g.navigator.storage && g.navigator.storage.persist) g.navigator.storage.persist(); } catch (e) {}
      return tx('readwrite', function (st) { return st.put({ data: data, name: file.name, size: file.size, bpm: bpm, offset: offset, savedAt: Date.now() }, KEY); });
    });
  }
  function load() { return tx('readonly', function (st) { return st.get(KEY); }).then(function (r) { return r || null; }).catch(function () { return null; }); }
  function setMap(bpm, offset) { return load().then(function (r) { if (!r) return false; r.bpm = bpm; r.offset = offset; return tx('readwrite', function (st) { return st.put(r, KEY); }); }); }
  function clear() { return tx('readwrite', function (st) { return st.delete(KEY); }); }

  L.songStore = { save: save, load: load, setMap: setMap, clear: clear };
})(globalThis);
