import { useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"

import { PREVISIT_LOGO_PATH, PrevisitLogo } from "../src/previsit-brand.js"
import { apply } from "../src/workbench-v2.js"
import { verifySessionIsolation } from "./session-isolation-fixture.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
document.documentElement.dataset.theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light"

type Registered = { descriptor: any; component: (props: any) => JSX.Element | null }
const registered = new Map<string, Registered>()
let workbenchComponent: ((props: any) => JSX.Element) | undefined

const conversationSnapshot = {
  running: false,
  partial: null,
  runningCalls: [],
  nodes: [],
  lastAgentError: null,
}
const conversationStore = {
  getSnapshot: () => conversationSnapshot,
  subscribe: () => () => {},
}
let sidebarState = { panelOpen: true, bottomOpen: false }
const sidebarStore = {
  getSnapshot: () => sidebarState,
  subscribe: () => () => {},
  reduce(reducer: (state: typeof sidebarState) => typeof sidebarState) { sidebarState = reducer(sidebarState) },
}

const ctx: any = {
  inject(_deps: string[], setup: (context: unknown) => unknown) { return setup(ctx) },
  effect(setup: () => unknown) { return setup() },
  slots: {
    inject(_name: string, setup: () => unknown) { return setup() },
    register(descriptor: any, component: Registered["component"]) {
      registered.set(descriptor.id, { descriptor, component })
      return () => {}
    },
  },
  sessions: {
    binding: () => ({ session: conversationStore }),
    scope: () => ({ get: () => ({ send: async () => {} }) }),
    list: { getSnapshot: () => ({ current: sessionId }) },
    create: async ({ sessionId: id }: { sessionId: string }) => id,
    open: () => {},
  },
  workspaces: {
    list: { getSnapshot: () => ({ recentWorkspaceId: "fixture", items: [{ workspaceId: "fixture", path: "/fixture", sessionIds: [sessionId] }] }) },
  },
  betterSidebar: {
    version: "0.17.1",
    features: ["targetedOpen", "stateSubscription"],
    isTabEnabled: () => true,
    openTab: () => {},
    getSnapshot: () => ({ sessionId, state: sidebarState }),
    subscribeState: () => () => {},
    registerTab(options: any) {
      workbenchComponent = options.component
      return () => {}
    },
  },
}

apply(ctx)

function useStaticInput<T>(selector: (state: { draft: string; phase: string }) => T): T {
  return selector({ draft: "", phase: "blank" })
}
function useStaticSession<T>(selector: (state: { composerPhase: string }) => T): T {
  return selector({ composerPhase: "blank" })
}

function Fixture(): JSX.Element {
  const home = registered.get("dsh-pre-duediligence:home")
  const prompt = registered.get("dsh-pre-duediligence:prompt-generator")
  if (home === undefined || prompt === undefined || workbenchComponent === undefined) {
    return <p data-fixture-error="registration">插件 UI 未完成注册</p>
  }
  const Home = home.component
  const Prompt = prompt.component
  const Workbench = workbenchComponent
  const homeInjected = home.descriptor.inject(sessionId)
  const promptInjected = prompt.descriptor.inject(sessionId)
  return (
    <main className="fixtureLayout">
      <aside className="fixtureSidebar" aria-label="测试菜单">
        <button type="button"><PrevisitLogo size={18} /><span>访前尽调</span></button>
      </aside>
      <section className="fixtureConversation" data-phase="hero">
        <div className="fixtureHeroRow">
          <span className="fixture_fishHitbox" aria-hidden="true">◇</span>
          <span className="fixture_headlineText">探索未至之境</span>
          <span>预览版</span>
        </div>
        <div data-composer-seat>
          <div className="fixtureComposerStack">
            <Home sessionId={sessionId} useSession={useStaticSession} {...homeInjected} />
            <div data-composer-card>
              <Prompt sessionId={sessionId} useInput={useStaticInput} inputActions={{ setDraft: () => {} }} {...promptInjected} />
              <textarea aria-label="DSH 原生输入框" placeholder="输入消息…" />
              <div className="fixtureNativeActions"><button type="button">模型</button><button type="button">发送</button></div>
            </div>
          </div>
        </div>
      </section>
      <aside className="fixtureWorkbench">
        <Workbench
          scope={{ sessionId }}
          visible
          store={sidebarStore}
          tab={{ id: "dsh-pre-duediligence:agent" }}
        />
      </aside>
    </main>
  )
}

void (async () => {
await verifySessionIsolation()
document.body.dataset.sessionIsolation = "true"
flushSync(() => createRoot(document.getElementById("app")!).render(<Fixture />))

window.setTimeout(() => {
  const trigger = document.querySelector<HTMLButtonElement>(".qccPromptTrigger")
  trigger?.focus()
  flushSync(() => trigger?.click())
  window.setTimeout(() => {
    const panel = document.querySelector<HTMLElement>(".qccPromptPanel")
    const backdrop = document.querySelector<HTMLElement>(".qccPromptBackdrop")
    const panelRect = panel?.getBoundingClientRect()
    const nextButtonRect = panel?.querySelector<HTMLElement>(".qccPromptActions .is-primary")?.getBoundingClientRect()
    document.body.dataset.promptOverflow = panel === null ? "missing" : getComputedStyle(panel.querySelector<HTMLElement>(".qccPromptBody")!).overflowY
    document.body.dataset.promptFixed = backdrop === null ? "missing" : getComputedStyle(backdrop).position
    document.body.dataset.promptFits = String(panelRect !== undefined && panelRect.left >= -0.5 && panelRect.right <= window.innerWidth + 0.5)
    document.body.dataset.promptActionsFit = String(nextButtonRect !== undefined && nextButtonRect.left >= 0 && nextButtonRect.right <= window.innerWidth)
    flushSync(() => panel?.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true })))
    window.setTimeout(() => {
      document.body.dataset.escapeClosed = String(document.querySelector(".qccPromptPanel") === null)
      document.body.dataset.focusRestored = String(document.activeElement === trigger)
      flushSync(() => trigger?.click())
      window.setTimeout(() => {
        const composerCard = document.querySelector<HTMLElement>("[data-composer-card]")
        const shell = document.querySelector<HTMLElement>(".qccPwShell")
        const title = document.querySelector<HTMLElement>('[data-previsit-hero-row="true"] [data-previsit-hero-title="true"]')
        document.body.dataset.brand = shell === null ? "missing" : getComputedStyle(shell).getPropertyValue("--qcc-brand").trim()
        document.body.dataset.menuPlaced = String(composerCard?.nextElementSibling?.querySelector(".qccPrevisitCapabilities") !== null)
        const capabilities = document.querySelector<HTMLElement>(".qccPrevisitCapabilities")
        const capabilityItems = [...document.querySelectorAll<HTMLElement>(".qccPrevisitCapability")]
        const firstCapability = capabilityItems[0]
        const capabilityRect = capabilities?.getBoundingClientRect()
        const firstCapabilityStyle = firstCapability === undefined ? undefined : getComputedStyle(firstCapability)
        document.body.dataset.capabilityCount = String(capabilityItems.length)
        document.body.dataset.capabilityLabels = capabilityItems.map(item => item.textContent?.trim() ?? "").join("|")
        document.body.dataset.capabilityDirection = firstCapabilityStyle?.flexDirection ?? "missing"
        document.body.dataset.capabilityMinHeight = firstCapabilityStyle?.minHeight ?? "missing"
        document.body.dataset.capabilityBorder = firstCapabilityStyle?.borderTopStyle ?? "missing"
        document.body.dataset.capabilityOverflow = capabilities === null ? "missing" : getComputedStyle(capabilities).overflowX
        document.body.dataset.capabilitySingleRow = String(capabilityItems.length > 0 && capabilityItems.every(item => Math.abs(item.getBoundingClientRect().top - capabilityItems[0].getBoundingClientRect().top) < 1))
        document.body.dataset.capabilityFitsViewport = String(capabilityRect !== undefined && capabilityRect.left >= -0.5 && capabilityRect.right <= window.innerWidth + 0.5)
        document.body.dataset.stageCount = String(document.querySelectorAll(".qccPwStage").length)
        const stages = document.querySelector<HTMLElement>(".qccPwStages")
        const firstStage = document.querySelector<HTMLElement>(".qccPwStage")
        document.body.dataset.stageDescriptionCount = String(document.querySelectorAll(".qccPwStageCopy small").length)
        document.body.dataset.stageFits = String(stages !== null && stages.scrollWidth <= stages.clientWidth + 1)
        document.body.dataset.stageDirection = firstStage === null ? "missing" : getComputedStyle(firstStage).flexDirection
        document.body.dataset.businessContainerControlCount = String(document.querySelectorAll('.qccPwClose,[aria-label="关闭访前尽调工作台"]').length)
        document.body.dataset.businessReturnControlCount = String([...document.querySelectorAll<HTMLButtonElement>(".qccPwShell button")].filter(button => button.textContent?.includes("返回会话")).length)
        document.body.dataset.logoCount = String(document.querySelectorAll(`path[d="${PREVISIT_LOGO_PATH}"]`).length)
        document.body.dataset.heroTitle = title?.textContent ?? "missing"
        document.body.dataset.noHorizontalOverflow = String(document.documentElement.scrollWidth <= window.innerWidth)
        document.body.dataset.viewportWidth = String(window.innerWidth)
        document.body.dataset.uiReady = "true"
      }, 120)
    }, 80)
  }, 120)
}, 120)
})().catch(error => { document.body.dataset.uiError = String(error) })
