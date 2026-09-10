# dsh-pre-duediligence 0.1.12

Version: **0.1.12**
Status: **release**

本版将候选兼容组合固定为 DSH `0.1.2-rc.1`、Better Sidebar `0.18.1` 和 MCP Connector `0.2.37`。若目标 Profile 已安装可选的 `dsh-context`，已验证共存版本为 `0.48.0`；访前尽调本身不要求也不会自动安装 Context。

安装器在写入 Profile 前检查整套基线，明确阻止 DSH `0.1.2-rc.1` 与 Sidebar `0.17.1`、以及 DSH `0.1.1-rc.2` 与 Sidebar `0.18.1` 的双向混装；candidate 与旧 Context 共存时也会停止并给出升级路径。CI 同步改为 stable/candidate 有效配对，不再生成跨基线笛卡尔组合。

隔离真实 DSH Web 已验证候选组合的插件图装载、首页默认关闭工作台、同 Session Tab 定位与重复 no-op、宿主 Tab X 后恢复，以及提示词生成器回填原生草稿；浏览器控制台没有 error/warn。验证没有配置模型或企查查授权，没有发送消息、调用付费 MCP 或生成真实报告。四款业务插件共装与真实 Provider 仍是独立验收项。

发布门禁包括 Node 22.19/24 下 stable/candidate 四组 CI、类型检查、113 项单元/契约测试、构建、四种隔离 Chrome UI 场景和 npm 包清单检查。

回滚可安装 `dsh-pre-duediligence@0.1.11`，并恢复升级前记录的整套 DSH / Sidebar / Connector 版本；不要移动既有 tag 或覆盖已发布 npm 版本。
