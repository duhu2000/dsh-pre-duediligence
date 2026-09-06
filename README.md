# dsh-pre-duediligence

当前版本：**0.1.5**。界面已对齐 DSH-UX-001 v1.1.0 与企查查蓝 Mockup：菜单、首页和工作台使用同一建筑 LOGO，首页名称为“访前尽调一页纸智能体”，并新增五项快捷菜单与四步提示词生成器。详见 [更新日志](CHANGELOG.md)和[规范采纳记录](docs/DSH-UX-001-ADOPTION.md)。

面向 DeepSeek Harness 的 Session 级访前尽调智能体。业务人员从左侧菜单进入，在会话级工作台定义一次拜访；Agent 调用企查查五类 MCP，使用机会与风险双引擎完成经营状态识别、假设与反证、风险核验，最终交付可追溯的访前尽调报告。

## 功能概览

本版本参考 `dsh-data-cleaning-agent` 的独立智能体交互原则，以及 dsh-tender-workbench 的 Session-scoped Better Sidebar 工作台范式，并吸收产品 handoff v0.2 的访前推理规范。

### 工作台

- 使用 dsh-better-sidebar 0.17.1，不再使用遮挡对话的自定义浮层
- 只在 DSH 左侧菜单增加“访前尽调”入口；对应工作台标签在 Better Sidebar 的右侧“+”菜单中隐藏
- 菜单、首页与工作台统一使用企查查蓝 Mockup 的线性建筑 LOGO；初始页面为“访前尽调一页纸智能体”
- 首页只保留简洁说明、DSH 原生输入框和输入框下方五项快捷菜单：企业核验、经营画像、风险核查、访前材料、任务历史
- “当前任务 / 任务历史”主导航与五阶段业务导航分离：
  1. 对象与目标
  2. 范围确认
  3. 资料采集
  4. 证据核验
  5. 材料输出
- 快捷菜单与阶段导航只切换视图，不伪造执行状态；只有捕获到完整报告后才显示“报告已生成”
- 关闭工作台只隐藏界面，不取消任务；可从输入区快捷菜单或会话头按钮恢复
- 进度与工具记录只读取当前 Session 的真实事件，不维护跨 Session 的浏览器任务列表
- 完整报告保留在 DSH 原生会话中

### 点选拼句器

- 输入框左上角提供四步提示词生成器：拜访对象 → 角色场景 → 范围深度 → 确认输出
- 向导使用居中弹窗、固定头尾、滚动正文、Escape 关闭与 Tab 焦点环
- 生成结果只回填 DSH 原生输入框，不自动发送；已有草稿必须显式选择替换、追加或取消
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
3. `dsh-pre-duediligence@0.1.5`：提供左侧智能体入口、访前工作台、提示词生成器和完整 Skill。

安装完成后停止旧的 DSH Web 进程并重新运行：

~~~bash
dsh web
~~~

首次使用时打开左侧“🧩 MCP连接器”，选择“企查查·企业工商”并完成 OAuth 授权。授权完成后会注册 `qcc-company`、`qcc-risk`、`qcc-ipr`、`qcc-operation`、`qcc-history` 和 `qcc-executive`，不需要分别安装这些 MCP Server。

### 手动安装

~~~bash
dsh plugin --profile web add dsh-better-sidebar@0.17.1 --allow-build=node-pty
dsh plugin --profile web add dsh-mcp-connector@0.2.32
dsh plugin --profile web add dsh-pre-duediligence@0.1.5 --allow-build=dsh-pre-duediligence
dsh web
~~~

Better Sidebar 必须使用 `0.17.1`；工作台依赖它的 `targetedOpen` 与 `stateSubscription` 公共能力。安装命令显式允许 `dsh-pre-duediligence` 的构建脚本；Better Sidebar 使用的 `node-pty` 也需要允许构建。

如果 pnpm 仍提示 `Ignored build scripts`，请按终端提示在 `~/.dsh/profiles/web/pnpm-workspace.yaml` 的 `allowBuilds` 中允许对应包，然后重新执行失败的安装命令。

### 安装后检查

~~~bash
dsh plugin --profile web list --depth 0
~~~

应能看到 `dsh-better-sidebar@0.17.1`、`dsh-mcp-connector@0.2.32` 和 `dsh-pre-duediligence@0.1.5`。重启 DSH 并连接“企查查·企业工商”后，在左侧菜单点击“访前尽调”打开工作台；Better Sidebar 的右侧“+”菜单不会再列出该入口。普通会话的首页、输入框、消息流和 Session 头部保持原样。

### 从旧访前尽调包迁移

新旧包会注册同一项访前能力，请勿同时安装。若 Web profile 已有 `qcc-previsit-dsh`，先执行：

~~~bash
dsh plugin --profile web remove qcc-previsit-dsh
~~~

然后安装 `dsh-pre-duediligence` 并完整重启 DSH。安装脚本检测到旧包时会停止并提示，不会自动删除用户现有插件。

### 从旧企查查 OAuth 插件升级

如果 Web profile 已安装 `qcc-dsh-mcp-oauth`，不要让它与 MCP 连接器同时管理同名企查查 Server：

1. 先安装 `dsh-mcp-connector@0.2.32` 和 `dsh-pre-duediligence@0.1.5`，完全重启 DSH。
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
pnpm test:ui
~~~

`pnpm check` 会执行 TypeScript 类型检查、Vitest 测试和 Host/Client 构建。`pnpm test:ui` 使用本机 Headless Chrome，在隔离宿主中检查浅色/深色与桌面/移动布局，不连接真实 DSH 或企查查服务。

## 人工验收

1. 在 DSH 选择一个工作空间和 Session。
2. 确认左侧菜单出现“访前尽调”及建筑 LOGO，同时右侧 Better Sidebar 的“+”菜单不再出现该入口；普通会话保持 DSH 原样。
3. 点击“访前尽调”，确认首页标题为“访前尽调一页纸智能体”，LOGO 与菜单一致，说明行独立居中。
4. 确认五项快捷菜单位于原生输入框下方，点击后只切换右侧工作台视图。
5. 打开输入框左上角“提示词生成”，检查四步、滚动、固定头尾、Tab 焦点环和 Escape 恢复焦点。
6. 选择“银行/信贷客户经理、首次拜访、风险与涉诉、股权与实控人、15分钟标准、一页纸简报”并填写企业。
7. 输入框已有自由文本时，分别验证取消、追加、替换；确认回填后不会自动发送。
8. 点击 DSH 原生发送按钮，确认消息作为用户可见文本发送到当前 Session。
9. 确认工作台只展示当前 Session 真实发生的企业、经营、知识产权和风险工具调用。
10. 检查风险侧先出现企业风险扫描，零计数维度没有继续下钻。
11. 中途关闭工作台，确认任务继续；点击会话头“访前尽调”可恢复。
12. Agent 停止但未生成完整报告时应显示“等待确认 / 继续”；完整报告出现后才显示“报告已生成”。
13. 检查报告有八段（含独立产业定位），假设包含支持/反对/未知，必问包含答 A/B 分支，覆盖声明区分零记录和调用失败。

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
│   ├── previsit-brand.tsx
│   ├── previsit-home.tsx
│   ├── previsit-prompt.tsx
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
- 插件只在左侧栏增加独立入口，并把承载工作台的 Better Sidebar 标签从右侧“+”菜单隐藏；业务 CSS 只作用于 `.qcc*` 自有节点，普通会话不挂载业务 DOM，也不修改 DSH 原生文案。
- 企业事实只能来自本次企查查 MCP 返回。
- 条件仅生成用户可见文本，不在 Client 侧调用 MCP。
- 提示词向导只回填；用户点击 DSH 原生发送按钮或工作台“开始尽调”后才发送。
- 工作台状态绑定当前 Session，不根据聊天文本猜测业务结论。
- Agent 不输出信用评分或替用户作授信、合作、投资决定。

## 设计参考与许可

- dsh-tender-workbench：https://github.com/Sunhh3221/dsh-tender-workbench
- dsh-data-cleaning-agent：https://github.com/duhu2000/dsh-data-cleaning-agent
- 交互参考：`DSH智能体_企查查蓝_UI_Mockup_v1.1.0.html` 与 `DSH智能体开发交互规范方案.md`
- 产品输入：桌面 handoff 中的系统提示词 v0.2、拼句器配置 v1.2.1、推理规范、业务内核和银行角色内容库
- 第三方许可见 THIRD_PARTY_NOTICES.md

## License

MIT
