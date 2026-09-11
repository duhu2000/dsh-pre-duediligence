import type { ActiveTask, PrevisitSessionState, PrevisitView } from "./previsit-store.js"
import type { PrevisitTaskRecord } from "./previsit-workflow.js"
import type { WorkbenchStatus } from "./workbench-state.js"

export type HostedTask = Omit<PrevisitTaskRecord, "reportMarkdown"> & {
  reportReady: boolean
  reportMarkdown?: string
}

export const HOSTED_TERMINAL = new Set(["completed", "partial", "failed"])

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
  if (task.stage === "output" || task.state === "finalizing" || task.reportReady) return "output"
  if (task.stage === "verify") return "verify"
  if (task.stage === "collect") return "collect"
  return "scope"
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
    prompt: adopted?.prompt ?? previous?.prompt ?? record.query,
    createdAt: record.createdAt,
    nodeBaseline: adopted?.nodeBaseline ?? previous?.nodeBaseline ?? state.minimumNodeBaseline,
    seenRunning: previous?.seenRunning === true || record.runs.length > 0 || record.state === "running" || HOSTED_TERMINAL.has(record.state),
    selection: previous?.selection ?? state.selection,
  }
  const nextTask: ActiveTask = captureId !== undefined && captureId !== record.id ? { ...nextTaskBase, captureId } : nextTaskBase
  const nextCompany = record.entity?.fullName ?? state.company
  const nextView = locateCurrentStage && state.view !== "history" ? hostedTaskView(record) : state.view
  if (previous?.id === nextTask.id
    && previous.captureId === nextTask.captureId
    && previous.prompt === nextTask.prompt
    && previous.createdAt === nextTask.createdAt
    && previous.nodeBaseline === nextTask.nodeBaseline
    && previous.seenRunning === nextTask.seenRunning
    && state.company === nextCompany
    && state.view === nextView) return state
  return { ...state, task: nextTask, company: nextCompany, view: nextView }
}
