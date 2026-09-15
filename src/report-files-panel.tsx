import { useState } from "react"
import type { ReportFile } from "./report-files.js"

export async function downloadReportFormat(taskId: string, sessionId: string, format: "pdf" | "docx"): Promise<void> {
  const root = `/previsit/api/tasks/${encodeURIComponent(taskId)}/files`
  const query = `?sessionId=${encodeURIComponent(sessionId)}`
  const response = await fetch(root + query, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }) })
  const result = await response.json() as { ok?: boolean; message?: string; file?: ReportFile }
  if (!response.ok || !result.ok || !result.file?.id || !result.file.fileName) throw new Error(result.message ?? "报告生成失败，请重试")
  const file = await fetch(`${root}/${encodeURIComponent(result.file.id)}${query}`)
  if (!file.ok) throw new Error("报告已生成，但下载失败，请重试")
  const url = URL.createObjectURL(await file.blob())
  const anchor = document.createElement("a")
  anchor.href = url; anchor.download = result.file.fileName
  document.body.append(anchor); anchor.click(); anchor.remove()
  setTimeout(() => URL.revokeObjectURL(url), 0)
}

export function ReportFilesPanel({ taskId, sessionId, onHtml }: { taskId: string; sessionId: string; onHtml?: () => void }) {
  const [busy, setBusy] = useState<"pdf" | "docx" | null>(null)
  const [error, setError] = useState("")
  const generate = async (format: "pdf" | "docx") => {
    if (busy) return
    setBusy(format); setError("")
    try { await downloadReportFormat(taskId, sessionId, format) }
    catch (cause) { setError(cause instanceof Error ? cause.message : "下载失败，请重试") }
    finally { setBusy(null) }
  }
  return <div className="qccPwDownloadActions" aria-label="下载报告">
    {onHtml ? <button type="button" className="qccPwSecondary" disabled={busy !== null} onClick={onHtml}>下载 HTML</button> : null}
    <button type="button" className="qccPwSecondary" disabled={busy !== null} onClick={() => void generate("docx")}>{busy === "docx" ? "正在生成 Word…" : "下载 Word"}</button>
    <button type="button" className="qccPwPrimary" disabled={busy !== null} onClick={() => void generate("pdf")}>{busy === "pdf" ? "正在生成 PDF…" : "下载 PDF"}</button>
    {busy ? <span role="status">生成完成后自动下载</span> : null}
    {error ? <span role="alert">{error}</span> : null}
  </div>
}
