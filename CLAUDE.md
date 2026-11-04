# 한자 찾기 (hanja)

필기/음성으로 낱말을 입력하면 한자·훈음·같은 글자가 쓰인 말을 보여 주는 앱. 급수(8급 50자·7급 100자·6급 150자, 한국어문회 기준) 한자 지원.

## 구조
- `index.html`(약 38KB), 런타임 사전 `dict/{chars,words,grades,levels}.json`(words.json 약 5.4MB), 원본 `source/`(libhangul `hanja.txt`, BSD-3 `source/LICENSE-hanja-data.txt`), 생성 스크립트 `scripts/build-data.mjs`(`npm run build:data`), `icons/`, `manifest.webmanifest`, `vercel.json`.
- 사전을 바꾸면 반드시 `npm run build:data` 로 `dict/` 를 재생성해 함께 커밋한다. 앱은 `fetch('dict/…')`(상대경로)로 읽으므로 **허브 배포에서 `dict/` 는 제외하면 안 된다**(허브 `apps.json` 의 `exclude` 는 `source`·`scripts`·`package.json` 만).
- 입력 모드 `漢字/한글`, 버튼 ✍️필기·🎙️녹음·⏹중지, ⚙️(속도·크기·글씨 색은 `localStorage('hanja-ink')`). 필기 인식은 구글 입력도구 비공식 엔드포인트, 음성은 Web Speech API.
- 화면 구석 `버전 MM/DD HH:MM` 라벨은 빌드 확인용 — 수정할 때 같이 갱신한다.
- words.json 이 커서 모바일 첫 로딩이 느릴 수 있다.

## 공통 규칙 (AIEDU 허브)
- 이 앱은 **AIEDU 허브**(https://aiedu-pearl.vercel.app)의 서비스 중 하나다. 허브는 `arenarun23/aiedu` 저장소이고, 빌드 때 이 저장소를 가져와 `/hanja/` 하위 경로로 서비스한다. 허브 전체 구조·점검법은 그 저장소의 `.claude/skills/aiedu-hub`, 서비스별 설명은 `.claude/skills/aiedu-services` 에 있다(필요하면 `arenarun23/aiedu` 를 add_repo 로 붙여 읽는다).
- **정적 파일 + 상대경로만** 사용한다(`/foo.js` 같은 절대경로 금지). 서버·API 키 없음. 빌드가 필요한 구조로 바꾸지 않는다.
- **화면이 깨지지 않고 한 화면에 맞는 것**이 중요하다(주 사용 기기: 삼성 태블릿 가로·폰). 수정 후 1280×560, 1366×650, 800×1280, 390×780, 360×640, 800×360 크기에서 확인한다(허브 저장소 `scripts/fit-check.mjs` 참고). 아이용 큰 터치 버튼은 낮은 화면 미디어쿼리 안에서만 줄인다.
- `main` 에 push 하면 `.github/workflows/notify-hub.yml` 이 허브를 즉시 다시 배포한다(저장소 Secret `HUB_DEPLOY_HOOK` 사용, 20~60초). **Secret 값·훅 주소는 파일/커밋/로그에 쓰지 않는다.**
- push 전 `git fetch origin main` 으로 확인하고, 같은 앱을 다른 세션이 고치고 있었다면 rebase 해서 양쪽 기능을 모두 살린다.
- 반영이 안 보이면 코드보다 먼저 배포본을 비교한다: `curl -s https://aiedu-pearl.vercel.app/apps.json` 의 `hanja` 항목 `sha` 가 이 저장소 최신 커밋과 같은지.
- **AIEDU 복귀 아이콘**(`a.aiedu-home`, 웃는 별 44px): 모든 서비스가 같은 모양·같은 자리(페이지 왼쪽 위 8px, `<body>` 첫 요소, 링크 `../`)에 둔다. 지우거나 옮기지 않는다. 레이아웃을 바꿀 때 왼쪽 위 52×52px 를 비워 둔다 — 이 앱의 자리 확보: `.left h2{padding-left:52px}`, 좁은/낮은 화면에서는 `.left{padding-top:52px}`. 원본 코드: 허브 저장소 `templates/aiedu-home.html`.

- **외부 호스트 호출 금지(보안, CSP 가 브라우저에서 차단)**: 허용되는 외부 주소는 필기 인식 `inputtools.google.com` 하나뿐이다. 글꼴은 허브의 자체 호스팅 CSS 를 쓴다 — `<link rel="stylesheet" href="../fonts/jua.css">`(`jua`·`gowun-dodum`·`noto-sans-kr`·`noto-serif-kr`·`noto-serif-tc`). **Google Fonts 링크, CDN 이미지·스크립트를 넣지 않는다.** 이미지·데이터는 이 저장소 안에 둔다. 사용자·인식 결과를 HTML 에 넣을 땐 `esc()`/`textContent`, 속성은 큰따옴표. 자세한 규칙: 허브 저장소 `.claude/skills/aiedu-hub/references/security.md`.
