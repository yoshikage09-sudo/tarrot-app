(function(root){
'use strict';
function create(){return {async generateReading(prepared){
  const first=prepared.cards[0],general=first.meanings.general,action=first.meanings.action;
  const subject=prepared.question||'今日の過ごし方';
  return {schemaVersion:1,readingId:prepared.readingId,mode:'ai',summary:`${first.card}は、いまの問いを急いで結論にせず、ここまで整っているものと、仕上げが必要なものを見分けるよう促しています。`,interpretation:`「${subject}」という問いに対して、${first.card}の「${general}」は、状況全体を一度見渡す視点につながります。期待だけで判断するのではなく、すでに得られている経験や周囲との関係、まだ確認できていない条件を分けてみてください。答えを外から与えられるものとして待つより、自分が納得できる区切りをどこに置くかが、次の選択を明確にしそうです。`,cardReadings:prepared.cards.map(card=>({positionId:card.positionId,position:card.position,cardId:card.cardId,card:card.card,orientation:card.orientation,reading:`${card.positionMeaning}という位置では、「${card.meanings.general}」を現在の状況に照らし、完成している点と未確認の点を整理する読みになります。`})),advice:`今日できる一歩は「${action}」ことです。大きな結論を一度に出さず、確認できる事実を一つ増やしてから次の行動を選んでみましょう。`,cautions:[...prepared.cautions]};
}}}
const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.MockProvider=api;
})(globalThis);
