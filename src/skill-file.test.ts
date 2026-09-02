import { describe, expect, it } from "vitest"

import { parseSkillFile } from "./skill-file.js"

describe("parseSkillFile", () => {
  it("removes YAML frontmatter from model-facing instructions", () => {
    expect(parseSkillFile("---\nname: demo\ndescription: demo\n---\n# Body\n")).toEqual({
      frontmatter: "name: demo\ndescription: demo",
      content: "# Body",
    })
  })

  it("accepts a body without frontmatter", () => {
    expect(parseSkillFile("# Body\n")).toEqual({
      frontmatter: null,
      content: "# Body",
    })
  })

  it("rejects an unfinished frontmatter block", () => {
    expect(() => parseSkillFile("---\nname: demo\n")).toThrow("缺少结束标记")
  })
})
