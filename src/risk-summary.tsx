import { latestAnalysis } from "./analysis-records.js"
import type { HostedTask } from "./hosted-task-sync.js"
import { isRiskFindingText, type CardInsights } from "./stage-insights.js"

export function RiskSummary({ task, insights, running }: { task: HostedTask | null; insights: CardInsights; running: boolean }): JSX.Element {
  const live = latestAnalysis(task?.analysisRecords).filter(row => row.kind === "verification" && row.riskLevel)
  const published = Boolean(task?.reportReady || task?.reportMarkdown) && insights.sections.includes("红线提示")
  const available = published || live.length > 0
  return <section className="qccPwCard qccPwRiskSummary" aria-label="风险研判摘要">
    <h3>风险研判摘要</h3>
    <p className="qccPwNote">{published ? "已发布报告结论；下方保留在线核验过程与依据。" : available ? "阶段性判断 · 随已保存分析记录更新，尚非最终结论。" : running ? "风险分析中，暂未形成分级；不以查询完成推断无风险。" : "尚未取得风险分级，不代表红线为零。"}</p>
    {available ? <div className="qccPwRiskTiles">{(["红线", "关注", "信息"] as const).map(level => {
      const reportRows = insights.risks.filter(row => row.level === level)
      const unresolved = reportRows.some(row => /^(?:证据不足|结论未明确|尚未形成|待核验|未完成核验)/.test(row.text))
      const items = published ? reportRows.filter(row => isRiskFindingText(row.text) && !/^(?:证据不足|结论未明确|尚未形成|待核验|未完成核验)/.test(row.text)).map(row => ({id:row.text,title:"",text:row.text,time:"",refs:[] as string[]})) : live.filter(row => row.riskLevel === level).map(row => ({id:row.id,title:row.title,text:row.summary,time:row.updatedAt,refs:row.evidenceIds}))
      const noFinding = published && !unresolved && !items.length && reportRows.some(row => /^(?:无[。；;]?|本次.*未发现.*|未发现.*|暂无(?:红线|该级别事项).*)$/.test(row.text.trim()))
      return <article key={level} className="qccPwRiskTile" data-level={level} data-clear={noFinding} data-empty={!items.length}>
        <div className="qccPwRiskTileTop"><b>{level === "红线" ? "红线 · 优先核实" : level}</b><strong>{items.length ? items.length : noFinding ? `本次核验未发现${level === "红线" ? "红线" : "该级别事项"}` : running && !task?.reportReady ? "分析中" : "结论未明确"}</strong></div>
        {items.map(row => <div key={row.id}><h4>{row.title}</h4><p>{row.text}</p>{row.time ? <p>更新时间：{row.time}</p> : null}{row.refs.length ? <details><summary>证据引用</summary><ul>{row.refs.map(ref=><li key={ref}>{ref}</li>)}</ul></details> : null}</div>)}
        {!items.length ? <p>{noFinding ? "本次报告明确未发现该级别事项；仅限已核验范围，不代表风险绝对不存在。" : running && !task?.reportReady ? "正在整理该级别结论。" : "报告未提供可识别的该级别结论，可查看原报告或继续补充核验；不代表任务仍在运行，也不能解释为零风险。"}</p> : null}
      </article>
    })}</div> : null}
  </section>
}
