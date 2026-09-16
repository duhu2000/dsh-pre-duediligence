import {randomUUID} from 'node:crypto';
import {z} from 'zod';
const report=z.object({reportId:z.string().regex(/^PV-\d{8}-[A-Z0-9-]{4,40}$/),reportVersion:z.number().int().positive()}).strict();
const pin=report.extend({digest:z.string().regex(/^[a-f0-9]{64}$/)}).strict();
const schema=z.object({viewId:z.string().uuid(),sessionId:z.string().min(1),callId:z.string().min(1),scope:z.object({sessionId:z.string().min(1),workspace:z.string().min(1)}).strict(),active:pin,pins:z.array(pin).min(1).max(100),createdAt:z.number().int(),expiresAt:z.number().int()}).strict();
const fail=message=>{throw new Error(message);};

// A receipt stores trusted execution identity and digest only, never report
// content. Its existence is NOT sufficient permission: callers recheck source.
export async function openReceipts(storageDomain,{now=Date.now,lifetimeMs=30*86400000,maxReceipts=1000}={}) {
 const domain=await storageDomain.open({name:'f24_saved_views_v1',version:1,tables:{views:{valueSchema:schema}}});
 const table=domain.table('views'),queues=new Map();let disposed=false,issuing=Promise.resolve();
 function read(identity){
  if(disposed)fail('HOST_DISPOSED');
  const r=table.get(identity.viewId);
  if(!r||r.viewId!==identity.viewId||r.sessionId!==identity.sessionId||r.callId!==identity.callId||r.scope.sessionId!==r.sessionId)fail('VIEW_NOT_ACCESSIBLE');
  if(now()>=r.expiresAt)fail('VIEW_EXPIRED_REOPEN');
  return structuredClone(r);
 }
 return {
  async issue({sessionId,callId,scope,args,digest}){
   const operation=issuing.then(async()=>{
    if(disposed)fail('HOST_DISPOSED');
    for(const [key,r] of table.entries())if(now()>=r.expiresAt)await table.delete(key);
    if([...table.entries()].length>=maxReceipts)fail('VIEW_LIMIT_REACHED');
    const active={...args,digest},createdAt=now();
    const r=schema.parse({viewId:randomUUID(),sessionId,callId,scope,active,pins:[active],createdAt,expiresAt:createdAt+lifetimeMs});
    if(r.scope.sessionId!==r.sessionId)fail('MISSING_EXECUTION_IDENTITY');
    await table.put(r.viewId,r);return structuredClone(r);
   });issuing=operation.catch(()=>{});return operation;
  },
  async use(identity,operation){
   const key=identity.viewId;
   const work=(queues.get(key)??Promise.resolve()).catch(()=>{}).then(()=>operation(read(identity)));
   queues.set(key,work);
   try{return await work;}finally{if(queues.get(key)===work)queues.delete(key);}
  },
  async select(r,args,digest){
   read(r);
   const previous=r.pins.find(p=>p.reportId===args.reportId&&p.reportVersion===args.reportVersion);
   if(previous&&previous.digest!==digest)fail('REPORT_CHANGED_REOPEN');
   const active={...args,digest};
   const next=schema.parse({...r,active,pins:previous?r.pins:[...r.pins,active]});
   await table.put(r.viewId,next);
  },
  async close(){disposed=true;await issuing;await Promise.allSettled([...queues.values()]);await domain.close();},
 };
}
