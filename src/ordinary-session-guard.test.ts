import { describe, expect, it, vi } from "vitest"

import { installOrdinarySessionGuard, isBusinessSession, type WorkspaceNavigation } from "./ordinary-session-guard.js"

const businessIds = [
  "session-dsh-pre-duediligence-owned",
  "session-dsh-data-cleaning-agent-owned",
  "session-dsh-form-fill-agent-owned",
  "session-dsh-tender-workbench-owned",
]

function fixture(selected = businessIds[0]!) {
  const workspace = {
    items: [{ workspaceId: "w", path: "/work", sessionIds: [...businessIds] }],
    archivedSessionIds: [] as string[],
  }
  const snapshot = {
    ids: [...businessIds],
    byId: Object.fromEntries(businessIds.map(id => [id, { blank: true, cwd: "/work" }])) as Record<string, { blank: boolean; cwd: string }>,
  }
  const sessions = {
    manager: { calls: 0 },
    list: { getSnapshot: () => snapshot },
    create: vi.fn(async function (this: { manager: { calls: number } }, options: { workspaceId: string }) {
      expect(this).toBe(sessions)
      expect(options).toEqual({ workspaceId: "w" })
      this.manager.calls += 1
      return "ordinary-created"
    }),
  }
  const host = { sessions, workspaces: { list: { getSnapshot: () => workspace } } }
  const navigation: WorkspaceNavigation = {
    connectWorkspace: vi.fn(async function (this: WorkspaceNavigation, workspaceId: string) {
      expect(this).toBe(navigation)
      expect(workspaceId).toBe("w")
      return selected
    }),
  }
  const original = navigation.connectWorkspace
  const release = installOrdinarySessionGuard(host, navigation)
  return { host, navigation, original, release, snapshot, workspace, connect: () => navigation.connectWorkspace!("w") }
}

describe("ordinary Session isolation", () => {
  it("recognizes all four business Session namespaces", () => {
    for (const id of businessIds) expect(isBusinessSession(id)).toBe(true)
    expect(isBusinessSession("session-ordinary")).toBe(false)
  })
  it("replaces a business blank selected by native New Session with a fresh ordinary Session", async () => {
    const f = fixture()
    expect(await f.connect()).toBe("ordinary-created")
    expect(f.host.sessions.create).toHaveBeenCalledOnce()
    expect(f.host.sessions.manager.calls).toBe(1)
  })
  it("reuses a non-archived ordinary blank in the same Workspace", async () => {
    const f = fixture()
    f.snapshot.ids.unshift("ordinary-blank")
    f.snapshot.byId["ordinary-blank"] = { blank: true, cwd: "/work" }
    f.workspace.items[0]!.sessionIds.unshift("ordinary-blank")
    expect(await f.connect()).toBe("ordinary-blank")
    expect(f.host.sessions.create).not.toHaveBeenCalled()
  })
  it("does not reuse an archived, foreign-path, foreign-Workspace, or other-business blank Session", async () => {
    const f = fixture()
    f.snapshot.ids.unshift("archived", "foreign-path", "foreign-workspace")
    f.snapshot.byId.archived = { blank: true, cwd: "/work" }
    f.snapshot.byId["foreign-path"] = { blank: true, cwd: "/other" }
    f.snapshot.byId["foreign-workspace"] = { blank: true, cwd: "/work" }
    f.workspace.items[0]!.sessionIds.unshift("archived", "foreign-path")
    f.workspace.archivedSessionIds.push("archived")
    expect(await f.connect()).toBe("ordinary-created")
  })
  it("passes an ordinary native selection through without creating", async () => {
    const f = fixture("ordinary-existing")
    expect(await f.connect()).toBe("ordinary-existing")
    expect(f.host.sessions.create).not.toHaveBeenCalled()
  })
  it("coalesces concurrent replacement and propagates creation failure", async () => {
    const f = fixture()
    let finish!: (id: string) => void
    f.host.sessions.create.mockImplementation(() => new Promise(resolve => { finish = resolve }))
    const first = f.connect()
    const second = f.connect()
    await vi.waitFor(() => expect(f.host.sessions.create).toHaveBeenCalledOnce())
    finish("ordinary-created")
    expect(await Promise.all([first, second])).toEqual(["ordinary-created", "ordinary-created"])

    f.host.sessions.create.mockRejectedValueOnce(new Error("offline"))
    await expect(f.connect()).rejects.toThrow("offline")
  })
  it("restores the original navigation on disposal", async () => {
    const f = fixture()
    f.release()
    expect(f.navigation.connectWorkspace).toBe(f.original)
    expect(await f.connect()).toBe(businessIds[0])
    expect(f.host.sessions.create).not.toHaveBeenCalled()
  })
})
