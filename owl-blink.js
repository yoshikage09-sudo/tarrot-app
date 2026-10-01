(() => {
  'use strict';
  const frames=[...document.querySelectorAll('.owl-blink-frame')];
  if(!frames.length||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let timer=0;
  const blink=()=>{
    if(!document.hidden){
      frames.forEach(frame=>frame.classList.remove('is-blinking'));
      void frames[0].offsetWidth;
      frames.forEach(frame=>frame.classList.add('is-blinking'));
      setTimeout(()=>frames.forEach(frame=>frame.classList.remove('is-blinking')),260);
    }
    schedule();
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(blink,4300+Math.random()*4200);};
  document.getElementById('readingQuestion')?.addEventListener('focus',()=>setTimeout(blink,160));
  document.getElementById('action')?.addEventListener('click',()=>setTimeout(blink,120));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(blink,500);});
  schedule();
})();

