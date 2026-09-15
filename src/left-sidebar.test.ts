import { describe, expect, it, vi } from "vitest"
vi.mock("@deepseek-ai/dsh-client-ui-primitives", () => ({
  Button: () => null,
  IconAgentPresetOutline16: () => null,
}))
import { registerLeftSidebarLauncher, type LeftSidebarHost } from "./left-sidebar.js"
import { type BetterSidebarService } from "./better-sidebar.js"
import { INITIAL_DRAFT_TEXT, prefillCreatedPrevisitSession } from "./initial-draft.js"

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
  it("never refills a cleared initialized Session or an ordinary Session", async () => {
    const snapshot = { draft: "", phase: "plain", draftRev: 0, imageIds: [], occurrences: [] }
    const setDraft = vi.fn((text: string) => { snapshot.draft = text })
    const host = { sessions: { scope: vi.fn(() => ({ get: () => ({ input: { for: () => ({
      state: { getSnapshot: () => snapshot }, setDraft,
    }) } }) })) } }
    const id = "session-dsh-pre-duediligence-" + crypto.randomUUID()
    expect(await prefillCreatedPrevisitSession(host, id, () => true)).toBe(true)
    snapshot.draft = ""
    expect(await prefillCreatedPrevisitSession(host, id, () => true)).toBe(false)
    expect(await prefillCreatedPrevisitSession(host, "ordinary-session", () => true)).toBe(false)
    expect(setDraft).toHaveBeenCalledOnce()
    expect(host.sessions.scope).toHaveBeenCalledOnce()
  })
  it("does not write or select the created Session after navigation changes", async () => {
    const f = fixture()
    let current = "A"
    f.ctx.sessions.list = { getSnapshot: () => ({ current }) }
    f.ctx.sessions.create = async options => { current = "B"; return options.sessionId }
    const scope = vi.fn()
    f.ctx.sessions.scope = scope
    await f.launch()
    expect(f.ctx.sessions.open).not.toHaveBeenCalled()
  })
  it("prefills the native new Session before selecting it, without opening a workbench", async () => {
    const f = fixture()
    const snapshot = { draft: "", phase: "plain", draftRev: 0, imageIds: [] as string[], occurrences: [] }
    const setDraft = vi.fn((text: string) => { snapshot.draft = text; f.events.push("draft") })
    f.ctx.sessions.scope = () => ({ get: () => ({ input: { for: () => ({ state: { getSnapshot: () => snapshot }, setDraft }) } }) })
    await f.launch()
    expect(setDraft).toHaveBeenCalledExactlyOnceWith(INITIAL_DRAFT_TEXT)
    expect(f.events).toEqual(["create", "draft", "select"])
    expect(f.service.openTab).not.toHaveBeenCalled()
  })
  it.each([
    { draft: "我的草稿" }, { imageIds: ["attachment"] }, { attachmentIds: ["file"] },
    { draftRev: 1 }, { occurrences: [{}] }, { phase: "submitting" }, { draftRev: undefined },
  ])("preserves existing native input %j", async override => {
    const f = fixture()
    const snapshot = { draft: "", phase: "plain", draftRev: 0, imageIds: [], occurrences: [], ...override }
    const setDraft = vi.fn()
    f.ctx.sessions.scope = () => ({ get: () => ({ input: { for: () => ({ state: { getSnapshot: () => snapshot }, setDraft }) } }) })
    await f.launch()
    expect(setDraft).not.toHaveBeenCalled()
    expect(f.events).toEqual(["create", "select"])
  })
  it("honors a late draft change at the second native snapshot", async () => {
    const f = fixture()
    let reads = 0
    const setDraft = vi.fn()
    f.ctx.sessions.scope = () => ({ get: () => ({ input: { for: () => ({ state: { getSnapshot: () => ({
      draft: ++reads > 1 ? "用户输入" : "", phase: "plain", draftRev: 0, imageIds: [], occurrences: [],
    }) }, setDraft }) } }) })
    await f.launch()
    expect(setDraft).not.toHaveBeenCalled()
  })
  it("enters a dedicated session without opening the workbench", async () => {
    const f = fixture()
    await f.launch()
    expect(f.events).toEqual(["create", "select"])
    expect(f.ctx.sessions.create).toHaveBeenCalledWith(expect.objectContaining({ workspaceId: "w" }))
    expect(f.ctx.sessions.create).toHaveBeenCalledWith(expect.not.objectContaining({ cwd: expect.anything() }))
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
