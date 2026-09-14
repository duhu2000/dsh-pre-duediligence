import { createHash, randomUUID } from "node:crypto"

export type Material = {
  id: string; taskId: string; title: string; kind: "onsite" | "file" | "web" | "provider"
  locator: string; sourceDate: string; importedAt: string; sha256: string; text: string
  provenance: "supplied-text" // Location and dates are supplied metadata, not verified retrieval.
}
export type EvidenceFact = {
  id: string; materialId: string; entity: string; field: string; period: string; unit: string
  value: string; quote: string; location: string
}
export type EvidenceComparison = {
  id: string; leftId: string; rightId: string
  status: "consistent" | "conflict" | "incomparable" | "same-source"
  independence: "not-established"; createdAt: string
}
export function boundedText(value: unknown, max = 4000): string {
  if (typeof value !== "string" || !value.trim() || value.length > max || value.includes("\0")) throw new Error(`文本不能为空，且不得超过 ${max} 字符`)
  return value.trim()
}
export function createMaterial(input: Record<string, unknown>, taskId: string): Material {
  const kind = boundedText(input.kind)
  if (!["onsite", "file", "web", "provider"].includes(kind)) throw new Error("无效材料类型")
  const text = boundedText(input.text, 100_000)
  const locator = boundedText(input.locator, 2000)
  if (kind === "web") {
    const url = new URL(locator)
    if (!["http:", "https:"].includes(url.protocol) || url.username || url.password) throw new Error("网页来源必须是无凭据的 HTTP(S) URL")
  }
  return { id: `M-${randomUUID()}`, taskId, title: boundedText(input.title, 300), kind: kind as Material["kind"],
    locator, sourceDate: boundedText(input.sourceDate, 100), importedAt: new Date().toISOString(),
    text, sha256: createHash("sha256").update(text).digest("hex"), provenance: "supplied-text" }
}
export function createFact(input: Record<string, unknown>, materials: Material[], entity: string): EvidenceFact {
  const materialId = boundedText(input.materialId)
  const material = materials.find(m => m.id === materialId)
  const quote = boundedText(input.quote, 4000)
  const value = boundedText(input.value, 1000)
  if (!material || !material.text.includes(quote)) throw new Error("证据引文必须逐字存在于该任务材料中")
  if (!quote.includes(value)) throw new Error("事实值必须逐字存在于引文；换算或推断请在报告中另行标注")
  if (input.entity !== entity) throw new Error("事实主体必须与当前已确认主体一致")
  return { id: `E-${randomUUID()}`, materialId, entity, quote, value,
    field: boundedText(input.field, 100), period: boundedText(input.period, 100), unit: boundedText(input.unit, 100), location: boundedText(input.location, 300) }
}
export function compareFacts(leftId: string, rightId: string, facts: EvidenceFact[], materials: Material[]): EvidenceComparison {
  const left = facts.find(f => f.id === leftId), right = facts.find(f => f.id === rightId)
  if (!left || !right || leftId === rightId) throw new Error("请选择两条不同且存在的证据")
  const a = materials.find(m => m.id === left.materialId), b = materials.find(m => m.id === right.materialId)
  if (!a || !b) throw new Error("证据来源缺失")
  const comparable = ["entity", "field", "period", "unit"] as const
  const unknown = /^(未知|不详|待确认|unknown|n\/a)$/i
  const status = a.id === b.id || a.sha256 === b.sha256 || a.locator === b.locator ? "same-source"
    : comparable.some(k => left[k] !== right[k] || unknown.test(left[k])) || unknown.test(left.value) || unknown.test(right.value) ? "incomparable"
      : left.value === right.value ? "consistent" : "conflict"
  return { id: `C-${randomUUID()}`, leftId, rightId, status, independence: "not-established", createdAt: new Date().toISOString() }
}
