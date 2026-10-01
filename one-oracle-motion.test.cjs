const test=require('node:test');
const assert=require('node:assert/strict');
const Motion=require('./one-oracle-motion.js');

test('momentum keeps moving in the release direction while slowing down',()=>{
  const first=Motion.stepMomentum({position:300,velocity:1.2,min:0,max:900},16);
  const second=Motion.stepMomentum(first,16);
  assert.ok(first.position>300);
  assert.ok(first.velocity<1.2);
  assert.ok(second.position>first.position);
  assert.ok(second.velocity<first.velocity);
});

test('momentum stops at the scroll boundary',()=>{
  assert.deepEqual(Motion.stepMomentum({position:895,velocity:2,min:0,max:900},16),{position:900,velocity:0,min:0,max:900});
});

test('tiny release velocity settles immediately',()=>{
  assert.equal(Motion.stepMomentum({position:200,velocity:.01,min:0,max:900},16).velocity,0);
});

test('cut visual separation grows with the selected cut position',()=>{
  const shallow=Motion.cutVisual(1,22),middle=Motion.cutVisual(11,22),deep=Motion.cutVisual(21,22);
  assert.ok(shallow.shiftX<middle.shiftX);
  assert.ok(middle.shiftX<deep.shiftX);
  assert.equal(middle.ratio,.5);
});
