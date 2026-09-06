import { describe, expect, it } from "vitest"

import { WORKBENCH_CSS } from "./workbench-style.js"

describe("访前工作台企查查蓝主题", () => {
  it("包含 DSH-UX-001 v1.1.0 的完整浅色与深色 Token", () => {
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
})
