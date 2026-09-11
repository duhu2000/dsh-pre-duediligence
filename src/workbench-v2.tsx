import { useEffect, useMemo, useRef, useState, useSyncExternalStore, type ReactNode } from "react"

import { BUDGET_OPTIONS, FOCUS_OPTIONS, OUTPUT_OPTIONS, PURPOSE_OPTIONS, ROLE_OPTIONS, type ComposerOption } from "./composer-model.js"
import { PrevisitLogo } from "./previsit-brand.js"
import { PrevisitFields, usePrevisitComposer } from "./previsit-dock.js"
import { resolveSessionInput, clearSubmittedDraft, type SessionInput } from "./session-input.js"
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
import { HOSTED_TERMINAL, hostedStatus, hostedTaskView, selectHostedTask, syncHostedTaskState, type HostedTask } from "./hosted-task-sync.js"
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
import { adoptTaskFromSnapshot, buildPrevisitReportHtml, captureTaskReport } from "./report-export.js"
import { BUSINESS_STATES, opportunityDimensions, opportunitySteps, parseCardInsights, riskDimensions, riskSteps, type CardInsights, type Dimension, type Step, type ToolEvent } from "./stage-insights.js"

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

async function fetchHostedTask(taskId: string, sessionId: string): Promise<HostedTask | null> {
  const response = await fetch(`/previsit/api/tasks/${encodeURIComponent(taskId)}?sessionId=${encodeURIComponent(sessionId)}`, { headers: { accept: "application/json" } })
  if (response.status === 404) return null
  const payload = await response.json() as { ok?: boolean; task?: HostedTask; message?: string }
  if (!response.ok || payload.ok === false || payload.task === undefined) throw new Error(payload.message ?? `任务状态读取失败（HTTP ${response.status}）`)
  return payload.task
}

async function fetchHostedHistory(sessionId: string): Promise<HostedTask[]> {
  const response = await fetch(`/previsit/api/tasks?sessionId=${encodeURIComponent(sessionId)}`, { headers: { accept: "application/json" } })
  const payload = await response.json() as { ok?: boolean; tasks?: HostedTask[]; message?: string }
  if (!response.ok || payload.ok === false || !Array.isArray(payload.tasks)) throw new Error(payload.message ?? `任务历史读取失败（HTTP ${response.status}）`)
  return payload.tasks
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

function collectRuntime(snapshot: ConversationSnapshot, baseline: number): Omit<RuntimeState, "running" | "partial" | "lastAgentError"> {
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

function SetupPanel(props: { sessionId: string; store: PrevisitStore; task: ActiveTask | undefined; input: SessionInput | undefined; start: (prompt: string) => Promise<number>; onStarted: () => void }): JSX.Element {
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
  })
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">TARGET</p><h2>对象与目标</h2><p>确认拜访主体、角色与目标；前端不预设业务结论。</p></div>
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

const optionLabel = (options: readonly ComposerOption[], id: string | undefined): string =>
  id === undefined ? "未选择" : (options.find(option => option.id === id)?.label ?? "未选择")

function ScopePanel(props: { state: PrevisitSessionState; task: ActiveTask | undefined }): JSX.Element {
  const focus = props.state.selection.focus.map(id => optionLabel(FOCUS_OPTIONS, id)).join("、") || "按 Skill 标准范围"
  const rows = [
    ["拜访对象", props.state.company.trim() || "尚未填写"],
    ["我的角色", optionLabel(ROLE_OPTIONS, props.state.selection.role)],
    ["拜访场景", optionLabel(PURPOSE_OPTIONS, props.state.selection.purpose)],
    ["重点关注", focus],
    ["尽调深度", optionLabel(BUDGET_OPTIONS, props.state.selection.budget)],
    ["输出形态", optionLabel(OUTPUT_OPTIONS, props.state.selection.output)],
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
  const done = props.items.filter(d => d.status === "done" || d.status === "no-data").length
  const review = props.items.filter(d => d.status === "unknown" || d.status === "no-permission").length
  return (
    <div className="qccPwCard">
      <div className="qccPwCardHeader"><div><h3>{props.title}</h3></div>{done > 0 ? <span className="qccPwMode">{done} 项完成</span> : review > 0 ? <span className="qccPwMode" data-tone="review">{review} 项待核验</span> : null}</div>
      {props.items.length === 0 ? <p className="qccPwEmpty">{props.empty}</p> : (
        <div className="qccPwDims">
          {props.items.map(item => <span key={item.label} className="qccPwDim" data-status={item.status}>{item.label} · {TOOL_OUTCOME_LABELS[item.status]}</span>)}
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
    <StagePanel eyebrow="COLLECT" title="资料采集" task={props.task}>
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
    <StagePanel eyebrow="VERIFY" title="证据核验" task={props.task}>
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

function DeliveryPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; toolCount: number; toolLimit?: number; failedToolCount: number; cardCaptured: boolean; reportHtml: string | null }): JSX.Element {
  const ready = props.status === "ready"
  if (props.reportHtml !== null) {
    return (
      <section className="qccPwPanel">
        <header className="qccPwPageHeading">
          <div><p className="qccPwEyebrow">OUTPUT</p><h2>访前材料</h2></div>
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
        <div><p className="qccPwEyebrow">OUTPUT</p><h2>访前材料</h2><p>不是资料堆砌，只回答四件事：去不去、见谁、聊什么、什么不能碰。</p></div>
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
          <div className="qccPwMetric"><strong>{props.toolLimit === undefined ? props.toolCount : `${props.toolCount}/${props.toolLimit}`}</strong><span>企查查额度调用</span></div>
          <div className="qccPwMetric"><strong>{props.failedToolCount}</strong><span>工具错误</span></div>
          <div className="qccPwMetric"><strong>{ready ? "已生成" : "待生成"}</strong><span>报告制品（不代表全量覆盖）</span></div>
        </div>
      </div>
    </section>
  )
}

function HistoryPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; hosted: HostedTask[] }): JSX.Element {
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading"><div><p className="qccPwEyebrow">HISTORY</p><h2>任务历史</h2><p>任务状态与报告制品由 Host 保存；完整消息和证据引用仍保留在 DSH 原生会话。</p></div></header>
      {props.hosted.length > 0 ? props.hosted.map(item => {
        const status = hostedStatus(item)
        return (
          <div className="qccPwCard" key={item.id}>
            <div className="qccPwCardHeader"><div><h3>{item.entity?.fullName ?? item.query}</h3><p>{item.id} · {new Date(item.createdAt).toLocaleString("zh-CN")}</p></div><span className="qccPwStatus" data-status={status}>{STATUS_LABELS[status]}</span></div>
            <p className="qccPwNote">企查查额度 {item.used}/{item.limit} · {item.runs.filter(run => run.status === "failed").length} 个错误{item.completedAt === undefined ? "" : ` · 完成于 ${new Date(item.completedAt).toLocaleString("zh-CN")}`}</p>
          </div>
        )
      }) : props.task === undefined ? (
        <Feedback tone="notice" title="当前没有已认领任务">从提示词生成器回填并发送，或在会话中直接发起访前尽调后，这里会显示当前任务。</Feedback>
      ) : (
        <div className="qccPwCard">
          <div className="qccPwCardHeader"><div><h3>{props.task.id}</h3><p>{new Date(props.task.createdAt).toLocaleString("zh-CN")}</p></div><span className="qccPwStatus" data-status={props.status}>{STATUS_LABELS[props.status]}</span></div>
          <pre className="qccPwPrompt">{props.task.prompt}</pre>
        </div>
      )}
      <p className="qccPwNote">工作台不创建脱离会话的浏览器历史库，也不会把其它 Session 的任务合并到这里。</p>
    </section>
  )
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
  const phase: PrevisitPhase = shared.view === "history" ? "target" : shared.view
  const setView = (view: PrevisitView) => { locatePrevisitView(props.shared, sessionId, view) }
  const setPhase = (next: PrevisitPhase) => setView(next)
  const [runtime, setRuntime] = useState<RuntimeState>(EMPTY_RUNTIME)
  const [hostedTask, setHostedTask] = useState<HostedTask | null>(null)
  const [hostedHistory, setHostedHistory] = useState<HostedTask[]>([])
  const [hostError, setHostError] = useState<string>()
  const reconcilingReports = useRef(new Set<string>())
  const lastHostedLocation = useRef<string>()
  const [completedTaskId, setCompletedTaskId] = useState<string>()
  const [capturedReport, setCapturedReport] = useState<{ taskId: string; text: string } | null>(null)
  const [downloadNote, setDownloadNote] = useState<string>()

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
        const records = await fetchHostedHistory(sessionId)
        const summary = selectHostedTask(records, current.task, current.dismissedTaskIds)
        // 列表只传轻量状态；报告就绪后再按 ID 读取正文。
        const record = summary?.reportReady === true ? (await fetchHostedTask(summary.id, sessionId) ?? summary) : summary
        if (disposed) return
        setHostedTask(record)
        setHostError(undefined)
        if (record !== null) {
          const snapshot = props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot()
          const adopted = snapshot === undefined ? null : adoptTaskFromSnapshot(snapshot, sessionId, current.minimumNodeBaseline)
          const desiredView = hostedTaskView(record)
          const location = `${record.id}:${desiredView}`
          const shouldLocate = lastHostedLocation.current !== location
          props.shared.update(sessionId, state => syncHostedTaskState(state, record, adopted, shouldLocate))
          lastHostedLocation.current = location
        } else {
          lastHostedLocation.current = undefined
        }
        if (record === null || (!record.reportReady && !HOSTED_TERMINAL.has(record.state))) timer = setTimeout(refresh, 1000)
      } catch (error) {
        if (!disposed) {
          setHostError(error instanceof Error ? error.message : String(error))
          timer = setTimeout(refresh, 2000)
        }
      }
    }
    void refresh()
    return () => { disposed = true; if (timer !== undefined) clearTimeout(timer) }
  }, [props.visible, sessionId, props.ctx, props.shared, shared.dismissedTaskIds.join("|")])

  useEffect(() => {
    if (!props.visible || shared.view !== "history") return
    let disposed = false
    let timer: ReturnType<typeof setTimeout> | undefined
    const refresh = async () => {
      try {
        const records = await fetchHostedHistory(sessionId)
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
    const face = props.ctx.sessions.binding?.(sessionId)?.session
    if (face === undefined) {
      return
    }
    const refresh = () => {
      const snapshot = face.getSnapshot()
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
        running: snapshot.running === true,
        partial: snapshot.partial !== null && snapshot.partial !== undefined,
        lastAgentError: snapshot.lastAgentError ?? null,
        ...calls,
      })
      if (snapshot.running === true) {
        setTask(current => current === undefined || current.seenRunning ? current : { ...current, seenRunning: true })
      }
      const captureTask = task === undefined ? undefined : { ...task, id: task.captureId ?? task.id }
      const captured = captureTask === undefined ? null : captureTaskReport(snapshot, sessionId, captureTask)
      setCapturedReport(captured === null || task === undefined ? null : { taskId: task.id, text: captured })
    }
    refresh()
    return face.subscribe?.(refresh)
  }, [props.ctx, sessionId, task?.id, task?.nodeBaseline, shared.minimumNodeBaseline, shared.dismissedTaskIds.join("|")])

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

  const hostedEvents = useMemo<ToolEvent[]>(() => hostedTask === null ? [] : [
    { name: "previsit_begin", status: "done" },
    ...(hostedTask.entity === undefined ? [] : [{ name: "previsit_confirm_entity", status: "done" as const }]),
    ...hostedTask.runs.map(run => ({ name: run.toolName ?? `previsit_${run.dimension}`, status: run.status })),
  ], [hostedTask])
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

  useEffect(() => {
    if (status !== "ready" || task === undefined || completedTaskId === task.id) {
      return
    }
    setCompletedTaskId(task.id)
    if (shared.view !== "history") setPhase("output")
  }, [completedTaskId, status, task, shared.view])

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
        const response = await fetch(`/previsit/api/tasks/${encodeURIComponent(hostedTask.id)}/report?sessionId=${encodeURIComponent(sessionId)}`, { headers: { accept: "text/html" } })
        if (!response.ok) throw new Error(`报告下载失败（HTTP ${response.status}）`)
        blob = await response.blob()
        fileName = hostedTask.artifact.fileName
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
        <div className="qccPwMeta"><span className="qccPwStatus" data-status={status}>{STATUS_LABELS[status]}</span><span className="qccPwSession">当前 Session · {sessionId.slice(0, 12)}</span></div>
      </header>
      <nav className="qccPwTabs" aria-label="工作台视图">
        <button type="button" data-selected={shared.view !== "history"} onClick={() => setView("target")}>当前任务</button>
        <button type="button" data-selected={shared.view === "history"} onClick={() => setView("history")}>任务历史</button>
      </nav>
      <nav className="qccPwStages" aria-label="访前任务阶段" role="tablist">
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
      </nav>
      <div className="qccPwBody">
        {shared.view === "target" ? <SetupPanel sessionId={sessionId} store={props.shared} task={task} input={resolveSessionInput(props.ctx, sessionId)} start={prompt => props.startPrompt(sessionId, prompt)} onStarted={() => setPhase("collect")} /> : null}
        {shared.view === "scope" ? <ScopePanel state={shared} task={task} /> : null}
        {shared.view === "collect" ? <OpportunityPanel task={task} status={status} events={effectiveEvents} insights={insights} /> : null}
        {shared.view === "verify" ? <RiskPanel task={task} status={status} events={effectiveEvents} insights={insights} /> : null}
        {shared.view === "output" ? <DeliveryPanel task={task} status={status} toolCount={hostedTask?.used ?? runtime.toolNames.length} {...(hostedTask === null ? {} : { toolLimit: hostedTask.limit })} failedToolCount={hostedTask?.runs.filter(run => run.status === "failed").length ?? runtime.failedToolCount} cardCaptured={cardText !== null} reportHtml={reportHtml} /> : null}
        {shared.view === "history" ? <HistoryPanel task={task} status={status} hosted={hostedHistory} /> : null}
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
  ctx.effect(() => () => {
    active = false
    reveal.dispose()
  })
  const startPrompt = async (sessionId: string, prompt: string): Promise<number> => {
    if (!active || !isPrevisitSession(sessionId)) throw new Error("访前会话不可用")
    const input = resolveSessionInput(ctx, sessionId)
    const draft = input?.state.getSnapshot().draft
    const conversation = ctx.sessions.scope?.(sessionId)?.get("conversation") as SessionConversation | undefined
    if (conversation === undefined) throw new Error("conversation unavailable")
    const baseline = ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? 0
    await conversation.send(prompt)
    if (active && draft !== undefined) clearSubmittedDraft(input, draft)
    return baseline
  }
  const openForSession = (sessionId: string, view?: PrevisitView) => {
    if (!active || !isPrevisitSession(sessionId)) return
    if (service === undefined) throw new Error(unavailable)
    if (!openWorkbench(service, { sessionId }, reveal)) throw new Error("访前工作台已在 Sidebar 设置中禁用；当前草稿和业务状态已保留，请启用后重试。")
    if (view !== undefined) locatePrevisitView(shared, sessionId, view)
  }
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
