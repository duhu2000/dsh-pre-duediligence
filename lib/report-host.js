// experimental/dsh-mcp-app-host/src/saved-index.mjs
import { Client, InMemoryTransport } from "@modelcontextprotocol/client";
import { z as z3 } from "zod";

// experimental/mcp-app/server/app-server.mjs
import { McpServer } from "@modelcontextprotocol/server";
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from "@modelcontextprotocol/ext-apps/server";
import { z } from "zod";
import { readFile } from "node:fs/promises";

// experimental/mcp-app/server/service.mjs
var ReadError = class extends Error {
  constructor(code) {
    super(code);
    this.code = code;
  }
};
function createReader(source, binding, audit = () => {
}) {
  const saved = structuredClone(source), grant2 = structuredClone(binding);
  const fail3 = (code) => {
    audit({ code });
    throw new ReadError(code);
  };
  function report2(args) {
    if (!grant2?.principal || !saved.owner || ["principal", "profile", "session"].some((k) => !grant2[k] || grant2[k] !== saved.owner[k]) || !grant2.reportIds?.includes(args.reportId)) fail3("ACCESS_DENIED");
    if (args.reportId !== saved.report?.reportId) fail3("REPORT_NOT_FOUND");
    if (args.reportVersion !== saved.report.reportVersion) fail3("VERSION_NOT_FOUND");
    if (saved.report.schemaVersion !== "1.0" || !saved.report.entity?.id || !Array.isArray(saved.report.sections) || saved.report.sections.length !== 8 || !Array.isArray(saved.report.findings) || !Array.isArray(saved.report.coverage)) fail3("LEGACY_FIELDS_MISSING");
    return structuredClone(saved.report);
  }
  return Object.freeze({
    getReport: report2,
    getEvidence(args) {
      const r = report2(args);
      if (!r.findings.some((f) => f.evidenceIds.includes(args.evidenceId))) fail3("EVIDENCE_NOT_FOUND");
      const evidence = saved.evidence.find((e) => e.id === args.evidenceId);
      if (!evidence) fail3("EVIDENCE_NOT_FOUND");
      return { schemaVersion: "1.0", reportId: r.reportId, reportVersion: r.reportVersion, entity: r.entity, evidence: structuredClone(evidence) };
    },
    listArtifacts(args) {
      const r = report2(args);
      return { schemaVersion: "1.0", reportId: r.reportId, reportVersion: r.reportVersion, artifacts: structuredClone(r.artifacts) };
    }
  });
}
function textReport(r) {
  return `${r.entity.fullName} \xB7 \u7248\u672C ${r.reportVersion} \xB7 \u6570\u636E\u65F6\u70B9 ${r.dataAsOf}
${r.summary}

${r.sections.map((s) => `${s.title}
${s.text}`).join("\n\n")}

${r.coverage.map((c) => `${c.title}: ${c.status} \u2014 ${c.detail}`).join("\n")}
${r.limitations.join("\n")}`;
}

// experimental/mcp-app/server/snapshot.mjs
var titles = ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u4E1A\u52A1\u5047\u8BBE", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u89E6\u8FBE\u5F00\u573A", "\u8986\u76D6\u8BF4\u660E"];
var grant = Object.freeze({ principal: "demo-reader", profile: "demo-profile", session: "demo-session", reportIds: ["demo-report"] });
var snapshot = {
  owner: { principal: "demo-reader", profile: "demo-profile", session: "demo-session" },
  report: {
    schemaVersion: "1.0",
    reportId: "demo-report",
    reportVersion: 1,
    synthetic: true,
    entity: { id: "synthetic-company-a", fullName: "\u793A\u4F8B\u667A\u9020\u6709\u9650\u516C\u53F8\uFF08\u5408\u6210\uFF09" },
    generatedAt: "2026-09-16T02:00:00Z",
    dataAsOf: "2026-09-15",
    status: "partial",
    summary: "\u5DF2\u4FDD\u5B58\u7684\u5408\u6210\u62A5\u544A\u3002\u4EA7\u80FD\u6269\u5F20\u6709\u6750\u6599\u652F\u6301\uFF0C\u56DE\u6B3E\u5B58\u5728\u53CD\u8BC1\uFF0C\u5BA2\u6237\u96C6\u4E2D\u5EA6\u4ECD\u5F85\u786E\u8BA4\u3002",
    sections: titles.map((title, i) => ({ title, text: [
      "\u6269\u4EA7\u8BA1\u5212\u4E0E\u73B0\u91D1\u56DE\u6536\u5E94\u5206\u5F00\u6838\u9A8C\uFF1B\u73B0\u6709\u6750\u6599\u4E0D\u8DB3\u4EE5\u4F5C\u51FA\u6574\u4F53\u4F4E\u98CE\u9669\u5224\u65AD\u3002",
      "\u793A\u4F8B\u4F01\u4E1A\u4ECE\u4E8B\u5DE5\u4E1A\u8BBE\u5907\u5236\u9020\uFF1B\u884C\u4E1A\u5F52\u7C7B\u5C1A\u672A\u5916\u90E8\u6838\u9A8C\u3002",
      "\u5408\u6210\u4F1A\u8BAE\u6750\u6599\u63D0\u5230\u65B0\u589E\u751F\u4EA7\u7EBF\uFF0C\u539F\u59CB\u8BB0\u5F55\u65E5\u671F\u4E3A 2026-09-01\u3002",
      "\u8BBE\u5907\u878D\u8D44\u9700\u6C42\u53EF\u80FD\u5B58\u5728\uFF0C\u5B9E\u9645\u91C7\u8D2D\u91D1\u989D\u5F85\u73B0\u573A\u786E\u8BA4\u3002",
      "\u672A\u5F62\u6210\u7EA2\u7EBF\u7B49\u7EA7\u5224\u65AD\uFF1B\u4E00\u6B21\u65E0\u8BB0\u5F55\u7ED3\u679C\u4E0D\u4EE3\u8868\u5168\u90E8\u98CE\u9669\u5DF2\u6392\u9664\u3002",
      "\u8BF7\u6838\u5BF9\u6269\u4EA7\u9884\u7B97\u3001\u903E\u671F\u56DE\u6B3E\u53CA\u524D\u4E94\u5927\u5BA2\u6237\u5360\u6BD4\u3002",
      "\u56F4\u7ED5\u6269\u4EA7\u8BA1\u5212\u4E86\u89E3\u8D44\u91D1\u5B89\u6392\uFF0C\u5E76\u6838\u5BF9\u6750\u6599\u4E0E\u7ECF\u8425\u73B0\u72B6\u3002",
      "\u6D89\u8BC9\u793A\u4F8B\u8FD4\u56DE\u65E0\u8BB0\u5F55\uFF1B\u7A0E\u52A1\u8BFB\u53D6\u5931\u8D25\uFF1B\u73AF\u4FDD\u672A\u8986\u76D6\uFF1B\u5BA2\u6237\u96C6\u4E2D\u5EA6\u5F85\u786E\u8BA4\u3002"
    ][i] })),
    findings: [
      { id: "f1", title: "\u6269\u4EA7\u610F\u5411\u6709\u6750\u6599\u652F\u6301", status: "supported", evidenceIds: ["e1"] },
      { id: "f2", title: "\u56DE\u6B3E\u6539\u5584\u8BF4\u6CD5\u5B58\u5728\u53CD\u8BC1", status: "contradicted", evidenceIds: ["e2"] },
      { id: "f3", title: "\u5BA2\u6237\u96C6\u4E2D\u5EA6\u5C1A\u5F85\u786E\u8BA4", status: "insufficient", evidenceIds: ["e3"] }
    ],
    coverage: [
      { title: "\u6D89\u8BC9", status: "no-data", detail: "\u4EC5\u5408\u6210\u67E5\u8BE2\u8303\u56F4\u5185\u65E0\u8BB0\u5F55" },
      { title: "\u7A0E\u52A1", status: "failed", detail: "\u8BFB\u53D6\u5931\u8D25\uFF0C\u4E0D\u80FD\u636E\u6B64\u5224\u65AD\u65E0\u98CE\u9669" },
      { title: "\u73AF\u4FDD", status: "not-covered", detail: "\u672C\u7248\u672A\u8986\u76D6" },
      { title: "\u5BA2\u6237\u96C6\u4E2D\u5EA6", status: "unknown", detail: "\u6750\u6599\u672A\u8F7D\u660E" }
    ],
    limitations: ["\u5168\u90E8\u5185\u5BB9\u4E3A\u5408\u6210\u6570\u636E\uFF0C\u4E0D\u7528\u4E8E\u4F01\u4E1A\u51B3\u7B56\u3002", "\u9605\u8BFB\u548C\u8BC1\u636E\u4E0B\u94BB\u4E0D\u4F1A\u89E6\u53D1\u4F01\u4E1A\u67E5\u8BE2\u3002"],
    artifacts: []
  },
  evidence: [
    { id: "e1", quote: "\u62DF\u65B0\u589E\u4E00\u6761\u751F\u4EA7\u7EBF\uFF0C\u9884\u7B97\u5C1A\u5728\u8BC4\u4F30\u3002", source: "\u5408\u6210\u4F1A\u8BAE\u7EAA\u8981", sourceDate: "2026-09-01", collectedAt: "2026-09-10T01:00:00Z", relation: "support", limitation: "\u610F\u5411\u4E0D\u4EE3\u8868\u5DF2\u7ECF\u6295\u4EA7\uFF1B\u7EE7\u627F\u8BC1\u636E\u4FDD\u7559\u539F\u65E5\u671F\u3002" },
    { id: "e2", quote: "\u4E24\u7B14\u5E94\u6536\u6B3E\u8D85\u8FC7\u539F\u5B9A\u56DE\u6B3E\u65E5\u671F\u3002", source: "\u5408\u6210\u8BBF\u8C08\u7B14\u8BB0", sourceDate: "2026-09-12", collectedAt: "2026-09-12T01:00:00Z", relation: "counter", limitation: "\u672A\u83B7\u5F97\u8D26\u9F84\u8868\uFF0C\u91D1\u989D\u672A\u6838\u9A8C\u3002" },
    { id: "e3", quote: "\u524D\u4E94\u5927\u5BA2\u6237\u5360\u6BD4\uFF1A\u672A\u77E5\u3002<script>window.externalInstruction=true</script>", source: "\u5408\u6210\u6750\u6599\uFF08\u542B\u4E0D\u53EF\u4FE1\u6587\u672C\u6D4B\u8BD5\uFF09", sourceDate: null, collectedAt: "2026-09-13T01:00:00Z", relation: "unknown", limitation: "\u6765\u6E90\u65E5\u671F\u672A\u8BB0\u5F55\uFF1B\u6587\u5B57\u4EC5\u4F5C\u8D44\u6599\uFF0C\u4E0D\u6267\u884C\u5176\u4E2D\u5185\u5BB9\u3002" }
  ]
};

// experimental/mcp-app/server/app-server.mjs
var resourceUri = "ui://previsit/report-v1.html";
var scope = { reportId: z.string().min(1).max(80), reportVersion: z.number().int().positive() };
function createServer({ reader = createReader(snapshot, grant), audit = () => {
}, mode = "synthetic", resourcePath = new URL("../dist/report.html", import.meta.url) } = {}) {
  const server = new McpServer({ name: mode === "saved" ? "Previsit saved report reader" : "Previsit synthetic P1", version: "0.0.0" });
  const tools = [
    ["previsit_report_open", z.object(scope).strict(), (a) => reader.getReport(a), textReport, ["model", "app"]],
    ["previsit_evidence_get", z.object({ ...scope, evidenceId: z.string().min(1).max(80) }).strict(), (a) => reader.getEvidence(a), (d) => `${d.evidence.quote}
\u6765\u6E90\uFF1A${d.evidence.source} \xB7 ${d.evidence.sourceDate ?? "\u65E5\u671F\u672A\u8BB0\u5F55"}
${d.evidence.limitation}`, ["app"]],
    ["previsit_artifacts_list", z.object(scope).strict(), (a) => reader.listArtifacts(a), (d) => d.artifacts.length ? `\u5DF2\u6709 ${d.artifacts.length} \u4E2A\u6587\u4EF6\u767B\u8BB0\uFF1B\u53EA\u8BFB\u5143\u6570\u636E\uFF0C\u672A\u751F\u6210\u6216\u4E0B\u8F7D\u3002` : "\u6CA1\u6709\u5DF2\u767B\u8BB0\u6587\u4EF6\uFF1B\u672A\u53D1\u8D77\u751F\u6210\u6216\u4E0B\u8F7D\u3002", ["app"]]
  ];
  for (const [name2, inputSchema, read, text, visibility] of tools) {
    registerAppTool(server, name2, {
      description: mode === "saved" ? "\u53EA\u8BFB\u672C\u4F1A\u8BDD\u5DF2\u4FDD\u5B58\u62A5\u544A\uFF1B\u4E0D\u67E5\u8BE2\u4F01\u4E1A\u6570\u636E\u3002" : "\u53EA\u8BFB\u5408\u6210\u62A5\u544A\u5FEB\u7167\uFF1B\u4E0D\u67E5\u8BE2\u4F01\u4E1A\u6570\u636E\u3002\u62A5\u544A\u793A\u4F8B demo-report\uFF0C\u7248\u672C 1\u3002",
      inputSchema,
      annotations: { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false },
      _meta: { ui: { resourceUri, visibility } }
    }, async (args) => {
      try {
        const data = await read(args);
        audit({ method: name2, outcome: "ok" });
        return { content: [{ type: "text", text: text(data) }], structuredContent: data };
      } catch (e) {
        const internal = e instanceof ReadError ? e.code : "INTERNAL_ERROR";
        audit({ method: name2, outcome: internal });
        const code = ["ACCESS_DENIED", "REPORT_NOT_FOUND"].includes(internal) ? "NOT_ACCESSIBLE" : internal;
        return { isError: true, content: [{ type: "text", text: `\u8BFB\u53D6\u672A\u5B8C\u6210\uFF1A${code}\u3002\u8BF7\u6838\u5BF9\u62A5\u544A\u7248\u672C\u4E0E\u8BBF\u95EE\u8303\u56F4\u3002` }], structuredContent: { schemaVersion: "1.0", error: { code } } };
      }
    });
  }
  const meta = { ui: { csp: { connectDomains: [], resourceDomains: [], frameDomains: [] }, prefersBorder: true } };
  registerAppResource(server, mode === "saved" ? "\u8BBF\u524D\u62A5\u544A\u4E0E\u8BC1\u636E" : "\u5408\u6210\u8BBF\u524D\u62A5\u544A", resourceUri, { mimeType: RESOURCE_MIME_TYPE, _meta: meta }, async () => {
    audit({ method: "resources/read", outcome: "ok" });
    return { contents: [{ uri: resourceUri, mimeType: RESOURCE_MIME_TYPE, _meta: meta, text: await readFile(resourcePath, "utf8") }] };
  });
  return server;
}

// experimental/mcp-app/server/saved-reader.mjs
import { createHash } from "node:crypto";
var hash = (value) => createHash("sha256").update(value).digest("hex");
var fail = (code) => {
  throw new ReadError(code);
};
function createSavedReader(source, scope2, { expectedDigest } = {}) {
  const trusted = structuredClone(scope2);
  let pinned = expectedDigest;
  async function load(args) {
    let task;
    try {
      task = await source.read(args.reportId, args.reportVersion, trusted);
    } catch (e) {
      fail(["NOT_ACCESSIBLE", "VERSION_NOT_FOUND", "SAVED_REPORT_FIELDS_MISSING"].includes(e.message) ? e.message : "INTERNAL_ERROR");
    }
    const digest = hash(JSON.stringify(task));
    if (pinned && pinned !== digest) fail("REPORT_CHANGED_REOPEN");
    const value = projectSavedTask(task);
    pinned = digest;
    return { ...value, digest };
  }
  return Object.freeze({
    async getReport(args) {
      const { report: report2, digest } = await load(args);
      return { ...report2, sourceDigest: digest };
    },
    async getEvidence(args) {
      const { report: report2, evidence } = await load(args);
      if (!report2.findings.some((f) => f.evidenceIds.includes(args.evidenceId))) fail("EVIDENCE_NOT_IN_REPORT");
      const item = evidence.find((e) => e.id === args.evidenceId);
      if (!item) fail("EVIDENCE_NOT_SAVED");
      return { schemaVersion: "1.0", reportId: report2.reportId, reportVersion: report2.reportVersion, entity: report2.entity, evidence: item };
    },
    async listArtifacts(args) {
      const { report: report2 } = await load(args);
      return { schemaVersion: "1.0", reportId: report2.reportId, reportVersion: report2.reportVersion, artifacts: report2.artifacts };
    }
  });
}
function projectSavedTask(task) {
  if (!task || task.schemaVersion !== 1 || !task.entity?.creditCode || !task.entity.fullName || typeof task.reportMarkdown !== "string" || !Array.isArray(task.runs)) fail("SAVED_REPORT_FIELDS_MISSING");
  const sections = [];
  let fence = null, current;
  for (const line of task.reportMarkdown.split(/\r?\n/)) {
    const marker = line.match(/^\s*(`{3,}|~{3,})/);
    if (marker) {
      if (!fence) fence = marker[1][0];
      else if (fence === marker[1][0]) fence = null;
    }
    const heading = !fence && line.match(/^#{2,4}\s+(.+)$/);
    const title = heading && titles.find((t) => new RegExp(`^(?:[\u4E00\u4E8C\u4E09\u56DB\u4E94\u516D\u4E03\u516B1-8]+[\u3001.\uFF0E\uFF09)\\s]+)?${t}(?:\\s|$|[\uFF1A:\uFF08(])`).test(heading[1]));
    if (title) {
      if (sections.some((s) => s.title === title)) fail("AMBIGUOUS_REPORT_SECTIONS");
      current = { title, text: "" };
      sections.push(current);
    } else if (current) current.text += line + "\n";
  }
  if (titles.some((t) => !sections.some((s) => s.title === t))) fail("LEGACY_FIELDS_MISSING");
  sections.forEach((s) => s.text = s.text.trim());
  const findings = [...new Map((task.analysisRecords ?? []).map((a) => [a.id, a])).values()].map((a) => ({ id: a.id, title: a.title, status: a.status, summary: a.summary, evidenceIds: [...new Set(a.evidenceIds ?? [])] }));
  const linked = new Set(findings.flatMap((f) => f.evidenceIds));
  const materials = new Map((task.materials ?? []).map((m) => [m.id, m]));
  const evidence = [];
  for (const f of task.evidenceFacts ?? []) {
    if (!linked.has(f.id)) continue;
    const m = materials.get(f.materialId);
    if (!m || f.entity !== task.entity.fullName || !m.text?.includes(f.quote) || !f.quote || hash(m.text) !== m.sha256) continue;
    evidence.push({ id: f.id, kind: "material-quote", quote: f.quote, source: m.title, sourceDate: m.sourceDate || null, collectedAt: m.importedAt || null, relation: "saved-reference", limitation: `\u6750\u6599\u63D0\u4F9B\u8005\u586B\u5199\u7684\u6765\u6E90\u4E0E\u65E5\u671F\uFF0C\u672A\u72EC\u7ACB\u6838\u9A8C\u3002\u4F4D\u7F6E\uFF1A${f.location || "\u672A\u8BB0\u5F55"}\u3002` });
  }
  const runs = [...task.inheritedRuns ?? [], ...task.runs];
  for (const r of runs) {
    if (!linked.has(r.id) || !r.completedAt || !["done", "no-data"].includes(r.status)) continue;
    const quote = r.result ? [r.result.summary, ...r.result.facts ?? [], ...(r.result.factors ?? []).map((f) => `${f.name}\uFF1A${f.count}`)].filter(Boolean).join("\n") : "";
    if (!quote && r.status !== "no-data") continue;
    evidence.push({ id: r.id, kind: "query-summary", quote: quote || "\u4FDD\u5B58\u7684\u67E5\u8BE2\u72B6\u6001\u4E3A\u65E0\u8BB0\u5F55\uFF1B\u4EC5\u9002\u7528\u4E8E\u8BE5\u6B21\u67E5\u8BE2\u8303\u56F4\u3002", source: r.toolName || r.dimension, sourceDate: null, collectedAt: r.completedAt, relation: "saved-reference", limitation: "\u4EC5\u4E3A\u5DF2\u4FDD\u5B58\u67E5\u8BE2\u6458\u8981\uFF0C\u975E\u63A5\u53E3\u539F\u59CB\u54CD\u5E94\uFF1B\u91C7\u96C6\u65F6\u95F4\u4E0D\u7B49\u4E8E\u6765\u6E90\u65E5\u671F\u3002" });
  }
  if (new Set(evidence.map((e) => e.id)).size !== evidence.length) fail("AMBIGUOUS_EVIDENCE_IDS");
  const latest = new Map(runs.map((r) => [r.dimension, r]));
  const labels = { done: "\u67E5\u8BE2\u6210\u529F", "no-data": "\u65E0\u8BB0\u5F55", failed: "\u67E5\u8BE2\u5931\u8D25", "no-permission": "\u65E0\u6743\u9650", "not-executed": "\u672A\u6267\u884C", skipped: "\u65E0\u9700\u6267\u884C", unknown: "\u7ED3\u679C\u5F85\u6838\u9A8C", running: "\u4FDD\u5B58\u65F6\u5C1A\u672A\u7ED3\u675F" };
  const coverage = [...latest].map(([title, r]) => ({ title, status: r.status, detail: `${labels[r.status] ?? "\u672A\u77E5\u72B6\u6001"}\uFF1B\u91C7\u96C6\u4E8E ${r.completedAt ?? "\u672A\u8BB0\u5F55"}${(task.inheritedRuns ?? []).includes(r) ? "\uFF1B\u6CBF\u7528\u4E0A\u4E00\u7248\u8BB0\u5F55" : ""}\u3002${r.message ?? ""}` }));
  const missing = [...linked].filter((id) => !evidence.some((e) => e.id === id));
  return { report: { schemaVersion: "1.0", reportId: task.id, reportVersion: task.reportVersion ?? 1, sourceKind: "saved-task", synthetic: false, entity: { id: task.entity.creditCode, fullName: task.entity.fullName }, generatedAt: task.completedAt, dataAsOf: "\u672A\u4FDD\u5B58\u7EDF\u4E00\u6570\u636E\u65F6\u70B9\uFF1B\u8BF7\u9010\u6761\u67E5\u770B\u8BC1\u636E\u65E5\u671F", status: task.state, summary: sections.find((s) => s.title === "\u6838\u5FC3\u7814\u5224").text, sections, findings, coverage, originalMarkdown: task.reportMarkdown, artifacts: task.artifact ? [{ ...task.artifact, reportId: task.id, reportVersion: task.reportVersion ?? 1, downloadAvailable: false }] : [], limitations: ["\u4EC5\u5C55\u793A\u5DF2\u4FDD\u5B58\u62A5\u544A\uFF0C\u4E0D\u53D1\u8D77\u4F01\u4E1A\u67E5\u8BE2\u3002", "\u5224\u65AD\u4E0E\u5F15\u7528\u6765\u81EA\u539F\u8BB0\u5F55\uFF0C\u672A\u91CD\u65B0\u63A8\u65AD\u6216\u8865\u9F50\u8BC1\u636E\u3002", ...!findings.length ? ["\u65E7\u62A5\u544A\u672A\u4FDD\u5B58\u7ED3\u6784\u5316\u5224\u65AD\uFF0C\u4E0D\u80FD\u4ECE\u6B63\u6587\u731C\u6D4B\u8BC1\u636E\u5173\u8054\u3002"] : [], ...missing.length ? [`\u4EE5\u4E0B\u5F15\u7528\u6CA1\u6709\u53EF\u8BFB\u53D6\u7684\u5DF2\u4FDD\u5B58\u8BC1\u636E\uFF1A${missing.join("\u3001")}`] : []] }, evidence };
}

// experimental/dsh-mcp-app-host/src/receipts.mjs
import { randomUUID } from "node:crypto";
import { z as z2 } from "zod";
var report = z2.object({ reportId: z2.string().regex(/^PV-\d{8}-[A-Z0-9-]{4,40}$/), reportVersion: z2.number().int().positive() }).strict();
var pin = report.extend({ digest: z2.string().regex(/^[a-f0-9]{64}$/) }).strict();
var schema = z2.object({ viewId: z2.string().uuid(), sessionId: z2.string().min(1), callId: z2.string().min(1), scope: z2.object({ sessionId: z2.string().min(1), workspace: z2.string().min(1) }).strict(), active: pin, pins: z2.array(pin).min(1).max(100), createdAt: z2.number().int(), expiresAt: z2.number().int() }).strict();
var fail2 = (message) => {
  throw new Error(message);
};
async function openReceipts(storageDomain, { now = Date.now, lifetimeMs = 30 * 864e5, maxReceipts = 1e3 } = {}) {
  const domain = await storageDomain.open({ name: "f24_saved_views_v1", version: 1, tables: { views: { valueSchema: schema } } });
  const table = domain.table("views"), queues = /* @__PURE__ */ new Map();
  let disposed = false, issuing = Promise.resolve();
  function read(identity2) {
    if (disposed) fail2("HOST_DISPOSED");
    const r = table.get(identity2.viewId);
    if (!r || r.viewId !== identity2.viewId || r.sessionId !== identity2.sessionId || r.callId !== identity2.callId || r.scope.sessionId !== r.sessionId) fail2("VIEW_NOT_ACCESSIBLE");
    if (now() >= r.expiresAt) fail2("VIEW_EXPIRED_REOPEN");
    return structuredClone(r);
  }
  return {
    async issue({ sessionId, callId, scope: scope2, args, digest }) {
      const operation = issuing.then(async () => {
        if (disposed) fail2("HOST_DISPOSED");
        for (const [key, r2] of table.entries()) if (now() >= r2.expiresAt) await table.delete(key);
        if ([...table.entries()].length >= maxReceipts) fail2("VIEW_LIMIT_REACHED");
        const active = { ...args, digest }, createdAt = now();
        const r = schema.parse({ viewId: randomUUID(), sessionId, callId, scope: scope2, active, pins: [active], createdAt, expiresAt: createdAt + lifetimeMs });
        if (r.scope.sessionId !== r.sessionId) fail2("MISSING_EXECUTION_IDENTITY");
        await table.put(r.viewId, r);
        return structuredClone(r);
      });
      issuing = operation.catch(() => {
      });
      return operation;
    },
    async use(identity2, operation) {
      const key = identity2.viewId;
      const work = (queues.get(key) ?? Promise.resolve()).catch(() => {
      }).then(() => operation(read(identity2)));
      queues.set(key, work);
      try {
        return await work;
      } finally {
        if (queues.get(key) === work) queues.delete(key);
      }
    },
    async select(r, args, digest) {
      read(r);
      const previous = r.pins.find((p) => p.reportId === args.reportId && p.reportVersion === args.reportVersion);
      if (previous && previous.digest !== digest) fail2("REPORT_CHANGED_REOPEN");
      const active = { ...args, digest };
      const next = schema.parse({ ...r, active, pins: previous ? r.pins : [...r.pins, active] });
      await table.put(r.viewId, next);
    },
    async close() {
      disposed = true;
      await issuing;
      await Promise.allSettled([...queues.values()]);
      await domain.close();
    }
  };
}

// experimental/dsh-mcp-app-host/src/bindings.mjs
var REPORT_TOOL = "previsit_report_open";
var PUBLIC_TOOL = "f24_previsit_report_open";
var RESOURCE = "ui://previsit/report-v1.html";
var MIME = "text/html;profile=mcp-app";
var CHANNEL = "/f24-mcp-app";
var APP_TOOLS = ["previsit_evidence_get", "previsit_artifacts_list"];

// experimental/dsh-mcp-app-host/src/saved-index.mjs
var name = "f24-saved-report-host";
var inject = ["tools", "connection", "previsitSavedReports", "storageDomain"];
var identity = z3.object({ viewId: z3.string().uuid(), sessionId: z3.string().min(1), callId: z3.string().min(1) });
var argsSchema = { type: "object", properties: { reportId: { type: "string", pattern: "^PV-\\d{8}-[A-Z0-9-]{4,40}$" }, reportVersion: { type: "integer", minimum: 1 } }, required: ["reportId", "reportVersion"], additionalProperties: false };
async function withClient(reader, operation) {
  const server = createServer({ reader, mode: "saved", resourcePath: new URL("./report.html", import.meta.url) });
  const client = new Client({ name: "DSH saved report host", version: "0.0.0" }, { capabilities: { extensions: { "io.modelcontextprotocol/ui": { mimeTypes: [MIME] } } } });
  const [a, b] = InMemoryTransport.createLinkedPair();
  try {
    await server.connect(b);
    await client.connect(a);
    return await operation(client);
  } finally {
    await Promise.allSettled([client.close(), server.close()]);
  }
}
async function apply(ctx, input) {
  z3.object({ savedReports: z3.literal(true) }).strict().parse(input);
  const receipts = await openReceipts(ctx.storageDomain);
  let disposed = false;
  const pending = /* @__PURE__ */ new Set();
  ctx.effect(() => async () => {
    disposed = true;
    pending.forEach((c) => c.abort());
    await receipts.close();
  });
  async function resultFor(reader, args, signal) {
    const result = await withClient(reader, (client) => client.callTool({ name: REPORT_TOOL, arguments: args }, { signal }));
    if (result.isError) throw new Error(result.content?.[0]?.text ?? "READ_FAILED");
    return result;
  }
  const argsOf = (r) => ({ reportId: r.active.reportId, reportVersion: r.active.reportVersion });
  ctx.effect(() => ctx.tools.register({
    name: PUBLIC_TOOL,
    description: "\u53EA\u8BFB\u6253\u5F00\u672C\u4F1A\u8BDD\u3001\u672C\u5DE5\u4F5C\u533A\u5DF2\u4FDD\u5B58\u7684\u8BBF\u524D\u62A5\u544A\u3002\u5FC5\u987B\u6307\u5B9A\u5DF2\u77E5 PV \u4EFB\u52A1 ID \u548C\u62A5\u544A\u7248\u672C\uFF1B\u4E0D\u521B\u5EFA\u4EFB\u52A1\u3001\u4E0D\u67E5\u8BE2\u4F01\u4E1A\u3001\u4E0D\u751F\u6210\u6587\u4EF6\u3002",
    parameters: argsSchema,
    output: { schema: { type: "object", properties: { viewId: { type: "string" }, sessionId: { type: "string" }, callId: { type: "string" }, result: { type: "object", additionalProperties: true } }, required: ["viewId", "sessionId", "callId", "result"], additionalProperties: false }, render: (_a, v) => v.result.content, presentationMeta: (_a, v) => ({ f24App: { ...v, resourceUri: RESOURCE } }) },
    async execute(args, exec) {
      if (disposed) throw new Error("HOST_DISPOSED");
      const scope2 = { sessionId: exec.agent?.session?.id, workspace: exec.agent?.session?.header?.cwd };
      if (!scope2.sessionId || !scope2.workspace) throw new Error("TRUSTED_SCOPE_REQUIRED");
      const result = await resultFor(createSavedReader(ctx.previsitSavedReports, scope2), args, exec.signal);
      if (disposed) throw new Error("HOST_DISPOSED");
      exec.signal?.throwIfAborted();
      const receipt = await receipts.issue({ sessionId: scope2.sessionId, callId: exec.callId, args, scope: scope2, digest: result.structuredContent.sourceDigest });
      return { viewId: receipt.viewId, sessionId: receipt.sessionId, callId: receipt.callId, result };
    }
  }));
  ctx.effect(() => ctx.connection.rpc.handle(CHANNEL, async (endpoint, payload, signal) => {
    const controller = new AbortController();
    pending.add(controller);
    try {
      if (disposed) throw new Error("HOST_DISPOSED");
      const signalBound = AbortSignal.any([signal, controller.signal]);
      signalBound.throwIfAborted();
      if (!["resource", "call", "select-version"].includes(endpoint)) throw new Error("UNKNOWN_ENDPOINT");
      const fields = endpoint === "call" ? { name: z3.enum(APP_TOOLS), arguments: z3.record(z3.string(), z3.unknown()) } : endpoint === "select-version" ? { reportId: z3.string(), reportVersion: z3.number().int().positive() } : {};
      const data = identity.extend(fields).strict().parse(payload);
      return await receipts.use(data, async (receipt) => {
        const args = argsOf(receipt);
        const reader = createSavedReader(ctx.previsitSavedReports, receipt.scope, { expectedDigest: receipt.active.digest });
        const report2 = await reader.getReport(args);
        signalBound.throwIfAborted();
        if (endpoint === "resource") {
          let versions = [], versionError;
          try {
            versions = await ctx.previsitSavedReports.versions(args.reportId, args.reportVersion, receipt.scope);
          } catch (e) {
            versionError = e.message;
          }
          const result = await resultFor(reader, args, signalBound);
          const resource = await withClient(reader, (client) => client.readResource({ uri: RESOURCE }, { signal: signalBound }));
          return { ok: true, value: { html: resource.contents[0].text, result, versions, ...versionError ? { versionError } : {} } };
        }
        if (endpoint === "select-version") {
          const target = { reportId: data.reportId, reportVersion: data.reportVersion };
          const versions = await ctx.previsitSavedReports.versions(args.reportId, args.reportVersion, receipt.scope);
          if (!versions.some((v) => v.reportId === target.reportId && v.reportVersion === target.reportVersion)) throw new Error("VERSION_NOT_ACCESSIBLE");
          const old = receipt.pins.find((p) => p.reportId === target.reportId && p.reportVersion === target.reportVersion);
          const next = await createSavedReader(ctx.previsitSavedReports, receipt.scope, { expectedDigest: old?.digest }).getReport(target);
          if (disposed) throw new Error("HOST_DISPOSED");
          signalBound.throwIfAborted();
          await receipts.select(receipt, target, next.sourceDigest);
          return { ok: true, value: { reportId: target.reportId, reportVersion: target.reportVersion } };
        }
        if (data.arguments.reportId !== args.reportId || data.arguments.reportVersion !== args.reportVersion) throw new Error("REPORT_SCOPE_MISMATCH");
        if (data.name === "previsit_evidence_get" && !report2.findings.some((f) => f.evidenceIds.includes(data.arguments.evidenceId))) throw new Error("EVIDENCE_NOT_IN_REPORT");
        const value = await withClient(reader, (client) => client.callTool({ name: data.name, arguments: data.arguments }, { signal: signalBound }));
        return { ok: true, value };
      });
    } catch (e) {
      return { ok: false, error: { code: "bad-request", message: e.message, details: { issues: [] } } };
    } finally {
      pending.delete(controller);
    }
  }));
}
export {
  apply,
  inject,
  name
};
//# sourceMappingURL=report-host.js.map
