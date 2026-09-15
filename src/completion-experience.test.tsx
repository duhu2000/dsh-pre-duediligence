import { afterEach, describe, expect, it, vi } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { RiskSummary } from "./risk-summary.js"
import { parseCardInsights } from "./stage-insights.js"
import { downloadReportFormat, ReportFilesPanel } from "./report-files-panel.js"
import type { HostedTask } from "./hosted-task-sync.js"

afterEach(() => { vi.unstubAllGlobals(); vi.restoreAllMocks() })
describe("completed report experience", () => {
  const render = (body: string) => renderToStaticMarkup(<RiskSummary task={{reportReady:true} as HostedTask} running={false} insights={parseCardInsights(`## 5、红线提示\n${body}\n## 6、现场必问\n问题`)} />)
  it("uses explicit no-redline prose and bold table cells, never assumes absent means zero", () => {
    expect(render("红线：本次核验未发现红线")).toContain("本次核验未发现红线")
    expect(render("| **红线** | 本次未发现红线 |" )).toContain('data-clear="true"')
    const missing = render("| 关注 | 行政处罚 |")
    expect(missing).toContain("结论未明确")
    expect(missing).not.toContain("待研判")
    expect(missing).not.toContain('data-clear="true"')
    expect(render("红线：证据不足，未取得必要明细")).not.toContain('data-clear="true"')
  })
  it("offers PDF as primary, Word and HTML as alternatives without stale technical copy", () => {
    const html = renderToStaticMarkup(<ReportFilesPanel taskId="task" sessionId="session" onHtml={() => {}} />)
    expect(html).toContain('class="qccPwPrimary">下载 PDF')
    expect(html).toContain("下载 Word")
    expect(html).toContain("下载 HTML")
    expect(html).not.toContain("管理员")
  })
  it("does not initiate a download after export failure", async () => {
    const fetcher = vi.fn().mockResolvedValue({ok:false,json:async()=>({ok:false,message:"转换失败"})})
    vi.stubGlobal("fetch", fetcher)
    await expect(downloadReportFormat("task", "session", "pdf")).rejects.toThrow("转换失败")
    expect(fetcher).toHaveBeenCalledTimes(1)
  })
  it("downloads the generated file and preserves format and session", async () => {
    const fetcher = vi.fn().mockResolvedValueOnce({ok:true,json:async()=>({ok:true,file:{id:"file-1",fileName:"报告.pdf"}})}).mockResolvedValueOnce({ok:true,blob:async()=>new Blob(["PDF"])})
    vi.stubGlobal("fetch",fetcher)
    const anchor = {href:"",download:"",click:vi.fn(),remove:vi.fn()}
    vi.stubGlobal("document",{createElement:()=>anchor,body:{append:vi.fn()}})
    vi.spyOn(URL,"createObjectURL").mockReturnValue("blob:test")
    vi.spyOn(URL,"revokeObjectURL").mockImplementation(()=>{})
    await downloadReportFormat("task", "session", "pdf")
    expect(fetcher.mock.calls[0]?.[1].body).toBe('{"format":"pdf"}')
    expect(fetcher.mock.calls[1]?.[0]).toContain("files/file-1?sessionId=session")
    expect(anchor.download).toBe("报告.pdf")
    expect(anchor.click).toHaveBeenCalledOnce()
  })
})
