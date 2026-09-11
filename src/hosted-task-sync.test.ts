import { describe, expect, it } from "vitest"

import { hostedStatus, hostedTaskView, selectHostedTask, syncHostedTaskState, type HostedTask } from "./hosted-task-sync.js"
import type { ActiveTask } from "./previsit-store.js"
import { EMPTY_SESSION_STATE } from "./previsit-store.js"

const makeHosted = (overrides: Partial<HostedTask> = {}): HostedTask => ({
  id: "PVT-11111111-1111-4111-8111-111111111111",
  schemaVersion: 1,
  revision: 1,
  sessionId: "session-dsh-pre-duediligence-sync",
  workspace: "/tmp/workspace",
  query: "思必驰",
  depth: "fast",
  limit: 8,
  used: 0,
  state: "needs-entity-search",
  stage: "target",
  runs: [],
  reportReady: false,
  createdAt: "2026-09-11T12:00:00.000Z",
  updatedAt: "2026-09-11T12:00:00.000Z",
  ...overrides,
})

const active: ActiveTask = {
  id: "turn:7",
  prompt: "尽调思必驰",
  createdAt: "2026-09-11T12:00:20.000Z",
  nodeBaseline: 7,
  seenRunning: true,
  selection: { focus: [] },
}

describe("Host 任务接管", () => {
  it("原生对话未创建本地任务时仍认领当前 Session 最新任务", () => {
    const older = makeHosted({ id: "PVT-22222222-2222-4222-8222-222222222222", updatedAt: "2026-09-11T11:59:00.000Z" })
    const latest = makeHosted()
    expect(selectHostedTask([older, latest], undefined, [])?.id).toBe(latest.id)
  })

  it("将 turn 任务匹配到同时启动的 PVT 任务，且不重新认领已放弃任务", () => {
    const hosted = makeHosted()
    expect(selectHostedTask([hosted], active, [])?.id).toBe(hosted.id)
    expect(selectHostedTask([hosted], active, [hosted.id])).toBeNull()
  })

  it("按 Host 阶段驱动右侧视图和状态", () => {
    expect(hostedTaskView(makeHosted())).toBe("scope")
    expect(hostedTaskView(makeHosted({ state: "running", stage: "collect" }))).toBe("collect")
    expect(hostedTaskView(makeHosted({ state: "running", stage: "verify" }))).toBe("verify")
    expect(hostedTaskView(makeHosted({ state: "finalizing", stage: "output" }))).toBe("output")
    expect(hostedStatus(makeHosted({ state: "running", stage: "collect" }))).toBe("running")
    expect(hostedStatus(makeHosted({ state: "needs-entity-confirmation", stage: "target" }))).toBe("waiting-agent")
  })

  it("同步 PVT 任务、已锭定主体全称和资料采集视图", () => {
    const record = makeHosted({
      state: "running",
      stage: "collect",
      entity: { fullName: "思必驰科技股份有限公司", creditCode: "91320594668384120B" },
      runs: [{ id: "run-1", dimension: "profile", toolName: "mcp__company__get_company_profile", status: "running", quotaUsed: true, startedAt: "2026-09-11T12:00:30.000Z" }],
    })
    const result = syncHostedTaskState(
      { ...EMPTY_SESSION_STATE, company: "思必驰" },
      record,
      { id: "turn:7", prompt: active.prompt, nodeBaseline: 7 },
      true,
    )
    expect(result.task).toMatchObject({ id: record.id, captureId: "turn:7", nodeBaseline: 7, seenRunning: true })
    expect(result.company).toBe("思必驰科技股份有限公司")
    expect(result.view).toBe("collect")
  })
})
