# 访前尽调 0.1.9 兼容与验收记录

日期：2026-09-07。本文为 0.1.9 发布与验收记录；发布前已回读 npm 0.1.8，本次发布结果以 Registry / GitHub Release 回读为准。公开旧版本和 tag 保持不变；npm 发布不代表真实组合验收通过。

| 组合 | DSH | Sidebar | Connector | 证据级别 / 状态 |
| --- | --- | --- | --- | --- |
| stable（共同复现基线） | 0.1.1-rc.2 | 0.17.1 | 0.2.32 | 既有文档基线；0.1.9 真实宿主、Provider 待验收 |
| candidate（隔离联调） | 0.1.2-rc.1 | 0.18.0 | 0.2.37 | Sidebar 公开接口已读取；0.1.9 真实宿主、Provider 待验收 |
| 缺失 Sidebar | 两个目标基线 | 无 | 同上 | 自动化验证保留原生入口；工作台局部提示；真实 Loader 待验收 |
| 未知 Sidebar / 能力缺失 | 两个目标基线 | 非 0.17/0.18 或缺少公共方法 | 同上 | 局部禁用工作台，不声明兼容 |
| 旧包共存 | 任意 | 任意 | 任意 | 不支持；安装器拒绝 qcc-previsit-dsh 共存 |

Node：22.19+（22 LTS）或 24 LTS。CI 新增两组 Node × 两组 Sidebar × 两组 DSH 客户端 SDK（primitives / invariants）构建/类型/测试矩阵；配置存在不等于远端结果通过。客户端 SDK 契约测试不等于启动真实 DSH，也不替代候选版 Host ToolRuntime 验收。

## 实现边界

- Sidebar 采用可选 peer 和独立服务注入；主入口不依赖工作台。未知版本/接口错误由局部工作台提示，不在主客户端初始化中抛错。
- 草稿仅通过宿主会话输入机读写。发送后只清除原会话中仍等于已提交文本的草稿；不使用 document-wide textarea 或延迟 setter。
- 报告来自已认领任务后的助手快照，支持真实 DSH 的 `blocks[kind=text]`，忽略 reasoning、context、interrupted 前缀；不从页面 DOM 抓取报告。输出结构按完整报告/转发摘要分别校验。
- Native composer 的归属来自专属 Session ID；工具名称不作为业务归属。窗口索引变化导致任务定位失败时不导出旧报告，需重新打开/恢复原生会话核对。
- 当前任务历史仍以 DSH 会话为准；清空和“新的尽调”的本地视图状态不承诺跨重启恢复。
- Host 任务授权按 Agent / Session / cwd 绑定；批准记录由 DSH approval service 持久记录。内存预算授权不跨重启复用，恢复查询必须重新确认。
- 高层业务工具检查真实注册 schema，Provider 缺失或参数契约不匹配时未执行。主体确认要求同一条结构化搜索记录中的全称和信用代码；非结构化搜索响应暂不适配，禁止猜测。
- 风险明细只接受扫描结构中对应 dimension / 原始工具名下明确的非负整数计数（数字或 count）；其它 Provider 扫描结构需真链路采样、脱敏契约补齐后支持。未知计数不解释成零。
- 未覆盖固定路由的增量 API 不通过通用动态 MCP 兜底；对报告披露未覆盖。需在 Provider 验收中确认现有业务覆盖是否满足发布标准。

## 四层证据与发布条件

1. 单元/契约：运行 `pnpm test`，覆盖会话、报告、双 Sidebar、预算、确认、主体、防绕过、取消和卸载。
2. 真实组件/隔离 DOM：`pnpm test:ui`，真实 React + Chrome；浅/深色 × 桌面/390px。该测试不连接真实 DSH。
3. 真实宿主：全新隔离 Profile 安装构建 tarball，与清洗 0.8.9 / AI填表 0.2.1 / 招投标 0.5.2 共装；普通会话 → 四入口连续切换；发送后立刻切换；关闭/重开工作台；完整重启；逐个升级和单包卸载。逐项记录结果和合成数据截图，未跑项写待验收。
4. 真实 Provider：用户确认自有额度后，验证企业搜索、多候选选择、名称/信用代码同记录、付费确认、零记录、无权限、部分失败、取消、HTML 下载。Connector 0.2.32 / 0.2.37 分别留证；不得把合成返回写成真实企查查验收。

### 本次本地执行记录（2026-09-07）

- Node v24.18.0；`pnpm check` 通过：类型检查、16 个测试文件 / 101 项测试、构建与类型声明生成。
- `pnpm test:ui` 通过四种 Chrome 场景：浅/深色 × 1440×900 / 390×700；包含真实 React 生命周期中“发送未完成就切换会话”和提示词弹窗切换隔离。使用本机缓存 Chromium；`PREVISIT_CHROME` 可指定浏览器。结果和合成截图位于忽略提交的 `_scratch/ui-layout/`。
- 本机已安装 Cordis 4.0.2 / DSH ToolRuntime 0.1.1-rc.2：实际运行生成后的 `lib/index.js`，三个业务工具注册、合成审批服务、合成 MCP 嵌套调度、主体确认、直接 MCP 调用拒绝、回合结束传播和卸载均通过。该检查未启动 DSH Web，也未使用真实审批 UI、客户连接或额度。
- `bash -n install.sh`、两个发布核验脚本的 `node --check`、`git diff --check` 通过。发布核验脚本的远端 CI / Registry 分支仍须在正式发布流程验证。
- `npm pack --dry-run --ignore-scripts --json` 通过，发布清单共 38 个文件；包含构建产物，不包含 `_scratch`、测试夹具或本机配置。
- 真实 Web Loader、四插件共装、Connector 双版本真链路和市场投稿仍待完成；远端 CI 进度另列下文，本地门禁通过不等于组合验收通过。

首次远端 CI（提交 `75bf8b7`）的八组类型检查、单元测试和构建均通过；Linux Chrome 冷启动触发原有 8 秒进程超时，多数组合未进入 UI 断言。发布前修正为 30 秒启动窗口，保留全部原有 UI / 会话断言，减少 Chrome 后台启动服务，并新增隔离 DOM / 日志 / 截图 artifact。必须等待修正提交的完整矩阵通过后打 tag；不以重试绕过失败检查。

## 发布与市场

2026-09-07 已回读 0.1.8：npm maintainers 为 duhu2000 / jinhangshi；CI 和 Release 成功；provenance 指向 7dfba4deba72724f792631557c4d432801abb7b3。

- [CI](https://github.com/duhu2000/dsh-pre-duediligence/actions/runs/34070774757)
- [Release workflow](https://github.com/duhu2000/dsh-pre-duediligence/actions/runs/34070844360)
- [GitHub Release](https://github.com/duhu2000/dsh-pre-duediligence/releases/tag/v0.1.8)
- [Registry provenance](https://registry.npmjs.org/-/npm/v1/attestations/dsh-pre-duediligence@0.1.8)

0.1.9 流程：材料/完整本地门禁 → release commit 推 main → 该提交 CI 全绿 → annotated v0.1.9 tag → Actions 门禁/OIDC/npm/provenance → GitHub Release → Registry 回读并上传证据 artifact。用户已授权本次提交与发布；发布完成后在 main 回写证据，不移动公开 tag 或重用 npm 版本。

### 0.1.9 发布结果（2026-09-07）

- 发布提交与 annotated tag：`d5ab1ca30cd0eff28ac7997f24806f0a948b7ae8` / `v0.1.9`；[八组 CI 全部通过](https://github.com/duhu2000/dsh-pre-duediligence/actions/runs/34079044391)。
- [Release 工作流](https://github.com/duhu2000/dsh-pre-duediligence/actions/runs/34080271414) 的门禁、OIDC npm 发布和 GitHub Release 创建成功；最后自动回读因 Registry 仍在处理、返回 404 而失败。该首次运行保留真实失败状态，不写成全绿。
- [npm 0.1.9](https://www.npmjs.com/package/dsh-pre-duediligence/v/0.1.9) 已回读，`latest=0.1.9`；[GitHub Release](https://github.com/duhu2000/dsh-pre-duediligence/releases/tag/v0.1.9) 已创建。
- 本地补验于 `2026-09-07T03:47:47.537Z` 通过：[provenance](https://registry.npmjs.org/-/npm/v1/attestations/dsh-pre-duediligence@0.1.9) 的仓库、workflow、tag、commit 和发布物摘要均匹配；npm 发布者为 GitHub Actions Trusted Publisher。
- npm 完整性：`sha512-Y39F4Tv61LRyA/Ta+j7g5tn8+YUbFeDH+zFFqV2q5KBrGrTpFbTT1siuwIZ8yA5vUekqpN4mfQ+b0CM+UULtlg==`，与发布前本地打包检查一致。
- 后续回读允许最长 10 分钟的可见性等待，规避旧 404 缓存，并按不可变 tag 校验，而非随 main 前进的 HEAD。新增只读 `Release readback` workflow 可补存远端证据；它不具有发布或仓库写权限，不重复发布、不移动 tag。

发布成功不改变真实四插件组合、Provider 或市场的待验收状态。

市场材料待备齐：准确业务简介、两个安装基线和限制、公开仓库/npm/许可证、无客户信息的安装与切换截图、真实安装/卸载证据、权限与额度说明、规范采用记录。投稿/合并/目录生效分别登记；当前不声明已上架。
