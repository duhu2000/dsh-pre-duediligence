export function processingStatus(input: { running: boolean | undefined; error: string | undefined; waiting: boolean; querying: boolean; secondsSinceResult: number }) {
  if (input.error) return { busy: false, title: "状态同步异常", detail: "暂时无法确认任务进展，请查看会话或连接状态。" }
  if (input.waiting) return { busy: false, title: "等待主体确认 / 继续", detail: "请在会话中确认企业后继续。" }
  if (input.running === false) return { busy: false, title: "本轮会话已停止，任务尚未完成", detail: "请查看会话中的确认请求、停止或错误提示。" }
  if (input.querying) return { busy: input.running === true, title: input.running === true ? "正在查询资料" : "查询结果待更新", detail: "尚未收到该查询的完成记录，结果返回后自动更新。" }
  return { busy: input.running === true, title: input.running === true ? "宿主显示仍在处理 · 正在分析 / 整理材料" : "等待下一次任务更新", detail: `距最近任务结果 ${Math.max(0, Math.floor(input.secondsSinceResult))} 秒。${input.secondsSinceResult >= 120 ? "等待时间较长，可检查会话运行状态；请勿重复启动任务。" : "分析阶段可能暂时没有新的工具结果。"} 不提供虚构百分比或内部思考内容。` }
}
