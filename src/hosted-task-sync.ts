import type { ActiveTask, PrevisitSessionState, PrevisitView } from "./previsit-store.js"
import type { PrevisitRun, PrevisitTaskRecord } from "./previsit-workflow.js"
import type { ToolEvent } from "./stage-insights.js"
import type { WorkbenchStatus } from "./workbench-state.js"

export type HostedTask = Omit<PrevisitTaskRecord, "reportMarkdown"> & {
  reportReady: boolean
  reportMarkdown?: string
}

export const HOSTED_TERMINAL = new Set(["completed", "partial", "failed"])
const VERIFY_RUN = /risk|dishonest|enforcement|terminated|freeze|exception|penalty|tax|judicial|executive/
const COMPLETE_RUN = new Set(["done", "no-data", "skipped"])

const DIMENSION_LABELS: Record<string, string> = {
  entity_search: "拜访客户检索",
  registration: "工商登记",
  profile: "企业画像",
  annual_reports: "企业年报",
  changes: "变更记录",
  shareholders: "股东信息",
  beneficiaries: "实际控制人",
  personnel: "关键人员",
  contacts: "联系方式",
  investments: "对外投资",
  branches: "分支机构",
  financing: "融资信息",
  bidding: "招投标业绩",
  recruitment: "招聘信息",
  qualifications: "企业资质",
  licenses: "行政许可",
  land: "土地信息",
  patents: "专利信息",
  software_copyright: "软件著作权",
  risk_scan: "企业风险扫描",
  dishonest: "失信明细",
  enforcement: "被执行明细",
  terminated_cases: "终本案件明细",
  equity_freeze: "股权冻结明细",
  business_exception: "经营异常明细",
  administrative_penalty: "行政处罚明细",
  tax_abnormal: "税务异常明细",
  judicial_documents: "裁判文书明细",
  executive_risk: "董监高风险扫描",
}

// Host runs normally retain the resolved Provider tool name. Keep a canonical
// fallback so progress remains classifiable if an older record omitted it.
const DIMENSION_TOOL_NAMES: Record<string, string> = {
  entity_search: "get_company_by_query",
  registration: "get_company_registration_info",
  profile: "get_company_profile",
  annual_reports: "get_annual_reports",
  changes: "get_change_records",
  shareholders: "get_shareholder_info",
  beneficiaries: "get_beneficial_owners",
  personnel: "get_key_personnel",
  contacts: "get_contact_info",
  investments: "get_external_investments",
  branches: "get_branches",
  financing: "get_financing_records",
  bidding: "get_bidding_info",
  recruitment: "get_recruitment_info",
  qualifications: "get_qualifications",
  licenses: "get_administrative_license",
  land: "get_land_grant_info",
  patents: "get_patent_info",
  software_copyright: "get_software_copyright_info",
  risk_scan: "get_company_risk_scan",
  dishonest: "get_dishonest_info",
  enforcement: "get_judgment_debtor_info",
  terminated_cases: "get_terminated_cases",
  equity_freeze: "get_equity_freeze",
  business_exception: "get_business_exception",
  administrative_penalty: "get_administrative_penalty",
  tax_abnormal: "get_tax_abnormal",
  judicial_documents: "get_judicial_documents",
  executive_risk: "get_executive_risk_scan",
}

export type HostedLiveProgress = {
  title: string
  detail: string
  current: string | null
  queryCount: number
  completedCount: number
  noDataCount: number
  skippedCount: number
  pendingCount: number
  failedCount: number
  elapsed: string
}

/** Only the latest run for each business dimension may drive current UI state. */
export function latestHostedRuns(task: Pick<HostedTask, "runs">): PrevisitRun[] {
  const latest = new Map<string, PrevisitRun>()
  for (const run of task.runs) latest.set(run.dimension, run)
  return [...latest.values()]
}

export function hostedToolEvents(task: HostedTask): ToolEvent[] {
  return [
    { name: "previsit_begin", status: "done" },
    ...(task.entity === undefined ? [] : [{ name: "previsit_confirm_entity", status: "done" as const }]),
    ...latestHostedRuns(task).map(run => ({
      name: run.toolName ?? DIMENSION_TOOL_NAMES[run.dimension] ?? `previsit_${run.dimension}`,
      status: run.status,
      ...(run.message === undefined ? {} : { reason: run.message }),
    })),
  ]
}

function dimensionLabel(dimension: string): string {
  return DIMENSION_LABELS[dimension] ?? dimension.replaceAll("_", " ")
}

function elapsedLabel(startedAt: string, now: number): string {
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1000))
  if (seconds < 60) return `${seconds} 秒`
  const minutes = Math.floor(seconds / 60)
  const rest = seconds % 60
  return rest === 0 ? `${minutes} 分钟` : `${minutes} 分 ${rest} 秒`
}

/** Human-readable, count-based progress. It deliberately avoids fake percentages. */
export function hostedLiveProgress(task: HostedTask, now = Date.now()): HostedLiveProgress {
  const latest = latestHostedRuns(task)
  const running = [...latest].reverse().find(run => run.status === "running")
  const lastSettled = [...task.runs].reverse().find(run => run.status !== "running" && !run.id.startsWith("previsit-pending-"))
  const completedCount = latest.filter(run => COMPLETE_RUN.has(run.status)).length
  const noDataCount = latest.filter(run => run.status === "no-data").length
  const skippedCount = latest.filter(run => run.status === "skipped").length
  const pendingCount = latest.filter(run => run.status === "unknown" || run.status === "no-permission" || run.status === "not-executed").length
  const failedCount = latest.filter(run => run.status === "failed").length
  const current = running === undefined ? null : dimensionLabel(running.dimension)
  const title = task.state === "needs-entity-confirmation"
    ? "等待确认拜访客户"
    : running !== undefined
      ? `正在查询：${current}`
      : task.state === "finalizing" || task.stage === "output"
        ? "正在生成一页纸报告"
        : task.runs.length > 0
          ? "本轮查询已返回，正在研判与整理"
          : "正在准备企业查询"
  const last = lastSettled === undefined ? "" : `；最近完成：${dimensionLabel(lastSettled.dimension)}`
  const detail = task.state === "needs-entity-confirmation"
    ? "检索到多个候选主体，请先在会话中选定企业；确认后将自动继续。"
    : `已发起 ${task.used} 次真实查询，${completedCount} 个维度已闭环${last}。页面每秒同步，不使用虚构百分比。`
  return {
    title,
    detail,
    current,
    queryCount: task.used,
    completedCount,
    noDataCount,
    skippedCount,
    pendingCount,
    failedCount,
    elapsed: elapsedLabel(task.createdAt, now),
  }
}

export function hostedStatus(task: HostedTask): WorkbenchStatus {
  if (task.state === "failed") return "failed"
  // reportReady is a durable product artifact. It also heals records written by
  // older builds that allowed a post-finalize query to regress state.
  if (task.reportReady) return "ready"
  if (task.state === "needs-entity-confirmation") return "waiting-agent"
  if (task.state === "needs-entity-search" && task.runs.some(run => run.dimension === "entity_search" && run.status !== "running")) return "waiting-agent"
  return "running"
}

/**
 * 会话内直接发起的尽调没有前端 PV 任务 ID。从 Host 历史中选出当前任务，
 * 但不重新认领用户已点“新的尽调”放弃的任务。
 */
export function selectHostedTask(records: HostedTask[], active: ActiveTask | undefined, dismissedTaskIds: readonly string[]): HostedTask | null {
  const dismissed = new Set(dismissedTaskIds)
  const available = records.filter(record => !dismissed.has(record.id)).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  if (active === undefined) return available[0] ?? null
  const direct = available.find(record => record.id === active.id)
  if (direct !== undefined) return direct
  const startedAfter = new Date(active.createdAt).getTime() - 60_000
  return available.find(record => new Date(record.createdAt).getTime() >= startedAfter) ?? null
}

/** Host 工作流已启动后，右侧不再停留在可重复提交的首页。 */
export function hostedTaskView(task: HostedTask): Exclude<PrevisitView, "target" | "history"> {
  if (task.reportReady || HOSTED_TERMINAL.has(task.state)) return "output"
  // 报告整理中的兼容任务可能先进入 finalizing/output，但制品仍未就绪。
  // 保留最后一个真实查询所在页，用户可以继续看到采集/核验明细变化；
  // 只有报告制品真正就绪后才自动切到材料输出。
  if (task.stage === "output" || task.state === "finalizing") {
    const lastRun = [...task.runs].reverse().find(run => run.dimension !== "entity_search")
    if (lastRun !== undefined) return VERIFY_RUN.test(`${lastRun.dimension} ${lastRun.toolName ?? ""}`) ? "verify" : "collect"
    return task.entity === undefined ? "scope" : "collect"
  }
  if (task.stage === "verify") return "verify"
  if (task.stage === "collect") return "collect"
  return "scope"
}

export function hostedProgressCopy(task: HostedTask): { title: string; detail: string } {
  if (task.state === "needs-entity-confirmation") {
    return {
      title: "等待确认拜访客户",
      detail: "检索到多个候选主体，请先在会话中选定企业；确认后工作台会继续同步执行进度。",
    }
  }
  if (task.entity === undefined) {
    return {
      title: "正在检索拜访客户",
      detail: "正在识别唯一法律实体；出现多个候选时才需要你在会话中确认。",
    }
  }
  if (task.state === "finalizing" || task.stage === "output") {
    return {
      title: "正在整理报告",
      detail: `主体已确认，已完成 ${task.used} 次查询；正在整理一页纸简报，生成后即可下载。`,
    }
  }
  return {
    title: "正在尽调",
    detail: `主体已确认，已同步 ${task.used} 次查询；资料采集与证据核验状态会随执行更新。`,
  }
}

export function syncHostedTaskState(
  state: PrevisitSessionState,
  record: HostedTask,
  adopted: Pick<ActiveTask, "id" | "prompt" | "nodeBaseline"> | null,
  locateCurrentStage: boolean,
): PrevisitSessionState {
  if (state.dismissedTaskIds.includes(record.id)) return state
  const previous = state.task
  const captureId = adopted?.id ?? previous?.captureId ?? (previous !== undefined && previous.id !== record.id ? previous.id : undefined)
  const nextTaskBase: ActiveTask = {
    id: record.id,
    company: record.entity?.fullName ?? record.query,
    prompt: adopted?.prompt ?? previous?.prompt ?? record.query,
    createdAt: record.createdAt,
    nodeBaseline: adopted?.nodeBaseline ?? previous?.nodeBaseline ?? state.minimumNodeBaseline,
    seenRunning: previous?.seenRunning === true || record.runs.length > 0 || record.state === "running" || HOSTED_TERMINAL.has(record.state),
    selection: previous?.selection ?? state.selection,
  }
  const nextTask: ActiveTask = captureId !== undefined && captureId !== record.id ? { ...nextTaskBase, captureId } : nextTaskBase
  // Host query is the authoritative snapshot after a task starts. This also
  // repairs a UI draft that continued changing after an accidental submit.
  const nextCompany = record.entity?.fullName ?? record.query
  const nextView = locateCurrentStage && state.view !== "history" ? hostedTaskView(record) : state.view
  if (previous?.id === nextTask.id
    && previous.captureId === nextTask.captureId
    && previous.company === nextTask.company
    && previous.prompt === nextTask.prompt
    && previous.createdAt === nextTask.createdAt
    && previous.nodeBaseline === nextTask.nodeBaseline
    && previous.seenRunning === nextTask.seenRunning
    && state.company === nextCompany
    && state.view === nextView) return state
  return { ...state, task: nextTask, company: nextCompany, view: nextView }
}
