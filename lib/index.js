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

// src/previsit-tools.ts
import { randomUUID } from "node:crypto";

// src/previsit-session.ts
function isPrevisitSession(sessionId) {
  return /^session-dsh-pre-duediligence-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/iu.test(sessionId);
}

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
function registerPrevisitTools(ctx) {
  const tasks = /* @__PURE__ */ new Map();
  const beginning = /* @__PURE__ */ new Set();
  const permits = /* @__PURE__ */ new Map();
  const controllers = /* @__PURE__ */ new Set();
  let disposed = false;
  const disposers = [];
  const approval = async (exec, reason) => {
    const service = ctx.get?.("approval");
    if (service === void 0 || await service.request({ agent: exec.agent, toolName: exec.name, callId: exec.callId, reason, signal: exec.signal }) !== "allowed-once") throw new Error("\u7528\u6237\u672A\u786E\u8BA4\uFF0C\u672C\u6B21\u672A\u6267\u884C\u4ED8\u8D39\u67E5\u8BE2");
    exec.signal.throwIfAborted();
  };
  disposers.push(ctx.tools.guard((exec) => {
    if (!exec.agent || !isPrevisitSession(exec.agent.session.id) || !qccTool(exec.name)) return void 0;
    const permit = permits.get(exec.callId);
    return !disposed && permit?.owner === ownerOf(exec.agent) && permit.name === exec.name && permit.parent === exec.parent ? void 0 : "\u8BBF\u524D\u4F01\u67E5\u67E5\u8C03\u7528\u5FC5\u987B\u901A\u8FC7 previsit_begin / previsit_confirm_entity / previsit_query\uFF1B\u7981\u6B62\u7ED5\u8FC7\u786E\u8BA4\u3001\u4E3B\u4F53\u548C\u9884\u7B97\u3002";
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
  register("previsit_begin", "\u5F00\u59CB\u8BBF\u524D\u5C3D\u8C03\uFF1A\u5411\u7528\u6237\u786E\u8BA4\u4F01\u4E1A\u68C0\u7D22\u8BCD\u3001\u4ED8\u8D39\u8303\u56F4\u548C\u6700\u591A 8/18/40 \u6B21\u8C03\u7528\u3002\u8FD4\u56DE\u4EFB\u52A1\u6807\u8BC6\uFF1B\u672A\u786E\u8BA4\u4E0D\u5EFA\u7ACB\u4EFB\u52A1\u3002", {
    query: { type: "string" },
    depth: { type: "string", enum: Object.keys(LIMITS) }
  }, ["query", "depth"], async (args, exec, agent) => {
    const query = string(args.query);
    const depth = string(args.depth);
    const limit = LIMITS[depth];
    if (!Object.hasOwn(LIMITS, depth)) throw new Error("\u65E0\u6548\u5C3D\u8C03\u6863\u4F4D");
    const owner = ownerOf(agent);
    if (beginning.has(owner) || tasks.get(owner)?.busy) throw new Error("\u5F53\u524D\u4EFB\u52A1\u4ECD\u6709\u672A\u5B8C\u6210\u64CD\u4F5C\uFF0C\u8BF7\u7B49\u5F85\u5B8C\u6210");
    beginning.add(owner);
    try {
      await approval(exec, `\u4E3A\u201C${query}\u201D\u6267\u884C\u8BBF\u524D\u5C3D\u8C03\uFF0C\u6700\u591A ${limit} \u6B21\u4F01\u67E5\u67E5\u8C03\u7528\uFF08\u542B\u5931\u8D25\u91CD\u8BD5\uFF09\uFF0C\u6D88\u8017\u60A8\u81EA\u6709\u8FDE\u63A5\u7684\u989D\u5EA6\u3002\u786E\u8BA4\u8303\u56F4\u4E0E\u989D\u5EA6\u540E\u5F00\u59CB\uFF1B\u591A\u5019\u9009\u9700\u53E6\u884C\u786E\u8BA4\u552F\u4E00\u4E3B\u4F53\u3002`);
      const task = { id: randomUUID(), owner, query, limit, used: 0, search: null, busy: false };
      tasks.set(owner, task);
      return { taskId: task.id, query, limit, used: 0, status: "needs-entity-search" };
    } finally {
      beginning.delete(owner);
    }
  });
  const requireTask = (args, agent) => {
    const owner = ownerOf(agent);
    if (beginning.has(owner)) throw new Error("\u65B0\u4EFB\u52A1\u4ECD\u5728\u7B49\u5F85\u786E\u8BA4\uFF0C\u8BF7\u4E32\u884C\u6267\u884C");
    const task = tasks.get(owner);
    if (!task || task.id !== string(args.taskId)) throw new Error("\u4EFB\u52A1\u4E0D\u5B58\u5728\u6216\u4E0D\u5C5E\u4E8E\u5F53\u524D Agent/Session\uFF1B\u91CD\u542F\u540E\u8BF7\u91CD\u65B0\u786E\u8BA4\u9884\u7B97");
    if (task.busy) throw new Error("\u5F53\u524D\u4EFB\u52A1\u6709\u672A\u5B8C\u6210\u64CD\u4F5C\uFF0C\u8BF7\u4E32\u884C\u6267\u884C");
    return task;
  };
  register("previsit_confirm_entity", "\u5C06\u641C\u7D22\u8FD4\u56DE\u7684\u4F01\u4E1A\u5168\u79F0\u53CA\u4FE1\u7528\u4EE3\u7801\u4EA4\u7528\u6237\u786E\u8BA4\uFF0C\u7ED1\u5B9A\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53\u3002\u4E0D\u5F97\u9ED8\u8BA4\u9009\u62E9\u7B2C\u4E00\u5019\u9009\u3002", {
    taskId: { type: "string" },
    fullName: { type: "string" },
    creditCode: { type: "string" }
  }, ["taskId", "fullName", "creditCode"], async (args, exec, agent) => {
    const task = requireTask(args, agent);
    const fullName = string(args.fullName), creditCode = string(args.creditCode);
    if (!/^[0-9A-Z]{18}$/.test(creditCode) || !containsEntity(task.search, fullName, creditCode)) throw new Error("\u5168\u79F0\u548C\u4FE1\u7528\u4EE3\u7801\u5FC5\u987B\u6765\u81EA\u540C\u4E00\u6761\u5B9E\u9645\u641C\u7D22\u8BB0\u5F55\uFF1B\u65E0\u6CD5\u8BC6\u522B\u65F6\u505C\u6B62\u5E76\u6838\u5BF9 Provider \u8FD4\u56DE\u5951\u7EA6");
    task.busy = true;
    try {
      await approval(exec, `\u8BF7\u786E\u8BA4\u672C\u6B21\u552F\u4E00\u5C3D\u8C03\u4E3B\u4F53\uFF1A${fullName}\uFF08\u7EDF\u4E00\u793E\u4F1A\u4FE1\u7528\u4EE3\u7801\uFF1A${creditCode}\uFF09\u3002\u6709\u591A\u4E2A\u5019\u9009\u65F6\uFF0C\u53EA\u6709\u60A8\u786E\u8BA4\u7684\u8FD9\u5BB6\u4F01\u4E1A\u53EF\u4EE5\u7EE7\u7EED\u67E5\u8BE2\u3002`);
      task.entity = { fullName, creditCode };
      task.personnel = void 0;
      task.risk = void 0;
      return { taskId: task.id, entity: task.entity, status: "entity-confirmed" };
    } finally {
      task.busy = false;
    }
  });
  register("previsit_query", "\u67E5\u8BE2\u5DF2\u786E\u8BA4\u4EFB\u52A1\u7684\u4E00\u9879\u4E1A\u52A1\u7EF4\u5EA6\u3002\u9996\u5148 entity_search\uFF1B\u786E\u8BA4\u552F\u4E00\u4E3B\u4F53\u540E\u518D\u67E5\u8BE2\u5176\u4F59\u7EF4\u5EA6\u3002\u56FA\u5B9A\u8DEF\u7531\u3001\u9884\u7B97\u5185\u6267\u884C\uFF0C\u4E0D\u63A5\u53D7\u52A8\u6001 MCP \u540D\u79F0\u6216\u8DE8\u4F01\u4E1A\u53C2\u6570\u3002", {
    taskId: { type: "string" },
    dimension: { type: "string", enum: Object.keys(QUERY_ROUTES) },
    personName: { type: "string" }
  }, ["taskId", "dimension"], async (args, exec, agent) => {
    const task = requireTask(args, agent);
    const dimension = string(args.dimension);
    if (!Object.hasOwn(QUERY_ROUTES, dimension)) throw new Error("\u4E0D\u652F\u6301\u7684\u4E1A\u52A1\u7EF4\u5EA6");
    if (task.used >= task.limit) return { taskId: task.id, dimension, outcome: "not-executed", reason: "\u8C03\u7528\u9884\u7B97\u5DF2\u7528\u5B8C" };
    if (dimension !== "entity_search" && !task.entity) throw new Error("\u5FC5\u987B\u5148\u641C\u7D22\u5E76\u7ECF\u7528\u6237\u786E\u8BA4\u552F\u4E00\u6CD5\u5F8B\u5B9E\u4F53");
    if (dimension === "entity_search" && task.entity) throw new Error("\u5DF2\u786E\u8BA4\u4E3B\u4F53\uFF1B\u91CD\u65B0\u641C\u7D22\u524D\u8BF7\u5EFA\u7ACB\u5E76\u786E\u8BA4\u65B0\u4EFB\u52A1");
    const [server, tool] = QUERY_ROUTES[dimension];
    if (server === "risk" && dimension !== "risk_scan") {
      const count = scanCount(task.risk, dimension, tool);
      if (count === void 0 || count === 0) return { taskId: task.id, dimension, outcome: "not-executed", reason: count === 0 ? "\u626B\u63CF\u8FD4\u56DE\u96F6\u8BB0\u5F55\uFF0C\u4E0D\u4E0B\u94BB" : "\u5C1A\u65E0\u53EF\u6838\u9A8C\u7684\u975E\u96F6\u626B\u63CF\u8BA1\u6570\uFF1B\u8BF7\u6838\u5BF9 Provider \u626B\u63CF\u5951\u7EA6" };
    }
    const tools = ctx.tools.schemas(agent).filter((s) => s.name === `mcp__qcc_${server}__${tool}` || s.name === `mcp__qcc-${server}__${tool}` || s.name === `mcp__${server}__${tool}`);
    if (tools.length !== 1) return { taskId: task.id, dimension, outcome: "not-executed", reason: tools.length ? "\u5B58\u5728\u591A\u4E2A\u540C\u540D\u6765\u6E90\uFF0C\u8BF7\u68C0\u67E5 MCP \u8FDE\u63A5" : "\u6240\u9700 MCP \u670D\u52A1\u672A\u63A5\u5165\u6216\u5DE5\u5177\u63A5\u53E3\u4E0D\u5339\u914D" };
    const selected = tools[0];
    const properties = selected.parameters?.properties ?? {};
    const queryKey = dimension === "entity_search" && "query" in properties ? "query" : "searchKey";
    const parameters = { [queryKey]: task.entity?.creditCode ?? task.query };
    if (!(queryKey in properties)) return { taskId: task.id, dimension, outcome: "not-executed", reason: "Provider \u67E5\u8BE2\u53C2\u6570\u5951\u7EA6\u4E0D\u5339\u914D" };
    if (dimension === "executive_risk") {
      const person = string(args.personName);
      if (!containsName(task.personnel, person)) throw new Error("\u8463\u76D1\u9AD8\u59D3\u540D\u5FC5\u987B\u6765\u81EA\u672C\u4E3B\u4F53\u5B9E\u9645\u5173\u952E\u4EBA\u5458\u8FD4\u56DE");
      parameters.personName = person;
    }
    if (selected.parameters?.required?.some((key) => !(key in parameters))) return { taskId: task.id, dimension, outcome: "not-executed", reason: "Provider \u9700\u8981\u989D\u5916\u53C2\u6570\uFF0C\u8BF7\u8865\u5BF9\u5E94\u4E1A\u52A1\u9002\u914D" };
    task.busy = true;
    const callId = `previsit-${randomUUID()}`;
    permits.set(callId, { owner: task.owner, name: selected.name, parent: exec.token });
    try {
      exec.signal.throwIfAborted();
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
      return { taskId: task.id, dimension, toolName: selected.name, outcome, used: task.used, limit: task.limit, data: result.isError ? { message: result.error?.message ?? "\u67E5\u8BE2\u5931\u8D25" } : data };
    } finally {
      permits.delete(callId);
      task.busy = false;
    }
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
      version: "0.1.13",
      industry: "enterprise-services",
      mcpServers: ["qcc-company", "qcc-risk", "qcc-ipr", "qcc-operation", "qcc-executive"]
    }
  };
}
function apply(ctx) {
  ctx.effect(() => registerPrevisitTools(ctx));
  ctx.skills.register(loadBundledSkill());
}
export {
  SKILL_DESCRIPTION,
  SKILL_NAME,
  apply,
  inject,
  loadBundledSkill
};
//# sourceMappingURL=index.js.map
