export declare const PREVISIT_SESSION_ID_PREFIX = "session-dsh-pre-duediligence-";
export declare function isPrevisitSession(sessionId: string): boolean;
export type PrevisitSessionHost = {
    sessions: {
        list?: {
            getSnapshot(): {
                current?: string;
            };
        };
        create?(options: {
            cwd: string;
            sessionId: string;
        }): Promise<string>;
        open?(sessionId: string): void;
    };
    workspaces?: {
        list?: {
            getSnapshot(): {
                items?: Array<{
                    workspaceId: string;
                    path?: string;
                    sessionIds?: string[];
                }>;
                recentWorkspaceId?: string;
            };
        };
    };
};
export declare function createPrevisitSession(ctx: PrevisitSessionHost): Promise<string>;
