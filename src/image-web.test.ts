import { afterEach, describe, expect, it } from "vitest"

import { ImageIntakeStore } from "./image-intake.js"
import { mountImageRoutes } from "./image-web.js"

const sessionId = "session-dsh-pre-duediligence-12345678-1234-4234-8234-123456789abc"
const otherSessionId = "session-dsh-pre-duediligence-87654321-4321-4321-8321-cba987654321"
const png = Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), Buffer.alloc(32)]).toString("base64")
const stores: ImageIntakeStore[] = []
afterEach(async () => { await Promise.all(stores.splice(0).map(store => store.dispose())) })

function fixture() {
  const store = new ImageIntakeStore({ schemas: () => [], execute: async () => ({ isError: false, content: [] }) })
  stores.push(store)
  type Server = Parameters<typeof mountImageRoutes>[0]
  let handler!: Parameters<Server["register"]>[0]["handler"]
  mountImageRoutes({ register(route) { handler = route.handler; return () => {} } }, store)
  return async (suffix = "", method = "POST", scope = sessionId, body = JSON.stringify({ fileName: "名单.png", content: png }), headers: Record<string, string> = {}) => {
    let status = 0
    let payload = ""
    await handler({ method, url: `/previsit/api/images/commands${suffix}?sessionId=${encodeURIComponent(scope)}`, headers: { host: "localhost:1988", ...headers }, async *[Symbol.asyncIterator]() { yield Buffer.from(body) } }, {
      writeHead(code) { status = code }, end(value) { payload = value },
    })
    return { status, body: JSON.parse(payload) }
  }
}

describe("图片暂存 HTTP 路由", () => {
  it("凭证可读取、移除且限于来源会话，不暴露 Host 临时路径", async () => {
    const call = fixture()
    const created = await call()
    expect(created.status).toBe(201)
    expect(created.body.command).not.toHaveProperty("path")
    expect(created.body.command.prompt).toContain(created.body.command.commandId)
    const suffix = `/${created.body.command.commandId}`
    expect((await call(suffix, "GET")).body.command.state).toBe("prepared")
    expect((await call(suffix, "GET", otherSessionId)).status).toBe(404)
    expect((await call(suffix, "DELETE", otherSessionId)).status).toBe(404)
    expect((await call(suffix, "DELETE")).body.removed).toBe(true)
    expect((await call(suffix, "GET")).status).toBe(404)
  })

  it("拒绝缺失会话、坏 JSON、跨源请求和同机不同端口来源", async () => {
    const call = fixture()
    expect((await call("", "POST", "ordinary")).status).toBe(400)
    expect((await call("", "POST", sessionId, "null")).status).toBe(400)
    expect((await call("", "POST", sessionId, "[")).status).toBe(400)
    expect((await call("", "POST", sessionId, "{}", { origin: "http://localhost:9999" })).status).toBe(403)
    expect((await call("", "POST", sessionId, "{}", { "sec-fetch-site": "cross-site" })).status).toBe(403)
    expect((await call("", "POST", sessionId, JSON.stringify({ content: png }), { origin: "http://localhost:1988" })).status).toBe(201)
  })
})
