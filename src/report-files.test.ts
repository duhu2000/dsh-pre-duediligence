import { it, expect } from "vitest"
import { ReportFiles, renderReportFile } from "./report-files.js"
import { PrevisitWorkflowStore } from "./previsit-workflow.js"
const report="# 合成测试公司\n"+["核心研判","产业定位","近期动态","业务假设","红线提示","现场必问","触达开场","覆盖说明"].map(t=>`## ${t}\n合成测试内容，不是真实企业事实。`).join("\n")
async function fixture(){const store=new PrevisitWorkflowStore();let task=await store.create({query:"合成测试公司",depth:"fast",workspace:"/test",sessionId:"a"});task=await store.finalize(task.id,report,"partial");return {store,task}}
it("exports real DOCX once per version and keeps report state unchanged",async()=>{
  const {store,task}=await fixture(),files=new ReportFiles()
  const [a,b]=await Promise.all([files.export(task,"docx"),files.export(task,"docx")])
  expect(a).toEqual(b);expect(files.list(task.id).files).toHaveLength(1)
  expect(Buffer.from(files.get(a.id,task.id).base64,"base64").subarray(0,2).toString()).toBe("PK")
  expect(await store.get(task.id)).toEqual(task)
  expect(()=>files.get(a.id,"other")).toThrow("不属于")
})
it("never claims delivery succeeded and restores immutable files",async()=>{
  const {task}=await fixture(),files=new ReportFiles(),values=new Map<string,unknown>()
  const domain={open:async()=>({table:()=>({entries:()=>values.entries(),get:(id:string)=>values.get(id),put:(id:string,v:unknown)=>{values.set(id,v)}})})}
  await files.attach(domain);const file=await files.export(task,"docx")
  await expect(files.requestDelivery(task.id,file.id,"https://user:secret@example.com")).rejects.toThrow("凭据")
  const delivery=await files.requestDelivery(task.id,file.id,"https://example.com/reports")
  expect(delivery.status).toBe("awaiting-configuration")
  expect(await files.requestDelivery(task.id,file.id,"https://example.com/reports")).toEqual(delivery)
  const restored=new ReportFiles();await restored.attach(domain)
  expect(restored.list(task.id)).toEqual(files.list(task.id))
  expect(restored.get(file.id,task.id)).toEqual(files.get(file.id,task.id))
})
it("rejects incomplete reports and fails clearly without a PDF font",async()=>{
  const {task}=await fixture(),files=new ReportFiles()
  await expect(files.export({...task,state:"running"},"docx")).rejects.toThrow("已保存")
  await expect(renderReportFile(task,"pdf","")).rejects.toThrow("中文字体")
  expect(files.list(task.id).files).toEqual([])
})
