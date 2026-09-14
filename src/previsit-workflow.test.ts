import { describe, expect, it } from "vitest"

import { PrevisitWorkflowStore } from "./previsit-workflow.js"

function storageFixture() {
  const values = new Map<string, unknown>()
  const table = {
    get: (key: string) => values.get(key),
    put: (key: string, value: unknown) => { values.set(key, value) },
    entries: () => values.entries(),
  }
  return { values, domain: { open: async () => ({ table: () => table }) } }
}

describe("PrevisitWorkflowStore", () => {
  it("persists public analysis revisions across restart and rejects resetting their subject", async () => {
    const storage = storageFixture(), first = new PrevisitWorkflowStore()
    await first.attach(storage.domain)
    const input = {id:"PV-20260914-ANAL",sessionId:"session-dsh-pre-duediligence-analysis",workspace:"/synthetic",query:"合成公司",depth:"fast" as const}
    const task = await first.create(input)
    await first.confirmEntity(task.id,{fullName:"合成公司",creditCode:"913200000000000001"})
    const entry = {id:"H1",kind:"hypothesis",title:"合成问题",status:"pending",summary:"等待证据",support:[],counter:[],unknown:["需求未知"],nextAction:"询问需求",evidenceIds:[]}
    await Promise.all([first.recordAnalysis(task.id,entry),first.recordAnalysis(task.id,{...entry,summary:"进一步确认"})])
    const second = new PrevisitWorkflowStore()
    await second.attach(storage.domain)
    expect((await second.get(task.id))?.analysisRecords?.map(row=>row.revision)).toEqual([1,2])
    await expect(second.create(input)).rejects.toThrow("分析")
  })
  it("保留缺少来源元数据的旧记录，仅进入 Profile 历史且不猜测当前 Session", async () => {
    const storage = storageFixture()
    storage.values.set("PV-20260911-OLD1", {
      id: "PV-20260911-OLD1",
      schemaVersion: 1,
      revision: 1,
      query: "旧版合成公司",
      depth: "fast",
      limit: 8,
      used: 0,
      state: "completed",
      stage: "output",
      runs: [],
      createdAt: "2026-09-10T12:00:00.000Z",
      updatedAt: "2026-09-10T12:05:00.000Z",
      completedAt: "2026-09-10T12:05:00.000Z",
    })
    const store = new PrevisitWorkflowStore()
    await store.attach(storage.domain)

    await expect(store.list()).resolves.toEqual([
      expect.objectContaining({ id: "PV-20260911-OLD1", sessionId: "", workspace: "", limit: 0 }),
    ])
    await expect(store.list("session-dsh-pre-duediligence-current")).resolves.toEqual([])
    expect(storage.values.get("PV-20260911-OLD1")).toEqual(expect.objectContaining({ sessionId: "", workspace: "" }))
  })

  it("persists entity, progress and a downloadable report across store instances", async () => {
    const storage = storageFixture()
    const first = new PrevisitWorkflowStore()
    await first.attach(storage.domain)
    let task = await first.create({ id: "PV-20260911-ABCD", sessionId: "session-dsh-pre-duediligence-test", workspace: "/synthetic", query: "合成公司", depth: "standard", limit: 18, planId: "plan-1", planEntities: 2, brief: { role: "银行/信贷客户经理", focus: ["风险与涉诉"], output: "一页纸简报", sections: ["现场必问"] } })
    task = await first.startRun(task.id, { runId: "run-search", dimension: "entity_search", toolName: "mcp__qcc_company__get_company_by_query", quotaUsed: true })
    task = await first.finishRun(task.id, "run-search", "done", undefined, { summary: "合成结果", facts: [], factors: [] })
    task = await first.confirmEntity(task.id, { fullName: "合成公司股份有限公司", creditCode: "913200000000000001" })
    const report = "# 访前尽调报告 · 合成公司股份有限公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((section, index) => `## ${index + 1}、${section}\n合成内容`).join("\n")
    task = await first.finalize(task.id, report, "completed")
    expect(task).toMatchObject({ id: "PV-20260911-ABCD", used: 1, limit: 0, state: "completed", stage: "output", reportMarkdown: report })
    expect(task.artifact?.fileName).toContain("合成公司股份有限公司")
    const artifact = task.artifact
    await expect(first.startRun(task.id, { runId: "late-run", dimension: "profile", quotaUsed: false })).rejects.toThrow("任务已结束")
    await expect(first.finalize(task.id, report, "completed")).resolves.toMatchObject({ artifact, completedAt: task.completedAt })

    const restored = new PrevisitWorkflowStore()
    await restored.attach(storage.domain)
    await expect(restored.get(task.id)).resolves.toMatchObject({ entity: { fullName: "合成公司股份有限公司" }, reportMarkdown: report, planId: "plan-1", planEntities: 2, brief: { role: "银行/信贷客户经理", focus: ["风险与涉诉"], output: "一页纸简报", sections: ["现场必问"] } })
    expect((await restored.get(task.id))?.runs[0]?.result?.summary).toBe("合成结果")
  })

  it("自愈旧版本中已有报告却回退到进行中的任务", async () => {
    const store = new PrevisitWorkflowStore()
    let task = await store.create({ id: "PV-20260911-LEGACY", sessionId: "session-dsh-pre-duediligence-test", workspace: "/synthetic", query: "合成公司", depth: "fast", limit: 8 })
    task = await store.confirmEntity(task.id, { fullName: "合成公司股份有限公司", creditCode: "913200000000000001" })
    const report = "# 访前尽调报告 · 合成公司股份有限公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((section, index) => `## ${index + 1}、${section}\n合成内容`).join("\n")
    task = await store.finalize(task.id, report, "completed")
    const { completedAt: _completedAt, ...legacy } = task
    await store.put({ ...legacy, state: "finalizing", stage: "output" })

    await expect(store.list(task.sessionId)).resolves.toEqual([
      expect.objectContaining({ limit: 0, state: "completed", stage: "output", reportMarkdown: report, completedAt: task.artifact?.createdAt }),
    ])
  })

  it("retargets the same visible task without resetting consumed quota", async () => {
    const store = new PrevisitWorkflowStore()
    let task = await store.create({ id: "PV-20260911-EFGH", sessionId: "session-dsh-pre-duediligence-test", workspace: "/synthetic", query: "错别字", depth: "standard", limit: 18 })
    task = await store.startRun(task.id, { runId: "run-search", dimension: "entity_search", quotaUsed: true })
    task = await store.finishRun(task.id, "run-search", "no-data")
    task = await store.create({ id: task.id, sessionId: task.sessionId, workspace: task.workspace, query: "正确名称", depth: "standard", limit: 18 })
    expect(task).toMatchObject({ query: "正确名称", used: 1, limit: 0, state: "needs-entity-search" })
    expect(task.runs).toHaveLength(1)
  })
})
