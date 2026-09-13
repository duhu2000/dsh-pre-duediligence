import { describe, expect, it } from "vitest"

import { mountPrevisitWebRoutes, type WebServer } from "./previsit-web.js"
import { PrevisitWorkflowStore } from "./previsit-workflow.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
const otherSessionId = "session-dsh-pre-duediligence-87654321-4321-4321-8321-cba987654321"
const report = "# 访前尽调报告 · 合成公司股份有限公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((section, index) => `## ${index + 1}、${section}\n合成内容`).join("\n")

describe("previsit Host routes", () => {
  it("lists session tasks and downloads only a finalized HTML report", async () => {
    const workflow = new PrevisitWorkflowStore()
    let task = await workflow.create({ id: "PV-20260911-WEB1", sessionId, workspace: "/synthetic", query: "合成公司", depth: "fast", limit: 8 })
    task = await workflow.confirmEntity(task.id, { fullName: "合成公司股份有限公司", creditCode: "913200000000000001" })
    let handler: Parameters<WebServer["register"]>[0]["handler"] | undefined
    mountPrevisitWebRoutes({ register(input) { handler = input.handler; return () => {} } }, workflow)
    const call = async (url: string, method = "GET", payload?: unknown) => {
      let status = 0
      let headers: Record<string, string> = {}
      let body = ""
      await handler?.({ method, url, headers: {}, async *[Symbol.asyncIterator]() { if (payload !== undefined) yield Buffer.from(JSON.stringify(payload)) } }, {
        writeHead(next, nextHeaders = {}) { status = next; headers = nextHeaders },
        end(value) { body = typeof value === "string" ? value : value === undefined ? "" : Buffer.from(value).toString("utf8") },
      })
      return { status, headers, body }
    }
    expect((await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent(sessionId)}`)).status).toBe(409)
    expect((await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent("session-dsh-pre-duediligence-other")}`)).status).toBe(403)
    const incomplete = await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent(sessionId)}`, "PUT", { reportMarkdown: report, status: "completed" })
    expect(incomplete.status).toBe(409)
    expect(JSON.parse(incomplete.body)).toMatchObject({ code: "PREVISIT_VERIFICATION_INCOMPLETE" })
    const addRun = async (dimension: string, status: "done" | "no-data" | "skipped") => {
      const runId = `test-${dimension}`
      await workflow.startRun(task.id, { runId, dimension, quotaUsed: false })
      await workflow.finishRun(task.id, runId, status)
    }
    await addRun("risk_scan", "no-data")
    for (const dimension of ["dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents"]) {
      await addRun(dimension, "skipped")
    }
    await addRun("personnel", "no-data")
    await addRun("executive_risk", "skipped")
    const finalized = await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent(sessionId)}`, "PUT", { reportMarkdown: report, status: "completed" })
    expect(finalized.status).toBe(200)
    expect(JSON.parse(finalized.body).task).toMatchObject({ state: "completed", reportReady: true })
    const listed = await call(`/previsit/api/tasks?sessionId=${encodeURIComponent(sessionId)}`)
    expect(listed.status).toBe(200)
    expect(JSON.parse(listed.body).tasks[0]).toMatchObject({ id: task.id, state: "completed", reportReady: true })
    expect(listed.body).not.toContain("reportMarkdown")

    const otherTask = await workflow.create({ id: "PV-20260911-WEB2", sessionId: otherSessionId, workspace: "/synthetic", query: "另一家合成公司", depth: "fast" })
    const legacyTask = await workflow.put({
      ...otherTask,
      id: "PV-20260911-WEB3",
      sessionId: "",
      workspace: "",
      query: "旧版来源缺失记录",
    })
    const allSessions = await call("/previsit/api/tasks")
    expect(allSessions.status).toBe(200)
    expect(JSON.parse(allSessions.body).tasks.map((item: { id: string }) => item.id).sort()).toEqual([legacyTask.id, otherTask.id, task.id].sort())
    expect(JSON.parse(listed.body).tasks.map((item: { id: string }) => item.id)).toEqual([task.id])
    expect((await call(`/previsit/api/tasks/${legacyTask.id}?sessionId=${encodeURIComponent(sessionId)}`)).status).toBe(403)

    const downloaded = await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent(sessionId)}`)
    expect(downloaded.status).toBe(200)
    expect(downloaded.headers["content-type"]).toContain("text/html")
    expect(downloaded.headers["content-disposition"]).toContain("filename*=UTF-8''")
    expect(downloaded.body).toContain("<!doctype html>")
    expect(downloaded.body).toContain("合成公司股份有限公司")
  })
})
