export type ToolOutcome = "running" | "done" | "no-data" | "skipped" | "no-permission" | "not-executed" | "failed" | "unknown";
export declare const TOOL_OUTCOME_LABELS: Record<ToolOutcome, string>;
/** Interpret explicit structured signals only. A successful transport is not proof of facts. */
export declare function classifyToolOutcome(value: unknown, isError?: boolean): ToolOutcome;
/**
 * QCC tools return reader-facing Chinese business objects instead of a generic
 * success/data envelope. A non-error, non-empty QCC object is a completed
 * query; explicit empty/error copy still wins over that fallback.
 */
export declare function classifyQccProviderOutcome(value: unknown, isError?: boolean): ToolOutcome;
export declare function resultOutcome(node: {
    isError?: boolean;
    content?: unknown;
    value?: unknown;
    error?: unknown;
}): ToolOutcome;
export declare function toolEvent(node: {
    call: {
        name: string;
    };
    isError?: boolean;
    content?: unknown;
    error?: unknown;
}): {
    name: string;
    status: ToolOutcome;
    reason?: string;
};
