// 输入框上方的提示词生成器可回填 DSH 草稿；右侧工作台表单则保持本地隔离，
// 仅在点击“开始尽调”后发送带任务 ID 的正式请求。
import { useEffect, useRef, useState, useSyncExternalStore } from "react"
import { createPortal } from "react-dom"

import {
  BUDGET_OPTIONS,
  FOCUS_OPTIONS,
  OUTPUT_OPTIONS,
  PURPOSE_OPTIONS,
  ROLE_OPTIONS,
  applySelection,
  composeFullSentence,
  createTaskId,
  generateFromSelection,
  serializePrevisitRequest,
  updateManualText,
  validateComposerText,
  type ComposerOption,
  type ComposerSelection,
  type ComposerState,
} from "./composer-model.js"
import { EMPTY_SESSION_STATE, summarizeSelection, type DiligenceMode, type PrevisitStore } from "./previsit-store.js"
import { adoptTaskFromSnapshot, type CardSnapshot } from "./report-export.js"
import { writeSessionDraft } from "./session-input.js"

type InputStateLike = { draft: string; phase?: string }

export type PrevisitDockProps = {
  sessionId: string
  useInput: <S>(sel: (s: InputStateLike) => S) => S
  useSession?: <S>(sel: (s: CardSnapshot) => S) => S
  inputActions?: { setDraft(text: string): void } | undefined
  store: PrevisitStore
  // 正式提交：发送带任务 ID 的提示词；返回当前会话节点数作为基线
  start: (prompt: string) => Promise<number>
  open: (phase?: "opportunity") => void
}

// 找到 DSH 原生输入框（排除本条自己的输入）
function writeDraft(actions: PrevisitDockProps["inputActions"], text: string): void {
  if (!writeSessionDraft(actions, text)) throw new Error("当前会话输入框尚未就绪。")
}
export { writeDraft as writeComposerDraft }

const labelOf = (options: readonly ComposerOption[]) => (id: string): string | undefined => options.find(o => o.id === id)?.label

function Chips(props: { options: readonly ComposerOption[]; selected: readonly string[]; onToggle(id: string): void }): JSX.Element {
  return (
    <div className="qccDockChips">
      {props.options.map(option => (
        <button key={option.id} type="button" className="qccDockChip" data-selected={props.selected.includes(option.id)} onClick={() => props.onToggle(option.id)}>{option.label}</button>
      ))}
    </div>
  )
}

// 表单逻辑（设定条与右侧工作台共用；状态在会话级 store 里，两边实时一致）
export type ComposerActions = ReturnType<typeof usePrevisitComposer>

type CompanyInputKeyEvent = {
  key: string
  nativeEvent: { isComposing?: boolean; keyCode?: number }
  preventDefault(): void
  stopPropagation(): void
}

/**
 * 右侧表单与原生 composer 共享草稿，但不共享键盘提交事件。
 * 中文输入法用 Enter 确认候选词时只结束 composition，绝不能冒泡成会话发送。
 */
export function isolateCompanyInputKey(event: CompanyInputKeyEvent): void {
  const composing = event.nativeEvent.isComposing === true || event.nativeEvent.keyCode === 229
  if (event.key === "Enter" && !composing) event.preventDefault()
  event.stopPropagation()
}

export function isolateCompanyInputEvent(event: { stopPropagation(): void }): void {
  event.stopPropagation()
}

export function updateCompanyComposer(
  current: ComposerState,
  nativeDraft: string,
  selection: ComposerSelection,
  company: string,
  isolated: boolean,
): { composer: ComposerState; nativeDraft: string | null } {
  const generated = composeFullSentence(selection, company)
  if (isolated) {
    return {
      composer: { text: generated, lastGenerated: generated, lastCompany: company.trim(), mode: "generated" },
      nativeDraft: null,
    }
  }
  const composer = applySelection({ ...updateManualText(current, nativeDraft), lastCompany: company }, selection, company)
  return { composer, nativeDraft: composer.mode === "generated" ? composer.text : null }
}

export function usePrevisitComposer(args: {
  sessionId: string
  store: PrevisitStore
  readDraft: () => string
  writeDraft: (text: string) => void
  start: (prompt: string) => Promise<number>
  onStarted?: () => void
  /** 右侧工作台必须与原生会话输入框隔离，避免输入中文时宿主抢焦点。 */
  draftMode?: "live" | "isolated"
}) {
  const { sessionId, store } = args
  const state = useSyncExternalStore(store.subscribe, () => store.get(sessionId), () => EMPTY_SESSION_STATE)
  const [error, setError] = useState<string>()
  const [submitting, setSubmitting] = useState(false)
  const lifetime = useRef({ active: true })
  const inFlight = useRef(false)
  useEffect(() => {
    const token = { active: true }
    lifetime.current = token
    return () => { token.active = false }
  }, [sessionId])
  const isolated = args.draftMode === "isolated"
  const draft = isolated ? state.composer.text : args.readDraft()
  const synced = updateManualText(state.composer, draft)
  const manual = synced.mode === "manual" && draft.trim() !== ""

  const write = (selection: ComposerSelection, company: string) => {
    // 工作台表单只写会话级插件 Store；不得逐字调用宿主 setDraft。宿主在
    // setDraft 后会重新聚焦原生 composer，正是中文只输入一半便跳走的根因。
    const next = updateCompanyComposer(state.composer, args.readDraft(), selection, company, isolated)
    if (next.nativeDraft !== null) args.writeDraft(next.nativeDraft)
    store.update(sessionId, s => ({ ...s, selection, company, composer: next.composer }))
    setError(undefined)
  }
  const toggleSingle = (key: "role" | "purpose" | "budget" | "output", id: string) => {
    const next: ComposerSelection = { ...state.selection }
    if (next[key] === id) delete next[key]
    else next[key] = id
    write(next, state.company)
  }
  const toggleFocus = (id: string) => {
    const focus = state.selection.focus.includes(id) ? state.selection.focus.filter(v => v !== id) : [...state.selection.focus, id]
    write({ ...state.selection, focus }, state.company)
  }
  const setCompany = (company: string) => write(state.selection, company)
  const append = () => {
    const next = generateFromSelection(updateManualText(state.composer, args.readDraft()), state.selection)
    args.writeDraft(next.text)
    store.update(sessionId, s => ({ ...s, composer: next }))
  }
  const reset = () => {
    if (!isolated) args.writeDraft("")
    store.update(sessionId, s => ({ ...EMPTY_SESSION_STATE, task: s.task, panel: s.panel, view: s.view, dismissedTaskIds: s.dismissedTaskIds, minimumNodeBaseline: s.minimumNodeBaseline }))
    setError(undefined)
  }
  const startTask = async () => {
    if (inFlight.current) return
    const lifetimeToken = lifetime.current
    const current = store.get(sessionId)
    // 隔离模式在点击“开始尽调”时才构造正式请求，输入过程不会污染或发送
    // 原生会话草稿；live 模式仍保留提示词生成器的原有回填能力。
    const text = (isolated ? composeFullSentence(current.selection, current.company) : args.readDraft()).trim()
    const invalid = validateComposerText(text)
    if (invalid !== undefined) { setError(invalid); return }
    const id = createTaskId()
    const prompt = serializePrevisitRequest(text, id)
    const selection = { ...current.selection, focus: [...current.selection.focus] }
    const company = current.company.trim()
    inFlight.current = true
    setSubmitting(true)
    setError(undefined)
    try {
      const nodeBaseline = await args.start(prompt)
      store.update(sessionId, s => ({
        ...s,
        composer: { ...s.composer, text: "", lastGenerated: "", mode: "generated" },
        task: { id, company, prompt, createdAt: new Date().toISOString(), nodeBaseline, seenRunning: false, selection },
      }))
      if (lifetimeToken.active) args.onStarted?.()
    } catch {
      if (lifetimeToken.active) setError("发送失败，请检查当前会话后重试")
    } finally {
      inFlight.current = false
      if (lifetimeToken.active) setSubmitting(false)
    }
  }
  const summary = summarizeSelection(state, {
    role: labelOf(ROLE_OPTIONS), purpose: labelOf(PURPOSE_OPTIONS), focus: labelOf(FOCUS_OPTIONS), budget: labelOf(BUDGET_OPTIONS), output: labelOf(OUTPUT_OPTIONS),
  })
  return { state, manual, error, submitting, isolated, summary, toggleSingle, toggleFocus, setCompany, append, reset, startTask }
}

// 六行表单 + 底部动作（两处渲染同一份）
export function PrevisitFields(props: { actions: ComposerActions; idPrefix: string; startLabel?: string }): JSX.Element {
  const { actions: a } = props
  const st = a.state
  return (
    <div className="qccDockBody">
      <div className="qccDockRow">
        <label className="qccDockLabel" htmlFor={`${props.idPrefix}-company`}>拜访客户</label>
        <input
          id={`${props.idPrefix}-company`}
          className="qccDockCompany"
          value={st.company}
          placeholder="企业全称或统一社会信用代码"
          data-previsit-company-input="true"
          autoComplete="off"
          onChange={e => a.setCompany(e.target.value)}
          onKeyDownCapture={isolateCompanyInputKey}
          onKeyUpCapture={isolateCompanyInputEvent}
          onCompositionStartCapture={isolateCompanyInputEvent}
          onCompositionUpdateCapture={isolateCompanyInputEvent}
          onCompositionEndCapture={isolateCompanyInputEvent}
        />
      </div>
      <div className="qccDockRow"><span className="qccDockLabel">我是</span><Chips options={ROLE_OPTIONS} selected={st.selection.role === undefined ? [] : [st.selection.role]} onToggle={id => a.toggleSingle("role", id)} /></div>
      <div className="qccDockRow"><span className="qccDockLabel">场合</span><Chips options={PURPOSE_OPTIONS} selected={st.selection.purpose === undefined ? [] : [st.selection.purpose]} onToggle={id => a.toggleSingle("purpose", id)} /></div>
      <div className="qccDockRow"><span className="qccDockLabel">关注</span><Chips options={FOCUS_OPTIONS} selected={st.selection.focus} onToggle={a.toggleFocus} /></div>
      <div className="qccDockRow"><span className="qccDockLabel">深度</span><Chips options={BUDGET_OPTIONS} selected={st.selection.budget === undefined ? [] : [st.selection.budget]} onToggle={id => a.toggleSingle("budget", id)} /></div>
      <div className="qccDockRow"><span className="qccDockLabel">输出</span><Chips options={OUTPUT_OPTIONS} selected={st.selection.output === undefined ? [] : [st.selection.output]} onToggle={id => a.toggleSingle("output", id)} /></div>
      <div className="qccDockFoot">
        <span className="qccDockHint" data-tone={a.error === undefined ? undefined : "error"}>
          {a.error ?? (a.isolated ? "设置仅保留在右侧工作台；输入完整后点击「开始尽调」" : a.manual ? "输入框里有你手写的内容，点选不会覆盖；「按条件补充」会另起一句追加" : "条件实时写进输入框，可以直接改；改好后点「开始尽调」")}
        </span>
        <div className="qccDockActions">
          <button type="button" className="qccDockBtn" onClick={a.reset}>清空</button>
          {a.manual ? <button type="button" className="qccDockBtn" onClick={a.append}>按条件补充</button> : null}
          <button type="button" className="qccDockBtn qccDockPrimary" disabled={a.submitting} onClick={() => void a.startTask()}>{a.submitting ? "发送中…" : (props.startLabel ?? "开始尽调 →")}</button>
        </div>
      </div>
    </div>
  )
}

export function PrevisitDock(props: PrevisitDockProps): JSX.Element {
  const { sessionId, store } = props
  const draft = props.useInput(s => s.draft)
  const hasHistory = props.useSession === undefined ? false : props.useSession(s => (s.nodes?.length ?? 0) > 0)
  const nodeCount = props.useSession === undefined ? 0 : props.useSession(s => s.nodes?.length ?? 0)
  const adoptedId = props.useSession === undefined ? null : props.useSession(s => adoptTaskFromSnapshot(s, sessionId)?.id ?? null)
  const sessionSnap = props.useSession === undefined ? undefined : props.useSession(s => s)
  const [open, setOpen] = useState(false)
  const actions = usePrevisitComposer({
    sessionId, store,
    readDraft: () => draft,
    writeDraft: text => writeDraft(props.inputActions, text),
    start: props.start,
    onStarted: () => { setOpen(false); props.open("opportunity") },
  })
  const { state } = actions
  // 会话里已经在跑尽调（不管从哪发起）：认领为任务，两边状态一致
  useEffect(() => {
    if (state.task !== undefined || adoptedId === null || sessionSnap === undefined) return
    const adopted = adoptTaskFromSnapshot(sessionSnap, sessionId)
    if (adopted === null) return
    store.update(sessionId, s => s.task !== undefined ? s : ({ ...s, task: { ...adopted, createdAt: new Date().toISOString(), seenRunning: true, selection: s.selection } }))
    setOpen(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [adoptedId, nodeCount, state.task])
  useEffect(() => { if (actions.error !== undefined) setOpen(true) }, [actions.error])
  // 点了输入框下方的「访前尽调」才出现；出现时直接展开
  const visible = state.panel === "previsit"
  useEffect(() => { if (visible) setOpen(true) }, [visible])
  void hasHistory
  // 尽调类型栏挂到输入框卡片正下方：DSH 在首页不渲染 composer.dock，这里用 portal 挂到卡片栈末尾
  const anchorRef = useRef<HTMLSpanElement>(null)
  const [modesHost, setModesHost] = useState<HTMLElement | null>(null)
  useEffect(() => {
    const anchor = anchorRef.current
    if (anchor === null) return
    const stack = (anchor.closest('[class*="composerStack"]') as HTMLElement | null) ?? anchor.parentElement
    if (stack === null) return
    const host = document.createElement("div")
    host.className = "qccModesHost"
    stack.append(host)
    setModesHost(host)
    return () => { host.remove(); setModesHost(null) }
  }, [])
  const modes = modesHost === null ? null : createPortal(<DiligenceModeBar sessionId={sessionId} store={store} />, modesHost)

  if (!visible) return <><span ref={anchorRef} hidden />{modes}</>

  return (
    <>
    <span ref={anchorRef} hidden />
    {modes}
    <div className="qccDock" data-open={open}>
      <div className="qccDockPanel">
        <button type="button" className="qccDockHead" onClick={() => setOpen(!open)} aria-expanded={open}>
          <span className="qccDockBrand">访前尽调提示词生成</span>
          <span className="qccDockSummary">
            {actions.summary.length === 0
              ? <span className="qccDockHint">{state.task === undefined ? "点选条件，自动写进下方输入框" : "尽调进行中 · 可再发起新的"}</span>
              : actions.summary.map(item => <span key={item} className="qccDockTag">{item}</span>)}
          </span>
          {open ? <span className="qccDockWorkbench" role="button" tabIndex={0} title="打开右侧工作台" onClick={e => { e.stopPropagation(); props.open() }} onKeyDown={e => { if (e.key === "Enter" || e.key === " ") { e.stopPropagation(); props.open() } }}>工作台</span> : null}
          <span className="qccDockChevron" aria-hidden="true" />
        </button>
        {open ? <PrevisitFields actions={actions} idPrefix={`qccDock-${sessionId}`} /> : null}
      </div>
    </div>
    </>
  )
}


// 输入框下方的尽调类型栏：icon + 文案，hover 一句话说明；目前只有访前尽调可用
const MODES: Array<{ id: DiligenceMode; label: string; tip: string; enabled: boolean; icon: string }> = [
  { id: "previsit", label: "访前尽调", enabled: true, tip: "拜访前摸清企业经营状态、业务假设与风险红线，生成可下载的尽调报告", icon: "M3 7h18v12H3zM8 7V5h8v2M3 12h18" },
  { id: "onboarding", label: "准入尽调", enabled: false, tip: "签约、授信或供应商准入前的资质与合规核查（即将上线）", icon: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7zM9 12l2 2 4-4" },
  { id: "transaction", label: "交易尽调", enabled: false, tip: "单笔交易或合同签订前的对手方与履约风险核查（即将上线）", icon: "M4 8h13l-3-3M20 16H7l3 3" },
  { id: "ongoing", label: "持续尽调", enabled: false, tip: "存量客户与供应商的定期复查与变化预警（即将上线）", icon: "M20 12a8 8 0 1 1-2.3-5.7M20 4v4h-4" },
]

export function DiligenceModeBar(props: { sessionId: string; store: PrevisitStore }): JSX.Element {
  const state = useSyncExternalStore(props.store.subscribe, () => props.store.get(props.sessionId), () => EMPTY_SESSION_STATE)
  const choose = (id: DiligenceMode) => props.store.update(props.sessionId, s => ({ ...s, panel: s.panel === id ? null : id }))
  return (
    <div className="qccModes" role="group" aria-label="尽调类型">
      {MODES.map(m => (
        <button key={m.id} type="button" className="qccMode" data-active={state.panel === m.id} disabled={!m.enabled} data-tip={m.tip} title={m.tip} onClick={() => choose(m.id)}>
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d={m.icon} /></svg>
          <span>{m.label}</span>
        </button>
      ))}
    </div>
  )
}
