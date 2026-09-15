import { describe, expect, it, vi } from "vitest"
vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({ Button: () => null }))
import { renderToStaticMarkup } from "react-dom/server"
import { OpportunityPanel, RiskPanel } from "./workbench-v2.js"
import { RiskSummary } from "./risk-summary.js"
import { CollectionCards } from "./analysis-panels.js"
import { parseAnalysisRecord } from "./analysis-records.js"
import { parseCardInsights } from "./stage-insights.js"
import type { HostedTask } from "./hosted-task-sync.js"

const entry = {id:"R1",kind:"verification" as const,title:"合成风险",status:"partial" as const,summary:"仅有部分证据",support:["合成支持"],counter:[],unknown:["金额未知"],nextAction:"补查",evidenceIds:["run-1"],revision:1,updatedAt:"2026-09-15T00:00:00Z",riskLevel:"红线" as const}
const task = {runs:[{id:"run-1",dimension:"profile",status:"done",startedAt:"2026-09-15",result:{summary:"客观来源摘要",facts:[],factors:[]}}],analysisRecords:[entry,{...entry,id:"H1",kind:"hypothesis",riskLevel:undefined,title:"订单增长假设"}]} as unknown as HostedTask
describe("collection and verification boundaries", () => {
  it("keeps hypotheses and report-derived judgments out of collection, puts risk first", () => {
    const props = {task:undefined,hostedTask:task,status:"running" as const,events:[],insights:parseCardInsights(null)}
    const collect = renderToStaticMarkup(<OpportunityPanel {...props} />)
    expect(collect).toContain("客观来源摘要")
    expect(collect).not.toContain("订单增长假设")
    expect(collect).not.toContain("证据引用与修订历史")
    const verify = renderToStaticMarkup(<RiskPanel {...props} />)
    expect(verify).toContain("订单增长假设")
    expect(verify).not.toContain("客观来源摘要")
    expect(verify.indexOf("风险研判摘要")).toBeLessThan(verify.indexOf("核验发现与未解决事项"))
    expect(verify).toContain("机会假设与证据验证")
  })
  it("does not imply zero risk before classification and updates latest revision", () => {
    const insights = parseCardInsights(null)
    const pending = renderToStaticMarkup(<RiskSummary task={null} insights={insights} running />)
    expect(pending).toContain("暂未形成分级")
    expect(pending).not.toContain("本次未发现")
    const revised = {...task,analysisRecords:[entry,{...entry,riskLevel:"关注" as const,revision:2,summary:"已降低分级"}]}
    const html = renderToStaticMarkup(<RiskSummary task={revised} insights={insights} running />)
    expect(html).toContain("已降低分级")
    expect(html).not.toContain("仅有部分证据")
    expect(html).toContain("阶段性判断")
  })
  it("requires evidence for classification and preserves unclassified records", () => {
    expect(parseAnalysisRecord(entry).riskLevel).toBe("红线")
    expect(()=>parseAnalysisRecord({...entry,evidenceIds:[]})).toThrow()
    expect(()=>parseAnalysisRecord({...entry,kind:"hypothesis"})).toThrow()
    const {riskLevel:_,...unclassified}=entry
    expect(parseAnalysisRecord(unclassified).riskLevel).toBeUndefined()
  })
  it("condenses skipped queries without missing-summary warnings", () => {
    const skipped = {...task,runs:[{id:"skip",dimension:"dishonest",status:"skipped" as const,quotaUsed:false,startedAt:"2026-09-15",message:"扫描计数为0，无需下钻"}]}
    const html=renderToStaticMarkup(<CollectionCards task={skipped} verification />)
    expect(html).toContain("扫描计数为0")
    expect(html).not.toContain("暂未提取到业务摘要")
    expect(html).not.toContain("0 项字段")
  })
})
