import { describe, expect, it, vi } from "vitest"
vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({ Button: () => null }))
import {
  PREVISIT_WORKBENCH_TAB_ID,
  assertBetterSidebar,
  createRevealController,
  openWorkbench,
  registerWorkbenchTab,
  type BetterSidebarService,
  type SidebarState,
  type SidebarStore,
} from "./better-sidebar.js"
import { createPrevisitStore } from "./previsit-store.js"
import { OPTIONAL_WORKBENCH_MESSAGE, apply } from "./workbench-v2.js"

function service(version: string) {
  return {
    version,
    features: ["targetedOpen", "stateSubscription"],
    registerTab: vi.fn(() => vi.fn()),
    openTab: vi.fn(),
    isTabEnabled: () => true,
    getSnapshot: vi.fn(() => ({})),
    subscribeState: vi.fn(() => vi.fn()),
  } as unknown as BetterSidebarService
}

function stateWith(tabPlacement: "right" | "bottom" | "float", open = false): SidebarState {
  const tab = { id: PREVISIT_WORKBENCH_TAB_ID }
  const empty = { kind: "leaf", id: "empty", tabs: [] }
  const occupied = { kind: "leaf", id: "occupied", tabs: [tab] }
  return {
    panelOpen: tabPlacement === "right" ? open : false,
    splits: tabPlacement === "right" ? occupied : empty,
    bottomOpen: tabPlacement === "bottom" ? open : false,
    bottomSplits: tabPlacement === "bottom" ? occupied : empty,
    floats: tabPlacement === "float" ? [{ id: "float", tab }] : [],
  } as unknown as SidebarState
}

function sidebarStore(initial: SidebarState) {
  let current = initial
  const reduce = vi.fn((reducer: (state: SidebarState) => SidebarState) => { current = reducer(current) })
  return {
    store: { getSnapshot: () => current, subscribe: () => vi.fn(), reduce } as unknown as SidebarStore,
    current: () => current,
    reduce,
  }
}
describe("optional sidebar adapter", () => {
  it.each(["0.17.1", "0.18.1"])("registers using the public %s contract", version => {
    const sidebar = service(version)
    expect(() => registerWorkbenchTab(sidebar, () => null)).not.toThrow()
    expect(sidebar.registerTab).toHaveBeenCalledWith(expect.objectContaining({ hidden: true, single: true }))
  })
  it("returns the host unregister disposer for plugin unload", () => {
    const sidebar = service("0.18.1")
    const unregister = vi.fn()
    vi.mocked(sidebar.registerTab).mockReturnValue(unregister)
    const dispose = registerWorkbenchTab(sidebar, () => null)
    dispose()
    expect(unregister).toHaveBeenCalledTimes(1)
  })
  it("checks methods and capabilities rather than trusting a version string alone", () => {
    expect(() => assertBetterSidebar({ ...service("0.18.1"), features: [] })).toThrow("capabilities")
    expect(() => assertBetterSidebar({ ...service("0.18.1"), subscribeState: undefined } as unknown as BetterSidebarService)).toThrow("capabilities")
    expect(() => assertBetterSidebar(service("0.19.0"))).toThrow("支持")
  })
  it("opens and reveals the same single tab on repeated requests", () => {
    const sidebar = service("0.17.1")
    const controller = createRevealController()
    const state = sidebarStore(stateWith("right"))
    controller.attach("session-a", { store: state.store, tabId: PREVISIT_WORKBENCH_TAB_ID })

    expect(openWorkbench(sidebar, { sessionId: "session-a" }, controller)).toBe(true)
    expect(openWorkbench(sidebar, { sessionId: "session-a" }, controller)).toBe(true)
    expect(sidebar.openTab).toHaveBeenNthCalledWith(1, { type: PREVISIT_WORKBENCH_TAB_ID }, { sessionId: "session-a" })
    expect(sidebar.openTab).toHaveBeenNthCalledWith(2, { type: PREVISIT_WORKBENCH_TAB_ID }, { sessionId: "session-a" })
    expect(state.current().panelOpen).toBe(true)
  })
  it("queues a background Session reveal without changing the foreground geometry", () => {
    const sidebar = service("0.18.1")
    const controller = createRevealController()
    const foreground = sidebarStore(stateWith("right"))
    const background = sidebarStore(stateWith("bottom"))
    controller.attach("session-foreground", { store: foreground.store, tabId: PREVISIT_WORKBENCH_TAB_ID })

    expect(openWorkbench(sidebar, { sessionId: "session-background", cwd: "/synthetic" }, controller)).toBe(true)
    expect(foreground.reduce).not.toHaveBeenCalled()
    expect(foreground.current().panelOpen).toBe(false)

    controller.attach("session-background", { store: background.store, tabId: PREVISIT_WORKBENCH_TAB_ID })
    expect(background.current().bottomOpen).toBe(true)
    expect(foreground.current().panelOpen).toBe(false)
  })
  it("does not reveal or churn state when the business Tab is disabled", () => {
    const sidebar = service("0.17.1")
    vi.spyOn(sidebar, "isTabEnabled").mockReturnValue(false)
    const controller = createRevealController()
    const state = sidebarStore(stateWith("right"))
    controller.attach("session-a", { store: state.store, tabId: PREVISIT_WORKBENCH_TAB_ID })

    expect(openWorkbench(sidebar, { sessionId: "session-a" }, controller)).toBe(false)
    expect(sidebar.openTab).not.toHaveBeenCalled()
    expect(state.reduce).not.toHaveBeenCalled()
  })
  it("preserves the Session task when the host collapses or the Tab unmounts and reopens", () => {
    const sidebar = service("0.18.1")
    const controller = createRevealController()
    const geometry = sidebarStore(stateWith("right"))
    const business = createPrevisitStore()
    const task = {
      id: "task-running",
      prompt: "synthetic",
      createdAt: "2026-09-10T00:00:00.000Z",
      nodeBaseline: 0,
      seenRunning: true,
      selection: { focus: [] },
    }
    business.update("session-a", state => ({ ...state, task, view: "history" }))

    const detach = controller.attach("session-a", { store: geometry.store, tabId: PREVISIT_WORKBENCH_TAB_ID })
    controller.request("session-a")
    expect(geometry.current().panelOpen).toBe(true)
    expect(business.get("session-a")).toMatchObject({ task, view: "history" })

    detach()
    expect(openWorkbench(sidebar, { sessionId: "session-a" }, controller)).toBe(true)
    const reopened = sidebarStore(stateWith("right"))
    controller.attach("session-a", { store: reopened.store, tabId: PREVISIT_WORKBENCH_TAB_ID })
    expect(reopened.current().panelOpen).toBe(true)
    expect(business.get("session-a")).toMatchObject({ task, view: "history" })
  })
  it("leaves floating geometry unchanged and clears pending reveals on dispose", () => {
    const controller = createRevealController()
    const floating = sidebarStore(stateWith("float"))
    controller.attach("session-float", { store: floating.store, tabId: PREVISIT_WORKBENCH_TAB_ID })
    controller.request("session-float")
    expect(floating.current()).toBe(floating.store.getSnapshot())
    expect(floating.current().panelOpen).toBe(false)
    expect(floating.current().bottomOpen).toBe(false)

    const pending = sidebarStore(stateWith("right"))
    controller.request("session-late")
    controller.dispose()
    controller.attach("session-late", { store: pending.store, tabId: PREVISIT_WORKBENCH_TAB_ID })
    controller.request("session-late")
    expect(pending.reduce).not.toHaveBeenCalled()
  })
  it.each([undefined, "0.16.0"])("keeps the native home and entry registered with sidebar %s", version => {
    const slots: string[] = []
    const ctx = {
      effect: (setup: () => unknown) => setup(),
      inject: (_names: string[], setup: (ctx: unknown) => void) => { if (version) setup({ betterSidebar: service(version), effect: (fn: () => unknown) => fn() }) },
      slots: { inject: (_name: string, setup: () => unknown) => setup(), register: (descriptor: { id: string }) => { slots.push(descriptor.id); return () => {} } },
      sessions: {},
    }
    const originalDocument = globalThis.document
    vi.stubGlobal("document", { getElementById: () => ({}), head: {} })
    try { expect(() => apply(ctx as unknown as Parameters<typeof apply>[0])).not.toThrow() }
    finally { vi.stubGlobal("document", originalDocument) }
    expect(slots).toContain("dsh-pre-duediligence-launcher")
    expect(slots).toContain("dsh-pre-duediligence:home")
  })
  it("keeps the base flow active and returns an actionable message without Sidebar", () => {
    let injectHome: ((sessionId: string) => { openWorkbench(view: "target"): void }) | undefined
    const ctx = {
      effect: (setup: () => unknown) => setup(),
      inject: () => undefined,
      slots: {
        inject: (_name: string, setup: () => unknown) => setup(),
        register: (descriptor: { id: string; inject?: typeof injectHome }) => {
          if (descriptor.id === "dsh-pre-duediligence:home") injectHome = descriptor.inject
          return () => {}
        },
      },
      sessions: {},
    }
    const originalDocument = globalThis.document
    vi.stubGlobal("document", { getElementById: () => ({}), head: {} })
    try { apply(ctx as unknown as Parameters<typeof apply>[0]) }
    finally { vi.stubGlobal("document", originalDocument) }

    expect(injectHome).toBeTypeOf("function")
    const props = injectHome?.("session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc")
    expect(() => props?.openWorkbench("target")).toThrow(OPTIONAL_WORKBENCH_MESSAGE)
    expect(OPTIONAL_WORKBENCH_MESSAGE).toContain("草稿和业务状态已保留")
    expect(OPTIONAL_WORKBENCH_MESSAGE).toContain("DSH_PREVISIT_WORKBENCH=on")
  })
})
