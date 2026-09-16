# v0.4.14：切换到通用 MCP 连接器

- 安装链路由 `qcc-dsh-mcp-oauth@0.1.7` 切换为 `dsh-mcp-connector@0.2.32`。
- 访前工作台改为从 npm 安装 `qcc-previsit-dsh@0.4.14`，不再依赖 GitHub 直装。
- 新用户通过“🧩 MCP连接器”里的“企查查·企业工商”完成 OAuth；其 Server 名称保持不变，工作台和 Skill 无需改动。
- 安装器检测到旧 OAuth 插件时只提示迁移，不自动删除旧插件或凭据；确认新连接健康后再手动卸载旧插件。
