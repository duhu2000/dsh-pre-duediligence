import { type ComposerSelection, type ComposerState } from "./composer-model.js";
export type ActiveTask = {
    id: string;
    prompt: string;
    createdAt: string;
    nodeBaseline: number;
    seenRunning: boolean;
    selection: ComposerSelection;
};
export type DiligenceMode = "previsit" | "onboarding" | "transaction" | "ongoing";
export type PrevisitView = "target" | "scope" | "collect" | "verify" | "output" | "history";
export type PrevisitSessionState = {
    selection: ComposerSelection;
    company: string;
    composer: ComposerState;
    task: ActiveTask | undefined;
    panel: DiligenceMode | null;
    view: PrevisitView;
    dismissedTaskIds: string[];
};
export declare const EMPTY_SESSION_STATE: PrevisitSessionState;
export type PrevisitStore = {
    get(sessionId: string): PrevisitSessionState;
    update(sessionId: string, fn: (state: PrevisitSessionState) => PrevisitSessionState): void;
    subscribe(listener: () => void): () => void;
};
export declare function createPrevisitStore(): PrevisitStore;
export declare function summarizeSelection(state: PrevisitSessionState, labels: {
    role: (id: string) => string | undefined;
    purpose: (id: string) => string | undefined;
    focus: (id: string) => string | undefined;
    budget: (id: string) => string | undefined;
    output: (id: string) => string | undefined;
}): string[];
