export type PrevisitHomeProps = {
    sessionId: string;
    useSession<T>(selector: (state: {
        composerPhase: string;
    }) => T): T;
    openWorkbench?: () => void;
};
/** Local, reversible title bridge. No global locale mutation or observer. */
export declare function setPrevisitHeadline(anchor: HTMLElement): () => void;
export declare function PrevisitHome({ sessionId, useSession, openWorkbench }: PrevisitHomeProps): JSX.Element | null;
