import { describe, expect, it, vi } from "vitest"
import { QUERY_ROUTES, registerPrevisitTools, type ToolHost } from "./previsit-tools.js"
import { PrevisitWorkflowStore } from "./previsit-workflow.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
const company = { fullName: "合成甲公司", creditCode: "913200000000000001" }
const companyB = { fullName: "合成乙公司", creditCode: "913200000000000002" }
type Definition = Parameters<ToolHost["tools"]["register"]>[0]
type Execution = Parameters<Definition["execute"]>[1]
function fixture() {
  const definitions = new Map<string, Definition>()
  let guard: Parameters<ToolHost["tools"]["guard"]>[0] = () => undefined
  const agent = { id: "agent-a", session: { id: sessionId, header: { cwd: "/synthetic" } } }
  let reply: unknown = [company, companyB]
  const approval = vi.fn(async (_request: unknown) => "allowed-once")
  const dispatch = vi.fn(async (_input: unknown) => ({ isError: false, value: reply, content: [] as unknown[] }))
  const schemas = vi.fn(() => Object.values(QUERY_ROUTES).map(([server, tool]) => ({ name: `mcp__qcc_${server}__${tool}`, parameters: { properties: { searchKey: {}, personName: {} }, required: ["searchKey"] } })))
  const ctx: ToolHost = {
    get: () => ({ request: approval }),
    tools: {
      register: definition => { definitions.set(definition.name, definition); return () => { definitions.delete(definition.name) } },
      guard: check => { guard = check; return () => { guard = () => undefined } },
      schemas,
      execute: async input => {
        const denied = guard({ ...input, token: {} })
        if (denied) throw new Error(denied)
        return dispatch(input)
      },
    },
  }
  const workflow = new PrevisitWorkflowStore()
  const dispose = registerPrevisitTools(ctx, workflow)
  const execution = (name: string, extra: Partial<Execution> = {}): Execution => ({ agent, name, arguments: {}, callId: "outer", rootCallId: "root", token: {}, signal: new AbortController().signal, ...extra })
  const call = (name: string, args: object, extra: Partial<Execution> = {}) => definitions.get(name)!.execute(args, execution(name, extra)) as Promise<Record<string, unknown>>
  const begin = async () => (await call("previsit_begin", { query: "合成公司", depth: "fast" })).taskId as string
  const anchor = async (taskId: string) => {
    await call("previsit_query", { taskId, dimension: "entity_search" })
    await call("previsit_confirm_entity", { taskId, ...company })
  }
  return { agent, ctx, call, begin, anchor, execution, guard: (exec: Execution) => guard(exec), approval, dispatch, schemas, workflow, dispose, definitions, setReply: (value: unknown) => { reply = value } }
}

describe("Agent-owned paid-query boundary", () => {
  it("treats the submitted task as consent and does not open extra MCP approvals", async () => {
    const f = fixture()
    f.approval.mockResolvedValue("rejected")
    await expect(f.begin()).resolves.toMatch(/^PVT-/)
    expect(f.approval).not.toHaveBeenCalled()
    expect(f.dispatch).not.toHaveBeenCalled()
    await expect(f.call("previsit_begin", { query: "x", depth: "fast", confirmed: true }, { agent: { ...f.agent, session: { id: "ordinary" } } })).rejects.toThrow("专属会话")
  })
  it("does not select the first candidate; binds only a matching name/code pair selected by the human", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.call("previsit_query", { taskId, dimension: "entity_search" })
    await expect(f.call("previsit_query", { taskId, dimension: "profile" })).rejects.toThrow("确认唯一")
    await expect(f.call("previsit_confirm_entity", { taskId, fullName: company.fullName, creditCode: companyB.creditCode })).rejects.toThrow("同一条")
    await f.call("previsit_confirm_entity", { taskId, ...companyB })
    expect(f.approval).not.toHaveBeenCalled()
    await f.call("previsit_query", { taskId, dimension: "profile" })
    expect(f.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ arguments: { searchKey: companyB.creditCode }, agent: f.agent }))
  })
  it("binds permissions to Agent, Session, workspace and the nested call identity", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    await expect(f.call("previsit_query", { taskId, dimension: "profile" }, { agent: { ...f.agent, id: "agent-b" } })).rejects.toThrow("不属于")
    const raw = f.execution("mcp__qcc_company__get_company_profile")
    expect(f.guard(raw)).toContain("禁止绕过")
    expect(f.guard({ ...raw, parent: raw.token })).toContain("禁止绕过")
    expect(f.guard({ ...raw, agent: { ...f.agent, session: { id: "cleaning-session" } } })).toBeUndefined()
  })
  it("does not stop at the former fast-depth eight-call limit", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    f.dispatch.mockResolvedValue({ isError: true, value: { code: 403 }, content: [] })
    for (let i = 0; i < 10; i++) {
      await expect(f.call("previsit_query", { taskId, dimension: "profile" })).resolves.toMatchObject({ outcome: "failed", unlimited: true })
    }
    expect(f.dispatch).toHaveBeenCalledTimes(11)
    await expect(f.workflow.get(taskId)).resolves.toMatchObject({ used: 11, limit: 0, state: "running" })
  })
  it("reuses the visible PV task when the user corrects the search text", async () => {
    const f = fixture()
    const first = await f.call("previsit_begin", { query: "错别字", depth: "standard", requestId: "PV-20260911-TEST" })
    await f.call("previsit_query", { taskId: first.taskId, dimension: "entity_search" })
    const corrected = await f.call("previsit_begin", { query: "思必驰", depth: "standard", requestId: "PV-20260911-TEST" })
    expect(corrected).toMatchObject({ taskId: "PV-20260911-TEST", query: "思必驰", used: 1 })
    expect(f.approval).not.toHaveBeenCalled()
  })
  it("rejects a new budget grant while an earlier task is querying", async () => {
    const f = fixture(), taskId = await f.begin()
    let finish!: () => void
    f.dispatch.mockImplementationOnce(async () => {
      await new Promise<void>(resolve => { finish = resolve })
      return { isError: false, value: [company], content: [] }
    })
    const querying = f.call("previsit_query", { taskId, dimension: "entity_search" })
    await expect(f.begin()).rejects.toThrow("未完成操作")
    finish()
    await querying
    expect(f.approval).not.toHaveBeenCalled()
  })
  it("does not treat disconnected array scalars as a structured entity record", async () => {
    const f = fixture(), taskId = await f.begin()
    f.setReply([company.fullName, company.creditCode])
    await f.call("previsit_query", { taskId, dimension: "entity_search" })
    await expect(f.call("previsit_confirm_entity", { taskId, ...company })).rejects.toThrow("同一条")
    expect(f.approval).not.toHaveBeenCalled()
  })
  it("does not dispatch absent, ambiguous or schema-incompatible MCP tools", async () => {
    const f = fixture(), taskId = await f.begin()
    const schema = f.schemas()[0]!
    f.schemas.mockReturnValueOnce([]).mockReturnValueOnce([schema, schema]).mockReturnValueOnce([{ ...schema, parameters: { properties: { unsupported: {} } as never, required: ["unsupported"] } }])
    for (let i = 0; i < 3; i++) expect(await f.call("previsit_query", { taskId, dimension: "entity_search" })).toMatchObject({ outcome: "not-executed" })
    expect(f.dispatch).not.toHaveBeenCalled()
  })
  it("does not drill down without explicit nonzero counts, or query a guessed executive", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    expect(await f.call("previsit_query", { taskId, dimension: "dishonest" })).toMatchObject({ outcome: "not-executed" })
    f.setReply({ dishonest: 0 })
    await f.call("previsit_query", { taskId, dimension: "risk_scan" })
    expect(await f.call("previsit_query", { taskId, dimension: "dishonest" })).toMatchObject({ outcome: "skipped", reason: "风险扫描为 0，无需下钻" })
    const record = await f.workflow.get(taskId)
    expect(record?.runs.filter(run => run.status === "skipped")).toHaveLength(1)
    await expect(f.call("previsit_query", { taskId, dimension: "executive_risk", personName: "猜测姓名" })).rejects.toThrow("实际关键人员")
  })
  it("marks every zero-count risk detail and an unavailable executive scan as explicitly skipped", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    f.setReply(Object.fromEntries(["dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents"].map(key => [key, 0])))
    await f.call("previsit_query", { taskId, dimension: "risk_scan" })
    f.setReply([])
    await f.call("previsit_query", { taskId, dimension: "personnel" })
    const record = await f.workflow.get(taskId)
    expect(record?.runs.filter(run => run.status === "skipped").map(run => run.dimension)).toEqual([
      "dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents", "executive_risk",
    ])
    expect(record?.runs.filter(run => run.status === "skipped").every(run => run.quotaUsed === false)).toBe(true)
  })
  it("normalizes the production QCC risk-scan rows and string counts", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    const tools = [
      "get_dishonest_info", "get_judgment_debtor_info", "get_terminated_cases", "get_equity_freeze",
      "get_business_exception", "get_administrative_penalty", "get_tax_abnormal", "get_judicial_documents",
    ]
    f.setReply({
      "企业名称": company.fullName,
      "摘要": "已全量扫描 35 项风险因子：1 项有记录、34 项无记录。",
      "风险因子扫描": tools.map(tool => ({ "风险因子": tool, "条目数": tool === "get_judicial_documents" ? "35" : "0", "明细工具": tool })),
    })
    await expect(f.call("previsit_query", { taskId, dimension: "risk_scan" })).resolves.toMatchObject({ outcome: "done" })
    const record = await f.workflow.get(taskId)
    expect(record?.runs.filter(run => run.status === "skipped").map(run => run.dimension)).toEqual([
      "dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal",
    ])
    expect(record?.runs.find(run => run.dimension === "judicial_documents" && run.id.startsWith("previsit-pending-"))).toMatchObject({
      status: "not-executed", message: "风险扫描命中 35 条，等待明细下钻",
    })
  })
  it("marks non-empty QCC business objects green and explicit no-record responses green", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    f.setReply({ "企业名称": company.fullName, "摘要": "已完成企业画像查询", "行业": "软件和信息技术服务业" })
    await expect(f.call("previsit_query", { taskId, dimension: "profile" })).resolves.toMatchObject({ outcome: "done" })
    f.setReply({ "企业名称": company.fullName, "搜索结果": "已全量扫描该主体融资数据库，未发现任何记录。" })
    await expect(f.call("previsit_query", { taskId, dimension: "financing" })).resolves.toMatchObject({ outcome: "no-data" })
  })
  it("shows nonzero risk details and available executives as pending, then blocks finalization until queried", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    const counts = Object.fromEntries(["dishonest", "enforcement", "terminated_cases", "equity_freeze", "business_exception", "administrative_penalty", "tax_abnormal", "judicial_documents"].map(key => [key, key === "dishonest" ? 2 : 0]))
    f.setReply(counts)
    await f.call("previsit_query", { taskId, dimension: "risk_scan" })
    f.setReply([{ name: "张三", position: "董事" }])
    await f.call("previsit_query", { taskId, dimension: "personnel" })
    const pending = await f.workflow.get(taskId)
    expect(pending?.runs.find(run => run.dimension === "dishonest" && run.id.startsWith("previsit-pending-"))).toMatchObject({ status: "not-executed", message: "风险扫描命中 2 条，等待明细下钻" })
    expect(pending?.runs.find(run => run.dimension === "executive_risk" && run.id.startsWith("previsit-pending-"))).toMatchObject({ status: "not-executed", message: "已取得关键人员，等待董监高风险扫描" })
    const report = "# 访前尽调报告 · 合成甲公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((section, index) => `## ${index + 1}、${section}\n合成内容`).join("\n")
    await expect(f.call("previsit_finalize", { taskId, reportMarkdown: report })).rejects.toThrow("失信明细未闭环")
    f.setReply([{ id: "risk-1" }])
    await f.call("previsit_query", { taskId, dimension: "dishonest" })
    await expect(f.call("previsit_finalize", { taskId, reportMarkdown: report })).rejects.toThrow("董监高风险扫描未闭环")
    await f.call("previsit_query", { taskId, dimension: "executive_risk", personName: "张三" })
    await expect(f.call("previsit_finalize", { taskId, reportMarkdown: report })).resolves.toMatchObject({ status: "completed" })
  })
  it("aborts on unload, ignores late results and unregisters its tools", async () => {
    const f = fixture(), taskId = await f.begin()
    let finish!: () => void
    let started!: () => void
    const entered = new Promise<void>(resolve => { started = resolve })
    f.dispatch.mockImplementationOnce(async () => { started(); await new Promise<void>(resolve => { finish = resolve }); return { isError: false, content: [], value: company } })
    const running = f.call("previsit_query", { taskId, dimension: "entity_search" })
    await entered
    f.dispose()
    finish()
    await expect(running).rejects.toThrow()
    expect(f.definitions.size).toBe(0)
  })
  it("does not resurrect an executable QCC grant after Host tool restart", async () => {
    const f = fixture(), taskId = await f.begin()
    f.dispose()
    const resumed = fixture()
    await expect(resumed.call("previsit_query", { taskId, dimension: "profile" })).rejects.toThrow("重新开始任务")
    expect(resumed.dispatch).not.toHaveBeenCalled()
  })
  it("accepts key_personnel as a compatibility alias without an error or extra quota", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    const result = await f.call("previsit_query", { taskId, dimension: "key_personnel" })
    expect(result).toMatchObject({ dimension: "personnel", requestedDimension: "key_personnel", used: 2 })
    expect(f.dispatch).toHaveBeenLastCalledWith(expect.objectContaining({ name: "mcp__qcc_company__get_key_personnel" }))
  })
  it("finalizes only an eight-section report for the bound entity", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    const report = "# 访前尽调报告 · 合成甲公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map((section, index) => `## ${index + 1}、${section}\n合成内容`).join("\n")
    await expect(f.call("previsit_finalize", { taskId, reportMarkdown: "## 核心研判\n不完整" })).rejects.toThrow("完整报告")
    await expect(f.call("previsit_finalize", { taskId, reportMarkdown: report })).rejects.toThrow("证据核验未闭环")
    f.setReply({ data: [] })
    await f.call("previsit_query", { taskId, dimension: "risk_scan" })
    f.setReply([])
    await f.call("previsit_query", { taskId, dimension: "personnel" })
    await expect(f.call("previsit_finalize", { taskId, reportMarkdown: report })).resolves.toMatchObject({ taskId, status: "completed", used: 3, unlimited: true })
    const calls = f.dispatch.mock.calls.length
    await expect(f.call("previsit_query", { taskId, dimension: "profile" })).rejects.toThrow("任务已结束")
    expect(f.dispatch).toHaveBeenCalledTimes(calls)
  })
  it("forwards nested conclusion using the original ToolRuntime execution identity", async () => {
    const f = fixture(), taskId = await f.begin()
    f.dispatch.mockImplementationOnce(async () => ({ isError: false, value: [company], content: [], concludesTurn: true }))
    let concluded: unknown
    const execution = f.execution("previsit_query", { concludeTurn() { concluded = this } })
    await f.definitions.get("previsit_query")!.execute({ taskId, dimension: "entity_search" }, execution)
    expect(concluded).toBe(execution)
  })
})
