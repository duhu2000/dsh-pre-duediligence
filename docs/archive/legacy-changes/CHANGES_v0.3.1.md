# v0.3.1 变更：补全「产业定位」维度

## 改了什么
针对"生成的作战卡没有体现产业信息"，把产业定位补为一等推理输入（而非可选展示段）。

| 文件 | 改动 |
|---|---|
| skills/qcc-previsit-onepager/SKILL.md | 新增「机会引擎 A0：产业定位」，置于锚定后、状态识别前；作战卡①固定加产业定位行；完成门加勾选项；version→0.3.1 |
| references/reasoning-framework.md | 新增「产业定位」节：产业链环节 × 状态 × 角色 才实例化假设；数据边界规则 |
| references/report-template.md | 核心研判下固定「产业定位」行；深度档新增「行业分析」段 |
| references/tool-routing.md | get_company_profile 基础集用途标明须取回产业字段 |

## 关键设计
- 产业定位来自 get_company_profile，按工具实际返回字段自适应，未硬编码字段名。
- 边界：行业分类/产业链定位/业务模式=数据事实（标来源）；上下游标杆名单=推理综述（标注、分区）。
- pnpm check 全绿（19 测试含契约测试），构建通过。

## 怎么应用（你现在是本地 link 安装，无需重装重构）
1. 解压本压缩包，用其中的 skills/ 覆盖 ~/qcc-previsit-dsh/skills/
   （或直接用整个目录覆盖 ~/qcc-previsit-dsh，再 pnpm check 一次也行）
2. 到 dsh web 窗口 Ctrl+C 停掉，重新 dsh web
3. 刷新浏览器，重跑一次尽调，核心研判应出现「产业定位」行，深度档出现「行业分析」段
Skill 是运行时读取的 Markdown，改它不需要重新构建 lib/。
