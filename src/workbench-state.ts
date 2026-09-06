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
}

export type PhaseState = {
  id: PrevisitPhase
  progress: PhaseProgress
}

function hasTool(toolNames: string[], fragments: string[]): boolean {
  return toolNames.some(name => fragments.some(fragment => name.includes(fragment)))
}

export function isOpportunityTool(name: string): boolean {
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
  const opportunitySeen = input.toolNames.some(isOpportunityTool)
  const riskSeen = input.toolNames.some(isRiskTool)
  const entitySeen = hasTool(input.toolNames, ["get_company_by_query", "get_company_profile"])

  if (!input.hasTask) {
    return PREVISIT_PHASES.map((id, index) => ({ id, progress: index === 0 ? "active" : "idle" }))
  }
  if (status === "ready") return PREVISIT_PHASES.map(id => ({ id, progress: "done" }))
  if (status === "failed") {
    return [
      { id: "target", progress: "done" },
      { id: "scope", progress: "done" },
      { id: "collect", progress: opportunitySeen || entitySeen ? "done" : "failed" },
      { id: "verify", progress: riskSeen ? "done" : "failed" },
      { id: "output", progress: "failed" },
    ]
  }

  return [
    { id: "target", progress: "done" },
    { id: "scope", progress: opportunitySeen || entitySeen || input.running ? "done" : "active" },
    { id: "collect", progress: riskSeen ? "done" : opportunitySeen || entitySeen || input.running ? "active" : "idle" },
    { id: "verify", progress: riskSeen ? "active" : "idle" },
    { id: "output", progress: input.reportReady ? "done" : "idle" },
  ]
}
