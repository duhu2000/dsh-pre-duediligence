import { describe, it, expect } from "vitest"
import { PrevisitWorkflowStore, type PrevisitTaskRecord } from "./previsit-workflow.js"
import { createSavedReportSource } from "./saved-report-source.js"
const scope = {sessionId:"session-A",workspace:"/fixture"}
const task: PrevisitTaskRecord = {id:"PV-20260916-SAVE",schemaVersion:1,revision:1,...scope,query:"合成公司",depth:"fast",limit:0,used:0,state:"partial",stage:"output",runs:[],entity:{fullName:"合成公司",creditCode:"SYNTHETIC"},reportMarkdown:"保存正文",createdAt:"2026-09-01",updatedAt:"2026-09-02",completedAt:"2026-09-02"}
describe("saved report source",()=>{
 it("reads detached published snapshots without puts or normalization",async()=>{
  let writes=0;const values=new Map<string,unknown>();const store=new PrevisitWorkflowStore();
  await store.attach({open:async()=>({table:()=>({get:k=>values.get(k),entries:()=>values.entries(),put:(k,v)=>{writes++;values.set(k,v)}})})});
  values.set(task.id,{...task,limit:8});const source=createSavedReportSource(store);
  const read=await source.read(task.id,1,scope);expect(read.limit).toBe(8);read.entity!.fullName="changed";
  expect((await source.read(task.id,1,scope)).entity!.fullName).toBe("合成公司");expect(writes).toBe(0);
 });
 it("fails closed for another session, workspace, Profile, version and missing ownership",async()=>{
  const source=createSavedReportSource({readSnapshot:async()=>task});
  for(const other of [{...scope,sessionId:"B"},{...scope,workspace:"/other"},{...scope,sessionId:""}]) await expect(source.read(task.id,1,other)).rejects.toThrow("NOT_ACCESSIBLE");
  await expect(createSavedReportSource({readSnapshot:async()=>undefined}).read(task.id,1,scope)).rejects.toThrow("NOT_ACCESSIBLE");
  await expect(source.read(task.id,2,scope)).rejects.toThrow("VERSION_NOT_FOUND");
  await expect(source.read("../../other",1,scope)).rejects.toThrow("NOT_ACCESSIBLE");
 });
 it("does not upgrade unpublished or ownerless legacy records into saved reports",async()=>{
  for(const patch of [{state:"running" as const},{completedAt:""},{entity:undefined},{sessionId:""}]) {
   const source=createSavedReportSource({readSnapshot:async()=>({...task,...patch}) as PrevisitTaskRecord});
   await expect(source.read(task.id,1,scope)).rejects.toThrow();
  }
 });
})

describe("saved report version history",()=>{
 it("lists only published versions of the same family, owner, workspace and subject",async()=>{
  const root={...task,rootTaskId:task.id,reportVersion:1};
  const second={...root,id:"PV-20260916-NEXT",reportVersion:2,parentTaskId:root.id};
  const records=[root,second,
   {...second,id:"PV-20260916-SESS",reportVersion:3,sessionId:"B"},
   {...second,id:"PV-20260916-WORK",reportVersion:4,workspace:"/other"},
   {...second,id:"PV-20260916-ENTI",reportVersion:5,entity:{fullName:"另一公司",creditCode:"OTHER"}},
   {...second,id:"PV-20260916-ROOT",reportVersion:6,rootTaskId:"PV-20260916-ROOT"},
   {...second,id:"PV-20260916-DRAF",reportVersion:7,state:"running" as const},
  ];
  const source=createSavedReportSource({readSnapshot:async id=>records.find(r=>r.id===id),listSnapshots:async()=>records});
  expect(await source.versions(second.id,2,scope)).toEqual([
   {reportId:root.id,reportVersion:1,generatedAt:task.completedAt,status:"partial"},
   {reportId:second.id,reportVersion:2,generatedAt:task.completedAt,status:"partial"},
  ]);
  await expect(source.versions(second.id,2,{...scope,sessionId:"B"})).rejects.toThrow("NOT_ACCESSIBLE");
  records.push({...second,id:"PV-20260916-DUPL"});
  await expect(source.versions(second.id,2,scope)).rejects.toThrow("AMBIGUOUS_REPORT_VERSIONS");
 });
 it("version inventory is detached and never invokes storage puts",async()=>{
  let puts=0;const values=new Map<string,unknown>();const store=new PrevisitWorkflowStore();
  await store.attach({open:async()=>({table:()=>({get:k=>values.get(k),entries:()=>values.entries(),put:()=>{puts++}})})});
  values.set(task.id,task);const list=await store.listSnapshots();list[0]!.query="changed";
  expect((await createSavedReportSource(store).versions(task.id,1,scope))[0]?.reportId).toBe(task.id);
  expect((await store.readSnapshot(task.id))?.query).toBe(task.query);expect(puts).toBe(0);
 });
});
