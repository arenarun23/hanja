# 한자 찾기
필기/음성으로 낱말을 입력하면 한자와 훈·음, 같은 글자가 쓰인 말을 보여 주는 정적 웹앱 (서버·API 키 불필요).
- 필기 인식: 브라우저에서 구글 Input Tools 필기 엔진 직접 호출 (비공식)
- 음성 인식: 브라우저 Web Speech API (크롬/엣지/사파리)
- 한자 사전: libhangul `hanja.txt` (BSD-3, `source/LICENSE-hanja-data.txt`) → `npm run build:data` 로 `dict/*.json` 생성
