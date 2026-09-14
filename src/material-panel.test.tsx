import { it, expect } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"
import { MaterialPanel } from "./material-panel.js"
import { PrevisitWorkflowStore } from "./previsit-workflow.js"
it("renders supplied HTML as inert text and distinguishes unverified evidence", async () => {
  const store = new PrevisitWorkflowStore()
  let task = await store.create({query:"合成",sessionId:"x",workspace:"/test",depth:"fast"})
  task = await store.confirmEntity(task.id,{fullName:"合成",creditCode:"913200000000000001"})
  task = await store.addEvidence(task.id,"material",{kind:"file",title:"合成",locator:"example.txt",sourceDate:"未知",text:"<script>alert(1)</script>"})
  const html = renderToStaticMarkup(<MaterialPanel task={task} />)
  expect(html).not.toContain("<script>")
  expect(html).toContain("&lt;script&gt;")
  expect(html).toContain("不代表已通过双源核验")
})
