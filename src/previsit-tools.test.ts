import { describe, expect, it, vi } from "vitest"
import { QUERY_ROUTES, registerPrevisitTools, type ToolHost } from "./previsit-tools.js"

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
  const dispose = registerPrevisitTools(ctx)
  const execution = (name: string, extra: Partial<Execution> = {}): Execution => ({ agent, name, arguments: {}, callId: "outer", rootCallId: "root", token: {}, signal: new AbortController().signal, ...extra })
  const call = (name: string, args: object, extra: Partial<Execution> = {}) => definitions.get(name)!.execute(args, execution(name, extra)) as Promise<Record<string, unknown>>
  const begin = async () => (await call("previsit_begin", { query: "合成公司", depth: "fast" })).taskId as string
  const anchor = async (taskId: string) => {
    await call("previsit_query", { taskId, dimension: "entity_search" })
    await call("previsit_confirm_entity", { taskId, ...company })
  }
  return { agent, ctx, call, begin, anchor, execution, guard: (exec: Execution) => guard(exec), approval, dispatch, schemas, dispose, definitions, setReply: (value: unknown) => { reply = value } }
}

describe("Agent-owned paid-query boundary", () => {
  it("requires real approval and never accepts model-declared consent", async () => {
    const f = fixture()
    f.approval.mockResolvedValue("rejected")
    await expect(f.begin()).rejects.toThrow("未确认")
    expect(f.dispatch).not.toHaveBeenCalled()
    await expect(f.call("previsit_begin", { query: "x", depth: "fast", confirmed: true }, { agent: { ...f.agent, session: { id: "ordinary" } } })).rejects.toThrow("专属会话")
  })
  it("does not select the first candidate; confirms a matching name/code pair with the human", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.call("previsit_query", { taskId, dimension: "entity_search" })
    await expect(f.call("previsit_query", { taskId, dimension: "profile" })).rejects.toThrow("确认唯一")
    await expect(f.call("previsit_confirm_entity", { taskId, fullName: company.fullName, creditCode: companyB.creditCode })).rejects.toThrow("同一条")
    f.approval.mockResolvedValueOnce("rejected")
    await expect(f.call("previsit_confirm_entity", { taskId, ...companyB })).rejects.toThrow("未确认")
    await f.call("previsit_confirm_entity", { taskId, ...companyB })
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
  it("enforces budget before dispatch, including search and failed retries", async () => {
    const f = fixture(), taskId = await f.begin()
    await f.anchor(taskId)
    f.dispatch.mockResolvedValue({ isError: true, value: { code: 403 }, content: [] })
    for (let i = 0; i < 7; i++) await f.call("previsit_query", { taskId, dimension: "profile" })
    expect(await f.call("previsit_query", { taskId, dimension: "profile" })).toMatchObject({ outcome: "not-executed", reason: "调用预算已用完" })
    expect(f.dispatch).toHaveBeenCalledTimes(8)
  })
  it("serializes pending begin approval against another begin and the prior task", async () => {
    const f = fixture(), previousTask = await f.begin()
    let finish!: (decision: string) => void
    f.approval.mockImplementationOnce(async () => new Promise<string>(resolve => { finish = resolve }))
    const beginning = f.begin()
    await expect(f.begin()).rejects.toThrow("未完成操作")
    await expect(f.call("previsit_query", { taskId: previousTask, dimension: "entity_search" })).rejects.toThrow("等待确认")
    expect(f.dispatch).not.toHaveBeenCalled()
    finish("rejected")
    await expect(beginning).rejects.toThrow("未确认")
    await f.call("previsit_query", { taskId: previousTask, dimension: "entity_search" })
    expect(f.dispatch).toHaveBeenCalledTimes(1)
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
    expect(f.approval).toHaveBeenCalledTimes(1)
  })
  it("does not treat disconnected array scalars as a structured entity record", async () => {
    const f = fixture(), taskId = await f.begin()
    f.setReply([company.fullName, company.creditCode])
    await f.call("previsit_query", { taskId, dimension: "entity_search" })
    await expect(f.call("previsit_confirm_entity", { taskId, ...company })).rejects.toThrow("同一条")
    expect(f.approval).toHaveBeenCalledTimes(1)
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
    expect(await f.call("previsit_query", { taskId, dimension: "dishonest" })).toMatchObject({ outcome: "not-executed", reason: "扫描返回零记录，不下钻" })
    await expect(f.call("previsit_query", { taskId, dimension: "executive_risk", personName: "猜测姓名" })).rejects.toThrow("实际关键人员")
  })
  it("aborts on unload, ignores late results and unregisters its tools", async () => {
    const f = fixture(), taskId = await f.begin()
    let finish!: () => void
    f.dispatch.mockImplementationOnce(async () => { await new Promise<void>(resolve => { finish = resolve }); return { isError: false, content: [], value: company } })
    const running = f.call("previsit_query", { taskId, dimension: "entity_search" })
    f.dispose()
    finish()
    await expect(running).rejects.toThrow()
    expect(f.definitions.size).toBe(0)
  })
  it("requires new approval after restart instead of resurrecting a paid grant", async () => {
    const f = fixture(), taskId = await f.begin()
    f.dispose()
    const resumed = fixture()
    await expect(resumed.call("previsit_query", { taskId, dimension: "profile" })).rejects.toThrow("重启后")
    expect(resumed.dispatch).not.toHaveBeenCalled()
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
