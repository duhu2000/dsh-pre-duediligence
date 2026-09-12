import { mkdtempSync, writeFileSync, readFileSync, existsSync, rmSync } from "node:fs"
import { tmpdir } from "node:os"
import { join } from "node:path"
import { spawnSync } from "node:child_process"
import { describe, expect, it } from "vitest"

function install(dependencies: Record<string, { version: string }>, extra: Record<string, string> = {}) {
  const directory = mkdtempSync(join(tmpdir(), "previsit-installer-"))
  const log = join(directory, "calls.jsonl")
  writeFileSync(join(directory, "dsh"), `#!/usr/bin/env node
const fs = require("node:fs");
const args = process.argv.slice(2);
if(args[0] === "--version") console.log(process.env.TEST_DSH_VERSION || "0.1.1-rc.2");
else if(args.includes("list")) { if(process.env.TEST_LIST_FAIL) process.exit(1); console.log(process.env.TEST_PLUGINS); }
else fs.appendFileSync(process.env.TEST_LOG, JSON.stringify(args) + "\\n");
`, { mode: 0o755 })
  try {
    const run = spawnSync("bash", ["install.sh"], { encoding: "utf8", env: { ...process.env, PATH: directory + ":" + process.env.PATH, DSH_PROFILE: "synthetic-profile", DSH_PREVISIT_BASELINE: "stable", TEST_PLUGINS: JSON.stringify([{ dependencies }]), TEST_LOG: log, ...extra } })
    const calls = existsSync(log) ? readFileSync(log, "utf8").trim().split("\n").map(line => JSON.parse(line) as string[]) : []
    return { ...run, calls }
  } finally { rmSync(directory, { recursive: true, force: true }) }
}
describe("installer transaction preflight", () => {
  it("installs the fixed base dependencies without adding optional Sidebar", () => {
    const result = install({})
    expect(result.status, result.stderr).toBe(0)
    expect(result.calls.map(args => args[4])).toEqual(["dsh-mcp-connector@0.2.32", "dsh-pre-duediligence@0.1.20"])
    expect(result.calls.every(args => args[2] === "synthetic-profile")).toBe(true)
    expect(result.calls[0]).toContain("--allow-build=node-pty")
    expect(result.calls[1]).toContain("--allow-build=node-pty,dsh-pre-duediligence")
    expect(result.stdout).toContain("未安装可选 Better Sidebar")
  })
  it("adds the paired Sidebar only when the workbench is explicitly enabled", () => {
    const result = install({}, { DSH_PREVISIT_WORKBENCH: "on" })
    expect(result.status, result.stderr).toBe(0)
    expect(result.calls.map(args => args[4])).toEqual(["dsh-better-sidebar@0.17.1", "dsh-mcp-connector@0.2.32", "dsh-pre-duediligence@0.1.20"])
    expect(result.calls.at(-1)).toContain("--allow-build=node-pty,dsh-pre-duediligence")
  })
  it("refuses to downgrade any shared dependency before making a single install", () => {
    const result = install({ "dsh-mcp-connector": { version: "0.2.37" } })
    expect(result.status).not.toBe(0)
    expect(result.calls).toEqual([])
    expect(result.stderr).toContain("未修改 Profile")
  })
  it("skips already matching dependencies and supports an explicit candidate baseline", () => {
    const result = install({ "dsh-better-sidebar": { version: "0.18.1" }, "dsh-mcp-connector": { version: "0.2.37" } }, { DSH_PREVISIT_BASELINE: "candidate", TEST_DSH_VERSION: "0.1.2-rc.1" })
    expect(result.status, result.stderr).toBe(0)
    expect(result.calls).toHaveLength(1)
    expect(result.stdout).toContain("隔离真实宿主")
  })
  it("refuses both directions of a mixed DSH and Sidebar pair before mutation", () => {
    const newHostOldSidebar = install({ "dsh-better-sidebar": { version: "0.17.1" } }, { DSH_PREVISIT_BASELINE: "candidate", TEST_DSH_VERSION: "0.1.2-rc.1" })
    const oldHostNewSidebar = install({ "dsh-better-sidebar": { version: "0.18.1" } })
    for (const result of [newHostOldSidebar, oldHostNewSidebar]) {
      expect(result.status).not.toBe(0)
      expect(result.calls).toEqual([])
      expect(result.stderr).toContain("不可与 DSH")
      expect(result.stderr).toContain("未修改 Profile")
    }
  })
  it("requires the verified optional context version for candidate coexistence", () => {
    const mismatch = install({ "dsh-context": { version: "0.36.0" } }, { DSH_PREVISIT_BASELINE: "candidate", TEST_DSH_VERSION: "0.1.2-rc.1" })
    expect(mismatch.status).not.toBe(0)
    expect(mismatch.calls).toEqual([])
    expect(mismatch.stderr).toContain("dsh-context 0.36.0")
    expect(mismatch.stderr).toContain("0.48.0")

    const matching = install({ "dsh-context": { version: "0.48.0" } }, { DSH_PREVISIT_BASELINE: "candidate", TEST_DSH_VERSION: "0.1.2-rc.1" })
    expect(matching.status, matching.stderr).toBe(0)
    expect(matching.calls.map(args => args[4])).toEqual(["dsh-mcp-connector@0.2.37", "dsh-pre-duediligence@0.1.20"])
    expect(matching.calls.some(args => args.some(value => value.startsWith("dsh-context@")))).toBe(false)
    expect(matching.calls.some(args => args.some(value => value.startsWith("dsh-better-sidebar@")))).toBe(false)
  })
  it("fails closed on unreadable inventory, wrong DSH or legacy duplicate plugin", () => {
    for (const result of [install({}, { TEST_LIST_FAIL: "1" }), install({}, { TEST_DSH_VERSION: "0.1.2-rc.1" }), install({ "qcc-previsit-dsh": { version: "0.4.14" } }), install({}, { DSH_PREVISIT_WORKBENCH: "automatic" })]) {
      expect(result.status).not.toBe(0)
      expect(result.calls).toEqual([])
    }
  })
  it("never removes old OAuth and instructs a successful query before its removal", () => {
    const result = install({ "qcc-dsh-mcp-oauth": { version: "0.1.0" } })
    expect(result.status, result.stderr).toBe(0)
    expect(result.calls.some(args => args.includes("remove"))).toBe(false)
    expect(result.stdout.indexOf("完成一次真实企业查询")).toBeLessThan(result.stdout.indexOf("remove qcc-dsh-mcp-oauth"))
  })
})
