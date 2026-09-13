import type { HostedTask } from "./hosted-task-sync.js";
export declare function fetchHostedTask(taskId: string, sessionId: string): Promise<HostedTask | null>;
/** Omit sessionId for the Profile-wide history view; pass it for current-task isolation. */
export declare function fetchHostedTasks(sessionId?: string): Promise<HostedTask[]>;
