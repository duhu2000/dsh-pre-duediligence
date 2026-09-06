import { Button } from "@deepseek-ai/dsh-client-ui-primitives"
import { useEffect, useState } from "react"
import { createPortal } from "react-dom"

import { assertBetterSidebar, PREVISIT_WORKBENCH_TAB_ID } from "./better-sidebar.js"
import type { BetterSidebarService } from "./better-sidebar.js"
import { PrevisitLogo } from "./previsit-brand.js"
import { createPrevisitSession } from "./previsit-session.js"

const WORKSPACES_SLOT_SELECTOR = '[data-slot="sidebar.workspaces"]'
const LAUNCHER_MOUNT_SELECTOR = '[data-previsit-launcher-mount="true"]'

type SnapshotStore<T> = {
  getSnapshot(): T
}

type WorkspaceSnapshot = {
  items?: Array<{ workspaceId: string; path?: string; sessionIds?: string[] }>
  recentWorkspaceId?: string
}

type SlotsService = {
  inject(name: string, setup: () => void | (() => void)): unknown
  register<Props extends object>(
    descriptor: {
      name: string
      id: string
      order?: number
      inject?: (sessionId: string) => Record<string, unknown>
    },
    component: (props: Props) => JSX.Element | null,
  ): () => void
}

type UiWorkspaceService = {
  connectWorkspace?(workspaceId: string): Promise<string>
}

export type LeftSidebarHost = {
  slots: SlotsService
  sessions: {
    list?: SnapshotStore<{ current?: string }>
    create?(options: { cwd: string; sessionId: string }): Promise<string>
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
      aria-label="访前尽调"
      aria-busy={busy}
      disabled={busy}
      title={error ?? "打开访前尽调"}
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
      <span className="qccPrevisitLauncherContent">
        <PrevisitLogo size={18} />
        {wide ? <span>{busy ? "正在打开…" : error === undefined ? "访前尽调" : "打开失败，请重试"}</span> : null}
      </span>
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

export function registerLeftSidebarLauncher(
  ctx: LeftSidebarHost,
  service: BetterSidebarService,
): void {
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "dsh-pre-duediligence-launcher",
    order: 20,
    inject: () => ({
      openAgent: async () => {
        assertBetterSidebar(service)
        if (!service.isTabEnabled(PREVISIT_WORKBENCH_TAB_ID)) {
          throw new Error("访前尽调工作台当前不可用，请检查插件配置")
        }
        // DSH-UX-001 UX-03/UX-06：业务入口只进入 Session；工作台由输入框下方快捷按钮显式打开。
        const sessionId = await createPrevisitSession(ctx)
        ctx.sessions.open?.(sessionId)
      },
    }),
  }, LeftSidebarEntry))
}
