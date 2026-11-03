// 보조 사전 생성 → extra.txt
//  ① source/ko-nouns.txt : hunspell-ko(MPL/GPL/LGPL, source/LICENSE-hunspell-ko.txt) 명사 어간 (2~6글자)
//     2~3글자는 '+' 를 붙여 말랑이가 직접 낼 수 있는 말로, 그 밖에는 아이가 말한 낱말 확인용으로만 사용
//  ② ../dict/words.json : 한자어 중 흔한 2~3글자 (한자 사전 기반)
import fs from 'node:fs';
const rd = (p) => fs.readFileSync(new URL(p, import.meta.url), 'utf8');
const words = new Map();   // 낱말 → 흔한 말(true) 여부
for (const w of rd('./source/ko-nouns.txt').split('\n')) if (w) words.set(w, [...w].length <= 3);
const wj = JSON.parse(rd('../dict/words.json')), lv = JSON.parse(rd('../dict/levels.json'));
for (const [k, v] of Object.entries(wj)) {
  if (!/^[가-힣]{2,3}$/.test(k) || words.has(k)) continue;
  const min = Math.max(...v.map(h => Math.min(...[...h].map(c => lv[c] ?? -1))));
  if (min >= 5) words.set(k, false);
}
fs.writeFileSync(new URL('./extra.txt', import.meta.url), [...words].map(([w, c]) => (c ? '+' : '') + w).join('\n'));
console.log('extra.txt', words.size, '(흔한 말', [...words.values()].filter(Boolean).length + ')');
