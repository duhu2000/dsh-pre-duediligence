import { randomUUID } from "node:crypto"

import type { ToolOutcome } from "./tool-outcome.js"

export const PREVISIT_TASK_STATES = [
  "needs-entity-search",
  "needs-entity-confirmation",
  "entity-confirmed",
  "running",
  "finalizing",
  "completed",
  "partial",
  "failed",
] as const

export type PrevisitTaskState = (typeof PREVISIT_TASK_STATES)[number]
export type PrevisitTaskStage = "target" | "scope" | "collect" | "verify" | "output"

export const PREVISIT_TERMINAL_STATES: ReadonlySet<PrevisitTaskState> = new Set(["completed", "partial", "failed"])

export type PrevisitRun = {
  id: string
  dimension: string
  toolName?: string
  status: ToolOutcome
  quotaUsed: boolean
  startedAt: string
  completedAt?: string
  message?: string
}

export type PrevisitArtifact = {
  id: string
  format: "html"
  fileName: string
  mediaType: "text/html; charset=utf-8"
  createdAt: string
}

export type PrevisitTaskRecord = {
  id: string
  schemaVersion: 1
  revision: number
  sessionId: string
  workspace: string
  query: string
  depth: "fast" | "standard" | "deep"
  limit: number
  used: number
  state: PrevisitTaskState
  stage: PrevisitTaskStage
  entity?: { fullName: string; creditCode: string }
  runs: PrevisitRun[]
  reportMarkdown?: string
  artifact?: PrevisitArtifact
  lastError?: string
  createdAt: string
  updatedAt: string
  completedAt?: string
}

export type PrevisitVerificationClosure = {
  gaps: string[]
  partialRequired: boolean
}

const VERIFICATION_DETAIL_LABELS = {
  dishonest: "失信明细",
  enforcement: "被执行明细",
  terminated_cases: "终本案件明细",
  equity_freeze: "股权冻结明细",
  business_exception: "经营异常明细",
  administrative_penalty: "行政处罚明细",
  tax_abnormal: "税务异常明细",
  judicial_documents: "裁判文书明细",
} as const

const UNRESOLVED_VERIFICATION_STATUSES: ReadonlySet<ToolOutcome> = new Set([
  "failed",
  "no-permission",
  "not-executed",
  "unknown",
])

/**
 * Shared verification gate for explicit tool finalization and the UI report
 * reconciliation fallback. `skipped` is a resolved green state; synthetic
 * `previsit-pending-*` runs remain open until a real Provider result replaces them.
 */
export function previsitVerificationClosure(task: PrevisitTaskRecord): PrevisitVerificationClosure {
  const verificationDimensions = new Set<string>([
    "risk_scan",
    "personnel",
    "executive_risk",
    ...Object.keys(VERIFICATION_DETAIL_LABELS),
  ])
  const latest = new Map<string, PrevisitRun>()
  for (const run of task.runs) if (verificationDimensions.has(run.dimension)) latest.set(run.dimension, run)
  const gaps: string[] = []
  const isPending = (run: PrevisitRun | undefined) => run === undefined
    || run.status === "running"
    || run.id.startsWith("previsit-pending-")

  const riskScan = latest.get("risk_scan")
  if (isPending(riskScan)) gaps.push("风险扫描未完成")
  else if (riskScan?.status === "done" || riskScan?.status === "no-data" || riskScan?.status === "skipped") {
    for (const [dimension, label] of Object.entries(VERIFICATION_DETAIL_LABELS)) {
      if (isPending(latest.get(dimension))) gaps.push(`${label}未闭环`)
    }
  }

  const personnel = latest.get("personnel")
  if (isPending(personnel)) gaps.push("关键人员查询未完成")
  else if (personnel?.status === "done" || personnel?.status === "unknown" || personnel?.status === "no-data") {
    if (isPending(latest.get("executive_risk"))) gaps.push("董监高风险扫描未闭环")
  }

  return {
    gaps: [...new Set(gaps)],
    partialRequired: [...latest.values()].some(run => UNRESOLVED_VERIFICATION_STATUSES.has(run.status)),
  }
}

type StorageTable = {
  get(key: string): unknown | Promise<unknown>
  put(key: string, value: unknown): unknown | Promise<unknown>
  entries(): Iterable<[string, unknown]>
}

export type StorageDomain = {
  open(spec: object): Promise<{ table(name: string): StorageTable }>
}

const DOMAIN_SPEC = {
  name: "previsit_tasks_v1",
  version: 1,
  tables: {
    tasks: {
      valueSchema: {
        parse: (value: unknown) => value,
        safeParse: (value: unknown) => ({ success: true, data: value }),
      },
    },
  },
}

const VALID_REQUEST_ID = /^PV-\d{8}-[A-Z0-9-]{4,40}$/
const nowIso = () => new Date().toISOString()

function isRecord(value: unknown): value is PrevisitTaskRecord {
  if (value === null || typeof value !== "object") return false
  const record = value as Partial<PrevisitTaskRecord>
  return typeof record.id === "string"
    && record.schemaVersion === 1
    && typeof record.sessionId === "string"
    && typeof record.query === "string"
    && typeof record.limit === "number"
    && typeof record.used === "number"
    && Array.isArray(record.runs)
    && PREVISIT_TASK_STATES.includes(record.state as PrevisitTaskState)
}

function normalizeTerminalRecord(record: PrevisitTaskRecord): PrevisitTaskRecord {
  // `limit` remains in schema v1 for backward compatibility. Zero is the
  // unbounded sentinel; migrate previously persisted 8/18/40-call tasks as
  // they are read so an installed upgrade cannot remain stuck at the old cap.
  const unlimited = record.limit === 0 ? record : { ...record, limit: 0 }
  const reportReady = typeof unlimited.reportMarkdown === "string" && unlimited.reportMarkdown.trim() !== ""
  if (PREVISIT_TERMINAL_STATES.has(unlimited.state) || !reportReady) return unlimited
  return {
    ...unlimited,
    state: unlimited.runs.some(run => run.status === "failed") ? "partial" : "completed",
    stage: "output",
    completedAt: unlimited.completedAt ?? unlimited.artifact?.createdAt ?? unlimited.updatedAt,
  }
}

function assertTaskOpen(record: PrevisitTaskRecord): void {
  if (PREVISIT_TERMINAL_STATES.has(record.state) || (record.reportMarkdown?.trim() ?? "") !== "") {
    throw new Error("访前任务已结束；请新建尽调后再查询")
  }
}

export function normalizePrevisitRequestId(value: unknown): string | undefined {
  if (typeof value !== "string") return undefined
  const id = value.trim().toUpperCase()
  return VALID_REQUEST_ID.test(id) ? id : undefined
}

export function createPrevisitHostTaskId(): string {
  return `PVT-${randomUUID()}`
}

export function reportArtifactFor(task: PrevisitTaskRecord, timestamp = nowIso()): PrevisitArtifact {
  const company = (task.entity?.fullName || task.query || "访前尽调报告")
    .replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-")
    .replace(/\s+/g, "-")
    .slice(0, 80)
  return {
    id: `PVA-${randomUUID()}`,
    format: "html",
    fileName: `访前尽调报告_${company}.html`,
    mediaType: "text/html; charset=utf-8",
    createdAt: timestamp,
  }
}

export function validatePrevisitReport(reportMarkdown: string, entityName?: string): string {
  const report = reportMarkdown.trim()
  if (report.length < 80 || report.length > 240_000) throw new Error("缺少有效的完整报告")
  const required = ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"]
  const headings = [...report.matchAll(/^#{2,4}\s+(.+)$/gm)].map(match => match[1] ?? "")
  if (!required.every(section => headings.some(heading => heading.includes(section)))) throw new Error("报告缺少固定八段，未生成制品")
  if (entityName !== undefined && !report.includes(entityName)) throw new Error("报告主体与已确认法律实体不一致")
  return report
}

/**
 * Host-owned public task state. Raw QCC responses stay in the execution guard's
 * private memory; only progress, entity identity and the user-facing report are persisted.
 */
export class PrevisitWorkflowStore {
  private readonly records = new Map<string, PrevisitTaskRecord>()
  private table: StorageTable | undefined
  private attachPromise: Promise<void> | undefined

  attach(storageDomain: StorageDomain, logger: { info?(message: string): void; warn?(message: string): void } = console): Promise<void> {
    if (this.attachPromise !== undefined) return this.attachPromise
    this.attachPromise = storageDomain.open(DOMAIN_SPEC).then(async access => {
      this.table = access.table("tasks")
      for (const [id, value] of this.table.entries()) if (isRecord(value)) this.records.set(id, normalizeTerminalRecord(value))
      for (const [id, record] of this.records) await this.table.put(id, record)
      logger.info?.("[dsh-pre-duediligence] persistent task state ready")
    }).catch(error => {
      logger.warn?.(`[dsh-pre-duediligence] persistent task state unavailable: ${error instanceof Error ? error.message : String(error)}`)
      this.attachPromise = undefined
    })
    return this.attachPromise
  }

  async list(sessionId?: string): Promise<PrevisitTaskRecord[]> {
    const records: PrevisitTaskRecord[] = []
    for (const cached of this.records.values()) {
      const record = normalizeTerminalRecord(cached)
      if (record !== cached) await this.put(record)
      if (sessionId === undefined || record.sessionId === sessionId) records.push(record)
    }
    return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  async get(id: string): Promise<PrevisitTaskRecord | undefined> {
    const cached = this.records.get(id)
    if (cached !== undefined) {
      const normalized = normalizeTerminalRecord(cached)
      if (normalized !== cached) await this.put(normalized)
      return normalized
    }
    if (this.table === undefined) return undefined
    const value = await this.table.get(id)
    if (!isRecord(value)) return undefined
    const normalized = normalizeTerminalRecord(value)
    if (normalized !== value) await this.put(normalized)
    else this.records.set(id, normalized)
    return normalized
  }

  async put(record: PrevisitTaskRecord): Promise<PrevisitTaskRecord> {
    this.records.set(record.id, record)
    await this.table?.put(record.id, record)
    return record
  }

  async create(input: {
    id?: string
    sessionId: string
    workspace: string
    query: string
    depth: "fast" | "standard" | "deep"
    limit?: number
  }): Promise<PrevisitTaskRecord> {
    const timestamp = nowIso()
    const id = normalizePrevisitRequestId(input.id) ?? createPrevisitHostTaskId()
    const existing = await this.get(id)
    if (existing !== undefined && existing.sessionId !== input.sessionId) throw new Error("任务标识已属于其他会话")
    if (existing !== undefined) {
      assertTaskOpen(existing)
      return this.update(id, current => {
        const { entity: _entity, lastError: _lastError, reportMarkdown: _report, artifact: _artifact, completedAt: _completedAt, ...retained } = current
        return {
          ...retained,
          query: input.query,
          depth: input.depth,
          limit: 0,
          state: "needs-entity-search",
          stage: "target",
        }
      })
    }
    return this.put({
      id,
      schemaVersion: 1,
      revision: 1,
      sessionId: input.sessionId,
      workspace: input.workspace,
      query: input.query,
      depth: input.depth,
      limit: 0,
      used: 0,
      state: "needs-entity-search",
      stage: "target",
      runs: [],
      createdAt: timestamp,
      updatedAt: timestamp,
    })
  }

  async update(id: string, updater: (record: PrevisitTaskRecord) => PrevisitTaskRecord): Promise<PrevisitTaskRecord> {
    const current = await this.get(id)
    if (current === undefined) throw new Error("访前任务不存在")
    const proposed = updater(current)
    const next: PrevisitTaskRecord = {
      ...proposed,
      id: current.id,
      schemaVersion: 1,
      revision: current.revision + 1,
      updatedAt: nowIso(),
    }
    return this.put(next)
  }

  async startRun(id: string, input: { runId: string; dimension: string; toolName?: string; quotaUsed: boolean }): Promise<PrevisitTaskRecord> {
    const timestamp = nowIso()
    return this.update(id, current => {
      assertTaskOpen(current)
      const { lastError: _lastError, ...retained } = current
      return {
        ...retained,
        used: current.used + (input.quotaUsed ? 1 : 0),
        state: "running",
        stage: input.dimension === "entity_search" ? "target" : /risk|dishonest|enforcement|terminated|freeze|exception|penalty|tax|judicial|executive/.test(input.dimension) ? "verify" : "collect",
        runs: [...current.runs, {
          id: input.runId,
          dimension: input.dimension,
          ...(input.toolName === undefined ? {} : { toolName: input.toolName }),
          status: "running" as const,
          quotaUsed: input.quotaUsed,
          startedAt: timestamp,
        }].slice(-160),
      }
    })
  }

  async finishRun(id: string, runId: string, status: ToolOutcome, message?: string): Promise<PrevisitTaskRecord> {
    const timestamp = nowIso()
    return this.update(id, current => {
      const runs: PrevisitRun[] = current.runs.map(run => run.id === runId ? {
        ...run,
        status,
        completedAt: timestamp,
        ...(message === undefined ? {} : { message: message.slice(0, 500) }),
      } : run)
      const run = runs.find(item => item.id === runId)
      if (PREVISIT_TERMINAL_STATES.has(current.state) || (current.reportMarkdown?.trim() ?? "") !== "") {
        return { ...current, runs }
      }
      const nextState = run?.dimension === "entity_search"
        ? (status === "done" || status === "unknown" ? "needs-entity-confirmation" : "needs-entity-search")
        : current.state
      return {
        ...current,
        runs,
        state: nextState,
        stage: current.stage,
        ...(status === "failed" ? { lastError: message ?? "查询失败" } : {}),
      }
    })
  }

  async confirmEntity(id: string, entity: { fullName: string; creditCode: string }): Promise<PrevisitTaskRecord> {
    return this.update(id, current => {
      assertTaskOpen(current)
      const { lastError: _lastError, ...retained } = current
      return { ...retained, entity, state: "entity-confirmed", stage: "scope" }
    })
  }

  async finalize(id: string, reportMarkdown: string, state: "completed" | "partial"): Promise<PrevisitTaskRecord> {
    const timestamp = nowIso()
    const current = await this.get(id)
    if (current === undefined) throw new Error("访前任务不存在")
    if (PREVISIT_TERMINAL_STATES.has(current.state) && current.reportMarkdown !== undefined) return current
    const report = validatePrevisitReport(reportMarkdown, current.entity?.fullName)
    const artifact = reportArtifactFor(current, timestamp)
    return this.update(id, record => {
      const { lastError: _lastError, ...retained } = record
      return {
        ...retained,
        state,
        stage: "output",
        reportMarkdown: report,
        artifact,
        completedAt: timestamp,
      }
    })
  }
}
