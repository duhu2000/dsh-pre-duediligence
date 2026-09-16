import assert from 'node:assert/strict';
import { apply } from '../src/index.mjs';
const definitions=[], disposers=[];
let handler;
const ctx={logger:{info(){}},effect(fn){const dispose=fn();if(typeof dispose==='function')disposers.push(dispose);},tools:{register(def){definitions.push(def);return()=>{};}},connection:{rpc:{handle(channel,fn){assert.equal(channel,'/f24-mcp-app');handler=fn;return()=>{};}}}};
await apply(ctx,{syntheticOnly:true,url:'http://127.0.0.1:3001/mcp'});
const signal=new AbortController().signal;
try {
 assert.deepEqual(definitions.map(d=>d.name),['f24_previsit_report_open']);
 const tool=definitions[0],args={reportId:'demo-report',reportVersion:1};
 const a=await tool.execute(args,{agent:{session:{id:'A'}},callId:'call-A',signal});
 const b=await tool.execute(args,{agent:{session:{id:'B'}},callId:'call-B',signal});
 assert.equal(tool.output.presentationMeta(args,a).f24App.viewId,a.viewId);
 const binding=({viewId,sessionId,callId})=>({viewId,sessionId,callId});
 assert.equal((await handler('resource',binding(a),signal)).ok,true);
 const cross=await handler('resource',{...binding(a),sessionId:b.sessionId,callId:b.callId},signal);
 assert.equal(cross.ok,false);assert.match(cross.error.message,/VIEW_NOT_ACCESSIBLE/);
 const own=await handler('call',{...binding(b),name:'previsit_evidence_get',arguments:{...args,evidenceId:'e1'}},signal);
 assert.equal(own.ok,true);assert.equal(own.value.isError,undefined);
 const arbitraryResource=await handler('resource',{...binding(a),uri:'file:///etc/passwd'},signal);assert.equal(arbitraryResource.ok,false);
 const modelOnly=await handler('call',{...binding(a),name:'previsit_report_open',arguments:args},signal);assert.equal(modelOnly.ok,false);
 console.log('PASS: real MCP + DSH Host API harness; only one model tool; two session-bound grants; cross-session/resource/tool refusal');
} finally {for(const dispose of disposers.reverse())await dispose();}
const stale=await handler('resource',{viewId:'00000000-0000-4000-8000-000000000000',sessionId:'A',callId:'call-A'},signal);
assert.equal(stale.ok,false);assert.match(stale.error.message,/HOST_DISPOSED/);
