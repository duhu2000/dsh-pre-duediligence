# 搜索发现与安装验收

拟议市场中文描述：访前尽调智能体：面向拜访前调查，提供企业尽调、客户尽调、客户背景调查、工商核验与风险信息整理；使用企查查 MCP，提供固定路由连续调用、主体确认、动态进度和可下载报告。

拟议英文描述：Pre-visit due diligence and company research in DeepSeek Harness with Host-tracked progress, fixed-route Qichacha MCP calls, entity confirmation, and downloadable reports.

npm keywords 已在包清单内更新。GitHub description 建议使用上述英文描述；topics 在保留现有项的基础上加入：dsh-plugin, pre-visit, due-diligence, company-research, customer-research。

市场只检索登记字段，不读取 npm keywords、README 或 GitHub topics。默认下载排序保持原规则；不承诺文案直接提升默认排名。

固定查询：访前尽调 / 企业尽调 / 客户尽调 / 拜访前调查 / 客户背景调查 / 工商核验 / pre-visit due diligence / company research / 企查查MCP / 企查查 MCP。

验收：使用实时完整目录和原版搜索函数对比登记描述更新前后；记录语言、命中位置、结果数与版本。独立目录缺失条目必须标为未上线，不能把模拟添加的结果当作上线结果。

发布清单：0.1.20 已获得发布授权；完成仓库 check、README 与包清单差异审核后，以新的不可变 tag 和 npm 版本发布，不覆盖旧版本或移动旧 tag。仅登记 YAML 更新仍无需重复发布 npm。

## 安装与三分钟上手

访前尽调智能体：面向拜访前调查，提供企业尽调、客户尽调、客户背景调查、工商核验与风险信息整理；使用企查查 MCP，提供固定路由连续调用、主体确认、动态进度和可下载报告。

```sh
dsh plugin --profile web add dsh-pre-duediligence@0.1.20
```

请先满足下文的 DSH 与连接器要求；Better Sidebar 只在需要可视化工作台时选装。安装后完整停止并重启对应 Profile。

进入“访前尽调”，在提示词生成器填写拜访对象、角色和目标，核对范围与输出要求后发送任务。发送即表示同意在固定业务路由内连续调用企查查 MCP；插件不设次数上限，如果搜索命中多个主体，只需再选择唯一法律实体。

**流程样例（示意，非真实调用结果）：** 拜访目标与客户主体 → 必要时主体消歧 → 事实与未知项 → 支持/反对证据 → 现场必问与覆盖声明。

**能力边界：** 访前研究不等于完整 AML/KYB、审计或授信结论；Provider 自身的账户额度、产品权限和限流仍然有效。多候选须人工消歧，报告必须披露未知项与覆盖范围。

**升级与回滚：** 升级前停止 Profile 并备份任务目录，记录当前精确版本；使用上面的固定版本命令升级，再完整重启。回滚时将版本号替换为升级前记录的版本，并使用升级前任务目录副本；不以旧版直接读取已迁移任务目录。

相关智能体：[数据清洗补全](https://github.com/duhu2000/dsh-data-cleaning-agent) · [AI填表](https://github.com/duhu2000/dsh-form-fill-agent) · [访前尽调](https://github.com/duhu2000/dsh-pre-duediligence) · [招投标](https://github.com/duhu2000/dsh-tender-workbench)
