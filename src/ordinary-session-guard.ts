const BUSINESS_SESSION_PATTERN = /^session-dsh-(?:pre-duediligence|data-cleaning-agent|form-fill-agent|tender-workbench)-/u

type SessionSummary = {
  blank?: boolean
  cwd?: string
}

type GuardHost = {
  sessions: {
    list?: { getSnapshot(): {
      current?: string
      ids?: string[]
      byId?: Record<string, SessionSummary | undefined>
    } }
    create?: unknown
  }
  workspaces?: {
    list?: { getSnapshot(): {
      items?: Array<{ workspaceId: string; path?: string; sessionIds?: string[] }>
      archivedSessionIds?: string[]
    } }
  }
}

export type WorkspaceNavigation = {
  connectWorkspace?(workspaceId: string): Promise<string>
}

export function isBusinessSession(sessionId: string): boolean {
  return BUSINESS_SESSION_PATTERN.test(sessionId)
}

/**
 * DSH currently chooses a reusable blank Session before returning from
 * uiWorkspace.connectWorkspace(). Business entry Sessions must stay attached
 * to their Workspace for native composer ownership, but must never become the
 * ordinary "New Session" result. This wrapper filters only that returned
 * selection and otherwise delegates to public Host capabilities.
 */
export function installOrdinarySessionGuard(host: GuardHost, navigation: WorkspaceNavigation): () => void {
  const original = navigation.connectWorkspace
  if (typeof original !== "function") return () => {}

  const pending = new Map<string, Promise<string>>()
  let active = true
  const guarded = async function (this: WorkspaceNavigation, workspaceId: string): Promise<string> {
    const selected = await original.call(this, workspaceId)
    if (!active || !isBusinessSession(selected)) return selected

    const existing = pending.get(workspaceId)
    if (existing !== undefined) return existing
    const resolveOrdinary = async (): Promise<string> => {
      const workspace = host.workspaces?.list?.getSnapshot()
      const target = workspace?.items?.find(item => item.workspaceId === workspaceId)
      if (target === undefined) throw new Error("新会话所属工作空间不可用")

      const snapshot = host.sessions.list?.getSnapshot()
      const ids = snapshot?.ids ?? Object.keys(snapshot?.byId ?? {})
      const archived = new Set(workspace?.archivedSessionIds ?? [])
      const reusable = ids.find(id => {
        const summary = snapshot?.byId?.[id]
        return typeof target.path === "string" && !isBusinessSession(id) && summary?.blank === true && summary.cwd === target.path
          && target.sessionIds?.includes(id) === true && !archived.has(id)
      })
      if (reusable !== undefined) return reusable

      const create = host.sessions.create as ((options: { workspaceId: string }) => Promise<string>) | undefined
      if (typeof create !== "function") throw new Error("当前 DSH 版本没有可用的普通会话创建能力")
      const created = await create.call(host.sessions, { workspaceId })
      if (isBusinessSession(created)) throw new Error("新会话错误返回了业务会话")
      return created
    }
    const attempt = resolveOrdinary().finally(() => { pending.delete(workspaceId) })
    pending.set(workspaceId, attempt)
    return attempt
  }

  navigation.connectWorkspace = guarded
  return () => {
    active = false
    if (navigation.connectWorkspace === guarded) navigation.connectWorkspace = original
  }
}
