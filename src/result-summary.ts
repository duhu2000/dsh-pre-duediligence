/** Bounded provider facts for live display and historical review; never executable content. */
export type ResultSummary = { summary: string; facts: string[]; factors: { name: string; count: number }[] }

export function summarizeResult(value: unknown): ResultSummary {
  const result: ResultSummary = { summary: "", facts: [], factors: [] }
  const seen = new Set<object>()
  const fields = /^(经营状态|登记状态|主营业务|经营范围|所属行业|行业|注册资本|成立日期|参保人数|企业名称|产业链|产业链环节|核心业务|产品名称|产品介绍|业务介绍|企业简介|简介|行业标签|融资轮次|轮次|融资金额|融资日期|投资方|投资机构|项目名称|招标项目名称|中标项目名称|中标金额|发布日期|公告日期|招标人|中标人|职位名称|招聘职位|工作地点|薪资|招聘人数|年度|年份|年报年度|变更日期|变更项目|变更前|变更后|日期|时间|总数|记录总数|记录数|总条数|total|totalCount|count)$/
  const fact = (value: string) => { if (result.facts.length < 18 && !result.facts.includes(value)) result.facts.push(value) }
  let visited = 0
  const visit = (item: unknown, depth: number, path = ""): void => {
    if (depth > 7 || ++visited > 1000 || item === null || typeof item !== "object" || seen.has(item)) return
    seen.add(item)
    if (Array.isArray(item)) { item.slice(0, 80).forEach((child, index) => visit(child, depth + 1, `${path}[${index + 1}]`)); return }
    const row = item as Record<string, unknown>
    const name = row["风险因子"] ?? row["因子名称"]
    const raw = row["条目数"] ?? row["记录数"]
    const count = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN
    if (typeof name === "string" && Number.isSafeInteger(count) && count >= 0 && !result.factors.some(f => f.name === name)) result.factors.push({ name: name.slice(0, 100), count })
    for (const [key, child] of Object.entries(row)) {
      if ((key === "摘要" || key === "summary") && typeof child === "string" && !result.summary) result.summary = child.slice(0, 1800)
      if (/token|secret|password|authorization|凭据|密钥|密码|身份证|证件号码|银行账号/i.test(key)) continue
      // QCC's Chinese business labels vary by dimension; retain bounded scalar fields
      // rather than guessing a conclusion or dropping every unrecognised business label.
      const businessLabel = /^[\u3400-\u9fff][\u3400-\u9fffA-Za-z0-9（）()、/ _-]{0,39}$/.test(key)
      if ((fields.test(key) || businessLabel) && (typeof child === "string" || typeof child === "number")) fact(`${path.includes("[") ? `${path.slice(0, 120)} · ` : ""}${key}：${String(child).slice(0, 500)}`)
      if (key === "text" && typeof child === "string" && child.length < 200000) {
        try { visit(JSON.parse(child), depth + 1, path) } catch { /* Unstructured prose is not guessed as a fact. */ }
      }
      visit(child, depth + 1, path ? `${path}.${key}` : key)
    }
  }
  visit(value, 0)
  return result
}
