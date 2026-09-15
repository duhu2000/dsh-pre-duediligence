/** Saved report time, never export time. Date-only legacy values retain their precision. */
export function formatReportTime(value?: string): string {
  if (!value) return ""
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})$/.test(value)) return value
  const date = new Date(value)
  if (!Number.isFinite(date.getTime())) return value
  const parts = new Intl.DateTimeFormat("en-GB", { timeZone: "Asia/Shanghai", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit", hourCycle: "h23" }).formatToParts(date)
  const get = (key: string) => parts.find(part => part.type === key)?.value ?? ""
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}:${get("second")}（北京时间）`
}

export function reportTextWithTime(markdown: string, completedAt: string): string {
  const stamp = "生成时间：" + formatReportTime(completedAt)
  const pattern = /生成时间[:：]\s*\d{4}-\d{2}-\d{2}(?:[ T]\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?)?(?:（北京时间）)?/g
  return pattern.test(markdown) ? markdown.replace(pattern, stamp) : stamp + "\n\n" + markdown
}
