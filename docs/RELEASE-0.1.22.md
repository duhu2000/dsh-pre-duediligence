# dsh-pre-duediligence 0.1.22

Version: **0.1.22**
Date: **2026-09-13**

## 本次修复

- “任务历史”不再被当前 `sessionId` 过滤，改为汇总当前 DSH Profile 内全部访前尽调 Session 的 Host 持久记录。
- 每条历史卡片显示来源 Workspace / Session，便于回到对应原生会话核对完整消息和证据引用。
- “当前任务”、阶段进度、报告回写及下载继续严格携带当前 `sessionId`，历史汇总不会把旧任务重新认领为当前任务。
- 空状态文案明确为 Profile 级历史；重新打开插件或进入新的访前会话，不会再隐藏已经写入 Host 的历史记录。

## 验证与边界

- Node 24.18.0 下严格类型检查、23 个测试文件 / 163 项测试、Host/Client 构建、浅色/深色 × 桌面/窄屏 4 个隔离 Chrome 场景和 npm 包清单 dry-run 通过。
- Host API 回归同时覆盖带 `sessionId` 的当前任务查询和不带 `sessionId` 的全历史查询，确认两种作用域互不混淆。
- 本版复用既有 Host 持久库，不创建浏览器历史副本；可恢复已经写入 Host 的记录，但不能恢复从未持久化的旧版瞬时 UI 状态。
- 历史范围限定在当前 DSH Profile，不跨 Profile 汇总，也不复制来源会话的完整对话正文。

## 升级

```sh
dsh plugin --profile web add dsh-pre-duediligence@0.1.22
```

安装后完整停止并重启对应 DSH Web Profile。Better Sidebar 仍为可选工作台；stable 与 candidate 必须使用 README 列出的成套版本。
