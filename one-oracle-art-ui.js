/* Presentation orchestrator: card identity always comes from OracleCore. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const scene=$('scene'), deck=$('deck'), action=$('action'), orbit=$('orbit');
  const game=new OracleCore.Oracle();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  deck.replaceChildren(...Array.from({length:22},(_,depth)=>{
    const layer=document.createElement('i');
    layer.style.setProperty('--depth',depth);
    layer.setAttribute('aria-hidden','true');
    return layer;
  }));
  deck.classList.add('layered');
  const shuffleAdvance=document.createElement('button');
  shuffleAdvance.id='shuffleAdvance';
  shuffleAdvance.type='button';
  shuffleAdvance.className='secondary-button shuffle-advance';
  shuffleAdvance.textContent='この並びでカットへ進む';
  shuffleAdvance.hidden=true;
  action.after(shuffleAdvance);
  let stage='idle', busy=false;
  const dust=$('stardust');
  for(let i=0;i<32;i++){
    const mote=document.createElement('i');
    const angle=i*Math.PI*2/32;
    mote.className=i%4===0?'star-flare':'';
    mote.style.cssText='--dx:'+Math.cos(angle)*(105+i%4*25)+'px;--dy:'+Math.sin(angle)*(125+i%5*24)+'px;--delay:'+i%8*.085+'s;--size:'+(i%4===0?4:2)+'px';
    dust.append(mote);
  }
  function ritual(state){scene.dataset.ritual=state;}
  ritual('idle');
  const wait=ms=>new Promise(resolve=>setTimeout(resolve,reduced?0:ms));
  function announce(step,message){$('step').textContent=step;$('status').textContent=message;}
  function setAction(text,disabled=false){action.textContent=text;action.disabled=disabled;}
  function choose(index,focus=false){
    if(stage!=='select'||busy)return;
    game.select(index);
    [...orbit.children].forEach((el,i)=>el.setAttribute('aria-pressed',String(i===index)));
    const selected=orbit.children[index];
    scene.classList.add('attuned');
    $('orbitWindow').scrollTo({left:selected.offsetLeft-($('orbitWindow').clientWidth-selected.offsetWidth)/2,behavior:reduced?'instant':'smooth'});
    if(focus)selected.focus({preventScroll:true});
    $('selectionLabel').textContent=`${index+1} / 22 枚目を選択中`;
    setAction('このカードに決める');
  }
  function deal(){
    orbit.replaceChildren();
    game.deck.forEach((_,index)=>{
      const button=document.createElement('button');
      const t=(index-10.5)/10.5;
      button.type='button';button.className='orbit-card';
      button.style.cssText=`--x:${14+index*49}px;--y:${43+38*(1-t*t)}px;--r:${-t*15}deg;--delay:${index*18}ms`;
      button.setAttribute('aria-label',`${index+1}枚目の伏せたカード`);
      button.setAttribute('aria-pressed','false');
      button.addEventListener('click',()=>choose(index));
      button.addEventListener('keydown',event=>{
        if(['ArrowLeft','ArrowRight','Home','End'].includes(event.key)){
          event.preventDefault();
          choose(event.key==='Home'?0:event.key==='End'?21:(index+(event.key==='ArrowRight'?1:21))%22,true);
        }
      });
      orbit.append(button);
    });
    $('orbitWindow').hidden=false;
    const middle=orbit.children[10];
    $('orbitWindow').scrollLeft=middle.offsetLeft-($('orbitWindow').clientWidth-middle.offsetWidth)/2;
  }
  const rail=$('orbitWindow');
  let drag=null,ignoreClick=false,momentumFrame=0;
  function stopMomentum(){if(momentumFrame)cancelAnimationFrame(momentumFrame);momentumFrame=0;}
  function snapNearest(){
    rail.style.scrollSnapType='';
    if(!orbit.children.length)return;
    const center=rail.scrollLeft+rail.clientWidth/2;
    let nearest=orbit.children[0],distance=Infinity;
    for(const card of orbit.children){const next=Math.abs(card.offsetLeft+card.offsetWidth/2-center);if(next<distance){nearest=card;distance=next;}}
    rail.scrollTo({left:nearest.offsetLeft-(rail.clientWidth-nearest.offsetWidth)/2,behavior:reduced?'instant':'smooth'});
  }
  function coast(velocity){
    let state={position:rail.scrollLeft,velocity,min:0,max:Math.max(0,rail.scrollWidth-rail.clientWidth)},previous=performance.now();
    function frame(now){
      state=OracleMotion.stepMomentum(state,Math.min(32,now-previous));previous=now;rail.scrollLeft=state.position;
      if(state.velocity!==0)momentumFrame=requestAnimationFrame(frame);else{momentumFrame=0;snapNearest();}
    }
    momentumFrame=requestAnimationFrame(frame);
  }
  rail.addEventListener('pointerdown',e=>{
    if(!e.isPrimary||(e.pointerType==='mouse'&&e.button!==0))return;
    stopMomentum();drag={pointerId:e.pointerId,startX:e.clientX,lastX:e.clientX,lastTime:performance.now(),velocity:0,moved:false};ignoreClick=false;
  });
  rail.addEventListener('pointermove',e=>{
    if(!drag||e.pointerId!==drag.pointerId)return;
    const now=performance.now(),dx=e.clientX-drag.lastX,dt=Math.max(1,now-drag.lastTime);
    if(Math.abs(e.clientX-drag.startX)>6&&!drag.moved){drag.moved=true;rail.setPointerCapture(e.pointerId);rail.style.scrollSnapType='none';}
    if(drag.moved){e.preventDefault();rail.scrollLeft-=dx;drag.velocity=-dx/dt;}
    drag.lastX=e.clientX;drag.lastTime=now;
  });
  function endDrag(e){
    if(!drag||e.pointerId!==drag.pointerId)return;
    const moved=drag.moved,velocity=drag.velocity;ignoreClick=moved;drag=null;
    if(moved&&!reduced&&Math.abs(velocity)>=.02)coast(velocity);else snapNearest();
  }
  rail.addEventListener('pointerup',endDrag);
  rail.addEventListener('pointercancel',endDrag);
  rail.addEventListener('click',e=>{if(ignoreClick){e.preventDefault();e.stopPropagation();ignoreClick=false;}},true);
  function refreshDeckDepths(){
    [...deck.children].forEach((layer,depth)=>layer.style.setProperty('--depth',depth));
    updateCutVisual();
  }
  async function animateVisualShuffle(){
    deck.classList.add('reshuffling');
    for(let pass=0;pass<5;pass++){
      const top=deck.firstElementChild;
      if(!reduced){
        const base=getComputedStyle(top).transform;
        await top.animate([
          {transform:base},
          {transform:'translate(72px,-46px) rotate(10deg)',offset:.45},
          {transform:'translate(9px,15px) rotate(-2deg)'}
        ],{duration:240,easing:'cubic-bezier(.22,.61,.36,1)'}).finished;
      }
      deck.append(top);
      refreshDeckDepths();
    }
    deck.classList.remove('reshuffling');
  }
  async function shuffleOnce(first){
    if(first)game.start();else game.reshuffle();
    stage='shuffle';ritual('shuffle');shuffleAdvance.hidden=true;
    announce('02 / カードを混ぜる',first?'トップから順に、カードを混ぜています…':'もう一度、カードの順番を混ぜています…');
    await animateVisualShuffle();
    stage='shuffle-ready';
    announce('02 / カードを混ぜる','もう一度混ぜるか、この並びでカットへ進んでください。');
    setAction('もう一度混ぜる');shuffleAdvance.hidden=false;shuffleAdvance.disabled=false;
  }
  async function advanceToCut(){
    if(busy||stage!=='shuffle-ready')return;
    busy=true;action.disabled=true;shuffleAdvance.disabled=true;
    try{
      stage='cut';ritual('cut');shuffleAdvance.hidden=true;$('cutControls').hidden=false;deck.classList.add('cutting');updateCutVisual();
      announce('03 / あなたの位置でカット','直感で、カードを分ける位置を選んでください。');
      setAction('ここでカットする');$('cutPosition').focus();
    }finally{busy=false;}
  }
  async function run(){
    if(busy)return;
    busy=true;action.disabled=true;
    try {
      if(stage==='idle'){
        await shuffleOnce(true);
      } else if(stage==='shuffle-ready'){
        await shuffleOnce(false);
      } else if(stage==='cut'){
        game.cut(Number($('cutPosition').value));stage='unlock';$('cutControls').hidden=true;
        deck.classList.remove('cutting');await wait(350);deck.hidden=true;
        announce('04 / 単星の星図を解放','星図がひらき、22枚のカードが軌道に並びます。');
        ritual('unlock');scene.classList.add('unlocked');await wait(1250);
        deal();
        const windowBox=$('orbitWindow').getBoundingClientRect();
        for(const button of orbit.children){
          button.disabled=true;
          const x=button.offsetLeft;
          const y=button.offsetTop;
          button.style.setProperty('--launch-x',(windowBox.width/2+$('orbitWindow').scrollLeft-x-button.offsetWidth/2)+'px');
          button.style.setProperty('--launch-y',(-y+12)+'px');
        }
        scene.classList.add('dealing');await wait(1400);scene.classList.remove('dealing');
        for(const button of orbit.children)button.disabled=false;
        stage='select';ritual('select');$('selectionControls').hidden=false;
        announce('05 / 一枚を選ぶ','惹かれるカードに触れてください。選び直せます。');
        setAction('カードを選んでください',true);orbit.children[10].focus({preventScroll:true});
      } else if(stage==='select'){
        const card=game.confirm();stage='reveal';ritual('gather');scene.classList.remove('attuned');$('selectionControls').hidden=true;
        announce('06 / 記録をひらく','あなたの一枚が、星核のもとへ…');
        const chosen=orbit.children[game.selected],from=chosen.getBoundingClientRect();
        const reveal=$('revealCard');reveal.hidden=false;
        reveal.setAttribute('aria-hidden','true');
        $('cardNumber').textContent=String(card.id).padStart(2,'0');$('cardName').textContent=card.name;
        const to=reveal.getBoundingClientRect();
        chosen.classList.add('chosen-hidden');
        [...orbit.children].forEach(el=>el.disabled=true);
        if(!reduced)await reveal.animate([
          {transform:`translate(${from.left+from.width/2-to.left-to.width/2}px,${from.top+from.height/2-to.top-to.height/2}px) scale(${from.width/to.width})`},
          {transform:'translate(0,0) scale(1)'}
        ],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)'}).finished;
        // The requested pause starts after the movement has completed.
        ritual('hush');await wait(400);ritual('opening');reveal.classList.add('flipped');await wait(700);
        reveal.removeAttribute('aria-hidden');
        scene.classList.remove('unlocked');void scene.offsetWidth;scene.classList.add('playing','cleared');
        await wait(2900);stage='result';ritual('result');
        announce('07 / あなたの一枚',`${card.name} — 星の書庫から、一枚の記録が届きました。`);
        action.hidden=true;$('restart').hidden=false;document.dispatchEvent(new CustomEvent('oracle:result',{detail:{cardId:card.id}}));
      }
    } finally {busy=false;}
  }
  function updateCutVisual(){
    const value=Number($('cutPosition').value),layers=OracleMotion.cutLayers(value,22);
    $('cutValue').value=`${value} / 22`;
    [...deck.children].forEach((layer,index)=>{
      const upper=layers[index].packet==='upper';
      layer.classList.toggle('cut-upper',upper);
      layer.classList.toggle('cut-lower',!upper);
      layer.classList.toggle('cut-edge-upper',index===value-1);
      layer.classList.toggle('cut-edge-lower',index===value);
    });
  }
  $('cutPosition').addEventListener('input',updateCutVisual);
  updateCutVisual();
  $('previous').addEventListener('click',()=>choose(game.selected===null?0:(game.selected+21)%22));
  $('next').addEventListener('click',()=>choose(game.selected===null?0:(game.selected+1)%22));
  action.addEventListener('click',run);
  shuffleAdvance.addEventListener('click',advanceToCut);
  $('restart').addEventListener('click',()=>{
    document.dispatchEvent(new CustomEvent('oracle:reset'));
    if(busy)return;
    const previousResult=$('journalResult');
    if(previousResult){previousResult.replaceChildren();previousResult.hidden=true;}
    game.reset();stage='idle';ritual('idle');scene.classList.remove('attuned');scene.classList.remove('playing','cleared','unlocked','dealing');
    deck.hidden=false;deck.className='deck layered';shuffleAdvance.hidden=true;shuffleAdvance.disabled=false;orbit.replaceChildren();refreshDeckDepths();
    for(const id of ['orbitWindow','cutControls','selectionControls','revealCard','restart'])$(id).hidden=true;
    $('revealCard').classList.remove('flipped');$('cutPosition').value=11;$('cutValue').value='11 / 22';
    action.hidden=false;setAction('カードを混ぜる');
    announce('01 / 問いを心に','心が整ったら、カードを混ぜてください。');action.focus();
  });
})();


