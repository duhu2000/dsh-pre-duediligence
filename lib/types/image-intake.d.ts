export declare const IMAGE_LIMITS: {
    readonly maxBytes: number;
    readonly maxEntries: 50;
    readonly ttlMs: number;
};
export declare const LOCAL_DOCUMENT_TOOL_PAIRS: readonly [readonly ["mcp__qcc-document-mcp__parse_document", "mcp__qcc-document-mcp__get_parse_result"], readonly ["mcp__document__parse_document", "mcp__document__get_parse_result"], readonly ["mcp__qcc-document-local__parse_document", "mcp__qcc-document-local__get_parse_result"], readonly ["mcp__document-mcp__parse_document", "mcp__document-mcp__get_parse_result"]];
export declare class ImageIntakeError extends Error {
    readonly code: string;
    readonly status: number;
    constructor(code: string, message: string, status?: number);
}
export type StagedImage = {
    commandId: string;
    sessionId: string;
    state: "prepared" | "running" | "completed" | "failed";
    fileName: string;
    mimeType: string;
    sizeBytes: number;
    createdAt: string;
    expiresAt: number;
    path: string | null;
    result: {
        entries: string[];
        text: string;
    } | null;
    error: {
        code: string;
        message: string;
    } | null;
};
type ToolSchema = {
    name: string;
    parameters?: {
        properties?: Record<string, unknown>;
    };
};
export type ImageAgent = {
    id: string;
    session: {
        id: string;
        header?: {
            cwd?: string;
        };
    };
};
export type ImageToolHost = {
    schemas(agent: ImageAgent): ToolSchema[];
    execute(input: {
        name: string;
        callId: string;
        rootCallId: string;
        parent: unknown;
        agent: ImageAgent;
        signal: AbortSignal;
        arguments: unknown;
    }): Promise<{
        isError: boolean;
        value?: unknown;
        content: unknown[];
        error?: {
            message?: string;
        };
    }>;
};
export type ImageExecution = {
    agent: ImageAgent;
    rootCallId: string;
    token: unknown;
    signal: AbortSignal;
};
/** 从识别文字里确定性抽出企业名（一行可多家）；不猜测不存在的主体。 */
export declare function extractCompanyNames(text: string, max?: number): string[];
export declare class ImageIntakeStore {
    private readonly tools;
    private readonly clock;
    private readonly pollMs;
    private readonly maxPolls;
    private readonly records;
    private readonly imageRoot;
    private disposed;
    private readonly cleanupTimer;
    constructor(tools: ImageToolHost, clock?: () => number, pollMs?: number, maxPolls?: number);
    /** 找到本机文档解析工具对（必须支持 file_path）。 */
    provider(agent: ImageAgent): {
        parse: string;
        result: string;
    } | null;
    prepare(input: {
        sessionId: string;
        fileName?: unknown;
        content?: unknown;
    }): Promise<StagedImage>;
    status(commandId: string, sessionId: string): StagedImage;
    run(commandId: string, exec: ImageExecution): Promise<{
        commandId: string;
        fileName: string;
        entries: string[];
        text: string;
    }>;
    remove(commandId: string, sessionId: string): Promise<boolean>;
    private removeFile;
    private cleanup;
    dispose(): Promise<void>;
}
/** 暂存成功后回填到输入框的说明：模型只需调用一次高层工具。 */
export declare function imageExtractionPrompt(command: {
    commandId: string;
    fileName: string;
}): string;
export {};
