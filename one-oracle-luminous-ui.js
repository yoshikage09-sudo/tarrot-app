/* Presentation orchestrator: card identity always comes from OracleCore. */
(() => {
  'use strict';
  const $=id=>document.getElementById(id);
  const scene=$('scene'), deck=$('deck'), action=$('action'), orbit=$('orbit');
  const game=new OracleCore.Oracle();
  const reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
  let stage='idle', busy=false;
  const room=scene.querySelector('.room');
  const dust=$('stardust');
  for(let i=0;i<24;i++){
    const mote=document.createElement('i');
    const angle=i*Math.PI*2/24;
    mote.style.cssText='--dx:'+Math.cos(angle)*(85+i%4*25)+'px;--dy:'+Math.sin(angle)*(90+i%5*22)+'px;--delay:'+i%6*.055+'s;--size:'+(i%4===0?4:2)+'px';
    dust.append(mote);
  }
  let threadFrame=0;
  function updateThread(){
    threadFrame=0;
    if(stage!=='select'||game.selected===null)return;
    const box=room.getBoundingClientRect(), core=scene.querySelector('.core').getBoundingClientRect();
    const card=orbit.children[game.selected].getBoundingClientRect();
    const x1=core.x+core.width/2-box.x,y1=core.y+core.height/2-box.y;
    const x2=card.x+card.width/2-box.x,y2=card.y-box.y+10;
    const visible=x2>=0&&x2<=box.width;
    $('goldThread').style.opacity=visible?'1':'0';
    $('threadPath').setAttribute('d','M '+x1+' '+y1+' Q '+(x1+x2)/2+' '+(Math.min(y1,y2)-48)+' '+x2+' '+y2);
    $('threadTip').setAttribute('cx',x2);$('threadTip').setAttribute('cy',y2);
  }
  function scheduleThread(){if(!threadFrame)threadFrame=requestAnimationFrame(updateThread);}
  $('orbitWindow').addEventListener('scroll',scheduleThread,{passive:true});
  window.addEventListener('resize',scheduleThread,{passive:true});
  orbit.addEventListener('transitionend',scheduleThread);
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
    scene.classList.add('attuned');scheduleThread();
    $('orbitWindow').scrollTo({left:selected.offsetLeft-($('orbitWindow').clientWidth-44)/2,behavior:reduced?'instant':'smooth'});
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
    $('orbitWindow').scrollLeft=(1100-$('orbitWindow').clientWidth)/2;
  }
  async function run(){
    if(busy)return;
    busy=true;action.disabled=true;
    try {
      if(stage==='idle'){
        game.start();stage='shuffle';ritual('shuffle');
        announce('02 / カードを混ぜる','カードの束を、静かに重ねています…');
        deck.classList.add('shuffling');await wait(1660);deck.classList.remove('shuffling');
        stage='cut';ritual('cut');$('cutControls').hidden=false;deck.classList.add('cutting');
        announce('03 / あなたの位置でカット','直感で、カードを分ける位置を選んでください。');
        setAction('ここでカットする');$('cutPosition').focus();
      } else if(stage==='cut'){
        game.cut(Number($('cutPosition').value));stage='unlock';$('cutControls').hidden=true;
        deck.classList.remove('cutting');await wait(350);deck.hidden=true;
        announce('04 / 単星の星図を解放','星図がひらき、22枚のカードが軌道に並びます。');
        ritual('unlock');scene.classList.add('unlocked');await wait(1250);
        deal();
        const windowBox=$('orbitWindow').getBoundingClientRect();
        for(const button of orbit.children){
          button.disabled=true;
          const x=parseFloat(button.style.getPropertyValue('--x'));
          const y=parseFloat(button.style.getPropertyValue('--y'));
          button.style.setProperty('--launch-x',(windowBox.width/2+$('orbitWindow').scrollLeft-x-22)+'px');
          button.style.setProperty('--launch-y',(-y+12)+'px');
        }
        scene.classList.add('dealing');await wait(1400);scene.classList.remove('dealing');
        for(const button of orbit.children)button.disabled=false;
        stage='select';ritual('select');$('selectionControls').hidden=false;
        announce('05 / 一枚を選ぶ','惹かれるカードに触れてください。選び直せます。');
        setAction('カードを選んでください',true);orbit.children[10].focus({preventScroll:true});
      } else if(stage==='select'){
        const card=game.confirm();stage='reveal';ritual('gather');scene.classList.remove('attuned');$('goldThread').style.opacity='0';$('selectionControls').hidden=true;
        announce('06 / 記録をひらく','あなたの一枚が、星核のもとへ…');
        const chosen=orbit.children[game.selected],from=chosen.getBoundingClientRect();
        const reveal=$('revealCard');reveal.hidden=false;
        reveal.setAttribute('aria-hidden','true');
        $('cardNumber').textContent=String(card.id).padStart(2,'0');$('cardName').textContent=card.name;
        const to=reveal.getBoundingClientRect();
        chosen.classList.add('chosen-hidden');
        [...orbit.children].forEach(el=>el.disabled=true);
        if(!reduced)await reveal.animate([
          {transform:`translate(${from.left+from.width/2-to.left-to.width/2}px,${from.top+from.height/2-to.top-to.height/2}px) scale(.5)`},
          {transform:'translate(0,0) scale(1)'}
        ],{duration:850,easing:'cubic-bezier(.22,.61,.36,1)'}).finished;
        // The requested pause starts after the movement has completed.
        ritual('hush');await wait(400);ritual('opening');reveal.classList.add('flipped');await wait(700);
        reveal.removeAttribute('aria-hidden');
        scene.classList.remove('unlocked');void scene.offsetWidth;scene.classList.add('playing','cleared');
        await wait(2900);stage='result';ritual('result');
        announce('07 / あなたの一枚',`${card.name} — 星の書庫から、一枚の記録が届きました。`);
        action.hidden=true;$('restart').hidden=false;$('restart').focus();
      }
    } finally {busy=false;}
  }
  $('cutPosition').addEventListener('input',()=>{$('cutValue').value=`${$('cutPosition').value} / 22`;});
  $('previous').addEventListener('click',()=>choose(game.selected===null?0:(game.selected+21)%22));
  $('next').addEventListener('click',()=>choose(game.selected===null?0:(game.selected+1)%22));
  action.addEventListener('click',run);
  $('restart').addEventListener('click',()=>{
    if(busy)return;
    game.reset();stage='idle';ritual('idle');scene.classList.remove('attuned');$('goldThread').style.opacity='0';scene.classList.remove('playing','cleared','unlocked','dealing');
    deck.hidden=false;deck.className='deck';orbit.replaceChildren();
    for(const id of ['orbitWindow','cutControls','selectionControls','revealCard','restart'])$(id).hidden=true;
    $('revealCard').classList.remove('flipped');$('cutPosition').value=11;$('cutValue').value='11 / 22';
    action.hidden=false;setAction('カードを混ぜる');
    announce('01 / 問いを心に','心が整ったら、カードを混ぜてください。');action.focus();
  });
})();
