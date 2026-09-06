export const PREVISIT_SESSION_ID_PREFIX = "session-dsh-pre-duediligence-"

export function isPrevisitSession(sessionId: string): boolean {
  return /^session-dsh-pre-duediligence-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(sessionId)
}

export type PrevisitSessionHost = {
  sessions: {
    list?: { getSnapshot(): { current?: string } }
    create?(options: { cwd: string; sessionId: string }): Promise<string>
    open?(sessionId: string): void
  }
  workspaces?: {
    list?: { getSnapshot(): {
      items?: Array<{ workspaceId: string; path?: string; sessionIds?: string[] }>
      recentWorkspaceId?: string
    } }
  }
}

export async function createPrevisitSession(ctx: PrevisitSessionHost): Promise<string> {
  const workspace = ctx.workspaces?.list?.getSnapshot()
  const current = ctx.sessions.list?.getSnapshot().current
  const items = workspace?.items ?? []
  const cwd = items.find(item => current !== undefined && item.sessionIds?.includes(current))?.path
    ?? items.find(item => item.workspaceId === workspace?.recentWorkspaceId)?.path
    ?? items[0]?.path
  if (!cwd) throw new Error("请先选择一个工作空间，再打开访前尽调")
  if (typeof ctx.sessions.create !== "function" || typeof ctx.sessions.open !== "function") {
    throw new Error("当前 DSH 版本没有可用的会话创建能力")
  }
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("当前浏览器不支持安全会话标识生成，请使用最新版浏览器")
  }
  const requested = PREVISIT_SESSION_ID_PREFIX + globalThis.crypto.randomUUID()
  // Preserve the runtime receiver: create() uses this.manager.
  const created = await ctx.sessions.create({ cwd, sessionId: requested })
  if (created !== requested) throw new Error("访前尽调会话标识不匹配，请重试")
  return created
}
