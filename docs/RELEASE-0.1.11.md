# dsh-pre-duediligence 0.1.11

Version: **0.1.11**
Status: **release**

本版采纳 DSH-UX-001 v1.5.0 的 Better Sidebar 容器规则。Session 单例 Tab 是唯一工作台容器；业务内容不再提供重复的关闭 X、“返回会话”或其它展开/收起控件。宿主收起与 Tab X 不取消任务，也不删除历史或产物。

首页流程入口更新为对象与目标、范围确认、资料采集、证据核验和任务历史。每次点击聚焦同一 Session Tab 并定位内部视图；重复点击同一目标严格 no-op，不重复建任务或调用 MCP。0.17/0.18 兼容增加公开能力探测、后台 Session 隔离和卸载清理。

发布前门禁包括 Node 24 下的类型检查、单元/契约测试、构建、四种隔离 Chrome UI 场景和 npm 包清单检查。真实 DSH 四插件组合、Sidebar 0.17/0.18 宿主几何与企查查 Provider 仍是独立验收项，不因 npm 发布自动视为通过。

回滚可安装 `dsh-pre-duediligence@0.1.10`，使用升级前任务目录副本；不要移动既有 tag 或覆盖已发布 npm 版本。
