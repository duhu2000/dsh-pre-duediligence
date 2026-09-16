import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createBindings } from '../src/bindings.mjs';
import { snapshot } from '../../mcp-app/server/snapshot.mjs';
const args = {reportId:'demo-report',reportVersion:1};
const result = {content:[],structuredContent:snapshot.report};
const mint = b => b.mint({sessionId:'session-A',callId:'call-A',args,result});
test('grants reject another session, another call and another report/version', () => {
 const b=createBindings(); const grant=mint(b);
 assert.throws(()=>b.get({...grant,sessionId:'session-B'}),/VIEW_NOT_ACCESSIBLE/);
 assert.throws(()=>b.get({...grant,callId:'call-B'}),/VIEW_NOT_ACCESSIBLE/);
 assert.throws(()=>b.allowCall(grant,'previsit_evidence_get',{...args,reportVersion:2,evidenceId:'e1'}),/REPORT_SCOPE/);
 assert.throws(()=>b.allowCall(grant,'previsit_evidence_get',{...args,reportId:'other',evidenceId:'e1'}),/REPORT_SCOPE/);
 assert.equal(b.allowCall(grant,'previsit_evidence_get',{...args,evidenceId:'e1'}).sessionId,'session-A');
});
test('only app-visible tools and linked evidence are permitted',()=>{
 const b=createBindings();const grant=mint(b);
 for(const name of ['previsit_report_open','bash','query_company']) assert.throws(()=>b.allowCall(grant,name,args),/TOOL_NOT_APP_VISIBLE/);
 assert.throws(()=>b.allowCall(grant,'previsit_evidence_get',{...args,evidenceId:'missing'}),/EVIDENCE_NOT_IN_REPORT/);
 b.allowCall(grant,'previsit_artifacts_list',args);
});
test('expiry, cleanup, capacity and detached snapshots',()=>{
 let now=0;const b=createBindings({now:()=>now,ttlMs:10,maxViews:1});const grant=mint(b);
 grant.result.structuredContent.entity.id='changed';
 assert.equal(b.get(grant).result.structuredContent.entity.id,'synthetic-company-a');
 assert.throws(()=>mint(b),/VIEW_LIMIT_REACHED/);now=10;
 assert.throws(()=>b.get(grant),/VIEW_NOT_ACCESSIBLE/);const next=mint(b);b.clear();assert.throws(()=>b.get(next),/VIEW_NOT_ACCESSIBLE/);
});
test('non-synthetic results cannot mint grants',()=>{
 const b=createBindings();assert.throws(()=>b.mint({sessionId:'a',callId:'a',args,result:{...result,structuredContent:{...snapshot.report,synthetic:false}}}),/INVALID_SYNTHETIC/);
});
