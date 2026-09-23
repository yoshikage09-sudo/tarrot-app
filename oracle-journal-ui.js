(function(){
'use strict';
const J=OracleJournal,store=J.createJournal({getItem:k=>localStorage.getItem(k),setItem:(k,v)=>localStorage.setItem(k,v)});
const $=id=>document.getElementById(id);
function el(tag,className,text){const n=document.createElement(tag);if(className)n.className=className;if(text!==undefined)n.textContent=text;return n}
function options(select,all=false){if(all)select.add(new Option('すべてのテーマ','all'));J.themes.forEach(t=>select.add(new Option(t,t)))}
function date(value){return new Date(value).toLocaleString('ja-JP',{year:'numeric',month:'long',day:'numeric',hour:'2-digit',minute:'2-digit'})}
function link(text,href){const a=el('a','journal-link',text);a.href=href;return a}
function messageBlock(card){const box=el('div','journal-message');box.append(el('p','journal-keyword',card.title),el('p','journal-copy',card.message),el('h4',null,'今日の小さな一歩'),el('p','journal-copy',card.action));return box}
function readingOf(record){return record.reading||OracleMessages[record.cardId]}
const privacy='記録はこのブラウザー内に保存されます。別の端末やブラウザーには共有されず、サイトデータを削除すると消えます。';
let current=null;
const result=$('journalResult');
if(result){
 const title=el('h2',null);title.tabIndex=-1;const body=el('div');const form=el('form','journal-form');
 const label=el('label',null,'テーマ（後から変更できます）'),theme=el('select');theme.id='journalTheme';label.htmlFor=theme.id;options(theme);
 const save=el('button','journal-button','記録に保存する');save.type='submit';save.id='journalSave';
 const status=el('p','journal-status');status.setAttribute('role','status');
 const savedLink=link('保存した記録を見る','library-entrance.html#records');savedLink.hidden=true;
 form.append(label,theme,save,status,savedLink);result.append(title,body,form,el('p','journal-privacy',privacy));
 document.addEventListener('oracle:result',event=>{const card=OracleMessages[event.detail.cardId];if(!card)return;current={id:crypto.randomUUID(),createdAt:new Date().toISOString(),cardId:card.id,theme:'未分類',memo:'',reading:{title:card.title,message:card.message,action:card.action}};title.textContent=card.name+'からのメッセージ';body.replaceChildren(messageBlock(card));theme.value='未分類';theme.disabled=false;save.disabled=false;save.textContent='記録に保存する';status.textContent='';savedLink.hidden=true;result.hidden=false;title.focus({preventScroll:true})});
 document.addEventListener('oracle:reset',()=>{current=null;result.hidden=true});
 form.addEventListener('submit',event=>{event.preventDefault();if(!current||save.disabled)return;save.disabled=true;try{const saved=store.save({...current,theme:theme.value});theme.value=saved.theme;theme.disabled=true;save.textContent='保存しました';status.textContent='このブラウザーに保存しました。メモは記録画面で書き足せます。';savedLink.hidden=false}catch(e){status.textContent=e.message;save.disabled=false;save.textContent='もう一度保存する'}});
}
const view=$('journalView');let filter='all',detailId=null;
function list(){
 if(!view)return;view.replaceChildren();detailId=null;
 const note=el('p','journal-privacy',privacy);const label=el('label','journal-filter-label','テーマで絞り込む'),select=el('select','journal-filter');select.id='recordFilter';label.htmlFor=select.id;options(select,true);select.value=filter;select.addEventListener('change',()=>{filter=select.value;renderRows()});
 const count=el('p','journal-count'),rows=el('div','journal-list');view.append(note,label,select,count,rows);
 function renderRows(){rows.replaceChildren();let records;try{records=store.list()}catch(e){count.textContent='';rows.append(el('p','journal-status',e.message));const retry=el('button','journal-button','読み込みを再試行');retry.onclick=renderRows;rows.append(retry);return}
 const visible=records.filter(r=>filter==='all'||r.theme===filter);count.textContent=visible.length+'件の記録';
 if(!visible.length){const empty=el('div','journal-empty');empty.append(el('p',null,records.length?'このテーマの記録はまだありません。':'まだ記録はありません。占いの結果画面から保存できます。'),link('占いを選ぶ','#choose'));rows.append(empty);return}
 visible.forEach(record=>{const card=OracleMessages[record.cardId],button=el('button','journal-entry');button.type='button';button.append(el('span','journal-meta',date(record.createdAt)+' · ワンオラクル'),el('strong',null,card.name+' · 正位置'),el('span','journal-theme',record.theme),el('span','journal-preview',record.memo||readingOf(record).title));button.setAttribute('aria-label',card.name+'の記録を開く '+date(record.createdAt));button.onclick=()=>detail(record.id);rows.append(button)})
 }
 renderRows();
}
function detail(id){
 let record;try{record=store.list().find(r=>r.id===id)}catch(e){view.replaceChildren(el('p','journal-status',e.message));return}if(!record){list();return}detailId=id;
 const card=OracleMessages[record.cardId];view.replaceChildren();
 const back=el('button','journal-back','‹ 記録の一覧へ');back.type='button';back.onclick=list;
 const title=el('h3','journal-detail-title',card.name+' · 正位置');title.tabIndex=-1;
 const form=el('form','journal-form'),label=el('label',null,'テーマ'),theme=el('select');theme.id='recordTheme';label.htmlFor=theme.id;options(theme);theme.value=record.theme;
 const memoLabel=el('label',null,'ひとこと残す（任意）'),memo=el('textarea');memo.id='recordMemo';memoLabel.htmlFor=memo.id;memo.maxLength=2000;memo.rows=6;memo.value=record.memo;memo.placeholder='相談したことや、あとから気づいたことなど';
 const length=el('p','journal-count');const updateCount=()=>{length.textContent=memo.value.length+' / 2000文字'};memo.addEventListener('input',updateCount);updateCount();
 const save=el('button','journal-button','変更を保存する');save.type='submit';const status=el('p','journal-status');status.setAttribute('role','status');
 form.append(label,theme,memoLabel,memo,length,save,status);
 form.addEventListener('submit',e=>{e.preventDefault();save.disabled=true;try{store.update(id,{theme:theme.value,memo:memo.value});status.textContent='分類とメモを保存しました。'}catch(error){status.textContent=error.message}finally{save.disabled=false}});
 view.append(back,title,el('p','journal-meta',date(record.createdAt)+' · ワンオラクル'),messageBlock(readingOf(record)),form,el('p','journal-privacy',privacy));title.focus({preventScroll:true});
}
function refresh(){if(view&&location.hash==='#records')list()}
window.addEventListener('hashchange',refresh);window.addEventListener('pageshow',refresh);
window.addEventListener('storage',e=>{if(e.key===J.KEY&&location.hash==='#records'&&!detailId)list()});refresh();
})();

