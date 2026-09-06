import type { PrevisitStore } from "./previsit-store.js";
type InputStateLike = {
    draft: string;
    phase?: string;
};
type DraftActions = {
    setDraft(text: string): void;
};
export type PrevisitPromptProps = {
    sessionId: string;
    useInput<S>(selector: (state: InputStateLike) => S): S;
    inputActions?: DraftActions;
    store: PrevisitStore;
};
export type DraftMergeMode = "replace" | "append";
export declare function mergePromptDraft(existing: string, generated: string, mode: DraftMergeMode): string;
export declare function PrevisitPromptGenerator(props: PrevisitPromptProps): JSX.Element | null;
export {};
