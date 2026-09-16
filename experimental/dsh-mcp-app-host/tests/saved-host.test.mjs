import {receiptStorage} from './receipt-storage.mjs';
import {test} from 'node:test';
import assert from 'node:assert/strict';
const {apply} = await import(process.env.PREVISIT_PRODUCTION_APP ? '../../../lib/report-host.js' : '../lib/saved.js');
import {savedTask} from '../../mcp-app/tests/saved-fixture.mjs';
test('saved host binds real execution identity, rechecks source and fails after change/revoke/dispose',async()=>{
 let record=savedTask(),handler,definition,reads=0;const releases=[];
 const ctx={storageDomain:receiptStorage(),previsitSavedReports:{read:async(id,version,scope)=>{reads++;if(!record||id!==record.id||scope.sessionId!==record.sessionId||scope.workspace!==record.workspace)throw new Error('NOT_ACCESSIBLE');if(version!==record.reportVersion)throw new Error('VERSION_NOT_FOUND');return structuredClone(record);}},effect:f=>{const d=f();if(typeof d==='function')releases.push(d);},tools:{register:d=>{definition=d;return()=>{};}},connection:{rpc:{handle:(_c,h)=>{handler=h;return()=>{};}}}};
 await apply(ctx,{savedReports:true});const signal=new AbortController().signal;
 const args={reportId:record.id,reportVersion:2},exec={agent:{session:{id:'session-A',header:{cwd:'/fixture'}}},callId:'call-A',signal};
 const opened=await definition.execute(args,exec),{result,...binding}=opened;
 assert.equal(result.structuredContent.sourceKind,'saved-task');assert.ok((await handler('resource',binding,signal)).value.html.includes('APP_BUNDLE')===false);
 let r=await handler('call',{...binding,name:'previsit_evidence_get',arguments:{...args,evidenceId:'R-old'}},signal);assert.equal(r.ok,true);assert.equal(r.value.structuredContent.evidence.sourceDate,null);
 assert.equal((await handler('resource',{...binding,sessionId:'B'},signal)).ok,false);
 await assert.rejects(definition.execute(args,{...exec,agent:{session:{id:'session-A',header:{cwd:'/other'}}}}),/NOT_ACCESSIBLE/);
 record.reportMarkdown+='changed';assert.match((await handler('resource',binding,signal)).error.message,/REPORT_CHANGED_REOPEN/);
 record=null;assert.match((await handler('resource',binding,signal)).error.message,/NOT_ACCESSIBLE/);
 for(const d of releases.reverse())await d();assert.match((await handler('resource',binding,signal)).error.message,/HOST_DISPOSED/);assert.ok(reads>=6);
});

test('Host restart restores selected version using durable receipt and current source authorization',async()=>{
 const storage=receiptStorage();const second=savedTask(),first={...structuredClone(second),id:second.parentTaskId,reportVersion:1};
 const records=new Map([[first.id,first],[second.id,second]]);
 const source={async read(id,version,scope){const r=records.get(id);if(!r||r.sessionId!==scope.sessionId||r.workspace!==scope.workspace)throw new Error('NOT_ACCESSIBLE');if(r.reportVersion!==version)throw new Error('VERSION_NOT_FOUND');return structuredClone(r);},async versions(){return [...records.values()].map(r=>({reportId:r.id,reportVersion:r.reportVersion,generatedAt:r.completedAt,status:r.state}));}};
 async function boot(domain=storage){let handler,tool;const releases=[];await apply({storageDomain:domain,previsitSavedReports:source,effect:f=>{const d=f();if(typeof d==='function')releases.push(d);},tools:{register:d=>{tool=d;return()=>{};}},connection:{rpc:{handle:(_c,h)=>{handler=h;return()=>{};}}}},{savedReports:true});return {handler,tool,close:async()=>{for(const d of releases.reverse())await d();}};}
 const signal=new AbortController().signal;let host=await boot();
 const opened=await host.tool.execute({reportId:second.id,reportVersion:2},{agent:{session:{id:second.sessionId,header:{cwd:second.workspace}}},callId:'durable-call',signal});
 const {result,...binding}=opened;
 assert.equal((await host.handler('select-version',{...binding,reportId:first.id,reportVersion:1},signal)).ok,true);
 await host.close();host=await boot();
 let response=await host.handler('resource',binding,signal);assert.equal(response.ok,true);assert.equal(response.value.result.structuredContent.reportVersion,1);assert.equal(response.value.versions.length,2);
 assert.equal((await host.handler('select-version',{...binding,reportId:'PV-20260916-EVIL',reportVersion:9},signal)).ok,false);
 second.reportMarkdown+='tampered';response=await host.handler('select-version',{...binding,reportId:second.id,reportVersion:2},signal);assert.match(response.error.message,/REPORT_CHANGED_REOPEN/);
 records.delete(first.id);response=await host.handler('resource',binding,signal);assert.match(response.error.message,/NOT_ACCESSIBLE/);
 await host.close();host=await boot(receiptStorage());assert.equal((await host.handler('resource',binding,signal)).ok,false);
 await host.close();
});
