(() => {
  'use strict';
  const owl=document.getElementById('owlPixelMotion');
  if(!owl||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  const timers=new Set();
  const later=(fn,ms)=>{const id=setTimeout(()=>{timers.delete(id);fn();},ms);timers.add(id);return id;};
  const replay=(name,duration)=>{
    owl.classList.remove(name);
    void owl.offsetWidth;
    owl.classList.add(name);
    later(()=>owl.classList.remove(name),duration);
  };
  const blink=()=>{
    if(!document.hidden)replay('is-blinking',220);
    scheduleBlink();
  };
  const earFlick=()=>{
    if(!document.hidden)replay('is-ear-flicking',950);
    scheduleEars();
  };
  const tilt=()=>{
    if(!document.hidden)replay('is-tilting',3350);
    scheduleTilt();
  };
  const scheduleBlink=()=>later(blink,4200+Math.random()*4300);
  const scheduleEars=()=>later(earFlick,9000+Math.random()*8500);
  const scheduleTilt=()=>later(tilt,15000+Math.random()*12000);
  document.addEventListener('visibilitychange',()=>{
    if(document.hidden)return;
    if(Math.random()>.45)later(blink,500+Math.random()*900);
  });
  document.getElementById('readingQuestion')?.addEventListener('focus',()=>later(blink,180));
  document.getElementById('action')?.addEventListener('click',()=>{
    later(blink,120);
    later(tilt,460);
  });
  document.getElementById('restart')?.addEventListener('click',()=>later(earFlick,240));
  scheduleBlink();scheduleEars();scheduleTilt();
})();

