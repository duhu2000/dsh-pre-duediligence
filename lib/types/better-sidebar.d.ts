import { type ReactNode } from "react";
import type { BetterSidebarService, SessionScope, SidebarState, SidebarStore, TabComponentProps } from "dsh-better-sidebar/client/service";
export type { BetterSidebarService, SessionScope, SidebarState, SidebarStore };
export type BetterSidebarTabProps = Pick<TabComponentProps, "scope" | "visible" | "store" | "tab">;
export declare const PREVISIT_WORKBENCH_TAB_ID = "dsh-pre-duediligence:agent";
type RevealTarget = {
    store: SidebarStore;
    tabId: string;
};
export type RevealController = {
    attach(sessionId: string, target: RevealTarget): () => void;
    request(sessionId: string): void;
    dispose(): void;
};
export declare function createRevealController(): RevealController;
export declare function useWorkbenchReveal(controller: RevealController, props: Pick<BetterSidebarTabProps, "scope" | "store" | "tab">): void;
export declare function assertBetterSidebar(service: BetterSidebarService): void;
export declare function registerWorkbenchTab(service: BetterSidebarService, component: (props: BetterSidebarTabProps) => ReactNode): () => void;
export declare function openWorkbench(service: BetterSidebarService, scope: SessionScope, reveal: RevealController): boolean;
