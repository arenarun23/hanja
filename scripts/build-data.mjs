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
// 한자어 → 읽기 역방향 일부는 클라이언트에서 words를 훑어 만든다.
fs.writeFileSync('dict/chars.json', JSON.stringify(chars));
fs.writeFileSync('dict/words.json', JSON.stringify(words));
console.log('chars', Object.keys(chars).length, 'words', Object.keys(words).length);
