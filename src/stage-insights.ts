// 阶段面板的信息层：把原始工具事件翻译成“做到哪了 / 查到了什么”，把报告正文抽成“得出了什么”。
// 纯函数，无 DOM 依赖。

import type { ToolOutcome } from "./tool-outcome.js"
export type ToolEvent = { name: string; status: ToolOutcome; reason?: string }
export type StepState = "done" | "active" | "review" | "failed" | "idle"
export type Step = { label: string; state: StepState; note?: string | undefined }
export type Dimension = { label: string; status: ToolOutcome; note?: string }

// 工具名片段 → 业务维度名。顺序即展示顺序。
const OPPORTUNITY_DIMENSIONS: Array<[string, string]> = [
  ["get_company_by_query", "主体锚定"],
  ["get_company_registration_info", "工商登记"],
  ["get_company_profile", "企业画像"],
  ["get_annual_reports", "年报"],
  ["get_change_records", "变更记录"],
  ["get_shareholder_info", "股东"],
  ["get_beneficial_owners", "实控人"],
  ["get_key_personnel", "关键人员"],
  ["get_financing_records", "融资"],
  ["get_bidding_info", "招投标"],
  ["get_recruitment_info", "招聘"],
  ["get_administrative_license", "行政许可"],
  ["get_qualifications", "资质"],
  ["get_land_grant_info", "土地"],
  ["get_external_investments", "对外投资"],
  ["get_branches", "分支机构"],
  ["get_patent_info", "专利"],
  ["get_software_copyright_info", "软著"],
  ["get_trademark", "商标"],
  ["get_contact_info", "联系方式"],
  ["get_financial_data", "财务数据"],
  ["get_company_announcement", "公告"],
  ["get_listing_info", "上市信息"],
  ["get_equity_pledge_info", "股权出质"],
]

const RISK_DIMENSIONS: Array<[string, string]> = [
  ["get_company_risk_scan", "风险扫描"],
  ["get_dishonest_info", "失信"],
  ["get_judgment_debtor_info", "被执行"],
  ["get_terminated_cases", "终本案件"],
  ["get_equity_freeze", "股权冻结"],
  ["get_business_exception", "经营异常"],
  ["get_administrative_penalty", "行政处罚"],
  ["get_tax_abnormal", "税务异常"],
  ["get_judicial_documents", "司法文书"],
  ["get_court_", "立案/开庭"],
  ["get_executive_risk_scan", "董监高"],
]

function latestEvent(events: ToolEvent[], fragment: string): ToolEvent | null {
  let seen: ToolEvent | null = null
  for (const event of events) {
    if (!event.name.includes(fragment)) continue
    seen = event
  }
  return seen
}

function toDimensions(table: Array<[string, string]>, events: ToolEvent[]): Dimension[] {
  const out: Dimension[] = []
  for (const [fragment, label] of table) {
    const event = latestEvent(events, fragment)
    if (event !== null) out.push({ label, status: event.status, ...(event.reason === undefined ? {} : { note: event.reason }) })
  }
  return out
}

export function opportunityDimensions(events: ToolEvent[]): Dimension[] {
  return toDimensions(OPPORTUNITY_DIMENSIONS, events)
}

export function riskDimensions(events: ToolEvent[]): Dimension[] {
  return toDimensions(RISK_DIMENSIONS, events)
}

export const BUSINESS_STATES = ["产能建设期", "客户导入期", "产能爬坡期", "订单增长期", "稳定经营期", "收缩承压期", "资本运作期", "风险暴露期"] as const

export type Hypothesis = { id: string; priority: string; text: string }
export type RiskItem = { level: "红线" | "关注" | "信息"; text: string }
export type CardInsights = {
  found: boolean
  state: string | null
  stateUndetermined: boolean
  confidence: string | null
  industryLink: string | null
  hypotheses: Hypothesis[]
  risks: RiskItem[]
  riskNoRecord: boolean
  sections: string[]
}

const EMPTY_INSIGHTS: CardInsights = {
  found: false, state: null, stateUndetermined: false, confidence: null, industryLink: null,
  hypotheses: [], risks: [], riskNoRecord: false, sections: [],
}

function section(md: string, title: string): string {
  const re = new RegExp(`^#{1,4}[^\\n]*${title}[^\\n]*$`, "m")
  const m = re.exec(md)
  if (m === null || m.index === undefined) return ""
  const rest = md.slice(m.index + m[0].length)
  const next = /^#{1,2}\s/m.exec(rest)
  return next === null || next.index === undefined ? rest : rest.slice(0, next.index)
}

const strip = (s: string): string => s.replace(/\[F-?\d{2,4}\]/g, "").replace(/\*\*/g, "").replace(/（推理说明）|\(推理说明\)/g, "").trim()

const NO_RISK_FINDING = /^(?:无|—|-|暂无|本次.*未发现)|均为\s*0|(?:本次)?扫描未发现(?:任何|公开)?记录|未发现(?:任何|公开)?记录/u
export function isRiskFindingText(text: string): boolean {
  return !NO_RISK_FINDING.test(strip(text))
}

export function parseCardInsights(md: string | null): CardInsights {
  if (md === null || md.trim() === "") return EMPTY_INSIGHTS
  const sections = ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].filter(t => new RegExp(`^#{1,4}[^\\n]*${t}`, "m").test(md))
  const core = section(md, "核心研判") || md
  const stateUndetermined = /状态未定/.test(core)
  let state: string | null = null
  let best = Number.POSITIVE_INFINITY
  for (const s of BUSINESS_STATES) {
    const idx = core.indexOf(s)
    if (idx !== -1 && idx < best) { best = idx; state = s }
  }
  const conf = /状态置信度[：:]\s*(中高|低|中|高)/.exec(md)
  const link = /产业链环节[：:]\s*([^\n｜|;；。]+)/.exec(md)
  const hypotheses: Hypothesis[] = []
  const hypoRe = /(H\d+)\s*[·・:：\-–]\s*\**\s*(P[012])\**\s*[·・:：\-–]\s*([^\n]+)/g
  const hypoSrc = section(md, "业务假设") || md
  let hm: RegExpExecArray | null
  while ((hm = hypoRe.exec(hypoSrc)) !== null) {
    const id = hm[1] ?? ""
    if (hypotheses.some(h => h.id === id)) continue
    hypotheses.push({ id, priority: hm[2] ?? "", text: strip(hm[3] ?? "") })
  }
  const riskSrc = section(md, "红线提示")
  const risks: RiskItem[] = []
  for (const line of riskSrc.split("\n")) {
    const t = line.trim()
    if (!t.startsWith("|")) continue
    const cells = t.split("|").slice(1, -1).map(c => c.trim())
    const level = cells[0] ?? ""
    const hit = (["红线", "关注", "信息"] as const).find(l => level.startsWith(l))
    if (hit === undefined) continue
    risks.push({ level: hit, text: strip(cells[1] ?? "") })
  }
  return {
    found: true,
    state: stateUndetermined ? null : state,
    stateUndetermined,
    confidence: conf?.[1] ?? null,
    industryLink: link?.[1] === undefined ? null : strip(link[1]),
    hypotheses,
    risks,
    riskNoRecord: /扫描未发现公开记录/.test(riskSrc),
    sections,
  }
}

const has = (events: ToolEvent[], fragments: string[], status?: ToolEvent["status"]): boolean =>
  events.some(e => fragments.some(f => e.name.includes(f)) && (status === undefined || e.status === status))

const completed = (events: ToolEvent[], fragments: string[]): boolean =>
  events.some(e => fragments.some(f => e.name.includes(f)) && (e.status === "done" || e.status === "no-data" || e.status === "skipped"))

const reviewing = (events: ToolEvent[], fragments: string[]): boolean =>
  events.some(e => fragments.some(f => e.name.includes(f)) && (e.status === "unknown" || e.status === "no-permission" || e.status === "not-executed"))

const failed = (events: ToolEvent[], fragments: string[]): boolean =>
  events.some(e => fragments.some(f => e.name.includes(f)) && e.status === "failed")

const running = (events: ToolEvent[], fragments: string[]): boolean =>
  events.some(e => fragments.some(f => e.name.includes(f)) && e.status === "running")

const BASIC = ["get_company_registration_info", "get_company_profile", "get_annual_reports", "get_shareholder_info", "get_key_personnel", "get_change_records", "get_beneficial_owners"]
const STATE_TOOLS = ["get_bidding_info", "get_financing_records", "get_recruitment_info", "get_administrative_license", "get_patent_info", "get_land_grant_info", "get_external_investments", "get_qualifications", "get_software_copyright_info", "get_financial_data", "get_company_announcement"]
const DRILL = ["get_dishonest_info", "get_judgment_debtor_info", "get_terminated_cases", "get_equity_freeze", "get_business_exception", "get_administrative_penalty", "get_tax_abnormal", "get_judicial_documents"]

function stepOf(done: boolean, active: boolean, review: boolean, hasFailed: boolean): Step["state"] {
  if (done) return "done"
  if (hasFailed) return "failed"
  if (active) return "active"
  return review ? "review" : "idle"
}

export function opportunitySteps(events: ToolEvent[], insights: CardInsights, finished: boolean): Step[] {
  const anchorTools = ["get_company_by_query", "previsit_confirm_entity"]
  const anchorDone = has(events, ["previsit_confirm_entity"], "done")
  const basicDone = BASIC.filter(f => completed(events, [f])).length
  const basicSeen = BASIC.filter(f => has(events, [f])).length
  const stateDone = insights.state !== null || insights.stateUndetermined
  const hypoDone = insights.hypotheses.length > 0
  return [
    { label: "主体锚定", state: stepOf(anchorDone, running(events, anchorTools) || (!finished && completed(events, ["get_company_by_query"])), reviewing(events, anchorTools), failed(events, anchorTools)) },
    { label: "基础信号", state: stepOf(basicDone >= 3, running(events, BASIC), reviewing(events, BASIC) || (finished && basicSeen > 0), failed(events, BASIC)), note: basicDone > 0 ? `${basicDone} 项完成` : basicSeen > 0 ? `${basicSeen} 项已返回` : undefined },
    { label: "状态判定", state: stepOf(stateDone, running(events, STATE_TOOLS), reviewing(events, STATE_TOOLS), failed(events, STATE_TOOLS)), note: insights.stateUndetermined ? "状态未定" : insights.state ?? undefined },
    { label: "假设反证", state: stepOf(hypoDone, !finished && stateDone, finished && stateDone, false), note: hypoDone ? `${insights.hypotheses.length} 条` : undefined },
  ]
}

export function riskSteps(events: ToolEvent[], insights: CardInsights, finished: boolean): Step[] {
  const scanTools = ["get_company_risk_scan"]
  const executiveTools = ["get_executive_risk_scan"]
  const scanDone = completed(events, scanTools)
  const drillEvents = DRILL.map(fragment => latestEvent(events, fragment))
  const resolvedDrills = drillEvents.filter(event => event !== null && ["done", "no-data", "skipped"].includes(event.status))
  const drillDone = scanDone && resolvedDrills.length === DRILL.length
  const skippedDrills = resolvedDrills.filter(event => event?.status === "skipped").length
  const queriedDrills = resolvedDrills.length - skippedDrills
  const pendingDrills = DRILL.length - resolvedDrills.length
  const executiveEvent = latestEvent(events, executiveTools[0]!)
  const execDone = executiveEvent !== null && ["done", "no-data", "skipped"].includes(executiveEvent.status)
  const judged = insights.sections.includes("红线提示")
  return [
    { label: "风险扫描", state: stepOf(scanDone, running(events, scanTools), reviewing(events, scanTools), failed(events, scanTools)) },
    {
      label: "明细下钻",
      state: stepOf(drillDone, running(events, DRILL), reviewing(events, DRILL) || (finished && scanDone && !drillDone), failed(events, DRILL)),
      note: drillDone
        ? (queriedDrills === 0 ? "扫描均为 0，无需下钻" : `${queriedDrills} 项完成${skippedDrills > 0 ? `，${skippedDrills} 项无需执行` : ""}`)
        : finished && scanDone ? `${pendingDrills} 项未闭环` : undefined,
    },
    {
      label: "董监高",
      state: stepOf(execDone, running(events, executiveTools), reviewing(events, executiveTools) || (finished && !execDone), failed(events, executiveTools)),
      note: executiveEvent?.status === "skipped" ? (executiveEvent.reason ?? "无需执行") : !execDone && finished ? "关键人员风险未闭环" : undefined,
    },
    { label: "影响判断", state: stepOf(judged, !finished && scanDone, finished && scanDone, false), note: judged ? `${insights.risks.length} 项` : undefined },
  ]
}
