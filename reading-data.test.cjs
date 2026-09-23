const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const Data=require('./reading/reading-data.js');
const cards=JSON.parse(fs.readFileSync('./data/cards-major.json','utf8')),spreads=JSON.parse(fs.readFileSync('./data/spreads.json','utf8'));
test('22 cards validate with stable ids',()=>{const c=Data.validateCards(cards);assert.equal(c.cards.length,22);assert.equal(c.cardsById['major-21'].name,'世界')});
test('all meaning dimensions exist',()=>{for(const card of cards.cards)for(const side of ['upright','reversed'])for(const key of ['general','love','work','finance','relationships','action'])assert.ok(card.meanings[side][key])});
test('one oracle stays upright only',()=>{const s=Data.validateSpreads(spreads).spreadsById['one-oracle'];assert.equal(s.orientationMode,'upright_only');assert.equal(s.reversedProbability,0)});
