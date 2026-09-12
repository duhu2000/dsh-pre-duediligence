import { describe, expect, it, vi } from "vitest"

import { isolateCompanyInputEvent, isolateCompanyInputKey } from "./previsit-dock.js"

function keyEvent(key: string, isComposing = false, keyCode = 0) {
  return {
    key,
    nativeEvent: { isComposing, keyCode },
    preventDefault: vi.fn(),
    stopPropagation: vi.fn(),
  }
}

describe("company input keyboard isolation", () => {
  it("中文输入法确认候选词时阻断冒泡，但不阻止 composition 默认行为", () => {
    for (const event of [keyEvent("Enter", true), keyEvent("Enter", false, 229)]) {
      isolateCompanyInputKey(event)
      expect(event.stopPropagation).toHaveBeenCalledOnce()
      expect(event.preventDefault).not.toHaveBeenCalled()
    }
  })

  it("普通 Enter 不会提交原生会话，其他按键也不会泄漏给外层快捷键", () => {
    const enter = keyEvent("Enter")
    isolateCompanyInputKey(enter)
    expect(enter.stopPropagation).toHaveBeenCalledOnce()
    expect(enter.preventDefault).toHaveBeenCalledOnce()

    const letter = keyEvent("a")
    isolateCompanyInputKey(letter)
    expect(letter.stopPropagation).toHaveBeenCalledOnce()
    expect(letter.preventDefault).not.toHaveBeenCalled()
  })

  it("composition 与 keyup 事件保持在企业输入框内", () => {
    const event = { stopPropagation: vi.fn() }
    isolateCompanyInputEvent(event)
    expect(event.stopPropagation).toHaveBeenCalledOnce()
  })
})
