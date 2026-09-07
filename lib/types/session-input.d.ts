/** DSH's public input registry resolves a stable input machine for one Session. */
export type SessionInput = {
    state: {
        getSnapshot(): {
            draft: string;
            phase?: string;
        };
        subscribe?(listener: () => void): () => void;
    };
    setDraft(text: string): void;
};
export type SessionInputHost = {
    sessions: {
        scope?(id: string): {
            get(name: string): unknown;
        } | undefined;
    };
};
export declare function resolveSessionInput(host: SessionInputHost, sessionId: string): SessionInput | undefined;
/** Never falls back to a textarea belonging to whichever Session is visible now. */
export declare function writeSessionDraft(actions: {
    setDraft(text: string): void;
} | undefined, text: string): boolean;
export declare function clearSubmittedDraft(input: SessionInput | undefined, submitted: string): void;
