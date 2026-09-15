import { isPrevisitSession } from "./previsit-session.js"
import { isInitialDraft } from "./initial-draft.js"
// 图片/文件名单接入（照数据清洗补全智能体的做法）：
// 浏览器只把用户明确选择的图片以 Base64 暂存到 Host 的临时文件（0600、15 分钟 TTL）；
// 真正的文字识别由宿主高层工具在当前 Agent 会话里调用本机 qcc-document-mcp（file_path）完成。
// 远端 qcc-document 只接受公网 file_url，读不到本机文件，不能用。
import { randomUUID } from "node:crypto"
import { mkdir, rmdir, unlink, writeFile } from "node:fs/promises"
import { tmpdir } from "node:os"
import { join } from "node:path"

export const IMAGE_LIMITS = { maxBytes: 8 * 1024 * 1024, maxEntries: 50, ttlMs: 15 * 60 * 1000 } as const

// 本机文档解析 MCP 在 DSH 里可能出现的服务名（与清洗智能体保持一致）
export const LOCAL_DOCUMENT_TOOL_PAIRS = [
  ["mcp__qcc-document-mcp__parse_document", "mcp__qcc-document-mcp__get_parse_result"],
  ["mcp__document__parse_document", "mcp__document__get_parse_result"],
  ["mcp__qcc-document-local__parse_document", "mcp__qcc-document-local__get_parse_result"],
  ["mcp__document-mcp__parse_document", "mcp__document-mcp__get_parse_result"],
] as const

export class ImageIntakeError extends Error {
  constructor(readonly code: string, message: string, readonly status = 400) { super(message); this.name = "ImageIntakeError" }
}

export type StagedImage = {
  commandId: string
  sessionId: string
  state: "prepared" | "running" | "completed" | "failed"
  fileName: string
  mimeType: string
  sizeBytes: number
  createdAt: string
  expiresAt: number
  path: string | null
  result: { entries: string[]; text: string } | null
  error: { code: string; message: string } | null
}

type ToolSchema = { name: string; parameters?: { properties?: Record<string, unknown> } }
export type ImageAgent = { id: string; session: { id: string; header?: { cwd?: string } } }
export type ImageToolHost = {
  schemas(agent: ImageAgent): ToolSchema[]
  execute(input: { name: string; callId: string; rootCallId: string; parent: unknown; agent: ImageAgent; signal: AbortSignal; arguments: unknown }): Promise<{ isError: boolean; value?: unknown; content: unknown[]; error?: { message?: string } }>
}
export type ImageExecution = { agent: ImageAgent; rootCallId: string; token: unknown; signal: AbortSignal }

function sniff(bytes: Buffer): { mimeType: string; extension: string } | null {
  if (bytes.length < 12) return null
  if (bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return { mimeType: "image/png", extension: "png" }
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return { mimeType: "image/jpeg", extension: "jpg" }
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return { mimeType: "image/webp", extension: "webp" }
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return { mimeType: "application/pdf", extension: "pdf" }
  return null
}

function decode(content: unknown): { bytes: Buffer; mimeType: string; extension: string } {
  const raw = String(content ?? "").replace(/^data:[a-z0-9.+/-]+;base64,/i, "")
  if (raw.length > Math.ceil(IMAGE_LIMITS.maxBytes / 3) * 4) throw new ImageIntakeError("PV_IMAGE_TOO_LARGE", "图片不能超过 8 MiB。", 413)
  if (raw === "" || !/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4 === 1) throw new ImageIntakeError("PV_IMAGE_BASE64", "图片内容不是有效的 Base64 数据。")
  const bytes = Buffer.from(raw, "base64")
  if (bytes.length === 0) throw new ImageIntakeError("PV_IMAGE_EMPTY", "图片内容为空。")
  if (bytes.length > IMAGE_LIMITS.maxBytes) throw new ImageIntakeError("PV_IMAGE_TOO_LARGE", "图片不能超过 8 MiB。", 413)
  const detected = sniff(bytes)
  if (detected === null) throw new ImageIntakeError("PV_IMAGE_TYPE", "仅支持 PNG、JPEG、WebP 图片或 PDF。", 415)
  return { bytes, ...detected }
}

const COMPANY_END = "(?:有限责任公司|股份有限公司|集团有限公司|有限公司|集团公司|公司|普通合伙|有限合伙|合伙企业|个人独资企业|农民专业合作社|合作社|事务所|研究院|研究所|中心|商行|工厂|厂)"
const COMPANY_RE = new RegExp(`[\\p{Script=Han}A-Za-z0-9（）()·&＋+—\\-]{2,72}?${COMPANY_END}`, "gu")
const HEADER_RE = /^(?:序号|企业名称|公司名称|单位名称|统一社会信用代码|信用代码|注册号|名称|企业名单)$/i
const cleanCell = (value: string): string => value.replace(/^\s*(?:[-•·●▪◦]|\d{1,4}[.)、：:]?)\s*/, "").replace(/^(?:企业名称|公司名称|单位名称)\s*[:：]\s*/i, "").replace(/[\s ]+/g, "").trim()

/** 从识别文字里确定性抽出企业名（一行可多家）；不猜测不存在的主体。 */
export function extractCompanyNames(text: string, max: number = IMAGE_LIMITS.maxEntries): string[] {
  if (isInitialDraft(text)) return []
  const out: string[] = []
  const seen = new Set<string>()
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim()
    if (line === "") continue
    for (const cell of line.split(/\t|[|｜]|\s{2,}|[，,；;]/)) {
      const compact = cleanCell(cell)
      if (compact === "" || HEADER_RE.test(compact)) continue
      for (const m of compact.matchAll(COMPANY_RE)) {
        const name = m[0]
        const key = name.toLowerCase()
        if (seen.has(key)) continue
        seen.add(key)
        out.push(name)
        if (out.length >= max) return out
      }
    }
  }
  return out
}

function unwrap(result: { isError: boolean; value?: unknown; content: unknown[]; error?: { message?: string } }): unknown {
  if (result.isError) throw new ImageIntakeError("PV_IMAGE_PROVIDER_FAILED", result.error?.message ?? "文档解析调用失败。", 502)
  let value: unknown = result.value ?? result
  if (value !== null && typeof value === "object" && "structuredContent" in value) value = (value as { structuredContent: unknown }).structuredContent
  const content = value !== null && typeof value === "object" && "content" in value ? (value as { content: unknown }).content : result.content
  if (Array.isArray(content)) {
    const text = content.filter((b): b is { type: string; text: string } => b?.type === "text" && typeof b.text === "string").map(b => b.text).join("\n")
    if (text !== "") { try { value = JSON.parse(text) } catch { value = { result_md: text } } }
  }
  return value
}
const rec = (v: unknown): Record<string, unknown> => v !== null && typeof v === "object" && !Array.isArray(v) ? v as Record<string, unknown> : {}
function markdownOf(value: unknown): string {
  const v = rec(value)
  const details = Array.isArray(v.details) ? v.details : []
  return [...details, v].map(d => String(rec(d).result_md ?? rec(d).resultMd ?? "").trim()).filter(Boolean).join("\n")
}
function statusOf(value: unknown): "success" | "failed" | "processing" {
  const raw = String(rec(value).status ?? rec(value).state ?? "").toLowerCase()
  if (["success", "succeeded", "completed", "complete", "done"].includes(raw)) return "success"
  if (["failed", "failure", "error", "cancelled", "canceled"].includes(raw)) return "failed"
  if (markdownOf(value) !== "") return "success"
  return "processing"
}

const safeName = (value: unknown): string => String(value ?? "商机图片").replace(/[\u0000-\u001f\u007f/\\]/g, "_").trim().slice(0, 160) || "商机图片"

export class ImageIntakeStore {
  private readonly records = new Map<string, StagedImage & { promise: Promise<{ entries: string[]; text: string }> | null }>()
  private readonly imageRoot = join(tmpdir(), `dsh-pre-duediligence-images-${randomUUID()}`)
  private disposed = false
  private readonly cleanupTimer: ReturnType<typeof setInterval>
  constructor(private readonly tools: ImageToolHost, private readonly clock: () => number = () => Date.now(), private readonly pollMs = 500, private readonly maxPolls = 90) {
    this.cleanupTimer = setInterval(() => { void this.cleanup().catch(() => {}) }, 60_000)
    this.cleanupTimer.unref?.()
  }

  /** 找到本机文档解析工具对（必须支持 file_path）。 */
  provider(agent: ImageAgent): { parse: string; result: string } | null {
    const names = new Map(this.tools.schemas(agent).map(s => [s.name, s]))
    for (const [parse, result] of LOCAL_DOCUMENT_TOOL_PAIRS) {
      const p = names.get(parse)
      if (p !== undefined && names.has(result) && p.parameters?.properties !== undefined && "file_path" in p.parameters.properties) return { parse, result }
    }
    return null
  }

  async prepare(input: { sessionId: string; fileName?: unknown; content?: unknown }): Promise<StagedImage> {
    if (this.disposed) throw new ImageIntakeError("PV_IMAGE_DISPOSED", "图片导入服务已停止。", 503)
    if (!isPrevisitSession(input.sessionId)) throw new ImageIntakeError("PV_IMAGE_SESSION", "请选择访前尽调会话。")
    await this.cleanup()
    const decoded = decode(input.content)
    const commandId = `pvi-${randomUUID()}`
    await mkdir(this.imageRoot, { recursive: true, mode: 0o700 })
    const path = join(this.imageRoot, `${commandId}.${decoded.extension}`)
    await writeFile(path, decoded.bytes, { mode: 0o600, flag: "wx" })
    const record = {
      commandId, sessionId: input.sessionId, state: "prepared" as const, fileName: safeName(input.fileName),
      mimeType: decoded.mimeType, sizeBytes: decoded.bytes.length, createdAt: new Date(this.clock()).toISOString(), expiresAt: this.clock() + IMAGE_LIMITS.ttlMs,
      path, result: null, error: null, promise: null,
    }
    this.records.set(commandId, record)
    return this.status(commandId, input.sessionId)
  }

  status(commandId: string, sessionId: string): StagedImage {
    const record = this.records.get(commandId)
    if (this.disposed || record === undefined || record.sessionId !== sessionId || (record.expiresAt <= this.clock() && record.state !== "running")) throw new ImageIntakeError("PV_IMAGE_NOT_FOUND", "图片暂存不存在或已过期（15 分钟），请重新导入。", 404)
    const { promise: _promise, ...pub } = record
    return structuredClone(pub)
  }

  async run(commandId: string, exec: ImageExecution): Promise<{ commandId: string; fileName: string; entries: string[]; text: string }> {
    this.status(commandId, exec.agent.session.id)
    exec.signal.throwIfAborted()
    const record = this.records.get(commandId)
    if (record === undefined) throw new ImageIntakeError("PV_IMAGE_NOT_FOUND", "图片暂存不存在或已过期，请重新导入。", 404)
    if (record.state === "completed" && record.result !== null) return { commandId, fileName: record.fileName, ...record.result }
    if (record.promise !== null) return { commandId, fileName: record.fileName, ...(await record.promise) }
    const provider = this.provider(exec.agent)
    if (provider === null) {
      const error = new ImageIntakeError("PV_IMAGE_PROVIDER_UNAVAILABLE", "当前 DSH 没有连接支持本机文件的企查查文档解析 qcc-document-mcp。请在 MCP 连接器里配置本机 qcc-document-mcp 后重试，或改发文字企业名单。", 503)
      record.state = "failed"
      record.error = { code: error.code, message: error.message }
      throw error
    }
    record.state = "running"
    record.error = null
    const execute = async (name: string, args: unknown) => {
      exec.signal.throwIfAborted()
      const result = await this.tools.execute({ name, callId: `previsit-image-${randomUUID()}`, rootCallId: exec.rootCallId, parent: exec.token, agent: exec.agent, signal: exec.signal, arguments: args })
      exec.signal.throwIfAborted()
      return result
    }
    record.promise = (async () => {
      let value = unwrap(await execute(provider.parse, { file_path: record.path, wait: true }))
      let status = statusOf(value)
      const taskId = String(rec(value).task_id ?? rec(value).taskId ?? "")
      for (let poll = 0; status === "processing" && poll < this.maxPolls; poll++) {
        if (taskId === "") throw new ImageIntakeError("PV_IMAGE_CONTRACT", "文档解析未返回 task_id。", 502)
        await new Promise(resolve => setTimeout(resolve, this.pollMs))
        exec.signal.throwIfAborted()
        value = unwrap(await execute(provider.result, { task_id: taskId }))
        status = statusOf(value)
      }
      if (status === "processing") throw new ImageIntakeError("PV_IMAGE_TIMEOUT", "文档解析仍在处理中，请稍后重新识别。", 504)
      if (status === "failed") throw new ImageIntakeError("PV_IMAGE_FAILED", "企查查文档解析失败，请检查图片后重试。", 502)
      const text = markdownOf(value)
      if (text === "") throw new ImageIntakeError("PV_IMAGE_NO_TEXT", "图片中未识别到可用文字，请换更清晰的原图。", 422)
      const entries = extractCompanyNames(text)
      return { entries, text: text.slice(0, 4000) }
    })().then(async result => {
      record.result = result; record.state = "completed"; record.error = null
      await this.removeFile(record)
      return result
    }, async (error: unknown) => {
      record.state = "failed"
      record.error = error instanceof ImageIntakeError ? { code: error.code, message: error.message } : { code: "PV_IMAGE_PROVIDER_FAILED", message: "文档解析当前不可用。" }
      // Keep the staged file retryable until its original expiry. It is removed
      // on success, explicit deletion, TTL cleanup, or plugin disposal.
      throw error
    })
    try { return { commandId, fileName: record.fileName, ...(await record.promise) } }
    finally { record.promise = null }
  }

  async remove(commandId: string, sessionId: string): Promise<boolean> {
    const record = this.records.get(commandId)
    if (record === undefined) return false
    if (record.sessionId !== sessionId) throw new ImageIntakeError("PV_IMAGE_NOT_FOUND", "图片暂存不属于当前会话。", 404)
    if (record.state === "running") throw new ImageIntakeError("PV_IMAGE_BUSY", "图片正在识别，暂不能移除。", 409)
    await this.removeFile(record)
    this.records.delete(commandId)
    return true
  }

  private async removeFile(record: { path: string | null }): Promise<void> {
    const path = record.path
    record.path = null
    if (path === null) return
    try { await unlink(path) } catch (error) { if ((error as { code?: string }).code !== "ENOENT") throw error }
  }

  private async cleanup(): Promise<void> {
    const now = this.clock()
    for (const [id, record] of this.records) {
      if (record.expiresAt <= now && record.state !== "running") { await this.removeFile(record); this.records.delete(id) }
    }
  }

  async dispose(): Promise<void> {
    this.disposed = true
    clearInterval(this.cleanupTimer)
    await Promise.all([...this.records.values()].map(r => this.removeFile(r).catch(() => undefined)))
    this.records.clear()
    await rmdir(this.imageRoot).catch(() => undefined)
  }
}

/** 暂存成功后回填到输入框的说明：模型只需调用一次高层工具。 */
export function imageExtractionPrompt(command: { commandId: string; fileName: string }): string {
  return [
    `请识别我刚导入的商机图片「${command.fileName}」里的企业名单，并登记成尽调计划让我挑选。`,
    `安全图片凭证：${command.commandId}`,
    "请只调用一次 previsit_extract_image_companies，参数只传 commandId；该高层工具会在宿主内调用本机企查查文档解析并直接登记计划，不要直接调用任何 mcp__qcc-document* 工具，也不要在计划确认前调用企查查查询。识别结果出来后，在对话里列出候选企业并等我确认。",
  ].join("\n")
}
