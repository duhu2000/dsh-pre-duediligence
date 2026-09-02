import { readFileSync } from "node:fs"

import { describe, expect, it } from "vitest"

import {
  BUDGET_OPTIONS,
  FOCUS_OPTIONS,
  OUTPUT_OPTIONS,
  ROLE_OPTIONS,
} from "./composer-model.js"

const skill = readFileSync(
  new URL("../skills/qcc-previsit-onepager/SKILL.md", import.meta.url),
  "utf8",
)

describe("composer-to-skill vocabulary contract", () => {
  it("keeps every budget routing phrase in the Skill", () => {
    for (const option of BUDGET_OPTIONS) {
      expect(skill).toContain(option.phrase + "尽调")
    }
  })

  it("keeps every supported output phrase in the Skill", () => {
    for (const option of OUTPUT_OPTIONS) {
      expect(skill).toContain(option.phrase)
    }
  })

  it("keeps all focus phrases in the Skill", () => {
    for (const option of FOCUS_OPTIONS) {
      expect(skill).toContain(option.phrase)
    }
  })

  it("keeps the five routed role phrases in the Skill", () => {
    for (const option of ROLE_OPTIONS.filter(option => option.id !== "other")) {
      expect(skill).toContain(option.phrase)
    }
  })
})
