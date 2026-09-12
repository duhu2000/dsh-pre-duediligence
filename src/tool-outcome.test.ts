import { describe, expect, it } from "vitest"
import { classifyQccProviderOutcome, classifyToolOutcome, resultOutcome } from "./tool-outcome.js"
import { opportunityDimensions, riskSteps, parseCardInsights } from "./stage-insights.js"
import { derivePhaseStates } from "./workbench-state.js"

describe("provider outcome facts", () => {
  it.each([
    [{ data: [] }, "no-data"], [{ data: [{ name: "synthetic" }] }, "done"],
    [{ code: 403 }, "no-permission"], [{ code: "UNKNOWN_TOOL" }, "not-executed"],
    [{ success: false }, "failed"], ["查询完成", "unknown"], [{}, "unknown"],
    [{ status: "failed", total: 0 }, "failed"],
    [{ status: "no-permission", count: 0 }, "no-permission"],
    [{ status: "not-executed", data: [] }, "not-executed"],
    [{ status: "skipped", reason: "无需执行" }, "skipped"],
  ])("classifies explicit signals without inferring success from prose", (value, expected) => {
    expect(classifyToolOutcome(value)).toBe(expected)
  })
  it("reads durable structured content and preserves an error despite an empty data array", () => {
    expect(resultOutcome({ content: [{ type: "text", text: '{"data":[]}' }] })).toBe("no-data")
    expect(classifyToolOutcome([], true)).toBe("failed")
  })
  it("recognizes the real QCC Chinese response contract without turning transport success amber", () => {
    expect(classifyQccProviderOutcome({ "企业名称": "合成甲公司", "摘要": "已完成查询", "工商登记": { "法定代表人": "张三" } })).toBe("done")
    expect(classifyQccProviderOutcome({ "企业名称": "合成甲公司", "搜索结果": "已全量扫描该主体数据库，未发现任何记录。" })).toBe("no-data")
    expect(classifyQccProviderOutcome({ "搜索结果": "当前账户权限不足" })).toBe("no-permission")
    expect(classifyQccProviderOutcome({ "地域限制": "暂不支持" })).toBe("failed")
    expect(classifyQccProviderOutcome({})).toBe("unknown")
  })
  it("does not hide a failed latest retry behind an earlier success", () => {
    const name = "get_company_profile"
    expect(opportunityDimensions([{ name, status: "done" }, { name, status: "no-permission" }])).toEqual([{ label: "企业画像", status: "no-permission" }])
  })
  it("never explains an unexecuted drill-down as zero records without evidence", () => {
    const steps = riskSteps([], parseCardInsights("## 核心研判\n未定\n## 覆盖说明\n风险服务未接入"), true)
    expect(steps.every(s => s.state !== "done")).toBe(true)
    expect(steps[1]?.note ?? "").not.toContain("零记录")
  })
  it("不隐藏最新失败，并将已生成报告中的部分阶段标记待处理", () => {
    const phases = derivePhaseStates({
      hasTask: true, running: false, seenRunning: true, lastAgentError: null, partial: false,
      toolNames: [], reportReady: true,
      toolEvents: [
        { name: "get_company_profile", status: "done" },
        { name: "get_company_profile", status: "failed" },
        { name: "get_company_risk_scan", status: "done" },
      ],
    })
    expect(phases.find(p => p.id === "collect")?.progress).toBe("review")
    expect(phases.find(p => p.id === "verify")?.progress).toBe("done")
  })
})
