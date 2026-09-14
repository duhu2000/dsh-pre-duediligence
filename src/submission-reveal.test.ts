import { describe, expect, it, vi } from "vitest"
import { installSubmissionReveal } from "./submission-reveal.js"

const ID = "session-dsh-pre-duediligence-11111111-1111-4111-8111-111111111111"
function fixture(modern = true) {
  let current = ID
  let changed = () => {}
  let updated = () => {}
  let snapshot: { nodes: Array<{ seq: number; kind: string; text?: string }>; openState: string; loadingOlder?: boolean } = { nodes: [], openState: "open" }
  const callbacks: Array<(r: { reason: string }) => void> = []
  const original = vi.fn((input: { text: string; onRetire?: (r: { reason: string }) => void }) => {
    if (input.onRetire) callbacks.push(input.onRetire)
    return { requestId: "req" }
  })
  const face = { ...(modern ? { beginSubmission: original } : {}),
    getSnapshot: () => snapshot, subscribe: (listener: () => void) => { updated = listener; return () => { updated = () => {} } } }
  const host = { sessions: { list: { getSnapshot: () => ({ current }), subscribe: (listener: () => void) => { changed = listener; return () => { changed = () => {} } } }, binding: () => ({ session: face }) } }
  const reveal = vi.fn()
  const bridge = installSubmissionReveal(host, reveal)
  return { bridge, face, original, reveal, callbacks,
    select(id: string) { current = id; changed() },
    update(next: typeof snapshot) { snapshot = next; updated() } }
}

describe("accepted submission workbench reveal", () => {
  it("does not open on install/drafts/failed settlement; observed opens once and preserves original callback", () => {
    const f = fixture(), retire = vi.fn()
    expect(f.reveal).not.toHaveBeenCalled()
    f.face.beginSubmission!({ text: "company", onRetire: retire })
    expect(f.reveal).not.toHaveBeenCalled()
    f.callbacks[0]!({ reason: "failed" })
    expect(f.reveal).not.toHaveBeenCalled()
    f.face.beginSubmission!({ text: "company", onRetire: retire })
    f.callbacks[1]!({ reason: "observed" }); f.callbacks[1]!({ reason: "observed" })
    expect(f.reveal).toHaveBeenCalledExactlyOnceWith(ID)
    expect(retire).toHaveBeenCalledTimes(3)
    f.bridge.dispose()
    expect(f.face.beginSubmission).toBe(f.original)
  })
  it("deduplicates direct send and later Host retirement; new accepted submission can open again", async () => {
    const f = fixture()
    await f.bridge.submit(ID, "company", async () => { f.face.beginSubmission!({ text: "company" }) })
    // User may close the panel now. Late settlement must not reopen it.
    f.callbacks[0]!({ reason: "observed" })
    expect(f.reveal).toHaveBeenCalledTimes(1)
    await f.bridge.submit(ID, "new company", async () => {
      f.face.beginSubmission!({ text: "new company" }); f.callbacks[1]!({ reason: "observed" })
    })
    expect(f.reveal).toHaveBeenCalledTimes(2)
  })
  it("does not reveal rejected direct sends, switched sessions or disposed callbacks", async () => {
    const f = fixture()
    await expect(f.bridge.submit(ID, "company", async () => false)).rejects.toThrow()
    await expect(f.bridge.submit(ID, "company", async () => { throw Error("offline") })).rejects.toThrow()
    f.face.beginSubmission!({ text: "company" })
    f.select("ordinary-session")
    f.callbacks[0]!({ reason: "observed" })
    f.select(ID)
    expect(f.reveal).not.toHaveBeenCalled()
    f.face.beginSubmission!({ text: "company" }); f.bridge.dispose()
    f.callbacks[1]!({ reason: "observed" })
    expect(f.reveal).not.toHaveBeenCalled()
  })
  it("legacy snapshot restore and tool updates do not open; new user node opens once", () => {
    const f = fixture(false)
    f.update({ nodes: [{ seq: 1, kind: "user" }], openState: "opening" , loadingOlder: true })
    f.update({ nodes: [{ seq: 1, kind: "user" }], openState: "open" })
    expect(f.reveal).not.toHaveBeenCalled()
    f.update({ nodes: [{ seq: 1, kind: "user" }, { seq: 2, kind: "user" }], openState: "open" })
    f.update({ nodes: [{ seq: 1, kind: "user" }, { seq: 2, kind: "user" }, { seq: 3, kind: "tool" }], openState: "open" })
    expect(f.reveal).toHaveBeenCalledTimes(1)
  })
  it("optional sidebar failure never turns accepted submission into a failed send", async () => {
    const f = fixture()
    f.reveal.mockImplementation(() => { throw Error("disabled") })
    await expect(f.bridge.submit(ID, "company", async () => {})).resolves.toBeUndefined()
  })
  it("legacy durable node arriving after direct acceptance does not reopen a closed panel", async () => {
    const f = fixture(false)
    await f.bridge.submit(ID, "company", async () => {})
    expect(f.reveal).toHaveBeenCalledTimes(1)
    f.update({ nodes: [{ seq: 1, kind: "user", text: "company" }], openState: "open" })
    expect(f.reveal).toHaveBeenCalledTimes(1)
    f.update({ nodes: [{ seq: 1, kind: "user", text: "company" }, { seq: 2, kind: "user", text: "company" }], openState: "open" })
    expect(f.reveal).toHaveBeenCalledTimes(2)
  })
})
