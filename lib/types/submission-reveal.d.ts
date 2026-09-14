type Submission = {
    text: string;
    onRetire?: (result: {
        reason: string;
    }) => void;
};
type Face = {
    beginSubmission?: (input: Submission) => unknown;
    getSnapshot(): unknown;
    subscribe(listener: () => void): () => void;
};
type Host = {
    sessions: {
        list?: {
            getSnapshot(): {
                current?: string;
            };
            subscribe?(listener: () => void): () => void;
        };
        binding?(id: string): {
            session: Face;
        } | undefined;
    };
};
/** Observe admission, never input edits, runtime heartbeats or restored history. */
export declare function installSubmissionReveal(host: Host, reveal: (sessionId: string) => void): {
    submit(sessionId: string, text: string, send: () => Promise<unknown>): Promise<void>;
    dispose(): void;
};
export {};
