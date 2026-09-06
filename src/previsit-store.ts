// 会话级共享状态：输入框上方的“尽调设定条”与右侧工作台共用同一份选择、企业名与任务。
import { EMPTY_COMPOSER_STATE, EMPTY_SELECTION, type ComposerSelection, type ComposerState } from "./composer-model.js"

export type ActiveTask = {
  id: string
  prompt: string
  createdAt: string
  nodeBaseline: number
  seenRunning: boolean
  selection: ComposerSelection
}

export type DiligenceMode = "previsit" | "onboarding" | "transaction" | "ongoing"

export type PrevisitView = "target" | "scope" | "collect" | "verify" | "output" | "history"

export type PrevisitSessionState = {
  selection: ComposerSelection
  company: string
  composer: ComposerState
  task: ActiveTask | undefined
  // 输入框下方选中的尽调类型；null = 未选，输入框上方不出现提示词生成条
  panel: DiligenceMode | null
  // 工作台的业务视图。菜单只负责导航，不代表对应阶段已经执行完成。
  view: PrevisitView
  // 用户点击“新的尽调”后忽略旧任务，避免会话快照立即把它重新认领回来。
  dismissedTaskIds: string[]
}

export const EMPTY_SESSION_STATE: PrevisitSessionState = {
  selection: EMPTY_SELECTION,
  company: "",
  composer: EMPTY_COMPOSER_STATE,
  task: undefined,
  panel: null,
  view: "target",
  dismissedTaskIds: [],
}

export type PrevisitStore = {
  get(sessionId: string): PrevisitSessionState
  update(sessionId: string, fn: (state: PrevisitSessionState) => PrevisitSessionState): void
  subscribe(listener: () => void): () => void
}

export function createPrevisitStore(): PrevisitStore {
  const states = new Map<string, PrevisitSessionState>()
  const listeners = new Set<() => void>()
  return {
    get(sessionId) {
      return states.get(sessionId) ?? EMPTY_SESSION_STATE
    },
    update(sessionId, fn) {
      const next = fn(states.get(sessionId) ?? EMPTY_SESSION_STATE)
      states.set(sessionId, next)
      for (const listener of listeners) listener()
    },
    subscribe(listener) {
      listeners.add(listener)
      return () => { listeners.delete(listener) }
    },
  }
}

// 选择摘要：给折叠态的一行小标签用
export function summarizeSelection(state: PrevisitSessionState, labels: {
  role: (id: string) => string | undefined
  purpose: (id: string) => string | undefined
  focus: (id: string) => string | undefined
  budget: (id: string) => string | undefined
  output: (id: string) => string | undefined
}): string[] {
  const s = state.selection
  const out: string[] = []
  if (state.company.trim() !== "") out.push(state.company.trim())
  const role = s.role === undefined ? undefined : labels.role(s.role)
  if (role !== undefined) out.push(role)
  const purpose = s.purpose === undefined ? undefined : labels.purpose(s.purpose)
  if (purpose !== undefined) out.push(purpose)
  if (s.focus.length > 0) out.push("关注 " + s.focus.map(labels.focus).filter(Boolean).join("、"))
  const budget = s.budget === undefined ? undefined : labels.budget(s.budget)
  if (budget !== undefined) out.push(budget)
  const output = s.output === undefined ? undefined : labels.output(s.output)
  if (output !== undefined) out.push(output)
  return out
}
