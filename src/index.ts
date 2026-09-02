import { readFileSync } from "node:fs"
import { fileURLToPath } from "node:url"

import { parseSkillFile } from "./skill-file.js"

export const inject = ["skills"] as const

export const SKILL_NAME = "qcc-previsit-onepager"
export const SKILL_DESCRIPTION =
  "调用企查查五类 MCP 执行企业访前尽调，以机会与风险双引擎识别经营状态、建立并反证业务假设，交付可追溯的拜访作战卡。"

type SkillRegistration = {
  name: string
  description: string
  whenToUse: string
  content: string
  source: "bundled"
  resourceBase: {
    kind: "directory"
    path: string
  }
  metadata: Readonly<Record<string, unknown>>
}

export type HostContext = {
  skills: {
    register(skill: SkillRegistration): () => void
  }
}

export function loadBundledSkill(): SkillRegistration {
  const skillDirectoryUrl = new URL("../skills/qcc-previsit-onepager/", import.meta.url)
  const skillSource = readFileSync(new URL("SKILL.md", skillDirectoryUrl), "utf8")
  const { content } = parseSkillFile(skillSource)

  return {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    whenToUse: "用户要求准备客户拜访、访前尽调、一页纸简报、授信面谈、商务谈判、签约核查、复访更新、触达路径或当面提问清单时使用。",
    content,
    source: "bundled",
    resourceBase: {
      kind: "directory",
      path: fileURLToPath(skillDirectoryUrl),
    },
    metadata: {
      author: "QCC",
      version: "0.3.0",
      industry: "enterprise-services",
      mcpServers: ["qcc-company", "qcc-risk", "qcc-ipr", "qcc-operation", "qcc-executive"],
    },
  }
}

export function apply(ctx: HostContext): void {
  ctx.skills.register(loadBundledSkill())
}
