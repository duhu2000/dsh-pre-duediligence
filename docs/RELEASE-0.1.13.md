# dsh-pre-duediligence 0.1.13

Version: **0.1.13**
Status: **release**

本版采用 DSH-UX-001 v1.5.1，将 Better Sidebar 改为可选工作台增强。默认安装只包含成套 MCP Connector 和访前尽调智能体；只有显式设置 `DSH_PREVISIT_WORKBENCH=on` 才安装当前 DSH 基线对应的 Better Sidebar。

无 Sidebar 时，左侧入口、专属原生 Session、提示词生成与草稿、原生发送表面、bundled Skill/Host 执行门和会话报告阅读仍保留。点击五个工作台流程按钮时显示可执行的安装提示，不清空草稿、任务或会话状态，不生成备用私有抽屉。五阶段可视化、工作台历史和 HTML 下载仍需兼容 Sidebar。

安装器仍在任何 Profile 写入前阻断与当前 Host 不兼容的已安装 Sidebar，不会因本次选择基础模式就忽略会导致宿主启动失败的组合。连接器和产品增量安装均带上 `node-pty` 构建批准，避免更换候选包时被 pnpm ignored-builds 中断。

本版不抢占 DSH `details`，不用 `shell.overlay` 或 `position: fixed` 建立原生侧栏替代，不使用 DOM 点击模拟宿主导航，也不引入尚未进入 DSH `0.1.2-rc.1` 验证基线的原生右栏、dockkit 或 file-upload。Better Sidebar 调用仍集中在独立 adapter，为未来 `WorkbenchSurfacePort` 保留业务状态与容器脱耦边界；本版不包含 DSH 原生工作台迁移。

发布门禁包括 Node 22.19/24 下 stable/candidate 四组 CI、17 个测试文件 / 116 项单元与契约测试、类型检查、构建、四种隔离 Chrome UI 场景和最终 npm 包清单。候选 tarball 在临时 `DSH_HOME` 下通过无 Sidebar、Sidebar `0.18.1`、已知错配 Sidebar `0.17.1` 三场景验收。

验收没有配置模型密钥或企查查 OAuth，没有调用付费 MCP 或生成真实企业报告。四款业务插件共装和真实 Provider 仍属独立待验收项。

回滚可安装 `dsh-pre-duediligence@0.1.12`，并恢复升级前记录的整套 DSH / Sidebar / Connector 版本；不要移动既有 tag 或覆盖已发布 npm 版本。
