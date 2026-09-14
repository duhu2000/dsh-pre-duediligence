import { installComposerImageBridge } from "./image-bridge.js"
import { PlanCard } from "./plan-card.js"
import { DEPTH_LABELS, derivePlans, deriveTasks, type PrevisitPlan } from "./previsit-task.js"
import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"

import { AnalysisPanel, CollectionCards } from "./analysis-panels.js"
import { BUDGET_OPTIONS, FOCUS_OPTIONS, OUTPUT_OPTIONS, PURPOSE_OPTIONS, ROLE_OPTIONS, type ComposerOption } from "./composer-model.js"
import { PrevisitLogo } from "./previsit-brand.js"
import { ReportFilesPanel } from "./report-files-panel.js"
import { MaterialPanel } from "./material-panel.js"
import { processingStatus } from "./processing-status.js"
import { dimensionLabel } from "./hosted-task-sync.js"
import { PrevisitFields, usePrevisitComposer } from "./previsit-dock.js"
import { resolveSessionInput, clearSubmittedDraft, type SessionInput } from "./session-input.js"
import { installSubmissionReveal } from "./submission-reveal.js"
import { isPrevisitSession } from "./previsit-session.js"
import { toolEvent, TOOL_OUTCOME_LABELS } from "./tool-outcome.js"
import { PrevisitPromptGenerator } from "./previsit-prompt.js"
import { createPrevisitStore, locatePrevisitView, type ActiveTask, type PrevisitSessionState, type PrevisitStore, type PrevisitView } from "./previsit-store.js"
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
import { fetchHostedTask, fetchHostedTasks } from "./hosted-task-api.js"
import { HOSTED_TERMINAL, hostedLiveProgress, hostedProgressCopy, hostedStatus, hostedTaskOrigin, hostedTaskView, hostedToolEvents, selectHostedTask, syncHostedTaskState, type HostedTask } from "./hosted-task-sync.js"
import { installOrdinarySessionGuard, type WorkspaceNavigation } from "./ordinary-session-guard.js"
import {
  PREVISIT_PHASES,
  derivePhaseStates,
  deriveWorkbenchStatus,
  type PrevisitPhase,
  type SessionProgressInput,
  type WorkbenchStatus,
} from "./workbench-state.js"
import { WORKBENCH_CSS } from "./workbench-style.js"
import { adoptTaskFromSnapshot, buildPrevisitReportHtml, captureTaskReport, taskDisplayLabel } from "./report-export.js"
import { BUSINESS_STATES, isRiskFindingText, opportunityDimensions, opportunitySteps, parseCardInsights, riskDimensions, riskSteps, type CardInsights, type Dimension, type Step, type ToolEvent } from "./stage-insights.js"

export const inject = ["slots", "sessions", "workspaces", "conversation"] as const

const STYLE_ID = "dsh-pre-duediligence-workbench"
export const OPTIONAL_WORKBENCH_MESSAGE = "未安装可选 Better Sidebar；当前草稿和业务状态已保留。基础会话、提示词生成、原生发送及会话报告阅读仍可使用。如需可视化工作台，请停止 DSH 后按 README 设置 DSH_PREVISIT_WORKBENCH=on 并重跑安装脚本。"
const PHASE_LABELS: Record<PrevisitPhase, string> = {
  target: "对象与目标",
  scope: "范围确认",
  collect: "资料采集",
  verify: "证据核验",
  output: "材料输出",
}
const STATUS_LABELS: Record<WorkbenchStatus, string> = {
  empty: "待设定",
  "waiting-agent": "等待确认 / 继续",
  running: "正在尽调",
  ready: "报告已生成",
  failed: "需要处理",
}

type SnapshotStore<T> = {
  getSnapshot(): T
  subscribe?(listener: () => void): () => void
}

type ConversationNode = {
  seq?: number
  interrupted?: boolean
  blocks?: Array<{ kind: string; text?: string }>
  kind?: string
  role?: string
  call?: { name?: string } | null
  isError?: boolean
  error?: { name?: string; code?: string }
  text?: string
  content?: unknown
  message?: { role?: string; content?: unknown } | null
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
  uiWorkspace?: WorkspaceNavigation
  betterSidebar?: BetterSidebarService
  inject(deps: string[], setup: (ctx: ClientContext) => void): unknown
  effect(setup: () => void | (() => void), label?: string): unknown
}

type RuntimeState = {
  available: boolean
  running: boolean
  partial: boolean
  lastAgentError: string | null
  toolNames: string[]
  toolEvents: ToolEvent[]
  failedToolCount: number
}

const EMPTY_RUNTIME: RuntimeState = {
  available: false,
  running: false,
  partial: false,
  lastAgentError: null,
  toolNames: [],
  toolEvents: [],
  failedToolCount: 0,
}

function Icon({ name }: { name: "target" | "scope" | "collect" | "verify" | "output" | "clock" | "check" | "warning" | "history" }): JSX.Element {
  const paths: Record<string, ReactNode> = {
    target: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4M10.5 7.5v6M7.5 10.5h6" /></>,
    scope: <><path d="M5 4h14v16H5z" /><path d="M8 8h8M8 12h8M8 16h5" /></>,
    collect: <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" /></>,
    verify: <><path d="M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" /><path d="M12 8v5M12 17h.01" /></>,
    output: <><path d="M6 3h8l4 4v14H6z" /><path d="M14 3v5h5M9 13h6M9 17h6" /></>,
    clock: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
    check: <><circle cx="12" cy="12" r="9" /><path d="m8 12 2.5 2.5L16 9" /></>,
    warning: <><path d="M12 3 2.8 20h18.4z" /><path d="M12 9v4M12 17h.01" /></>,
    history: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  }
  return <svg className="qccPwIcon" viewBox="0 0 24 24" aria-hidden="true">{paths[name]}</svg>
}

function collectRuntime(snapshot: ConversationSnapshot, baseline: number): Omit<RuntimeState, "available" | "running" | "partial" | "lastAgentError"> {
  const toolNames = new Set<string>()
  const toolEvents: ToolEvent[] = []
  for (const node of (snapshot.nodes ?? []).slice(baseline)) {
    if (node.kind !== "tool-result") continue
    if (typeof node.call?.name === "string") {
      const event = toolEvent({ ...node, call: { name: node.call.name } })
      toolNames.add(event.name)
      toolEvents.push(event)
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

function ExecutionProgress(props: { task: HostedTask | null; status: WorkbenchStatus; modelRunning?: boolean | undefined; syncError?: string | undefined }): JSX.Element | null {
  const [now, setNow] = useState(Date.now)
  useEffect(() => {
    if (props.task === null || props.status === "ready") return
    const timer = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(timer)
  }, [props.task?.id, props.status])
  if (props.task === null || props.status === "ready") return null
  const progress = hostedLiveProgress(props.task)
  const lastResultAt = Math.max(Date.parse(props.task.createdAt), ...props.task.runs.map(run => Date.parse(run.completedAt ?? run.startedAt)))
  const activity = processingStatus({ running: props.modelRunning, error: props.syncError, waiting: props.task.state === "needs-entity-confirmation", querying: progress.current !== null, secondsSinceResult: (now - lastResultAt) / 1000, ...(props.task.activity ? { activity: props.task.activity } : {}), now, lastResultAt })
  return (
    <div className="qccPwLiveProgress" data-running={activity.busy}>
      <span className="qccPwLivePulse" aria-hidden="true" />
      <div className="qccPwLiveCopy" role="status"><strong>{activity.title}</strong><p>{activity.detail}</p><p>{progress.title} · {progress.detail}</p></div>
      <div className="qccPwLiveMetrics" aria-label="实时执行统计">
        <span>查询 {progress.queryCount}</span>
        <span data-tone="success">闭环 {progress.completedCount}</span>
        {progress.noDataCount > 0 ? <span data-tone="success">无数据 {progress.noDataCount}</span> : null}
        {progress.skippedCount > 0 ? <span data-tone="success">无需执行 {progress.skippedCount}</span> : null}
        {progress.pendingCount > 0 ? <span>待处理 {progress.pendingCount}</span> : null}
        {progress.failedCount > 0 ? <span data-tone="error">失败 {progress.failedCount}</span> : null}
        <span>已用时 {progress.elapsed}</span>
      </div>
    </div>
  )
}

function SetupPanel(props: { sessionId: string; store: PrevisitStore; task: ActiveTask | undefined; input: SessionInput | undefined; send: (prompt: string) => Promise<void>; start: (prompt: string) => Promise<number>; onStarted: () => void }): JSX.Element {
  useSyncExternalStore(listener => props.input?.state.subscribe?.(listener) ?? (() => {}), () => props.input?.state.getSnapshot().draft ?? "")
  // 与输入框上方的设定条共用同一份状态与逻辑；草稿直接读写 DSH 输入框
  const actions = usePrevisitComposer({
    sessionId: props.sessionId,
    store: props.store,
    readDraft: () => props.input?.state.getSnapshot().draft ?? "",
    writeDraft: text => {
      if (props.input === undefined) throw new Error("当前会话输入框尚未就绪")
      props.input.setDraft(text)
    },
    start: props.start,
    onStarted: props.onStarted,
    draftMode: "isolated",
  })
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">TARGET</p><h2>对象与目标</h2><p>确认拜访主体、角色与目标；前端不预设业务结论。</p></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{taskDisplayLabel(props.task.id)}</span>}
      </header>
      <div className="qccPwCard qccPwSetupCard">
        <PrevisitFields actions={actions} idPrefix={`qccPw-${props.sessionId}`} sessionId={props.sessionId} send={props.send} />
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

const optionLabel = (options: readonly ComposerOption[], id: string | undefined): string =>
  id === undefined ? "未选择" : (options.find(option => option.id === id)?.label ?? "未选择")

function ScopePanel(props: { state: PrevisitSessionState; task: ActiveTask | undefined; hostedTask: HostedTask | null }): JSX.Element {
  const brief = props.hostedTask?.brief
  const selection = props.task?.selection ?? props.state.selection
  const focus = selection.focus.map(id => optionLabel(FOCUS_OPTIONS, id)).join("、") || "按 Skill 标准范围"
  const submittedCompany = props.task?.company?.trim() || props.state.company.trim()
  const rows = [
    ["拜访对象", submittedCompany || "尚未填写"],
    ["我的角色", brief?.role ?? optionLabel(ROLE_OPTIONS, selection.role)],
    ["拜访场景", brief?.scene ?? optionLabel(PURPOSE_OPTIONS, selection.purpose)],
    ["重点关注", brief === undefined ? focus : brief.focus.join("、") || "按 Skill 标准范围"],
    ["尽调深度", props.hostedTask === null ? optionLabel(BUDGET_OPTIONS, selection.budget) : DEPTH_LABELS[props.hostedTask.depth]],
    ["输出形态", brief?.output ?? optionLabel(OUTPUT_OPTIONS, selection.output)],
  ]
  return (
    <StagePanel eyebrow="SCOPE" title="范围确认" task={props.task}>
      <Feedback tone="notice" title="范围是执行意图，不是完成证明">实际覆盖以当前会话的企查查 MCP 调用、失败记录及报告覆盖说明为准。</Feedback>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>本次设定</h3><p>需要调整时返回「对象与目标」，或使用输入框左上角的提示词生成器。</p></div></div>
        <dl className="qccPwScopeList">
          {rows.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
      </div>
    </StagePanel>
  )
}

function Steps(props: { steps: Step[] }): JSX.Element {
  return (
    <ol className="qccPwSteps">
      {props.steps.map((step, index) => (
        <li key={step.label} className="qccPwStep" data-state={step.state}>
          <span className="qccPwStepDot">{step.state === "done" ? <Icon name="check" /> : step.state === "review" || step.state === "failed" ? <Icon name="warning" /> : index + 1}</span>
          <span className="qccPwStepCopy"><b>{step.label}</b>{step.note === undefined ? null : <small>{step.note}</small>}</span>
        </li>
      ))}
    </ol>
  )
}

function Dimensions(props: { title: string; items: Dimension[]; empty: string }): JSX.Element {
  const done = props.items.filter(d => d.status === "done" || d.status === "no-data" || d.status === "skipped").length
  const review = props.items.filter(d => d.status === "unknown").length
  const blocked = props.items.filter(d => d.status === "no-permission" || d.status === "not-executed").length
  const failed = props.items.filter(d => d.status === "failed").length
  return (
    <div className="qccPwCard">
      <div className="qccPwCardHeader"><div><h3>{props.title}</h3></div><div className="qccPwModeGroup">
        {done > 0 ? <span className="qccPwMode" data-tone="success">{done} 项完成</span> : null}
        {review > 0 ? <span className="qccPwMode" data-tone="review">{review} 项待确认</span> : null}
        {blocked > 0 ? <span className="qccPwMode" data-tone="review">{blocked} 项未完成</span> : null}
        {failed > 0 ? <span className="qccPwMode" data-tone="error">{failed} 项失败</span> : null}
      </div></div>
      {props.items.length === 0 ? <p className="qccPwEmpty">{props.empty}</p> : (
        <div className="qccPwDims">
          {props.items.map(item => <span key={item.label} className="qccPwDim" data-status={item.status} title={item.note}>{item.label} · {TOOL_OUTCOME_LABELS[item.status]}</span>)}
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
        {props.task === undefined ? null : <span className="qccPwTaskId">{taskDisplayLabel(props.task.id)}</span>}
      </header>
      {props.children}
    </section>
  )
}

export function ScanFindings({ task }: { task: HostedTask | null }): JSX.Element {
  const scan = task?.runs.filter(run => run.dimension === "risk_scan").at(-1)
  const factors = scan?.result?.factors ?? []
  const hits = factors.filter(factor => factor.count > 0)
  if (!scan?.result) return <p className="qccPwNote">扫描因子尚未保存；旧任务请参阅报告中的风险与覆盖说明。</p>
  return <div className="qccPwCard"><h3>实时风险扫描 · {hits.length} 项命中</h3>
    <p>查询成功仅表示数据已返回，不代表企业无风险。以下为公开记录计数，尚非最终风险定性。</p>
    <div className="qccPwRiskTiles">{hits.map(factor => <div key={factor.name} className="qccPwRiskTile" data-level="关注" data-empty={false}><b>{factor.name}</b><strong> · {factor.count} 条</strong><p>已发现公开记录 · 需结合明细研判</p></div>)}</div>
    {factors.length > 0 && hits.length === 0 ? <p className="qccPwNote">本次扫描 {factors.length} 项均未发现公开记录。</p> : null}
    {scan.result.summary ? <p>{scan.result.summary}</p> : null}
  </div>
}

function OpportunityPanel(props: { task: ActiveTask | undefined; hostedTask: HostedTask | null; status: WorkbenchStatus; events: ToolEvent[]; insights: CardInsights }): JSX.Element {
  const finished = props.status === "ready"
  const running = props.status === "running"
  const { insights } = props
  const steps = opportunitySteps(props.events, insights, finished)
  const dims = opportunityDimensions(props.events)
  return (
    <StagePanel eyebrow="COLLECT" title="资料采集" task={props.task}>
      <Steps steps={steps} />
      <Dimensions title="采集结果" items={dims} empty={running ? "正在建立主体与信号集…" : "尽调开始后显示采集结果"} />
      <ScanFindings task={props.hostedTask} />
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>经营事实与研判</h3><p>以下内容来自本次查询返回；最终研判与查询执行状态分别展示。</p></div>{insights.state !== null
          ? <span className="qccPwMode" data-tone="success">已研判{insights.confidence === null ? "" : ` · 置信度 ${insights.confidence}`}</span>
          : insights.stateUndetermined
            ? <span className="qccPwMode" data-tone="review">状态未定</span>
            : <span className="qccPwMode" data-tone={running ? undefined : "neutral"}>{running ? "正在研判" : finished ? "未识别结论" : "待研判"}</span>}</div>
        {insights.state ? <h3>{insights.state}</h3> : <p>尚未形成经营研判；先展示已返回的经营事实，不以查询成功推断经营良好。</p>}
        <CollectionCards task={props.hostedTask} />
        {insights.stateUndetermined ? <p className="qccPwNote">状态未定：公开证据不足，本次降级为清单式简报。</p> : null}
        {insights.industryLink === null ? null : <p className="qccPwNote">产业链环节：{insights.industryLink}</p>}
      </div>
      <AnalysisPanel task={props.hostedTask} kind="hypothesis" legacy={insights.hypotheses} />
    </StagePanel>
  )
}

function RiskPanel(props: { task: ActiveTask | undefined; hostedTask: HostedTask | null; status: WorkbenchStatus; events: ToolEvent[]; insights: CardInsights }): JSX.Element {
  const finished = props.status === "ready"
  const running = props.status === "running"
  const { insights } = props
  const steps = riskSteps(props.events, insights, finished)
  const dims = riskDimensions(props.events)
  const rows = (level: string) => insights.risks.filter(r => r.level === level)
  const real = (level: string) => rows(level).filter(r => isRiskFindingText(r.text))
  const judged = insights.sections.includes("红线提示")
  return (
    <StagePanel eyebrow="VERIFY" title="证据核验" task={props.task}>
      <Steps steps={steps} />
      <Dimensions title="核验结果" items={dims} empty={running ? "等待风险扫描…" : "尽调开始后显示核验结果"} />
      <p className="qccPwNote">扫描发现见「资料采集」；这里展示明细查询范围、核验结论与下一步。</p>
      <CollectionCards task={props.hostedTask} verification />
      <AnalysisPanel task={props.hostedTask} kind="verification" />
      <AnalysisPanel task={props.hostedTask} kind="hypothesis" legacy={insights.hypotheses} />
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>风险分级</h3></div></div>
        {!judged
          ? <p className="qccPwEmpty">{running ? "扫描与下钻后给出分级" : finished ? "报告未捕获" : "尽调开始后显示"}</p>
          : (
              <div className="qccPwRiskTiles">
                {(["红线", "关注", "信息"] as const).map(level => {
                  const items = real(level)
                  const cleared = items.length === 0 && (rows(level).length > 0 || insights.riskNoRecord)
                  return (
                    <div key={level} className="qccPwRiskTile" data-level={level} data-clear={cleared} data-empty={items.length === 0}>
                      <div className="qccPwRiskTileTop"><b>{level}</b><strong>{items.length}</strong></div>
                      {items.length ? items.map((item, index) => <p key={index}>{item.text}</p>) : <p>{cleared ? "已核查，本次未发现公开记录" : "未形成明确结论"}</p>}
                    </div>
                  )
                })}
                <p className="qccPwRiskBoundary">绿色表示本次公开数据核查未发现，不代表风险绝对不存在。</p>
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

function DeliveryPanel(props: { task: ActiveTask | undefined; hostedTask: HostedTask | null; status: WorkbenchStatus; toolCount: number; failedToolCount: number; cardCaptured: boolean; reportHtml: string | null }): JSX.Element {
  const ready = props.status === "ready"
  if (props.reportHtml !== null) {
    return (
      <section className="qccPwPanel">
        <header className="qccPwPageHeading">
          <div><p className="qccPwEyebrow">OUTPUT</p><h2>访前材料</h2></div>
          {props.task === undefined ? null : <span className="qccPwTaskId">{taskDisplayLabel(props.task.id)}</span>}
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
  const hostedProgress = props.hostedTask === null ? null : hostedProgressCopy(props.hostedTask)
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">OUTPUT</p><h2>访前材料</h2><p>不是资料堆砌，只回答四件事：去不去、见谁、聊什么、什么不能碰。</p></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{taskDisplayLabel(props.task.id)}</span>}
      </header>
      {props.task === undefined
        ? (props.cardCaptured ? <Feedback tone="success" title="报告可下载">当前会话中已有尽调报告，可直接下载；新的尽调将重新计数。</Feedback> : <Feedback tone="notice" title="等待设定">完成尽调设定后，报告结构与执行进度会显示在这里。</Feedback>)
        : ready
          ? <Feedback tone="success" title="报告已生成">执行已结束。可下载报告，或回到会话查看完整内容与事实引用。</Feedback>
          : props.status === "failed"
            ? <Feedback tone="error" title="本次尽调未完整完成">请回到会话查看错误；已取得事实仍可保留，失败维度不得写成零记录。</Feedback>
            : hostedProgress !== null
              ? <Feedback tone="notice" title={hostedProgress.title}>{hostedProgress.detail}</Feedback>
              : <Feedback tone="notice" title={props.status === "running" ? "正在尽调" : "等待继续"}>{props.status === "running" ? "正在同步当前会话的资料采集与证据核验；报告生成后即可下载。" : "请回到会话继续当前任务；报告生成后即可下载。"}</Feedback>}
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>报告结构</h3><p>固定八段，可压缩或展开；事实、推理、问题和覆盖边界不混写。</p></div></div>
        <div className="qccPwDeliverables">
          {deliverables.map(([number, title, detail]) => <div key={number} className="qccPwDeliverable"><span>{number}</span><div><b>{title}</b><small>{detail}</small></div></div>)}
        </div>
      </div>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>执行覆盖</h3><p>这是工作台从当前 Session 读取的真实执行事件，不是完整性评分。</p></div></div>
        <div className="qccPwCoverage">
          <div className="qccPwMetric"><strong>{props.toolCount}</strong><span>企查查查询次数（不设插件上限）</span></div>
          <div className="qccPwMetric"><strong>{props.failedToolCount}</strong><span>工具错误</span></div>
          <div className="qccPwMetric"><strong>{ready ? "已生成" : "待生成"}</strong><span>报告制品（不代表全量覆盖）</span></div>
        </div>
      </div>
    </section>
  )
}

export function HistoryPanel(props: {
  task: ActiveTask | undefined
  status: WorkbenchStatus
  hosted: HostedTask[]
  selected: HostedTask | null
  loadingTaskId: string | undefined
  downloadingTaskId: string | undefined
  onOpen(item: HostedTask): void
  onBack(): void
  onDownload(item: HostedTask): void
  onContinue?(item: HostedTask, intent: string, requestId: string): Promise<void>
}): JSX.Element {
  const [historyPhase, setHistoryPhase] = useState<PrevisitPhase>("output")
  const [intent, setIntent] = useState("")
  const [continuing, setContinuing] = useState(false)
  const [continueError, setContinueError] = useState("")
  const continuationId = useRef("")
  useEffect(() => { setHistoryPhase("output") }, [props.selected?.id])
  useEffect(() => { setIntent(""); setContinueError(""); continuationId.current = "" }, [props.selected?.id])
  const selectedReport = props.selected?.reportMarkdown?.trim()
  if (props.selected !== null) {
    const item = props.selected
    const status = hostedStatus(item)
    const origin = hostedTaskOrigin(item)
    const reportHtml = selectedReport === undefined || selectedReport === "" ? null : buildPrevisitReportHtml(selectedReport)
    return (
      <section className="qccPwPanel">
        <header className="qccPwPageHeading qccPwHistoryHeading">
          <div><p className="qccPwEyebrow">HISTORY DETAIL</p><h2>{item.entity?.fullName ?? item.query}</h2><p>{item.id} · {new Date(item.createdAt).toLocaleString("zh-CN")}</p></div>
          <button type="button" className="qccPwSecondary" onClick={props.onBack}>返回清单</button>
        </header>
        <div className="qccPwCard">
          <div className="qccPwCardHeader">
            <div><h3>任务详情</h3><p className="qccPwHistorySource" data-complete={origin.complete} title={origin.label}>{origin.label}</p></div>
            <span className="qccPwStatus" data-status={status}>{STATUS_LABELS[status]}</span>
          </div>
          <p className="qccPwNote">企查查查询 {item.used} 次 · {item.runs.filter(run => run.status === "failed").length} 个错误{item.completedAt === undefined ? "" : ` · 完成于 ${new Date(item.completedAt).toLocaleString("zh-CN")}`}</p>
          <p>报告 V{item.reportVersion ?? 1}{item.parentTaskId ? ` · 基于任务 ${item.parentTaskId}` : " · 初次尽调"}{item.supplementIntent ? ` · ${item.supplementIntent}` : ""}</p>
          {item.inheritedRuns?.length ? <p>沿用 {item.inheritedRuns.length} 个历史维度，非本次重新查询；原查询日期保留在基础版本。</p> : null}
          <div aria-label="报告版本记录">{props.hosted.filter(version => (version.rootTaskId ?? version.id) === (item.rootTaskId ?? item.id)).sort((a, b) => (a.reportVersion ?? 1) - (b.reportVersion ?? 1)).map(version => <button type="button" key={version.id} className="qccPwSecondary" disabled={version.id === item.id} onClick={() => props.onOpen(version)}>V{version.reportVersion ?? 1} · {version.reportReady ? "报告已生成" : "补充任务处理中"}</button>)}</div>
          {props.onContinue && item.reportReady && item.entity ? <div>
            <label>补充尽调要求<textarea style={{ width: "100%", boxSizing: "border-box", minHeight: 80 }} aria-label="补充尽调要求" value={intent} maxLength={4000} disabled={continuing} onKeyDown={event => event.stopPropagation()} onKeyUp={event => event.stopPropagation()} onChange={event => { setIntent(event.target.value); continuationId.current = "" }} /></label>
            <p>创建独立补充任务和新版本，不修改原报告。可在新任务会话提交材料正文或使用宿主可用文件读取能力，登记来源并交叉比对；专用舆情接口和格式转换尚未接入。</p>
            <button type="button" className="qccPwPrimary" disabled={continuing || !intent.trim()} onClick={() => {
              if (!continuationId.current) continuationId.current = `PV-${new Date().toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`
              setContinuing(true); setContinueError("")
              void props.onContinue!(item, intent.trim(), continuationId.current).catch(error => setContinueError(error instanceof Error ? error.message : String(error))).finally(() => setContinuing(false))
            }}>{continuing ? "正在提交…" : "创建补充任务"}</button>
            {continueError ? <p role="alert">{continueError}</p> : null}
          </div> : null}
          <div className="qccPwHistoryActions">
            <button
              type="button"
              className="qccPwPrimary"
              disabled={!item.reportReady || !origin.complete || props.downloadingTaskId === item.id}
              title={!origin.complete ? "旧记录缺少来源 Session，无法安全下载" : item.reportReady ? "下载已保存的 HTML 报告" : "报告尚未生成"}
              onClick={() => props.onDownload(item)}
            >{props.downloadingTaskId === item.id ? "正在下载…" : "下载报告 ↓"}</button>
          </div>
        </div>
        <nav className="qccPwStages" aria-label="历史任务阶段" role="tablist">{PREVISIT_PHASES.map(phase => <button key={phase} type="button" role="tab" aria-selected={historyPhase === phase} className="qccPwStage" data-selected={historyPhase === phase} onClick={() => setHistoryPhase(phase)}><span className="qccPwStageIcon"><Icon name={phase} /></span><strong>{PHASE_LABELS[phase]}</strong></button>)}</nav>
        {historyPhase === "target" || historyPhase === "scope" ? <div className="qccPwCard"><h3>{PHASE_LABELS[historyPhase]} · 保存记录</h3><p>原始检索：{item.query}</p><p>已锚定主体：{item.entity?.fullName ?? "未保存"}</p><p>统一社会信用代码：{item.entity?.creditCode ?? "未保存"}</p><p>深度：{item.depth}</p><p>仅展示历史保存字段；未保存的角色、关注范围不使用当前任务补填。</p></div> : null}
        {historyPhase === "collect" ? <OpportunityPanel task={undefined} hostedTask={item} status={status} events={hostedToolEvents(item)} insights={parseCardInsights(selectedReport ?? "")} /> : null}
        {historyPhase === "verify" ? <RiskPanel task={undefined} hostedTask={item} status={status} events={hostedToolEvents(item)} insights={parseCardInsights(selectedReport ?? "")} /> : null}
        {historyPhase !== "output" ? null : reportHtml === null
          ? <Feedback tone="notice" title={item.reportReady ? "正在读取报告" : "报告尚未生成"}>{item.reportReady ? "已找到报告制品，但正文暂未返回；请返回清单后重试。" : "任务详情已恢复，报告生成后可在这里查看并下载。"}</Feedback>
          : <div className="qccPwCard qccPwReportCard"><ReportViewer html={reportHtml} /></div>}
        <MaterialPanel task={item} />
        {item.reportReady && origin.complete ? <ReportFilesPanel key={item.id} taskId={item.id} sessionId={item.sessionId} /> : null}
        <p className="qccPwNote">历史详情只读取该任务所属 Session 的 Host 制品，不会重新调用企查查，也不会覆盖当前会话任务。</p>
      </section>
    )
  }
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading"><div><p className="qccPwEyebrow">HISTORY</p><h2>任务历史</h2><p>汇总当前 DSH Profile 中所有访前尽调 Session；任务状态与报告制品由 Host 保存。</p></div></header>
      {props.hosted.length > 0 ? props.hosted.map(item => {
        const status = hostedStatus(item)
        const origin = hostedTaskOrigin(item)
        return (
          <button
            type="button"
            className="qccPwCard qccPwHistoryCard"
            key={item.id}
            disabled={!origin.complete || props.loadingTaskId === item.id}
            title={origin.complete ? "打开任务详情与已保存报告" : "旧记录缺少来源 Session，只能查看清单摘要"}
            aria-label={`查看${item.entity?.fullName ?? item.query}的任务详情`}
            onClick={() => props.onOpen(item)}
          >
            <div className="qccPwCardHeader"><div><h3>{item.entity?.fullName ?? item.query}</h3><p>{item.id} · {new Date(item.createdAt).toLocaleString("zh-CN")}</p><p className="qccPwHistorySource" data-complete={origin.complete} title={origin.label}>{origin.label}</p></div><span className="qccPwStatus" data-status={status}>{STATUS_LABELS[status]}</span></div>
            <p className="qccPwNote">企查查查询 {item.used} 次 · {item.runs.filter(run => run.status === "failed").length} 个错误{item.completedAt === undefined ? "" : ` · 完成于 ${new Date(item.completedAt).toLocaleString("zh-CN")}`}</p>
            <span className="qccPwHistoryOpen">{props.loadingTaskId === item.id ? "正在打开…" : origin.complete ? "查看详情 →" : "仅摘要"}</span>
          </button>
        )
      }) : props.task === undefined ? (
        <Feedback tone="notice" title="暂无历史任务">从提示词生成器回填并发送，或在任一访前会话中直接发起尽调后，这里会汇总显示。</Feedback>
      ) : (
        <div className="qccPwCard">
          <div className="qccPwCardHeader"><div><h3>{taskDisplayLabel(props.task.id)}</h3><p>{new Date(props.task.createdAt).toLocaleString("zh-CN")}</p></div><span className="qccPwStatus" data-status={props.status}>{STATUS_LABELS[props.status]}</span></div>
          <pre className="qccPwPrompt">{props.task.prompt}</pre>
        </div>
      )}
      <p className="qccPwNote">点击任务可恢复详情并查看、下载已生成报告；不会重新执行查询。完整对话和证据引用仍保留在各自的 DSH 原生会话中。</p>
    </section>
  )
}

function PrevisitWorkbenchTab(props: BetterSidebarTabProps & {
  ctx: ClientContext
  shared: PrevisitStore
  reveal: ReturnType<typeof createRevealController>
  startPrompt: (sessionId: string, prompt: string, preserveDraft?: boolean) => Promise<number>
}): JSX.Element {
  const sessionId = props.scope.sessionId
  const shared = useSyncExternalStore(props.shared.subscribe, () => props.shared.get(sessionId))
  const task = shared.task
  const setTask = (fn: (current: ActiveTask | undefined) => ActiveTask | undefined) => props.shared.update(sessionId, s => ({ ...s, task: fn(s.task) }))
  const phase: PrevisitPhase = shared.view === "history" ? "target" : shared.view
  const setView = (view: PrevisitView) => { locatePrevisitView(props.shared, sessionId, view) }
  const setPhase = (next: PrevisitPhase) => setView(next)
  const [runtime, setRuntime] = useState<RuntimeState>(EMPTY_RUNTIME)
  const [plans, setPlans] = useState<PrevisitPlan[]>([])
  const [dismissedPlanIds, setDismissedPlanIds] = useState<string[]>([])
  const [sessionTasks, setSessionTasks] = useState<HostedTask[]>([])
  const pendingPlan = [...plans].reverse().find(plan => plan.taskIds.length === 0 && !sessionTasks.some(task => task.planId === plan.id) && !dismissedPlanIds.includes(plan.id))
  const lastPlanLocation = useRef<string>()
  const [hostedTask, setHostedTask] = useState<HostedTask | null>(null)
  const [hostedHistory, setHostedHistory] = useState<HostedTask[]>([])
  const [selectedHistory, setSelectedHistory] = useState<HostedTask | null>(null)
  const [loadingHistoryTaskId, setLoadingHistoryTaskId] = useState<string>()
  const [downloadingTaskId, setDownloadingTaskId] = useState<string>()
  const [hostError, setHostError] = useState<string>()
  const reconcilingReports = useRef(new Set<string>())
  const lastHostedLocation = useRef<string>()
  const [capturedReport, setCapturedReport] = useState<{ taskId: string; text: string } | null>(null)
  const [downloadNote, setDownloadNote] = useState<string>()
  const planTasks = hostedTask?.planId === undefined ? [] : sessionTasks.filter(task => task.planId === hostedTask.planId)
  const planTotal = Math.max(hostedTask?.planEntities ?? 0, planTasks.length)
  const planDone = planTasks.filter(task => task.reportReady).length

  useWorkbenchReveal(props.reveal, props)

  useEffect(() => {
    if (!props.visible) {
      setHostedTask(null)
      lastHostedLocation.current = undefined
      return
    }
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = async () => {
      try {
        const current = props.shared.get(sessionId)
        const records = await fetchHostedTasks({ kind: "current", sessionId })
        const summary = selectHostedTask(records, current.task, current.dismissedTaskIds)
        // 列表只传轻量状态；报告就绪后再按 ID 读取正文。
        const record = summary?.reportReady === true ? (await fetchHostedTask(summary.id, sessionId) ?? summary) : summary
        if (disposed) return
        setSessionTasks(records)
        setHostedTask(record)
        setHostError(undefined)
        if (record !== null) {
          const snapshot = props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot()
          const adopted = snapshot === undefined ? null : adoptTaskFromSnapshot(snapshot, sessionId, current.minimumNodeBaseline)
          const desiredView = hostedTaskView(record)
          const location = `${record.id}:${desiredView}`
          const awaitingPlan = snapshot === undefined ? undefined : derivePlans(snapshot).find(plan => plan.taskIds.length === 0 && !dismissedPlanIds.includes(plan.id) && !records.some(task => task.planId === plan.id))
          const shouldLocate = awaitingPlan === undefined && lastHostedLocation.current !== location
          props.shared.update(sessionId, state => syncHostedTaskState(state, record, adopted, shouldLocate))
          lastHostedLocation.current = location
        } else {
          lastHostedLocation.current = undefined
        }

        timer = setTimeout(refresh, record !== null && HOSTED_TERMINAL.has(record.state) ? 2000 : 1000)
      } catch (error) {
        if (!disposed) {
          setHostError(error instanceof Error ? error.message : String(error))
          timer = setTimeout(refresh, 2000)
        }
      }
    }
    void refresh()
    return () => { disposed = true; if (timer !== undefined) clearTimeout(timer) }

  }, [props.visible, sessionId, props.ctx, props.shared, shared.dismissedTaskIds.join("|"), dismissedPlanIds.join("|")])

  useEffect(() => {
    if (!props.visible || shared.view !== "history") return
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = async () => {
      try {
        const records = await fetchHostedTasks({ kind: "profile-history" })
        if (disposed) return
        setHostedHistory(records)
        setHostError(undefined)
        if (records.some(record => !record.reportReady && !HOSTED_TERMINAL.has(record.state))) timer = setTimeout(refresh, 2000)
      } catch (error) {
        if (!disposed) setHostError(error instanceof Error ? error.message : String(error))
      }
    }
    void refresh()
    return () => { disposed = true; if (timer !== undefined) clearTimeout(timer) }
  }, [props.visible, shared.view, sessionId])

  useEffect(() => {
    if (shared.view !== "history") {
      setSelectedHistory(null)
      setLoadingHistoryTaskId(undefined)
    }
  }, [shared.view])

  useEffect(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session
    if (face === undefined) {
      setRuntime(EMPTY_RUNTIME)
      return
    }
    const refresh = () => {
      const snapshot = face.getSnapshot()
      const derivedPlans = derivePlans(snapshot)
      setPlans(derivedPlans)
      const pending = [...derivedPlans].reverse().find(plan => plan.taskIds.length === 0 && !dismissedPlanIds.includes(plan.id))
      if (pending !== undefined && pending.id !== lastPlanLocation.current) {
        lastPlanLocation.current = pending.id
        if (props.shared.get(sessionId).view !== "history") locatePrevisitView(props.shared, sessionId, "target")
      }
      // 设定条 / 会话内直接发起的尽调：工作台自己从会话认领任务，不依赖谁点了按钮
      if (task === undefined) {
        const adopted = adoptTaskFromSnapshot(snapshot, sessionId, shared.minimumNodeBaseline)
        if (adopted !== null && !shared.dismissedTaskIds.includes(adopted.id)) {
          props.shared.update(sessionId, s => s.task !== undefined ? s : ({
            ...s,
            task: { ...adopted, createdAt: new Date().toISOString(), seenRunning: snapshot.running === true || (snapshot.nodes?.length ?? 0) > adopted.nodeBaseline + 1, selection: s.selection },
          }))
        }
      }
      const baseline = task?.nodeBaseline ?? (snapshot.nodes?.length ?? 0)
      const calls = collectRuntime(snapshot, baseline)
      setRuntime({
        available: typeof snapshot.running === "boolean",
        running: snapshot.running === true,
        partial: snapshot.partial !== null && snapshot.partial !== undefined,
        lastAgentError: snapshot.lastAgentError ?? null,
        ...calls,
      })
      if (snapshot.running === true) {
        setTask(current => current === undefined || current.seenRunning ? current : { ...current, seenRunning: true })
      }
      const captureTask = task === undefined ? undefined : { ...task, id: task.captureId ?? task.id }
      const projected = task === undefined ? undefined : deriveTasks(snapshot).find(projected => projected.id === task.id)
      const captured = snapshot.running === true ? null : projected !== undefined ? projected.report : captureTask === undefined ? null : captureTaskReport(snapshot, sessionId, captureTask)
      setCapturedReport(captured === null || task === undefined ? null : { taskId: task.id, text: captured })
    }
    refresh()
    return face.subscribe?.(refresh)
  }, [props.ctx, sessionId, task?.id, task?.nodeBaseline, shared.minimumNodeBaseline, shared.dismissedTaskIds.join("|"), dismissedPlanIds.join("|")])

  useEffect(() => {
    const report = capturedReport !== null && capturedReport.taskId === task?.id ? capturedReport.text : undefined
    if (hostedTask === null || hostedTask.reportReady || report === undefined || reconcilingReports.current.has(hostedTask.id)) return
    reconcilingReports.current.add(hostedTask.id)
    void fetch(`/previsit/api/tasks/${encodeURIComponent(hostedTask.id)}/report?sessionId=${encodeURIComponent(sessionId)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ reportMarkdown: report, status: hostedTask.runs.some(run => run.status === "failed") ? "partial" : "completed" }),
    }).then(async response => {
      const payload = await response.json() as { ok?: boolean; task?: HostedTask; message?: string }
      if (!response.ok || payload.ok === false || payload.task === undefined) throw new Error(payload.message ?? `报告状态同步失败（HTTP ${response.status}）`)
      setHostedTask(payload.task)
      setHostError(undefined)
    }).catch(error => {
      reconcilingReports.current.delete(hostedTask.id)
      setHostError(error instanceof Error ? error.message : String(error))
    })
  }, [capturedReport, hostedTask, task?.id])

  const hostedEvents = useMemo<ToolEvent[]>(() => hostedTask === null ? [] : hostedToolEvents(hostedTask), [hostedTask])
  const effectiveEvents = hostedTask === null ? runtime.toolEvents : hostedEvents
  const cardText = hostedTask?.reportMarkdown ?? (capturedReport?.taskId === task?.id ? capturedReport?.text ?? null : null)
  const hostStatus = hostedTask === null ? null : hostedStatus(hostedTask)
  const progressInput: SessionProgressInput = {
    hasTask: task !== undefined,
    running: hostStatus === null ? runtime.running : hostStatus === "running",
    seenRunning: task?.seenRunning ?? false,
    lastAgentError: hostedTask === null ? runtime.lastAgentError : hostedTask.state === "failed" ? hostedTask.lastError ?? "访前任务执行失败" : null,
    partial: runtime.partial,
    toolNames: hostedTask === null ? runtime.toolNames : hostedEvents.map(event => event.name),
    toolEvents: effectiveEvents,
    reportReady: cardText !== null,
  }
  const status = hostStatus ?? deriveWorkbenchStatus(progressInput)
  const phaseStates = derivePhaseStates(progressInput)
  const insights = useMemo(() => parseCardInsights(cardText), [cardText])
  const reportHtml = useMemo(() => cardText === null ? null : buildPrevisitReportHtml(cardText), [cardText])

  const newTask = () => {
    props.shared.update(sessionId, state => ({
      ...state,
      task: undefined,
      view: "target",
      minimumNodeBaseline: props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? state.minimumNodeBaseline,
      dismissedTaskIds: [...new Set([
        ...state.dismissedTaskIds,
        ...(state.task === undefined ? [] : [state.task.id, ...(state.task.captureId === undefined ? [] : [state.task.captureId])]),
        ...(hostedTask === null ? [] : [hostedTask.id]),
      ])],
    }))
    setRuntime(EMPTY_RUNTIME)
    setCapturedReport(null)
    setHostedTask(null)
  }
  const saveReportResponse = async (record: HostedTask, ownerSessionId: string): Promise<void> => {
    const response = await fetch(`/previsit/api/tasks/${encodeURIComponent(record.id)}/report?sessionId=${encodeURIComponent(ownerSessionId)}`, { headers: { accept: "text/html" } })
    if (!response.ok) {
      let message = `报告下载失败（HTTP ${response.status}）`
      try {
        const payload = await response.json() as { message?: string }
        if (payload.message !== undefined) message = payload.message
      } catch { /* HTML or empty error response. */ }
      throw new Error(message)
    }
    const blob = await response.blob()
    const url = URL.createObjectURL(blob)
    const anchor = document.createElement("a")
    anchor.href = url
    anchor.download = record.artifact?.fileName ?? `访前尽调报告_${record.entity?.fullName ?? record.query}.html`
    document.body.append(anchor)
    anchor.click()
    anchor.remove()
    setTimeout(() => URL.revokeObjectURL(url), 0)
  }

  const openHistoryTask = async (record: HostedTask) => {
    const origin = hostedTaskOrigin(record)
    if (!origin.complete) {
      setDownloadNote("该旧记录缺少 Workspace / Session 来源，只能查看清单摘要，无法安全读取详情。")
      return
    }
    setLoadingHistoryTaskId(record.id)
    setDownloadNote(undefined)
    try {
      const detail = await fetchHostedTask(record.id, record.sessionId)
      if (detail === null) throw new Error("该历史任务已不存在或当前 Profile 无权访问。")
      setSelectedHistory(detail)
    } catch (error) {
      setDownloadNote(error instanceof Error ? error.message : "历史任务详情读取失败，请稍后重试。")
    } finally {
      setLoadingHistoryTaskId(undefined)
    }
  }

  const downloadHistoryReport = async (record: HostedTask) => {
    const origin = hostedTaskOrigin(record)
    if (!record.reportReady || !origin.complete || downloadingTaskId !== undefined) return
    setDownloadingTaskId(record.id)
    setDownloadNote(undefined)
    try {
      await saveReportResponse(record, record.sessionId)
    } catch (error) {
      setDownloadNote(error instanceof Error ? error.message : "历史报告下载失败，请稍后重试。")
    } finally {
      setDownloadingTaskId(undefined)
    }
  }

  const downloadReport = async () => {
    if (cardText === null || status !== "ready") {
      setDownloadNote("当前任务的报告尚未就绪，请等待会话生成符合输出结构的报告。")
      return
    }
    try {
      setDownloadNote(undefined)
      let blob: Blob
      let fileName: string
      if (hostedTask?.artifact !== undefined) {
        await saveReportResponse(hostedTask, sessionId)
        return
      } else {
        const html = buildPrevisitReportHtml(cardText)
        const company = /(?:访前尽调报告|拜访作战卡)\s*·\s*([^\n（(锚｜]+)/.exec(cardText)?.[1]?.trim() || "访前尽调报告"
        blob = new Blob([html], { type: "text/html;charset=utf-8" })
        fileName = `访前尽调报告_${company}.html`
      }
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement("a")
      anchor.href = url
      anchor.download = fileName
      document.body.append(anchor)
      anchor.click()
      anchor.remove()
      setTimeout(() => URL.revokeObjectURL(url), 0)
    } catch (error) {
      setDownloadNote(error instanceof Error ? error.message : "报告下载失败，请稍后重试。")
    }
  }

  if (!props.visible || !isPrevisitSession(sessionId)) return <></>

  return (
    <section className="qccPwShell" aria-label="访前尽调工作台" data-status={status}>
      <header className="qccPwHeader">
        <div className="qccPwBrand">
          <span className="qccPwBrandIcon"><PrevisitLogo size={24} /></span>
          <div className="qccPwBrandCopy"><div className="qccPwTitleRow"><h1 className="qccPwTitle">访前尽调</h1><span className="qccPwLiveDot" data-status={status} /></div><p className="qccPwSubtitle">企查查事实驱动 · 机会与风险双引擎</p></div>
        </div>
        <div className="qccPwMeta"><span className="qccPwStatus" data-status={status}>{STATUS_LABELS[status]}</span><span className="qccPwSession">{hostedTask?.planId === undefined ? `当前 Session · ${sessionId.slice(0, 12)}` : `计划 ${planDone}/${planTotal} 家已出报告 · ${planTasks.length} 家已开始`}</span></div>
      </header>
      <nav className="qccPwTabs" aria-label="工作台视图">
        <button type="button" data-selected={shared.view !== "history"} onClick={() => setView("target")}>当前任务</button>
        <button type="button" data-selected={shared.view === "history"} onClick={() => setView("history")}>任务历史</button>
      </nav>
      {shared.view === "history" ? null : <nav className="qccPwStages" aria-label="访前任务阶段" role="tablist">
        {PREVISIT_PHASES.map(current => {
          const phaseState = phaseStates.find(item => item.id === current)
          const selected = shared.view === current
          return (
            <button key={current} type="button" role="tab" aria-selected={selected} className="qccPwStage" data-selected={selected} data-progress={phaseState?.progress ?? "idle"} onClick={() => setPhase(current)}>
              <span className="qccPwStageIcon" aria-hidden="true"><Icon name={current} /></span>
              <span className="qccPwStageCopy"><strong>{PHASE_LABELS[current]}</strong></span>
            </button>
          )
        })}
      </nav>}
      {shared.view !== "history" && status === "ready" && shared.view !== "output" ? <div className="qccPwCard" role="status">报告已生成，已保留当前阅读页面。<button type="button" onClick={() => setPhase("output")}>查看报告</button></div> : null}
      {shared.view !== "history" ? <ExecutionProgress task={hostedTask} status={status} modelRunning={runtime.available ? runtime.running : undefined} syncError={hostError ?? runtime.lastAgentError ?? undefined} /> : null}
      <div className="qccPwBody">
        {shared.view === "output" && hostedTask?.reportReady ? <ReportFilesPanel key={hostedTask.id} taskId={hostedTask.id} sessionId={hostedTask.sessionId} /> : null}
        {shared.view !== "history" ? <MaterialPanel task={hostedTask} /> : null}
        {shared.view === "target" && pendingPlan !== undefined ? <PlanCard key={pendingPlan.id} plan={pendingPlan} onConfirm={async message => { await props.startPrompt(sessionId, message, true); setDismissedPlanIds(ids => [...ids, pendingPlan.id]) }} onDismiss={() => setDismissedPlanIds(ids => [...ids, pendingPlan.id])} /> : null}
        {shared.view === "target" && pendingPlan === undefined ? <SetupPanel sessionId={sessionId} store={props.shared} task={task} input={resolveSessionInput(props.ctx, sessionId)} send={async prompt => { await props.startPrompt(sessionId, prompt, true) }} start={prompt => props.startPrompt(sessionId, prompt)} onStarted={() => setPhase("collect")} /> : null}
        {shared.view === "scope" ? <ScopePanel state={shared} task={task} hostedTask={hostedTask} /> : null}
        {shared.view === "collect" ? <OpportunityPanel task={task} hostedTask={hostedTask} status={status} events={effectiveEvents} insights={insights} /> : null}
        {shared.view === "verify" ? <RiskPanel task={task} hostedTask={hostedTask} status={status} events={effectiveEvents} insights={insights} /> : null}
        {shared.view === "output" ? <DeliveryPanel task={task} hostedTask={hostedTask} status={status} toolCount={hostedTask?.used ?? runtime.toolNames.length} failedToolCount={hostedTask?.runs.filter(run => run.status === "failed").length ?? runtime.failedToolCount} cardCaptured={cardText !== null} reportHtml={reportHtml} /> : null}
        {shared.view === "history" ? <HistoryPanel
          task={task}
          status={status}
          hosted={hostedHistory}
          selected={selectedHistory}
          loadingTaskId={loadingHistoryTaskId}
          downloadingTaskId={downloadingTaskId}
          onOpen={record => { void openHistoryTask(record) }}
          onBack={() => { setSelectedHistory(null); setDownloadNote(undefined) }}
          onDownload={record => { void downloadHistoryReport(record) }}
          onContinue={async (record, intent, requestId) => {
            if (hostedTask && !HOSTED_TERMINAL.has(hostedTask.state)) throw new Error("请先完成当前任务")
            const prompt = `请基于历史报告创建补充尽调，不修改原报告。调用 previsit_continue，parentTaskId=${record.id}，requestId=${requestId}，intent=${JSON.stringify(intent)}。沿用已确认主体，按返回基础报告补充已支持维度；旧证据保留原日期。使用新任务ID完成 previsit_finalize，生成完整更新报告。`
            const baseline = await props.startPrompt(sessionId, prompt)
            props.shared.update(sessionId, state => ({ ...state, view: "collect", dismissedTaskIds: [...new Set([...state.dismissedTaskIds, ...(state.task ? [state.task.id] : []), ...(hostedTask ? [hostedTask.id] : [])])], task: { id: requestId, prompt, company: record.entity?.fullName ?? record.query, createdAt: new Date().toISOString(), nodeBaseline: baseline, seenRunning: false, selection: state.selection } }))
          }}
        /> : null}
      </div>
      <footer className="qccPwFooter">
        <span className="qccPwFooterHint" data-tone={downloadNote === undefined && hostError === undefined ? undefined : "error"}>{downloadNote ?? hostError ?? "宿主收起侧拉或关闭本 Tab 不会取消任务，也不会删除历史或制品。"}</span>
        <div className="qccPwFooterActions">
          {shared.view !== "target" && task !== undefined ? <button type="button" className="qccPwSecondary" onClick={newTask}>新的尽调</button> : null}
          {shared.view === "output"
            ? <button type="button" className="qccPwPrimary" aria-disabled={status !== "ready" || cardText === null} title={status === "ready" ? "下载为 HTML 文件，可直接打开或打印" : "报告尚未就绪，点击查看原因"} onClick={() => { void downloadReport() }}>下载报告<span>↓</span></button>
            : null}
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
  let service: BetterSidebarService | undefined
  let unavailable = OPTIONAL_WORKBENCH_MESSAGE
  let active = true
  const shared = createPrevisitStore()
  const reveal = createRevealController()
  let unavailableNotice: HTMLElement | undefined
  ctx.effect(() => () => {
    active = false
    reveal.dispose()
    unavailableNotice?.remove()
  })
  const startPrompt = async (sessionId: string, prompt: string, preserveDraft = false): Promise<number> => {
    if (!active || !isPrevisitSession(sessionId)) throw new Error("访前会话不可用")
    const input = resolveSessionInput(ctx, sessionId)
    const draft = input?.state.getSnapshot().draft
    const conversation = ctx.sessions.scope?.(sessionId)?.get("conversation") as SessionConversation | undefined
    if (conversation === undefined) throw new Error("conversation unavailable")
    const baseline = ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? 0
    await submissions.submit(sessionId, prompt, () => conversation.send(prompt))
    if (active && !preserveDraft && draft !== undefined) clearSubmittedDraft(input, draft)
    return baseline
  }
  const openForSession = (sessionId: string, view?: PrevisitView) => {
    if (!active || !isPrevisitSession(sessionId)) return
    if (service === undefined) throw new Error(unavailable)
    if (!openWorkbench(service, { sessionId }, reveal)) throw new Error("访前工作台已在 Sidebar 设置中禁用；当前草稿和业务状态已保留，请启用后重试。")
    if (view !== undefined) locatePrevisitView(shared, sessionId, view)
  }
  const submissions = installSubmissionReveal(ctx, sessionId => {
    try { openForSession(sessionId, "collect") }
    catch (cause) {
      // No native notification service is required. Keep a single dismissible,
      // non-modal notice, without claiming that an already accepted send failed.
      unavailableNotice?.remove()
      const notice = document.createElement("div")
      notice.setAttribute("role", "status")
      notice.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:9999;max-width:420px;padding:16px;border:1px solid #94a3b8;border-radius:12px;background:#fff;color:#334155;box-shadow:0 4px 20px #0002"
      const detail = cause instanceof Error ? cause.message : "工作台暂不可用"
      const message = document.createElement("p")
      message.textContent = `任务已提交，但右侧工作台未展开。${detail} 请在原生会话中继续查看进展，无需重复提交。`
      const dismiss = document.createElement("button")
      dismiss.type = "button"; dismiss.textContent = "知道了"
      dismiss.addEventListener("click", () => notice.remove())
      notice.append(message, dismiss); document.body.append(notice)
      unavailableNotice = notice
    }
  })
  ctx.effect(() => () => submissions.dispose(), "dsh-pre-duediligence: accepted submission reveal")
  ctx.effect(() => installComposerImageBridge({
    owned: isPrevisitSession,
    currentSessionId: () => ctx.sessions.list?.getSnapshot().current,
    send: async (sessionId, prompt) => { await startPrompt(sessionId, prompt, true) },
    onError: (_sessionId, message) => {
      unavailableNotice?.remove()
      const notice = document.createElement("div")
      notice.className = "qccImportNotice"
      notice.setAttribute("role", "alert")
      notice.textContent = message
      const dismiss = document.createElement("button")
      dismiss.type = "button"; dismiss.textContent = "知道了"
      dismiss.addEventListener("click", () => notice.remove())
      notice.append(dismiss); document.body.append(notice); unavailableNotice = notice
    },
  }), "dsh-pre-duediligence: composer image import")
  ctx.effect(() => installStyles(), "dsh-pre-duediligence: QCC blue UI styles")
  ctx.effect(
    () => installOrdinarySessionGuard(ctx, ctx.workspaces ?? {}),
    "dsh-pre-duediligence: ordinary Session reuse (DSH 0.1.1)",
  )
  ctx.inject(["uiWorkspace"], workspaceCtx => {
    const navigation = workspaceCtx.uiWorkspace
      ?? (workspaceCtx.get?.("uiWorkspace") as WorkspaceNavigation | undefined)
    if (navigation !== undefined) {
      workspaceCtx.effect(
        () => installOrdinarySessionGuard(workspaceCtx, navigation),
        "dsh-pre-duediligence: ordinary Session reuse",
      )
    }
  })
  ctx.inject(["betterSidebar"], sidebarCtx => {
    sidebarCtx.effect(() => {
      const candidate = sidebarCtx.betterSidebar
      try {
        if (candidate === undefined) return
        const dispose = registerWorkbenchTab(candidate, props => <PrevisitWorkbenchTab key={props.scope.sessionId} {...props} ctx={ctx} shared={shared} reveal={reveal} startPrompt={startPrompt} />)
        service = candidate
        return () => { if (service === candidate) service = undefined; dispose() }
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : "工作台接口不兼容"
        unavailable = `${detail}；当前草稿和业务状态已保留，基础会话仍可使用。`
      }
    })
  })
  registerLeftSidebarLauncher(ctx, () => active)
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-pre-duediligence:home",
    order: 110,
    inject: (sessionId: string) => ({
      openWorkbench: (view?: PrevisitView) => { openForSession(sessionId, view) },
    }),
  }, PrevisitHome))
  ctx.slots.inject("conversation.input.overlay", () => ctx.slots.register({
    name: "conversation.input.overlay",
    id: "dsh-pre-duediligence:prompt-generator",
    order: 110,
    inject: () => ({ store: shared }),
  }, PrevisitPromptGenerator))
}
