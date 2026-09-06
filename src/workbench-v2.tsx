import { useEffect, useInsertionEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"

import { PrevisitFields, composerTextarea, usePrevisitComposer, writeComposerDraft } from "./previsit-dock.js"
import { createPrevisitStore, type ActiveTask, type PrevisitStore } from "./previsit-store.js"
import {
  createRevealController,
  registerWorkbenchTab,
  useWorkbenchReveal,
  type BetterSidebarService,
  type BetterSidebarTabProps,
} from "./better-sidebar.js"
import { registerLeftSidebarLauncher, type LeftSidebarHost } from "./left-sidebar.js"
import { PrevisitHome } from "./previsit-home.js"
import { openWorkbench } from "./better-sidebar.js"
import {
  PREVISIT_PHASES,
  derivePhaseStates,
  deriveWorkbenchStatus,
  type PrevisitPhase,
  type SessionProgressInput,
  type WorkbenchStatus,
} from "./workbench-state.js"
import { WORKBENCH_CSS } from "./workbench-style.js"
import { adoptTaskFromSnapshot, buildPrevisitReportFromRenderedHtml, buildPrevisitReportHtml, extractCardText, normalizeHeading } from "./report-export.js"
import { BUSINESS_STATES, opportunityDimensions, opportunitySteps, parseCardInsights, riskDimensions, riskSteps, type CardInsights, type Dimension, type Step, type ToolEvent } from "./stage-insights.js"

export const inject = ["slots", "sessions", "workspaces", "conversation", "betterSidebar"] as const

const STYLE_ID = "dsh-pre-duediligence-workbench"
const PHASE_LABELS: Record<PrevisitPhase, { label: string; description: string }> = {
  prepare: { label: "尽调设定", description: "企业、角色与范围" },
  opportunity: { label: "经营研判", description: "状态、假设与反证" },
  risk: { label: "风险核查", description: "扫描、下钻与影响" },
  delivery: { label: "尽调报告", description: "必问、触达与行动" },
}
const STATUS_LABELS: Record<WorkbenchStatus, string> = {
  empty: "待设定",
  "waiting-agent": "等待执行",
  running: "正在尽调",
  ready: "报告已生成",
  failed: "需要处理",
}

type SnapshotStore<T> = {
  getSnapshot(): T
  subscribe?(listener: () => void): () => void
}

type ConversationNode = {
  kind?: string
  role?: string
  call?: { name?: string } | null
  isError?: boolean
  text?: string
  content?: unknown
  message?: { content?: unknown } | null
  parts?: Array<{ text?: string; type?: string } | string>
}

type ConversationSnapshot = {
  running?: boolean
  partial?: unknown | null
  runningCalls?: Array<{ name?: string }>
  nodes?: ConversationNode[]
  lastAgentError?: string | null
}

type SessionConversation = {
  send(text: string): Promise<void>
}

type ClientContext = LeftSidebarHost & {
  sessions: {
    binding?(sessionId: string): { session: SnapshotStore<ConversationSnapshot> } | undefined
    scope?(sessionId: string): { get(name: string): unknown } | undefined
  }
  betterSidebar: BetterSidebarService
  effect(setup: () => void | (() => void), label?: string): unknown
}

type RuntimeState = {
  running: boolean
  partial: boolean
  lastAgentError: string | null
  toolNames: string[]
  toolEvents: ToolEvent[]
  failedToolCount: number
}

const EMPTY_RUNTIME: RuntimeState = {
  running: false,
  partial: false,
  lastAgentError: null,
  toolNames: [],
  toolEvents: [],
  failedToolCount: 0,
}

function Icon({ name }: { name: "briefcase" | "prepare" | "opportunity" | "risk" | "delivery" | "clock" | "check" | "warning" }): JSX.Element {
  const paths: Record<string, ReactNode> = {
    briefcase: <><rect x="3" y="7" width="18" height="12" rx="2" /><path d="M8 7V5h8v2M3 12h18M10 12v2h4v-2" /></>,
    prepare: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    opportunity: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4M10.5 7v7M7 10.5h7" /></>,
    risk: <><path d="M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" /><path d="M12 8v5M12 17h.01" /></>,
    delivery: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    warning: <><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v4M12 17h.01" /></>,
  }
  return <svg className="qccPwIcon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function collectRuntime(snapshot: ConversationSnapshot, baseline: number): Omit<RuntimeState, "running" | "partial" | "lastAgentError"> {
  const toolNames = new Set<string>()
  const toolEvents: ToolEvent[] = []
  for (const node of (snapshot.nodes ?? []).slice(baseline)) {
    if (node.kind !== "tool-result") continue
    if (typeof node.call?.name === "string") {
      toolNames.add(node.call.name)
      toolEvents.push({ name: node.call.name, status: node.isError === true ? "failed" : "done" })
    }
  }
  for (const call of snapshot.runningCalls ?? []) {
    if (typeof call.name === "string") {
      toolNames.add(call.name)
      toolEvents.push({ name: call.name, status: "running" })
    }
  }
  return { toolNames: [...toolNames], toolEvents, failedToolCount: toolEvents.filter(e => e.status === "failed").length }
}

function Feedback(props: { tone: "notice" | "success" | "error"; title: string; children: ReactNode }): JSX.Element {
  const icon = props.tone === "success" ? "check" : props.tone === "error" ? "warning" : "clock"
  return (
    <div className="qccPwFeedback" data-tone={props.tone} role={props.tone === "error" ? "alert" : "status"}>
      <span className="qccPwFeedbackIcon"><Icon name={icon} /></span>
      <div><strong>{props.title}</strong><p>{props.children}</p></div>
    </div>
  )
}

function SetupPanel(props: { sessionId: string; store: PrevisitStore; task: ActiveTask | undefined; start: (prompt: string) => Promise<number>; onStarted: () => void }): JSX.Element {
  // 与输入框上方的设定条共用同一份状态与逻辑；草稿直接读写 DSH 输入框
  const actions = usePrevisitComposer({
    sessionId: props.sessionId,
    store: props.store,
    readDraft: () => composerTextarea()?.value ?? "",
    writeDraft: text => writeComposerDraft(undefined, text),
    start: props.start,
    onStarted: props.onStarted,
  })
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">PREVISIT</p><h2>尽调设定</h2></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
      </header>
      <div className="qccPwCard qccPwSetupCard">
        <PrevisitFields actions={actions} idPrefix={`qccPw-${props.sessionId}`} />
      </div>
      {props.task === undefined ? null : (
        <div className="qccPwCard">
          <div className="qccPwCardHeader"><div><h3>已发送的任务</h3></div></div>
          <pre className="qccPwPrompt">{props.task.prompt}</pre>
        </div>
      )}
    </section>
  )
}

function Steps(props: { steps: Step[] }): JSX.Element {
  return (
    <ol className="qccPwSteps">
      {props.steps.map((step, index) => (
        <li key={step.label} className="qccPwStep" data-state={step.state}>
          <span className="qccPwStepDot">{step.state === "done" ? <Icon name="check" /> : index + 1}</span>
          <span className="qccPwStepCopy"><b>{step.label}</b>{step.note === undefined ? null : <small>{step.note}</small>}</span>
        </li>
      ))}
    </ol>
  )
}

function Dimensions(props: { title: string; items: Dimension[]; empty: string }): JSX.Element {
  const done = props.items.filter(d => d.status === "done").length
  return (
    <div className="qccPwCard">
      <div className="qccPwCardHeader"><div><h3>{props.title}</h3></div>{done === 0 ? null : <span className="qccPwMode">{done} 项</span>}</div>
      {props.items.length === 0 ? <p className="qccPwEmpty">{props.empty}</p> : (
        <div className="qccPwDims">
          {props.items.map(item => <span key={item.label} className="qccPwDim" data-status={item.status}>{item.label}</span>)}
        </div>
      )}
    </div>
  )
}

function StagePanel(props: { eyebrow: string; title: string; task: ActiveTask | undefined; children: ReactNode }): JSX.Element {
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">{props.eyebrow}</p><h2>{props.title}</h2></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
      </header>
      {props.children}
    </section>
  )
}

function OpportunityPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; events: ToolEvent[]; insights: CardInsights }): JSX.Element {
  const finished = props.status === "ready"
  const running = props.status === "running"
  const { insights } = props
  const steps = opportunitySteps(props.events, insights, finished)
  const dims = opportunityDimensions(props.events)
  const concluded = insights.state !== null || insights.stateUndetermined
  return (
    <StagePanel eyebrow="OPPORTUNITY" title="经营研判" task={props.task}>
      <Steps steps={steps} />
      <Dimensions title="已取得" items={dims} empty={running ? "正在建立主体与信号集…" : "尽调开始后显示取得的维度"} />
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>经营状态</h3></div>{insights.confidence === null ? null : <span className="qccPwMode">置信度 {insights.confidence}</span>}</div>
        <div className="qccPwStateStrip" data-concluded={concluded}>
          {BUSINESS_STATES.map(state => <span key={state} className="qccPwState" data-hit={insights.state === state}>{state}</span>)}
        </div>
        {insights.stateUndetermined ? <p className="qccPwNote">状态未定：公开证据不足，本次降级为清单式简报。</p> : null}
        {insights.industryLink === null ? null : <p className="qccPwNote">产业链环节：{insights.industryLink}</p>}
      </div>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>业务假设</h3></div>{insights.hypotheses.length === 0 ? null : <span className="qccPwMode">{insights.hypotheses.length} 条</span>}</div>
        {insights.hypotheses.length === 0
          ? <p className="qccPwEmpty">{finished ? (insights.stateUndetermined ? "状态未定，未生成假设；相关未知已转入现场必问" : insights.found ? "报告中未识别出假设" : "报告未捕获") : running ? "状态判定后生成" : "尽调开始后显示"}</p>
          : <ol className="qccPwHypos">{insights.hypotheses.map(h => <li key={h.id}><span className="qccPwPri" data-p={h.priority}>{h.priority}</span><b>{h.id}</b><span>{h.text}</span></li>)}</ol>}
      </div>
    </StagePanel>
  )
}

function RiskPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; events: ToolEvent[]; insights: CardInsights }): JSX.Element {
  const finished = props.status === "ready"
  const running = props.status === "running"
  const { insights } = props
  const steps = riskSteps(props.events, insights, finished)
  const dims = riskDimensions(props.events)
  const real = (level: string) => insights.risks.filter(r => r.level === level && !/^(无|—|-|暂无|本次.*未发现)/.test(r.text))
  const judged = insights.sections.includes("红线提示")
  return (
    <StagePanel eyebrow="RISK" title="风险核查" task={props.task}>
      <Steps steps={steps} />
      <Dimensions title="已核查" items={dims} empty={running ? "等待风险扫描…" : "尽调开始后显示核查的维度"} />
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>风险分级</h3></div></div>
        {!judged
          ? <p className="qccPwEmpty">{running ? "扫描与下钻后给出分级" : finished ? "报告未捕获" : "尽调开始后显示"}</p>
          : insights.riskNoRecord && insights.risks.length === 0
            ? <p className="qccPwNote">企业自身风险扫描未发现公开记录；这不等于不存在其他风险。</p>
            : (
              <div className="qccPwRiskTiles">
                {(["红线", "关注", "信息"] as const).map(level => {
                  const items = real(level)
                  return (
                    <div key={level} className="qccPwRiskTile" data-level={level} data-empty={items.length === 0}>
                      <div className="qccPwRiskTileTop"><b>{level}</b><strong>{items.length}</strong></div>
                      <p>{items[0]?.text ?? "本次未发现"}</p>
                    </div>
                  )
                })}
              </div>
            )}
      </div>
    </StagePanel>
  )
}

function ReportViewer(props: { html: string }): JSX.Element {
  const ref = useRef<HTMLIFrameElement>(null)
  const fit = () => {
    const el = ref.current
    const h = el?.contentDocument?.documentElement?.scrollHeight
    if (el !== null && h !== undefined && h > 0) el.style.height = `${h + 8}px`
  }
  useEffect(() => { fit() }, [props.html])
  // 嵌入态：去掉页面级留白与卡片阴影，正文贴边显示
  const embedded = props.html.replace("</head>", "<style>body{background:#fff}.sheet{margin:0;border:0;border-radius:0;box-shadow:none}.hero{padding:18px 20px 16px}.body{padding:6px 20px 20px}</style></head>")
  return <iframe ref={ref} className="qccPwReportFrame" title="尽调报告" sandbox="allow-same-origin" srcDoc={embedded} onLoad={fit} />
}

function DeliveryPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; toolCount: number; failedToolCount: number; cardCaptured: boolean; reportHtml: string | null }): JSX.Element {
  const ready = props.status === "ready"
  if (props.reportHtml !== null) {
    return (
      <section className="qccPwPanel">
        <header className="qccPwPageHeading">
          <div><p className="qccPwEyebrow">REPORT</p><h2>尽调报告</h2></div>
          {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
        </header>
        <div className="qccPwCard qccPwReportCard"><ReportViewer html={props.reportHtml} /></div>
      </section>
    )
  }
  const deliverables = [
    ["①", "核心研判", "状态、机会方向与验证重点"],
    ["②", "产业定位", "主营、行业分类与产业链环节"],
    ["③", "近期动态", "3–5 个带日期与来源的变化"],
    ["④", "业务假设", "P0/P1 假设与支持/反对/未知"],
    ["⑤", "红线提示", "风险如何改变拜访策略"],
    ["⑥", "现场必问", "为什么问与答 A/B 下一步"],
    ["⑦", "触达开场", "来源、归属、用途与开场白"],
    ["⑧", "覆盖说明", "已查、未查、失败与证据层级"],
  ]
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">REPORT</p><h2>尽调报告</h2><p>不是资料堆砌，只回答四件事：去不去、见谁、聊什么、什么不能碰。</p></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
      </header>
      {props.task === undefined ? (props.cardCaptured ? <Feedback tone="success" title="报告可下载">当前会话中已有尽调报告，可直接下载；新的尽调将重新计数。</Feedback> : <Feedback tone="notice" title="等待设定">完成尽调设定后，报告结构与执行进度会显示在这里。</Feedback>) : ready ? <Feedback tone="success" title="报告已生成">执行已结束。可下载报告，或回到会话查看完整内容与事实引用。</Feedback> : props.status === "failed" ? <Feedback tone="error" title="本次尽调未完整完成">请回到会话查看错误；已取得事实仍可保留，失败维度不得写成零记录。</Feedback> : <Feedback tone="notice" title={props.status === "running" ? "正在生成报告" : "等待开始"}>{props.status === "running" && !props.cardCaptured ? "会话若停在候选主体确认，请先在会话中选定企业；报告生成后「下载报告」才可点。" : "完成经营与风险两条线后，将自动切换到本页。"}</Feedback>}
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>报告结构</h3><p>固定八段，可压缩或展开；事实、推理、问题和覆盖边界不混写。</p></div></div>
        <div className="qccPwDeliverables">
          {deliverables.map(([number, title, detail]) => <div key={number} className="qccPwDeliverable"><span>{number}</span><div><b>{title}</b><small>{detail}</small></div></div>)}
        </div>
      </div>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>执行覆盖</h3><p>这是工作台从当前 Session 读取的真实执行事件，不是完整性评分。</p></div></div>
        <div className="qccPwCoverage">
          <div className="qccPwMetric"><strong>{props.toolCount}</strong><span>已识别工具调用</span></div>
          <div className="qccPwMetric"><strong>{props.failedToolCount}</strong><span>工具错误</span></div>
          <div className="qccPwMetric"><strong>{ready ? "4/4" : "—"}</strong><span>业务阶段</span></div>
        </div>
      </div>
    </section>
  )
}

// 兜底：会话快照拿不到正文时，直接从页面里已渲染的报告 DOM 取（排除工作台自身）
function extractCardFromDom(): { html: string; text: string } | null {
  if (typeof document === "undefined") return null
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).filter(h => /核心研判/.test(h.textContent ?? "") && h.closest(".qccPwShell") === null)
  const last = headings[headings.length - 1]
  if (last === undefined) return null
  let el: HTMLElement | null = last.parentElement
  while (el !== null && el !== document.body) {
    const t = el.textContent ?? ""
    if (/核心研判/.test(t) && /现场必问|覆盖说明/.test(t) && el.querySelector(".qccPwShell") === null) break
    el = el.parentElement
  }
  if (el === null || el === document.body) return null
  const clone = el.cloneNode(true) as HTMLElement
  clone.querySelectorAll("button,svg,script,style,textarea,input,select,[contenteditable],[role='toolbar']").forEach(n => n.remove())
  // 一级标题与锚定行进 hero，正文里去掉
  clone.querySelectorAll("h1,h2,h3,p").forEach(n => {
    const t = (n.textContent ?? "").trim()
    if (/^(访前尽调报告|拜访作战卡)\s*·/.test(t) || /^锚定主体：/.test(t)) n.remove()
  })
  clone.querySelectorAll("h1,h2,h3,h4").forEach(n => { n.textContent = normalizeHeading(n.textContent ?? "") })
  clone.querySelectorAll("*").forEach(n => {
    for (const attr of Array.from(n.attributes)) {
      if (!/^(colspan|rowspan|href)$/i.test(attr.name)) n.removeAttribute(attr.name)
    }
  })
  const text = el.textContent ?? ""
  return { html: clone.innerHTML, text }
}

function PrevisitWorkbenchTab(props: BetterSidebarTabProps & {
  ctx: ClientContext
  shared: PrevisitStore
  reveal: ReturnType<typeof createRevealController>
  startPrompt: (sessionId: string, prompt: string) => Promise<number>
}): JSX.Element {
  const sessionId = props.scope.sessionId
  const shared = useSyncExternalStore(props.shared.subscribe, () => props.shared.get(sessionId))
  const task = shared.task
  const setTask = (fn: (current: ActiveTask | undefined) => ActiveTask | undefined) => props.shared.update(sessionId, s => ({ ...s, task: fn(s.task) }))
  const [phase, setPhase] = useState<PrevisitPhase>("prepare")
  const [runtime, setRuntime] = useState<RuntimeState>(EMPTY_RUNTIME)
  const [completedTaskId, setCompletedTaskId] = useState<string>()
  const [cardText, setCardText] = useState<string | null>(null)
  const [downloadNote, setDownloadNote] = useState<string>()

  useWorkbenchReveal(props.reveal, props)

  useInsertionEffect(() => {
    if (!props.visible) return
    return installStyles()
  }, [props.visible])

  useEffect(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session
    if (face === undefined) {
      return
    }
    const refresh = () => {
      const snapshot = face.getSnapshot()
      // 设定条 / 会话内直接发起的尽调：工作台自己从会话认领任务，不依赖谁点了按钮
      if (task === undefined) {
        const adopted = adoptTaskFromSnapshot(snapshot)
        if (adopted !== null) {
          props.shared.update(sessionId, s => s.task !== undefined ? s : ({
            ...s,
            task: { ...adopted, createdAt: new Date().toISOString(), seenRunning: snapshot.running === true || (snapshot.nodes?.length ?? 0) > adopted.nodeBaseline + 1, selection: s.selection },
          }))
        }
      }
      const baseline = task?.nodeBaseline ?? (snapshot.nodes?.length ?? 0)
      const calls = collectRuntime(snapshot, baseline)
      setRuntime({
        running: snapshot.running === true,
        partial: snapshot.partial !== null && snapshot.partial !== undefined,
        lastAgentError: snapshot.lastAgentError ?? null,
        ...calls,
      })
      if (snapshot.running === true) {
        setTask(current => current === undefined || current.seenRunning ? current : { ...current, seenRunning: true })
      }
      setCardText(extractCardText(snapshot, task?.nodeBaseline ?? 0))
    }
    refresh()
    return face.subscribe?.(refresh)
  }, [props.ctx, sessionId, task?.id, task?.nodeBaseline])

  const progressInput: SessionProgressInput = {
    hasTask: task !== undefined,
    running: runtime.running,
    seenRunning: task?.seenRunning ?? false,
    lastAgentError: runtime.lastAgentError,
    partial: runtime.partial,
    toolNames: runtime.toolNames,
  }
  const status = deriveWorkbenchStatus(progressInput)
  const phaseStates = derivePhaseStates(progressInput)
  const insights = useMemo(() => parseCardInsights(cardText), [cardText])
  // 报告就绪后在工作台内直接预览：优先用快照正文，其次用对话区已渲染的报告 DOM
  const reportHtml = useMemo(() => {
    if (cardText !== null) return buildPrevisitReportHtml(cardText)
    if (status !== "ready" && task === undefined) return null
    const dom = extractCardFromDom()
    return dom === null ? null : buildPrevisitReportFromRenderedHtml(dom.html, dom.text)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cardText, status, phase, runtime.toolEvents.length])

  useEffect(() => {
    if ((status !== "ready" && status !== "failed") || task === undefined || completedTaskId === task.id) {
      return
    }
    setCompletedTaskId(task.id)
    setPhase("delivery")
  }, [completedTaskId, status, task])

  const newTask = () => {
    setTask(() => undefined)
    setRuntime(EMPTY_RUNTIME)
    setPhase("prepare")
  }
  const returnToConversation = () => {
    props.store.reduce(state => ({ ...state, panelOpen: false, bottomOpen: false }))
  }
  const downloadReport = () => {
    let html: string
    let source: string
    if (cardText !== null) {
      html = buildPrevisitReportHtml(cardText)
      source = cardText
    } else {
      const dom = extractCardFromDom()
      if (dom === null) {
        setDownloadNote("当前会话里还没有生成完整报告，或报告未展开在对话区；请先回到会话确认报告已输出。")
        return
      }
      html = buildPrevisitReportFromRenderedHtml(dom.html, dom.text)
      source = dom.text
    }
    setDownloadNote(undefined)
    const company = /(?:访前尽调报告|拜访作战卡)\s*·\s*([^\n（(锚｜]+)/.exec(source)?.[1]?.trim() || "访前尽调报告"
    const blob = new Blob([html], { type: "text/html;charset=utf-8" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `访前尽调报告_${company}.html`
    document.body.append(a)
    a.click()
    a.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  if (!props.visible) return <></>

  return (
    <section className="qccPwShell" aria-label="访前尽调工作台" data-status={status}>
      <header className="qccPwHeader">
        <div className="qccPwBrand">
          <span className="qccPwBrandIcon"><Icon name="briefcase" /></span>
          <div className="qccPwBrandCopy"><div className="qccPwTitleRow"><h1 className="qccPwTitle">访前尽调工作台</h1><span className="qccPwLiveDot" data-status={status} /></div><p className="qccPwSubtitle">企查查事实驱动 · 机会与风险双引擎</p></div>
        </div>
        <div className="qccPwMeta"><span className="qccPwStatus" data-status={status}>{STATUS_LABELS[status]}</span><span className="qccPwSession">当前 Session · {sessionId.slice(0, 12)}</span></div>
      </header>
      <nav className="qccPwStages" aria-label="访前任务阶段">
        {PREVISIT_PHASES.map(current => {
          const phaseState = phaseStates.find(item => item.id === current)
          return (
            <button key={current} type="button" className="qccPwStage" data-selected={phase === current} data-progress={phaseState?.progress ?? "idle"} onClick={() => setPhase(current)}>
              <span className="qccPwStageIcon"><Icon name={current} /></span>
              <span className="qccPwStageCopy"><strong>{PHASE_LABELS[current].label}</strong><small>{PHASE_LABELS[current].description}</small></span>
            </button>
          )
        })}
      </nav>
      <div className="qccPwBody">
        {phase === "prepare" ? <SetupPanel sessionId={sessionId} store={props.shared} task={task} start={prompt => props.startPrompt(sessionId, prompt)} onStarted={() => setPhase("opportunity")} /> : null}
        {phase === "opportunity" ? <OpportunityPanel task={task} status={status} events={runtime.toolEvents} insights={insights} /> : null}
        {phase === "risk" ? <RiskPanel task={task} status={status} events={runtime.toolEvents} insights={insights} /> : null}
        {phase === "delivery" ? <DeliveryPanel task={task} status={status} toolCount={runtime.toolNames.length} failedToolCount={runtime.failedToolCount} cardCaptured={cardText !== null} reportHtml={reportHtml} /> : null}
      </div>
      <footer className="qccPwFooter">
        <span className="qccPwFooterHint" data-tone={downloadNote === undefined ? undefined : "error"}>{downloadNote !== undefined ? downloadNote : phase === "prepare" ? "" : "工作台绑定当前会话，企业事实与完整报告保留在会话中。"}</span>
        <div className="qccPwFooterActions">

          {phase !== "prepare" && task !== undefined ? <button type="button" className="qccPwSecondary" onClick={newTask}>新的尽调</button> : null}
          {phase === "delivery"
            ? <button type="button" className="qccPwPrimary" title="下载为 HTML 文件，可直接打开或打印" onClick={downloadReport}>下载报告<span>↓</span></button>
            : phase !== "prepare" ? <button type="button" className="qccPwPrimary" onClick={returnToConversation}>返回会话<span>→</span></button> : null}
        </div>
      </footer>
    </section>
  )
}

function installStyles(): () => void {
  if (document.getElementById(STYLE_ID) !== null) {
    return () => {}
  }
  const style = document.createElement("style")
  style.id = STYLE_ID
  style.textContent = WORKBENCH_CSS
  document.head.append(style)
  return () => style.remove()
}

export function apply(ctx: ClientContext): void {
  const service = ctx.betterSidebar
  const shared = createPrevisitStore()
  const reveal = createRevealController()
  const startPrompt = async (sessionId: string, prompt: string): Promise<number> => {
    const conversation = ctx.sessions.scope?.(sessionId)?.get("conversation") as SessionConversation | undefined
    if (conversation === undefined) throw new Error("conversation unavailable")
    const baseline = ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? 0
    await conversation.send(prompt)
    return baseline
  }
  ctx.effect(
    () => registerWorkbenchTab(service, props => <PrevisitWorkbenchTab {...props} ctx={ctx} shared={shared} reveal={reveal} startPrompt={startPrompt} />),
    "dsh-pre-duediligence: hidden workbench tab",
  )
  registerLeftSidebarLauncher(ctx, service, reveal)
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-pre-duediligence:home",
    order: 110,
    inject: (sessionId: string) => ({
      openWorkbench: () => { openWorkbench(service, { sessionId }, reveal) },
    }),
  }, PrevisitHome))
}
