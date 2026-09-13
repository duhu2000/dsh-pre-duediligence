import { expect, it } from "vitest"
import { processingStatus } from "./processing-status.js"
const base = { running: true, error: undefined, waiting: false, querying: false, secondsSinceResult: 240 }
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
