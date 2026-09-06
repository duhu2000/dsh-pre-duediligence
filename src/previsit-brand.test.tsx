import { readFileSync } from "node:fs"
import { describe, expect, it } from "vitest"
import { renderToStaticMarkup } from "react-dom/server"

import { PREVISIT_LOGO_PATH, PrevisitLogo } from "./previsit-brand.js"
import { PREVISIT_HOME_TITLE } from "./previsit-home.js"

const root = new URL("../", import.meta.url)

describe("访前尽调品牌一致性", () => {
  it("使用企查查蓝 Mockup v1.1.0 的同一建筑路径", () => {
    expect(PREVISIT_LOGO_PATH).toBe("M4 21h16M6 21V6l6-3 6 3v15M9 8h1m4 0h1M9 12h1m4 0h1M10 21v-5h4v5")
    expect(renderToStaticMarkup(<PrevisitLogo />)).toContain(PREVISIT_LOGO_PATH)
  })

  it("锁定菜单名与初始页面名称", () => {
    const sidebar = readFileSync(new URL("src/left-sidebar.tsx", root), "utf8")
    expect(sidebar).toContain('error === undefined ? "访前尽调"')
    expect(sidebar).not.toContain('error === undefined ? "访前尽调智能体"')
    expect(PREVISIT_HOME_TITLE).toBe("访前尽调一页纸智能体")
  })
})
