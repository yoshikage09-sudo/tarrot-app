(function(root){
'use strict';
function create(mode){
  if(mode!=='fallback')return undefined;
  return {async generateReading(){const error=Error('offline');error.code='offline';throw error}};
}
const api={create};
if(typeof module!=='undefined'&&module.exports)module.exports=api;
else root.ReadingDiagnosticProvider=api;
})(globalThis);
