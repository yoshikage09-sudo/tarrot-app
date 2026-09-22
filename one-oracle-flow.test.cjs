const { test } = require('node:test');
const assert = require('node:assert/strict');
const { Oracle, shuffle, cut, cards } = require('./one-oracle-flow-core.js');
test('Fisher-Yates preserves cards and uses shrinking random ranges', () => {
  let calls = 0;
  const result = shuffle(cards, () => { calls++; return 0; });
  assert.equal(calls, 21);
  assert.deepEqual(result.map(c => c.id), [...cards.slice(1), cards[0]].map(c => c.id));
  assert.equal(new Set(result.map(c => c.id)).size, 22);
  assert.equal(cards[0].id, 0);
});
test('every cut rotates the actual deck without losing cards', () => {
  for (let i=1;i<22;i++) assert.deepEqual(cut(cards,i), [...cards.slice(i),...cards.slice(0,i)]);
  for (const n of [0,22,-1,1.5,NaN]) assert.throws(() => cut(cards,n));
});
test('selection may change until confirmation, then stays locked', () => {
  const game = new Oracle(() => 0);
  assert.throws(() => game.select(0));
  game.start();
  assert.throws(() => game.start());
  game.cut(5);
  game.select(2); game.select(21);
  assert.equal(game.confirm().id, 5);
  assert.throws(() => game.select(1));
  assert.throws(() => game.confirm());
  game.reset();
  assert.equal(game.phase,'idle');
  assert.equal(game.selected,null);
  game.start(); game.cut(1);
  assert.throws(() => game.confirm());
  assert.throws(() => game.select(22));
});
