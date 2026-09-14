import { ImageIntakeError, imageExtractionPrompt, type ImageIntakeStore, type StagedImage } from "./image-intake.js"
import { isPrevisitSession } from "./previsit-session.js"

function publicCommand(command: StagedImage): Omit<StagedImage, "path"> {
  const { path: _path, ...record } = command
  return record
}

type WebRequest = { method?: string; url?: string; headers: Record<string, string | string[] | undefined>; [Symbol.asyncIterator](): AsyncIterator<Uint8Array> }
type WebResponse = { writeHead(status: number, headers: Record<string, string>): void; end(body: string): void }
type ImageWebServer = { register(route: { kind: "prefix"; path: string; handler: (req: WebRequest, res: WebResponse) => void | Promise<void> }): () => void }
const IMAGE_ROUTE = "/previsit/api/images/commands"
const MAX_BODY = 12 * 1024 * 1024

function trusted(req: WebRequest): boolean {
  if (String(req.headers["sec-fetch-site"] ?? "") === "cross-site") return false
  const origin = req.headers.origin
  if (typeof origin !== "string" || origin === "") return true
  try { const parsed = new URL(origin); return (parsed.protocol === "http:" || parsed.protocol === "https:") && parsed.host === req.headers.host } catch { return false }
}
function writeJson(res: WebResponse, status: number, payload: unknown): void {
  res.writeHead(status, { "content-type": "application/json; charset=utf-8", "cache-control": "no-store", "x-content-type-options": "nosniff" })
  res.end(JSON.stringify(payload))
}
async function readBody(req: WebRequest): Promise<string> {
  const chunks: Uint8Array[] = []
  let total = 0
  for await (const chunk of req) {
    total += chunk.length
    if (total > MAX_BODY) throw new ImageIntakeError("PV_IMAGE_TOO_LARGE", "请求体过大。", 413)
    chunks.push(chunk)
  }
  return Buffer.concat(chunks).toString("utf8")
}

/** 图片暂存路由：POST 暂存（返回凭证与回填说明）、GET 状态、DELETE 移除。只接受本机来源。 */
export function mountImageRoutes(server: ImageWebServer, images: ImageIntakeStore): () => void {
  return server.register({ kind: "prefix", path: IMAGE_ROUTE, async handler(req, res) {
    if (!trusted(req)) return writeJson(res, 403, { ok: false, code: "PV_UNTRUSTED", message: "untrusted origin" })
    try {
      const url = new URL(req.url ?? IMAGE_ROUTE, "http://127.0.0.1")
      const pathname = url.pathname
      const sessionId = url.searchParams.get("sessionId") ?? ""
      if (!isPrevisitSession(sessionId)) return writeJson(res, 400, { ok: false, code: "PV_IMAGE_SESSION", message: "请选择访前尽调会话。" })
      const rest = pathname.slice(IMAGE_ROUTE.length).split("/").filter(Boolean)
      if (rest.length === 0 && req.method === "POST") {
        const payload = JSON.parse(await readBody(req)) as { fileName?: unknown; content?: unknown }
        if (payload === null || typeof payload !== "object" || Array.isArray(payload)) throw new SyntaxError("invalid JSON body")
        const command = await images.prepare({ ...payload, sessionId })
        return writeJson(res, 201, { ok: true, command: { ...publicCommand(command), prompt: imageExtractionPrompt(command) } })
      }
      const id = rest[0]
      if (rest.length === 1 && id !== undefined && req.method === "GET") return writeJson(res, 200, { ok: true, command: publicCommand(images.status(decodeURIComponent(id), sessionId)) })
      if (rest.length === 1 && id !== undefined && req.method === "DELETE") return writeJson(res, 200, { ok: true, removed: await images.remove(decodeURIComponent(id), sessionId) })
      return writeJson(res, 405, { ok: false, code: "PV_METHOD", message: "POST a command, GET its status, or DELETE it." })
    } catch (error) {
      if (error instanceof SyntaxError) return writeJson(res, 400, { ok: false, code: "PV_BAD_JSON", message: "Request body must be valid JSON." })
      if (error instanceof ImageIntakeError) return writeJson(res, error.status, { ok: false, code: error.code, message: error.message })
      return writeJson(res, 500, { ok: false, code: "PV_IMAGE_INTERNAL", message: error instanceof Error ? error.message : String(error) })
    }
  } })
}
