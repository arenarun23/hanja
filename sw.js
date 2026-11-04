/* 한자 찾기 — 오프라인용 서비스 워커
 *  - 처음 한 번 인터넷으로 열면 앱·사전·글꼴을 저장해 두고, 이후엔 인터넷이 없어도 열린다.
 *  - 필기 인식(구글)·음성 인식은 인터넷이 필요하다(이 파일은 외부 주소 요청을 건드리지 않는다).
 *  - 같은 출처의 이 앱 폴더(./)와 허브의 글꼴 폴더(../fonts/)만 처리한다.
 *
 * 전략
 *   · 화면(HTML)·manifest·sw.js : 네트워크 우선(4초 안에 못 받으면 저장본) → 앱을 고치면 바로 반영, 오프라인이면 저장본
 *   · 사전(dict/*)·아이콘        : 저장본을 먼저 보여 주고 뒤에서 최신으로 갱신(서버에 '바뀌었나' 만 물어 변경 없으면 거의 다운로드 없음)
 *   · 글꼴 파일(../fonts/*.woff2): 저장본 우선(파일 이름이 버전 고정이라 바뀌지 않음), 쓴 글자의 조각만 저장
 *   · 글꼴 CSS(../fonts/*.css)   : 사전과 같은 방식
 * 버전: 아래 VERSION 을 올리면 예전 저장본을 지운다(캐시 구조를 바꿀 때만 올리면 된다. 사전·화면 변경은 자동 갱신).
 */
const VERSION = 'hanja-v1';
const CORE = ['./', 'index.html', 'manifest.webmanifest', 'favicon.svg',
  'dict/chars.json', 'dict/grades.json', 'dict/levels.json', 'dict/strokes.json', 'dict/words-core.json'];
// 허브의 글꼴 CSS — 허브 밖에서 단독 배포되면 없을 수 있으므로 '선택'(없어도 설치는 성공). 첫 방문에서는 CSS 를 서비스 워커가 켜지기 전에 받으므로 설치 때 미리 저장한다.
const OPTIONAL = ['../fonts/noto-serif-kr.css', '../fonts/noto-serif-tc.css'];

const APP_PATH = new URL('./', self.location).pathname;           // 예: /hanja/
const FONT_PATH = new URL('../fonts/', self.location).pathname;   // 예: /fonts/

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(CORE).then(() => Promise.allSettled(OPTIONAL.map((u) => c.add(u))))).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('hanja-') && k !== VERSION).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

const withTimeout = (p, ms) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error('timeout')), ms))]);

async function networkFirst(e, req) {
  const cache = await caches.open(VERSION);
  try {
    const res = await withTimeout(fetch(req), 4000);
    if (res && res.ok) e.waitUntil(cache.put(req, res.clone()));
    return res;
  } catch (_) {
    const hit = (await cache.match(req)) || (await cache.match(req, { ignoreSearch: true })) || (req.mode === 'navigate' ? await cache.match('index.html') : null);
    return hit || Response.error();
  }
}

async function staleWhileRevalidate(e, req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  const update = fetch(new Request(req, { cache: 'no-cache' }))      // 서버에 바뀌었는지만 확인(ETag) → 같으면 304
    .then(async (res) => { if (res && res.ok) await cache.put(req, res.clone()); return res; })
    .catch(() => null);
  e.waitUntil(update);                                               // 응답을 먼저 주더라도 저장이 끝날 때까지 서비스 워커를 살려 둔다
  return hit || (await update) || Response.error();
}

async function cacheFirst(e, req) {
  const cache = await caches.open(VERSION);
  const hit = await cache.match(req);
  if (hit) return hit;
  try {
    const res = await fetch(req);
    if (res && res.ok) e.waitUntil(cache.put(req, res.clone()));
    return res;
  } catch (_) {
    return Response.error();
  }
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;                   // 외부(구글 필기 인식 등)는 그대로 통과
  const p = url.pathname;
  if (p.startsWith(FONT_PATH)) return void e.respondWith(p.endsWith('.woff2') ? cacheFirst(e, req) : staleWhileRevalidate(e, req));
  if (!p.startsWith(APP_PATH)) return;
  if (req.mode === 'navigate' || p.endsWith('/') || p.endsWith('.html') || p.endsWith('.webmanifest') || p.endsWith('/sw.js')) {
    return void e.respondWith(networkFirst(e, req));
  }
  e.respondWith(staleWhileRevalidate(e, req));
});
