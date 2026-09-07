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
var import_react6 = require("react");

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

// src/previsit-brand.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var PREVISIT_LOGO_PATH = "M4 21h16M6 21V6l6-3 6 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5";
function PrevisitLogo(props) {
  const size = props.size ?? 20;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
    "svg",
    {
      className: props.className,
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: "1.7",
      strokeLinecap: "round",
      strokeLinejoin: "round",
      focusable: "false",
      "aria-hidden": "true",
      style: props.style,
      children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: PREVISIT_LOGO_PATH })
    }
  );
}

// src/previsit-dock.tsx
var import_react = require("react");
var import_react_dom = require("react-dom");

// src/previsit-store.ts
var EMPTY_SESSION_STATE = {
  selection: EMPTY_SELECTION,
  company: "",
  composer: EMPTY_COMPOSER_STATE,
  task: void 0,
  panel: null,
  view: "target",
  dismissedTaskIds: []
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
function buildPrevisitReportFromRenderedHtml(bodyHtml, plainText, meta) {
  const m = deriveMeta(plainText, meta);
  const body = humanizeHypothesis(stripFactIds(bodyHtml)).replace(/<(td|th)([^>]*)>\s*([^<]{1,20})\s*<\/\1>/g, (_m, tag, attrs, cell) => `<${tag}${attrs}>${esc(humanizeCell(cell))}</${tag}>`);
  return wrapPrevisitReport(body, m);
}

// src/previsit-dock.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccDockChips", children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qccDockChip", "data-selected": props.selected.includes(option.id), onClick: () => props.onToggle(option.id), children: option.label }, option.id)) });
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
    store.update(sessionId, (s) => ({ ...EMPTY_SESSION_STATE, task: s.task, panel: s.panel, view: s.view, dismissedTaskIds: s.dismissedTaskIds }));
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
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockBody", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("label", { className: "qccDockLabel", htmlFor: `${props.idPrefix}-company`, children: "\u8981\u89C1\u8C01" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("input", { id: `${props.idPrefix}-company`, className: "qccDockCompany", value: st.company, placeholder: "\u4F01\u4E1A\u5168\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801", onChange: (e) => a.setCompany(e.target.value) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccDockLabel", children: "\u6211\u662F" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Chips, { options: ROLE_OPTIONS, selected: st.selection.role === void 0 ? [] : [st.selection.role], onToggle: (id) => a.toggleSingle("role", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccDockLabel", children: "\u573A\u5408" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Chips, { options: PURPOSE_OPTIONS, selected: st.selection.purpose === void 0 ? [] : [st.selection.purpose], onToggle: (id) => a.toggleSingle("purpose", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccDockLabel", children: "\u5173\u6CE8" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Chips, { options: FOCUS_OPTIONS, selected: st.selection.focus, onToggle: a.toggleFocus })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccDockLabel", children: "\u6DF1\u5EA6" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Chips, { options: BUDGET_OPTIONS, selected: st.selection.budget === void 0 ? [] : [st.selection.budget], onToggle: (id) => a.toggleSingle("budget", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccDockLabel", children: "\u8F93\u51FA" }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)(Chips, { options: OUTPUT_OPTIONS, selected: st.selection.output === void 0 ? [] : [st.selection.output], onToggle: (id) => a.toggleSingle("output", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockFoot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccDockHint", "data-tone": a.error === void 0 ? void 0 : "error", children: a.error ?? (a.manual ? "\u8F93\u5165\u6846\u91CC\u6709\u4F60\u624B\u5199\u7684\u5185\u5BB9\uFF0C\u70B9\u9009\u4E0D\u4F1A\u8986\u76D6\uFF1B\u300C\u6309\u6761\u4EF6\u8865\u5145\u300D\u4F1A\u53E6\u8D77\u4E00\u53E5\u8FFD\u52A0" : "\u6761\u4EF6\u5B9E\u65F6\u5199\u8FDB\u8F93\u5165\u6846\uFF0C\u53EF\u4EE5\u76F4\u63A5\u6539\uFF1B\u6539\u597D\u540E\u70B9\u300C\u5F00\u59CB\u5C3D\u8C03\u300D") }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccDockActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qccDockBtn", onClick: a.reset, children: "\u6E05\u7A7A" }),
        a.manual ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qccDockBtn", onClick: a.append, children: "\u6309\u6761\u4EF6\u8865\u5145" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("button", { type: "button", className: "qccDockBtn qccDockPrimary", disabled: a.submitting, onClick: () => void a.startTask(), children: a.submitting ? "\u53D1\u9001\u4E2D\u2026" : props.startLabel ?? "\u5F00\u59CB\u5C3D\u8C03 \u2192" })
      ] })
    ] })
  ] });
}

// src/previsit-prompt.tsx
var import_react2 = require("react");
var import_react_dom2 = require("react-dom");

// src/previsit-session.ts
var PREVISIT_SESSION_ID_PREFIX = "session-dsh-pre-duediligence-";
function isPrevisitSession(sessionId) {
  return /^session-dsh-pre-duediligence-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(sessionId);
}
async function createPrevisitSession(ctx) {
  const workspace = ctx.workspaces?.list?.getSnapshot();
  const current = ctx.sessions.list?.getSnapshot().current;
  const items = workspace?.items ?? [];
  const cwd = items.find((item) => current !== void 0 && item.sessionIds?.includes(current))?.path ?? items.find((item) => item.workspaceId === workspace?.recentWorkspaceId)?.path ?? items[0]?.path;
  if (!cwd) throw new Error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u5DE5\u4F5C\u7A7A\u95F4\uFF0C\u518D\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03");
  if (typeof ctx.sessions.create !== "function" || typeof ctx.sessions.open !== "function") {
    throw new Error("\u5F53\u524D DSH \u7248\u672C\u6CA1\u6709\u53EF\u7528\u7684\u4F1A\u8BDD\u521B\u5EFA\u80FD\u529B");
  }
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5B89\u5168\u4F1A\u8BDD\u6807\u8BC6\u751F\u6210\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u7248\u6D4F\u89C8\u5668");
  }
  const requested = PREVISIT_SESSION_ID_PREFIX + globalThis.crypto.randomUUID();
  const created = await ctx.sessions.create({ cwd, sessionId: requested });
  if (created !== requested) throw new Error("\u8BBF\u524D\u5C3D\u8C03\u4F1A\u8BDD\u6807\u8BC6\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u8BD5");
  return created;
}

// src/previsit-prompt.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
function mergePromptDraft(existing, generated, mode) {
  if (mode === "replace" || existing.trim() === "") return generated;
  const separator = existing.endsWith("\n") ? "" : "\n";
  return existing + separator + generated;
}
function cloneSelection(selection) {
  return { ...selection, focus: [...selection.focus] };
}
function PromptDialog(props) {
  const panelRef = (0, import_react2.useRef)(null);
  const closeRef = (0, import_react2.useRef)(props.onClose);
  closeRef.current = props.onClose;
  (0, import_react2.useEffect)(() => {
    const panel = panelRef.current;
    if (panel === null) return;
    const previous = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const focusable = () => [...panel.querySelectorAll('button:not(:disabled),input:not(:disabled),textarea:not(:disabled),select:not(:disabled),[tabindex="0"]')].filter((node) => node.getClientRects().length > 0);
    (focusable()[0] ?? panel).focus();
    const keydown = (event) => {
      if (event.key === "Escape") {
        event.preventDefault();
        event.stopPropagation();
        closeRef.current();
        return;
      }
      if (event.key !== "Tab") return;
      const nodes = focusable();
      const first = nodes[0] ?? panel;
      const last = nodes[nodes.length - 1] ?? panel;
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault();
        first.focus();
      }
    };
    panel.addEventListener("keydown", keydown);
    return () => {
      panel.removeEventListener("keydown", keydown);
      if (panel.contains(document.activeElement) && previous?.isConnected) previous.focus();
    };
  }, [props.sessionId]);
  const dialog = /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "qccPromptBackdrop", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("section", { ref: panelRef, className: "qccPromptPanel", role: "dialog", "aria-modal": "true", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u63D0\u793A\u8BCD\u751F\u6210\u5668", "data-session-id": props.sessionId, tabIndex: -1, children: props.children }) });
  return typeof document !== "undefined" && document.body !== null ? (0, import_react_dom2.createPortal)(dialog, document.body) : dialog;
}
function OptionGroup(props) {
  const toggle = (id) => {
    if (props.multiple === true) {
      props.onChange(props.selected.includes(id) ? props.selected.filter((item) => item !== id) : [...props.selected, id]);
      return;
    }
    props.onChange(props.selected.includes(id) ? [] : [id]);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("fieldset", { className: "qccPromptGroup", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("legend", { children: props.title }),
    /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("div", { className: "qccPromptChoices", children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qccPromptChoice", "data-selected": props.selected.includes(option.id), children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { type: props.multiple === true ? "checkbox" : "radio", name: props.multiple === true ? void 0 : props.title, checked: props.selected.includes(option.id), onChange: () => toggle(option.id) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: option.label })
    ] }, option.id)) })
  ] });
}
function setSingle(setSelection, key, values) {
  setSelection((current) => {
    const next = { ...current };
    const value = values[0];
    if (value === void 0) delete next[key];
    else next[key] = value;
    return next;
  });
}
function PrevisitPromptGenerator(props) {
  const enabled = isPrevisitSession(props.sessionId);
  const draft = props.useInput((state) => state.draft);
  const phase = props.useInput((state) => state.phase);
  const [open, setOpen] = (0, import_react2.useState)(false);
  const [step, setStep] = (0, import_react2.useState)(1);
  const [company, setCompany] = (0, import_react2.useState)("");
  const [selection, setSelection] = (0, import_react2.useState)({ focus: [] });
  const [initializedSession, setInitializedSession] = (0, import_react2.useState)();
  const [error, setError] = (0, import_react2.useState)();
  const [conflict, setConflict] = (0, import_react2.useState)(false);
  const triggerRef = (0, import_react2.useRef)(null);
  if (!enabled) return null;
  const openWizard = () => {
    if (initializedSession !== props.sessionId) {
      const stored = props.store.get(props.sessionId);
      setCompany(stored.company);
      setSelection(cloneSelection(stored.selection));
      setInitializedSession(props.sessionId);
    }
    setError(void 0);
    setConflict(false);
    setOpen(true);
  };
  const close = () => {
    setOpen(false);
    window.setTimeout(() => triggerRef.current?.focus(), 0);
  };
  const generated = composeFullSentence(selection, company);
  const commit = (mode) => {
    if (props.inputActions === void 0) {
      setError("\u5F53\u524D\u4F1A\u8BDD\u8F93\u5165\u6846\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
      return;
    }
    if (phase === "submitting" || phase === "adjudicating") {
      setError("\u5F53\u524D\u5BF9\u8BDD\u6B63\u5728\u63D0\u4EA4\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210\u540E\u518D\u56DE\u586B\u3002\u4F60\u7684\u9009\u62E9\u5DF2\u4FDD\u7559\u3002");
      return;
    }
    const next2 = mergePromptDraft(draft, generated, mode);
    writeDraft(props.inputActions, next2);
    props.store.update(props.sessionId, (state) => ({
      ...state,
      company: company.trim(),
      selection: cloneSelection(selection),
      composer: {
        text: next2,
        lastGenerated: generated,
        lastCompany: company.trim(),
        mode: mode === "append" && draft.trim() !== "" ? "manual" : "generated"
      }
    }));
    setOpen(false);
    setConflict(false);
    window.setTimeout(() => {
      composerTextarea()?.focus();
    }, 0);
  };
  const confirm = () => {
    if (company.trim() === "") {
      setError("\u8BF7\u5148\u586B\u5199\u4F01\u4E1A\u5168\u79F0\u3001\u7B80\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\u3002");
      setStep(1);
      return;
    }
    if (generated.trim() === "") {
      setError("\u8BF7\u81F3\u5C11\u586B\u5199\u4F01\u4E1A\u4FE1\u606F\u3002");
      return;
    }
    if (draft.trim() !== "" && draft.trim() !== generated.trim()) {
      setConflict(true);
      return;
    }
    commit("replace");
  };
  const next = () => {
    if (step === 1 && company.trim() === "") {
      setError("\u8BF7\u5148\u586B\u5199\u4F01\u4E1A\u5168\u79F0\u3001\u7B80\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\u3002");
      return;
    }
    setError(void 0);
    if (step < 4) setStep((current) => current + 1);
    else confirm();
  };
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qccPromptLayer", children: [
    /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { ref: triggerRef, type: "button", className: "qccPromptTrigger", "aria-label": "\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03\u63D0\u793A\u8BCD\u751F\u6210\u5668", "aria-expanded": open, onClick: openWizard, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: "m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM6 14l.8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8zM18 13l.7 1.8 1.8.7-1.8.7L18 18l-.7-1.8-1.8-.7 1.8-.7z" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u63D0\u793A\u8BCD\u751F\u6210" })
    ] }),
    open ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)(PromptDialog, { sessionId: props.sessionId, onClose: close, children: [
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("header", { className: "qccPromptHead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h3", { children: "\u751F\u6210\u8BBF\u524D\u5C3D\u8C03\u4EFB\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u56DB\u6B65\u660E\u786E\u5BF9\u8C61\u3001\u573A\u666F\u3001\u8303\u56F4\u548C\u8F93\u51FA\uFF1B\u56DE\u586B\u540E\u4ECD\u53EF\u4EBA\u5DE5\u4FEE\u6539\u3002" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "qccPromptClose", "aria-label": "\u5173\u95ED\u63D0\u793A\u8BCD\u751F\u6210\u5668", onClick: close, children: "\xD7" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qccPromptBody", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("nav", { className: "qccPromptSteps", "aria-label": "\u4EFB\u52A1\u8BBE\u7F6E\u6B65\u9AA4", children: [[1, "\u62DC\u8BBF\u5BF9\u8C61"], [2, "\u89D2\u8272\u573A\u666F"], [3, "\u8303\u56F4\u6DF1\u5EA6"], [4, "\u786E\u8BA4\u8F93\u51FA"]].map(([index, label]) => /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("button", { type: "button", "data-active": step === index, "aria-current": step === index ? "step" : void 0, onClick: () => setStep(Number(index)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("b", { children: index }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: label })
        ] }, index)) }),
        step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u660E\u786E\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u53EF\u586B\u5199\u4F01\u4E1A\u5168\u79F0\u3001\u7B80\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\uFF1B\u7B80\u79F0\u5B58\u5728\u591A\u5019\u9009\u65F6\uFF0C\u667A\u80FD\u4F53\u4F1A\u5728\u4F1A\u8BDD\u4E2D\u8BF7\u4F60\u786E\u8BA4\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("label", { className: "qccPromptField", children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("span", { children: "\u4F01\u4E1A\u540D\u79F0 / \u4FE1\u7528\u4EE3\u7801" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("input", { autoFocus: true, value: company, placeholder: "\u4F8B\u5982\uFF1A\u4F01\u67E5\u67E5\u79D1\u6280\u80A1\u4EFD\u6709\u9650\u516C\u53F8", onChange: (event) => setCompany(event.target.value) })
          ] })
        ] }) : null,
        step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u8BF4\u660E\u4F60\u7684\u89D2\u8272\u548C\u62DC\u8BBF\u573A\u666F" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u672A\u9009\u62E9\u65F6\u7531 Skill \u4F7F\u7528\u901A\u7528\u89C6\u89D2\uFF0C\u4E0D\u5728\u524D\u7AEF\u6697\u8BBE\u9ED8\u8BA4\u503C\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OptionGroup, { title: "\u6211\u7684\u89D2\u8272", options: ROLE_OPTIONS, selected: selection.role === void 0 ? [] : [selection.role], onChange: (values) => setSingle(setSelection, "role", values) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OptionGroup, { title: "\u62DC\u8BBF\u573A\u666F", options: PURPOSE_OPTIONS, selected: selection.purpose === void 0 ? [] : [selection.purpose], onChange: (values) => setSingle(setSelection, "purpose", values) })
        ] }) : null,
        step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u9009\u62E9\u5173\u6CE8\u8303\u56F4\u4E0E\u5C3D\u8C03\u6DF1\u5EA6" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u83DC\u5355\u4E0E\u9636\u6BB5\u53EA\u8D1F\u8D23\u5BFC\u822A\uFF1B\u771F\u5B9E\u8986\u76D6\u8303\u56F4\u4EE5\u672C\u6B21\u4F1A\u8BDD\u4E2D\u7684\u5DE5\u5177\u8C03\u7528\u548C\u62A5\u544A\u62AB\u9732\u4E3A\u51C6\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OptionGroup, { title: "\u91CD\u70B9\u5173\u6CE8", options: FOCUS_OPTIONS, multiple: true, selected: selection.focus, onChange: (values) => setSelection((current) => ({ ...current, focus: values })) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OptionGroup, { title: "\u5C3D\u8C03\u6DF1\u5EA6", options: BUDGET_OPTIONS, selected: selection.budget === void 0 ? [] : [selection.budget], onChange: (values) => setSingle(setSelection, "budget", values) })
        ] }) : null,
        step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("h4", { children: "\u786E\u8BA4\u4EFB\u52A1\u63CF\u8FF0\u548C\u8F93\u51FA" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(OptionGroup, { title: "\u8F93\u51FA\u5F62\u6001", options: OUTPUT_OPTIONS, selected: selection.output === void 0 ? [] : [selection.output], onChange: (values) => setSingle(setSelection, "output", values) }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("pre", { className: "qccPromptPreview", children: generated || "\u586B\u5199\u4F01\u4E1A\u540E\u5C06\u5728\u8FD9\u91CC\u751F\u6210\u4EFB\u52A1\u63CF\u8FF0\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "qccPromptNote", children: "\u56DE\u586B\u4E0D\u4F1A\u542F\u52A8\u5C3D\u8C03\u3002\u53EA\u6709\u70B9\u51FB DSH \u539F\u751F\u53D1\u9001\u6309\u94AE\u540E\uFF0C\u667A\u80FD\u4F53\u624D\u4F1A\u4F7F\u7528\u5F53\u524D\u7528\u6237\u81EA\u5DF1\u7684\u4F01\u67E5\u67E5 MCP \u8FDE\u63A5\u4E0E\u989D\u5EA6\u3002" })
        ] }) : null,
        conflict ? /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { className: "qccPromptConflict", role: "alertdialog", "aria-label": "\u5904\u7406\u5DF2\u6709\u8F93\u5165\u5185\u5BB9", children: [
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("strong", { children: "\u8F93\u5165\u6846\u5DF2\u6709\u5185\u5BB9" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { children: "\u8BF7\u9009\u62E9\u66FF\u6362\u539F\u6587\u3001\u8FFD\u52A0\u4EFB\u52A1\u63CF\u8FF0\uFF0C\u6216\u53D6\u6D88\u5E76\u4FDD\u7559\u5F53\u524D\u5185\u5BB9\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => setConflict(false), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", onClick: () => commit("append"), children: "\u8FFD\u52A0" }),
            /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "is-primary", onClick: () => commit("replace"), children: "\u66FF\u6362" })
          ] })
        ] }) : null,
        error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("p", { className: "qccPromptError", role: "alert", children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime3.jsxs)("footer", { className: "qccPromptActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", disabled: step === 1, onClick: () => {
          setError(void 0);
          setConflict(false);
          setStep((current) => Math.max(1, current - 1));
        }, children: "\u4E0A\u4E00\u6B65" }),
        /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("button", { type: "button", className: "is-primary", onClick: next, children: step === 4 ? "\u56DE\u586B\u5230\u5BF9\u8BDD\u6846" : "\u4E0B\u4E00\u6B65" })
      ] })
    ] }) : null
  ] });
}

// src/better-sidebar.ts
var import_react3 = require("react");
var PREVISIT_WORKBENCH_TAB_ID = "dsh-pre-duediligence:agent";
var SUPPORTED_SIDEBAR_VERSION = /^0\.17\./u;
function treeContainsTab(node, tabId) {
  if (node.kind === "leaf") {
    return node.tabs.some((tab) => tab.id === tabId);
  }
  return node.children.some((child) => treeContainsTab(child, tabId));
}
function revealState(state, tabId) {
  if (state.floats.some((float) => float.tab.id === tabId)) {
    return state;
  }
  if (treeContainsTab(state.bottomSplits, tabId)) {
    return state.bottomOpen ? state : { ...state, bottomOpen: true };
  }
  if (treeContainsTab(state.splits, tabId)) {
    return state.panelOpen ? state : { ...state, panelOpen: true };
  }
  return state;
}
function createRevealController() {
  const targets = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Set();
  return {
    attach(sessionId, target) {
      targets.set(sessionId, target);
      if (pending.delete(sessionId)) {
        target.store.reduce((state) => revealState(state, target.tabId));
      }
      return () => {
        if (targets.get(sessionId) === target) {
          targets.delete(sessionId);
        }
      };
    },
    request(sessionId) {
      const target = targets.get(sessionId);
      if (target === void 0) {
        pending.add(sessionId);
        return;
      }
      target.store.reduce((state) => revealState(state, target.tabId));
    }
  };
}
function useWorkbenchReveal(controller, props) {
  const sessionId = props.scope.sessionId;
  const store = props.store;
  const tabId = props.tab.id;
  (0, import_react3.useEffect)(() => controller.attach(sessionId, { store, tabId }), [controller, sessionId, store, tabId]);
}
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
    title: "\u8BBF\u524D\u5C3D\u8C03",
    order: 30,
    hidden: true,
    single: true,
    component
  });
}
function openWorkbench(service, scope, reveal) {
  assertBetterSidebar(service);
  if (!service.isTabEnabled(PREVISIT_WORKBENCH_TAB_ID)) {
    return false;
  }
  service.openTab({ type: PREVISIT_WORKBENCH_TAB_ID }, scope);
  reveal.request(scope.sessionId);
  return true;
}

// src/left-sidebar.tsx
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");
var import_react4 = require("react");
var import_react_dom3 = require("react-dom");
var import_jsx_runtime4 = require("react/jsx-runtime");
var WORKSPACES_SLOT_SELECTOR = '[data-slot="sidebar.workspaces"]';
var LAUNCHER_MOUNT_SELECTOR = '[data-previsit-launcher-mount="true"]';
function ensureLauncherMount() {
  const workspaceSlot = document.querySelector(WORKSPACES_SLOT_SELECTOR);
  const parent = workspaceSlot?.parentElement;
  if (workspaceSlot === null || parent === void 0 || parent === null) return null;
  let mount = parent.querySelector(LAUNCHER_MOUNT_SELECTOR);
  if (mount === null) {
    mount = document.createElement("div");
    mount.dataset.previsitLauncherMount = "true";
  }
  if (mount.parentElement !== parent) parent.insertBefore(mount, workspaceSlot);
  return mount;
}
function LeftSidebarEntry(props) {
  const [mount, setMount] = (0, import_react4.useState)(null);
  const [busy, setBusy] = (0, import_react4.useState)(false);
  const [error, setError] = (0, import_react4.useState)();
  const wide = props.wide !== false;
  (0, import_react4.useEffect)(() => {
    let disposed = false;
    const ownedMounts = /* @__PURE__ */ new Set();
    const sync = () => {
      if (disposed) return;
      const next = ensureLauncherMount();
      if (next !== null) ownedMounts.add(next);
      setMount((current) => current === next ? current : next);
    };
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { childList: true, subtree: true });
    return () => {
      disposed = true;
      observer.disconnect();
      for (const owned of ownedMounts) owned.remove();
    };
  }, []);
  const launch = async () => {
    if (busy || props.openAgent === void 0) return;
    setBusy(true);
    setError(void 0);
    try {
      await props.openAgent();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : String(reason));
    } finally {
      setBusy(false);
    }
  };
  const button = /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
    import_dsh_client_ui_primitives.Button,
    {
      type: "button",
      variant: "ghost",
      "aria-label": "\u8BBF\u524D\u5C3D\u8C03",
      "aria-busy": busy,
      disabled: busy,
      title: error ?? "\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03",
      onClick: () => {
        void launch();
      },
      style: {
        boxSizing: "border-box",
        width: wide ? "100%" : 36,
        height: wide ? 40 : 36,
        justifyContent: wide ? "flex-start" : "center",
        borderRadius: wide ? 10 : "50%",
        paddingInline: wide ? 10 : 0,
        whiteSpace: "nowrap"
      },
      children: /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("span", { className: "qccPrevisitLauncherContent", children: [
        /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(PrevisitLogo, { size: 18 }),
        wide ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("span", { children: busy ? "\u6B63\u5728\u6253\u5F00\u2026" : error === void 0 ? "\u8BBF\u524D\u5C3D\u8C03" : "\u6253\u5F00\u5931\u8D25\uFF0C\u8BF7\u91CD\u8BD5" }) : null
      ] })
    }
  );
  if (mount === null) return button;
  return (0, import_react_dom3.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)(
      "div",
      {
        "data-wide": wide,
        style: { boxSizing: "border-box", width: wide ? "100%" : 36, paddingRight: wide ? 12 : 0 },
        children: button
      }
    ),
    mount
  );
}
function registerLeftSidebarLauncher(ctx, service) {
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "dsh-pre-duediligence-launcher",
    order: 20,
    inject: () => ({
      openAgent: async () => {
        assertBetterSidebar(service);
        if (!service.isTabEnabled(PREVISIT_WORKBENCH_TAB_ID)) {
          throw new Error("\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0\u5F53\u524D\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u63D2\u4EF6\u914D\u7F6E");
        }
        const sessionId = await createPrevisitSession(ctx);
        ctx.sessions.open?.(sessionId);
      }
    })
  }, LeftSidebarEntry));
}

// src/previsit-home.tsx
var import_react5 = require("react");
var import_react_dom4 = require("react-dom");
var import_jsx_runtime5 = require("react/jsx-runtime");
var PREVISIT_HOME_TITLE = "\u8BBF\u524D\u5C3D\u8C03\u4E00\u9875\u7EB8\u667A\u80FD\u4F53";
var PREVISIT_HOME_SUMMARY = "\u660E\u786E\u62DC\u8BBF\u5BF9\u8C61\u4E0E\u76EE\u6807\uFF0C\u6838\u9A8C\u4F01\u4E1A\u4FE1\u606F\u5E76\u51C6\u5907\u8BBF\u524D\u6750\u6599\u3002";
var CAPABILITIES = [
  { view: "target", label: "\u4F01\u4E1A\u6838\u9A8C", icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "m15 15 4 4M10.5 7.5v6M7.5 10.5h6" })
  ] }) },
  { view: "collect", label: "\u7ECF\u8425\u753B\u50CF", icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(import_jsx_runtime5.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" }) }) },
  { view: "verify", label: "\u98CE\u9669\u6838\u67E5", icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M12 8v5M12 17h.01" })
  ] }) },
  { view: "output", label: "\u8BBF\u524D\u6750\u6599", icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M6 3h8l4 4v14H6z" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M14 3v5h5M9 13h6M9 17h6" })
  ] }) },
  { view: "history", label: "\u4EFB\u52A1\u5386\u53F2", icon: /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)(import_jsx_runtime5.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("path", { d: "M12 7v5l3 2" })
  ] }) }
];
function CapabilityIcon({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children });
}
function CapabilityBar(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("nav", { className: "qccPrevisitCapabilities", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u80FD\u529B\u83DC\u5355", children: CAPABILITIES.map((item) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("button", { type: "button", className: "qccPrevisitCapability", "aria-label": item.label, title: item.label, onClick: () => props.onNavigate(item.view), children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CapabilityIcon, { children: item.icon }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("span", { className: "qccPrevisitCapabilityLabel", children: item.label })
  ] }, item.view)) });
}
function installCapabilityMount(marker, onMount) {
  const owned = /* @__PURE__ */ new Set();
  const sync = () => {
    const seat = marker.closest("[data-composer-seat]");
    const card = seat?.querySelector("[data-composer-card]");
    if (seat === null || seat === void 0 || card === null || card === void 0) {
      onMount(null);
      return;
    }
    let branch = card;
    while (branch.parentElement !== null && branch.parentElement !== seat && !branch.parentElement.contains(marker)) {
      branch = branch.parentElement;
    }
    const parent = branch.parentElement;
    if (parent === null || !parent.contains(marker) || branch.contains(marker)) {
      onMount(null);
      return;
    }
    let mount = [...owned].find((node) => node.parentElement === parent);
    if (mount === void 0) {
      for (const node of owned) node.remove();
      owned.clear();
      mount = document.createElement("div");
      mount.className = "qccPrevisitCapabilityMount";
      mount.dataset.previsitOwned = "true";
      owned.add(mount);
    }
    if (branch.nextSibling !== mount) parent.insertBefore(mount, branch.nextSibling);
    onMount(mount);
  };
  sync();
  const observer = typeof MutationObserver === "function" ? new MutationObserver(sync) : null;
  observer?.observe(marker.closest("[data-composer-seat]") ?? marker, { childList: true, subtree: true });
  return () => {
    observer?.disconnect();
    for (const node of owned) node.remove();
  };
}
function setPrevisitHeadline(anchor) {
  const hero = anchor.closest('[data-phase="hero"]');
  const title = hero?.querySelector('[class*="headlineText"]');
  if (title === null || title === void 0) return () => {
  };
  const originalTitle = title.textContent;
  const row = title.parentElement;
  const nativeMark = row?.querySelector('[class*="fishHitbox"]');
  const badge = hero === null || hero === void 0 ? void 0 : [...hero.querySelectorAll("span")].find((node) => ["\u9884\u89C8\u7248", "Preview"].includes(node.textContent?.trim() ?? ""));
  const originalMarkDisplay = nativeMark?.style.display;
  const originalBadgeDisplay = badge?.style.display;
  const originalRowFlag = row?.getAttribute("data-previsit-hero-row") ?? null;
  let logo = null;
  title.textContent = PREVISIT_HOME_TITLE;
  title.dataset.previsitHeroTitle = "true";
  if (row !== null && row !== void 0 && nativeMark !== null && nativeMark !== void 0 && typeof document !== "undefined") {
    nativeMark.style.display = "none";
    row.dataset.previsitHeroRow = "true";
    logo = document.createElement("span");
    logo.className = "qccPrevisitHeroLogo";
    logo.dataset.previsitOwned = "true";
    logo.setAttribute("aria-hidden", "true");
    logo.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="${PREVISIT_LOGO_PATH}"></path></svg>`;
    row.insertBefore(logo, title);
  }
  if (badge !== void 0) badge.style.display = "none";
  return () => {
    logo?.remove();
    if (nativeMark !== null && nativeMark !== void 0) nativeMark.style.display = originalMarkDisplay ?? "";
    if (badge !== void 0) badge.style.display = originalBadgeDisplay ?? "";
    if (row !== null && row !== void 0) {
      if (originalRowFlag === null) row.removeAttribute("data-previsit-hero-row");
      else row.setAttribute("data-previsit-hero-row", originalRowFlag);
    }
    if (title.textContent === PREVISIT_HOME_TITLE) title.textContent = originalTitle;
    delete title.dataset.previsitHeroTitle;
  };
}
function PrevisitHome({ sessionId, useSession, openWorkbench: openWorkbench2 }) {
  const blank = useSession((state) => state.composerPhase === "blank");
  const enabled = isPrevisitSession(sessionId);
  const marker = (0, import_react5.useRef)(null);
  const [menuMount, setMenuMount] = (0, import_react5.useState)(null);
  (0, import_react5.useEffect)(() => {
    if (!enabled || marker.current === null) return;
    return installCapabilityMount(marker.current, (mount) => setMenuMount((current) => current === mount ? current : mount));
  }, [enabled, sessionId, blank]);
  (0, import_react5.useEffect)(() => {
    if (!enabled || !blank || marker.current === null) return;
    return setPrevisitHeadline(marker.current);
  }, [enabled, blank, sessionId]);
  if (!enabled) return null;
  const menu = /* @__PURE__ */ (0, import_jsx_runtime5.jsx)(CapabilityBar, { onNavigate: (view) => openWorkbench2?.(view) });
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { ref: marker, className: `qccPrevisitExperience${blank ? " is-home" : ""}`, "data-session-id": sessionId, children: [
    menuMount === null ? menu : (0, import_react_dom4.createPortal)(menu, menuMount),
    blank ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { className: "qccPrevisitHomeSummary", children: PREVISIT_HOME_SUMMARY }) : null
  ] });
}

// src/workbench-state.ts
var PREVISIT_PHASES = ["target", "scope", "collect", "verify", "output"];
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
  if (!input.hasTask) return "empty";
  if (input.running) return "running";
  if (input.lastAgentError !== null) return "failed";
  return input.reportReady ? "ready" : "waiting-agent";
}
function derivePhaseStates(input) {
  const status = deriveWorkbenchStatus(input);
  const opportunitySeen = input.toolNames.some(isOpportunityTool);
  const riskSeen = input.toolNames.some(isRiskTool);
  const entitySeen = hasTool(input.toolNames, ["get_company_by_query", "get_company_profile"]);
  if (!input.hasTask) {
    return PREVISIT_PHASES.map((id, index) => ({ id, progress: index === 0 ? "active" : "idle" }));
  }
  if (status === "ready") return PREVISIT_PHASES.map((id) => ({ id, progress: "done" }));
  if (status === "failed") {
    return [
      { id: "target", progress: "done" },
      { id: "scope", progress: "done" },
      { id: "collect", progress: opportunitySeen || entitySeen ? "done" : "failed" },
      { id: "verify", progress: riskSeen ? "done" : "failed" },
      { id: "output", progress: "failed" }
    ];
  }
  return [
    { id: "target", progress: "done" },
    { id: "scope", progress: opportunitySeen || entitySeen || input.running ? "done" : "active" },
    { id: "collect", progress: riskSeen ? "done" : opportunitySeen || entitySeen || input.running ? "active" : "idle" },
    { id: "verify", progress: riskSeen ? "active" : "idle" },
    { id: "output", progress: input.reportReady ? "done" : "idle" }
  ];
}

// src/workbench-style.ts
var WORKBENCH_CSS = String.raw`
.qccPwShell,.qccPromptPanel,.qccPromptLayer,.qccPrevisitCapabilities,.qccPrevisitExperience,.qccPrevisitLauncherContent{
  --qcc-brand:#128BED;
  --qcc-action:#0875D1;
  --qcc-action-hover:#0666B7;
  --qcc-action-text:#fff;
  --qcc-selected:#E6F4FF;
  --qcc-table-head:#F2F9FC;
  --qcc-page:#F6F8FA;
  --qcc-surface:#FFFFFF;
  --qcc-text:#202C3B;
  --qcc-secondary:#626F80;
  --qcc-border:#DCE4EC;
  --qcc-success:#12805C;
  --qcc-success-bg:#EDF8F2;
  --qcc-review:#946000;
  --qcc-review-bg:#FFF7E5;
  --qcc-danger:#B42318;
  --qcc-danger-bg:#FFF1F0;
  color:var(--qcc-text);
}
:is(html[data-theme="dark"],html.dark) :is(.qccPwShell,.qccPromptPanel,.qccPromptLayer,.qccPrevisitCapabilities,.qccPrevisitExperience,.qccPrevisitLauncherContent){
  --qcc-brand:#55ADFF;
  --qcc-action:#82C3FF;
  --qcc-action-hover:#ACD7FF;
  --qcc-action-text:#101820;
  --qcc-selected:#173449;
  --qcc-table-head:#172C3B;
  --qcc-page:#101820;
  --qcc-surface:#18232E;
  --qcc-text:#E7EEF6;
  --qcc-secondary:#A2B1C2;
  --qcc-border:#344657;
  --qcc-success:#78D8B3;
  --qcc-success-bg:#193A30;
  --qcc-review:#F3C66C;
  --qcc-review-bg:#3D321D;
  --qcc-danger:#FF9B91;
  --qcc-danger-bg:#442826;
}
@media(prefers-color-scheme:dark){
  .qccPwShell,.qccPromptPanel,.qccPromptLayer,.qccPrevisitCapabilities,.qccPrevisitExperience,.qccPrevisitLauncherContent{
    --qcc-brand:#55ADFF;
    --qcc-action:#82C3FF;
    --qcc-action-hover:#ACD7FF;
    --qcc-action-text:#101820;
    --qcc-selected:#173449;
    --qcc-table-head:#172C3B;
    --qcc-page:#101820;
    --qcc-surface:#18232E;
    --qcc-text:#E7EEF6;
    --qcc-secondary:#A2B1C2;
    --qcc-border:#344657;
    --qcc-success:#78D8B3;
    --qcc-success-bg:#193A30;
    --qcc-review:#F3C66C;
    --qcc-review-bg:#3D321D;
    --qcc-danger:#FF9B91;
    --qcc-danger-bg:#442826;
  }
}
[data-previsit-hero-row="true"]{display:flex!important;align-items:center!important;justify-content:center!important;gap:10px!important}
.qccPrevisitHeroLogo{display:inline-flex;color:#128BED;flex:none}
html[data-theme="dark"] .qccPrevisitHeroLogo,html.dark .qccPrevisitHeroLogo{color:#55ADFF}
.qccPrevisitExperience{width:100%;box-sizing:border-box;text-align:center}
.qccPrevisitHomeSummary{max-width:620px;margin:0 auto 18px;color:var(--qcc-secondary);font-size:14px;line-height:1.7}
.qccPrevisitCapabilityMount{width:100%;padding:8px 0;box-sizing:border-box;flex:none}
.qccPrevisitCapabilities{display:flex;align-items:center;justify-content:safe center;gap:8px;width:100%;max-width:var(--dsh-composer-card-max-width,780px);margin:0 auto;padding:2px 16px 0;box-sizing:border-box;overflow-x:auto;scrollbar-width:none}
.qccPrevisitCapabilities::-webkit-scrollbar{display:none}
.qccPrevisitCapability{display:inline-flex;align-items:center;justify-content:center;flex-direction:column;gap:5px;flex:0 0 auto;min-width:108px;min-height:54px;padding:7px 12px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:12px;cursor:pointer;transition:border-color .16s ease,color .16s ease,background .16s ease}
.qccPrevisitCapability svg{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round;flex:none}
.qccPrevisitCapabilityLabel{display:block;max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qccPrevisitCapability:hover,.qccPrevisitCapability:focus-visible{border-color:var(--qcc-border);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPrevisitCapability:focus-visible,.qccPromptTrigger:focus-visible,.qccPromptPanel button:focus-visible,.qccPromptPanel input:focus-visible,.qccPwShell button:focus-visible{outline:2px solid var(--qcc-brand);outline-offset:2px}
.qccPrevisitLauncherContent{display:inline-flex;align-items:center;gap:9px;color:inherit}
.qccPrevisitLauncherContent svg{color:var(--qcc-brand);flex:none}

.qccPromptLayer{position:absolute;z-index:4;top:10px;left:12px}
.qccPromptTrigger{display:inline-flex;align-items:center;gap:6px;height:30px;padding:0 9px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-action);font:inherit;font-size:12px;font-weight:600;cursor:pointer}
.qccPromptTrigger:hover{background:var(--qcc-selected);border-color:var(--qcc-brand)}
.qccPromptTrigger svg{width:15px;height:15px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}
.qccPromptBackdrop{position:fixed;inset:0;z-index:10000;display:grid;place-items:center;padding:24px;background:rgba(15,24,32,.46);backdrop-filter:blur(2px)}
.qccPromptPanel{display:flex;flex-direction:column;min-width:0;width:min(760px,calc(100vw - 32px));max-width:100%;max-height:min(720px,calc(100vh - 48px));overflow:hidden;border:1px solid var(--qcc-border);border-radius:16px;background:var(--qcc-surface);box-shadow:0 24px 70px rgba(15,31,48,.24);box-sizing:border-box}
.qccPromptHead{display:flex;align-items:flex-start;justify-content:space-between;gap:20px;padding:20px 22px 16px;border-bottom:1px solid var(--qcc-border);flex:none}
.qccPromptHead h3{margin:0;color:var(--qcc-text);font-size:19px;line-height:1.4}
.qccPromptHead p{margin:5px 0 0;color:var(--qcc-secondary);font-size:13px}
.qccPromptClose{width:32px;height:32px;border:0;border-radius:8px;background:transparent;color:var(--qcc-secondary);font-size:24px;line-height:1;cursor:pointer}
.qccPromptClose:hover{background:var(--qcc-selected);color:var(--qcc-action)}
.qccPromptBody{min-width:0;min-height:0;width:100%;overflow:auto;padding:18px 22px;box-sizing:border-box}
.qccPromptSteps{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px;margin:0 0 20px}
.qccPromptSteps button{display:flex;align-items:center;gap:8px;min-width:0;padding:9px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:12px;cursor:pointer}
.qccPromptSteps button b{display:grid;place-items:center;width:22px;height:22px;border-radius:50%;background:var(--qcc-page);font-size:11px}
.qccPromptSteps button[data-active="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPromptSteps button[data-active="true"] b{background:var(--qcc-action);color:var(--qcc-action-text)}
.qccPromptPane h4{margin:0 0 5px;font-size:16px}.qccPromptPane>p{margin:0 0 16px;color:var(--qcc-secondary);font-size:13px;line-height:1.65}
.qccPromptField{display:grid;gap:7px;color:var(--qcc-text);font-size:13px;font-weight:600}
.qccPromptField input{width:100%;min-height:42px;padding:9px 11px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:16px;box-sizing:border-box}
.qccPromptGroup{margin:0 0 18px;padding:0;border:0}.qccPromptGroup legend{margin:0 0 9px;color:var(--qcc-text);font-size:13px;font-weight:650}
.qccPromptChoices{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px}
.qccPromptChoice{display:flex;align-items:center;gap:8px;min-height:40px;padding:8px 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font-size:13px;cursor:pointer}
.qccPromptChoice[data-selected="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPromptChoice input{accent-color:var(--qcc-action)}
.qccPromptPreview{margin:14px 0 0;padding:14px;border:1px solid var(--qcc-border);border-radius:10px;background:var(--qcc-page);color:var(--qcc-text);font:inherit;font-size:13px;line-height:1.7;white-space:pre-wrap}
.qccPromptNote{padding:10px 12px;border-left:3px solid var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-secondary)!important}
.qccPromptConflict{margin-top:16px;padding:14px;border:1px solid var(--qcc-review);border-radius:10px;background:var(--qcc-review-bg);color:var(--qcc-text)}
.qccPromptConflict p{margin:5px 0 12px;font-size:13px}.qccPromptConflict>div{display:flex;justify-content:flex-end;gap:8px}
.qccPromptConflict button,.qccPromptActions button{min-height:36px;padding:0 14px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:13px;cursor:pointer}
.qccPromptConflict button.is-primary,.qccPromptActions button.is-primary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}
.qccPromptConflict button.is-primary:hover,.qccPromptActions button.is-primary:hover{border-color:var(--qcc-action-hover);background:var(--qcc-action-hover)}
.qccPromptError{margin:14px 0 0;color:var(--qcc-danger);font-size:13px}
.qccPromptActions{display:flex;justify-content:space-between;gap:10px;min-width:0;width:100%;padding:14px 22px;border-top:1px solid var(--qcc-border);background:var(--qcc-page);box-sizing:border-box;flex:none}
.qccPromptActions button:disabled{opacity:.45;cursor:not-allowed}

.qccPwShell{display:flex;flex-direction:column;width:100%;height:100%;min-height:0;background:var(--qcc-page);color:var(--qcc-text);font-size:14px}
.qccPwHeader{display:flex;align-items:center;justify-content:space-between;gap:16px;padding:16px 18px 12px;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}
.qccPwBrand{display:flex;align-items:center;gap:11px;min-width:0}.qccPwBrandIcon{display:grid;place-items:center;width:38px;height:38px;border-radius:10px;background:var(--qcc-selected);color:var(--qcc-brand);flex:none}
.qccPwBrandCopy{min-width:0}.qccPwTitleRow{display:flex;align-items:center;gap:8px}.qccPwTitle{margin:0;font-size:17px;line-height:1.3}.qccPwSubtitle{margin:3px 0 0;color:var(--qcc-secondary);font-size:11px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.qccPwLiveDot{width:7px;height:7px;border-radius:50%;background:var(--qcc-secondary)}.qccPwLiveDot[data-status="running"]{background:var(--qcc-brand);box-shadow:0 0 0 4px var(--qcc-selected)}.qccPwLiveDot[data-status="ready"]{background:var(--qcc-success)}
.qccPwMeta{display:flex;align-items:center;justify-content:flex-end;gap:8px;min-width:0}.qccPwSession{color:var(--qcc-secondary);font-size:10px}
.qccPwStatus{display:inline-flex;align-items:center;min-height:25px;padding:0 8px;border-radius:999px;background:var(--qcc-table-head);color:var(--qcc-secondary);font-size:11px;white-space:nowrap}.qccPwStatus[data-status="running"]{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStatus[data-status="ready"]{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStatus[data-status="failed"]{background:var(--qcc-danger-bg);color:var(--qcc-danger)}
.qccPwClose{display:grid;place-items:center;width:30px;height:30px;border:0;border-radius:8px;background:transparent;color:var(--qcc-secondary);font-size:22px;cursor:pointer}.qccPwClose:hover{background:var(--qcc-selected);color:var(--qcc-action)}
.qccPwTabs{display:flex;gap:22px;padding:0 18px;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}.qccPwTabs button{position:relative;min-height:39px;padding:0;border:0;background:transparent;color:var(--qcc-secondary);font:inherit;font-size:13px;cursor:pointer}.qccPwTabs button[data-selected="true"]{color:var(--qcc-action);font-weight:650}.qccPwTabs button[data-selected="true"]::after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:var(--qcc-action);content:""}
.qccPwStages{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));min-height:78px;padding:0;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);overflow:hidden;flex:none}
.qccPwStage{position:relative;display:flex;min-width:0;min-height:78px;align-items:center;justify-content:center;flex-direction:column;gap:7px;padding:9px 5px;border:0;border-right:1px solid var(--qcc-border);background:transparent;color:var(--qcc-secondary);font:inherit;text-align:center;cursor:pointer}.qccPwStage:last-child{border-right:0}.qccPwStage:hover{background:var(--qcc-page);color:var(--qcc-text)}.qccPwStage[data-selected="true"]{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStage[data-selected="true"]::after{position:absolute;right:10px;bottom:-1px;left:10px;height:3px;border-radius:3px 3px 0 0;background:var(--qcc-action);content:""}
.qccPwStageIcon{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);flex:0 0 30px}.qccPwStage[data-selected="true"] .qccPwStageIcon{background:var(--qcc-selected)}.qccPwStage[data-progress="done"] .qccPwStageIcon{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStage[data-progress="failed"] .qccPwStageIcon{background:var(--qcc-danger-bg);color:var(--qcc-danger)}
.qccPwIcon{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
.qccPwStageCopy{display:block;min-width:0;max-width:100%}.qccPwStageCopy strong{display:block;overflow:hidden;font-size:12px;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}
.qccPwBody{min-height:0;padding:16px;overflow:auto;flex:1}.qccPwPanel{display:grid;gap:13px;max-width:960px;margin:0 auto}
.qccPwPageHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.qccPwPageHeading h2{margin:1px 0 0;font-size:19px}.qccPwPageHeading p:not(.qccPwEyebrow){margin:4px 0 0;color:var(--qcc-secondary);font-size:12px;line-height:1.5}.qccPwEyebrow{margin:0;color:var(--qcc-action);font-size:10px;font-weight:750;letter-spacing:.12em}.qccPwTaskId{padding:5px 8px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);color:var(--qcc-secondary);font:11px ui-monospace,SFMono-Regular,Menlo,monospace}
.qccPwCard{padding:15px;border:1px solid var(--qcc-border);border-radius:12px;background:var(--qcc-surface)}.qccPwCardHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.qccPwCardHeader h3{margin:0;font-size:14px}.qccPwCardHeader p{margin:4px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.5}.qccPwMode{padding:3px 7px;border-radius:999px;background:var(--qcc-selected);color:var(--qcc-action);font-size:10px;white-space:nowrap}
.qccPwFeedback{display:flex;align-items:flex-start;gap:10px;padding:12px 13px;border:1px solid var(--qcc-border);border-radius:10px;background:var(--qcc-table-head)}.qccPwFeedback[data-tone="success"]{border-color:var(--qcc-success);background:var(--qcc-success-bg)}.qccPwFeedback[data-tone="error"]{border-color:var(--qcc-danger);background:var(--qcc-danger-bg)}.qccPwFeedbackIcon{color:var(--qcc-action);flex:none}.qccPwFeedback[data-tone="success"] .qccPwFeedbackIcon{color:var(--qcc-success)}.qccPwFeedback[data-tone="error"] .qccPwFeedbackIcon{color:var(--qcc-danger)}.qccPwFeedback strong{font-size:13px}.qccPwFeedback p{margin:3px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.55}
.qccPwSteps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0;padding:0;list-style:none}.qccPwStep{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-surface)}.qccPwStepDot{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:var(--qcc-page);color:var(--qcc-secondary);font-size:10px;flex:none}.qccPwStep[data-state="done"] .qccPwStepDot{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStep[data-state="running"] .qccPwStepDot{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStepCopy{display:grid;gap:3px}.qccPwStepCopy b{font-size:11px}.qccPwStepCopy small{color:var(--qcc-secondary);font-size:9px}
.qccPwDims{display:flex;flex-wrap:wrap;gap:7px}.qccPwDim{padding:5px 8px;border:1px solid var(--qcc-border);border-radius:7px;color:var(--qcc-secondary);font-size:11px}.qccPwDim[data-status="done"]{border-color:var(--qcc-success);background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwDim[data-status="running"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPwEmpty,.qccPwNote{margin:0;color:var(--qcc-secondary);font-size:12px;line-height:1.65}.qccPwNote{padding:10px 12px;border-left:3px solid var(--qcc-brand);background:var(--qcc-selected)}
.qccPwStateStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.qccPwState{padding:7px;border:1px solid var(--qcc-border);border-radius:7px;color:var(--qcc-secondary);font-size:10px;text-align:center}.qccPwState[data-hit="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action);font-weight:650}
.qccPwHypos{display:grid;gap:8px;margin:0;padding:0;list-style:none}.qccPwHypos li{display:grid;grid-template-columns:auto auto 1fr;align-items:start;gap:8px;padding:9px;border-radius:8px;background:var(--qcc-page);font-size:11px;line-height:1.55}.qccPwPri{padding:2px 5px;border-radius:5px;background:var(--qcc-table-head);color:var(--qcc-secondary)}.qccPwPri[data-p="P0"]{background:var(--qcc-danger-bg);color:var(--qcc-danger)}.qccPwPri[data-p="P1"]{background:var(--qcc-review-bg);color:var(--qcc-review)}
.qccPwRiskTiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qccPwRiskTile{padding:11px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-page)}.qccPwRiskTileTop{display:flex;justify-content:space-between;gap:8px}.qccPwRiskTileTop b,.qccPwRiskTileTop strong{font-size:12px}.qccPwRiskTile p{margin:6px 0 0;color:var(--qcc-secondary);font-size:10px;line-height:1.5}.qccPwRiskTile[data-level="红线"]:not([data-empty="true"]){border-color:var(--qcc-danger);background:var(--qcc-danger-bg)}.qccPwRiskTile[data-level="关注"]:not([data-empty="true"]){border-color:var(--qcc-review);background:var(--qcc-review-bg)}
.qccPwDeliverables{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.qccPwDeliverable{display:flex;align-items:flex-start;gap:9px;padding:9px;border-radius:8px;background:var(--qcc-page)}.qccPwDeliverable>span{color:var(--qcc-action);font-weight:700}.qccPwDeliverable div{display:grid;gap:3px}.qccPwDeliverable b{font-size:11px}.qccPwDeliverable small{color:var(--qcc-secondary);font-size:9px;line-height:1.45}
.qccPwCoverage{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qccPwMetric{display:grid;gap:4px;padding:12px;border-radius:9px;background:var(--qcc-table-head);text-align:center}.qccPwMetric strong{color:var(--qcc-action);font-size:19px}.qccPwMetric span{color:var(--qcc-secondary);font-size:10px}
.qccPwScopeList{display:grid;gap:0;margin:0}.qccPwScopeList>div{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--qcc-border)}.qccPwScopeList>div:last-child{border-bottom:0}.qccPwScopeList dt{color:var(--qcc-secondary);font-size:12px}.qccPwScopeList dd{margin:0;color:var(--qcc-text);font-size:12px}
.qccPwPrompt{max-height:220px;margin:0;padding:11px;border-radius:8px;background:var(--qcc-page);color:var(--qcc-secondary);font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}
.qccPwFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px;border-top:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}.qccPwFooterHint{min-width:0;color:var(--qcc-secondary);font-size:10px}.qccPwFooterHint[data-tone="error"]{color:var(--qcc-danger)}.qccPwFooterActions{display:flex;gap:8px;flex:none}.qccPwPrimary,.qccPwSecondary{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 13px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:12px;cursor:pointer}.qccPwPrimary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}.qccPwPrimary:hover{border-color:var(--qcc-action-hover);background:var(--qcc-action-hover)}.qccPwSecondary:hover{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPwReportCard{padding:0;overflow:hidden}.qccPwReportFrame{display:block;width:100%;min-height:480px;border:0;background:#fff}

.qccDockBody{display:grid;gap:12px}.qccDockRow{display:grid;grid-template-columns:68px 1fr;align-items:start;gap:10px}.qccDockLabel{padding-top:7px;color:var(--qcc-secondary);font-size:12px}.qccDockCompany{width:100%;min-height:38px;padding:8px 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:16px;box-sizing:border-box}.qccDockChips{display:flex;flex-wrap:wrap;gap:7px}.qccDockChip{min-height:32px;padding:0 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:11px;cursor:pointer}.qccDockChip[data-selected="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}.qccDockFoot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px}.qccDockHint{color:var(--qcc-secondary);font-size:10px;line-height:1.45}.qccDockHint[data-tone="error"]{color:var(--qcc-danger)}.qccDockActions{display:flex;gap:7px;flex:none}.qccDockBtn{min-height:34px;padding:0 11px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:11px;cursor:pointer}.qccDockPrimary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}

@media(max-width:760px){
  .qccPrevisitCapabilities{justify-content:flex-start;padding-inline:12px}.qccPrevisitCapability{min-width:92px;padding-inline:10px}
  .qccPromptBackdrop{padding:0;overflow:hidden}.qccPromptPanel{width:100%;max-width:100vw;max-height:100dvh;height:100dvh;border:0;border-radius:0}.qccPromptHead,.qccPromptBody,.qccPromptActions{min-width:0;width:100%;padding-inline:16px;box-sizing:border-box}.qccPromptHead>div{min-width:0}.qccPromptChoices{grid-template-columns:repeat(2,minmax(0,1fr))}.qccPromptSteps button{justify-content:center}.qccPromptSteps button span{display:none}
  .qccPwHeader{align-items:flex-start}.qccPwSession{display:none}.qccPwStage{min-height:66px;gap:5px;padding:7px 3px}.qccPwStageIcon{width:25px;height:25px;flex-basis:25px}.qccPwStageCopy strong{font-size:10px}.qccPwStage[data-selected="true"]::after{right:6px;left:6px}.qccPwBody{padding:12px}.qccPwSteps{grid-template-columns:repeat(2,1fr)}.qccPwFooter{align-items:flex-end}.qccPwFooterHint{display:none}.qccPwDeliverables{grid-template-columns:1fr}.qccDockRow{grid-template-columns:1fr}.qccDockLabel{padding:0}.qccDockFoot{align-items:stretch;flex-direction:column}.qccDockActions{justify-content:flex-end}
}
@media(max-width:430px){.qccPromptChoices{grid-template-columns:1fr}.qccPwRiskTiles,.qccPwCoverage,.qccPwStateStrip{grid-template-columns:repeat(2,1fr)}.qccPwSubtitle{max-width:190px}}
@media(prefers-reduced-motion:reduce){.qccPwShell *,.qccPromptPanel *,.qccPrevisitCapabilities *{animation:none!important;transition:none!important}}
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
var import_jsx_runtime6 = require("react/jsx-runtime");
var inject = ["slots", "sessions", "workspaces", "conversation", "betterSidebar"];
var STYLE_ID = "dsh-pre-duediligence-workbench";
var PHASE_LABELS = {
  target: "\u5BF9\u8C61\u4E0E\u76EE\u6807",
  scope: "\u8303\u56F4\u786E\u8BA4",
  collect: "\u8D44\u6599\u91C7\u96C6",
  verify: "\u8BC1\u636E\u6838\u9A8C",
  output: "\u6750\u6599\u8F93\u51FA"
};
var STATUS_LABELS = {
  empty: "\u5F85\u8BBE\u5B9A",
  "waiting-agent": "\u7B49\u5F85\u786E\u8BA4 / \u7EE7\u7EED",
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
    target: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "m15 15 4 4M10.5 7.5v6M7.5 10.5h6" })
    ] }),
    scope: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M5 4h14v16H5z" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M8 8h8M8 12h8M8 16h5" })
    ] }),
    collect: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_jsx_runtime6.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" }) }),
    verify: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M12 8v5M12 17h.01" })
    ] }),
    output: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M6 3h8l4 4v14H6z" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M14 3v5h5M9 13h6M9 17h6" })
    ] }),
    clock: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    check: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "m8 12 2.5 2.5L16 9" })
    ] }),
    warning: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M12 3 2.8 20h18.4z" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M12 9v4M12 17h.01" })
    ] }),
    history: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M12 7v5l3 2" })
    ] })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { className: "qccPwIcon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] });
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwFeedback", "data-tone": props.tone, role: props.tone === "error" ? "alert" : "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwFeedbackIcon", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: icon }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: props.title }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: props.children })
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEyebrow", children: "TARGET" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: "\u5BF9\u8C61\u4E0E\u76EE\u6807" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u786E\u8BA4\u62DC\u8BBF\u4E3B\u4F53\u3001\u89D2\u8272\u4E0E\u76EE\u6807\uFF1B\u524D\u7AEF\u4E0D\u9884\u8BBE\u4E1A\u52A1\u7ED3\u8BBA\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCard qccPwSetupCard", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PrevisitFields, { actions, idPrefix: `qccPw-${props.sessionId}` }) }),
    props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u5DF2\u53D1\u9001\u7684\u4EFB\u52A1" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("pre", { className: "qccPwPrompt", children: props.task.prompt })
    ] })
  ] });
}
var optionLabel = (options, id) => id === void 0 ? "\u672A\u9009\u62E9" : options.find((option) => option.id === id)?.label ?? "\u672A\u9009\u62E9";
function ScopePanel(props) {
  const focus = props.state.selection.focus.map((id) => optionLabel(FOCUS_OPTIONS, id)).join("\u3001") || "\u6309 Skill \u6807\u51C6\u8303\u56F4";
  const rows = [
    ["\u62DC\u8BBF\u5BF9\u8C61", props.state.company.trim() || "\u5C1A\u672A\u586B\u5199"],
    ["\u6211\u7684\u89D2\u8272", optionLabel(ROLE_OPTIONS, props.state.selection.role)],
    ["\u62DC\u8BBF\u573A\u666F", optionLabel(PURPOSE_OPTIONS, props.state.selection.purpose)],
    ["\u91CD\u70B9\u5173\u6CE8", focus],
    ["\u5C3D\u8C03\u6DF1\u5EA6", optionLabel(BUDGET_OPTIONS, props.state.selection.budget)],
    ["\u8F93\u51FA\u5F62\u6001", optionLabel(OUTPUT_OPTIONS, props.state.selection.output)]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(StagePanel, { eyebrow: "SCOPE", title: "\u8303\u56F4\u786E\u8BA4", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "notice", title: "\u8303\u56F4\u662F\u6267\u884C\u610F\u56FE\uFF0C\u4E0D\u662F\u5B8C\u6210\u8BC1\u660E", children: "\u5B9E\u9645\u8986\u76D6\u4EE5\u5F53\u524D\u4F1A\u8BDD\u7684\u4F01\u67E5\u67E5 MCP \u8C03\u7528\u3001\u5931\u8D25\u8BB0\u5F55\u53CA\u62A5\u544A\u8986\u76D6\u8BF4\u660E\u4E3A\u51C6\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u672C\u6B21\u8BBE\u5B9A" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u9700\u8981\u8C03\u6574\u65F6\u8FD4\u56DE\u300C\u5BF9\u8C61\u4E0E\u76EE\u6807\u300D\uFF0C\u6216\u4F7F\u7528\u8F93\u5165\u6846\u5DE6\u4E0A\u89D2\u7684\u63D0\u793A\u8BCD\u751F\u6210\u5668\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dl", { className: "qccPwScopeList", children: rows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("dd", { children: value })
      ] }, label)) })
    ] })
  ] });
}
function Steps(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ol", { className: "qccPwSteps", children: props.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { className: "qccPwStep", "data-state": step.state, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwStepDot", children: step.state === "done" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: "check" }) : index + 1 }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "qccPwStepCopy", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("b", { children: step.label }),
      step.note === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: step.note })
    ] })
  ] }, step.label)) });
}
function Dimensions(props) {
  const done = props.items.filter((d) => d.status === "done").length;
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCardHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: props.title }) }),
      done === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "qccPwMode", children: [
        done,
        " \u9879"
      ] })
    ] }),
    props.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEmpty", children: props.empty }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwDims", children: props.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwDim", "data-status": item.status, children: item.label }, item.label)) })
  ] });
}
function StagePanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEyebrow", children: props.eyebrow }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: props.title })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(StagePanel, { eyebrow: "COLLECT", title: "\u8D44\u6599\u91C7\u96C6", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Steps, { steps }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Dimensions, { title: "\u5DF2\u53D6\u5F97", items: dims, empty: running ? "\u6B63\u5728\u5EFA\u7ACB\u4E3B\u4F53\u4E0E\u4FE1\u53F7\u96C6\u2026" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A\u53D6\u5F97\u7684\u7EF4\u5EA6" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u7ECF\u8425\u72B6\u6001" }) }),
        insights.confidence === null ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "qccPwMode", children: [
          "\u7F6E\u4FE1\u5EA6 ",
          insights.confidence
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwStateStrip", "data-concluded": concluded, children: BUSINESS_STATES.map((state) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwState", "data-hit": insights.state === state, children: state }, state)) }),
      insights.stateUndetermined ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwNote", children: "\u72B6\u6001\u672A\u5B9A\uFF1A\u516C\u5F00\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u672C\u6B21\u964D\u7EA7\u4E3A\u6E05\u5355\u5F0F\u7B80\u62A5\u3002" }) : null,
      insights.industryLink === null ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("p", { className: "qccPwNote", children: [
        "\u4EA7\u4E1A\u94FE\u73AF\u8282\uFF1A",
        insights.industryLink
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u4E1A\u52A1\u5047\u8BBE" }) }),
        insights.hypotheses.length === 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "qccPwMode", children: [
          insights.hypotheses.length,
          " \u6761"
        ] })
      ] }),
      insights.hypotheses.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEmpty", children: finished ? insights.stateUndetermined ? "\u72B6\u6001\u672A\u5B9A\uFF0C\u672A\u751F\u6210\u5047\u8BBE\uFF1B\u76F8\u5173\u672A\u77E5\u5DF2\u8F6C\u5165\u73B0\u573A\u5FC5\u95EE" : insights.found ? "\u62A5\u544A\u4E2D\u672A\u8BC6\u522B\u51FA\u5047\u8BBE" : "\u62A5\u544A\u672A\u6355\u83B7" : running ? "\u72B6\u6001\u5224\u5B9A\u540E\u751F\u6210" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("ol", { className: "qccPwHypos", children: insights.hypotheses.map((h) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("li", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwPri", "data-p": h.priority, children: h.priority }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("b", { children: h.id }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: h.text })
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(StagePanel, { eyebrow: "VERIFY", title: "\u8BC1\u636E\u6838\u9A8C", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Steps, { steps }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Dimensions, { title: "\u5DF2\u6838\u67E5", items: dims, empty: running ? "\u7B49\u5F85\u98CE\u9669\u626B\u63CF\u2026" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A\u6838\u67E5\u7684\u7EF4\u5EA6" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u98CE\u9669\u5206\u7EA7" }) }) }),
      !judged ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEmpty", children: running ? "\u626B\u63CF\u4E0E\u4E0B\u94BB\u540E\u7ED9\u51FA\u5206\u7EA7" : finished ? "\u62A5\u544A\u672A\u6355\u83B7" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A" }) : insights.riskNoRecord && insights.risks.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwNote", children: "\u4F01\u4E1A\u81EA\u8EAB\u98CE\u9669\u626B\u63CF\u672A\u53D1\u73B0\u516C\u5F00\u8BB0\u5F55\uFF1B\u8FD9\u4E0D\u7B49\u4E8E\u4E0D\u5B58\u5728\u5176\u4ED6\u98CE\u9669\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwRiskTiles", children: ["\u7EA2\u7EBF", "\u5173\u6CE8", "\u4FE1\u606F"].map((level) => {
        const items = real(level);
        return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwRiskTile", "data-level": level, "data-empty": items.length === 0, children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwRiskTileTop", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("b", { children: level }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: items.length })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: items[0]?.text ?? "\u672C\u6B21\u672A\u53D1\u73B0" })
        ] }, level);
      }) })
    ] })
  ] });
}
function ReportViewer(props) {
  const ref = (0, import_react6.useRef)(null);
  const fit = () => {
    const el = ref.current;
    const h = el?.contentDocument?.documentElement?.scrollHeight;
    if (el !== null && h !== void 0 && h > 0) el.style.height = `${h + 8}px`;
  };
  (0, import_react6.useEffect)(() => {
    fit();
  }, [props.html]);
  const embedded = props.html.replace("</head>", "<style>body{background:#fff}.sheet{margin:0;border:0;border-radius:0;box-shadow:none}.hero{padding:18px 20px 16px}.body{padding:6px 20px 20px}</style></head>");
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("iframe", { ref, className: "qccPwReportFrame", title: "\u5C3D\u8C03\u62A5\u544A", sandbox: "allow-same-origin", srcDoc: embedded, onLoad: fit });
}
function DeliveryPanel(props) {
  const ready = props.status === "ready";
  if (props.reportHtml !== null) {
    return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qccPwPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "qccPwPageHeading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEyebrow", children: "OUTPUT" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: "\u8BBF\u524D\u6750\u6599" })
        ] }),
        props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCard qccPwReportCard", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ReportViewer, { html: props.reportHtml }) })
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
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEyebrow", children: "OUTPUT" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: "\u8BBF\u524D\u6750\u6599" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u4E0D\u662F\u8D44\u6599\u5806\u780C\uFF0C\u53EA\u56DE\u7B54\u56DB\u4EF6\u4E8B\uFF1A\u53BB\u4E0D\u53BB\u3001\u89C1\u8C01\u3001\u804A\u4EC0\u4E48\u3001\u4EC0\u4E48\u4E0D\u80FD\u78B0\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    props.task === void 0 ? props.cardCaptured ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "success", title: "\u62A5\u544A\u53EF\u4E0B\u8F7D", children: "\u5F53\u524D\u4F1A\u8BDD\u4E2D\u5DF2\u6709\u5C3D\u8C03\u62A5\u544A\uFF0C\u53EF\u76F4\u63A5\u4E0B\u8F7D\uFF1B\u65B0\u7684\u5C3D\u8C03\u5C06\u91CD\u65B0\u8BA1\u6570\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "notice", title: "\u7B49\u5F85\u8BBE\u5B9A", children: "\u5B8C\u6210\u5C3D\u8C03\u8BBE\u5B9A\u540E\uFF0C\u62A5\u544A\u7ED3\u6784\u4E0E\u6267\u884C\u8FDB\u5EA6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" }) : ready ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "success", title: "\u62A5\u544A\u5DF2\u751F\u6210", children: "\u6267\u884C\u5DF2\u7ED3\u675F\u3002\u53EF\u4E0B\u8F7D\u62A5\u544A\uFF0C\u6216\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u4E0E\u4E8B\u5B9E\u5F15\u7528\u3002" }) : props.status === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "error", title: "\u672C\u6B21\u5C3D\u8C03\u672A\u5B8C\u6574\u5B8C\u6210", children: "\u8BF7\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u9519\u8BEF\uFF1B\u5DF2\u53D6\u5F97\u4E8B\u5B9E\u4ECD\u53EF\u4FDD\u7559\uFF0C\u5931\u8D25\u7EF4\u5EA6\u4E0D\u5F97\u5199\u6210\u96F6\u8BB0\u5F55\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "notice", title: props.status === "running" ? "\u6B63\u5728\u751F\u6210\u62A5\u544A" : "\u7B49\u5F85\u5F00\u59CB", children: props.status === "running" && !props.cardCaptured ? "\u4F1A\u8BDD\u82E5\u505C\u5728\u5019\u9009\u4E3B\u4F53\u786E\u8BA4\uFF0C\u8BF7\u5148\u5728\u4F1A\u8BDD\u4E2D\u9009\u5B9A\u4F01\u4E1A\uFF1B\u62A5\u544A\u751F\u6210\u540E\u300C\u4E0B\u8F7D\u62A5\u544A\u300D\u624D\u53EF\u70B9\u3002" : "\u5B8C\u6210\u7ECF\u8425\u4E0E\u98CE\u9669\u4E24\u6761\u7EBF\u540E\uFF0C\u5C06\u81EA\u52A8\u5207\u6362\u5230\u672C\u9875\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u62A5\u544A\u7ED3\u6784" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u56FA\u5B9A\u516B\u6BB5\uFF0C\u53EF\u538B\u7F29\u6216\u5C55\u5F00\uFF1B\u4E8B\u5B9E\u3001\u63A8\u7406\u3001\u95EE\u9898\u548C\u8986\u76D6\u8FB9\u754C\u4E0D\u6DF7\u5199\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwDeliverables", children: deliverables.map(([number, title, detail]) => /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwDeliverable", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: number }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("b", { children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("small", { children: detail })
        ] })
      ] }, number)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: "\u6267\u884C\u8986\u76D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u8FD9\u662F\u5DE5\u4F5C\u53F0\u4ECE\u5F53\u524D Session \u8BFB\u53D6\u7684\u771F\u5B9E\u6267\u884C\u4E8B\u4EF6\uFF0C\u4E0D\u662F\u5B8C\u6574\u6027\u8BC4\u5206\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCoverage", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: props.toolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u5DF2\u8BC6\u522B\u5DE5\u5177\u8C03\u7528" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: props.failedToolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u5DE5\u5177\u9519\u8BEF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: ready ? "5/5" : "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u4E1A\u52A1\u9636\u6BB5" })
        ] })
      ] })
    ] })
  ] });
}
function HistoryPanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("header", { className: "qccPwPageHeading", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwEyebrow", children: "HISTORY" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h2", { children: "\u4EFB\u52A1\u5386\u53F2" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: "\u5F53\u524D\u4F1A\u8BDD\u7684\u5B8C\u6574\u6D88\u606F\u3001\u8BC1\u636E\u5F15\u7528\u4E0E\u62A5\u544A\u7531 DSH \u539F\u751F\u4F1A\u8BDD\u4FDD\u5B58\u3002" })
    ] }) }),
    props.task === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Feedback, { tone: "notice", title: "\u5F53\u524D\u6CA1\u6709\u5DF2\u8BA4\u9886\u4EFB\u52A1", children: "\u4ECE\u63D0\u793A\u8BCD\u751F\u6210\u5668\u56DE\u586B\u5E76\u53D1\u9001\uFF0C\u6216\u5728\u4F1A\u8BDD\u4E2D\u76F4\u63A5\u53D1\u8D77\u8BBF\u524D\u5C3D\u8C03\u540E\uFF0C\u8FD9\u91CC\u4F1A\u663E\u793A\u5F53\u524D\u4EFB\u52A1\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h3", { children: props.task.id }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { children: new Date(props.task.createdAt).toLocaleString("zh-CN") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwStatus", "data-status": props.status, children: STATUS_LABELS[props.status] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("pre", { className: "qccPwPrompt", children: props.task.prompt })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwNote", children: "\u5DE5\u4F5C\u53F0\u4E0D\u521B\u5EFA\u8131\u79BB\u4F1A\u8BDD\u7684\u6D4F\u89C8\u5668\u5386\u53F2\u5E93\uFF0C\u4E5F\u4E0D\u4F1A\u628A\u5176\u5B83 Session \u7684\u4EFB\u52A1\u5408\u5E76\u5230\u8FD9\u91CC\u3002" })
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
  const shared = (0, import_react6.useSyncExternalStore)(props.shared.subscribe, () => props.shared.get(sessionId));
  const task = shared.task;
  const setTask = (fn) => props.shared.update(sessionId, (s) => ({ ...s, task: fn(s.task) }));
  const phase = shared.view === "history" ? "target" : shared.view;
  const setView = (view) => props.shared.update(sessionId, (state) => ({ ...state, view }));
  const setPhase = (next) => setView(next);
  const [runtime, setRuntime] = (0, import_react6.useState)(EMPTY_RUNTIME);
  const [completedTaskId, setCompletedTaskId] = (0, import_react6.useState)();
  const [cardText, setCardText] = (0, import_react6.useState)(null);
  const [renderedCard, setRenderedCard] = (0, import_react6.useState)(null);
  const [downloadNote, setDownloadNote] = (0, import_react6.useState)();
  useWorkbenchReveal(props.reveal, props);
  (0, import_react6.useEffect)(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session;
    if (face === void 0) {
      return;
    }
    const refresh = () => {
      const snapshot = face.getSnapshot();
      if (task === void 0) {
        const adopted = adoptTaskFromSnapshot(snapshot);
        if (adopted !== null && !shared.dismissedTaskIds.includes(adopted.id)) {
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
      const captured = extractCardText(snapshot, task?.nodeBaseline ?? 0);
      setCardText(captured);
      setRenderedCard(captured === null ? extractCardFromDom() : null);
    };
    refresh();
    return face.subscribe?.(refresh);
  }, [props.ctx, sessionId, task?.id, task?.nodeBaseline, shared.dismissedTaskIds.join("|")]);
  const progressInput = {
    hasTask: task !== void 0,
    running: runtime.running,
    seenRunning: task?.seenRunning ?? false,
    lastAgentError: runtime.lastAgentError,
    partial: runtime.partial,
    toolNames: runtime.toolNames,
    reportReady: cardText !== null || renderedCard !== null
  };
  const status = deriveWorkbenchStatus(progressInput);
  const phaseStates = derivePhaseStates(progressInput);
  const insights = (0, import_react6.useMemo)(() => parseCardInsights(cardText), [cardText]);
  const reportHtml = (0, import_react6.useMemo)(() => {
    if (cardText !== null) return buildPrevisitReportHtml(cardText);
    return renderedCard === null ? null : buildPrevisitReportFromRenderedHtml(renderedCard.html, renderedCard.text);
  }, [cardText, renderedCard, status, phase, runtime.toolEvents.length]);
  (0, import_react6.useEffect)(() => {
    if (status !== "ready" || task === void 0 || completedTaskId === task.id) {
      return;
    }
    setCompletedTaskId(task.id);
    if (shared.view !== "history") setPhase("output");
  }, [completedTaskId, status, task, shared.view]);
  const newTask = () => {
    props.shared.update(sessionId, (state) => ({
      ...state,
      task: void 0,
      view: "target",
      dismissedTaskIds: state.task === void 0 ? state.dismissedTaskIds : [.../* @__PURE__ */ new Set([...state.dismissedTaskIds, state.task.id])]
    }));
    setRuntime(EMPTY_RUNTIME);
    setCardText(null);
    setRenderedCard(null);
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
      const dom = renderedCard ?? extractCardFromDom();
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
  if (!props.visible) return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(import_jsx_runtime6.Fragment, {});
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("section", { className: "qccPwShell", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", "data-status": status, children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("header", { className: "qccPwHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwBrand", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwBrandIcon", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PrevisitLogo, { size: 24 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwBrandCopy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwTitleRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("h1", { className: "qccPwTitle", children: "\u8BBF\u524D\u5C3D\u8C03" }),
            /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwLiveDot", "data-status": status })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("p", { className: "qccPwSubtitle", children: "\u4F01\u67E5\u67E5\u4E8B\u5B9E\u9A71\u52A8 \xB7 \u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwMeta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwStatus", "data-status": status, children: STATUS_LABELS[status] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("span", { className: "qccPwSession", children: [
          "\u5F53\u524D Session \xB7 ",
          sessionId.slice(0, 12)
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "qccPwClose", "aria-label": "\u5173\u95ED\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", title: "\u5173\u95ED\u5DE5\u4F5C\u53F0\uFF08\u4E0D\u4F1A\u53D6\u6D88\u4EFB\u52A1\uFF09", onClick: returnToConversation, children: "\xD7" })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("nav", { className: "qccPwTabs", "aria-label": "\u5DE5\u4F5C\u53F0\u89C6\u56FE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "data-selected": shared.view !== "history", onClick: () => setView("target"), children: "\u5F53\u524D\u4EFB\u52A1" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", "data-selected": shared.view === "history", onClick: () => setView("history"), children: "\u4EFB\u52A1\u5386\u53F2" })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("nav", { className: "qccPwStages", "aria-label": "\u8BBF\u524D\u4EFB\u52A1\u9636\u6BB5", role: "tablist", children: PREVISIT_PHASES.map((current) => {
      const phaseState = phaseStates.find((item) => item.id === current);
      const selected = shared.view === current;
      return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", role: "tab", "aria-selected": selected, className: "qccPwStage", "data-selected": selected, "data-progress": phaseState?.progress ?? "idle", onClick: () => setPhase(current), children: [
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwStageIcon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(Icon, { name: current }) }),
        /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwStageCopy", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("strong", { children: PHASE_LABELS[current] }) })
      ] }, current);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwBody", children: [
      shared.view === "target" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(SetupPanel, { sessionId, store: props.shared, task, start: (prompt) => props.startPrompt(sessionId, prompt), onStarted: () => setPhase("collect") }) : null,
      shared.view === "scope" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(ScopePanel, { state: shared, task }) : null,
      shared.view === "collect" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(OpportunityPanel, { task, status, events: runtime.toolEvents, insights }) : null,
      shared.view === "verify" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(RiskPanel, { task, status, events: runtime.toolEvents, insights }) : null,
      shared.view === "output" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(DeliveryPanel, { task, status, toolCount: runtime.toolNames.length, failedToolCount: runtime.failedToolCount, cardCaptured: cardText !== null || renderedCard !== null, reportHtml }) : null,
      shared.view === "history" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(HistoryPanel, { task, status }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("footer", { className: "qccPwFooter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { className: "qccPwFooterHint", "data-tone": downloadNote === void 0 ? void 0 : "error", children: downloadNote !== void 0 ? downloadNote : shared.view === "target" ? "" : "\u5DE5\u4F5C\u53F0\u7ED1\u5B9A\u5F53\u524D\u4F1A\u8BDD\uFF0C\u5173\u95ED\u53EA\u9690\u85CF\u754C\u9762\uFF0C\u4E0D\u4F1A\u53D6\u6D88\u6B63\u5728\u6267\u884C\u7684\u4EFB\u52A1\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("div", { className: "qccPwFooterActions", children: [
        shared.view !== "target" && task !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: newTask, children: "\u65B0\u7684\u5C3D\u8C03" }) : null,
        shared.view === "output" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "qccPwPrimary", title: "\u4E0B\u8F7D\u4E3A HTML \u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u6253\u5F00\u6216\u6253\u5370", onClick: downloadReport, children: [
          "\u4E0B\u8F7D\u62A5\u544A",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u2193" })
        ] }) : shared.view !== "target" ? /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "qccPwPrimary", onClick: returnToConversation, children: [
          "\u8FD4\u56DE\u4F1A\u8BDD",
          /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: "\u2192" })
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
  const reveal = createRevealController();
  const startPrompt = async (sessionId, prompt) => {
    const conversation = ctx.sessions.scope?.(sessionId)?.get("conversation");
    if (conversation === void 0) throw new Error("conversation unavailable");
    const baseline = ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? 0;
    await conversation.send(prompt);
    return baseline;
  };
  const openForSession = (sessionId, view) => {
    if (view !== void 0) shared.update(sessionId, (state) => ({ ...state, view }));
    openWorkbench(service, { sessionId }, reveal);
  };
  ctx.effect(() => installStyles(), "dsh-pre-duediligence: QCC blue UI styles");
  ctx.effect(
    () => registerWorkbenchTab(service, (props) => /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(PrevisitWorkbenchTab, { ...props, ctx, shared, reveal, startPrompt })),
    "dsh-pre-duediligence: hidden workbench tab"
  );
  registerLeftSidebarLauncher(ctx, service);
  ctx.slots.inject("conversation.input.dock", () => ctx.slots.register({
    name: "conversation.input.dock",
    id: "dsh-pre-duediligence:home",
    order: 110,
    inject: (sessionId) => ({
      openWorkbench: (view) => {
        openForSession(sessionId, view);
      }
    })
  }, PrevisitHome));
  ctx.slots.inject("conversation.input.overlay", () => ctx.slots.register({
    name: "conversation.input.overlay",
    id: "dsh-pre-duediligence:prompt-generator",
    order: 110,
    inject: () => ({ store: shared })
  }, PrevisitPromptGenerator));
}

    return module.exports;
  }
});
