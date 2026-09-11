import { describe, expect, it } from "vitest"

import { mountPrevisitWebRoutes, type WebServer } from "./previsit-web.js"
import { PrevisitWorkflowStore } from "./previsit-workflow.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
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
    const finalized = await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent(sessionId)}`, "PUT", { reportMarkdown: report, status: "completed" })
    expect(finalized.status).toBe(200)
    expect(JSON.parse(finalized.body).task).toMatchObject({ state: "completed", reportReady: true })
    const listed = await call(`/previsit/api/tasks?sessionId=${encodeURIComponent(sessionId)}`)
    expect(listed.status).toBe(200)
    expect(JSON.parse(listed.body).tasks[0]).toMatchObject({ id: task.id, state: "completed", reportReady: true })
    expect(listed.body).not.toContain("reportMarkdown")

    const downloaded = await call(`/previsit/api/tasks/${task.id}/report?sessionId=${encodeURIComponent(sessionId)}`)
    expect(downloaded.status).toBe(200)
    expect(downloaded.headers["content-type"]).toContain("text/html")
    expect(downloaded.headers["content-disposition"]).toContain("filename*=UTF-8''")
    expect(downloaded.body).toContain("<!doctype html>")
    expect(downloaded.body).toContain("合成公司股份有限公司")
  })
})
