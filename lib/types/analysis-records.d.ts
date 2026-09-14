/** Public, evidence-linked findings; not private reasoning or a report substitute. */
export type AnalysisRecord = {
    id: string;
    kind: "verification" | "hypothesis";
    title: string;
    status: "pending" | "supported" | "partial" | "contradicted" | "insufficient" | "onsite";
    summary: string;
    support: string[];
    counter: string[];
    unknown: string[];
    nextAction: string;
    evidenceIds: string[];
    revision: number;
    updatedAt: string;
};
export declare const ANALYSIS_STATUSES: {
    readonly pending: "待验证";
    readonly supported: "有证据支持";
    readonly partial: "部分支持";
    readonly contradicted: "有反证";
    readonly insufficient: "证据不足";
    readonly onsite: "待现场确认";
};
export declare function parseAnalysisRecord(input: Record<string, unknown>): Omit<AnalysisRecord, "revision" | "updatedAt">;
export declare function latestAnalysis(records?: AnalysisRecord[]): AnalysisRecord[];
