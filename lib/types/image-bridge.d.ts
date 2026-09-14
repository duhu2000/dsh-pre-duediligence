export declare const IMAGE_ROUTE = "/previsit/api/images/commands";
export declare const IMAGE_ACCEPT: readonly ["image/png", "image/jpeg", "image/webp", "application/pdf"];
export type StagedCommand = {
    commandId: string;
    state: string;
    fileName: string;
    sizeBytes: number;
    prompt?: string;
    result?: {
        entries: string[];
        text: string;
    } | null;
    error?: {
        code: string;
        message: string;
    } | null;
};
export declare function isImportable(file: File | null | undefined): file is File;
/** 从拖拽/粘贴的数据里挑出可导入的文件（只取第一个）。 */
export declare function importableFile(transfer: DataTransfer | null | undefined): File | undefined;
export declare function requestCommand<T = StagedCommand>(path: string, method: string, body?: unknown): Promise<T>;
/** 暂存一个文件并把识别说明发进当前会话。返回暂存记录，供状态显示与轮询。 */
export declare function stageAndSend(file: File, sessionId: string, send: (prompt: string) => Promise<void>): Promise<StagedCommand>;
export type ComposerImageBridge = {
    /** 当前会话是否属于访前尽调（只在专属会话里接管）。 */
    owned(sessionId: string): boolean;
    currentSessionId(): string | undefined;
    send(sessionId: string, prompt: string): Promise<void>;
    onStaged?(sessionId: string, staged: StagedCommand): void;
    onError?(sessionId: string, message: string): void;
};
export type BridgeMode = "drop" | "paste";
/**
 * 判断这次拖放/粘贴是否该由我们接管。
 * drop：DSH 拖文件时会盖一层整窗遮罩，事件目标根本不在输入框里，所以只要不在我们自己的面板内就接管；
 * paste：以焦点为准，命中输入框或页面空白（未聚焦）时接管。
 */
export declare function shouldIntercept(target: unknown, mode: BridgeMode, viewport?: {
    width: number;
    height: number;
}): boolean;
export type BridgeEvent = {
    target: unknown;
    preventDefault(): void;
    stopImmediatePropagation?(): void;
};
/** 事件处理器本体（可测）：命中专属会话 + 原生输入框 + 可导入文件时接管，返回是否接管。 */
export declare function composerImageHandler(bridge: ComposerImageBridge): (event: BridgeEvent, transfer: DataTransfer | null | undefined, mode?: BridgeMode) => boolean;
/**
 * 接管 DSH 原生输入框里的图片：拖入 / 粘贴在 window 捕获阶段拦下（早于宿主的“当前模型不支持图片”校验），
 * 走同一条暂存链路。只在访前尽调专属会话生效，不影响文字粘贴与其它会话。
 */
export declare function installComposerImageBridge(bridge: ComposerImageBridge): () => void;
