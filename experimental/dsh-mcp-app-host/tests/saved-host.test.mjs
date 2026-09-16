import {test} from 'node:test';
import assert from 'node:assert/strict';
import {apply} from '../lib/saved.js';
import {savedTask} from '../../mcp-app/tests/saved-fixture.mjs';
test('saved host binds real execution identity, rechecks source and fails after change/revoke/dispose',async()=>{
 let record=savedTask(),handler,definition,reads=0;const releases=[];
 const ctx={previsitSavedReports:{read:async(id,version,scope)=>{reads++;if(!record||id!==record.id||scope.sessionId!==record.sessionId||scope.workspace!==record.workspace)throw new Error('NOT_ACCESSIBLE');if(version!==record.reportVersion)throw new Error('VERSION_NOT_FOUND');return structuredClone(record);}},effect:f=>{const d=f();if(typeof d==='function')releases.push(d);},tools:{register:d=>{definition=d;return()=>{};}},connection:{rpc:{handle:(_c,h)=>{handler=h;return()=>{};}}}};
 apply(ctx,{savedReports:true});const signal=new AbortController().signal;
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
