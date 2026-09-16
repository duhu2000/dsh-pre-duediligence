import type { PrevisitWorkflowStore, PrevisitTaskRecord } from "./previsit-workflow.js";
/** Supplied by the Host's ToolRunContext, never MCP/tool arguments. */
export type SavedReportScope = {
    sessionId: string;
    workspace: string;
};
export type SavedReportSource = {
    read(taskId: string, version: number, scope: SavedReportScope): Promise<PrevisitTaskRecord>;
};
/** One instance belongs to the business plugin's own Profile/store. No path input. */
export declare function createSavedReportSource(store: Pick<PrevisitWorkflowStore, "readSnapshot">): SavedReportSource;
