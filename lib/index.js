// src/index.ts
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

// src/skill-file.ts
function parseSkillFile(source) {
  const normalized = source.replaceAll("\r\n", "\n");
  if (!normalized.startsWith("---\n")) {
    return { content: normalized.trim(), frontmatter: null };
  }
  const closingMarker = normalized.indexOf("\n---\n", 4);
  if (closingMarker === -1) {
    throw new Error("SKILL.md \u7684 YAML frontmatter \u7F3A\u5C11\u7ED3\u675F\u6807\u8BB0");
  }
  return {
    frontmatter: normalized.slice(4, closingMarker).trim(),
    content: normalized.slice(closingMarker + 5).trim()
  };
}

// src/index.ts
var inject = ["skills"];
var SKILL_NAME = "qcc-previsit-onepager";
var SKILL_DESCRIPTION = "\u8C03\u7528\u4F01\u67E5\u67E5\u4E94\u7C7B MCP \u6267\u884C\u4F01\u4E1A\u8BBF\u524D\u5C3D\u8C03\uFF0C\u4EE5\u673A\u4F1A\u4E0E\u98CE\u9669\u53CC\u5F15\u64CE\u8BC6\u522B\u7ECF\u8425\u72B6\u6001\u3001\u5EFA\u7ACB\u5E76\u53CD\u8BC1\u4E1A\u52A1\u5047\u8BBE\uFF0C\u4EA4\u4ED8\u53EF\u8FFD\u6EAF\u7684\u8BBF\u524D\u5C3D\u8C03\u62A5\u544A\u3002";
function loadBundledSkill() {
  const skillDirectoryUrl = new URL("../skills/qcc-previsit-onepager/", import.meta.url);
  const skillSource = readFileSync(new URL("SKILL.md", skillDirectoryUrl), "utf8");
  const { content } = parseSkillFile(skillSource);
  return {
    name: SKILL_NAME,
    description: SKILL_DESCRIPTION,
    whenToUse: "\u7528\u6237\u8981\u6C42\u51C6\u5907\u5BA2\u6237\u62DC\u8BBF\u3001\u8BBF\u524D\u5C3D\u8C03\u3001\u4E00\u9875\u7EB8\u7B80\u62A5\u3001\u6388\u4FE1\u9762\u8C08\u3001\u5546\u52A1\u8C08\u5224\u3001\u7B7E\u7EA6\u6838\u67E5\u3001\u590D\u8BBF\u66F4\u65B0\u3001\u89E6\u8FBE\u8DEF\u5F84\u6216\u5F53\u9762\u63D0\u95EE\u6E05\u5355\u65F6\u4F7F\u7528\u3002",
    content,
    source: "bundled",
    resourceBase: {
      kind: "directory",
      path: fileURLToPath(skillDirectoryUrl)
    },
    metadata: {
      author: "QCC",
      version: "0.1.1",
      industry: "enterprise-services",
      mcpServers: ["qcc-company", "qcc-risk", "qcc-ipr", "qcc-operation", "qcc-executive"]
    }
  };
}
function apply(ctx) {
  ctx.skills.register(loadBundledSkill());
}
export {
  SKILL_DESCRIPTION,
  SKILL_NAME,
  apply,
  inject,
  loadBundledSkill
};
//# sourceMappingURL=index.js.map
