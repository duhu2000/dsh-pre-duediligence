import { describe, expect, it, vi } from "vitest"
vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({
  Button: () => null,
  IconAgentPresetOutline16: () => null,
}))
import { registerLeftSidebarLauncher, type LeftSidebarHost } from "./left-sidebar.js"
import { type BetterSidebarService } from "./better-sidebar.js"

function fixture() {
  const events: string[] = []
  let openAgent!: () => Promise<void>
  const ctx: LeftSidebarHost = {
    slots: {
      inject: (_name, setup) => setup(),
      register: descriptor => {
        openAgent = descriptor.inject!("")!.openAgent as () => Promise<void>
        return () => {}
      },
    },
    sessions: {
      create: vi.fn(async options => { events.push("create"); return options.sessionId }),
      open: vi.fn(() => { events.push("select") }),
    },
    workspaces: { list: { getSnapshot: () => ({ items: [{ workspaceId: "w", path: "/work" }] }) } },
  }
  const service = {
    version: "0.17.1",
    features: ["targetedOpen", "stateSubscription"],
    isTabEnabled: vi.fn(() => true),
    openTab: vi.fn(() => { events.push("prepare-tab") }),
  } as unknown as BetterSidebarService
  registerLeftSidebarLauncher(ctx)
  return { ctx, service, events, launch: () => openAgent() }
}
describe("previsit navigation commit", () => {
  it("enters a dedicated session without opening the workbench", async () => {
    const f = fixture()
    await f.launch()
    expect(f.events).toEqual(["create", "select"])
    expect(f.ctx.sessions.open).toHaveBeenCalledOnce()
    expect(f.service.openTab).not.toHaveBeenCalled()
  })
  it("leaves current selection intact if session creation fails", async () => {
    const f = fixture()
    vi.mocked(f.ctx.sessions.create!).mockRejectedValue(new Error("session failed"))
    await expect(f.launch()).rejects.toThrow("session failed")
    expect(f.ctx.sessions.open).not.toHaveBeenCalled()
    expect(f.service.openTab).not.toHaveBeenCalled()
  })
  it("allows the native session entry even when the optional workbench is disabled", async () => {
    const f = fixture()
    vi.mocked(f.service.isTabEnabled).mockReturnValue(false)
    await f.launch()
    expect(f.ctx.sessions.create).toHaveBeenCalledOnce()
    expect(f.ctx.sessions.open).toHaveBeenCalledOnce()
  })
})
