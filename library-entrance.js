'use strict';
const shell=document.querySelector('#shell'),owl=document.querySelector('#owl'),start=document.querySelector('#start'),still=document.querySelector('#still'),menu=document.querySelector('#menu'),statusLine=document.querySelector('#greetingStatus');
let busy=false,blinkTimer,idleTimer;let epoch=0;
const reduced=matchMedia('(prefers-reduced-motion:reduce)');
try{still.checked=localStorage.getItem('astral-reduced-motion')==='true'||reduced.matches}catch{still.checked=reduced.matches}
function motion(){document.body.classList.toggle('still',still.checked)}motion();still.addEventListener('change',()=>{motion();try{localStorage.setItem('astral-reduced-motion',String(still.checked))}catch{}});
const wait=ms=>new Promise(r=>setTimeout(r,ms));
async function blink(){owl.classList.add('blink');await wait(160);owl.classList.remove('blink')}
function scheduleBlink(){clearTimeout(blinkTimer);blinkTimer=setTimeout(async()=>{if(!busy&&!document.hidden&&!still.checked&&!document.querySelector('#home').hidden)await blink();scheduleBlink()},5000+Math.random()*3000)}
function route(focus=true){const key=['home','choose','records','cards'].includes(location.hash.slice(1))?location.hash.slice(1):'home';epoch++;busy=false;start.disabled=false;shell.classList.remove('unlock');owl.classList.remove('respond','idle-tilt','ear-twitch');for(const name of ['home','choose','records','cards'])document.getElementById(name).hidden=name!==key;if(menu.open)menu.close();if(focus&&key!=='home')document.getElementById(key+'Title').focus({preventScroll:true});window.scrollTo({top:0,behavior:'instant'});statusLine.textContent='星の書庫へ、ようこそ。'}
window.addEventListener('hashchange',()=>route());route(false);
start.addEventListener('click',async()=>{if(busy)return;busy=true;owl.classList.remove('idle-tilt','ear-twitch');start.disabled=true;const ticket=++epoch;const active=()=>ticket===epoch;
 if(still.checked){location.hash='choose';return;}
 await wait(200);if(!active())return;owl.classList.add('respond');statusLine.textContent='星の光が、あなたを迎えます。';await wait(150);if(!active())return;await blink();await wait(700);if(!active())return;shell.classList.add('unlock');statusLine.textContent='星の書庫が、ひらきます。';await wait(2200);if(active())location.hash='choose';
});
document.querySelector('#menuOpen').addEventListener('click',()=>menu.showModal());document.querySelector('#menuClose').addEventListener('click',()=>menu.close());menu.querySelectorAll('a').forEach(a=>a.addEventListener('click',()=>menu.close()));
function startBreathing(){
 const torso=document.querySelector('.torso'),source=torso.querySelector('img');
 const canvas=torso.querySelector('canvas'),ctx=canvas.getContext('2d');
 const W=480,H=852,top=H*.405,bottom=H*.84,step=3;
 let previous=0,phase=0;
 const weight=y=>{const t=Math.max(0,Math.min(1,(y-top)/(bottom-top)));return Math.sin(Math.PI*t)**2;};
 function frame(now){
  requestAnimationFrame(frame);
  if(now-previous<33)return;
  const dt=previous?Math.min(now-previous,80):0;previous=now;
  if(document.hidden||document.querySelector('#home').hidden)return;
  if(!still.checked)phase+=dt;
  const amount=still.checked?0:14*(.5-.5*Math.cos(phase/4800*Math.PI*2));
  ctx.clearRect(0,0,W,H);
  // Draw narrow horizontal strips; shared destination boundaries prevent cracks.
  for(let y=0;y<H;y+=step){
   const end=Math.min(y+step,H),dy=y-amount*weight(y),de=end-amount*weight(end);
   ctx.drawImage(source,0,y,W,end-y,0,dy,W,de-dy+.35);
  }
 }
 torso.classList.add('ready');requestAnimationFrame(frame);
}

Promise.all([...document.images].map(i=>i.decode())).then(()=>{startBreathing();scheduleBlink()}).catch(()=>{scheduleBlink()});


const lightPoints=[
[15,15,48,4.2],[80,2,52,5.3],[84,26,60,4.9],[97,46,58,3.7],[18,30,34,5.8],[36,31,28,4.4],[2,75,48,5.2],[94,92,95,6.5],
[50,66,110,6.5],[51,60,28,5.4],[21,67,28,6.2],[76,70,30,5.7],[17,73,28,6.9],[83,73,30,7.3],[52,77,24,4.9],[36,69,14,4.6],[64,65,14,5.7],[27,62,14,4.1],[70,61,14,5.2],[69,7,10,6.1],[57,4,10,4.9]];
const field=document.querySelector('.living-lights');
lightPoints.forEach(([x,y,size,duration],i)=>{const light=document.createElement('i');light.className=i<8?'lamp-light':i===8?'core-light':i>=19?'window-light':'star-light';light.style.cssText='--x:'+x+'%;--y:'+y+'%;--size:'+size+'px;--duration:'+duration+'s;--delay:'+(-i*.67)+'s';field.append(light)});
let idleCount=0;
function scheduleIdle(){
 clearTimeout(idleTimer);
 idleTimer=setTimeout(async()=>{
  if(!busy&&!document.hidden&&!still.checked&&!menu.open&&!document.querySelector('#home').hidden){
   const ticket=epoch,gesture=idleCount++%2===0?'idle-tilt':'ear-twitch';
   owl.classList.add(gesture);
   await wait(gesture==='idle-tilt'?3900:1100);
   if(ticket===epoch)owl.classList.remove(gesture);
  }
  scheduleIdle();
 },6000+Math.random()*2500);
}
scheduleIdle();
document.addEventListener('visibilitychange',()=>{if(document.hidden){clearTimeout(idleTimer);owl.classList.remove('idle-tilt','ear-twitch')}else scheduleIdle()});
still.addEventListener('change',()=>{owl.classList.remove('idle-tilt','ear-twitch')});
