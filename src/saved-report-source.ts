import type { PrevisitWorkflowStore, PrevisitTaskRecord } from "./previsit-workflow.js"

/** Supplied by the Host's ToolRunContext, never MCP/tool arguments. */
export type SavedReportScope = { sessionId: string; workspace: string }
export type SavedReportSource = {
  read(taskId: string, version: number, scope: SavedReportScope): Promise<PrevisitTaskRecord>
}

/** One instance belongs to the business plugin's own Profile/store. No path input. */
export function createSavedReportSource(store: Pick<PrevisitWorkflowStore, "readSnapshot">): SavedReportSource {
  return Object.freeze({
    async read(taskId: string, version: number, scope: SavedReportScope) {
      if (!scope.sessionId || !scope.workspace || !/^PV-\d{8}-[A-Z0-9-]{4,40}$/.test(taskId)) throw new Error("NOT_ACCESSIBLE")
      const record = await store.readSnapshot(taskId)
      if (!record || record.id !== taskId || record.sessionId !== scope.sessionId || record.workspace !== scope.workspace) throw new Error("NOT_ACCESSIBLE")
      if (!Number.isSafeInteger(version) || version < 1 || (record.reportVersion ?? 1) !== version) throw new Error("VERSION_NOT_FOUND")
      if (record.schemaVersion !== 1 || !["completed", "partial"].includes(record.state) || !record.completedAt || !record.reportMarkdown?.trim() || !record.entity?.fullName || !record.entity.creditCode) throw new Error("SAVED_REPORT_FIELDS_MISSING")
      return structuredClone(record)
    },
  })
}
