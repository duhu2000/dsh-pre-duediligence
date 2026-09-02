import { describe, expect, it } from "vitest"

import { WORKBENCH_CSS } from "./workbench-style.js"

describe("访前工作台主题", () => {
  it("复用截图中的 DSH 业务蓝与原生表面 Token", () => {
    expect(WORKBENCH_CSS).toContain("--pw-brand:var(--dsw-alias-state-business-primary,#4176e6)")
    expect(WORKBENCH_CSS).toContain("--pw-brand-hover:var(--dsw-alias-button-info-hover,#679efe)")
    expect(WORKBENCH_CSS).toContain("--pw-surface:var(--dsw-alias-bg-layer-1")
    expect(WORKBENCH_CSS).toContain("--pw-surface-muted:var(--dsw-alias-bg-module-platform")
    expect(WORKBENCH_CSS).toContain("--pw-line-strong:var(--dsw-alias-border-l3")
    expect(WORKBENCH_CSS).toContain("--pw-soft:var(--dsw-alias-state-business-tertiary,#e4edfd)")
  })

  it("使用同一套状态色与阶段选中态", () => {
    expect(WORKBENCH_CSS).toContain("#fff3df 75%")
    expect(WORKBENCH_CSS).toContain("#e7f5ec 75%")
    expect(WORKBENCH_CSS).toContain("#fbeaea 75%")
    expect(WORKBENCH_CSS).toContain("box-shadow:0 0 0 4px var(--pw-soft)")
  })
})
