// 计划确认卡：智能体从图片/文字里识别出多家候选后，用户在这里挑主体、定深度、调关注维度、选报告框架，一次确认。
import { useRef, useState } from "react"

import { FOCUS_OPTIONS, OUTPUT_OPTIONS, ROLE_OPTIONS, PURPOSE_OPTIONS } from "./composer-model.js"
import { DEPTH_LABELS, REPORT_SECTIONS, planConfirmationMessage, type PlanSelection, type PrevisitPlan, type TaskDepth } from "./previsit-task.js"

// 输出框架预设：选了框架后段落跟着变，仍可手动勾选
const FRAMEWORK_SECTIONS: Record<string, readonly string[]> = {
  一页纸简报: REPORT_SECTIONS,
  提问清单为主: ["核心研判", "红线提示", "现场必问", "覆盖说明"],
  完整报告: REPORT_SECTIONS,
  可转发摘要: ["核心研判", "产业定位", "近期动态", "红线提示", "现场必问", "覆盖说明"],
}

export function PlanCard(props: { plan: PrevisitPlan; onConfirm: (message: string) => Promise<void>; onDismiss?: () => void }): JSX.Element {
  const { plan } = props
  const [picked, setPicked] = useState<string[]>(plan.candidates.slice(0, Math.min(3, plan.candidates.length)).map(c => c.name))
  const [depth, setDepth] = useState<TaskDepth>("fast")
  const [focus, setFocus] = useState<string[]>(FOCUS_OPTIONS.map(o => o.label))
  const [role, setRole] = useState<string>(ROLE_OPTIONS[0]?.label ?? "银行/信贷客户经理")
  const [scene, setScene] = useState<string>()
  const inFlight = useRef(false)
  const [confirmed, setConfirmed] = useState(false)
  const [output, setOutput] = useState<string>("一页纸简报")
  const [sections, setSections] = useState<string[]>([...REPORT_SECTIONS])
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const toggle = (list: string[], value: string, set: (next: string[]) => void) => set(list.includes(value) ? list.filter(v => v !== value) : [...list, value])
  const confirm = async () => {
    if (inFlight.current || confirmed) return
    if (picked.length === 0) { setError("至少选一家企业"); return }
    if (sections.length === 0) { setError("报告至少保留一段"); return }
    inFlight.current = true
    setError(undefined); setSubmitting(true)
    try {
      const selection: PlanSelection = { candidates: plan.candidates.filter(c => picked.includes(c.name)).map(c => c.name), depth, focus, output, role, ...(scene === undefined ? {} : { scene }), sections: REPORT_SECTIONS.filter(s => sections.includes(s)) }
      await props.onConfirm(planConfirmationMessage(plan, selection))
      setConfirmed(true)
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "发送失败")
    } finally { inFlight.current = false; setSubmitting(false) }
  }
  if (confirmed) return <div className="qccPwCard" role="status">计划已提交，正在等待智能体逐家执行。</div>
  return (
    <div className="qccPwCard qccPlan" data-submitting={submitting}>
      <div className="qccPwCardHeader">
        <div><h3>确认尽调计划</h3><p>{plan.note ?? "智能体识别出以下候选主体"}；选好后一次确认，按家逐一查询并保存报告，出现多个候选时需确认唯一法律实体。</p></div>
        <span className="qccPwMode">{plan.candidates.length} 家候选</span>
      </div>
      <div className="qccPlanGroup">
        <div className="qccPlanLabel">要查哪几家</div>
        <ul className="qccPlanCandidates">
          {plan.candidates.map(c => (
            <li key={c.name}>
              <label>
                <input type="checkbox" checked={picked.includes(c.name)} onChange={() => toggle(picked, c.name, setPicked)} />
                <span className="qccPlanName">{c.name}</span>
                {c.source === undefined ? null : <small>{c.source}</small>}
              </label>
            </li>
          ))}
        </ul>
      </div>
      <div className="qccPlanGroup">
        <div className="qccPlanLabel">我是</div>
        <div className="qccPlanChips">
          {ROLE_OPTIONS.map(o => <button key={o.id} type="button" className="qccPlanChip" data-on={role === o.label} aria-pressed={role === o.label} onClick={() => setRole(o.label)}>{o.label}</button>)}
        </div>
      </div>
      <div className="qccPlanGroup">
        <div className="qccPlanLabel">拜访场合</div>
        <div className="qccPlanChips">
          {PURPOSE_OPTIONS.map(o => <button key={o.id} type="button" className="qccPlanChip" data-on={scene === o.label} aria-pressed={scene === o.label} onClick={() => setScene(o.label)}>{o.label}</button>)}
        </div>
      </div>
      <div className="qccPlanGroup">
        <div className="qccPlanLabel">多深</div>
        <div className="qccPlanChips" role="radiogroup">
          {(Object.keys(DEPTH_LABELS) as TaskDepth[]).map(d => (
            <button key={d} type="button" role="radio" aria-checked={depth === d} className="qccPlanChip" data-on={depth === d} onClick={() => setDepth(d)}>{DEPTH_LABELS[d]}</button>
          ))}
        </div>
      </div>
      <div className="qccPlanGroup">
        <div className="qccPlanLabel">重点关注</div>
        <div className="qccPlanChips">
          {FOCUS_OPTIONS.map(o => (
            <button key={o.id} type="button" aria-pressed={focus.includes(o.label)} className="qccPlanChip" data-on={focus.includes(o.label)} onClick={() => toggle(focus, o.label, setFocus)}>{o.label}</button>
          ))}
        </div>
      </div>
      <div className="qccPlanGroup">
        <div className="qccPlanLabel">报告框架</div>
        <div className="qccPlanChips" role="radiogroup">
          {OUTPUT_OPTIONS.map(o => (
            <button key={o.id} type="button" role="radio" aria-checked={output === o.label} className="qccPlanChip" data-on={output === o.label} onClick={() => { setOutput(o.label); setSections([...(FRAMEWORK_SECTIONS[o.label] ?? REPORT_SECTIONS)]) }}>{o.label}</button>
          ))}
        </div>
        <p className="qccImportState">勾选重点展开的段落；最终报告保留完整八段，其余段落简写。</p>
        <div className="qccPlanSections">
          {REPORT_SECTIONS.map((sec, i) => (
            <label key={sec} data-on={sections.includes(sec)}>
              <input type="checkbox" checked={sections.includes(sec)} onChange={() => toggle(sections, sec, setSections)} />
              <span>{i + 1}、{sec}</span>
            </label>
          ))}
        </div>
      </div>
      <div className="qccPlanFoot">
        <span className="qccPlanTotal">{picked.length} 家 · {DEPTH_LABELS[depth]} · 按固定业务路由连续查询</span>
        <div className="qccPlanActions">
          {error === undefined ? null : <span className="qccPlanError" role="alert">{error}</span>}
          {props.onDismiss === undefined ? null : <button type="button" className="qccPwSecondary" onClick={props.onDismiss}>先不查</button>}
          <button type="button" className="qccPwPrimary" disabled={submitting} onClick={() => { void confirm() }}>确认并开始<span>→</span></button>
        </div>
      </div>
    </div>
  )
}
