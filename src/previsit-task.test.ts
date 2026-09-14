import { describe, expect, it } from "vitest"
import { REPORT_SECTIONS, derivePlans, deriveTasks, latestDimensions, planConfirmationMessage, taskTitle } from "./previsit-task.js"

const result = (name: string, value: unknown) => ({ kind: "tool-result", call: { name }, content: [{ type: "text", text: JSON.stringify(value) }] })
const report = "# 访前尽调报告 · 苏州科达科技股份有限公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((s, i) => `## ${i + 1}、${s}\n合成内容`).join("\n")

describe("任务对象由宿主工具结果投影而来", () => {
  it("原生 message 节点保留发起意图，同一次任务和图片计划重试不会重复投影", () => {
    const plan = result("previsit_extract_image_companies", { planId: "plan-1", candidates: [{ name: "合成甲公司" }] })
    const begin = result("previsit_begin", { taskId: "t-1", planId: "plan-1", query: "合成甲公司", unlimited: true, used: 0 })
    const nodes = [{ kind: "message", message: { role: "user", content: [{ type: "text", text: "尽调合成甲公司" }] } }, plan, plan, begin, begin]
    expect(derivePlans({ nodes })).toHaveLength(1)
    expect(derivePlans({ nodes })[0]?.taskIds).toEqual(["t-1"])
    expect(deriveTasks({ nodes })).toHaveLength(1)
    expect(deriveTasks({ nodes })[0]?.prompt).toBe("尽调合成甲公司")
    expect(deriveTasks({ nodes })[0]?.limit).toBe(0)
  })
  it("一次完整尽调：简报、主体、维度、预算与报告都挂在同一个任务上", () => {
    const nodes = [
      { kind: "user", text: "我是银行对公客户经理，准备首次拜访科达科技，请重点看风险与涉诉，做一次速览尽调。" },
      result("previsit_begin", { taskId: "t-1", query: "科达科技", depth: "fast", limit: 8, used: 0, role: "银行对公客户经理", scene: "首次拜访", focus: ["风险与涉诉"], output: "一页纸简报", startedAt: "2026-09-09T01:00:00.000Z", status: "needs-entity-search" }),
      result("previsit_query", { taskId: "t-1", dimension: "entity_search", toolName: "mcp__company__get_company_by_query", outcome: "done", used: 1, limit: 8, data: { 候选: [{ 名称: "苏州科达科技股份有限公司" }, { 名称: "山西科达工业互联科技有限公司" }] } }),
      { kind: "assistant", text: "请回复序号" },
      { kind: "user", text: "1" },
      result("previsit_confirm_entity", { taskId: "t-1", entity: { fullName: "苏州科达科技股份有限公司", creditCode: "91320500761504983A" }, status: "entity-confirmed" }),
      result("previsit_query", { taskId: "t-1", dimension: "risk_scan", toolName: "mcp__risk__get_company_risk_scan", outcome: "done", used: 2, limit: 8, data: {} }),
      result("previsit_query", { taskId: "t-1", dimension: "judicial_documents", outcome: "not-executed", reason: "扫描返回零记录，不下钻", used: 2, limit: 8 }),
      result("previsit_query", { taskId: "t-1", dimension: "judicial_documents", toolName: "mcp__risk__get_judicial_documents", outcome: "done", used: 3, limit: 8, data: {} }),
      { kind: "assistant", text: report },
    ]
    const [task] = deriveTasks({ nodes })
    expect(task).toBeDefined()
    expect(task!.id).toBe("t-1")
    expect(task!.prompt).toContain("我是银行对公客户经理")
    expect(task!.role).toBe("银行对公客户经理")
    expect(task!.focus).toEqual(["风险与涉诉"])
    expect(task!.candidateCount).toBe(2)
    expect(task!.entity).toEqual({ fullName: "苏州科达科技股份有限公司", creditCode: "91320500761504983A" })
    expect(task!.used).toBe(3)
    expect(task!.limit).toBe(8)
    expect(latestDimensions(task!).map(d => `${d.label}:${d.outcome}`)).toEqual(["主体检索:done", "风险扫描:done", "裁判文书:done"])
    expect(task!.report).toContain("核心研判")
    expect(task!.stage).toBe("reported")
    expect(taskTitle(task!)).toBe("苏州科达科技股份有限公司")
  })
  it("第二次 previsit_begin 开启新任务，旧任务的报告边界到此为止；缺报告时按阶段标记", () => {
    const nodes = [
      { kind: "user", text: "尽调 A 公司" },
      result("previsit_begin", { taskId: "t-1", query: "A 公司", depth: "standard", limit: 18, used: 0 }),
      { kind: "assistant", text: report },
      { kind: "user", text: "再看 B 公司" },
      result("previsit_begin", { taskId: "t-2", query: "B 公司", depth: "fast", limit: 8, used: 0 }),
      result("previsit_query", { taskId: "t-2", dimension: "entity_search", outcome: "done", used: 1, limit: 8, data: [] }),
    ]
    const tasks = deriveTasks({ nodes })
    expect(tasks.map(t => t.id)).toEqual(["t-1", "t-2"])
    expect(tasks[0]!.endIndex).toBe(4)
    expect(tasks[0]!.stage).toBe("reported")
    expect(tasks[1]!.report).toBeNull()
    expect(tasks[1]!.stage).toBe("anchoring")
    expect(taskTitle(tasks[1]!)).toBe("B 公司")
  })
  it("图片识别工具直接登记的计划也被投影为计划", () => {
    const nodes = [
      { kind: "user", text: "请识别我刚导入的商机图片…安全图片凭证：pvi-1" },
      result("previsit_extract_image_companies", { commandId: "pvi-1", fileName: "名单.png", entries: ["甲公司", "乙公司"], planId: "p-img", candidates: [{ name: "甲公司", source: "图片「名单.png」第 1 项" }, { name: "乙公司", source: "图片「名单.png」第 2 项" }], createdAt: "2026-09-09T03:00:00.000Z", note: "来自商机图片「名单.png」，识别出 2 家", status: "awaiting-selection" }),
    ]
    const [plan] = derivePlans({ nodes })
    expect(plan).toMatchObject({ id: "p-img", note: "来自商机图片「名单.png」，识别出 2 家", taskIds: [] })
    expect(plan!.candidates.map(c => c.name)).toEqual(["甲公司", "乙公司"])
  })
  it("没有宿主事件时没有任务；不会把普通消息认成任务", () => {
    expect(deriveTasks({ nodes: [{ kind: "user", text: "1" }, { kind: "assistant", text: "好的" }] })).toEqual([])
  })
})

describe("\u8ba1\u5212\u786e\u8ba4\u6d88\u606f", () => {
  it("\u9996\u884c\u5e26\u5b8c\u6574 planId\uff0c\u6a21\u578b\u7167\u6284\u5373\u53ef\u8c03 previsit_begin", () => {
    const plan = { id: "6fe5c1c3-75c6-49b7-9ba4-d353b31d387c", candidates: [{ name: "\u7532\u516c\u53f8", source: undefined }], note: undefined, createdAt: undefined, index: 0, taskIds: [] }
    const message = planConfirmationMessage(plan, { candidates: ["\u7532\u516c\u53f8"], depth: "fast", focus: [], output: "\u4e00\u9875\u7eb8\u7b80\u62a5", sections: [...REPORT_SECTIONS] })
    expect(message.split("\n")[0]).toBe("确认尽调计划 6fe5c1c3-75c6-49b7-9ba4-d353b31d387c：")
    expect(message).toContain("entities=1")
  })
})
