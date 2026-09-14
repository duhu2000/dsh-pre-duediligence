import { flushSync } from "react-dom"
import { createRoot } from "react-dom/client"
import { PlanCard } from "../src/plan-card.js"
import { REPORT_SECTIONS } from "../src/previsit-task.js"

const check = (condition: boolean, message: string) => { if (!condition) throw new Error(message) }

/** Exercise product plan selection with real React at each layout viewport. */
export async function verifyProductPlan(): Promise<void> {
  const mount = document.createElement("section")
  mount.className = "qccPwShell"
  mount.style.cssText = "width:min(520px,100%);position:relative"
  document.body.append(mount)
  const root = createRoot(mount)
  const plan = {
    id: "6fe5c1c3-75c6-49b7-9ba4-d353b31d387c",
    candidates: ["合成甲公司", "用于验证窄屏企业全称与来源换行的合成乙公司", "合成丙公司"].map(name => ({ name, source: "来自用户导入的合成展会名单图片第 1 项" })),
    note: "合成计划", createdAt: undefined, index: 0, taskIds: [],
  }
  const messages: string[] = []
  let finish!: () => void
  const pending = new Promise<void>(resolve => { finish = resolve })
  try {
    flushSync(() => root.render(<PlanCard plan={plan} onConfirm={async message => { messages.push(message); await pending }} />))
    const candidates = mount.querySelectorAll<HTMLInputElement>(".qccPlanCandidates input")
    check(candidates.length === 3, "plan candidates missing")
    flushSync(() => candidates[2]?.click())
    const output = [...mount.querySelectorAll<HTMLButtonElement>(".qccPlanChip")].find(button => button.textContent === "提问清单为主")
    flushSync(() => output?.click())
    check(mount.querySelectorAll(".qccPlanSections input:checked").length === 4, "report framework did not update emphasis")
    check(mount.textContent?.includes("最终报告保留完整八段") === true, "report completion contract missing")
    const elements = mount.querySelectorAll<HTMLElement>(".qccPlanCandidates label, .qccPlanSections label, .qccPlanActions button")
    check([...elements].every(element => element.getBoundingClientRect().right <= innerWidth + 0.5), "plan controls overflow viewport")
    const confirm = mount.querySelector<HTMLButtonElement>(".qccPwPrimary")!
    flushSync(() => { confirm.click(); confirm.click() })
    check(messages.length === 1, "double click submitted a duplicate plan")
    check(messages[0]?.includes(`确认尽调计划 ${plan.id}`) === true, "full plan ID missing")
    check(messages[0]?.includes("entities=2") === true && !messages[0]?.includes("合成丙公司"), "company selection not submitted")
    check(messages[0]?.includes("不设插件调用次数上限") === true, "old quota cap reintroduced")
    check(REPORT_SECTIONS.length === 8, "report schema changed")
    finish()
    await pending
    await Promise.resolve()
    flushSync(() => {})
    document.body.dataset.productPlan = "true"
  } finally { finish?.(); flushSync(() => root.unmount()); mount.remove() }
}
