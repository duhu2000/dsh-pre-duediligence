export type ReportMeta = {
    company?: string;
    generatedAt?: string;
};
export type CardNode = {
    id?: string;
    seq?: number;
    interrupted?: boolean;
    blocks?: Array<{
        kind: string;
        text?: string;
    }>;
    kind?: string;
    role?: string;
    text?: string;
    content?: unknown;
    message?: {
        role?: string;
        content?: unknown;
    } | null;
    parts?: Array<{
        text?: string;
        type?: string;
    } | string>;
    call?: {
        name?: string;
    } | null;
};
export type CardSnapshot = {
    nodes?: CardNode[];
    running?: boolean;
};
export declare function adoptTaskFromSnapshot(snapshot: CardSnapshot, sessionId: string, minimumBaseline?: number): {
    id: string;
    prompt: string;
    nodeBaseline: number;
} | null;
export declare function captureTaskReport(snapshot: CardSnapshot, sessionId: string, task: {
    id: string;
    nodeBaseline: number;
    prompt: string;
}): string | null;
export declare function extractCardText(snapshot: CardSnapshot, baseline: number): string | null;
export declare function humanizeCell(text: string): string;
export declare function stripFactIds(text: string): string;
export declare function humanizeHypothesis(text: string): string;
export declare function normalizeHeading(text: string): string;
export declare function renderCardMarkdown(md: string): string;
export type ReportHero = {
    company: string;
    anchor: string;
    when: string;
};
export declare function wrapPrevisitReport(bodyHtml: string, m: ReportHero): string;
export declare function buildPrevisitReportHtml(cardMarkdown: string, meta?: ReportMeta): string;
export declare function buildPrevisitReportFromRenderedHtml(bodyHtml: string, plainText: string, meta?: ReportMeta): string;
