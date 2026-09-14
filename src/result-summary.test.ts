import { describe, expect, it } from "vitest"
import { summarizeResult } from "./result-summary.js"

describe("persistable provider facts", () => {
  it("extracts nested business samples and structured text without retaining secrets", () => {
    const result = summarizeResult({ content: [{ type: "text", text: JSON.stringify({ data: { 企业名称: "合成公司", total: 490, records: [{ 项目名称: "合成中标项目", 中标金额: "100万元", 公告日期: "2026-09-14", token: "secret" }] } }) }] })
    expect(result.facts.join("\n")).toContain("490")
    expect(result.facts.join("\n")).toContain("合成中标项目")
    expect(result.facts.join("\n")).toContain("2026-09-14")
    expect(result.facts.join("\n")).not.toContain("secret")
  })
  it("preserves all nonzero and zero scan counts independently of dispatch routes", () => {
    const result = summarizeResult({ data: { 摘要: "扫描完成", 风险因子扫描: [{ 风险因子: "破产重整", 条目数: 2 }, { 风险因子: "失信信息", 条目数: 0 }, { 风险因子: "终本案件", 条目数: "141" }] } })
    expect(result.factors).toEqual([{ name: "破产重整", count: 2 }, { name: "失信信息", count: 0 }, { name: "终本案件", count: 141 }])
    expect(result.summary).toBe("扫描完成")
  })
  it("does not coerce unknown counts into zero and bounds text", () => {
    expect(summarizeResult({ 风险因子: "未知", 条目数: null }).factors).toEqual([])
    expect(summarizeResult({ 摘要: "a".repeat(5000) }).summary).toHaveLength(1800)
    expect(summarizeResult({ 主营业务: "合成业务", token: "never retain" }).facts).toEqual(["主营业务：合成业务"])
  })
  it("handles cyclic and empty provider values within a traversal budget", () => {
    const cycle: Record<string, unknown> = {}; cycle.self = cycle
    expect(summarizeResult(cycle).factors).toEqual([])
    expect(summarizeResult(null).facts).toEqual([])
  })
})
