window.__ModuleLoader__.load({
  id: "dsh-pre-duediligence",
  factory: (require) => {
    var module = { exports: {} };
    var exports = module.exports;
"use strict";
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/client.tsx
var client_exports = {};
__export(client_exports, {
  apply: () => apply,
  applySelection: () => applySelection,
  composeFullSentence: () => composeFullSentence,
  composeImperative: () => composeImperative,
  createTaskId: () => createTaskId,
  generateFromSelection: () => generateFromSelection,
  inject: () => inject,
  serializePrevisitRequest: () => serializePrevisitRequest,
  updateManualText: () => updateManualText,
  validateComposerText: () => validateComposerText
});
module.exports = __toCommonJS(client_exports);

// src/workbench-v2.tsx
var import_react3 = require("react");

// src/previsit-dock.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");

// src/composer-model.ts
var COMPANY_PLACEHOLDER = "\uFF08\u8FD9\u91CC\u8F93\u5165\u4F01\u4E1A\u540D\uFF09";
var ROLE_OPTIONS = [
  { id: "bank_rm", label: "\u94F6\u884C/\u4FE1\u8D37\u5BA2\u6237\u7ECF\u7406", phrase: "\u94F6\u884C\u5BF9\u516C\u5BA2\u6237\u7ECF\u7406" },
  { id: "sales", label: "\u9500\u552E/BD", phrase: "\u9500\u552E" },
  { id: "procure", label: "\u91C7\u8D2D/\u4F9B\u5E94\u94FE", phrase: "\u91C7\u8D2D\u8D1F\u8D23\u4EBA" },
  { id: "invest", label: "\u6295\u8D44\u673A\u6784", phrase: "\u6295\u8D44\u673A\u6784\u4EBA\u5458" },
  { id: "gov", label: "\u653F\u5E9C/\u56ED\u533A\u62DB\u5546", phrase: "\u56ED\u533A\u62DB\u5546\u4EBA\u5458" },
  { id: "other", label: "\u5176\u4ED6", phrase: "\u51C6\u5907\u62DC\u8BBF\u4F01\u4E1A\u7684\u5546\u52A1\u4EBA\u5458" }
];
var PURPOSE_OPTIONS = [
  { id: "first", label: "\u9996\u6B21\u62DC\u8BBF", phrase: "\u9996\u6B21" },
  { id: "nego", label: "\u8C08\u5224\u524D\u62DC\u8BBF", phrase: "\u5728\u5546\u52A1\u8C08\u5224\u524D" },
  {
    id: "revisit",
    label: "\u590D\u8BBF",
    phrase: "\u590D\u8BBF\u524D\u66F4\u65B0\u5F0F\u5730",
    extraClause: "\u5982\u6709\u6B64\u524D\u5BF9\u8BE5\u4F01\u4E1A\u7684\u5C3D\u8C03\u8BB0\u5F55\uFF0C\u8BF7\u5BF9\u6BD4\u8BF4\u660E\u53D8\u5316\uFF1B\u82E5\u65E0\u8BB0\u5F55\uFF0C\u8BF7\u7167\u5E38\u5168\u91CF\u5C3D\u8C03\u5E76\u6CE8\u660E\u662F\u9996\u6B21\u3002"
  }
];
var FOCUS_OPTIONS = [
  { id: "risk", label: "\u98CE\u9669\u4E0E\u6D89\u8BC9", phrase: "\u98CE\u9669\u4E0E\u6D89\u8BC9" },
  { id: "equity", label: "\u80A1\u6743\u4E0E\u5B9E\u63A7\u4EBA", phrase: "\u80A1\u6743\u4E0E\u5B9E\u63A7\u4EBA" },
  { id: "finance", label: "\u7ECF\u8425\u4E0E\u8D22\u52A1", phrase: "\u7ECF\u8425\u4E0E\u8D22\u52A1" },
  { id: "contact", label: "\u8054\u7CFB\u4EBA\u4E0E\u89E6\u8FBE", phrase: "\u8054\u7CFB\u4EBA\u4E0E\u89E6\u8FBE\u8DEF\u5F84" },
  { id: "ipr", label: "\u77E5\u8BC6\u4EA7\u6743", phrase: "\u77E5\u8BC6\u4EA7\u6743" },
  { id: "bidding", label: "\u62DB\u6295\u6807\u4E1A\u7EE9", phrase: "\u62DB\u6295\u6807\u4E1A\u7EE9" }
];
var BUDGET_OPTIONS = [
  { id: "fast", label: "3\u5206\u949F\u901F\u89C8", phrase: "\u901F\u89C8" },
  { id: "standard", label: "15\u5206\u949F\u6807\u51C6", phrase: "\u6807\u51C6" },
  { id: "deep", label: "\u6DF1\u5EA6\u5C3D\u8C03", phrase: "\u6DF1\u5EA6" }
];
var OUTPUT_OPTIONS = [
  { id: "onepager", label: "\u4E00\u9875\u7EB8\u7B80\u62A5", phrase: "\u4E00\u9875\u7EB8\u7B80\u62A5" },
  { id: "questions", label: "\u63D0\u95EE\u6E05\u5355\u4E3A\u4E3B", phrase: "\u4EE5\u5F53\u9762\u63D0\u95EE\u6E05\u5355\u4E3A\u4E3B\u7684\u7B80\u62A5" },
  { id: "full", label: "\u5B8C\u6574\u62A5\u544A", phrase: "\u5B8C\u6574\u5C3D\u8C03\u62A5\u544A" },
  { id: "share", label: "\u53EF\u8F6C\u53D1\u6458\u8981", phrase: "\u9002\u5408\u8F6C\u53D1\u7ED9\u540C\u4E8B\u7684\u7B80\u77ED\u6458\u8981" }
];
var EMPTY_SELECTION = { focus: [] };
var EMPTY_COMPOSER_STATE = {
  text: "",
  lastGenerated: "",
  lastCompany: "",
  mode: "generated"
};
function optionById(options, id) {
  return id === void 0 ? void 0 : options.find((option) => option.id === id);
}
function hasSelection(selection) {
  return selection.role !== void 0 || selection.purpose !== void 0 || selection.focus.length > 0 || selection.budget !== void 0 || selection.output !== void 0;
}
function composeFullSentence(selection, company = "") {
  if (!hasSelection(selection) && company.trim() === "") {
    return "";
  }
  const role = optionById(ROLE_OPTIONS, selection.role);
  const purpose = optionById(PURPOSE_OPTIONS, selection.purpose);
  const budget = optionById(BUDGET_OPTIONS, selection.budget);
  const output = optionById(OUTPUT_OPTIONS, selection.output);
  const focus = selection.focus.map((id) => optionById(FOCUS_OPTIONS, id)?.phrase).filter((phrase) => phrase !== void 0);
  const target = company.trim() || COMPANY_PLACEHOLDER;
  const firstClause = (role === void 0 ? "" : "\u6211\u662F" + role.phrase + "\uFF0C") + "\u51C6\u5907" + (purpose?.phrase ?? "") + "\u62DC\u8BBF" + target;
  const clauses = [
    firstClause,
    focus.length === 0 ? void 0 : "\u8BF7\u91CD\u70B9\u770B" + focus.join("\u3001"),
    budget === void 0 ? void 0 : "\u505A\u4E00\u6B21" + budget.phrase + "\u5C3D\u8C03",
    output === void 0 ? void 0 : "\u8F93\u51FA" + output.phrase
  ].filter((clause) => clause !== void 0);
  const extraClause = purpose?.extraClause;
  return clauses.join("\uFF0C") + "\u3002" + (extraClause ?? "");
}
function composeImperative(selection) {
  if (!hasSelection(selection)) {
    return "";
  }
  const role = optionById(ROLE_OPTIONS, selection.role);
  const purpose = optionById(PURPOSE_OPTIONS, selection.purpose);
  const budget = optionById(BUDGET_OPTIONS, selection.budget);
  const output = optionById(OUTPUT_OPTIONS, selection.output);
  const focus = selection.focus.map((id) => optionById(FOCUS_OPTIONS, id)?.phrase).filter((phrase) => phrase !== void 0);
  const clauses = [
    role === void 0 ? void 0 : "\u6309" + role.phrase + "\u89C6\u89D2",
    purpose === void 0 ? void 0 : purpose.phrase + "\u5F00\u5C55\u672C\u6B21\u62DC\u8BBF\u51C6\u5907",
    focus.length === 0 ? void 0 : "\u91CD\u70B9\u770B" + focus.join("\u3001"),
    budget === void 0 ? void 0 : "\u505A\u4E00\u6B21" + budget.phrase + "\u5C3D\u8C03",
    output === void 0 ? void 0 : "\u8F93\u51FA" + output.phrase
  ].filter((clause) => clause !== void 0);
  return "\u8BF7" + clauses.join("\uFF0C") + "\u3002" + (purpose?.extraClause ?? "");
}
function capturePlaceholderCompany(lastGenerated, currentText) {
  const placeholderAt = lastGenerated.indexOf(COMPANY_PLACEHOLDER);
  if (placeholderAt < 0) {
    return void 0;
  }
  const prefix = lastGenerated.slice(0, placeholderAt);
  const suffix = lastGenerated.slice(placeholderAt + COMPANY_PLACEHOLDER.length);
  if (!currentText.startsWith(prefix) || !currentText.endsWith(suffix)) {
    return void 0;
  }
  const captured = currentText.slice(prefix.length, currentText.length - suffix.length).trim();
  return captured === "" || captured === COMPANY_PLACEHOLDER ? void 0 : captured;
}
function updateManualText(state, text) {
  if (text === state.lastGenerated || text === "") {
    return { ...state, text, mode: "generated" };
  }
  const captured = capturePlaceholderCompany(state.lastGenerated, text);
  if (captured !== void 0) {
    return { ...state, text, lastCompany: captured, mode: "generated" };
  }
  if (state.lastGenerated !== "" && text.startsWith(state.lastGenerated)) {
    return { ...state, text, mode: "generated" };
  }
  return { ...state, text, mode: "manual" };
}
function applySelection(state, selection, companyOverride) {
  if (state.mode === "manual") {
    return state;
  }
  const captured = capturePlaceholderCompany(state.lastGenerated, state.text);
  const company = companyOverride !== void 0 && companyOverride.trim() !== "" ? companyOverride.trim() : captured ?? state.lastCompany;
  const tail = state.lastGenerated !== "" && state.text.startsWith(state.lastGenerated) ? state.text.slice(state.lastGenerated.length) : "";
  const generated = composeFullSentence(selection, company);
  return {
    text: generated + tail,
    lastGenerated: generated,
    lastCompany: company,
    mode: "generated"
  };
}
function generateFromSelection(state, selection) {
  if (state.mode !== "manual") {
    return applySelection(state, selection);
  }
  const imperative = composeImperative(selection);
  if (imperative === "") {
    return state;
  }
  const separator = state.text.trim() === "" || state.text.endsWith("\n") ? "" : "\n";
  return {
    ...state,
    text: state.text + separator + imperative,
    mode: "manual"
  };
}
function validateComposerText(text) {
  const normalized = text.trim();
  if (normalized === "") {
    return "\u8BF7\u8BF4\u660E\u8981\u62DC\u8BBF\u7684\u4F01\u4E1A";
  }
  if (normalized.includes(COMPANY_PLACEHOLDER)) {
    return "\u8BF7\u5C06\u5360\u4F4D\u7B26\u66FF\u6362\u4E3A\u4F01\u4E1A\u5B8C\u6574\u6CE8\u518C\u540D\u79F0\u3001\u7B80\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801";
  }
  return void 0;
}
function createTaskId(now = /* @__PURE__ */ new Date(), randomValue = Math.random()) {
  const date = now.toISOString().slice(0, 10).replaceAll("-", "");
  const suffix = Math.floor(randomValue * 1048576).toString(36).padStart(4, "0").slice(0, 4).toUpperCase();
  return "PV-" + date + "-" + suffix;
}
function serializePrevisitRequest(text, taskId) {
  return [
    text.trim(),
    "",
    "\u8BBF\u524D\u4EFB\u52A1 ID\uFF1A" + taskId,
    "\u8BF7\u4F7F\u7528 qcc-previsit-onepager Skill \u6267\u884C\uFF0C\u5E76\u5728\u5B8C\u6210\u62A5\u544A\u540E\u56DE\u5199\u4EFB\u52A1\u5B8C\u6210\u6807\u8BB0\u3002"
  ].join("\n");
}

// src/previsit-store.ts
var EMPTY_SESSION_STATE = {
  selection: EMPTY_SELECTION,
  company: "",
  composer: EMPTY_COMPOSER_STATE,
  task: void 0,
  panel: null
};
function createPrevisitStore() {
  const states = /* @__PURE__ */ new Map();
  const listeners = /* @__PURE__ */ new Set();
  return {
    get(sessionId) {
      return states.get(sessionId) ?? EMPTY_SESSION_STATE;
    },
    update(sessionId, fn) {
      const next = fn(states.get(sessionId) ?? EMPTY_SESSION_STATE);
      states.set(sessionId, next);
      for (const listener of listeners) listener();
    },
    subscribe(listener) {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    }
  };
}
function summarizeSelection(state, labels) {
  const s = state.selection;
  const out = [];
  if (state.company.trim() !== "") out.push(state.company.trim());
  const role = s.role === void 0 ? void 0 : labels.role(s.role);
  if (role !== void 0) out.push(role);
  const purpose = s.purpose === void 0 ? void 0 : labels.purpose(s.purpose);
  if (purpose !== void 0) out.push(purpose);
  if (s.focus.length > 0) out.push("\u5173\u6CE8 " + s.focus.map(labels.focus).filter(Boolean).join("\u3001"));
  const budget = s.budget === void 0 ? void 0 : labels.budget(s.budget);
  if (budget !== void 0) out.push(budget);
  const output = s.output === void 0 ? void 0 : labels.output(s.output);
  if (output !== void 0) out.push(output);
  return out;
}

// src/report-export.ts
function nodeText(node) {
  if (typeof node.text === "string") return node.text;
  if (typeof node.content === "string") return node.content;
  if (node.message && typeof node.message.content === "string") return node.message.content;
  if (Array.isArray(node.content)) {
    return node.content.map((c) => typeof c === "string" ? c : c && typeof c.text === "string" ? c.text : "").join("");
  }
  if (Array.isArray(node.parts)) {
    return node.parts.map((pt) => typeof pt === "string" ? pt : pt && typeof pt.text === "string" ? pt.text : "").join("");
  }
  return "";
}
var CARD_START = /^#{1,3}\s*(访前尽调报告|拜访作战卡)[^\n]*$|^#{1,3}\s*[①1]?\s*核心研判[^\n]*$/m;
var CARD_SHAPE = (text) => /核心研判/.test(text) && /现场必问|覆盖说明|覆盖度/.test(text);
var JUNK = /<system-reminder>|<available_skills>|<command-name>|<\/?antml/i;
var isTool = (node) => node.kind === "tool-result" || node.kind === "tool-call";
var isUserish = (node) => /user|human|system/i.test(`${node.role ?? ""} ${node.kind ?? ""}`);
function adoptTaskFromSnapshot(snapshot) {
  const nodes = snapshot.nodes ?? [];
  for (let idx = nodes.length - 1; idx >= 0; idx--) {
    const node = nodes[idx];
    if (node === void 0 || node.kind === "tool-result" || node.kind === "tool-call") continue;
    const text = nodeText(node);
    const m = /访前任务 ID[：:]\s*(PV-[A-Z0-9-]+)/.exec(text);
    if (m !== null && m[1] !== void 0) return { id: m[1], prompt: text.trim(), nodeBaseline: idx };
  }
  const firstTool = nodes.findIndex((n) => n.kind === "tool-result" && /mcp__(company|risk|ipr|operation|executive)|qcc/i.test(n.call?.name ?? ""));
  if (firstTool !== -1) {
    let prompt = "";
    for (let idx = firstTool - 1; idx >= 0; idx--) {
      const node = nodes[idx];
      if (node === void 0 || node.kind === "tool-result" || node.kind === "tool-call") continue;
      const t = nodeText(node).trim();
      if (t !== "" && !/<system-reminder>/.test(t)) {
        prompt = t;
        break;
      }
    }
    return { id: "\u4F1A\u8BDD\u5185\u53D1\u8D77", prompt, nodeBaseline: 0 };
  }
  return null;
}
function extractCardText(snapshot, baseline) {
  const nodes = (snapshot.nodes ?? []).slice(baseline);
  for (let idx = nodes.length - 1; idx >= 0; idx--) {
    const node = nodes[idx];
    if (node === void 0 || isTool(node) || isUserish(node)) continue;
    const text = nodeText(node);
    if (JUNK.test(text)) continue;
    const m = CARD_START.exec(text);
    if (m === null || m.index === void 0) continue;
    let card = text.slice(m.index).trim();
    for (let j = idx + 1; j < nodes.length; j++) {
      const next = nodes[j];
      if (next === void 0 || isTool(next) || isUserish(next)) break;
      const t = nodeText(next).trim();
      if (t === "" || JUNK.test(t) || !/^(#{2,4}\s|\||-\s|\d+\.\s|\*\*)/.test(t)) break;
      card += "\n\n" + t;
    }
    if (CARD_SHAPE(card)) return card;
  }
  for (let idx = nodes.length - 1; idx >= 0; idx--) {
    const node = nodes[idx];
    if (node === void 0 || isTool(node) || isUserish(node)) continue;
    const text = nodeText(node).trim();
    if (text.length > 40 && !JUNK.test(text) && CARD_SHAPE(text)) return text;
  }
  return null;
}
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
  --blue:#2563eb;--blue-dark:#1e40af;--ink:#0f172a;--body:#334155;--muted:#64748b;
  --line:#e2e8f0;--line-blue:#dbeafe;--hero:#f8fbff;
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
function buildPrevisitReportFromRenderedHtml(bodyHtml, plainText, meta) {
  const m = deriveMeta(plainText, meta);
  const body = humanizeHypothesis(stripFactIds(bodyHtml)).replace(/<(td|th)([^>]*)>\s*([^<]{1,20})\s*<\/\1>/g, (_m, tag, attrs, cell) => `<${tag}${attrs}>${esc(humanizeCell(cell))}</${tag}>`);
  return wrapPrevisitReport(body, m);
}

// src/previsit-dock.tsx
var import_jsx_runtime = require("react/jsx-runtime");
function composerTextarea() {
  if (typeof document === "undefined") return null;
  const all = Array.from(document.querySelectorAll("textarea")).filter((t) => t.closest(".qccDock") === null && t.closest(".qccPwShell") === null && !t.disabled);
  return all[all.length - 1] ?? null;
}
function writeDraft(actions, text) {
  try {
    actions?.setDraft(text);
  } catch {
  }
  const apply2 = () => {
    const ta = composerTextarea();
    if (ta === null || ta.value === text) return;
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, "value")?.set;
    if (setter === void 0) return;
    setter.call(ta, text);
    ta.dispatchEvent(new Event("input", { bubbles: true }));
  };
  if (actions === void 0) {
    apply2();
    return;
  }
  if (typeof window !== "undefined") window.setTimeout(apply2, 30);
}
var labelOf = (options) => (id) => options.find((o) => o.id === id)?.label;
function Chips(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccDockChips", children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccDockChip", "data-selected": props.selected.includes(option.id), onClick: () => props.onToggle(option.id), children: option.label }, option.id)) });
}
function usePrevisitComposer(args) {
  const { sessionId, store } = args;
  const state = (0, import_react.useSyncExternalStore)(store.subscribe, () => store.get(sessionId), () => EMPTY_SESSION_STATE);
  const [error, setError] = (0, import_react.useState)();
  const [submitting, setSubmitting] = (0, import_react.useState)(false);
  const draft = args.readDraft();
  const synced = updateManualText(state.composer, draft);
  const manual = synced.mode === "manual" && draft.trim() !== "";
  const write = (selection, company) => {
    const base = { ...updateManualText(state.composer, args.readDraft()), lastCompany: company };
    const next = applySelection(base, selection, company);
    if (next.mode === "generated") args.writeDraft(next.text);
    store.update(sessionId, (s) => ({ ...s, selection, company, composer: next }));
    setError(void 0);
  };
  const toggleSingle = (key, id) => {
    const next = { ...state.selection };
    if (next[key] === id) delete next[key];
    else next[key] = id;
    write(next, state.company);
  };
  const toggleFocus = (id) => {
    const focus = state.selection.focus.includes(id) ? state.selection.focus.filter((v) => v !== id) : [...state.selection.focus, id];
    write({ ...state.selection, focus }, state.company);
  };
  const setCompany = (company) => write(state.selection, company);
  const append = () => {
    const next = generateFromSelection(updateManualText(state.composer, args.readDraft()), state.selection);
    args.writeDraft(next.text);
    store.update(sessionId, (s) => ({ ...s, composer: next }));
  };
  const reset = () => {
    args.writeDraft("");
    store.update(sessionId, (s) => ({ ...EMPTY_SESSION_STATE, task: s.task, panel: s.panel }));
    setError(void 0);
  };
  const startTask = async () => {
    const text = args.readDraft().trim();
    const invalid = validateComposerText(text);
    if (invalid !== void 0) {
      setError(invalid);
      return;
    }
    const id = createTaskId();
    const prompt = serializePrevisitRequest(text, id);
    setSubmitting(true);
    setError(void 0);
    try {
      const nodeBaseline = await args.start(prompt);
      store.update(sessionId, (s) => ({
        ...s,
        composer: { ...s.composer, text: "", lastGenerated: "", mode: "generated" },
        task: { id, prompt, createdAt: (/* @__PURE__ */ new Date()).toISOString(), nodeBaseline, seenRunning: false, selection: s.selection }
      }));
      args.writeDraft("");
      args.onStarted?.();
    } catch {
      setError("\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5F53\u524D\u4F1A\u8BDD\u540E\u91CD\u8BD5");
    } finally {
      setSubmitting(false);
    }
  };
  const summary = summarizeSelection(state, {
    role: labelOf(ROLE_OPTIONS),
    purpose: labelOf(PURPOSE_OPTIONS),
    focus: labelOf(FOCUS_OPTIONS),
    budget: labelOf(BUDGET_OPTIONS),
    output: labelOf(OUTPUT_OPTIONS)
  });
  return { state, manual, error, submitting, summary, toggleSingle, toggleFocus, setCompany, append, reset, startTask };
}
function PrevisitFields(props) {
  const { actions: a } = props;
  const st = a.state;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockBody", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", { className: "qccDockLabel", htmlFor: `${props.idPrefix}-company`, children: "\u8981\u89C1\u8C01" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { id: `${props.idPrefix}-company`, className: "qccDockCompany", value: st.company, placeholder: "\u4F01\u4E1A\u5168\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801", onChange: (e) => a.setCompany(e.target.value) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccDockLabel", children: "\u6211\u662F" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, { options: ROLE_OPTIONS, selected: st.selection.role === void 0 ? [] : [st.selection.role], onToggle: (id) => a.toggleSingle("role", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccDockLabel", children: "\u573A\u5408" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, { options: PURPOSE_OPTIONS, selected: st.selection.purpose === void 0 ? [] : [st.selection.purpose], onToggle: (id) => a.toggleSingle("purpose", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccDockLabel", children: "\u5173\u6CE8" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, { options: FOCUS_OPTIONS, selected: st.selection.focus, onToggle: a.toggleFocus })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccDockLabel", children: "\u6DF1\u5EA6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, { options: BUDGET_OPTIONS, selected: st.selection.budget === void 0 ? [] : [st.selection.budget], onToggle: (id) => a.toggleSingle("budget", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccDockLabel", children: "\u8F93\u51FA" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Chips, { options: OUTPUT_OPTIONS, selected: st.selection.output === void 0 ? [] : [st.selection.output], onToggle: (id) => a.toggleSingle("output", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockFoot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccDockHint", "data-tone": a.error === void 0 ? void 0 : "error", children: a.error ?? (a.manual ? "\u8F93\u5165\u6846\u91CC\u6709\u4F60\u624B\u5199\u7684\u5185\u5BB9\uFF0C\u70B9\u9009\u4E0D\u4F1A\u8986\u76D6\uFF1B\u300C\u6309\u6761\u4EF6\u8865\u5145\u300D\u4F1A\u53E6\u8D77\u4E00\u53E5\u8FFD\u52A0" : "\u6761\u4EF6\u5B9E\u65F6\u5199\u8FDB\u8F93\u5165\u6846\uFF0C\u53EF\u4EE5\u76F4\u63A5\u6539\uFF1B\u6539\u597D\u540E\u70B9\u300C\u5F00\u59CB\u5C3D\u8C03\u300D") }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccDockActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccDockBtn", onClick: a.reset, children: "\u6E05\u7A7A" }),
        a.manual ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccDockBtn", onClick: a.append, children: "\u6309\u6761\u4EF6\u8865\u5145" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccDockBtn qccDockPrimary", disabled: a.submitting, onClick: () => void a.startTask(), children: a.submitting ? "\u53D1\u9001\u4E2D\u2026" : props.startLabel ?? "\u5F00\u59CB\u5C3D\u8C03 \u2192" })
      ] })
    ] })
  ] });
}

// src/better-sidebar.ts
var import_react2 = require("react");
var PREVISIT_WORKBENCH_TAB_ID = "dsh-pre-duediligence:agent";
var SUPPORTED_SIDEBAR_VERSION = /^0\.17\./u;
function assertBetterSidebar(service) {
  if (!SUPPORTED_SIDEBAR_VERSION.test(service.version)) {
    throw new Error("dsh-pre-duediligence requires dsh-better-sidebar 0.17.x");
  }
  if (!service.features.includes("targetedOpen") || !service.features.includes("stateSubscription")) {
    throw new Error("dsh-better-sidebar is missing required targetedOpen/stateSubscription capabilities");
  }
}
function registerWorkbenchTab(service, component) {
  assertBetterSidebar(service);
  return service.registerTab({
    id: PREVISIT_WORKBENCH_TAB_ID,
    title: "\u8BBF\u524D\u5C3D\u8C03\u667A\u80FD\u4F53",
    order: 30,
    single: true,
    component
  });
}

// src/workbench-state.ts
var PREVISIT_PHASES = ["prepare", "opportunity", "risk", "delivery"];
function hasTool(toolNames, fragments) {
  return toolNames.some((name) => fragments.some((fragment) => name.includes(fragment)));
}
function isOpportunityTool(name) {
  return [
    "qcc-company",
    "qcc-operation",
    "qcc-ipr",
    "get_company_",
    "get_annual_reports",
    "get_change_records",
    "get_bidding_info",
    "get_financing_records",
    "get_patent_info",
    "get_software_copyright_info"
  ].some((fragment) => name.includes(fragment));
}
function isRiskTool(name) {
  return [
    "qcc-risk",
    "qcc-executive",
    "get_company_risk_scan",
    "get_executive_risk_scan",
    "get_dishonest_info",
    "get_judgment_debtor_info",
    "get_terminated_cases",
    "get_equity_freeze",
    "get_business_exception",
    "get_administrative_penalty",
    "get_tax_abnormal",
    "get_judicial_documents"
  ].some((fragment) => name.includes(fragment));
}
function deriveWorkbenchStatus(input) {
  if (!input.hasTask) {
    return "empty";
  }
  if (input.running) {
    return "running";
  }
  if (!input.seenRunning) {
    return "waiting-agent";
  }
  return input.lastAgentError === null ? "ready" : "failed";
}
function derivePhaseStates(input) {
  const status = deriveWorkbenchStatus(input);
  const opportunitySeen = input.toolNames.some(isOpportunityTool);
  const riskSeen = input.toolNames.some(isRiskTool);
  const entitySeen = hasTool(input.toolNames, ["get_company_by_query"]);
  if (!input.hasTask) {
    return PREVISIT_PHASES.map((id, index) => ({ id, progress: index === 0 ? "active" : "idle" }));
  }
  if (status === "ready") {
    return PREVISIT_PHASES.map((id) => ({ id, progress: "done" }));
  }
  if (status === "failed") {
    return [
      { id: "prepare", progress: "done" },
      { id: "opportunity", progress: opportunitySeen || entitySeen ? "done" : "failed" },
      { id: "risk", progress: riskSeen ? "done" : "failed" },
      { id: "delivery", progress: "failed" }
    ];
  }
  return [
    { id: "prepare", progress: "done" },
    {
      id: "opportunity",
      progress: riskSeen ? "done" : opportunitySeen || entitySeen || input.running ? "active" : "idle"
    },
    {
      id: "risk",
      progress: input.partial && riskSeen ? "done" : riskSeen ? "active" : "idle"
    },
    {
      id: "delivery",
      progress: input.partial && riskSeen ? "active" : "idle"
    }
  ];
}

// src/workbench-style.ts
var WORKBENCH_CSS = String.raw`
.qccPwShell{--pw-brand:var(--dsw-alias-state-business-primary,#4176e6);--pw-brand-strong:var(--dsw-static-deepseek-600,#4868b2);--pw-brand-hover:var(--dsw-alias-button-info-hover,#679efe);--pw-surface:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-canvas:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-surface-muted:var(--dsw-alias-bg-module-platform,var(--background-secondary,#f5f6f7));--pw-ink:var(--dsw-alias-label-primary,var(--text-primary,#0f1115));--pw-muted:var(--dsw-alias-label-secondary,var(--text-secondary,#4b5563));--pw-faint:var(--dsw-alias-label-caption,#adb2b8);--pw-line:var(--dsw-alias-border-l2,var(--border-color,#e1e5ea));--pw-line-strong:var(--dsw-alias-border-l3,#d5dae2);--pw-soft:var(--dsw-alias-state-business-tertiary,#e4edfd);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;width:100%;height:100%;min-width:0;overflow:hidden;color:var(--pw-ink);background:var(--pw-surface);font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif);container-name:previsit-workbench;container-type:inline-size;-webkit-font-smoothing:antialiased}.qccPwShell button,.qccPwShell textarea{font-family:inherit}
.qccPwIcon{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.qccPwHeader{display:flex;min-height:68px;align-items:center;justify-content:space-between;gap:18px;padding:10px 20px;border-bottom:1px solid var(--pw-line);background:var(--pw-surface)}
.qccPwBrand{display:flex;min-width:0;align-items:center;gap:11px}.qccPwBrandIcon{display:grid;flex:0 0 36px;width:36px;height:36px;place-items:center;border-radius:10px;color:var(--pw-brand-strong);background:var(--pw-soft);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pw-brand) 18%,transparent)}
.qccPwBrandCopy{min-width:0}.qccPwTitleRow{display:flex;align-items:center;gap:8px}.qccPwTitle{margin:0;font-size:17px;font-weight:700;line-height:1.35;letter-spacing:-.01em}.qccPwSubtitle{margin:2px 0 0;overflow:hidden;color:var(--pw-muted);font-size:14px;line-height:1.4;text-overflow:ellipsis;white-space:nowrap}
.qccPwLiveDot{width:7px;height:7px;border-radius:50%;background:#98a2b3;box-shadow:0 0 0 3px color-mix(in srgb,#98a2b3 15%,transparent)}.qccPwLiveDot[data-status='running'],.qccPwLiveDot[data-status='waiting-agent']{background:#c47b16;box-shadow:0 0 0 3px color-mix(in srgb,#c47b16 17%,transparent)}.qccPwLiveDot[data-status='ready']{background:#2c7a50;box-shadow:0 0 0 3px color-mix(in srgb,#2c7a50 17%,transparent)}.qccPwLiveDot[data-status='failed']{background:#b64141;box-shadow:0 0 0 3px color-mix(in srgb,#b64141 17%,transparent)}
.qccPwMeta{display:grid;flex:0 1 210px;min-width:0;justify-items:end;gap:4px}.qccPwStatus{display:flex;width:max-content;max-width:100%;align-items:center;gap:6px;padding:4px 8px;border:1px solid var(--pw-line);border-radius:999px;color:var(--pw-muted);background:var(--pw-surface-muted);font-size:13px;font-weight:650;line-height:1.25}.qccPwStatus:before{width:5px;height:5px;border-radius:50%;background:currentColor;content:''}.qccPwStatus[data-status='running'],.qccPwStatus[data-status='waiting-agent']{border-color:color-mix(in srgb,#b96a08 25%,var(--pw-line));color:#9a5d0a;background:color-mix(in srgb,#fff3df 75%,var(--pw-surface))}.qccPwStatus[data-status='ready']{border-color:color-mix(in srgb,#2c7a50 25%,var(--pw-line));color:#236542;background:color-mix(in srgb,#e7f5ec 75%,var(--pw-surface))}.qccPwStatus[data-status='failed']{border-color:color-mix(in srgb,#b64141 25%,var(--pw-line));color:#a13a3a;background:color-mix(in srgb,#fbeaea 75%,var(--pw-surface))}.qccPwSession{width:100%;overflow:hidden;color:var(--pw-muted);font-size:12px;line-height:1.3;text-align:right;text-overflow:ellipsis;white-space:nowrap}
.qccPwStages{display:grid;grid-template-columns:repeat(4,minmax(118px,1fr));min-height:72px;padding:0 16px;overflow-x:auto;border-bottom:1px solid var(--pw-line);background:var(--pw-surface);scrollbar-width:thin}.qccPwStage{position:relative;display:flex;min-width:100px;align-items:center;gap:9px;padding:8px 10px;border:0;color:var(--pw-muted);background:transparent;cursor:pointer;font:inherit;text-align:left}.qccPwStage:after{position:absolute;right:0;width:8px;height:8px;border-top:1px solid var(--pw-line-strong);border-right:1px solid var(--pw-line-strong);content:'';opacity:.72;transform:rotate(45deg)}.qccPwStage:last-child:after{display:none}.qccPwStage:hover{color:var(--pw-ink);background:color-mix(in srgb,var(--pw-brand) 4%,transparent)}.qccPwStage:focus-visible{outline:3px solid color-mix(in srgb,var(--pw-brand) 24%,transparent);outline-offset:-1px}.qccPwStage[data-selected='true']{color:var(--pw-brand);background:linear-gradient(180deg,color-mix(in srgb,var(--pw-soft) 82%,transparent),transparent)}
.qccPwStageIcon{display:grid;flex:0 0 29px;width:29px;height:29px;place-items:center;border:1px solid var(--pw-line-strong);border-radius:50%;color:var(--pw-muted);background:var(--pw-surface);transition:border-color 160ms ease,color 160ms ease,background 160ms ease,box-shadow 160ms ease}.qccPwStageIcon .qccPwIcon{width:14px;height:14px}.qccPwStage[data-selected='true'] .qccPwStageIcon{border-color:var(--pw-brand);color:#fff;background:var(--pw-brand);box-shadow:0 0 0 4px var(--pw-soft)}.qccPwStage[data-progress='done']:not([data-selected='true']) .qccPwStageIcon{border-color:color-mix(in srgb,#2c7a50 32%,var(--pw-line));color:#2c7a50;background:color-mix(in srgb,#e7f5ec 72%,var(--pw-surface))}.qccPwStage[data-progress='active']:not([data-selected='true']) .qccPwStageIcon{border-color:color-mix(in srgb,#b96a08 32%,var(--pw-line));color:#a35f08;background:color-mix(in srgb,#fff3df 72%,var(--pw-surface))}.qccPwStage[data-progress='failed']:not([data-selected='true']) .qccPwStageIcon{border-color:color-mix(in srgb,#b64141 32%,var(--pw-line));color:#a13a3a;background:color-mix(in srgb,#fbeaea 72%,var(--pw-surface))}
.qccPwStageCopy{display:grid;min-width:0;gap:2px}.qccPwStageCopy strong{overflow:hidden;font-size:14px;font-weight:650;text-overflow:ellipsis;white-space:nowrap}.qccPwStageCopy small{overflow:hidden;color:var(--pw-faint);font-size:12px;font-weight:450;text-overflow:ellipsis;white-space:nowrap}
.qccPwBody{min-height:0;overflow-y:auto;padding:22px;background:var(--pw-canvas);scrollbar-width:thin}.qccPwPanel{width:min(100%,1040px);margin:0 auto;outline:none}.qccPwPageHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}.qccPwPageHeading h2{margin:0;font-size:22px;font-weight:720;line-height:1.25;letter-spacing:-.02em}.qccPwPageHeading p:last-child{max-width:660px;margin:5px 0 0;color:var(--pw-muted);font-size:14px;line-height:1.55}.qccPwEyebrow{margin:0 0 5px!important;color:var(--pw-brand)!important;font-size:12px!important;font-weight:750;letter-spacing:.09em;text-transform:uppercase}.qccPwTaskId{flex:none;padding:5px 8px;border:1px solid var(--pw-line);border-radius:7px;color:var(--pw-muted);background:var(--pw-surface);font:12px ui-monospace,SFMono-Regular,Menlo,monospace}
.qccPwCard{overflow:hidden;border:1px solid var(--pw-line);border-radius:13px;background:var(--pw-surface);box-shadow:0 3px 12px color-mix(in srgb,#111923 7%,transparent)}.qccPwCard+.qccPwCard{margin-top:13px}.qccPwCardHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 16px;border-bottom:1px solid var(--pw-line)}.qccPwCardHeader h3,.qccPwCardHeader p{margin:0}.qccPwCardHeader h3{font-size:15px}.qccPwCardHeader p{margin-top:3px;color:var(--pw-muted);font-size:12px}.qccPwMode{padding:4px 8px;border-radius:999px;color:var(--pw-brand-strong);background:var(--pw-soft);font-size:12px;font-weight:700}.qccPwMode[data-manual='true']{color:#9a5d0a;background:color-mix(in srgb,#fff3df 75%,var(--pw-surface))}
.qccPwComposer{padding:15px 16px}.qccPwComposer label{display:grid;gap:7px;color:var(--pw-ink);font-size:13px;font-weight:650}.qccPwComposer textarea{box-sizing:border-box;width:100%;min-height:110px;padding:11px 12px;border:1px solid var(--pw-line-strong);border-radius:9px;color:var(--pw-ink);background:var(--pw-surface);font:inherit;font-size:14px;line-height:1.65;resize:vertical;transition:border-color 140ms ease,box-shadow 140ms ease}.qccPwComposer textarea:hover,.qccPwComposer textarea:focus{border-color:color-mix(in srgb,var(--pw-brand) 55%,var(--pw-line))}.qccPwComposer textarea::placeholder{color:var(--pw-faint)}.qccPwComposer textarea:focus-visible,.qccPwChoice:focus-visible,.qccPwPrimary:focus-visible,.qccPwSecondary:focus-visible{outline:3px solid color-mix(in srgb,var(--pw-brand) 24%,transparent);outline-offset:-1px}.qccPwComposerHint{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:7px;color:var(--pw-muted);font-size:12px}.qccPwManualHint{margin:0 16px 14px;padding:9px 10px;border-left:3px solid #c47b16;border-radius:6px;color:#8d5a11;background:color-mix(in srgb,#fff3df 65%,var(--pw-surface));font-size:13px;line-height:1.5}
.qccPwFilters{display:grid;border-top:1px solid var(--pw-line)}.qccPwFilterRow{display:grid;grid-template-columns:112px minmax(0,1fr);gap:14px;padding:12px 16px;border-bottom:1px solid var(--pw-line)}.qccPwFilterRow:last-child{border-bottom:0}.qccPwFilterLabel{padding-top:7px}.qccPwFilterLabel strong{display:block;font-size:13px}.qccPwFilterLabel span{display:block;margin-top:2px;color:var(--pw-muted);font-size:11px;line-height:1.35}.qccPwChoices{display:flex;flex-wrap:wrap;gap:7px}.qccPwChoice{min-height:31px;padding:0 10px;border:1px solid var(--pw-line);border-radius:8px;color:var(--pw-muted);background:var(--pw-surface);cursor:pointer;font:inherit;font-size:13px}.qccPwChoice:hover{color:var(--pw-ink);background:color-mix(in srgb,var(--pw-brand) 4%,var(--pw-surface))}.qccPwChoice[aria-pressed='true']{border-color:var(--pw-brand);color:var(--pw-brand-strong);background:var(--pw-soft);font-weight:700}.qccPwError{margin:12px 16px 0;padding:8px 10px;border-left:3px solid #b64141;border-radius:6px;color:#a13a3a;background:color-mix(in srgb,#fbeaea 70%,var(--pw-surface));font-size:13px}
.qccPwGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.qccPwEngine{min-height:174px;padding:16px}.qccPwEngineTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.qccPwEngineTop span:first-child{display:grid;width:32px;height:32px;place-items:center;border-radius:9px;color:var(--pw-brand);background:var(--pw-soft)}.qccPwEngineTag{padding:3px 7px;border-radius:999px;color:var(--pw-muted);background:var(--pw-surface-muted);font-size:11px}.qccPwEngine h3{margin:11px 0 5px;font-size:16px}.qccPwEngine p{margin:0;color:var(--pw-muted);font-size:13px;line-height:1.55}.qccPwEngine ul{display:grid;gap:5px;margin:12px 0 0;padding:0;list-style:none}.qccPwEngine li{display:flex;gap:6px;color:var(--pw-muted);font-size:12px}.qccPwEngine li:before{color:var(--pw-brand);content:'✓'}.qccPwStateGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:15px 16px}.qccPwState{padding:9px 7px;border:1px solid var(--pw-line);border-radius:8px;color:var(--pw-muted);background:var(--pw-surface);font-size:12px;text-align:center}
.qccPwFeedback{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;margin-bottom:13px;padding:11px 12px;border:1px solid var(--pw-line);border-radius:10px;background:var(--pw-surface-muted)}.qccPwFeedbackIcon{display:grid;width:27px;height:27px;place-items:center;border-radius:8px;color:var(--pw-muted);background:var(--pw-surface)}.qccPwFeedback[data-tone='notice']{border-color:color-mix(in srgb,#b96a08 22%,var(--pw-line));background:color-mix(in srgb,#fff3df 54%,var(--pw-surface))}.qccPwFeedback[data-tone='notice'] .qccPwFeedbackIcon{color:#a35f08;background:color-mix(in srgb,#fff3df 72%,var(--pw-surface))}.qccPwFeedback[data-tone='success']{border-color:color-mix(in srgb,#2c7a50 22%,var(--pw-line));background:color-mix(in srgb,#e7f5ec 54%,var(--pw-surface))}.qccPwFeedback[data-tone='success'] .qccPwFeedbackIcon{color:#2c7a50;background:color-mix(in srgb,#e7f5ec 72%,var(--pw-surface))}.qccPwFeedback[data-tone='error']{border-color:color-mix(in srgb,#b64141 22%,var(--pw-line));background:color-mix(in srgb,#fbeaea 54%,var(--pw-surface))}.qccPwFeedback[data-tone='error'] .qccPwFeedbackIcon{color:#b64141;background:color-mix(in srgb,#fbeaea 72%,var(--pw-surface))}.qccPwFeedback strong{display:block;margin-top:1px;font-size:13px}.qccPwFeedback p{margin:3px 0 0;color:var(--pw-muted);font-size:12px;line-height:1.5}
.qccPwToolList{display:flex;flex-wrap:wrap;gap:6px;padding:14px 16px}.qccPwToolList span{max-width:100%;overflow:hidden;padding:5px 7px;border:1px solid var(--pw-line);border-radius:7px;color:var(--pw-muted);background:var(--pw-surface-muted);font:12px ui-monospace,SFMono-Regular,Menlo,monospace;text-overflow:ellipsis;white-space:nowrap}.qccPwEmpty{padding:30px 20px;color:var(--pw-muted);font-size:13px;text-align:center}
.qccPwRiskRule{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:16px}.qccPwRiskNumber{display:grid;width:38px;height:38px;place-items:center;border-radius:10px;color:var(--pw-brand);background:var(--pw-soft);font-size:17px;font-weight:750}.qccPwRiskRule h3,.qccPwRiskRule p{margin:0}.qccPwRiskRule h3{font-size:15px}.qccPwRiskRule p{margin-top:4px;color:var(--pw-muted);font-size:12px;line-height:1.55}.qccPwRiskBands{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px 16px}.qccPwRiskBand{padding:11px;border-radius:9px;background:var(--pw-surface-muted)}.qccPwRiskBand b{display:block;font-size:13px}.qccPwRiskBand span{display:block;margin-top:3px;color:var(--pw-muted);font-size:11px;line-height:1.4}.qccPwRiskBand[data-tone='red']{background:color-mix(in srgb,#fbeaea 64%,var(--pw-surface))}.qccPwRiskBand[data-tone='amber']{background:color-mix(in srgb,#fff3df 64%,var(--pw-surface))}
.qccPwDeliverables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:15px 16px}.qccPwDeliverable{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;padding:11px;border:1px solid var(--pw-line);border-radius:9px}.qccPwDeliverable>span{display:grid;width:24px;height:24px;place-items:center;border-radius:7px;color:var(--pw-brand);background:var(--pw-soft);font-size:12px;font-weight:750}.qccPwDeliverable b{display:block;font-size:13px}.qccPwDeliverable small{display:block;margin-top:2px;color:var(--pw-muted);font-size:11px;line-height:1.4}.qccPwCoverage{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:15px 16px}.qccPwMetric{padding:11px;border-radius:9px;background:var(--pw-surface-muted)}.qccPwMetric strong{display:block;color:var(--pw-brand);font-size:20px}.qccPwMetric span{color:var(--pw-muted);font-size:11px}
.qccPwFooter{display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:18px;padding:10px 16px;border-top:1px solid var(--pw-line);color:var(--pw-muted);background:var(--pw-surface)}.qccPwFooterHint[data-tone='error']{color:#a13a3a;display:block!important}.qccPwFooterHint{max-width:680px;font-size:12px;line-height:1.5}.qccPwFooterActions{display:flex;align-items:center;gap:8px}.qccPwPrimary,.qccPwSecondary{display:inline-flex;min-height:40px;white-space:nowrap;align-items:center;justify-content:center;gap:10px;padding:0 15px;border-radius:8px;cursor:pointer;font:inherit;font-size:14px;font-weight:700}.qccPwPrimary{min-width:126px;border:1px solid var(--pw-brand);color:#fff;background:var(--pw-brand);box-shadow:0 4px 10px color-mix(in srgb,var(--pw-brand) 22%,transparent)}.qccPwPrimary:hover:not(:disabled){border-color:var(--pw-brand-hover);background:var(--pw-brand-hover)}.qccPwPrimary:disabled{box-shadow:none;opacity:.48;cursor:not-allowed}.qccPwSecondary{border:1px solid var(--pw-line);color:var(--pw-muted);background:var(--pw-surface)}.qccPwSecondary:hover{color:var(--pw-ink);background:var(--pw-surface-muted)}
.qccPwEntry{display:inline-flex;flex:none;align-items:center;justify-content:center;gap:6px;border:0;white-space:nowrap;color:var(--text-secondary,#475467);background:transparent;cursor:pointer;font:inherit}.qccPwInputEntry{min-height:28px;padding:4px 7px;border-radius:7px;font-size:14px}.qccPwInputEntry span{white-space:nowrap}@container (max-width:420px){.qccPwInputEntry span{display:none}}.qccPwEntry:hover,.qccPwEntry:focus-visible{color:var(--text-primary,#1f2430);background:var(--background-secondary,#f2f4f7)}.qccPwSidebarEntry{width:100%;min-height:34px;padding:7px 10px;border-radius:8px}.qccPwSidebarEntry[data-wide='false']{width:34px;padding-inline:0}.qccPwHeaderEntry{min-height:26px;padding:4px 8px;border:1px solid var(--border-color,#e5e7eb);border-radius:999px;font-size:14px}
.qccPwSteps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 14px;padding:0;list-style:none}.qccPwStep{display:flex;align-items:center;gap:10px;min-height:56px;padding:10px 12px;border:1px solid var(--pw-line);border-radius:10px;background:var(--pw-surface);color:var(--pw-muted)}.qccPwStep[data-state='active']{border-color:var(--pw-brand);color:var(--pw-ink);box-shadow:0 0 0 3px var(--pw-soft)}.qccPwStep[data-state='done']{color:var(--pw-ink)}.qccPwStepDot{display:grid;flex:none;width:26px;height:26px;place-items:center;border-radius:50%;border:1px solid var(--pw-line-strong);font-size:12px;font-weight:700;background:var(--pw-surface)}.qccPwStep[data-state='done'] .qccPwStepDot{border-color:#2f8a4c;color:#2f8a4c;background:#e7f5ec}.qccPwStep[data-state='active'] .qccPwStepDot{border-color:var(--pw-brand);color:var(--pw-brand);background:var(--pw-soft)}.qccPwStepDot .qccPwIcon{width:14px;height:14px}.qccPwStepCopy{display:grid;min-width:0;gap:2px}.qccPwStepCopy b{font-size:14px;font-weight:650}.qccPwStepCopy small{overflow:hidden;color:var(--pw-muted);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.qccPwDims{display:flex;flex-wrap:wrap;gap:7px;padding:12px 16px 16px}.qccPwDim{display:inline-flex;align-items:center;gap:6px;padding:5px 10px;border:1px solid var(--pw-line);border-radius:999px;color:var(--pw-ink);background:var(--pw-surface);font-size:13px}.qccPwDim::before{content:'';width:7px;height:7px;border-radius:50%;background:#2f8a4c}.qccPwDim[data-status='running']{color:var(--pw-brand-strong);border-color:var(--pw-brand)}.qccPwDim[data-status='running']::before{background:var(--pw-brand);animation:qccPwPulse 1s infinite alternate}.qccPwDim[data-status='failed']{color:#a13a3a;border-color:#e5b4b4;background:#fbeaea}.qccPwDim[data-status='failed']::before{background:#b64141}@keyframes qccPwPulse{from{opacity:.3}to{opacity:1}}.qccPwStateStrip{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:12px 16px 8px}.qccPwStateStrip[data-concluded='true'] .qccPwState{opacity:.45}.qccPwState[data-hit='true']{opacity:1!important;color:var(--pw-brand-strong);border-color:var(--pw-brand);background:var(--pw-soft);font-weight:700}.qccPwNote{margin:0;padding:6px 16px 14px;color:var(--pw-ink);font-size:13px;line-height:1.6}.qccPwHypos{display:grid;gap:8px;margin:0;padding:12px 16px 16px;list-style:none}.qccPwHypos li{display:grid;grid-template-columns:auto auto minmax(0,1fr);align-items:baseline;gap:8px;font-size:14px;line-height:1.6;color:var(--pw-ink)}.qccPwHypos b{color:var(--pw-muted);font-size:12px;font-weight:700}.qccPwPri{padding:1px 7px;border-radius:999px;font-size:11px;font-weight:700;color:var(--pw-muted);background:var(--pw-surface-muted)}.qccPwPri[data-p='P0']{color:#a13a3a;background:#fbeaea}.qccPwPri[data-p='P1']{color:#8d5a11;background:#fff3df}.qccPwRiskTiles{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;padding:12px 16px 16px}.qccPwRiskTile{padding:12px 14px;border-radius:10px;border:1px solid var(--pw-line);background:var(--pw-surface)}.qccPwRiskTile[data-level='红线']{background:color-mix(in srgb,#fbeaea 75%,var(--pw-surface))}.qccPwRiskTile[data-level='关注']{background:color-mix(in srgb,#fff3df 75%,var(--pw-surface))}.qccPwRiskTile[data-empty='true']{opacity:.55}.qccPwRiskTileTop{display:flex;align-items:baseline;justify-content:space-between;gap:8px}.qccPwRiskTileTop b{font-size:13px;color:var(--pw-muted)}.qccPwRiskTileTop strong{font-size:22px;font-weight:800;color:var(--pw-ink)}.qccPwRiskTile p{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden;margin:6px 0 0;color:var(--pw-ink);font-size:13px;line-height:1.55}@container previsit-workbench (max-width:680px){.qccPwSteps{grid-template-columns:repeat(2,minmax(0,1fr))}.qccPwStateStrip{grid-template-columns:repeat(2,1fr)}.qccPwRiskTiles{grid-template-columns:1fr}.qccPwHeader{padding-inline:14px}.qccPwMeta{display:none}.qccPwBody{padding:15px}.qccPwStages{grid-template-columns:repeat(4,minmax(104px,1fr));padding:0 8px}.qccPwGrid2{grid-template-columns:1fr}.qccPwFilterRow{grid-template-columns:1fr;gap:7px}.qccPwFilterLabel{padding-top:0}.qccPwStateGrid{grid-template-columns:repeat(2,1fr)}.qccPwDeliverables{grid-template-columns:1fr}.qccPwFooterHint{display:none}.qccPwFooter{justify-content:flex-end}}@container previsit-workbench (max-width:520px){.qccPwHeader{min-height:56px;padding:8px 12px}.qccPwSubtitle{display:none}.qccPwBrandIcon{display:none}.qccPwStages{grid-template-columns:repeat(4,minmax(0,1fr));min-height:auto;padding:6px 6px;overflow:visible}.qccPwStage{flex-direction:column;min-width:0;gap:5px;padding:8px 2px;text-align:center}.qccPwStageIcon{flex-basis:26px;width:26px;height:26px}.qccPwStageCopy{justify-items:center;width:100%}.qccPwStageCopy strong{font-size:12px;white-space:nowrap;overflow:visible}.qccPwStageCopy small{display:none}.qccPwBody{padding:12px}.qccPwPageHeading h2{font-size:18px}.qccPwPageHeading{margin-bottom:10px}.qccPwTaskId{display:none}.qccPwComposer{padding:12px}.qccPwChoice{min-height:30px;padding:0 9px;font-size:12px}.qccPwFooter{flex-direction:column;align-items:stretch;gap:8px;padding:10px 12px}.qccPwFooterHint{display:none}.qccPwFooterActions{display:grid;grid-template-columns:1fr 1fr;gap:8px}.qccPwFooterActions .qccPwPrimary{grid-column:1/-1}.qccPwPrimary,.qccPwSecondary{min-height:38px;padding:0 10px;font-size:13px}.qccPwSteps{grid-template-columns:repeat(2,minmax(0,1fr))}.qccPwStateStrip{grid-template-columns:repeat(2,1fr)}.qccPwRiskTiles{grid-template-columns:1fr}.qccPwDeliverables{grid-template-columns:1fr}}.qccDock{--pw-brand:var(--dsw-alias-state-business-primary,#4176e6);--pw-brand-strong:var(--dsw-static-deepseek-600,#4868b2);--pw-brand-hover:var(--dsw-alias-button-info-hover,#679efe);--pw-surface:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-canvas:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-surface-muted:var(--dsw-alias-bg-module-platform,var(--background-secondary,#f5f6f7));--pw-ink:var(--dsw-alias-label-primary,var(--text-primary,#0f1115));--pw-muted:var(--dsw-alias-label-secondary,var(--text-secondary,#4b5563));--pw-faint:var(--dsw-alias-label-caption,#adb2b8);--pw-line:var(--dsw-alias-border-l2,var(--border-color,#e1e5ea));--pw-line-strong:var(--dsw-alias-border-l3,#d5dae2);--pw-soft:var(--dsw-alias-state-business-tertiary,#e4edfd);box-sizing:border-box;flex:none;width:calc(100% - var(--dsh-composer-side-clearance,16px)*2 - var(--dsh-composer-dock-inset,8px)*2);max-width:calc(var(--dsh-composer-card-max-width,780px) - var(--dsh-composer-dock-inset,8px)*2);margin:0 auto calc(0px - var(--dsh-composer-stack-gap,6px) - 3px);padding:0 var(--dsh-composer-dock-inset,8px);color:var(--pw-ink);font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif)}.qccDockPanel{position:relative;width:100%;padding:0 0 8px;border-radius:12px 12px 0 0;background:var(--dsw-alias-bg-base,#fff)}.qccDockPanel:after{content:'';position:absolute;inset:0;border:1px solid var(--dsw-alias-border-l1,#e5e7eb);border-bottom:none;border-radius:inherit;pointer-events:none}.qccDockHead{display:flex;width:100%;align-items:center;gap:10px;min-height:36px;padding:6px 12px 4px;border:0;background:transparent;color:inherit;cursor:pointer;font:inherit;text-align:left}.qccDockBrand{flex:none;display:inline-flex;align-items:center;gap:7px;color:var(--dsw-alias-label-primary,#0f1115);font-size:13px;font-weight:500}.qccDockBrand::before{content:'';width:6px;height:6px;border-radius:1px;background:var(--dsw-alias-label-tertiary,#81858c)}.qccDockSummary{display:flex;flex:1;min-width:0;flex-wrap:nowrap;align-items:center;gap:6px;overflow:hidden}.qccDockTag{flex:none;max-width:220px;overflow:hidden;padding:1px 7px;border-radius:4px;background:var(--dsw-alias-bg-module-platform,#f5f6f7);color:var(--dsw-alias-label-secondary,#4b5563);font-size:12px;text-overflow:ellipsis;white-space:nowrap}.qccDockHint{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px;line-height:1.5}.qccDockHint[data-tone='error']{color:#c0392b}.qccDockWorkbench{flex:none;padding:2px 8px;border:1px solid var(--dsw-alias-border-l2,#e1e5ea);border-radius:5px;color:var(--dsw-alias-label-secondary,#4b5563);font-size:12px;background:transparent}.qccDockWorkbench:hover{color:var(--dsw-alias-label-primary,#0f1115);background:var(--dsw-alias-interactive-bg-hover,#f2f4f7)}.qccDockChevron{flex:none;width:7px;height:7px;margin:0 6px 3px 0;border-right:1.5px solid var(--dsw-alias-label-tertiary,#81858c);border-bottom:1.5px solid var(--dsw-alias-label-tertiary,#81858c);transform:rotate(45deg);transition:transform .15s}.qccDock[data-open='true'] .qccDockChevron{transform:rotate(-135deg);margin:4px 6px 0 0}.qccDockBody{display:grid;gap:6px;padding:4px 12px 0;border-top:1px solid var(--dsw-alias-border-l1,#eceef1);margin-top:2px;padding-top:10px}.qccDockRow{display:grid;grid-template-columns:40px minmax(0,1fr);align-items:center;gap:8px;min-height:28px}.qccDockLabel{color:var(--dsw-alias-label-tertiary,#81858c);font-size:12px;white-space:nowrap}.qccDockCompany{box-sizing:border-box;width:100%;min-height:30px;padding:3px 10px;border:1px solid var(--dsw-alias-border-l2,#e1e5ea);border-radius:5px;background:var(--dsw-alias-bg-base,#fff);color:var(--dsw-alias-label-primary,#0f1115);font:inherit;font-size:13px}.qccDockCompany::placeholder{color:var(--dsw-alias-label-caption,#adb2b8)}.qccDockCompany:focus{outline:0;border-color:var(--dsw-alias-label-secondary,#4b5563)}.qccDockChips{display:flex;flex-wrap:wrap;gap:6px}.qccDockChip{min-height:26px;padding:0 9px;border:1px solid var(--dsw-alias-border-l2,#e1e5ea);border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary,#4b5563);cursor:pointer;font:inherit;font-size:12.5px;line-height:1;white-space:nowrap;transition:background .12s,border-color .12s,color .12s}.qccDockChip:hover{background:var(--dsw-alias-interactive-bg-hover,#f2f4f7);color:var(--dsw-alias-label-primary,#0f1115)}.qccDockChip[data-selected='true']{border-color:var(--dsw-alias-label-primary,#0f1115);background:var(--dsw-alias-label-primary,#0f1115);color:var(--dsw-alias-bg-base,#fff)}.qccDockFoot{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-top:4px;min-height:28px}.qccDockActions{display:flex;flex:none;gap:4px}.qccDockBtn{min-height:28px;padding:0 10px;border:1px solid transparent;border-radius:5px;background:transparent;color:var(--dsw-alias-label-secondary,#4b5563);cursor:pointer;font:inherit;font-size:12.5px;white-space:nowrap}.qccDockBtn:hover{color:var(--dsw-alias-label-primary,#0f1115);background:var(--dsw-alias-interactive-bg-hover,#f2f4f7)}.qccDockPrimary{background:var(--dsw-alias-state-business-primary,#4176e6);color:#fff;font-weight:500}.qccDockPrimary:hover{background:var(--dsw-alias-button-info-hover,#679efe);color:#fff}.qccDockPrimary:disabled{opacity:.6;cursor:default}@media(max-width:640px){.qccDockRow{grid-template-columns:1fr;gap:3px}.qccDockFoot{flex-direction:column;align-items:stretch}.qccDockActions{justify-content:flex-end}.qccDockSummary{display:none}}.qccDockFoot{flex-direction:column;align-items:stretch}.qccDockActions{justify-content:flex-end}.qccDockSummary{display:none}}.qccPwSetup{display:grid;gap:0;margin:0;padding:4px 16px 8px}.qccPwSetup>div{display:grid;grid-template-columns:64px minmax(0,1fr);gap:10px;padding:9px 0;border-bottom:1px solid var(--pw-line)}.qccPwSetup>div:last-child{border-bottom:0}.qccPwSetup dt{margin:0;color:var(--pw-muted);font-size:13px}.qccPwSetup dd{margin:0;color:var(--pw-ink);font-size:14px;line-height:1.5}.qccPwPrompt{margin:0;padding:12px 16px 16px;white-space:pre-wrap;word-break:break-word;color:var(--pw-ink);font:13px/1.6 inherit;font-family:inherit}.qccPwSetupCard .qccDockBody{padding:12px 16px 14px;gap:8px}.qccPwSetupCard .qccDockRow{min-height:32px}.qccModesHost{flex:none;width:100%;padding:0 0 14px}.qccModes{--pw-brand:var(--dsw-alias-state-business-primary,#4176e6);--pw-brand-strong:var(--dsw-static-deepseek-600,#4868b2);--pw-brand-hover:var(--dsw-alias-button-info-hover,#679efe);--pw-surface:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-canvas:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-surface-muted:var(--dsw-alias-bg-module-platform,var(--background-secondary,#f5f6f7));--pw-ink:var(--dsw-alias-label-primary,var(--text-primary,#0f1115));--pw-muted:var(--dsw-alias-label-secondary,var(--text-secondary,#4b5563));--pw-faint:var(--dsw-alias-label-caption,#adb2b8);--pw-line:var(--dsw-alias-border-l2,var(--border-color,#e1e5ea));--pw-line-strong:var(--dsw-alias-border-l3,#d5dae2);--pw-soft:var(--dsw-alias-state-business-tertiary,#e4edfd);display:flex;justify-content:center;gap:8px;width:100%;margin:6px auto 0;font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,'Segoe UI','PingFang SC','Microsoft YaHei',sans-serif)}.qccMode{position:relative;display:inline-flex;align-items:center;gap:7px;min-height:32px;padding:0 14px;border:1px solid var(--dsw-alias-border-l2,var(--pw-line));border-radius:5px;background:var(--dsw-alias-bg-base,#fff);color:var(--pw-ink);cursor:pointer;font:inherit;font-size:13px;font-weight:500;transition:border-color .12s,background .12s,color .12s}.qccMode svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;color:var(--pw-muted)}.qccMode:hover:not(:disabled){background:var(--dsw-alias-interactive-bg-hover,#f2f4f7);color:var(--dsw-alias-label-primary,#0f1115)}.qccMode[data-active='true']{border-color:var(--dsw-alias-label-primary,#0f1115);background:var(--dsw-alias-label-primary,#0f1115);color:var(--dsw-alias-bg-base,#fff);font-weight:500}.qccMode[data-active='true'] svg{color:var(--dsw-alias-bg-base,#fff)}.qccMode:disabled{color:var(--pw-faint);cursor:not-allowed;background:var(--dsw-alias-bg-module-platform,var(--pw-surface-muted))}.qccMode:disabled svg{color:var(--pw-faint)}.qccMode[data-tip]::after{content:attr(data-tip);position:absolute;left:50%;bottom:calc(100% + 8px);transform:translateX(-50%);width:max-content;max-width:260px;padding:6px 10px;border-radius:5px;background:var(--pw-ink);color:#fff;font-size:12px;font-weight:400;line-height:1.5;white-space:normal;text-align:left;opacity:0;pointer-events:none;transition:opacity .12s;z-index:20;box-shadow:0 6px 20px -8px rgba(15,23,42,.4)}.qccMode[data-tip]::before{content:'';position:absolute;left:50%;bottom:calc(100% + 3px);transform:translateX(-50%);border:5px solid transparent;border-top-color:var(--pw-ink);opacity:0;pointer-events:none;transition:opacity .12s;z-index:20}.qccMode:hover::after,.qccMode:hover::before,.qccMode:focus-visible::after,.qccMode:focus-visible::before{opacity:1}@media(max-width:640px){.qccModes{flex-wrap:wrap;gap:6px}.qccMode{padding:0 10px;font-size:12px}}.qccDockWorkbench{flex:none;padding:3px 9px;border:1px solid var(--dsw-alias-border-l2,var(--pw-line));border-radius:999px;color:var(--pw-muted);font-size:12px;font-weight:600;background:var(--dsw-alias-bg-base,#fff)}.qccDockWorkbench:hover{color:var(--pw-brand-strong);border-color:var(--pw-brand)}.qccPwCompact{display:inline-flex;align-items:center;gap:6px;padding:0 4px;border:0;background:transparent;color:var(--dsw-alias-label-caption,#adb2b8);cursor:pointer;font:inherit;font-size:12px;line-height:20px}.qccPwCompact span{transition:color .12s}.qccPwCompact span[data-active='true']{color:var(--dsw-alias-label-secondary,#4b5563)}.qccPwCompact i{width:1px;height:10px;background:var(--dsw-alias-border-l2,#e1e5ea)}.qccPwCompact:hover span{color:var(--dsw-alias-label-primary,#0f1115)}html[data-qcc-compact] :is([data-chat-flow-kind='tool-call'],[data-chat-flow-kind='command']):has(+ :is([data-chat-flow-kind='tool-call'],[data-chat-flow-kind='command'],[data-chat-flow-kind='assistant-step']:not(:has(p,h1,h2,h3,h4,h5,table,ul,ol,pre,blockquote,img,[data-state='running'])))){display:none}html[data-qcc-compact] [data-chat-flow-kind='context']{display:none}html[data-qcc-compact] [data-variant='think'][data-state='ok']{display:none}html[data-qcc-compact] [data-chat-flow-kind='assistant-step']:not(:has(p,h1,h2,h3,h4,h5,table,ul,ol,pre,blockquote,img,[data-state='running'])){display:none}html[data-qcc-compact] :is([data-chat-flow-kind='tool-call'],[data-chat-flow-kind='command']){opacity:.75}.qccPwReportCard{padding:0;overflow:hidden}.qccPwReportFrame{display:block;width:100%;min-height:480px;border:0;background:#fff}.qccPwPageHeading .qccPwSecondary{flex:none;min-height:32px;padding:0 12px;font-size:13px}@media(prefers-reduced-motion:reduce){.qccPwShell *{animation:none!important;transition:none!important}}
`;

// src/stage-insights.ts
var OPPORTUNITY_DIMENSIONS = [
  ["get_company_by_query", "\u4E3B\u4F53\u951A\u5B9A"],
  ["get_company_registration_info", "\u5DE5\u5546\u767B\u8BB0"],
  ["get_company_profile", "\u4F01\u4E1A\u753B\u50CF"],
  ["get_annual_reports", "\u5E74\u62A5"],
  ["get_change_records", "\u53D8\u66F4\u8BB0\u5F55"],
  ["get_shareholder_info", "\u80A1\u4E1C"],
  ["get_beneficial_owners", "\u5B9E\u63A7\u4EBA"],
  ["get_key_personnel", "\u5173\u952E\u4EBA\u5458"],
  ["get_financing_records", "\u878D\u8D44"],
  ["get_bidding_info", "\u62DB\u6295\u6807"],
  ["get_recruitment_info", "\u62DB\u8058"],
  ["get_administrative_license", "\u884C\u653F\u8BB8\u53EF"],
  ["get_qualifications", "\u8D44\u8D28"],
  ["get_land_grant_info", "\u571F\u5730"],
  ["get_external_investments", "\u5BF9\u5916\u6295\u8D44"],
  ["get_branches", "\u5206\u652F\u673A\u6784"],
  ["get_patent_info", "\u4E13\u5229"],
  ["get_software_copyright_info", "\u8F6F\u8457"],
  ["get_trademark", "\u5546\u6807"],
  ["get_contact_info", "\u8054\u7CFB\u65B9\u5F0F"],
  ["get_financial_data", "\u8D22\u52A1\u6570\u636E"],
  ["get_company_announcement", "\u516C\u544A"],
  ["get_listing_info", "\u4E0A\u5E02\u4FE1\u606F"],
  ["get_equity_pledge_info", "\u80A1\u6743\u51FA\u8D28"]
];
var RISK_DIMENSIONS = [
  ["get_company_risk_scan", "\u98CE\u9669\u626B\u63CF"],
  ["get_dishonest_info", "\u5931\u4FE1"],
  ["get_judgment_debtor_info", "\u88AB\u6267\u884C"],
  ["get_terminated_cases", "\u7EC8\u672C\u6848\u4EF6"],
  ["get_equity_freeze", "\u80A1\u6743\u51BB\u7ED3"],
  ["get_business_exception", "\u7ECF\u8425\u5F02\u5E38"],
  ["get_administrative_penalty", "\u884C\u653F\u5904\u7F5A"],
  ["get_tax_abnormal", "\u7A0E\u52A1\u5F02\u5E38"],
  ["get_judicial_documents", "\u53F8\u6CD5\u6587\u4E66"],
  ["get_court_", "\u7ACB\u6848/\u5F00\u5EAD"],
  ["get_executive_risk_scan", "\u8463\u76D1\u9AD8"]
];
function eventStatus(events, fragment) {
  let seen = null;
  for (const event of events) {
    if (!event.name.includes(fragment)) continue;
    if (event.status === "done") return "done";
    if (event.status === "failed") seen = "failed";
    else if (seen === null) seen = "running";
  }
  return seen;
}
function toDimensions(table, events) {
  const out = [];
  for (const [fragment, label] of table) {
    const status = eventStatus(events, fragment);
    if (status !== null) out.push({ label, status });
  }
  return out;
}
function opportunityDimensions(events) {
  return toDimensions(OPPORTUNITY_DIMENSIONS, events);
}
function riskDimensions(events) {
  return toDimensions(RISK_DIMENSIONS, events);
}
var BUSINESS_STATES = ["\u4EA7\u80FD\u5EFA\u8BBE\u671F", "\u5BA2\u6237\u5BFC\u5165\u671F", "\u4EA7\u80FD\u722C\u5761\u671F", "\u8BA2\u5355\u589E\u957F\u671F", "\u7A33\u5B9A\u7ECF\u8425\u671F", "\u6536\u7F29\u627F\u538B\u671F", "\u8D44\u672C\u8FD0\u4F5C\u671F", "\u98CE\u9669\u66B4\u9732\u671F"];
var EMPTY_INSIGHTS = {
  found: false,
  state: null,
  stateUndetermined: false,
  confidence: null,
  industryLink: null,
  hypotheses: [],
  risks: [],
  riskNoRecord: false,
  sections: []
};
function section(md, title) {
  const re = new RegExp(`^#{1,4}[^\\n]*${title}[^\\n]*$`, "m");
  const m = re.exec(md);
  if (m === null || m.index === void 0) return "";
  const rest = md.slice(m.index + m[0].length);
  const next = /^#{1,2}\s/m.exec(rest);
  return next === null || next.index === void 0 ? rest : rest.slice(0, next.index);
}
var strip = (s) => s.replace(/\[F-?\d{2,4}\]/g, "").replace(/\*\*/g, "").replace(/（推理说明）|\(推理说明\)/g, "").trim();
function parseCardInsights(md) {
  if (md === null || md.trim() === "") return EMPTY_INSIGHTS;
  const sections = ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u4E1A\u52A1\u5047\u8BBE", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u89E6\u8FBE\u5F00\u573A", "\u8986\u76D6\u8BF4\u660E"].filter((t) => new RegExp(`^#{1,4}[^\\n]*${t}`, "m").test(md));
  const core = section(md, "\u6838\u5FC3\u7814\u5224") || md;
  const stateUndetermined = /状态未定/.test(core);
  let state = null;
  let best = Number.POSITIVE_INFINITY;
  for (const s of BUSINESS_STATES) {
    const idx = core.indexOf(s);
    if (idx !== -1 && idx < best) {
      best = idx;
      state = s;
    }
  }
  const conf = /状态置信度[：:]\s*(中高|低|中|高)/.exec(md);
  const link = /产业链环节[：:]\s*([^\n｜|;；。]+)/.exec(md);
  const hypotheses = [];
  const hypoRe = /(H\d+)\s*[·・:：\-–]\s*\**\s*(P[012])\**\s*[·・:：\-–]\s*([^\n]+)/g;
  const hypoSrc = section(md, "\u4E1A\u52A1\u5047\u8BBE") || md;
  let hm;
  while ((hm = hypoRe.exec(hypoSrc)) !== null) {
    const id = hm[1] ?? "";
    if (hypotheses.some((h) => h.id === id)) continue;
    hypotheses.push({ id, priority: hm[2] ?? "", text: strip(hm[3] ?? "") });
  }
  const riskSrc = section(md, "\u7EA2\u7EBF\u63D0\u793A");
  const risks = [];
  for (const line of riskSrc.split("\n")) {
    const t = line.trim();
    if (!t.startsWith("|")) continue;
    const cells = t.split("|").slice(1, -1).map((c) => c.trim());
    const level = cells[0] ?? "";
    const hit = ["\u7EA2\u7EBF", "\u5173\u6CE8", "\u4FE1\u606F"].find((l) => level.startsWith(l));
    if (hit === void 0) continue;
    risks.push({ level: hit, text: strip(cells[1] ?? "") });
  }
  return {
    found: true,
    state: stateUndetermined ? null : state,
    stateUndetermined,
    confidence: conf?.[1] ?? null,
    industryLink: link?.[1] === void 0 ? null : strip(link[1]),
    hypotheses,
    risks,
    riskNoRecord: /扫描未发现公开记录/.test(riskSrc),
    sections
  };
}
var has = (events, fragments, status) => events.some((e) => fragments.some((f) => e.name.includes(f)) && (status === void 0 || e.status === status));
var BASIC = ["get_company_registration_info", "get_company_profile", "get_annual_reports", "get_shareholder_info", "get_key_personnel", "get_change_records", "get_beneficial_owners"];
var STATE_TOOLS = ["get_bidding_info", "get_financing_records", "get_recruitment_info", "get_administrative_license", "get_patent_info", "get_land_grant_info", "get_external_investments", "get_qualifications", "get_software_copyright_info", "get_financial_data", "get_company_announcement"];
var DRILL = ["get_dishonest_info", "get_judgment_debtor_info", "get_terminated_cases", "get_equity_freeze", "get_business_exception", "get_administrative_penalty", "get_tax_abnormal", "get_judicial_documents", "get_court_"];
function stepOf(done, active, finished) {
  if (done) return "done";
  if (finished) return "done";
  return active ? "active" : "idle";
}
function opportunitySteps(events, insights, finished) {
  const anchorDone = has(events, ["get_company_by_query"], "done");
  const basicDone = BASIC.filter((f) => has(events, [f], "done")).length;
  const stateDone = insights.state !== null || insights.stateUndetermined;
  const hypoDone = insights.hypotheses.length > 0;
  return [
    { label: "\u4E3B\u4F53\u951A\u5B9A", state: stepOf(anchorDone, has(events, ["get_company_by_query"]), finished) },
    { label: "\u57FA\u7840\u4FE1\u53F7", state: stepOf(basicDone >= 3, basicDone > 0 || has(events, BASIC), finished), note: basicDone > 0 ? `${basicDone} \u9879` : void 0 },
    { label: "\u72B6\u6001\u5224\u5B9A", state: stepOf(stateDone, has(events, STATE_TOOLS), finished), note: insights.stateUndetermined ? "\u72B6\u6001\u672A\u5B9A" : insights.state ?? void 0 },
    { label: "\u5047\u8BBE\u53CD\u8BC1", state: stepOf(hypoDone, stateDone || has(events, STATE_TOOLS, "done"), finished), note: hypoDone ? `${insights.hypotheses.length} \u6761` : void 0 }
  ];
}
function riskSteps(events, insights, finished) {
  const scanDone = has(events, ["get_company_risk_scan"], "done");
  const drillDone = has(events, DRILL, "done");
  const execDone = has(events, ["get_executive_risk_scan"], "done");
  const judged = insights.sections.includes("\u7EA2\u7EBF\u63D0\u793A");
  return [
    { label: "\u98CE\u9669\u626B\u63CF", state: stepOf(scanDone, has(events, ["get_company_risk_scan"]), finished) },
    { label: "\u660E\u7EC6\u4E0B\u94BB", state: stepOf(drillDone, has(events, DRILL), finished), note: !drillDone && (scanDone || finished) ? "\u96F6\u8BB0\u5F55\u4E0D\u4E0B\u94BB" : void 0 },
    { label: "\u8463\u76D1\u9AD8", state: stepOf(execDone, has(events, ["get_executive_risk_scan"]), finished), note: !execDone && finished ? "\u672A\u5355\u72EC\u626B\u63CF" : void 0 },
    { label: "\u5F71\u54CD\u5224\u65AD", state: stepOf(judged, scanDone, finished), note: judged ? `${insights.risks.length} \u9879` : void 0 }
  ];
}

// src/workbench-v2.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var inject = ["sessions", "conversation", "betterSidebar"];
var STYLE_ID = "dsh-pre-duediligence-workbench";
var PHASE_LABELS = {
  prepare: { label: "\u5C3D\u8C03\u8BBE\u5B9A", description: "\u4F01\u4E1A\u3001\u89D2\u8272\u4E0E\u8303\u56F4" },
  opportunity: { label: "\u7ECF\u8425\u7814\u5224", description: "\u72B6\u6001\u3001\u5047\u8BBE\u4E0E\u53CD\u8BC1" },
  risk: { label: "\u98CE\u9669\u6838\u67E5", description: "\u626B\u63CF\u3001\u4E0B\u94BB\u4E0E\u5F71\u54CD" },
  delivery: { label: "\u5C3D\u8C03\u62A5\u544A", description: "\u5FC5\u95EE\u3001\u89E6\u8FBE\u4E0E\u884C\u52A8" }
};
var STATUS_LABELS = {
  empty: "\u5F85\u8BBE\u5B9A",
  "waiting-agent": "\u7B49\u5F85\u6267\u884C",
  running: "\u6B63\u5728\u5C3D\u8C03",
  ready: "\u62A5\u544A\u5DF2\u751F\u6210",
  failed: "\u9700\u8981\u5904\u7406"
};
var EMPTY_RUNTIME = {
  running: false,
  partial: false,
  lastAgentError: null,
  toolNames: [],
  toolEvents: [],
  failedToolCount: 0
};
function Icon({ name }) {
  const paths = {
    briefcase: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("rect", { x: "3", y: "7", width: "18", height: "12", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 7V5h8v2M3 12h18M10 12v2h4v-2" })
    ] }),
    prepare: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M5 4h14v16H5z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M8 8h8M8 12h8M8 16h5" })
    ] }),
    opportunity: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m15 15 4 4M10.5 7v7M7 10.5h7" })
    ] }),
    risk: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 8v5M12 17h.01" })
    ] }),
    delivery: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M6 3h8l4 4v14H6z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M14 3v5h5M9 13h6M9 17h6" })
    ] }),
    clock: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    check: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "m8 12 2.5 2.5L16 9" })
    ] }),
    warning: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(import_jsx_runtime2.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 3 2.8 20h18.4z" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("path", { d: "M12 9v4M12 17h.01" })
    ] })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("svg", { className: "qccPwIcon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] });
}
function collectRuntime(snapshot, baseline) {
  const toolNames = /* @__PURE__ */ new Set();
  const toolEvents = [];
  for (const node of (snapshot.nodes ?? []).slice(baseline)) {
    if (node.kind !== "tool-result") continue;
    if (typeof node.call?.name === "string") {
      toolNames.add(node.call.name);
      toolEvents.push({ name: node.call.name, status: node.isError === true ? "failed" : "done" });
    }
  }
  for (const call of snapshot.runningCalls ?? []) {
    if (typeof call.name === "string") {
      toolNames.add(call.name);
      toolEvents.push({ name: call.name, status: "running" });
    }
  }
  return { toolNames: [...toolNames], toolEvents, failedToolCount: toolEvents.filter((e) => e.status === "failed").length };
}
function Feedback(props) {
  const icon = props.tone === "success" ? "check" : props.tone === "error" ? "warning" : "clock";
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwFeedback", "data-tone": props.tone, role: props.tone === "error" ? "alert" : "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwFeedbackIcon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: icon }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: props.title }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: props.children })
    ] })
  ] });
}
function SetupPanel(props) {
  const actions = usePrevisitComposer({
    sessionId: props.sessionId,
    store: props.store,
    readDraft: () => composerTextarea()?.value ?? "",
    writeDraft: (text) => writeDraft(void 0, text),
    start: props.start,
    onStarted: props.onStarted
  });
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEyebrow", children: "PREVISIT" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5C3D\u8C03\u8BBE\u5B9A" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwCard qccPwSetupCard", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PrevisitFields, { actions, idPrefix: `qccPw-${props.sessionId}` }) }),
    props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u5DF2\u53D1\u9001\u7684\u4EFB\u52A1" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("pre", { className: "qccPwPrompt", children: props.task.prompt })
    ] })
  ] });
}
function Steps(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "qccPwSteps", children: props.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { className: "qccPwStep", "data-state": step.state, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwStepDot", children: step.state === "done" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "check" }) : index + 1 }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qccPwStepCopy", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: step.label }),
      step.note === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: step.note })
    ] })
  ] }, step.label)) });
}
function Dimensions(props) {
  const done = props.items.filter((d) => d.status === "done").length;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCardHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: props.title }) }),
      done === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qccPwMode", children: [
        done,
        " \u9879"
      ] })
    ] }),
    props.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEmpty", children: props.empty }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwDims", children: props.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwDim", "data-status": item.status, children: item.label }, item.label)) })
  ] });
}
function StagePanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEyebrow", children: props.eyebrow }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: props.title })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    props.children
  ] });
}
function OpportunityPanel(props) {
  const finished = props.status === "ready";
  const running = props.status === "running";
  const { insights } = props;
  const steps = opportunitySteps(props.events, insights, finished);
  const dims = opportunityDimensions(props.events);
  const concluded = insights.state !== null || insights.stateUndetermined;
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(StagePanel, { eyebrow: "OPPORTUNITY", title: "\u7ECF\u8425\u7814\u5224", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Steps, { steps }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Dimensions, { title: "\u5DF2\u53D6\u5F97", items: dims, empty: running ? "\u6B63\u5728\u5EFA\u7ACB\u4E3B\u4F53\u4E0E\u4FE1\u53F7\u96C6\u2026" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A\u53D6\u5F97\u7684\u7EF4\u5EA6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u7ECF\u8425\u72B6\u6001" }) }),
        insights.confidence === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qccPwMode", children: [
          "\u7F6E\u4FE1\u5EA6 ",
          insights.confidence
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwStateStrip", "data-concluded": concluded, children: BUSINESS_STATES.map((state) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwState", "data-hit": insights.state === state, children: state }, state)) }),
      insights.stateUndetermined ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwNote", children: "\u72B6\u6001\u672A\u5B9A\uFF1A\u516C\u5F00\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u672C\u6B21\u964D\u7EA7\u4E3A\u6E05\u5355\u5F0F\u7B80\u62A5\u3002" }) : null,
      insights.industryLink === null ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "qccPwNote", children: [
        "\u4EA7\u4E1A\u94FE\u73AF\u8282\uFF1A",
        insights.industryLink
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u4E1A\u52A1\u5047\u8BBE" }) }),
        insights.hypotheses.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qccPwMode", children: [
          insights.hypotheses.length,
          " \u6761"
        ] })
      ] }),
      insights.hypotheses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEmpty", children: finished ? insights.stateUndetermined ? "\u72B6\u6001\u672A\u5B9A\uFF0C\u672A\u751F\u6210\u5047\u8BBE\uFF1B\u76F8\u5173\u672A\u77E5\u5DF2\u8F6C\u5165\u73B0\u573A\u5FC5\u95EE" : insights.found ? "\u62A5\u544A\u4E2D\u672A\u8BC6\u522B\u51FA\u5047\u8BBE" : "\u62A5\u544A\u672A\u6355\u83B7" : running ? "\u72B6\u6001\u5224\u5B9A\u540E\u751F\u6210" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ol", { className: "qccPwHypos", children: insights.hypotheses.map((h) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwPri", "data-p": h.priority, children: h.priority }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: h.id }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: h.text })
      ] }, h.id)) })
    ] })
  ] });
}
function RiskPanel(props) {
  const finished = props.status === "ready";
  const running = props.status === "running";
  const { insights } = props;
  const steps = riskSteps(props.events, insights, finished);
  const dims = riskDimensions(props.events);
  const real = (level) => insights.risks.filter((r) => r.level === level && !/^(无|—|-|暂无|本次.*未发现)/.test(r.text));
  const judged = insights.sections.includes("\u7EA2\u7EBF\u63D0\u793A");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)(StagePanel, { eyebrow: "RISK", title: "\u98CE\u9669\u6838\u67E5", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Steps, { steps }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Dimensions, { title: "\u5DF2\u6838\u67E5", items: dims, empty: running ? "\u7B49\u5F85\u98CE\u9669\u626B\u63CF\u2026" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A\u6838\u67E5\u7684\u7EF4\u5EA6" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u98CE\u9669\u5206\u7EA7" }) }) }),
      !judged ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEmpty", children: running ? "\u626B\u63CF\u4E0E\u4E0B\u94BB\u540E\u7ED9\u51FA\u5206\u7EA7" : finished ? "\u62A5\u544A\u672A\u6355\u83B7" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A" }) : insights.riskNoRecord && insights.risks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwNote", children: "\u4F01\u4E1A\u81EA\u8EAB\u98CE\u9669\u626B\u63CF\u672A\u53D1\u73B0\u516C\u5F00\u8BB0\u5F55\uFF1B\u8FD9\u4E0D\u7B49\u4E8E\u4E0D\u5B58\u5728\u5176\u4ED6\u98CE\u9669\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwRiskTiles", children: ["\u7EA2\u7EBF", "\u5173\u6CE8", "\u4FE1\u606F"].map((level) => {
        const items = real(level);
        return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwRiskTile", "data-level": level, "data-empty": items.length === 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwRiskTileTop", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: level }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: items.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: items[0]?.text ?? "\u672C\u6B21\u672A\u53D1\u73B0" })
        ] }, level);
      }) })
    ] })
  ] });
}
function ReportViewer(props) {
  const ref = (0, import_react3.useRef)(null);
  const fit = () => {
    const el = ref.current;
    const h = el?.contentDocument?.documentElement?.scrollHeight;
    if (el !== null && h !== void 0 && h > 0) el.style.height = `${h + 8}px`;
  };
  (0, import_react3.useEffect)(() => {
    fit();
  }, [props.html]);
  const embedded = props.html.replace("</head>", "<style>body{background:#fff}.sheet{margin:0;border:0;border-radius:0;box-shadow:none}.hero{padding:18px 20px 16px}.body{padding:6px 20px 20px}</style></head>");
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("iframe", { ref, className: "qccPwReportFrame", title: "\u5C3D\u8C03\u62A5\u544A", sandbox: "allow-same-origin", srcDoc: embedded, onLoad: fit });
}
function DeliveryPanel(props) {
  const ready = props.status === "ready";
  if (props.reportHtml !== null) {
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "qccPwPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "qccPwPageHeading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEyebrow", children: "REPORT" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5C3D\u8C03\u62A5\u544A" })
        ] }),
        props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwCard qccPwReportCard", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(ReportViewer, { html: props.reportHtml }) })
    ] });
  }
  const deliverables = [
    ["\u2460", "\u6838\u5FC3\u7814\u5224", "\u72B6\u6001\u3001\u673A\u4F1A\u65B9\u5411\u4E0E\u9A8C\u8BC1\u91CD\u70B9"],
    ["\u2461", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u4E3B\u8425\u3001\u884C\u4E1A\u5206\u7C7B\u4E0E\u4EA7\u4E1A\u94FE\u73AF\u8282"],
    ["\u2462", "\u8FD1\u671F\u52A8\u6001", "3\u20135 \u4E2A\u5E26\u65E5\u671F\u4E0E\u6765\u6E90\u7684\u53D8\u5316"],
    ["\u2463", "\u4E1A\u52A1\u5047\u8BBE", "P0/P1 \u5047\u8BBE\u4E0E\u652F\u6301/\u53CD\u5BF9/\u672A\u77E5"],
    ["\u2464", "\u7EA2\u7EBF\u63D0\u793A", "\u98CE\u9669\u5982\u4F55\u6539\u53D8\u62DC\u8BBF\u7B56\u7565"],
    ["\u2465", "\u73B0\u573A\u5FC5\u95EE", "\u4E3A\u4EC0\u4E48\u95EE\u4E0E\u7B54 A/B \u4E0B\u4E00\u6B65"],
    ["\u2466", "\u89E6\u8FBE\u5F00\u573A", "\u6765\u6E90\u3001\u5F52\u5C5E\u3001\u7528\u9014\u4E0E\u5F00\u573A\u767D"],
    ["\u2467", "\u8986\u76D6\u8BF4\u660E", "\u5DF2\u67E5\u3001\u672A\u67E5\u3001\u5931\u8D25\u4E0E\u8BC1\u636E\u5C42\u7EA7"]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwEyebrow", children: "REPORT" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h2", { children: "\u5C3D\u8C03\u62A5\u544A" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u4E0D\u662F\u8D44\u6599\u5806\u780C\uFF0C\u53EA\u56DE\u7B54\u56DB\u4EF6\u4E8B\uFF1A\u53BB\u4E0D\u53BB\u3001\u89C1\u8C01\u3001\u804A\u4EC0\u4E48\u3001\u4EC0\u4E48\u4E0D\u80FD\u78B0\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    props.task === void 0 ? props.cardCaptured ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Feedback, { tone: "success", title: "\u62A5\u544A\u53EF\u4E0B\u8F7D", children: "\u5F53\u524D\u4F1A\u8BDD\u4E2D\u5DF2\u6709\u5C3D\u8C03\u62A5\u544A\uFF0C\u53EF\u76F4\u63A5\u4E0B\u8F7D\uFF1B\u65B0\u7684\u5C3D\u8C03\u5C06\u91CD\u65B0\u8BA1\u6570\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Feedback, { tone: "notice", title: "\u7B49\u5F85\u8BBE\u5B9A", children: "\u5B8C\u6210\u5C3D\u8C03\u8BBE\u5B9A\u540E\uFF0C\u62A5\u544A\u7ED3\u6784\u4E0E\u6267\u884C\u8FDB\u5EA6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" }) : ready ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Feedback, { tone: "success", title: "\u62A5\u544A\u5DF2\u751F\u6210", children: "\u6267\u884C\u5DF2\u7ED3\u675F\u3002\u53EF\u4E0B\u8F7D\u62A5\u544A\uFF0C\u6216\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u4E0E\u4E8B\u5B9E\u5F15\u7528\u3002" }) : props.status === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Feedback, { tone: "error", title: "\u672C\u6B21\u5C3D\u8C03\u672A\u5B8C\u6574\u5B8C\u6210", children: "\u8BF7\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u9519\u8BEF\uFF1B\u5DF2\u53D6\u5F97\u4E8B\u5B9E\u4ECD\u53EF\u4FDD\u7559\uFF0C\u5931\u8D25\u7EF4\u5EA6\u4E0D\u5F97\u5199\u6210\u96F6\u8BB0\u5F55\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Feedback, { tone: "notice", title: props.status === "running" ? "\u6B63\u5728\u751F\u6210\u62A5\u544A" : "\u7B49\u5F85\u5F00\u59CB", children: props.status === "running" && !props.cardCaptured ? "\u4F1A\u8BDD\u82E5\u505C\u5728\u5019\u9009\u4E3B\u4F53\u786E\u8BA4\uFF0C\u8BF7\u5148\u5728\u4F1A\u8BDD\u4E2D\u9009\u5B9A\u4F01\u4E1A\uFF1B\u62A5\u544A\u751F\u6210\u540E\u300C\u4E0B\u8F7D\u62A5\u544A\u300D\u624D\u53EF\u70B9\u3002" : "\u5B8C\u6210\u7ECF\u8425\u4E0E\u98CE\u9669\u4E24\u6761\u7EBF\u540E\uFF0C\u5C06\u81EA\u52A8\u5207\u6362\u5230\u672C\u9875\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u62A5\u544A\u7ED3\u6784" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u56FA\u5B9A\u516B\u6BB5\uFF0C\u53EF\u538B\u7F29\u6216\u5C55\u5F00\uFF1B\u4E8B\u5B9E\u3001\u63A8\u7406\u3001\u95EE\u9898\u548C\u8986\u76D6\u8FB9\u754C\u4E0D\u6DF7\u5199\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwDeliverables", children: deliverables.map(([number, title, detail]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwDeliverable", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: number }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: detail })
        ] })
      ] }, number)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: "\u6267\u884C\u8986\u76D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: "\u8FD9\u662F\u5DE5\u4F5C\u53F0\u4ECE\u5F53\u524D Session \u8BFB\u53D6\u7684\u771F\u5B9E\u6267\u884C\u4E8B\u4EF6\uFF0C\u4E0D\u662F\u5B8C\u6574\u6027\u8BC4\u5206\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCoverage", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: props.toolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5DF2\u8BC6\u522B\u5DE5\u5177\u8C03\u7528" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: props.failedToolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u5DE5\u5177\u9519\u8BEF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: ready ? "4/4" : "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u4E1A\u52A1\u9636\u6BB5" })
        ] })
      ] })
    ] })
  ] });
}
function extractCardFromDom() {
  if (typeof document === "undefined") return null;
  const headings = Array.from(document.querySelectorAll("h1,h2,h3,h4")).filter((h) => /核心研判/.test(h.textContent ?? "") && h.closest(".qccPwShell") === null);
  const last = headings[headings.length - 1];
  if (last === void 0) return null;
  let el = last.parentElement;
  while (el !== null && el !== document.body) {
    const t = el.textContent ?? "";
    if (/核心研判/.test(t) && /现场必问|覆盖说明/.test(t) && el.querySelector(".qccPwShell") === null) break;
    el = el.parentElement;
  }
  if (el === null || el === document.body) return null;
  const clone = el.cloneNode(true);
  clone.querySelectorAll("button,svg,script,style,textarea,input,select,[contenteditable],[role='toolbar']").forEach((n) => n.remove());
  clone.querySelectorAll("h1,h2,h3,p").forEach((n) => {
    const t = (n.textContent ?? "").trim();
    if (/^(访前尽调报告|拜访作战卡)\s*·/.test(t) || /^锚定主体：/.test(t)) n.remove();
  });
  clone.querySelectorAll("h1,h2,h3,h4").forEach((n) => {
    n.textContent = normalizeHeading(n.textContent ?? "");
  });
  clone.querySelectorAll("*").forEach((n) => {
    for (const attr of Array.from(n.attributes)) {
      if (!/^(colspan|rowspan|href)$/i.test(attr.name)) n.removeAttribute(attr.name);
    }
  });
  const text = el.textContent ?? "";
  return { html: clone.innerHTML, text };
}
function PrevisitWorkbenchTab(props) {
  const sessionId = props.scope.sessionId;
  const shared = (0, import_react3.useSyncExternalStore)(props.shared.subscribe, () => props.shared.get(sessionId));
  const task = shared.task;
  const setTask = (fn) => props.shared.update(sessionId, (s) => ({ ...s, task: fn(s.task) }));
  const [phase, setPhase] = (0, import_react3.useState)("prepare");
  const [runtime, setRuntime] = (0, import_react3.useState)(EMPTY_RUNTIME);
  const [completedTaskId, setCompletedTaskId] = (0, import_react3.useState)();
  const [cardText, setCardText] = (0, import_react3.useState)(null);
  const [downloadNote, setDownloadNote] = (0, import_react3.useState)();
  (0, import_react3.useInsertionEffect)(() => {
    if (!props.visible) return;
    return installStyles();
  }, [props.visible]);
  (0, import_react3.useEffect)(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session;
    if (face === void 0) {
      return;
    }
    const refresh = () => {
      const snapshot = face.getSnapshot();
      if (task === void 0) {
        const adopted = adoptTaskFromSnapshot(snapshot);
        if (adopted !== null) {
          props.shared.update(sessionId, (s) => s.task !== void 0 ? s : {
            ...s,
            task: { ...adopted, createdAt: (/* @__PURE__ */ new Date()).toISOString(), seenRunning: snapshot.running === true || (snapshot.nodes?.length ?? 0) > adopted.nodeBaseline + 1, selection: s.selection }
          });
        }
      }
      const baseline = task?.nodeBaseline ?? (snapshot.nodes?.length ?? 0);
      const calls = collectRuntime(snapshot, baseline);
      setRuntime({
        running: snapshot.running === true,
        partial: snapshot.partial !== null && snapshot.partial !== void 0,
        lastAgentError: snapshot.lastAgentError ?? null,
        ...calls
      });
      if (snapshot.running === true) {
        setTask((current) => current === void 0 || current.seenRunning ? current : { ...current, seenRunning: true });
      }
      setCardText(extractCardText(snapshot, task?.nodeBaseline ?? 0));
    };
    refresh();
    return face.subscribe?.(refresh);
  }, [props.ctx, sessionId, task?.id, task?.nodeBaseline]);
  const progressInput = {
    hasTask: task !== void 0,
    running: runtime.running,
    seenRunning: task?.seenRunning ?? false,
    lastAgentError: runtime.lastAgentError,
    partial: runtime.partial,
    toolNames: runtime.toolNames
  };
  const status = deriveWorkbenchStatus(progressInput);
  const phaseStates = derivePhaseStates(progressInput);
  const insights = (0, import_react3.useMemo)(() => parseCardInsights(cardText), [cardText]);
  const reportHtml = (0, import_react3.useMemo)(() => {
    if (cardText !== null) return buildPrevisitReportHtml(cardText);
    if (status !== "ready" && task === void 0) return null;
    const dom = extractCardFromDom();
    return dom === null ? null : buildPrevisitReportFromRenderedHtml(dom.html, dom.text);
  }, [cardText, status, phase, runtime.toolEvents.length]);
  (0, import_react3.useEffect)(() => {
    if (status !== "ready" && status !== "failed" || task === void 0 || completedTaskId === task.id) {
      return;
    }
    setCompletedTaskId(task.id);
    setPhase("delivery");
  }, [completedTaskId, status, task]);
  const newTask = () => {
    setTask(() => void 0);
    setRuntime(EMPTY_RUNTIME);
    setPhase("prepare");
  };
  const returnToConversation = () => {
    props.store.reduce((state) => ({ ...state, panelOpen: false, bottomOpen: false }));
  };
  const downloadReport = () => {
    let html;
    let source;
    if (cardText !== null) {
      html = buildPrevisitReportHtml(cardText);
      source = cardText;
    } else {
      const dom = extractCardFromDom();
      if (dom === null) {
        setDownloadNote("\u5F53\u524D\u4F1A\u8BDD\u91CC\u8FD8\u6CA1\u6709\u751F\u6210\u5B8C\u6574\u62A5\u544A\uFF0C\u6216\u62A5\u544A\u672A\u5C55\u5F00\u5728\u5BF9\u8BDD\u533A\uFF1B\u8BF7\u5148\u56DE\u5230\u4F1A\u8BDD\u786E\u8BA4\u62A5\u544A\u5DF2\u8F93\u51FA\u3002");
        return;
      }
      html = buildPrevisitReportFromRenderedHtml(dom.html, dom.text);
      source = dom.text;
    }
    setDownloadNote(void 0);
    const company = /(?:访前尽调报告|拜访作战卡)\s*·\s*([^\n（(锚｜]+)/.exec(source)?.[1]?.trim() || "\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A";
    const blob = new Blob([html], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A_${company}.html`;
    document.body.append(a);
    a.click();
    a.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  if (!props.visible) return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(import_jsx_runtime2.Fragment, {});
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "qccPwShell", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", "data-status": status, children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("header", { className: "qccPwHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwBrand", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwBrandIcon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: "briefcase" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwBrandCopy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwTitleRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h1", { className: "qccPwTitle", children: "\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0" }),
            /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwLiveDot", "data-status": status })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwSubtitle", children: "\u4F01\u67E5\u67E5\u4E8B\u5B9E\u9A71\u52A8 \xB7 \u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwMeta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwStatus", "data-status": status, children: STATUS_LABELS[status] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qccPwSession", children: [
          "\u5F53\u524D Session \xB7 ",
          sessionId.slice(0, 12)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("nav", { className: "qccPwStages", "aria-label": "\u8BBF\u524D\u4EFB\u52A1\u9636\u6BB5", children: PREVISIT_PHASES.map((current) => {
      const phaseState = phaseStates.find((item) => item.id === current);
      return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "qccPwStage", "data-selected": phase === current, "data-progress": phaseState?.progress ?? "idle", onClick: () => setPhase(current), children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwStageIcon", children: /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Icon, { name: current }) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("span", { className: "qccPwStageCopy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("strong", { children: PHASE_LABELS[current].label }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("small", { children: PHASE_LABELS[current].description })
        ] })
      ] }, current);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwBody", children: [
      phase === "prepare" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(SetupPanel, { sessionId, store: props.shared, task, start: (prompt) => props.startPrompt(sessionId, prompt), onStarted: () => setPhase("opportunity") }) : null,
      phase === "opportunity" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(OpportunityPanel, { task, status, events: runtime.toolEvents, insights }) : null,
      phase === "risk" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(RiskPanel, { task, status, events: runtime.toolEvents, insights }) : null,
      phase === "delivery" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(DeliveryPanel, { task, status, toolCount: runtime.toolNames.length, failedToolCount: runtime.failedToolCount, cardCaptured: cardText !== null, reportHtml }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("footer", { className: "qccPwFooter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwFooterHint", "data-tone": downloadNote === void 0 ? void 0 : "error", children: downloadNote !== void 0 ? downloadNote : phase === "prepare" ? "" : "\u5DE5\u4F5C\u53F0\u7ED1\u5B9A\u5F53\u524D\u4F1A\u8BDD\uFF0C\u4F01\u4E1A\u4E8B\u5B9E\u4E0E\u5B8C\u6574\u62A5\u544A\u4FDD\u7559\u5728\u4F1A\u8BDD\u4E2D\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwFooterActions", children: [
        phase !== "prepare" && task !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: newTask, children: "\u65B0\u7684\u5C3D\u8C03" }) : null,
        phase === "delivery" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "qccPwPrimary", title: "\u4E0B\u8F7D\u4E3A HTML \u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u6253\u5F00\u6216\u6253\u5370", onClick: downloadReport, children: [
          "\u4E0B\u8F7D\u62A5\u544A",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u2193" })
        ] }) : phase !== "prepare" ? /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("button", { type: "button", className: "qccPwPrimary", onClick: returnToConversation, children: [
          "\u8FD4\u56DE\u4F1A\u8BDD",
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { children: "\u2192" })
        ] }) : null
      ] })
    ] })
  ] });
}
function installStyles() {
  if (document.getElementById(STYLE_ID) !== null) {
    return () => {
    };
  }
  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = WORKBENCH_CSS;
  document.head.append(style);
  return () => style.remove();
}
function apply(ctx) {
  const service = ctx.betterSidebar;
  const shared = createPrevisitStore();
  const startPrompt = async (sessionId, prompt) => {
    const conversation = ctx.sessions.scope?.(sessionId)?.get("conversation");
    if (conversation === void 0) throw new Error("conversation unavailable");
    const baseline = ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? 0;
    await conversation.send(prompt);
    return baseline;
  };
  ctx.effect(
    () => registerWorkbenchTab(service, (props) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(PrevisitWorkbenchTab, { ...props, ctx, shared, startPrompt })),
    "dsh-pre-duediligence: Better Sidebar tab"
  );
}

    return module.exports;
  }
});
