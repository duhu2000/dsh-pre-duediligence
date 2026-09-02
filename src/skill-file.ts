export type ParsedSkillFile = {
  content: string
  frontmatter: string | null
}

export function parseSkillFile(source: string): ParsedSkillFile {
  const normalized = source.replaceAll("\r\n", "\n")

  if (!normalized.startsWith("---\n")) {
    return { content: normalized.trim(), frontmatter: null }
  }

  const closingMarker = normalized.indexOf("\n---\n", 4)

  if (closingMarker === -1) {
    throw new Error("SKILL.md 的 YAML frontmatter 缺少结束标记")
  }

  return {
    frontmatter: normalized.slice(4, closingMarker).trim(),
    content: normalized.slice(closingMarker + 5).trim(),
  }
}
