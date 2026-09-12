import type { ActiveTask, PrevisitSessionState, PrevisitView } from "./previsit-store.js";
import type { PrevisitTaskRecord } from "./previsit-workflow.js";
import type { WorkbenchStatus } from "./workbench-state.js";
export type HostedTask = Omit<PrevisitTaskRecord, "reportMarkdown"> & {
    reportReady: boolean;
    reportMarkdown?: string;
};
export declare const HOSTED_TERMINAL: Set<string>;
export declare function hostedStatus(task: HostedTask): WorkbenchStatus;
/**
 * 会话内直接发起的尽调没有前端 PV 任务 ID。从 Host 历史中选出当前任务，
 * 但不重新认领用户已点“新的尽调”放弃的任务。
 */
export declare function selectHostedTask(records: HostedTask[], active: ActiveTask | undefined, dismissedTaskIds: readonly string[]): HostedTask | null;
/** Host 工作流已启动后，右侧不再停留在可重复提交的首页。 */
export declare function hostedTaskView(task: HostedTask): Exclude<PrevisitView, "target" | "history">;
export declare function hostedProgressCopy(task: HostedTask): {
    title: string;
    detail: string;
};
export declare function syncHostedTaskState(state: PrevisitSessionState, record: HostedTask, adopted: Pick<ActiveTask, "id" | "prompt" | "nodeBaseline"> | null, locateCurrentStage: boolean): PrevisitSessionState;
