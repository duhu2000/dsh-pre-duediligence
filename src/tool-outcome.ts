export type ToolOutcome = "running" | "done" | "no-data" | "no-permission" | "not-executed" | "failed" | "unknown"
export const TOOL_OUTCOME_LABELS: Record<ToolOutcome, string> = {
  running: "查询中", done: "查询成功", "no-data": "无数据", "no-permission": "无权限",
  "not-executed": "未执行", failed: "查询失败", unknown: "结果待核验",
}

/** Interpret explicit structured signals only. A successful transport is not proof of facts. */
export function classifyToolOutcome(value: unknown, isError = false): ToolOutcome {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const data = value as Record<string, unknown>
    const code = data.code ?? (data.error as { code?: unknown } | undefined)?.code
    if ([401, 403, "401", "403", "FORBIDDEN", "UNAUTHORIZED", "PERMISSION_DENIED"].includes(code as string)) return "no-permission"
    if (["UNKNOWN_TOOL", "ABORTED_BEFORE_DISPATCH", "NOT_EXECUTED"].includes(code as string)) return "not-executed"
    if (data.status === "no-permission" || data.status === "not-executed") return data.status
    if (isError || data.isError === true || data.success === false || data.error != null) return "failed"
    if (data.status === "failed") return "failed"
    if (data.status === "no-data" || data.total === 0 || data.count === 0) return "no-data"
    if ("data" in data) return classifyToolOutcome(data.data)
    for (const key of ["items", "records", "results"]) if (Array.isArray(data[key])) return classifyToolOutcome(data[key])
    if (data.status === "done" || data.success === true) return "done"
  }
  if (isError) return "failed"
  if (Array.isArray(value)) return value.length === 0 ? "no-data" : "done"
  return "unknown"
}

export function resultOutcome(node: { isError?: boolean; content?: unknown; value?: unknown; error?: unknown }): ToolOutcome {
  if (node.error !== undefined) return classifyToolOutcome({ error: node.error }, true)
  if (node.value !== undefined) return classifyToolOutcome(node.value, node.isError)
  if (Array.isArray(node.content)) {
    const texts = node.content.filter((b): b is { type: string; text: string } => b?.type === "text" && typeof b.text === "string")
    if (texts.length === 1) {
      try { return classifyToolOutcome(JSON.parse(texts[0]!.text), node.isError) } catch { /* not structured */ }
    }
  }
  return classifyToolOutcome(node.content, node.isError)
}

export function toolEvent(node: { call: { name: string }; isError?: boolean; content?: unknown; error?: unknown }): { name: string; status: ToolOutcome } {
  const fallback = { name: node.call.name, status: resultOutcome(node) }
  if (node.isError || !Array.isArray(node.content) || node.content.length !== 1 || node.content[0]?.type !== "text") return fallback
  try {
    const value = JSON.parse(node.content[0].text)
    if (node.call.name === "previsit_query" && typeof value.toolName === "string" && Object.hasOwn(TOOL_OUTCOME_LABELS, value.outcome)) return { name: value.toolName, status: value.outcome }
    if ((node.call.name === "previsit_begin" && value.status === "needs-entity-search") || (node.call.name === "previsit_confirm_entity" && value.status === "entity-confirmed")) return { name: node.call.name, status: "done" }
  } catch { /* Unrecognized content stays unknown/failed. */ }
  return fallback
}
