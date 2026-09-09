import { describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { createPrevisitSession, isPrevisitSession, type PrevisitSessionHost } from "./previsit-session.js"
import { PREVISIT_HOME_FLOWS, PREVISIT_HOME_SUMMARY, PREVISIT_HOME_TITLE, PrevisitHome, setPrevisitHeadline } from "./previsit-home.js"

const id = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
function host() {
  const sessions = {
    manager: { calls: 0 },
    list: { getSnapshot: () => ({ current: "cleaning" }) },
    async create(this: { manager: { calls: number } }, options: { cwd: string; sessionId: string }) {
      this.manager.calls += 1
      expect(options.cwd).toBe("/current")
      expect(options).not.toHaveProperty("workspaceId")
      return options.sessionId
    },
    open: vi.fn(),
  }
  return {
    sessions,
    workspaces: { list: { getSnapshot: () => ({
      recentWorkspaceId: "recent",
      items: [
        { workspaceId: "recent", path: "/recent", sessionIds: [] },
        { workspaceId: "current", path: "/current", sessionIds: ["cleaning"] },
      ],
    }) } },
  }
}
describe("previsit entry", () => {
  it("calls the real receiver and prioritizes the current session workspace", async () => {
    const ctx = host()
    expect(isPrevisitSession(await createPrevisitSession(ctx))).toBe(true)
    expect(ctx.sessions.manager.calls).toBe(1)
    expect(ctx.sessions.open).not.toHaveBeenCalled()
  })
  it("does not navigate on failure or a returned foreign id", async () => {
    const ctx = host()
    ctx.sessions.create = vi.fn().mockRejectedValueOnce(new Error("offline")).mockResolvedValueOnce("tender")
    await expect(createPrevisitSession(ctx)).rejects.toThrow("offline")
    await expect(createPrevisitSession(ctx)).rejects.toThrow("标识不匹配")
    expect(ctx.sessions.open).not.toHaveBeenCalled()
  })
  it("fails before creation if workspace or runtime capability is absent", async () => {
    const ctx = host()
    const create = vi.spyOn(ctx.sessions, "create")
    await expect(createPrevisitSession({ sessions: ctx.sessions })).rejects.toThrow("工作空间")
    expect(create).not.toHaveBeenCalled()
    const absent: PrevisitSessionHost = { ...ctx, sessions: { open: ctx.sessions.open } }
    await expect(createPrevisitSession(absent)).rejects.toThrow("创建能力")
  })
})
describe("session-specific previsit home", () => {
  const render = (sessionId: string, composerPhase: string) => renderToStaticMarkup(
    <PrevisitHome sessionId={sessionId} useSession={selector => selector({ composerPhase })} />,
  )
  it("renders the concise home and navigation only in the owned Session", () => {
    expect(render(id, "blank")).toContain(PREVISIT_HOME_SUMMARY)
    expect(render(id, "blank")).toContain("访前尽调能力菜单")
    expect(render(id, "blank")).toContain("对象与目标")
    expect(render(id, "blank")).not.toContain("打开尽调设定")
    for (const foreign of ["ordinary", id.replace("pre-duediligence", "tender-workbench"), id.replace("pre-duediligence", "data-cleaning-agent")]) {
      expect(render(foreign, "blank")).toBe("")
    }
    expect(render(id, "active")).toContain("任务历史")
    expect(render(id, "active")).not.toContain(PREVISIT_HOME_SUMMARY)
  })
  it("maps each v1.5.0 flow button to one view in the same business Tab", () => {
    expect(PREVISIT_HOME_FLOWS.map(({ view, label }) => ({ view, label }))).toEqual([
      { view: "target", label: "对象与目标" },
      { view: "scope", label: "范围确认" },
      { view: "collect", label: "资料采集" },
      { view: "verify", label: "证据核验" },
      { view: "history", label: "任务历史" },
    ])
  })
  it("restores the native headline and never overwrites the next owner's title", () => {
    const title = { textContent: "探索未至之境", dataset: {}, parentElement: null }
    const anchor = { closest: () => ({ querySelector: () => title, querySelectorAll: () => [] }) } as unknown as HTMLElement
    const release = setPrevisitHeadline(anchor)
    expect(title.textContent).toBe(PREVISIT_HOME_TITLE)
    release()
    expect(title.textContent).toBe("探索未至之境")
    const next = setPrevisitHeadline(anchor)
    title.textContent = "数据清洗补全智能体"
    next()
    expect(title.textContent).toBe("数据清洗补全智能体")
  })
})
