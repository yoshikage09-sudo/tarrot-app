/* Browser-local journal. All operations reread storage before a write. */
(function(root){
'use strict';
const KEY='astral-journal-v1';
const themes=Object.freeze(['未分類','恋愛・人間関係','仕事・学び','お金・暮らし','自分自身','今日のメッセージ','その他']);
function valid(r){return r&&typeof r.id==='string'&&r.id.length>0&&r.id.length<=100&&typeof r.createdAt==='string'&&Number.isFinite(Date.parse(r.createdAt))&&Number.isInteger(r.cardId)&&r.cardId>=0&&r.cardId<22&&themes.includes(r.theme)&&typeof r.memo==='string'&&r.memo.length<=2000}
function clean(r){if(!valid(r))throw Error('記録の内容を確認してください。');const record={id:r.id,createdAt:r.createdAt,cardId:r.cardId,theme:r.theme,memo:r.memo};if(r.reading!==undefined){if(!r.reading||!['title','message','action'].every(k=>typeof r.reading[k]==='string'&&r.reading[k].length<=4000))throw Error('記録のメッセージを読み込めません。');record.reading={title:r.reading.title,message:r.reading.message,action:r.reading.action}}return record}
function createJournal(storage){
 function read(){let raw;try{raw=storage.getItem(KEY)}catch{throw Error('記録を読み込めません。このブラウザーの保存設定をご確認ください。')}if(raw===null)return [];let data;try{data=JSON.parse(raw)}catch{throw Error('保存されている記録を読み込めません。既存のデータは変更していません。')}if(!data||data.version!==1||!Array.isArray(data.entries)||!data.entries.every(valid)||new Set(data.entries.map(r=>r.id)).size!==data.entries.length)throw Error('保存されている記録の形式に対応できません。既存のデータは変更していません。');return data.entries.map(clean)}
 function write(entries){try{storage.setItem(KEY,JSON.stringify({version:1,entries}))}catch{throw Error('保存できませんでした。ブラウザーの空き容量や保存設定をご確認ください。')}}
 return {list(){return read().sort((a,b)=>Date.parse(b.createdAt)-Date.parse(a.createdAt))},save(input){const record=clean(input),entries=read(),existing=entries.find(r=>r.id===record.id);if(existing)return existing;entries.push(record);write(entries);return record},update(id,patch){const entries=read(),i=entries.findIndex(r=>r.id===id);if(i<0)throw Error('この記録が見つかりません。');entries[i]=clean({...entries[i],theme:patch.theme,memo:patch.memo});write(entries);return entries[i]}};
}
const api={KEY,themes,createJournal};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.OracleJournal=api;
})(globalThis);

