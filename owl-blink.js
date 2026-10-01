(() => {
  'use strict';
  const frame=document.getElementById('owlBlinkFrame');
  if(!frame||matchMedia('(prefers-reduced-motion: reduce)').matches)return;
  let timer=0;
  const blink=()=>{
    if(!document.hidden){
      frame.classList.remove('is-blinking');
      void frame.offsetWidth;
      frame.classList.add('is-blinking');
      setTimeout(()=>frame.classList.remove('is-blinking'),260);
    }
    schedule();
  };
  const schedule=()=>{clearTimeout(timer);timer=setTimeout(blink,4300+Math.random()*4200);};
  document.getElementById('readingQuestion')?.addEventListener('focus',()=>setTimeout(blink,160));
  document.getElementById('action')?.addEventListener('click',()=>setTimeout(blink,120));
  document.addEventListener('visibilitychange',()=>{if(!document.hidden)setTimeout(blink,500);});
  schedule();
})();

