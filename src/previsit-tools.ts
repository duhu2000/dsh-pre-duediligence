import { randomUUID } from "node:crypto"
import { isPrevisitSession } from "./previsit-session.js"
import { classifyToolOutcome } from "./tool-outcome.js"
import { normalizePrevisitRequestId, previsitVerificationClosure, PrevisitWorkflowStore, validatePrevisitReport } from "./previsit-workflow.js"

// Business vocabulary is fixed here; the browser/model cannot dispatch an arbitrary MCP tool.
export const QUERY_ROUTES = {
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
  executive_risk: ["executive", "get_executive_risk_scan"],
} as const

/** Common model-facing aliases are normalized before the fixed route guard. */
export const QUERY_ROUTE_ALIASES = {
  key_personnel: "personnel",
} as const

type Agent = { id: string; session: { id: string; header?: { cwd?: string } } }
type Execution = { agent?: Agent; callId: string; rootCallId: string; name: string; arguments: unknown; signal: AbortSignal; token: unknown; parent?: unknown; deferContext?(context: unknown): void; concludeTurn?(): void }
type Result = { isError: boolean; value?: unknown; content: unknown[]; error?: { message?: string; info?: { code?: string } }; additionalContexts?: unknown[]; concludesTurn?: boolean }
type Definition = { name: string; description: string; parameters: object; output: { schema: object; render(args: unknown, value: unknown): Array<{ type: "text"; text: string }> }; execute(args: unknown, exec: Execution): Promise<unknown> }
export type ToolHost = {
  tools: {
    register(definition: Definition): () => void
    guard(check: (exec: Execution) => string | undefined): () => void
    schemas(agent: Agent): Array<{ name: string; parameters?: { properties?: Record<string, unknown>; required?: string[] } }>
    execute(input: Omit<Execution, "token" | "deferContext" | "concludeTurn">): Promise<Result>
  }
  get?(name: string): unknown
}
type Task = { id: string; owner: string; query: string; depth: keyof typeof DEPTHS; used: number; search: unknown; personnel?: unknown; risk?: unknown; entity?: { fullName: string; creditCode: string }; busy: boolean }
const DEPTHS = { fast: true, standard: true, deep: true } as const
const RISK_DETAIL_DIMENSIONS = ["dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents"] as const
const qccTool = (name: string) => /^mcp__(?:qcc(?:[-_][A-Za-z0-9_-]+)?|company|risk|ipr|operation|executive)__/.test(name)
const ownerOf = (agent: Agent) => JSON.stringify([agent.id, agent.session.id, agent.session.header?.cwd ?? ""])
const object = (value: unknown): Record<string, unknown> => {
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("参数必须为对象")
  return value as Record<string, unknown>
}
const string = (value: unknown) => {
  if (typeof value !== "string" || value.trim() === "" || value.length > 300) throw new Error("缺少有效参数")
  return value.trim()
}
const reportString = (value: unknown) => {
  if (typeof value !== "string" || value.trim().length < 80 || value.length > 240_000) throw new Error("缺少有效的完整报告")
  return value.trim()
}
function structured(result: Result): unknown {
  const value = result.value
  if (value && typeof value === "object" && "structuredContent" in value) return (value as { structuredContent: unknown }).structuredContent
  // MCP canonical values may themselves contain content blocks.
  const content = value && typeof value === "object" && "content" in value ? (value as { content: unknown }).content : result.content
  if (Array.isArray(content)) {
    const texts = content.filter((v): v is { type: string; text: string } => v?.type === "text" && typeof v.text === "string")
    if (texts.length === 1) { try { return JSON.parse(texts[0]!.text) } catch { /* retain raw facts */ } }
  }
  return value ?? content
}
function containsName(value: unknown, name: string, depth = 0): boolean {
  if (depth > 30 || value === null || typeof value !== "object") return false
  return Object.values(value).some(v => v === name || containsName(v, name, depth + 1))
}
function scanCount(value: unknown, dimension: string, tool: string, depth = 0): number | undefined {
  if (depth > 30 || value === null || typeof value !== "object") return undefined
  const record = value as Record<string, unknown>
  const candidate = record[dimension] ?? record[tool]
  const count = typeof candidate === "number" ? candidate : candidate && typeof candidate === "object" ? (candidate as { count?: unknown }).count : undefined
  if (typeof count === "number" && Number.isInteger(count) && count >= 0) return count
  for (const child of Object.values(record)) { const found = scanCount(child, dimension, tool, depth + 1); if (found !== undefined) return found }
  return undefined
}
function containsEntity(value: unknown, name: string, code: string, depth = 0): boolean {
  if (depth > 30 || value === null || typeof value !== "object") return false
  const values = Object.values(value)
  return (!Array.isArray(value) && values.includes(name) && values.includes(code)) || values.some(v => containsEntity(v, name, code, depth + 1))
}

/** Host-owned admission, entity binding, progress and fixed-route ToolRuntime dispatch. */
export function registerPrevisitTools(ctx: ToolHost, workflow = new PrevisitWorkflowStore()): () => void {
  const tasks = new Map<string, Task>()
  const beginning = new Set<string>()
  const permits = new Map<string, { owner: string; name: string; parent: unknown }>()
  const controllers = new Set<AbortController>()
  let disposed = false
  const disposers: Array<() => void> = []
  disposers.push(ctx.tools.guard(exec => {
    if (!exec.agent || !isPrevisitSession(exec.agent.session.id) || !qccTool(exec.name)) return undefined
    const permit = permits.get(exec.callId)
    return !disposed && permit?.owner === ownerOf(exec.agent) && permit.name === exec.name && permit.parent === exec.parent
      ? undefined : "访前企查查调用必须通过 previsit_begin / previsit_confirm_entity / previsit_query；禁止绕过主体绑定与固定业务路由。"
  }))
  const register = (name: string, description: string, properties: object, required: string[], execute: (args: Record<string, unknown>, exec: Execution, agent: Agent) => Promise<unknown>) => {
    disposers.push(ctx.tools.register({
      name, description, parameters: { type: "object", properties, required, additionalProperties: false },
      output: { schema: { type: "object", additionalProperties: true }, render: (_args, value) => [{ type: "text", text: JSON.stringify(value) }] },
      async execute(args, execution) {
        if (disposed || !execution.agent || !isPrevisitSession(execution.agent.session.id)) throw new Error("请从访前尽调入口进入专属会话")
        const controller = new AbortController()
        controllers.add(controller)
        const exec = {
          ...execution, signal: AbortSignal.any([execution.signal, controller.signal]),
          // ToolRuntime tracks conclusion by the original execution object's identity.
          concludeTurn: () => execution.concludeTurn?.(),
          deferContext: (context: unknown) => execution.deferContext?.(context),
        }
        try { exec.signal.throwIfAborted(); return await execute(object(args), exec, execution.agent) }
        finally { controllers.delete(controller) }
      },
    }))
  }
  register("previsit_begin", "开始访前尽调。用户发送任务即同意在固定业务路由内连续执行；不要再次请求 MCP 权限确认。深度只控制覆盖优先级与目标时长，不设置插件调用次数上限。若提示中含 PV 任务 ID，必须作为 requestId 传入，以便工作台同步。", {
    query: { type: "string" }, depth: { type: "string", enum: Object.keys(DEPTHS) }, requestId: { type: "string" },
  }, ["query", "depth"], async (args, exec, agent) => {
    const query = string(args.query)
    const depth = string(args.depth) as keyof typeof DEPTHS
    if (!Object.hasOwn(DEPTHS, depth)) throw new Error("无效尽调档位")
    const owner = ownerOf(agent)
    if (beginning.has(owner) || tasks.get(owner)?.busy) throw new Error("当前任务仍有未完成操作，请等待完成")
    beginning.add(owner)
    try {
      exec.signal.throwIfAborted()
      const requestId = normalizePrevisitRequestId(args.requestId)
      const prior = tasks.get(owner)
      const record = await workflow.create({
        ...(requestId === undefined ? {} : { id: requestId }),
        sessionId: agent.session.id,
        workspace: agent.session.header?.cwd ?? "",
        query,
        depth,
        limit: 0,
      })
      const task: Task = prior?.id === record.id && prior.entity === undefined
        ? { ...prior, query, depth, used: record.used, search: null, personnel: undefined, risk: undefined, busy: false }
        : { id: record.id, owner, query, depth, used: record.used, search: null, busy: false }
      tasks.set(owner, task)
      return { taskId: task.id, query, unlimited: true, used: task.used, status: "needs-entity-search" }
    } finally { beginning.delete(owner) }
  })
  const requireTask = (args: Record<string, unknown>, agent: Agent) => {
    const owner = ownerOf(agent)
    if (beginning.has(owner)) throw new Error("新任务仍在初始化，请串行执行")
    const task = tasks.get(owner)
    if (!task || task.id !== string(args.taskId)) throw new Error("任务不存在或不属于当前 Agent/Session；重启后请使用原 `PV-*` 标识重新开始任务")
    if (task.busy) throw new Error("当前任务有未完成操作，请串行执行")
    return task
  }
  register("previsit_confirm_entity", "绑定用户已从候选中选择的唯一法律实体；这是主体选择，不得再发起 MCP 权限确认。不得默认选择模糊候选中的第一项。", {
    taskId: { type: "string" }, fullName: { type: "string" }, creditCode: { type: "string" },
  }, ["taskId", "fullName", "creditCode"], async (args, exec, agent) => {
    const task = requireTask(args, agent)
    const fullName = string(args.fullName), creditCode = string(args.creditCode)
    if (!/^[0-9A-Z]{18}$/.test(creditCode) || !containsEntity(task.search, fullName, creditCode)) throw new Error("全称和信用代码必须来自同一条实际搜索记录；无法识别时停止并核对 Provider 返回契约")
    task.busy = true
    try {
      exec.signal.throwIfAborted()
      task.entity = { fullName, creditCode }
      task.personnel = undefined
      task.risk = undefined
      await workflow.confirmEntity(task.id, task.entity)
      return { taskId: task.id, entity: task.entity, status: "entity-confirmed" }
    } finally { task.busy = false }
  })
  const recordSyntheticOutcome = async (task: Task, dimension: keyof typeof QUERY_ROUTES, outcome: "skipped" | "not-executed", reason: string, pending = false) => {
    const record = await workflow.get(task.id)
    const latest = [...(record?.runs ?? [])].reverse().find(run => run.dimension === dimension)
    if (latest?.status === outcome && latest.message === reason) return
    const [server, tool] = QUERY_ROUTES[dimension]
    const runId = `previsit-${pending ? "pending" : outcome}-${randomUUID()}`
    await workflow.startRun(task.id, { runId, dimension, toolName: `mcp__qcc_${server}__${tool}`, quotaUsed: false })
    await workflow.finishRun(task.id, runId, outcome, reason)
  }

  register("previsit_query", "查询已确认任务的一项业务维度。首先 entity_search；确认唯一主体后再查询其余维度。仅按固定路由执行，不设置插件调用次数上限，也不接受动态 MCP 名称或跨企业参数。", {
    taskId: { type: "string" }, dimension: { type: "string", enum: [...Object.keys(QUERY_ROUTES), ...Object.keys(QUERY_ROUTE_ALIASES)] }, personName: { type: "string" },
  }, ["taskId", "dimension"], async (args, exec, agent) => {
    const task = requireTask(args, agent)
    const requestedDimension = string(args.dimension)
    const dimension = (QUERY_ROUTE_ALIASES[requestedDimension as keyof typeof QUERY_ROUTE_ALIASES] ?? requestedDimension) as keyof typeof QUERY_ROUTES
    if (!Object.hasOwn(QUERY_ROUTES, dimension)) throw new Error("不支持的业务维度")
    const skipped = async (reason: string, outcome: "skipped" | "not-executed" = "not-executed") => {
      await recordSyntheticOutcome(task, dimension, outcome, reason)
      const [server, tool] = QUERY_ROUTES[dimension]
      return { taskId: task.id, dimension, toolName: `mcp__qcc_${server}__${tool}`, outcome, reason, used: task.used, unlimited: true }
    }
    if (dimension !== "entity_search" && !task.entity) throw new Error("必须先搜索并经用户确认唯一法律实体")
    if (dimension === "entity_search" && task.entity) throw new Error("已确认主体；重新搜索前请建立并确认新任务")
    const [server, tool] = QUERY_ROUTES[dimension]
    if (server === "risk" && dimension !== "risk_scan") {
      const count = scanCount(task.risk, dimension, tool)
      if (count === 0) return skipped("风险扫描为 0，无需下钻", "skipped")
      if (count === undefined) return skipped("尚无可核验的非零扫描计数；请核对 Provider 扫描契约")
    }
    const tools = ctx.tools.schemas(agent).filter(s => s.name === `mcp__qcc_${server}__${tool}` || s.name === `mcp__qcc-${server}__${tool}` || s.name === `mcp__${server}__${tool}`)
    if (tools.length !== 1) return skipped(tools.length ? "存在多个同名来源，请检查 MCP 连接" : "所需 MCP 服务未接入或工具接口不匹配")
    const selected = tools[0]!
    const properties = selected.parameters?.properties ?? {}
    const queryKey = dimension === "entity_search" && "query" in properties ? "query" : "searchKey"
    const parameters: Record<string, unknown> = { [queryKey]: task.entity?.creditCode ?? task.query }
    if (!(queryKey in properties)) return skipped("Provider 查询参数契约不匹配")
    if (dimension === "executive_risk") {
      const person = string(args.personName)
      if (!containsName(task.personnel, person)) throw new Error("董监高姓名必须来自本主体实际关键人员返回")
      parameters.personName = person
    }
    if (selected.parameters?.required?.some(key => !(key in parameters))) return skipped("Provider 需要额外参数，请补对应业务适配")
    task.busy = true
    const callId = `previsit-${randomUUID()}`
    let runStarted = false
    permits.set(callId, { owner: task.owner, name: selected.name, parent: exec.token })
    try {
      exec.signal.throwIfAborted()
      await workflow.startRun(task.id, { runId: callId, dimension, toolName: selected.name, quotaUsed: true })
      runStarted = true
      task.used += 1
      const result = await ctx.tools.execute({ callId, rootCallId: exec.rootCallId, parent: exec.token, name: selected.name, arguments: parameters, agent, signal: exec.signal })
      for (const context of result.additionalContexts ?? []) exec.deferContext?.(context)
      if (!result.isError && result.concludesTurn) exec.concludeTurn?.()
      exec.signal.throwIfAborted()
      const data = structured(result)
      let outcome = result.isError ? classifyToolOutcome({ code: result.error?.info?.code }, true) : classifyToolOutcome(data)
      // A risk scan with at least one recognized integer count satisfies its
      // business contract even when the Provider omits a generic status/data wrapper.
      if (!result.isError && dimension === "risk_scan" && outcome === "unknown"
        && RISK_DETAIL_DIMENSIONS.some(detail => scanCount(data, detail, QUERY_ROUTES[detail][1]) !== undefined)) outcome = "done"
      const usable = !result.isError && !["failed", "no-permission", "not-executed", "no-data"].includes(outcome)
      if (dimension === "entity_search") task.search = usable ? data : null
      if (dimension === "personnel") task.personnel = usable ? data : null
      if (dimension === "risk_scan") task.risk = usable ? data : null
      await workflow.finishRun(task.id, callId, outcome, result.isError ? result.error?.message ?? "查询失败" : undefined)
      if (dimension === "risk_scan" && outcome === "no-data") {
        for (const detail of RISK_DETAIL_DIMENSIONS) {
          await recordSyntheticOutcome(task, detail, "skipped", "风险扫描无记录，无需下钻")
        }
      } else if (dimension === "risk_scan" && usable) {
        for (const detail of RISK_DETAIL_DIMENSIONS) {
          const [, detailTool] = QUERY_ROUTES[detail]
          const count = scanCount(data, detail, detailTool)
          if (count === 0) await recordSyntheticOutcome(task, detail, "skipped", "风险扫描为 0，无需下钻")
          else if (count === undefined) await recordSyntheticOutcome(task, detail, "not-executed", "风险扫描未返回可映射计数，无法判定是否需要下钻")
          else await recordSyntheticOutcome(task, detail, "not-executed", `风险扫描命中 ${count} 条，等待明细下钻`, true)
        }
      }
      if (dimension === "personnel" && outcome === "no-data") {
        await recordSyntheticOutcome(task, "executive_risk", "skipped", "未取得可核验关键人员，无需执行董监高风险扫描")
      } else if (dimension === "personnel" && (outcome === "done" || outcome === "unknown")) {
        await recordSyntheticOutcome(task, "executive_risk", "not-executed", "已取得关键人员，等待董监高风险扫描", true)
      }
      return { taskId: task.id, dimension, ...(requestedDimension === dimension ? {} : { requestedDimension }), toolName: selected.name, outcome, used: task.used, unlimited: true, data: result.isError ? { message: result.error?.message ?? "查询失败" } : data }
    } catch (error) {
      if (runStarted) await workflow.finishRun(task.id, callId, "failed", error instanceof Error ? error.message : String(error)).catch(() => {})
      throw error
    } finally { permits.delete(callId); task.busy = false }
  })
  register("previsit_finalize", "保存已经完成的八段访前尽调报告、生成可下载制品并结束任务。调用后仍须把同一报告正文回复给用户。", {
    taskId: { type: "string" }, reportMarkdown: { type: "string", maxLength: 240000 }, status: { type: "string", enum: ["completed", "partial"] },
  }, ["taskId", "reportMarkdown"], async (args, exec, agent) => {
    const task = requireTask(args, agent)
    if (task.entity === undefined) throw new Error("必须先确认唯一法律实体")
    const reportMarkdown = validatePrevisitReport(reportString(args.reportMarkdown), task.entity.fullName)
    const current = await workflow.get(task.id)
    if (current === undefined) throw new Error("访前任务不存在")
    const closure = previsitVerificationClosure(current)
    if (closure.gaps.length > 0) throw new Error(`证据核验未闭环：${closure.gaps.join("；")}。完成查询，或记录明确失败/无需执行后再生成报告`)
    exec.signal.throwIfAborted()
    const status = args.status === "partial" || closure.partialRequired ? "partial" : "completed"
    const record = await workflow.finalize(task.id, reportMarkdown, status)
    return {
      taskId: task.id,
      status: record.state,
      used: record.used,
      unlimited: true,
      entity: record.entity,
      artifact: record.artifact,
      reportUrl: `/previsit/api/tasks/${encodeURIComponent(task.id)}/report?sessionId=${encodeURIComponent(agent.session.id)}`,
    }
  })
  return () => {
    disposed = true
    for (const controller of controllers) controller.abort()
    for (const dispose of disposers.reverse()) dispose()
    tasks.clear(); permits.clear(); beginning.clear()
  }
}
