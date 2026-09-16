import type { PrevisitWorkflowStore, PrevisitTaskRecord } from "./previsit-workflow.js"

/** Supplied by the Host's ToolRunContext, never MCP/tool arguments. */
export type SavedReportScope = { sessionId: string; workspace: string }
export type SavedReportVersion = { reportId: string; reportVersion: number; generatedAt: string; status: string }
export type SavedReportSource = {
  read(taskId: string, version: number, scope: SavedReportScope): Promise<PrevisitTaskRecord>
  versions(taskId: string, version: number, scope: SavedReportScope): Promise<SavedReportVersion[]>
}

/** One instance belongs to the business plugin's own Profile/store. No path input. */
export function createSavedReportSource(store: Pick<PrevisitWorkflowStore, "readSnapshot"> & Partial<Pick<PrevisitWorkflowStore, "listSnapshots">>): SavedReportSource {
  const source: SavedReportSource = {
    async read(taskId: string, version: number, scope: SavedReportScope) {
      if (!scope.sessionId || !scope.workspace || !/^PV-\d{8}-[A-Z0-9-]{4,40}$/.test(taskId)) throw new Error("NOT_ACCESSIBLE")
      const record = await store.readSnapshot(taskId)
      if (!record || record.id !== taskId || record.sessionId !== scope.sessionId || record.workspace !== scope.workspace) throw new Error("NOT_ACCESSIBLE")
      if (!Number.isSafeInteger(version) || version < 1 || (record.reportVersion ?? 1) !== version) throw new Error("VERSION_NOT_FOUND")
      if (record.schemaVersion !== 1 || !["completed", "partial"].includes(record.state) || !record.completedAt || !record.reportMarkdown?.trim() || !record.entity?.fullName || !record.entity.creditCode) throw new Error("SAVED_REPORT_FIELDS_MISSING")
      return structuredClone(record)
    },
    async versions(taskId, version, scope) {
      const anchor = await source.read(taskId, version, scope)
      if (!store.listSnapshots) throw new Error("HISTORY_UNAVAILABLE")
      const root = anchor.rootTaskId ?? anchor.id
      const result: SavedReportVersion[] = []
      for (const record of await store.listSnapshots()) {
        if (record.sessionId !== scope.sessionId || record.workspace !== scope.workspace
          || (record.rootTaskId ?? record.id) !== root
          || record.entity?.creditCode !== anchor.entity?.creditCode || record.entity?.fullName !== anchor.entity?.fullName
          || !["completed", "partial"].includes(record.state) || !record.reportMarkdown?.trim() || !record.completedAt) continue
        const published = await source.read(record.id, record.reportVersion ?? 1, scope)
        result.push({reportId: published.id, reportVersion: published.reportVersion ?? 1, generatedAt: published.completedAt!, status: published.state})
      }
      if (result.length > 100) throw new Error("HISTORY_LIMIT_REACHED")
      if (new Set(result.map(r => r.reportVersion)).size !== result.length) throw new Error("AMBIGUOUS_REPORT_VERSIONS")
      return result.sort((a, b) => a.reportVersion - b.reportVersion)
    },
  }
  return Object.freeze(source)
}
