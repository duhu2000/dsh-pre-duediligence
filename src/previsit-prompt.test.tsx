import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { PrevisitPromptGenerator, mergePromptDraft } from "./previsit-prompt.js"
import { createPrevisitStore } from "./previsit-store.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"

describe("访前尽调提示词生成器", () => {
  it("显式区分替换与追加，不会静默覆盖已有草稿", () => {
    expect(mergePromptDraft("原有内容", "新任务", "replace")).toBe("新任务")
    expect(mergePromptDraft("原有内容", "新任务", "append")).toBe("原有内容\n新任务")
    expect(mergePromptDraft("", "新任务", "append")).toBe("新任务")
  })

  it("只在访前尽调会话显示线性图标触发器", () => {
    const render = (id: string) => renderToStaticMarkup(
      <PrevisitPromptGenerator sessionId={id} useInput={selector => selector({ draft: "", phase: "blank" })} store={createPrevisitStore()} />,
    )
    expect(render(sessionId)).toContain("提示词生成")
    expect(render(sessionId)).toContain("<svg")
    expect(render("ordinary-session")).toBe("")
  })
})
