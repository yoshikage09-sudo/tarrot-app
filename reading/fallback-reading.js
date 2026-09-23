(function(root){
'use strict';
const Prompt=typeof module!=='undefined'&&module.exports?require('./prompt-builder.js'):root.PromptBuilder;
function create(request,catalogs,{readingId=`reading-${Date.now()}`}={}){const prepared=Prompt.prepare(request,catalogs),first=prepared.cards[0];return {schemaVersion:1,readingId,mode:'fallback',summary:`${first.card}が示す基本の流れをお届けします。`,interpretation:`${first.positionMeaning}として、「${first.meanings.general}」という意味が中心になります。現時点の傾向として受け取り、状況に合う部分を確かめてください。`,cardReadings:prepared.cards.map(card=>({positionId:card.positionId,position:card.position,cardId:card.cardId,card:card.card,orientation:card.orientation,reading:`${card.meanings.general}` })),advice:`${first.meanings.action}。できる範囲の小さな一歩から試してみましょう。`,cautions:prepared.cautions.length?['医療・法律・投資・人命に関する判断は、占いだけで決めず専門家へ相談してください。']:[]}}
const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.FallbackReading=api;
})(globalThis);
