// source/hanja.txt (libhangul) → dict/{chars,words-core,words-rest}.json
// 낱말 사전은 둘로 나눈다: core(흔한 글자 위주, 앱이 처음 열릴 때 읽음) + rest(나머지, 배경에서 합침). 합치면 예전 words.json 과 똑같다.
import fs from 'node:fs';
const isHanja = (c) => /[㐀-鿿豈-﫿]/.test(c);
const chars = {}; // 한자 → ["훈 음", ...]
const words = {}; // 한글 → [한자어, ...]
for (const line of fs.readFileSync('source/hanja.txt', 'utf8').split('\n')) {
  if (!line || line.startsWith('#')) continue;
  const [k, h, m] = line.split(':');
  if (!k || !h) continue;
  const kc = [...k], hc = [...h];
  if (hc.length === 1 && isHanja(h)) {
    if (!m) continue;
    const arr = (chars[h] ||= []);
    for (const s of m.split(',').map((x) => x.trim()).filter(Boolean)) if (!arr.includes(s)) arr.push(s);
  } else if (kc.length === hc.length && hc.length <= 6 && hc.every(isHanja)) {
    const arr = (words[k] ||= []);
    if (!arr.includes(h)) arr.push(h);
  }
}
// 같은 소리의 한자어는 '흔한 글자(급수가 쉬운 글자)'가 많은 순으로 정렬 (예: 여자 → 女子가 餘資보다 먼저)
const LV = JSON.parse(fs.readFileSync('source/levels.json', 'utf8'));
const score = (w) => [...w].reduce((a, c) => a + (LV[c] ?? -1), 0) / [...w].length;
for (const k in words) words[k] = words[k].map((w, i) => [w, i]).sort((a, b) => score(b[0]) - score(a[0]) || a[1] - b[1]).map((x) => x[0]);
fs.writeFileSync('dict/chars.json', JSON.stringify(chars));
// 흔한 정도(score = 글자 급수 평균)가 CORE_SCORE 이상인 한자어만 core. 한자어가 score 내림차순이라 core 는 각 낱말의 '앞쪽'이 되어 합쳐도 순서가 유지된다.
const CORE_SCORE = 6;
const core = {}, rest = {};
for (const k in words) {
  for (const w of words[k]) ((score(w) >= CORE_SCORE ? core : rest)[k] ||= []).push(w);
}
fs.writeFileSync('dict/words-core.json', JSON.stringify(core));
fs.writeFileSync('dict/words-rest.json', JSON.stringify(rest));
console.log('chars', Object.keys(chars).length, 'words', Object.keys(words).length, '| core', Object.keys(core).length, 'rest', Object.keys(rest).length);
