/** Bounded provider facts for live display and historical review; never executable content. */
export type ResultSummary = { summary: string; facts: string[]; factors: { name: string; count: number }[] }

export function summarizeResult(value: unknown): ResultSummary {
  const result: ResultSummary = { summary: "", facts: [], factors: [] }
  let visited = 0
  const visit = (item: unknown, depth: number): void => {
    if (depth > 7 || ++visited > 1000 || item === null || typeof item !== "object") return
    if (Array.isArray(item)) { item.slice(0, 80).forEach(child => visit(child, depth + 1)); return }
    const row = item as Record<string, unknown>
    const name = row["风险因子"] ?? row["因子名称"]
    const raw = row["条目数"] ?? row["记录数"]
    const count = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN
    if (typeof name === "string" && Number.isSafeInteger(count) && count >= 0 && !result.factors.some(f => f.name === name)) result.factors.push({ name: name.slice(0, 100), count })
    for (const [key, child] of Object.entries(row)) {
      if ((key === "摘要" || key === "summary") && typeof child === "string" && !result.summary) result.summary = child.slice(0, 1800)
      if (depth <= 2 && /^(经营状态|登记状态|主营业务|经营范围|所属行业|行业|注册资本|成立日期|参保人数|企业名称)$/.test(key) && (typeof child === "string" || typeof child === "number") && result.facts.length < 12) result.facts.push(`${key}：${String(child).slice(0, 500)}`)
      visit(child, depth + 1)
    }
  }
  visit(value, 0)
  return result
}
