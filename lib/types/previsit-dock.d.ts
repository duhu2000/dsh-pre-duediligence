import { type ComposerSelection, type ComposerState } from "./composer-model.js";
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
declare function writeDraft(actions: PrevisitDockProps["inputActions"], text: string): void;
export { writeDraft as writeComposerDraft };
export type ComposerActions = ReturnType<typeof usePrevisitComposer>;
type CompanyInputKeyEvent = {
    key: string;
    nativeEvent: {
        isComposing?: boolean;
        keyCode?: number;
    };
    preventDefault(): void;
    stopPropagation(): void;
};
/**
 * 右侧表单与原生 composer 共享草稿，但不共享键盘提交事件。
 * 中文输入法用 Enter 确认候选词时只结束 composition，绝不能冒泡成会话发送。
 */
export declare function isolateCompanyInputKey(event: CompanyInputKeyEvent): void;
export declare function isolateCompanyInputEvent(event: {
    stopPropagation(): void;
}): void;
export declare function updateCompanyComposer(current: ComposerState, nativeDraft: string, selection: ComposerSelection, company: string, isolated: boolean): {
    composer: ComposerState;
    nativeDraft: string | null;
};
export declare function usePrevisitComposer(args: {
    sessionId: string;
    store: PrevisitStore;
    readDraft: () => string;
    writeDraft: (text: string) => void;
    start: (prompt: string) => Promise<number>;
    onStarted?: () => void;
    /** 右侧工作台必须与原生会话输入框隔离，避免输入中文时宿主抢焦点。 */
    draftMode?: "live" | "isolated";
}): {
    state: import("./previsit-store.js").PrevisitSessionState;
    manual: boolean;
    error: string | undefined;
    submitting: boolean;
    isolated: boolean;
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
