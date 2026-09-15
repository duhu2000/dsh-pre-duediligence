import { createHash } from "node:crypto"
import { expect, it, vi } from "vitest"
import { INITIAL_DRAFT_SHA256, INITIAL_DRAFT_TEXT, initializeNewPrevisitDraft, isInitialDraft, type InitialDraftSnapshot } from "./initial-draft.js"
import { routePrevisitPrompt, validateComposerText } from "./composer-model.js"
import { mergePromptDraft } from "./previsit-prompt.js"
import { extractCompanyNames } from "./image-intake.js"

const id = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
function fixture() {
  const consumed = new Set<string>()
  const ledger = { has: (key: string) => consumed.has(key), consume: (key: string) => { consumed.add(key) } }
  let state: InitialDraftSnapshot = { sessionId: id, ready: true, draft: "", attachmentIds: [], composing: false, revision: 0 }
  const write = vi.fn(() => true)
  const port = { snapshot: () => state, writeIfUnchanged: write }
  const run = () => initializeNewPrevisitDraft(id, ledger, async () => port, () => true)
  return { ledger, port, run, write, change: (patch: Partial<InitialDraftSnapshot>) => { state = { ...state, ...patch } } }
}
it("initializes once; clear/remount/return cannot refill", async () => {
  const f = fixture(); expect(await f.run()).toBe("initialized")
  f.change({ draft: "", revision: 2 })
  for (let i = 0; i < 3; i++) expect(await f.run()).toBe("skipped")
  expect(f.write).toHaveBeenCalledTimes(1)
})
it.each([{ draft: "用户草稿" }, { draft: " " }, { attachmentIds: ["a"] }, { composing: true }, { ready: false }, { revision: 2 }, { sessionId: "other" }])("preserves unsafe snapshot %j", async patch => {
  const f = fixture(); f.change(patch)
  expect(await f.run()).toBe("skipped"); expect(f.write).not.toHaveBeenCalled()
})
it("second snapshot catches IME race", async () => {
  const f = fixture(); const read = f.port.snapshot; let reads = 0
  f.port.snapshot = () => { if (++reads === 2) f.change({ composing: true }); return read() }
  expect(await f.run()).toBe("skipped"); expect(f.write).not.toHaveBeenCalled()
})
it("late resolution cannot overwrite typed-then-cleared draft", async () => {
  const f = fixture()
  expect(await initializeNewPrevisitDraft(id, f.ledger, async () => {
    f.change({ revision: 2 }); return f.port
  }, () => true)).toBe("skipped")
  expect(f.write).not.toHaveBeenCalled()
})
it("A to B switch consumes event without return refill", async () => {
  const f = fixture()
  expect(await initializeNewPrevisitDraft(id, f.ledger, async () => f.port, () => false)).toBe("skipped")
  expect(await f.run()).toBe("skipped"); expect(f.write).not.toHaveBeenCalled()
})
it.each(["session-ordinary", "session-dsh-form-fill-123", "PV-legacy"])("does not resolve %s", async session => {
  const f = fixture(), resolve = vi.fn(async () => f.port)
  expect(await initializeNewPrevisitDraft(session, f.ledger, resolve, () => true)).toBe("skipped")
  expect(resolve).not.toHaveBeenCalled()
})
it("unsupported Host never writes", async () => {
  const f = fixture()
  expect(await initializeNewPrevisitDraft(id, f.ledger, async () => undefined, () => true)).toBe("unsupported")
  expect(await f.run()).toBe("skipped"); expect(f.write).not.toHaveBeenCalled()
})
it("storage and write failures never loop", async () => {
  const f = fixture(); f.ledger.consume = () => { throw Error("storage") }
  expect(await f.run()).toBe("failed"); expect(f.write).not.toHaveBeenCalled()
  const g = fixture(); g.write.mockImplementation(() => { throw Error("write") })
  expect(await g.run()).toBe("failed"); expect(await g.run()).toBe("skipped")
})
it("pins fingerprint and exact-only template handling", () => {
  expect(createHash("sha256").update(INITIAL_DRAFT_TEXT).digest("hex")).toBe(INITIAL_DRAFT_SHA256)
  expect(isInitialDraft(INITIAL_DRAFT_TEXT)).toBe(true)
  expect(isInitialDraft(INITIAL_DRAFT_TEXT + " ")).toBe(false)
  expect(mergePromptDraft(INITIAL_DRAFT_TEXT, "新任务", "append")).toBe("新任务")
  expect(mergePromptDraft(INITIAL_DRAFT_TEXT + "修改", "新任务", "append")).toContain("修改\n新任务")
  expect(routePrevisitPrompt(INITIAL_DRAFT_TEXT)).toBe(INITIAL_DRAFT_TEXT)
  expect(validateComposerText(INITIAL_DRAFT_TEXT)).toBeDefined()
  const edited = INITIAL_DRAFT_TEXT.replace("【企业名称】", "合成甲有限公司")
  expect(isInitialDraft(edited)).toBe(false)
  expect(routePrevisitPrompt(edited)).toContain("先 previsit_begin")
  expect(extractCompanyNames(INITIAL_DRAFT_TEXT)).toEqual([])
})
