import { expect, it } from "vitest"
import { processingStatus } from "./processing-status.js"
const base = { running: true, error: undefined, waiting: false, querying: false, secondsSinceResult: 240 }
it("labels stale public activity and lets newer queries and failures take priority", () => {
  const input = { ...base, now: 300000, activity: { phase: "writing" as const, summary: "生成现场提问", updatedAt: new Date(1000).toISOString() } }
  expect(processingStatus(input).detail).toContain("可能已过时")
  expect(processingStatus(input).title).toContain("撰写尽调报告")
  expect(processingStatus({ ...input, querying: true }).title).toContain("查询")
  expect(processingStatus({ ...input, lastResultAt: 2000 }).title).not.toContain("撰写")
  expect(processingStatus({ ...input, running: false }).busy).toBe(false)
})
it("shows processing without fabricating progress percentages or thought text", () => {
  expect(processingStatus(base)).toMatchObject({ busy: true, title: expect.stringContaining("仍在处理"), detail: expect.stringContaining("240 秒") })
})
it("does not mistake an old task or timer for confirmed live execution", () => {
  expect(processingStatus({ ...base, running: undefined }).busy).toBe(false)
  expect(processingStatus({ ...base, running: undefined, querying: true }).busy).toBe(false)
  expect(processingStatus({ ...base, running: false }).title).toContain("已停止")
  expect(processingStatus({ ...base, error: "offline" }).title).toBe("状态同步异常")
  expect(processingStatus({ ...base, waiting: true }).title).toContain("主体确认")
})
