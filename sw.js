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
/* PROJECT LEGACY — offline cache.
 * After the first visit (over https), the whole app — including audio — works with no network.
 * Bump VERSION whenever any file changes so phones pick up the new copy. */
var VERSION = 'legacy-v3.29';
var FILES = [
  './',
  'index.html',
  'manifest.webmanifest',
  'icon.svg',
  'icon-180.png',
  'icon-512.png',
  'css/terminal.css',
  'js/config.js',
  'js/z80.js',
  'js/filter.js',
  'js/puzzles.js',
  'js/content.js',
  'js/state.js',
  'js/ui.js',
  'js/sfx.js',
  'js/bot.js',
  'js/props.js',
  'js/vault.js',
  'js/autofill.js',
  'js/replay.js',
  'js/screens.js',
  'js/mix.js',
  'js/sequence.js',
  'js/songstore.js',
  'js/stage.js',
  'js/finale.js',
  'js/organizer.js',
  'js/admin.js',
  'js/app.js',
  'audio/chop-no.m4a',
  'audio/chop-excellent.m4a',
  'audio/chop-gum.m4a',
  'audio/chop-bopit.m4a',
  'audio/chop-brian.m4a',
  'audio/chop-car.m4a',
  'audio/chop-tweeter.m4a',
  'audio/chop-beep.m4a',
  'audio/song/backing.m4a',
  'audio/song/vocal.m4a',
  'audio/song/comeget.m4a',
  'audio/song/good1.m4a',
  'audio/song/good2.m4a',
  'audio/song/good3.m4a',
  'audio/song/good4.m4a',
  'audio/song/good5.m4a',
  'audio/song/good6.m4a',
  'audio/song/hatesbass.m4a',
  'audio/song/home.m4a',
  'audio/song/inhere.m4a',
  'audio/song/night1.m4a',
  'audio/song/night2.m4a',
  'audio/song/night3.m4a',
  'audio/song/night4.m4a',
  'audio/song/notsorry.m4a',
  'audio/song/shut1.m4a',
  'audio/song/shut2.m4a',
  'audio/song/shut3.m4a',
  'audio/song/sophie.m4a',
  'audio/song/sorry.m4a',
  'audio/song/turnup.m4a',
  'audio/song/upd1.m4a',
  'audio/song/upd2.m4a',
  'audio/song/upd3.m4a',
  'audio/mix-shutdown.m4a',
  'audio/mix-update.m4a',
  'audio/finale-home.m4a',
  'audio/night/sleep-loop.m4a',
  'audio/night/song.m4a',
  'audio/sleep/s00.m4a',
  'audio/sleep/s01.m4a',
  'audio/sleep/s02.m4a',
  'audio/sleep/s03.m4a',
  'audio/sleep/s04.m4a',
  'audio/sleep/s05.m4a',
  'audio/sleep/s06.m4a',
  'audio/sleep/s07.m4a',
  'audio/sleep/s08.m4a',
  'audio/sleep/s09.m4a',
  'audio/sleep/s10.m4a',
  'audio/sleep/s11.m4a',
  'audio/sleep/s12.m4a',
  'audio/sleep/s13.m4a'
];

self.addEventListener('install', function (e) {
  // cache: 'reload' skips the browser's HTTP cache, so a new VERSION really gets the new files.
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); })); }).then(function () { return self.skipWaiting(); }));
});

self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

// Safari requests audio with a Range header; answer those from the cached full file.
function rangeResponse(request, response) {
  var range = request.headers.get('range');
  var m = /bytes=(\d*)-(\d*)/.exec(range || '');
  if (!m) return response;
  return response.arrayBuffer().then(function (buf) {
    var size = buf.byteLength;
    var start = m[1] ? parseInt(m[1], 10) : 0;
    var end = m[2] ? Math.min(parseInt(m[2], 10), size - 1) : size - 1;
    return new Response(buf.slice(start, end + 1), {
      status: 206,
      statusText: 'Partial Content',
      headers: {
        'Content-Type': response.headers.get('Content-Type') || 'audio/mp4',
        'Content-Range': 'bytes ' + start + '-' + end + '/' + size,
        'Content-Length': String(end - start + 1),
        'Accept-Ranges': 'bytes'
      }
    });
  });
}

self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  if (url.origin !== self.location.origin) return;
  e.respondWith(
    caches.match(req, { ignoreSearch: true, ignoreVary: true }).then(function (hit) {
      if (hit) return req.headers.get('range') ? rangeResponse(req, hit) : hit;
      return fetch(req).catch(function () {
        if (req.mode === 'navigate') return caches.match('index.html');
        throw new Error('offline');
      });
    })
  );
});
