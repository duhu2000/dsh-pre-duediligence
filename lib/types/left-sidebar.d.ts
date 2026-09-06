import { type BetterSidebarService, type RevealController } from "./better-sidebar.js";
type SnapshotStore<T> = {
    getSnapshot(): T;
};
type WorkspaceSnapshot = {
    items?: Array<{
        workspaceId: string;
        sessionIds?: string[];
    }>;
    recentWorkspaceId?: string;
};
type SlotsService = {
    inject(name: string, setup: () => void | (() => void)): unknown;
    register(descriptor: {
        name: string;
        id: string;
        order?: number;
        inject?: () => Record<string, unknown>;
    }, component: (props: LeftSidebarEntryProps) => JSX.Element): () => void;
};
export type LeftSidebarHost = {
    slots: SlotsService;
    sessions: {
        list?: SnapshotStore<{
            current?: string;
        }>;
        create?(options: {
            workspaceId: string;
            sessionId: string;
        }): Promise<string>;
        open?(sessionId: string): void;
    };
    workspaces?: {
        list?: SnapshotStore<WorkspaceSnapshot>;
        connectWorkspace?(workspaceId: string): Promise<string>;
    };
    get?(name: string): unknown;
};
type LeftSidebarEntryProps = {
    wide?: boolean;
    openAgent?: () => Promise<void>;
};
export declare function registerLeftSidebarLauncher(ctx: LeftSidebarHost, service: BetterSidebarService, reveal: RevealController): void;
export {};
