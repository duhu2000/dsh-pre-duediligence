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
    archivedSessionIds?: string[];
};
type SessionListSnapshot = {
    current?: string;
    ids?: string[];
    byId?: Record<string, {
        blank?: boolean;
        cwd?: string;
    } | undefined>;
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
        list?: SnapshotStore<SessionListSnapshot>;
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
export declare function registerLeftSidebarLauncher(ctx: LeftSidebarHost, isActive?: () => boolean): void;
export {};
