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

test('moving the cut by one step transfers exactly one card layer',()=>{
  const eleven=Motion.cutLayers(11,22),twelve=Motion.cutLayers(12,22);
  assert.equal(eleven.filter(layer=>layer.packet==='upper').length,11);
  assert.equal(twelve.filter(layer=>layer.packet==='upper').length,12);
  assert.equal(eleven.filter((layer,index)=>layer.packet!==twelve[index].packet).length,1);
  assert.equal(eleven[11].packet,'lower');
  assert.equal(twelve[11].packet,'upper');
});

test('cut layers keep stable top-to-bottom depth indexes',()=>{
  const layers=Motion.cutLayers(3,22);
  assert.deepEqual(layers.map(layer=>layer.depth),Array.from({length:22},(_,index)=>index));
});
