(function(root){'use strict';
const fields=['general','love','work','finance','relationships','action'];
function index(catalog,key){return Object.fromEntries(catalog.map(item=>[item[key],item]))}
function validateCards(data){if(data.schemaVersion!==1||!Array.isArray(data.cards)||data.cards.length!==22)throw Error('大アルカナ22枚が必要です。');const ids=new Set;for(const card of data.cards){if(!/^major-\d{2}$/.test(card.id)||ids.has(card.id))throw Error('カードIDが不正です。');ids.add(card.id);for(const side of ['upright','reversed'])for(const field of fields)if(!card.meanings?.[side]?.[field])throw Error(`${card.id}.${side}.${field} が必要です。`)}return {cards:data.cards,cardsById:index(data.cards,'id')}}
function validateSpreads(data){if(data.schemaVersion!==1||!Array.isArray(data.spreads))throw Error('スプレッドが必要です。');for(const spread of data.spreads){if(!spread.id||!Array.isArray(spread.positions)||spread.positions.length!==spread.cardCount)throw Error('スプレッド定義が不正です。');if(!['upright_only','upright_reversed'].includes(spread.orientationMode))throw Error('orientationModeが不正です。');if(typeof spread.reversedProbability!=='number'||spread.reversedProbability<0||spread.reversedProbability>1)throw Error('reversedProbabilityが不正です。')}return {spreads:data.spreads,spreadsById:index(data.spreads,'id')}}
function createCatalogs(cards,spreads){return {...validateCards(cards),...validateSpreads(spreads)}}
const api={createCatalogs,validateCards,validateSpreads};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ReadingData=api;
})(globalThis);
