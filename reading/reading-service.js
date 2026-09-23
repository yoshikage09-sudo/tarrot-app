(function(root){
'use strict';
const Contract=typeof module!=='undefined'&&module.exports?require('./reading-contract.js'):root.ReadingContract;
const Prompt=typeof module!=='undefined'&&module.exports?require('./prompt-builder.js'):root.PromptBuilder;
const reasons=new Set(['disabled','quota','timeout','rate_limit','provider_error','invalid_output','offline']);
function create({provider,fallback,onDiagnostic=()=>{},idFactory=()=>globalThis.crypto?.randomUUID?.()||`reading-${Date.now()}`}={}){
  if(typeof fallback!=='function')throw Error('フォールバックが必要です。');
  return {async read(request,catalogs){
    const readingId=idFactory();
    try{
      if(!provider||typeof provider.generateReading!=='function'){const error=Error('disabled');error.code='disabled';throw error}
      const raw=await provider.generateReading({...Prompt.prepare(request,catalogs),readingId});
      try{return Contract.validateResult(raw,request)}catch{const error=Error('invalid_output');error.code='invalid_output';throw error}
    }catch(error){
      const fallbackReason=reasons.has(error&&error.code)?error.code:'provider_error';
      onDiagnostic({fallbackReason});
      return Contract.validateResult(fallback(request,catalogs,{readingId}),request);
    }
  }};
}
const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ReadingService=api;
})(globalThis);
