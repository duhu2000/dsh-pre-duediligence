window.__ModuleLoader__.load({
  id: "qcc-previsit-dsh",
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
var import_react2 = require("react");
var import_dsh_client_ui_primitives = require("@deepseek-ai/dsh-client-ui-primitives");

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
  { id: "first", label: "\u9996\u6B21\u62DC\u8BBF\u6478\u5E95", phrase: "\u9996\u6B21" },
  { id: "nego", label: "\u5546\u52A1\u8C08\u5224\u524D", phrase: "\u5728\u5546\u52A1\u8C08\u5224\u524D" },
  { id: "signing", label: "\u7B7E\u7EA6/\u51C6\u5165\u524D\u6838\u67E5", phrase: "\u5728\u7B7E\u7EA6\u524D\u6838\u67E5\u6027\u5730" },
  {
    id: "revisit",
    label: "\u590D\u8BBF\u66F4\u65B0",
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
  return captured === "" ? void 0 : captured;
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
function applySelection(state, selection) {
  if (state.mode === "manual") {
    return state;
  }
  const captured = capturePlaceholderCompany(state.lastGenerated, state.text);
  const company = captured ?? state.lastCompany;
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
    "\u8BF7\u4F7F\u7528 qcc-previsit-onepager Skill \u6267\u884C\uFF0C\u5E76\u5728\u5B8C\u6210\u4F5C\u6218\u5361\u540E\u56DE\u5199\u4EFB\u52A1\u5B8C\u6210\u6807\u8BB0\u3002"
  ].join("\n");
}

// src/better-sidebar.ts
var import_react = require("react");
var PREVISIT_WORKBENCH_TAB_ID = "qcc-previsit-dsh:agent";
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
  (0, import_react.useEffect)(() => controller.attach(sessionId, { store, tabId }), [controller, sessionId, store, tabId]);
}
function assertBetterSidebar(service) {
  if (!SUPPORTED_SIDEBAR_VERSION.test(service.version)) {
    throw new Error("qcc-previsit-dsh requires dsh-better-sidebar 0.17.x");
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
  if (service.getSnapshot().sessionId === scope.sessionId) {
    reveal.request(scope.sessionId);
  }
  return true;
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
.qccPwShell{--pw-brand:var(--dsw-alias-state-business-primary,#4176e6);--pw-brand-strong:var(--dsw-static-deepseek-600,#4868b2);--pw-brand-hover:var(--dsw-alias-button-info-hover,#679efe);--pw-surface:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-canvas:var(--dsw-alias-bg-layer-1,var(--background-primary,#fff));--pw-surface-muted:var(--dsw-alias-bg-module-platform,var(--background-secondary,#f5f6f7));--pw-ink:var(--dsw-alias-label-primary,var(--text-primary,#0f1115));--pw-muted:var(--dsw-alias-label-tertiary,var(--text-secondary,#81858c));--pw-faint:var(--dsw-alias-label-caption,#adb2b8);--pw-line:var(--dsw-alias-border-l2,var(--border-color,#e1e5ea));--pw-line-strong:var(--dsw-alias-border-l3,#d5dae2);--pw-soft:var(--dsw-alias-state-business-tertiary,#e4edfd);display:grid;grid-template-rows:auto auto minmax(0,1fr) auto;width:100%;height:100%;min-width:0;overflow:hidden;color:var(--pw-ink);background:var(--pw-surface);font-family:var(--dsw-font-family,-apple-system,BlinkMacSystemFont,"Segoe UI","PingFang SC","Microsoft YaHei",sans-serif);container-name:previsit-workbench;container-type:inline-size;-webkit-font-smoothing:antialiased}.qccPwShell button,.qccPwShell textarea{font-family:inherit}
.qccPwIcon{display:block;width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:1.8;stroke-linecap:round;stroke-linejoin:round}
.qccPwHeader{display:flex;min-height:68px;align-items:center;justify-content:space-between;gap:18px;padding:10px 20px;border-bottom:1px solid var(--pw-line);background:var(--pw-surface)}
.qccPwBrand{display:flex;min-width:0;align-items:center;gap:11px}.qccPwBrandIcon{display:grid;flex:0 0 36px;width:36px;height:36px;place-items:center;border-radius:10px;color:var(--pw-brand-strong);background:var(--pw-soft);box-shadow:inset 0 0 0 1px color-mix(in srgb,var(--pw-brand) 18%,transparent)}
.qccPwBrandCopy{min-width:0}.qccPwTitleRow{display:flex;align-items:center;gap:8px}.qccPwTitle{margin:0;font-size:15px;font-weight:700;line-height:1.35;letter-spacing:-.01em}.qccPwSubtitle{margin:2px 0 0;overflow:hidden;color:var(--pw-muted);font-size:11px;line-height:1.4;text-overflow:ellipsis;white-space:nowrap}
.qccPwLiveDot{width:7px;height:7px;border-radius:50%;background:#98a2b3;box-shadow:0 0 0 3px color-mix(in srgb,#98a2b3 15%,transparent)}.qccPwLiveDot[data-status='running'],.qccPwLiveDot[data-status='waiting-agent']{background:#c47b16;box-shadow:0 0 0 3px color-mix(in srgb,#c47b16 17%,transparent)}.qccPwLiveDot[data-status='ready']{background:#2c7a50;box-shadow:0 0 0 3px color-mix(in srgb,#2c7a50 17%,transparent)}.qccPwLiveDot[data-status='failed']{background:#b64141;box-shadow:0 0 0 3px color-mix(in srgb,#b64141 17%,transparent)}
.qccPwMeta{display:grid;flex:0 1 210px;min-width:0;justify-items:end;gap:4px}.qccPwStatus{display:flex;width:max-content;max-width:100%;align-items:center;gap:6px;padding:4px 8px;border:1px solid var(--pw-line);border-radius:999px;color:var(--pw-muted);background:var(--pw-surface-muted);font-size:10px;font-weight:650;line-height:1.25}.qccPwStatus:before{width:5px;height:5px;border-radius:50%;background:currentColor;content:''}.qccPwStatus[data-status='running'],.qccPwStatus[data-status='waiting-agent']{border-color:color-mix(in srgb,#b96a08 25%,var(--pw-line));color:#9a5d0a;background:color-mix(in srgb,#fff3df 75%,var(--pw-surface))}.qccPwStatus[data-status='ready']{border-color:color-mix(in srgb,#2c7a50 25%,var(--pw-line));color:#236542;background:color-mix(in srgb,#e7f5ec 75%,var(--pw-surface))}.qccPwStatus[data-status='failed']{border-color:color-mix(in srgb,#b64141 25%,var(--pw-line));color:#a13a3a;background:color-mix(in srgb,#fbeaea 75%,var(--pw-surface))}.qccPwSession{width:100%;overflow:hidden;color:var(--pw-muted);font-size:9px;line-height:1.3;text-align:right;text-overflow:ellipsis;white-space:nowrap}
.qccPwStages{display:grid;grid-template-columns:repeat(4,minmax(118px,1fr));min-height:72px;padding:0 16px;overflow-x:auto;border-bottom:1px solid var(--pw-line);background:var(--pw-surface);scrollbar-width:thin}.qccPwStage{position:relative;display:flex;min-width:100px;align-items:center;gap:9px;padding:8px 10px;border:0;color:var(--pw-muted);background:transparent;cursor:pointer;font:inherit;text-align:left}.qccPwStage:after{position:absolute;right:0;width:8px;height:8px;border-top:1px solid var(--pw-line-strong);border-right:1px solid var(--pw-line-strong);content:'';opacity:.72;transform:rotate(45deg)}.qccPwStage:last-child:after{display:none}.qccPwStage:hover{color:var(--pw-ink);background:color-mix(in srgb,var(--pw-brand) 4%,transparent)}.qccPwStage:focus-visible{outline:3px solid color-mix(in srgb,var(--pw-brand) 24%,transparent);outline-offset:-1px}.qccPwStage[data-selected='true']{color:var(--pw-brand);background:linear-gradient(180deg,color-mix(in srgb,var(--pw-soft) 82%,transparent),transparent)}
.qccPwStageIcon{display:grid;flex:0 0 29px;width:29px;height:29px;place-items:center;border:1px solid var(--pw-line-strong);border-radius:50%;color:var(--pw-muted);background:var(--pw-surface);transition:border-color 160ms ease,color 160ms ease,background 160ms ease,box-shadow 160ms ease}.qccPwStageIcon .qccPwIcon{width:14px;height:14px}.qccPwStage[data-selected='true'] .qccPwStageIcon{border-color:var(--pw-brand);color:#fff;background:var(--pw-brand);box-shadow:0 0 0 4px var(--pw-soft)}.qccPwStage[data-progress='done']:not([data-selected='true']) .qccPwStageIcon{border-color:color-mix(in srgb,#2c7a50 32%,var(--pw-line));color:#2c7a50;background:color-mix(in srgb,#e7f5ec 72%,var(--pw-surface))}.qccPwStage[data-progress='active']:not([data-selected='true']) .qccPwStageIcon{border-color:color-mix(in srgb,#b96a08 32%,var(--pw-line));color:#a35f08;background:color-mix(in srgb,#fff3df 72%,var(--pw-surface))}.qccPwStage[data-progress='failed']:not([data-selected='true']) .qccPwStageIcon{border-color:color-mix(in srgb,#b64141 32%,var(--pw-line));color:#a13a3a;background:color-mix(in srgb,#fbeaea 72%,var(--pw-surface))}
.qccPwStageCopy{display:grid;min-width:0;gap:2px}.qccPwStageCopy strong{overflow:hidden;font-size:11px;font-weight:650;text-overflow:ellipsis;white-space:nowrap}.qccPwStageCopy small{overflow:hidden;color:var(--pw-faint);font-size:9px;font-weight:450;text-overflow:ellipsis;white-space:nowrap}
.qccPwBody{min-height:0;overflow-y:auto;padding:22px;background:var(--pw-canvas);scrollbar-width:thin}.qccPwPanel{width:min(100%,1040px);margin:0 auto;outline:none}.qccPwPageHeading{display:flex;align-items:flex-start;justify-content:space-between;gap:18px;margin-bottom:16px}.qccPwPageHeading h2{margin:0;font-size:21px;font-weight:720;line-height:1.25;letter-spacing:-.02em}.qccPwPageHeading p:last-child{max-width:660px;margin:5px 0 0;color:var(--pw-muted);font-size:11px;line-height:1.55}.qccPwEyebrow{margin:0 0 5px!important;color:var(--pw-brand)!important;font-size:9px!important;font-weight:750;letter-spacing:.09em;text-transform:uppercase}.qccPwTaskId{flex:none;padding:5px 8px;border:1px solid var(--pw-line);border-radius:7px;color:var(--pw-muted);background:var(--pw-surface);font:9px ui-monospace,SFMono-Regular,Menlo,monospace}
.qccPwCard{overflow:hidden;border:1px solid var(--pw-line);border-radius:13px;background:var(--pw-surface);box-shadow:0 3px 12px color-mix(in srgb,#111923 7%,transparent)}.qccPwCard+.qccPwCard{margin-top:13px}.qccPwCardHeader{display:flex;align-items:flex-start;justify-content:space-between;gap:14px;padding:14px 16px;border-bottom:1px solid var(--pw-line)}.qccPwCardHeader h3,.qccPwCardHeader p{margin:0}.qccPwCardHeader h3{font-size:12px}.qccPwCardHeader p{margin-top:3px;color:var(--pw-muted);font-size:9px}.qccPwMode{padding:4px 8px;border-radius:999px;color:var(--pw-brand-strong);background:var(--pw-soft);font-size:9px;font-weight:700}.qccPwMode[data-manual='true']{color:#9a5d0a;background:color-mix(in srgb,#fff3df 75%,var(--pw-surface))}
.qccPwComposer{padding:15px 16px}.qccPwComposer label{display:grid;gap:7px;color:var(--pw-ink);font-size:10px;font-weight:650}.qccPwComposer textarea{box-sizing:border-box;width:100%;min-height:110px;padding:11px 12px;border:1px solid var(--pw-line-strong);border-radius:9px;color:var(--pw-ink);background:var(--pw-surface);font:inherit;font-size:11px;line-height:1.65;resize:vertical;transition:border-color 140ms ease,box-shadow 140ms ease}.qccPwComposer textarea:hover,.qccPwComposer textarea:focus{border-color:color-mix(in srgb,var(--pw-brand) 55%,var(--pw-line))}.qccPwComposer textarea::placeholder{color:var(--pw-faint)}.qccPwComposer textarea:focus-visible,.qccPwChoice:focus-visible,.qccPwPrimary:focus-visible,.qccPwSecondary:focus-visible{outline:3px solid color-mix(in srgb,var(--pw-brand) 24%,transparent);outline-offset:-1px}.qccPwComposerHint{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-top:7px;color:var(--pw-muted);font-size:9px}.qccPwManualHint{margin:0 16px 14px;padding:9px 10px;border-left:3px solid #c47b16;border-radius:6px;color:#8d5a11;background:color-mix(in srgb,#fff3df 65%,var(--pw-surface));font-size:10px;line-height:1.5}
.qccPwFilters{display:grid;border-top:1px solid var(--pw-line)}.qccPwFilterRow{display:grid;grid-template-columns:112px minmax(0,1fr);gap:14px;padding:12px 16px;border-bottom:1px solid var(--pw-line)}.qccPwFilterRow:last-child{border-bottom:0}.qccPwFilterLabel{padding-top:7px}.qccPwFilterLabel strong{display:block;font-size:10px}.qccPwFilterLabel span{display:block;margin-top:2px;color:var(--pw-muted);font-size:8px;line-height:1.35}.qccPwChoices{display:flex;flex-wrap:wrap;gap:7px}.qccPwChoice{min-height:31px;padding:0 10px;border:1px solid var(--pw-line);border-radius:8px;color:var(--pw-muted);background:var(--pw-surface);cursor:pointer;font:inherit;font-size:10px}.qccPwChoice:hover{color:var(--pw-ink);background:color-mix(in srgb,var(--pw-brand) 4%,var(--pw-surface))}.qccPwChoice[aria-pressed='true']{border-color:var(--pw-brand);color:var(--pw-brand-strong);background:var(--pw-soft);font-weight:700}.qccPwError{margin:12px 16px 0;padding:8px 10px;border-left:3px solid #b64141;border-radius:6px;color:#a13a3a;background:color-mix(in srgb,#fbeaea 70%,var(--pw-surface));font-size:10px}
.qccPwGrid2{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.qccPwEngine{min-height:174px;padding:16px}.qccPwEngineTop{display:flex;align-items:center;justify-content:space-between;gap:10px}.qccPwEngineTop span:first-child{display:grid;width:32px;height:32px;place-items:center;border-radius:9px;color:var(--pw-brand);background:var(--pw-soft)}.qccPwEngineTag{padding:3px 7px;border-radius:999px;color:var(--pw-muted);background:var(--pw-surface-muted);font-size:8px}.qccPwEngine h3{margin:11px 0 5px;font-size:13px}.qccPwEngine p{margin:0;color:var(--pw-muted);font-size:10px;line-height:1.55}.qccPwEngine ul{display:grid;gap:5px;margin:12px 0 0;padding:0;list-style:none}.qccPwEngine li{display:flex;gap:6px;color:var(--pw-muted);font-size:9px}.qccPwEngine li:before{color:var(--pw-brand);content:'✓'}.qccPwStateGrid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:7px;padding:15px 16px}.qccPwState{padding:9px 7px;border:1px solid var(--pw-line);border-radius:8px;color:var(--pw-muted);background:var(--pw-surface);font-size:9px;text-align:center}
.qccPwFeedback{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;margin-bottom:13px;padding:11px 12px;border:1px solid var(--pw-line);border-radius:10px;background:var(--pw-surface-muted)}.qccPwFeedbackIcon{display:grid;width:27px;height:27px;place-items:center;border-radius:8px;color:var(--pw-muted);background:var(--pw-surface)}.qccPwFeedback[data-tone='notice']{border-color:color-mix(in srgb,#b96a08 22%,var(--pw-line));background:color-mix(in srgb,#fff3df 54%,var(--pw-surface))}.qccPwFeedback[data-tone='notice'] .qccPwFeedbackIcon{color:#a35f08;background:color-mix(in srgb,#fff3df 72%,var(--pw-surface))}.qccPwFeedback[data-tone='success']{border-color:color-mix(in srgb,#2c7a50 22%,var(--pw-line));background:color-mix(in srgb,#e7f5ec 54%,var(--pw-surface))}.qccPwFeedback[data-tone='success'] .qccPwFeedbackIcon{color:#2c7a50;background:color-mix(in srgb,#e7f5ec 72%,var(--pw-surface))}.qccPwFeedback[data-tone='error']{border-color:color-mix(in srgb,#b64141 22%,var(--pw-line));background:color-mix(in srgb,#fbeaea 54%,var(--pw-surface))}.qccPwFeedback[data-tone='error'] .qccPwFeedbackIcon{color:#b64141;background:color-mix(in srgb,#fbeaea 72%,var(--pw-surface))}.qccPwFeedback strong{display:block;margin-top:1px;font-size:10px}.qccPwFeedback p{margin:3px 0 0;color:var(--pw-muted);font-size:9px;line-height:1.5}
.qccPwToolList{display:flex;flex-wrap:wrap;gap:6px;padding:14px 16px}.qccPwToolList span{max-width:100%;overflow:hidden;padding:5px 7px;border:1px solid var(--pw-line);border-radius:7px;color:var(--pw-muted);background:var(--pw-surface-muted);font:9px ui-monospace,SFMono-Regular,Menlo,monospace;text-overflow:ellipsis;white-space:nowrap}.qccPwEmpty{padding:30px 20px;color:var(--pw-muted);font-size:10px;text-align:center}
.qccPwRiskRule{display:grid;grid-template-columns:auto minmax(0,1fr);gap:12px;padding:16px}.qccPwRiskNumber{display:grid;width:38px;height:38px;place-items:center;border-radius:10px;color:var(--pw-brand);background:var(--pw-soft);font-size:15px;font-weight:750}.qccPwRiskRule h3,.qccPwRiskRule p{margin:0}.qccPwRiskRule h3{font-size:12px}.qccPwRiskRule p{margin-top:4px;color:var(--pw-muted);font-size:9px;line-height:1.55}.qccPwRiskBands{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:0 16px 16px}.qccPwRiskBand{padding:11px;border-radius:9px;background:var(--pw-surface-muted)}.qccPwRiskBand b{display:block;font-size:10px}.qccPwRiskBand span{display:block;margin-top:3px;color:var(--pw-muted);font-size:8px;line-height:1.4}.qccPwRiskBand[data-tone='red']{background:color-mix(in srgb,#fbeaea 64%,var(--pw-surface))}.qccPwRiskBand[data-tone='amber']{background:color-mix(in srgb,#fff3df 64%,var(--pw-surface))}
.qccPwDeliverables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px;padding:15px 16px}.qccPwDeliverable{display:grid;grid-template-columns:auto minmax(0,1fr);gap:9px;padding:11px;border:1px solid var(--pw-line);border-radius:9px}.qccPwDeliverable>span{display:grid;width:24px;height:24px;place-items:center;border-radius:7px;color:var(--pw-brand);background:var(--pw-soft);font-size:9px;font-weight:750}.qccPwDeliverable b{display:block;font-size:10px}.qccPwDeliverable small{display:block;margin-top:2px;color:var(--pw-muted);font-size:8px;line-height:1.4}.qccPwCoverage{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;padding:15px 16px}.qccPwMetric{padding:11px;border-radius:9px;background:var(--pw-surface-muted)}.qccPwMetric strong{display:block;color:var(--pw-brand);font-size:18px}.qccPwMetric span{color:var(--pw-muted);font-size:8px}
.qccPwFooter{display:flex;min-height:64px;align-items:center;justify-content:space-between;gap:18px;padding:10px 16px;border-top:1px solid var(--pw-line);color:var(--pw-muted);background:var(--pw-surface)}.qccPwFooterHint{max-width:680px;font-size:9px;line-height:1.5}.qccPwFooterActions{display:flex;align-items:center;gap:8px}.qccPwPrimary,.qccPwSecondary{display:inline-flex;min-height:40px;align-items:center;justify-content:center;gap:10px;padding:0 15px;border-radius:8px;cursor:pointer;font:inherit;font-size:11px;font-weight:700}.qccPwPrimary{min-width:126px;border:1px solid var(--pw-brand);color:#fff;background:var(--pw-brand);box-shadow:0 4px 10px color-mix(in srgb,var(--pw-brand) 22%,transparent)}.qccPwPrimary:hover:not(:disabled){border-color:var(--pw-brand-hover);background:var(--pw-brand-hover)}.qccPwPrimary:disabled{box-shadow:none;opacity:.48;cursor:not-allowed}.qccPwSecondary{border:1px solid var(--pw-line);color:var(--pw-muted);background:var(--pw-surface)}.qccPwSecondary:hover{color:var(--pw-ink);background:var(--pw-surface-muted)}
.qccPwEntry{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:0;color:var(--text-secondary,#475467);background:transparent;cursor:pointer;font:inherit}.qccPwInputEntry{min-height:28px;padding:4px 7px;border-radius:7px;font-size:12px}.qccPwEntry:hover,.qccPwEntry:focus-visible{color:var(--text-primary,#1f2430);background:var(--background-secondary,#f2f4f7)}.qccPwSidebarEntry{width:100%;min-height:34px;padding:7px 10px;border-radius:8px}.qccPwSidebarEntry[data-wide='false']{width:34px;padding-inline:0}.qccPwHeaderEntry{min-height:26px;padding:4px 8px;border:1px solid var(--border-color,#e5e7eb);border-radius:999px;font-size:11px}
@container previsit-workbench (max-width:680px){.qccPwHeader{padding-inline:14px}.qccPwMeta{display:none}.qccPwBody{padding:15px}.qccPwStages{grid-template-columns:repeat(4,minmax(104px,1fr));padding:0 8px}.qccPwGrid2{grid-template-columns:1fr}.qccPwFilterRow{grid-template-columns:1fr;gap:7px}.qccPwFilterLabel{padding-top:0}.qccPwStateGrid{grid-template-columns:repeat(2,1fr)}.qccPwDeliverables{grid-template-columns:1fr}.qccPwFooterHint{display:none}.qccPwFooter{justify-content:flex-end}}@media(prefers-reduced-motion:reduce){.qccPwShell *{animation:none!important;transition:none!important}}
`;

// src/workbench-v2.tsx
var import_jsx_runtime = require("react/jsx-runtime");
var inject = ["slots", "sessions", "workspaces", "conversation", "betterSidebar"];
var STYLE_ID = "qcc-previsit-dsh-workbench-v2";
var PHASE_LABELS = {
  prepare: { label: "\u5B9A\u4E49\u62DC\u8BBF", description: "\u89D2\u8272\u3001\u76EE\u7684\u4E0E\u8303\u56F4" },
  opportunity: { label: "\u673A\u4F1A\u7814\u5224", description: "\u72B6\u6001\u3001\u5047\u8BBE\u4E0E\u53CD\u8BC1" },
  risk: { label: "\u98CE\u9669\u6838\u9A8C", description: "\u626B\u63CF\u3001\u4E0B\u94BB\u4E0E\u5F71\u54CD" },
  delivery: { label: "\u4F5C\u6218\u4EA4\u4ED8", description: "\u5FC5\u95EE\u3001\u89E6\u8FBE\u4E0E\u884C\u52A8" }
};
var STATUS_LABELS = {
  empty: "\u7B49\u5F85\u5B9A\u4E49\u4EFB\u52A1",
  "waiting-agent": "\u7B49\u5F85 Agent",
  running: "\u6B63\u5728\u5C3D\u8C03",
  ready: "\u4F5C\u6218\u5361\u5DF2\u5C31\u7EEA",
  failed: "\u4EFB\u52A1\u9700\u5904\u7406"
};
var EMPTY_RUNTIME = {
  running: false,
  partial: false,
  lastAgentError: null,
  toolNames: [],
  failedToolCount: 0
};
function createNavigationController() {
  const listeners = /* @__PURE__ */ new Map();
  const pending = /* @__PURE__ */ new Map();
  return {
    attach(sessionId, listener) {
      listeners.set(sessionId, listener);
      const requested = pending.get(sessionId);
      if (requested !== void 0) {
        pending.delete(sessionId);
        listener(requested);
      }
      return () => {
        if (listeners.get(sessionId) === listener) {
          listeners.delete(sessionId);
        }
      };
    },
    request(sessionId, phase) {
      const listener = listeners.get(sessionId);
      if (listener === void 0) {
        pending.set(sessionId, phase);
      } else {
        listener(phase);
      }
    }
  };
}
function Icon({ name }) {
  const paths = {
    briefcase: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("rect", { x: "3", y: "7", width: "18", height: "12", rx: "2" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 7V5h8v2M3 12h18M10 12v2h4v-2" })
    ] }),
    prepare: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M5 4h14v16H5z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M8 8h8M8 12h8M8 16h5" })
    ] }),
    opportunity: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "10.5", cy: "10.5", r: "5.5" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m15 15 4 4M10.5 7v7M7 10.5h7" })
    ] }),
    risk: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3 3.5 7v5c0 4.6 3.1 7.5 8.5 9 5.4-1.5 8.5-4.4 8.5-9V7z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 8v5M12 17h.01" })
    ] }),
    delivery: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M6 3h8l4 4v14H6z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M14 3v5h5M9 13h6M9 17h6" })
    ] }),
    clock: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 7v5l3 2" })
    ] }),
    check: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("circle", { cx: "12", cy: "12", r: "9" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "m8 12 2.5 2.5L16 9" })
    ] }),
    warning: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 3 2.8 20h18.4z" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", { d: "M12 9v4M12 17h.01" })
    ] })
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", { className: "qccPwIcon", viewBox: "0 0 24 24", "aria-hidden": "true", children: paths[name] });
}
function collectRuntime(snapshot, baseline) {
  const toolNames = /* @__PURE__ */ new Set();
  for (const call of snapshot.runningCalls ?? []) {
    if (typeof call.name === "string") {
      toolNames.add(call.name);
    }
  }
  let failedToolCount = 0;
  for (const node of (snapshot.nodes ?? []).slice(baseline)) {
    if (node.kind !== "tool-result") {
      continue;
    }
    if (typeof node.call?.name === "string") {
      toolNames.add(node.call.name);
    }
    if (node.isError === true) {
      failedToolCount += 1;
    }
  }
  return { toolNames: [...toolNames], failedToolCount };
}
function Feedback(props) {
  const icon = props.tone === "success" ? "check" : props.tone === "error" ? "warning" : "clock";
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwFeedback", "data-tone": props.tone, role: props.tone === "error" ? "alert" : "status", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwFeedbackIcon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: icon }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: props.title }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: props.children })
    ] })
  ] });
}
function FilterGroup(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwFilterRow", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwFilterLabel", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: props.label }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: props.hint })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwChoices", children: props.options.map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
      "button",
      {
        type: "button",
        className: "qccPwChoice",
        "aria-pressed": props.selected.includes(option.id),
        onClick: () => props.onToggle(option.id),
        children: option.label
      },
      option.id
    )) })
  ] });
}
function PreparePanel(props) {
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("header", { className: "qccPwPageHeading", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwEyebrow", children: "PREVISIT BRIEF" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u5148\u5B9A\u4E49\u8FD9\u6B21\u62DC\u8BBF" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u53EF\u4EE5\u76F4\u63A5\u63CF\u8FF0\u4EFB\u52A1\uFF0C\u4E5F\u53EF\u4EE5\u70B9\u9009\u6761\u4EF6\u751F\u6210\u81EA\u7136\u8BED\u8A00\u3002\u6700\u7EC8\u53D1\u9001\u7684\u662F\u4F60\u770B\u5230\u7684\u8FD9\u6BB5\u6587\u5B57\u3002" })
    ] }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u4EFB\u52A1\u63CF\u8FF0" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u4F01\u4E1A\u7B80\u79F0\u4F1A\u7531 Agent \u6D88\u6B67\uFF1B\u6D89\u53CA\u96C6\u56E2\u6216\u5206\u652F\u65F6\u4F1A\u786E\u8BA4\u5B9E\u9645\u7B7E\u7EA6\u4E3B\u4F53\u3002" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwMode", "data-manual": props.composer.mode === "manual", children: props.composer.mode === "manual" ? "\u4FDD\u62A4\u624B\u5DE5\u5185\u5BB9" : "\u6761\u4EF6\u81EA\u52A8\u62FC\u53E5" })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwComposer", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u544A\u8BC9 Agent \u8981\u89C1\u8C01\u3001\u4E3A\u4EC0\u4E48\u89C1" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)(
            "textarea",
            {
              value: props.composer.text,
              placeholder: "\u76F4\u63A5\u8BF4\u8981\u89C1\u8C01\uFF0C\u6216\u5148\u70B9\u4E0B\u65B9\u6761\u4EF6\u751F\u6210\u95EE\u53E5\u3002\u4F8B\u5982\uFF1A\u660E\u5929\u53BB\u62DC\u8BBF\u6D59\u6C5F\u53F0\u534E\u65B0\u6750\u6599\u96C6\u56E2\u80A1\u4EFD\u6709\u9650\u516C\u53F8",
              onChange: (event) => props.setComposer(updateManualText(props.composer, event.target.value))
            }
          )
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwComposerHint", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5EFA\u8BAE\u4F7F\u7528\u4F01\u4E1A\u5B8C\u6574\u6CE8\u518C\u540D\u79F0\u6216\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
            props.composer.text.length,
            " \u5B57"
          ] })
        ] })
      ] }),
      props.composer.mode === "manual" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwManualHint", children: "\u5DF2\u68C0\u6D4B\u5230\u624B\u5DE5\u5185\u5BB9\u3002\u7EE7\u7EED\u70B9\u9009\u4E0D\u4F1A\u8986\u76D6\u539F\u6587\uFF1B\u70B9\u51FB\u5E95\u90E8\u201C\u6309\u6761\u4EF6\u8865\u5145\u201D\u540E\u4F1A\u53E6\u8D77\u4E00\u53E5\u8FFD\u52A0\u3002" }) : null,
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwFilters", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterGroup, { label: "\u6211\u7684\u89D2\u8272", hint: "\u51B3\u5B9A\u89D2\u8272\u5305\u4E0E\u5173\u6CE8\u6743\u91CD", options: ROLE_OPTIONS, selected: props.selection.role === void 0 ? [] : [props.selection.role], onToggle: (id) => props.toggleSingle("role", id) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterGroup, { label: "\u62DC\u8BBF\u76EE\u7684", hint: "\u9996\u6B21\u3001\u8C08\u5224\u3001\u7B7E\u7EA6\u6216\u590D\u8BBF", options: PURPOSE_OPTIONS, selected: props.selection.purpose === void 0 ? [] : [props.selection.purpose], onToggle: (id) => props.toggleSingle("purpose", id) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterGroup, { label: "\u91CD\u70B9\u5173\u6CE8", hint: "\u6700\u591A\u9009\u62E9 4 \u9879", options: FOCUS_OPTIONS, selected: props.selection.focus, onToggle: props.toggleFocus }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterGroup, { label: "\u65F6\u95F4\u9884\u7B97", hint: "\u7EA6 8 / 18 / 40 \u6B21\u8C03\u7528", options: BUDGET_OPTIONS, selected: props.selection.budget === void 0 ? [] : [props.selection.budget], onToggle: (id) => props.toggleSingle("budget", id) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FilterGroup, { label: "\u8F93\u51FA\u5F62\u6001", hint: "\u63A7\u5236\u4F5C\u6218\u5361\u5C55\u5F00\u65B9\u5F0F", options: OUTPUT_OPTIONS, selected: props.selection.output === void 0 ? [] : [props.selection.output], onToggle: (id) => props.toggleSingle("output", id) })
      ] }),
      props.error === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwError", role: "alert", children: props.error })
    ] })
  ] });
}
function OpportunityPanel(props) {
  const tools = props.tools.filter(isOpportunityTool);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwEyebrow", children: "OPPORTUNITY ENGINE" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u7ECF\u8425\u72B6\u6001\u4E0E\u4E1A\u52A1\u5047\u8BBE" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u5148\u8BC6\u522B\u4F01\u4E1A\u6B63\u5728\u53D1\u751F\u4EC0\u4E48\uFF0C\u518D\u4ECE\u201C\u72B6\u6001 \xD7 \u89D2\u8272\u201D\u751F\u6210\u53EF\u8BC1\u4F2A\u5047\u8BBE\uFF1B\u98CE\u9669\u8F68\u4E0E\u673A\u4F1A\u8F68\u5404\u81EA\u6C42\u771F\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    props.task === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feedback, { tone: "notice", title: "\u8FD8\u6CA1\u6709\u8BBF\u524D\u4EFB\u52A1", children: "\u5148\u5230\u201C\u5B9A\u4E49\u62DC\u8BBF\u201D\u5B8C\u6210\u4EFB\u52A1\u63CF\u8FF0\u5E76\u53D1\u9001\u3002" }) : null,
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwGrid2", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard qccPwEngine", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwEngineTop", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "opportunity" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwEngineTag", children: "\u5F15\u64CE A" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u7ECF\u8425\u72B6\u6001\u8BC6\u522B" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u81F3\u5C11\u4E24\u9879\u72EC\u7ACB\u884C\u4E3A\u4FE1\u53F7\uFF0C\u6216\u4E00\u9879\u5B98\u65B9\u8BB8\u53EF/\u9A8C\u6536\u76F4\u63A5\u8BC1\u636E\uFF0C\u624D\u8FDB\u5165\u660E\u786E\u72B6\u6001\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u4FE1\u53F7\u5FC5\u987B\u5E26\u65E5\u671F" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u8D85\u8FC7 24 \u4E2A\u6708\u53EA\u4F5C\u6CBF\u9769" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u4E0D\u8DB3\u65F6\u964D\u7EA7\u4E3A\u6E05\u5355\u7B80\u62A5" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard qccPwEngine", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwEngineTop", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "prepare" }) }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwEngineTag", children: "\u5F15\u64CE B" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u5047\u8BBE\u4E0E\u53CD\u8BC1" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u6BCF\u4E2A\u5047\u8BBE\u5FC5\u987B\u5305\u542B\u652F\u6301\u3001\u53CD\u5BF9\u3001\u672A\u77E5\u4E09\u680F\uFF1B\u672A\u77E5\u8F6C\u4E3A\u73B0\u573A\u5FC5\u95EE\uFF0C\u672A\u53CD\u8BC1\u5219\u7F6E\u4FE1\u5EA6\u5C01\u9876\u4E3A\u4F4E\u3002" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "P0/P1/P2 \u7C97\u6392\u4F18\u5148\u7EA7" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u516C\u5F00\u9636\u6BB5\u4E0D\u4F7F\u7528\u9AD8\u7F6E\u4FE1\u5EA6" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "\u5047\u8BBE\u5FC5\u987B\u56DE\u6307\u4E8B\u5B9E\u8BC1\u636E" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u516B\u79CD\u6709\u9650\u7ECF\u8425\u72B6\u6001" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u7531 Agent \u57FA\u4E8E\u672C\u6B21\u4F01\u67E5\u67E5\u4E8B\u5B9E\u5224\u5B9A\uFF0C\u5DE5\u4F5C\u53F0\u4E0D\u865A\u6784\u72B6\u6001\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwStateGrid", children: ["\u4EA7\u80FD\u5EFA\u8BBE\u671F", "\u5BA2\u6237\u5BFC\u5165\u671F", "\u4EA7\u80FD\u722C\u5761\u671F", "\u8BA2\u5355\u589E\u957F\u671F", "\u7A33\u5B9A\u7ECF\u8425\u671F", "\u6536\u7F29\u627F\u538B\u671F", "\u8D44\u672C\u8FD0\u4F5C\u671F", "\u98CE\u9669\u66B4\u9732\u671F"].map((state) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwState", children: state }, state)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u672C Session \u7684\u673A\u4F1A\u4FA7\u8C03\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u4EC5\u5C55\u793A\u771F\u5B9E\u53D1\u751F\u7684\u4F01\u67E5\u67E5\u4F01\u4E1A\u3001\u7ECF\u8425\u4E0E\u77E5\u8BC6\u4EA7\u6743\u5DE5\u5177\u4E8B\u4EF6\u3002" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "qccPwMode", children: [
          tools.length,
          " \u9879"
        ] })
      ] }),
      tools.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwEmpty", children: props.status === "running" ? "Agent \u6B63\u5728\u5EFA\u7ACB\u4E3B\u4F53\u4E0E\u4FE1\u53F7\u96C6\u2026" : "\u4EFB\u52A1\u53D1\u9001\u540E\u5728\u8FD9\u91CC\u663E\u793A\u8C03\u7528\u8BB0\u5F55" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwToolList", children: tools.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tool.replace(/^mcp__/, "") }, tool)) })
    ] })
  ] });
}
function RiskPanel(props) {
  const tools = props.tools.filter(isRiskTool);
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwEyebrow", children: "RISK ENGINE" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u98CE\u9669\u626B\u63CF\u4E0E\u5F71\u54CD\u6838\u9A8C" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u98CE\u9669\u4E0D\u662F\u673A\u4F1A\u7684\u53CD\u8BC1\u3002\u5B83\u6539\u53D8\u673A\u4F1A\u4F18\u5148\u7EA7\u4E0E\u62DC\u8BBF\u7B56\u7565\uFF1B\u8FDB\u5165\u98CE\u9669\u66B4\u9732\u671F\u65F6\u624D\u6574\u4F53\u4F18\u5148\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwRiskRule", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwRiskNumber", children: "01" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u5148\u5168\u91CF\u626B\u63CF\uFF0C\u518D\u6309\u975E\u96F6\u7EF4\u5EA6\u4E0B\u94BB" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u626B\u63CF\u8BA1\u6570\u53EA\u7528\u4E8E\u5206\u8BCA\uFF0C\u4E0D\u7B49\u4E8E\u98CE\u9669\u7ED3\u8BBA\uFF1B\u5FC5\u987B\u7ED3\u5408\u5F53\u4E8B\u4EBA\u89D2\u8272\u3001\u6848\u4EF6\u72B6\u6001\u3001\u91D1\u989D\u539F\u503C\u548C\u53D1\u751F\u65F6\u95F4\u9010\u6848\u5224\u65AD\u3002" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwRiskBands", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwRiskBand", "data-tone": "red", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "\u7EA2\u7EBF" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5148\u5185\u90E8\u6838\u5B9E\uFF0C\u4E0D\u5EFA\u8BAE\u5F53\u9762\u76F4\u95EE" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwRiskBand", "data-tone": "amber", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "\u5173\u6CE8" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u7ED3\u5408\u89D2\u8272\u3001\u72B6\u6001\u548C\u65F6\u95F4\u5224\u65AD" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwRiskBand", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: "\u672A\u8986\u76D6" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5931\u8D25\u4E0E\u96F6\u8BB0\u5F55\u5FC5\u987B\u4E25\u683C\u533A\u5206" })
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCardHeader", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u672C Session \u7684\u98CE\u9669\u4FA7\u8C03\u7528" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u96F6\u8BA1\u6570\u4E0D\u5F97\u4E0B\u94BB\uFF1B\u670D\u52A1\u7F3A\u5931\u6216\u8C03\u7528\u5931\u8D25\u5FC5\u987B\u5199\u5165\u8986\u76D6\u58F0\u660E\u3002" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "qccPwMode", children: [
          tools.length,
          " \u9879 \xB7 ",
          props.failedToolCount,
          " \u9519\u8BEF"
        ] })
      ] }),
      tools.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwEmpty", children: props.status === "running" ? "\u7B49\u5F85\u4F01\u4E1A\u98CE\u9669\u626B\u63CF\u2026" : "\u5C1A\u65E0\u98CE\u9669\u5DE5\u5177\u4E8B\u4EF6" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwToolList", children: tools.map((tool) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tool.replace(/^mcp__/, "") }, tool)) })
    ] })
  ] });
}
function DeliveryPanel(props) {
  const ready = props.status === "ready";
  const deliverables = [
    ["\u2460", "\u4E00\u53E5\u8BDD\u6838\u5FC3\u7814\u5224", "\u72B6\u6001\u3001\u673A\u4F1A\u65B9\u5411\u4E0E\u9A8C\u8BC1\u91CD\u70B9"],
    ["\u2461", "\u6700\u8FD1\u53D1\u751F\u4E86\u4EC0\u4E48", "3\u20135 \u4E2A\u5E26\u65E5\u671F\u4E0E\u6765\u6E90\u7684\u53D8\u5316"],
    ["\u2462", "\u53EF\u80FD\u53D1\u751F\u4EC0\u4E48", "P0/P1 \u5047\u8BBE\u4E0E\u652F\u6301/\u53CD\u5BF9/\u672A\u77E5"],
    ["\u2463", "\u7EA2\u7EBF\u4E0E\u63D0\u793A", "\u98CE\u9669\u5982\u4F55\u6539\u53D8\u62DC\u8BBF\u7B56\u7565"],
    ["\u2464", "\u73B0\u573A\u5FC5\u95EE 3 \u4EF6\u4E8B", "\u4E3A\u4EC0\u4E48\u95EE\u4E0E\u7B54 A/B \u4E0B\u4E00\u6B65"],
    ["\u2465", "\u89E6\u8FBE\u4E0E\u5F00\u573A\u767D", "\u6765\u6E90\u3001\u5F52\u5C5E\u3001\u7528\u9014\u4E0E\u8F6C\u63A5\u8BF7\u6C42"],
    ["\u2466", "\u8986\u76D6\u5EA6\u58F0\u660E", "\u5DF2\u67E5\u3001\u672A\u67E5\u3001\u5931\u8D25\u4E0E\u8BC1\u636E\u5C42\u7EA7"]
  ];
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "qccPwPanel", children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "qccPwPageHeading", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwEyebrow", children: "BATTLE CARD" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", { children: "\u62DC\u8BBF\u4F5C\u6218\u5361\u4EA4\u4ED8" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u6700\u7EC8\u4EA7\u7269\u4E0D\u662F\u4F01\u4E1A\u8D44\u6599\u5806\u780C\uFF0C\u800C\u662F\u201C\u53BB\u4E0D\u53BB\u3001\u89C1\u8C01\u3001\u804A\u4EC0\u4E48\u3001\u4EC0\u4E48\u4E0D\u80FD\u78B0\u201D\u7684\u4F1A\u524D\u884C\u52A8\u5361\u3002" })
      ] }),
      props.task === void 0 ? null : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwTaskId", children: props.task.id })
    ] }),
    props.task === void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feedback, { tone: "notice", title: "\u7B49\u5F85\u4EFB\u52A1", children: "\u5B8C\u6210\u4EFB\u52A1\u5B9A\u4E49\u540E\uFF0C\u4F5C\u6218\u5361\u7ED3\u6784\u548C\u6267\u884C\u8FDB\u5EA6\u4F1A\u663E\u793A\u5728\u8FD9\u91CC\u3002" }) : ready ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feedback, { tone: "success", title: "\u4F5C\u6218\u5361\u5DF2\u751F\u6210", children: "Agent \u5DF2\u7ED3\u675F\u672C\u6B21\u6267\u884C\u3002\u8BF7\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u5B8C\u6574\u4F5C\u6218\u5361\u4E0E\u4E8B\u5B9E\u5F15\u7528\u3002" }) : props.status === "failed" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feedback, { tone: "error", title: "\u672C\u6B21\u4EA4\u4ED8\u672A\u5B8C\u6574\u5B8C\u6210", children: "\u8BF7\u56DE\u5230\u4F1A\u8BDD\u67E5\u770B\u9519\u8BEF\uFF1B\u5DF2\u53D6\u5F97\u4E8B\u5B9E\u4ECD\u53EF\u4FDD\u7559\uFF0C\u5931\u8D25\u7EF4\u5EA6\u4E0D\u5F97\u5199\u6210\u96F6\u8BB0\u5F55\u3002" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Feedback, { tone: "notice", title: props.status === "running" ? "Agent \u6B63\u5728\u5F62\u6210\u4F5C\u6218\u5361" : "\u7B49\u5F85 Agent \u5F00\u59CB", children: "\u5B8C\u6210\u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u8F68\u540E\uFF0C\u5C06\u81EA\u52A8\u5207\u6362\u5230\u672C\u9875\u3002" }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u56FA\u5B9A\u4E03\u6BB5\u4F5C\u6218\u5361" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u8F93\u51FA\u5F62\u6001\u53EF\u4EE5\u538B\u7F29\u6216\u5C55\u5F00\uFF0C\u4F46\u4E8B\u5B9E\u3001\u63A8\u7406\u3001\u95EE\u9898\u548C\u8986\u76D6\u8FB9\u754C\u4E0D\u80FD\u6DF7\u5199\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwDeliverables", children: deliverables.map(([number, title, detail]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwDeliverable", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: number }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("b", { children: title }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: detail })
        ] })
      ] }, number)) })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCard", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "qccPwCardHeader", children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", { children: "\u6267\u884C\u8986\u76D6" }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "\u8FD9\u662F\u5DE5\u4F5C\u53F0\u4ECE\u5F53\u524D Session \u8BFB\u53D6\u7684\u771F\u5B9E\u6267\u884C\u4E8B\u4EF6\uFF0C\u4E0D\u662F\u5B8C\u6574\u6027\u8BC4\u5206\u3002" })
      ] }) }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwCoverage", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: props.toolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5DF2\u8BC6\u522B\u5DE5\u5177\u8C03\u7528" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: props.failedToolCount }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u5DE5\u5177\u9519\u8BEF" })
        ] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwMetric", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: ready ? "4/4" : "\u2014" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u4E1A\u52A1\u9636\u6BB5" })
        ] })
      ] })
    ] })
  ] });
}
function PrevisitWorkbenchTab(props) {
  useWorkbenchReveal(props.reveal, props);
  const sessionId = props.scope.sessionId;
  const [phase, setPhase] = (0, import_react2.useState)("prepare");
  const [composer, setComposer] = (0, import_react2.useState)(EMPTY_COMPOSER_STATE);
  const [selection, setSelection] = (0, import_react2.useState)(EMPTY_SELECTION);
  const [task, setTask] = (0, import_react2.useState)();
  const [runtime, setRuntime] = (0, import_react2.useState)(EMPTY_RUNTIME);
  const [submitting, setSubmitting] = (0, import_react2.useState)(false);
  const [error, setError] = (0, import_react2.useState)();
  const [revealedTaskId, setRevealedTaskId] = (0, import_react2.useState)();
  (0, import_react2.useEffect)(() => props.navigation.attach(sessionId, setPhase), [props.navigation, sessionId]);
  (0, import_react2.useEffect)(() => {
    const face = props.ctx.sessions.binding?.(sessionId)?.session;
    if (face === void 0) {
      return;
    }
    const refresh = () => {
      const snapshot = face.getSnapshot();
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
  (0, import_react2.useEffect)(() => {
    if (status !== "ready" && status !== "failed" || task === void 0 || revealedTaskId === task.id) {
      return;
    }
    setRevealedTaskId(task.id);
    setPhase("delivery");
    props.reveal.request(sessionId);
  }, [props.reveal, revealedTaskId, sessionId, status, task]);
  const updateSelection = (next) => {
    setSelection(next);
    setComposer((current) => applySelection(current, next));
    setError(void 0);
  };
  const toggleSingle = (key, id) => {
    const next = { ...selection };
    if (next[key] === id) {
      delete next[key];
    } else {
      next[key] = id;
    }
    updateSelection(next);
  };
  const toggleFocus = (id) => {
    if (selection.focus.includes(id)) {
      updateSelection({ ...selection, focus: selection.focus.filter((value) => value !== id) });
      return;
    }
    if (selection.focus.length >= 4) {
      setError("\u91CD\u70B9\u5173\u6CE8\u6700\u591A\u9009\u62E9 4 \u9879");
      return;
    }
    updateSelection({ ...selection, focus: [...selection.focus, id] });
  };
  const reset = () => {
    setComposer(EMPTY_COMPOSER_STATE);
    setSelection(EMPTY_SELECTION);
    setError(void 0);
  };
  const generate = () => {
    setComposer((current) => generateFromSelection(current, selection));
    setError(void 0);
  };
  const submit = async () => {
    const validationError = validateComposerText(composer.text);
    if (validationError !== void 0) {
      setError(validationError);
      setPhase("prepare");
      return;
    }
    const conversation = props.ctx.sessions.scope?.(sessionId)?.get("conversation");
    if (conversation === void 0) {
      setError("\u5F53\u524D Session \u5BF9\u8BDD\u670D\u52A1\u4E0D\u53EF\u7528\uFF0C\u8BF7\u91CD\u65B0\u6253\u5F00\u5DE5\u4F5C\u7A7A\u95F4");
      return;
    }
    const snapshot = props.ctx.sessions.binding?.(sessionId)?.session.getSnapshot();
    const id = createTaskId();
    const prompt = serializePrevisitRequest(composer.text, id);
    const nextTask = {
      id,
      prompt,
      createdAt: (/* @__PURE__ */ new Date()).toISOString(),
      nodeBaseline: snapshot?.nodes?.length ?? 0,
      seenRunning: false,
      selection
    };
    setSubmitting(true);
    setError(void 0);
    setRuntime(EMPTY_RUNTIME);
    setTask(nextTask);
    setRevealedTaskId(void 0);
    setPhase("opportunity");
    try {
      await conversation.send(prompt);
    } catch {
      setTask(void 0);
      setPhase("prepare");
      setError("\u4EFB\u52A1\u53D1\u9001\u5931\u8D25\uFF0C\u8BF7\u68C0\u67E5\u5F53\u524D\u4F1A\u8BDD\u540E\u91CD\u8BD5");
    } finally {
      setSubmitting(false);
    }
  };
  const newTask = () => {
    reset();
    setTask(void 0);
    setRuntime(EMPTY_RUNTIME);
    setPhase("prepare");
  };
  const returnToConversation = () => {
    props.store.reduce((state) => ({ ...state, panelOpen: false, bottomOpen: false }));
  };
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { className: "qccPwShell", "aria-label": "\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", "data-status": status, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", { className: "qccPwHeader", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwBrand", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwBrandIcon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: "briefcase" }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwBrandCopy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwTitleRow", children: [
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", { className: "qccPwTitle", children: "\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0" }),
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwLiveDot", "data-status": status })
          ] }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { className: "qccPwSubtitle", children: "\u4F01\u67E5\u67E5\u4E8B\u5B9E\u9A71\u52A8 \xB7 \u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE \xB7 \u62DC\u8BBF\u4F5C\u6218\u5361" })
        ] })
      ] }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwMeta", children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwStatus", "data-status": status, children: STATUS_LABELS[status] }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "qccPwSession", children: [
          "\u5F53\u524D Session \xB7 ",
          sessionId.slice(0, 12)
        ] })
      ] })
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("nav", { className: "qccPwStages", "aria-label": "\u8BBF\u524D\u4EFB\u52A1\u9636\u6BB5", children: PREVISIT_PHASES.map((current) => {
      const phaseState = phaseStates.find((item) => item.id === current);
      return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "qccPwStage", "data-selected": phase === current, "data-progress": phaseState?.progress ?? "idle", onClick: () => setPhase(current), children: [
        /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwStageIcon", children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { name: current }) }),
        /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { className: "qccPwStageCopy", children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: PHASE_LABELS[current].label }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("small", { children: PHASE_LABELS[current].description })
        ] })
      ] }, current);
    }) }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwBody", children: [
      phase === "prepare" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PreparePanel, { composer, selection, error, setComposer, toggleSingle, toggleFocus }) : null,
      phase === "opportunity" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(OpportunityPanel, { task, status, tools: runtime.toolNames }) : null,
      phase === "risk" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RiskPanel, { task, status, tools: runtime.toolNames, failedToolCount: runtime.failedToolCount }) : null,
      phase === "delivery" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DeliveryPanel, { task, status, toolCount: runtime.toolNames.length, failedToolCount: runtime.failedToolCount }) : null
    ] }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("footer", { className: "qccPwFooter", children: [
      /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "qccPwFooterHint", children: phase === "prepare" ? "\u6761\u4EF6\u53EA\u7528\u4E8E\u751F\u6210\u53EF\u89C1\u6587\u672C\uFF1BAgent \u7684\u9ED8\u8BA4\u503C\u4E0E\u8DEF\u7531\u89C4\u5219\u7531 Skill \u7EDF\u4E00\u7BA1\u7406\u3002" : "\u5DE5\u4F5C\u53F0\u7ED1\u5B9A\u5F53\u524D Session\uFF0C\u4F01\u4E1A\u4E8B\u5B9E\u4E0E\u5B8C\u6574\u4F5C\u6218\u5361\u4FDD\u7559\u5728\u539F\u751F\u4F1A\u8BDD\u4E2D\u3002" }),
      /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { className: "qccPwFooterActions", children: [
        phase === "prepare" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: reset, children: "\u6E05\u7A7A" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: generate, children: composer.mode === "manual" ? "\u6309\u6761\u4EF6\u8865\u5145" : "\u91CD\u65B0\u751F\u6210" }),
          /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "qccPwPrimary", disabled: submitting, onClick: () => void submit(), children: [
            submitting ? "\u6B63\u5728\u53D1\u9001\u2026" : "\u5F00\u59CB\u8BBF\u524D\u5C3D\u8C03",
            /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2192" })
          ] })
        ] }) : null,
        phase !== "prepare" && task !== void 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPwSecondary", onClick: newTask, children: "\u53D1\u8D77\u65B0\u4EFB\u52A1" }) : null,
        phase !== "prepare" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "qccPwPrimary", onClick: returnToConversation, children: [
          status === "ready" ? "\u67E5\u770B\u5B8C\u6574\u4F5C\u6218\u5361" : "\u8FD4\u56DE\u4EFB\u52A1\u4F1A\u8BDD",
          /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u2192" })
        ] }) : null
      ] })
    ] })
  ] });
}
function SidebarEntry(props) {
  const wide = props.wide !== false;
  const openCurrent = props.openCurrent;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "qccPwEntry qccPwSidebarEntry", "data-wide": wide, "aria-label": "\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", onClick: openCurrent, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconSearchOutline16, { size: wide ? 16 : 18 }),
    wide ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BBF\u524D\u5C3D\u8C03" }) : null
  ] });
}
function InputEntry(props) {
  const open = props.open;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", { type: "button", className: "qccPwEntry qccPwInputEntry", onClick: open, children: [
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_dsh_client_ui_primitives.IconSearchOutline16, { size: 15 }),
    /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "\u8BBF\u524D\u5C3D\u8C03" })
  ] });
}
function HeaderEntry(props) {
  const open = props.open;
  return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", { type: "button", className: "qccPwEntry qccPwHeaderEntry", title: "\u6253\u5F00\u8BBF\u524D\u5C3D\u8C03\u5DE5\u4F5C\u53F0", onClick: open, children: "\u8BBF\u524D" });
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
  const reveal = createRevealController();
  const navigation = createNavigationController();
  const openSession = (sessionId, phase) => {
    const cwd = ctx.sessions.list.getSnapshot().byId[sessionId]?.cwd;
    const scope = cwd === void 0 ? { sessionId } : { sessionId, cwd };
    const opened = openWorkbench(service, scope, reveal);
    if (opened && phase !== void 0) {
      navigation.request(sessionId, phase);
    }
    return opened;
  };
  const openCurrent = () => {
    const current = ctx.sessions.list.getSnapshot().current;
    if (current === void 0) {
      ctx.workspaces.startSession?.();
      return false;
    }
    return openSession(current);
  };
  ctx.effect(() => installStyles(), "qcc-previsit: workbench styles");
  ctx.effect(() => registerWorkbenchTab(service, (props) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrevisitWorkbenchTab, { ...props, ctx, reveal, navigation })), "qcc-previsit: Better Sidebar tab");
  ctx.slots.inject("sidebar.footer.action", () => ctx.slots.register({
    name: "sidebar.footer.action",
    id: "qcc-previsit-dsh:sidebar",
    order: 30,
    inject: () => ({ openCurrent })
  }, SidebarEntry));
  ctx.slots.inject("conversation.input.left", () => ctx.slots.register({
    name: "conversation.input.left",
    id: "qcc-previsit-dsh:input",
    order: 90,
    inject: (sessionId) => ({ open: () => openSession(sessionId, "prepare") })
  }, InputEntry));
  ctx.slots.inject("conversation.session.header.actions", () => ctx.slots.register({
    name: "conversation.session.header.actions",
    id: "qcc-previsit-dsh:header",
    order: 90,
    inject: (sessionId) => ({ open: () => openSession(sessionId) })
  }, HeaderEntry));
}

    return module.exports;
  }
});
