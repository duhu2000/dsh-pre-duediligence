import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createSavedReader, projectSavedTask } from '../server/saved-reader.mjs';
import { savedTask } from './saved-fixture.mjs';
const args={reportId:'PV-20260916-SAVED-V2',reportVersion:2};
test('saved task preserves exact report, original dates, status and registered metadata',async()=>{
 const task=savedTask(),before=JSON.stringify(task);const reader=createSavedReader({read:async()=>task},{sessionId:'A',workspace:'/fixture'});
 const report=await reader.getReport(args);assert.equal(report.originalMarkdown,task.reportMarkdown);assert.equal(report.sections.length,8);assert.equal(report.artifacts[0].downloadAvailable,false);
 assert.deepEqual(report.coverage.map(c=>c.status),['done','no-data','failed','not-executed']);
 const fact=await reader.getEvidence({...args,evidenceId:'E-1'});assert.equal(fact.evidence.sourceDate,'2026-08-01');assert.match(fact.evidence.quote,/<script>/);
 const query=await reader.getEvidence({...args,evidenceId:'R-old'});assert.equal(query.evidence.sourceDate,null);assert.equal(query.evidence.collectedAt,'2026-08-20T01:00:00Z');assert.equal(query.evidence.kind,'query-summary');
 await assert.rejects(reader.getEvidence({...args,evidenceId:'R-missing'}),/EVIDENCE_NOT_SAVED/);
 await assert.rejects(reader.getEvidence({...args,evidenceId:'R-empty'}),/EVIDENCE_NOT_IN_REPORT/);
 assert.equal(JSON.stringify(task),before);
});
test('reauthorizes every read and detects changed snapshot even after reader recreation',async()=>{
 const task=savedTask();let revoked=false,reads=0;const source={read:async()=>{reads++;if(revoked)throw new Error('NOT_ACCESSIBLE');return task;}};
 const reader=createSavedReader(source,{});const r=await reader.getReport(args);
 const restored=createSavedReader(source,{}, {expectedDigest:r.sourceDigest});await restored.getEvidence({...args,evidenceId:'E-1'});
 task.reportMarkdown+='\nchanged';await assert.rejects(restored.getReport(args),/REPORT_CHANGED_REOPEN/);
 revoked=true;await assert.rejects(reader.listArtifacts(args),/NOT_ACCESSIBLE/);assert.equal(reads,4);
});
test('legacy references and corrupt material are never invented',()=>{
 const task=savedTask();task.materials[0].sha256='bad';const p=projectSavedTask(task);assert.ok(!p.evidence.some(e=>e.id==='E-1'));assert.match(p.report.limitations.join(' '),/E-1/);
 task.analysisRecords=[];assert.equal(projectSavedTask(task).report.findings.length,0);
 task.reportMarkdown='## 核心研判\nmissing sections';assert.throws(()=>projectSavedTask(task),/LEGACY_FIELDS_MISSING/);
});
