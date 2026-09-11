# dsh-pre-duediligence 0.1.14

Version: **0.1.14**
Status: **release**

本版采用 DSH-UX-001 v1.5.2，修复业务 Session 的 Workspace 归组与普通会话隔离。左侧“访前尽调”入口新建 Session 时传入选中 Workspace 的 `workspaceId`，保留 `session-dsh-pre-duediligence-*` 命名空间，并让宿主把该 Session 记录到 Workspace 的 `sessionIds`，不再出现“未分组”。

DSH 原生“新建会话”仍保持普通 Session 语义。本插件在公开 Workspace 导航返回四款业务智能体的空 Session 时，仅筛选同 Workspace、同目录、未归档的普通空 Session；无可复用候选则通过 `sessions.create({ workspaceId })` 新建。同一 Workspace 的并发请求共用一次创建，失败原样向上返回。

发布门禁包括 Node 24 下 18 个测试文件 / 125 项断言、类型检查、Host/Client 构建和 4 个隔离 Chrome UI 场景。候选 tarball 另在三个临时 `DSH_HOME` 下完成真实 Web Host 回归：无 Sidebar、DSH `0.1.2-rc.1` + Sidebar `0.18.1`、DSH `0.1.1-rc.2` + Sidebar `0.17.1`。两个 DSH 基线都验证了“Workspace 只有业务空 Session”时的普通新会话创建与归组；两个 Sidebar 版本都验证了初始关闭、流程按钮单例 Tab、Tab X 重开和宿主折叠恢复。

验收没有配置模型密钥或企查查 OAuth，没有调用付费 MCP 或生成真实企业报告。所有运行均使用临时 `DSH_HOME`，未读写生产 `~/.dsh`。

回滚可安装 `dsh-pre-duediligence@0.1.13`，并恢复升级前记录的整套 DSH / Sidebar / Connector 版本；不要移动既有 tag 或覆盖已发布 npm 版本。
