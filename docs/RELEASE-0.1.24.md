# v0.1.24 发布说明

本版修复访前尽调入口、原生首页与历史详情在新版 Host 布局中的交互问题。

## 修复

- 左侧入口在创建专属 Session 期间始终显示“访前尽调”；不再改成“正在打开…”或错误文案。
- 原生首页兼容业务 marker 与 Hero 标题位于 composer sibling 分支的 Host DOM，稳定替换为“访前尽调一页纸智能体”、企查查蓝建筑 LOGO，并可在宿主重渲染后恢复。
- 历史任务卡片可打开只读详情，内嵌查看已保存报告，并使用该记录自己的来源 Session 下载 HTML 制品。
- 缺少来源 Workspace / Session 的旧记录继续保留清单摘要，不猜测来源、不绑定当前任务。

## 验证

- 菜单文案、Hero sibling slot、宿主重渲染与可逆清理均有回归覆盖。
- 历史任务详情验证读取记录所属 Session，并覆盖详情、下载与返回清单交互。
- 严格类型检查、全量单元/集成测试、Host/Client 构建与隔离 Chrome UI 门禁纳入发布流程。

本轮使用合成 Host 记录和隔离浏览器页面验证，没有读取或修改生产 DSH Profile，也没有调用真实企查查 Provider；生产账号结果仍以安装后的用户验收为准。

```sh
dsh plugin --profile web add dsh-pre-duediligence@0.1.24
```
