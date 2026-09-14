import { mkdir, writeFile } from "node:fs/promises"
import { renderReportFile } from "../src/report-files.js"
import { PrevisitWorkflowStore } from "../src/previsit-workflow.js"
const store = new PrevisitWorkflowStore()
let task = await store.create({ query: "合成中文测试企业", workspace: "/synthetic", sessionId: "synthetic", depth: "fast" })
task = await store.finalize(task.id, "# 合成中文测试企业\n" + ["核心研判","产业定位","近期动态","业务假设","红线提示","现场必问","触达开场","覆盖说明"].map(t => `## ${t}\n用于离线字体验证的合成资料。金额123.45万元，日期2026-09-14。\n保留未知事项，不代表真实企业事实。`).join("\n"), "partial")
await mkdir("_scratch/pdf-qa", { recursive: true })
await writeFile("_scratch/pdf-qa/offline.pdf", await renderReportFile(task, "pdf", ""))
