const test=require('node:test');const assert=require('node:assert/strict');const {cards,shuffle,cut,Oracle}=require('./one-oracle-flow-core.js');
test('fisher-yates keeps every card',()=>{const shuffled=shuffle(cards,()=>0);assert.equal(shuffled.length,22);assert.deepEqual(new Set(shuffled.map(c=>c.id)),new Set(cards.map(c=>c.id)))});
test('cut really reorders deck',()=>assert.deepEqual(cut([1,2,3,4],2),[3,4,1,2]));
test('confirmed card exposes stable upright metadata without extra random',()=>{let calls=0;const oracle=new Oracle(()=>{calls++;return .5});oracle.start();oracle.cut(11);oracle.select(0);const before=calls,card=oracle.confirm();assert.match(card.key,/^major-\d{2}$/);assert.equal(card.orientation,'upright');assert.equal(calls,before)});
