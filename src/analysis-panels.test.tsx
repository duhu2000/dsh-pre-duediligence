import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { AnalysisPanel, CollectionCards } from "./analysis-panels.js"
import { parseAnalysisRecord, latestAnalysis } from "./analysis-records.js"
import { parseCardInsights } from "./stage-insights.js"
import type { HostedTask } from "./hosted-task-sync.js"

describe("readable evidence panels", () => {
  it("separates risk detail from collection and exposes all collection dimensions", () => {
    const task = { runs: ["patents", "shareholders", "bidding", "judicial_documents"].map(dimension => ({ id: dimension, dimension, status: "done", startedAt: "2026-09-14", result: { summary: "合成摘要", facts: ["记录数：492", "企业名称：合成公司"], factors: [] } })) } as unknown as HostedTask
    const html = renderToStaticMarkup(<CollectionCards task={task} />)
    expect(html).toContain("492")
    expect(html).toContain("专利")
    expect(html).not.toContain("judicial_documents")
    expect(html).toContain("<details>")
    expect(html).toContain("记录总数不等于已逐条核查")
    expect(renderToStaticMarkup(<CollectionCards task={task} verification />)).toContain("judicial_documents")
  })
  it("shows legacy hypotheses as unverified and escapes provider text", () => {
    const insights = parseCardInsights("# 报告\n## 4、业务假设\n### 假设 1（优先）：需要验证需求\n## 5、红线提示\n无")
    expect(insights.hypotheses[0]?.id).toBe("H1")
    const html = renderToStaticMarkup(<AnalysisPanel task={null} kind="hypothesis" legacy={[{id:"H1", priority:"",text:"<script>alert(1)</script>"}]} />)
    expect(html).toContain("未保存过程证据")
    expect(html).not.toContain("<script>")
  })
  it("rejects unsupported verdicts and keeps latest revision with history available", () => {
    const input = { id:"H1",kind:"hypothesis",status:"pending",title:"合成假设",summary:"等待补充",support:[],counter:[],unknown:["金额未知"],nextAction:"现场询问",evidenceIds:[] }
    expect(() => parseAnalysisRecord({...input,status:"supported"})).toThrow()
    expect(() => parseAnalysisRecord({...input,status:"toString"})).toThrow()
    const first = {...parseAnalysisRecord(input),revision:1,updatedAt:"2026-09-14"}
    const second = {...first,revision:2,summary:"新增证据不足以判断"}
    expect(latestAnalysis([first,second])).toEqual([second])
    const html = renderToStaticMarkup(<AnalysisPanel task={{runs:[],analysisRecords:[first,second]} as unknown as HostedTask} kind="hypothesis" />)
    expect(html).toContain("V1")
    expect(html).toContain("V2")
    expect(html).toContain("金额未知")
  })
})
