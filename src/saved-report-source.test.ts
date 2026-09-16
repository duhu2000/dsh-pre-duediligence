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
