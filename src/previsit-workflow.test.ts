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
  it("persists entity, progress and a downloadable report across store instances", async () => {
    const storage = storageFixture()
    const first = new PrevisitWorkflowStore()
    await first.attach(storage.domain)
    let task = await first.create({ id: "PV-20260911-ABCD", sessionId: "session-dsh-pre-duediligence-test", workspace: "/synthetic", query: "合成公司", depth: "standard", limit: 18 })
    task = await first.startRun(task.id, { runId: "run-search", dimension: "entity_search", toolName: "mcp__qcc_company__get_company_by_query", quotaUsed: true })
    task = await first.finishRun(task.id, "run-search", "done")
    task = await first.confirmEntity(task.id, { fullName: "合成公司股份有限公司", creditCode: "913200000000000001" })
    const report = "# 访前尽调报告 · 合成公司股份有限公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((section, index) => `## ${index + 1}、${section}\n合成内容`).join("\n")
    task = await first.finalize(task.id, report, "completed")
    expect(task).toMatchObject({ id: "PV-20260911-ABCD", used: 1, state: "completed", stage: "output", reportMarkdown: report })
    expect(task.artifact?.fileName).toContain("合成公司股份有限公司")

    const restored = new PrevisitWorkflowStore()
    await restored.attach(storage.domain)
    await expect(restored.get(task.id)).resolves.toMatchObject({ entity: { fullName: "合成公司股份有限公司" }, reportMarkdown: report })
  })

  it("retargets the same visible task without resetting consumed quota", async () => {
    const store = new PrevisitWorkflowStore()
    let task = await store.create({ id: "PV-20260911-EFGH", sessionId: "session-dsh-pre-duediligence-test", workspace: "/synthetic", query: "错别字", depth: "standard", limit: 18 })
    task = await store.startRun(task.id, { runId: "run-search", dimension: "entity_search", quotaUsed: true })
    task = await store.finishRun(task.id, "run-search", "no-data")
    task = await store.create({ id: task.id, sessionId: task.sessionId, workspace: task.workspace, query: "正确名称", depth: "standard", limit: 18 })
    expect(task).toMatchObject({ query: "正确名称", used: 1, state: "needs-entity-search" })
    expect(task.runs).toHaveLength(1)
  })
})
