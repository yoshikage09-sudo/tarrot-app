(function(root){'use strict';
const Data=typeof module!=='undefined'&&module.exports?require('./reading-data.js'):root.ReadingData;
const Contract=typeof module!=='undefined'&&module.exports?require('./reading-contract.js'):root.ReadingContract;
const Mock=typeof module!=='undefined'&&module.exports?require('./mock-provider.js'):root.MockProvider;
const Fallback=typeof module!=='undefined'&&module.exports?require('./fallback-reading.js'):root.FallbackReading;
const Service=typeof module!=='undefined'&&module.exports?require('./reading-service.js'):root.ReadingService;
function create({catalogs,provider=Mock.create(),onDiagnostic}={}){const service=Service.create({provider,fallback:Fallback.create,onDiagnostic});return {async read({question='',cardId,orientation='upright'}){const request=Contract.buildRequest({question,spreadId:'one-oracle',cards:[{cardId,positionId:'message',orientation}]},catalogs);return {result:await service.read(request,catalogs),request}}}}
async function load({baseUrl='.',provider,onDiagnostic}={}){const [cards,spreads]=await Promise.all([fetch(`${baseUrl}/data/cards-major.json`).then(r=>{if(!r.ok)throw Error('cards');return r.json()}),fetch(`${baseUrl}/data/spreads.json`).then(r=>{if(!r.ok)throw Error('spreads');return r.json()})]);return create({catalogs:Data.createCatalogs(cards,spreads),provider,onDiagnostic})}
const api={create,load};if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.ReadingClient=api;
})(globalThis);
