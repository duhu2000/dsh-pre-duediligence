import type { HostedTask } from "./hosted-task-sync.js"

export async function fetchHostedTask(taskId: string, sessionId: string): Promise<HostedTask | null> {
  const response = await fetch(`/previsit/api/tasks/${encodeURIComponent(taskId)}?sessionId=${encodeURIComponent(sessionId)}`, { headers: { accept: "application/json" } })
  if (response.status === 404) return null
  const payload = await response.json() as { ok?: boolean; task?: HostedTask; message?: string }
  if (!response.ok || payload.ok === false || payload.task === undefined) throw new Error(payload.message ?? `任务状态读取失败（HTTP ${response.status}）`)
  return payload.task
}

/** Omit sessionId for the Profile-wide history view; pass it for current-task isolation. */
export async function fetchHostedTasks(sessionId?: string): Promise<HostedTask[]> {
  const scope = sessionId === undefined ? "" : `?sessionId=${encodeURIComponent(sessionId)}`
  const response = await fetch(`/previsit/api/tasks${scope}`, { headers: { accept: "application/json" } })
  const payload = await response.json() as { ok?: boolean; tasks?: HostedTask[]; message?: string }
  if (!response.ok || payload.ok === false || !Array.isArray(payload.tasks)) throw new Error(payload.message ?? `任务历史读取失败（HTTP ${response.status}）`)
  return payload.tasks
}
