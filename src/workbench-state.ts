export const PREVISIT_PHASES = ["prepare", "opportunity", "risk", "delivery"] as const
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
  if (!input.hasTask) {
    return "empty"
  }
  if (input.running) {
    return "running"
  }
  if (!input.seenRunning) {
    return "waiting-agent"
  }
  return input.lastAgentError === null ? "ready" : "failed"
}

export function derivePhaseStates(input: SessionProgressInput): PhaseState[] {
  const status = deriveWorkbenchStatus(input)
  const opportunitySeen = input.toolNames.some(isOpportunityTool)
  const riskSeen = input.toolNames.some(isRiskTool)
  const entitySeen = hasTool(input.toolNames, ["get_company_by_query"])

  if (!input.hasTask) {
    return PREVISIT_PHASES.map((id, index) => ({ id, progress: index === 0 ? "active" : "idle" }))
  }
  if (status === "ready") {
    return PREVISIT_PHASES.map(id => ({ id, progress: "done" }))
  }
  if (status === "failed") {
    return [
      { id: "prepare", progress: "done" },
      { id: "opportunity", progress: opportunitySeen || entitySeen ? "done" : "failed" },
      { id: "risk", progress: riskSeen ? "done" : "failed" },
      { id: "delivery", progress: "failed" },
    ]
  }

  return [
    { id: "prepare", progress: "done" },
    {
      id: "opportunity",
      progress: riskSeen ? "done" : opportunitySeen || entitySeen || input.running ? "active" : "idle",
    },
    {
      id: "risk",
      progress: input.partial && riskSeen ? "done" : riskSeen ? "active" : "idle",
    },
    {
      id: "delivery",
      progress: input.partial && riskSeen ? "active" : "idle",
    },
  ]
}
