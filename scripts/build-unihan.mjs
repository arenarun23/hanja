// 유니코드 Unihan 데이터베이스 → 한자별 획수·부수 (dict/strokes.json)
//   node scripts/build-unihan.mjs [Unihan_IRGSources.txt 경로]
//   - 경로를 주면: 그 파일에서 우리 한자(dict/chars.json + dict/grades.json)에 해당하는 kTotalStrokes·kRSUnicode 줄만 추려 source/unihan-subset.txt 로 저장
//   - 경로가 없으면: 이미 저장된 source/unihan-subset.txt 로 dict/strokes.json 만 다시 만든다 (원본을 다시 받을 필요 없음)
//   원본: https://www.unicode.org/Public/UCD/latest/ucd/Unihan.zip (Unihan_IRGSources.txt) — 라이선스: Unicode License V3 (source/LICENSE-unihan.txt)
// 결과 dict/strokes.json: { "學": [16, "子"], ... }  (획수, 부수 글자). 부수 이름(훈·음)은 앱이 dict/chars.json 에서 찾는다.
import fs from 'node:fs';

const chars = JSON.parse(fs.readFileSync('dict/chars.json', 'utf8'));
const grades = JSON.parse(fs.readFileSync('dict/grades.json', 'utf8'));
const want = new Set(Object.keys(chars));
for (const g in grades) for (const x of grades[g]) want.add(x.h);

const src = process.argv[2];
if (src) {
  const out = ['# Unihan_IRGSources.txt 에서 추린 일부(kTotalStrokes, kRSUnicode) — 우리 한자 ' + want.size + '자',
    '# Source: Unicode Unihan Database (Unicode Version 18.0.0). © Unicode, Inc. — Unicode License V3, see LICENSE-unihan.txt'];
  for (const line of fs.readFileSync(src, 'utf8').split('\n')) {
    const m = line.match(/^U\+([0-9A-F]+)\t(kTotalStrokes|kRSUnicode)\t(.+)$/);
    if (!m) continue;
    if (want.has(String.fromCodePoint(parseInt(m[1], 16)))) out.push(line);
  }
  fs.writeFileSync('source/unihan-subset.txt', out.join('\n') + '\n');
  console.log('subset 줄 수', out.length - 2);
}

const total = {}, rs = {};
for (const line of fs.readFileSync('source/unihan-subset.txt', 'utf8').split('\n')) {
  const m = line.match(/^U\+([0-9A-F]+)\t(kTotalStrokes|kRSUnicode)\t(.+)$/);
  if (!m) continue;
  const ch = String.fromCodePoint(parseInt(m[1], 16));
  const first = m[3].trim().split(/\s+/)[0];                     // 값이 여럿이면 첫 번째
  if (m[2] === 'kTotalStrokes') { const n = parseInt(first, 10); if (n > 0) total[ch] = n; }
  else { const r = first.match(/^(\d+)'*\.(-?\d+)$/); if (r) rs[ch] = +r[1]; }   // "39.13" → 부수 39
}
const radicalChar = (n) => String.fromCodePoint(0x2F00 + n - 1).normalize('NFKC');   // 강희 부수 번호 → 글자(예: 85 → 水)
const strokes = {};
for (const ch of want) {
  if (total[ch] == null) continue;
  strokes[ch] = rs[ch] ? [total[ch], radicalChar(rs[ch])] : [total[ch]];
}
fs.writeFileSync('dict/strokes.json', JSON.stringify(strokes));
console.log('strokes', Object.keys(strokes).length, '/', want.size, '자, 부수 있음', Object.values(strokes).filter((v) => v.length > 1).length);
