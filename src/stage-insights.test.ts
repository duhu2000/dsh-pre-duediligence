import { describe, expect, it } from "vitest"

import { opportunityDimensions, opportunitySteps, parseCardInsights, riskDimensions, riskSteps, type ToolEvent } from "./stage-insights.js"

const events: ToolEvent[] = [
  { name: "mcp__company__get_company_by_query", status: "done" },
  { name: "previsit_confirm_entity", status: "done" },
  { name: "mcp__company__get_company_registration_info", status: "done" },
  { name: "mcp__company__get_company_profile", status: "done" },
  { name: "mcp__company__get_annual_reports", status: "failed" },
  { name: "mcp__operation__get_bidding_info", status: "running" },
  { name: "mcp__risk__get_company_risk_scan", status: "done" },
  { name: "mcp__risk__get_judicial_documents", status: "done" },
]

const card = [
  "# 访前尽调报告 · 某某公司",
  "## 1、核心研判",
  "> 说明：一句话",
  "企业处于**资本运作期**，机会方向是募集资金专户。",
  "状态置信度：中高｜主要依据：[F-001]",
  "## 2、产业定位",
  "- 产业链环节：下游应用（商业查询 SaaS）[F-002]",
  "## 4、业务假设",
  "### H1 · P0 · 上市前需要资金归集与结算行（推理说明）",
  "- 支持证据：…",
  "### H2 · P1 · 招聘扩张带来代发需求（推理说明）",
  "## 5、红线提示",
  "| 等级 | 风险事实与边界 | 对拜访策略的影响 |",
  "| --- | --- | --- |",
  "| 红线 | 无 | — |",
  "| 关注 | 司法诉讼活跃：裁判文书 89 [F-016] | 会前内部核实 |",
  "| 信息 | 无股权出质记录 | 材料核验即可 |",
  "## 6、现场必问",
  "1. 问题",
  "## 8、覆盖说明",
  "- 已覆盖：工商",
].join("\n")

describe("维度翻译", () => {
  it("把工具名翻译成业务维度并保留状态", () => {
    expect(opportunityDimensions(events)).toEqual([
      { label: "主体锚定", status: "done" },
      { label: "工商登记", status: "done" },
      { label: "企业画像", status: "done" },
      { label: "年报", status: "failed" },
      { label: "招投标", status: "running" },
    ])
    expect(riskDimensions(events)).toEqual([
      { label: "风险扫描", status: "done" },
      { label: "司法文书", status: "done" },
    ])
  })
})

describe("parseCardInsights", () => {
  it("抽出状态、置信度、产业链环节、假设与风险分级", () => {
    const i = parseCardInsights(card)
    expect(i.found).toBe(true)
    expect(i.state).toBe("资本运作期")
    expect(i.confidence).toBe("中高")
    expect(i.industryLink).toBe("下游应用（商业查询 SaaS）")
    expect(i.hypotheses).toEqual([
      { id: "H1", priority: "P0", text: "上市前需要资金归集与结算行" },
      { id: "H2", priority: "P1", text: "招聘扩张带来代发需求" },
    ])
    expect(i.risks.map(r => r.level)).toEqual(["红线", "关注", "信息"])
    expect(i.risks[1]?.text).toBe("司法诉讼活跃：裁判文书 89")
    expect(i.sections).toContain("红线提示")
  })
  it("状态未定与空输入", () => {
    expect(parseCardInsights("## 1、核心研判\n状态未定，本卡降级为清单式简报。").stateUndetermined).toBe(true)
    expect(parseCardInsights(null).found).toBe(false)
  })
})

describe("阶段步骤", () => {
  it("运行中：按事件推进", () => {
    const steps = opportunitySteps(events, parseCardInsights(null), false)
    expect(steps.map(s => s.state)).toEqual(["done", "failed", "active", "idle"])
    const risk = riskSteps(events, parseCardInsights(null), false)
    expect(risk.map(s => s.state)).toEqual(["done", "done", "idle", "active"])
  })
  it("报告生成后：保留未执行步骤，展示已捕获的结论", () => {
    const steps = opportunitySteps(events, parseCardInsights(card), true)
    expect(steps.map(s => s.state)).toEqual(["done", "failed", "done", "done"])
    expect(steps[2]?.note).toBe("资本运作期")
    expect(steps[3]?.note).toBe("2 条")
    const risks = riskSteps(events, parseCardInsights(card), true)
    expect(risks[3]?.note).toBe("3 项")
    expect(risks[2]?.state).toBe("idle")
  })
  it("已返回但未归一的结果显示待核验，不再回落为未执行", () => {
    const pending: ToolEvent[] = [
      { name: "previsit_confirm_entity", status: "done" },
      { name: "mcp__company__get_company_profile", status: "unknown" },
      { name: "mcp__risk__get_company_risk_scan", status: "unknown" },
    ]
    expect(opportunitySteps(pending, parseCardInsights(card), true).map(step => step.state)).toEqual(["done", "review", "done", "done"])
    expect(riskSteps(pending, parseCardInsights(card), true).map(step => step.state)).toEqual(["review", "idle", "idle", "done"])
  })
})
