// source/hanja.txt (libhangul) → dict/{chars,words}.json
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
fs.writeFileSync('dict/words.json', JSON.stringify(words));
console.log('chars', Object.keys(chars).length, 'words', Object.keys(words).length);
