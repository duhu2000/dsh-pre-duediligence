import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

const root = new URL("../", import.meta.url)
const installScript = readFileSync(new URL("install.sh", root), "utf8")
const readme = readFileSync(new URL("README.md", root), "utf8")
const packageJson = JSON.parse(readFileSync(new URL("package.json", root), "utf8")) as { name: string; version: string }
const skill = readFileSync(new URL("skills/qcc-previsit-onepager/SKILL.md", root), "utf8")
const host = readFileSync(new URL("src/index.ts", root), "utf8")
const client = readFileSync(new URL("src/workbench-v2.tsx", root), "utf8")

describe("npm 与 DSH 安装契约", () => {
  it("安装 MCP 连接器与 npm 发布的访前插件，不再新装旧 OAuth 插件", () => {
    expect(installScript).toContain('readonly MCP_CONNECTOR_SPEC="dsh-mcp-connector@0.2.32"')
    expect(installScript).toContain('dsh-pre-duediligence@0.1.0')
    expect(installScript).not.toContain('readonly QCC_OAUTH_SPEC=')
    expect(readme).toContain("dsh plugin --profile web add dsh-mcp-connector@0.2.32")
    expect(readme).toContain("dsh plugin --profile web add dsh-pre-duediligence@0.1.0")
    expect(readme).not.toContain("dsh plugin --profile web add qcc-dsh-mcp-oauth@")
  })

  it("包、Host 元数据与 Skill 使用同一发布版本", () => {
    expect(packageJson.name).toBe("dsh-pre-duediligence")
    expect(packageJson.version).toBe("0.1.0")
    expect(host).toContain('version: "0.1.0"')
    expect(skill).toContain("version: 0.1.0")
  })

  it("只在用户打开右侧智能体标签后挂载自定义界面", () => {
    expect(client).toContain('export const inject = ["sessions", "conversation", "betterSidebar"] as const')
    expect(client).toContain('if (!props.visible) return <></>')
    expect(client).not.toContain("ctx.slots.inject")
    expect(client).not.toContain("patchHeroHeadline")
    expect(client).not.toContain("applyCompact")
  })
})
