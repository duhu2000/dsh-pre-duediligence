/** DSH's public input registry resolves a stable input machine for one Session. */
export type SessionInput = {
  state: { getSnapshot(): { draft: string; phase?: string }; subscribe?(listener: () => void): () => void }
  setDraft(text: string): void
}

export type SessionInputHost = {
  sessions: { scope?(id: string): { get(name: string): unknown } | undefined }
}

export function resolveSessionInput(host: SessionInputHost, sessionId: string): SessionInput | undefined {
  const scope = host.sessions.scope?.(sessionId)
  if (scope === undefined) return undefined
  const conversation = scope.get("conversation") as { input?: { for(scope: unknown): SessionInput } } | undefined
  return conversation?.input?.for(scope)
}

/** Never falls back to a textarea belonging to whichever Session is visible now. */
export function writeSessionDraft(actions: { setDraft(text: string): void } | undefined, text: string): boolean {
  if (actions === undefined) return false
  actions.setDraft(text)
  return true
}

export function clearSubmittedDraft(input: SessionInput | undefined, submitted: string): void {
  if (input?.state.getSnapshot().draft === submitted) input.setDraft("")
}
