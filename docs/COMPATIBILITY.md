# 访前尽调兼容与验收记录

## 0.1.21：长任务反馈与最新运行聚合（2026-09-13）

| 实测问题 | 修复契约 | 验证边界 |
| --- | --- | --- |
| 查询执行近 2–4 分钟但侧栏没有友好动态 | 当前查询、真实计数、最近完成项和耗时按 Host 轮询持续更新；无运行中工具时明确显示正在研判整理 | 不伪造模型思考百分比；页面同步频率不代表 Provider 响应承诺 |
| 无风险命中但“证据核验”仍为黄色 | 同一业务维度只采用最新运行，完成结果覆盖旧待处理占位；流程待复核改用中性色 | 实际 `unknown / no-permission / not-executed` 仍保留待处理，不会伪装成通过 |
| 经营状态其余七项含义不明 | 八项作为互斥分类逐项标注当前研判或非当前研判；未产生结论时显示待研判/未形成结论 | 经营状态不是八个独立 Provider 查询，采集是否成功看“采集结果” |

本地 Node 24.18.0 发布门禁已通过严格类型检查、22 个测试文件 / 161 项测试、Host/Client 构建、浅色/深色 × 桌面/窄屏 4 个隔离 Chrome 场景及 npm `0.1.21` 包清单 dry-run。生产账号端到端复测仍以用户验收为准。

## 0.1.20：真实 Provider 返回与状态语义（2026-09-12）

| 实测问题 | 修复契约 | 验证边界 |
| --- | --- | --- |
| 中文业务对象已返回，工作台仍显示黄色 | QCC 专用归一器先尊重显式状态，再把非空中文业务对象识别为完成；无权限、错误与明确零记录保留独立结果 | 单元测试使用从真实界面与 Provider 源码抽取的脱敏结构；生产账号复测由用户完成 |
| “已取得”旁仍显示 13 项待核验 | 结果容器不再做完成承诺，改为“采集结果 / 核验结果”，分列完成、待确认、未完成和失败 | 纯函数、源码与 CSS 契约覆盖所有结果状态 |
| 风险扫描成功但明细无法闭环 | 支持生产 `风险因子扫描` 数组、`明细工具` 和字符串形式的 `条目数`；零计数自动跳过，非零项继续必查 | 合成 ToolRuntime 覆盖零计数、非零计数及明确无记录 |
| “红线 0 / 信息 0”仍是灰色或黄色 | 有明确核查证据时零项卡片为绿色，真实关注/红线命中保持黄/红色，信息命中为蓝色 | 绿色只代表本次公开数据未发现记录，界面固定显示边界说明 |

本版不放宽报告完成门，也不把普通传输成功当作事实证明；只有能归一为企查查成功业务对象或明确零记录的返回进入绿色状态。

本地发布门禁使用 Node 24.18.0：22 个测试文件 / 157 项测试、严格类型检查、Host/Client 构建及浅色/深色 × 桌面/窄屏 4 个隔离 Chrome 场景通过；npm `0.1.20` 包清单 dry-run 通过。通用 Codex Skill 校验器不接受 DSH 专用的 `user-invocable / whenToUse` 前置字段，因此以仓库内 `skill-file / skill-contract` 契约测试为准。

## 0.1.19：本地草稿、不限次与核验完成门（2026-09-12）

| 实测问题 | 修复契约 | 验证边界 |
| --- | --- | --- |
| 输入“苏州恒琪”时，半成品写进中间对话且焦点被抢走 | 右侧表单不再逐字调用宿主 `setDraft`；输入始终留在插件 Session Store，只在点击“开始尽调”时提交完整快照 | 单元回归连续输入“苏州”→“苏州恒琪”，断言原生草稿无写入；真实 DSH + 中文输入法仍待发布候选验收 |
| 提示“8 次调用已用满” | 移除 fast / standard / deep 的 8 / 18 / 40 次插件硬上限；schema v1 保留 `limit=0` 作为不限次兼容标记，旧活动任务读取时自动迁移 | 合成 ToolRuntime 连续执行超过原速览上限仍可调度；Provider 自身额度、权限、限流不被绕过 |
| 明细下钻和董监高长期灰色 | 风险零计数自动为八个明细写入绿色 `skipped`；关键人员无数据时董监高写入绿色 `skipped`；非零明细和有人员时的董监高未执行会阻断 finalize | 合成 Host run 覆盖必查拦截、零计数跳过、无人员跳过及绿色聚合；真实 Provider 返回结构仍待采样核验 |

当前变更不把“无需执行”与“调用失败”混同：失败、无权限、接口不匹配或计数无法映射仍保留红/黄状态，报告只能明确部分覆盖。

## 0.1.18：输入隔离、默认设定与报告整理进度（2026-09-12）

| 实测问题 | 0.1.18 修复契约 | 验证 |
| --- | --- | --- |
| 中文输入“苏州恒琪”时输入两个字便启动“苏州”任务 | 企业输入框拦截键盘与 composition 事件；普通 Enter 阻止默认提交，输入法 Enter 只确认候选词且不冒泡 | 单元回归覆盖普通/组合输入；真实 Chrome 断言 Enter 未到达宿主 document |
| 任务已启动但表单继续输入导致侧栏和会话主体不同 | 启动瞬间冻结企业/选择快照；Host query 接管后为权威检索词，确认实体后以 `entity.fullName` 覆盖 | 回归覆盖“苏州”任务不被后续“苏州恒琪”草稿改写，以及主体全称回填 |
| 8/8 后提前进入材料输出，采集/核验进度看似停止 | 报告未就绪时保留最后一次真实 `collect / verify` 视图；只有制品就绪或任务终态才自动进入 output | 回归覆盖 finalizing 的采集、核验与 reportReady 三条路由 |
| 已确认主体仍提示“请先选定企业” | 输出页提示由 Host 主体状态驱动，区分检索、候选确认、执行和报告整理 | 回归校验 4/8 执行中与 8/8 整理中提示 |
| 每次都要重复选择常用设定 | 新 Session 和提示词生成器共享显式默认值：银行/信贷客户经理、六项全选、3分钟速览、一页纸简报 | Store/Composer 契约和四种 Chrome 场景校验默认选中项与“拜访客户”标签 |

自动化使用合成 Session / Host 记录，未配置生产 OAuth、未调用真实企查查额度。Node 25 不在声明支持范围，非安装器测试 21 文件 / 140 项、严格类型检查、构建及浅/深色 × 桌面/窄屏 4 个 Chrome 场景通过；受支持 Node 版本由发布前完整门禁与 GitHub Actions 复核。

## 0.1.17：报告终态与进度状态色（2026-09-11）

| 实测问题 | 0.1.17 修复契约 | 验证 |
| --- | --- | --- |
| 报告已生成，历史仍显示“正在尽调” | `completed / partial / failed` 为不可回退终态；报告制品可兼容收敛旧版回退记录 | 回归覆盖 finalize 后再 query、重复 finalize 和 `finalizing + reportReady` 历史映射 |
| 资料采集、证据核验仍为灰色 | 阶段聚合区分执行中、完成、待核验、失败和未执行 | 回归校验报告已生成时 `unknown` 阶段为 `review`，而非 `idle` |
| 已锚定主体、已返回子项不变色 | `previsit_confirm_entity` 直接驱动主体锚定绿色；步骤与维度标签按真实 outcome 变色 | 纯函数和 CSS 契约覆盖 `done / no-data / unknown / no-permission / failed / not-executed / running` |

该版本不将“报告已生成”等同于全量数据覆盖：`done / no-data` 为绿色，无法从 Provider 结构中确认语义的 `unknown` 保留黄色“待核验”。本轮使用合成 Host/Provider 记录，未调用真实企查查额度。

## 0.1.16：原生对话任务接管与输入区隔离（2026-09-11）

| 实测问题 | 0.1.16 修复契约 | 验证 |
| --- | --- | --- |
| “提示词生成”与会话正文重叠 | 按数据清洗补全的 `conversation.input.overlay` 方式，输入卡片顶部预留 48px，触发器使用独立 pointer-events 层 | 真实 React + 隔离 Chrome 校验触发器底部不超过 textarea 顶部，浅/深色与宽/窄屏共 4 场景通过 |
| 对话已启动、右侧仍可点“开始尽调” | 工作台在本地无 `PV-*` 时仍轮询当前 Session 的 Host 列表，认领最新、未放弃的 `PVT-*` 任务 | 纯函数回归覆盖空本地状态、`turn:*` 匹配和放弃任务隔离 |
| 主体已确认仍显示“思必驰” | Host `entity.fullName` 覆盖原检索词，本地会话 ID 仅作报告边界，工作台任务 ID 切换为 PVT | 回归明确校验“思必驰”更新为“思必驰科技股份有限公司” |
| 资料采集无动态进度 | 按 Host `stage` 的首次发现和真实阶段变更自动定位 `scope / collect / verify / output`；`runs` 按秒轮询投影 | 回归校验 `collect` 视图、运行中工具 run 与顶部“正在尽调”状态 |

本地 Node 25 不在声明支持的 Node 22.19 / 24 范围，因此本地安装器版本门禁按预期拒绝；其余 20 个测试文件 / 129 项测试、严格类型检查、Host/Client 构建和 4 个隔离 Chrome 场景通过。发布门禁由 GitHub Actions 在 Node 22.19 / 24 的 stable/candidate 四组矩阵中补齐安装器测试。本轮未调用真实企查查额度。

## 0.1.15：Host 任务投影与报告闭环（2026-09-11）

| 问题 | 修复契约 | 失败边界 |
| --- | --- | --- |
| 重复询问企查查 MCP 权限 | 用户发送访前任务即授权当前档位的 8 / 18 / 40 次硬上限；`previsit_begin` 不再请求 DSH approval service | OAuth、产品权限、账户额度和 Provider 自身门禁仍由 Connector / Provider 处理；本插件不越过宿主安全边界 |
| 完整主体未回显 | `previsit_confirm_entity` 同步 Host 的全称与信用代码，侧栏以 Host 主体覆盖原始检索词 | 多候选仍必须选择；名称与信用代码必须来自同一条结构化搜索结果 |
| `key_personnel` 报不支持 | 业务维度别名归一为 `personnel`，仍使用固定 qcc-executive 路由 | 其它未登记维度继续 fail closed，不转发通用动态 MCP |
| 进度、完成状态与历史停滞 | Host 按 Session 持久化任务、主体、run、用量、错误、报告和制品；前端轮询本地 API | 仅记录高层工具结果，不伪造未执行阶段；不存储企查查原始响应 |
| 报告待生成、下载无响应 | `previsit_finalize` 校验完整八段报告并上架 HTML 制品；对话捕获作为同 Session 回写兜底 | 报告不完整时拒绝伪完成；下载未就绪时显示可行动原因，不静默失败 |

该版本未改变 DSH `0.1.1-rc.2` / Sidebar `0.17.1` / Connector `0.2.32` 与 DSH `0.1.2-rc.1` / Sidebar `0.18.1` / Connector `0.2.37` 的成套基线，也未改变无 Sidebar 降级、工作台初始关闭和 Session 单例 Tab 规则。Node 24.21.0 的 `pnpm check` 通过：20 个测试文件 / 130 项测试、类型检查和 Host/Client 构建全部成功；`pnpm test:ui` 通过浅色/深色 × 桌面/窄屏共 4 个隔离 Chrome 场景。本轮自动化使用合成工具返回，未配置生产 OAuth、未调用真实企查查额度，因此不将本地通过写成真实 Provider 验收通过。

## 0.1.14：Workspace 归组与普通会话隔离（2026-09-11）

| 路径 | 组合 | Workspace / Session 结论 | 容器结论 |
| --- | --- | --- | --- |
| 无 Sidebar | DSH `0.1.2-rc.1` / Connector `0.2.37` / 候选包 `0.1.14` | 业务 Session 写入所选 Workspace；只有业务空 Session 时，原生新会话创建并归组普通 `session-*` | 入口初始只显示原生会话与五项流程按钮；点流程显示可选 Sidebar 提示，无伪工作台 |
| candidate Sidebar | DSH `0.1.2-rc.1` / Sidebar `0.18.1` / Connector `0.2.37` / 候选包 `0.1.14` | 使用 `uiWorkspace.connectWorkspace` 返回过滤；业务与普通 Session 均归属选中 Workspace | 初始关闭；流程按钮单例 Tab；Tab X 重开、宿主折叠恢复均通过 |
| stable Sidebar | DSH `0.1.1-rc.2` / Sidebar `0.17.1` / Connector `0.2.32` / 候选包 `0.1.14` | 使用 `workspaces.connectWorkspace` 返回过滤；在只有业务空 Session 时新建并归组普通 `session-*` | 初始关闭；流程按钮单例 Tab；Tab X 重开、宿主折叠恢复均通过 |

实现仅使用公开客户端能力：业务入口通过 `sessions.create({ workspaceId, sessionId })` 创建命名空间 Session；原生新会话在导航服务选到任一四款业务命名空间时，复用同 Workspace / 同 `cwd` / 未归档的普通空 Session，或通过 `sessions.create({ workspaceId })` 新建。没有 DOM 点击模拟、存储文件直接改写或跨 Workspace 复用。

自动化：Node 24 的 `pnpm check` 通过 18 个测试文件 / 125 项断言、类型检查和构建；`pnpm test:ui` 通过 4 个隔离 Chrome 场景。真实 Host 回归使用三个临时 `DSH_HOME` 和临时 Workspace；stable Profile 的旧版 live patch watcher 在当前机器上遇到 `EMFILE`，回归时仅对该临时 Profile 启用 chokidar polling，不改产品配置与用户 Profile。本轮未配置模型/OAuth，未发送消息、调用付费 MCP 或生成真实报告，也未读写生产 `~/.dsh`。

## 0.1.13：可选 Sidebar 第一阶段

目标是让基础智能体在没有 Better Sidebar 时独立安装和运行，同时保留兼容 Sidebar 的现有工作台；不在本阶段重写工作台容器。

| 场景 | 安装行为 | 预期能力与边界 |
| --- | --- | --- |
| 无 Sidebar（默认） | 只安装基线 Connector 与访前插件 | 原生入口/Session、提示词、草稿、发送、Skill/工具链、会话报告可用；五阶段可视化、工作台历史、HTML 下载不可用 |
| 兼容 Sidebar 已存在 | 不重复安装 | 基础能力与现有工作台均可用 |
| 显式工作台模式 | `DSH_PREVISIT_WORKBENCH=on` 才安装基线对应 Sidebar | stable 用 0.17.1，candidate 用 0.18.1 |
| 已知错误组合已存在 | 无论工作台模式均在写入前停止 | 防止把“可选”误解为可以忽略会阻断宿主启动的旧 Sidebar |

无 Sidebar 的“工具链可用”是架构与激活边界，不等于真实企查查调用已成功；模型、Connector、OAuth、产品权限和额度仍是独立条件。

### 隔离 tarball 三场景实测（2026-09-10）

- 发布候选物：由本分支源码生成的 `dsh-pre-duediligence-0.1.13.tgz`，最终文件数、完整性和 Registry 摘要按本次发布回读记录。不重用或移动既有 `v0.1.12` 标签。
- 默认无 Sidebar：干净临时 Profile 通过 `install.sh` 安装后只有 Connector `0.2.37` 和候选包。DSH `0.1.2-rc.1` 真实 Web Host 稳定启动，插件图包含 Connector 和访前尽调、不包含 Better Sidebar，浏览器 `error` / `warn` 为 0。左侧入口、原生 composer 和提示词生成器可用；在 composer 中输入 `retain-no-sidebar-draft` 后点击“对象与目标”，页面显示可执行的可选安装提示，草稿仍原样保留，没有空白页、伪成功或自建替代抽屉。
- 兼容 Sidebar：干净临时 Profile 以 `DSH_PREVISIT_WORKBENCH=on` 从脚本完整安装成功，得到 Sidebar `0.18.1` / Connector `0.2.37` / 候选包。真实 Host 中点击“对象与目标”由 Better Sidebar 打开唯一“访前尽调”Tab 并定位对应阶段，五阶段工作台渲染正常，浏览器 `error` / `warn` 为 0。
- 已知不兼容：在 DSH `0.1.2-rc.1` + 已安装 Sidebar `0.17.1` 的临时 Profile 上，即使使用默认基础模式，脚本仍在任何写入前拒绝。失败后清单仍只有 Sidebar `0.17.1`，未安装 Connector 或访前包。
- Host 执行链审计：本插件不读取 `session.events` 或 `snapshotEvents()`，不存在 Tender 所述的同类直接用户请求检查分支。付费调用仍受 DSH approval service、Agent/Session/cwd 归属、固定路由、预算与一次性 permit 链约束；不因无 Sidebar 放宽。
- 未覆盖：本轮没有配置模型密钥或企查查 OAuth，没有发送消息、调用付费 MCP、生成真实企业报告或验证额度扣减。所有运行均使用临时 `DSH_HOME` 和随机本地端口，没有读写生产 `~/.dsh`。

## 0.1.12 候选宿主组合补验（2026-09-10）

本次只验证访前尽调及其运行时共存组合，不把页面能打开写成真实业务成功，也不外推到其它版本。测试全程使用临时 `DSH_HOME`、独立 Profile 和随机本地端口，没有读取或修改用户 `~/.dsh`，没有配置模型密钥，也没有调用付费 MCP。

| 组合 | DSH | Sidebar | Connector | 可选 Context | 结论 |
| --- | --- | --- | --- | --- | --- |
| stable（既有固定基线） | 0.1.1-rc.2 | 0.17.1 | 0.2.32 | 不声明 | 本轮未重跑；保留既有基线，不以候选结果替代 |
| candidate（本轮目标） | 0.1.2-rc.1 | 0.18.1 | 0.2.37 | 缺失或 0.48.0 | 隔离真实宿主无付费交互通过；真实 Provider 待验收 |
| 禁止混装 | 0.1.2-rc.1 | 0.17.1 | 任意 | 任意 | 已知不兼容组合；安装器在写入前拒绝 |
| 禁止混装 | 0.1.1-rc.2 | 0.18.1 | 任意 | 任意 | 不属于验证矩阵；安装器在写入前拒绝 |
| candidate + 旧 Context | 0.1.2-rc.1 | 0.18.1 | 0.2.37 | 0.36.0 | 已知不兼容；安装器要求先升级到 0.48.0 |
| 缺失 Sidebar | 两个目标基线 | 无 | 同基线 | 同上 | 自动化验证保留原生入口；打开工作台时局部提示 |

安装预检按完整基线判断，不能只看宽泛的 peer range。它会同时核对 DSH、Sidebar、Connector；candidate Profile 若已有 Context，还会要求精确为 0.48.0。Context 不是访前尽调依赖，脚本不会主动安装。新 Host + 旧 Sidebar 的失败来自共享组合验收记录；反向组合由包的宿主契约和本仓 fail-closed 策略阻止，不将其写成已执行的真实宿主失败。

### 本轮真实宿主证据

- 环境：Node 24.19.0、`@deepseek-ai/dsh@0.1.2-rc.1`、`dsh-better-sidebar@0.18.1`、`dsh-mcp-connector@0.2.37`、可选 `dsh-context@0.48.0`，以及由 0.1.12 候选源码（版本元数据更新前）生成的 npm tarball。
- 启动与装载：真实 DSH Web 在隔离端口稳定启动；SSE 插件图同时包含 Better Sidebar、Context、MCP Connector 和访前尽调，访前客户端进入 application batch。浏览器控制台 `error` / `warn` 为 0。
- 首页与容器：左侧“访前尽调”可见；首次进入仅显示原生会话、提示词生成器和五项流程按钮，右/底工作台默认关闭。点击“对象与目标”后由 Better Sidebar 打开唯一业务 Tab。
- 定位与恢复：切换到“任务历史”定位同一 Tab；重复点击无可见状态变化。使用宿主 Tab X 关闭后，再点同一流程按钮可恢复并定位目标视图。
- 草稿回填：用合成主体“兼容测试企业”走完四步提示词生成器，生成“准备拜访兼容测试企业。”并回填宿主原生输入框；未自动发送。
- 未覆盖：未配置模型或企查查授权，未发送消息，未生成真实报告，未验证 Provider 工具调用、预算扣减、真实数据/下载结果，也未执行数据清洗补全、AI 填表、招投标三款业务插件的同宿主共装回归。
- 测试环境说明：临时 Profile 的默认 live patch reload 在此机器触发文件监听 `EMFILE`；将该临时 Profile 切到 startup reload 后，裸 Host 与完整目标组合均稳定。此为隔离测试环境设置，没有修改产品配置或用户 Profile，也不作为插件兼容结论。

## 0.1.11 / v1.5.0 容器收敛补充（2026-09-10）

- 发布版本为 `dsh-pre-duediligence@0.1.11`。仍维持 Better Sidebar `>=0.17.1 <0.19.0`，不因消除 peer warning 扩大范围。
- 运行时除版本范围外，明确探测 `targetedOpen`、`stateSubscription`、`registerTab`、`openTab`、`isTabEnabled`、`getSnapshot` 和 `subscribeState`。任一缺失时工作台局部降级，原生会话与输入区流程按钮保留并给出可行动提示。
- 宿主侧拉是唯一容器。业务内容不再包含工作台关闭 X、“返回会话”或其它同义容器控制，也不写宿主宽度、停靠或开合状态；宿主收起和 Tab X 均不触碰业务任务状态。
- Reveal controller 按 Session 保存目标和 pending intent；非前台请求不读取或修改当前 Session store。卸载时注销 Tab descriptor、释放会话订阅，并显式清空 target / pending reveal。
- 本地单元/契约、类型、构建和隔离 UI 证据不替代真实 DSH。Sidebar 0.18.1 的候选宿主基础流程已有上节证据；四款业务插件共装、右/底/浮窗迁移、后台 Session、运行中任务、卸载/重启及真实 Provider 仍待隔离 Profile 回归。

日期：2026-09-07。本文为 0.1.9 发布与验收记录；发布前已回读 npm 0.1.8，本次发布结果以 Registry / GitHub Release 回读为准。公开旧版本和 tag 保持不变；npm 发布不代表真实组合验收通过。

| 组合 | DSH | Sidebar | Connector | 证据级别 / 状态 |
| --- | --- | --- | --- | --- |
| stable（共同复现基线） | 0.1.1-rc.2 | 0.17.1 | 0.2.32 | 既有文档基线；0.1.9 真实宿主、Provider 待验收 |
| candidate（隔离联调） | 0.1.2-rc.1 | 0.18.1 | 0.2.37 | 0.1.12 候选源码隔离真实宿主无付费交互通过；Provider 待验收 |
| 缺失 Sidebar | 两个目标基线 | 无 | 同上 | 自动化验证保留原生入口；工作台局部提示；真实 Loader 待验收 |
| 未知 Sidebar / 能力缺失 | 两个目标基线 | 非 0.17/0.18 或缺少公共方法 | 同上 | 局部禁用工作台，不声明兼容 |
| 旧包共存 | 任意 | 任意 | 任意 | 不支持；安装器拒绝 qcc-previsit-dsh 共存 |

Node：22.19+（22 LTS）或 24 LTS。CI 使用四组有效配对：两个 Node 分别验证 stable（Sidebar 0.17.1 + DSH SDK 0.1.1-rc.2）和 candidate（Sidebar 0.18.1 + DSH SDK 0.1.2-rc.1）；不再生成跨基线笛卡尔组合。配置存在不等于远端结果通过，客户端 SDK 契约测试也不替代真实 DSH 或 Provider 验收。

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
- [独立远端补验成功](https://github.com/duhu2000/dsh-pre-duediligence/actions/runs/34081263665)，结果 artifact 为 `registry-readback-34081263665`；补验脚本所在提交 `19d01ed` 的[八组 CI 亦通过](https://github.com/duhu2000/dsh-pre-duediligence/actions/runs/34080984871)。原始发布运行的回读失败与后续补验成功分别保留。

发布成功不改变真实四插件组合、Provider 或市场的待验收状态。

市场材料已在 [awesome-dsh-plugin 投稿登记](MARKETPLACE.md) 中汇总。上游 [PR #4587](https://github.com/awesome-dsh-plugin/awesome-dsh-plugin/pull/4587) 已开放，PR check 与 Submission gate 均通过；截至 2026-09-07 仍为 OPEN、Ready for review，等待维护者合并和目录生效。投稿成功不等于已收录，当前不声明已上架。
