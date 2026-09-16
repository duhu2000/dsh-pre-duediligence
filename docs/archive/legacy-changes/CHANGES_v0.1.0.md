# v0.1.0：迁移为独立访前尽调智能体

- npm 包更名为 `dsh-pre-duediligence`，仓库迁移至 `duhu2000/dsh-pre-duediligence`。
- 只在 Better Sidebar 右侧菜单注册“访前尽调智能体”。
- 移除首页标题替换、输入框 Dock、Session 头部按钮和全局消息过程折叠。
- 自定义工作台 DOM 与 CSS 仅在右侧标签可见期间挂载，关闭后卸载。
- 任务完成或失败时只切换工作台内部阶段，不再强制重新打开已关闭的侧栏。
- 安装脚本检测到旧包 `qcc-previsit-dsh` 时安全停止，避免新旧包重复注册。
