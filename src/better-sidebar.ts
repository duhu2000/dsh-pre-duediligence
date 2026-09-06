import { useEffect, type ReactNode } from "react"
import type {
  BetterSidebarService,
  SessionScope,
  SidebarState,
  SidebarStore,
  TabComponentProps,
} from "dsh-better-sidebar/client/service"

export type { BetterSidebarService, SessionScope, SidebarState, SidebarStore }
export type BetterSidebarTabProps = Pick<TabComponentProps, "scope" | "visible" | "store" | "tab">

export const PREVISIT_WORKBENCH_TAB_ID = "dsh-pre-duediligence:agent"
const SUPPORTED_SIDEBAR_VERSION = /^0\.17\./u

type RevealTarget = {
  store: SidebarStore
  tabId: string
}

export type RevealController = {
  attach(sessionId: string, target: RevealTarget): () => void
  request(sessionId: string): void
}

function treeContainsTab(node: SidebarState["splits"], tabId: string): boolean {
  if (node.kind === "leaf") {
    return node.tabs.some(tab => tab.id === tabId)
  }
  return node.children.some(child => treeContainsTab(child, tabId))
}

function revealState(state: SidebarState, tabId: string): SidebarState {
  if (state.floats.some(float => float.tab.id === tabId)) {
    return state
  }
  if (treeContainsTab(state.bottomSplits, tabId)) {
    return state.bottomOpen ? state : { ...state, bottomOpen: true }
  }
  if (treeContainsTab(state.splits, tabId)) {
    return state.panelOpen ? state : { ...state, panelOpen: true }
  }
  return state
}

export function createRevealController(): RevealController {
  const targets = new Map<string, RevealTarget>()
  const pending = new Set<string>()
  return {
    attach(sessionId, target) {
      targets.set(sessionId, target)
      if (pending.delete(sessionId)) {
        target.store.reduce(state => revealState(state, target.tabId))
      }
      return () => {
        if (targets.get(sessionId) === target) {
          targets.delete(sessionId)
        }
      }
    },
    request(sessionId) {
      const target = targets.get(sessionId)
      if (target === undefined) {
        pending.add(sessionId)
        return
      }
      target.store.reduce(state => revealState(state, target.tabId))
    },
  }
}

export function useWorkbenchReveal(
  controller: RevealController,
  props: Pick<BetterSidebarTabProps, "scope" | "store" | "tab">,
): void {
  const sessionId = props.scope.sessionId
  const store = props.store
  const tabId = props.tab.id
  useEffect(() => controller.attach(sessionId, { store, tabId }), [controller, sessionId, store, tabId])
}

export function assertBetterSidebar(service: BetterSidebarService): void {
  if (!SUPPORTED_SIDEBAR_VERSION.test(service.version)) {
    throw new Error("dsh-pre-duediligence requires dsh-better-sidebar 0.17.x")
  }
  if (!service.features.includes("targetedOpen") || !service.features.includes("stateSubscription")) {
    throw new Error("dsh-better-sidebar is missing required targetedOpen/stateSubscription capabilities")
  }
}

export function registerWorkbenchTab(
  service: BetterSidebarService,
  component: (props: BetterSidebarTabProps) => ReactNode,
): () => void {
  assertBetterSidebar(service)
  return service.registerTab({
    id: PREVISIT_WORKBENCH_TAB_ID,
    title: "访前尽调智能体",
    order: 30,
    hidden: true,
    single: true,
    component,
  })
}

export function openWorkbench(
  service: BetterSidebarService,
  scope: SessionScope,
  reveal: RevealController,
): boolean {
  assertBetterSidebar(service)
  if (!service.isTabEnabled(PREVISIT_WORKBENCH_TAB_ID)) {
    return false
  }
  service.openTab({ type: PREVISIT_WORKBENCH_TAB_ID }, scope)
  // Queue reveal even before React attaches the newly selected Session tab.
  reveal.request(scope.sessionId)
  return true
}
