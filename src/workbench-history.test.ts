import { afterEach, describe, expect, it, vi } from "vitest"

import { fetchHostedTasks, hostedTaskListUrl } from "./hosted-task-api.js"

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
})
