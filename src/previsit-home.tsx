import { useEffect, useRef, useState, type ReactNode } from "react"
import { createPortal } from "react-dom"

import { PREVISIT_LOGO_PATH } from "./previsit-brand.js"
import { isPrevisitSession } from "./previsit-session.js"
import type { PrevisitView } from "./previsit-store.js"

export const PREVISIT_HOME_TITLE = "访前尽调一页纸智能体"
export const PREVISIT_HOME_SUMMARY = "明确拜访对象与目标，核验企业信息并准备访前材料。"

export type PrevisitHomeProps = {
  sessionId: string
  useSession<T>(selector: (state: { composerPhase: string }) => T): T
  openWorkbench?: (view?: PrevisitView) => void
}

export const PREVISIT_HOME_FLOWS: ReadonlyArray<{ view: PrevisitView; label: string; icon: ReactNode }> = [
  { view: "target", label: "对象与目标", icon: <><circle cx="10.5" cy="10.5" r="5.5" /><path d="m15 15 4 4M10.5 7.5v6M7.5 10.5h6" /></> },
  { view: "scope", label: "范围确认", icon: <><path d="M4 5h16l-6 7v6l-4 2v-8z" /></> },
  { view: "collect", label: "资料采集", icon: <><path d="M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" /></> },
  { view: "verify", label: "证据核验", icon: <><path d="M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" /><path d="M12 8v5M12 17h.01" /></> },
  { view: "history", label: "任务历史", icon: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></> },
]

function CapabilityIcon({ children }: { children: ReactNode }): JSX.Element {
  return <svg viewBox="0 0 24 24" aria-hidden="true">{children}</svg>
}

function CapabilityBar(props: { onNavigate(view: PrevisitView): void }): JSX.Element {
  return (
    <nav className="qccPrevisitCapabilities" aria-label="访前尽调能力菜单">
      {PREVISIT_HOME_FLOWS.map(item => (
        <button key={item.view} type="button" className="qccPrevisitCapability" aria-label={item.label} title={item.label} onClick={() => props.onNavigate(item.view)}>
          <CapabilityIcon>{item.icon}</CapabilityIcon>
          <span className="qccPrevisitCapabilityLabel">{item.label}</span>
        </button>
      ))}
    </nav>
  )
}

/** 只新增自有容器，将能力菜单放到原生 composer 外部下方，不移动宿主 DOM。 */
export function installCapabilityMount(marker: HTMLElement, onMount: (mount: HTMLElement | null) => void): () => void {
  const owned = new Set<HTMLElement>()
  const sync = () => {
    const seat = marker.closest<HTMLElement>("[data-composer-seat]")
    const card = seat?.querySelector<HTMLElement>("[data-composer-card]")
    if (seat === null || seat === undefined || card === null || card === undefined) {
      onMount(null)
      return
    }
    let branch = card
    while (branch.parentElement !== null && branch.parentElement !== seat && !branch.parentElement.contains(marker)) {
      branch = branch.parentElement
    }
    const parent = branch.parentElement
    if (parent === null || !parent.contains(marker) || branch.contains(marker)) {
      onMount(null)
      return
    }
    let mount = [...owned].find(node => node.parentElement === parent)
    if (mount === undefined) {
      for (const node of owned) node.remove()
      owned.clear()
      mount = document.createElement("div")
      mount.className = "qccPrevisitCapabilityMount"
      mount.dataset.previsitOwned = "true"
      owned.add(mount)
    }
    if (branch.nextSibling !== mount) parent.insertBefore(mount, branch.nextSibling)
    onMount(mount)
  }
  sync()
  const observer = typeof MutationObserver === "function" ? new MutationObserver(sync) : null
  observer?.observe(marker.closest("[data-composer-seat]") ?? marker, { childList: true, subtree: true })
  return () => {
    observer?.disconnect()
    for (const node of owned) node.remove()
  }
}

type HeroChrome = { scope: HTMLElement; title: HTMLElement }

/**
 * 新版 Host 会把 list slot 挂在 composer seat 的独立分支，marker 不再一定是
 * `[data-phase="hero"]` 的后代。优先沿用旧结构，再向上寻找同时包含原生输入区与标题的最小祖先。
 */
export function resolvePrevisitHeroChrome(anchor: HTMLElement): HeroChrome | null {
  const direct = anchor.closest<HTMLElement>('[data-phase="hero"]')
  const findTitle = (scope: HTMLElement): HTMLElement | null => {
    const spans = [...scope.querySelectorAll<HTMLElement>("span")]
    return spans.find(node => node.dataset.previsitHeroTitle === "true")
      ?? spans.find(node => ["探索未至之境", "Into the Unknown"].includes(node.textContent?.trim() ?? ""))
      ?? scope.querySelector<HTMLElement>('[class*="headlineText"]')
  }
  if (direct !== null) {
    const title = findTitle(direct)
    if (title !== null) return { scope: direct, title }
  }
  let scope = anchor.closest<HTMLElement>("[data-composer-seat]") ?? anchor.parentElement
  while (scope !== null) {
    const title = findTitle(scope)
    if (title !== null) return { scope, title }
    scope = scope.parentElement
  }
  return null
}

/** DSH 暂未公开会话级 Hero 标题槽位，因此仅在本插件空白会话内做可逆桥接。 */
export function setPrevisitHeadline(anchor: HTMLElement): () => void {
  const originalTitles = new Map<HTMLElement, string | null>()
  const originalMarks = new Map<HTMLElement, string>()
  const originalBadges = new Map<HTMLElement, string>()
  const originalRows = new Map<HTMLElement, string | null>()
  const logos = new Map<HTMLElement, HTMLElement>()
  let observer: MutationObserver | null = null

  const sync = () => {
    const chrome = resolvePrevisitHeroChrome(anchor)
    if (chrome === null) return
    const { scope, title } = chrome
    if (!originalTitles.has(title)) originalTitles.set(title, title.textContent)
    title.dataset.previsitHeroTitle = "true"
    if (title.textContent !== PREVISIT_HOME_TITLE) title.textContent = PREVISIT_HOME_TITLE

    const row = title.parentElement
    const nativeMark = row?.querySelector<HTMLElement>('[class*="fishHitbox"]')
    if (row !== null && row !== undefined && nativeMark !== null && nativeMark !== undefined && typeof document !== "undefined") {
      if (!originalRows.has(row)) originalRows.set(row, row.getAttribute("data-previsit-hero-row"))
      if (!originalMarks.has(nativeMark)) originalMarks.set(nativeMark, nativeMark.style.display)
      nativeMark.style.display = "none"
      row.dataset.previsitHeroRow = "true"
      if (!logos.get(row)?.isConnected) {
        const logo = document.createElement("span")
        logo.className = "qccPrevisitHeroLogo"
        logo.dataset.previsitOwned = "true"
        logo.setAttribute("aria-hidden", "true")
        logo.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="${PREVISIT_LOGO_PATH}"></path></svg>`
        row.insertBefore(logo, title)
        logos.set(row, logo)
      }
    }

    const badge = [...scope.querySelectorAll<HTMLElement>("span")]
      .find(node => node.dataset.previsitHeroBadge === "true" || ["预览版", "Preview"].includes(node.textContent?.trim() ?? ""))
    if (badge !== undefined) {
      if (!originalBadges.has(badge)) originalBadges.set(badge, badge.style.display)
      badge.dataset.previsitHeroBadge = "true"
      badge.style.display = "none"
    }
  }

  sync()
  const observationRoot = resolvePrevisitHeroChrome(anchor)?.scope
    ?? (typeof document === "undefined" ? null : document.body)
    ?? anchor.parentElement
  observer = typeof MutationObserver === "function" ? new MutationObserver(sync) : null
  if (observationRoot !== null) observer?.observe(observationRoot, { childList: true, subtree: true })

  return () => {
    observer?.disconnect()
    for (const logo of logos.values()) logo.remove()
    for (const [mark, display] of originalMarks) mark.style.display = display
    for (const [badge, display] of originalBadges) {
      badge.style.display = display
      delete badge.dataset.previsitHeroBadge
    }
    for (const [row, flag] of originalRows) {
      if (flag === null) row.removeAttribute("data-previsit-hero-row")
      else row.setAttribute("data-previsit-hero-row", flag)
    }
    for (const [title, text] of originalTitles) {
      if (title.textContent === PREVISIT_HOME_TITLE) title.textContent = text
      delete title.dataset.previsitHeroTitle
    }
  }
}

export function PrevisitHome({ sessionId, useSession, openWorkbench }: PrevisitHomeProps): JSX.Element | null {
  const blank = useSession(state => state.composerPhase === "blank")
  const enabled = isPrevisitSession(sessionId)
  const marker = useRef<HTMLDivElement>(null)
  const [menuMount, setMenuMount] = useState<HTMLElement | null>(null)
  const [error, setError] = useState<string>()
  useEffect(() => { setError(undefined) }, [sessionId])

  useEffect(() => {
    if (!enabled || marker.current === null) return
    return installCapabilityMount(marker.current, mount => setMenuMount(current => current === mount ? current : mount))
  }, [enabled, sessionId, blank])

  useEffect(() => {
    if (!enabled || !blank || marker.current === null) return
    return setPrevisitHeadline(marker.current)
  }, [enabled, blank, sessionId])

  if (!enabled) return null
  const menu = <CapabilityBar onNavigate={view => {
    try { openWorkbench?.(view); setError(undefined) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "工作台暂不可用，请检查插件配置。") }
  }} />
  return (
    <div ref={marker} className={`qccPrevisitExperience${blank ? " is-home" : ""}`} data-session-id={sessionId}>
      {menuMount === null ? menu : createPortal(menu, menuMount)}
      {blank ? <p className="qccPrevisitHomeSummary">{PREVISIT_HOME_SUMMARY}</p> : null}
      {error === undefined ? null : <p role="status">{error}</p>}
    </div>
  )
}
