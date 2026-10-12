// 토너먼트 로직 테스트: node tests/tournament.test.js
const assert = require('assert');
const { Tournament } = require('../js/tournament.js');

const items = Array.from({ length: 16 }, (_, i) => ({ text: `항목${i}` }));

for (const size of [8, 16]) {
  const t = new Tournament(items, size);
  assert.strictEqual(t.roundName, `${size}강`);
  assert.strictEqual(new Set(t.current).size, size);
  let count = 0;
  while (!t.isFinished) { t.pick(count % 2); count++; }
  assert.strictEqual(count, size - 1, '총 경기 수는 size - 1');
  assert.strictEqual(t.progress, 1);
  assert.ok(t.champion);
  assert.ok(t.runnerUp && t.runnerUp !== t.champion);
  assert.strictEqual(t.semifinalists.length, 2);
  assert.strictEqual(t.bracket.length, Math.log2(size));
}

// 되돌리기: 라운드 경계를 넘어서도 원상복구
const t = new Tournament(items, 8);
for (let i = 0; i < 4; i++) t.pick(0); // 8강 종료 → 4강
assert.strictEqual(t.roundName, '4강');
t.undo();
assert.strictEqual(t.roundName, '8강');
assert.strictEqual(t.matchIndex, 3);
assert.strictEqual(t.records.length, 3);
t.pick(1);
assert.strictEqual(t.roundName, '4강');
assert.strictEqual(t.current.length, 4);

console.log('✅ 모든 토너먼트 테스트 통과');
