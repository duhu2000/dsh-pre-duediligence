import { describe, expect, it, vi } from "vitest"
vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({
  Button: () => null,
  IconAgentPresetOutline16: () => null,
}))
import { registerLeftSidebarLauncher, type LeftSidebarHost } from "./left-sidebar.js"
import { createRevealController, type BetterSidebarService } from "./better-sidebar.js"

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
  const reveal = createRevealController()
  const request = vi.spyOn(reveal, "request")
  registerLeftSidebarLauncher(ctx, service, reveal)
  return { ctx, service, request, events, launch: () => openAgent() }
}
describe("previsit navigation commit", () => {
  it("prepares the target panel and pending reveal before changing selection", async () => {
    const f = fixture()
    await f.launch()
    expect(f.events).toEqual(["create", "prepare-tab", "select"])
    const sessionId = vi.mocked(f.ctx.sessions.open!).mock.calls[0]![0]
    expect(f.request).toHaveBeenCalledWith(sessionId)
    expect(f.service.openTab).toHaveBeenCalledWith({ type: "dsh-pre-duediligence:agent" }, { sessionId })
  })
  it("leaves current selection intact if panel preparation fails", async () => {
    const f = fixture()
    vi.mocked(f.service.openTab).mockImplementation(() => { throw new Error("panel failed") })
    await expect(f.launch()).rejects.toThrow("panel failed")
    expect(f.ctx.sessions.open).not.toHaveBeenCalled()
  })
  it("does not create a session when the tab is disabled", async () => {
    const f = fixture()
    vi.mocked(f.service.isTabEnabled).mockReturnValue(false)
    await expect(f.launch()).rejects.toThrow("不可用")
    expect(f.ctx.sessions.create).not.toHaveBeenCalled()
    expect(f.ctx.sessions.open).not.toHaveBeenCalled()
  })
})
