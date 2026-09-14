import { writeFile, mkdir } from "node:fs/promises"
import { renderReportFile } from "../src/report-files.js"
import { PrevisitWorkflowStore } from "../src/previsit-workflow.js"
const store=new PrevisitWorkflowStore()
let task=await store.create({query:"合成测试企业",workspace:"/synthetic",sessionId:"synthetic",depth:"fast"})
task=await store.finalize(task.id,"# 合成测试企业\n"+["核心研判","产业定位","近期动态","业务假设","红线提示","现场必问","触达开场","覆盖说明"].map(t=>`## ${t}\n用于导出排版验证的合成文本。日期2026-09-14，金额123.45万元。\n- 待确认信息保留，不改动原报告。`).join("\n"),"partial")
await mkdir("/private/tmp/previsit-phase3-qa",{recursive:true})
for(const format of ["docx","pdf"] as const) await writeFile(`/private/tmp/previsit-phase3-qa/sample.${format}`,await renderReportFile(task,format,process.env.DSH_PREVISIT_PDF_FONT))
