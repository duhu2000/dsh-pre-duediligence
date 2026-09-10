import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const root = new URL("../", import.meta.url)
const installScript = readFileSync(new URL("install.sh", root), "utf8")
const readme = readFileSync(new URL("README.md", root), "utf8")
const packageJson = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as { name: string; version: string }
const skill = readFileSync(new URL("skills/qcc-previsit-onepager/SKILL.md", root), "utf8")
const host = readFileSync(new URL("src/index.ts", root), "utf8")
const client = readFileSync(new URL("src/workbench-v2.tsx", root), "utf8")
const leftSidebar = readFileSync(new URL("src/left-sidebar.tsx", root), "utf8")
const betterSidebar = readFileSync(new URL("src/better-sidebar.ts", root), "utf8")

describe("npm 与 DSH 安装契约", () => {
  it("安装 MCP 连接器与 npm 发布的访前插件，不再新装旧 OAuth 插件", () => {
    expect(installScript).toContain('CONNECTOR_VERSION="0.2.32"')
    expect(installScript).toContain('CONNECTOR_VERSION="0.2.37"')
    expect(installScript).toContain('SIDEBAR_VERSION="0.18.1"')
    expect(installScript).toContain('CONTEXT_VERSION="0.48.0"')
    expect(installScript).toContain(`dsh-pre-duediligence@${packageJson.version}`)
    expect(installScript).not.toContain('readonly QCC_OAUTH_SPEC=')
    expect(readme).toContain("dsh plugin --profile web add dsh-mcp-connector@0.2.32")
    expect(readme).toContain(`dsh plugin --profile web add dsh-pre-duediligence@${packageJson.version}`)
    expect(readme).toContain("DSH `0.1.2-rc.1` / Sidebar `0.18.1` / Connector `0.2.37`")
    expect(readme).toContain("`dsh-context@0.48.0`")
    expect(readme).not.toContain("dsh plugin --profile web add qcc-dsh-mcp-oauth@")
  })

  it("包、Host 元数据与 Skill 使用同一发布版本", () => {
    expect(packageJson.name).toBe("dsh-pre-duediligence")
    expect(host).toContain(`version: "${packageJson.version}"`)
    expect(skill).toContain(`version: ${packageJson.version}`)
  })

  it("入口位于左侧菜单，工作台不出现在右侧标签菜单", () => {
    expect(client).toContain('export const inject = ["slots", "sessions", "workspaces", "conversation"] as const')
    expect(client).toContain('ctx.inject(["betterSidebar"]')
    expect(leftSidebar).toContain('ctx.slots.inject("sidebar.footer.action"')
    expect(leftSidebar).toContain('data-slot="sidebar.workspaces"')
    expect(betterSidebar).toContain("hidden: true")
    expect(client).toContain('if (!props.visible || !isPrevisitSession(sessionId)) return <></>')
    expect(client).not.toContain('ctx.slots.inject("shell.overlay"')
    expect(client).toContain('ctx.slots.inject("conversation.input.dock"')
    expect(client).toContain('ctx.slots.inject("conversation.input.overlay"')
    expect(client).not.toContain('ctx.slots.inject("conversation.session.header.actions"')
    expect(leftSidebar).not.toContain("openWorkbench")
    expect(client).not.toContain("patchHeroHeadline")
    expect(client).not.toContain("applyCompact")
  })
})
