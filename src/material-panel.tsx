import type { PrevisitTaskRecord } from "./previsit-workflow.js"

const labels = { consistent: "内容一致 · 独立性未确认", conflict: "存在冲突 · 待核实", incomparable: "口径不可比", "same-source": "同源 · 不构成双源" }
export function MaterialPanel({ task }: { task: PrevisitTaskRecord | undefined | null }) {
  if (!task?.materials?.length) return null
  return <section className="qccPwCard" aria-label="补充材料与交叉核验">
    <h3>补充材料与交叉核验</h3>
    <p>材料正文和来源信息由会话提供，不等于已验证真实性；来源日期与导入日期分别保留。新增资料请在补充任务会话中提交。</p>
    {task.materials.map(material => <details key={material.id}>
      <summary>{material.title} · {material.sourceDate} · {material.taskId === task.id ? "本次导入" : "沿用历史材料"}</summary>
      <p>{material.id} · 来源：{material.locator} · 导入：{material.importedAt}</p>
      <p style={{overflowWrap:"anywhere"}}>SHA256：{material.sha256}</p>
      <pre style={{whiteSpace:"pre-wrap",maxHeight:240,overflow:"auto"}}>{material.text}</pre>
    </details>)}
    {(task.evidenceComparisons ?? []).map(comparison => <div key={comparison.id} role={comparison.status === "conflict" ? "note" : undefined}>
      <strong style={{color: comparison.status === "conflict" ? "#ad6800" : undefined}}>{labels[comparison.status]}</strong>
      <p>{comparison.id}</p>
      {[comparison.leftId, comparison.rightId].map(id => {
        const fact = task.evidenceFacts?.find(item => item.id === id)
        return fact ? <blockquote key={id}>{fact.field} · {fact.period} · {fact.unit}：{fact.value}<br />“{fact.quote}”<br />{fact.materialId} · {fact.location}</blockquote> : <p key={id}>证据缺失：{id}</p>
      })}
    </div>)}
    {!task.evidenceComparisons?.length ? <p>尚未登记交叉比对，不代表已通过双源核验。</p> : null}
  </section>
}
