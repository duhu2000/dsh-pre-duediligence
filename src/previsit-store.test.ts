import { describe, expect, it, vi } from "vitest"

import { createPrevisitStore, locatePrevisitView } from "./previsit-store.js"

describe("session-scoped workbench navigation", () => {
  it("locates a target view once and is a strict no-op when repeated", () => {
    const store = createPrevisitStore()
    const listener = vi.fn()
    store.subscribe(listener)

    expect(locatePrevisitView(store, "session-a", "scope")).toBe(true)
    expect(store.get("session-a").view).toBe("scope")
    expect(listener).toHaveBeenCalledTimes(1)

    expect(locatePrevisitView(store, "session-a", "scope")).toBe(false)
    expect(listener).toHaveBeenCalledTimes(1)
  })

  it("does not create, replace, or move tasks across Sessions", () => {
    const store = createPrevisitStore()
    const task = {
      id: "task-a",
      prompt: "synthetic",
      createdAt: "2026-09-09T00:00:00.000Z",
      nodeBaseline: 0,
      seenRunning: true,
      selection: { focus: [] },
    }
    store.update("session-a", state => ({ ...state, task }))

    expect(locatePrevisitView(store, "session-b", "history")).toBe(true)
    expect(store.get("session-a").task).toBe(task)
    expect(store.get("session-a").view).toBe("target")
    expect(store.get("session-b").task).toBeUndefined()
    expect(store.get("session-b").view).toBe("history")
  })
})
