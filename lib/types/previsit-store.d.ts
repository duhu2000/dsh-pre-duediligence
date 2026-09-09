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
    minimumNodeBaseline: number;
};
export declare const EMPTY_SESSION_STATE: PrevisitSessionState;
export type PrevisitStore = {
    get(sessionId: string): PrevisitSessionState;
    update(sessionId: string, fn: (state: PrevisitSessionState) => PrevisitSessionState): void;
    subscribe(listener: () => void): () => void;
};
export declare function createPrevisitStore(): PrevisitStore;
/**
 * 流程入口和工作台导航只定位当前 Session 的既有业务视图。
 * 已在目标视图时严格 no-op，避免重复通知被误解成任务推进或再次执行。
 */
export declare function locatePrevisitView(store: PrevisitStore, sessionId: string, view: PrevisitView): boolean;
export declare function summarizeSelection(state: PrevisitSessionState, labels: {
    role: (id: string) => string | undefined;
    purpose: (id: string) => string | undefined;
    focus: (id: string) => string | undefined;
    budget: (id: string) => string | undefined;
    output: (id: string) => string | undefined;
}): string[];
