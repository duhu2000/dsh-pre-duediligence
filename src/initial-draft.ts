import { isPrevisitSession } from "./previsit-session.js"
import { resolveSessionInput, type SessionInputHost } from "./session-input.js"

export const INITIAL_DRAFT_ID = "dsh-initial-draft/previsit/1"
export const INITIAL_DRAFT_SHA256 = "6fcef5e766f9e54d3ff33d73bfdb3edcb7ce688759503bca0bc73cdbf8eadbdc"
export const INITIAL_DRAFT_TEXT = "请帮我准备一次客户拜访。请填写企业名称和关注重点，也可点击左上角「提示词生成」选择角色、拜访场景和报告格式。例如：我是银行客户经理，准备拜访【企业名称】，重点了解经营情况与风险，生成访前简报。"

/** Deliberately no trimming/normalization: any edit belongs to the user. */
export const isInitialDraft = (text: string): boolean => text === INITIAL_DRAFT_TEXT
export const hasUnfilledPlaceholder = (text: string): boolean => /【[^】]*】/u.test(text)

const attemptedEntries = new Set<string>()

/** Only the business launcher calls this, after create and before open.
 * No retry on mount, restore or selection. Older inputs without attachment/revision
 * snapshots remain empty. setDraft has no public IME/no-focus option; we only write
 * to the new, not-yet-visible Session, never the mounted current editor.
 */
export async function prefillCreatedPrevisitSession(
  host: SessionInputHost,
  sessionId: string,
  entryStillCurrent: () => boolean,
): Promise<boolean> {
  if (!isPrevisitSession(sessionId) || attemptedEntries.has(sessionId)) return false
  attemptedEntries.add(sessionId)
  try {
    const input = resolveSessionInput(host, sessionId)
    if (!input || !entryStillCurrent()) return false
    const empty = () => {
      const s = input.state.getSnapshot()
      const attachments = s.attachmentIds ?? s.imageIds
      return entryStillCurrent() && s.phase === "plain" && s.draft === "" && s.draftRev === 0
        && Array.isArray(attachments) && attachments.length === 0
        && Array.isArray(s.occurrences) && s.occurrences.length === 0
    }
    if (!empty()) return false
    await Promise.resolve()
    if (!empty()) return false
    input.setDraft(INITIAL_DRAFT_TEXT)
    return input.state.getSnapshot().draft === INITIAL_DRAFT_TEXT
  } catch {
    // Optional guidance must not prevent opening the native business Session.
    return false
  }
}

export type InitialDraftSnapshot = {
  sessionId: string
  ready: boolean
  draft: string
  attachmentIds: readonly string[]
  composing: boolean
  revision: number
}

/** Product-owned port, NOT a claimed DSH API. No supported Host adapter yet.
 * An adapter must guarantee conditional synchronous write with no focus/selection change.
 */
export type InitialDraftPort = {
  snapshot(): InitialDraftSnapshot
  writeIfUnchanged(snapshot: InitialDraftSnapshot, text: string): boolean
}
export type InitialDraftLedger = {
  has(sessionId: string): boolean
  consume(sessionId: string): void
}
export type InitialDraftResult = "initialized" | "skipped" | "unsupported" | "failed"

/** Called only from a successful business-entry create event, never a mount or restore.
 * Consuming before async work prevents retries/remounts from racing user takeover.
 * Storage failure fails closed; no timer, focus, send, task or navigation capability.
 */
export async function initializeNewPrevisitDraft(
  sessionId: string,
  ledger: InitialDraftLedger,
  resolve: () => Promise<InitialDraftPort | undefined>,
  isCurrent: () => boolean,
): Promise<InitialDraftResult> {
  if (!isPrevisitSession(sessionId)) return "skipped"
  try {
    if (ledger.has(sessionId)) return "skipped"
    ledger.consume(sessionId)
    if (!isCurrent()) return "skipped"
    const port = await resolve()
    if (!port) return "unsupported"
    const eligible = (s: InitialDraftSnapshot) => isCurrent() && s.sessionId === sessionId
      && s.ready === true && s.composing === false && s.draft === ""
      && Array.isArray(s.attachmentIds) && s.attachmentIds.length === 0
      // A user typing then clearing before resolution must also win.
      && s.revision === 0
    const first = port.snapshot()
    if (!eligible(first)) return "skipped"
    await Promise.resolve()
    const latest = port.snapshot()
    if (!eligible(latest) || latest.revision !== first.revision) return "skipped"
    return port.writeIfUnchanged(latest, INITIAL_DRAFT_TEXT) ? "initialized" : "skipped"
  } catch {
    return "failed"
  }
}
