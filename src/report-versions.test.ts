import { describe, expect, it } from "vitest"
import { PrevisitWorkflowStore, previsitVerificationClosure } from "./previsit-workflow.js"

const report = "# 合成公司股份有限公司\n" + ["核心研判", "产业定位", "近期动态", "业务假设", "红线提示", "现场必问", "触达开场", "覆盖说明"].map(x => `## ${x}\n本次合成资料与未知项，不代表真实公司事实。`).join("\n")
async function fixture() {
  const store = new PrevisitWorkflowStore()
  let base = await store.create({ id: "PV-20260914-BASE", sessionId: "session-a", workspace: "/test", query: "合成公司", depth: "fast" })
  base = await store.confirmEntity(base.id, { fullName: "合成公司股份有限公司", creditCode: "913200000000000001" })
  base = await store.finalize(base.id, report, "completed")
  return { store, base, input: { parentTaskId: base.id, requestId: "PV-20260914-NEXT", sessionId: "session-b", workspace: "/test", intent: "补充经营数据" } }
}
describe("immutable report versions", () => {
  it("continues across sessions in one workspace without modifying the baseline", async () => {
    const {store, base, input} = await fixture()
    const child = await store.continueFrom(input)
    expect(child).toMatchObject({ parentTaskId: base.id, rootTaskId: base.id, reportVersion: 2, used: 0, runs: [], entity: base.entity, state: "entity-confirmed" })
    expect(child.reportMarkdown).toBeUndefined()
    expect(await store.get(base.id)).toEqual(base)
    expect(await store.continueFrom(input)).toEqual(child)
    expect(previsitVerificationClosure(child)).toEqual({ gaps: [], partialRequired: true })
    const finished = await store.finalize(child.id, report + "\n补充经营分析。", "partial")
    expect(finished.artifact?.fileName).toContain("_V2_")
    expect(await store.get(base.id)).toEqual(base)
    await expect(store.finalize(base.id, report + "篡改", "completed")).rejects.toThrow("不可覆盖")
  })
  it("allocates distinct versions for concurrent branches and rejects conflicting retries", async () => {
    const {store, input} = await fixture()
    const [a,b] = await Promise.all([store.continueFrom(input), store.continueFrom({...input, requestId: "PV-20260914-FORK"})])
    expect([a.reportVersion,b.reportVersion]).toEqual([2,3])
    await expect(store.continueFrom({...input, intent: "不同要求"})).rejects.toThrow("冲突")
    await expect(store.continueFrom({...input, workspace: "/other"})).rejects.toThrow("原工作区")
    await expect(store.continueFrom({...input, parentTaskId: a.id, requestId: "PV-20260914-BAD1"})).rejects.toThrow("已保存报告")
  })
  it("never overwrites one version through concurrent finalization and gates fresh risk work", async () => {
    const {store, input} = await fixture()
    const child = await store.continueFrom(input)
    const running = await store.startRun(child.id, {runId:"risk-new",dimension:"risk_scan",quotaUsed:true})
    expect(previsitVerificationClosure(running).gaps).toContain("风险扫描未完成")
    const [first,second] = await Promise.allSettled([store.finalize(child.id, report, "partial"),store.finalize(child.id,report+"\n不同结论", "partial")])
    expect(first.status).toBe("fulfilled")
    expect(second.status).toBe("rejected")
    expect((await store.get(child.id))?.reportMarkdown).toBe(report)
  })
  it("persists the series and preserves the original entity after restart", async () => {
    const values = new Map<string, unknown>()
    const domain = {open: async () => ({table: () => ({get:(id:string)=>values.get(id),put:(id:string,v:unknown)=>{values.set(id,v)},entries:()=>values.entries()})})}
    const {store, base, input} = await fixture()
    await store.attach(domain)
    const child = await store.continueFrom(input)
    const restored = new PrevisitWorkflowStore(); await restored.attach(domain)
    expect(await restored.get(child.id)).toEqual(child)
    expect(await restored.get(base.id)).toEqual(base)
  })
})
