import { type BetterSidebarService, type RevealController } from "./better-sidebar.js";
type SnapshotStore<T> = {
    getSnapshot(): T;
};
type WorkspaceSnapshot = {
    items?: Array<{
        workspaceId: string;
        path?: string;
        sessionIds?: string[];
    }>;
    recentWorkspaceId?: string;
};
type SlotsService = {
    inject(name: string, setup: () => void | (() => void)): unknown;
    register<Props extends object>(descriptor: {
        name: string;
        id: string;
        order?: number;
        inject?: (sessionId: string) => Record<string, unknown>;
    }, component: (props: Props) => JSX.Element | null): () => void;
};
export type LeftSidebarHost = {
    slots: SlotsService;
    sessions: {
        list?: SnapshotStore<{
            current?: string;
        }>;
        create?(options: {
            cwd: string;
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
export declare function registerLeftSidebarLauncher(ctx: LeftSidebarHost, service: BetterSidebarService, reveal: RevealController): void;
export {};
