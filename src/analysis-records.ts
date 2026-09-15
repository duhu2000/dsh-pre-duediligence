/** Public, evidence-linked findings; not private reasoning or a report substitute. */
export type AnalysisRecord = {
  id: string
  kind: "verification" | "hypothesis"
  riskLevel?: "红线" | "关注" | "信息"
  title: string
  status: "pending" | "supported" | "partial" | "contradicted" | "insufficient" | "onsite"
  summary: string
  support: string[]
  counter: string[]
  unknown: string[]
  nextAction: string
  evidenceIds: string[]
  revision: number
  updatedAt: string
}
export const ANALYSIS_STATUSES = { pending: "待验证", supported: "有证据支持", partial: "部分支持", contradicted: "有反证", insufficient: "证据不足", onsite: "待客户确认" } as const
export function parseAnalysisRecord(input: Record<string, unknown>): Omit<AnalysisRecord, "revision" | "updatedAt"> {
  const text = (key: string, max = 600) => {
    const value = input[key]
    if (typeof value !== "string" || !value.trim() || value.length > max) throw new Error(`无效分析字段：${key}`)
    return value.trim()
  }
  const list = (key: string) => {
    const value = input[key]
    if (!Array.isArray(value) || value.length > 12 || value.some(v => typeof v !== "string" || !v.trim() || v.length > 600)) throw new Error(`无效分析列表：${key}`)
    return [...new Set(value as string[])]
  }
  const kind = input.kind, status = input.status
  if (kind !== "verification" && kind !== "hypothesis") throw new Error("未知分析类型")
  if (typeof status !== "string" || !Object.hasOwn(ANALYSIS_STATUSES, status)) throw new Error("未知分析状态")
  const record: Omit<AnalysisRecord, "revision" | "updatedAt"> = { id: text("id", 80), kind, status: status as AnalysisRecord["status"], title: text("title", 160), summary: text("summary"), support: list("support"), counter: list("counter"), unknown: list("unknown"), nextAction: text("nextAction"), evidenceIds: list("evidenceIds") }
  if (["supported", "partial"].includes(status) && (!record.support.length || !record.evidenceIds.length)) throw new Error("支持判断必须提供支持说明与证据引用")
  if (status === "contradicted" && (!record.counter.length || !record.evidenceIds.length)) throw new Error("反证判断必须提供反证说明与证据引用")
  if (input.riskLevel !== undefined) {
    if (kind !== "verification" || !["红线", "关注", "信息"].includes(input.riskLevel as string)) throw new Error("风险分级仅适用于核验记录")
    if (!record.support.length || !record.evidenceIds.length) throw new Error("风险分级必须提供依据与证据引用")
    record.riskLevel = input.riskLevel as NonNullable<AnalysisRecord["riskLevel"]>
  }
  return record
}
export function latestAnalysis(records: AnalysisRecord[] = []): AnalysisRecord[] {
  return [...new Map(records.map(record => [record.id, record])).values()]
}
