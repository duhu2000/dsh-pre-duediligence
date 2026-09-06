import { Button, IconAgentPresetOutline16 } from "@deepseek-ai/dsh-client-ui-primitives"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { openWorkbench, type BetterSidebarService, type RevealController } from "./better-sidebar.js"

const WORKSPACES_SLOT_SELECTOR = '[data-slot="sidebar.workspaces"]'
const LAUNCHER_MOUNT_SELECTOR = '[data-previsit-launcher-mount="true"]'

type SnapshotStore<T> = {
  getSnapshot(): T
}

type WorkspaceSnapshot = {
  items?: Array<{ workspaceId: string; sessionIds?: string[] }>
  recentWorkspaceId?: string
}

type SlotsService = {
  inject(name: string, setup: () => void | (() => void)): unknown
  register(
    descriptor: {
      name: string
      id: string
      order?: number
      inject?: () => Record<string, unknown>
    },
    component: (props: LeftSidebarEntryProps) => JSX.Element,
  ): () => void
}

type UiWorkspaceService = {
  connectWorkspace?(workspaceId: string): Promise<string>
}

export type LeftSidebarHost = {
  slots: SlotsService
  sessions: {
    list?: SnapshotStore<{ current?: string }>
    create?(options: { workspaceId: string; sessionId: string }): Promise<string>
    open?(sessionId: string): void
  }
  workspaces?: {
    list?: SnapshotStore<WorkspaceSnapshot>
    connectWorkspace?(workspaceId: string): Promise<string>
  }
  get?(name: string): unknown
}

type LeftSidebarEntryProps = {
  wide?: boolean
  openAgent?: () => Promise<void>
}

function ensureLauncherMount(): HTMLElement | null {
  const workspaceSlot = document.querySelector(WORKSPACES_SLOT_SELECTOR)
  const parent = workspaceSlot?.parentElement
  if (workspaceSlot === null || parent === undefined || parent === null) return null

  let mount = parent.querySelector<HTMLElement>(LAUNCHER_MOUNT_SELECTOR)
  if (mount === null) {
    mount = document.createElement("div")
    mount.dataset.previsitLauncherMount = "true"
  }
  if (mount.parentElement !== parent) parent.insertBefore(mount, workspaceSlot)
  return mount
}

function LeftSidebarEntry(props: LeftSidebarEntryProps): JSX.Element {
  const [mount, setMount] = useState<HTMLElement | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string>()
  const wide = props.wide !== false

  useEffect(() => {
    let disposed = false
    const ownedMounts = new Set<HTMLElement>()
    const sync = () => {
      if (disposed) return
      const next = ensureLauncherMount()
      if (next !== null) ownedMounts.add(next)
      setMount(current => current === next ? current : next)
    }
    sync()
    const observer = new MutationObserver(sync)
    observer.observe(document.body, { childList: true, subtree: true })
    return () => {
      disposed = true
      observer.disconnect()
      for (const owned of ownedMounts) owned.remove()
    }
  }, [])

  const launch = async () => {
    if (busy || props.openAgent === undefined) return
    setBusy(true)
    setError(undefined)
    try {
      await props.openAgent()
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason))
    } finally {
      setBusy(false)
    }
  }

  const button = (
    <Button
      type="button"
      variant="ghost"
      icon={<IconAgentPresetOutline16 size={16} />}
      aria-label="访前尽调智能体"
      aria-busy={busy}
      disabled={busy}
      title={error ?? "打开访前尽调智能体"}
      onClick={() => { void launch() }}
      style={{
        boxSizing: "border-box",
        width: wide ? "100%" : 36,
        height: wide ? 40 : 36,
        justifyContent: wide ? "flex-start" : "center",
        borderRadius: wide ? 10 : "50%",
        paddingInline: wide ? 10 : 0,
        whiteSpace: "nowrap",
      }}
    >
      {wide ? (busy ? "正在打开…" : error === undefined ? "访前尽调智能体" : "打开失败，请重试") : null}
    </Button>
  )

  if (mount === null) return button
  return createPortal(
    <div
      data-wide={wide}
      style={{ boxSizing: "border-box", width: wide ? "100%" : 36, paddingRight: wide ? 12 : 0 }}
    >
      {button}
    </div>,
    mount,
  )
}

const PREVISIT_SESSION_ID_PREFIX = "session-dsh-pre-duediligence-"

function createPrevisitSessionId(): string {
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("当前浏览器不支持安全会话标识生成，请使用最新版浏览器")
  }
  return `${PREVISIT_SESSION_ID_PREFIX}${globalThis.crypto.randomUUID()}`
}

async function resolveSessionId(ctx: LeftSidebarHost): Promise<string> {
  // 单一会话所有权：与招投标入口一致，显式创建带前缀的独立会话，绝不复用当前会话。
  // 若复用当前「招投标」工作台会话，访前尽调与招投标会共享同一会话，
  // 导致 Hero 标题与右侧工作台面板归属冲突（标题不刷新、面板不切换）。
  const workspace = ctx.workspaces?.list?.getSnapshot()
  const workspaceId = workspace?.recentWorkspaceId ?? workspace?.items?.[0]?.workspaceId
  if (workspaceId === undefined) {
    throw new Error("请先选择一个工作空间，再打开访前尽调智能体")
  }
  const create = ctx.sessions.create
  if (typeof create !== "function") {
    throw new Error("当前 DSH 版本没有可用的会话创建能力")
  }
  const sessionId = await create({ workspaceId, sessionId: createPrevisitSessionId() })
  ctx.sessions.open?.(sessionId)
  return sessionId
}

export function registerLeftSidebarLauncher(
  ctx: LeftSidebarHost,
  service: BetterSidebarService,
  reveal: RevealController,
): void {
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "dsh-pre-duediligence-launcher",
    order: 20,
    inject: () => ({
      openAgent: async () => {
        const sessionId = await resolveSessionId(ctx)
        if (!openWorkbench(service, { sessionId }, reveal)) {
          throw new Error("访前尽调工作台当前不可用，请检查插件配置")
        }
      },
    }),
  }, LeftSidebarEntry))
}
