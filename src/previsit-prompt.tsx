import { useEffect, useRef, useState, type Dispatch, type ReactNode, type SetStateAction } from "react"
import { createPortal } from "react-dom"

import {
  BUDGET_OPTIONS,
  FOCUS_OPTIONS,
  OUTPUT_OPTIONS,
  PURPOSE_OPTIONS,
  ROLE_OPTIONS,
  composeFullSentence,
  type ComposerOption,
  type ComposerSelection,
} from "./composer-model.js"
import { writeComposerDraft } from "./previsit-dock.js"
import { isPrevisitSession } from "./previsit-session.js"
import type { PrevisitStore } from "./previsit-store.js"

type InputStateLike = { draft: string; phase?: string }
type DraftActions = { setDraft(text: string): void }

export type PrevisitPromptProps = {
  sessionId: string
  useInput<S>(selector: (state: InputStateLike) => S): S
  inputActions?: DraftActions
  store: PrevisitStore
}

export type DraftMergeMode = "replace" | "append"

export function mergePromptDraft(existing: string, generated: string, mode: DraftMergeMode): string {
  if (mode === "replace" || existing.trim() === "") return generated
  const separator = existing.endsWith("\n") ? "" : "\n"
  return existing + separator + generated
}

function cloneSelection(selection: ComposerSelection): ComposerSelection {
  return { ...selection, focus: [...selection.focus] }
}

function PromptDialog(props: { sessionId: string; onClose(): void; children: ReactNode }): JSX.Element {
  const panelRef = useRef<HTMLElement>(null)
  const closeRef = useRef(props.onClose)
  closeRef.current = props.onClose
  useEffect(() => {
    const panel = panelRef.current
    if (panel === null) return
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null
    const focusable = () => [...panel.querySelectorAll<HTMLElement>('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')]
      .filter(node => node.getClientRects().length > 0)
    ;(focusable()[0] ?? panel).focus()
    const keydown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault()
        event.stopPropagation()
        closeRef.current()
        return
      }
      if (event.key !== "Tab") return
      const nodes = focusable()
      const first = nodes[0] ?? panel
      const last = nodes[nodes.length - 1] ?? panel
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault()
        first.focus()
      }
    }
    panel.addEventListener("keydown", keydown)
    return () => {
      panel.removeEventListener("keydown", keydown)
      if (panel.contains(document.activeElement) && previous?.isConnected) previous.focus()
    }
  }, [props.sessionId])

  const dialog = (
    <div className="qccPromptBackdrop">
      <section ref={panelRef} className="qccPromptPanel" role="dialog" aria-modal="true" aria-label="访前尽调提示词生成器" data-session-id={props.sessionId} tabIndex={-1}>
        {props.children}
      </section>
    </div>
  )
  return typeof document !== "undefined" && document.body !== null ? createPortal(dialog, document.body) : dialog
}

function OptionGroup(props: {
  title: string
  options: readonly ComposerOption[]
  selected: readonly string[]
  multiple?: boolean
  onChange(next: string[]): void
}): JSX.Element {
  const toggle = (id: string) => {
    if (props.multiple === true) {
      props.onChange(props.selected.includes(id) ? props.selected.filter(item => item !== id) : [...props.selected, id])
      return
    }
    props.onChange(props.selected.includes(id) ? [] : [id])
  }
  return (
    <fieldset className="qccPromptGroup">
      <legend>{props.title}</legend>
      <div className="qccPromptChoices">
        {props.options.map(option => (
          <label key={option.id} className="qccPromptChoice" data-selected={props.selected.includes(option.id)}>
            <input type={props.multiple === true ? "checkbox" : "radio"} name={props.multiple === true ? undefined : props.title} checked={props.selected.includes(option.id)} onChange={() => toggle(option.id)} />
            <span>{option.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

function setSingle(setSelection: Dispatch<SetStateAction<ComposerSelection>>, key: "role" | "purpose" | "budget" | "output", values: string[]): void {
  setSelection(current => {
    const next = { ...current }
    const value = values[0]
    if (value === undefined) delete next[key]
    else next[key] = value
    return next
  })
}

export function PrevisitPromptGenerator(props: PrevisitPromptProps): JSX.Element | null {
  const enabled = isPrevisitSession(props.sessionId)
  const draft = props.useInput(state => state.draft)
  const phase = props.useInput(state => state.phase)
  const [open, setOpen] = useState(false)
  const [step, setStep] = useState(1)
  const [company, setCompany] = useState("")
  const [selection, setSelection] = useState<ComposerSelection>({ focus: [] })
  const [initializedSession, setInitializedSession] = useState<string>()
  const [error, setError] = useState<string>()
  const [conflict, setConflict] = useState(false)
  const triggerRef = useRef<HTMLButtonElement>(null)
  const previousSession = useRef(props.sessionId)
  useEffect(() => {
    if (previousSession.current === props.sessionId) return
    previousSession.current = props.sessionId
    setOpen(false); setConflict(false); setError(undefined)
  }, [props.sessionId])

  if (!enabled) return null

  const openWizard = () => {
    if (initializedSession !== props.sessionId) {
      setStep(1)
      const stored = props.store.get(props.sessionId)
      setCompany(stored.company)
      setSelection(cloneSelection(stored.selection))
      setInitializedSession(props.sessionId)
    }
    setError(undefined)
    setConflict(false)
    setOpen(true)
  }
  const close = () => {
    setOpen(false)
    window.setTimeout(() => triggerRef.current?.focus(), 0)
  }
  const generated = composeFullSentence(selection, company)

  const commit = (mode: DraftMergeMode) => {
    if (props.inputActions === undefined) {
      setError("当前会话输入框尚未就绪，请稍后重试。")
      return
    }
    if (phase === "submitting" || phase === "adjudicating") {
      setError("当前对话正在提交，请等待完成后再回填。你的选择已保留。")
      return
    }
    const next = mergePromptDraft(draft, generated, mode)
    try { writeComposerDraft(props.inputActions, next) }
    catch { setError("当前会话输入框无法回填，请稍后重试。"); return }
    props.store.update(props.sessionId, state => ({
      ...state,
      company: company.trim(),
      selection: cloneSelection(selection),
      composer: {
        text: next,
        lastGenerated: generated,
        lastCompany: company.trim(),
        mode: mode === "append" && draft.trim() !== "" ? "manual" : "generated",
      },
    }))
    setOpen(false)
    setConflict(false)
  }

  const confirm = () => {
    if (company.trim() === "") {
      setError("请先填写企业全称、简称或统一社会信用代码。")
      setStep(1)
      return
    }
    if (generated.trim() === "") {
      setError("请至少填写企业信息。")
      return
    }
    if (draft.trim() !== "" && draft.trim() !== generated.trim()) {
      setConflict(true)
      return
    }
    commit("replace")
  }

  const next = () => {
    if (step === 1 && company.trim() === "") {
      setError("请先填写企业全称、简称或统一社会信用代码。")
      return
    }
    setError(undefined)
    if (step < 4) setStep(current => current + 1)
    else confirm()
  }

  return (
    <div className="qccPromptLayer">
      <button ref={triggerRef} type="button" className="qccPromptTrigger" aria-label="打开访前尽调提示词生成器" aria-expanded={open} onClick={openWizard}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM6 14l.8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8zM18 13l.7 1.8 1.8.7-1.8.7L18 18l-.7-1.8-1.8-.7 1.8-.7z" /></svg>
        <span>提示词生成</span>
      </button>
      {open && initializedSession === props.sessionId ? (
        <PromptDialog sessionId={props.sessionId} onClose={close}>
          <header className="qccPromptHead">
            <div><h3>生成访前尽调任务</h3><p>四步明确对象、场景、范围和输出；回填后仍可人工修改。</p></div>
            <button type="button" className="qccPromptClose" aria-label="关闭提示词生成器" onClick={close}>×</button>
          </header>
          <div className="qccPromptBody">
            <nav className="qccPromptSteps" aria-label="任务设置步骤">
              {[[1, "拜访对象"], [2, "角色场景"], [3, "范围深度"], [4, "确认输出"]].map(([index, label]) => (
                <button key={index} type="button" data-active={step === index} aria-current={step === index ? "step" : undefined} onClick={() => setStep(Number(index))}>
                  <b>{index}</b><span>{label}</span>
                </button>
              ))}
            </nav>
            {step === 1 ? (
              <section className="qccPromptPane">
                <h4>明确唯一法律实体</h4>
                <p>可填写企业全称、简称或统一社会信用代码；简称存在多候选时，智能体会在会话中请你确认。</p>
                <label className="qccPromptField"><span>企业名称 / 信用代码</span><input autoFocus value={company} placeholder="例如：企查查科技股份有限公司" onChange={event => setCompany(event.target.value)} /></label>
              </section>
            ) : null}
            {step === 2 ? (
              <section className="qccPromptPane">
                <h4>说明你的角色和拜访场景</h4>
                <p>未选择时由 Skill 使用通用视角，不在前端暗设默认值。</p>
                <OptionGroup title="我的角色" options={ROLE_OPTIONS} selected={selection.role === undefined ? [] : [selection.role]} onChange={values => setSingle(setSelection, "role", values)} />
                <OptionGroup title="拜访场景" options={PURPOSE_OPTIONS} selected={selection.purpose === undefined ? [] : [selection.purpose]} onChange={values => setSingle(setSelection, "purpose", values)} />
              </section>
            ) : null}
            {step === 3 ? (
              <section className="qccPromptPane">
                <h4>选择关注范围与尽调深度</h4>
                <p>菜单与阶段只负责导航；真实覆盖范围以本次会话中的工具调用和报告披露为准。</p>
                <OptionGroup title="重点关注" options={FOCUS_OPTIONS} multiple selected={selection.focus} onChange={values => setSelection(current => ({ ...current, focus: values }))} />
                <OptionGroup title="尽调深度" options={BUDGET_OPTIONS} selected={selection.budget === undefined ? [] : [selection.budget]} onChange={values => setSingle(setSelection, "budget", values)} />
              </section>
            ) : null}
            {step === 4 ? (
              <section className="qccPromptPane">
                <h4>确认任务描述和输出</h4>
                <OptionGroup title="输出形态" options={OUTPUT_OPTIONS} selected={selection.output === undefined ? [] : [selection.output]} onChange={values => setSingle(setSelection, "output", values)} />
                <pre className="qccPromptPreview">{generated || "填写企业后将在这里生成任务描述。"}</pre>
                <p className="qccPromptNote">回填不会启动尽调。只有点击 DSH 原生发送按钮后，智能体才会使用当前用户自己的企查查 MCP 连接与额度。</p>
              </section>
            ) : null}
            {conflict ? (
              <div className="qccPromptConflict" role="alertdialog" aria-label="处理已有输入内容">
                <strong>输入框已有内容</strong><p>请选择替换原文、追加任务描述，或取消并保留当前内容。</p>
                <div><button type="button" onClick={() => setConflict(false)}>取消</button><button type="button" onClick={() => commit("append")}>追加</button><button type="button" className="is-primary" onClick={() => commit("replace")}>替换</button></div>
              </div>
            ) : null}
            {error === undefined ? null : <p className="qccPromptError" role="alert">{error}</p>}
          </div>
          <footer className="qccPromptActions">
            <button type="button" disabled={step === 1} onClick={() => { setError(undefined); setConflict(false); setStep(current => Math.max(1, current - 1)) }}>上一步</button>
            <button type="button" className="is-primary" onClick={next}>{step === 4 ? "回填到对话框" : "下一步"}</button>
          </footer>
        </PromptDialog>
      ) : null}
    </div>
  )
}
