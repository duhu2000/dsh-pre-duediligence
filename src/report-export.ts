// 作战卡 Markdown → 可下载的自包含样式化 HTML 报告。
// 配色、字号、标题规范全部锁定为用户提供的 demo 设计，模型/前端都不再自行配色。
// 纯函数，无 DOM 依赖，便于单测。
import { isPrevisitSession } from "./previsit-session.js"

export type ReportMeta = {
  company?: string
  generatedAt?: string
}

// 会话节点的最小结构（DSH 节点具体形态未知，字段全部可选）
export type CardNode = {
  id?: string
  seq?: number
  interrupted?: boolean
  blocks?: Array<{ kind: string; text?: string }>
  kind?: string
  role?: string
  text?: string
  content?: unknown
  message?: { role?: string; content?: unknown } | null
  parts?: Array<{ text?: string; type?: string } | string>
  call?: { name?: string } | null
}

export type CardSnapshot = { nodes?: CardNode[]; running?: boolean }

function contentText(value: unknown): string {
  if (typeof value === "string") return value
  if (!Array.isArray(value)) return ""
  return value.map(block => {
    if (typeof block === "string") return block
    if (block === null || typeof block !== "object") return ""
    const typed = block as { type?: unknown; kind?: unknown; text?: unknown }
    if ((typeof typed.type === "string" && typed.type !== "text") || (typeof typed.kind === "string" && typed.kind !== "text")) return ""
    return typeof typed.text === "string" ? typed.text : ""
  }).join("")
}

// 防御式提取助手输出的作战卡正文：DSH 会话节点形态未知，逐种可能字段尝试。
function nodeText(node: CardNode): string {
  if (Array.isArray(node.blocks)) return node.blocks.filter(b => b.kind === "text").map(b => b.text ?? "").join("\n")
  if (typeof node.text === "string") return node.text
  if (typeof node.content === "string") return node.content
  if (node.message) { const text = contentText(node.message.content); if (text !== "") return text }
  if (Array.isArray(node.content)) return contentText(node.content)
  if (Array.isArray(node.parts)) {
    return node.parts.map(pt => (typeof pt === "string" ? pt : (pt && typeof pt.text === "string" ? pt.text : ""))).join("")
  }
  return ""
}

// 作战卡起点：一级标题「拜访作战卡 · 企业名」或首段「① 核心研判」
const CARD_START = /^#{1,3}\s*(访前尽调报告|拜访作战卡)[^\n]*$|^#{1,3}\s*[①1]?\s*核心研判[^\n]*$/m
// 卡片结构特征：至少有核心研判 + 现场必问/覆盖说明两类段落
const CARD_SHAPE = (text: string): boolean => /核心研判/.test(text) && /现场必问|覆盖说明|覆盖度/.test(text)
// 注入内容（技能清单、系统提醒等）绝不进报告
const JUNK = /<system-reminder>|<available_skills>|<command-name>|<\/?antml/i
const isTool = (node: CardNode): boolean => node.kind === "tool-result" || node.kind === "tool-call"
const nodeRole = (node: CardNode): string => node.role ?? node.message?.role ?? node.kind ?? ""
const isUserish = (node: CardNode): boolean => /user|human|system|context|steering/i.test(`${nodeRole(node)} ${node.kind ?? ""}`) || node.interrupted === true

// 从会话里认领任务：找最后一条带“访前任务 ID：PV-xxx”的消息（工作台/设定条发出的正式提交）；
// 没有标记但已出现企查查工具调用时，视为“会话内直接发起的尽调”，从头跟踪。
export function adoptTaskFromSnapshot(snapshot: CardSnapshot, sessionId: string, minimumBaseline = 0): { id: string; prompt: string; nodeBaseline: number } | null {
  if (!isPrevisitSession(sessionId)) return null
  const nodes = snapshot.nodes ?? []
  for (let idx = nodes.length - 1; idx >= minimumBaseline; idx--) {
    const node = nodes[idx]
    if (node === undefined || !/^(user|human)$/i.test(nodeRole(node))) continue
    const text = nodeText(node)
    const m = /访前任务 ID[：:]\s*(PV-[A-Z0-9-]+)/.exec(text)
    if (m !== null && m[1] !== undefined) return { id: m[1], prompt: text.trim(), nodeBaseline: idx }
  }
  // Native composer submissions inherit the explicitly owned Session. Never infer
  // ownership from QCC calls (shared by cleaning, form-fill and tender plugins).
  for (let idx = nodes.length - 1; idx >= minimumBaseline; idx--) {
    const node = nodes[idx]
    if (node === undefined || !/^(user|human)$/i.test(nodeRole(node))) continue
    const prompt = nodeText(node).trim()
    if (prompt !== "" && !JUNK.test(prompt)) return { id: `turn:${node.seq ?? node.id ?? idx}`, prompt, nodeBaseline: idx }
  }
  return null
}

const FULL_REPORT_SECTIONS = ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"]
export function captureTaskReport(snapshot: CardSnapshot, sessionId: string, task: { id: string; nodeBaseline: number; prompt: string }): string | null {
  if (!isPrevisitSession(sessionId) || snapshot.running === true) return null
  const node = snapshot.nodes?.[task.nodeBaseline]
  if (node === undefined || !/^(user|human)$/i.test(nodeRole(node))) return null
  const adopted = adoptTaskFromSnapshot({ nodes: (snapshot.nodes ?? []).slice(0, task.nodeBaseline + 1) }, sessionId, task.nodeBaseline)
  if (adopted?.id !== task.id) return null
  // A later explicitly submitted task is a hard boundary, including after reload.
  const nodes = snapshot.nodes ?? []
  const next = nodes.findIndex((n, i) => i > task.nodeBaseline && /^(user|human)$/i.test(nodeRole(n)) && /访前任务 ID[：:]\s*PV-/.test(nodeText(n)))
  const text = extractCardText({ nodes: next === -1 ? nodes : nodes.slice(0, next) }, task.nodeBaseline + 1)
  if (text === null) return null
  const sections = [...text.matchAll(/^#{1,4}\s+(.+)$/gm)].map(m => normalizeHeading(m[1] ?? "").replace(/^\d+、\s*/, "").replace(/\*\*/g, "").trim())
  return FULL_REPORT_SECTIONS.every(s => sections.some(title => title === s || title.startsWith(s + "（") || title.startsWith(s + "："))) ? text : null
}

export function extractCardText(snapshot: CardSnapshot, baseline: number): string | null {
  const nodes = (snapshot.nodes ?? []).slice(baseline)
  // 从末尾找最后一个包含作战卡起点的节点，从起点切到该节点末尾
  for (let idx = nodes.length - 1; idx >= 0; idx--) {
    const node = nodes[idx]
    if (node === undefined || isTool(node) || isUserish(node)) continue
    const text = nodeText(node)
    if (JUNK.test(text)) continue
    const m = CARD_START.exec(text)
    if (m === null || m.index === undefined) continue
    let card = text.slice(m.index).trim()
    // 后续紧邻节点若是同一张卡的延续（以 Markdown 段标题开头、无注入内容），拼接
    for (let j = idx + 1; j < nodes.length; j++) {
      const next = nodes[j]
      if (next === undefined || isTool(next) || isUserish(next)) break
      const t = nodeText(next).trim()
      if (t === "" || JUNK.test(t) || !/^(#{2,4}\s|\||-\s|\d+\.\s|\*\*)/.test(t)) break
      card += "\n\n" + t
    }
    if (CARD_SHAPE(card)) return card
  }
  // 兜底：单节点整体符合卡片结构
  for (let idx = nodes.length - 1; idx >= 0; idx--) {
    const node = nodes[idx]
    if (node === undefined || isTool(node) || isUserish(node)) continue
    const text = nodeText(node).trim()
    if (text.length > 40 && !JUNK.test(text) && CARD_SHAPE(text)) return text
  }
  return null
}

const esc = (s: string): string =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;")

// 读者视角的清洗：事实编号 [F-013] 与证据层级代号 L1/L2 只对模型追溯有用，报告里翻译成人话或去掉
const TIER_WORDS: Record<string, string> = { L1: "财报披露", L2: "公开记录", L3: "关联关系", L4: "行业推断", L5: "现场核实" }
export function humanizeCell(text: string): string {
  const t = text.trim()
  if (/^L[1-5](\s*[\/／、]\s*L[1-5])*$/.test(t)) {
    return t.split(/\s*[\/／、]\s*/).map(x => TIER_WORDS[x] ?? x).join(" / ")
  }
  if (t === "来源层级") return "来源"
  return text
}
export function stripFactIds(text: string): string {
  // 支持 [F-013]、[F-008/F-009/F-013]、[F-002、F-008]、[F-1/F-2] 等写法
  return text
    .replace(/\s*\[F-?\d{1,4}(?:\s*[\/、,，;；|]\s*F-?\d{1,4})*\]/g, "")
    .replace(/[ \t]+([，。；：）])/g, "$1")
}
// 假设编号与优先级：H2 · P1 → 假设 2（P1）；正文里“回指 H2”→“回指假设 2”
const PRIORITY_WORDS: Record<string, string> = { P0: "优先", P1: "重要", P2: "备选" }
export function humanizeHypothesis(text: string): string {
  return text
    .replace(/^\s*H(\d+)\s*[·・:：\-–]\s*(P[012])\s*[·・:：\-–]\s*/, (_m, n: string, p: string) => `假设 ${n}（${PRIORITY_WORDS[p] ?? p}）`)
    .replace(/(?<![A-Za-z0-9])H(\d{1,2})(?![A-Za-z0-9])/g, "假设 $1")
}

// 行内：**加粗**；事实编号去掉
function inline(text: string): string {
  let html = esc(humanizeHypothesis(stripFactIds(text)))
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
  return html
}

const CIRCLED: Record<string, string> = { "①": "1", "②": "2", "③": "3", "④": "4", "⑤": "5", "⑥": "6", "⑦": "7", "⑧": "8", "⑨": "9", "⑩": "10" }
export function normalizeHeading(text: string): string {
  return text.trim().replace(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*/, (_m, c: string) => `${CIRCLED[c] ?? c}、`).replace(/^(\d+)[.．]\s*/, "$1、")
}

// 报告 Markdown 子集 → HTML 主体。支持：# ## ### 标题、| 表格 |、- 列表、1. 有序、--- 分隔、段落。
export function renderCardMarkdown(md: string): string {
  const lines = md.replace(/\r\n/g, "\n").split("\n")
  const out: string[] = []
  let i = 0
  const flushList = (items: string[], ordered: boolean) => {
    if (!items.length) return
    const tag = ordered ? "ol" : "ul"
    out.push(`<${tag}>${items.map(it => `<li>${inline(it)}</li>`).join("")}</${tag}>`)
  }
  while (i < lines.length) {
    const line = lines[i] ?? ""
    const t = line.trim()
    if (t === "") { i++; continue }
    if (/^---+$/.test(t)) { out.push("<hr/>"); i++; continue }
    // 表格：连续以 | 开头的行，第二行是分隔符
    const sep = lines[i + 1] ?? ""
    if (t.startsWith("|") && /^\|[\s:|-]+\|?$/.test(sep.trim())) {
      const header = t.split("|").slice(1, -1).map(c => humanizeCell(c.trim()))
      i += 2
      const rows: string[][] = []
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        rows.push((lines[i] ?? "").trim().split("|").slice(1, -1).map(c => humanizeCell(c.trim())))
        i++
      }
      const thead = `<thead><tr>${header.map(h => `<th>${inline(h)}</th>`).join("")}</tr></thead>`
      const tbody = `<tbody>${rows.map(r => `<tr>${r.map(c => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody>`
      out.push(`<div class="tw"><table>${thead}${tbody}</table></div>`)
      continue
    }
    // 标题：圈号 ①② 统一成“1、”格式
    const h = /^(#{1,4})\s+(.*)$/.exec(t)
    if (h) {
      const level = (h[1] ?? "##").length
      out.push(`<h${level}>${inline(normalizeHeading(h[2] ?? ""))}</h${level}>`)
      i++
      continue
    }
    // 标题下的小说明（> 说明：…）
    if (t.startsWith(">")) {
      out.push(`<p class="note">${inline(t.replace(/^>\s?/, ""))}</p>`)
      i++
      continue
    }
    // 无序列表
    if (/^[-*]\s+/.test(t)) {
      const items: string[] = []
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").trim().replace(/^[-*]\s+/, ""))
        i++
      }
      flushList(items, false)
      continue
    }
    // 有序列表
    if (/^\d+\.\s+/.test(t)) {
      const items: string[] = []
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").trim().replace(/^\d+\.\s+/, ""))
        i++
      }
      flushList(items, true)
      continue
    }
    // 段落
    out.push(`<p>${inline(t)}</p>`)
    i++
  }
  return out.join("\n")
}

// demo 锁定配色与字号；标题克制、四字优先，标题下可带小说明模块。
const REPORT_CSS = `
:root{
  --blue:#128BED;--blue-dark:#0875D1;--ink:#202C3B;--body:#3D4A5C;--muted:#626F80;
  --line:#DCE4EC;--line-blue:#CDE9FC;--hero:#F2F9FC;
  --ok:#16a34a;--ok-bg:#f0fdf4;--warn:#d97706;--warn-bg:#fff7ed;--risk:#ef4444;--risk-bg:#fef2f2;
}
*{box-sizing:border-box}
body{margin:0;background:#f1f5f9;color:var(--body);
  font:15px/1.75 -apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei","Noto Sans SC",sans-serif;
  -webkit-font-smoothing:antialiased}
.sheet{max-width:860px;margin:24px auto;background:#fff;border:1px solid var(--line);border-radius:12px;overflow:hidden;
  box-shadow:0 1px 2px rgba(15,23,42,.04),0 12px 32px -20px rgba(15,23,42,.25)}
.hero{background:var(--hero);border-bottom:1px solid var(--line-blue);padding:22px 26px 20px}
.hero .eyebrow{font-size:11px;font-weight:800;letter-spacing:.12em;color:var(--blue);margin:0 0 6px}
.hero h1{margin:0;color:var(--ink);font-size:22px;font-weight:900;line-height:1.4}
.hero .meta{margin:8px 0 0;color:var(--muted);font-size:12.5px;line-height:1.7}
.body{padding:8px 26px 26px}
/* 大标题：蓝色 + 标题下短横线；小标题：浅灰底 + 左侧蓝竖线 */
.body h2{position:relative;margin:26px 0 12px;padding:0 0 8px;color:var(--blue-dark);font-size:16px;font-weight:800;letter-spacing:.01em}
.body h2::after{content:"";position:absolute;left:0;bottom:0;width:32px;height:3px;border-radius:2px;background:var(--blue)}
.body h2:first-of-type{margin-top:10px}
.body h3{margin:16px 0 8px;padding:6px 10px;border-left:3px solid var(--blue);border-radius:0 4px 4px 0;background:#f5f7fa;color:var(--ink);font-size:13.5px;font-weight:800}
.body h4{margin:12px 0 4px;color:var(--ink);font-size:13px;font-weight:700}
.body h1{display:none}
.note{margin:-4px 0 10px;color:var(--muted);font-size:12px;line-height:1.7}
blockquote{margin:-4px 0 10px;padding:0;border:0;color:var(--muted);font-size:12px;line-height:1.7}
blockquote p{margin:0}
p{margin:6px 0}
strong{color:var(--ink)}
.fid{color:var(--blue);font:600 10px ui-monospace,monospace;margin-left:2px}
ul,ol{margin:6px 0;padding-left:20px}
li{margin:3px 0;line-height:1.7}
hr{border:0;border-top:1px solid var(--line);margin:16px 0}
.tw{overflow-x:auto;margin:8px 0}
table{border-collapse:collapse;width:100%;font-size:13px}
th,td{border:1px solid var(--line);padding:8px 11px;text-align:left;vertical-align:top;line-height:1.6;word-break:break-word}
th{background:#f8fafc;color:var(--muted);font-weight:700;font-size:12px;white-space:nowrap}
/* 首列多为“等级/日期/推荐级”这类短标签：不换行、不被挤扁；长文本列自适应 */
td:first-child,th:first-child{white-space:nowrap;width:1%}
td:nth-child(2){min-width:180px}
/* 状态色：出现红线/关注/确认等词自动染色由内容决定，这里给出可用类 */
.tag-ok{color:var(--ok);background:var(--ok-bg)}
.tag-warn{color:var(--warn);background:var(--warn-bg)}
.tag-risk{color:var(--risk);background:var(--risk-bg)}
footer{padding:14px 26px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:11.5px;line-height:1.7}
@media print{body{background:#fff}.sheet{border:0;box-shadow:none;margin:0}}
`

// 从作战卡首行/锚定行提取企业名与生成时间做 hero
function deriveMeta(md: string, meta?: ReportMeta): { company: string; anchor: string; when: string } {
  const first = /^#?\s*(?:访前尽调报告|拜访作战卡)\s*·\s*([^\n锚]+)/m.exec(md)
  const anchorLine = /锚定主体：([^\n]+?)(?:\s*生成时间|$)/m.exec(md)
  const whenLine = /生成时间[:：]\s*([0-9-]+)/.exec(md)
  return {
    company: meta?.company || (first?.[1]?.trim() ?? "访前尽调报告"),
    anchor: (anchorLine?.[1] ?? "").trim().replace(/[｜|·\s]+$/, ""),
    when: meta?.generatedAt || (whenLine?.[1] ?? ""),
  }
}

export type ReportHero = { company: string; anchor: string; when: string }

// 统一外壳：hero + body + footer
export function wrapPrevisitReport(bodyHtml: string, m: ReportHero): string {
  const heroMeta = [m.anchor, m.when ? `生成时间：${m.when}` : ""].filter(Boolean).join("　·　")
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>访前尽调报告 · ${esc(m.company)}</title><style>${REPORT_CSS}</style></head>
<body><div class="sheet">
<div class="hero"><p class="eyebrow">访前尽调报告</p><h1>${esc(m.company)}</h1>${heroMeta ? `<p class="meta">${esc(heroMeta)}</p>` : ""}</div>
<div class="body">${bodyHtml}</div>
<footer>数据来源：企查查。各维度时效不同，不承诺实时。本报告为访前辅助材料，不构成授信、合作或任何商业决策依据，以官方公示为准。</footer>
</div></body></html>`
}

export function buildPrevisitReportHtml(cardMarkdown: string, meta?: ReportMeta): string {
  const m = deriveMeta(cardMarkdown, meta)
  // 去掉正文里的一级标题和锚定行（已进 hero），其余进 body
  const body = cardMarkdown
    .replace(/^#\s*(?:访前尽调报告|拜访作战卡).*$/m, "")
    .replace(/^锚定主体：.*$/m, "")
    .trim()
  return wrapPrevisitReport(renderCardMarkdown(body), m)
}

// 兜底：直接用会话里已渲染好的报告 HTML（去掉样式/类名/控件），套同一外壳
export function buildPrevisitReportFromRenderedHtml(bodyHtml: string, plainText: string, meta?: ReportMeta): string {
  const m = deriveMeta(plainText, meta)
  const body = humanizeHypothesis(stripFactIds(bodyHtml))
    .replace(/<(td|th)([^>]*)>\s*([^<]{1,20})\s*<\/\1>/g, (_m, tag: string, attrs: string, cell: string) => `<${tag}${attrs}>${esc(humanizeCell(cell))}</${tag}>`)
  return wrapPrevisitReport(body, m)
}
