import { isPrevisitSession } from "./previsit-session.js"

type Submission = { text: string; onRetire?: (result: { reason: string }) => void }
type Face = {
  beginSubmission?: (input: Submission) => unknown
  getSnapshot(): unknown
  subscribe(listener: () => void): () => void
}
type Host = { sessions: {
  list?: { getSnapshot(): { current?: string }; subscribe?(listener: () => void): () => void }
  binding?(id: string): { session: Face } | undefined
} }
type Ticket = { text: string; handled: boolean; observed?: boolean }
type Node = { seq?: number; kind?: string; role?: string; text?: string; content?: unknown; parts?: unknown; message?: { role?: string; content?: unknown } }
type Snapshot = { nodes?: Node[]; openState?: string; loadingOlder?: boolean }

/** Observe admission, never input edits, runtime heartbeats or restored history. */
export function installSubmissionReveal(host: Host, reveal: (sessionId: string) => void) {
  let alive = true
  let stopFace = () => {}
  let attached: Face | undefined
  let current: string | undefined
  const direct = new Map<string, Ticket>()
  const awaitingLegacy = new Map<string, Ticket[]>()
  const accept = (sessionId: string, ticket: Ticket) => {
    if (ticket.handled) return
    ticket.handled = true
    // A background acceptance must not steal the currently selected Session.
    if (!alive || host.sessions.list?.getSnapshot().current !== sessionId || !isPrevisitSession(sessionId)) return
    try { reveal(sessionId) } catch { /* Optional workbench failure must not fail an accepted prompt. */ }
  }
  const connect = () => {
    const id = host.sessions.list?.getSnapshot().current
    const face = id ? host.sessions.binding?.(id)?.session : undefined
    if (id === current && face === attached) return
    stopFace(); stopFace = () => {}; current = id; attached = face
    if (!id || !face || !isPrevisitSession(id)) return
    const original = face.beginSubmission
    if (typeof original === "function") {
      const wrapped = function (this: Face, input: Submission) {
        const pending = direct.get(id)
        const ticket = pending?.text === input.text ? pending : { text: input.text, handled: false }
        return original.call(this, { ...input, onRetire(result) {
          try { input.onRetire?.(result) }
          finally { if (result.reason === "observed") accept(id, ticket) }
        } })
      }
      face.beginSubmission = wrapped
      stopFace = () => { if (face.beginSubmission === wrapped) face.beginSubmission = original }
      return
    }
    // Legacy Host: only newly committed user nodes, not initial/hydrated history.
    let previous = face.getSnapshot() as Snapshot
    let baseline = previous.nodes?.length ?? 0
    let highest = Math.max(0, ...(previous.nodes ?? []).map(node => node.seq ?? 0))
    stopFace = face.subscribe(() => {
      const next = face.getSnapshot() as Snapshot
      const nodes = next.nodes ?? []
      const added = highest ? nodes.filter(node => (node.seq ?? 0) > highest) : nodes.slice(baseline)
      highest = Math.max(highest, ...nodes.map(node => node.seq ?? 0)); baseline = nodes.length
      const restoring = (previous.openState !== undefined && previous.openState !== "open") || next.loadingOlder
      previous = next
      if (restoring) return
      for (const node of added) {
        if (node.kind === "user" || node.role === "user" || node.message?.role === "user") {
          const content = node.message?.content ?? node.content ?? node.parts
          const text = node.text ?? (typeof content === "string" ? content : Array.isArray(content)
            ? content.map(part => typeof part === "string" ? part : part?.text ?? "").join("\n") : "")
          const pending = awaitingLegacy.get(id) ?? []
          const index = pending.findIndex(ticket => ticket.text === text)
          const ticket = index >= 0 ? pending.splice(index, 1)[0]! : direct.get(id) ?? { text, handled: false }
          ticket.observed = true
          accept(id, ticket)
        }
      }
    })
  }
  connect()
  const stopList = host.sessions.list?.subscribe?.(connect)
  connect()
  return {
    async submit(sessionId: string, text: string, send: () => Promise<unknown>) {
      const ticket: Ticket = { text, handled: false }
      direct.set(sessionId, ticket)
      try {
        const result = await send()
        if (result === false) throw new Error("任务未被接纳，请重试")
        accept(sessionId, ticket)
        if (!ticket.observed && typeof host.sessions.binding?.(sessionId)?.session.beginSubmission !== "function") {
          awaitingLegacy.set(sessionId, [...(awaitingLegacy.get(sessionId) ?? []), ticket])
        }
      } finally { if (direct.get(sessionId) === ticket) direct.delete(sessionId) }
    },
    dispose() { alive = false; stopList?.(); stopFace(); direct.clear(); awaitingLegacy.clear() },
  }
}
