import type { HostedTask } from "./hosted-task-sync.js";
export type HostedTaskListScope = {
    kind: "current";
    sessionId: string;
} | {
    kind: "profile-history";
};
/** Shared TaskScope contract: current work is Session-scoped; history is Profile-scoped. */
export declare function hostedTaskListUrl(scope: HostedTaskListScope): string;
export declare function fetchHostedTask(taskId: string, sessionId: string): Promise<HostedTask | null>;
export declare function fetchHostedTasks(scope: HostedTaskListScope): Promise<HostedTask[]>;
