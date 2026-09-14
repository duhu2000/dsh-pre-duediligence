# 首页统一采用 DSH-UX-001 v1.5.4

日期：2026-09-14。依据用户五张首页截图及共享规范 `/Users/qcc/Documents/DuHu/QCC/beichacha_doc/云聚接口/MCP/AI-设计/DSH智能体开发交互规范方案.md`。

基线：远端 main 已只读核验为 fe799ec532ba323828a44ad7c3e6ea9985adc7a1（0.1.26）。本轮版本号不变，属于待评审源码，不得以此版本重复发布 npm。

- 删除首页用途副标题及 CSS，不删除产品 description、向导说明和按需错误提示。
- 大标题保持“访前尽调智能体”，左侧入口固定“访前尽调”，沿用既有 busy 禁用和重复点击保护。
- 标题桥接仅识别宿主默认标题或本产品标记，不覆盖自定义文字；祖先查找及 observer 不扩展至 body/html。监听 data-phase，离开 Hero 恢复自有修改，保留新版 blank/awaitingFirstTurn 兼容。
- 保留既有 processingStatus 的运行、待确认、已停止未完成、同步异常区分；不新增首页状态副标题，不将倒计时或旧查询记录当运行证据。
- 未改变 Session 持久化标题、草稿、历史/导出、付费工具授权或可选侧栏行为。

验证：Node 24.19，pnpm check 通过（175测试、typecheck、build）。页面 fixture 增加原生工作区/模式控件顺序及零副标题断言。最终页面回归结果见 `_scratch/ui-layout/results.json` 与 `/tmp/previsit-home154-ui.log`；这是 React + 合成宿主 DOM 的 Chromium 验证，不等于真实 DSH 最终包及四产品共存验收。

本轮隔离工作树 `/Users/qcc/Documents/Codex/dsh-previsit-home-20260914`；未修改生产 ~/.dsh、未 push/PR/合并/发版。真正 Host 的 DOM 重挂载、跨四业务切换、HMR 与最终安装包仍需独立验收。
