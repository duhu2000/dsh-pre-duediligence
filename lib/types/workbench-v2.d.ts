import { type BetterSidebarService } from "./better-sidebar.js";
import { type LeftSidebarHost } from "./left-sidebar.js";
export declare const inject: readonly ["slots", "sessions", "workspaces", "conversation", "betterSidebar"];
type SnapshotStore<T> = {
    getSnapshot(): T;
    subscribe?(listener: () => void): () => void;
};
type ConversationNode = {
    kind?: string;
    role?: string;
    call?: {
        name?: string;
    } | null;
    isError?: boolean;
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
    betterSidebar: BetterSidebarService;
    effect(setup: () => void | (() => void), label?: string): unknown;
};
export declare function apply(ctx: ClientContext): void;
export {};
