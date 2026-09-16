# 0.1.39：默认关闭实验报告卡片

升级：`dsh plugin --profile web add dsh-pre-duediligence@0.1.39`，重启 DSH Web 并刷新页面。

主插件不再注册 `f24_previsit_report_open` 和 `/f24-mcp-app` RPC；主客户端不再加载实验卡片渲染器，也不再要求实验 UI 的额外宿主模块。五阶段工作台、材料输出、证据引用与修订历史、下载和任务历史继续使用。

不删除历史消息、报告、证据或实验恢复凭据。旧会话中的实验工具结果由 DSH 原生方式呈现，不再挂载交互卡片。

实验代码及构建产物保留。若开发者需要继续验证，遵循 `experimental/dsh-mcp-app-host/README.md` 在独立 DSH_HOME、端口及 Profile 中显式加载实验 Host/Client；不要向日常 Profile 添加实验 patch。此版本不提供面向客户的实验开关。

F25 新建平行报告入口方案暂停，正式产品沿用现有工作台。
