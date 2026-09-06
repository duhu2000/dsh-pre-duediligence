import { describe, expect, it } from "vitest"

import { adoptTaskFromSnapshot, buildPrevisitReportFromRenderedHtml, buildPrevisitReportHtml, extractCardText, renderCardMarkdown } from "./report-export.js"

describe("renderCardMarkdown", () => {
  it("渲染标题、加粗；事实编号对读者无意义，去掉", () => {
    const html = renderCardMarkdown("## 核心研判\n企业处于**资本运作期** [F-013][F-014]，注册资本 30 万元 [F-001]。")
    expect(html).toContain("<h2>核心研判</h2>")
    expect(html).toContain("<strong>资本运作期</strong>，注册资本 30 万元。")
    expect(html).not.toContain("F-013")
  })
  it("证据层级代号翻译成人话", () => {
    const html = renderCardMarkdown("| 日期 | 事实 | 来源层级 |\n| --- | --- | --- |\n| 2026-07 | 高管变更 [F-006] | L2 |\n| 2026-08 | 年报 | L1/L2 |")
    expect(html).toContain("<th>来源</th>")
    expect(html).toContain("<td>公开记录</td>")
    expect(html).toContain("<td>财报披露 / 公开记录</td>")
    expect(html).toContain("<td>高管变更</td>")
  })

  it("渲染表格", () => {
    const html = renderCardMarkdown("| 日期 | 事实 |\n| --- | --- |\n| 2026-07 | 高管变更 |")
    expect(html).toContain("<table>")
    expect(html).toContain("<th>日期</th>")
    expect(html).toContain("<td>高管变更</td>")
  })

  it("渲染有序与无序列表", () => {
    expect(renderCardMarkdown("- 甲\n- 乙")).toContain("<ul><li>甲</li><li>乙</li></ul>")
    expect(renderCardMarkdown("1. 一\n2. 二")).toContain("<ol><li>一</li><li>二</li></ol>")
  })
})

describe("buildPrevisitReportHtml", () => {
  const card = [
    "# 访前尽调报告 · 企查查科技股份有限公司",
    "锚定主体：企查查科技股份有限公司（913...F · 在业）｜银行对公客户经理｜速览尽调｜生成时间：2026-09-02",
    "",
    "## 核心研判",
    "企业处于**资本运作期**。",
    "## 现场必问",
    "1. 本轮资金用途？",
  ].join("\n")

  it("生成自包含 HTML，企业名进 hero，锁定 demo 主蓝", () => {
    const html = buildPrevisitReportHtml(card)
    expect(html.startsWith("<!doctype html>")).toBe(true)
    expect(html).toContain("<title>访前尽调报告 · 企查查科技股份有限公司</title>")
    expect(html).toContain('class="hero"')
    expect(html).toContain("企查查科技股份有限公司")
    expect(html).toContain("#128BED") // 企查查蓝主色锁定
    expect(html).toContain("生成时间：2026-09-02")
    // 一级标题与锚定行已移入 hero，不重复出现在 body 的 h1
    expect(html).toContain("<h2>核心研判</h2>")
  })

  it("meta 覆盖优先", () => {
    const html = buildPrevisitReportHtml("## 核心研判\n内容", { company: "某某公司", generatedAt: "2026-01-01" })
    expect(html).toContain("<title>访前尽调报告 · 某某公司</title>")
  })
})

describe("extractCardText", () => {
  const card = "# 拜访作战卡 · 某某公司\n\n## 1、核心研判\n处于稳定经营期。\n\n## 8、覆盖说明\n- 已覆盖：工商"
  it("拼接最后一次工具事件之后被拆开的助手文本", () => {
    const snapshot = {
      nodes: [
        { kind: "user", text: "标准尽调 某某公司" },
        { kind: "tool-call", call: { name: "get_company_by_query" } },
        { kind: "tool-result", call: { name: "get_company_by_query" } },
        { kind: "assistant", text: "# 拜访作战卡 · 某某公司\n\n## 1、核心研判\n处于稳定经营期。" },
        { kind: "assistant", text: "## 8、覆盖说明\n- 已覆盖：工商" },
      ],
    }
    expect(extractCardText(snapshot, 0)).toBe(card)
  })
  it("支持 content 数组与 message.content 形态，且忽略用户节点", () => {
    const snapshot = {
      nodes: [
        { role: "assistant", content: [{ type: "text", text: card }] },
        { role: "user", text: "谢谢，还有别的问题吗" },
      ],
    }
    expect(extractCardText(snapshot, 0)).toBe(card)
    expect(extractCardText({ nodes: [{ role: "assistant", message: { content: card } }] }, 0)).toBe(card)
  })
  it("从卡片起点切片：前面的过程性文字不进报告", () => {
    const text = "我先做主体锚定……已完成。\n\n" + card
    expect(extractCardText({ nodes: [{ text }] }, 0)).toBe(card)
  })
  it("注入的系统提醒/技能清单绝不当作作战卡", () => {
    const junk = "<system-reminder>\nA skill is a reusable set…\n<available_skills>\n- `lark-doc`: 覆盖 核心研判 现场必问 拜访作战卡\n</available_skills>\n</system-reminder>"
    expect(extractCardText({ nodes: [{ text: card }, { text: junk }] }, 0)).toBe(card)
    expect(extractCardText({ nodes: [{ text: junk }] }, 0)).toBeNull()
  })
  it("没有作战卡时返回 null；baseline 之前的节点不计", () => {
    expect(extractCardText({ nodes: [{ role: "assistant", text: "你好，请提供企业名称。" }] }, 0)).toBeNull()
    expect(extractCardText({ nodes: [{ role: "assistant", text: card }] }, 1)).toBeNull()
  })
})

describe("buildPrevisitReportFromRenderedHtml", () => {
  it("用已渲染 HTML 套同一外壳，去事实编号，锚定行不重复生成时间", () => {
    const text = "访前尽调报告 · 某某公司锚定主体：某某公司（913… · 在业）｜通用视角｜标准尽调｜生成时间：2026-09-02核心研判 …"
    const html = buildPrevisitReportFromRenderedHtml("<h2>① 核心研判</h2><p>处于稳定经营期 [F-013]</p><table><tr><td>L2</td></tr></table>", text)
    expect(html).toContain("<title>访前尽调报告 · 某某公司</title>")
    expect(html).not.toContain("F-013")
    expect(html).toContain("<td>公开记录</td>")
    expect(html).toContain("某某公司（913… · 在业）｜通用视角｜标准尽调　·　生成时间：2026-09-02")
  })
})

describe("adoptTaskFromSnapshot", () => {
  it("认领带任务 ID 的正式提交", () => {
    const snap = { nodes: [{ kind: "user", text: "我是银行对公客户经理，准备拜访某某公司。\n\n访前任务 ID：PV-20260902-08SR\n请使用 Skill 执行" }, { kind: "tool-result", call: { name: "mcp__company__get_company_by_query" } }] }
    expect(adoptTaskFromSnapshot(snap)).toEqual({ id: "PV-20260902-08SR", prompt: snap.nodes[0]!.text, nodeBaseline: 0 })
  })
  it("没有标记但出现企查查工具调用：视为会话内发起", () => {
    const snap = { nodes: [{ kind: "user", text: "标准尽调 某某公司" }, { kind: "tool-result", call: { name: "mcp__risk__get_company_risk_scan" } }] }
    expect(adoptTaskFromSnapshot(snap)).toEqual({ id: "会话内发起", prompt: "标准尽调 某某公司", nodeBaseline: 0 })
    expect(adoptTaskFromSnapshot({ nodes: [{ kind: "user", text: "你好" }] })).toBeNull()
  })
})

describe("标题格式", () => {
  it("圈号与英文点号统一成“1、”；> 说明 渲染为小说明", () => {
    const html = renderCardMarkdown("## ③ 近期动态\n> 说明：近 12 个月的关键变化\n## 4. 业务假设")
    expect(html).toContain("<h2>3、近期动态</h2>")
    expect(html).toContain('<p class="note">说明：近 12 个月的关键变化</p>')
    expect(html).toContain("<h2>4、业务假设</h2>")
  })
})

describe("假设编号与多重事实编号", () => {
  it("H2 · P1 变成 假设 2（重要）；正文回指也转换；斜杠合写的事实编号整体去掉", () => {
    const html = renderCardMarkdown("### H2 · P1 · 公司处于稳定经营期（推理说明）\n- 支持证据：连续三年年报 [F-008/F-009/F-013]；参保约 1 人 [F-002、F-008]\n- 为什么问：回指 H2 的未知栏")
    expect(html).toContain("<h3>假设 2（重要）公司处于稳定经营期（推理说明）</h3>")
    expect(html).toContain("<li>支持证据：连续三年年报；参保约 1 人</li>")
    expect(html).toContain("回指 假设 2 的未知栏")
    expect(html).not.toContain("F-0")
  })
})
