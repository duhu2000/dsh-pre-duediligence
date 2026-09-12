import { describe, expect, it } from "vitest"

import { hostedLiveProgress, hostedProgressCopy, hostedStatus, hostedTaskView, hostedToolEvents, latestHostedRuns, selectHostedTask, syncHostedTaskState, type HostedTask } from "./hosted-task-sync.js"
import type { ActiveTask } from "./previsit-store.js"
import { EMPTY_SESSION_STATE } from "./previsit-store.js"
import { derivePhaseStates } from "./workbench-state.js"

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
    expect(hostedTaskView(makeHosted({ state: "finalizing", stage: "output" }))).toBe("scope")
    expect(hostedTaskView(makeHosted({
      state: "finalizing",
      stage: "output",
      entity: { fullName: "思必驰科技股份有限公司", creditCode: "91320594668384120B" },
      runs: [{ id: "risk-1", dimension: "risk_scan", status: "done", quotaUsed: true, startedAt: "2026-09-11T12:01:00.000Z" }],
    }))).toBe("verify")
    expect(hostedTaskView(makeHosted({
      state: "finalizing",
      stage: "output",
      entity: { fullName: "思必驰科技股份有限公司", creditCode: "91320594668384120B" },
      runs: [{ id: "profile-1", dimension: "profile", status: "done", quotaUsed: true, startedAt: "2026-09-11T12:01:00.000Z" }],
    }))).toBe("collect")
    expect(hostedTaskView(makeHosted({ state: "completed", stage: "output", reportReady: true }))).toBe("output")
    expect(hostedStatus(makeHosted({ state: "running", stage: "collect" }))).toBe("running")
    expect(hostedStatus(makeHosted({ state: "needs-entity-confirmation", stage: "target" }))).toBe("waiting-agent")
    expect(hostedStatus(makeHosted({ state: "finalizing", stage: "output", reportReady: true, completedAt: "2026-09-11T12:05:00.000Z" }))).toBe("ready")
  })

  it("只在候选主体阶段提示确认，主体锚定后显示真实查询与报告整理进度", () => {
    expect(hostedProgressCopy(makeHosted({ state: "needs-entity-confirmation" }))).toMatchObject({ title: "等待确认拜访客户" })
    expect(hostedProgressCopy(makeHosted({
      state: "running",
      stage: "collect",
      used: 4,
      entity: { fullName: "思必驰科技股份有限公司", creditCode: "91320594668384120B" },
    }))).toEqual({ title: "正在尽调", detail: "主体已确认，已同步 4 次查询；资料采集与证据核验状态会随执行更新。" })
    expect(hostedProgressCopy(makeHosted({
      state: "finalizing",
      stage: "output",
      used: 8,
      entity: { fullName: "思必驰科技股份有限公司", creditCode: "91320594668384120B" },
    }))).toEqual({ title: "正在整理报告", detail: "主体已确认，已完成 8 次查询；正在整理一页纸简报，生成后即可下载。" })
  })

  it("按当前工具调用展示真实进度，并在查询间隙明确说明正在研判", () => {
    const running = makeHosted({
      state: "running",
      stage: "collect",
      used: 2,
      entity: { fullName: "思必驰科技股份有限公司", creditCode: "91320594668384120B" },
      runs: [
        { id: "profile-1", dimension: "profile", status: "done", quotaUsed: true, startedAt: "2026-09-11T12:00:10.000Z", completedAt: "2026-09-11T12:00:20.000Z" },
        { id: "annual-1", dimension: "annual_reports", status: "running", quotaUsed: true, startedAt: "2026-09-11T12:01:50.000Z" },
      ],
    })
    expect(hostedLiveProgress(running, new Date("2026-09-11T12:02:05.000Z").getTime())).toMatchObject({
      title: "正在查询：企业年报",
      current: "企业年报",
      queryCount: 2,
      completedCount: 1,
      elapsed: "2 分 5 秒",
    })

    const reasoning = { ...running, runs: running.runs.map((run) => ({ ...run, status: "done" as const })) }
    expect(hostedLiveProgress(reasoning, new Date("2026-09-11T12:02:05.000Z").getTime())).toMatchObject({
      title: "本轮查询已返回，正在研判与整理",
      current: null,
      queryCount: 2,
      completedCount: 2,
    })
  })

  it("同一业务维度只投影最新运行，旧待处理记录不再把已完成阶段染黄", () => {
    const task = makeHosted({
      state: "completed",
      stage: "output",
      reportReady: true,
      runs: [
        { id: "risk-old", dimension: "risk_scan", toolName: "mcp__qcc_risk__get_company_risk_scan", status: "unknown", quotaUsed: false, startedAt: "2026-09-11T12:00:10.000Z" },
        { id: "risk-new", dimension: "risk_scan", toolName: "mcp__qcc-risk__get_company_risk_scan", status: "done", quotaUsed: true, startedAt: "2026-09-11T12:00:20.000Z", completedAt: "2026-09-11T12:00:30.000Z" },
        { id: "executive", dimension: "executive_risk", status: "no-data", quotaUsed: true, startedAt: "2026-09-11T12:00:40.000Z", completedAt: "2026-09-11T12:00:50.000Z" },
      ],
    })
    expect(latestHostedRuns(task).map((run) => [run.dimension, run.status])).toEqual([
      ["risk_scan", "done"],
      ["executive_risk", "no-data"],
    ])
    const events = hostedToolEvents(task)
    expect(events.some((event) => event.status === "unknown")).toBe(false)
    expect(events).toContainEqual({ name: "get_executive_risk_scan", status: "no-data" })
    expect(derivePhaseStates({
      hasTask: true,
      running: false,
      seenRunning: true,
      lastAgentError: null,
      partial: false,
      toolNames: [],
      toolEvents: events,
      reportReady: true,
    }).find(phase => phase.id === "verify")?.progress).toBe("done")
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
    expect(result.task).toMatchObject({ id: record.id, captureId: "turn:7", company: "思必驰科技股份有限公司", nodeBaseline: 7, seenRunning: true })
    expect(result.company).toBe("思必驰科技股份有限公司")
    expect(result.view).toBe("collect")
  })

  it("任务开始后以 Host 检索词覆盖继续变化的表单草稿", () => {
    const result = syncHostedTaskState(
      { ...EMPTY_SESSION_STATE, company: "苏州恒琪", task: { ...active, company: "苏州恒琪" } },
      makeHosted({ query: "苏州" }),
      { id: "turn:7", prompt: active.prompt, nodeBaseline: 7 },
      true,
    )
    expect(result.company).toBe("苏州")
    expect(result.task?.company).toBe("苏州")
  })
})
