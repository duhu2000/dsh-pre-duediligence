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
      for (const [id, value] of this.table.entries()) if (isRecord(value)) this.records.set(id, value)
      for (const [id, record] of this.records) await this.table.put(id, record)
      logger.info?.("[dsh-pre-duediligence] persistent task state ready")
    }).catch(error => {
      logger.warn?.(`[dsh-pre-duediligence] persistent task state unavailable: ${error instanceof Error ? error.message : String(error)}`)
      this.attachPromise = undefined
    })
    return this.attachPromise
  }

  async list(sessionId?: string): Promise<PrevisitTaskRecord[]> {
    const records = [...this.records.values()].filter(record => sessionId === undefined || record.sessionId === sessionId)
    return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))
  }

  async get(id: string): Promise<PrevisitTaskRecord | undefined> {
    const cached = this.records.get(id)
    if (cached !== undefined) return cached
    if (this.table === undefined) return undefined
    const value = await this.table.get(id)
    if (!isRecord(value)) return undefined
    this.records.set(id, value)
    return value
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
    limit: number
  }): Promise<PrevisitTaskRecord> {
    const timestamp = nowIso()
    const id = normalizePrevisitRequestId(input.id) ?? createPrevisitHostTaskId()
    const existing = await this.get(id)
    if (existing !== undefined && existing.sessionId !== input.sessionId) throw new Error("任务标识已属于其他会话")
    if (existing !== undefined) {
      return this.update(id, current => {
        const { entity: _entity, lastError: _lastError, reportMarkdown: _report, artifact: _artifact, completedAt: _completedAt, ...retained } = current
        return {
          ...retained,
          query: input.query,
          depth: input.depth,
          limit: Math.max(current.used, input.limit),
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
      limit: input.limit,
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
      const nextState = run?.dimension === "entity_search"
        ? (status === "done" || status === "unknown" ? "needs-entity-confirmation" : "needs-entity-search")
        : current.used >= current.limit ? "finalizing" : current.state
      return {
        ...current,
        runs,
        state: nextState,
        stage: nextState === "finalizing" ? "output" : current.stage,
        ...(status === "failed" ? { lastError: message ?? "查询失败" } : {}),
      }
    })
  }

  async confirmEntity(id: string, entity: { fullName: string; creditCode: string }): Promise<PrevisitTaskRecord> {
    return this.update(id, current => {
      const { lastError: _lastError, ...retained } = current
      return { ...retained, entity, state: "entity-confirmed", stage: "scope" }
    })
  }

  async finalize(id: string, reportMarkdown: string, state: "completed" | "partial"): Promise<PrevisitTaskRecord> {
    const timestamp = nowIso()
    const current = await this.get(id)
    if (current === undefined) throw new Error("访前任务不存在")
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
