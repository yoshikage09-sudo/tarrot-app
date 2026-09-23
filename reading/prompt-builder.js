(function(root){
'use strict';
const CATEGORY_KEYWORDS={love:['恋','結婚','復縁','相手','片思い'],work:['仕事','転職','職場','キャリア'],finance:['お金','収入','投資','金運'],relationships:['人間関係','友人','家族','同僚']};
const SENSITIVE=[['medical',['病気','治療','薬','診断']],['legal',['法律','裁判','契約']],['investment',['投資','株','暗号資産']],['life_safety',['死','自殺','命','危険']]];
function categoriesFor(question=''){return Object.entries(CATEGORY_KEYWORDS).filter(([,words])=>words.some(word=>question.includes(word))).map(([key])=>key)}
function cautionsFor(question=''){return SENSITIVE.filter(([,words])=>words.some(word=>question.includes(word))).map(([kind])=>kind)}
function prepare(request,catalogs){
  const spread=catalogs.spreadsById[request.spreadId];
  const supplementalCategories=categoriesFor(request.question);
  return {question:request.question,spread:{id:spread.id,name:spread.name},supplementalCategories,cautions:cautionsFor(request.question),instruction:'質問とカード意味の具体的な接点を解釈し、断定を避け、現実的な一歩へ結びつける。',relationshipAnalysis:{supports:true,contradictions:true,causality:true,timeline:true,conditions:true},cards:request.cards.map(item=>{const card=catalogs.cardsById[item.cardId],position=spread.positions.find(p=>p.id===item.positionId);const meanings={general:card.meanings[item.orientation].general,action:card.meanings[item.orientation].action};supplementalCategories.forEach(key=>meanings[key]=card.meanings[item.orientation][key]);return {cardId:card.id,card:card.name,orientation:item.orientation,positionId:position.id,position:position.name,positionMeaning:position.meaning,meanings}})};
}
const api={prepare,categoriesFor,cautionsFor};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.PromptBuilder=api;
})(globalThis);
