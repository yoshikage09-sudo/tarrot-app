/* Pure deck operations: no DOM, animation, or timing dependencies. */
(function (root) {
  'use strict';
  const names = ['愚者','魔術師','女教皇','女帝','皇帝','教皇','恋人','戦車','力','隠者','運命の輪','正義','吊るされた男','死神','節制','悪魔','塔','星','月','太陽','審判','世界'];
  const cards = Object.freeze(names.map((name,id) => Object.freeze({id,name})));
  function shuffle(deck, random = Math.random) {
    const result = [...deck];
    for (let i=result.length-1;i>0;i--) {
      const j = Math.floor(random() * (i+1));
      [result[i],result[j]] = [result[j],result[i]];
    }
    return result;
  }
  function cut(deck, at) {
    if (!Number.isInteger(at) || at<1 || at>=deck.length) throw new RangeError('Invalid cut');
    return [...deck.slice(at),...deck.slice(0,at)];
  }
  class Oracle {
    constructor(random = Math.random) { this.random=random; this.reset(); }
    reset() { this.deck=[...cards]; this.phase='idle'; this.selected=null; }
    start() {
      if (this.phase!=='idle') throw new Error('Already started');
      this.deck=shuffle(cards,this.random); this.phase='cut';
    }
    cut(at) {
      if (this.phase!=='cut') throw new Error('Cannot cut now');
      this.deck=cut(this.deck,at); this.phase='select';
    }
    select(index) {
      if (this.phase!=='select') throw new Error('Cannot select now');
      if (!Number.isInteger(index)||index<0||index>=this.deck.length) throw new RangeError('Invalid index');
      this.selected=index;
    }
    confirm() {
      if (this.phase!=='select'||this.selected===null) throw new Error('Select a card first');
      this.phase='confirmed'; return this.deck[this.selected];
    }
  }
  const api = {cards,shuffle,cut,Oracle};
  if (typeof module!=='undefined' && module.exports) module.exports=api;
  else root.OracleCore=api;
})(globalThis);
