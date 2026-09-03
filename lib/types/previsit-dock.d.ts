import { type PrevisitStore } from "./previsit-store.js";
import { type CardSnapshot } from "./report-export.js";
type InputStateLike = {
    draft: string;
    phase?: string;
};
export type PrevisitDockProps = {
    sessionId: string;
    useInput: <S>(sel: (s: InputStateLike) => S) => S;
    useSession?: <S>(sel: (s: CardSnapshot) => S) => S;
    inputActions?: {
        setDraft(text: string): void;
    } | undefined;
    store: PrevisitStore;
    start: (prompt: string) => Promise<number>;
    open: (phase?: "opportunity") => void;
};
declare function composerTextarea(): HTMLTextAreaElement | null;
declare function writeDraft(actions: PrevisitDockProps["inputActions"], text: string): void;
export { writeDraft as writeComposerDraft, composerTextarea };
export type ComposerActions = ReturnType<typeof usePrevisitComposer>;
export declare function usePrevisitComposer(args: {
    sessionId: string;
    store: PrevisitStore;
    readDraft: () => string;
    writeDraft: (text: string) => void;
    start: (prompt: string) => Promise<number>;
    onStarted?: () => void;
}): {
    state: import("./previsit-store.js").PrevisitSessionState;
    manual: boolean;
    error: string | undefined;
    submitting: boolean;
    summary: string[];
    toggleSingle: (key: "role" | "purpose" | "budget" | "output", id: string) => void;
    toggleFocus: (id: string) => void;
    setCompany: (company: string) => void;
    append: () => void;
    reset: () => void;
    startTask: () => Promise<void>;
};
export declare function PrevisitFields(props: {
    actions: ComposerActions;
    idPrefix: string;
    startLabel?: string;
}): JSX.Element;
export declare function PrevisitDock(props: PrevisitDockProps): JSX.Element;
export declare function DiligenceModeBar(props: {
    sessionId: string;
    store: PrevisitStore;
}): JSX.Element;
