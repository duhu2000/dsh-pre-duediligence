import { describe, expect, it } from "vitest"

import {
  COMPANY_PLACEHOLDER,
  EMPTY_COMPOSER_STATE,
  EMPTY_SELECTION,
  applySelection,
  composeFullSentence,
  generateFromSelection,
  serializePrevisitRequest,
  updateManualText,
  validateComposerText,
  type ComposerSelection,
} from "./composer-model.js"
import { derivePhaseStates, deriveWorkbenchStatus } from "./workbench-state.js"

const fullSelection: ComposerSelection = {
  role: "bank_rm",
  purpose: "first",
  focus: ["risk", "equity"],
  budget: "standard",
  output: "onepager",
}

describe("previsit composer contract", () => {
  it("为新任务提供可见且可取消的业务默认值", () => {
    expect(EMPTY_SELECTION).toEqual({
      role: "bank_rm",
      focus: ["risk", "equity", "finance", "contact", "ipr", "bidding"],
      budget: "fast",
      output: "onepager",
    })
    expect(composeFullSentence(EMPTY_SELECTION, "企查查科技股份有限公司")).toBe(
      "我是银行对公客户经理，准备拜访企查查科技股份有限公司，请重点看风险与涉诉、股权与实控人、经营与财务、联系人与触达路径、知识产权、招投标业绩，做一次速览尽调，输出一页纸简报。",
    )
  })

  it("uses the handoff vocabulary in the generated natural-language request", () => {
    expect(composeFullSentence(fullSelection, "浙江台华新材料集团股份有限公司")).toBe(
      "我是银行对公客户经理，准备首次拜访浙江台华新材料集团股份有限公司，请重点看风险与涉诉、股权与实控人，做一次标准尽调，输出一页纸简报。",
    )
  })

  it("keeps an explicitly empty selection available for callers", () => {
    expect(composeFullSentence({ focus: [] })).toBe("")
    expect(composeFullSentence({ focus: ["risk"] })).toContain(COMPANY_PLACEHOLDER)
  })

  it("captures a company typed only at the generated placeholder", () => {
    const generated = applySelection(EMPTY_COMPOSER_STATE, fullSelection)
    const typed = updateManualText(
      generated,
      generated.text.replace(COMPANY_PLACEHOLDER, "企查查科技股份有限公司"),
    )
    const changed = applySelection(typed, { ...fullSelection, budget: "deep" })

    expect(typed.mode).toBe("generated")
    expect(typed.lastCompany).toBe("企查查科技股份有限公司")
    expect(changed.text).toContain("企查查科技股份有限公司")
    expect(changed.text).toContain("深度尽调")
  })

  it("never overwrites free text and appends one imperative only on request", () => {
    const manual = updateManualText(EMPTY_COMPOSER_STATE, "明天去见企查查科技股份有限公司，先看合作空间。")
    const selected = applySelection(manual, fullSelection)
    const appended = generateFromSelection(selected, fullSelection)

    expect(selected.text).toBe(manual.text)
    expect(appended.text).toMatch(/^明天去见企查查科技股份有限公司/)
    expect(appended.text).toContain("请按银行对公客户经理视角")
    expect(appended.text).toContain("标准尽调")
  })

  it("preserves text explicitly appended to a generated sentence", () => {
    const generated = applySelection(EMPTY_COMPOSER_STATE, fullSelection)
    const withTail = updateManualText(generated, generated.text + "另外关注近期管理层变化。")
    const changed = applySelection(withTail, { ...fullSelection, output: "questions" })

    expect(changed.text).toContain("以当面提问清单为主的简报")
    expect(changed.text.endsWith("另外关注近期管理层变化。")).toBe(true)
  })

  it("requires the visible company placeholder to be replaced before sending", () => {
    expect(validateComposerText("")).toContain("企业")
    expect(validateComposerText("准备拜访" + COMPANY_PLACEHOLDER)).toContain("占位符")
    expect(validateComposerText("拜访企查查科技股份有限公司")).toBeUndefined()
  })

  it("serializes one user-visible text request with a traceable task id", () => {
    const prompt = serializePrevisitRequest("拜访企查查科技股份有限公司", "PV-20260902-0001")
    expect(prompt).toContain("访前任务 ID：PV-20260902-0001")
    expect(prompt).toContain("qcc-previsit-onepager Skill")
  })
})

describe("session workbench state", () => {
  it("starts empty and becomes running only from the addressed Session", () => {
    expect(deriveWorkbenchStatus({
      hasTask: false,
      running: false,
      seenRunning: false,
      lastAgentError: null,
      partial: false,
      toolNames: [],
      reportReady: false,
    })).toBe("empty")
    expect(deriveWorkbenchStatus({
      hasTask: true,
      running: true,
      seenRunning: true,
      lastAgentError: null,
      partial: false,
      toolNames: [],
      reportReady: false,
    })).toBe("running")
  })

  it("maps actual company and risk tools to the five business phases", () => {
    const phases = derivePhaseStates({
      hasTask: true,
      running: true,
      seenRunning: true,
      lastAgentError: null,
      partial: false,
      toolNames: [
        "mcp__qcc-company__get_company_profile",
        "mcp__qcc-risk__get_company_risk_scan",
      ],
      reportReady: false,
    })
    expect(phases.map(phase => phase.progress)).toEqual(["idle", "idle", "active", "idle", "idle"])
  })

  it("does not mark completion when the Session stops without a report", () => {
    const phases = derivePhaseStates({
      hasTask: true,
      running: false,
      seenRunning: true,
      lastAgentError: null,
      partial: true,
      toolNames: ["mcp__qcc-risk__get_company_risk_scan"],
      reportReady: false,
    })
    expect(deriveWorkbenchStatus({
      hasTask: true,
      running: false,
      seenRunning: true,
      lastAgentError: null,
      partial: true,
      toolNames: ["mcp__qcc-risk__get_company_risk_scan"],
      reportReady: false,
    })).toBe("waiting-agent")
    expect(phases.at(-1)?.progress).toBe("idle")
  })

  it("报告已生成时优先收敛终态，待核验阶段保留独立颜色", () => {
    const input = {
      hasTask: true, running: true, seenRunning: true, lastAgentError: null, partial: false,
      toolNames: [], reportReady: true,
      toolEvents: [
        { name: "previsit_begin", status: "done" as const },
        { name: "previsit_confirm_entity", status: "done" as const },
        { name: "mcp__qcc-company__get_company_profile", status: "unknown" as const },
        { name: "mcp__qcc-risk__get_company_risk_scan", status: "unknown" as const },
      ],
    }
    expect(deriveWorkbenchStatus(input)).toBe("ready")
    expect(derivePhaseStates(input).map(phase => phase.progress)).toEqual(["done", "done", "review", "review", "done"])
  })

  it("does not treat report completion or tool names as proof of full coverage", () => {
    const phases = derivePhaseStates({
      hasTask: true,
      running: false,
      seenRunning: true,
      lastAgentError: null,
      partial: true,
      toolNames: ["mcp__qcc-risk__get_company_risk_scan"],
      reportReady: true,
    })
    expect(phases).toHaveLength(5)
    expect(phases.map(p => p.progress)).toEqual(["idle", "idle", "idle", "idle", "done"])
  })
})

describe("企业名回填", () => {
  it("表单里填的企业名替换占位符；占位符本身不会被当成企业名", () => {
    const generated = applySelection(EMPTY_COMPOSER_STATE, { focus: ["finance"], role: "bank_rm" })
    expect(generated.text).toContain(COMPANY_PLACEHOLDER)
    // 输入框内容未动（仍含占位符），此时从表单传入企业名
    const withCompany = applySelection({ ...generated, lastCompany: "中微半导体（深圳）股份有限公司" }, { focus: ["finance"], role: "bank_rm" }, "中微半导体（深圳）股份有限公司")
    expect(withCompany.text).toContain("准备拜访中微半导体（深圳）股份有限公司")
    expect(withCompany.text).not.toContain(COMPANY_PLACEHOLDER)
    // 再改一个条件，企业名保留
    const more = applySelection(withCompany, { focus: ["finance"], role: "bank_rm", budget: "standard" }, "中微半导体（深圳）股份有限公司")
    expect(more.text).toContain("中微半导体（深圳）股份有限公司")
    expect(more.text).toContain("标准尽调")
  })
})
