# 0.1.26 · 首页标题与常驻处理状态

- 首页显示 Logo + 访前尽调智能体。适配当前 DSH 的 blank / awaitingFirstTurn 字段，并由原生 Hero DOM 限定标题桥接；不再依赖旧 composerPhase 字段启动替换。
- 当前任务所有 TAB 共用滚动区域外的常驻状态条，查看长风险列表时仍可看到任务状态。
- 区分宿主运行中、查询待返回、分析等待、主体确认、会话停止和状态同步异常；显示等待时长而非虚构完成百分比。
- 历史任务不显示当前会话的运行状态。切换到不可读取运行状态的会话时清除旧状态。

验证：174 项单元测试、类型检查、构建及四种隔离浏览器场景。模拟当前 Host 字段，不连接真实 MCP；生产环境仍需升级并重启 DSH 后验收。

发布沿用 main CI → 注释 tag → GitHub OIDC npm Trusted Publishing → registry 与 provenance 核验，无需重复人工 npm 登录。
