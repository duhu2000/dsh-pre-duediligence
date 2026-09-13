# v0.1.23 发布说明

本版补齐 v0.1.22 跨 Session 历史汇总中的旧记录兼容边界。

## 修复

- 合法旧 Host 记录即使缺少 Workspace / Session 来源元数据，也会继续出现在当前 DSH Profile 的任务历史中。
- 历史卡片明确显示“未记录（旧记录）”，不再空白，也不会把未知来源伪装成当前 Workspace 或 Session。
- 客户端以 `HostedTaskListScope` 判别联合显式区分当前 Session 列表与 Profile 历史列表。
- 当前任务认领、单任务读取、报告回写和下载继续严格校验 Session；旧记录只可浏览，不会被当前 Session 重绑。

## 验证

- Session A/B/legacy fixtures 覆盖当前任务隔离、跨 Session 历史汇总和旧记录展示。
- 浅色/深色 × 桌面/窄屏四种隔离 Chrome 场景覆盖长来源文本、旧记录标识与横向溢出。
- 严格类型检查、单元/集成测试、Host/Client 构建与 npm 包清单门禁均纳入发布流程。

本轮验证使用合成 Host 记录，没有读取或修改生产 DSH Profile，也没有调用真实企查查 Provider；生产账号端到端结果仍以安装后的用户验收为准。

```sh
dsh plugin --profile web add dsh-pre-duediligence@0.1.23
```
