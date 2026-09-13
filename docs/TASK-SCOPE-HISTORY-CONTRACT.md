# TaskScope 与任务历史契约

本契约供访前尽调及其它 DSH 业务智能体复用。它区分“当前工作真相”和“历史浏览索引”，避免跨 Session 串单。

## 作用域

| 能力 | TaskScope | 请求 | 允许行为 |
| --- | --- | --- | --- |
| 当前任务发现与进度 | 当前 Session | `GET /previsit/api/tasks?sessionId=A` | 只能认领 Session A 的任务 |
| 当前任务正文与报告回写 | 当前 Session | `GET/PUT /previsit/api/tasks/:id...?sessionId=A` | Host 必须校验记录归属 A |
| 当前任务报告下载 | 当前 Session | `GET /previsit/api/tasks/:id/report?sessionId=A` | 不允许从 A 下载 B 的制品 |
| 任务历史列表 | 当前 DSH Profile | `GET /previsit/api/tasks` | 可汇总 A、B 等访前 Session 的 Host 持久记录 |

历史列表不是第二套浏览器数据库，也不是重新认领入口。完整对话与证据引用继续归属于来源 DSH 原生会话。

## A/B/legacy fixtures

| 记录 | origin Workspace / Session | 当前 A 视图 | Profile 历史 | 展示规则 |
| --- | --- | --- | --- | --- |
| Task A | `/workspace-a` / `session-a` | 可认领 | 可见 | 显示真实来源 |
| Task B | `/workspace-b` / `session-b` | 不可认领 | 可见 | 显示真实来源 |
| Legacy | 缺失 / 缺失 | 不可认领 | 可见 | 显示“未记录（旧记录）”，不得猜测为 A |

实现以 `HostedTaskListScope` 的 `current` / `profile-history` 判别联合为客户端契约；Host 对单任务、报告回写和下载继续强制校验 `sessionId`。旧记录缺失来源时使用空字符串兼容哨兵，只用于 Profile 历史，不参与任一当前 Session 匹配。
