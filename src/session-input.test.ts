import { describe, expect, it, vi } from "vitest"
import { clearSubmittedDraft, resolveSessionInput, writeSessionDraft, type SessionInput } from "./session-input.js"

function input(draft: string): SessionInput {
  return { state: { getSnapshot: () => ({ draft }) }, setDraft: vi.fn(text => { draft = text }) }
}

describe("session-addressed composer", () => {
  it("late A completion leaves the currently selected B draft intact", async () => {
    const inputs = { a: input("A submitted"), b: input("B unsent") }
    const host = { sessions: { scope: (id: string) => ({ get: () => ({ input: { for: () => inputs[id as "a" | "b"] } }) }) } }
    const original = resolveSessionInput(host, "a")
    const current = resolveSessionInput(host, "b")
    await Promise.resolve()
    clearSubmittedDraft(original, "A submitted")
    expect(original?.state.getSnapshot().draft).toBe("")
    expect(current?.state.getSnapshot().draft).toBe("B unsent")
    expect(current?.setDraft).not.toHaveBeenCalled()
  })
  it("preserves new text typed in the same Session while a send was pending", () => {
    const original = input("new text")
    clearSubmittedDraft(original, "submitted text")
    expect(original.setDraft).not.toHaveBeenCalled()
  })
  it("uses the input action receiver and never uses a document fallback", () => {
    const original = input("draft")
    expect(writeSessionDraft(original, "new")).toBe(true)
    expect(original.state.getSnapshot().draft).toBe("new")
    expect(writeSessionDraft(undefined, "must not write")).toBe(false)
    expect(resolveSessionInput({ sessions: {} }, "a")).toBeUndefined()
  })
})
