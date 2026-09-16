import {test} from 'node:test';
import assert from 'node:assert/strict';
import {openReceipts} from '../src/receipts.mjs';
import {receiptStorage} from './receipt-storage.mjs';
const issue={sessionId:'A',callId:'call-A',scope:{sessionId:'A',workspace:'/fixture'},args:{reportId:'PV-20260916-AAAA',reportVersion:2},digest:'a'.repeat(64)};
test('receipt survives reopening but never trusts substituted session, call, or browser result',async()=>{
 const storage=receiptStorage();let store=await openReceipts(storage);const r=await store.issue(issue);
 assert.equal(JSON.stringify([...storage.records]).includes('structuredContent'),false);
 await store.close();store=await openReceipts(storage);
 await store.use(r,async saved=>assert.equal(saved.active.digest,issue.digest));
 for(const identity of [{...r,sessionId:'B'},{...r,callId:'other'},{...r,viewId:'00000000-0000-4000-8000-000000000000'}])await assert.rejects(store.use(identity,()=>{}),/VIEW_NOT_ACCESSIBLE/);
 const wrongKey='00000000-0000-4000-8000-000000000001';
 storage.records.set(wrongKey,structuredClone(storage.records.get(r.viewId)));
 await assert.rejects(store.use({...r,viewId:wrongKey},()=>{}),/VIEW_NOT_ACCESSIBLE/);
 await store.close();
});
test('selection persists; previously seen version cannot silently change',async()=>{
 const storage=receiptStorage();let store=await openReceipts(storage);const r=await store.issue(issue);
 const args={reportId:'PV-20260916-BBBB',reportVersion:1};
 await store.use(r,saved=>store.select(saved,args,'b'.repeat(64)));await store.close();store=await openReceipts(storage);
 await store.use(r,async saved=>{assert.deepEqual(saved.active,{...args,digest:'b'.repeat(64)});await assert.rejects(store.select(saved,issue.args,'c'.repeat(64)),/REPORT_CHANGED_REOPEN/);});
 await store.close();
});
test('expiry cannot renew itself, concurrent issuance respects capacity, expired metadata can be cleaned',async()=>{
 let now=0;const storage=receiptStorage();const store=await openReceipts(storage,{now:()=>now,lifetimeMs:10,maxReceipts:1});
 const results=await Promise.allSettled([store.issue(issue),store.issue(issue)]);assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const r=results.find(r=>r.status==='fulfilled').value;now=10;await assert.rejects(store.use(r,()=>{}),/VIEW_EXPIRED_REOPEN/);
 await store.issue(issue);assert.equal(storage.records.size,1);await store.close();await assert.rejects(store.use(r,()=>{}),/HOST_DISPOSED/);
});
