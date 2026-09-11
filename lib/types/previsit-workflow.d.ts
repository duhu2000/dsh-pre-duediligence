import type { ToolOutcome } from "./tool-outcome.js";
export declare const PREVISIT_TASK_STATES: readonly ["needs-entity-search", "needs-entity-confirmation", "entity-confirmed", "running", "finalizing", "completed", "partial", "failed"];
export type PrevisitTaskState = (typeof PREVISIT_TASK_STATES)[number];
export type PrevisitTaskStage = "target" | "scope" | "collect" | "verify" | "output";
export type PrevisitRun = {
    id: string;
    dimension: string;
    toolName?: string;
    status: ToolOutcome;
    quotaUsed: boolean;
    startedAt: string;
    completedAt?: string;
    message?: string;
};
export type PrevisitArtifact = {
    id: string;
    format: "html";
    fileName: string;
    mediaType: "text/html; charset=utf-8";
    createdAt: string;
};
export type PrevisitTaskRecord = {
    id: string;
    schemaVersion: 1;
    revision: number;
    sessionId: string;
    workspace: string;
    query: string;
    depth: "fast" | "standard" | "deep";
    limit: number;
    used: number;
    state: PrevisitTaskState;
    stage: PrevisitTaskStage;
    entity?: {
        fullName: string;
        creditCode: string;
    };
    runs: PrevisitRun[];
    reportMarkdown?: string;
    artifact?: PrevisitArtifact;
    lastError?: string;
    createdAt: string;
    updatedAt: string;
    completedAt?: string;
};
type StorageTable = {
    get(key: string): unknown | Promise<unknown>;
    put(key: string, value: unknown): unknown | Promise<unknown>;
    entries(): Iterable<[string, unknown]>;
};
export type StorageDomain = {
    open(spec: object): Promise<{
        table(name: string): StorageTable;
    }>;
};
export declare function normalizePrevisitRequestId(value: unknown): string | undefined;
export declare function createPrevisitHostTaskId(): string;
export declare function reportArtifactFor(task: PrevisitTaskRecord, timestamp?: string): PrevisitArtifact;
export declare function validatePrevisitReport(reportMarkdown: string, entityName?: string): string;
/**
 * Host-owned public task state. Raw QCC responses stay in the execution guard's
 * private memory; only progress, entity identity and the user-facing report are persisted.
 */
export declare class PrevisitWorkflowStore {
    private readonly records;
    private table;
    private attachPromise;
    attach(storageDomain: StorageDomain, logger?: {
        info?(message: string): void;
        warn?(message: string): void;
    }): Promise<void>;
    list(sessionId?: string): Promise<PrevisitTaskRecord[]>;
    get(id: string): Promise<PrevisitTaskRecord | undefined>;
    put(record: PrevisitTaskRecord): Promise<PrevisitTaskRecord>;
    create(input: {
        id?: string;
        sessionId: string;
        workspace: string;
        query: string;
        depth: "fast" | "standard" | "deep";
        limit: number;
    }): Promise<PrevisitTaskRecord>;
    update(id: string, updater: (record: PrevisitTaskRecord) => PrevisitTaskRecord): Promise<PrevisitTaskRecord>;
    startRun(id: string, input: {
        runId: string;
        dimension: string;
        toolName?: string;
        quotaUsed: boolean;
    }): Promise<PrevisitTaskRecord>;
    finishRun(id: string, runId: string, status: ToolOutcome, message?: string): Promise<PrevisitTaskRecord>;
    confirmEntity(id: string, entity: {
        fullName: string;
        creditCode: string;
    }): Promise<PrevisitTaskRecord>;
    finalize(id: string, reportMarkdown: string, state: "completed" | "partial"): Promise<PrevisitTaskRecord>;
}
export {};
