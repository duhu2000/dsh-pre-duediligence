/** Omit optional object properties, but reject values JSON would silently corrupt. */
export function toolJson(value: unknown, seen = new Set<object>()): unknown {
  if (value === null || typeof value === "string" || typeof value === "boolean") return value
  if (typeof value === "number" && Number.isFinite(value) && !Object.is(value, -0)) return value
  if (typeof value !== "object" || seen.has(value)) throw new Error("工具结果包含不可序列化的值")
  if (!Array.isArray(value) && Object.getPrototypeOf(value) !== Object.prototype && Object.getPrototypeOf(value) !== null) throw new Error("工具结果必须为普通 JSON 对象")
  seen.add(value)
  try {
    if (Array.isArray(value)) return Array.from(value, item => toolJson(item, seen))
    return Object.fromEntries(Object.entries(value).filter(([, item]) => item !== undefined).map(([key, item]) => [key, toolJson(item, seen)]))
  } finally { seen.delete(value) }
}
