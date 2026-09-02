import { useEffect, useMemo, useState, type ReactNode } from "react"

import { IconSearchOutline16 } from "@deepseek-ai/dsh-client-ui-primitives"

import {
  BUDGET_OPTIONS,
  EMPTY_COMPOSER_STATE,
  EMPTY_SELECTION,
  FOCUS_OPTIONS,
  OUTPUT_OPTIONS,
  PURPOSE_OPTIONS,
  ROLE_OPTIONS,
  applySelection,
  createTaskId,
  generateFromSelection,
  serializePrevisitRequest,
  updateManualText,
  validateComposerText,
  type ComposerOption,
  type ComposerSelection,
  type ComposerState,
} from "./composer-model.js"
import {
  createRevealController,
  openWorkbench,
  registerWorkbenchTab,
  useWorkbenchReveal,
  type BetterSidebarService,
  type BetterSidebarTabProps,
  type RevealController,
} from "./better-sidebar.js"
import {
  PREVISIT_PHASES,
  derivePhaseStates,
  deriveWorkbenchStatus,
  isOpportunityTool,
  isRiskTool,
  type PrevisitPhase,
  type SessionProgressInput,
  type WorkbenchStatus,
} from "./workbench-state.js"
import { WORKBENCH_CSS } from "./workbench-style.js"

export const inject = ["slots", "sessions", "workspaces", "conversation", "betterSidebar"] as const

const STYLE_ID = "qcc-previsit-dsh-workbench-v2"
const PHASE_LABELS: Record<PrevisitPhase, { label: string; description: string }> = {
  prepare: { label: "定义拜访", description: "角色、目的与范围" },
  opportunity: { label: "机会研判", description: "状态、假设与反证" },
  risk: { label: "风险核验", description: "扫描、下钻与影响" },
  delivery: { label: "作战交付", description: "必问、触达与行动" },
}
const STATUS_LABELS: Record<WorkbenchStatus, string> = {
  empty: "等待定义任务",
  "waiting-agent": "等待 Agent",
  running: "正在尽调",
  ready: "作战卡已就绪",
  failed: "任务需处理",
}

type SnapshotStore<T> = {
  getSnapshot(): T
  subscribe?(listener: () => void): () => void
}

type ConversationNode = {
  kind?: string
  call?: { name?: string } | null
  isError?: boolean
}

type ConversationSnapshot = {
  running?: boolean
  partial?: unknown | null
  runningCalls?: Array<{ name?: string }>
  nodes?: ConversationNode[]
  lastAgentError?: string | null
}

type SessionListSnapshot = {
  current?: string
  byId: Record<string, { cwd?: string }>
}

type SessionConversation = {
  send(text: string): Promise<void>
}

type ClientContext = {
  slots: {
    inject(name: string, setup: () => unknown): unknown
    register(
      options: Readonly<Record<string, unknown>>,
      component: (props: Record<string, unknown>) => JSX.Element | null,
    ): unknown
  }
  sessions: {
    list: SnapshotStore<SessionListSnapshot>
    binding?(sessionId: string): { session: SnapshotStore<ConversationSnapshot> } | undefined
    scope?(sessionId: string): { get(name: string): unknown } | undefined
    open?(sessionId: string): void
  }
  workspaces: {
    startSession?(): void
  }
  betterSidebar: BetterSidebarService
  effect(setup: () => void | (() => void), label?: string): unknown
}

type ActiveTask = {
  id: string
  prompt: string
  createdAt: string
  nodeBaseline: number
  seenRunning: boolean
  selection: ComposerSelection
}

type RuntimeState = {
  running: boolean
  partial: boolean
  lastAgentError: string | null
  toolNames: string[]
  failedToolCount: number
}

const EMPTY_RUNTIME: RuntimeState = {
  running: false,
  partial: false,
  lastAgentError: null,
  toolNames: [],
  failedToolCount: 0,
}

type NavigationController = {
  attach(sessionId: string, listener: (phase: PrevisitPhase) => void): () => void
  request(sessionId: string, phase: PrevisitPhase): void
}

function createNavigationController(): NavigationController {
  const listeners = new Map<string, (phase: PrevisitPhase) => void>()
  const pending = new Map<string, PrevisitPhase>()
  return {
    attach(sessionId, listener) {
      listeners.set(sessionId, listener)
      const requested = pending.get(sessionId)
      if (requested !== undefined) {
        pending.delete(sessionId)
        listener(requested)
      }
      return () => {
        if (listeners.get(sessionId) === listener) {
          listeners.delete(sessionId)
        }
      }
    },
    request(sessionId, phase) {
      const listener = listeners.get(sessionId)
      if (listener === undefined) {
        pending.set(sessionId, phase)
      } else {
        listener(phase)
      }
    },
  }
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
  for (const call of snapshot.runningCalls ?? []) {
    if (typeof call.name === "string") {
      toolNames.add(call.name)
    }
  }
  let failedToolCount = 0
  for (const node of (snapshot.nodes ?? []).slice(baseline)) {
    if (node.kind !== "tool-result") {
      continue
    }
    if (typeof node.call?.name === "string") {
      toolNames.add(node.call.name)
    }
    if (node.isError === true) {
      failedToolCount += 1
    }
  }
  return { toolNames: [...toolNames], failedToolCount }
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

function FilterGroup(props: {
  label: string
  hint: string
  options: readonly ComposerOption[]
  selected: string[]
  onToggle(id: string): void
}): JSX.Element {
  return (
    <div className="qccPwFilterRow">
      <div className="qccPwFilterLabel"><strong>{props.label}</strong><span>{props.hint}</span></div>
      <div className="qccPwChoices">
        {props.options.map(option => (
          <button
            key={option.id}
            type="button"
            className="qccPwChoice"
            aria-pressed={props.selected.includes(option.id)}
            onClick={() => props.onToggle(option.id)}
          >{option.label}</button>
        ))}
      </div>
    </div>
  )
}

function PreparePanel(props: {
  composer: ComposerState
  selection: ComposerSelection
  error: string | undefined
  setComposer(state: ComposerState): void
  toggleSingle(key: "role" | "purpose" | "budget" | "output", id: string): void
  toggleFocus(id: string): void
}): JSX.Element {
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">PREVISIT BRIEF</p><h2>先定义这次拜访</h2><p>可以直接描述任务，也可以点选条件生成自然语言。最终发送的是你看到的这段文字。</p></div>
      </header>
      <div className="qccPwCard">
        <div className="qccPwCardHeader">
          <div><h3>任务描述</h3><p>企业简称会由 Agent 消歧；涉及集团或分支时会确认实际签约主体。</p></div>
          <span className="qccPwMode" data-manual={props.composer.mode === "manual"}>
            {props.composer.mode === "manual" ? "保护手工内容" : "条件自动拼句"}
          </span>
        </div>
        <div className="qccPwComposer">
          <label>
            <span>告诉 Agent 要见谁、为什么见</span>
            <textarea
              value={props.composer.text}
              placeholder="直接说要见谁，或先点下方条件生成问句。例如：明天去拜访浙江台华新材料集团股份有限公司"
              onChange={event => props.setComposer(updateManualText(props.composer, event.target.value))}
            />
          </label>
          <div className="qccPwComposerHint"><span>建议使用企业完整注册名称或统一社会信用代码</span><span>{props.composer.text.length} 字</span></div>
        </div>
        {props.composer.mode === "manual" ? <p className="qccPwManualHint">已检测到手工内容。继续点选不会覆盖原文；点击底部“按条件补充”后会另起一句追加。</p> : null}
        <div className="qccPwFilters">
          <FilterGroup label="我的角色" hint="决定角色包与关注权重" options={ROLE_OPTIONS} selected={props.selection.role === undefined ? [] : [props.selection.role]} onToggle={id => props.toggleSingle("role", id)} />
          <FilterGroup label="拜访目的" hint="首次、谈判、签约或复访" options={PURPOSE_OPTIONS} selected={props.selection.purpose === undefined ? [] : [props.selection.purpose]} onToggle={id => props.toggleSingle("purpose", id)} />
          <FilterGroup label="重点关注" hint="最多选择 4 项" options={FOCUS_OPTIONS} selected={props.selection.focus} onToggle={props.toggleFocus} />
          <FilterGroup label="时间预算" hint="约 8 / 18 / 40 次调用" options={BUDGET_OPTIONS} selected={props.selection.budget === undefined ? [] : [props.selection.budget]} onToggle={id => props.toggleSingle("budget", id)} />
          <FilterGroup label="输出形态" hint="控制作战卡展开方式" options={OUTPUT_OPTIONS} selected={props.selection.output === undefined ? [] : [props.selection.output]} onToggle={id => props.toggleSingle("output", id)} />
        </div>
        {props.error === undefined ? null : <p className="qccPwError" role="alert">{props.error}</p>}
      </div>
    </section>
  )
}

function OpportunityPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; tools: string[] }): JSX.Element {
  const tools = props.tools.filter(isOpportunityTool)
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">OPPORTUNITY ENGINE</p><h2>经营状态与业务假设</h2><p>先识别企业正在发生什么，再从“状态 × 角色”生成可证伪假设；风险轨与机会轨各自求真。</p></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
      </header>
      {props.task === undefined ? <Feedback tone="notice" title="还没有访前任务">先到“定义拜访”完成任务描述并发送。</Feedback> : null}
      <div className="qccPwGrid2">
        <div className="qccPwCard qccPwEngine">
          <div className="qccPwEngineTop"><span><Icon name="opportunity" /></span><span className="qccPwEngineTag">引擎 A</span></div>
          <h3>经营状态识别</h3>
          <p>至少两项独立行为信号，或一项官方许可/验收直接证据，才进入明确状态。</p>
          <ul><li>信号必须带日期</li><li>超过 24 个月只作沿革</li><li>不足时降级为清单简报</li></ul>
        </div>
        <div className="qccPwCard qccPwEngine">
          <div className="qccPwEngineTop"><span><Icon name="prepare" /></span><span className="qccPwEngineTag">引擎 B</span></div>
          <h3>假设与反证</h3>
          <p>每个假设必须包含支持、反对、未知三栏；未知转为现场必问，未反证则置信度封顶为低。</p>
          <ul><li>P0/P1/P2 粗排优先级</li><li>公开阶段不使用高置信度</li><li>假设必须回指事实证据</li></ul>
        </div>
      </div>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>八种有限经营状态</h3><p>由 Agent 基于本次企查查事实判定，工作台不虚构状态。</p></div></div>
        <div className="qccPwStateGrid">{["产能建设期", "客户导入期", "产能爬坡期", "订单增长期", "稳定经营期", "收缩承压期", "资本运作期", "风险暴露期"].map(state => <span key={state} className="qccPwState">{state}</span>)}</div>
      </div>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>本 Session 的机会侧调用</h3><p>仅展示真实发生的企查查企业、经营与知识产权工具事件。</p></div><span className="qccPwMode">{tools.length} 项</span></div>
        {tools.length === 0 ? <p className="qccPwEmpty">{props.status === "running" ? "Agent 正在建立主体与信号集…" : "任务发送后在这里显示调用记录"}</p> : <div className="qccPwToolList">{tools.map(tool => <span key={tool}>{tool.replace(/^mcp__/, "")}</span>)}</div>}
      </div>
    </section>
  )
}

function RiskPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; tools: string[]; failedToolCount: number }): JSX.Element {
  const tools = props.tools.filter(isRiskTool)
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">RISK ENGINE</p><h2>风险扫描与影响核验</h2><p>风险不是机会的反证。它改变机会优先级与拜访策略；进入风险暴露期时才整体优先。</p></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
      </header>
      <div className="qccPwCard">
        <div className="qccPwRiskRule">
          <span className="qccPwRiskNumber">01</span>
          <div><h3>先全量扫描，再按非零维度下钻</h3><p>扫描计数只用于分诊，不等于风险结论；必须结合当事人角色、案件状态、金额原值和发生时间逐案判断。</p></div>
        </div>
        <div className="qccPwRiskBands">
          <div className="qccPwRiskBand" data-tone="red"><b>红线</b><span>先内部核实，不建议当面直问</span></div>
          <div className="qccPwRiskBand" data-tone="amber"><b>关注</b><span>结合角色、状态和时间判断</span></div>
          <div className="qccPwRiskBand"><b>未覆盖</b><span>失败与零记录必须严格区分</span></div>
        </div>
      </div>
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>本 Session 的风险侧调用</h3><p>零计数不得下钻；服务缺失或调用失败必须写入覆盖声明。</p></div><span className="qccPwMode">{tools.length} 项 · {props.failedToolCount} 错误</span></div>
        {tools.length === 0 ? <p className="qccPwEmpty">{props.status === "running" ? "等待企业风险扫描…" : "尚无风险工具事件"}</p> : <div className="qccPwToolList">{tools.map(tool => <span key={tool}>{tool.replace(/^mcp__/, "")}</span>)}</div>}
      </div>
    </section>
  )
}

function DeliveryPanel(props: { task: ActiveTask | undefined; status: WorkbenchStatus; toolCount: number; failedToolCount: number }): JSX.Element {
  const ready = props.status === "ready"
  const deliverables = [
    ["①", "一句话核心研判", "状态、机会方向与验证重点"],
    ["②", "最近发生了什么", "3–5 个带日期与来源的变化"],
    ["③", "可能发生什么", "P0/P1 假设与支持/反对/未知"],
    ["④", "红线与提示", "风险如何改变拜访策略"],
    ["⑤", "现场必问 3 件事", "为什么问与答 A/B 下一步"],
    ["⑥", "触达与开场白", "来源、归属、用途与转接请求"],
    ["⑦", "覆盖度声明", "已查、未查、失败与证据层级"],
  ]
  return (
    <section className="qccPwPanel">
      <header className="qccPwPageHeading">
        <div><p className="qccPwEyebrow">BATTLE CARD</p><h2>拜访作战卡交付</h2><p>最终产物不是企业资料堆砌，而是“去不去、见谁、聊什么、什么不能碰”的会前行动卡。</p></div>
        {props.task === undefined ? null : <span className="qccPwTaskId">{props.task.id}</span>}
      </header>
      {props.task === undefined ? <Feedback tone="notice" title="等待任务">完成任务定义后，作战卡结构和执行进度会显示在这里。</Feedback> : ready ? <Feedback tone="success" title="作战卡已生成">Agent 已结束本次执行。请回到会话查看完整作战卡与事实引用。</Feedback> : props.status === "failed" ? <Feedback tone="error" title="本次交付未完整完成">请回到会话查看错误；已取得事实仍可保留，失败维度不得写成零记录。</Feedback> : <Feedback tone="notice" title={props.status === "running" ? "Agent 正在形成作战卡" : "等待 Agent 开始"}>完成机会与风险双轨后，将自动切换到本页。</Feedback>}
      <div className="qccPwCard">
        <div className="qccPwCardHeader"><div><h3>固定七段作战卡</h3><p>输出形态可以压缩或展开，但事实、推理、问题和覆盖边界不能混写。</p></div></div>
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

function PrevisitWorkbenchTab(props: BetterSidebarTabProps & {
  ctx: ClientContext
  reveal: RevealController
  navigation: NavigationController
}): JSX.Element {
  useWorkbenchReveal(props.reveal, props)
  const sessionId = props.scope.sessionId
  const [phase, setPhase] = useState<PrevisitPhase>("prepare")
  const [composer, setComposer] = useState<ComposerState>(EMPTY_COMPOSER_STATE)
  const [selection, setSelection] = useState<ComposerSelection>(EMPTY_SELECTION)
  const [task, setTask] = useState<ActiveTask>()
  const [runtime, setRuntime] = useState<RuntimeState>(EMPTY_RUNTIME)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string>()
  const [revealedTaskId, setRevealedTaskId] = useState<string>()

  useEffect(() => props.navigation.attach(sessionId, setPhase), [props.navigation, sessionId])

  useEffect(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session
    if (face === undefined) {
      return
    }
    const refresh = () => {
      const snapshot = face.getSnapshot()
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

  useEffect(() => {
    if ((status !== "ready" && status !== "failed") || task === undefined || revealedTaskId === task.id) {
      return
    }
    setRevealedTaskId(task.id)
    setPhase("delivery")
    props.reveal.request(sessionId)
  }, [props.reveal, revealedTaskId, sessionId, status, task])

  const updateSelection = (next: ComposerSelection) => {
    setSelection(next)
    setComposer(current => applySelection(current, next))
    setError(undefined)
  }
  const toggleSingle = (key: "role" | "purpose" | "budget" | "output", id: string) => {
    const next: ComposerSelection = { ...selection }
    if (next[key] === id) {
      delete next[key]
    } else {
      next[key] = id
    }
    updateSelection(next)
  }
  const toggleFocus = (id: string) => {
    if (selection.focus.includes(id)) {
      updateSelection({ ...selection, focus: selection.focus.filter(value => value !== id) })
      return
    }
    if (selection.focus.length >= 4) {
      setError("重点关注最多选择 4 项")
      return
    }
    updateSelection({ ...selection, focus: [...selection.focus, id] })
  }
  const reset = () => {
    setComposer(EMPTY_COMPOSER_STATE)
    setSelection(EMPTY_SELECTION)
    setError(undefined)
  }
  const generate = () => {
    setComposer(current => generateFromSelection(current, selection))
    setError(undefined)
  }
  const submit = async () => {
    const validationError = validateComposerText(composer.text)
    if (validationError !== undefined) {
      setError(validationError)
      setPhase("prepare")
      return
    }
    const conversation = props.ctx.sessions.scope?.(sessionId)?.get("conversation") as SessionConversation | undefined
    if (conversation === undefined) {
      setError("当前 Session 对话服务不可用，请重新打开工作空间")
      return
    }
    const snapshot = props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot()
    const id = createTaskId()
    const prompt = serializePrevisitRequest(composer.text, id)
    const nextTask: ActiveTask = {
      id,
      prompt,
      createdAt: new Date().toISOString(),
      nodeBaseline: snapshot?.nodes?.length ?? 0,
      seenRunning: false,
      selection,
    }
    setSubmitting(true)
    setError(undefined)
    setRuntime(EMPTY_RUNTIME)
    setTask(nextTask)
    setRevealedTaskId(undefined)
    setPhase("opportunity")
    try {
      await conversation.send(prompt)
    } catch {
      setTask(undefined)
      setPhase("prepare")
      setError("任务发送失败，请检查当前会话后重试")
    } finally {
      setSubmitting(false)
    }
  }
  const newTask = () => {
    reset()
    setTask(undefined)
    setRuntime(EMPTY_RUNTIME)
    setPhase("prepare")
  }
  const returnToConversation = () => {
    props.store.reduce(state => ({ ...state, panelOpen: false, bottomOpen: false }))
  }

  return (
    <section className="qccPwShell" aria-label="访前尽调工作台" data-status={status}>
      <header className="qccPwHeader">
        <div className="qccPwBrand">
          <span className="qccPwBrandIcon"><Icon name="briefcase" /></span>
          <div className="qccPwBrandCopy"><div className="qccPwTitleRow"><h1 className="qccPwTitle">访前尽调工作台</h1><span className="qccPwLiveDot" data-status={status} /></div><p className="qccPwSubtitle">企查查事实驱动 · 机会与风险双引擎 · 拜访作战卡</p></div>
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
        {phase === "prepare" ? <PreparePanel composer={composer} selection={selection} error={error} setComposer={setComposer} toggleSingle={toggleSingle} toggleFocus={toggleFocus} /> : null}
        {phase === "opportunity" ? <OpportunityPanel task={task} status={status} tools={runtime.toolNames} /> : null}
        {phase === "risk" ? <RiskPanel task={task} status={status} tools={runtime.toolNames} failedToolCount={runtime.failedToolCount} /> : null}
        {phase === "delivery" ? <DeliveryPanel task={task} status={status} toolCount={runtime.toolNames.length} failedToolCount={runtime.failedToolCount} /> : null}
      </div>
      <footer className="qccPwFooter">
        <span className="qccPwFooterHint">{phase === "prepare" ? "条件只用于生成可见文本；Agent 的默认值与路由规则由 Skill 统一管理。" : "工作台绑定当前 Session，企业事实与完整作战卡保留在原生会话中。"}</span>
        <div className="qccPwFooterActions">
          {phase === "prepare" ? <><button type="button" className="qccPwSecondary" onClick={reset}>清空</button><button type="button" className="qccPwSecondary" onClick={generate}>{composer.mode === "manual" ? "按条件补充" : "重新生成"}</button><button type="button" className="qccPwPrimary" disabled={submitting} onClick={() => void submit()}>{submitting ? "正在发送…" : "开始访前尽调"}<span>→</span></button></> : null}
          {phase !== "prepare" && task !== undefined ? <button type="button" className="qccPwSecondary" onClick={newTask}>发起新任务</button> : null}
          {phase !== "prepare" ? <button type="button" className="qccPwPrimary" onClick={returnToConversation}>{status === "ready" ? "查看完整作战卡" : "返回任务会话"}<span>→</span></button> : null}
        </div>
      </footer>
    </section>
  )
}

function SidebarEntry(props: Record<string, unknown>): JSX.Element {
  const wide = props.wide !== false
  const openCurrent = props.openCurrent as (() => boolean)
  return <button type="button" className="qccPwEntry qccPwSidebarEntry" data-wide={wide} aria-label="打开访前尽调工作台" onClick={openCurrent}><IconSearchOutline16 size={wide ? 16 : 18} />{wide ? <span>访前尽调</span> : null}</button>
}

function InputEntry(props: Record<string, unknown>): JSX.Element {
  const open = props.open as (() => boolean)
  return <button type="button" className="qccPwEntry qccPwInputEntry" onClick={open}><IconSearchOutline16 size={15} /><span>访前尽调</span></button>
}

function HeaderEntry(props: Record<string, unknown>): JSX.Element {
  const open = props.open as (() => boolean)
  return <button type="button" className="qccPwEntry qccPwHeaderEntry" title="打开访前尽调工作台" onClick={open}>访前</button>
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
  const reveal = createRevealController()
  const navigation = createNavigationController()
  const openSession = (sessionId: string, phase?: PrevisitPhase): boolean => {
    const cwd = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd
    const scope = cwd === undefined ? { sessionId } : { sessionId, cwd }
    const opened = openWorkbench(service, scope, reveal)
    if (opened && phase !== undefined) {
      navigation.request(sessionId, phase)
    }
    return opened
  }
  const openCurrent = (): boolean => {
    const current = ctx.sessions.list.getSnapshot().current
    if (current === undefined) {
      ctx.workspaces.startSession?.()
      return false
    }
    return openSession(current)
  }

  ctx.effect(() => installStyles(), "qcc-previsit: workbench styles")
  ctx.effect(() => registerWorkbenchTab(service, props => <PrevisitWorkbenchTab {...props} ctx={ctx} reveal={reveal} navigation={navigation} />), "qcc-previsit: Better Sidebar tab")
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "qcc-previsit-dsh:sidebar",
    order: 30,
    inject: () => ({ openCurrent }),
  }, SidebarEntry))
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "qcc-previsit-dsh:input",
    order: 90,
    inject: (sessionId: string) => ({ open: () => openSession(sessionId, "prepare") }),
  }, InputEntry))
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
    name: "conversation.session.header.actions",
    id: "qcc-previsit-dsh:header",
    order: 90,
    inject: (sessionId: string) => ({ open: () => openSession(sessionId) }),
  }, HeaderEntry))
}
