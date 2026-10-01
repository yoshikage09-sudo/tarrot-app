(function(root){
'use strict';
function stepMomentum(state,elapsedMs){
  const min=state.min,max=state.max;
  let velocity=state.velocity*Math.exp(-.0042*Math.max(0,elapsedMs));
  if(Math.abs(velocity)<.02)velocity=0;
  let position=state.position+velocity*Math.max(0,elapsedMs);
  if(position<=min){position=min;velocity=0}
  if(position>=max){position=max;velocity=0}
  return {position,velocity,min,max};
}
function cutVisual(at,count){
  const ratio=Math.max(0,Math.min(1,at/count));
  return {ratio,shiftX:18+ratio*48,shiftY:-9-ratio*16,rotation:2+ratio*7};
}
function cutLayers(at,count){
  const cut=Math.max(0,Math.min(count,Math.trunc(at)));
  return Array.from({length:count},(_,depth)=>({depth,packet:depth<cut?'upper':'lower'}));
}
const api={stepMomentum,cutVisual,cutLayers};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.OracleMotion=api;
})(globalThis);
