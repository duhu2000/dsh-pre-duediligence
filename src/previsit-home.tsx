import { useEffect, useRef } from "react"
import { isPrevisitSession } from "./previsit-session.js"

export type PrevisitHomeProps = {
  sessionId: string
  useSession<T>(selector: (state: { composerPhase: string }) => T): T
  openWorkbench?: () => void
}

/** Local, reversible title bridge. No global locale mutation or observer. */
export function setPrevisitHeadline(anchor: HTMLElement): () => void {
  const hero = anchor.closest('[data-phase="hero"]')
  const title = hero?.querySelector<HTMLElement>('[class*="headlineText"]')
  if (!title) return () => {}
  const original = title.textContent
  const label = "访前尽调智能体"
  title.textContent = label
  return () => {
    if (title.textContent === label) title.textContent = original
  }
}

export function PrevisitHome({ sessionId, useSession, openWorkbench }: PrevisitHomeProps): JSX.Element | null {
  const blank = useSession(state => state.composerPhase === "blank")
  const enabled = blank && isPrevisitSession(sessionId)
  const anchor = useRef<HTMLElement>(null)
  useEffect(() => {
    if (!enabled || !anchor.current) return
    return setPrevisitHeadline(anchor.current)
  }, [enabled, sessionId])
  if (!enabled) return null
  return <section ref={anchor} data-previsit-home={sessionId} aria-label="访前尽调产品介绍"
    style={{ width: "100%", boxSizing: "border-box", marginBottom: 16, padding: 20, border: "1px solid var(--color-border, #dce4ec)", borderRadius: 16 }}>
    <h2 style={{ margin: "0 0 10px", fontSize: 20 }}>访前尽调智能体</h2>
    <p style={{ margin: "0 0 16px", lineHeight: 1.7 }}>拜访前看清企业经营、合作机会与风险，形成可追溯的尽调简报和沟通提纲。</p>
    <ol aria-label="访前尽调流程" style={{ display: "flex", flexWrap: "wrap", gap: 24, paddingLeft: 24, lineHeight: 1.8 }}>
      <li>尽调设定</li><li>经营研判</li><li>风险核查</li><li>尽调报告</li>
    </ol>
    <p style={{ fontSize: 13, lineHeight: 1.7 }}>在右侧填写目标企业、拜访角色和关注范围，确认后开始尽调。企查查连接及额度使用你自己的账号。</p>
    <button type="button" onClick={openWorkbench}
      style={{ cursor: "pointer", borderRadius: 8, border: "1px solid #176b68", background: "#176b68", color: "#fff", padding: "10px 18px" }}>打开尽调设定</button>
  </section>
}
