import type { ToolEvent } from "./stage-insights.js"

export const PREVISIT_PHASES = ["target", "scope", "collect", "verify", "output"] as const
export type PrevisitPhase = (typeof PREVISIT_PHASES)[number]
export type PhaseProgress = "idle" | "active" | "done" | "failed"
export type WorkbenchStatus = "empty" | "waiting-agent" | "running" | "ready" | "failed"

export type SessionProgressInput = {
  hasTask: boolean
  running: boolean
  seenRunning: boolean
  lastAgentError: string | null
  partial: boolean
  toolNames: string[]
  /** 只在捕获到符合报告结构的真实输出后为 true。 */
  reportReady: boolean
  toolEvents?: ToolEvent[]
}

export type PhaseState = {
  id: PrevisitPhase
  progress: PhaseProgress
}

function hasTool(toolNames: string[], fragments: string[]): boolean {
  return toolNames.some(name => fragments.some(fragment => name.includes(fragment)))
}

export function isOpportunityTool(name: string): boolean {
  if (isRiskTool(name)) return false
  return [
    "qcc-company",
    "qcc-operation",
    "qcc-ipr",
    "get_company_",
    "get_annual_reports",
    "get_change_records",
    "get_bidding_info",
    "get_financing_records",
    "get_patent_info",
    "get_software_copyright_info",
  ].some(fragment => name.includes(fragment))
}

export function isRiskTool(name: string): boolean {
  return [
    "qcc-risk",
    "qcc-executive",
    "get_company_risk_scan",
    "get_executive_risk_scan",
    "get_dishonest_info",
    "get_judgment_debtor_info",
    "get_terminated_cases",
    "get_equity_freeze",
    "get_business_exception",
    "get_administrative_penalty",
    "get_tax_abnormal",
    "get_judicial_documents",
  ].some(fragment => name.includes(fragment))
}

export function deriveWorkbenchStatus(input: SessionProgressInput): WorkbenchStatus {
  if (!input.hasTask) return "empty"
  if (input.running) return "running"
  if (input.lastAgentError !== null) return "failed"
  // 会话停止并不等于任务完成；必须捕获到符合契约的完整报告。
  return input.reportReady ? "ready" : "waiting-agent"
}

export function derivePhaseStates(input: SessionProgressInput): PhaseState[] {
  const status = deriveWorkbenchStatus(input)
  const events = input.toolEvents ?? []
  const latest = new Map(events.map(event => [event.name, event]))
  const completed = [...latest.values()].filter(e => e.status === "done" || e.status === "no-data").map(e => e.name)
  const opportunitySeen = completed.some(isOpportunityTool)
  const riskSeen = completed.some(isRiskTool)
  const entitySeen = hasTool(completed, ["get_company_by_query", "get_company_profile"])
  const target: PhaseProgress = completed.includes("previsit_confirm_entity") ? "done" : entitySeen ? "active" : "idle"
  const scope: PhaseProgress = completed.includes("previsit_begin") ? "done" : "idle"

  if (!input.hasTask) {
    return PREVISIT_PHASES.map((id, index) => ({ id, progress: index === 0 ? "active" : "idle" }))
  }
  // A report may explicitly disclose missing dimensions. Never turn that into
  // five green checks, or infer human entity/range approval from a tool name.
  if (status === "ready") return [
    { id: "target", progress: target },
    { id: "scope", progress: scope },
    { id: "collect", progress: opportunitySeen ? "done" : "idle" },
    { id: "verify", progress: riskSeen ? "done" : "idle" },
    { id: "output", progress: "done" },
  ]
  if (status === "failed") {
    return [
      { id: "target", progress: target },
      { id: "scope", progress: scope },
      { id: "collect", progress: opportunitySeen || entitySeen ? "done" : "failed" },
      { id: "verify", progress: riskSeen ? "done" : "failed" },
      { id: "output", progress: "failed" },
    ]
  }

  return [
    { id: "target", progress: target },
    { id: "scope", progress: scope },
    { id: "collect", progress: opportunitySeen || entitySeen || input.running ? "active" : "idle" },
    { id: "verify", progress: riskSeen ? "active" : "idle" },
    { id: "output", progress: input.reportReady ? "done" : "idle" },
  ]
}
