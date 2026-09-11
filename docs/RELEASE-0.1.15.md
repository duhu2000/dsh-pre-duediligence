# dsh-pre-duediligence 0.1.15

Version: **0.1.15**
Date: **2026-09-11**

## 本次修复

- 用户发送访前任务后，不再重复询问是否允许调用企查查 MCP。fast / standard / deep 仍受 8 / 18 / 40 次硬上限保护；多候选主体仍必须由用户选择。
- 主体确认后，工作台的“拜访对象”使用完整法律实体名称，不再停留在原始部分检索词。
- `key_personnel` 作为可接受别名归一到 `personnel`，修复“不支持的业务维度”。
- 资料采集、证据核验、总体用量、最近错误与任务历史现在由 Host 真实任务状态驱动，并在执行期间动态更新。
- 新增 `previsit_finalize` 完成工具，校验八段报告后存储制品、切换完成状态，并生成可下载的自包含 HTML。
- 如果 Agent 已在会话中返回完整报告但遗漏完成工具，工作台会将同 Session 的合格报告回写 Host，避免“对话已完成，右侧仍等待开始”。

## 实现与数据边界

- Host 使用 Session-scoped `previsit_tasks_v1` 存储域，保存任务元数据、已确认主体、高层工具运行记录、用量、状态和报告制品。
- 不将企查查 MCP 原始响应写入任务库；报告仍必须披露零记录、无权限、未执行、失败和未知的差异。
- 新增的 `/previsit/api/*` 路由仅接受同源 Host 请求，用于工作台投影与报告下载。
- 工作台仍默认关闭，只在点击原生输入框下方的业务按钮后打开；阶段菜单和首页快捷按钮样式不变。

## 验证范围

- Node 24.21.0 的 `pnpm check` 通过：20 个测试文件 / 130 项测试、TypeScript 严格类型检查和 Host/Client 构建全部成功。
- 浅色/深色 × 1440×900 / 390×700 共 4 个隔离 Chrome UI 场景通过。
- `npm pack --dry-run --ignore-scripts --json` 通过：49 个发布文件，已包含 Host/Client 构建产物、新增类型声明、Skill 与发布文档，不包含测试源码和 `_scratch` 产物。
- 测试使用合成 Provider 返回，未配置生产模型或企查查 OAuth，未消耗真实查询额度；因此不声明真实 Provider 业务验收通过。

## 升级

```sh
dsh plugin --profile web add dsh-pre-duediligence@0.1.15
```

安装后完整停止并重启对应 DSH Web Profile。Better Sidebar 仍为可选工作台；stable 与 candidate 必须使用 README 列出的成套版本。
