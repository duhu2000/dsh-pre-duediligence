import { useSyncExternalStore } from "react"
import { createRoot } from "react-dom/client"
import { flushSync } from "react-dom"

import { PREVISIT_LOGO_PATH, PrevisitLogo } from "../src/previsit-brand.js"
import { apply } from "../src/workbench-v2.js"
import { verifySessionIsolation } from "./session-isolation-fixture.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
document.documentElement.dataset.theme = new URLSearchParams(location.search).get("theme") === "dark" ? "dark" : "light"

const historyTasks = [
  {
    id: "PVT-11111111-1111-4111-8111-111111111111", schemaVersion: 1, revision: 2,
    sessionId: "session-dsh-pre-duediligence-aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
    workspace: "/fixture/这是一个用于验证窄屏截断行为的历史工作空间路径",
    query: "历史企业甲", depth: "fast", limit: 0, used: 3, state: "completed", stage: "output", runs: [], reportReady: true,
    createdAt: "2026-09-12T08:00:00.000Z", updatedAt: "2026-09-12T08:03:00.000Z", completedAt: "2026-09-12T08:03:00.000Z",
  },
  {
    id: "PVT-22222222-2222-4222-8222-222222222222", schemaVersion: 1, revision: 1,
    sessionId: "", workspace: "", query: "旧版历史企业", depth: "standard", limit: 0, used: 0, state: "partial", stage: "output", runs: [], reportReady: true,
    createdAt: "2026-09-11T08:00:00.000Z", updatedAt: "2026-09-11T08:03:00.000Z", completedAt: "2026-09-11T08:03:00.000Z",
  },
]
globalThis.fetch = (async (input) => {
  const url = String(input)
  const detail = historyTasks.find(task => url.includes(`/previsit/api/tasks/${encodeURIComponent(task.id)}?sessionId=`))
  if (detail !== undefined) {
    return new Response(JSON.stringify({
      ok: true,
      task: {
        ...detail,
        runs: [{ id: "scan", dimension: "risk_scan", status: "done", quotaUsed: true, startedAt: detail.createdAt, completedAt: detail.completedAt, result: { summary: "合成扫描摘要", facts: [], factors: [{ name: "合成风险因子", count: 12 }] } }],
        artifact: { id: "history-report", format: "html", fileName: "历史企业甲访前报告.html", mediaType: "text/html; charset=utf-8", createdAt: detail.completedAt },
        reportMarkdown: "# 访前尽调报告 · 历史企业甲\n## 1、核心研判\n历史报告正文",
      },
    }), { status: 200, headers: { "content-type": "application/json" } })
  }
  const tasks = url.includes("?sessionId=") ? [] : historyTasks
  return new Response(JSON.stringify({ ok: true, tasks }), { status: 200, headers: { "content-type": "application/json" } })
}) as typeof fetch

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
let nativeDraft = "原生草稿保持不变"
let nativeDraftWrites = 0
let conversationSends = 0
const sessionInput = {
  state: { getSnapshot: () => ({ draft: nativeDraft, phase: "blank" }), subscribe: () => () => {} },
  setDraft(text: string) { nativeDraft = text; nativeDraftWrites += 1 },
}
const conversation = {
  send: async () => { conversationSends += 1 },
  input: { for: () => sessionInput },
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
    scope: () => ({ get: (name: string) => name === "conversation" ? conversation : undefined }),
    list: { getSnapshot: () => ({ current: sessionId }) },
    create: async ({ workspaceId, sessionId: id }: { workspaceId: string; sessionId: string }) => {
      if (workspaceId !== "fixture") throw new Error("fixture Session 未归属当前 Workspace")
      return id
    },
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
function useStaticSession<T>(selector: (state: { blank: boolean; running: boolean; promptAttempted: boolean }) => T): T {
  return selector({ blank: true, running: false, promptAttempted: false })
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
        <div className="fixtureNativeOptions"><button type="button">workspace</button><button type="button">标准模式</button></div>
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
        const draft = composerCard?.querySelector<HTMLTextAreaElement>("textarea")
        const triggerRect = trigger?.getBoundingClientRect()
        const draftRect = draft?.getBoundingClientRect()
        document.body.dataset.promptClearOfDraft = String(triggerRect !== undefined && draftRect !== undefined && triggerRect.bottom <= draftRect.top)
        document.body.dataset.composerPaddingTop = composerCard === null || composerCard === undefined ? "missing" : getComputedStyle(composerCard).paddingTop
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
        const companyInput = document.querySelector<HTMLInputElement>(".qccPwShell .qccDockCompany")
        document.body.dataset.companyLabel = companyInput?.closest(".qccDockRow")?.querySelector(".qccDockLabel")?.textContent?.trim() ?? "missing"
        document.body.dataset.defaultSelections = [...document.querySelectorAll<HTMLElement>('.qccPwShell .qccDockChip[data-selected="true"]')].map(item => item.textContent?.trim() ?? "").join("|")
        const inputSetter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, "value")?.set
        if (companyInput !== null && inputSetter !== undefined) {
          companyInput.focus()
          flushSync(() => {
            inputSetter.call(companyInput, "苏州")
            companyInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }))
          })
          flushSync(() => {
            inputSetter.call(companyInput, "苏州恒琪")
            companyInput.dispatchEvent(new Event("input", { bubbles: true, composed: true }))
          })
        }
        document.body.dataset.companyTypingLocal = String(companyInput?.value === "苏州恒琪" && nativeDraft === "原生草稿保持不变" && nativeDraftWrites === 0)
        document.body.dataset.companyFocusRetained = String(document.activeElement === companyInput)
        document.body.dataset.companyTypingDidNotSend = String(conversationSends === 0)
        let leakedCompanyEnter = 0
        const countCompanyEnter = () => { leakedCompanyEnter += 1 }
        document.addEventListener("keydown", countCompanyEnter)
        const companyEnter = new KeyboardEvent("keydown", { key: "Enter", bubbles: true, cancelable: true, composed: true })
        flushSync(() => companyInput?.dispatchEvent(companyEnter))
        document.removeEventListener("keydown", countCompanyEnter)
        document.body.dataset.companyEnterIsolated = String(companyInput !== null && leakedCompanyEnter === 0 && companyEnter.defaultPrevented)
        document.body.dataset.logoCount = String(document.querySelectorAll(`path[d="${PREVISIT_LOGO_PATH}"]`).length)
        document.body.dataset.heroTitle = title?.textContent ?? "missing"
        document.body.dataset.homeSubtitleCount = String(document.querySelectorAll(".qccPrevisitHomeSummary").length)
        const nativeOptions = document.querySelector(".fixtureNativeOptions")
        const input = document.querySelector("[data-composer-card]")
        document.body.dataset.homeOrder = String(Boolean(title && nativeOptions && input
          && (title.compareDocumentPosition(nativeOptions) & Node.DOCUMENT_POSITION_FOLLOWING)
          && (nativeOptions.compareDocumentPosition(input) & Node.DOCUMENT_POSITION_FOLLOWING)))
        const historyButton = [...document.querySelectorAll<HTMLButtonElement>(".qccPwTabs button")].find(button => button.textContent?.trim() === "任务历史")
        flushSync(() => historyButton?.click())
        window.setTimeout(() => {
          const sources = [...document.querySelectorAll<HTMLElement>(".qccPwHistorySource")]
          const sourceRights = sources.map(source => Math.round(source.getBoundingClientRect().right * 10) / 10)
          document.body.dataset.historyCount = String(sources.length)
          document.body.dataset.historyOriginMissing = String(sources.some(source => source.textContent?.includes("Workspace 未记录（旧记录） · Session 未记录（旧记录）")))
          document.body.dataset.historyFits = String(sources.length === 2 && sources.every(source => source.getBoundingClientRect().right <= window.innerWidth + 0.5))
          document.body.dataset.historyMetrics = `${sourceRights.join("|")}/${window.innerWidth}`
          const historyCard = document.querySelector<HTMLButtonElement>(".qccPwHistoryCard:not(:disabled)")
          document.body.dataset.historyNavHidden = String(document.querySelector(".qccPwStages") === null)
          flushSync(() => historyCard?.click())
          window.setTimeout(() => {
            const detailHeading = [...document.querySelectorAll<HTMLElement>(".qccPwPageHeading h2")].find(node => node.textContent === "历史企业甲")
            const download = [...document.querySelectorAll<HTMLButtonElement>(".qccPwHistoryActions button")].find(button => button.textContent?.includes("下载报告"))
            document.body.dataset.historyDetail = String(detailHeading !== undefined)
            document.body.dataset.historyDownload = String(download !== undefined && !download.disabled)
            document.body.dataset.historyContinuation = String(document.querySelector('[aria-label="补充尽调要求"]') !== null && [...document.querySelectorAll<HTMLButtonElement>("button")].some(button => button.textContent === "创建补充任务" && button.disabled))
            document.body.dataset.historyVersions = String(document.querySelector('[aria-label="报告版本记录"]')?.textContent?.includes("V1") === true)
            const historyStage = [...document.querySelectorAll<HTMLButtonElement>('[aria-label="历史任务阶段"] button')].find(button => button.textContent?.includes("证据核验"))
            flushSync(() => historyStage?.click())
            document.body.dataset.historyStageReview = String(document.querySelector('.qccPwTabs [data-selected="true"]')?.textContent === "任务历史" && document.querySelector(".qccPwBody")?.textContent?.includes("合成风险因子") === true)
            document.body.dataset.historyRiskHighlight = String(document.querySelector('.qccPwRiskTile[data-level="关注"]')?.textContent?.includes("12") === true)
            const back = [...document.querySelectorAll<HTMLButtonElement>(".qccPwHistoryHeading button")].find(button => button.textContent?.includes("返回清单"))
            flushSync(() => back?.click())
            document.body.dataset.historyBack = String(document.querySelectorAll(".qccPwHistoryCard").length === 2)
            document.body.dataset.noHorizontalOverflow = String(document.documentElement.scrollWidth <= window.innerWidth)
            document.body.dataset.viewportWidth = String(window.innerWidth)
            document.body.dataset.uiReady = "true"
          }, 100)
        }, 120)
      }, 120)
    }, 80)
  }, 120)
}, 120)
})().catch(error => { document.body.dataset.uiError = String(error) })
