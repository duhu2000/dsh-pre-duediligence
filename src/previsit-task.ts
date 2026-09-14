// 任务对象：一次访前尽调的正式记录。
// 数据来源只有宿主工具（previsit_begin / previsit_confirm_entity / previsit_query）写进会话的结构化结果，
// 以及紧随其后由助手产出的报告。不从用户消息正则认领，不从 DOM 抓取。
import { extractCardText, nodeText, reportSectionsComplete, type CardNode, type CardSnapshot } from "./report-export.js"
import { TOOL_OUTCOME_LABELS, type ToolOutcome } from "./tool-outcome.js"

export type TaskDepth = "fast" | "standard" | "deep"
export type TaskDimension = { dimension: string; label: string; toolName?: string; outcome: ToolOutcome; reason?: string; order: number }
export type TaskEntity = { fullName: string; creditCode: string }
export type TaskStage = "planning" | "anchoring" | "collecting" | "reported"

export type PlanCandidate = { name: string; source: string | undefined }
export type PrevisitPlan = {
  id: string
  candidates: PlanCandidate[]
  note: string | undefined
  createdAt: string | undefined
  /** previsit_plan 结果所在节点下标。 */
  index: number
  /** 本计划下已建立的任务（按发起顺序）。 */
  taskIds: string[]
}

export type PrevisitTask = {
  id: string
  planId: string | undefined
  query: string
  depth: TaskDepth | undefined
  limit: number
  used: number
  role: string | undefined
  scene: string | undefined
  focus: string[]
  output: string | undefined
  sections: string[]
  startedAt: string | undefined
  entity: TaskEntity | undefined
  candidateCount: number | undefined
  /** 发起本任务的那条用户消息（previsit_begin 之前最近的一条）。 */
  prompt: string
  /** previsit_begin 结果所在节点下标；任务的事件从这里开始。 */
  startIndex: number
  /** 下一任务开始的节点下标（不含）；当前任务为 undefined。 */
  endIndex: number | undefined
  dimensions: TaskDimension[]
  report: string | null
  stage: TaskStage
}

export const DIMENSION_LABELS: Record<string, string> = {
  entity_search: "主体检索", registration: "工商登记", profile: "企业画像", annual_reports: "年报", changes: "变更记录",
  shareholders: "股东", beneficiaries: "实控人", personnel: "关键人员", contacts: "联系方式", investments: "对外投资", branches: "分支机构",
  risk_scan: "风险扫描", dishonest: "失信", enforcement: "被执行", terminated_cases: "终本案件", equity_freeze: "股权冻结",
  business_exception: "经营异常", administrative_penalty: "行政处罚", tax_abnormal: "税务异常", judicial_documents: "裁判文书",
  patents: "专利", software_copyright: "软著", financing: "融资", bidding: "招投标", recruitment: "招聘",
  qualifications: "资质", licenses: "行政许可", land: "土地", executive_risk: "董监高风险",
}
export const DEPTH_LABELS: Record<TaskDepth, string> = { fast: "3分钟速览", standard: "15分钟标准", deep: "深度尽调" }
export const REPORT_SECTIONS = ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"] as const
export const RISK_DIMENSIONS = new Set(["risk_scan", "dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents", "executive_risk"])

type HostEvent = { name: string; value: Record<string, unknown>; index: number }

const isUser = (node: CardNode): boolean => /^(user|human)$/i.test(node.role ?? node.message?.role ?? node.kind ?? "")

function hostEvent(node: CardNode, index: number): HostEvent | null {
  if (node.kind !== "tool-result" || typeof node.call?.name !== "string" || !node.call.name.startsWith("previsit_")) return null
  if ((node as { isError?: boolean }).isError === true || !Array.isArray(node.content) || node.content.length !== 1) return null
  const block = node.content[0] as { type?: string; text?: string } | string
  if (typeof block === "string" || block?.type !== "text" || typeof block.text !== "string") return null
  try {
    const value = JSON.parse(block.text) as unknown
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null
    return { name: node.call.name, value: value as Record<string, unknown>, index }
  } catch { return null }
}

const str = (v: unknown): string | undefined => typeof v === "string" && v !== "" ? v : undefined
const num = (v: unknown): number | undefined => typeof v === "number" && Number.isFinite(v) ? v : undefined

function candidateCount(data: unknown): number | undefined {
  if (Array.isArray(data)) return data.length
  if (data !== null && typeof data === "object") {
    for (const v of Object.values(data as Record<string, unknown>)) if (Array.isArray(v)) return v.length
  }
  return undefined
}

function originatingPrompt(nodes: CardNode[], beginIndex: number): string {
  for (let i = beginIndex - 1; i >= 0; i--) {
    const node = nodes[i]
    if (node !== undefined && isUser(node)) {
      const text = nodeText(node).trim()
      if (text !== "") return text
    }
  }
  return ""
}

const strList = (v: unknown): string[] => Array.isArray(v) ? v.filter((f): f is string => typeof f === "string") : []

/** 把会话快照投影成计划列表（按登记顺序）。 */
export function derivePlans(snapshot: CardSnapshot): PrevisitPlan[] {
  const nodes = snapshot.nodes ?? []
  const plans: PrevisitPlan[] = []
  nodes.forEach((node, index) => {
    const event = hostEvent(node, index)
    if (event === null) return
    // previsit_plan 与 previsit_extract_image_companies（图片识别后由宿主直接登记）都会产出计划
    if (event.name === "previsit_plan" || (event.name === "previsit_extract_image_companies" && Array.isArray(event.value.candidates))) {
      const id = str(event.value.planId)
      if (id === undefined) return
      const candidates = Array.isArray(event.value.candidates) ? event.value.candidates.flatMap(c => {
        const name = c !== null && typeof c === "object" ? str((c as { name?: unknown }).name) : undefined
        return name === undefined ? [] : [{ name, source: c !== null && typeof c === "object" ? str((c as { source?: unknown }).source) : undefined }]
      }) : []
      if (plans.some(plan => plan.id === id)) return
      plans.push({ id, candidates, note: str(event.value.note), createdAt: str(event.value.createdAt), index, taskIds: [] })
      return
    }
    if (event.name === "previsit_begin") {
      const planId = str(event.value.planId), taskId = str(event.value.taskId)
      const plan = planId === undefined ? undefined : plans.find(p => p.id === planId)
      if (plan !== undefined && taskId !== undefined && !plan.taskIds.includes(taskId)) plan.taskIds.push(taskId)
    }
  })
  return plans
}

/** 把会话快照投影成任务列表（按发起顺序）。最后一个是当前任务。 */
export function deriveTasks(snapshot: CardSnapshot): PrevisitTask[] {
  const nodes = snapshot.nodes ?? []
  const tasks: PrevisitTask[] = []
  let current: PrevisitTask | undefined
  nodes.forEach((node, index) => {
    const event = hostEvent(node, index)
    if (event === null) return
    const { name, value } = event
    if (name === "previsit_begin") {
      const id = str(value.taskId)
      if (id === undefined) return
      const existing = tasks.find(task => task.id === id)
      if (existing !== undefined) { current = existing; return }
      if (current !== undefined) current.endIndex = index
      const depth = str(value.depth)
      current = {
        id, planId: str(value.planId), query: str(value.query) ?? "", depth: depth === "fast" || depth === "standard" || depth === "deep" ? depth : undefined,
        limit: num(value.limit) ?? 0, used: num(value.used) ?? 0,
        role: str(value.role), scene: str(value.scene), focus: strList(value.focus),
        output: str(value.output), sections: strList(value.sections), startedAt: str(value.startedAt),
        entity: undefined, candidateCount: undefined, prompt: originatingPrompt(nodes, index), startIndex: index, endIndex: undefined,
        dimensions: [], report: null, stage: "planning",
      }
      tasks.push(current)
      return
    }
    if (current === undefined || str(value.taskId) !== current.id) return
    if (name === "previsit_confirm_entity") {
      const entity = value.entity as { fullName?: unknown; creditCode?: unknown } | undefined
      const fullName = str(entity?.fullName), creditCode = str(entity?.creditCode)
      if (fullName !== undefined && creditCode !== undefined) current.entity = { fullName, creditCode }
      return
    }
    if (name === "previsit_query") {
      const dimension = str(value.dimension)
      if (dimension === undefined) return
      const outcome = str(value.outcome)
      const dim: TaskDimension = {
        dimension, label: DIMENSION_LABELS[dimension] ?? dimension,
        outcome: outcome !== undefined && Object.hasOwn(TOOL_OUTCOME_LABELS, outcome) ? outcome as ToolOutcome : "unknown",
        order: current.dimensions.length,
      }
      const toolName = str(value.toolName), reason = str(value.reason)
      if (toolName !== undefined) dim.toolName = toolName
      if (reason !== undefined) dim.reason = reason
      current.dimensions.push(dim)
      const used = num(value.used)
      if (used !== undefined) current.used = Math.max(current.used, used)
      if (dimension === "entity_search") current.candidateCount = candidateCount(value.data)
    }
  })
  for (const task of tasks) {
    const end = task.endIndex ?? nodes.length
    const text = extractCardText({ nodes: nodes.slice(0, end) }, task.startIndex + 1)
    task.report = text !== null && reportSectionsComplete(text, task.prompt) ? text : null
    task.stage = task.report !== null ? "reported" : task.entity !== undefined ? "collecting" : task.dimensions.length > 0 ? "anchoring" : "planning"
  }
  return tasks
}

/** 任务的对外名称：已确认主体用全称，否则用检索词。 */
export function taskTitle(task: PrevisitTask): string {
  return task.entity?.fullName ?? task.query ?? "访前尽调"
}

/** 最近一次结果为准的维度视图（重试后只显示最后一次）。 */
export function latestDimensions(task: PrevisitTask): TaskDimension[] {
  const latest = new Map<string, TaskDimension>()
  for (const dim of task.dimensions) latest.set(dim.dimension, dim)
  return [...latest.values()].sort((a, b) => a.order - b.order)
}

export type PlanSelection = { candidates: string[]; depth: TaskDepth; focus: string[]; output: string; sections: string[]; role?: string; scene?: string }

/** 工作台计划卡确认后发给智能体的结构化消息；Skill 按同一格式解析。 */
export function planConfirmationMessage(plan: PrevisitPlan, selection: PlanSelection): string {
  const sections = selection.sections.length === REPORT_SECTIONS.length ? "全部八段" : selection.sections.join("、")
  return [
    // 必须带完整 planId：模型会照抄这一行去调 previsit_begin，截断的 id 查不到计划。
    `确认尽调计划 ${plan.id}：`,
    `- 主体：${selection.candidates.join("、")}`,
    `- 深度：${DEPTH_LABELS[selection.depth]}（${selection.depth}，固定路由内连续执行，不设插件调用次数上限）`,
    ...(selection.role === undefined ? [] : [`- 角色：${selection.role}`]),
    ...(selection.scene === undefined ? [] : [`- 场合：${selection.scene}`]),
    `- 关注：${selection.focus.length > 0 ? selection.focus.join("、") : "按标准范围"}`,
    `- 输出：${selection.output}`,
    `- 重点展开段落：${sections}；报告保留完整八段，其余段落简写并披露未知项`,
    `请按此计划逐家执行：每家先用 previsit_begin（带 planId、entities=${selection.candidates.length}）建立任务，同时传入 depth、role、scene、focus、output、sections；每家使用独立任务 ID，不得复用前一家的 requestId。主体确认后取数并调用 previsit_finalize 保存报告，完成一家再开始下一家。`,
  ].join("\n")
}
