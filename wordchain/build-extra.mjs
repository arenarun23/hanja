// 보조 사전 생성: 한자 사전(dict/words.json)에서 아이들이 쓸 만한 흔한 2~3글자 낱말만 뽑아 wordchain/extra.txt 로 저장
import fs from 'node:fs';
const w = JSON.parse(fs.readFileSync(new URL('../dict/words.json', import.meta.url)));
const lv = JSON.parse(fs.readFileSync(new URL('../dict/levels.json', import.meta.url)));
const out = [];
for (const [k, v] of Object.entries(w)) {
  if (!/^[가-힣]{2,3}$/.test(k)) continue;
  const min = Math.max(...v.map(h => Math.min(...[...h].map(c => lv[c] ?? -1))));
  if (min >= 5) out.push(min >= 6.5 ? '+' + k : k);   // '+' = 아주 흔한 말(말랑이가 직접 낼 수 있음)
}
fs.writeFileSync(new URL('./extra.txt', import.meta.url), out.join('\n'));
console.log('extra.txt', out.length);
