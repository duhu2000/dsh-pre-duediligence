import { buildPrevisitReportHtml } from "./report-export.js"
import { isPrevisitSession } from "./previsit-session.js"
import { normalizePrevisitRequestId, previsitVerificationClosure, validatePrevisitReport, type PrevisitTaskRecord, type PrevisitWorkflowStore } from "./previsit-workflow.js"

type RequestLike = AsyncIterable<Uint8Array> & {
  method?: string
  url?: string
  headers: Record<string, string | string[] | undefined>
}

type ResponseLike = {
  writeHead(status: number, headers?: Record<string, string>): void
  end(body?: string | Uint8Array): void
}

export type WebServer = {
  register(input: { kind: "prefix"; path: string; handler(req: RequestLike, res: ResponseLike): unknown }): () => void
}

function isTrusted(req: RequestLike): boolean {
  const fetchSite = String(req.headers["sec-fetch-site"] ?? "")
  if (fetchSite === "cross-site") return false
  const origin = req.headers.origin
  if (typeof origin === "string") {
    try {
      const parsed = new URL(origin)
      if (parsed.hostname !== "127.0.0.1" && parsed.hostname !== "localhost") return false
    } catch { return false }
  }
  return true
}

function writeJson(res: ResponseLike, status: number, payload: unknown): void {
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "cache-control": "no-store",
    "x-content-type-options": "nosniff",
    "referrer-policy": "no-referrer",
  })
  res.end(JSON.stringify(payload))
}

async function readJson(req: RequestLike): Promise<Record<string, unknown>> {
  const chunks: Uint8Array[] = []
  let size = 0
  for await (const chunk of req) {
    size += chunk.length
    if (size > 256_000) throw new Error("report payload too large")
    chunks.push(chunk)
  }
  const text = Buffer.concat(chunks).toString("utf8")
  const value = text === "" ? {} : JSON.parse(text)
  if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid JSON body")
  return value as Record<string, unknown>
}

function publicTask(task: PrevisitTaskRecord): Omit<PrevisitTaskRecord, "reportMarkdown"> & { reportReady: boolean } {
  const { reportMarkdown, ...record } = task
  return { ...record, reportReady: typeof reportMarkdown === "string" && reportMarkdown.length > 0 }
}

export function mountPrevisitWebRoutes(webServer: WebServer, workflow: PrevisitWorkflowStore): () => void {
  return webServer.register({
    kind: "prefix",
    path: "/previsit/api/tasks",
    async handler(req, res) {
      if (!isTrusted(req)) return writeJson(res, 403, { ok: false, code: "PREVISIT_UNTRUSTED", message: "untrusted origin" })
      try {
        const url = new URL(req.url ?? "/previsit/api/tasks", "http://127.0.0.1")
        const segments = url.pathname.split("/").filter(Boolean)
        const tasksIndex = segments.indexOf("tasks")
        const rest = tasksIndex === -1 ? [] : segments.slice(tasksIndex + 1)
        if (rest.length === 0) {
          if (req.method !== "GET") return writeJson(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET required" })
          const sessionId = url.searchParams.get("sessionId") ?? undefined
          if (sessionId !== undefined && !isPrevisitSession(sessionId)) return writeJson(res, 400, { ok: false, code: "PREVISIT_SESSION", message: "invalid previsit session" })
          const tasks = await workflow.list(sessionId)
          return writeJson(res, 200, { ok: true, marker: "previsit-workflow-v1", tasks: tasks.map(publicTask) })
        }
        const taskId = decodeURIComponent(rest[0] ?? "")
        if (normalizePrevisitRequestId(taskId) === undefined && !/^PVT-[a-f0-9-]{36}$/i.test(taskId)) {
          return writeJson(res, 400, { ok: false, code: "PREVISIT_TASK_ID", message: "invalid task id" })
        }
        const task = await workflow.get(taskId)
        if (task === undefined) return writeJson(res, 404, { ok: false, code: "PREVISIT_NOT_FOUND", message: "task not found" })
        const sessionId = url.searchParams.get("sessionId")
        if (sessionId === null || !isPrevisitSession(sessionId) || sessionId !== task.sessionId) {
          return writeJson(res, 403, { ok: false, code: "PREVISIT_TASK_SCOPE", message: "task does not belong to this session" })
        }
        if (rest.length === 1) {
          if (req.method !== "GET") return writeJson(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET required" })
          return writeJson(res, 200, {
            ok: true,
            marker: "previsit-workflow-v1",
            task: { ...publicTask(task), ...(task.reportMarkdown === undefined ? {} : { reportMarkdown: task.reportMarkdown }) },
          })
        }
        if (rest.length === 2 && rest[1] === "report") {
          if (req.method === "PUT") {
            const payload = await readJson(req)
            if (typeof payload.reportMarkdown !== "string") return writeJson(res, 400, { ok: false, code: "PREVISIT_REPORT", message: "reportMarkdown required" })
            const reportMarkdown = validatePrevisitReport(payload.reportMarkdown, task.entity?.fullName)
            const closure = previsitVerificationClosure(task)
            if (closure.gaps.length > 0) {
              return writeJson(res, 409, {
                ok: false,
                code: "PREVISIT_VERIFICATION_INCOMPLETE",
                message: `证据核验未闭环：${closure.gaps.join("；")}`,
              })
            }
            const status = payload.status === "partial" || closure.partialRequired ? "partial" : "completed"
            const completed = await workflow.finalize(task.id, reportMarkdown, status)
            return writeJson(res, 200, { ok: true, marker: "previsit-workflow-v1", task: { ...publicTask(completed), reportMarkdown: completed.reportMarkdown } })
          }
          if (req.method !== "GET") return writeJson(res, 405, { ok: false, code: "PREVISIT_METHOD", message: "GET or PUT required" })
          if (task.reportMarkdown === undefined || task.artifact === undefined) {
            return writeJson(res, 409, { ok: false, code: "PREVISIT_REPORT_PENDING", message: "report not ready" })
          }
          const html = buildPrevisitReportHtml(task.reportMarkdown, {
            ...(task.entity?.fullName === undefined ? {} : { company: task.entity.fullName }),
            ...(task.completedAt === undefined ? {} : { generatedAt: task.completedAt.slice(0, 10) }),
          })
          const ascii = task.artifact.fileName.replace(/[^\x20-\x7e]/g, "_").replace(/["\\]/g, "_")
          res.writeHead(200, {
            "content-type": task.artifact.mediaType,
            "content-disposition": `attachment; filename="${ascii}"; filename*=UTF-8''${encodeURIComponent(task.artifact.fileName)}`,
            "cache-control": "no-store",
            "x-content-type-options": "nosniff",
            "referrer-policy": "no-referrer",
          })
          return res.end(html)
        }
        return writeJson(res, 404, { ok: false, code: "PREVISIT_ROUTE", message: "route not found" })
      } catch (error) {
        return writeJson(res, 500, { ok: false, code: "PREVISIT_HOST", message: error instanceof Error ? error.message : String(error) })
      }
    },
  })
}
