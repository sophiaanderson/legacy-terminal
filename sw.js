/* PROJECT LEGACY — offline cache.
 * After the first visit (over https), the whole app — including audio — works with no network.
 * Bump VERSION whenever any file changes so phones pick up the new copy. */
var VERSION = 'legacy-v3.6';
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
  'audio/mix-hiding.m4a',
  'audio/mix-copy.m4a',
  'audio/mix-excellent.m4a',
  'audio/mix-demand.m4a',
  'audio/mix-shutdown.m4a',
  'audio/mix-update.m4a',
  'audio/finale-home.m4a'
];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(FILES); }).then(function () { return self.skipWaiting(); }));
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
