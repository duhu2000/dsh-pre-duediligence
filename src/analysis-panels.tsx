import { ANALYSIS_STATUSES, latestAnalysis } from "./analysis-records.js"
import type { HostedTask } from "./hosted-task-sync.js"
import { dimensionLabel } from "./hosted-task-sync.js"
import { TOOL_OUTCOME_LABELS } from "./tool-outcome.js"
import type { Hypothesis } from "./stage-insights.js"

export const verificationDimension = (dimension: string) => /risk|dishonest|enforcement|terminated|freeze|exception|penalty|tax|judicial/.test(dimension)

export function CollectionCards({ task, verification = false }: { task: HostedTask | null; verification?: boolean }): JSX.Element {
  const runs = [...new Map((task?.runs ?? []).filter(run => run.dimension !== "entity_search" && verificationDimension(run.dimension) === verification).map(run => [run.dimension, run])).values()]
  const skipped = runs.filter(run => run.status === "skipped")
  return <><div className="qccPwSummaryGrid">{runs.filter(run => run.status !== "skipped" && run.dimension !== "risk_scan").map(run => {
    const facts = (run.result?.facts ?? []).filter(fact => !/^(企业名称|摘要|summary)：/.test(fact))
    const priority = /记录数|总数|总条数|年度|参保|主营|行业|轮次|融资|金额|日期|变更项目|项目名称|职位|状态/
    const keyFacts = facts.filter(fact => !fact.includes("[") && priority.test(fact)).slice(0, 3)
    const highlights = keyFacts.length ? keyFacts : facts.slice(0, 3)
    return <article className="qccPwCard" key={run.id}>
      <div className="qccPwCardHeader"><h3>{dimensionLabel(run.dimension)}</h3><span className="qccPwMode">{TOOL_OUTCOME_LABELS[run.status]}</span></div>
      <p>{run.result?.summary || (run.status === "no-data" ? "本次查询未发现记录。" : facts.length ? "已取得来源信息，关键字段如下；尚非最终研判。" : "暂未提取到业务摘要；不代表无数据。")}</p>
      {highlights.length ? <ul>{highlights.map(fact => <li key={fact}>{fact.length > 160 ? fact.slice(0, 160) + "…" : fact}</li>)}</ul> : null}
      <p className="qccPwNote">覆盖边界：仅展示本次返回的摘要与有限样本；记录总数不等于已逐条核查。未展示字段可在原会话工具结果中查看。</p>
      {run.message ? <p className="qccPwNote">{run.message}</p> : null}
      <details><summary>来源与已保存明细（{facts.length} 项字段）</summary><p className="qccPwNote">来源：{run.toolName ?? run.dimension} · {run.completedAt ?? run.startedAt} · 引用 {run.id}</p><ul>{facts.map(fact => <li key={fact}>{fact}</li>)}</ul></details>
    </article>
  })}</div>{skipped.length ? <div className="qccPwCard"><h4>无需执行 · {skipped.length} 项</h4><ul>{skipped.map(run => <li key={run.id}>{dimensionLabel(run.dimension)}{["风险扫描为 0，无需下钻", "扫描计数为0，无需下钻"].includes(run.message ?? "") ? "：本次扫描未发现相关记录" : null}</li>)}</ul></div> : null}</>
}

export function AnalysisPanel({ task, kind, legacy = [] }: { task: HostedTask | null; kind: "verification" | "hypothesis"; legacy?: Hypothesis[] }): JSX.Element {
  const history = (task?.analysisRecords ?? []).filter(record => record.kind === kind)
  const records = latestAnalysis(history)
  return <section className="qccPwCard">
    <h3>{kind === "verification" ? "核验发现与未解决事项" : "机会假设与证据验证"}</h3>
    <p className="qccPwNote">{kind === "verification" ? "区分事实支持、反证与证据缺口；执行完成不等于结论通过。" : "把已取得的信息转化为可验证的拜访问题；不是授信、合作或投资结论。"}</p>
    {!records.length ? <p>{legacy.length ? "以下仅为旧报告提取，未保存过程证据，不标记核验完成。" : "尚未保存结构化分析。查询结果可先查阅；不会以工具完成代替核验结论。"}</p> : null}
    {!records.length ? legacy.map(row => <p key={row.id}>{row.id} · {row.text}（待验证）</p>) : null}
    {records.map(record => <article className="qccPwAnalysis" key={record.id}>
      <div className="qccPwCardHeader"><h4>{record.title}</h4><span className="qccPwMode" data-tone={["insufficient", "contradicted", "onsite"].includes(record.status) ? "review" : undefined}>{ANALYSIS_STATUSES[record.status]}</span></div>
      <p>{record.summary}</p>
      {([["支持", record.support], ["反证", record.counter], ["未知与缺口", record.unknown]] as const).map(([label, items]) => <div key={label}><b>{label}</b>{items.length ? <ul>{items.map((item, index) => <li key={index}>{item}</li>)}</ul> : <p className="qccPwNote">尚未记录（不代表不存在）</p>}</div>)}
      <p><b>{record.status === "onsite" ? "待客户确认：" : "下一步（按证据可得性继续核验或联系客户）："}</b>{record.nextAction}</p>
      <details><summary>证据引用与修订历史 · V{record.revision}</summary>
        {history.filter(row => row.id === record.id).map(row => <div key={row.revision}><p>V{row.revision} · {row.updatedAt} · {ANALYSIS_STATUSES[row.status]}</p><p>{row.summary}</p><p>支持：{row.support.join("；") || "未记录"}；反证：{row.counter.join("；") || "未记录"}；未知：{row.unknown.join("；") || "未记录"}</p><p>下一步：{row.nextAction}</p><ul>{row.evidenceIds.map(ref => <li key={ref}>{ref} · {task?.runs.find(run => run.id === ref)?.dimension ?? "材料事实"}</li>)}</ul></div>)}
      </details>
    </article>)}
  </section>
}
