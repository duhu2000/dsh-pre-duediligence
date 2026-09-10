import { type BetterSidebarService } from "./better-sidebar.js";
import { type LeftSidebarHost } from "./left-sidebar.js";
export declare const inject: readonly ["slots", "sessions", "workspaces", "conversation"];
export declare const OPTIONAL_WORKBENCH_MESSAGE = "\u672A\u5B89\u88C5\u53EF\u9009 Better Sidebar\uFF1B\u5F53\u524D\u8349\u7A3F\u548C\u4E1A\u52A1\u72B6\u6001\u5DF2\u4FDD\u7559\u3002\u57FA\u7840\u4F1A\u8BDD\u3001\u63D0\u793A\u8BCD\u751F\u6210\u3001\u539F\u751F\u53D1\u9001\u53CA\u4F1A\u8BDD\u62A5\u544A\u9605\u8BFB\u4ECD\u53EF\u4F7F\u7528\u3002\u5982\u9700\u53EF\u89C6\u5316\u5DE5\u4F5C\u53F0\uFF0C\u8BF7\u505C\u6B62 DSH \u540E\u6309 README \u8BBE\u7F6E DSH_PREVISIT_WORKBENCH=on \u5E76\u91CD\u8DD1\u5B89\u88C5\u811A\u672C\u3002";
type SnapshotStore<T> = {
    getSnapshot(): T;
    subscribe?(listener: () => void): () => void;
};
type ConversationNode = {
    seq?: number;
    interrupted?: boolean;
    blocks?: Array<{
        kind: string;
        text?: string;
    }>;
    kind?: string;
    role?: string;
    call?: {
        name?: string;
    } | null;
    isError?: boolean;
    error?: {
        name?: string;
        code?: string;
    };
    text?: string;
    content?: unknown;
    message?: {
        content?: unknown;
    } | null;
    parts?: Array<{
        text?: string;
        type?: string;
    } | string>;
};
type ConversationSnapshot = {
    running?: boolean;
    partial?: unknown | null;
    runningCalls?: Array<{
        name?: string;
    }>;
    nodes?: ConversationNode[];
    lastAgentError?: string | null;
};
type ClientContext = LeftSidebarHost & {
    sessions: {
        binding?(sessionId: string): {
            session: SnapshotStore<ConversationSnapshot>;
        } | undefined;
        scope?(sessionId: string): {
            get(name: string): unknown;
        } | undefined;
    };
    betterSidebar?: BetterSidebarService;
    inject(deps: string[], setup: (ctx: ClientContext) => void): unknown;
    effect(setup: () => void | (() => void), label?: string): unknown;
};
export declare function apply(ctx: ClientContext): void;
export {};
