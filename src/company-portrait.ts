/** Optional, bounded source fields; not analysis or a replacement for the original result. */
export type CompanyPortrait = {
  region?: string; areaCode?: string; nationalIndustry?: string; qccIndustry?: string
  products?: string[]; scale?: string; introduction?: string; overview?: string
  status?: string; capital?: string
}

const text = (value: unknown): string => typeof value === "string" ? value.trim().slice(0, 1200) : ""
function hierarchy(value: unknown, keys: string[]): string {
  if (typeof value === "string") return text(value)
  if (!value || typeof value !== "object" || Array.isArray(value)) return ""
  const row = value as Record<string, unknown>
  return keys.map(key => text(row[key]) ? `${key}：${text(row[key])}` : "").filter(Boolean).join(" / ")
}

export function collectPortrait(target: CompanyPortrait, row: Record<string, unknown>): void {
  const put = (key: keyof CompanyPortrait, value: string) => { if (value && !target[key]) Object.assign(target, { [key]: value }) }
  const area = row.地区信息
  if (area && typeof area === "object" && !Array.isArray(area)) {
    const fields = area as Record<string, unknown>
    put("region", ["省份", "城市", "区域"].map(key => text(fields[key])).filter(Boolean).join(" / "))
    put("areaCode", text(fields.地区代码))
  }
  put("region", text(row.所属地区))
  put("nationalIndustry", hierarchy(row.国标行业, ["门类", "大类", "中类", "小类"]))
  put("qccIndustry", hierarchy(row.企查查行业, ["一级", "二级", "三级", "四级"]))
  if (target.products === undefined && Object.hasOwn(row, "主营产品")) {
    if (Array.isArray(row.主营产品)) target.products = [...new Set(row.主营产品.filter((item): item is string => typeof item === "string").map(item => text(item).slice(0, 120)).filter(Boolean))].slice(0, 10)
    else if (typeof row.主营产品 === "string") target.products = text(row.主营产品) ? [text(row.主营产品)] : []
  }
  put("scale", text(row.企业规模))
  put("introduction", text(row.简介 ?? row.企业简介))
  put("overview", text(row.产业链概览))
  put("status", text(row.登记状态 ?? row.经营状态))
  put("capital", text(row.注册资本))
}
