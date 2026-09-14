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

// src/image-bridge.ts
var IMAGE_ROUTE = "/previsit/api/images/commands";
var IMAGE_ACCEPT = ["image/png", "image/jpeg", "image/webp", "application/pdf"];
var MAX_BYTES = 8 * 1024 * 1024;
function isImportable(file) {
  return file !== null && file !== void 0 && IMAGE_ACCEPT.includes(file.type);
}
function importableFile(transfer) {
  if (!transfer) return void 0;
  for (const item of Array.from(transfer.items ?? [])) {
    if (item.kind === "file" && IMAGE_ACCEPT.includes(item.type)) {
      const f = item.getAsFile();
      if (f) return f;
    }
  }
  return Array.from(transfer.files ?? []).find(isImportable);
}
async function toBase64(file) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 32768) binary += String.fromCharCode(...bytes.subarray(offset, offset + 32768));
  return btoa(binary);
}
async function requestCommand(path, method, body) {
  const init = { method, credentials: "same-origin" };
  if (body !== void 0) {
    init.headers = { "content-type": "application/json" };
    init.body = JSON.stringify(body);
  }
  const res = await fetch(path, init);
  const payload = await res.json().catch(() => ({}));
  if (!res.ok || payload.ok === false) throw new Error(payload.message ?? `\u5BBF\u4E3B\u8BF7\u6C42\u5931\u8D25\uFF08${res.status}\uFF09`);
  return payload.command;
}
async function stageAndSend(file, sessionId, send) {
  if (!isImportable(file)) throw new Error("\u4EC5\u652F\u6301 PNG\u3001JPEG\u3001WebP \u56FE\u7247\u6216 PDF\u3002");
  if (file.size > MAX_BYTES) throw new Error("\u6587\u4EF6\u4E0D\u80FD\u8D85\u8FC7 8 MiB\u3002");
  const staged = await requestCommand(`${IMAGE_ROUTE}?sessionId=${encodeURIComponent(sessionId)}`, "POST", { fileName: file.name, mimeType: file.type, content: await toBase64(file) });
  if (staged.prompt === void 0) throw new Error("\u5BBF\u4E3B\u6CA1\u6709\u8FD4\u56DE\u8BC6\u522B\u8BF4\u660E");
  await send(staged.prompt);
  return staged;
}
var OURS = ".qccPwShell, .qccDock, .qccPromptPanel";
var COMPOSER = '[data-composer-card], [data-composer-seat], textarea, [contenteditable="true"], [role="textbox"]';
function shouldIntercept(target, mode, viewport) {
  const el = target;
  if (el === null || el === void 0 || typeof el.closest !== "function") return mode === "drop";
  if (el.closest(OURS)) return false;
  if (el.closest(COMPOSER)) return true;
  const tag = String(el.tagName ?? "").toUpperCase();
  if (tag === "BODY" || tag === "HTML") return true;
  if (mode !== "drop" || typeof el.getBoundingClientRect !== "function") return false;
  const size = viewport ?? (typeof window === "undefined" ? void 0 : { width: window.innerWidth, height: window.innerHeight });
  if (size === void 0 || size.width === 0 || size.height === 0) return false;
  const rect = el.getBoundingClientRect();
  return rect.width >= size.width * 0.8 && rect.height >= size.height * 0.8;
}
function composerImageHandler(bridge) {
  let busy = false;
  return (event, transfer, mode = "drop") => {
    const sessionId = bridge.currentSessionId();
    if (sessionId === void 0 || !bridge.owned(sessionId) || !shouldIntercept(event.target, mode)) return false;
    const file = importableFile(transfer);
    if (file === void 0) return false;
    event.preventDefault();
    event.stopImmediatePropagation?.();
    if (busy) {
      bridge.onError?.(sessionId, "\u6B63\u5728\u5BFC\u5165\u4E0A\u4E00\u4EFD\u6587\u4EF6\uFF0C\u8BF7\u7A0D\u540E\u518D\u8BD5\u3002");
      return true;
    }
    busy = true;
    stageAndSend(file, sessionId, (prompt) => bridge.send(sessionId, prompt)).then((staged) => bridge.onStaged?.(sessionId, staged)).catch((cause) => bridge.onError?.(sessionId, cause instanceof Error ? cause.message : "\u5BFC\u5165\u5931\u8D25")).finally(() => {
      busy = false;
    });
    return true;
  };
}
function installComposerImageBridge(bridge) {
  if (typeof window === "undefined") return () => {
  };
  const handle = composerImageHandler(bridge);
  const root = document.documentElement;
  let hintDepth = 0;
  const showHint = (on) => {
    if (on) root.setAttribute("data-qcc-drop", "1");
    else {
      hintDepth = 0;
      root.removeAttribute("data-qcc-drop");
    }
  };
  const takes = (event, transfer) => {
    const sessionId = bridge.currentSessionId();
    if (sessionId === void 0 || !bridge.owned(sessionId) || !shouldIntercept(event.target, "drop")) return false;
    return (transfer?.types ?? []).includes("Files");
  };
  const onDrop = (event) => {
    showHint(false);
    handle(event, event.dataTransfer, "drop");
  };
  const onPaste = (event) => {
    handle(event, event.clipboardData, "paste");
  };
  const onDragOver = (event) => {
    if (takes(event, event.dataTransfer)) {
      event.preventDefault();
      showHint(true);
    }
  };
  const onDragEnter = (event) => {
    if (takes(event, event.dataTransfer)) {
      hintDepth += 1;
      showHint(true);
    }
  };
  const onDragLeave = () => {
    hintDepth -= 1;
    if (hintDepth <= 0) showHint(false);
  };
  const onDragEnd = () => showHint(false);
  window.addEventListener("drop", onDrop, true);
  window.addEventListener("paste", onPaste, true);
  window.addEventListener("dragover", onDragOver, true);
  window.addEventListener("dragenter", onDragEnter, true);
  window.addEventListener("dragleave", onDragLeave, true);
  window.addEventListener("dragend", onDragEnd, true);
  return () => {
    showHint(false);
    window.removeEventListener("drop", onDrop, true);
    window.removeEventListener("paste", onPaste, true);
    window.removeEventListener("dragover", onDragOver, true);
    window.removeEventListener("dragenter", onDragEnter, true);
    window.removeEventListener("dragleave", onDragLeave, true);
    window.removeEventListener("dragend", onDragEnd, true);
  };
}

// src/plan-card.tsx
var import_react = require("react");

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
var EMPTY_SELECTION = {
  role: "bank_rm",
  focus: FOCUS_OPTIONS.map((option) => option.id),
  budget: "fast",
  output: "onepager"
};
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
    "\u8BF7\u4F7F\u7528 qcc-previsit-onepager Skill \u6267\u884C\uFF1B\u8C03\u7528 previsit_begin \u65F6\u5C06\u4E0A\u8FF0 ID \u539F\u6837\u4F5C\u4E3A requestId\uFF0C\u5B8C\u6210\u540E\u901A\u8FC7 previsit_finalize \u4FDD\u5B58\u62A5\u544A\u5E76\u56DE\u5199\u5B8C\u6210\u6807\u8BB0\u3002"
  ].join("\n");
}

// src/previsit-session.ts
var PREVISIT_SESSION_ID_PREFIX = "session-dsh-pre-duediligence-";
function isPrevisitSession(sessionId) {
  return /^session-dsh-pre-duediligence-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(sessionId);
}
function resolvePrevisitWorkspaceId(ctx) {
  const workspace = ctx.workspaces?.list?.getSnapshot();
  const current = ctx.sessions.list?.getSnapshot().current;
  const items = workspace?.items ?? [];
  return items.find((item) => current !== void 0 && item.sessionIds?.includes(current))?.workspaceId ?? items.find((item) => item.workspaceId === workspace?.recentWorkspaceId)?.workspaceId ?? items[0]?.workspaceId;
}
async function createPrevisitSession(ctx) {
  const workspaceId = resolvePrevisitWorkspaceId(ctx);
  if (!workspaceId) throw new Error("\u8BF7\u5148\u9009\u62E9\u4E00\u4E2A\u5DE5\u4F5C\u7A7A\u95F4\uFF0C\u518D\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03");
  if (typeof ctx.sessions.create !== "function" || typeof ctx.sessions.open !== "function") {
    throw new Error("\u5F53\u524D DSH \u7248\u672C\u6CA1\u6709\u53EF\u7528\u7684\u4F1A\u8BDD\u521B\u5EFA\u80FD\u529B");
  }
  if (typeof globalThis.crypto?.randomUUID !== "function") {
    throw new Error("\u5F53\u524D\u6D4F\u89C8\u5668\u4E0D\u652F\u6301\u5B89\u5168\u4F1A\u8BDD\u6807\u8BC6\u751F\u6210\uFF0C\u8BF7\u4F7F\u7528\u6700\u65B0\u7248\u6D4F\u89C8\u5668");
  }
  const requested = PREVISIT_SESSION_ID_PREFIX + globalThis.crypto.randomUUID();
  const created = await ctx.sessions.create({ workspaceId, sessionId: requested });
  if (created !== requested) throw new Error("\u8BBF\u524D\u5C3D\u8C03\u4F1A\u8BDD\u6807\u8BC6\u4E0D\u5339\u914D\uFF0C\u8BF7\u91CD\u8BD5");
  return created;
}

// src/report-export.ts
function contentText(value) {
  if (typeof value === "string") return value;
  if (!Array.isArray(value)) return "";
  return value.map((block) => {
    if (typeof block === "string") return block;
    if (block === null || typeof block !== "object") return "";
    const typed = block;
    if (typeof typed.type === "string" && typed.type !== "text" || typeof typed.kind === "string" && typed.kind !== "text") return "";
    return typeof typed.text === "string" ? typed.text : "";
  }).join("");
}
function nodeText(node) {
  if (Array.isArray(node.blocks)) return node.blocks.filter((b) => b.kind === "text").map((b) => b.text ?? "").join("\n");
  if (typeof node.text === "string") return node.text;
  if (typeof node.content === "string") return node.content;
  if (node.message) {
    const text = contentText(node.message.content);
    if (text !== "") return text;
  }
  if (Array.isArray(node.content)) return contentText(node.content);
  if (Array.isArray(node.parts)) {
    return node.parts.map((pt) => typeof pt === "string" ? pt : pt && typeof pt.text === "string" ? pt.text : "").join("");
  }
  return "";
}
var CARD_START = /^#{1,3}\s*(访前尽调报告|拜访作战卡)[^\n]*$|^#{1,3}\s*[①1]?\s*核心研判[^\n]*$/m;
var CARD_SHAPE = (text) => /核心研判/.test(text) && /现场必问|覆盖说明|覆盖度/.test(text);
var JUNK = /<system-reminder>|<available_skills>|<command-name>|<\/?antml/i;
var isTool = (node) => node.kind === "tool-result" || node.kind === "tool-call";
var nodeRole = (node) => node.role ?? node.message?.role ?? node.kind ?? "";
var isUserish = (node) => /user|human|system|context|steering/i.test(`${nodeRole(node)} ${node.kind ?? ""}`) || node.interrupted === true;
function adoptTaskFromSnapshot(snapshot, sessionId, minimumBaseline = 0) {
  if (!isPrevisitSession(sessionId)) return null;
  const nodes = snapshot.nodes ?? [];
  for (let idx = nodes.length - 1; idx >= minimumBaseline; idx--) {
    const node = nodes[idx];
    if (node === void 0 || !/^(user|human)$/i.test(nodeRole(node))) continue;
    const text = nodeText(node);
    const m = /访前任务 ID[：:]\s*(PV-[A-Z0-9-]+)/.exec(text);
    if (m !== null && m[1] !== void 0) return { id: m[1], prompt: text.trim(), nodeBaseline: idx };
  }
  const isUser2 = (node) => node !== void 0 && /^(user|human)$/i.test(nodeRole(node));
  const cardBetween = (from, to) => nodes.slice(from + 1, to).some((n) => !isUser2(n) && CARD_SHAPE(nodeText(n)));
  for (let idx = nodes.length - 1; idx >= minimumBaseline; idx--) {
    const node = nodes[idx];
    if (!isUser2(node)) continue;
    const prompt = nodeText(node).trim();
    if (prompt === "" || JUNK.test(prompt)) continue;
    let start = idx;
    while (isFollowUpReply(nodeText(nodes[start] ?? {}).trim())) {
      let prev = start - 1;
      while (prev >= minimumBaseline && !isUser2(nodes[prev])) prev--;
      if (prev < minimumBaseline || cardBetween(prev, start)) break;
      const text = nodeText(nodes[prev] ?? {}).trim();
      if (text === "" || JUNK.test(text)) break;
      start = prev;
    }
    const origin = nodes[start] ?? node;
    return { id: `turn:${origin.seq ?? origin.id ?? start}`, prompt: nodeText(origin).trim(), nodeBaseline: start };
  }
  return null;
}
function isFollowUpReply(text) {
  if (text === "") return false;
  if (/^\s*\d{1,2}\s*$/.test(text) || /^[0-9A-Z]{18}$/.test(text)) return true;
  return /^(?:好[的啊]?|确认|确定|是的?|对[的]?|没错|可以|继续|同意|第?\s*\d{1,2}\s*(?:家|个|项|条))[。！!\s]*$/u.test(text);
}
function taskDisplayLabel(id) {
  return id.startsWith("turn:") ? "\u4F1A\u8BDD\u5185\u53D1\u8D77" : id;
}
var FULL_REPORT_SECTIONS = ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u4E1A\u52A1\u5047\u8BBE", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u89E6\u8FBE\u5F00\u573A", "\u8986\u76D6\u8BF4\u660E"];
function captureTaskReport(snapshot, sessionId, task) {
  if (!isPrevisitSession(sessionId) || snapshot.running === true) return null;
  const node = snapshot.nodes?.[task.nodeBaseline];
  if (node === void 0 || !/^(user|human)$/i.test(nodeRole(node))) return null;
  const adopted = adoptTaskFromSnapshot({ nodes: (snapshot.nodes ?? []).slice(0, task.nodeBaseline + 1) }, sessionId, task.nodeBaseline);
  if (adopted?.id !== task.id) return null;
  const nodes = snapshot.nodes ?? [];
  const next = nodes.findIndex((n, i) => i > task.nodeBaseline && /^(user|human)$/i.test(nodeRole(n)) && /访前任务 ID[：:]\s*PV-/.test(nodeText(n)));
  const text = extractCardText({ nodes: next === -1 ? nodes : nodes.slice(0, next) }, task.nodeBaseline + 1);
  if (text === null) return null;
  return reportSectionsComplete(text) ? text : null;
}
function reportSectionsComplete(text, _prompt = "") {
  const sections = [...text.matchAll(/^#{1,4}\s+(.+)$/gm)].map((m) => normalizeHeading(m[1] ?? "").replace(/^\d+、\s*/, "").replace(/\*\*/g, "").trim());
  return FULL_REPORT_SECTIONS.every((s) => sections.some((title) => title === s || title.startsWith(s + "\uFF08") || title.startsWith(s + "\uFF1A")));
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

// src/tool-outcome.ts
var TOOL_OUTCOME_LABELS = {
  running: "\u67E5\u8BE2\u4E2D",
  done: "\u67E5\u8BE2\u6210\u529F",
  "no-data": "\u65E0\u6570\u636E",
  skipped: "\u65E0\u9700\u6267\u884C",
  "no-permission": "\u65E0\u6743\u9650",
  "not-executed": "\u672A\u6267\u884C",
  failed: "\u67E5\u8BE2\u5931\u8D25",
  unknown: "\u7ED3\u679C\u5F85\u6838\u9A8C"
};
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
function resultOutcome(node) {
  if (node.error !== void 0) return classifyToolOutcome({ error: node.error }, true);
  if (node.value !== void 0) return classifyToolOutcome(node.value, node.isError);
  if (Array.isArray(node.content)) {
    const texts = node.content.filter((b) => b?.type === "text" && typeof b.text === "string");
    if (texts.length === 1) {
      try {
        return classifyToolOutcome(JSON.parse(texts[0].text), node.isError);
      } catch {
      }
    }
  }
  return classifyToolOutcome(node.content, node.isError);
}
function toolEvent(node) {
  const fallback = { name: node.call.name, status: resultOutcome(node) };
  if (node.isError || !Array.isArray(node.content) || node.content.length !== 1 || node.content[0]?.type !== "text") return fallback;
  try {
    const value = JSON.parse(node.content[0].text);
    if (node.call.name === "previsit_query" && typeof value.toolName === "string" && Object.hasOwn(TOOL_OUTCOME_LABELS, value.outcome)) {
      return { name: value.toolName, status: value.outcome, ...typeof value.reason === "string" ? { reason: value.reason } : {} };
    }
    if (node.call.name === "previsit_begin" && value.status === "needs-entity-search" || node.call.name === "previsit_confirm_entity" && value.status === "entity-confirmed") return { name: node.call.name, status: "done" };
  } catch {
  }
  return fallback;
}

// src/previsit-task.ts
var DIMENSION_LABELS = {
  entity_search: "\u4E3B\u4F53\u68C0\u7D22",
  registration: "\u5DE5\u5546\u767B\u8BB0",
  profile: "\u4F01\u4E1A\u753B\u50CF",
  annual_reports: "\u5E74\u62A5",
  changes: "\u53D8\u66F4\u8BB0\u5F55",
  shareholders: "\u80A1\u4E1C",
  beneficiaries: "\u5B9E\u63A7\u4EBA",
  personnel: "\u5173\u952E\u4EBA\u5458",
  contacts: "\u8054\u7CFB\u65B9\u5F0F",
  investments: "\u5BF9\u5916\u6295\u8D44",
  branches: "\u5206\u652F\u673A\u6784",
  risk_scan: "\u98CE\u9669\u626B\u63CF",
  dishonest: "\u5931\u4FE1",
  enforcement: "\u88AB\u6267\u884C",
  terminated_cases: "\u7EC8\u672C\u6848\u4EF6",
  equity_freeze: "\u80A1\u6743\u51BB\u7ED3",
  business_exception: "\u7ECF\u8425\u5F02\u5E38",
  administrative_penalty: "\u884C\u653F\u5904\u7F5A",
  tax_abnormal: "\u7A0E\u52A1\u5F02\u5E38",
  judicial_documents: "\u88C1\u5224\u6587\u4E66",
  patents: "\u4E13\u5229",
  software_copyright: "\u8F6F\u8457",
  financing: "\u878D\u8D44",
  bidding: "\u62DB\u6295\u6807",
  recruitment: "\u62DB\u8058",
  qualifications: "\u8D44\u8D28",
  licenses: "\u884C\u653F\u8BB8\u53EF",
  land: "\u571F\u5730",
  executive_risk: "\u8463\u76D1\u9AD8\u98CE\u9669"
};
var DEPTH_LABELS = { fast: "3\u5206\u949F\u901F\u89C8", standard: "15\u5206\u949F\u6807\u51C6", deep: "\u6DF1\u5EA6\u5C3D\u8C03" };
var REPORT_SECTIONS = ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u4E1A\u52A1\u5047\u8BBE", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u89E6\u8FBE\u5F00\u573A", "\u8986\u76D6\u8BF4\u660E"];
var isUser = (node) => /^(user|human)$/i.test(node.role ?? node.message?.role ?? node.kind ?? "");
function hostEvent(node, index) {
  if (node.kind !== "tool-result" || typeof node.call?.name !== "string" || !node.call.name.startsWith("previsit_")) return null;
  if (node.isError === true || !Array.isArray(node.content) || node.content.length !== 1) return null;
  const block = node.content[0];
  if (typeof block === "string" || block?.type !== "text" || typeof block.text !== "string") return null;
  try {
    const value = JSON.parse(block.text);
    if (value === null || typeof value !== "object" || Array.isArray(value)) return null;
    return { name: node.call.name, value, index };
  } catch {
    return null;
  }
}
var str = (v) => typeof v === "string" && v !== "" ? v : void 0;
var num = (v) => typeof v === "number" && Number.isFinite(v) ? v : void 0;
function candidateCount(data) {
  if (Array.isArray(data)) return data.length;
  if (data !== null && typeof data === "object") {
    for (const v of Object.values(data)) if (Array.isArray(v)) return v.length;
  }
  return void 0;
}
function originatingPrompt(nodes, beginIndex) {
  for (let i = beginIndex - 1; i >= 0; i--) {
    const node = nodes[i];
    if (node !== void 0 && isUser(node)) {
      const text = nodeText(node).trim();
      if (text !== "") return text;
    }
  }
  return "";
}
var strList = (v) => Array.isArray(v) ? v.filter((f) => typeof f === "string") : [];
function derivePlans(snapshot) {
  const nodes = snapshot.nodes ?? [];
  const plans = [];
  nodes.forEach((node, index) => {
    const event = hostEvent(node, index);
    if (event === null) return;
    if (event.name === "previsit_plan" || event.name === "previsit_extract_image_companies" && Array.isArray(event.value.candidates)) {
      const id = str(event.value.planId);
      if (id === void 0) return;
      const candidates = Array.isArray(event.value.candidates) ? event.value.candidates.flatMap((c) => {
        const name = c !== null && typeof c === "object" ? str(c.name) : void 0;
        return name === void 0 ? [] : [{ name, source: c !== null && typeof c === "object" ? str(c.source) : void 0 }];
      }) : [];
      if (plans.some((plan) => plan.id === id)) return;
      plans.push({ id, candidates, note: str(event.value.note), createdAt: str(event.value.createdAt), index, taskIds: [] });
      return;
    }
    if (event.name === "previsit_begin") {
      const planId = str(event.value.planId), taskId = str(event.value.taskId);
      const plan = planId === void 0 ? void 0 : plans.find((p) => p.id === planId);
      if (plan !== void 0 && taskId !== void 0 && !plan.taskIds.includes(taskId)) plan.taskIds.push(taskId);
    }
  });
  return plans;
}
function deriveTasks(snapshot) {
  const nodes = snapshot.nodes ?? [];
  const tasks = [];
  let current;
  nodes.forEach((node, index) => {
    const event = hostEvent(node, index);
    if (event === null) return;
    const { name, value } = event;
    if (name === "previsit_begin") {
      const id = str(value.taskId);
      if (id === void 0) return;
      const existing = tasks.find((task) => task.id === id);
      if (existing !== void 0) {
        current = existing;
        return;
      }
      if (current !== void 0) current.endIndex = index;
      const depth = str(value.depth);
      current = {
        id,
        planId: str(value.planId),
        query: str(value.query) ?? "",
        depth: depth === "fast" || depth === "standard" || depth === "deep" ? depth : void 0,
        limit: num(value.limit) ?? 0,
        used: num(value.used) ?? 0,
        role: str(value.role),
        scene: str(value.scene),
        focus: strList(value.focus),
        output: str(value.output),
        sections: strList(value.sections),
        startedAt: str(value.startedAt),
        entity: void 0,
        candidateCount: void 0,
        prompt: originatingPrompt(nodes, index),
        startIndex: index,
        endIndex: void 0,
        dimensions: [],
        report: null,
        stage: "planning"
      };
      tasks.push(current);
      return;
    }
    if (current === void 0 || str(value.taskId) !== current.id) return;
    if (name === "previsit_confirm_entity") {
      const entity = value.entity;
      const fullName = str(entity?.fullName), creditCode = str(entity?.creditCode);
      if (fullName !== void 0 && creditCode !== void 0) current.entity = { fullName, creditCode };
      return;
    }
    if (name === "previsit_query") {
      const dimension = str(value.dimension);
      if (dimension === void 0) return;
      const outcome = str(value.outcome);
      const dim = {
        dimension,
        label: DIMENSION_LABELS[dimension] ?? dimension,
        outcome: outcome !== void 0 && Object.hasOwn(TOOL_OUTCOME_LABELS, outcome) ? outcome : "unknown",
        order: current.dimensions.length
      };
      const toolName = str(value.toolName), reason = str(value.reason);
      if (toolName !== void 0) dim.toolName = toolName;
      if (reason !== void 0) dim.reason = reason;
      current.dimensions.push(dim);
      const used = num(value.used);
      if (used !== void 0) current.used = Math.max(current.used, used);
      if (dimension === "entity_search") current.candidateCount = candidateCount(value.data);
    }
  });
  for (const task of tasks) {
    const end = task.endIndex ?? nodes.length;
    const text = extractCardText({ nodes: nodes.slice(0, end) }, task.startIndex + 1);
    task.report = text !== null && reportSectionsComplete(text, task.prompt) ? text : null;
    task.stage = task.report !== null ? "reported" : task.entity !== void 0 ? "collecting" : task.dimensions.length > 0 ? "anchoring" : "planning";
  }
  return tasks;
}
function planConfirmationMessage(plan, selection) {
  const sections = selection.sections.length === REPORT_SECTIONS.length ? "\u5168\u90E8\u516B\u6BB5" : selection.sections.join("\u3001");
  return [
    // 必须带完整 planId：模型会照抄这一行去调 previsit_begin，截断的 id 查不到计划。
    `\u786E\u8BA4\u5C3D\u8C03\u8BA1\u5212 ${plan.id}\uFF1A`,
    `- \u4E3B\u4F53\uFF1A${selection.candidates.join("\u3001")}`,
    `- \u6DF1\u5EA6\uFF1A${DEPTH_LABELS[selection.depth]}\uFF08${selection.depth}\uFF0C\u56FA\u5B9A\u8DEF\u7531\u5185\u8FDE\u7EED\u6267\u884C\uFF0C\u4E0D\u8BBE\u63D2\u4EF6\u8C03\u7528\u6B21\u6570\u4E0A\u9650\uFF09`,
    ...selection.role === void 0 ? [] : [`- \u89D2\u8272\uFF1A${selection.role}`],
    ...selection.scene === void 0 ? [] : [`- \u573A\u5408\uFF1A${selection.scene}`],
    `- \u5173\u6CE8\uFF1A${selection.focus.length > 0 ? selection.focus.join("\u3001") : "\u6309\u6807\u51C6\u8303\u56F4"}`,
    `- \u8F93\u51FA\uFF1A${selection.output}`,
    `- \u91CD\u70B9\u5C55\u5F00\u6BB5\u843D\uFF1A${sections}\uFF1B\u62A5\u544A\u4FDD\u7559\u5B8C\u6574\u516B\u6BB5\uFF0C\u5176\u4F59\u6BB5\u843D\u7B80\u5199\u5E76\u62AB\u9732\u672A\u77E5\u9879`,
    `\u8BF7\u6309\u6B64\u8BA1\u5212\u9010\u5BB6\u6267\u884C\uFF1A\u6BCF\u5BB6\u5148\u7528 previsit_begin\uFF08\u5E26 planId\u3001entities=${selection.candidates.length}\uFF09\u5EFA\u7ACB\u4EFB\u52A1\uFF0C\u540C\u65F6\u4F20\u5165 depth\u3001role\u3001scene\u3001focus\u3001output\u3001sections\uFF1B\u6BCF\u5BB6\u4F7F\u7528\u72EC\u7ACB\u4EFB\u52A1 ID\uFF0C\u4E0D\u5F97\u590D\u7528\u524D\u4E00\u5BB6\u7684 requestId\u3002\u4E3B\u4F53\u786E\u8BA4\u540E\u53D6\u6570\u5E76\u8C03\u7528 previsit_finalize \u4FDD\u5B58\u62A5\u544A\uFF0C\u5B8C\u6210\u4E00\u5BB6\u518D\u5F00\u59CB\u4E0B\u4E00\u5BB6\u3002`
  ].join("\n");
}

// src/plan-card.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var FRAMEWORK_SECTIONS = {
  \u4E00\u9875\u7EB8\u7B80\u62A5: REPORT_SECTIONS,
  \u63D0\u95EE\u6E05\u5355\u4E3A\u4E3B: ["\u6838\u5FC3\u7814\u5224", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u8986\u76D6\u8BF4\u660E"],
  \u5B8C\u6574\u62A5\u544A: REPORT_SECTIONS,
  \u53EF\u8F6C\u53D1\u6458\u8981: ["\u6838\u5FC3\u7814\u5224", "\u4EA7\u4E1A\u5B9A\u4F4D", "\u8FD1\u671F\u52A8\u6001", "\u7EA2\u7EBF\u63D0\u793A", "\u73B0\u573A\u5FC5\u95EE", "\u8986\u76D6\u8BF4\u660E"]
};
function PlanCard(props) {
  const { plan } = props;
  const [picked, setPicked] = (0, import_react.useState)(plan.candidates.slice(0, Math.min(3, plan.candidates.length)).map((c) => c.name));
  const [depth, setDepth] = (0, import_react.useState)("fast");
  const [focus, setFocus] = (0, import_react.useState)(FOCUS_OPTIONS.map((o) => o.label));
  const [role, setRole] = (0, import_react.useState)(ROLE_OPTIONS[0]?.label ?? "\u94F6\u884C/\u4FE1\u8D37\u5BA2\u6237\u7ECF\u7406");
  const [scene, setScene] = (0, import_react.useState)();
  const inFlight = (0, import_react.useRef)(false);
  const [confirmed, setConfirmed] = (0, import_react.useState)(false);
  const [output, setOutput] = (0, import_react.useState)("\u4E00\u9875\u7EB8\u7B80\u62A5");
  const [sections, setSections] = (0, import_react.useState)([...REPORT_SECTIONS]);
  const [submitting, setSubmitting] = (0, import_react.useState)(false);
  const [error, setError] = (0, import_react.useState)();
  const toggle = (list, value, set) => set(list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const confirm = async () => {
    if (inFlight.current || confirmed) return;
    if (picked.length === 0) {
      setError("\u81F3\u5C11\u9009\u4E00\u5BB6\u4F01\u4E1A");
      return;
    }
    if (sections.length === 0) {
      setError("\u62A5\u544A\u81F3\u5C11\u4FDD\u7559\u4E00\u6BB5");
      return;
    }
    inFlight.current = true;
    setError(void 0);
    setSubmitting(true);
    try {
      const selection = { candidates: plan.candidates.filter((c) => picked.includes(c.name)).map((c) => c.name), depth, focus, output, role, ...scene === void 0 ? {} : { scene }, sections: REPORT_SECTIONS.filter((s) => sections.includes(s)) };
      await props.onConfirm(planConfirmationMessage(plan, selection));
      setConfirmed(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "\u53D1\u9001\u5931\u8D25");
    } finally {
      inFlight.current = false;
      setSubmitting(false);
    }
  };
  if (confirmed) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwCard", role: "status", children: "\u8BA1\u5212\u5DF2\u63D0\u4EA4\uFF0C\u6B63\u5728\u7B49\u5F85\u667A\u80FD\u4F53\u9010\u5BB6\u6267\u884C\u3002" });
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard qccPlan", "data-submitting": submitting, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCardHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u786E\u8BA4\u5C3D\u8C03\u8BA1\u5212" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
          plan.note ?? "\u667A\u80FD\u4F53\u8BC6\u522B\u51FA\u4EE5\u4E0B\u5019\u9009\u4E3B\u4F53",
          "\uFF1B\u9009\u597D\u540E\u4E00\u6B21\u786E\u8BA4\uFF0C\u6309\u5BB6\u9010\u4E00\u67E5\u8BE2\u5E76\u4FDD\u5B58\u62A5\u544A\uFF0C\u51FA\u73B0\u591A\u4E2A\u5019\u9009\u65F6\u9700\u786E\u8BA4\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53\u3002"
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "qccPwMode", children: [
        plan.candidates.length,
        " \u5BB6\u5019\u9009"
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanLabel", children: "\u8981\u67E5\u54EA\u51E0\u5BB6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", { className: "qccPlanCandidates", children: plan.candidates.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: picked.includes(c.name), onChange: () => toggle(picked, c.name, setPicked) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPlanName", children: c.name }),
        c.source === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: c.source })
      ] }) }, c.name)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanLabel", children: "\u6211\u662F" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanChips", children: ROLE_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPlanChip", "data-on": role === o.label, "aria-pressed": role === o.label, onClick: () => setRole(o.label), children: o.label }, o.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanLabel", children: "\u62DC\u8BBF\u573A\u5408" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanChips", children: PURPOSE_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPlanChip", "data-on": scene === o.label, "aria-pressed": scene === o.label, onClick: () => setScene(o.label), children: o.label }, o.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanLabel", children: "\u591A\u6DF1" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanChips", role: "radiogroup", children: Object.keys(DEPTH_LABELS).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", role: "radio", "aria-checked": depth === d, className: "qccPlanChip", "data-on": depth === d, onClick: () => setDepth(d), children: DEPTH_LABELS[d] }, d)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanLabel", children: "\u91CD\u70B9\u5173\u6CE8" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanChips", children: FOCUS_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", "aria-pressed": focus.includes(o.label), className: "qccPlanChip", "data-on": focus.includes(o.label), onClick: () => toggle(focus, o.label, setFocus), children: o.label }, o.id)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanGroup", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanLabel", children: "\u62A5\u544A\u6846\u67B6" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanChips", role: "radiogroup", children: OUTPUT_OPTIONS.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", role: "radio", "aria-checked": output === o.label, className: "qccPlanChip", "data-on": output === o.label, onClick: () => {
        setOutput(o.label);
        setSections([...FRAMEWORK_SECTIONS[o.label] ?? REPORT_SECTIONS]);
      }, children: o.label }, o.id)) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccImportState", children: "\u52FE\u9009\u91CD\u70B9\u5C55\u5F00\u7684\u6BB5\u843D\uFF1B\u6700\u7EC8\u62A5\u544A\u4FDD\u7559\u5B8C\u6574\u516B\u6BB5\uFF0C\u5176\u4F59\u6BB5\u843D\u7B80\u5199\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPlanSections", children: REPORT_SECTIONS.map((sec, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { "data-on": sections.includes(sec), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", { type: "checkbox", checked: sections.includes(sec), onChange: () => toggle(sections, sec, setSections) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
          i + 1,
          "\u3001",
          sec
        ] })
      ] }, sec)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanFoot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "qccPlanTotal", children: [
        picked.length,
        " \u5BB6 \xB7 ",
        DEPTH_LABELS[depth],
        " \xB7 \u6309\u56FA\u5B9A\u4E1A\u52A1\u8DEF\u7531\u8FDE\u7EED\u67E5\u8BE2"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPlanActions", children: [
        error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPlanError", role: "alert", children: error }),
        props.onDismiss === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: props.onDismiss, children: "\u5148\u4E0D\u67E5" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "qccPwPrimary", disabled: submitting, onClick: () => {
          void confirm();
        }, children: [
          "\u786E\u8BA4\u5E76\u5F00\u59CB",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2192" })
        ] })
      ] })
    ] })
  ] });
}

// src/workbench-v2.tsx
var import_react9 = require("react");

// src/analysis-records.ts
var ANALYSIS_STATUSES = { pending: "\u5F85\u9A8C\u8BC1", supported: "\u6709\u8BC1\u636E\u652F\u6301", partial: "\u90E8\u5206\u652F\u6301", contradicted: "\u6709\u53CD\u8BC1", insufficient: "\u8BC1\u636E\u4E0D\u8DB3", onsite: "\u5F85\u73B0\u573A\u786E\u8BA4" };
function latestAnalysis(records = []) {
  return [...new Map(records.map((record) => [record.id, record])).values()];
}

// src/hosted-task-sync.ts
function hostedTaskOrigin(task) {
  const workspace = task.workspace.trim() || "\u672A\u8BB0\u5F55\uFF08\u65E7\u8BB0\u5F55\uFF09";
  const sessionId = task.sessionId.trim() || "\u672A\u8BB0\u5F55\uFF08\u65E7\u8BB0\u5F55\uFF09";
  return {
    workspace,
    sessionId,
    label: `\u6765\u6E90\uFF1AWorkspace ${workspace} \xB7 Session ${sessionId}`,
    complete: task.workspace.trim() !== "" && task.sessionId.trim() !== ""
  };
}
var HOSTED_TERMINAL = /* @__PURE__ */ new Set(["completed", "partial", "failed"]);
var VERIFY_RUN = /risk|dishonest|enforcement|terminated|freeze|exception|penalty|tax|judicial|executive/;
var COMPLETE_RUN = /* @__PURE__ */ new Set(["done", "no-data", "skipped"]);
var DIMENSION_LABELS2 = {
  entity_search: "\u62DC\u8BBF\u5BA2\u6237\u68C0\u7D22",
  registration: "\u5DE5\u5546\u767B\u8BB0",
  profile: "\u4F01\u4E1A\u753B\u50CF",
  annual_reports: "\u4F01\u4E1A\u5E74\u62A5",
  changes: "\u53D8\u66F4\u8BB0\u5F55",
  shareholders: "\u80A1\u4E1C\u4FE1\u606F",
  beneficiaries: "\u5B9E\u9645\u63A7\u5236\u4EBA",
  personnel: "\u5173\u952E\u4EBA\u5458",
  contacts: "\u8054\u7CFB\u65B9\u5F0F",
  investments: "\u5BF9\u5916\u6295\u8D44",
  branches: "\u5206\u652F\u673A\u6784",
  financing: "\u878D\u8D44\u4FE1\u606F",
  bidding: "\u62DB\u6295\u6807\u4E1A\u7EE9",
  recruitment: "\u62DB\u8058\u4FE1\u606F",
  qualifications: "\u4F01\u4E1A\u8D44\u8D28",
  licenses: "\u884C\u653F\u8BB8\u53EF",
  land: "\u571F\u5730\u4FE1\u606F",
  patents: "\u4E13\u5229\u4FE1\u606F",
  software_copyright: "\u8F6F\u4EF6\u8457\u4F5C\u6743",
  risk_scan: "\u4F01\u4E1A\u98CE\u9669\u626B\u63CF",
  dishonest: "\u5931\u4FE1\u660E\u7EC6",
  enforcement: "\u88AB\u6267\u884C\u660E\u7EC6",
  terminated_cases: "\u7EC8\u672C\u6848\u4EF6\u660E\u7EC6",
  equity_freeze: "\u80A1\u6743\u51BB\u7ED3\u660E\u7EC6",
  business_exception: "\u7ECF\u8425\u5F02\u5E38\u660E\u7EC6",
  administrative_penalty: "\u884C\u653F\u5904\u7F5A\u660E\u7EC6",
  tax_abnormal: "\u7A0E\u52A1\u5F02\u5E38\u660E\u7EC6",
  judicial_documents: "\u88C1\u5224\u6587\u4E66\u660E\u7EC6",
  executive_risk: "\u8463\u76D1\u9AD8\u98CE\u9669\u626B\u63CF"
};
var DIMENSION_TOOL_NAMES = {
  entity_search: "get_company_by_query",
  registration: "get_company_registration_info",
  profile: "get_company_profile",
  annual_reports: "get_annual_reports",
  changes: "get_change_records",
  shareholders: "get_shareholder_info",
  beneficiaries: "get_beneficial_owners",
  personnel: "get_key_personnel",
  contacts: "get_contact_info",
  investments: "get_external_investments",
  branches: "get_branches",
  financing: "get_financing_records",
  bidding: "get_bidding_info",
  recruitment: "get_recruitment_info",
  qualifications: "get_qualifications",
  licenses: "get_administrative_license",
  land: "get_land_grant_info",
  patents: "get_patent_info",
  software_copyright: "get_software_copyright_info",
  risk_scan: "get_company_risk_scan",
  dishonest: "get_dishonest_info",
  enforcement: "get_judgment_debtor_info",
  terminated_cases: "get_terminated_cases",
  equity_freeze: "get_equity_freeze",
  business_exception: "get_business_exception",
  administrative_penalty: "get_administrative_penalty",
  tax_abnormal: "get_tax_abnormal",
  judicial_documents: "get_judicial_documents",
  executive_risk: "get_executive_risk_scan"
};
function latestHostedRuns(task) {
  const latest = /* @__PURE__ */ new Map();
  for (const run of task.runs) latest.set(run.dimension, run);
  return [...latest.values()];
}
function hostedToolEvents(task) {
  return [
    { name: "previsit_begin", status: "done" },
    ...task.entity === void 0 ? [] : [{ name: "previsit_confirm_entity", status: "done" }],
    ...latestHostedRuns(task).map((run) => ({
      name: run.toolName ?? DIMENSION_TOOL_NAMES[run.dimension] ?? `previsit_${run.dimension}`,
      status: run.status,
      ...run.message === void 0 ? {} : { reason: run.message }
    }))
  ];
}
function dimensionLabel(dimension) {
  return DIMENSION_LABELS2[dimension] ?? dimension.replaceAll("_", " ");
}
function elapsedLabel(startedAt, now) {
  const seconds = Math.max(0, Math.floor((now - new Date(startedAt).getTime()) / 1e3));
  if (seconds < 60) return `${seconds} \u79D2`;
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return rest === 0 ? `${minutes} \u5206\u949F` : `${minutes} \u5206 ${rest} \u79D2`;
}
function hostedLiveProgress(task, now = Date.now()) {
  const latest = latestHostedRuns(task);
  const running2 = [...latest].reverse().find((run) => run.status === "running");
  const lastSettled = [...task.runs].reverse().find((run) => run.status !== "running" && !run.id.startsWith("previsit-pending-"));
  const completedCount = latest.filter((run) => COMPLETE_RUN.has(run.status)).length;
  const noDataCount = latest.filter((run) => run.status === "no-data").length;
  const skippedCount = latest.filter((run) => run.status === "skipped").length;
  const pendingCount = latest.filter((run) => run.status === "unknown" || run.status === "no-permission" || run.status === "not-executed").length;
  const failedCount = latest.filter((run) => run.status === "failed").length;
  const current = running2 === void 0 ? null : dimensionLabel(running2.dimension);
  const title = task.state === "needs-entity-confirmation" ? "\u7B49\u5F85\u786E\u8BA4\u62DC\u8BBF\u5BA2\u6237" : running2 !== void 0 ? `\u6B63\u5728\u67E5\u8BE2\uFF1A${current}` : task.state === "finalizing" || task.stage === "output" ? "\u6B63\u5728\u751F\u6210\u4E00\u9875\u7EB8\u62A5\u544A" : task.runs.length > 0 ? "\u672C\u8F6E\u67E5\u8BE2\u5DF2\u8FD4\u56DE\uFF0C\u6B63\u5728\u7814\u5224\u4E0E\u6574\u7406" : "\u6B63\u5728\u51C6\u5907\u4F01\u4E1A\u67E5\u8BE2";
  const last = lastSettled === void 0 ? "" : `\uFF1B\u6700\u8FD1\u5B8C\u6210\uFF1A${dimensionLabel(lastSettled.dimension)}`;
  const detail = task.state === "needs-entity-confirmation" ? "\u68C0\u7D22\u5230\u591A\u4E2A\u5019\u9009\u4E3B\u4F53\uFF0C\u8BF7\u5148\u5728\u4F1A\u8BDD\u4E2D\u9009\u5B9A\u4F01\u4E1A\uFF1B\u786E\u8BA4\u540E\u5C06\u81EA\u52A8\u7EE7\u7EED\u3002" : `\u5DF2\u53D1\u8D77 ${task.used} \u6B21\u771F\u5B9E\u67E5\u8BE2\uFF0C${completedCount} \u4E2A\u7EF4\u5EA6\u5DF2\u95ED\u73AF${last}\u3002\u9875\u9762\u6BCF\u79D2\u540C\u6B65\uFF0C\u4E0D\u4F7F\u7528\u865A\u6784\u767E\u5206\u6BD4\u3002`;
  return {
    title,
    detail,
    current,
    queryCount: task.used,
    completedCount,
    noDataCount,
    skippedCount,
    pendingCount,
    failedCount,
    elapsed: elapsedLabel(task.createdAt, now)
  };
}
function hostedStatus(task) {
  if (task.state === "failed") return "failed";
  if (task.reportReady) return "ready";
  if (task.state === "needs-entity-confirmation") return "waiting-agent";
  if (task.state === "needs-entity-search" && task.runs.some((run) => run.dimension === "entity_search" && run.status !== "running")) return "waiting-agent";
  return "running";
}
function selectHostedTask(records, active, dismissedTaskIds) {
  const dismissed = new Set(dismissedTaskIds);
  const available = records.filter((record) => !dismissed.has(record.id)).sort((left, right) => right.updatedAt.localeCompare(left.updatedAt));
  if (active === void 0) return available[0] ?? null;
  const direct = available.find((record) => record.id === active.id);
  if (direct !== void 0) {
    if (HOSTED_TERMINAL.has(direct.state)) {
      const next = available.filter((record) => record.sessionId === direct.sessionId && record.createdAt > direct.createdAt).sort((left, right) => right.createdAt.localeCompare(left.createdAt))[0];
      if (next !== void 0) return next;
      const continuation = available.find((record) => record.sessionId === direct.sessionId && record.rootTaskId === (direct.rootTaskId ?? direct.id) && (record.reportVersion ?? 1) > (direct.reportVersion ?? 1));
      if (continuation) return continuation;
    }
    return direct;
  }
  const startedAfter = new Date(active.createdAt).getTime() - 6e4;
  return available.find((record) => new Date(record.createdAt).getTime() >= startedAfter) ?? null;
}
function hostedTaskView(task) {
  if (task.reportReady || HOSTED_TERMINAL.has(task.state)) return "output";
  if (task.stage === "output" || task.state === "finalizing") {
    const lastRun = [...task.runs].reverse().find((run) => run.dimension !== "entity_search");
    if (lastRun !== void 0) return VERIFY_RUN.test(`${lastRun.dimension} ${lastRun.toolName ?? ""}`) ? "verify" : "collect";
    return task.entity === void 0 ? "scope" : "collect";
  }
  if (task.stage === "verify") return "verify";
  if (task.stage === "collect") return "collect";
  return "scope";
}
function hostedProgressCopy(task) {
  if (task.state === "needs-entity-confirmation") {
    return {
      title: "\u7B49\u5F85\u786E\u8BA4\u62DC\u8BBF\u5BA2\u6237",
      detail: "\u68C0\u7D22\u5230\u591A\u4E2A\u5019\u9009\u4E3B\u4F53\uFF0C\u8BF7\u5148\u5728\u4F1A\u8BDD\u4E2D\u9009\u5B9A\u4F01\u4E1A\uFF1B\u786E\u8BA4\u540E\u5DE5\u4F5C\u53F0\u4F1A\u7EE7\u7EED\u540C\u6B65\u6267\u884C\u8FDB\u5EA6\u3002"
    };
  }
  if (task.entity === void 0) {
    return {
      title: "\u6B63\u5728\u68C0\u7D22\u62DC\u8BBF\u5BA2\u6237",
      detail: "\u6B63\u5728\u8BC6\u522B\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53\uFF1B\u51FA\u73B0\u591A\u4E2A\u5019\u9009\u65F6\u624D\u9700\u8981\u4F60\u5728\u4F1A\u8BDD\u4E2D\u786E\u8BA4\u3002"
    };
  }
  if (task.state === "finalizing" || task.stage === "output") {
    return {
      title: "\u6B63\u5728\u6574\u7406\u62A5\u544A",
      detail: `\u4E3B\u4F53\u5DF2\u786E\u8BA4\uFF0C\u5DF2\u5B8C\u6210 ${task.used} \u6B21\u67E5\u8BE2\uFF1B\u6B63\u5728\u6574\u7406\u4E00\u9875\u7EB8\u7B80\u62A5\uFF0C\u751F\u6210\u540E\u5373\u53EF\u4E0B\u8F7D\u3002`
    };
  }
  return {
    title: "\u6B63\u5728\u5C3D\u8C03",
    detail: `\u4E3B\u4F53\u5DF2\u786E\u8BA4\uFF0C\u5DF2\u540C\u6B65 ${task.used} \u6B21\u67E5\u8BE2\uFF1B\u8D44\u6599\u91C7\u96C6\u4E0E\u8BC1\u636E\u6838\u9A8C\u72B6\u6001\u4F1A\u968F\u6267\u884C\u66F4\u65B0\u3002`
  };
}
function syncHostedTaskState(state, record, adopted, locateCurrentStage) {
  if (state.dismissedTaskIds.includes(record.id)) return state;
  const previous = state.task;
  const captureId = adopted?.id ?? previous?.captureId ?? (previous !== void 0 && previous.id !== record.id ? previous.id : void 0);
  const nextTaskBase = {
    id: record.id,
    company: record.entity?.fullName ?? record.query,
    prompt: adopted?.prompt ?? previous?.prompt ?? record.query,
    createdAt: record.createdAt,
    nodeBaseline: adopted?.nodeBaseline ?? previous?.nodeBaseline ?? state.minimumNodeBaseline,
    seenRunning: previous?.seenRunning === true || record.runs.length > 0 || record.state === "running" || HOSTED_TERMINAL.has(record.state),
    selection: previous?.selection ?? state.selection
  };
  const nextTask = captureId !== void 0 && captureId !== record.id ? { ...nextTaskBase, captureId } : nextTaskBase;
  const nextCompany = record.entity?.fullName ?? record.query;
  const nextView = locateCurrentStage && !record.reportReady && !HOSTED_TERMINAL.has(record.state) && state.view !== "history" ? hostedTaskView(record) : state.view;
  if (previous?.id === nextTask.id && previous.captureId === nextTask.captureId && previous.company === nextTask.company && previous.prompt === nextTask.prompt && previous.createdAt === nextTask.createdAt && previous.nodeBaseline === nextTask.nodeBaseline && previous.seenRunning === nextTask.seenRunning && state.company === nextCompany && state.view === nextView) return state;
  return { ...state, task: nextTask, company: nextCompany, view: nextView };
}

// src/analysis-panels.tsx
var import_jsx_runtime2 = require("react/jsx-runtime");
var verificationDimension = (dimension) => /risk|dishonest|enforcement|terminated|freeze|exception|penalty|tax|judicial/.test(dimension);
function CollectionCards({ task, verification = false }) {
  const runs = [...new Map((task?.runs ?? []).filter((run) => run.dimension !== "entity_search" && verificationDimension(run.dimension) === verification).map((run) => [run.dimension, run])).values()];
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("div", { className: "qccPwSummaryGrid", children: runs.map((run) => {
    const facts = (run.result?.facts ?? []).filter((fact) => !/^(企业名称|摘要|summary)：/.test(fact));
    const priority = /记录数|总数|总条数|年度|参保|主营|行业|轮次|融资|金额|日期|变更项目|项目名称|职位|状态/;
    const keyFacts = facts.filter((fact) => !fact.includes("[") && priority.test(fact)).slice(0, 3);
    const highlights = keyFacts.length ? keyFacts : facts.slice(0, 3);
    return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: dimensionLabel(run.dimension) }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwMode", children: TOOL_OUTCOME_LABELS[run.status] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: run.result?.summary || (run.status === "no-data" ? "\u672C\u6B21\u67E5\u8BE2\u672A\u53D1\u73B0\u8BB0\u5F55\u3002" : facts.length ? "\u5DF2\u53D6\u5F97\u6765\u6E90\u4FE1\u606F\uFF0C\u5173\u952E\u5B57\u6BB5\u5982\u4E0B\uFF1B\u5C1A\u975E\u6700\u7EC8\u7814\u5224\u3002" : "\u6682\u672A\u63D0\u53D6\u5230\u4E1A\u52A1\u6458\u8981\uFF1B\u4E0D\u4EE3\u8868\u65E0\u6570\u636E\u3002") }),
      highlights.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: highlights.map((fact) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: fact.length > 160 ? fact.slice(0, 160) + "\u2026" : fact }, fact)) }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "qccPwNote", children: [
        "\u8986\u76D6\u8FB9\u754C\uFF1A\u4EC5\u5C55\u793A\u672C\u6B21\u8FD4\u56DE\u7684\u6458\u8981\u4E0E\u6709\u9650\u6837\u672C\uFF1B\u8BB0\u5F55\u603B\u6570\u4E0D\u7B49\u4E8E\u5DF2\u9010\u6761\u6838\u67E5\u3002",
        verification ? "\u67E5\u8BE2\u6210\u529F\u4E0D\u4EE3\u8868\u98CE\u9669\u6392\u9664\uFF0C\u8BE6\u89C1\u4E0B\u65B9\u6838\u9A8C\u8BB0\u5F55\u3002" : "\u672A\u5C55\u793A\u5B57\u6BB5\u53EF\u5728\u539F\u4F1A\u8BDD\u5DE5\u5177\u7ED3\u679C\u4E2D\u67E5\u770B\u3002"
      ] }),
      run.message ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwNote", children: run.message }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
          "\u6765\u6E90\u4E0E\u5DF2\u4FDD\u5B58\u660E\u7EC6\uFF08",
          facts.length,
          " \u9879\u5B57\u6BB5\uFF09"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { className: "qccPwNote", children: [
          "\u6765\u6E90\uFF1A",
          run.toolName ?? run.dimension,
          " \xB7 ",
          run.completedAt ?? run.startedAt,
          " \xB7 \u5F15\u7528 ",
          run.id
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: facts.map((fact) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: fact }, fact)) })
      ] })
    ] }, run.id);
  }) });
}
function AnalysisPanel({ task, kind, legacy = [] }) {
  const history = (task?.analysisRecords ?? []).filter((record) => record.kind === kind);
  const records = latestAnalysis(history);
  return /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("section", { className: "qccPwCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h3", { children: kind === "verification" ? "\u6838\u9A8C\u53D1\u73B0\u4E0E\u672A\u89E3\u51B3\u4E8B\u9879" : "\u673A\u4F1A\u5047\u8BBE\u4E0E\u73B0\u573A\u9A8C\u8BC1" }),
    /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwNote", children: kind === "verification" ? "\u533A\u5206\u4E8B\u5B9E\u652F\u6301\u3001\u53CD\u8BC1\u4E0E\u8BC1\u636E\u7F3A\u53E3\uFF1B\u6267\u884C\u5B8C\u6210\u4E0D\u7B49\u4E8E\u7ED3\u8BBA\u901A\u8FC7\u3002" : "\u628A\u5DF2\u53D6\u5F97\u7684\u4FE1\u606F\u8F6C\u5316\u4E3A\u53EF\u9A8C\u8BC1\u7684\u62DC\u8BBF\u95EE\u9898\uFF1B\u4E0D\u662F\u6388\u4FE1\u3001\u5408\u4F5C\u6216\u6295\u8D44\u7ED3\u8BBA\u3002" }),
    !records.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: legacy.length ? "\u4EE5\u4E0B\u4EC5\u4E3A\u65E7\u62A5\u544A\u63D0\u53D6\uFF0C\u672A\u4FDD\u5B58\u8FC7\u7A0B\u8BC1\u636E\uFF0C\u4E0D\u6807\u8BB0\u6838\u9A8C\u5B8C\u6210\u3002" : "\u5C1A\u672A\u4FDD\u5B58\u7ED3\u6784\u5316\u5206\u6790\u3002\u67E5\u8BE2\u7ED3\u679C\u53EF\u5148\u67E5\u9605\uFF1B\u4E0D\u4F1A\u4EE5\u5DE5\u5177\u5B8C\u6210\u4EE3\u66FF\u6838\u9A8C\u7ED3\u8BBA\u3002" }) : null,
    !records.length ? legacy.map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
      row.id,
      " \xB7 ",
      row.text,
      "\uFF08\u5F85\u9A8C\u8BC1\uFF09"
    ] }, row.id)) : null,
    records.map((record) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("article", { className: "qccPwAnalysis", children: [
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("h4", { children: record.title }),
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("span", { className: "qccPwMode", "data-tone": ["insufficient", "contradicted", "onsite"].includes(record.status) ? "review" : void 0, children: ANALYSIS_STATUSES[record.status] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: record.summary }),
      [["\u652F\u6301", record.support], ["\u53CD\u8BC1", record.counter], ["\u672A\u77E5\u4E0E\u7F3A\u53E3", record.unknown]].map(([label, items]) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: label }),
        items.length ? /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("li", { children: item }, index)) }) : /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { className: "qccPwNote", children: "\u5C1A\u672A\u8BB0\u5F55\uFF08\u4E0D\u4EE3\u8868\u4E0D\u5B58\u5728\uFF09" })
      ] }, label)),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("b", { children: "\u4E0B\u4E00\u6B65\uFF1A" }),
        record.nextAction
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("details", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("summary", { children: [
          "\u8BC1\u636E\u5F15\u7528\u4E0E\u4FEE\u8BA2\u5386\u53F2 \xB7 V",
          record.revision
        ] }),
        history.filter((row) => row.id === record.id).map((row) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            "V",
            row.revision,
            " \xB7 ",
            row.updatedAt,
            " \xB7 ",
            ANALYSIS_STATUSES[row.status]
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("p", { children: row.summary }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            "\u652F\u6301\uFF1A",
            row.support.join("\uFF1B") || "\u672A\u8BB0\u5F55",
            "\uFF1B\u53CD\u8BC1\uFF1A",
            row.counter.join("\uFF1B") || "\u672A\u8BB0\u5F55",
            "\uFF1B\u672A\u77E5\uFF1A",
            row.unknown.join("\uFF1B") || "\u672A\u8BB0\u5F55"
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("p", { children: [
            "\u4E0B\u4E00\u6B65\uFF1A",
            row.nextAction
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime2.jsx)("ul", { children: row.evidenceIds.map((ref) => /* @__PURE__ */ (0, import_jsx_runtime2.jsxs)("li", { children: [
            ref,
            " \xB7 ",
            task?.runs.find((run) => run.id === ref)?.dimension ?? "\u6750\u6599\u4E8B\u5B9E"
          ] }, ref)) })
        ] }, row.revision))
      ] })
    ] }, record.id))
  ] });
}

// src/previsit-brand.tsx
var import_jsx_runtime3 = require("react/jsx-runtime");
var PREVISIT_LOGO_PATH = "M4 21h16M6 21V6l6-3 6 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5";
function PrevisitLogo(props) {
  const size = props.size ?? 20;
  return /* @__PURE__ */ (0, import_jsx_runtime3.jsx)(
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
      children: /* @__PURE__ */ (0, import_jsx_runtime3.jsx)("path", { d: PREVISIT_LOGO_PATH })
    }
  );
}

// src/report-files-panel.tsx
var import_react2 = require("react");
var import_jsx_runtime4 = require("react/jsx-runtime");
function ReportFilesPanel({ taskId, sessionId }) {
  const [files, setFiles] = (0, import_react2.useState)([]), [deliveries, setDeliveries] = (0, import_react2.useState)([]), [busy, setBusy] = (0, import_react2.useState)(false), [error, setError] = (0, import_react2.useState)("");
  const url = `/previsit/api/tasks/${encodeURIComponent(taskId)}/files?sessionId=${encodeURIComponent(sessionId)}`;
  (0, import_react2.useEffect)(() => {
    let active = true;
    setFiles([]);
    setDeliveries([]);
    setError("");
    void fetch(url).then(async (res) => {
      const body = await res.json();
      if (!res.ok || !body.ok || !Array.isArray(body.files) || !Array.isArray(body.deliveries)) throw new Error(body.message ?? "\u6587\u4EF6\u8BFB\u53D6\u5931\u8D25\uFF1A\u8FD4\u56DE\u7ED3\u6784\u4E0D\u5B8C\u6574");
      if (active) {
        setFiles(body.files);
        setDeliveries(body.deliveries);
      }
    }).catch((e) => {
      if (active) setError(String(e));
    });
    return () => {
      active = false;
    };
  }, [url]);
  const generate = async (format) => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch(url, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ format }) });
      const body = await res.json();
      if (!res.ok || !body.ok) throw new Error(body.message ?? "\u5BFC\u51FA\u5931\u8D25");
      setFiles((previous) => [...previous.filter((f) => f.id !== body.file.id), body.file]);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };
  return /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("section", { className: "qccPwCard", "aria-label": "\u62A5\u544A\u884D\u751F\u6587\u4EF6", children: [
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("h3", { children: "\u62A5\u544A\u884D\u751F\u6587\u4EF6" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { children: "\u8F6C\u6362\u683C\u5F0F\u4E0D\u6539\u53D8\u62A5\u544A\u7248\u672C\u3002\u6B63\u6587\u53CA Markdown \u6807\u8BB0\u4FDD\u7559\uFF0C\u6392\u7248\u4E0D\u7B49\u540C\u4E8E HTML\uFF1BPDF \u9700\u8981\u7BA1\u7406\u5458\u914D\u7F6E\u4E2D\u6587\u5B57\u4F53\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "qccPwSecondary", disabled: busy, onClick: () => void generate("docx"), children: "\u751F\u6210 Word" }),
    /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("button", { type: "button", className: "qccPwSecondary", disabled: busy, onClick: () => void generate("pdf"), children: "\u751F\u6210 PDF" }),
    busy ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "status", children: "\u6B63\u5728\u8F6C\u6362\uFF0C\u539F\u62A5\u544A\u4FDD\u6301\u4E0D\u53D8\u2026" }) : null,
    error ? /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("p", { role: "alert", children: error }) : null,
    files.map((file) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime4.jsx)("a", { href: `/previsit/api/tasks/${encodeURIComponent(taskId)}/files/${file.id}?sessionId=${encodeURIComponent(sessionId)}`, download: file.fileName, children: file.fileName }),
      " \xB7 ",
      file.size,
      " \u5B57\u8282"
    ] }, file.id)),
    deliveries.map((d) => /* @__PURE__ */ (0, import_jsx_runtime4.jsxs)("p", { children: [
      "\u4EA4\u4ED8\u7533\u8BF7\uFF1A",
      d.destination,
      " \xB7 \u5F85\u914D\u7F6E\uFF0C\u5C1A\u672A\u4E0A\u4F20"
    ] }, d.id))
  ] });
}

// src/material-panel.tsx
var import_jsx_runtime5 = require("react/jsx-runtime");
var labels = { consistent: "\u5185\u5BB9\u4E00\u81F4 \xB7 \u72EC\u7ACB\u6027\u672A\u786E\u8BA4", conflict: "\u5B58\u5728\u51B2\u7A81 \xB7 \u5F85\u6838\u5B9E", incomparable: "\u53E3\u5F84\u4E0D\u53EF\u6BD4", "same-source": "\u540C\u6E90 \xB7 \u4E0D\u6784\u6210\u53CC\u6E90" };
function MaterialPanel({ task }) {
  if (!task?.materials?.length) return null;
  return /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("section", { className: "qccPwCard", "aria-label": "\u8865\u5145\u6750\u6599\u4E0E\u4EA4\u53C9\u6838\u9A8C", children: [
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("h3", { children: "\u8865\u5145\u6750\u6599\u4E0E\u4EA4\u53C9\u6838\u9A8C" }),
    /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "\u6750\u6599\u6B63\u6587\u548C\u6765\u6E90\u4FE1\u606F\u7531\u4F1A\u8BDD\u63D0\u4F9B\uFF0C\u4E0D\u7B49\u4E8E\u5DF2\u9A8C\u8BC1\u771F\u5B9E\u6027\uFF1B\u6765\u6E90\u65E5\u671F\u4E0E\u5BFC\u5165\u65E5\u671F\u5206\u522B\u4FDD\u7559\u3002\u65B0\u589E\u8D44\u6599\u8BF7\u5728\u8865\u5145\u4EFB\u52A1\u4F1A\u8BDD\u4E2D\u63D0\u4EA4\u3002" }),
    task.materials.map((material) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("details", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("summary", { children: [
        material.title,
        " \xB7 ",
        material.sourceDate,
        " \xB7 ",
        material.taskId === task.id ? "\u672C\u6B21\u5BFC\u5165" : "\u6CBF\u7528\u5386\u53F2\u6750\u6599"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
        material.id,
        " \xB7 \u6765\u6E90\uFF1A",
        material.locator,
        " \xB7 \u5BFC\u5165\uFF1A",
        material.importedAt
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { style: { overflowWrap: "anywhere" }, children: [
        "SHA256\uFF1A",
        material.sha256
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("pre", { style: { whiteSpace: "pre-wrap", maxHeight: 240, overflow: "auto" }, children: material.text })
    ] }, material.id)),
    (task.evidenceComparisons ?? []).map((comparison) => /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("div", { role: comparison.status === "conflict" ? "note" : void 0, children: [
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("strong", { style: { color: comparison.status === "conflict" ? "#ad6800" : void 0 }, children: labels[comparison.status] }),
      /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: comparison.id }),
      [comparison.leftId, comparison.rightId].map((id) => {
        const fact = task.evidenceFacts?.find((item) => item.id === id);
        return fact ? /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("blockquote", { children: [
          fact.field,
          " \xB7 ",
          fact.period,
          " \xB7 ",
          fact.unit,
          "\uFF1A",
          fact.value,
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("br", {}),
          "\u201C",
          fact.quote,
          "\u201D",
          /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("br", {}),
          fact.materialId,
          " \xB7 ",
          fact.location
        ] }, id) : /* @__PURE__ */ (0, import_jsx_runtime5.jsxs)("p", { children: [
          "\u8BC1\u636E\u7F3A\u5931\uFF1A",
          id
        ] }, id);
      })
    ] }, comparison.id)),
    !task.evidenceComparisons?.length ? /* @__PURE__ */ (0, import_jsx_runtime5.jsx)("p", { children: "\u5C1A\u672A\u767B\u8BB0\u4EA4\u53C9\u6BD4\u5BF9\uFF0C\u4E0D\u4EE3\u8868\u5DF2\u901A\u8FC7\u53CC\u6E90\u6838\u9A8C\u3002" }) : null
  ] });
}

// src/processing-status.ts
function processingStatus(input) {
  if (input.error) return { busy: false, title: "\u72B6\u6001\u540C\u6B65\u5F02\u5E38", detail: "\u6682\u65F6\u65E0\u6CD5\u786E\u8BA4\u4EFB\u52A1\u8FDB\u5C55\uFF0C\u8BF7\u67E5\u770B\u4F1A\u8BDD\u6216\u8FDE\u63A5\u72B6\u6001\u3002" };
  if (input.waiting) return { busy: false, title: "\u7B49\u5F85\u4E3B\u4F53\u786E\u8BA4 / \u7EE7\u7EED", detail: "\u8BF7\u5728\u4F1A\u8BDD\u4E2D\u786E\u8BA4\u4F01\u4E1A\u540E\u7EE7\u7EED\u3002" };
  if (input.running === false) return { busy: false, title: "\u672C\u8F6E\u4F1A\u8BDD\u5DF2\u505C\u6B62\uFF0C\u4EFB\u52A1\u5C1A\u672A\u5B8C\u6210", detail: "\u8BF7\u67E5\u770B\u4F1A\u8BDD\u4E2D\u7684\u786E\u8BA4\u8BF7\u6C42\u3001\u505C\u6B62\u6216\u9519\u8BEF\u63D0\u793A\u3002" };
  if (input.querying) return { busy: input.running === true, title: input.running === true ? "\u6B63\u5728\u67E5\u8BE2\u8D44\u6599" : "\u67E5\u8BE2\u7ED3\u679C\u5F85\u66F4\u65B0", detail: "\u5C1A\u672A\u6536\u5230\u8BE5\u67E5\u8BE2\u7684\u5B8C\u6210\u8BB0\u5F55\uFF0C\u7ED3\u679C\u8FD4\u56DE\u540E\u81EA\u52A8\u66F4\u65B0\u3002" };
  if (input.activity && Date.parse(input.activity.updatedAt) >= (input.lastResultAt ?? 0)) {
    const age = Math.max(0, Math.floor(((input.now ?? Date.now()) - Date.parse(input.activity.updatedAt)) / 1e3));
    const phase = { analysis: "\u6574\u7406\u7ECF\u8425\u4E8B\u5B9E", verification: "\u6838\u5BF9\u98CE\u9669\u4E0E\u8BC1\u636E", writing: "\u64B0\u5199\u5C3D\u8C03\u62A5\u544A" }[input.activity.phase];
    return { busy: input.running === true, title: `\u6700\u8FD1\u5DE5\u4F5C\u9636\u6BB5\uFF1A${phase}`, detail: `${input.activity.summary}\uFF08${age} \u79D2\u524D\u4E0A\u62A5${age >= 120 ? "\uFF0C\u9636\u6BB5\u4FE1\u606F\u53EF\u80FD\u5DF2\u8FC7\u65F6\uFF1B\u7B49\u5F85\u65B0\u7684\u5DE5\u4F5C\u6458\u8981" : ""}\uFF09\u3002${input.running === void 0 ? "\u5F53\u524D\u8FD0\u884C\u72B6\u6001\u5C1A\u672A\u786E\u8BA4\u3002" : ""}` };
  }
  return { busy: input.running === true, title: input.running === true ? "\u5BBF\u4E3B\u663E\u793A\u4ECD\u5728\u5904\u7406 \xB7 \u6B63\u5728\u5206\u6790 / \u6574\u7406\u6750\u6599" : "\u7B49\u5F85\u4E0B\u4E00\u6B21\u4EFB\u52A1\u66F4\u65B0", detail: `\u8DDD\u6700\u8FD1\u4EFB\u52A1\u7ED3\u679C ${Math.max(0, Math.floor(input.secondsSinceResult))} \u79D2\u3002${input.secondsSinceResult >= 120 ? "\u7B49\u5F85\u65F6\u95F4\u8F83\u957F\uFF0C\u53EF\u68C0\u67E5\u4F1A\u8BDD\u8FD0\u884C\u72B6\u6001\uFF1B\u8BF7\u52FF\u91CD\u590D\u542F\u52A8\u4EFB\u52A1\u3002" : "\u5206\u6790\u9636\u6BB5\u53EF\u80FD\u6682\u65F6\u6CA1\u6709\u65B0\u7684\u5DE5\u5177\u7ED3\u679C\u3002"} \u4E0D\u63D0\u4F9B\u865A\u6784\u767E\u5206\u6BD4\u6216\u5185\u90E8\u601D\u8003\u5185\u5BB9\u3002` };
}

// src/image-import.tsx
var import_react3 = require("react");
var import_jsx_runtime6 = require("react/jsx-runtime");
function useImageImport(sessionId, send) {
  const accepting = (0, import_react3.useRef)(false);
  const [busy, setBusy] = (0, import_react3.useState)(false);
  const [command, setCommand] = (0, import_react3.useState)(null);
  const [error, setError] = (0, import_react3.useState)();
  const accept = async (file) => {
    if (file === void 0 || accepting.current) return;
    accepting.current = true;
    setBusy(true);
    setError(void 0);
    try {
      setCommand(await stageAndSend(file, sessionId, send));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "\u5BFC\u5165\u5931\u8D25");
    } finally {
      accepting.current = false;
      setBusy(false);
    }
  };
  (0, import_react3.useEffect)(() => {
    if (command === null || command.state === "completed" || command.state === "failed") return;
    let disposed = false;
    const timer = setInterval(async () => {
      try {
        const next = await requestCommand(`${IMAGE_ROUTE}/${encodeURIComponent(command.commandId)}?sessionId=${encodeURIComponent(sessionId)}`, "GET");
        if (disposed) return;
        setCommand((current) => current?.commandId === next.commandId ? { ...current, ...next } : current);
        if (next.state === "failed" && next.error) setError(next.error.message);
      } catch (cause) {
        if (!disposed) setError(cause instanceof Error ? cause.message : "\u65E0\u6CD5\u540C\u6B65\u56FE\u7247\u8BC6\u522B\u72B6\u6001");
        clearInterval(timer);
      }
    }, 1500);
    return () => {
      disposed = true;
      clearInterval(timer);
    };
  }, [sessionId, command?.commandId, command?.state]);
  const status = command === null ? void 0 : `${command.fileName} \xB7 ${command.state === "completed" ? command.result?.entries.length === 0 ? "\u5DF2\u8BC6\u522B\uFF0C\u672A\u53D1\u73B0\u4F01\u4E1A\u5168\u79F0\uFF0C\u8BF7\u5728\u4F1A\u8BDD\u4E2D\u8865\u5145" : "\u5DF2\u8BC6\u522B\uFF0C\u5019\u9009\u4F01\u4E1A\u89C1\u8BA1\u5212\u5361" : command.state === "failed" ? "\u8BC6\u522B\u5931\u8D25" : command.state === "prepared" ? "\u5DF2\u6682\u5B58\uFF0C\u7B49\u5F85\u667A\u80FD\u4F53\u8BC6\u522B" : "\u6B63\u5728\u8BC6\u522B\u4F01\u4E1A\u540D\u5355\u2026"}`;
  return { busy, command, error, status, accept };
}
function ImportButton(props) {
  const input = (0, import_react3.useRef)(null);
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)(import_jsx_runtime6.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("input", { ref: input, type: "file", accept: IMAGE_ACCEPT.join(","), hidden: true, onChange: (event) => {
      props.onFile(event.target.files?.[0]);
      event.target.value = "";
    } }),
    /* @__PURE__ */ (0, import_jsx_runtime6.jsxs)("button", { type: "button", className: "qccImportBtn", disabled: props.busy, title: props.title ?? "\u5BFC\u5165\u5546\u673A\u56FE\u7247\u6216 PDF\uFF08\u4E5F\u53EF\u4EE5\u76F4\u63A5\u62D6\u5165\u6216\u7C98\u8D34\uFF09", onClick: () => input.current?.click(), children: [
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("path", { d: "M21 12.5 12.5 21a5.5 5.5 0 0 1-7.8-7.8L14 3.9a3.7 3.7 0 0 1 5.2 5.2L9.9 18.4a1.8 1.8 0 0 1-2.6-2.6l8.3-8.3" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime6.jsx)("span", { children: props.busy ? "\u6682\u5B58\u4E2D\u2026" : "\u5BFC\u5165\u56FE\u7247" })
    ] })
  ] });
}
function DropZone(props) {
  const [dragging, setDragging] = (0, import_react3.useState)(false);
  const onDrop = (event) => {
    const file = importableFile(event.dataTransfer);
    setDragging(false);
    if (file === void 0) return;
    event.preventDefault();
    event.stopPropagation();
    props.onFile(file);
  };
  const onPaste = (event) => {
    const file = importableFile(event.clipboardData);
    if (file === void 0) return;
    event.preventDefault();
    event.stopPropagation();
    props.onFile(file);
  };
  return /* @__PURE__ */ (0, import_jsx_runtime6.jsx)(
    "div",
    {
      className: props.className,
      "data-dragging": dragging,
      onDragOver: (event) => {
        if (importableFile(event.dataTransfer) !== void 0 || (event.dataTransfer.types ?? []).includes("Files")) {
          event.preventDefault();
          setDragging(true);
        }
      },
      onDragLeave: () => setDragging(false),
      onDrop,
      onPaste,
      children: props.children
    }
  );
}

// src/previsit-dock.tsx
var import_react4 = require("react");
var import_react_dom = require("react-dom");

// src/previsit-store.ts
var EMPTY_SESSION_STATE = {
  selection: EMPTY_SELECTION,
  company: "",
  composer: EMPTY_COMPOSER_STATE,
  task: void 0,
  panel: null,
  view: "target",
  dismissedTaskIds: [],
  minimumNodeBaseline: 0
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
function locatePrevisitView(store, sessionId, view) {
  if (store.get(sessionId).view === view) return false;
  store.update(sessionId, (state) => ({ ...state, view }));
  return true;
}
function summarizeSelection(state, labels2) {
  const s = state.selection;
  const out = [];
  if (state.company.trim() !== "") out.push(state.company.trim());
  const role = s.role === void 0 ? void 0 : labels2.role(s.role);
  if (role !== void 0) out.push(role);
  const purpose = s.purpose === void 0 ? void 0 : labels2.purpose(s.purpose);
  if (purpose !== void 0) out.push(purpose);
  if (s.focus.length > 0) out.push("\u5173\u6CE8 " + s.focus.map(labels2.focus).filter(Boolean).join("\u3001"));
  const budget = s.budget === void 0 ? void 0 : labels2.budget(s.budget);
  if (budget !== void 0) out.push(budget);
  const output = s.output === void 0 ? void 0 : labels2.output(s.output);
  if (output !== void 0) out.push(output);
  return out;
}

// src/session-input.ts
function resolveSessionInput(host, sessionId) {
  const scope = host.sessions.scope?.(sessionId);
  if (scope === void 0) return void 0;
  const conversation = scope.get("conversation");
  return conversation?.input?.for(scope);
}
function writeSessionDraft(actions, text) {
  if (actions === void 0) return false;
  actions.setDraft(text);
  return true;
}
function clearSubmittedDraft(input, submitted) {
  if (input?.state.getSnapshot().draft === submitted) input.setDraft("");
}

// src/previsit-dock.tsx
var import_jsx_runtime7 = require("react/jsx-runtime");
function writeDraft(actions, text) {
  if (!writeSessionDraft(actions, text)) throw new Error("\u5F53\u524D\u4F1A\u8BDD\u8F93\u5165\u6846\u5C1A\u672A\u5C31\u7EEA\u3002");
}
var labelOf = (options) => (id) => options.find((o) => o.id === id)?.label;
function Chips(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "qccDockChips", children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "qccDockChip", "data-selected": props.selected.includes(option.id), onClick: () => props.onToggle(option.id), children: option.label }, option.id)) });
}
function isolateCompanyInputKey(event) {
  const composing = event.nativeEvent.isComposing === true || event.nativeEvent.keyCode === 229;
  if (event.key === "Enter" && !composing) event.preventDefault();
  event.stopPropagation();
}
function isolateCompanyInputEvent(event) {
  event.stopPropagation();
}
function updateCompanyComposer(current, nativeDraft, selection, company, isolated) {
  const generated = composeFullSentence(selection, company);
  if (isolated) {
    return {
      composer: { text: generated, lastGenerated: generated, lastCompany: company.trim(), mode: "generated" },
      nativeDraft: null
    };
  }
  const composer = applySelection({ ...updateManualText(current, nativeDraft), lastCompany: company }, selection, company);
  return { composer, nativeDraft: composer.mode === "generated" ? composer.text : null };
}
function usePrevisitComposer(args) {
  const { sessionId, store } = args;
  const state = (0, import_react4.useSyncExternalStore)(store.subscribe, () => store.get(sessionId), () => EMPTY_SESSION_STATE);
  const [error, setError] = (0, import_react4.useState)();
  const [submitting, setSubmitting] = (0, import_react4.useState)(false);
  const lifetime = (0, import_react4.useRef)({ active: true });
  const inFlight = (0, import_react4.useRef)(false);
  (0, import_react4.useEffect)(() => {
    const token = { active: true };
    lifetime.current = token;
    return () => {
      token.active = false;
    };
  }, [sessionId]);
  const isolated = args.draftMode === "isolated";
  const draft = isolated ? state.composer.text : args.readDraft();
  const synced = updateManualText(state.composer, draft);
  const manual = synced.mode === "manual" && draft.trim() !== "";
  const write = (selection, company) => {
    const next = updateCompanyComposer(state.composer, args.readDraft(), selection, company, isolated);
    if (next.nativeDraft !== null) args.writeDraft(next.nativeDraft);
    store.update(sessionId, (s) => ({ ...s, selection, company, composer: next.composer }));
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
    if (!isolated) args.writeDraft("");
    store.update(sessionId, (s) => ({ ...EMPTY_SESSION_STATE, task: s.task, panel: s.panel, view: s.view, dismissedTaskIds: s.dismissedTaskIds, minimumNodeBaseline: s.minimumNodeBaseline }));
    setError(void 0);
  };
  const startTask = async () => {
    if (inFlight.current) return;
    const lifetimeToken = lifetime.current;
    const current = store.get(sessionId);
    const text = (isolated ? composeFullSentence(current.selection, current.company) : args.readDraft()).trim();
    const invalid = validateComposerText(text);
    if (invalid !== void 0) {
      setError(invalid);
      return;
    }
    const id = createTaskId();
    const prompt = serializePrevisitRequest(text, id);
    const selection = { ...current.selection, focus: [...current.selection.focus] };
    const company = current.company.trim();
    inFlight.current = true;
    setSubmitting(true);
    setError(void 0);
    try {
      const nodeBaseline = await args.start(prompt);
      store.update(sessionId, (s) => ({
        ...s,
        composer: { ...s.composer, text: "", lastGenerated: "", mode: "generated" },
        task: { id, company, prompt, createdAt: (/* @__PURE__ */ new Date()).toISOString(), nodeBaseline, seenRunning: false, selection }
      }));
      if (lifetimeToken.active) args.onStarted?.();
    } catch {
      if (lifetimeToken.active) setError("\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5F53\u524D\u4F1A\u8BDD\u540E\u91CD\u8BD5");
    } finally {
      inFlight.current = false;
      if (lifetimeToken.active) setSubmitting(false);
    }
  };
  const summary = summarizeSelection(state, {
    role: labelOf(ROLE_OPTIONS),
    purpose: labelOf(PURPOSE_OPTIONS),
    focus: labelOf(FOCUS_OPTIONS),
    budget: labelOf(BUDGET_OPTIONS),
    output: labelOf(OUTPUT_OPTIONS)
  });
  return { state, manual, error, submitting, isolated, summary, toggleSingle, toggleFocus, setCompany, append, reset, startTask };
}
function PrevisitFields(props) {
  const imports = useImageImport(props.sessionId ?? "", props.send ?? (async () => {
    throw new Error("\u5F53\u524D\u4F1A\u8BDD\u5C1A\u672A\u5C31\u7EEA");
  }));
  const { actions: a } = props;
  const st = a.state;
  return /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)(DropZone, { className: "qccDockBody", onFile: (file) => {
    if (props.send !== void 0) void imports.accept(file);
  }, children: [
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("label", { className: "qccDockLabel", htmlFor: `${props.idPrefix}-company`, children: "\u62DC\u8BBF\u5BA2\u6237" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockCompanyRow", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(
          "input",
          {
            id: `${props.idPrefix}-company`,
            className: "qccDockCompany",
            value: st.company,
            placeholder: "\u4F01\u4E1A\u5168\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801",
            "data-previsit-company-input": "true",
            autoComplete: "off",
            onChange: (e) => a.setCompany(e.target.value),
            onKeyDownCapture: isolateCompanyInputKey,
            onKeyUpCapture: isolateCompanyInputEvent,
            onCompositionStartCapture: isolateCompanyInputEvent,
            onCompositionUpdateCapture: isolateCompanyInputEvent,
            onCompositionEndCapture: isolateCompanyInputEvent
          }
        ),
        props.send === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(ImportButton, { busy: imports.busy, onFile: (file) => {
          void imports.accept(file);
        } })
      ] })
    ] }),
    imports.status === void 0 && imports.error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("div", { className: "qccImportState", role: "status", "data-state": imports.error === void 0 ? imports.command?.state : "failed", children: imports.error ?? imports.status }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "qccDockLabel", children: "\u6211\u662F" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chips, { options: ROLE_OPTIONS, selected: st.selection.role === void 0 ? [] : [st.selection.role], onToggle: (id) => a.toggleSingle("role", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "qccDockLabel", children: "\u573A\u5408" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chips, { options: PURPOSE_OPTIONS, selected: st.selection.purpose === void 0 ? [] : [st.selection.purpose], onToggle: (id) => a.toggleSingle("purpose", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "qccDockLabel", children: "\u5173\u6CE8" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chips, { options: FOCUS_OPTIONS, selected: st.selection.focus, onToggle: a.toggleFocus })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "qccDockLabel", children: "\u6DF1\u5EA6" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chips, { options: BUDGET_OPTIONS, selected: st.selection.budget === void 0 ? [] : [st.selection.budget], onToggle: (id) => a.toggleSingle("budget", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockRow", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "qccDockLabel", children: "\u8F93\u51FA" }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)(Chips, { options: OUTPUT_OPTIONS, selected: st.selection.output === void 0 ? [] : [st.selection.output], onToggle: (id) => a.toggleSingle("output", id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockFoot", children: [
      /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("span", { className: "qccDockHint", "data-tone": a.error === void 0 ? void 0 : "error", children: a.error ?? (a.isolated ? "\u8BBE\u7F6E\u4EC5\u4FDD\u7559\u5728\u53F3\u4FA7\u5DE5\u4F5C\u53F0\uFF1B\u8F93\u5165\u5B8C\u6574\u540E\u70B9\u51FB\u300C\u5F00\u59CB\u5C3D\u8C03\u300D" : a.manual ? "\u8F93\u5165\u6846\u91CC\u6709\u4F60\u624B\u5199\u7684\u5185\u5BB9\uFF0C\u70B9\u9009\u4E0D\u4F1A\u8986\u76D6\uFF1B\u300C\u6309\u6761\u4EF6\u8865\u5145\u300D\u4F1A\u53E6\u8D77\u4E00\u53E5\u8FFD\u52A0" : "\u6761\u4EF6\u5B9E\u65F6\u5199\u8FDB\u8F93\u5165\u6846\uFF0C\u53EF\u4EE5\u76F4\u63A5\u6539\uFF1B\u6539\u597D\u540E\u70B9\u300C\u5F00\u59CB\u5C3D\u8C03\u300D") }),
      /* @__PURE__ */ (0, import_jsx_runtime7.jsxs)("div", { className: "qccDockActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "qccDockBtn", onClick: a.reset, children: "\u6E05\u7A7A" }),
        a.manual ? /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "qccDockBtn", onClick: a.append, children: "\u6309\u6761\u4EF6\u8865\u5145" }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime7.jsx)("button", { type: "button", className: "qccDockBtn qccDockPrimary", disabled: a.submitting, onClick: () => void a.startTask(), children: a.submitting ? "\u53D1\u9001\u4E2D\u2026" : props.startLabel ?? "\u5F00\u59CB\u5C3D\u8C03 \u2192" })
      ] })
    ] })
  ] });
}

// src/submission-reveal.ts
function installSubmissionReveal(host, reveal) {
  let alive = true;
  let stopFace = () => {
  };
  let attached;
  let current;
  const direct = /* @__PURE__ */ new Map();
  const awaitingLegacy = /* @__PURE__ */ new Map();
  const accept = (sessionId, ticket) => {
    if (ticket.handled) return;
    ticket.handled = true;
    if (!alive || host.sessions.list?.getSnapshot().current !== sessionId || !isPrevisitSession(sessionId)) return;
    try {
      reveal(sessionId);
    } catch {
    }
  };
  const connect = () => {
    const id = host.sessions.list?.getSnapshot().current;
    const face = id ? host.sessions.binding?.(id)?.session : void 0;
    if (id === current && face === attached) return;
    stopFace();
    stopFace = () => {
    };
    current = id;
    attached = face;
    if (!id || !face || !isPrevisitSession(id)) return;
    const original = face.beginSubmission;
    if (typeof original === "function") {
      const wrapped = function(input) {
        const pending = direct.get(id);
        const ticket = pending?.text === input.text ? pending : { text: input.text, handled: false };
        return original.call(this, { ...input, onRetire(result) {
          try {
            input.onRetire?.(result);
          } finally {
            if (result.reason === "observed") accept(id, ticket);
          }
        } });
      };
      face.beginSubmission = wrapped;
      stopFace = () => {
        if (face.beginSubmission === wrapped) face.beginSubmission = original;
      };
      return;
    }
    let previous = face.getSnapshot();
    let baseline = previous.nodes?.length ?? 0;
    let highest = Math.max(0, ...(previous.nodes ?? []).map((node) => node.seq ?? 0));
    stopFace = face.subscribe(() => {
      const next = face.getSnapshot();
      const nodes = next.nodes ?? [];
      const added = highest ? nodes.filter((node) => (node.seq ?? 0) > highest) : nodes.slice(baseline);
      highest = Math.max(highest, ...nodes.map((node) => node.seq ?? 0));
      baseline = nodes.length;
      const restoring = previous.openState !== void 0 && previous.openState !== "open" || next.loadingOlder;
      previous = next;
      if (restoring) return;
      for (const node of added) {
        if (node.kind === "user" || node.role === "user" || node.message?.role === "user") {
          const content = node.message?.content ?? node.content ?? node.parts;
          const text = node.text ?? (typeof content === "string" ? content : Array.isArray(content) ? content.map((part) => typeof part === "string" ? part : part?.text ?? "").join("\n") : "");
          const pending = awaitingLegacy.get(id) ?? [];
          const index = pending.findIndex((ticket2) => ticket2.text === text);
          const ticket = index >= 0 ? pending.splice(index, 1)[0] : direct.get(id) ?? { text, handled: false };
          ticket.observed = true;
          accept(id, ticket);
        }
      }
    });
  };
  connect();
  const stopList = host.sessions.list?.subscribe?.(connect);
  connect();
  return {
    async submit(sessionId, text, send) {
      const ticket = { text, handled: false };
      direct.set(sessionId, ticket);
      try {
        const result = await send();
        if (result === false) throw new Error("\u4EFB\u52A1\u672A\u88AB\u63A5\u7EB3\uFF0C\u8BF7\u91CD\u8BD5");
        accept(sessionId, ticket);
        if (!ticket.observed && typeof host.sessions.binding?.(sessionId)?.session.beginSubmission !== "function") {
          awaitingLegacy.set(sessionId, [...awaitingLegacy.get(sessionId) ?? [], ticket]);
        }
      } finally {
        if (direct.get(sessionId) === ticket) direct.delete(sessionId);
      }
    },
    dispose() {
      alive = false;
      stopList?.();
      stopFace();
      direct.clear();
      awaitingLegacy.clear();
    }
  };
}

// src/previsit-prompt.tsx
var import_react5 = require("react");
var import_react_dom2 = require("react-dom");
var import_jsx_runtime8 = require("react/jsx-runtime");
function mergePromptDraft(existing, generated, mode) {
  if (mode === "replace" || existing.trim() === "") return generated;
  const separator = existing.endsWith("\n") ? "" : "\n";
  return existing + separator + generated;
}
function cloneSelection(selection) {
  return { ...selection, focus: [...selection.focus] };
}
function PromptDialog(props) {
  const panelRef = (0, import_react5.useRef)(null);
  const closeRef = (0, import_react5.useRef)(props.onClose);
  closeRef.current = props.onClose;
  (0, import_react5.useEffect)(() => {
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
  const dialog = /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qccPromptBackdrop", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("section", { ref: panelRef, className: "qccPromptPanel", role: "dialog", "aria-modal": "true", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u63D0\u793A\u8BCD\u751F\u6210\u5668", "data-session-id": props.sessionId, tabIndex: -1, children: props.children }) });
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
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("fieldset", { className: "qccPromptGroup", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("legend", { children: props.title }),
    /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("div", { className: "qccPromptChoices", children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "qccPromptChoice", "data-selected": props.selected.includes(option.id), children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { type: props.multiple === true ? "checkbox" : "radio", name: props.multiple === true ? void 0 : props.title, checked: props.selected.includes(option.id), onChange: () => toggle(option.id) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: option.label })
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
  const [open, setOpen] = (0, import_react5.useState)(false);
  const [step, setStep] = (0, import_react5.useState)(1);
  const [company, setCompany] = (0, import_react5.useState)("");
  const [selection, setSelection] = (0, import_react5.useState)(() => cloneSelection(EMPTY_SELECTION));
  const [initializedSession, setInitializedSession] = (0, import_react5.useState)();
  const [error, setError] = (0, import_react5.useState)();
  const [conflict, setConflict] = (0, import_react5.useState)(false);
  const triggerRef = (0, import_react5.useRef)(null);
  const previousSession = (0, import_react5.useRef)(props.sessionId);
  (0, import_react5.useEffect)(() => {
    if (previousSession.current === props.sessionId) return;
    previousSession.current = props.sessionId;
    setOpen(false);
    setConflict(false);
    setError(void 0);
  }, [props.sessionId]);
  if (!enabled) return null;
  const openWizard = () => {
    if (initializedSession !== props.sessionId) {
      setStep(1);
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
    try {
      writeDraft(props.inputActions, next2);
    } catch {
      setError("\u5F53\u524D\u4F1A\u8BDD\u8F93\u5165\u6846\u65E0\u6CD5\u56DE\u586B\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
      return;
    }
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
  return /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qccPromptLayer", children: [
    /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { ref: triggerRef, type: "button", className: "qccPromptTrigger", "aria-label": "\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03\u63D0\u793A\u8BCD\u751F\u6210\u5668", "aria-expanded": open, onClick: openWizard, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("path", { d: "m12 3 1.2 3.8L17 8l-3.8 1.2L12 13l-1.2-3.8L7 8l3.8-1.2zM6 14l.8 2.2L9 17l-2.2.8L6 20l-.8-2.2L3 17l2.2-.8zM18 13l.7 1.8 1.8.7-1.8.7L18 18l-.7-1.8-1.8-.7 1.8-.7z" }) }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u63D0\u793A\u8BCD\u751F\u6210" })
    ] }),
    open && initializedSession === props.sessionId ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)(PromptDialog, { sessionId: props.sessionId, onClose: close, children: [
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("header", { className: "qccPromptHead", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h3", { children: "\u751F\u6210\u8BBF\u524D\u5C3D\u8C03\u4EFB\u52A1" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u56DB\u6B65\u660E\u786E\u5BF9\u8C61\u3001\u573A\u666F\u3001\u8303\u56F4\u548C\u8F93\u51FA\uFF1B\u56DE\u586B\u540E\u4ECD\u53EF\u4EBA\u5DE5\u4FEE\u6539\u3002" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "qccPromptClose", "aria-label": "\u5173\u95ED\u63D0\u793A\u8BCD\u751F\u6210\u5668", onClick: close, children: "\xD7" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qccPromptBody", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("nav", { className: "qccPromptSteps", "aria-label": "\u4EFB\u52A1\u8BBE\u7F6E\u6B65\u9AA4", children: [[1, "\u62DC\u8BBF\u5BF9\u8C61"], [2, "\u89D2\u8272\u573A\u666F"], [3, "\u8303\u56F4\u6DF1\u5EA6"], [4, "\u786E\u8BA4\u8F93\u51FA"]].map(([index, label]) => /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("button", { type: "button", "data-active": step === index, "aria-current": step === index ? "step" : void 0, onClick: () => setStep(Number(index)), children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("b", { children: index }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: label })
        ] }, index)) }),
        step === 1 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { children: "\u660E\u786E\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u53EF\u586B\u5199\u4F01\u4E1A\u5168\u79F0\u3001\u7B80\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\uFF1B\u7B80\u79F0\u5B58\u5728\u591A\u5019\u9009\u65F6\uFF0C\u667A\u80FD\u4F53\u4F1A\u5728\u4F1A\u8BDD\u4E2D\u8BF7\u4F60\u786E\u8BA4\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("label", { className: "qccPromptField", children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("span", { children: "\u4F01\u4E1A\u540D\u79F0 / \u4FE1\u7528\u4EE3\u7801" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("input", { autoFocus: true, value: company, placeholder: "\u4F8B\u5982\uFF1A\u4F01\u67E5\u67E5\u79D1\u6280\u80A1\u4EFD\u6709\u9650\u516C\u53F8", onChange: (event) => setCompany(event.target.value) })
          ] })
        ] }) : null,
        step === 2 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { children: "\u8BF4\u660E\u4F60\u7684\u89D2\u8272\u548C\u62DC\u8BBF\u573A\u666F" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u9ED8\u8BA4\u91C7\u7528\u94F6\u884C/\u4FE1\u8D37\u5BA2\u6237\u7ECF\u7406\u89C6\u89D2\uFF1B\u53EF\u6309\u672C\u6B21\u62DC\u8BBF\u89D2\u8272\u548C\u573A\u666F\u8C03\u6574\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OptionGroup, { title: "\u6211\u7684\u89D2\u8272", options: ROLE_OPTIONS, selected: selection.role === void 0 ? [] : [selection.role], onChange: (values) => setSingle(setSelection, "role", values) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OptionGroup, { title: "\u62DC\u8BBF\u573A\u666F", options: PURPOSE_OPTIONS, selected: selection.purpose === void 0 ? [] : [selection.purpose], onChange: (values) => setSingle(setSelection, "purpose", values) })
        ] }) : null,
        step === 3 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { children: "\u9009\u62E9\u5173\u6CE8\u8303\u56F4\u4E0E\u5C3D\u8C03\u6DF1\u5EA6" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u83DC\u5355\u4E0E\u9636\u6BB5\u53EA\u8D1F\u8D23\u5BFC\u822A\uFF1B\u771F\u5B9E\u8986\u76D6\u8303\u56F4\u4EE5\u672C\u6B21\u4F1A\u8BDD\u4E2D\u7684\u5DE5\u5177\u8C03\u7528\u548C\u62A5\u544A\u62AB\u9732\u4E3A\u51C6\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OptionGroup, { title: "\u91CD\u70B9\u5173\u6CE8", options: FOCUS_OPTIONS, multiple: true, selected: selection.focus, onChange: (values) => setSelection((current) => ({ ...current, focus: values })) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OptionGroup, { title: "\u5C3D\u8C03\u6DF1\u5EA6", options: BUDGET_OPTIONS, selected: selection.budget === void 0 ? [] : [selection.budget], onChange: (values) => setSingle(setSelection, "budget", values) })
        ] }) : null,
        step === 4 ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("section", { className: "qccPromptPane", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("h4", { children: "\u786E\u8BA4\u4EFB\u52A1\u63CF\u8FF0\u548C\u8F93\u51FA" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)(OptionGroup, { title: "\u8F93\u51FA\u5F62\u6001", options: OUTPUT_OPTIONS, selected: selection.output === void 0 ? [] : [selection.output], onChange: (values) => setSingle(setSelection, "output", values) }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("pre", { className: "qccPromptPreview", children: generated || "\u586B\u5199\u4F01\u4E1A\u540E\u5C06\u5728\u8FD9\u91CC\u751F\u6210\u4EFB\u52A1\u63CF\u8FF0\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "qccPromptNote", children: "\u56DE\u586B\u4E0D\u4F1A\u542F\u52A8\u5C3D\u8C03\u3002\u53EA\u6709\u70B9\u51FB DSH \u539F\u751F\u53D1\u9001\u6309\u94AE\u540E\uFF0C\u667A\u80FD\u4F53\u624D\u4F1A\u4F7F\u7528\u5F53\u524D\u7528\u6237\u81EA\u5DF1\u7684\u4F01\u67E5\u67E5 MCP \u8FDE\u63A5\u4E0E\u989D\u5EA6\u3002" })
        ] }) : null,
        conflict ? /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { className: "qccPromptConflict", role: "alertdialog", "aria-label": "\u5904\u7406\u5DF2\u6709\u8F93\u5165\u5185\u5BB9", children: [
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("strong", { children: "\u8F93\u5165\u6846\u5DF2\u6709\u5185\u5BB9" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { children: "\u8BF7\u9009\u62E9\u66FF\u6362\u539F\u6587\u3001\u8FFD\u52A0\u4EFB\u52A1\u63CF\u8FF0\uFF0C\u6216\u53D6\u6D88\u5E76\u4FDD\u7559\u5F53\u524D\u5185\u5BB9\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", onClick: () => setConflict(false), children: "\u53D6\u6D88" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", onClick: () => commit("append"), children: "\u8FFD\u52A0" }),
            /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "is-primary", onClick: () => commit("replace"), children: "\u66FF\u6362" })
          ] })
        ] }) : null,
        error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("p", { className: "qccPromptError", role: "alert", children: error })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime8.jsxs)("footer", { className: "qccPromptActions", children: [
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", disabled: step === 1, onClick: () => {
          setError(void 0);
          setConflict(false);
          setStep((current) => Math.max(1, current - 1));
        }, children: "\u4E0A\u4E00\u6B65" }),
        /* @__PURE__ */ (0, import_jsx_runtime8.jsx)("button", { type: "button", className: "is-primary", onClick: next, children: step === 4 ? "\u56DE\u586B\u5230\u5BF9\u8BDD\u6846" : "\u4E0B\u4E00\u6B65" })
      ] })
    ] }) : null
  ] });
}

// src/better-sidebar.ts
var import_react6 = require("react");
var PREVISIT_WORKBENCH_TAB_ID = "dsh-pre-duediligence:agent";
var SUPPORTED_SIDEBAR_VERSION = /^0\.(?:17|18)\.\d+$/u;
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
  let disposed = false;
  return {
    attach(sessionId, target) {
      if (disposed) return () => {
      };
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
      if (disposed) return;
      const target = targets.get(sessionId);
      if (target === void 0) {
        pending.add(sessionId);
        return;
      }
      target.store.reduce((state) => revealState(state, target.tabId));
    },
    dispose() {
      disposed = true;
      targets.clear();
      pending.clear();
    }
  };
}
function useWorkbenchReveal(controller, props) {
  const sessionId = props.scope.sessionId;
  const store = props.store;
  const tabId = props.tab.id;
  (0, import_react6.useEffect)(() => controller.attach(sessionId, { store, tabId }), [controller, sessionId, store, tabId]);
}
function assertBetterSidebar(service) {
  if (service === void 0 || service === null) {
    throw new Error("\u5DE5\u4F5C\u53F0\u9700\u8981\u5B89\u88C5 Better Sidebar\uFF1B\u5F53\u524D\u4F1A\u8BDD\u4ECD\u53EF\u4F7F\u7528\u539F\u751F\u8F93\u5165\u6846\u3002");
  }
  if (!SUPPORTED_SIDEBAR_VERSION.test(service.version)) {
    throw new Error("\u8BBF\u524D\u5DE5\u4F5C\u53F0\u652F\u6301 Better Sidebar 0.17.x / 0.18.x\uFF0C\u8BF7\u6838\u5BF9\u517C\u5BB9\u77E9\u9635\u3002");
  }
  if (!Array.isArray(service.features) || !service.features.includes("targetedOpen") || !service.features.includes("stateSubscription") || typeof service.registerTab !== "function" || typeof service.openTab !== "function" || typeof service.isTabEnabled !== "function" || typeof service.getSnapshot !== "function" || typeof service.subscribeState !== "function") {
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
var import_react7 = require("react");
var import_react_dom3 = require("react-dom");
var import_jsx_runtime9 = require("react/jsx-runtime");
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
  const [mount, setMount] = (0, import_react7.useState)(null);
  const [busy, setBusy] = (0, import_react7.useState)(false);
  const [error, setError] = (0, import_react7.useState)();
  const wide = props.wide !== false;
  (0, import_react7.useEffect)(() => {
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
  const button = /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
      children: /* @__PURE__ */ (0, import_jsx_runtime9.jsxs)("span", { className: "qccPrevisitLauncherContent", children: [
        /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(PrevisitLogo, { size: 18 }),
        wide ? /* @__PURE__ */ (0, import_jsx_runtime9.jsx)("span", { children: "\u8BBF\u524D\u5C3D\u8C03" }) : null
      ] })
    }
  );
  if (mount === null) return button;
  return (0, import_react_dom3.createPortal)(
    /* @__PURE__ */ (0, import_jsx_runtime9.jsx)(
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
function registerLeftSidebarLauncher(ctx, isActive = () => true) {
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "dsh-pre-duediligence-launcher",
    order: 20,
    inject: () => ({
      openAgent: async () => {
        const previous = ctx.sessions.list?.getSnapshot().current;
        const sessionId = await createPrevisitSession(ctx);
        if (isActive() && ctx.sessions.list?.getSnapshot().current === previous) ctx.sessions.open?.(sessionId);
      }
    })
  }, LeftSidebarEntry));
}

// src/previsit-home.tsx
var import_react8 = require("react");
var import_react_dom4 = require("react-dom");
var import_jsx_runtime10 = require("react/jsx-runtime");
var PREVISIT_HOME_TITLE = "\u8BBF\u524D\u5C3D\u8C03\u667A\u80FD\u4F53";
var PREVISIT_HOME_FLOWS = [
  { view: "target", label: "\u5BF9\u8C61\u4E0E\u76EE\u6807", icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "m15 15 4 4M10.5 7.5v6M7.5 10.5h6" })
  ] }) },
  { view: "scope", label: "\u8303\u56F4\u786E\u8BA4", icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_jsx_runtime10.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M4 5h16l-6 7v6l-4 2v-8z" }) }) },
  { view: "collect", label: "\u8D44\u6599\u91C7\u96C6", icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(import_jsx_runtime10.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" }) }) },
  { view: "verify", label: "\u8BC1\u636E\u6838\u9A8C", icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M12 8v5M12 17h.01" })
  ] }) },
  { view: "history", label: "\u4EFB\u52A1\u5386\u53F2", icon: /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)(import_jsx_runtime10.Fragment, { children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("path", { d: "M12 7v5l3 2" })
  ] }) }
];
function CapabilityIcon({ children }) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("svg", { viewBox: "0 0 24 24", "aria-hidden": "true", children });
}
function CapabilityBar(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("nav", { className: "qccPrevisitCapabilities", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u80FD\u529B\u83DC\u5355", children: PREVISIT_HOME_FLOWS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("button", { type: "button", className: "qccPrevisitCapability", "aria-label": item.label, title: item.label, onClick: () => props.onNavigate(item.view), children: [
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CapabilityIcon, { children: item.icon }),
    /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("span", { className: "qccPrevisitCapabilityLabel", children: item.label })
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
function resolvePrevisitHeroChrome(anchor) {
  const phaseRoot = anchor.closest("[data-phase]");
  if (phaseRoot?.getAttribute?.("data-phase") === "active") return null;
  const direct = anchor.closest('[data-phase="hero"]');
  const findTitle = (scope2) => {
    const eligible = (node) => ["\u63A2\u7D22\u672A\u81F3\u4E4B\u5883", "Into the Unknown"].includes(node.textContent?.trim() ?? "") || node.dataset.previsitHeroTitle === "true" && node.textContent === PREVISIT_HOME_TITLE;
    const spans = [...scope2.querySelectorAll("span")];
    const title = spans.find(eligible) ?? scope2.querySelector('[class*="headlineText"]');
    return title !== null && title !== void 0 && eligible(title) ? title : null;
  };
  if (direct !== null) {
    const title = findTitle(direct);
    if (title !== null) return { scope: direct, title };
  }
  let scope = anchor.closest("[data-composer-seat]") ?? anchor.parentElement;
  while (scope !== null && scope.tagName !== "BODY" && scope.tagName !== "HTML") {
    const title = findTitle(scope);
    if (title !== null) return { scope, title };
    scope = scope.parentElement;
  }
  return null;
}
function setPrevisitHeadline(anchor) {
  const originalTitles = /* @__PURE__ */ new Map();
  const originalMarks = /* @__PURE__ */ new Map();
  const originalBadges = /* @__PURE__ */ new Map();
  const originalRows = /* @__PURE__ */ new Map();
  const logos = /* @__PURE__ */ new Map();
  let observer = null;
  const restore = () => {
    for (const logo of logos.values()) logo.remove();
    for (const [mark, display] of originalMarks) mark.style.display = display;
    for (const [badge, display] of originalBadges) {
      badge.style.display = display;
      delete badge.dataset.previsitHeroBadge;
    }
    for (const [row, flag] of originalRows) {
      if (flag === null) row.removeAttribute("data-previsit-hero-row");
      else row.setAttribute("data-previsit-hero-row", flag);
    }
    for (const [title, text] of originalTitles) {
      if (title.textContent === PREVISIT_HOME_TITLE) title.textContent = text;
      delete title.dataset.previsitHeroTitle;
    }
    originalTitles.clear();
    originalMarks.clear();
    originalBadges.clear();
    originalRows.clear();
    logos.clear();
  };
  const sync = () => {
    const chrome = resolvePrevisitHeroChrome(anchor);
    if (chrome === null) {
      restore();
      return;
    }
    const { scope, title } = chrome;
    if (!originalTitles.has(title)) originalTitles.set(title, title.textContent);
    title.dataset.previsitHeroTitle = "true";
    if (title.textContent !== PREVISIT_HOME_TITLE) title.textContent = PREVISIT_HOME_TITLE;
    const row = title.parentElement;
    const nativeMark = row?.querySelector('[class*="fishHitbox"]');
    if (row !== null && row !== void 0 && nativeMark !== null && nativeMark !== void 0 && typeof document !== "undefined") {
      if (!originalRows.has(row)) originalRows.set(row, row.getAttribute("data-previsit-hero-row"));
      if (!originalMarks.has(nativeMark)) originalMarks.set(nativeMark, nativeMark.style.display);
      nativeMark.style.display = "none";
      row.dataset.previsitHeroRow = "true";
      if (!logos.get(row)?.isConnected) {
        const logo = document.createElement("span");
        logo.className = "qccPrevisitHeroLogo";
        logo.dataset.previsitOwned = "true";
        logo.setAttribute("aria-hidden", "true");
        logo.innerHTML = `<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" focusable="false"><path d="${PREVISIT_LOGO_PATH}"></path></svg>`;
        row.insertBefore(logo, title);
        logos.set(row, logo);
      }
    }
    const badge = [...scope.querySelectorAll("span")].find((node) => node.dataset.previsitHeroBadge === "true" || ["\u9884\u89C8\u7248", "Preview"].includes(node.textContent?.trim() ?? ""));
    if (badge !== void 0) {
      if (!originalBadges.has(badge)) originalBadges.set(badge, badge.style.display);
      badge.dataset.previsitHeroBadge = "true";
      badge.style.display = "none";
    }
  };
  sync();
  const observationRoot = resolvePrevisitHeroChrome(anchor)?.scope ?? anchor.closest("[data-phase]") ?? anchor.closest("[data-composer-seat]")?.parentElement ?? anchor.parentElement;
  observer = typeof MutationObserver === "function" ? new MutationObserver(sync) : null;
  if (observationRoot !== null && observationRoot.tagName !== "BODY" && observationRoot.tagName !== "HTML") observer?.observe(observationRoot, { childList: true, subtree: true, attributes: true, attributeFilter: ["data-phase"] });
  return () => {
    observer?.disconnect();
    restore();
  };
}
function PrevisitHome({ sessionId, useSession, openWorkbench: openWorkbench2 }) {
  const blank = useSession((state) => state.composerPhase === "blank" || state.composerPhase === void 0 && (state.blank === true || state.awaitingFirstTurn === true) && !state.running && !state.promptAttempted);
  const enabled = isPrevisitSession(sessionId);
  const marker = (0, import_react8.useRef)(null);
  const [menuMount, setMenuMount] = (0, import_react8.useState)(null);
  const [error, setError] = (0, import_react8.useState)();
  (0, import_react8.useEffect)(() => {
    setError(void 0);
  }, [sessionId]);
  (0, import_react8.useEffect)(() => {
    if (!enabled || marker.current === null) return;
    return installCapabilityMount(marker.current, (mount) => setMenuMount((current) => current === mount ? current : mount));
  }, [enabled, sessionId, blank]);
  (0, import_react8.useEffect)(() => {
    if (!enabled || marker.current === null) return;
    return setPrevisitHeadline(marker.current);
  }, [enabled, blank, sessionId]);
  if (!enabled) return null;
  const menu = /* @__PURE__ */ (0, import_jsx_runtime10.jsx)(CapabilityBar, { onNavigate: (view) => {
    try {
      openWorkbench2?.(view);
      setError(void 0);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "\u5DE5\u4F5C\u53F0\u6682\u4E0D\u53EF\u7528\uFF0C\u8BF7\u68C0\u67E5\u63D2\u4EF6\u914D\u7F6E\u3002");
    }
  } });
  return /* @__PURE__ */ (0, import_jsx_runtime10.jsxs)("div", { ref: marker, className: `qccPrevisitExperience${blank ? " is-home" : ""}`, "data-session-id": sessionId, children: [
    menuMount === null ? menu : (0, import_react_dom4.createPortal)(menu, menuMount),
    error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime10.jsx)("p", { role: "status", children: error })
  ] });
}

// src/hosted-task-api.ts
function hostedTaskListUrl(scope) {
  return scope.kind === "current" ? `/previsit/api/tasks?sessionId=${encodeURIComponent(scope.sessionId)}` : "/previsit/api/tasks";
}
async function fetchHostedTask(taskId, sessionId) {
  const response = await fetch(`/previsit/api/tasks/${encodeURIComponent(taskId)}?sessionId=${encodeURIComponent(sessionId)}`, { headers: { accept: "application/json" } });
  if (response.status === 404) return null;
  const payload = await response.json();
  if (!response.ok || payload.ok === false || payload.task === void 0) throw new Error(payload.message ?? `\u4EFB\u52A1\u72B6\u6001\u8BFB\u53D6\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
  return payload.task;
}
async function fetchHostedTasks(scope) {
  const response = await fetch(hostedTaskListUrl(scope), { headers: { accept: "application/json" } });
  const payload = await response.json();
  if (!response.ok || payload.ok === false || !Array.isArray(payload.tasks)) throw new Error(payload.message ?? `\u4EFB\u52A1\u5386\u53F2\u8BFB\u53D6\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
  return payload.tasks;
}

// src/ordinary-session-guard.ts
var BUSINESS_SESSION_PATTERN = /^session-dsh-(?:pre-duediligence|data-cleaning-agent|form-fill-agent|tender-workbench)-/u;
function isBusinessSession(sessionId) {
  return BUSINESS_SESSION_PATTERN.test(sessionId);
}
function installOrdinarySessionGuard(host, navigation) {
  const original = navigation.connectWorkspace;
  if (typeof original !== "function") return () => {
  };
  const pending = /* @__PURE__ */ new Map();
  let active = true;
  const guarded = async function(workspaceId) {
    const selected = await original.call(this, workspaceId);
    if (!active || !isBusinessSession(selected)) return selected;
    const existing = pending.get(workspaceId);
    if (existing !== void 0) return existing;
    const resolveOrdinary = async () => {
      const workspace = host.workspaces?.list?.getSnapshot();
      const target = workspace?.items?.find((item) => item.workspaceId === workspaceId);
      if (target === void 0) throw new Error("\u65B0\u4F1A\u8BDD\u6240\u5C5E\u5DE5\u4F5C\u7A7A\u95F4\u4E0D\u53EF\u7528");
      const snapshot = host.sessions.list?.getSnapshot();
      const ids = snapshot?.ids ?? Object.keys(snapshot?.byId ?? {});
      const archived = new Set(workspace?.archivedSessionIds ?? []);
      const reusable = ids.find((id) => {
        const summary = snapshot?.byId?.[id];
        return typeof target.path === "string" && !isBusinessSession(id) && summary?.blank === true && summary.cwd === target.path && target.sessionIds?.includes(id) === true && !archived.has(id);
      });
      if (reusable !== void 0) return reusable;
      const create = host.sessions.create;
      if (typeof create !== "function") throw new Error("\u5F53\u524D DSH \u7248\u672C\u6CA1\u6709\u53EF\u7528\u7684\u666E\u901A\u4F1A\u8BDD\u521B\u5EFA\u80FD\u529B");
      const created = await create.call(host.sessions, { workspaceId });
      if (isBusinessSession(created)) throw new Error("\u65B0\u4F1A\u8BDD\u9519\u8BEF\u8FD4\u56DE\u4E86\u4E1A\u52A1\u4F1A\u8BDD");
      return created;
    };
    const attempt = resolveOrdinary().finally(() => {
      pending.delete(workspaceId);
    });
    pending.set(workspaceId, attempt);
    return attempt;
  };
  navigation.connectWorkspace = guarded;
  return () => {
    active = false;
    if (navigation.connectWorkspace === guarded) navigation.connectWorkspace = original;
  };
}

// src/workbench-state.ts
var PREVISIT_PHASES = ["target", "scope", "collect", "verify", "output"];
function hasTool(toolNames, fragments) {
  return toolNames.some((name) => fragments.some((fragment) => name.includes(fragment)));
}
function isOpportunityTool(name) {
  if (isRiskTool(name)) return false;
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
  if (input.reportReady) return "ready";
  if (input.running) return "running";
  if (input.lastAgentError !== null) return "failed";
  return "waiting-agent";
}
var COMPLETE_OUTCOMES = /* @__PURE__ */ new Set(["done", "no-data", "skipped"]);
var REVIEW_OUTCOMES = /* @__PURE__ */ new Set(["unknown", "no-permission", "not-executed"]);
function eventPhase(events, taskFailed) {
  if (events.some((event) => event.status === "running")) return "active";
  if (events.some((event) => event.status === "failed")) return taskFailed ? "failed" : "review";
  if (events.some((event) => REVIEW_OUTCOMES.has(event.status))) return "review";
  return events.some((event) => COMPLETE_OUTCOMES.has(event.status)) ? "done" : "idle";
}
function derivePhaseStates(input) {
  const status = deriveWorkbenchStatus(input);
  const events = input.toolEvents ?? [];
  const latest = new Map(events.map((event) => [event.name, event]));
  const latestEvents = [...latest.values()];
  const completed2 = latestEvents.filter((e) => COMPLETE_OUTCOMES.has(e.status)).map((e) => e.name);
  const collectEvents = latestEvents.filter((event) => isOpportunityTool(event.name) && !event.name.includes("get_company_by_query"));
  const verifyEvents = latestEvents.filter((event) => isRiskTool(event.name));
  const entitySeen = hasTool(completed2, ["get_company_by_query", "get_company_profile"]);
  const target = completed2.includes("previsit_confirm_entity") ? "done" : entitySeen ? "active" : "idle";
  const scope = completed2.includes("previsit_begin") ? "done" : "idle";
  if (!input.hasTask) {
    return PREVISIT_PHASES.map((id, index) => ({ id, progress: index === 0 ? "active" : "idle" }));
  }
  const collect = eventPhase(collectEvents, status === "failed");
  const verify = eventPhase(verifyEvents, status === "failed");
  if (status === "ready") return [
    { id: "target", progress: target },
    { id: "scope", progress: scope },
    { id: "collect", progress: collect },
    { id: "verify", progress: verify },
    { id: "output", progress: "done" }
  ];
  if (status === "failed") {
    return [
      { id: "target", progress: target },
      { id: "scope", progress: scope },
      { id: "collect", progress: collect === "idle" && entitySeen ? "review" : collect === "idle" ? "failed" : collect },
      { id: "verify", progress: verify === "idle" ? "failed" : verify },
      { id: "output", progress: "failed" }
    ];
  }
  return [
    { id: "target", progress: target },
    { id: "scope", progress: scope },
    { id: "collect", progress: collect !== "idle" ? collect : entitySeen || input.running ? "active" : "idle" },
    { id: "verify", progress: verify },
    { id: "output", progress: input.reportReady ? "done" : "idle" }
  ];
}

// src/workbench-style.ts
var WORKBENCH_CSS = String.raw`
.qccPwSummaryGrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(min(100%,300px),1fr));gap:12px;align-items:start}
.qccPwSummaryGrid .qccPwCard{margin:0;min-width:0;overflow-wrap:anywhere}
.qccPwSummaryGrid li,.qccPwAnalysis li{margin:6px 0;line-height:1.65}
.qccPwSummaryGrid details,.qccPwAnalysis details{border-top:1px solid var(--qcc-border);padding-top:10px;margin-top:12px;overflow-wrap:anywhere}
.qccPwSummaryGrid summary,.qccPwAnalysis summary{cursor:pointer;color:var(--qcc-action)}
.qccPwAnalysis{padding:16px 0;border-top:1px solid var(--qcc-border);overflow-wrap:anywhere}
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

[data-composer-card]:has(.qccPromptTrigger){padding-top:48px}
.qccPromptLayer{position:absolute;inset:0;z-index:40;pointer-events:none}
.qccPromptTrigger{position:absolute;top:10px;left:16px;display:inline-flex;align-items:center;gap:6px;min-height:28px;padding:3px 10px;border:1px solid var(--qcc-border);border-radius:6px;background:var(--qcc-selected);color:var(--qcc-action);font:inherit;font-size:12px;font-weight:600;cursor:pointer;pointer-events:auto}
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
.qccPwTabs{display:flex;gap:22px;padding:0 18px;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}.qccPwTabs button{position:relative;min-height:39px;padding:0;border:0;background:transparent;color:var(--qcc-secondary);font:inherit;font-size:13px;cursor:pointer}.qccPwTabs button[data-selected="true"]{color:var(--qcc-action);font-weight:650}.qccPwTabs button[data-selected="true"]::after{position:absolute;right:0;bottom:-1px;left:0;height:2px;background:var(--qcc-action);content:""}
.qccPwStages{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));min-height:78px;padding:0;border-bottom:1px solid var(--qcc-border);background:var(--qcc-surface);overflow:hidden;flex:none}
.qccPwStage{position:relative;display:flex;min-width:0;min-height:78px;align-items:center;justify-content:center;flex-direction:column;gap:7px;padding:9px 5px;border:0;border-right:1px solid var(--qcc-border);background:transparent;color:var(--qcc-secondary);font:inherit;text-align:center;cursor:pointer}.qccPwStage:last-child{border-right:0}.qccPwStage:hover{background:var(--qcc-page);color:var(--qcc-text)}.qccPwStage[data-selected="true"]{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStage[data-selected="true"]::after{position:absolute;right:10px;bottom:-1px;left:10px;height:3px;border-radius:3px 3px 0 0;background:var(--qcc-action);content:""}
.qccPwStageIcon{display:grid;place-items:center;width:30px;height:30px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);flex:0 0 30px}.qccPwStage[data-selected="true"] .qccPwStageIcon,.qccPwStage[data-progress="active"] .qccPwStageIcon{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStage[data-progress="done"] .qccPwStageIcon{border-color:var(--qcc-success);background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStage[data-progress="review"] .qccPwStageIcon{border-color:var(--qcc-border);background:var(--qcc-table-head);color:var(--qcc-secondary)}.qccPwStage[data-progress="failed"] .qccPwStageIcon{border-color:var(--qcc-danger);background:var(--qcc-danger-bg);color:var(--qcc-danger)}.qccPwStage[data-progress="done"]:not([data-selected="true"]){color:var(--qcc-success)}.qccPwStage[data-progress="review"]:not([data-selected="true"]){color:var(--qcc-secondary)}.qccPwStage[data-progress="failed"]:not([data-selected="true"]){color:var(--qcc-danger)}
.qccPwIcon{width:17px;height:17px;fill:none;stroke:currentColor;stroke-width:1.65;stroke-linecap:round;stroke-linejoin:round}
.qccPwStageCopy{display:block;min-width:0;max-width:100%}.qccPwStageCopy strong{display:block;overflow:hidden;font-size:12px;line-height:1.35;text-overflow:ellipsis;white-space:nowrap}
.qccPwBody{min-height:0;padding:16px;overflow:auto;flex:1}.qccPwPanel{display:grid;width:100%;min-width:0;gap:13px;max-width:960px;margin:0 auto}
.qccPwShell>.qccPwLiveProgress{flex-shrink:0;margin:8px 12px;max-height:180px;overflow:auto}.qccPwLiveProgress[data-running="false"] .qccPwLivePulse{animation:none;background:var(--qcc-secondary)}
.qccPwPageHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:14px}.qccPwPageHeading h2{margin:1px 0 0;font-size:19px}.qccPwPageHeading p:not(.qccPwEyebrow){margin:4px 0 0;color:var(--qcc-secondary);font-size:12px;line-height:1.5}.qccPwEyebrow{margin:0;color:var(--qcc-action);font-size:10px;font-weight:750;letter-spacing:.12em}.qccPwTaskId{padding:5px 8px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);color:var(--qcc-secondary);font:11px ui-monospace,SFMono-Regular,Menlo,monospace}
.qccPwCard{min-width:0;padding:15px;border:1px solid var(--qcc-border);border-radius:12px;background:var(--qcc-surface)}.qccPwCardHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;margin-bottom:12px}.qccPwCardHeader>div{min-width:0;flex:1 1 0}.qccPwCardHeader h3{margin:0;font-size:14px}.qccPwCardHeader p{margin:4px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.5}.qccPwModeGroup{display:flex;justify-content:flex-end;flex-wrap:wrap;gap:5px}.qccPwMode{padding:3px 7px;border-radius:999px;background:var(--qcc-selected);color:var(--qcc-action);font-size:10px;white-space:nowrap}.qccPwMode[data-tone="neutral"]{background:var(--qcc-table-head);color:var(--qcc-secondary)}.qccPwMode[data-tone="success"]{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwMode[data-tone="review"]{background:var(--qcc-review-bg);color:var(--qcc-review)}.qccPwMode[data-tone="error"]{background:var(--qcc-danger-bg);color:var(--qcc-danger)}
.qccPwFeedback{display:flex;align-items:flex-start;gap:10px;padding:12px 13px;border:1px solid var(--qcc-border);border-radius:10px;background:var(--qcc-table-head)}.qccPwFeedback[data-tone="success"]{border-color:var(--qcc-success);background:var(--qcc-success-bg)}.qccPwFeedback[data-tone="error"]{border-color:var(--qcc-danger);background:var(--qcc-danger-bg)}.qccPwFeedbackIcon{color:var(--qcc-action);flex:none}.qccPwFeedback[data-tone="success"] .qccPwFeedbackIcon{color:var(--qcc-success)}.qccPwFeedback[data-tone="error"] .qccPwFeedbackIcon{color:var(--qcc-danger)}.qccPwFeedback strong{font-size:13px}.qccPwFeedback p{margin:3px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.55}
.qccPwLiveProgress{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;gap:10px;padding:13px;border:1px solid var(--qcc-brand);border-radius:10px;background:var(--qcc-selected)}.qccPwLivePulse{width:9px;height:9px;margin-top:4px;border-radius:50%;background:var(--qcc-brand);box-shadow:0 0 0 0 color-mix(in srgb,var(--qcc-brand) 45%,transparent);animation:qccPwPulse 1.6s ease-out infinite}.qccPwLiveCopy{min-width:0}.qccPwLiveCopy strong{display:block;color:var(--qcc-action);font-size:13px}.qccPwLiveCopy p{margin:4px 0 0;color:var(--qcc-secondary);font-size:11px;line-height:1.55}.qccPwLiveMetrics{grid-column:2;display:flex;flex-wrap:wrap;gap:5px}.qccPwLiveMetrics span{padding:3px 7px;border:1px solid var(--qcc-border);border-radius:999px;background:var(--qcc-surface);color:var(--qcc-secondary);font-size:9px}.qccPwLiveMetrics span[data-tone="success"]{border-color:var(--qcc-success);background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwLiveMetrics span[data-tone="error"]{border-color:var(--qcc-danger);background:var(--qcc-danger-bg);color:var(--qcc-danger)}@keyframes qccPwPulse{70%{box-shadow:0 0 0 7px transparent}100%{box-shadow:0 0 0 0 transparent}}
.qccPwSteps{display:grid;grid-template-columns:repeat(4,1fr);gap:8px;margin:0;padding:0;list-style:none}.qccPwStep{display:flex;align-items:flex-start;gap:8px;padding:10px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-surface)}.qccPwStepDot{display:grid;place-items:center;width:23px;height:23px;border-radius:50%;background:var(--qcc-page);color:var(--qcc-secondary);font-size:10px;flex:none}.qccPwStep[data-state="done"]{border-color:var(--qcc-success)}.qccPwStep[data-state="done"] .qccPwStepDot{background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwStep[data-state="active"]{border-color:var(--qcc-brand)}.qccPwStep[data-state="active"] .qccPwStepDot{background:var(--qcc-selected);color:var(--qcc-action)}.qccPwStep[data-state="review"]{border-color:var(--qcc-review)}.qccPwStep[data-state="review"] .qccPwStepDot{background:var(--qcc-review-bg);color:var(--qcc-review)}.qccPwStep[data-state="failed"]{border-color:var(--qcc-danger)}.qccPwStep[data-state="failed"] .qccPwStepDot{background:var(--qcc-danger-bg);color:var(--qcc-danger)}.qccPwStepCopy{display:grid;gap:3px}.qccPwStepCopy b{font-size:11px}.qccPwStepCopy small{color:var(--qcc-secondary);font-size:9px}
.qccPwDims{display:flex;flex-wrap:wrap;gap:7px}.qccPwDim{padding:5px 8px;border:1px solid var(--qcc-border);border-radius:7px;color:var(--qcc-secondary);font-size:11px}.qccPwDim[data-status="done"],.qccPwDim[data-status="no-data"],.qccPwDim[data-status="skipped"]{border-color:var(--qcc-success);background:var(--qcc-success-bg);color:var(--qcc-success)}.qccPwDim[data-status="running"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}.qccPwDim[data-status="unknown"],.qccPwDim[data-status="no-permission"],.qccPwDim[data-status="not-executed"]{border-color:var(--qcc-review);background:var(--qcc-review-bg);color:var(--qcc-review)}.qccPwDim[data-status="failed"]{border-color:var(--qcc-danger);background:var(--qcc-danger-bg);color:var(--qcc-danger)}.qccPwDim[data-status="not-executed"]{border-style:dashed}
.qccPwEmpty,.qccPwNote{margin:0;color:var(--qcc-secondary);font-size:12px;line-height:1.65}.qccPwNote{padding:10px 12px;border-left:3px solid var(--qcc-brand);background:var(--qcc-selected)}
.qccPwHistorySource{max-width:100%;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.qccPwHistorySource[data-complete="false"]{font-style:italic}
.qccPwHistoryCard{display:block;width:100%;color:inherit;font:inherit;text-align:left;cursor:pointer}.qccPwHistoryCard:hover:not(:disabled){border-color:var(--qcc-brand);box-shadow:0 2px 8px color-mix(in srgb,var(--qcc-brand) 10%,transparent)}.qccPwHistoryCard:focus-visible{outline:3px solid var(--qcc-brand);outline-offset:2px}.qccPwHistoryCard:disabled{cursor:not-allowed;opacity:.68}.qccPwHistoryOpen{display:block;margin-top:9px;color:var(--qcc-action);font-size:11px;font-weight:650;text-align:right}.qccPwHistoryCard:disabled .qccPwHistoryOpen{color:var(--qcc-secondary)}
.qccPwHistoryHeading{align-items:center}.qccPwHistoryActions{display:flex;justify-content:flex-end;margin-top:12px}.qccPwHistoryActions .qccPwPrimary:disabled{border-color:var(--qcc-border);background:var(--qcc-page);color:var(--qcc-secondary);cursor:not-allowed}
.qccPwStateStrip{display:grid;grid-template-columns:repeat(4,1fr);gap:6px}.qccPwState{display:grid;gap:3px;padding:7px;border:1px solid var(--qcc-border);border-radius:7px;background:var(--qcc-surface);color:var(--qcc-secondary);text-align:center}.qccPwState b{font-size:10px;font-weight:600}.qccPwState small{font-size:8px;color:var(--qcc-secondary)}.qccPwState[data-state="pending"]{border-style:dashed}.qccPwState[data-state="selected"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}.qccPwState[data-state="selected"] b{font-weight:700}.qccPwState[data-state="selected"] small{color:var(--qcc-action)}.qccPwState[data-state="excluded"]{background:var(--qcc-page)}.qccPwState[data-state="undetermined"]{border-color:var(--qcc-review);background:var(--qcc-review-bg);color:var(--qcc-review)}.qccPwState[data-state="undetermined"] small{color:var(--qcc-review)}
.qccPwHypos{display:grid;gap:8px;margin:0;padding:0;list-style:none}.qccPwHypos li{display:grid;grid-template-columns:auto auto 1fr;align-items:start;gap:8px;padding:9px;border-radius:8px;background:var(--qcc-page);font-size:11px;line-height:1.55}.qccPwPri{padding:2px 5px;border-radius:5px;background:var(--qcc-table-head);color:var(--qcc-secondary)}.qccPwPri[data-p="P0"]{background:var(--qcc-danger-bg);color:var(--qcc-danger)}.qccPwPri[data-p="P1"]{background:var(--qcc-review-bg);color:var(--qcc-review)}
.qccPwRiskTiles{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qccPwRiskTile{padding:11px;border:1px solid var(--qcc-border);border-radius:9px;background:var(--qcc-page)}.qccPwRiskTileTop{display:flex;justify-content:space-between;gap:8px}.qccPwRiskTileTop b,.qccPwRiskTileTop strong{font-size:12px}.qccPwRiskTile p{margin:6px 0 0;color:var(--qcc-secondary);font-size:10px;line-height:1.5}.qccPwRiskTile[data-clear="true"]{border-color:var(--qcc-success);background:var(--qcc-success-bg)}.qccPwRiskTile[data-clear="true"] .qccPwRiskTileTop{color:var(--qcc-success)}.qccPwRiskTile[data-level="红线"]:not([data-empty="true"]){border-color:var(--qcc-danger);background:var(--qcc-danger-bg)}.qccPwRiskTile[data-level="关注"]:not([data-empty="true"]){border-color:var(--qcc-review);background:var(--qcc-review-bg)}.qccPwRiskTile[data-level="信息"]:not([data-empty="true"]){border-color:var(--qcc-brand);background:var(--qcc-selected)}.qccPwRiskBoundary{grid-column:1/-1;margin:0;color:var(--qcc-secondary);font-size:10px;line-height:1.5}
.qccPwDeliverables{display:grid;grid-template-columns:repeat(2,1fr);gap:8px}.qccPwDeliverable{display:flex;align-items:flex-start;gap:9px;padding:9px;border-radius:8px;background:var(--qcc-page)}.qccPwDeliverable>span{color:var(--qcc-action);font-weight:700}.qccPwDeliverable div{display:grid;gap:3px}.qccPwDeliverable b{font-size:11px}.qccPwDeliverable small{color:var(--qcc-secondary);font-size:9px;line-height:1.45}
.qccPwCoverage{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}.qccPwMetric{display:grid;gap:4px;padding:12px;border-radius:9px;background:var(--qcc-table-head);text-align:center}.qccPwMetric strong{color:var(--qcc-action);font-size:19px}.qccPwMetric span{color:var(--qcc-secondary);font-size:10px}
.qccPwScopeList{display:grid;gap:0;margin:0}.qccPwScopeList>div{display:grid;grid-template-columns:96px 1fr;gap:12px;padding:10px 0;border-bottom:1px solid var(--qcc-border)}.qccPwScopeList>div:last-child{border-bottom:0}.qccPwScopeList dt{color:var(--qcc-secondary);font-size:12px}.qccPwScopeList dd{margin:0;color:var(--qcc-text);font-size:12px}
.qccPwPrompt{max-height:220px;margin:0;padding:11px;border-radius:8px;background:var(--qcc-page);color:var(--qcc-secondary);font:11px/1.6 ui-monospace,SFMono-Regular,Menlo,monospace;white-space:pre-wrap;overflow:auto}
.qccPwFooter{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:11px 16px;border-top:1px solid var(--qcc-border);background:var(--qcc-surface);flex:none}.qccPwFooterHint{min-width:0;color:var(--qcc-secondary);font-size:10px}.qccPwFooterHint[data-tone="error"]{color:var(--qcc-danger)}.qccPwFooterActions{display:flex;gap:8px;flex:none}.qccPwPrimary,.qccPwSecondary{display:inline-flex;align-items:center;justify-content:center;gap:6px;min-height:34px;padding:0 13px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:12px;cursor:pointer}.qccPwPrimary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}.qccPwPrimary:hover{border-color:var(--qcc-action-hover);background:var(--qcc-action-hover)}.qccPwPrimary[aria-disabled="true"]{border-color:var(--qcc-border);background:var(--qcc-page);color:var(--qcc-secondary)}.qccPwPrimary[aria-disabled="true"]:hover{border-color:var(--qcc-border);background:var(--qcc-page);color:var(--qcc-secondary)}.qccPwSecondary:hover{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}
.qccPwReportCard{padding:0;overflow:hidden}.qccPwReportFrame{display:block;width:100%;min-height:480px;border:0;background:#fff}

.qccDockBody{display:grid;gap:12px}.qccDockRow{display:grid;grid-template-columns:68px 1fr;align-items:start;gap:10px}.qccDockLabel{padding-top:7px;color:var(--qcc-secondary);font-size:12px}.qccDockCompany{width:100%;min-height:38px;padding:8px 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:16px;box-sizing:border-box}.qccDockChips{display:flex;flex-wrap:wrap;gap:7px}.qccDockChip{min-height:32px;padding:0 10px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-secondary);font:inherit;font-size:11px;cursor:pointer}.qccDockChip[data-selected="true"]{border-color:var(--qcc-brand);background:var(--qcc-selected);color:var(--qcc-action)}.qccDockFoot{display:flex;align-items:center;justify-content:space-between;gap:12px;padding-top:4px}.qccDockHint{color:var(--qcc-secondary);font-size:10px;line-height:1.45}.qccDockHint[data-tone="error"]{color:var(--qcc-danger)}.qccDockActions{display:flex;gap:7px;flex:none}.qccDockBtn{min-height:34px;padding:0 11px;border:1px solid var(--qcc-border);border-radius:8px;background:var(--qcc-surface);color:var(--qcc-text);font:inherit;font-size:11px;cursor:pointer}.qccDockPrimary{border-color:var(--qcc-action);background:var(--qcc-action);color:var(--qcc-action-text)}

@media(max-width:760px){
  .qccPrevisitCapabilities{justify-content:flex-start;padding-inline:12px}.qccPrevisitCapability{min-width:92px;padding-inline:10px}
  .qccPromptBackdrop{padding:0;overflow:hidden}.qccPromptPanel{width:100%;max-width:100vw;max-height:100dvh;height:100dvh;border:0;border-radius:0}.qccPromptHead,.qccPromptBody,.qccPromptActions{min-width:0;width:100%;padding-inline:16px;box-sizing:border-box}.qccPromptHead>div{min-width:0}.qccPromptChoices{grid-template-columns:repeat(2,minmax(0,1fr))}.qccPromptSteps button{justify-content:center}.qccPromptSteps button span{display:none}
  .qccPwHeader{align-items:flex-start}.qccPwSession{display:none}.qccPwStage{min-height:66px;gap:5px;padding:7px 3px}.qccPwStageIcon{width:25px;height:25px;flex-basis:25px}.qccPwStageCopy strong{font-size:10px}.qccPwStage[data-selected="true"]::after{right:6px;left:6px}.qccPwBody{padding:12px}.qccPwSteps{grid-template-columns:repeat(2,1fr)}.qccPwFooter{align-items:flex-end}.qccPwFooterHint{display:none}.qccPwDeliverables{grid-template-columns:1fr}.qccDockRow{grid-template-columns:1fr}.qccDockLabel{padding:0}.qccDockFoot{align-items:stretch;flex-direction:column}.qccDockActions{justify-content:flex-end}
}
@media(max-width:430px){.qccPromptChoices{grid-template-columns:1fr}.qccPwRiskTiles,.qccPwCoverage,.qccPwStateStrip{grid-template-columns:repeat(2,1fr)}.qccPwSubtitle{max-width:190px}}
@media(prefers-reduced-motion:reduce){.qccPwShell *,.qccPromptPanel *,.qccPrevisitCapabilities *{animation:none!important;transition:none!important}}
html[data-qcc-drop="1"] [data-composer-card]{outline:2px dashed var(--qcc-action,#0875d1);outline-offset:2px}
html[data-qcc-drop="1"]::after{content:"松开即可识别企业名单（图片 / PDF）";position:fixed;z-index:2147483000;left:50%;bottom:28px;transform:translateX(-50%);padding:9px 16px;border-radius:8px;background:rgba(8,15,28,.88);color:#fff;font:13px/1.4 system-ui,-apple-system,"PingFang SC",sans-serif;pointer-events:none}
.qccPlan{display:flex;flex-direction:column;gap:14px}.qccPlanGroup{display:flex;flex-direction:column;gap:8px}.qccPlanLabel{color:var(--qcc-secondary);font-size:12px;font-weight:600}
.qccPlanCandidates{margin:0;padding:0;list-style:none;display:flex;flex-direction:column;gap:6px}.qccPlanCandidates label{display:flex;align-items:center;gap:10px;padding:8px 10px;border:1px solid var(--qcc-border);border-radius:5px;cursor:pointer}.qccPlanCandidates label:has(input:checked){border-color:var(--qcc-action);background:var(--qcc-selected)}.qccPlanCandidates input{margin:0}.qccPlanName{flex:1;min-width:0;overflow-wrap:anywhere;font-size:13px;font-weight:600;color:var(--qcc-text)}.qccPlanCandidates small{max-width:40%;overflow-wrap:anywhere;color:var(--qcc-secondary);font-size:11px}
.qccPlanChips{display:flex;flex-wrap:wrap;gap:6px}.qccPlanChip{display:inline-flex;flex-direction:column;align-items:flex-start;gap:1px;padding:6px 10px;border:1px solid var(--qcc-border);border-radius:5px;background:var(--qcc-surface);color:var(--qcc-text);font-size:12px;line-height:1.3;cursor:pointer}.qccPlanChip small{color:var(--qcc-secondary);font-size:10px}.qccPlanChip[data-on="true"]{border-color:var(--qcc-action);background:var(--qcc-selected);color:var(--qcc-action)}.qccPlanChip[data-on="true"] small{color:inherit}
.qccPlanSections{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:6px;margin-top:2px}.qccPlanSections label{display:flex;align-items:center;gap:6px;padding:6px 8px;border:1px dashed var(--qcc-border);border-radius:5px;font-size:12px;color:var(--qcc-secondary);cursor:pointer}.qccPlanSections label[data-on="true"]{border-style:solid;color:var(--qcc-text)}.qccPlanSections input{margin:0}
.qccPlanFoot{display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:10px;padding-top:10px;border-top:1px solid var(--qcc-border)}.qccPlanTotal{color:var(--qcc-secondary);font-size:12px}.qccPlanActions{display:flex;flex-wrap:wrap;align-items:center;gap:8px}.qccPlanError{color:var(--qcc-danger);font-size:12px}.qccPlan[data-submitting="true"]{opacity:.7}
.qccDockCompanyRow{display:flex;flex:1;align-items:center;gap:6px;min-width:0}.qccDockCompanyRow .qccDockCompany{flex:1;min-width:0}
.qccImportBtn{display:inline-flex;align-items:center;gap:5px;flex:none;height:32px;padding:0 10px;border:1px solid var(--qcc-border);border-radius:5px;background:var(--qcc-surface);color:var(--qcc-secondary);font-size:12px;line-height:1;cursor:pointer;white-space:nowrap}.qccImportBtn svg{width:14px;height:14px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}.qccImportBtn:hover{border-color:var(--qcc-action);color:var(--qcc-action)}.qccImportBtn:disabled{opacity:.6;cursor:default}
.qccImportState{color:var(--qcc-secondary);font-size:12px;line-height:1.5}.qccImportState[data-state="completed"]{color:var(--qcc-success)}.qccImportState[data-state="failed"]{color:var(--qcc-danger)}
.qccImportNotice{position:fixed;right:16px;bottom:16px;z-index:10000;max-width:min(420px,calc(100vw - 32px));padding:16px;border:1px solid #94a3b8;border-radius:10px;background:#fff;color:#334155;box-shadow:0 4px 20px #0002}.qccImportNotice button{margin-left:8px}
.qccDockBody[data-dragging="true"]{outline:2px dashed var(--qcc-action);outline-offset:2px}
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
function latestEvent(events, fragment) {
  let seen = null;
  for (const event of events) {
    if (!event.name.includes(fragment)) continue;
    seen = event;
  }
  return seen;
}
function toDimensions(table, events) {
  const out = [];
  for (const [fragment, label] of table) {
    const event = latestEvent(events, fragment);
    if (event !== null) out.push({ label, status: event.status, ...event.reason === void 0 ? {} : { note: event.reason } });
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
var NO_RISK_FINDING = /^(?:无|—|-|暂无|本次.*未发现)|均为\s*0|(?:本次)?扫描未发现(?:任何|公开)?记录|未发现(?:任何|公开)?记录/u;
function isRiskFindingText(text) {
  return !NO_RISK_FINDING.test(strip(text));
}
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
  const hypoRe = /(H\d+)\s*[·・:：\-–]\s*\**\s*(P[012])\**\s*(?:（[^）\n]*）|\([^)\n]*\))?\s*[·・:：\-–]\s*([^\n]+)/g;
  const hypoSrc = section(md, "\u4E1A\u52A1\u5047\u8BBE") || md;
  let hm;
  while ((hm = hypoRe.exec(hypoSrc)) !== null) {
    const id = hm[1] ?? "";
    if (hypotheses.some((h) => h.id === id)) continue;
    hypotheses.push({ id, priority: hm[2] ?? "", text: strip(hm[3] ?? "") });
  }
  for (const match of hypoSrc.matchAll(/假设\s*(\d+)\s*(?:（[^）\n]*）|\([^\)\n]*\))?\s*[：:·、\-–]?\s*([^\n]+)/g)) {
    const id = `H${match[1]}`;
    if (!hypotheses.some((item) => item.id === id)) hypotheses.push({ id, priority: "", text: strip(match[2] ?? "") });
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
var completed = (events, fragments) => events.some((e) => fragments.some((f) => e.name.includes(f)) && (e.status === "done" || e.status === "no-data" || e.status === "skipped"));
var reviewing = (events, fragments) => events.some((e) => fragments.some((f) => e.name.includes(f)) && (e.status === "unknown" || e.status === "no-permission" || e.status === "not-executed"));
var failed = (events, fragments) => events.some((e) => fragments.some((f) => e.name.includes(f)) && e.status === "failed");
var running = (events, fragments) => events.some((e) => fragments.some((f) => e.name.includes(f)) && e.status === "running");
var BASIC = ["get_company_registration_info", "get_company_profile", "get_annual_reports", "get_shareholder_info", "get_key_personnel", "get_change_records", "get_beneficial_owners"];
var STATE_TOOLS = ["get_bidding_info", "get_financing_records", "get_recruitment_info", "get_administrative_license", "get_patent_info", "get_land_grant_info", "get_external_investments", "get_qualifications", "get_software_copyright_info", "get_financial_data", "get_company_announcement"];
var DRILL = ["get_dishonest_info", "get_judgment_debtor_info", "get_terminated_cases", "get_equity_freeze", "get_business_exception", "get_administrative_penalty", "get_tax_abnormal", "get_judicial_documents"];
function stepOf(done, active, review, hasFailed) {
  if (done) return "done";
  if (hasFailed) return "failed";
  if (active) return "active";
  return review ? "review" : "idle";
}
function opportunitySteps(events, insights, finished) {
  const anchorTools = ["get_company_by_query", "previsit_confirm_entity"];
  const anchorDone = has(events, ["previsit_confirm_entity"], "done");
  const basicDone = BASIC.filter((f) => completed(events, [f])).length;
  const basicSeen = BASIC.filter((f) => has(events, [f])).length;
  const stateDone = insights.state !== null || insights.stateUndetermined;
  const hypoDone = insights.hypotheses.length > 0;
  return [
    { label: "\u4E3B\u4F53\u951A\u5B9A", state: stepOf(anchorDone, running(events, anchorTools) || !finished && completed(events, ["get_company_by_query"]), reviewing(events, anchorTools), failed(events, anchorTools)) },
    { label: "\u57FA\u7840\u4FE1\u53F7", state: stepOf(basicDone >= 3, running(events, BASIC), reviewing(events, BASIC) || finished && basicSeen > 0, failed(events, BASIC)), note: basicDone > 0 ? `${basicDone} \u9879\u5B8C\u6210` : basicSeen > 0 ? `${basicSeen} \u9879\u5DF2\u8FD4\u56DE` : void 0 },
    { label: "\u72B6\u6001\u5224\u5B9A", state: stepOf(stateDone, running(events, STATE_TOOLS), reviewing(events, STATE_TOOLS), failed(events, STATE_TOOLS)), note: insights.stateUndetermined ? "\u72B6\u6001\u672A\u5B9A" : insights.state ?? void 0 },
    { label: "\u5047\u8BBE\u8BB0\u5F55", state: stepOf(false, !finished && stateDone, finished && stateDone, false), note: hypoDone ? `${insights.hypotheses.length} \u6761\u62A5\u544A\u5047\u8BBE \xB7 \u6838\u9A8C\u89C1\u8BC1\u636E\u8BB0\u5F55` : void 0 }
  ];
}
function riskSteps(events, insights, finished) {
  const scanTools = ["get_company_risk_scan"];
  const executiveTools = ["get_executive_risk_scan"];
  const scanDone = completed(events, scanTools);
  const drillEvents = DRILL.map((fragment) => latestEvent(events, fragment));
  const resolvedDrills = drillEvents.filter((event) => event !== null && ["done", "no-data", "skipped"].includes(event.status));
  const drillDone = scanDone && resolvedDrills.length === DRILL.length;
  const skippedDrills = resolvedDrills.filter((event) => event?.status === "skipped").length;
  const queriedDrills = resolvedDrills.length - skippedDrills;
  const pendingDrills = DRILL.length - resolvedDrills.length;
  const executiveEvent = latestEvent(events, executiveTools[0]);
  const execDone = executiveEvent !== null && ["done", "no-data", "skipped"].includes(executiveEvent.status);
  const judged = insights.sections.includes("\u7EA2\u7EBF\u63D0\u793A");
  return [
    { label: "\u98CE\u9669\u626B\u63CF", state: stepOf(scanDone, running(events, scanTools), reviewing(events, scanTools), failed(events, scanTools)) },
    {
      label: "\u660E\u7EC6\u4E0B\u94BB",
      state: stepOf(drillDone, running(events, DRILL), reviewing(events, DRILL) || finished && scanDone && !drillDone, failed(events, DRILL)),
      note: drillDone ? queriedDrills === 0 ? "\u626B\u63CF\u5747\u4E3A 0\uFF0C\u65E0\u9700\u4E0B\u94BB" : `${queriedDrills} \u9879\u5B8C\u6210${skippedDrills > 0 ? `\uFF0C${skippedDrills} \u9879\u65E0\u9700\u6267\u884C` : ""}` : finished && scanDone ? `${pendingDrills} \u9879\u672A\u95ED\u73AF` : void 0
    },
    {
      label: "\u8463\u76D1\u9AD8",
      state: stepOf(execDone, running(events, executiveTools), reviewing(events, executiveTools) || finished && !execDone, failed(events, executiveTools)),
      note: executiveEvent?.status === "skipped" ? executiveEvent.reason ?? "\u65E0\u9700\u6267\u884C" : !execDone && finished ? "\u5173\u952E\u4EBA\u5458\u98CE\u9669\u672A\u95ED\u73AF" : void 0
    },
    { label: "\u5F71\u54CD\u5224\u65AD", state: stepOf(judged, !finished && scanDone, finished && scanDone, false), note: judged ? `${insights.risks.length} \u9879` : void 0 }
  ];
}

// src/workbench-v2.tsx
var import_jsx_runtime11 = require("react/jsx-runtime");
var inject = ["slots", "sessions", "workspaces", "conversation"];
var STYLE_ID = "dsh-pre-duediligence-workbench";
var OPTIONAL_WORKBENCH_MESSAGE = "\u672A\u5B89\u88C5\u53EF\u9009 Better Sidebar\uFF1B\u5F53\u524D\u8349\u7A3F\u548C\u4E1A\u52A1\u72B6\u6001\u5DF2\u4FDD\u7559\u3002\u57FA\u7840\u4F1A\u8BDD\u3001\u63D0\u793A\u8BCD\u751F\u6210\u3001\u539F\u751F\u53D1\u9001\u53CA\u4F1A\u8BDD\u62A5\u544A\u9605\u8BFB\u4ECD\u53EF\u4F7F\u7528\u3002\u5982\u9700\u53EF\u89C6\u5316\u5DE5\u4F5C\u53F0\uFF0C\u8BF7\u505C\u6B62 DSH \u540E\u6309 README \u8BBE\u7F6E DSH_PREVISIT_WORKBENCH=on \u5E76\u91CD\u8DD1\u5B89\u88C5\u811A\u672C\u3002";
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
  available: false,
  running: false,
  partial: false,
  lastAgentError: null,
  toolNames: [],
  toolEvents: [],
  failedToolCount: 0
};
function Icon({ name }) {
  const paths = {
    target: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "m15 15 4 4M10.5 7.5v6M7.5 10.5h6" })
    ] }),
    scope: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M5 4h14v16H5z" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M8 8h8M8 12h8M8 16h5" })
    ] }),
    collect: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_jsx_runtime11.Fragment, { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M4 20V10h4v10M10 20V4h4v16M16 20v-7h4v7M3 20h18" }) }),
    verify: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 8v5M12 17h.01" })
    ] }),
    output: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M6 3h8l4 4v14H6z" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M14 3v5h5M9 13h6M9 17h6" })
    ] }),
    clock: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    check: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "m8 12 2.5 2.5L16 9" })
    ] }),
    warning: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 3 2.8 20h18.4z" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 9v4M12 17h.01" })
    ] }),
    history: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(import_jsx_runtime11.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("path", { d: "M12 7v5l3 2" })
    ] })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("svg", { className: "qccPwIcon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] });
}
function collectRuntime(snapshot, baseline) {
  const toolNames = /* @__PURE__ */ new Set();
  const toolEvents = [];
  for (const node of (snapshot.nodes ?? []).slice(baseline)) {
    if (node.kind !== "tool-result") continue;
    if (typeof node.call?.name === "string") {
      const event = toolEvent({ ...node, call: { name: node.call.name } });
      toolNames.add(event.name);
      toolEvents.push(event);
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
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwFeedback", "data-tone": props.tone, role: props.tone === "error" ? "alert" : "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwFeedbackIcon", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon, { name: icon }) }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: props.title }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: props.children })
    ] })
  ] });
}
function ExecutionProgress(props) {
  const [now, setNow] = (0, import_react9.useState)(Date.now);
  (0, import_react9.useEffect)(() => {
    if (props.task === null || props.status === "ready") return;
    const timer = setInterval(() => setNow(Date.now()), 1e3);
    return () => clearInterval(timer);
  }, [props.task?.id, props.status]);
  if (props.task === null || props.status === "ready") return null;
  const progress = hostedLiveProgress(props.task);
  const lastResultAt = Math.max(Date.parse(props.task.createdAt), ...props.task.runs.map((run) => Date.parse(run.completedAt ?? run.startedAt)));
  const activity = processingStatus({ running: props.modelRunning, error: props.syncError, waiting: props.task.state === "needs-entity-confirmation", querying: progress.current !== null, secondsSinceResult: (now - lastResultAt) / 1e3, ...props.task.activity ? { activity: props.task.activity } : {}, now, lastResultAt });
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwLiveProgress", "data-running": activity.busy, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwLivePulse", "aria-hidden": "true" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwLiveCopy", role: "status", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: activity.title }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: activity.detail }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
        progress.title,
        " \xB7 ",
        progress.detail
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwLiveMetrics", "aria-label": "\u5B9E\u65F6\u6267\u884C\u7EDF\u8BA1", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
        "\u67E5\u8BE2 ",
        progress.queryCount
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { "data-tone": "success", children: [
        "\u95ED\u73AF ",
        progress.completedCount
      ] }),
      progress.noDataCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { "data-tone": "success", children: [
        "\u65E0\u6570\u636E ",
        progress.noDataCount
      ] }) : null,
      progress.skippedCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { "data-tone": "success", children: [
        "\u65E0\u9700\u6267\u884C ",
        progress.skippedCount
      ] }) : null,
      progress.pendingCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
        "\u5F85\u5904\u7406 ",
        progress.pendingCount
      ] }) : null,
      progress.failedCount > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { "data-tone": "error", children: [
        "\u5931\u8D25 ",
        progress.failedCount
      ] }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { children: [
        "\u5DF2\u7528\u65F6 ",
        progress.elapsed
      ] })
    ] })
  ] });
}
function SetupPanel(props) {
  (0, import_react9.useSyncExternalStore)((listener) => props.input?.state.subscribe?.(listener) ?? (() => {
  }), () => props.input?.state.getSnapshot().draft ?? "");
  const actions = usePrevisitComposer({
    sessionId: props.sessionId,
    store: props.store,
    readDraft: () => props.input?.state.getSnapshot().draft ?? "",
    writeDraft: (text) => {
      if (props.input === void 0) throw new Error("\u5F53\u524D\u4F1A\u8BDD\u8F93\u5165\u6846\u5C1A\u672A\u5C31\u7EEA");
      props.input.setDraft(text);
    },
    start: props.start,
    onStarted: props.onStarted,
    draftMode: "isolated"
  });
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEyebrow", children: "TARGET" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: "\u5BF9\u8C61\u4E0E\u76EE\u6807" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u786E\u8BA4\u62DC\u8BBF\u4E3B\u4F53\u3001\u89D2\u8272\u4E0E\u76EE\u6807\uFF1B\u524D\u7AEF\u4E0D\u9884\u8BBE\u4E1A\u52A1\u7ED3\u8BBA\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwTaskId", children: taskDisplayLabel(props.task.id) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCard qccPwSetupCard", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PrevisitFields, { actions, idPrefix: `qccPw-${props.sessionId}`, sessionId: props.sessionId, send: props.send }) }),
    props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u5DF2\u53D1\u9001\u7684\u4EFB\u52A1" }) }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("pre", { className: "qccPwPrompt", children: props.task.prompt })
    ] })
  ] });
}
var optionLabel = (options, id) => id === void 0 ? "\u672A\u9009\u62E9" : options.find((option) => option.id === id)?.label ?? "\u672A\u9009\u62E9";
function ScopePanel(props) {
  const brief = props.hostedTask?.brief;
  const selection = props.task?.selection ?? props.state.selection;
  const focus = selection.focus.map((id) => optionLabel(FOCUS_OPTIONS, id)).join("\u3001") || "\u6309 Skill \u6807\u51C6\u8303\u56F4";
  const submittedCompany = props.task?.company?.trim() || props.state.company.trim();
  const rows = [
    ["\u62DC\u8BBF\u5BF9\u8C61", submittedCompany || "\u5C1A\u672A\u586B\u5199"],
    ["\u6211\u7684\u89D2\u8272", brief?.role ?? optionLabel(ROLE_OPTIONS, selection.role)],
    ["\u62DC\u8BBF\u573A\u666F", brief?.scene ?? optionLabel(PURPOSE_OPTIONS, selection.purpose)],
    ["\u91CD\u70B9\u5173\u6CE8", brief === void 0 ? focus : brief.focus.join("\u3001") || "\u6309 Skill \u6807\u51C6\u8303\u56F4"],
    ["\u5C3D\u8C03\u6DF1\u5EA6", props.hostedTask === null ? optionLabel(BUDGET_OPTIONS, selection.budget) : DEPTH_LABELS[props.hostedTask.depth]],
    ["\u8F93\u51FA\u5F62\u6001", brief?.output ?? optionLabel(OUTPUT_OPTIONS, selection.output)]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(StagePanel, { eyebrow: "SCOPE", title: "\u8303\u56F4\u786E\u8BA4", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "notice", title: "\u8303\u56F4\u662F\u6267\u884C\u610F\u56FE\uFF0C\u4E0D\u662F\u5B8C\u6210\u8BC1\u660E", children: "\u5B9E\u9645\u8986\u76D6\u4EE5\u5F53\u524D\u4F1A\u8BDD\u7684\u4F01\u67E5\u67E5 MCP \u8C03\u7528\u3001\u5931\u8D25\u8BB0\u5F55\u53CA\u62A5\u544A\u8986\u76D6\u8BF4\u660E\u4E3A\u51C6\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u672C\u6B21\u8BBE\u5B9A" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u9700\u8981\u8C03\u6574\u65F6\u8FD4\u56DE\u300C\u5BF9\u8C61\u4E0E\u76EE\u6807\u300D\uFF0C\u6216\u4F7F\u7528\u8F93\u5165\u6846\u5DE6\u4E0A\u89D2\u7684\u63D0\u793A\u8BCD\u751F\u6210\u5668\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dl", { className: "qccPwScopeList", children: rows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dt", { children: label }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("dd", { children: value })
      ] }, label)) })
    ] })
  ] });
}
function Steps(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("ol", { className: "qccPwSteps", children: props.steps.map((step, index) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("li", { className: "qccPwStep", "data-state": step.state, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStepDot", children: step.state === "done" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon, { name: "check" }) : step.state === "review" || step.state === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon, { name: "warning" }) : index + 1 }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwStepCopy", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("b", { children: step.label }),
      step.note === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: step.note })
    ] })
  ] }, step.label)) });
}
function Dimensions(props) {
  const done = props.items.filter((d) => d.status === "done" || d.status === "no-data" || d.status === "skipped").length;
  const review = props.items.filter((d) => d.status === "unknown").length;
  const blocked = props.items.filter((d) => d.status === "no-permission" || d.status === "not-executed").length;
  const failed2 = props.items.filter((d) => d.status === "failed").length;
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCardHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: props.title }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwModeGroup", children: [
        done > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwMode", "data-tone": "success", children: [
          done,
          " \u9879\u5B8C\u6210"
        ] }) : null,
        review > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwMode", "data-tone": "review", children: [
          review,
          " \u9879\u5F85\u786E\u8BA4"
        ] }) : null,
        blocked > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwMode", "data-tone": "review", children: [
          blocked,
          " \u9879\u672A\u5B8C\u6210"
        ] }) : null,
        failed2 > 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwMode", "data-tone": "error", children: [
          failed2,
          " \u9879\u5931\u8D25"
        ] }) : null
      ] })
    ] }),
    props.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEmpty", children: props.empty }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwDims", children: props.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwDim", "data-status": item.status, title: item.note, children: [
      item.label,
      " \xB7 ",
      TOOL_OUTCOME_LABELS[item.status]
    ] }, item.label)) })
  ] });
}
function StagePanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEyebrow", children: props.eyebrow }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: props.title })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwTaskId", children: taskDisplayLabel(props.task.id) })
    ] }),
    props.children
  ] });
}
function ScanFindings({ task }) {
  const scan = task?.runs.filter((run) => run.dimension === "risk_scan").at(-1);
  const factors = scan?.result?.factors ?? [];
  const hits = factors.filter((factor) => factor.count > 0);
  if (!scan?.result) return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwNote", children: "\u626B\u63CF\u56E0\u5B50\u5C1A\u672A\u4FDD\u5B58\uFF1B\u65E7\u4EFB\u52A1\u8BF7\u53C2\u9605\u62A5\u544A\u4E2D\u7684\u98CE\u9669\u4E0E\u8986\u76D6\u8BF4\u660E\u3002" });
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("h3", { children: [
      "\u5B9E\u65F6\u98CE\u9669\u626B\u63CF \xB7 ",
      hits.length,
      " \u9879\u547D\u4E2D"
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u67E5\u8BE2\u6210\u529F\u4EC5\u8868\u793A\u6570\u636E\u5DF2\u8FD4\u56DE\uFF0C\u4E0D\u4EE3\u8868\u4F01\u4E1A\u65E0\u98CE\u9669\u3002\u4EE5\u4E0B\u4E3A\u516C\u5F00\u8BB0\u5F55\u8BA1\u6570\uFF0C\u5C1A\u975E\u6700\u7EC8\u98CE\u9669\u5B9A\u6027\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwRiskTiles", children: hits.map((factor) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwRiskTile", "data-level": "\u5173\u6CE8", "data-empty": false, children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("b", { children: factor.name }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("strong", { children: [
        " \xB7 ",
        factor.count,
        " \u6761"
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u5DF2\u53D1\u73B0\u516C\u5F00\u8BB0\u5F55 \xB7 \u9700\u7ED3\u5408\u660E\u7EC6\u7814\u5224" })
    ] }, factor.name)) }),
    factors.length > 0 && hits.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: "qccPwNote", children: [
      "\u672C\u6B21\u626B\u63CF ",
      factors.length,
      " \u9879\u5747\u672A\u53D1\u73B0\u516C\u5F00\u8BB0\u5F55\u3002"
    ] }) : null,
    scan.result.summary ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: scan.result.summary }) : null
  ] });
}
function OpportunityPanel(props) {
  const finished = props.status === "ready";
  const running2 = props.status === "running";
  const { insights } = props;
  const steps = opportunitySteps(props.events, insights, finished);
  const dims = opportunityDimensions(props.events);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(StagePanel, { eyebrow: "COLLECT", title: "\u8D44\u6599\u91C7\u96C6", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Steps, { steps }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Dimensions, { title: "\u91C7\u96C6\u7ED3\u679C", items: dims, empty: running2 ? "\u6B63\u5728\u5EFA\u7ACB\u4E3B\u4F53\u4E0E\u4FE1\u53F7\u96C6\u2026" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A\u91C7\u96C6\u7ED3\u679C" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ScanFindings, { task: props.hostedTask }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u7ECF\u8425\u4E8B\u5B9E\u4E0E\u7814\u5224" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u4EE5\u4E0B\u5185\u5BB9\u6765\u81EA\u672C\u6B21\u67E5\u8BE2\u8FD4\u56DE\uFF1B\u6700\u7EC8\u7814\u5224\u4E0E\u67E5\u8BE2\u6267\u884C\u72B6\u6001\u5206\u522B\u5C55\u793A\u3002" })
        ] }),
        insights.state !== null ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("span", { className: "qccPwMode", "data-tone": "success", children: [
          "\u5DF2\u7814\u5224",
          insights.confidence === null ? "" : ` \xB7 \u7F6E\u4FE1\u5EA6 ${insights.confidence}`
        ] }) : insights.stateUndetermined ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwMode", "data-tone": "review", children: "\u72B6\u6001\u672A\u5B9A" }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwMode", "data-tone": running2 ? void 0 : "neutral", children: running2 ? "\u6B63\u5728\u7814\u5224" : finished ? "\u672A\u8BC6\u522B\u7ED3\u8BBA" : "\u5F85\u7814\u5224" })
      ] }),
      insights.state ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: insights.state }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u5C1A\u672A\u5F62\u6210\u7ECF\u8425\u7814\u5224\uFF1B\u5148\u5C55\u793A\u5DF2\u8FD4\u56DE\u7684\u7ECF\u8425\u4E8B\u5B9E\uFF0C\u4E0D\u4EE5\u67E5\u8BE2\u6210\u529F\u63A8\u65AD\u7ECF\u8425\u826F\u597D\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CollectionCards, { task: props.hostedTask }),
      insights.stateUndetermined ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwNote", children: "\u72B6\u6001\u672A\u5B9A\uFF1A\u516C\u5F00\u8BC1\u636E\u4E0D\u8DB3\uFF0C\u672C\u6B21\u964D\u7EA7\u4E3A\u6E05\u5355\u5F0F\u7B80\u62A5\u3002" }) : null,
      insights.industryLink === null ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: "qccPwNote", children: [
        "\u4EA7\u4E1A\u94FE\u73AF\u8282\uFF1A",
        insights.industryLink
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AnalysisPanel, { task: props.hostedTask, kind: "hypothesis", legacy: insights.hypotheses })
  ] });
}
function RiskPanel(props) {
  const finished = props.status === "ready";
  const running2 = props.status === "running";
  const { insights } = props;
  const steps = riskSteps(props.events, insights, finished);
  const dims = riskDimensions(props.events);
  const rows = (level) => insights.risks.filter((r) => r.level === level);
  const real = (level) => rows(level).filter((r) => isRiskFindingText(r.text));
  const judged = insights.sections.includes("\u7EA2\u7EBF\u63D0\u793A");
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(StagePanel, { eyebrow: "VERIFY", title: "\u8BC1\u636E\u6838\u9A8C", task: props.task, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Steps, { steps }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Dimensions, { title: "\u6838\u9A8C\u7ED3\u679C", items: dims, empty: running2 ? "\u7B49\u5F85\u98CE\u9669\u626B\u63CF\u2026" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A\u6838\u9A8C\u7ED3\u679C" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwNote", children: "\u626B\u63CF\u53D1\u73B0\u89C1\u300C\u8D44\u6599\u91C7\u96C6\u300D\uFF1B\u8FD9\u91CC\u5C55\u793A\u660E\u7EC6\u67E5\u8BE2\u8303\u56F4\u3001\u6838\u9A8C\u7ED3\u8BBA\u4E0E\u4E0B\u4E00\u6B65\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(CollectionCards, { task: props.hostedTask, verification: true }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AnalysisPanel, { task: props.hostedTask, kind: "verification" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(AnalysisPanel, { task: props.hostedTask, kind: "hypothesis", legacy: insights.hypotheses }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u98CE\u9669\u5206\u7EA7" }) }) }),
      !judged ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEmpty", children: running2 ? "\u626B\u63CF\u4E0E\u4E0B\u94BB\u540E\u7ED9\u51FA\u5206\u7EA7" : finished ? "\u62A5\u544A\u672A\u6355\u83B7" : "\u5C3D\u8C03\u5F00\u59CB\u540E\u663E\u793A" }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwRiskTiles", children: [
        ["\u7EA2\u7EBF", "\u5173\u6CE8", "\u4FE1\u606F"].map((level) => {
          const items = real(level);
          const cleared = items.length === 0 && (rows(level).length > 0 || insights.riskNoRecord);
          return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwRiskTile", "data-level": level, "data-clear": cleared, "data-empty": items.length === 0, children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwRiskTileTop", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("b", { children: level }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: items.length })
            ] }),
            items.length ? items.map((item, index) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: item.text }, index)) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: cleared ? "\u5DF2\u6838\u67E5\uFF0C\u672C\u6B21\u672A\u53D1\u73B0\u516C\u5F00\u8BB0\u5F55" : "\u672A\u5F62\u6210\u660E\u786E\u7ED3\u8BBA" })
          ] }, level);
        }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwRiskBoundary", children: "\u7EFF\u8272\u8868\u793A\u672C\u6B21\u516C\u5F00\u6570\u636E\u6838\u67E5\u672A\u53D1\u73B0\uFF0C\u4E0D\u4EE3\u8868\u98CE\u9669\u7EDD\u5BF9\u4E0D\u5B58\u5728\u3002" })
      ] })
    ] })
  ] });
}
function ReportViewer(props) {
  const ref = (0, import_react9.useRef)(null);
  const fit = () => {
    const el = ref.current;
    const h = el?.contentDocument?.documentElement?.scrollHeight;
    if (el !== null && h !== void 0 && h > 0) el.style.height = `${h + 8}px`;
  };
  (0, import_react9.useEffect)(() => {
    fit();
  }, [props.html]);
  const embedded = props.html.replace("</head>", "<style>body{background:#fff}.sheet{margin:0;border:0;border-radius:0;box-shadow:none}.hero{padding:18px 20px 16px}.body{padding:6px 20px 20px}</style></head>");
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("iframe", { ref, className: "qccPwReportFrame", title: "\u5C3D\u8C03\u62A5\u544A", sandbox: "allow-same-origin", srcDoc: embedded, onLoad: fit });
}
function DeliveryPanel(props) {
  const ready = props.status === "ready";
  if (props.reportHtml !== null) {
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qccPwPageHeading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEyebrow", children: "OUTPUT" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: "\u8BBF\u524D\u6750\u6599" })
        ] }),
        props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwTaskId", children: taskDisplayLabel(props.task.id) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCard qccPwReportCard", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ReportViewer, { html: props.reportHtml }) })
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
  const hostedProgress = props.hostedTask === null ? null : hostedProgressCopy(props.hostedTask);
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEyebrow", children: "OUTPUT" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: "\u8BBF\u524D\u6750\u6599" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u4E0D\u662F\u8D44\u6599\u5806\u780C\uFF0C\u53EA\u56DE\u7B54\u56DB\u4EF6\u4E8B\uFF1A\u53BB\u4E0D\u53BB\u3001\u89C1\u8C01\u3001\u804A\u4EC0\u4E48\u3001\u4EC0\u4E48\u4E0D\u80FD\u78B0\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwTaskId", children: taskDisplayLabel(props.task.id) })
    ] }),
    props.task === void 0 ? props.cardCaptured ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "success", title: "\u62A5\u544A\u53EF\u4E0B\u8F7D", children: "\u5F53\u524D\u4F1A\u8BDD\u4E2D\u5DF2\u6709\u5C3D\u8C03\u62A5\u544A\uFF0C\u53EF\u76F4\u63A5\u4E0B\u8F7D\uFF1B\u65B0\u7684\u5C3D\u8C03\u5C06\u91CD\u65B0\u8BA1\u6570\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "notice", title: "\u7B49\u5F85\u8BBE\u5B9A", children: "\u5B8C\u6210\u5C3D\u8C03\u8BBE\u5B9A\u540E\uFF0C\u62A5\u544A\u7ED3\u6784\u4E0E\u6267\u884C\u8FDB\u5EA6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" }) : ready ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "success", title: "\u62A5\u544A\u5DF2\u751F\u6210", children: "\u6267\u884C\u5DF2\u7ED3\u675F\u3002\u53EF\u4E0B\u8F7D\u62A5\u544A\uFF0C\u6216\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u5B8C\u6574\u5185\u5BB9\u4E0E\u4E8B\u5B9E\u5F15\u7528\u3002" }) : props.status === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "error", title: "\u672C\u6B21\u5C3D\u8C03\u672A\u5B8C\u6574\u5B8C\u6210", children: "\u8BF7\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u9519\u8BEF\uFF1B\u5DF2\u53D6\u5F97\u4E8B\u5B9E\u4ECD\u53EF\u4FDD\u7559\uFF0C\u5931\u8D25\u7EF4\u5EA6\u4E0D\u5F97\u5199\u6210\u96F6\u8BB0\u5F55\u3002" }) : hostedProgress !== null ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "notice", title: hostedProgress.title, children: hostedProgress.detail }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "notice", title: props.status === "running" ? "\u6B63\u5728\u5C3D\u8C03" : "\u7B49\u5F85\u7EE7\u7EED", children: props.status === "running" ? "\u6B63\u5728\u540C\u6B65\u5F53\u524D\u4F1A\u8BDD\u7684\u8D44\u6599\u91C7\u96C6\u4E0E\u8BC1\u636E\u6838\u9A8C\uFF1B\u62A5\u544A\u751F\u6210\u540E\u5373\u53EF\u4E0B\u8F7D\u3002" : "\u8BF7\u56DE\u5230\u4F1A\u8BDD\u7EE7\u7EED\u5F53\u524D\u4EFB\u52A1\uFF1B\u62A5\u544A\u751F\u6210\u540E\u5373\u53EF\u4E0B\u8F7D\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u62A5\u544A\u7ED3\u6784" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u56FA\u5B9A\u516B\u6BB5\uFF0C\u53EF\u538B\u7F29\u6216\u5C55\u5F00\uFF1B\u4E8B\u5B9E\u3001\u63A8\u7406\u3001\u95EE\u9898\u548C\u8986\u76D6\u8FB9\u754C\u4E0D\u6DF7\u5199\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwDeliverables", children: deliverables.map(([number, title, detail]) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwDeliverable", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: number }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("b", { children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("small", { children: detail })
        ] })
      ] }, number)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u6267\u884C\u8986\u76D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u8FD9\u662F\u5DE5\u4F5C\u53F0\u4ECE\u5F53\u524D Session \u8BFB\u53D6\u7684\u771F\u5B9E\u6267\u884C\u4E8B\u4EF6\uFF0C\u4E0D\u662F\u5B8C\u6574\u6027\u8BC4\u5206\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCoverage", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: props.toolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: "\u4F01\u67E5\u67E5\u67E5\u8BE2\u6B21\u6570\uFF08\u4E0D\u8BBE\u63D2\u4EF6\u4E0A\u9650\uFF09" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: props.failedToolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: "\u5DE5\u5177\u9519\u8BEF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: ready ? "\u5DF2\u751F\u6210" : "\u5F85\u751F\u6210" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: "\u62A5\u544A\u5236\u54C1\uFF08\u4E0D\u4EE3\u8868\u5168\u91CF\u8986\u76D6\uFF09" })
        ] })
      ] })
    ] })
  ] });
}
function HistoryPanel(props) {
  const [historyPhase, setHistoryPhase] = (0, import_react9.useState)("output");
  const [intent, setIntent] = (0, import_react9.useState)("");
  const [continuing, setContinuing] = (0, import_react9.useState)(false);
  const [continueError, setContinueError] = (0, import_react9.useState)("");
  const continuationId = (0, import_react9.useRef)("");
  (0, import_react9.useEffect)(() => {
    setHistoryPhase("output");
  }, [props.selected?.id]);
  (0, import_react9.useEffect)(() => {
    setIntent("");
    setContinueError("");
    continuationId.current = "";
  }, [props.selected?.id]);
  const selectedReport = props.selected?.reportMarkdown?.trim();
  if (props.selected !== null) {
    const item = props.selected;
    const status = hostedStatus(item);
    const origin = hostedTaskOrigin(item);
    const reportHtml = selectedReport === void 0 || selectedReport === "" ? null : buildPrevisitReportHtml(selectedReport);
    return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwPanel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qccPwPageHeading qccPwHistoryHeading", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEyebrow", children: "HISTORY DETAIL" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: item.entity?.fullName ?? item.query }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
            item.id,
            " \xB7 ",
            new Date(item.createdAt).toLocaleString("zh-CN")
          ] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: props.onBack, children: "\u8FD4\u56DE\u6E05\u5355" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCardHeader", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: "\u4EFB\u52A1\u8BE6\u60C5" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwHistorySource", "data-complete": origin.complete, title: origin.label, children: origin.label })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStatus", "data-status": status, children: STATUS_LABELS[status] })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: "qccPwNote", children: [
          "\u4F01\u67E5\u67E5\u67E5\u8BE2 ",
          item.used,
          " \u6B21 \xB7 ",
          item.runs.filter((run) => run.status === "failed").length,
          " \u4E2A\u9519\u8BEF",
          item.completedAt === void 0 ? "" : ` \xB7 \u5B8C\u6210\u4E8E ${new Date(item.completedAt).toLocaleString("zh-CN")}`
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u62A5\u544A V",
          item.reportVersion ?? 1,
          item.parentTaskId ? ` \xB7 \u57FA\u4E8E\u4EFB\u52A1 ${item.parentTaskId}` : " \xB7 \u521D\u6B21\u5C3D\u8C03",
          item.supplementIntent ? ` \xB7 ${item.supplementIntent}` : ""
        ] }),
        item.inheritedRuns?.length ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u6CBF\u7528 ",
          item.inheritedRuns.length,
          " \u4E2A\u5386\u53F2\u7EF4\u5EA6\uFF0C\u975E\u672C\u6B21\u91CD\u65B0\u67E5\u8BE2\uFF1B\u539F\u67E5\u8BE2\u65E5\u671F\u4FDD\u7559\u5728\u57FA\u7840\u7248\u672C\u3002"
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { "aria-label": "\u62A5\u544A\u7248\u672C\u8BB0\u5F55", children: props.hosted.filter((version) => (version.rootTaskId ?? version.id) === (item.rootTaskId ?? item.id)).sort((a, b) => (a.reportVersion ?? 1) - (b.reportVersion ?? 1)).map((version) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: "qccPwSecondary", disabled: version.id === item.id, onClick: () => props.onOpen(version), children: [
          "V",
          version.reportVersion ?? 1,
          " \xB7 ",
          version.reportReady ? "\u62A5\u544A\u5DF2\u751F\u6210" : "\u8865\u5145\u4EFB\u52A1\u5904\u7406\u4E2D"
        ] }, version.id)) }),
        props.onContinue && item.reportReady && item.entity ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("label", { children: [
            "\u8865\u5145\u5C3D\u8C03\u8981\u6C42",
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("textarea", { style: { width: "100%", boxSizing: "border-box", minHeight: 80 }, "aria-label": "\u8865\u5145\u5C3D\u8C03\u8981\u6C42", value: intent, maxLength: 4e3, disabled: continuing, onKeyDown: (event) => event.stopPropagation(), onKeyUp: (event) => event.stopPropagation(), onChange: (event) => {
              setIntent(event.target.value);
              continuationId.current = "";
            } })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u521B\u5EFA\u72EC\u7ACB\u8865\u5145\u4EFB\u52A1\u548C\u65B0\u7248\u672C\uFF0C\u4E0D\u4FEE\u6539\u539F\u62A5\u544A\u3002\u53EF\u5728\u65B0\u4EFB\u52A1\u4F1A\u8BDD\u63D0\u4EA4\u6750\u6599\u6B63\u6587\u6216\u4F7F\u7528\u5BBF\u4E3B\u53EF\u7528\u6587\u4EF6\u8BFB\u53D6\u80FD\u529B\uFF0C\u767B\u8BB0\u6765\u6E90\u5E76\u4EA4\u53C9\u6BD4\u5BF9\uFF1B\u4E13\u7528\u8206\u60C5\u63A5\u53E3\u548C\u683C\u5F0F\u8F6C\u6362\u5C1A\u672A\u63A5\u5165\u3002" }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "qccPwPrimary", disabled: continuing || !intent.trim(), onClick: () => {
            if (!continuationId.current) continuationId.current = `PV-${(/* @__PURE__ */ new Date()).toISOString().slice(0, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;
            setContinuing(true);
            setContinueError("");
            void props.onContinue(item, intent.trim(), continuationId.current).catch((error) => setContinueError(error instanceof Error ? error.message : String(error))).finally(() => setContinuing(false));
          }, children: continuing ? "\u6B63\u5728\u63D0\u4EA4\u2026" : "\u521B\u5EFA\u8865\u5145\u4EFB\u52A1" }),
          continueError ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { role: "alert", children: continueError }) : null
        ] }) : null,
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwHistoryActions", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
          "button",
          {
            type: "button",
            className: "qccPwPrimary",
            disabled: !item.reportReady || !origin.complete || props.downloadingTaskId === item.id,
            title: !origin.complete ? "\u65E7\u8BB0\u5F55\u7F3A\u5C11\u6765\u6E90 Session\uFF0C\u65E0\u6CD5\u5B89\u5168\u4E0B\u8F7D" : item.reportReady ? "\u4E0B\u8F7D\u5DF2\u4FDD\u5B58\u7684 HTML \u62A5\u544A" : "\u62A5\u544A\u5C1A\u672A\u751F\u6210",
            onClick: () => props.onDownload(item),
            children: props.downloadingTaskId === item.id ? "\u6B63\u5728\u4E0B\u8F7D\u2026" : "\u4E0B\u8F7D\u62A5\u544A \u2193"
          }
        ) })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("nav", { className: "qccPwStages", "aria-label": "\u5386\u53F2\u4EFB\u52A1\u9636\u6BB5", role: "tablist", children: PREVISIT_PHASES.map((phase) => /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", role: "tab", "aria-selected": historyPhase === phase, className: "qccPwStage", "data-selected": historyPhase === phase, onClick: () => setHistoryPhase(phase), children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStageIcon", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon, { name: phase }) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: PHASE_LABELS[phase] })
      ] }, phase)) }),
      historyPhase === "target" || historyPhase === "scope" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("h3", { children: [
          PHASE_LABELS[historyPhase],
          " \xB7 \u4FDD\u5B58\u8BB0\u5F55"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u539F\u59CB\u68C0\u7D22\uFF1A",
          item.query
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u5DF2\u951A\u5B9A\u4E3B\u4F53\uFF1A",
          item.entity?.fullName ?? "\u672A\u4FDD\u5B58"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\uFF1A",
          item.entity?.creditCode ?? "\u672A\u4FDD\u5B58"
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
          "\u6DF1\u5EA6\uFF1A",
          item.depth
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u4EC5\u5C55\u793A\u5386\u53F2\u4FDD\u5B58\u5B57\u6BB5\uFF1B\u672A\u4FDD\u5B58\u7684\u89D2\u8272\u3001\u5173\u6CE8\u8303\u56F4\u4E0D\u4F7F\u7528\u5F53\u524D\u4EFB\u52A1\u8865\u586B\u3002" })
      ] }) : null,
      historyPhase === "collect" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(OpportunityPanel, { task: void 0, hostedTask: item, status, events: hostedToolEvents(item), insights: parseCardInsights(selectedReport ?? "") }) : null,
      historyPhase === "verify" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RiskPanel, { task: void 0, hostedTask: item, status, events: hostedToolEvents(item), insights: parseCardInsights(selectedReport ?? "") }) : null,
      historyPhase !== "output" ? null : reportHtml === null ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "notice", title: item.reportReady ? "\u6B63\u5728\u8BFB\u53D6\u62A5\u544A" : "\u62A5\u544A\u5C1A\u672A\u751F\u6210", children: item.reportReady ? "\u5DF2\u627E\u5230\u62A5\u544A\u5236\u54C1\uFF0C\u4F46\u6B63\u6587\u6682\u672A\u8FD4\u56DE\uFF1B\u8BF7\u8FD4\u56DE\u6E05\u5355\u540E\u91CD\u8BD5\u3002" : "\u4EFB\u52A1\u8BE6\u60C5\u5DF2\u6062\u590D\uFF0C\u62A5\u544A\u751F\u6210\u540E\u53EF\u5728\u8FD9\u91CC\u67E5\u770B\u5E76\u4E0B\u8F7D\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("div", { className: "qccPwCard qccPwReportCard", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ReportViewer, { html: reportHtml }) }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(MaterialPanel, { task: item }),
      item.reportReady && origin.complete ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ReportFilesPanel, { taskId: item.id, sessionId: item.sessionId }, item.id) : null,
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwNote", children: "\u5386\u53F2\u8BE6\u60C5\u53EA\u8BFB\u53D6\u8BE5\u4EFB\u52A1\u6240\u5C5E Session \u7684 Host \u5236\u54C1\uFF0C\u4E0D\u4F1A\u91CD\u65B0\u8C03\u7528\u4F01\u67E5\u67E5\uFF0C\u4E5F\u4E0D\u4F1A\u8986\u76D6\u5F53\u524D\u4F1A\u8BDD\u4EFB\u52A1\u3002" })
    ] });
  }
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("header", { className: "qccPwPageHeading", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwEyebrow", children: "HISTORY" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h2", { children: "\u4EFB\u52A1\u5386\u53F2" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: "\u6C47\u603B\u5F53\u524D DSH Profile \u4E2D\u6240\u6709\u8BBF\u524D\u5C3D\u8C03 Session\uFF1B\u4EFB\u52A1\u72B6\u6001\u4E0E\u62A5\u544A\u5236\u54C1\u7531 Host \u4FDD\u5B58\u3002" })
    ] }) }),
    props.hosted.length > 0 ? props.hosted.map((item) => {
      const status = hostedStatus(item);
      const origin = hostedTaskOrigin(item);
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)(
        "button",
        {
          type: "button",
          className: "qccPwCard qccPwHistoryCard",
          disabled: !origin.complete || props.loadingTaskId === item.id,
          title: origin.complete ? "\u6253\u5F00\u4EFB\u52A1\u8BE6\u60C5\u4E0E\u5DF2\u4FDD\u5B58\u62A5\u544A" : "\u65E7\u8BB0\u5F55\u7F3A\u5C11\u6765\u6E90 Session\uFF0C\u53EA\u80FD\u67E5\u770B\u6E05\u5355\u6458\u8981",
          "aria-label": `\u67E5\u770B${item.entity?.fullName ?? item.query}\u7684\u4EFB\u52A1\u8BE6\u60C5`,
          onClick: () => props.onOpen(item),
          children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCardHeader", children: [
              /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: item.entity?.fullName ?? item.query }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { children: [
                  item.id,
                  " \xB7 ",
                  new Date(item.createdAt).toLocaleString("zh-CN")
                ] }),
                /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwHistorySource", "data-complete": origin.complete, title: origin.label, children: origin.label })
              ] }),
              /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStatus", "data-status": status, children: STATUS_LABELS[status] })
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("p", { className: "qccPwNote", children: [
              "\u4F01\u67E5\u67E5\u67E5\u8BE2 ",
              item.used,
              " \u6B21 \xB7 ",
              item.runs.filter((run) => run.status === "failed").length,
              " \u4E2A\u9519\u8BEF",
              item.completedAt === void 0 ? "" : ` \xB7 \u5B8C\u6210\u4E8E ${new Date(item.completedAt).toLocaleString("zh-CN")}`
            ] }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwHistoryOpen", children: props.loadingTaskId === item.id ? "\u6B63\u5728\u6253\u5F00\u2026" : origin.complete ? "\u67E5\u770B\u8BE6\u60C5 \u2192" : "\u4EC5\u6458\u8981" })
          ]
        },
        item.id
      );
    }) : props.task === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Feedback, { tone: "notice", title: "\u6682\u65E0\u5386\u53F2\u4EFB\u52A1", children: "\u4ECE\u63D0\u793A\u8BCD\u751F\u6210\u5668\u56DE\u586B\u5E76\u53D1\u9001\uFF0C\u6216\u5728\u4EFB\u4E00\u8BBF\u524D\u4F1A\u8BDD\u4E2D\u76F4\u63A5\u53D1\u8D77\u5C3D\u8C03\u540E\uFF0C\u8FD9\u91CC\u4F1A\u6C47\u603B\u663E\u793A\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h3", { children: taskDisplayLabel(props.task.id) }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { children: new Date(props.task.createdAt).toLocaleString("zh-CN") })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStatus", "data-status": props.status, children: STATUS_LABELS[props.status] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("pre", { className: "qccPwPrompt", children: props.task.prompt })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwNote", children: "\u70B9\u51FB\u4EFB\u52A1\u53EF\u6062\u590D\u8BE6\u60C5\u5E76\u67E5\u770B\u3001\u4E0B\u8F7D\u5DF2\u751F\u6210\u62A5\u544A\uFF1B\u4E0D\u4F1A\u91CD\u65B0\u6267\u884C\u67E5\u8BE2\u3002\u5B8C\u6574\u5BF9\u8BDD\u548C\u8BC1\u636E\u5F15\u7528\u4ECD\u4FDD\u7559\u5728\u5404\u81EA\u7684 DSH \u539F\u751F\u4F1A\u8BDD\u4E2D\u3002" })
  ] });
}
function PrevisitWorkbenchTab(props) {
  const sessionId = props.scope.sessionId;
  const shared = (0, import_react9.useSyncExternalStore)(props.shared.subscribe, () => props.shared.get(sessionId));
  const task = shared.task;
  const setTask = (fn) => props.shared.update(sessionId, (s) => ({ ...s, task: fn(s.task) }));
  const phase = shared.view === "history" ? "target" : shared.view;
  const setView = (view) => {
    locatePrevisitView(props.shared, sessionId, view);
  };
  const setPhase = (next) => setView(next);
  const [runtime, setRuntime] = (0, import_react9.useState)(EMPTY_RUNTIME);
  const [plans, setPlans] = (0, import_react9.useState)([]);
  const [dismissedPlanIds, setDismissedPlanIds] = (0, import_react9.useState)([]);
  const [sessionTasks, setSessionTasks] = (0, import_react9.useState)([]);
  const pendingPlan = [...plans].reverse().find((plan) => plan.taskIds.length === 0 && !sessionTasks.some((task2) => task2.planId === plan.id) && !dismissedPlanIds.includes(plan.id));
  const lastPlanLocation = (0, import_react9.useRef)();
  const [hostedTask, setHostedTask] = (0, import_react9.useState)(null);
  const [hostedHistory, setHostedHistory] = (0, import_react9.useState)([]);
  const [selectedHistory, setSelectedHistory] = (0, import_react9.useState)(null);
  const [loadingHistoryTaskId, setLoadingHistoryTaskId] = (0, import_react9.useState)();
  const [downloadingTaskId, setDownloadingTaskId] = (0, import_react9.useState)();
  const [hostError, setHostError] = (0, import_react9.useState)();
  const reconcilingReports = (0, import_react9.useRef)(/* @__PURE__ */ new Set());
  const lastHostedLocation = (0, import_react9.useRef)();
  const [capturedReport, setCapturedReport] = (0, import_react9.useState)(null);
  const [downloadNote, setDownloadNote] = (0, import_react9.useState)();
  const planTasks = hostedTask?.planId === void 0 ? [] : sessionTasks.filter((task2) => task2.planId === hostedTask.planId);
  const planTotal = Math.max(hostedTask?.planEntities ?? 0, planTasks.length);
  const planDone = planTasks.filter((task2) => task2.reportReady).length;
  useWorkbenchReveal(props.reveal, props);
  (0, import_react9.useEffect)(() => {
    if (!props.visible) {
      setHostedTask(null);
      lastHostedLocation.current = void 0;
      return;
    }
    let disposed = false;
    let timer;
    const refresh = async () => {
      try {
        const current = props.shared.get(sessionId);
        const records = await fetchHostedTasks({ kind: "current", sessionId });
        const summary = selectHostedTask(records, current.task, current.dismissedTaskIds);
        const record = summary?.reportReady === true ? await fetchHostedTask(summary.id, sessionId) ?? summary : summary;
        if (disposed) return;
        setSessionTasks(records);
        setHostedTask(record);
        setHostError(void 0);
        if (record !== null) {
          const snapshot = props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot();
          const adopted = snapshot === void 0 ? null : adoptTaskFromSnapshot(snapshot, sessionId, current.minimumNodeBaseline);
          const desiredView = hostedTaskView(record);
          const location = `${record.id}:${desiredView}`;
          const awaitingPlan = snapshot === void 0 ? void 0 : derivePlans(snapshot).find((plan) => plan.taskIds.length === 0 && !dismissedPlanIds.includes(plan.id) && !records.some((task2) => task2.planId === plan.id));
          const shouldLocate = awaitingPlan === void 0 && lastHostedLocation.current !== location;
          props.shared.update(sessionId, (state) => syncHostedTaskState(state, record, adopted, shouldLocate));
          lastHostedLocation.current = location;
        } else {
          lastHostedLocation.current = void 0;
        }
        timer = setTimeout(refresh, record !== null && HOSTED_TERMINAL.has(record.state) ? 2e3 : 1e3);
      } catch (error) {
        if (!disposed) {
          setHostError(error instanceof Error ? error.message : String(error));
          timer = setTimeout(refresh, 2e3);
        }
      }
    };
    void refresh();
    return () => {
      disposed = true;
      if (timer !== void 0) clearTimeout(timer);
    };
  }, [props.visible, sessionId, props.ctx, props.shared, shared.dismissedTaskIds.join("|"), dismissedPlanIds.join("|")]);
  (0, import_react9.useEffect)(() => {
    if (!props.visible || shared.view !== "history") return;
    let disposed = false;
    let timer;
    const refresh = async () => {
      try {
        const records = await fetchHostedTasks({ kind: "profile-history" });
        if (disposed) return;
        setHostedHistory(records);
        setHostError(void 0);
        if (records.some((record) => !record.reportReady && !HOSTED_TERMINAL.has(record.state))) timer = setTimeout(refresh, 2e3);
      } catch (error) {
        if (!disposed) setHostError(error instanceof Error ? error.message : String(error));
      }
    };
    void refresh();
    return () => {
      disposed = true;
      if (timer !== void 0) clearTimeout(timer);
    };
  }, [props.visible, shared.view, sessionId]);
  (0, import_react9.useEffect)(() => {
    if (shared.view !== "history") {
      setSelectedHistory(null);
      setLoadingHistoryTaskId(void 0);
    }
  }, [shared.view]);
  (0, import_react9.useEffect)(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session;
    if (face === void 0) {
      setRuntime(EMPTY_RUNTIME);
      return;
    }
    const refresh = () => {
      const snapshot = face.getSnapshot();
      const derivedPlans = derivePlans(snapshot);
      setPlans(derivedPlans);
      const pending = [...derivedPlans].reverse().find((plan) => plan.taskIds.length === 0 && !dismissedPlanIds.includes(plan.id));
      if (pending !== void 0 && pending.id !== lastPlanLocation.current) {
        lastPlanLocation.current = pending.id;
        if (props.shared.get(sessionId).view !== "history") locatePrevisitView(props.shared, sessionId, "target");
      }
      if (task === void 0) {
        const adopted = adoptTaskFromSnapshot(snapshot, sessionId, shared.minimumNodeBaseline);
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
        available: typeof snapshot.running === "boolean",
        running: snapshot.running === true,
        partial: snapshot.partial !== null && snapshot.partial !== void 0,
        lastAgentError: snapshot.lastAgentError ?? null,
        ...calls
      });
      if (snapshot.running === true) {
        setTask((current) => current === void 0 || current.seenRunning ? current : { ...current, seenRunning: true });
      }
      const captureTask = task === void 0 ? void 0 : { ...task, id: task.captureId ?? task.id };
      const projected = task === void 0 ? void 0 : deriveTasks(snapshot).find((projected2) => projected2.id === task.id);
      const captured = snapshot.running === true ? null : projected !== void 0 ? projected.report : captureTask === void 0 ? null : captureTaskReport(snapshot, sessionId, captureTask);
      setCapturedReport(captured === null || task === void 0 ? null : { taskId: task.id, text: captured });
    };
    refresh();
    return face.subscribe?.(refresh);
  }, [props.ctx, sessionId, task?.id, task?.nodeBaseline, shared.minimumNodeBaseline, shared.dismissedTaskIds.join("|"), dismissedPlanIds.join("|")]);
  (0, import_react9.useEffect)(() => {
    const report = capturedReport !== null && capturedReport.taskId === task?.id ? capturedReport.text : void 0;
    if (hostedTask === null || hostedTask.reportReady || report === void 0 || reconcilingReports.current.has(hostedTask.id)) return;
    reconcilingReports.current.add(hostedTask.id);
    void fetch(`/previsit/api/tasks/${encodeURIComponent(hostedTask.id)}/report?sessionId=${encodeURIComponent(sessionId)}`, {
      method: "PUT",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ reportMarkdown: report, status: hostedTask.runs.some((run) => run.status === "failed") ? "partial" : "completed" })
    }).then(async (response) => {
      const payload = await response.json();
      if (!response.ok || payload.ok === false || payload.task === void 0) throw new Error(payload.message ?? `\u62A5\u544A\u72B6\u6001\u540C\u6B65\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`);
      setHostedTask(payload.task);
      setHostError(void 0);
    }).catch((error) => {
      reconcilingReports.current.delete(hostedTask.id);
      setHostError(error instanceof Error ? error.message : String(error));
    });
  }, [capturedReport, hostedTask, task?.id]);
  const hostedEvents = (0, import_react9.useMemo)(() => hostedTask === null ? [] : hostedToolEvents(hostedTask), [hostedTask]);
  const effectiveEvents = hostedTask === null ? runtime.toolEvents : hostedEvents;
  const cardText = hostedTask?.reportMarkdown ?? (capturedReport?.taskId === task?.id ? capturedReport?.text ?? null : null);
  const hostStatus = hostedTask === null ? null : hostedStatus(hostedTask);
  const progressInput = {
    hasTask: task !== void 0,
    running: hostStatus === null ? runtime.running : hostStatus === "running",
    seenRunning: task?.seenRunning ?? false,
    lastAgentError: hostedTask === null ? runtime.lastAgentError : hostedTask.state === "failed" ? hostedTask.lastError ?? "\u8BBF\u524D\u4EFB\u52A1\u6267\u884C\u5931\u8D25" : null,
    partial: runtime.partial,
    toolNames: hostedTask === null ? runtime.toolNames : hostedEvents.map((event) => event.name),
    toolEvents: effectiveEvents,
    reportReady: cardText !== null
  };
  const status = hostStatus ?? deriveWorkbenchStatus(progressInput);
  const phaseStates = derivePhaseStates(progressInput);
  const insights = (0, import_react9.useMemo)(() => parseCardInsights(cardText), [cardText]);
  const reportHtml = (0, import_react9.useMemo)(() => cardText === null ? null : buildPrevisitReportHtml(cardText), [cardText]);
  const newTask = () => {
    props.shared.update(sessionId, (state) => ({
      ...state,
      task: void 0,
      view: "target",
      minimumNodeBaseline: props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? state.minimumNodeBaseline,
      dismissedTaskIds: [.../* @__PURE__ */ new Set([
        ...state.dismissedTaskIds,
        ...state.task === void 0 ? [] : [state.task.id, ...state.task.captureId === void 0 ? [] : [state.task.captureId]],
        ...hostedTask === null ? [] : [hostedTask.id]
      ])]
    }));
    setRuntime(EMPTY_RUNTIME);
    setCapturedReport(null);
    setHostedTask(null);
  };
  const saveReportResponse = async (record, ownerSessionId) => {
    const response = await fetch(`/previsit/api/tasks/${encodeURIComponent(record.id)}/report?sessionId=${encodeURIComponent(ownerSessionId)}`, { headers: { accept: "text/html" } });
    if (!response.ok) {
      let message = `\u62A5\u544A\u4E0B\u8F7D\u5931\u8D25\uFF08HTTP ${response.status}\uFF09`;
      try {
        const payload = await response.json();
        if (payload.message !== void 0) message = payload.message;
      } catch {
      }
      throw new Error(message);
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = record.artifact?.fileName ?? `\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A_${record.entity?.fullName ?? record.query}.html`;
    document.body.append(anchor);
    anchor.click();
    anchor.remove();
    setTimeout(() => URL.revokeObjectURL(url), 0);
  };
  const openHistoryTask = async (record) => {
    const origin = hostedTaskOrigin(record);
    if (!origin.complete) {
      setDownloadNote("\u8BE5\u65E7\u8BB0\u5F55\u7F3A\u5C11 Workspace / Session \u6765\u6E90\uFF0C\u53EA\u80FD\u67E5\u770B\u6E05\u5355\u6458\u8981\uFF0C\u65E0\u6CD5\u5B89\u5168\u8BFB\u53D6\u8BE6\u60C5\u3002");
      return;
    }
    setLoadingHistoryTaskId(record.id);
    setDownloadNote(void 0);
    try {
      const detail = await fetchHostedTask(record.id, record.sessionId);
      if (detail === null) throw new Error("\u8BE5\u5386\u53F2\u4EFB\u52A1\u5DF2\u4E0D\u5B58\u5728\u6216\u5F53\u524D Profile \u65E0\u6743\u8BBF\u95EE\u3002");
      setSelectedHistory(detail);
    } catch (error) {
      setDownloadNote(error instanceof Error ? error.message : "\u5386\u53F2\u4EFB\u52A1\u8BE6\u60C5\u8BFB\u53D6\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
    } finally {
      setLoadingHistoryTaskId(void 0);
    }
  };
  const downloadHistoryReport = async (record) => {
    const origin = hostedTaskOrigin(record);
    if (!record.reportReady || !origin.complete || downloadingTaskId !== void 0) return;
    setDownloadingTaskId(record.id);
    setDownloadNote(void 0);
    try {
      await saveReportResponse(record, record.sessionId);
    } catch (error) {
      setDownloadNote(error instanceof Error ? error.message : "\u5386\u53F2\u62A5\u544A\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
    } finally {
      setDownloadingTaskId(void 0);
    }
  };
  const downloadReport = async () => {
    if (cardText === null || status !== "ready") {
      setDownloadNote("\u5F53\u524D\u4EFB\u52A1\u7684\u62A5\u544A\u5C1A\u672A\u5C31\u7EEA\uFF0C\u8BF7\u7B49\u5F85\u4F1A\u8BDD\u751F\u6210\u7B26\u5408\u8F93\u51FA\u7ED3\u6784\u7684\u62A5\u544A\u3002");
      return;
    }
    try {
      setDownloadNote(void 0);
      let blob;
      let fileName;
      if (hostedTask?.artifact !== void 0) {
        await saveReportResponse(hostedTask, sessionId);
        return;
      } else {
        const html = buildPrevisitReportHtml(cardText);
        const company = /(?:访前尽调报告|拜访作战卡)\s*·\s*([^\n（(锚｜]+)/.exec(cardText)?.[1]?.trim() || "\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A";
        blob = new Blob([html], { type: "text/html;charset=utf-8" });
        fileName = `\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A_${company}.html`;
      }
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (error) {
      setDownloadNote(error instanceof Error ? error.message : "\u62A5\u544A\u4E0B\u8F7D\u5931\u8D25\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5\u3002");
    }
  };
  if (!props.visible || !isPrevisitSession(sessionId)) return /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(import_jsx_runtime11.Fragment, {});
  return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("section", { className: "qccPwShell", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", "data-status": status, children: [
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("header", { className: "qccPwHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwBrand", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwBrandIcon", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PrevisitLogo, { size: 24 }) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwBrandCopy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwTitleRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("h1", { className: "qccPwTitle", children: "\u8BBF\u524D\u5C3D\u8C03" }),
            /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwLiveDot", "data-status": status })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("p", { className: "qccPwSubtitle", children: "\u4F01\u67E5\u67E5\u4E8B\u5B9E\u9A71\u52A8 \xB7 \u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwMeta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStatus", "data-status": status, children: STATUS_LABELS[status] }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwSession", children: hostedTask?.planId === void 0 ? `\u5F53\u524D Session \xB7 ${sessionId.slice(0, 12)}` : `\u8BA1\u5212 ${planDone}/${planTotal} \u5BB6\u5DF2\u51FA\u62A5\u544A \xB7 ${planTasks.length} \u5BB6\u5DF2\u5F00\u59CB` })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("nav", { className: "qccPwTabs", "aria-label": "\u5DE5\u4F5C\u53F0\u89C6\u56FE", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", "data-selected": shared.view !== "history", onClick: () => setView("target"), children: "\u5F53\u524D\u4EFB\u52A1" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", "data-selected": shared.view === "history", onClick: () => setView("history"), children: "\u4EFB\u52A1\u5386\u53F2" })
    ] }),
    shared.view === "history" ? null : /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("nav", { className: "qccPwStages", "aria-label": "\u8BBF\u524D\u4EFB\u52A1\u9636\u6BB5", role: "tablist", children: PREVISIT_PHASES.map((current) => {
      const phaseState = phaseStates.find((item) => item.id === current);
      const selected = shared.view === current;
      return /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", role: "tab", "aria-selected": selected, className: "qccPwStage", "data-selected": selected, "data-progress": phaseState?.progress ?? "idle", onClick: () => setPhase(current), children: [
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStageIcon", "aria-hidden": "true", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(Icon, { name: current }) }),
        /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwStageCopy", children: /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("strong", { children: PHASE_LABELS[current] }) })
      ] }, current);
    }) }),
    shared.view !== "history" && status === "ready" && shared.view !== "output" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwCard", role: "status", children: [
      "\u62A5\u544A\u5DF2\u751F\u6210\uFF0C\u5DF2\u4FDD\u7559\u5F53\u524D\u9605\u8BFB\u9875\u9762\u3002",
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", onClick: () => setPhase("output"), children: "\u67E5\u770B\u62A5\u544A" })
    ] }) : null,
    shared.view !== "history" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ExecutionProgress, { task: hostedTask, status, modelRunning: runtime.available ? runtime.running : void 0, syncError: hostError ?? runtime.lastAgentError ?? void 0 }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwBody", children: [
      shared.view === "output" && hostedTask?.reportReady ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ReportFilesPanel, { taskId: hostedTask.id, sessionId: hostedTask.sessionId }, hostedTask.id) : null,
      shared.view !== "history" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(MaterialPanel, { task: hostedTask }) : null,
      shared.view === "target" && pendingPlan !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PlanCard, { plan: pendingPlan, onConfirm: async (message) => {
        await props.startPrompt(sessionId, message, true);
        setDismissedPlanIds((ids) => [...ids, pendingPlan.id]);
      }, onDismiss: () => setDismissedPlanIds((ids) => [...ids, pendingPlan.id]) }, pendingPlan.id) : null,
      shared.view === "target" && pendingPlan === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(SetupPanel, { sessionId, store: props.shared, task, input: resolveSessionInput(props.ctx, sessionId), send: async (prompt) => {
        await props.startPrompt(sessionId, prompt, true);
      }, start: (prompt) => props.startPrompt(sessionId, prompt), onStarted: () => setPhase("collect") }) : null,
      shared.view === "scope" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(ScopePanel, { state: shared, task, hostedTask }) : null,
      shared.view === "collect" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(OpportunityPanel, { task, hostedTask, status, events: effectiveEvents, insights }) : null,
      shared.view === "verify" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(RiskPanel, { task, hostedTask, status, events: effectiveEvents, insights }) : null,
      shared.view === "output" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(DeliveryPanel, { task, hostedTask, status, toolCount: hostedTask?.used ?? runtime.toolNames.length, failedToolCount: hostedTask?.runs.filter((run) => run.status === "failed").length ?? runtime.failedToolCount, cardCaptured: cardText !== null, reportHtml }) : null,
      shared.view === "history" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(
        HistoryPanel,
        {
          task,
          status,
          hosted: hostedHistory,
          selected: selectedHistory,
          loadingTaskId: loadingHistoryTaskId,
          downloadingTaskId,
          onOpen: (record) => {
            void openHistoryTask(record);
          },
          onBack: () => {
            setSelectedHistory(null);
            setDownloadNote(void 0);
          },
          onDownload: (record) => {
            void downloadHistoryReport(record);
          },
          onContinue: async (record, intent, requestId) => {
            if (hostedTask && !HOSTED_TERMINAL.has(hostedTask.state)) throw new Error("\u8BF7\u5148\u5B8C\u6210\u5F53\u524D\u4EFB\u52A1");
            const prompt = `\u8BF7\u57FA\u4E8E\u5386\u53F2\u62A5\u544A\u521B\u5EFA\u8865\u5145\u5C3D\u8C03\uFF0C\u4E0D\u4FEE\u6539\u539F\u62A5\u544A\u3002\u8C03\u7528 previsit_continue\uFF0CparentTaskId=${record.id}\uFF0CrequestId=${requestId}\uFF0Cintent=${JSON.stringify(intent)}\u3002\u6CBF\u7528\u5DF2\u786E\u8BA4\u4E3B\u4F53\uFF0C\u6309\u8FD4\u56DE\u57FA\u7840\u62A5\u544A\u8865\u5145\u5DF2\u652F\u6301\u7EF4\u5EA6\uFF1B\u65E7\u8BC1\u636E\u4FDD\u7559\u539F\u65E5\u671F\u3002\u4F7F\u7528\u65B0\u4EFB\u52A1ID\u5B8C\u6210 previsit_finalize\uFF0C\u751F\u6210\u5B8C\u6574\u66F4\u65B0\u62A5\u544A\u3002`;
            const baseline = await props.startPrompt(sessionId, prompt);
            props.shared.update(sessionId, (state) => ({ ...state, view: "collect", dismissedTaskIds: [.../* @__PURE__ */ new Set([...state.dismissedTaskIds, ...state.task ? [state.task.id] : [], ...hostedTask ? [hostedTask.id] : []])], task: { id: requestId, prompt, company: record.entity?.fullName ?? record.query, createdAt: (/* @__PURE__ */ new Date()).toISOString(), nodeBaseline: baseline, seenRunning: false, selection: state.selection } }));
          }
        }
      ) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("footer", { className: "qccPwFooter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { className: "qccPwFooterHint", "data-tone": downloadNote === void 0 && hostError === void 0 ? void 0 : "error", children: downloadNote ?? hostError ?? "\u5BBF\u4E3B\u6536\u8D77\u4FA7\u62C9\u6216\u5173\u95ED\u672C Tab \u4E0D\u4F1A\u53D6\u6D88\u4EFB\u52A1\uFF0C\u4E5F\u4E0D\u4F1A\u5220\u9664\u5386\u53F2\u6216\u5236\u54C1\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("div", { className: "qccPwFooterActions", children: [
        shared.view !== "target" && task !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: newTask, children: "\u65B0\u7684\u5C3D\u8C03" }) : null,
        shared.view === "output" ? /* @__PURE__ */ (0, import_jsx_runtime11.jsxs)("button", { type: "button", className: "qccPwPrimary", "aria-disabled": status !== "ready" || cardText === null, title: status === "ready" ? "\u4E0B\u8F7D\u4E3A HTML \u6587\u4EF6\uFF0C\u53EF\u76F4\u63A5\u6253\u5F00\u6216\u6253\u5370" : "\u62A5\u544A\u5C1A\u672A\u5C31\u7EEA\uFF0C\u70B9\u51FB\u67E5\u770B\u539F\u56E0", onClick: () => {
          void downloadReport();
        }, children: [
          "\u4E0B\u8F7D\u62A5\u544A",
          /* @__PURE__ */ (0, import_jsx_runtime11.jsx)("span", { children: "\u2193" })
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
  let service;
  let unavailable = OPTIONAL_WORKBENCH_MESSAGE;
  let active = true;
  const shared = createPrevisitStore();
  const reveal = createRevealController();
  let unavailableNotice;
  ctx.effect(() => () => {
    active = false;
    reveal.dispose();
    unavailableNotice?.remove();
  });
  const startPrompt = async (sessionId, prompt, preserveDraft = false) => {
    if (!active || !isPrevisitSession(sessionId)) throw new Error("\u8BBF\u524D\u4F1A\u8BDD\u4E0D\u53EF\u7528");
    const input = resolveSessionInput(ctx, sessionId);
    const draft = input?.state.getSnapshot().draft;
    const conversation = ctx.sessions.scope?.(sessionId)?.get("conversation");
    if (conversation === void 0) throw new Error("conversation unavailable");
    const baseline = ctx.sessions.binding?.(sessionId)?.session.getSnapshot().nodes?.length ?? 0;
    await submissions.submit(sessionId, prompt, () => conversation.send(prompt));
    if (active && !preserveDraft && draft !== void 0) clearSubmittedDraft(input, draft);
    return baseline;
  };
  const openForSession = (sessionId, view) => {
    if (!active || !isPrevisitSession(sessionId)) return;
    if (service === void 0) throw new Error(unavailable);
    if (!openWorkbench(service, { sessionId }, reveal)) throw new Error("\u8BBF\u524D\u5DE5\u4F5C\u53F0\u5DF2\u5728 Sidebar \u8BBE\u7F6E\u4E2D\u7981\u7528\uFF1B\u5F53\u524D\u8349\u7A3F\u548C\u4E1A\u52A1\u72B6\u6001\u5DF2\u4FDD\u7559\uFF0C\u8BF7\u542F\u7528\u540E\u91CD\u8BD5\u3002");
    if (view !== void 0) locatePrevisitView(shared, sessionId, view);
  };
  const submissions = installSubmissionReveal(ctx, (sessionId) => {
    try {
      openForSession(sessionId, "collect");
    } catch (cause) {
      unavailableNotice?.remove();
      const notice = document.createElement("div");
      notice.setAttribute("role", "status");
      notice.style.cssText = "position:fixed;right:20px;bottom:20px;z-index:9999;max-width:420px;padding:16px;border:1px solid #94a3b8;border-radius:12px;background:#fff;color:#334155;box-shadow:0 4px 20px #0002";
      const detail = cause instanceof Error ? cause.message : "\u5DE5\u4F5C\u53F0\u6682\u4E0D\u53EF\u7528";
      const message = document.createElement("p");
      message.textContent = `\u4EFB\u52A1\u5DF2\u63D0\u4EA4\uFF0C\u4F46\u53F3\u4FA7\u5DE5\u4F5C\u53F0\u672A\u5C55\u5F00\u3002${detail} \u8BF7\u5728\u539F\u751F\u4F1A\u8BDD\u4E2D\u7EE7\u7EED\u67E5\u770B\u8FDB\u5C55\uFF0C\u65E0\u9700\u91CD\u590D\u63D0\u4EA4\u3002`;
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.textContent = "\u77E5\u9053\u4E86";
      dismiss.addEventListener("click", () => notice.remove());
      notice.append(message, dismiss);
      document.body.append(notice);
      unavailableNotice = notice;
    }
  });
  ctx.effect(() => () => submissions.dispose(), "dsh-pre-duediligence: accepted submission reveal");
  ctx.effect(() => installComposerImageBridge({
    owned: isPrevisitSession,
    currentSessionId: () => ctx.sessions.list?.getSnapshot().current,
    send: async (sessionId, prompt) => {
      await startPrompt(sessionId, prompt, true);
    },
    onError: (_sessionId, message) => {
      unavailableNotice?.remove();
      const notice = document.createElement("div");
      notice.className = "qccImportNotice";
      notice.setAttribute("role", "alert");
      notice.textContent = message;
      const dismiss = document.createElement("button");
      dismiss.type = "button";
      dismiss.textContent = "\u77E5\u9053\u4E86";
      dismiss.addEventListener("click", () => notice.remove());
      notice.append(dismiss);
      document.body.append(notice);
      unavailableNotice = notice;
    }
  }), "dsh-pre-duediligence: composer image import");
  ctx.effect(() => installStyles(), "dsh-pre-duediligence: QCC blue UI styles");
  ctx.effect(
    () => installOrdinarySessionGuard(ctx, ctx.workspaces ?? {}),
    "dsh-pre-duediligence: ordinary Session reuse (DSH 0.1.1)"
  );
  ctx.inject(["uiWorkspace"], (workspaceCtx) => {
    const navigation = workspaceCtx.uiWorkspace ?? workspaceCtx.get?.("uiWorkspace");
    if (navigation !== void 0) {
      workspaceCtx.effect(
        () => installOrdinarySessionGuard(workspaceCtx, navigation),
        "dsh-pre-duediligence: ordinary Session reuse"
      );
    }
  });
  ctx.inject(["betterSidebar"], (sidebarCtx) => {
    sidebarCtx.effect(() => {
      const candidate = sidebarCtx.betterSidebar;
      try {
        if (candidate === void 0) return;
        const dispose = registerWorkbenchTab(candidate, (props) => /* @__PURE__ */ (0, import_jsx_runtime11.jsx)(PrevisitWorkbenchTab, { ...props, ctx, shared, reveal, startPrompt }, props.scope.sessionId));
        service = candidate;
        return () => {
          if (service === candidate) service = void 0;
          dispose();
        };
      } catch (cause) {
        const detail = cause instanceof Error ? cause.message : "\u5DE5\u4F5C\u53F0\u63A5\u53E3\u4E0D\u517C\u5BB9";
        unavailable = `${detail}\uFF1B\u5F53\u524D\u8349\u7A3F\u548C\u4E1A\u52A1\u72B6\u6001\u5DF2\u4FDD\u7559\uFF0C\u57FA\u7840\u4F1A\u8BDD\u4ECD\u53EF\u4F7F\u7528\u3002`;
      }
    });
  });
  registerLeftSidebarLauncher(ctx, () => active);
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
