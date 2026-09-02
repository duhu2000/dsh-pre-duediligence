# qcc-previsit-dsh

面向 DeepSeek Harness 的 Session 级访前尽调工作台。业务人员在对话旁定义一次拜访，Agent 调用企查查五类 MCP，使用机会与风险双引擎完成经营状态识别、假设与反证、风险核验，最终交付“拜访作战卡”。

## 0.3.0 重构

本版本参考 dsh-tender-workbench 的 Session-scoped Better Sidebar 工作台范式，并吸收产品 handoff v0.2 的访前推理规范。

### 工作台

- 使用 dsh-better-sidebar 0.17.1，不再使用遮挡对话的自定义浮层
- 左侧栏、对话输入框左侧、Session 头部三个入口打开同一个当前 Session 工作台
- 四阶段业务导航：
  1. 定义拜访
  2. 机会研判
  3. 风险核验
  4. 作战交付
- 执行完成或失败时自动打开工作台并切到“作战交付”
- 进度与工具记录只读取当前 Session 的真实事件，不维护跨 Session 的浏览器任务列表
- 完整作战卡保留在 DSH 原生会话中

### 点选拼句器

- 前端不预选角色、档位或输出形态，默认逻辑只存在于 Skill
- 支持角色、拜访目的、重点关注、时间预算和输出形态
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
- 七段拜访作战卡：核心研判、最近变化、假设、红线、必问、触达、覆盖度

## 安装

前置条件：Node.js 20 或更高版本、DeepSeek Harness `0.1.1-rc.2` 或更高版本、可用的 `pnpm`，以及已经配置好的模型。

### 一键安装（推荐）

~~~bash
bash <(curl -fsSL https://raw.githubusercontent.com/JinhangShi/qcc-previsit-dsh/main/install.sh)
~~~

安装脚本会按顺序向 DSH Web profile 安装三个 Bundle：

1. `dsh-better-sidebar@0.17.1`：提供 Session 级右侧工作台容器。
2. `qcc-dsh-mcp-oauth@0.1.7`：完成企查查 OAuth，并动态挂载企业、风险、知产、经营和董监高 MCP。
3. `qcc-previsit-dsh`：提供访前工作台、点选拼句器和完整 Skill。

安装完成后停止旧的 DSH Web 进程并重新运行：

~~~bash
dsh web
~~~

首次启动会自动打开企查查授权页。若没有自动弹出，请在对话中输入“连接企查查”。授权完成后不需要分别安装 `qcc-company`、`qcc-risk`、`qcc-ipr`、`qcc-operation` 和 `qcc-executive`。

### 手动安装

~~~bash
dsh plugin --profile web add dsh-better-sidebar@0.17.1 --allow-build=node-pty
dsh plugin --profile web add qcc-dsh-mcp-oauth@0.1.7
dsh plugin --profile web add github:JinhangShi/qcc-previsit-dsh#main --allow-build=qcc-previsit-dsh
dsh web
~~~

Better Sidebar 必须使用 `0.17.1`；工作台依赖它的 `targetedOpen` 与 `stateSubscription` 公共能力。GitHub 直装会通过 `prepare` 生成 Host 和 Client 产物，因此安装命令显式允许 `qcc-previsit-dsh` 构建；Better Sidebar 使用的 `node-pty` 也需要允许构建。

如果 pnpm 仍提示 `Ignored build scripts`，请按终端提示在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds` 中允许对应包，然后重新执行失败的安装命令。

### 安装后检查

~~~bash
dsh plugin --profile web list --depth 0
~~~

应能看到 `dsh-better-sidebar@0.17.1`、`qcc-dsh-mcp-oauth@0.1.7` 和 `qcc-previsit-dsh`。进入任意工作空间和 Session 后，可从侧栏、对话输入框旁或 Session 头部打开“访前尽调”。

## 本地开发

~~~bash
git clone https://github.com/JinhangShi/qcc-previsit-dsh.git
cd qcc-previsit-dsh
pnpm install
pnpm check
~~~

pnpm check 会执行 TypeScript 类型检查、Vitest 测试和 Host/Client 构建。

## 人工验收

1. 在 DSH 选择一个工作空间和 Session。
2. 分别检查左侧“访前尽调”、输入框旁“访前尽调”、Session 头部“访前”三个入口。
3. 确认三个入口聚焦同一个 Better Sidebar 工作台，没有重复抽屉。
4. 打开“定义拜访”，确认所有条件初始都未选择。
5. 选择“银行/信贷客户经理、首次拜访摸底、风险与涉诉、股权与实控人、15分钟标准、一页纸简报”。
6. 将占位符替换为完整注册名称“企查查科技股份有限公司”，再切换档位，确认企业名称不丢失。
7. 输入一段自由文本后点选条件，确认原文不被覆盖；点击“按条件补充”后才另起一句追加。
8. 点击“开始访前尽调”，确认消息直接作为用户可见文本发送到当前 Session。
9. 确认工作台切到“机会研判”，并只展示当前 Session 真实发生的企业、经营和知识产权工具调用。
10. 检查风险侧先出现企业风险扫描，零计数维度没有继续下钻。
11. 任务完成后确认工作台自动切到“作战交付”。
12. 检查作战卡有七段，假设包含支持/反对/未知，必问包含答 A/B 分支，覆盖声明区分零记录和调用失败。

## 自动化契约

src/skill-contract.test.ts 会检查拼句器中的档位、角色、关注维度和输出形态是否仍逐字存在于 Skill。修改任何 phrase 时必须同步更新 Skill，否则测试失败。

## 项目结构

~~~text
qcc-previsit-dsh/
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
- 企业事实只能来自本次企查查 MCP 返回。
- 条件仅生成用户可见文本，不在 Client 侧调用 MCP。
- 用户点击“开始访前尽调”后才发送。
- 工作台状态绑定当前 Session，不根据聊天文本猜测业务结论。
- Agent 不输出信用评分或替用户作授信、合作、投资决定。

## 设计参考与许可

- dsh-tender-workbench：https://github.com/Sunhh3221/dsh-tender-workbench
- 产品输入：桌面 handoff 中的系统提示词 v0.2、拼句器配置 v1.2.1、推理规范、业务内核和银行角色内容库
- 第三方许可见 THIRD_PARTY_NOTICES.md

## License

MIT
