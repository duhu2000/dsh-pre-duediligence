// src/previsit-session.ts
function isPrevisitSession(sessionId) {
  return /^session-dsh-pre-duediligence-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(sessionId);
}

// src/image-intake.ts
import { randomUUID } from "node:crypto";
import { mkdir, rmdir, unlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
var IMAGE_LIMITS = { maxBytes: 8 * 1024 * 1024, maxEntries: 50, ttlMs: 15 * 60 * 1e3 };
var LOCAL_DOCUMENT_TOOL_PAIRS = [
  ["mcp__qcc-document-mcp__parse_document", "mcp__qcc-document-mcp__get_parse_result"],
  ["mcp__document__parse_document", "mcp__document__get_parse_result"],
  ["mcp__qcc-document-local__parse_document", "mcp__qcc-document-local__get_parse_result"],
  ["mcp__document-mcp__parse_document", "mcp__document-mcp__get_parse_result"]
];
var ImageIntakeError = class extends Error {
  constructor(code, message, status = 400) {
    super(message);
    this.code = code;
    this.status = status;
    this.name = "ImageIntakeError";
  }
};
function sniff(bytes) {
  if (bytes.length < 12) return null;
  if (bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))) return { mimeType: "image/png", extension: "png" };
  if (bytes[0] === 255 && bytes[1] === 216 && bytes[2] === 255) return { mimeType: "image/jpeg", extension: "jpg" };
  if (bytes.subarray(0, 4).toString("ascii") === "RIFF" && bytes.subarray(8, 12).toString("ascii") === "WEBP") return { mimeType: "image/webp", extension: "webp" };
  if (bytes.subarray(0, 5).toString("ascii") === "%PDF-") return { mimeType: "application/pdf", extension: "pdf" };
  return null;
}
function decode(content) {
  const raw = String(content ?? "").replace(/^data:[a-z0-9.+/-]+;base64,/i, "");
  if (raw.length > Math.ceil(IMAGE_LIMITS.maxBytes / 3) * 4) throw new ImageIntakeError("PV_IMAGE_TOO_LARGE", "\u56FE\u7247\u4E0D\u80FD\u8D85\u8FC7 8 MiB\u3002", 413);
  if (raw === "" || !/^[A-Za-z0-9+/]*={0,2}$/.test(raw) || raw.length % 4 === 1) throw new ImageIntakeError("PV_IMAGE_BASE64", "\u56FE\u7247\u5185\u5BB9\u4E0D\u662F\u6709\u6548\u7684 Base64 \u6570\u636E\u3002");
  const bytes = Buffer.from(raw, "base64");
  if (bytes.length === 0) throw new ImageIntakeError("PV_IMAGE_EMPTY", "\u56FE\u7247\u5185\u5BB9\u4E3A\u7A7A\u3002");
  if (bytes.length > IMAGE_LIMITS.maxBytes) throw new ImageIntakeError("PV_IMAGE_TOO_LARGE", "\u56FE\u7247\u4E0D\u80FD\u8D85\u8FC7 8 MiB\u3002", 413);
  const detected = sniff(bytes);
  if (detected === null) throw new ImageIntakeError("PV_IMAGE_TYPE", "\u4EC5\u652F\u6301 PNG\u3001JPEG\u3001WebP \u56FE\u7247\u6216 PDF\u3002", 415);
  return { bytes, ...detected };
}
var COMPANY_END = "(?:\u6709\u9650\u8D23\u4EFB\u516C\u53F8|\u80A1\u4EFD\u6709\u9650\u516C\u53F8|\u96C6\u56E2\u6709\u9650\u516C\u53F8|\u6709\u9650\u516C\u53F8|\u96C6\u56E2\u516C\u53F8|\u516C\u53F8|\u666E\u901A\u5408\u4F19|\u6709\u9650\u5408\u4F19|\u5408\u4F19\u4F01\u4E1A|\u4E2A\u4EBA\u72EC\u8D44\u4F01\u4E1A|\u519C\u6C11\u4E13\u4E1A\u5408\u4F5C\u793E|\u5408\u4F5C\u793E|\u4E8B\u52A1\u6240|\u7814\u7A76\u9662|\u7814\u7A76\u6240|\u4E2D\u5FC3|\u5546\u884C|\u5DE5\u5382|\u5382)";
var COMPANY_RE = new RegExp(`[\\p{Script=Han}A-Za-z0-9\uFF08\uFF09()\xB7&\uFF0B+\u2014\\-]{2,72}?${COMPANY_END}`, "gu");
var HEADER_RE = /^(?:序号|企业名称|公司名称|单位名称|统一社会信用代码|信用代码|注册号|名称|企业名单)$/i;
var cleanCell = (value) => value.replace(/^\s*(?:[-•·●▪◦]|\d{1,4}[.)、：:]?)\s*/, "").replace(/^(?:企业名称|公司名称|单位名称)\s*[:：]\s*/i, "").replace(/[\s ]+/g, "").trim();
function extractCompanyNames(text, max = IMAGE_LIMITS.maxEntries) {
  const out = [];
  const seen = /* @__PURE__ */ new Set();
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (line === "") continue;
    for (const cell of line.split(/\t|[|｜]|\s{2,}|[，,；;]/)) {
      const compact = cleanCell(cell);
      if (compact === "" || HEADER_RE.test(compact)) continue;
      for (const m of compact.matchAll(COMPANY_RE)) {
        const name = m[0];
        const key = name.toLowerCase();
        if (seen.has(key)) continue;
        seen.add(key);
        out.push(name);
        if (out.length >= max) return out;
      }
    }
  }
  return out;
}
function unwrap(result) {
  if (result.isError) throw new ImageIntakeError("PV_IMAGE_PROVIDER_FAILED", result.error?.message ?? "\u6587\u6863\u89E3\u6790\u8C03\u7528\u5931\u8D25\u3002", 502);
  let value = result.value ?? result;
  if (value !== null && typeof value === "object" && "structuredContent" in value) value = value.structuredContent;
  const content = value !== null && typeof value === "object" && "content" in value ? value.content : result.content;
  if (Array.isArray(content)) {
    const text = content.filter((b) => b?.type === "text" && typeof b.text === "string").map((b) => b.text).join("\n");
    if (text !== "") {
      try {
        value = JSON.parse(text);
      } catch {
        value = { result_md: text };
      }
    }
  }
  return value;
}
var rec = (v) => v !== null && typeof v === "object" && !Array.isArray(v) ? v : {};
function markdownOf(value) {
  const v = rec(value);
  const details = Array.isArray(v.details) ? v.details : [];
  return [...details, v].map((d) => String(rec(d).result_md ?? rec(d).resultMd ?? "").trim()).filter(Boolean).join("\n");
}
function statusOf(value) {
  const raw = String(rec(value).status ?? rec(value).state ?? "").toLowerCase();
  if (["success", "succeeded", "completed", "complete", "done"].includes(raw)) return "success";
  if (["failed", "failure", "error", "cancelled", "canceled"].includes(raw)) return "failed";
  if (markdownOf(value) !== "") return "success";
  return "processing";
}
var safeName = (value) => String(value ?? "\u5546\u673A\u56FE\u7247").replace(/[\u0000-\u001f\u007f/\\]/g, "_").trim().slice(0, 160) || "\u5546\u673A\u56FE\u7247";
var ImageIntakeStore = class {
  constructor(tools, clock = () => Date.now(), pollMs = 500, maxPolls = 90) {
    this.tools = tools;
    this.clock = clock;
    this.pollMs = pollMs;
    this.maxPolls = maxPolls;
    this.cleanupTimer = setInterval(() => {
      void this.cleanup().catch(() => {
      });
    }, 6e4);
    this.cleanupTimer.unref?.();
  }
  records = /* @__PURE__ */ new Map();
  imageRoot = join(tmpdir(), `dsh-pre-duediligence-images-${randomUUID()}`);
  disposed = false;
  cleanupTimer;
  /** 找到本机文档解析工具对（必须支持 file_path）。 */
  provider(agent) {
    const names = new Map(this.tools.schemas(agent).map((s) => [s.name, s]));
    for (const [parse, result] of LOCAL_DOCUMENT_TOOL_PAIRS) {
      const p = names.get(parse);
      if (p !== void 0 && names.has(result) && p.parameters?.properties !== void 0 && "file_path" in p.parameters.properties) return { parse, result };
    }
    return null;
  }
  async prepare(input) {
    if (this.disposed) throw new ImageIntakeError("PV_IMAGE_DISPOSED", "\u56FE\u7247\u5BFC\u5165\u670D\u52A1\u5DF2\u505C\u6B62\u3002", 503);
    if (!isPrevisitSession(input.sessionId)) throw new ImageIntakeError("PV_IMAGE_SESSION", "\u8BF7\u9009\u62E9\u8BBF\u524D\u5C3D\u8C03\u4F1A\u8BDD\u3002");
    await this.cleanup();
    const decoded = decode(input.content);
    const commandId = `pvi-${randomUUID()}`;
    await mkdir(this.imageRoot, { recursive: true, mode: 448 });
    const path = join(this.imageRoot, `${commandId}.${decoded.extension}`);
    await writeFile(path, decoded.bytes, { mode: 384, flag: "wx" });
    const record = {
      commandId,
      sessionId: input.sessionId,
      state: "prepared",
      fileName: safeName(input.fileName),
      mimeType: decoded.mimeType,
      sizeBytes: decoded.bytes.length,
      createdAt: new Date(this.clock()).toISOString(),
      expiresAt: this.clock() + IMAGE_LIMITS.ttlMs,
      path,
      result: null,
      error: null,
      promise: null
    };
    this.records.set(commandId, record);
    return this.status(commandId, input.sessionId);
  }
  status(commandId, sessionId) {
    const record = this.records.get(commandId);
    if (this.disposed || record === void 0 || record.sessionId !== sessionId || record.expiresAt <= this.clock() && record.state !== "running") throw new ImageIntakeError("PV_IMAGE_NOT_FOUND", "\u56FE\u7247\u6682\u5B58\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F\uFF0815 \u5206\u949F\uFF09\uFF0C\u8BF7\u91CD\u65B0\u5BFC\u5165\u3002", 404);
    const { promise: _promise, ...pub } = record;
    return structuredClone(pub);
  }
  async run(commandId, exec) {
    this.status(commandId, exec.agent.session.id);
    exec.signal.throwIfAborted();
    const record = this.records.get(commandId);
    if (record === void 0) throw new ImageIntakeError("PV_IMAGE_NOT_FOUND", "\u56FE\u7247\u6682\u5B58\u4E0D\u5B58\u5728\u6216\u5DF2\u8FC7\u671F\uFF0C\u8BF7\u91CD\u65B0\u5BFC\u5165\u3002", 404);
    if (record.state === "completed" && record.result !== null) return { commandId, fileName: record.fileName, ...record.result };
    if (record.promise !== null) return { commandId, fileName: record.fileName, ...await record.promise };
    const provider = this.provider(exec.agent);
    if (provider === null) {
      const error = new ImageIntakeError("PV_IMAGE_PROVIDER_UNAVAILABLE", "\u5F53\u524D DSH \u6CA1\u6709\u8FDE\u63A5\u652F\u6301\u672C\u673A\u6587\u4EF6\u7684\u4F01\u67E5\u67E5\u6587\u6863\u89E3\u6790 qcc-document-mcp\u3002\u8BF7\u5728 MCP \u8FDE\u63A5\u5668\u91CC\u914D\u7F6E\u672C\u673A qcc-document-mcp \u540E\u91CD\u8BD5\uFF0C\u6216\u6539\u53D1\u6587\u5B57\u4F01\u4E1A\u540D\u5355\u3002", 503);
      record.state = "failed";
      record.error = { code: error.code, message: error.message };
      throw error;
    }
    record.state = "running";
    record.error = null;
    const execute = async (name, args) => {
      exec.signal.throwIfAborted();
      const result = await this.tools.execute({ name, callId: `previsit-image-${randomUUID()}`, rootCallId: exec.rootCallId, parent: exec.token, agent: exec.agent, signal: exec.signal, arguments: args });
      exec.signal.throwIfAborted();
      return result;
    };
    record.promise = (async () => {
      let value = unwrap(await execute(provider.parse, { file_path: record.path, wait: true }));
      let status = statusOf(value);
      const taskId = String(rec(value).task_id ?? rec(value).taskId ?? "");
      for (let poll = 0; status === "processing" && poll < this.maxPolls; poll++) {
        if (taskId === "") throw new ImageIntakeError("PV_IMAGE_CONTRACT", "\u6587\u6863\u89E3\u6790\u672A\u8FD4\u56DE task_id\u3002", 502);
        await new Promise((resolve) => setTimeout(resolve, this.pollMs));
        exec.signal.throwIfAborted();
        value = unwrap(await execute(provider.result, { task_id: taskId }));
        status = statusOf(value);
      }
      if (status === "processing") throw new ImageIntakeError("PV_IMAGE_TIMEOUT", "\u6587\u6863\u89E3\u6790\u4ECD\u5728\u5904\u7406\u4E2D\uFF0C\u8BF7\u7A0D\u540E\u91CD\u65B0\u8BC6\u522B\u3002", 504);
      if (status === "failed") throw new ImageIntakeError("PV_IMAGE_FAILED", "\u4F01\u67E5\u67E5\u6587\u6863\u89E3\u6790\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u56FE\u7247\u540E\u91CD\u8BD5\u3002", 502);
      const text = markdownOf(value);
      if (text === "") throw new ImageIntakeError("PV_IMAGE_NO_TEXT", "\u56FE\u7247\u4E2D\u672A\u8BC6\u522B\u5230\u53EF\u7528\u6587\u5B57\uFF0C\u8BF7\u6362\u66F4\u6E05\u6670\u7684\u539F\u56FE\u3002", 422);
      const entries = extractCompanyNames(text);
      return { entries, text: text.slice(0, 4e3) };
    })().then(async (result) => {
      record.result = result;
      record.state = "completed";
      record.error = null;
      await this.removeFile(record);
      return result;
    }, async (error) => {
      record.state = "failed";
      record.error = error instanceof ImageIntakeError ? { code: error.code, message: error.message } : { code: "PV_IMAGE_PROVIDER_FAILED", message: "\u6587\u6863\u89E3\u6790\u5F53\u524D\u4E0D\u53EF\u7528\u3002" };
      throw error;
    });
    try {
      return { commandId, fileName: record.fileName, ...await record.promise };
    } finally {
      record.promise = null;
    }
  }
  async remove(commandId, sessionId) {
    const record = this.records.get(commandId);
    if (record === void 0) return false;
    if (record.sessionId !== sessionId) throw new ImageIntakeError("PV_IMAGE_NOT_FOUND", "\u56FE\u7247\u6682\u5B58\u4E0D\u5C5E\u4E8E\u5F53\u524D\u4F1A\u8BDD\u3002", 404);
    if (record.state === "running") throw new ImageIntakeError("PV_IMAGE_BUSY", "\u56FE\u7247\u6B63\u5728\u8BC6\u522B\uFF0C\u6682\u4E0D\u80FD\u79FB\u9664\u3002", 409);
    await this.removeFile(record);
    this.records.delete(commandId);
    return true;
  }
  async removeFile(record) {
    const path = record.path;
    record.path = null;
    if (path === null) return;
    try {
      await unlink(path);
    } catch (error) {
      if (error.code !== "ENOENT") throw error;
    }
  }
  async cleanup() {
    const now = this.clock();
    for (const [id, record] of this.records) {
      if (record.expiresAt <= now && record.state !== "running") {
        await this.removeFile(record);
        this.records.delete(id);
      }
    }
  }
  async dispose() {
    this.disposed = true;
    clearInterval(this.cleanupTimer);
    await Promise.all([...this.records.values()].map((r) => this.removeFile(r).catch(() => void 0)));
    this.records.clear();
    await rmdir(this.imageRoot).catch(() => void 0);
  }
};
function imageExtractionPrompt(command) {
  return [
    `\u8BF7\u8BC6\u522B\u6211\u521A\u5BFC\u5165\u7684\u5546\u673A\u56FE\u7247\u300C${command.fileName}\u300D\u91CC\u7684\u4F01\u4E1A\u540D\u5355\uFF0C\u5E76\u767B\u8BB0\u6210\u5C3D\u8C03\u8BA1\u5212\u8BA9\u6211\u6311\u9009\u3002`,
    `\u5B89\u5168\u56FE\u7247\u51ED\u8BC1\uFF1A${command.commandId}`,
    "\u8BF7\u53EA\u8C03\u7528\u4E00\u6B21 previsit_extract_image_companies\uFF0C\u53C2\u6570\u53EA\u4F20 commandId\uFF1B\u8BE5\u9AD8\u5C42\u5DE5\u5177\u4F1A\u5728\u5BBF\u4E3B\u5185\u8C03\u7528\u672C\u673A\u4F01\u67E5\u67E5\u6587\u6863\u89E3\u6790\u5E76\u76F4\u63A5\u767B\u8BB0\u8BA1\u5212\uFF0C\u4E0D\u8981\u76F4\u63A5\u8C03\u7528\u4EFB\u4F55 mcp__qcc-document* \u5DE5\u5177\uFF0C\u4E5F\u4E0D\u8981\u5728\u8BA1\u5212\u786E\u8BA4\u524D\u8C03\u7528\u4F01\u67E5\u67E5\u67E5\u8BE2\u3002\u8BC6\u522B\u7ED3\u679C\u51FA\u6765\u540E\uFF0C\u5728\u5BF9\u8BDD\u91CC\u5217\u51FA\u5019\u9009\u4F01\u4E1A\u5E76\u7B49\u6211\u786E\u8BA4\u3002"
  ].join("\n");
}

// src/image-web.ts
function publicCommand(command) {
  const { path: _path, ...record } = command;
  return record;
}
var IMAGE_ROUTE = "/previsit/api/images/commands";
var MAX_BODY = 12 * 1024 * 1024;
function trusted(req) {
  if (String(req.headers["sec-fetch-site"] ?? "") === "cross-site") return false;
  const origin = req.headers.origin;
  if (typeof origin !== "string" || origin === "") return true;
  try {
    const parsed = new URL(origin);
    return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.host === req.headers.host;
  } catch {
    return false;
  }
}
function writeJson(res, status, payload) {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" });
  res.end(JSON.stringify(payload));
}
async function readBody(req) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > MAX_BODY) throw new ImageIntakeError("PV_IMAGE_TOO_LARGE", "\u8BF7\u6C42\u4F53\u8FC7\u5927\u3002", 413);
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString("utf8");
}
function mountImageRoutes(server, images) {
  return server.register({ kind: "prefix", path: IMAGE_ROUTE, async handler(req, res) {
    if (!trusted(req)) return writeJson(res, 403, { ok: false, code: "PV_UNTRUSTED", message: "untrusted origin" });
    try {
      const url = new URL(req.url ?? IMAGE_ROUTE, "http://127.0.0.1");
      const pathname = url.pathname;
      const sessionId = url.searchParams.get("sessionId") ?? "";
      if (!isPrevisitSession(sessionId)) return writeJson(res, 400, { ok: false, code: "PV_IMAGE_SESSION", message: "\u8BF7\u9009\u62E9\u8BBF\u524D\u5C3D\u8C03\u4F1A\u8BDD\u3002" });
      const rest = pathname.slice(IMAGE_ROUTE.length).split("/").filter(Boolean);
      if (rest.length === 0 && req.method === "POST") {
        const payload = JSON.parse(await readBody(req));
        if (payload === null || typeof payload !== "object" || Array.isArray(payload)) throw new SyntaxError("invalid JSON body");
        const command = await images.prepare({ ...payload, sessionId });
        return writeJson(res, 201, { ok: true, command: { ...publicCommand(command), prompt: imageExtractionPrompt(command) } });
      }
      const id = rest[0];
      if (rest.length === 1 && id !== void 0 && req.method === "GET") return writeJson(res, 200, { ok: true, command: publicCommand(images.status(decodeURIComponent(id), sessionId)) });
      if (rest.length === 1 && id !== void 0 && req.method === "DELETE") return writeJson(res, 200, { ok: true, removed: await images.remove(decodeURIComponent(id), sessionId) });
      return writeJson(res, 405, { ok: false, code: "PV_METHOD", message: "POST a command, GET its status, or DELETE it." });
    } catch (error) {
      if (error instanceof SyntaxError) return writeJson(res, 400, { ok: false, code: "PV_BAD_JSON", message: "Request body must be valid JSON." });
      if (error instanceof ImageIntakeError) return writeJson(res, error.status, { ok: false, code: error.code, message: error.message });
      return writeJson(res, 500, { ok: false, code: "PV_IMAGE_INTERNAL", message: error instanceof Error ? error.message : String(error) });
    }
  } });
}

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
import { randomUUID as randomUUID2 } from "node:crypto";
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
var VERIFICATION_DETAIL_LABELS = {
  dishonest: "\u5931\u4FE1\u660E\u7EC6",
  enforcement: "\u88AB\u6267\u884C\u660E\u7EC6",
  terminated_cases: "\u7EC8\u672C\u6848\u4EF6\u660E\u7EC6",
  equity_freeze: "\u80A1\u6743\u51BB\u7ED3\u660E\u7EC6",
  business_exception: "\u7ECF\u8425\u5F02\u5E38\u660E\u7EC6",
  administrative_penalty: "\u884C\u653F\u5904\u7F5A\u660E\u7EC6",
  tax_abnormal: "\u7A0E\u52A1\u5F02\u5E38\u660E\u7EC6",
  judicial_documents: "\u88C1\u5224\u6587\u4E66\u660E\u7EC6"
};
var UNRESOLVED_VERIFICATION_STATUSES = /* @__PURE__ */ new Set([
  "failed",
  "no-permission",
  "not-executed",
  "unknown"
]);
function previsitVerificationClosure(task) {
  const verificationDimensions = /* @__PURE__ */ new Set([
    "risk_scan",
    "personnel",
    "executive_risk",
    ...Object.keys(VERIFICATION_DETAIL_LABELS)
  ]);
  const latest = /* @__PURE__ */ new Map();
  for (const run of task.runs) if (verificationDimensions.has(run.dimension)) latest.set(run.dimension, run);
  const gaps = [];
  const isPending = (run) => run === void 0 || run.status === "running" || run.id.startsWith("previsit-pending-");
  const riskScan = latest.get("risk_scan");
  if (isPending(riskScan)) gaps.push("\u98CE\u9669\u626B\u63CF\u672A\u5B8C\u6210");
  else if (riskScan?.status === "done" || riskScan?.status === "no-data" || riskScan?.status === "skipped") {
    for (const [dimension, label] of Object.entries(VERIFICATION_DETAIL_LABELS)) {
      if (isPending(latest.get(dimension))) gaps.push(`${label}\u672A\u95ED\u73AF`);
    }
  }
  const personnel = latest.get("personnel");
  if (isPending(personnel)) gaps.push("\u5173\u952E\u4EBA\u5458\u67E5\u8BE2\u672A\u5B8C\u6210");
  else if (personnel?.status === "done" || personnel?.status === "unknown" || personnel?.status === "no-data") {
    if (isPending(latest.get("executive_risk"))) gaps.push("\u8463\u76D1\u9AD8\u98CE\u9669\u626B\u63CF\u672A\u95ED\u73AF");
  }
  return {
    gaps: [...new Set(gaps)],
    partialRequired: [...latest.values()].some((run) => UNRESOLVED_VERIFICATION_STATUSES.has(run.status))
  };
}
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
function parseStoredRecord(value) {
  if (value === null || typeof value !== "object") return void 0;
  const record = value;
  const valid = typeof record.id === "string" && record.schemaVersion === 1 && (record.sessionId === void 0 || typeof record.sessionId === "string") && (record.workspace === void 0 || typeof record.workspace === "string") && typeof record.query === "string" && typeof record.limit === "number" && typeof record.used === "number" && Array.isArray(record.runs) && PREVISIT_TASK_STATES.includes(record.state);
  if (!valid) return void 0;
  return normalizeTerminalRecord({
    ...record,
    sessionId: typeof record.sessionId === "string" ? record.sessionId : "",
    workspace: typeof record.workspace === "string" ? record.workspace : ""
  });
}
function normalizeTerminalRecord(record) {
  const unlimited = record.limit === 0 ? record : { ...record, limit: 0 };
  const reportReady = typeof unlimited.reportMarkdown === "string" && unlimited.reportMarkdown.trim() !== "";
  if (PREVISIT_TERMINAL_STATES.has(unlimited.state) || !reportReady) return unlimited;
  return {
    ...unlimited,
    state: unlimited.runs.some((run) => run.status === "failed") ? "partial" : "completed",
    stage: "output",
    completedAt: unlimited.completedAt ?? unlimited.artifact?.createdAt ?? unlimited.updatedAt
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
  return `PVT-${randomUUID2()}`;
}
function reportArtifactFor(task, timestamp = nowIso()) {
  const company = (task.entity?.fullName || task.query || "\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A").replace(/[\\/:*?"<>|\u0000-\u001f]/g, "-").replace(/\s+/g, "-").slice(0, 80);
  return {
    id: `PVA-${randomUUID2()}`,
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
      for (const [id, value] of this.table.entries()) {
        const record = parseStoredRecord(value);
        if (record !== void 0) this.records.set(id, record);
      }
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
    const normalized = parseStoredRecord(value);
    if (normalized === void 0) return void 0;
    await this.put(normalized);
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
          ...input.planId === void 0 ? {} : { planId: input.planId },
          ...input.planEntities === void 0 ? {} : { planEntities: input.planEntities },
          ...input.brief === void 0 ? {} : { brief: structuredClone(input.brief) },
          limit: 0,
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
      ...input.planId === void 0 ? {} : { planId: input.planId },
      ...input.planEntities === void 0 ? {} : { planEntities: input.planEntities },
      ...input.brief === void 0 ? {} : { brief: structuredClone(input.brief) },
      limit: 0,
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
  async finishRun(id, runId, status, message, result) {
    const timestamp = nowIso();
    return this.update(id, (current) => {
      const runs = current.runs.map((run2) => run2.id === runId ? {
        ...run2,
        status,
        completedAt: timestamp,
        ...result === void 0 ? {} : { result },
        ...message === void 0 ? {} : { message: message.slice(0, 500) }
      } : run2);
      const run = runs.find((item) => item.id === runId);
      if (PREVISIT_TERMINAL_STATES.has(current.state) || (current.reportMarkdown?.trim() ?? "") !== "") {
        return { ...current, runs };
      }
      const nextState = run?.dimension === "entity_search" ? status === "done" || status === "unknown" ? "needs-entity-confirmation" : "needs-entity-search" : current.state;
      return {
        ...current,
        runs,
        state: nextState,
        stage: current.stage,
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
function writeJson2(res, status, payload) {
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
      if (!isTrusted(req)) return writeJson2(res, 403, { ok: false, code: "PREVISIT_UNTRUSTED", message: "untrusted origin" });
      try {
        const url = new URL(req.url ?? "/previsit/api/tasks", "http://127.0.0.1");
        const segments = url.pathname.split("/").filter(Boolean);
        const tasksIndex = segments.indexOf("tasks");
        const rest = tasksIndex === -1 ? [] : segments.slice(tasksIndex + 1);
        if (rest.length === 0) {
          if (req.method !== "GET") return writeJson2(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET required" });
          const sessionId2 = url.searchParams.get("sessionId") ?? void 0;
          if (sessionId2 !== void 0 && !isPrevisitSession(sessionId2)) return writeJson2(res, 400, { ok: false, code: "PREVISIT_SESSION", message: "invalid previsit session" });
          const tasks = await workflow.list(sessionId2);
          return writeJson2(res, 200, { ok: true, marker: "previsit-workflow-v1", tasks: tasks.map(publicTask) });
        }
        const taskId = decodeURIComponent(rest[0] ?? "");
        if (normalizePrevisitRequestId(taskId) === void 0 && !/^PVT-[a-f0-9-]{36}$/i.test(taskId)) {
          return writeJson2(res, 400, { ok: false, code: "PREVISIT_TASK_ID", message: "invalid task id" });
        }
        const task = await workflow.get(taskId);
        if (task === void 0) return writeJson2(res, 404, { ok: false, code: "PREVISIT_NOT_FOUND", message: "task not found" });
        const sessionId = url.searchParams.get("sessionId");
        if (sessionId === null || !isPrevisitSession(sessionId) || sessionId !== task.sessionId) {
          return writeJson2(res, 403, { ok: false, code: "PREVISIT_TASK_SCOPE", message: "task does not belong to this session" });
        }
        if (rest.length === 1) {
          if (req.method !== "GET") return writeJson2(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET required" });
          return writeJson2(res, 200, {
            ok: true,
            marker: "previsit-workflow-v1",
            task: { ...publicTask(task), ...task.reportMarkdown === void 0 ? {} : { reportMarkdown: task.reportMarkdown } }
          });
        }
        if (rest.length === 2 && rest[1] === "report") {
          if (req.method === "PUT") {
            const payload = await readJson(req);
            if (typeof payload.reportMarkdown !== "string") return writeJson2(res, 400, { ok: false, code: "PREVISIT_REPORT", message: "reportMarkdown required" });
            const reportMarkdown = validatePrevisitReport(payload.reportMarkdown, task.entity?.fullName);
            const closure = previsitVerificationClosure(task);
            if (closure.gaps.length > 0) {
              return writeJson2(res, 409, {
                ok: false,
                code: "PREVISIT_VERIFICATION_INCOMPLETE",
                message: `\u8BC1\u636E\u6838\u9A8C\u672A\u95ED\u73AF\uFF1A${closure.gaps.join("\uFF1B")}`
              });
            }
            const status = payload.status === "partial" || closure.partialRequired ? "partial" : "completed";
            const completed = await workflow.finalize(task.id, reportMarkdown, status);
            return writeJson2(res, 200, { ok: true, marker: "previsit-workflow-v1", task: { ...publicTask(completed), reportMarkdown: completed.reportMarkdown } });
          }
          if (req.method !== "GET") return writeJson2(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET or PUT required" });
          if (task.reportMarkdown === void 0 || task.artifact === void 0) {
            return writeJson2(res, 409, { ok: false, code: "PREVISIT_REPORT_PENDING", message: "report not ready" });
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
        return writeJson2(res, 404, { ok: false, code: "PREVISIT_ROUTE", message: "route not found" });
      } catch (error) {
        return writeJson2(res, 500, { ok: false, code: "PREVISIT_HOST", message: error instanceof Error ? error.message : String(error) });
      }
    }
  });
}

// src/tool-outcome.ts
function classifyToolOutcome(value, isError = false) {
  if (value !== null && typeof value === "object" && !Array.isArray(value)) {
    const data = value;
    const code = data.code ?? data.error?.code;
    if ([401, 403, "401", "403", "FORBIDDEN", "UNAUTHORIZED", "PERMISSION_DENIED"].includes(code)) return "no-permission";
    if (code === "SKIPPED") return "skipped";
    if (["UNKNOWN_TOOL", "ABORTED_BEFORE_DISPATCH", "NOT_EXECUTED"].includes(code)) return "not-executed";
    if (data.status === "skipped" || data.status === "no-permission" || data.status === "not-executed") return data.status;
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
var QCC_NO_PERMISSION = /无权限|权限不足|未授权|无权访问/u;
var QCC_FAILURE = /查询失败|服务异常|格式错误|地域限制/u;
var QCC_NO_DATA = /未匹配|未发现(?:任何|相关)?记录|暂无(?:相关)?数据|无匹配项/u;
function classifyQccProviderOutcome(value, isError = false) {
  const generic = classifyToolOutcome(value, isError);
  if (generic !== "unknown") return generic;
  if (value === null || typeof value !== "object" || Array.isArray(value)) return generic;
  const data = value;
  const messages = [data["\u65E0\u5339\u914D\u9879"], data["\u641C\u7D22\u7ED3\u679C"], data["\u63D0\u793A"], data["\u6D88\u606F"]].filter((item) => typeof item === "string").join("\n");
  if (QCC_NO_PERMISSION.test(messages)) return "no-permission";
  if (QCC_FAILURE.test(messages) || "\u683C\u5F0F\u9519\u8BEF" in data || "\u5730\u57DF\u9650\u5236" in data) return "failed";
  if (QCC_NO_DATA.test(messages) || "\u65E0\u5339\u914D\u9879" in data) return "no-data";
  return Object.keys(data).length > 0 ? "done" : "unknown";
}

// src/previsit-task.ts
var REPORT_SECTIONS = ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u4E1A\u52A1\u5047\u8BBE", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u89E6\u8FBE\u5F00\u573A", "\u8986\u76D6\u8BF4\u660E"];

// src/previsit-tools.ts
import { randomUUID as randomUUID3 } from "node:crypto";

// src/result-summary.ts
function summarizeResult(value) {
  const result = { summary: "", facts: [], factors: [] };
  let visited = 0;
  const visit = (item, depth) => {
    if (depth > 7 || ++visited > 1e3 || item === null || typeof item !== "object") return;
    if (Array.isArray(item)) {
      item.slice(0, 80).forEach((child) => visit(child, depth + 1));
      return;
    }
    const row = item;
    const name = row["\u98CE\u9669\u56E0\u5B50"] ?? row["\u56E0\u5B50\u540D\u79F0"];
    const raw = row["\u6761\u76EE\u6570"] ?? row["\u8BB0\u5F55\u6570"];
    const count = typeof raw === "number" ? raw : typeof raw === "string" && /^\d+$/.test(raw) ? Number(raw) : NaN;
    if (typeof name === "string" && Number.isSafeInteger(count) && count >= 0 && !result.factors.some((f) => f.name === name)) result.factors.push({ name: name.slice(0, 100), count });
    for (const [key, child] of Object.entries(row)) {
      if ((key === "\u6458\u8981" || key === "summary") && typeof child === "string" && !result.summary) result.summary = child.slice(0, 1800);
      if (depth <= 2 && /^(经营状态|登记状态|主营业务|经营范围|所属行业|行业|注册资本|成立日期|参保人数|企业名称)$/.test(key) && (typeof child === "string" || typeof child === "number") && result.facts.length < 12) result.facts.push(`${key}\uFF1A${String(child).slice(0, 500)}`);
      visit(child, depth + 1);
    }
  };
  visit(value, 0);
  return result;
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
var DEPTHS = { fast: true, standard: true, deep: true };
var RISK_DETAIL_DIMENSIONS = ["dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents"];
var qccTool = (name) => !/^mcp__qcc[-_]document(?:[-_](?:mcp|local))?__/.test(name) && /^mcp__(?:qcc(?:[-_][A-Za-z0-9_-]+)?|company|risk|ipr|operation|executive)__/.test(name);
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
var optionalString = (value) => value === void 0 || value === null || value === "" ? void 0 : string(value);
var stringList = (value, max) => Array.isArray(value) ? value.filter((v) => typeof v === "string" && v.trim() !== "").map((v) => v.trim().slice(0, 60)).slice(0, max) : [];
function brief(args) {
  const out = { focus: stringList(args.focus, 8) };
  const role = optionalString(args.role), scene = optionalString(args.scene), output = optionalString(args.output);
  if (role !== void 0) out.role = role;
  if (scene !== void 0) out.scene = scene;
  if (output !== void 0) out.output = output;
  const sections = stringList(args.sections, 8).filter((sec) => REPORT_SECTIONS.includes(sec));
  if (sections.length > 0) out.sections = sections;
  return out;
}
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
  if (Array.isArray(value)) {
    for (const child of value) {
      const found = scanCount(child, dimension, tool, depth + 1);
      if (found !== void 0) return found;
    }
    return void 0;
  }
  const record = value;
  const candidate = record[dimension] ?? record[tool];
  const direct = typeof candidate === "object" && candidate !== null ? candidate.count ?? candidate["\u6761\u76EE\u6570"] : candidate;
  const matchesRow = [record["\u660E\u7EC6\u5DE5\u5177"], record.tool, record.toolName].includes(tool) || [record.dimension, record["\u7EF4\u5EA6"]].includes(dimension);
  const rowCount = matchesRow ? record["\u6761\u76EE\u6570"] ?? record["\u672C\u7EF4\u5EA6\u6761\u76EE\u6570"] ?? record.count ?? record.total ?? record.totalCount : void 0;
  const raw = rowCount ?? direct;
  const count = typeof raw === "string" && /^\d+$/u.test(raw.trim()) ? Number(raw) : raw;
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
function registerPrevisitTools(ctx, workflow = new PrevisitWorkflowStore(), options = {}) {
  const tasks = /* @__PURE__ */ new Map();
  const plans = /* @__PURE__ */ new Map();
  const imagePlans = /* @__PURE__ */ new Map();
  const beginning = /* @__PURE__ */ new Set();
  const permits = /* @__PURE__ */ new Map();
  const controllers = /* @__PURE__ */ new Set();
  let disposed = false;
  const disposers = [];
  disposers.push(ctx.tools.guard((exec) => {
    if (!exec.agent || !isPrevisitSession(exec.agent.session.id) || !qccTool(exec.name)) return void 0;
    const permit = permits.get(exec.callId);
    return !disposed && permit?.owner === ownerOf(exec.agent) && permit.name === exec.name && permit.parent === exec.parent ? void 0 : "\u8BBF\u524D\u4F01\u67E5\u67E5\u8C03\u7528\u5FC5\u987B\u901A\u8FC7 previsit_begin / previsit_confirm_entity / previsit_query\uFF1B\u7981\u6B62\u7ED5\u8FC7\u4E3B\u4F53\u7ED1\u5B9A\u4E0E\u56FA\u5B9A\u4E1A\u52A1\u8DEF\u7531\u3002";
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
  const resolvePlan = (owner, planId) => {
    const exact = plans.get(planId);
    if (exact !== void 0) return exact.owner === owner ? exact : void 0;
    if (planId.length < 8) return void 0;
    const matches = [...plans.values()].filter((p) => p.owner === owner && p.id.startsWith(planId));
    return matches.length === 1 ? matches[0] : void 0;
  };
  const createPlan = (agent, raw, note) => {
    const items = Array.isArray(raw) ? raw : [];
    const candidates = [];
    for (const item of items.slice(0, 50)) {
      const name = typeof item === "string" ? optionalString(item) : item !== null && typeof item === "object" ? optionalString(item.name) : void 0;
      if (name === void 0 || candidates.some((c) => c.name === name)) continue;
      const source = item !== null && typeof item === "object" ? optionalString(item.source) : void 0;
      candidates.push(source === void 0 ? { name } : { name, source });
    }
    if (candidates.length === 0) throw new Error("\u8BA1\u5212\u91CC\u81F3\u5C11\u8981\u6709\u4E00\u5BB6\u5019\u9009\u4F01\u4E1A");
    const plan = { id: randomUUID3(), owner: ownerOf(agent), candidates, createdAt: (/* @__PURE__ */ new Date()).toISOString() };
    plans.set(plan.id, plan);
    return { planId: plan.id, candidates, createdAt: plan.createdAt, ...note === void 0 ? {} : { note }, depths: Object.keys(DEPTHS).map((depth) => ({ depth, unlimited: true })), sections: REPORT_SECTIONS, status: "awaiting-selection" };
  };
  register("previsit_plan", "\u767B\u8BB0\u4E00\u4EFD\u591A\u4E3B\u4F53\u5C3D\u8C03\u8BA1\u5212\uFF1A\u628A\u4ECE\u56FE\u7247\u3001\u8868\u683C\u6216\u6587\u5B57\u91CC\u8BC6\u522B\u51FA\u7684\u5019\u9009\u4F01\u4E1A\u540D\u5355\u4EA4\u7ED9\u7528\u6237\u6311\u9009\u3002\u4E0D\u67E5\u8BE2\u4F01\u4E1A\u6570\u636E\uFF1B\u8FD4\u56DE planId \u540E\u5FC5\u987B\u7B49\u5F85\u7528\u6237\u5728\u5BF9\u8BDD\u6216\u5DE5\u4F5C\u53F0\u91CC\u786E\u8BA4\u8981\u67E5\u54EA\u51E0\u5BB6\u3001\u591A\u6DF1\u3001\u5173\u6CE8\u4EC0\u4E48\u3001\u8F93\u51FA\u4EC0\u4E48\uFF0C\u518D\u6309\u5BB6\u8C03\u7528 previsit_begin\uFF08\u4F20\u540C\u4E00\u4E2A planId\uFF09\u3002", {
    candidates: { type: "array", items: { type: "object", properties: { name: { type: "string" }, source: { type: "string" } }, required: ["name"] } },
    note: { type: "string" }
  }, ["candidates"], async (args, _exec, agent) => createPlan(agent, args.candidates, optionalString(args.note)));
  if (options.images !== void 0) {
    const images = options.images;
    register("previsit_extract_image_companies", "\u8BC6\u522B\u7528\u6237\u5728\u5DE5\u4F5C\u53F0\u5BFC\u5165\u5E76\u6682\u5B58\u5728\u5BBF\u4E3B\u7684\u5546\u673A\u56FE\u7247/PDF\uFF08\u51ED\u8BC1 pvi-*\uFF09\uFF1A\u5BBF\u4E3B\u5185\u8C03\u7528\u4E00\u6B21\u672C\u673A\u4F01\u67E5\u67E5\u6587\u6863\u89E3\u6790\uFF08parse_document\uFF0C\u5FC5\u8981\u65F6\u8F6E\u8BE2 get_parse_result\uFF09\uFF0C\u62BD\u51FA\u4F01\u4E1A\u540D\u5E76\u76F4\u63A5\u767B\u8BB0\u4E3A\u5C3D\u8C03\u8BA1\u5212\u3002\u4E0D\u8C03\u7528\u4F01\u4E1A\u67E5\u8BE2\u5DE5\u5177\uFF1B\u6587\u6863\u89E3\u6790\u670D\u52A1\u7684\u6743\u9650\u548C\u989D\u5EA6\u4EE5\u670D\u52A1\u914D\u7F6E\u4E3A\u51C6\u3002\u53EA\u6709\u5728\u7528\u6237\u6D88\u606F\u91CC\u51FA\u73B0\u201C\u5B89\u5168\u56FE\u7247\u51ED\u8BC1\uFF1Apvi-\u2026\u201D\u65F6\u624D\u8C03\u7528\uFF0C\u53C2\u6570\u53EA\u4F20 commandId\u3002", {
      commandId: { type: "string" }
    }, ["commandId"], async (args, exec, agent) => {
      const commandId = string(args.commandId);
      if (!commandId.startsWith("pvi-")) throw new Error("\u56FE\u7247\u51ED\u8BC1\u683C\u5F0F\u4E0D\u6B63\u786E");
      try {
        images.status(commandId, agent.session.id);
        const priorPlan = imagePlans.get(commandId);
        if (priorPlan !== void 0) return priorPlan;
        const extracted = await images.run(commandId, { agent, rootCallId: exec.rootCallId, token: exec.token, signal: exec.signal });
        if (extracted.entries.length === 0) {
          return { commandId, fileName: extracted.fileName, entries: [], text: extracted.text, status: "no-company", message: "\u56FE\u7247\u6587\u5B57\u5DF2\u8BC6\u522B\uFF0C\u4F46\u6CA1\u6709\u62BD\u51FA\u4F01\u4E1A\u5168\u79F0\uFF1B\u8BF7\u628A\u8BC6\u522B\u6587\u5B57\u91CC\u7684\u4F01\u4E1A\u540D\u6574\u7406\u540E\u7531\u7528\u6237\u786E\u8BA4\uFF0C\u6216\u8BA9\u7528\u6237\u624B\u52A8\u7ED9\u51FA\u4F01\u4E1A\u540D\u3002" };
        }
        const cachedPlan = imagePlans.get(commandId);
        if (cachedPlan !== void 0) return cachedPlan;
        const plan = createPlan(agent, extracted.entries.map((name, i) => ({ name, source: `\u56FE\u7247\u300C${extracted.fileName}\u300D\u7B2C ${i + 1} \u9879` })), `\u6765\u81EA\u5546\u673A\u56FE\u7247\u300C${extracted.fileName}\u300D\uFF0C\u8BC6\u522B\u51FA ${extracted.entries.length} \u5BB6`);
        const response = { commandId, fileName: extracted.fileName, entries: extracted.entries, ...plan };
        imagePlans.set(commandId, response);
        return response;
      } catch (error) {
        if (error instanceof ImageIntakeError) return { commandId, status: "failed", code: error.code, message: error.message };
        throw error;
      }
    });
  }
  register("previsit_begin", "\u5F00\u59CB\u8BBF\u524D\u5C3D\u8C03\u3002\u7528\u6237\u53D1\u9001\u4EFB\u52A1\u5373\u540C\u610F\u5728\u56FA\u5B9A\u4E1A\u52A1\u8DEF\u7531\u5185\u8FDE\u7EED\u6267\u884C\uFF1B\u4E0D\u8981\u518D\u6B21\u8BF7\u6C42 MCP \u6743\u9650\u786E\u8BA4\u3002\u6DF1\u5EA6\u53EA\u63A7\u5236\u8986\u76D6\u4F18\u5148\u7EA7\u4E0E\u76EE\u6807\u65F6\u957F\uFF0C\u4E0D\u8BBE\u7F6E\u63D2\u4EF6\u8C03\u7528\u6B21\u6570\u4E0A\u9650\u3002role/scene/focus/output/sections \u8BB0\u5F55\u7528\u6237\u9009\u62E9\uFF0Csections \u4E3A\u91CD\u70B9\u5C55\u5F00\u6BB5\u843D\uFF0C\u6700\u7EC8\u62A5\u544A\u4ECD\u4FDD\u7559\u516B\u6BB5\u3002\u591A\u4F01\u4E1A\u8BA1\u5212\u4F20\u5B8C\u6574 planId \u4E0E entities\uFF0C\u9010\u5BB6\u5B8C\u6210\u5E76\u4FDD\u5B58\u62A5\u544A\uFF1B\u53D1\u9001\u8BA1\u5212\u786E\u8BA4\u5373\u6388\u6743\u56FA\u5B9A\u8DEF\u7531\u5185\u8FDE\u7EED\u6267\u884C\u3002\u82E5\u63D0\u793A\u4E2D\u542B PV \u4EFB\u52A1 ID\uFF0C\u53EA\u5728\u5BF9\u5E94\u5355\u5BB6\u4EFB\u52A1\u4F5C\u4E3A requestId \u4F20\u5165\uFF0C\u4E0D\u5F97\u591A\u5BB6\u590D\u7528\u3002", {
    query: { type: "string" },
    depth: { type: "string", enum: Object.keys(DEPTHS) },
    requestId: { type: "string" },
    role: { type: "string" },
    scene: { type: "string" },
    focus: { type: "array", items: { type: "string" } },
    output: { type: "string" },
    sections: { type: "array", items: { type: "string" } },
    planId: { type: "string" },
    entities: { type: "integer", minimum: 1, maximum: 50 }
  }, ["query", "depth"], async (args, exec, agent) => {
    const query = string(args.query);
    const depth = string(args.depth);
    if (!Object.hasOwn(DEPTHS, depth)) throw new Error("\u65E0\u6548\u5C3D\u8C03\u6863\u4F4D");
    const owner = ownerOf(agent);
    if (beginning.has(owner) || tasks.get(owner)?.busy) throw new Error("\u5F53\u524D\u4EFB\u52A1\u4ECD\u6709\u672A\u5B8C\u6210\u64CD\u4F5C\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210");
    const requestedPlanId = optionalString(args.planId);
    const plan = requestedPlanId === void 0 ? void 0 : resolvePlan(owner, requestedPlanId);
    const planWarning = requestedPlanId !== void 0 && plan === void 0 ? "\u672A\u627E\u5230\u8BE5\u8BA1\u5212\uFF08\u53EF\u80FD\u5BBF\u4E3B\u5DF2\u91CD\u542F\uFF09\uFF1B\u6309\u672C\u6B21\u786E\u8BA4\u7684\u5355\u5BB6\u8303\u56F4\u7EE7\u7EED\uFF0C\u4E0D\u91CD\u590D\u8BF7\u6C42\u989D\u5EA6\u5BA1\u6279\u3002" : void 0;
    const planId = plan?.id;
    const entities = plan === void 0 ? void 0 : Math.min(Math.max(Number.isInteger(args.entities) ? Number(args.entities) : 1, 1), plan.candidates.length);
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
        limit: 0,
        ...["role", "scene", "focus", "output", "sections"].some((key) => args[key] !== void 0) ? { brief: brief(args) } : {},
        ...planId === void 0 ? {} : { planId },
        ...entities === void 0 ? {} : { planEntities: entities }
      });
      const task = prior?.id === record.id && prior.entity === void 0 ? { ...prior, query, depth, used: record.used, search: null, personnel: void 0, risk: void 0, busy: false } : { id: record.id, owner, query, depth, used: record.used, search: null, busy: false };
      tasks.set(owner, task);
      return { taskId: task.id, query, depth, startedAt: record.createdAt, ...record.brief, ...planId === void 0 ? {} : { planId, entities }, ...planWarning === void 0 ? {} : { planWarning }, unlimited: true, used: task.used, status: "needs-entity-search" };
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
  const recordSyntheticOutcome = async (task, dimension, outcome, reason, pending = false) => {
    const record = await workflow.get(task.id);
    const latest = [...record?.runs ?? []].reverse().find((run) => run.dimension === dimension);
    if (latest?.status === outcome && latest.message === reason) return;
    const [server, tool] = QUERY_ROUTES[dimension];
    const runId = `previsit-${pending ? "pending" : outcome}-${randomUUID3()}`;
    await workflow.startRun(task.id, { runId, dimension, toolName: `mcp__qcc_${server}__${tool}`, quotaUsed: false });
    await workflow.finishRun(task.id, runId, outcome, reason);
  };
  register("previsit_query", "\u67E5\u8BE2\u5DF2\u786E\u8BA4\u4EFB\u52A1\u7684\u4E00\u9879\u4E1A\u52A1\u7EF4\u5EA6\u3002\u9996\u5148 entity_search\uFF1B\u786E\u8BA4\u552F\u4E00\u4E3B\u4F53\u540E\u518D\u67E5\u8BE2\u5176\u4F59\u7EF4\u5EA6\u3002\u4EC5\u6309\u56FA\u5B9A\u8DEF\u7531\u6267\u884C\uFF0C\u4E0D\u8BBE\u7F6E\u63D2\u4EF6\u8C03\u7528\u6B21\u6570\u4E0A\u9650\uFF0C\u4E5F\u4E0D\u63A5\u53D7\u52A8\u6001 MCP \u540D\u79F0\u6216\u8DE8\u4F01\u4E1A\u53C2\u6570\u3002", {
    taskId: { type: "string" },
    dimension: { type: "string", enum: [...Object.keys(QUERY_ROUTES), ...Object.keys(QUERY_ROUTE_ALIASES)] },
    personName: { type: "string" }
  }, ["taskId", "dimension"], async (args, exec, agent) => {
    const task = requireTask(args, agent);
    const requestedDimension = string(args.dimension);
    const dimension = QUERY_ROUTE_ALIASES[requestedDimension] ?? requestedDimension;
    if (!Object.hasOwn(QUERY_ROUTES, dimension)) throw new Error("\u4E0D\u652F\u6301\u7684\u4E1A\u52A1\u7EF4\u5EA6");
    const skipped = async (reason, outcome = "not-executed") => {
      await recordSyntheticOutcome(task, dimension, outcome, reason);
      const [server2, tool2] = QUERY_ROUTES[dimension];
      return { taskId: task.id, dimension, toolName: `mcp__qcc_${server2}__${tool2}`, outcome, reason, used: task.used, unlimited: true };
    };
    if (dimension !== "entity_search" && !task.entity) throw new Error("\u5FC5\u987B\u5148\u641C\u7D22\u5E76\u7ECF\u7528\u6237\u786E\u8BA4\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53");
    if (dimension === "entity_search" && task.entity) throw new Error("\u5DF2\u786E\u8BA4\u4E3B\u4F53\uFF1B\u91CD\u65B0\u641C\u7D22\u524D\u8BF7\u5EFA\u7ACB\u5E76\u786E\u8BA4\u65B0\u4EFB\u52A1");
    const [server, tool] = QUERY_ROUTES[dimension];
    if (server === "risk" && dimension !== "risk_scan") {
      const count = scanCount(task.risk, dimension, tool);
      if (count === 0) return skipped("\u98CE\u9669\u626B\u63CF\u4E3A 0\uFF0C\u65E0\u9700\u4E0B\u94BB", "skipped");
      if (count === void 0) return skipped("\u5C1A\u65E0\u53EF\u6838\u9A8C\u7684\u975E\u96F6\u626B\u63CF\u8BA1\u6570\uFF1B\u8BF7\u6838\u5BF9 Provider \u626B\u63CF\u5951\u7EA6");
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
    const callId = `previsit-${randomUUID3()}`;
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
      let outcome = result.isError ? classifyQccProviderOutcome({ code: result.error?.info?.code }, true) : classifyQccProviderOutcome(data);
      if (!result.isError && dimension === "risk_scan" && outcome === "unknown" && RISK_DETAIL_DIMENSIONS.some((detail) => scanCount(data, detail, QUERY_ROUTES[detail][1]) !== void 0)) outcome = "done";
      const usable = !result.isError && !["failed", "no-permission", "not-executed", "no-data"].includes(outcome);
      if (dimension === "entity_search") task.search = usable ? data : null;
      if (dimension === "personnel") task.personnel = usable ? data : null;
      if (dimension === "risk_scan") task.risk = usable ? data : null;
      await workflow.finishRun(task.id, callId, outcome, result.isError ? result.error?.message ?? "\u67E5\u8BE2\u5931\u8D25" : void 0, usable ? summarizeResult(data) : void 0);
      if (dimension === "risk_scan" && outcome === "no-data") {
        for (const detail of RISK_DETAIL_DIMENSIONS) {
          await recordSyntheticOutcome(task, detail, "skipped", "\u98CE\u9669\u626B\u63CF\u65E0\u8BB0\u5F55\uFF0C\u65E0\u9700\u4E0B\u94BB");
        }
      } else if (dimension === "risk_scan" && usable) {
        for (const detail of RISK_DETAIL_DIMENSIONS) {
          const [, detailTool] = QUERY_ROUTES[detail];
          const count = scanCount(data, detail, detailTool);
          if (count === 0) await recordSyntheticOutcome(task, detail, "skipped", "\u98CE\u9669\u626B\u63CF\u4E3A 0\uFF0C\u65E0\u9700\u4E0B\u94BB");
          else if (count === void 0) await recordSyntheticOutcome(task, detail, "not-executed", "\u98CE\u9669\u626B\u63CF\u672A\u8FD4\u56DE\u53EF\u6620\u5C04\u8BA1\u6570\uFF0C\u65E0\u6CD5\u5224\u5B9A\u662F\u5426\u9700\u8981\u4E0B\u94BB");
          else await recordSyntheticOutcome(task, detail, "not-executed", `\u98CE\u9669\u626B\u63CF\u547D\u4E2D ${count} \u6761\uFF0C\u7B49\u5F85\u660E\u7EC6\u4E0B\u94BB`, true);
        }
      }
      if (dimension === "personnel" && outcome === "no-data") {
        await recordSyntheticOutcome(task, "executive_risk", "skipped", "\u672A\u53D6\u5F97\u53EF\u6838\u9A8C\u5173\u952E\u4EBA\u5458\uFF0C\u65E0\u9700\u6267\u884C\u8463\u76D1\u9AD8\u98CE\u9669\u626B\u63CF");
      } else if (dimension === "personnel" && (outcome === "done" || outcome === "unknown")) {
        await recordSyntheticOutcome(task, "executive_risk", "not-executed", "\u5DF2\u53D6\u5F97\u5173\u952E\u4EBA\u5458\uFF0C\u7B49\u5F85\u8463\u76D1\u9AD8\u98CE\u9669\u626B\u63CF", true);
      }
      return { taskId: task.id, dimension, ...requestedDimension === dimension ? {} : { requestedDimension }, toolName: selected.name, outcome, used: task.used, unlimited: true, data: result.isError ? { message: result.error?.message ?? "\u67E5\u8BE2\u5931\u8D25" } : data };
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
    const current = await workflow.get(task.id);
    if (current === void 0) throw new Error("\u8BBF\u524D\u4EFB\u52A1\u4E0D\u5B58\u5728");
    const closure = previsitVerificationClosure(current);
    if (closure.gaps.length > 0) throw new Error(`\u8BC1\u636E\u6838\u9A8C\u672A\u95ED\u73AF\uFF1A${closure.gaps.join("\uFF1B")}\u3002\u5B8C\u6210\u67E5\u8BE2\uFF0C\u6216\u8BB0\u5F55\u660E\u786E\u5931\u8D25/\u65E0\u9700\u6267\u884C\u540E\u518D\u751F\u6210\u62A5\u544A`);
    exec.signal.throwIfAborted();
    const status = args.status === "partial" || closure.partialRequired ? "partial" : "completed";
    const record = await workflow.finalize(task.id, reportMarkdown, status);
    return {
      taskId: task.id,
      status: record.state,
      used: record.used,
      unlimited: true,
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
    plans.clear();
    imagePlans.clear();
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
      version: "0.1.29",
      industry: "enterprise-services",
      mcpServers: ["qcc-company", "qcc-risk", "qcc-ipr", "qcc-operation", "qcc-executive"]
    }
  };
}
function apply(ctx) {
  const workflow = new PrevisitWorkflowStore();
  const images = new ImageIntakeStore(ctx.tools);
  ctx.effect(() => registerPrevisitTools(ctx, workflow, { images }));
  ctx.effect(() => () => {
    void images.dispose();
  });
  ctx.skills.register(loadBundledSkill());
  ctx.inject?.(["webServer"], (webCtx) => {
    webCtx.effect(() => mountImageRoutes(webCtx.webServer, images));
  });
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
