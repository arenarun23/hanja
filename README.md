# 한자 찾기
필기/음성으로 낱말을 입력하면 한자와 훈·음, 같은 글자가 쓰인 말을 보여 주는 정적 웹앱 (서버·API 키 불필요).
- 필기 인식: 브라우저에서 구글 Input Tools 필기 엔진 직접 호출 (비공식)
- 음성 인식: 브라우저 Web Speech API (크롬/엣지/사파리)
- 한자 사전: libhangul `hanja.txt` (BSD-3, `source/LICENSE-hanja-data.txt`) → `npm run build:data` 로 `dict/*.json` 생성
  - 낱말 사전은 `words-core.json`(핵심 1.4MB, 처음 열 때) + `words-rest.json`(나머지 3.9MB, 배경에서 합침)로 나뉜다. 합치면 전체 사전과 같다.
- 획수·부수: 유니코드 Unihan(`kTotalStrokes`, `kRSUnicode`, Unicode License V3, `source/LICENSE-unihan.txt`) → `node scripts/build-unihan.mjs [Unihan_IRGSources.txt]` 로 `dict/strokes.json` 생성
- 오프라인: `sw.js`(서비스 워커)가 앱·사전·글꼴을 저장한다. 처음 한 번 인터넷으로 열면 이후에는 인터넷 없이 열린다(필기·음성 인식은 인터넷 필요).
- 급수 한자(8급 50자·7급 100자·6급 150자, 한국어문회 기준): Hugging Face `rycont/hanja-grade` 데이터를 정리해 `dict/grades.json` 으로 사용
