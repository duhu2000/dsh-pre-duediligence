import { afterEach, describe, expect, it, vi } from "vitest"
import { readFileSync } from "node:fs"

import { fetchHostedTask, fetchHostedTasks, hostedTaskListUrl } from "./hosted-task-api.js"
import type { HostedTask } from "./hosted-task-sync.js"

const historyTask = (overrides: Partial<HostedTask> = {}): HostedTask => ({
  id: "PV-20260913-HISTORY",
  schemaVersion: 1,
  revision: 4,
  sessionId: "session-dsh-pre-duediligence-history-12345678",
  workspace: "/workspace",
  query: "历史企业",
  depth: "fast",
  limit: 0,
  used: 3,
  state: "completed",
  stage: "output",
  entity: { fullName: "历史企业有限公司", creditCode: "91320000TEST000001" },
  runs: [],
  reportReady: true,
  artifact: { id: "artifact-1", format: "html", fileName: "历史报告.html", mediaType: "text/html; charset=utf-8", createdAt: "2026-09-13T01:04:00.000Z" },
  createdAt: "2026-09-13T01:00:00.000Z",
  updatedAt: "2026-09-13T01:05:00.000Z",
  completedAt: "2026-09-13T01:05:00.000Z",
  ...overrides,
})

describe("访前任务历史范围", () => {
  afterEach(() => { vi.unstubAllGlobals() })

  it("当前任务按 Session 查询，历史页不带 Session 过滤并汇总全部记录", async () => {
    const fetchMock = vi.fn(async () => ({
      ok: true,
      json: async () => ({ ok: true, tasks: [] }),
    } as Response))
    vi.stubGlobal("fetch", fetchMock)

    const current = { kind: "current", sessionId: "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc" } as const
    const history = { kind: "profile-history" } as const
    expect(hostedTaskListUrl(current)).toContain("?sessionId=")
    expect(hostedTaskListUrl(history)).toBe("/previsit/api/tasks")

    await fetchHostedTasks(current)
    await fetchHostedTasks(history)

    expect(fetchMock).toHaveBeenNthCalledWith(
      1,
      "/previsit/api/tasks?sessionId=session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc",
      { headers: { accept: "application/json" } },
    )
    expect(fetchMock).toHaveBeenNthCalledWith(2, "/previsit/api/tasks", { headers: { accept: "application/json" } })
  })

  it("按历史记录自己的 Session 读取详情，不绑定到当前会话", async () => {
    const record = historyTask({ reportMarkdown: "# 历史报告" })
    const fetchMock = vi.fn(async () => ({ ok: true, status: 200, json: async () => ({ ok: true, task: record }) } as Response))
    vi.stubGlobal("fetch", fetchMock)

    await expect(fetchHostedTask(record.id, record.sessionId)).resolves.toEqual(record)
    expect(fetchMock).toHaveBeenCalledWith(
      `/previsit/api/tasks/${record.id}?sessionId=${record.sessionId}`,
      { headers: { accept: "application/json" } },
    )
  })

  it("历史清单接入恢复详情、返回清单与报告下载动作", () => {
    const source = readFileSync(new URL("./workbench-v2.tsx", import.meta.url), "utf8")
    expect(source).toContain("qccPwHistoryCard")
    expect(source).toContain("openHistoryTask")
    expect(source).toContain("downloadHistoryReport")
    expect(source).toContain("返回清单")
    expect(source).toContain("旧记录缺少来源 Session")
  })
})
