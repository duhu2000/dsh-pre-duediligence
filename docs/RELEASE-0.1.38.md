# 0.1.38：访前报告与证据

安装：`dsh plugin --profile web add dsh-pre-duediligence@0.1.38`，然后重启 DSH Web。建议使用 DSH 0.1.2-rc.1。

主插件注入已保存报告 Host，主客户端集成 MCP App 卡片，无需安装独立实验插件。已安装旧版时运行上述命令更新主包。

在拥有报告的原始会话中要求“打开已保存报告与证据”，Agent 使用已知 PV 任务 ID 与实际版本调用 `f24_previsit_report_open`。如工具组收起，展开工具调用即可查看卡片。支持判断证据、覆盖缺口、原始正文和同主体历史版本切换。新卡片可在刷新、关闭重开及宿主重启后恢复，恢复凭据有效期 30 天。

读取范围限当前 Profile、会话、工作区和主体；每次操作重新授权并核对保存内容摘要。版本或记录被修改、删除、凭据过期时需重新打开，不使用旧客户端内容绕过校验。旧报告没有保存的证据、日期和关联不会补造；文件区仅展示登记信息，下载继续使用原有入口。

正式安装不启用合成数据 fixture，不替换模型或工作区。真实企业报告需由现有企查查 MCP 流程生成并保存。

## 发布前验证

- Node 24：280 项业务测试、17 项报告测试、类型检查及构建通过。
- Chrome：原工作台四组明暗/宽窄页面回归通过。
- DSH 0.1.2-rc.1：正式构建的报告 Host 与合并客户端通过 V1/V2 切换、证据日期、刷新及实际重启恢复；业务记录字节未变。
- 正式主插件入口另行通过已有卡片恢复及新工具调用，使用主插件自身的已保存记录服务，浏览器无异常。测试数据为合成记录，未调用真实企业查询或外部模型。
- `npm pack` 检查包含 `lib/report-host.js`、`lib/report.html` 和合并客户端，不包含 fixture 或本地验收数据。

本地 DSH 集成脚本需已安装 DSH 与 Chrome。仓库根目录先运行 `node experimental/dsh-mcp-app-host/tests/prepare-production-profile.mjs`，再以 `F24_TEST_HOME=_scratch/dsh-f24-production-bundle-profile F24_TEST_OUTPUT=_scratch/f24-production-evidence F24_TEST_PATCH=_scratch/f24-production.patch.yml F24_TEST_PORT=3092` 运行 `tests/dsh-recovery.mjs`（完整路径同上目录）；之后运行 `tests/dsh-production-main.mjs` 验证正式主入口。脚本使用独立 Profile 与 3092 端口。
