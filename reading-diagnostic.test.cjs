const test=require('node:test');
const assert=require('node:assert/strict');

test('normal mode does not override the configured provider',()=>{
  const Diagnostic=require('./reading/diagnostic-provider.js');
  assert.equal(Diagnostic.create(''),undefined);
});

test('fallback diagnostic produces a classified offline failure',async()=>{
  const Diagnostic=require('./reading/diagnostic-provider.js');
  const provider=Diagnostic.create('fallback');
  await assert.rejects(provider.generateReading(),error=>error.code==='offline');
});
