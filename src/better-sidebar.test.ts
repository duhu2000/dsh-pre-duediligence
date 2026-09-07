import { describe, expect, it, vi } from "vitest"
vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({ Button: () => null }))
import { assertBetterSidebar, registerWorkbenchTab, type BetterSidebarService } from "./better-sidebar.js"
import { apply } from "./workbench-v2.js"

function service(version: string) {
  return { version, features: ["targetedOpen", "stateSubscription"], registerTab: vi.fn(() => vi.fn()), openTab: vi.fn(), isTabEnabled: () => true } as unknown as BetterSidebarService
}
describe("optional sidebar adapter", () => {
  it.each(["0.17.1", "0.18.0"])("registers using the public %s contract", version => {
    const sidebar = service(version)
    expect(() => registerWorkbenchTab(sidebar, () => null)).not.toThrow()
    expect(sidebar.registerTab).toHaveBeenCalledWith(expect.objectContaining({ hidden: true, single: true }))
  })
  it("checks methods and capabilities rather than trusting a version string alone", () => {
    expect(() => assertBetterSidebar({ ...service("0.18.0"), features: [] })).toThrow("capabilities")
    expect(() => assertBetterSidebar(service("0.19.0"))).toThrow("支持")
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
})
