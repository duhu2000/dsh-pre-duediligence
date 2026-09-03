# v0.3.2 变更：可下载的样式化报告 + 克制标题

## 1. 可点击下载的作战卡报告（新功能）
- 工作台"作战交付"阶段就绪后，页脚出现「下载报告」按钮。
- 点击即下载 `拜访作战卡_企业名.html`——自包含、单文件、可直接双击打开或打印成 PDF。
- 报告样式锁定为你提供的 demo 设计（主蓝 #2563eb、墨色 #0f172a、正文 #334155、hero 底 #f8fbff、
  状态三色 确认绿/关注橙/红线红），前端与模型都不再自行配色。
- 实现：src/report-export.ts（作战卡 Markdown → demo 样式 HTML，纯函数，5 个单测覆盖）
  + workbench-v2.tsx 提取会话中的作战卡正文并触发下载。

## 2. 标题克制化
- 七段标题改为四字：核心研判 / 近期动态 / 业务假设 / 红线提示 / 现场必问 / 触达开场 / 覆盖说明。
- 四字说不清的，标题下另起「> 说明：……」小模块，不把解释塞进标题。

## 3. 兼容 v0.3.1 的产业定位（已并入）

## ⚠ 需要在你运行环境里验一处
「下载报告」按钮依赖从 DSH 会话节点里取出作战卡正文。DSH 节点的确切字段我这边无法验证，
已用防御式多字段提取（text/content/message.content/parts）。若跑出来按钮一直是灰的（提示"正文尚未捕获"），
说明你的 DSH 节点结构和我猜的不同——把一次完整会话的 Session log（含助手最终作战卡那条）发我，
我 5 分钟内把提取器对准你的真实结构。报告渲染器本身已单测通过，只差这一处对接。

## 应用（本地 link 安装，无需重装重构）
1. 解压，用其中 skills/ 与 lib/ 覆盖 ~/qcc-previsit-dsh/ 对应目录
   （或整个目录覆盖 ~/qcc-previsit-dsh 后 `pnpm check` 一次）
2. dsh web 窗口 Ctrl+C，重新 dsh web
3. 刷新浏览器，重跑一单尽调 → 作战交付阶段点「下载报告」
注意：这次改了前端代码（非纯 Markdown），所以压缩包里带了重新构建好的 lib/，务必一并覆盖。

## 验证是否生效（覆盖后、重启前）
```bash
grep "version:" ~/qcc-previsit-dsh/skills/qcc-previsit-onepager/SKILL.md   # 期望 version: 0.3.2
grep -c "extractCardText" ~/qcc-previsit-dsh/lib/client.js                  # 期望 2（v0.3.1 为 0）
```
坑：构建后的 lib/client.js 里中文被转义为 \uXXXX，直接 grep 中文（如「下载报告」）永远是 0，不能作为判断依据。
坑：v0.3.1 与 v0.3.2 压缩包顶层文件夹同名，macOS 会把后解压的改名为 `qcc-previsit-dsh 2`，请确认拷贝的是含 CHANGES_v0.3.2.md 的那个目录。
