// 图片/文件 → 宿主暂存 → 自动发识别说明。工作台、设定条和输入框三处共用同一条链路。
export const IMAGE_ROUTE = "/previsit/api/images/commands"
export const IMAGE_ACCEPT = ["image/png", "image/jpeg", "image/webp", "application/pdf"] as const
const MAX_BYTES = 8 * 1024 * 1024

export type StagedCommand = { commandId: string; state: string; fileName: string; sizeBytes: number; prompt?: string; result?: { entries: string[]; text: string } | null; error?: { code: string; message: string } | null }

export function isImportable(file: File | null | undefined): file is File {
  return file !== null && file !== undefined && (IMAGE_ACCEPT as readonly string[]).includes(file.type)
}

/** 从拖拽/粘贴的数据里挑出可导入的文件（只取第一个）。 */
export function importableFile(transfer: DataTransfer | null | undefined): File | undefined {
  if (!transfer) return undefined
  for (const item of Array.from(transfer.items ?? [])) {
    if (item.kind === "file" && (IMAGE_ACCEPT as readonly string[]).includes(item.type)) { const f = item.getAsFile(); if (f) return f }
  }
  return Array.from(transfer.files ?? []).find(isImportable)
}

async function toBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer())
  let binary = ""
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000))
  return btoa(binary)
}

export async function requestCommand<T = StagedCommand>(path: string, method: string, body?: unknown): Promise<T> {
  const init: RequestInit = { method, credentials: "same-origin" }
  if (body !== undefined) { init.headers = { "content-type": "application/json" }; init.body = JSON.stringify(body) }
  const res = await fetch(path, init)
  const payload = await res.json().catch(() => ({})) as { ok?: boolean; message?: string; command?: T }
  if (!res.ok || payload.ok === false) throw new Error(payload.message ?? `宿主请求失败（${res.status}）`)
  return payload.command as T
}

/** 暂存一个文件并把识别说明发进当前会话。返回暂存记录，供状态显示与轮询。 */
export async function stageAndSend(file: File, sessionId: string, send: (prompt: string) => Promise<void>): Promise<StagedCommand> {
  if (!isImportable(file)) throw new Error("仅支持 PNG、JPEG、WebP 图片或 PDF。")
  if (file.size > MAX_BYTES) throw new Error("文件不能超过 8 MiB。")
  const staged = await requestCommand(`${IMAGE_ROUTE}?sessionId=${encodeURIComponent(sessionId)}`, "POST", { fileName: file.name, mimeType: file.type, content: await toBase64(file) })
  if (staged.prompt === undefined) throw new Error("宿主没有返回识别说明")
  await send(staged.prompt)
  return staged
}

export type ComposerImageBridge = {
  /** 当前会话是否属于访前尽调（只在专属会话里接管）。 */
  owned(sessionId: string): boolean
  currentSessionId(): string | undefined
  send(sessionId: string, prompt: string): Promise<void>
  onStaged?(sessionId: string, staged: StagedCommand): void
  onError?(sessionId: string, message: string): void
}

type ClosestTarget = { closest?(selector: string): unknown; tagName?: string; getBoundingClientRect?(): { width: number; height: number } }
/** 插件自己的面板（工作台、设定条、提示词弹窗）各自有接收区，window 层不抢。 */
const OURS = ".qccPwShell, .qccDock, .qccPromptPanel"
const COMPOSER = '[data-composer-card], [data-composer-seat], textarea, [contenteditable="true"], [role="textbox"]'

export type BridgeMode = "drop" | "paste"

/**
 * 判断这次拖放/粘贴是否该由我们接管。
 * drop：DSH 拖文件时会盖一层整窗遮罩，事件目标根本不在输入框里，所以只要不在我们自己的面板内就接管；
 * paste：以焦点为准，命中输入框或页面空白（未聚焦）时接管。
 */
export function shouldIntercept(target: unknown, mode: BridgeMode, viewport?: { width: number; height: number }): boolean {
  const el = target as ClosestTarget | null | undefined
  if (el === null || el === undefined || typeof el.closest !== "function") return mode === "drop"
  if (el.closest(OURS)) return false
  if (el.closest(COMPOSER)) return true
  const tag = String(el.tagName ?? "").toUpperCase()
  if (tag === "BODY" || tag === "HTML") return true
  // 只在拖放时额外接管“整窗遮罩”：DSH 拖文件会盖一层覆盖全窗的层，目标不在输入框里。
  // 侧栏 Files 面板这类局部区域不算，拖文件进工作区仍走 DSH 自己的逻辑。
  if (mode !== "drop" || typeof el.getBoundingClientRect !== "function") return false
  const size = viewport ?? (typeof window === "undefined" ? undefined : { width: window.innerWidth, height: window.innerHeight })
  if (size === undefined || size.width === 0 || size.height === 0) return false
  const rect = el.getBoundingClientRect()
  return rect.width >= size.width * 0.8 && rect.height >= size.height * 0.8
}

export type BridgeEvent = { target: unknown; preventDefault(): void; stopImmediatePropagation?(): void }

/** 事件处理器本体（可测）：命中专属会话 + 原生输入框 + 可导入文件时接管，返回是否接管。 */
export function composerImageHandler(bridge: ComposerImageBridge): (event: BridgeEvent, transfer: DataTransfer | null | undefined, mode?: BridgeMode) => boolean {
  let busy = false
  return (event, transfer, mode = "drop") => {
    const sessionId = bridge.currentSessionId()
    if (sessionId === undefined || !bridge.owned(sessionId) || !shouldIntercept(event.target, mode)) return false
    const file = importableFile(transfer)
    if (file === undefined) return false
    event.preventDefault()
    event.stopImmediatePropagation?.()
    if (busy) { bridge.onError?.(sessionId, "正在导入上一份文件，请稍后再试。"); return true }
    busy = true
    stageAndSend(file, sessionId, prompt => bridge.send(sessionId, prompt))
      .then(staged => bridge.onStaged?.(sessionId, staged))
      .catch((cause: unknown) => bridge.onError?.(sessionId, cause instanceof Error ? cause.message : "导入失败"))
      .finally(() => { busy = false })
    return true
  }
}

/**
 * 接管 DSH 原生输入框里的图片：拖入 / 粘贴在 window 捕获阶段拦下（早于宿主的“当前模型不支持图片”校验），
 * 走同一条暂存链路。只在访前尽调专属会话生效，不影响文字粘贴与其它会话。
 */
export function installComposerImageBridge(bridge: ComposerImageBridge): () => void {
  if (typeof window === "undefined") return () => {}
  const handle = composerImageHandler(bridge)
  // 拖拽提示：整页显示“松开即可识别企业名单”，让这条通路可见、可验证。
  const root = document.documentElement
  let hintDepth = 0
  const showHint = (on: boolean) => {
    if (on) root.setAttribute("data-qcc-drop", "1")
    else { hintDepth = 0; root.removeAttribute("data-qcc-drop") }
  }
  const takes = (event: { target: unknown }, transfer: DataTransfer | null | undefined): boolean => {
    const sessionId = bridge.currentSessionId()
    if (sessionId === undefined || !bridge.owned(sessionId) || !shouldIntercept(event.target, "drop")) return false
    return (transfer?.types ?? []).includes("Files")
  }
  const onDrop = (event: DragEvent) => { showHint(false); handle(event, event.dataTransfer, "drop") }
  const onPaste = (event: ClipboardEvent) => { handle(event, event.clipboardData, "paste") }
  const onDragOver = (event: DragEvent) => {
    // dragover 阶段拿不到文件内容，只能看 types 有没有文件；必须 preventDefault 才会触发 drop。
    if (takes(event, event.dataTransfer)) { event.preventDefault(); showHint(true) }
  }
  const onDragEnter = (event: DragEvent) => { if (takes(event, event.dataTransfer)) { hintDepth += 1; showHint(true) } }
  const onDragLeave = () => { hintDepth -= 1; if (hintDepth <= 0) showHint(false) }
  const onDragEnd = () => showHint(false)
  window.addEventListener("drop", onDrop, true)
  window.addEventListener("paste", onPaste, true)
  window.addEventListener("dragover", onDragOver, true)
  window.addEventListener("dragenter", onDragEnter, true)
  window.addEventListener("dragleave", onDragLeave, true)
  window.addEventListener("dragend", onDragEnd, true)
  return () => {
    showHint(false)
    window.removeEventListener("drop", onDrop, true)
    window.removeEventListener("paste", onPaste, true)
    window.removeEventListener("dragover", onDragOver, true)
    window.removeEventListener("dragenter", onDragEnter, true)
    window.removeEventListener("dragleave", onDragLeave, true)
    window.removeEventListener("dragend", onDragEnd, true)
  }
}
