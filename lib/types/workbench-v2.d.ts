import { type BetterSidebarService } from "./better-sidebar.js";
export declare const inject: readonly ["slots", "sessions", "workspaces", "conversation", "betterSidebar"];
type SnapshotStore<T> = {
    getSnapshot(): T;
    subscribe?(listener: () => void): () => void;
};
type ConversationNode = {
    kind?: string;
    call?: {
        name?: string;
    } | null;
    isError?: boolean;
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
type SessionListSnapshot = {
    current?: string;
    byId: Record<string, {
        cwd?: string;
    }>;
};
type ClientContext = {
    slots: {
        inject(name: string, setup: () => unknown): unknown;
        register(options: Readonly<Record<string, unknown>>, component: (props: Record<string, unknown>) => JSX.Element | null): unknown;
    };
    sessions: {
        list: SnapshotStore<SessionListSnapshot>;
        binding?(sessionId: string): {
            session: SnapshotStore<ConversationSnapshot>;
        } | undefined;
        scope?(sessionId: string): {
            get(name: string): unknown;
        } | undefined;
        open?(sessionId: string): void;
    };
    workspaces: {
        startSession?(): void;
    };
    betterSidebar: BetterSidebarService;
    effect(setup: () => void | (() => void), label?: string): unknown;
};
export declare function apply(ctx: ClientContext): void;
export {};
