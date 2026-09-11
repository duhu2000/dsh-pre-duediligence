// src/index.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// src/skill-file.ts
function parseSkillFile(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    return { content: normalized.trim(), frontmatter: null };
  }
  const closingMarker = normalized.indexOf("\n---\n", 4);
  if (closingMarker === -1) {
    throw new Error("SKILL.md \u7684 YAML frontmatter \u7F3A\u5C11\u7ED3\u675F\u6807\u8BB0");
  }
  return {
    frontmatter: normalized.slice(4, closingMarker).trim(),
    content: normalized.slice(closingMarker + 5).trim()
  };
}

// src/previsit-session.ts
function isPrevisitSession(sessionId) {
  return /^session-dsh-pre-duediligence-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(sessionId);
}

// src/report-export.ts
var esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
var TIER_WORDS = { L1: "\u8D22\u62A5\u62AB\u9732", L2: "\u516C\u5F00\u8BB0\u5F55", L3: "\u5173\u8054\u5173\u7CFB", L4: "\u884C\u4E1A\u63A8\u65AD", L5: "\u73B0\u573A\u6838\u5B9E" };
function humanizeCell(text) {
  const t = text.trim();
  if (/^L[1-5](\s*[\/／、]\s*L[1-5])*$/.test(t)) {
    return t.split(/\s*[\/／、]\s*/).map((x) => TIER_WORDS[x] ?? x).join(" / ");
  }
  if (t === "\u6765\u6E90\u5C42\u7EA7") return "\u6765\u6E90";
  return text;
}
function stripFactIds(text) {
  return text.replace(/\s*\[F-?\d{1,4}(?:\s*[\/、,，;；|]\s*F-?\d{1,4})*\]/g, "").replace(/[ \t]+([，。；：）])/g, "$1");
}
var PRIORITY_WORDS = { P0: "\u4F18\u5148", P1: "\u91CD\u8981", P2: "\u5907\u9009" };
function humanizeHypothesis(text) {
  return text.replace(/^\s*H(\d+)\s*[·・:：\-–]\s*(P[012])\s*[·・:：\-–]\s*/, (_m, n, p) => `\u5047\u8BBE ${n}\uFF08${PRIORITY_WORDS[p] ?? p}\uFF09`).replace(/(?<![A-Za-z0-9])H(\d{1,2})(?![A-Za-z0-9])/g, "\u5047\u8BBE $1");
}
function inline(text) {
  let html = esc(humanizeHypothesis(stripFactIds(text)));
  html = html.replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
  return html;
}
var CIRCLED = { "\u2460": "1", "\u2461": "2", "\u2462": "3", "\u2463": "4", "\u2464": "5", "\u2465": "6", "\u2466": "7", "\u2467": "8", "\u2468": "9", "\u2469": "10" };
function normalizeHeading(text) {
  return text.trim().replace(/^([①②③④⑤⑥⑦⑧⑨⑩])\s*/, (_m, c) => `${CIRCLED[c] ?? c}\u3001`).replace(/^(\d+)[.．]\s*/, "$1\u3001");
}
function renderCardMarkdown(md) {
  const lines = md.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  let i = 0;
  const flushList = (items, ordered) => {
    if (!items.length) return;
    const tag = ordered ? "ol" : "ul";
    out.push(`<${tag}>${items.map((it) => `<li>${inline(it)}</li>`).join("")}</${tag}>`);
  };
  while (i < lines.length) {
    const line = lines[i] ?? "";
    const t = line.trim();
    if (t === "") {
      i++;
      continue;
    }
    if (/^---+$/.test(t)) {
      out.push("<hr/>");
      i++;
      continue;
    }
    const sep = lines[i + 1] ?? "";
    if (t.startsWith("|") && /^\|[\s:|-]+\|?$/.test(sep.trim())) {
      const header = t.split("|").slice(1, -1).map((c) => humanizeCell(c.trim()));
      i += 2;
      const rows = [];
      while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
        rows.push((lines[i] ?? "").trim().split("|").slice(1, -1).map((c) => humanizeCell(c.trim())));
        i++;
      }
      const thead = `<thead><tr>${header.map((h2) => `<th>${inline(h2)}</th>`).join("")}</tr></thead>`;
      const tbody = `<tbody>${rows.map((r) => `<tr>${r.map((c) => `<td>${inline(c)}</td>`).join("")}</tr>`).join("")}</tbody>`;
      out.push(`<div class="tw"><table>${thead}${tbody}</table></div>`);
      continue;
    }
    const h = /^(#{1,4})\s+(.*)$/.exec(t);
    if (h) {
      const level = (h[1] ?? "##").length;
      out.push(`<h${level}>${inline(normalizeHeading(h[2] ?? ""))}</h${level}>`);
      i++;
      continue;
    }
    if (t.startsWith(">")) {
      out.push(`<p class="note">${inline(t.replace(/^>\s?/, ""))}</p>`);
      i++;
      continue;
    }
    if (/^[-*]\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^\s*[-*]\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").trim().replace(/^[-*]\s+/, ""));
        i++;
      }
      flushList(items, false);
      continue;
    }
    if (/^\d+\.\s+/.test(t)) {
      const items = [];
      while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i] ?? "")) {
        items.push((lines[i] ?? "").trim().replace(/^\d+\.\s+/, ""));
        i++;
      }
      flushList(items, true);
      continue;
    }
    out.push(`<p>${inline(t)}</p>`);
    i++;
  }
  return out.join("\n");
}
var REPORT_CSS = `
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
/* \u5927\u6807\u9898\uFF1A\u84DD\u8272 + \u6807\u9898\u4E0B\u77ED\u6A2A\u7EBF\uFF1B\u5C0F\u6807\u9898\uFF1A\u6D45\u7070\u5E95 + \u5DE6\u4FA7\u84DD\u7AD6\u7EBF */
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
/* \u9996\u5217\u591A\u4E3A\u201C\u7B49\u7EA7/\u65E5\u671F/\u63A8\u8350\u7EA7\u201D\u8FD9\u7C7B\u77ED\u6807\u7B7E\uFF1A\u4E0D\u6362\u884C\u3001\u4E0D\u88AB\u6324\u6241\uFF1B\u957F\u6587\u672C\u5217\u81EA\u9002\u5E94 */
td:first-child,th:first-child{white-space:nowrap;width:1%}
td:nth-child(2){min-width:180px}
/* \u72B6\u6001\u8272\uFF1A\u51FA\u73B0\u7EA2\u7EBF/\u5173\u6CE8/\u786E\u8BA4\u7B49\u8BCD\u81EA\u52A8\u67D3\u8272\u7531\u5185\u5BB9\u51B3\u5B9A\uFF0C\u8FD9\u91CC\u7ED9\u51FA\u53EF\u7528\u7C7B */
.tag-ok{color:var(--ok);background:var(--ok-bg)}
.tag-warn{color:var(--warn);background:var(--warn-bg)}
.tag-risk{color:var(--risk);background:var(--risk-bg)}
footer{padding:14px 26px 20px;border-top:1px solid var(--line);color:var(--muted);font-size:11.5px;line-height:1.7}
@media print{body{background:#fff}.sheet{border:0;box-shadow:none;margin:0}}
`;
function deriveMeta(md, meta) {
  const first = /^#?\s*(?:访前尽调报告|拜访作战卡)\s*·\s*([^\n锚]+)/m.exec(md);
  const anchorLine = /锚定主体：([^\n]+?)(?:\s*生成时间|$)/m.exec(md);
  const whenLine = /生成时间[:：]\s*([0-9-]+)/.exec(md);
  return {
    company: meta?.company || (first?.[1]?.trim() ?? "\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A"),
    anchor: (anchorLine?.[1] ?? "").trim().replace(/[｜|·\s]+$/, ""),
    when: meta?.generatedAt || (whenLine?.[1] ?? "")
  };
}
function wrapPrevisitReport(bodyHtml, m) {
  const heroMeta = [m.anchor, m.when ? `\u751F\u6210\u65F6\u95F4\uFF1A${m.when}` : ""].filter(Boolean).join("\u3000\xB7\u3000");
  return `<!doctype html><html lang="zh"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A \xB7 ${esc(m.company)}</title><style>${REPORT_CSS}</style></head>
<body><div class="sheet">
<div class="hero"><p class="eyebrow">\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A</p><h1>${esc(m.company)}</h1>${heroMeta ? `<p class="meta">${esc(heroMeta)}</p>` : ""}</div>
<div class="body">${bodyHtml}</div>
<footer>\u6570\u636E\u6765\u6E90\uFF1A\u4F01\u67E5\u67E5\u3002\u5404\u7EF4\u5EA6\u65F6\u6548\u4E0D\u540C\uFF0C\u4E0D\u627F\u8BFA\u5B9E\u65F6\u3002\u672C\u62A5\u544A\u4E3A\u8BBF\u524D\u8F85\u52A9\u6750\u6599\uFF0C\u4E0D\u6784\u6210\u6388\u4FE1\u3001\u5408\u4F5C\u6216\u4EFB\u4F55\u5546\u4E1A\u51B3\u7B56\u4F9D\u636E\uFF0C\u4EE5\u5B98\u65B9\u516C\u793A\u4E3A\u51C6\u3002</footer>
</div></body></html>`;
}
function buildPrevisitReportHtml(cardMarkdown, meta) {
  const m = deriveMeta(cardMarkdown, meta);
  const body = cardMarkdown.replace(/^#\s*(?:访前尽调报告|拜访作战卡).*$/m, "").replace(/^锚定主体：.*$/m, "").trim();
  return wrapPrevisitReport(renderCardMarkdown(body), m);
}

// src/previsit-workflow.ts
import { randomUUID } from "node:crypto";
var PREVISIT_TASK_STATES = [
  "needs-entity-search",
  "needs-entity-confirmation",
  "entity-confirmed",
  "running",
  "finalizing",
  "completed",
  "partial",
  "failed"
];
var PREVISIT_TERMINAL_STATES = /* @__PURE__ */ new Set(["completed", "partial", "failed"]);
var DOMAIN_SPEC = {
  name: "previsit_tasks_v1",
  version: 1,
  tables: {
    tasks: {
      valueSchema: {
        parse: (value) => value,
        safeParse: (value) => ({ success: true, data: value })
      }
    }
  }
};
var VALID_REQUEST_ID = /^PV-\d{8}-[A-Z0-9-]{4,40}$/;
var nowIso = () => (/* @__PURE__ */ new Date()).toISOString();
function isRecord(value) {
  if (value === null || typeof value !== "object") return false;
  const record = value;
  return typeof record.id === "string" && record.schemaVersion === 1 && typeof record.sessionId === "string" && typeof record.query === "string" && typeof record.limit === "number" && typeof record.used === "number" && Array.isArray(record.runs) && PREVISIT_TASK_STATES.includes(record.state);
}
function normalizeTerminalRecord(record) {
  const reportReady = typeof record.reportMarkdown === "string" && record.reportMarkdown.trim() !== "";
  if (PREVISIT_TERMINAL_STATES.has(record.state) || !reportReady) return record;
  return {
    ...record,
    state: record.runs.some((run) => run.status === "failed") ? "partial" : "completed",
    stage: "output",
    completedAt: record.completedAt ?? record.artifact?.createdAt ?? record.updatedAt
  };
}
function assertTaskOpen(record) {
  if (PREVISIT_TERMINAL_STATES.has(record.state) || (record.reportMarkdown?.trim() ?? "") !== "") {
    throw new Error("\u8BBF\u524D\u4EFB\u52A1\u5DF2\u7ED3\u675F\uFF1B\u8BF7\u65B0\u5EFA\u5C3D\u8C03\u540E\u518D\u67E5\u8BE2");
  }
}
function normalizePrevisitRequestId(value) {
  if (typeof value !== "string") return void 0;
  const id = value.trim().toUpperCase();
  return VALID_REQUEST_ID.test(id) ? id : void 0;
}
function createPrevisitHostTaskId() {
  return `PVT-${randomUUID()}`;
}
function reportArtifactFor(task, timestamp = nowIso()) {
  const company = (task.entity?.fullName || task.query || "\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, "-").slice(0, 80);
  return {
    id: `PVA-${randomUUID()}`,
    format: "html",
    fileName: `\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A_${company}.html`,
    mediaType: "text/html; charset=utf-8",
    createdAt: timestamp
  };
}
function validatePrevisitReport(reportMarkdown, entityName) {
  const report = reportMarkdown.trim();
  if (report.length < 80 || report.length > 24e4) throw new Error("\u7F3A\u5C11\u6709\u6548\u7684\u5B8C\u6574\u62A5\u544A");
  const required = ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u4E1A\u52A1\u5047\u8BBE", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u89E6\u8FBE\u5F00\u573A", "\u8986\u76D6\u8BF4\u660E"];
  const headings = [...report.matchAll(/^#{2,4}\s+(.+)$/gm)].map((match) => match[1] ?? "");
  if (!required.every((section) => headings.some((heading) => heading.includes(section)))) throw new Error("\u62A5\u544A\u7F3A\u5C11\u56FA\u5B9A\u516B\u6BB5\uFF0C\u672A\u751F\u6210\u5236\u54C1");
  if (entityName !== void 0 && !report.includes(entityName)) throw new Error("\u62A5\u544A\u4E3B\u4F53\u4E0E\u5DF2\u786E\u8BA4\u6CD5\u5F8B\u5B9E\u4F53\u4E0D\u4E00\u81F4");
  return report;
}
var PrevisitWorkflowStore = class {
  records = /* @__PURE__ */ new Map();
  table;
  attachPromise;
  attach(storageDomain, logger = console) {
    if (this.attachPromise !== void 0) return this.attachPromise;
    this.attachPromise = storageDomain.open(DOMAIN_SPEC).then(async (access) => {
      this.table = access.table("tasks");
      for (const [id, value] of this.table.entries()) if (isRecord(value)) this.records.set(id, normalizeTerminalRecord(value));
      for (const [id, record] of this.records) await this.table.put(id, record);
      logger.info?.("[dsh-pre-duediligence] persistent task state ready");
    }).catch((error) => {
      logger.warn?.(`[dsh-pre-duediligence] persistent task state unavailable: ${error instanceof Error ? error.message : String(error)}`);
      this.attachPromise = void 0;
    });
    return this.attachPromise;
  }
  async list(sessionId) {
    const records = [];
    for (const cached of this.records.values()) {
      const record = normalizeTerminalRecord(cached);
      if (record !== cached) await this.put(record);
      if (sessionId === void 0 || record.sessionId === sessionId) records.push(record);
    }
    return records.sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  }
  async get(id) {
    const cached = this.records.get(id);
    if (cached !== void 0) {
      const normalized2 = normalizeTerminalRecord(cached);
      if (normalized2 !== cached) await this.put(normalized2);
      return normalized2;
    }
    if (this.table === void 0) return void 0;
    const value = await this.table.get(id);
    if (!isRecord(value)) return void 0;
    const normalized = normalizeTerminalRecord(value);
    if (normalized !== value) await this.put(normalized);
    else this.records.set(id, normalized);
    return normalized;
  }
  async put(record) {
    this.records.set(record.id, record);
    await this.table?.put(record.id, record);
    return record;
  }
  async create(input) {
    const timestamp = nowIso();
    const id = normalizePrevisitRequestId(input.id) ?? createPrevisitHostTaskId();
    const existing = await this.get(id);
    if (existing !== void 0 && existing.sessionId !== input.sessionId) throw new Error("\u4EFB\u52A1\u6807\u8BC6\u5DF2\u5C5E\u4E8E\u5176\u4ED6\u4F1A\u8BDD");
    if (existing !== void 0) {
      assertTaskOpen(existing);
      return this.update(id, (current) => {
        const { entity: _entity, lastError: _lastError, reportMarkdown: _report, artifact: _artifact, completedAt: _completedAt, ...retained } = current;
        return {
          ...retained,
          query: input.query,
          depth: input.depth,
          limit: Math.max(current.used, input.limit),
          state: "needs-entity-search",
          stage: "target"
        };
      });
    }
    return this.put({
      id,
      schemaVersion: 1,
      revision: 1,
      sessionId: input.sessionId,
      workspace: input.workspace,
      query: input.query,
      depth: input.depth,
      limit: input.limit,
      used: 0,
      state: "needs-entity-search",
      stage: "target",
      runs: [],
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
  async update(id, updater) {
    const current = await this.get(id);
    if (current === void 0) throw new Error("\u8BBF\u524D\u4EFB\u52A1\u4E0D\u5B58\u5728");
    const proposed = updater(current);
    const next = {
      ...proposed,
      id: current.id,
      schemaVersion: 1,
      revision: current.revision + 1,
      updatedAt: nowIso()
    };
    return this.put(next);
  }
  async startRun(id, input) {
    const timestamp = nowIso();
    return this.update(id, (current) => {
      assertTaskOpen(current);
      const { lastError: _lastError, ...retained } = current;
      return {
        ...retained,
        used: current.used + (input.quotaUsed ? 1 : 0),
        state: "running",
        stage: input.dimension === "entity_search" ? "target" : /risk|dishonest|enforcement|terminated|freeze|exception|penalty|tax|judicial|executive/.test(input.dimension) ? "verify" : "collect",
        runs: [...current.runs, {
          id: input.runId,
          dimension: input.dimension,
          ...input.toolName === void 0 ? {} : { toolName: input.toolName },
          status: "running",
          quotaUsed: input.quotaUsed,
          startedAt: timestamp
        }].slice(-160)
      };
    });
  }
  async finishRun(id, runId, status, message) {
    const timestamp = nowIso();
    return this.update(id, (current) => {
      const runs = current.runs.map((run2) => run2.id === runId ? {
        ...run2,
        status,
        completedAt: timestamp,
        ...message === void 0 ? {} : { message: message.slice(0, 500) }
      } : run2);
      const run = runs.find((item) => item.id === runId);
      if (PREVISIT_TERMINAL_STATES.has(current.state) || (current.reportMarkdown?.trim() ?? "") !== "") {
        return { ...current, runs };
      }
      const nextState = run?.dimension === "entity_search" ? status === "done" || status === "unknown" ? "needs-entity-confirmation" : "needs-entity-search" : current.used >= current.limit ? "finalizing" : current.state;
      return {
        ...current,
        runs,
        state: nextState,
        stage: nextState === "finalizing" ? "output" : current.stage,
        ...status === "failed" ? { lastError: message ?? "\u67E5\u8BE2\u5931\u8D25" } : {}
      };
    });
  }
  async confirmEntity(id, entity) {
    return this.update(id, (current) => {
      assertTaskOpen(current);
      const { lastError: _lastError, ...retained } = current;
      return { ...retained, entity, state: "entity-confirmed", stage: "scope" };
    });
  }
  async finalize(id, reportMarkdown, state) {
    const timestamp = nowIso();
    const current = await this.get(id);
    if (current === void 0) throw new Error("\u8BBF\u524D\u4EFB\u52A1\u4E0D\u5B58\u5728");
    if (PREVISIT_TERMINAL_STATES.has(current.state) && current.reportMarkdown !== void 0) return current;
    const report = validatePrevisitReport(reportMarkdown, current.entity?.fullName);
    const artifact = reportArtifactFor(current, timestamp);
    return this.update(id, (record) => {
      const { lastError: _lastError, ...retained } = record;
      return {
        ...retained,
        state,
        stage: "output",
        reportMarkdown: report,
        artifact,
        completedAt: timestamp
      };
    });
  }
};

// src/previsit-web.ts
function isTrusted(req) {
  const fetchSite = String(req.headers["sec-fetch-site"] ?? "");
  if (fetchSite === "cross-site") return false;
  const origin = req.headers.origin;
  if (typeof origin === "string") {
    try {
      const parsed = new URL(origin);
      if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") return false;
    } catch {
      return false;
    }
  }
  return true;
}
function writeJson(res, status, payload) {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer"
  });
  res.end(JSON.stringify(payload));
}
async function readJson(req) {
  const chunks = [];
  let size = 0;
  for await (const chunk of req) {
    size += chunk.length;
    if (size > 256e3) throw new Error("report payload too large");
    chunks.push(chunk);
  }
  const text = Buffer.concat(chunks).toString("utf8");
  const value = text === "" ? {} : JSON.parse(text);
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid JSON body");
  return value;
}
function publicTask(task) {
  const { reportMarkdown, ...record } = task;
  return { ...record, reportReady: typeof reportMarkdown === "string" && reportMarkdown.length > 0 };
}
function mountPrevisitWebRoutes(webServer, workflow) {
  return webServer.register({
    kind: "prefix",
    path: "/previsit/api/tasks",
    async handler(req, res) {
      if (!isTrusted(req)) return writeJson(res, 403, { ok: false, code: "PREVISIT_UNTRUSTED", message: "untrusted origin" });
      try {
        const url = new URL(req.url ?? "/previsit/api/tasks", "http://127.0.0.1");
        const segments = url.pathname.split("/").filter(Boolean);
        const tasksIndex = segments.indexOf("tasks");
        const rest = tasksIndex === -1 ? [] : segments.slice(tasksIndex + 1);
        if (rest.length === 0) {
          if (req.method !== "GET") return writeJson(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET required" });
          const sessionId2 = url.searchParams.get("sessionId") ?? void 0;
          if (sessionId2 !== void 0 && !isPrevisitSession(sessionId2)) return writeJson(res, 400, { ok: false, code: "PREVISIT_SESSION", message: "invalid previsit session" });
          const tasks = await workflow.list(sessionId2);
          return writeJson(res, 200, { ok: true, marker: "previsit-workflow-v1", tasks: tasks.map(publicTask) });
        }
        const taskId = decodeURIComponent(rest[0] ?? "");
        if (normalizePrevisitRequestId(taskId) === void 0 && !/^PVT-[a-f0-9-]{36}$/i.test(taskId)) {
          return writeJson(res, 400, { ok: false, code: "PREVISIT_TASK_ID", message: "invalid task id" });
        }
        const task = await workflow.get(taskId);
        if (task === void 0) return writeJson(res, 404, { ok: false, code: "PREVISIT_NOT_FOUND", message: "task not found" });
        const sessionId = url.searchParams.get("sessionId");
        if (sessionId === null || !isPrevisitSession(sessionId) || sessionId !== task.sessionId) {
          return writeJson(res, 403, { ok: false, code: "PREVISIT_TASK_SCOPE", message: "task does not belong to this session" });
        }
        if (rest.length === 1) {
          if (req.method !== "GET") return writeJson(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET required" });
          return writeJson(res, 200, {
            ok: true,
            marker: "previsit-workflow-v1",
            task: { ...publicTask(task), ...task.reportMarkdown === void 0 ? {} : { reportMarkdown: task.reportMarkdown } }
          });
        }
        if (rest.length === 2 && rest[1] === "report") {
          if (req.method === "PUT") {
            const payload = await readJson(req);
            if (typeof payload.reportMarkdown !== "string") return writeJson(res, 400, { ok: false, code: "PREVISIT_REPORT", message: "reportMarkdown required" });
            const reportMarkdown = validatePrevisitReport(payload.reportMarkdown, task.entity?.fullName);
            const completed = await workflow.finalize(task.id, reportMarkdown, payload.status === "partial" ? "partial" : "completed");
            return writeJson(res, 200, { ok: true, marker: "previsit-workflow-v1", task: { ...publicTask(completed), reportMarkdown: completed.reportMarkdown } });
          }
          if (req.method !== "GET") return writeJson(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET or PUT required" });
          if (task.reportMarkdown === void 0 || task.artifact === void 0) {
            return writeJson(res, 409, { ok: false, code: "PREVISIT_REPORT_PENDING", message: "report not ready" });
          }
          const html = buildPrevisitReportHtml(task.reportMarkdown, {
            ...task.entity?.fullName === void 0 ? {} : { company: task.entity.fullName },
            ...task.completedAt === void 0 ? {} : { generatedAt: task.completedAt.slice(0, 10) }
          });
          const ascii = task.artifact.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_");
          res.writeHead(200, {
            "content-type": task.artifact.mediaType,
            "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(task.artifact.fileName)}`,
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
            "referrer-policy": "no-referrer"
          });
          return res.end(html);
        }
        return writeJson(res, 404, { ok: false, code: "PREVISIT_ROUTE", message: "route not found" });
      } catch (error) {
        return writeJson(res, 500, { ok: false, code: "PREVISIT_HOST", message: error instanceof Error ? error.message : String(error) });
      }
    }
  });
}

// src/previsit-tools.ts
import { randomUUID as randomUUID2 } from "node:crypto";

// src/tool-outcome.ts
function classifyToolOutcome(value, isError = false) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const data = value;
    const code = data.code ?? data.error?.code;
    if ([401, 403, "401", "403", "FORBIDDEN", "UNAUTHORIZED", "PERMISSION_DENIED"].includes(code)) return "no-permission";
    if (["UNKNOWN_TOOL", "ABORTED_BEFORE_DISPATCH", "NOT_EXECUTED"].includes(code)) return "not-executed";
    if (data.status === "no-permission" || data.status === "not-executed") return data.status;
    if (isError || data.isError === true || data.success === false || data.error != null) return "failed";
    if (data.status === "failed") return "failed";
    if (data.status === "no-data" || data.total === 0 || data.count === 0) return "no-data";
    if ("data" in data) return classifyToolOutcome(data.data);
    for (const key of ["items", "records", "results"]) if (Array.isArray(data[key])) return classifyToolOutcome(data[key]);
    if (data.status === "done" || data.success === true) return "done";
  }
  if (isError) return "failed";
  if (Array.isArray(value)) return value.length === 0 ? "no-data" : "done";
  return "unknown";
}

// src/previsit-tools.ts
var QUERY_ROUTES = {
  entity_search: ["company", "get_company_by_query"],
  registration: ["company", "get_company_registration_info"],
  profile: ["company", "get_company_profile"],
  annual_reports: ["company", "get_annual_reports"],
  changes: ["company", "get_change_records"],
  shareholders: ["company", "get_shareholder_info"],
  beneficiaries: ["company", "get_beneficial_owners"],
  personnel: ["company", "get_key_personnel"],
  contacts: ["company", "get_contact_info"],
  investments: ["company", "get_external_investments"],
  branches: ["company", "get_branches"],
  risk_scan: ["risk", "get_company_risk_scan"],
  dishonest: ["risk", "get_dishonest_info"],
  enforcement: ["risk", "get_judgment_debtor_info"],
  terminated_cases: ["risk", "get_terminated_cases"],
  equity_freeze: ["risk", "get_equity_freeze"],
  business_exception: ["risk", "get_business_exception"],
  administrative_penalty: ["risk", "get_administrative_penalty"],
  tax_abnormal: ["risk", "get_tax_abnormal"],
  judicial_documents: ["risk", "get_judicial_documents"],
  patents: ["ipr", "get_patent_info"],
  software_copyright: ["ipr", "get_software_copyright_info"],
  financing: ["operation", "get_financing_records"],
  bidding: ["operation", "get_bidding_info"],
  recruitment: ["operation", "get_recruitment_info"],
  qualifications: ["operation", "get_qualifications"],
  licenses: ["operation", "get_administrative_license"],
  land: ["operation", "get_land_grant_info"],
  executive_risk: ["executive", "get_executive_risk_scan"]
};
var QUERY_ROUTE_ALIASES = {
  key_personnel: "personnel"
};
var LIMITS = { fast: 8, standard: 18, deep: 40 };
var qccTool = (name) => /^mcp__(?:qcc(?:[-_][A-Za-z0-9_-]+)?|company|risk|ipr|operation|executive)__/.test(name);
var ownerOf = (agent) => JSON.stringify([agent.id, agent.session.id, agent.session.header?.cwd ?? ""]);
var object = (value) => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("\u53C2\u6570\u5FC5\u987B\u4E3A\u5BF9\u8C61");
  return value;
};
var string = (value) => {
  if (typeof value !== "string" || value.trim() === "" || value.length > 300) throw new Error("\u7F3A\u5C11\u6709\u6548\u53C2\u6570");
  return value.trim();
};
var reportString = (value) => {
  if (typeof value !== "string" || value.trim().length < 80 || value.length > 24e4) throw new Error("\u7F3A\u5C11\u6709\u6548\u7684\u5B8C\u6574\u62A5\u544A");
  return value.trim();
};
function structured(result) {
  const value = result.value;
  if (value && typeof value === "object" && "structuredContent" in value) return value.structuredContent;
  const content = value && typeof value === "object" && "content" in value ? value.content : result.content;
  if (Array.isArray(content)) {
    const texts = content.filter((v) => v?.type === "text" && typeof v.text === "string");
    if (texts.length === 1) {
      try {
        return JSON.parse(texts[0].text);
      } catch {
      }
    }
  }
  return value ?? content;
}
function containsName(value, name, depth = 0) {
  if (depth > 30 || value === null || typeof value !== "object") return false;
  return Object.values(value).some((v) => v === name || containsName(v, name, depth + 1));
}
function scanCount(value, dimension, tool, depth = 0) {
  if (depth > 30 || value === null || typeof value !== "object") return void 0;
  const record = value;
  const candidate = record[dimension] ?? record[tool];
  const count = typeof candidate === "number" ? candidate : candidate && typeof candidate === "object" ? candidate.count : void 0;
  if (typeof count === "number" && Number.isInteger(count) && count >= 0) return count;
  for (const child of Object.values(record)) {
    const found = scanCount(child, dimension, tool, depth + 1);
    if (found !== void 0) return found;
  }
  return void 0;
}
function containsEntity(value, name, code, depth = 0) {
  if (depth > 30 || value === null || typeof value !== "object") return false;
  const values = Object.values(value);
  return !Array.isArray(value) && values.includes(name) && values.includes(code) || values.some((v) => containsEntity(v, name, code, depth + 1));
}
function registerPrevisitTools(ctx, workflow = new PrevisitWorkflowStore()) {
  const tasks = /* @__PURE__ */ new Map();
  const beginning = /* @__PURE__ */ new Set();
  const permits = /* @__PURE__ */ new Map();
  const controllers = /* @__PURE__ */ new Set();
  let disposed = false;
  const disposers = [];
  disposers.push(ctx.tools.guard((exec) => {
    if (!exec.agent || !isPrevisitSession(exec.agent.session.id) || !qccTool(exec.name)) return void 0;
    const permit = permits.get(exec.callId);
    return !disposed && permit?.owner === ownerOf(exec.agent) && permit.name === exec.name && permit.parent === exec.parent ? void 0 : "\u8BBF\u524D\u4F01\u67E5\u67E5\u8C03\u7528\u5FC5\u987B\u901A\u8FC7 previsit_begin / previsit_confirm_entity / previsit_query\uFF1B\u7981\u6B62\u7ED5\u8FC7\u4E3B\u4F53\u4E0E\u9884\u7B97\u3002";
  }));
  const register = (name, description, properties, required, execute) => {
    disposers.push(ctx.tools.register({
      name,
      description,
      parameters: { type: "object", properties, required, additionalProperties: false },
      output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => [{ type: "text", text: JSON.stringify(value) }] },
      async execute(args, execution) {
        if (disposed || !execution.agent || !isPrevisitSession(execution.agent.session.id)) throw new Error("\u8BF7\u4ECE\u8BBF\u524D\u5C3D\u8C03\u5165\u53E3\u8FDB\u5165\u4E13\u5C5E\u4F1A\u8BDD");
        const controller = new AbortController();
        controllers.add(controller);
        const exec = {
          ...execution,
          signal: AbortSignal.any([execution.signal, controller.signal]),
          // ToolRuntime tracks conclusion by the original execution object's identity.
          concludeTurn: () => execution.concludeTurn?.(),
          deferContext: (context) => execution.deferContext?.(context)
        };
        try {
          exec.signal.throwIfAborted();
          return await execute(object(args), exec, execution.agent);
        } finally {
          controllers.delete(controller);
        }
      }
    }));
  };
  register("previsit_begin", "\u5F00\u59CB\u8BBF\u524D\u5C3D\u8C03\u3002\u7528\u6237\u53D1\u9001\u4EFB\u52A1\u5373\u540C\u610F\u6309\u6240\u9009 8/18/40 \u6B21\u4E0A\u9650\u6267\u884C\uFF1B\u4E0D\u8981\u518D\u6B21\u8BF7\u6C42 MCP \u6743\u9650\u786E\u8BA4\u3002\u82E5\u63D0\u793A\u4E2D\u542B PV \u4EFB\u52A1 ID\uFF0C\u5FC5\u987B\u4F5C\u4E3A requestId \u4F20\u5165\uFF0C\u4EE5\u4FBF\u5DE5\u4F5C\u53F0\u540C\u6B65\u3002", {
    query: { type: "string" },
    depth: { type: "string", enum: Object.keys(LIMITS) },
    requestId: { type: "string" }
  }, ["query", "depth"], async (args, exec, agent) => {
    const query = string(args.query);
    const depth = string(args.depth);
    const limit = LIMITS[depth];
    if (!Object.hasOwn(LIMITS, depth)) throw new Error("\u65E0\u6548\u5C3D\u8C03\u6863\u4F4D");
    const owner = ownerOf(agent);
    if (beginning.has(owner) || tasks.get(owner)?.busy) throw new Error("\u5F53\u524D\u4EFB\u52A1\u4ECD\u6709\u672A\u5B8C\u6210\u64CD\u4F5C\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210");
    beginning.add(owner);
    try {
      exec.signal.throwIfAborted();
      const requestId = normalizePrevisitRequestId(args.requestId);
      const prior = tasks.get(owner);
      const record = await workflow.create({
        ...requestId === void 0 ? {} : { id: requestId },
        sessionId: agent.session.id,
        workspace: agent.session.header?.cwd ?? "",
        query,
        depth,
        limit
      });
      const task = prior?.id === record.id && prior.entity === void 0 ? { ...prior, query, depth, limit: record.limit, used: record.used, search: null, personnel: void 0, risk: void 0, busy: false } : { id: record.id, owner, query, depth, limit: record.limit, used: record.used, search: null, busy: false };
      tasks.set(owner, task);
      return { taskId: task.id, query, limit: task.limit, used: task.used, status: "needs-entity-search" };
    } finally {
      beginning.delete(owner);
    }
  });
  const requireTask = (args, agent) => {
    const owner = ownerOf(agent);
    if (beginning.has(owner)) throw new Error("\u65B0\u4EFB\u52A1\u4ECD\u5728\u521D\u59CB\u5316\uFF0C\u8BF7\u4E32\u884C\u6267\u884C");
    const task = tasks.get(owner);
    if (!task || task.id !== string(args.taskId)) throw new Error("\u4EFB\u52A1\u4E0D\u5B58\u5728\u6216\u4E0D\u5C5E\u4E8E\u5F53\u524D Agent/Session\uFF1B\u91CD\u542F\u540E\u8BF7\u4F7F\u7528\u539F `PV-*` \u6807\u8BC6\u91CD\u65B0\u5F00\u59CB\u4EFB\u52A1");
    if (task.busy) throw new Error("\u5F53\u524D\u4EFB\u52A1\u6709\u672A\u5B8C\u6210\u64CD\u4F5C\uFF0C\u8BF7\u4E32\u884C\u6267\u884C");
    return task;
  };
  register("previsit_confirm_entity", "\u7ED1\u5B9A\u7528\u6237\u5DF2\u4ECE\u5019\u9009\u4E2D\u9009\u62E9\u7684\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53\uFF1B\u8FD9\u662F\u4E3B\u4F53\u9009\u62E9\uFF0C\u4E0D\u5F97\u518D\u53D1\u8D77 MCP \u6743\u9650\u786E\u8BA4\u3002\u4E0D\u5F97\u9ED8\u8BA4\u9009\u62E9\u6A21\u7CCA\u5019\u9009\u4E2D\u7684\u7B2C\u4E00\u9879\u3002", {
    taskId: { type: "string" },
    fullName: { type: "string" },
    creditCode: { type: "string" }
  }, ["taskId", "fullName", "creditCode"], async (args, exec, agent) => {
    const task = requireTask(args, agent);
    const fullName = string(args.fullName), creditCode = string(args.creditCode);
    if (!/^[0-9A-Z]{18}$/.test(creditCode) || !containsEntity(task.search, fullName, creditCode)) throw new Error("\u5168\u79F0\u548C\u4FE1\u7528\u4EE3\u7801\u5FC5\u987B\u6765\u81EA\u540C\u4E00\u6761\u5B9E\u9645\u641C\u7D22\u8BB0\u5F55\uFF1B\u65E0\u6CD5\u8BC6\u522B\u65F6\u505C\u6B62\u5E76\u6838\u5BF9 Provider \u8FD4\u56DE\u5951\u7EA6");
    task.busy = true;
    try {
      exec.signal.throwIfAborted();
      task.entity = { fullName, creditCode };
      task.personnel = void 0;
      task.risk = void 0;
      await workflow.confirmEntity(task.id, task.entity);
      return { taskId: task.id, entity: task.entity, status: "entity-confirmed" };
    } finally {
      task.busy = false;
    }
  });
  register("previsit_query", "\u67E5\u8BE2\u5DF2\u786E\u8BA4\u4EFB\u52A1\u7684\u4E00\u9879\u4E1A\u52A1\u7EF4\u5EA6\u3002\u9996\u5148 entity_search\uFF1B\u786E\u8BA4\u552F\u4E00\u4E3B\u4F53\u540E\u518D\u67E5\u8BE2\u5176\u4F59\u7EF4\u5EA6\u3002\u56FA\u5B9A\u8DEF\u7531\u3001\u9884\u7B97\u5185\u6267\u884C\uFF0C\u4E0D\u63A5\u53D7\u52A8\u6001 MCP \u540D\u79F0\u6216\u8DE8\u4F01\u4E1A\u53C2\u6570\u3002", {
    taskId: { type: "string" },
    dimension: { type: "string", enum: [...Object.keys(QUERY_ROUTES), ...Object.keys(QUERY_ROUTE_ALIASES)] },
    personName: { type: "string" }
  }, ["taskId", "dimension"], async (args, exec, agent) => {
    const task = requireTask(args, agent);
    const requestedDimension = string(args.dimension);
    const dimension = QUERY_ROUTE_ALIASES[requestedDimension] ?? requestedDimension;
    if (!Object.hasOwn(QUERY_ROUTES, dimension)) throw new Error("\u4E0D\u652F\u6301\u7684\u4E1A\u52A1\u7EF4\u5EA6");
    const skipped = async (reason) => {
      const runId = `previsit-skip-${randomUUID2()}`;
      await workflow.startRun(task.id, { runId, dimension, quotaUsed: false });
      await workflow.finishRun(task.id, runId, "not-executed", reason);
      return { taskId: task.id, dimension, outcome: "not-executed", reason, used: task.used, limit: task.limit };
    };
    if (task.used >= task.limit) return skipped("\u8C03\u7528\u9884\u7B97\u5DF2\u7528\u5B8C");
    if (dimension !== "entity_search" && !task.entity) throw new Error("\u5FC5\u987B\u5148\u641C\u7D22\u5E76\u7ECF\u7528\u6237\u786E\u8BA4\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53");
    if (dimension === "entity_search" && task.entity) throw new Error("\u5DF2\u786E\u8BA4\u4E3B\u4F53\uFF1B\u91CD\u65B0\u641C\u7D22\u524D\u8BF7\u5EFA\u7ACB\u5E76\u786E\u8BA4\u65B0\u4EFB\u52A1");
    const [server, tool] = QUERY_ROUTES[dimension];
    if (server === "risk" && dimension !== "risk_scan") {
      const count = scanCount(task.risk, dimension, tool);
      if (count === void 0 || count === 0) return skipped(count === 0 ? "\u626B\u63CF\u8FD4\u56DE\u96F6\u8BB0\u5F55\uFF0C\u4E0D\u4E0B\u94BB" : "\u5C1A\u65E0\u53EF\u6838\u9A8C\u7684\u975E\u96F6\u626B\u63CF\u8BA1\u6570\uFF1B\u8BF7\u6838\u5BF9 Provider \u626B\u63CF\u5951\u7EA6");
    }
    const tools = ctx.tools.schemas(agent).filter((s) => s.name === `mcp__qcc_${server}__${tool}` || s.name === `mcp__qcc-${server}__${tool}` || s.name === `mcp__${server}__${tool}`);
    if (tools.length !== 1) return skipped(tools.length ? "\u5B58\u5728\u591A\u4E2A\u540C\u540D\u6765\u6E90\uFF0C\u8BF7\u68C0\u67E5 MCP \u8FDE\u63A5" : "\u6240\u9700 MCP \u670D\u52A1\u672A\u63A5\u5165\u6216\u5DE5\u5177\u63A5\u53E3\u4E0D\u5339\u914D");
    const selected = tools[0];
    const properties = selected.parameters?.properties ?? {};
    const queryKey = dimension === "entity_search" && "query" in properties ? "query" : "searchKey";
    const parameters = { [queryKey]: task.entity?.creditCode ?? task.query };
    if (!(queryKey in properties)) return skipped("Provider \u67E5\u8BE2\u53C2\u6570\u5951\u7EA6\u4E0D\u5339\u914D");
    if (dimension === "executive_risk") {
      const person = string(args.personName);
      if (!containsName(task.personnel, person)) throw new Error("\u8463\u76D1\u9AD8\u59D3\u540D\u5FC5\u987B\u6765\u81EA\u672C\u4E3B\u4F53\u5B9E\u9645\u5173\u952E\u4EBA\u5458\u8FD4\u56DE");
      parameters.personName = person;
    }
    if (selected.parameters?.required?.some((key) => !(key in parameters))) return skipped("Provider \u9700\u8981\u989D\u5916\u53C2\u6570\uFF0C\u8BF7\u8865\u5BF9\u5E94\u4E1A\u52A1\u9002\u914D");
    task.busy = true;
    const callId = `previsit-${randomUUID2()}`;
    let runStarted = false;
    permits.set(callId, { owner: task.owner, name: selected.name, parent: exec.token });
    try {
      exec.signal.throwIfAborted();
      await workflow.startRun(task.id, { runId: callId, dimension, toolName: selected.name, quotaUsed: true });
      runStarted = true;
      task.used += 1;
      const result = await ctx.tools.execute({ callId, rootCallId: exec.rootCallId, parent: exec.token, name: selected.name, arguments: parameters, agent, signal: exec.signal });
      for (const context of result.additionalContexts ?? []) exec.deferContext?.(context);
      if (!result.isError && result.concludesTurn) exec.concludeTurn?.();
      exec.signal.throwIfAborted();
      const data = structured(result);
      const outcome = result.isError ? classifyToolOutcome({ code: result.error?.info?.code }, true) : classifyToolOutcome(data);
      const usable = !result.isError && !["failed", "no-permission", "not-executed", "no-data"].includes(outcome);
      if (dimension === "entity_search") task.search = usable ? data : null;
      if (dimension === "personnel") task.personnel = usable ? data : null;
      if (dimension === "risk_scan") task.risk = usable ? data : null;
      await workflow.finishRun(task.id, callId, outcome, result.isError ? result.error?.message ?? "\u67E5\u8BE2\u5931\u8D25" : void 0);
      return { taskId: task.id, dimension, ...requestedDimension === dimension ? {} : { requestedDimension }, toolName: selected.name, outcome, used: task.used, limit: task.limit, data: result.isError ? { message: result.error?.message ?? "\u67E5\u8BE2\u5931\u8D25" } : data };
    } catch (error) {
      if (runStarted) await workflow.finishRun(task.id, callId, "failed", error instanceof Error ? error.message : String(error)).catch(() => {
      });
      throw error;
    } finally {
      permits.delete(callId);
      task.busy = false;
    }
  });
  register("previsit_finalize", "\u4FDD\u5B58\u5DF2\u7ECF\u5B8C\u6210\u7684\u516B\u6BB5\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A\u3001\u751F\u6210\u53EF\u4E0B\u8F7D\u5236\u54C1\u5E76\u7ED3\u675F\u4EFB\u52A1\u3002\u8C03\u7528\u540E\u4ECD\u987B\u628A\u540C\u4E00\u62A5\u544A\u6B63\u6587\u56DE\u590D\u7ED9\u7528\u6237\u3002", {
    taskId: { type: "string" },
    reportMarkdown: { type: "string", maxLength: 24e4 },
    status: { type: "string", enum: ["completed", "partial"] }
  }, ["taskId", "reportMarkdown"], async (args, exec, agent) => {
    const task = requireTask(args, agent);
    if (task.entity === void 0) throw new Error("\u5FC5\u987B\u5148\u786E\u8BA4\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53");
    const reportMarkdown = validatePrevisitReport(reportString(args.reportMarkdown), task.entity.fullName);
    exec.signal.throwIfAborted();
    const status = args.status === "partial" ? "partial" : "completed";
    const record = await workflow.finalize(task.id, reportMarkdown, status);
    return {
      taskId: task.id,
      status: record.state,
      used: record.used,
      limit: record.limit,
      entity: record.entity,
      artifact: record.artifact,
      reportUrl: `/previsit/api/tasks/${encodeURIComponent(task.id)}/report?sessionId=${encodeURIComponent(agent.session.id)}`
    };
  });
  return () => {
    disposed = true;
    for (const controller of controllers) controller.abort();
    for (const dispose of disposers.reverse()) dispose();
    tasks.clear();
    permits.clear();
    beginning.clear();
  };
}

// src/index.ts
var inject = ["skills", "tools"];
var SKILL_NAME = "qcc-previsit-onepager";
var SKILL_DESCRIPTION = "\u8C03\u7528\u4F01\u67E5\u67E5\u4E94\u7C7B MCP \u6267\u884C\u4F01\u4E1A\u8BBF\u524D\u5C3D\u8C03\uFF0C\u4EE5\u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE\u8BC6\u522B\u7ECF\u8425\u72B6\u6001\u3001\u5EFA\u7ACB\u5E76\u53CD\u8BC1\u4E1A\u52A1\u5047\u8BBE\uFF0C\u4EA4\u4ED8\u53EF\u8FFD\u6EAF\u7684\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A\u3002";
function loadBundledSkill() {
  const skillDirectoryUrl = new URL("../skills/qcc-previsit-onepager/", import.meta.url);
  const skillSource = readFileSync(new URL("SKILL.md", skillDirectoryUrl), "utf8");
  const { content } = parseSkillFile(skillSource);
  return {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    whenToUse: "\u7528\u6237\u8981\u6C42\u51C6\u5907\u5BA2\u6237\u62DC\u8BBF\u3001\u8BBF\u524D\u5C3D\u8C03\u3001\u4E00\u9875\u7EB8\u7B80\u62A5\u3001\u6388\u4FE1\u9762\u8C08\u3001\u5546\u52A1\u8C08\u5224\u3001\u7B7E\u7EA6\u6838\u67E5\u3001\u590D\u8BBF\u66F4\u65B0\u3001\u89E6\u8FBE\u8DEF\u5F84\u6216\u5F53\u9762\u63D0\u95EE\u6E05\u5355\u65F6\u4F7F\u7528\u3002",
    content,
    source: "bundled",
    resourceBase: {
      kind: "directory",
      path: fileURLToPath(skillDirectoryUrl)
    },
    metadata: {
      author: "QCC",
      version: "0.1.17",
      industry: "enterprise-services",
      mcpServers: ["qcc-company", "qcc-risk", "qcc-ipr", "qcc-operation", "qcc-executive"]
    }
  };
}
function apply(ctx) {
  const workflow = new PrevisitWorkflowStore();
  ctx.effect(() => registerPrevisitTools(ctx, workflow));
  ctx.skills.register(loadBundledSkill());
  try {
    ctx.inject?.(["webServer", "storageDomain"], (webCtx) => {
      void workflow.attach(webCtx.storageDomain, ctx.logger);
      webCtx.effect(() => mountPrevisitWebRoutes(webCtx.webServer, workflow));
    });
  } catch (error) {
    ctx.logger?.warn?.(`[dsh-pre-duediligence] Host task routes unavailable: ${error instanceof Error ? error.message : String(error)}`);
  }
}
export {
  SKILL_DESCRIPTION,
  SKILL_NAME,
  apply,
  inject,
  loadBundledSkill
};
//# sourceMappingURL=index.js.map
