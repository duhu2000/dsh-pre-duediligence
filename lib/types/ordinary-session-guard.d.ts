type SessionSummary = {
    blank?: boolean;
    cwd?: string;
};
type GuardHost = {
    sessions: {
        list?: {
            getSnapshot(): {
                current?: string;
                ids?: string[];
                byId?: Record<string, SessionSummary | undefined>;
            };
        };
        create?: unknown;
    };
    workspaces?: {
        list?: {
            getSnapshot(): {
                items?: Array<{
                    workspaceId: string;
                    path?: string;
                    sessionIds?: string[];
                }>;
                archivedSessionIds?: string[];
            };
        };
    };
};
export type WorkspaceNavigation = {
    connectWorkspace?(workspaceId: string): Promise<string>;
};
export declare function isBusinessSession(sessionId: string): boolean;
/**
 * DSH currently chooses a reusable blank Session before returning from
 * uiWorkspace.connectWorkspace(). Business entry Sessions must stay attached
 * to their Workspace for native composer ownership, but must never become the
 * ordinary "New Session" result. This wrapper filters only that returned
 * selection and otherwise delegates to public Host capabilities.
 */
export declare function installOrdinarySessionGuard(host: GuardHost, navigation: WorkspaceNavigation): () => void;
export {};
