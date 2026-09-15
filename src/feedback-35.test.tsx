import { describe, it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { PrevisitFields, type ComposerActions } from "./previsit-dock.js"
import { EMPTY_SESSION_STATE } from "./previsit-store.js"
import { composeFullSentence, routePrevisitPrompt } from "./composer-model.js"
import { formatReportTime, reportTextWithTime } from "./report-time.js"
import { buildPrevisitReportHtml } from "./report-export.js"
import { ReportFilesPanel } from "./report-files-panel.js"

describe("four feedback regressions", () => {
  it("hides editable controls before begin when the session is already running", () => {
    const html = renderToStaticMarkup(<PrevisitFields idPrefix="test" locked actions={{state:EMPTY_SESSION_STATE} as ComposerActions} />)
    expect(html).toContain("任务已提交")
    expect(html).not.toContain("<button")
    expect(html).not.toContain("<input")
    expect(html).not.toContain("开始尽调")
  })
  it("routes investment/deep/full-report wizard requests without changing the business intent", () => {
    const draft = composeFullSentence({role:"invest", budget:"deep", output:"full", focus:["risk"]}, "思必驰")
    const routed = routePrevisitPrompt(draft)
    expect(routed).toContain(draft)
    expect(routed).toContain("我是投资机构人员")
    expect(routed).toContain("qcc-previsit-onepager")
    expect(routed).toContain("previsit_confirm_entity")
    expect(routePrevisitPrompt(routed)).toBe(routed)
    expect(routePrevisitPrompt("")).toBe("")
  })
  it("uses saved Beijing seconds across midnight and keeps legacy precision", () => {
    expect(formatReportTime("2026-09-15T16:02:03.456Z")).toBe("2026-09-16 00:02:03（北京时间）")
    expect(formatReportTime("2026-09-15")).toBe("2026-09-15")
    expect(formatReportTime()).toBe("")
  })
  it("replaces model dates in presentation, leaving source markdown untouched", () => {
    const md = "# 访前尽调报告\n生成时间：2026-09-15\n## 核心研判\n原文"
    const time = "2026-09-15T16:02:03Z"
    expect(reportTextWithTime(md,time)).toContain("2026-09-16 00:02:03")
    const html = buildPrevisitReportHtml(md,{generatedAt:time})
    expect(html).toContain("2026-09-16 00:02:03")
    expect(html).not.toContain("生成时间：2026-09-15")
    expect(md).toContain("生成时间：2026-09-15")
  })
  it("orders HTML then Word then primary PDF", () => {
    const html = renderToStaticMarkup(<ReportFilesPanel taskId="t" sessionId="s" onHtml={()=>{}} />)
    expect(html.indexOf("下载 HTML")).toBeLessThan(html.indexOf("下载 Word"))
    expect(html.indexOf("下载 Word")).toBeLessThan(html.indexOf("下载 PDF"))
    expect(html).toContain('class="qccPwPrimary"')
  })
})
