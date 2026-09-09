import { type ReactNode } from "react";
import type { PrevisitView } from "./previsit-store.js";
export declare const PREVISIT_HOME_TITLE = "\u8BBF\u524D\u5C3D\u8C03\u4E00\u9875\u7EB8\u667A\u80FD\u4F53";
export declare const PREVISIT_HOME_SUMMARY = "\u660E\u786E\u62DC\u8BBF\u5BF9\u8C61\u4E0E\u76EE\u6807\uFF0C\u6838\u9A8C\u4F01\u4E1A\u4FE1\u606F\u5E76\u51C6\u5907\u8BBF\u524D\u6750\u6599\u3002";
export type PrevisitHomeProps = {
    sessionId: string;
    useSession<T>(selector: (state: {
        composerPhase: string;
    }) => T): T;
    openWorkbench?: (view?: PrevisitView) => void;
};
export declare const PREVISIT_HOME_FLOWS: ReadonlyArray<{
    view: PrevisitView;
    label: string;
    icon: ReactNode;
}>;
/** 只新增自有容器，将能力菜单放到原生 composer 外部下方，不移动宿主 DOM。 */
export declare function installCapabilityMount(marker: HTMLElement, onMount: (mount: HTMLElement | null) => void): () => void;
/** DSH 暂未公开会话级 Hero 标题槽位，因此仅在本插件空白会话内做可逆桥接。 */
export declare function setPrevisitHeadline(anchor: HTMLElement): () => void;
export declare function PrevisitHome({ sessionId, useSession, openWorkbench }: PrevisitHomeProps): JSX.Element | null;
