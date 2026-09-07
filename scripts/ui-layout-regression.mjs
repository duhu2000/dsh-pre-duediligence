// 真实 React + 隔离宿主 DOM + 本机 Headless Chrome；不连接 DSH 或企查查服务。
import assert from "node:assert/strict"
import { spawnSync } from "node:child_process"
import { existsSync } from "node:fs"
import { mkdir, readFile, rm, writeFile } from "node:fs/promises"
import { resolve } from "node:path"

import { build } from "esbuild"

const chrome = process.env.PREVISIT_CHROME || ["/Applications/Google Chrome.app/Contents/MacOS/Google Chrome", "/usr/bin/google-chrome", "/usr/bin/chromium", "/usr/bin/chromium-browser"].find(existsSync)
assert.ok(chrome, "Chrome not found; set PREVISIT_CHROME to an installed Chrome/Chromium executable")
const output = resolve("_scratch/ui-layout")
await rm(output, { recursive: true, force: true })
await mkdir(output, { recursive: true })
await build({
  entryPoints: ["scripts/ui-fixture.tsx"],
  outfile: resolve(output, "fixture.js"),
  bundle: true,
  format: "iife",
  platform: "browser",
  target: "es2022",
  loader: { ".woff2": "dataurl", ".woff": "dataurl", ".ttf": "dataurl" },
})
await writeFile(resolve(output, "index.html"), `<!doctype html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<style>
*{box-sizing:border-box}html,body,#app{margin:0;min-height:100%;font:14px system-ui}
body{background:#eef2f6;color:#202c3b}.fixtureLayout{display:grid;grid-template-columns:190px minmax(440px,1fr) minmax(520px,42vw);min-height:100vh}
.fixtureSidebar{padding:18px 12px;border-right:1px solid #dce4ec;background:#fff}.fixtureSidebar button{display:flex;align-items:center;gap:9px;width:100%;padding:10px;border:0;border-radius:9px;background:#e6f4ff;color:#0875d1}
.fixtureConversation{min-width:0;padding:40px 20px}.fixtureHeroRow{display:flex;align-items:center;justify-content:center;gap:10px;margin:10px 0 12px}.fixture_headlineText{font-size:25px;font-weight:650}.fixtureHeader{display:flex;justify-content:flex-end;max-width:720px;margin:0 auto 12px}
[data-composer-seat]{max-width:720px;margin:0 auto}.fixtureComposerStack{display:flex;flex-direction:column;gap:8px}[data-composer-card]{position:relative;padding:48px 16px 14px;border:1px solid #dce4ec;border-radius:18px;background:#fff}
textarea{display:block;width:100%;height:100px;padding:8px;border:0;resize:none;background:transparent;color:inherit;font:16px system-ui}.fixtureNativeActions{display:flex;justify-content:space-between}.fixtureWorkbench{min-width:0;height:100vh;border-left:1px solid #dce4ec}
html[data-theme=dark] body{background:#101820;color:#e7eef6}html[data-theme=dark] .fixtureSidebar,html[data-theme=dark] [data-composer-card]{background:#18232e;border-color:#344657}html[data-theme=dark] .fixtureSidebar{border-color:#344657}
@media(max-width:760px){.fixtureLayout{display:block}.fixtureSidebar{display:none}.fixtureConversation{padding:18px 10px}.fixtureWorkbench{height:680px;border:0}.fixture_headlineText{font-size:21px}}
</style></head><body><div id="app"></div><script src="./fixture.js"></script></body></html>`, "utf8")

const scenarios = [
  ["light", 1440, 900],
  ["dark", 1440, 900],
  ["light", 390, 700],
  ["dark", 390, 700],
]
const results = []
for (const [theme, width, height] of scenarios) {
  const profile = resolve(output, `profile-${theme}-${width}`)
  const screenshot = resolve(output, `${theme}-${width}x${height}.png`)
  const url = `file://${resolve(output, "index.html")}?theme=${theme}`
  const run = spawnSync(chrome, [
    "--headless=new",
    "--disable-gpu",
    "--disable-background-networking",
    "--disable-component-update",
    "--disable-default-apps",
    "--disable-sync",
    "--metrics-recording-only",
    "--no-pings",
    "--force-device-scale-factor=1",
    "--no-first-run",
    "--no-default-browser-check",
    "--allow-file-access-from-files",
    `--user-data-dir=${profile}`,
    `--window-size=${width},${height}`,
    "--virtual-time-budget=1800",
    `--screenshot=${screenshot}`,
    "--dump-dom",
    url,
  // Linux CI cold-starts the full Chrome binary; 8s can expire before it opens
  // the fixture. Keep the same virtual-time/assertion gates, allow 30s startup.
  ], { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 30_000, killSignal: "SIGKILL" })
  await writeFile(resolve(output, `${theme}-${width}.dom.html`), run.stdout ?? "", "utf8")
  await writeFile(resolve(output, `${theme}-${width}.browser.log`), run.stderr ?? "", "utf8")
  const timedOutAfterDump = run.error?.code === "ETIMEDOUT" && run.stdout.includes('data-ui-ready="true"')
  assert.ok(run.status === 0 || timedOutAfterDump, `Chrome ${theme} ${width}x${height}: ${run.error?.code ?? run.status}\n${run.stderr}`)
  const dom = run.stdout
  const attr = (name) => new RegExp(`data-${name}="([^"]*)"`).exec(dom)?.[1]
  assert.equal(attr("ui-ready"), "true")
  assert.equal(attr("session-isolation"), "true")
  assert.equal(attr("brand"), theme === "dark" ? "#55ADFF" : "#128BED")
  assert.equal(attr("menu-placed"), "true")
  assert.equal(attr("capability-count"), "5")
  assert.equal(attr("capability-direction"), "column")
  assert.equal(attr("capability-min-height"), "54px")
  assert.equal(attr("capability-border"), "solid")
  assert.equal(attr("capability-overflow"), "auto")
  assert.equal(attr("capability-single-row"), "true")
  assert.equal(attr("capability-fits-viewport"), "true")
  assert.equal(attr("stage-count"), "5")
  assert.equal(attr("stage-description-count"), "0")
  assert.equal(attr("stage-fits"), "true")
  assert.equal(attr("stage-direction"), "column")
  assert.ok(Number(attr("logo-count")) >= 3)
  assert.equal(attr("hero-title"), "访前尽调一页纸智能体")
  assert.equal(attr("prompt-fixed"), "fixed")
  assert.equal(attr("prompt-overflow"), "auto")
  assert.equal(attr("prompt-fits"), "true")
  assert.equal(attr("prompt-actions-fit"), "true")
  assert.equal(attr("escape-closed"), "true")
  assert.equal(attr("focus-restored"), "true")
  assert.equal(attr("no-horizontal-overflow"), "true")
  results.push({ theme, width, height, screenshot })
}
await writeFile(resolve(output, "results.json"), JSON.stringify({ passed: true, scenarios: results }, null, 2), "utf8")
console.log(`UI layout regression: ${results.length} scenarios passed`)
