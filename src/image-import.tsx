// 「要见谁」旁的导入控件：一个小按钮 + 整块表单可拖入/粘贴；暂存后自动发识别说明。
import { useEffect, useRef, useState, type ClipboardEvent, type DragEvent, type ReactNode } from "react"

import { IMAGE_ACCEPT, IMAGE_ROUTE, importableFile, requestCommand, stageAndSend, type StagedCommand } from "./image-bridge.js"

export function useImageImport(sessionId: string, send: (prompt: string) => Promise<void>) {
  const accepting = useRef(false)
  const [busy, setBusy] = useState(false)
  const [command, setCommand] = useState<StagedCommand | null>(null)
  const [error, setError] = useState<string>()
  const accept = async (file: File | undefined) => {
    if (file === undefined || accepting.current) return
    accepting.current = true
    setBusy(true); setError(undefined)
    try { setCommand(await stageAndSend(file, sessionId, send)) } catch (cause) { setError(cause instanceof Error ? cause.message : "导入失败") } finally { accepting.current = false; setBusy(false) }
  }
  useEffect(() => {
    if (command === null || command.state === "completed" || command.state === "failed") return
    let disposed = false
    const timer = setInterval(async () => {
      try {
        const next = await requestCommand(`${IMAGE_ROUTE}/${encodeURIComponent(command.commandId)}?sessionId=${encodeURIComponent(sessionId)}`, "GET")
        if (disposed) return
        setCommand(current => current?.commandId === next.commandId ? { ...current, ...next } : current)
        if (next.state === "failed" && next.error) setError(next.error.message)
      } catch (cause) { if (!disposed) setError(cause instanceof Error ? cause.message : "无法同步图片识别状态"); clearInterval(timer) }
    }, 1500)
    return () => { disposed = true; clearInterval(timer) }
  }, [sessionId, command?.commandId, command?.state])
  const status = command === null ? undefined
    : `${command.fileName} · ${command.state === "completed" ? command.result?.entries.length === 0 ? "已识别，未发现企业全称，请在会话中补充" : "已识别，候选企业见计划卡" : command.state === "failed" ? "识别失败" : command.state === "prepared" ? "已暂存，等待智能体识别" : "正在识别企业名单…"}`
  return { busy, command, error, status, accept }
}

/** 小按钮：放在「要见谁」输入框右侧。 */
export function ImportButton(props: { busy: boolean; onFile: (file: File | undefined) => void; title?: string }): JSX.Element {
  const input = useRef<HTMLInputElement>(null)
  return (
    <>
      <input ref={input} type="file" accept={IMAGE_ACCEPT.join(",")} hidden onChange={event => { props.onFile(event.target.files?.[0]); event.target.value = "" }} />
      <button type="button" className="qccImportBtn" disabled={props.busy} title={props.title ?? "导入商机图片或 PDF（也可以直接拖入或粘贴）"} onClick={() => input.current?.click()}>
        <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.5 12.5 21a5.5 5.5 0 0 1-7.8-7.8L14 3.9a3.7 3.7 0 0 1 5.2 5.2L9.9 18.4a1.8 1.8 0 0 1-2.6-2.6l8.3-8.3" /></svg>
        <span>{props.busy ? "暂存中…" : "导入图片"}</span>
      </button>
    </>
  )
}

/** 拖入/粘贴包裹层：把整块表单当作接收区，视觉只在拖入时提示。 */
export function DropZone(props: { onFile: (file: File | undefined) => void; children: ReactNode; className?: string }): JSX.Element {
  const [dragging, setDragging] = useState(false)
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    const file = importableFile(event.dataTransfer)
    setDragging(false)
    if (file === undefined) return
    event.preventDefault(); event.stopPropagation()
    props.onFile(file)
  }
  const onPaste = (event: ClipboardEvent<HTMLDivElement>) => {
    const file = importableFile(event.clipboardData)
    if (file === undefined) return
    event.preventDefault(); event.stopPropagation()
    props.onFile(file)
  }
  return (
    <div className={props.className} data-dragging={dragging}
      onDragOver={event => { if (importableFile(event.dataTransfer) !== undefined || (event.dataTransfer.types ?? []).includes("Files")) { event.preventDefault(); setDragging(true) } }}
      onDragLeave={() => setDragging(false)} onDrop={onDrop} onPaste={onPaste}>
      {props.children}
    </div>
  )
}
