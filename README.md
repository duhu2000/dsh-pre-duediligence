# dsh-pre-duediligence

当前版本：**0.1.4**。修复智能体入口打开失败，新增仅属于访前尽调会话的中文产品首页，支持跨插件切换后自动展开右侧工作台。详见 [更新日志](CHANGELOG.md)。

面向 DeepSeek Harness 的 Session 级访前尽调智能体。业务人员从左侧菜单进入，在会话级工作台定义一次拜访；Agent 调用企查查五类 MCP，使用机会与风险双引擎完成经营状态识别、假设与反证、风险核验，最终交付可追溯的访前尽调报告。

## 功能概览

本版本参考 `dsh-data-cleaning-agent` 的独立智能体交互原则，以及 dsh-tender-workbench 的 Session-scoped Better Sidebar 工作台范式，并吸收产品 handoff v0.2 的访前推理规范。

### 工作台

- 使用 dsh-better-sidebar 0.17.1，不再使用遮挡对话的自定义浮层
- 只在 DSH 左侧菜单增加“访前尽调智能体”入口；对应工作台标签在 Better Sidebar 的右侧“+”菜单中隐藏
- 用户点击左侧入口、工作台真实可见后才挂载业务样式；关闭后立即卸载，不影响 DSH 原页面
- 四阶段业务导航：
  1. 定义拜访
  2. 机会研判
  3. 风险核验
  4. 尽调报告
- 执行完成或失败时切到“尽调报告”；用户已关闭工作台时不会强制重新打开
- 进度与工具记录只读取当前 Session 的真实事件，不维护跨 Session 的浏览器任务列表
- 完整报告保留在 DSH 原生会话中

### 点选拼句器

- 前端不预选角色、档位或输出形态，默认逻辑只存在于 Skill
- 支持角色、拜访场合（首次 / 谈判前 / 复访）、重点关注、尽调深度和输出形态；签约/准入类核查归入「准入尽调」，定期复查归入「持续尽调」
- 拼句路由词与 Skill 逐字绑定，并有自动化契约测试
- 用户只在企业占位符处输入名称时，继续点选会保留企业名称
- 用户自由修改文本后进入保护模式，点选条件不会覆盖原文
- “按条件补充”只会另起一句追加要求
- 最终发送的是用户可见自然语言，不发送隐藏结构化参数

### 访前业务内核

- 五类 MCP：qcc-company、qcc-risk、qcc-ipr、qcc-operation、qcc-executive
- 唯一法律实体硬门；多候选必须停下消歧
- 机会轨：八种经营状态 → 状态 × 角色假设 → 支持/反对/未知 → 反证
- 风险轨：全量扫描 → 零计数不下钻 → 非零维度明细 → 拜访影响
- 行为信号超过 24 个月只作历史沿革
- 公开数据阶段禁止“高置信度”
- 银行对公客户经理状态内容库
- 八段访前尽调报告：核心研判、产业定位、近期动态、业务假设、红线提示、现场必问、触达开场、覆盖说明；作战交付阶段可一键下载 demo 样式的 HTML 报告

## 安装

前置条件：Node.js 20 或更高版本、DeepSeek Harness `0.1.1-rc.2` 或更高版本、可用的 `pnpm`，以及已经配置好的模型。

### 一键安装（推荐）

~~~bash
bash <(curl -fsSL https://raw.githubusercontent.com/duhu2000/dsh-pre-duediligence/main/install.sh)
~~~

安装脚本会按顺序向 DSH Web profile 安装三个 Bundle：

1. `dsh-better-sidebar@0.17.1`：提供 Session 级右侧工作台容器。
2. `dsh-mcp-connector@0.2.32`：提供通用 MCP 连接器与市场，通过“企查查·企业工商”完成 OAuth，并动态挂载企业、风险、知产、经营、历史和董监高 MCP。
3. `dsh-pre-duediligence@0.1.4`：提供左侧智能体入口、访前工作台、点选拼句器和完整 Skill。

安装完成后停止旧的 DSH Web 进程并重新运行：

~~~bash
dsh web
~~~

首次使用时打开左侧“🧩 MCP连接器”，选择“企查查·企业工商”并完成 OAuth 授权。授权完成后会注册 `qcc-company`、`qcc-risk`、`qcc-ipr`、`qcc-operation`、`qcc-history` 和 `qcc-executive`，不需要分别安装这些 MCP Server。

### 手动安装

~~~bash
dsh plugin --profile web add dsh-better-sidebar@0.17.1 --allow-build=node-pty
dsh plugin --profile web add dsh-mcp-connector@0.2.32
dsh plugin --profile web add dsh-pre-duediligence@0.1.4 --allow-build=dsh-pre-duediligence
dsh web
~~~

Better Sidebar 必须使用 `0.17.1`；工作台依赖它的 `targetedOpen` 与 `stateSubscription` 公共能力。安装命令显式允许 `dsh-pre-duediligence` 的构建脚本；Better Sidebar 使用的 `node-pty` 也需要允许构建。

如果 pnpm 仍提示 `Ignored build scripts`，请按终端提示在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds` 中允许对应包，然后重新执行失败的安装命令。

### 安装后检查

~~~bash
dsh plugin --profile web list --depth 0
~~~

应能看到 `dsh-better-sidebar@0.17.1`、`dsh-mcp-connector@0.2.32` 和 `dsh-pre-duediligence@0.1.4`。重启 DSH 并连接“企查查·企业工商”后，在左侧菜单点击“访前尽调智能体”打开工作台；Better Sidebar 的右侧“+”菜单不会再列出该入口。点击前 DSH 首页、输入框、消息流和 Session 头部均保持原样。

### 从旧访前尽调包迁移

新旧包会注册同一项访前能力，请勿同时安装。若 Web profile 已有 `qcc-previsit-dsh`，先执行：

~~~bash
dsh plugin --profile web remove qcc-previsit-dsh
~~~

然后安装 `dsh-pre-duediligence` 并完整重启 DSH。安装脚本检测到旧包时会停止并提示，不会自动删除用户现有插件。

### 从旧企查查 OAuth 插件升级

如果 Web profile 已安装 `qcc-dsh-mcp-oauth`，不要让它与 MCP 连接器同时管理同名企查查 Server：

1. 先安装 `dsh-mcp-connector@0.2.32` 和 `dsh-pre-duediligence@0.1.4`，完全重启 DSH。
2. 打开“🧩 MCP连接器”，按界面提示迁移旧企查查授权；也可以重新连接“企查查·企业工商”。
3. 迁移完成后停止 DSH，执行 `dsh plugin --profile web remove qcc-dsh-mcp-oauth`。
4. 再次启动 DSH，在“已安装”中确认企查查连接健康，然后执行一次真实企业查询。

连接器只复制旧授权，不会自动删除旧插件或旧凭据；确认新连接可用后再移除旧插件。

## 本地开发

~~~bash
git clone https://github.com/duhu2000/dsh-pre-duediligence.git
cd dsh-pre-duediligence
pnpm install
pnpm check
~~~

pnpm check 会执行 TypeScript 类型检查、Vitest 测试和 Host/Client 构建。

## 人工验收

1. 在 DSH 选择一个工作空间和 Session。
2. 确认左侧菜单出现“访前尽调智能体”，同时右侧 Better Sidebar 的“+”菜单不再出现该入口；首页标题、输入框、消息流和 Session 头部均保持 DSH 原样。
3. 点击左侧“访前尽调智能体”，确认会话级工作台打开；关闭后业务 UI 和样式不再存在。
4. 打开“定义拜访”，确认所有条件初始都未选择。
5. 选择“银行/信贷客户经理、首次拜访、风险与涉诉、股权与实控人、15分钟标准、一页纸简报”。
6. 将占位符替换为完整注册名称“企查查科技股份有限公司”，再切换档位，确认企业名称不丢失。
7. 输入一段自由文本后点选条件，确认原文不被覆盖；点击“按条件补充”后才另起一句追加。
8. 点击“开始访前尽调”，确认消息直接作为用户可见文本发送到当前 Session。
9. 确认工作台切到“机会研判”，并只展示当前 Session 真实发生的企业、经营和知识产权工具调用。
10. 检查风险侧先出现企业风险扫描，零计数维度没有继续下钻。
11. 任务完成后确认工作台自动切到“尽调报告”。
12. 检查报告有八段（含独立的产业定位段），假设包含支持/反对/未知，必问包含答 A/B 分支，覆盖声明区分零记录和调用失败。

## 自动化契约

src/skill-contract.test.ts 会检查拼句器中的档位、角色、关注维度和输出形态是否仍逐字存在于 Skill。修改任何 phrase 时必须同步更新 Skill，否则测试失败。

## 项目结构

~~~text
dsh-pre-duediligence/
├── src/
│   ├── index.ts
│   ├── client.tsx
│   ├── workbench-v2.tsx
│   ├── workbench-style.ts
│   ├── better-sidebar.ts
│   ├── composer-model.ts
│   ├── workbench-state.ts
│   └── skill-contract.test.ts
├── skills/qcc-previsit-onepager/
│   ├── SKILL.md
│   └── references/
│       ├── reasoning-framework.md
│       ├── bank-rm-content-bank.md
│       ├── tool-routing.md
│       ├── fact-contract.md
│       └── report-template.md
├── scripts/build.mjs
├── cordis.patch.yml
└── package.json
~~~

## 安全与边界

- 插件不保存企查查 Token。
- 插件只在左侧栏增加独立入口，并把承载工作台的 Better Sidebar 标签从右侧“+”菜单隐藏；未点击入口时不挂载业务 DOM 或 CSS，也不修改 DSH 原生文案。
- 企业事实只能来自本次企查查 MCP 返回。
- 条件仅生成用户可见文本，不在 Client 侧调用 MCP。
- 用户点击“开始访前尽调”后才发送。
- 工作台状态绑定当前 Session，不根据聊天文本猜测业务结论。
- Agent 不输出信用评分或替用户作授信、合作、投资决定。

## 设计参考与许可

- dsh-tender-workbench：https://github.com/Sunhh3221/dsh-tender-workbench
- dsh-data-cleaning-agent：https://github.com/duhu2000/dsh-data-cleaning-agent
- 交互参考：`DeepSeek_Harness_数据清洗补全智能体_UI_Mockup_v2.html` 与 `DeepSeek_Harness_数据清洗补全智能体_业务流程与页面设计_v2.md`
- 产品输入：桌面 handoff 中的系统提示词 v0.2、拼句器配置 v1.2.1、推理规范、业务内核和银行角色内容库
- 第三方许可见 THIRD_PARTY_NOTICES.md

## License

MIT
