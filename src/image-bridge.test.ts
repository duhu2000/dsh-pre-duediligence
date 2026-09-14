import { describe, expect, it, vi } from "vitest"
import { composerImageHandler, importableFile, isImportable, shouldIntercept } from "./image-bridge.js"

const owned = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
const png = { name: "a.png", type: "image/png", size: 3, arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer } as unknown as File
const transferWith = (file: File | null): DataTransfer => ({ items: file === null ? [] : [{ kind: "file", type: file.type, getAsFile: () => file }], files: file === null ? [] : [file], types: file === null ? [] : ["Files"] } as unknown as DataTransfer)
const target = (matches: string[]) => ({ closest: (selector: string) => matches.some(m => selector.includes(m)) ? {} : null })
const event = (t: unknown) => { const e = { target: t, prevented: false, preventDefault() { e.prevented = true }, stopImmediatePropagation() {} }; return e }

describe("原生输入框图片接管", () => {
  it("只接受图片/PDF", () => {
    expect(isImportable({ type: "image/png" } as File)).toBe(true)
    expect(isImportable({ type: "text/plain" } as File)).toBe(false)
    expect(importableFile(transferWith(null))).toBeUndefined()
  })
  it("专属会话里拖进输入框的图片被拦下并走暂存链路；工作台区域与普通会话不动", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true, json: async () => ({ ok: true, command: { commandId: "pvi-1", state: "prepared", fileName: "a.png", sizeBytes: 3, prompt: "识别 pvi-1" } }) }))
    vi.stubGlobal("fetch", fetchMock)
    vi.stubGlobal("btoa", (s: string) => Buffer.from(s, "binary").toString("base64"))
    const send = vi.fn(async () => {})
    let current: string | undefined = owned
    const handle = composerImageHandler({ owned: id => id === owned, currentSessionId: () => current, send })
    const composer = event(target(["textarea"]))
    expect(handle(composer, transferWith(png))).toBe(true)
    expect(composer.prevented).toBe(true)
    await vi.waitFor(() => expect(send).toHaveBeenCalledWith(owned, "识别 pvi-1"))
    expect(fetchMock).toHaveBeenCalledOnce()
    const workbench = event(target([".qccPwShell", "textarea"]))
    expect(handle(workbench, transferWith(png))).toBe(false)
    expect(workbench.prevented).toBe(false)
    // DSH 拖文件时盖的整窗遮罩不在输入框里，drop 仍要接管，否则会撞“当前模型不支持图片”
    const view = { width: 1000, height: 800 }
    const overlay = { closest: () => null, tagName: "DIV", getBoundingClientRect: () => ({ width: 1000, height: 800 }) }
    const sidePanel = { closest: () => null, tagName: "DIV", getBoundingClientRect: () => ({ width: 300, height: 800 }) }
    expect(shouldIntercept(overlay, "drop", view)).toBe(true)
    expect(shouldIntercept(overlay, "paste", view)).toBe(false)
    // 侧栏 Files 这类局部面板不抢，拖文件进工作区仍归 DSH
    expect(shouldIntercept(sidePanel, "drop", view)).toBe(false)
    expect(shouldIntercept({ closest: () => null, tagName: "BODY" }, "paste", view)).toBe(true)
    expect(shouldIntercept({ closest: (sel: string) => sel.includes(".qccPwShell") ? {} : null }, "drop", view)).toBe(false)
    expect(shouldIntercept(undefined, "drop", view)).toBe(true)
    expect(handle(event(target(["textarea"])), transferWith(null))).toBe(false)
    current = "ordinary"
    const other = event(target(["textarea"]))
    expect(handle(other, transferWith(png))).toBe(false)
    expect(send).toHaveBeenCalledTimes(1)
    vi.unstubAllGlobals()
  })
})
