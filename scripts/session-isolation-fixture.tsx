import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { usePrevisitComposer } from "../src/previsit-dock.js"
import { PrevisitPromptGenerator } from "../src/previsit-prompt.js"
import { createPrevisitStore } from "../src/previsit-store.js"

const a = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
const b = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abd"
const check = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }

/** Real React lifecycle with synthetic session/input machines; no DSH or Provider calls. */
export async function verifySessionIsolation(): Promise<void> {
  const mount = document.createElement("div")
  mount.hidden = true
  document.body.append(mount)
  const root = createRoot(mount)
  const store = createPrevisitStore()
  const drafts: Record<string, string> = { [a]: "对合成甲公司做标准尽调", [b]: "B 未发送的草稿" }
  const callbacks: string[] = []
  let finish!: (baseline: number) => void
  const pending = new Promise<number>(resolve => { finish = resolve })
  let start!: () => Promise<void>
  function Harness({ sessionId }: { sessionId: string }) {
    const actions = usePrevisitComposer({
      sessionId, store, readDraft: () => drafts[sessionId] ?? "",
      writeDraft: text => { drafts[sessionId] = text }, start: () => pending,
      onStarted: () => { callbacks.push(sessionId) },
    })
    start = actions.startTask
    return <span />
  }
  try {
    flushSync(() => root.render(<Harness sessionId={a} />))
    const sending = start()
    flushSync(() => root.render(<Harness sessionId={b} />))
    finish(0)
    await sending
    check(drafts[b] === "B 未发送的草稿", "A late send overwrote B draft")
    check(store.get(a).task !== undefined && store.get(b).task === undefined, "task crossed Session boundary")
    check(callbacks.length === 0, "late send navigated the newly selected Session")

    const prompt = (sessionId: string) => <PrevisitPromptGenerator sessionId={sessionId} store={store} useInput={selector => selector({ draft: drafts[sessionId] ?? "", phase: "blank" })} inputActions={{ setDraft: text => { drafts[sessionId] = text } }} />
    flushSync(() => root.render(prompt(a)))
    flushSync(() => mount.querySelector<HTMLButtonElement>(".qccPromptTrigger")?.click())
    check(document.querySelector(".qccPromptPanel")?.getAttribute("data-session-id") === a, "A wizard did not open")
    flushSync(() => root.render(prompt(b)))
    check(document.querySelector(".qccPromptPanel") === null, "A wizard remained visible in B")
    flushSync(() => mount.querySelector<HTMLButtonElement>(".qccPromptTrigger")?.click())
    check(document.querySelector(".qccPromptPanel")?.getAttribute("data-session-id") === b, "B wizard did not acquire its own Session")
  } finally { flushSync(() => root.unmount()); mount.remove() }
}
