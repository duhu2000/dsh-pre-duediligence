import { afterEach, describe, expect, it, vi } from "vitest"
import { readFile } from "node:fs/promises"
import { ImageIntakeStore, extractCompanyNames, imageExtractionPrompt } from "./image-intake.js"
import { QUERY_ROUTES, registerPrevisitTools, type ToolHost } from "./previsit-tools.js"

const stores: ImageIntakeStore[] = []
afterEach(async () => { await Promise.all(stores.splice(0).map(store => store.dispose())) })

const PNG = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32, 1)]).toString("base64")
const agent = { id: "agent-a", session: { id: "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc", header: { cwd: "/synthetic" } } }
const ocr = ["| 序号 | 企业名称 |", "| 1 | 苏州科达科技股份有限公司 |", "2. 江苏博众精工科技股份有限公司  无锡先导智能装备股份有限公司", "联系人：张三 13800000000", "企业名称：苏州科达科技股份有限公司"].join("\n")

function host(parseReply: (args: unknown) => unknown, resultReply?: () => unknown) {
  const schemas = vi.fn(() => [
    { name: "mcp__qcc-document-mcp__parse_document", parameters: { properties: { file_path: {}, file_url: {}, wait: {} } } },
    { name: "mcp__qcc-document-mcp__get_parse_result", parameters: { properties: { task_id: {} } } },
    { name: "mcp__qcc-document__parse_document", parameters: { properties: { file_url: {} } } },
    ...Object.values(QUERY_ROUTES).map(([server, tool]) => ({ name: `mcp__${server}__${tool}`, parameters: { properties: { searchKey: {} }, required: ["searchKey"] } })),
  ])
  const execute = vi.fn(async (input: { name: string; arguments: unknown }) => ({ isError: false, content: [], value: input.name.endsWith("get_parse_result") ? resultReply?.() : parseReply(input.arguments) }))
  return { schemas, execute }
}

describe("图片名单接入", () => {
  it("从识别文字里抽企业名：跳过表头与联系人，去重", () => {
    expect(extractCompanyNames(ocr)).toEqual(["苏州科达科技股份有限公司", "江苏博众精工科技股份有限公司", "无锡先导智能装备股份有限公司"])
  })
  it("暂存 → 本机文档解析（含轮询）→ 抽名 → 删除临时文件", async () => {
    let polls = 0
    const tools = host(args => { expect((args as { file_path: string }).file_path).toMatch(/pvi-.*\.png$/); return { task_id: "T1", status: "processing" } }, () => (++polls < 2 ? { status: "processing" } : { status: "success", details: [{ result_md: ocr }] }))
    const store = new ImageIntakeStore(tools, () => Date.now(), 1)
    stores.push(store)
    const staged = await store.prepare({ sessionId: agent.session.id, fileName: "展会/名单.png", content: `data:image/png;base64,${PNG}` })
    expect(staged.commandId).toMatch(/^pvi-/)
    expect(staged.fileName).toBe("展会_名单.png")
    const path = staged.path!
    await expect(readFile(path)).resolves.toBeInstanceOf(Buffer)
    const out = await store.run(staged.commandId, { agent, rootCallId: "root", token: {}, signal: new AbortController().signal })
    expect(out.entries).toHaveLength(3)
    expect(tools.execute).toHaveBeenCalledTimes(3)
    expect(tools.execute.mock.calls[0]![0]).toMatchObject({ name: "mcp__qcc-document-mcp__parse_document", parent: expect.anything(), agent })
    await expect(readFile(path)).rejects.toThrow()
    expect(store.status(staged.commandId, agent.session.id).state).toBe("completed")
    expect(imageExtractionPrompt(staged)).toContain(staged.commandId)
  })
  it("只连了远端 qcc-document（file_url）时明确拒绝，不发起调用；坏图片与过大图片在暂存时拒绝", async () => {
    const tools = host(() => ({}))
    tools.schemas.mockReturnValue([{ name: "mcp__qcc-document__parse_document", parameters: { properties: { file_url: {} } } }])
    const store = new ImageIntakeStore(tools)
    stores.push(store)
    const staged = await store.prepare({ sessionId: agent.session.id, fileName: "a.png", content: PNG })
    await expect(store.run(staged.commandId, { agent, rootCallId: "root", token: {}, signal: new AbortController().signal })).rejects.toThrow("本机")
    expect(tools.execute).not.toHaveBeenCalled()
    expect(store.status(staged.commandId, agent.session.id)).toMatchObject({ state: "failed", error: { code: "PV_IMAGE_PROVIDER_UNAVAILABLE" } })
    await expect(readFile(staged.path!)).resolves.toBeInstanceOf(Buffer) // 连接器配好后可直接重试
    await expect(store.prepare({ sessionId: agent.session.id, content: Buffer.from("not an image").toString("base64") })).rejects.toThrow("仅支持")
    await expect(store.prepare({ sessionId: agent.session.id, content: Buffer.alloc(9 * 1024 * 1024).toString("base64") })).rejects.toThrow("8 MiB")
  })
  it("解析失败状态可见，原凭证在有效期内可以重试", async () => {
    let attempts = 0
    const tools = host(() => ++attempts === 1 ? { status: "failed" } : { status: "success", result_md: ocr })
    const store = new ImageIntakeStore(tools)
    stores.push(store)
    const staged = await store.prepare({ sessionId: agent.session.id, content: PNG })
    const exec = { agent, rootCallId: "root", token: {}, signal: new AbortController().signal }
    await expect(store.run(staged.commandId, exec)).rejects.toThrow("失败")
    expect(store.status(staged.commandId, agent.session.id).state).toBe("failed")
    await expect(store.run(staged.commandId, exec)).resolves.toMatchObject({ entries: expect.arrayContaining(["苏州科达科技股份有限公司"]) })
    await expect(readFile(staged.path!)).rejects.toThrow()
  })
  it("宿主工具 previsit_extract_image_companies 识别后直接登记计划", async () => {
    const tools = host(() => ({ status: "success", details: [{ result_md: ocr }] }))
    const definitions = new Map<string, { execute(args: unknown, exec: unknown): Promise<unknown> }>()
    const ctx: ToolHost = {
      get: () => ({ request: async () => "allowed-once" }),
      tools: { register: d => { definitions.set(d.name, d as never); return () => { definitions.delete(d.name) } }, guard: () => () => {}, schemas: tools.schemas as never, execute: tools.execute as never },
    }
    const store = new ImageIntakeStore(tools)
    registerPrevisitTools(ctx, undefined, { images: store })
    stores.push(store)
    const staged = await store.prepare({ sessionId: agent.session.id, fileName: "名单.png", content: PNG })
    const exec = { agent, name: "previsit_extract_image_companies", arguments: {}, callId: "c", rootCallId: "root", token: {}, signal: new AbortController().signal }
    const value = await definitions.get("previsit_extract_image_companies")!.execute({ commandId: staged.commandId }, exec) as Record<string, unknown>
    expect(value).toMatchObject({ status: "awaiting-selection", entries: expect.arrayContaining(["苏州科达科技股份有限公司"]) })
    expect(typeof value.planId).toBe("string")
    const repeated = await definitions.get("previsit_extract_image_companies")!.execute({ commandId: staged.commandId }, exec) as Record<string, unknown>
    expect(repeated.planId).toBe(value.planId)
    expect(tools.execute).toHaveBeenCalledOnce()
    expect((value.candidates as Array<{ name: string; source: string }>)[0]).toEqual({ name: "苏州科达科技股份有限公司", source: "图片「名单.png」第 1 项" })
    // 计划可直接用于 previsit_begin
    const begun = await definitions.get("previsit_begin")!.execute({ query: "苏州科达科技股份有限公司", depth: "fast", planId: value.planId, entities: 1 }, exec) as Record<string, unknown>
    expect(begun.planId).toBe(value.planId)
    const missing = await definitions.get("previsit_extract_image_companies")!.execute({ commandId: "pvi-missing" }, exec) as Record<string, unknown>
    expect(missing).toMatchObject({ status: "failed", code: "PV_IMAGE_NOT_FOUND" })
  })
  it("拒绝跨会话凭证与过期识别，过期文件随清理移除", async () => {
    let now = Date.now()
    const tools = host(() => ({ status: "success", result_md: ocr }))
    const store = new ImageIntakeStore(tools, () => now)
    stores.push(store)
    const staged = await store.prepare({ sessionId: agent.session.id, content: PNG })
    const other = { ...agent, session: { id: "session-dsh-pre-duediligence-87654321-4321-4321-8321-cba987654321" } }
    expect(() => store.status(staged.commandId, other.session.id)).toThrow("不存在")
    await expect(store.remove(staged.commandId, other.session.id)).rejects.toThrow("不属于")
    await expect(store.run(staged.commandId, { agent: other, rootCallId: "root", token: {}, signal: new AbortController().signal })).rejects.toThrow("不存在")
    now += 16 * 60_000
    await expect(store.run(staged.commandId, { agent, rootCallId: "root", token: {}, signal: new AbortController().signal })).rejects.toThrow("过期")
    await store.prepare({ sessionId: agent.session.id, content: PNG })
    await expect(readFile(staged.path!)).rejects.toThrow()
    expect(tools.execute).not.toHaveBeenCalled()
  })
})
