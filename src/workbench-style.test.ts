import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"

import { WORKBENCH_CSS } from "./workbench-style.js"

const workbenchSource = readFileSync(new URL("workbench-v2.tsx", import.meta.url), "utf8")

describe("访前工作台企查查蓝主题", () => {
  it("包含 DSH-UX-001 v1.1.3 的完整浅色与深色 Token", () => {
    for (const token of [
      "--qcc-brand:#128BED", "--qcc-action:#0875D1", "--qcc-action-hover:#0666B7",
      "--qcc-selected:#E6F4FF", "--qcc-table-head:#F2F9FC", "--qcc-page:#F6F8FA",
      "--qcc-surface:#FFFFFF", "--qcc-text:#202C3B", "--qcc-secondary:#626F80", "--qcc-border:#DCE4EC",
      "--qcc-brand:#55ADFF", "--qcc-action:#82C3FF", "--qcc-action-hover:#ACD7FF",
      "--qcc-selected:#173449", "--qcc-table-head:#172C3B", "--qcc-page:#101820",
      "--qcc-surface:#18232E", "--qcc-text:#E7EEF6", "--qcc-secondary:#A2B1C2", "--qcc-border:#344657",
    ]) expect(WORKBENCH_CSS).toContain(token)
  })

  it("让主按钮、提示词弹窗、五步导航和菜单保持在插件作用域内", () => {
    expect(WORKBENCH_CSS).toContain(".qccPwPrimary")
    expect(WORKBENCH_CSS).toContain("background:var(--qcc-action)")
    expect(WORKBENCH_CSS).toContain(".qccPromptBackdrop")
    expect(WORKBENCH_CSS).toContain("grid-template-columns:repeat(5")
    expect(WORKBENCH_CSS).toContain(".qccPrevisitCapabilities")
    expect(WORKBENCH_CSS).not.toContain(":root")
  })

  it("阶段菜单采用招投标式等宽图标标签，不渲染描述文案", () => {
    expect(WORKBENCH_CSS).toContain("grid-template-columns:repeat(5,minmax(0,1fr))")
    expect(WORKBENCH_CSS).toContain("flex-direction:column")
    expect(WORKBENCH_CSS).toContain('data-selected="true"]::after')
    expect(WORKBENCH_CSS).toContain("border-right:1px solid var(--qcc-border)")
    expect(WORKBENCH_CSS).not.toContain(".qccPwStageCopy small")
    expect(workbenchSource).not.toContain("PHASE_LABELS[current].description")
    for (const description of ["主体与拜访目的", "角色、重点与深度", "工商与经营画像", "风险、反证与边界", "一页纸与行动问题"]) {
      expect(workbenchSource).not.toContain(description)
    }
  })

  it("首页快捷菜单采用数据清洗补全式纵向描边卡片", () => {
    expect(WORKBENCH_CSS).toContain("justify-content:safe center")
    expect(WORKBENCH_CSS).toContain("overflow-x:auto;scrollbar-width:none")
    expect(WORKBENCH_CSS).toContain("flex-direction:column;gap:5px;flex:0 0 auto;min-width:108px;min-height:54px")
    expect(WORKBENCH_CSS).toContain("border:1px solid var(--qcc-border);border-radius:8px")
    expect(WORKBENCH_CSS).toContain(".qccPrevisitCapabilityLabel")
    expect(WORKBENCH_CSS).toContain(".qccPrevisitCapabilities{justify-content:flex-start;padding-inline:12px}")
    expect(WORKBENCH_CSS).not.toContain(".qccPrevisitCapabilities{display:grid")
  })
})
