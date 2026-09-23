(function(){'use strict';
const action=document.getElementById('action'),result=document.getElementById('journalResult');if(!action||!result)return;
const wrap=document.createElement('div');wrap.className='reading-question-wrap';wrap.innerHTML='<label class="reading-question-label" for="readingQuestion">星の書庫に尋ねたいこと（任意）</label><textarea id="readingQuestion" class="reading-question" maxlength="500" placeholder="いま気になっていることを、自由に書いてください"></textarea><small class="reading-privacy">フェーズ1では外部AIへ送信せず、このブラウザー内のモックで読み取ります。</small>';action.before(wrap);
const css=document.createElement('link');css.rel='stylesheet';css.href='ai-reading.css?v=1';document.head.appendChild(css);
const sources=['reading/reading-data.js','reading/reading-contract.js','reading/prompt-builder.js','reading/mock-provider.js','reading/fallback-reading.js','reading/reading-service.js','reading/reading-client.js','reading/reading-controller.js','ai-reading-app.js'];
sources.reduce((ready,src)=>ready.then(()=>new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=`${src}?v=1`;script.onload=resolve;script.onerror=reject;document.body.appendChild(script)})),Promise.resolve()).catch(()=>{result.hidden=false;result.textContent='リーディング機能を準備できませんでした。ページを再読み込みしてください。'});
})();
