# 五类 MCP 工具路由

以下原始工具名用于解释业务路由，执行必须通过 `previsit_query`，不能直接调用原始 MCP。

| dimension | 业务查询 |
| --- | --- |
| entity_search | get_company_by_query |
| registration / profile | get_company_registration_info / get_company_profile |
| annual_reports / changes | get_annual_reports / get_change_records |
| shareholders / beneficiaries | get_shareholder_info / get_beneficial_owners |
| personnel / contacts | get_key_personnel / get_contact_info |
| investments / branches | get_external_investments / get_branches |
| risk_scan | get_company_risk_scan |
| dishonest / enforcement / terminated_cases | get_dishonest_info / get_judgment_debtor_info / get_terminated_cases |
| equity_freeze / business_exception | get_equity_freeze / get_business_exception |
| administrative_penalty / tax_abnormal / judicial_documents | get_administrative_penalty / get_tax_abnormal / get_judicial_documents |
| patents / software_copyright | get_patent_info / get_software_copyright_info |
| financing / bidding / recruitment | get_financing_records / get_bidding_info / get_recruitment_info |
| qualifications / licenses / land | get_qualifications / get_administrative_license / get_land_grant_info |
| executive_risk | get_executive_risk_scan（必须带实际关键人员姓名 personName） |

未列入固定维度的增量工具在当前版本标记“未覆盖（业务适配未提供）”，不得通过动态 MCP 或其它传输绕过。Provider 名称、参数或返回字段变化必须先补适配和契约测试。

## 硬门与基础集

第一项调用必须是 qcc-company / get_company_by_query。完成唯一主体锚定后，标准档基础集包括：

- get_company_registration_info
- get_company_profile（除简介外，务必取回并使用其产业字段：主营产品、业务模式、企查查行业分类、产业链定位，用于 A0 产业定位）
- get_annual_reports
- get_change_records
- get_shareholder_info
- get_beneficial_owners
- get_key_personnel
- qcc-risk / get_company_risk_scan

综合画像已完整覆盖某字段时可以避免重复，但不能省略主体锚定和风险扫描。

## 经营状态路由

| 状态候选 | 增量工具 |
| --- | --- |
| 产能建设期 | get_administrative_license、get_bidding_info、get_land_grant_info、get_external_investments、get_recruitment_info |
| 客户导入期 | get_qualifications、get_recruitment_info、qcc-ipr / get_patent_info、get_software_copyright_info、get_bidding_info |
| 产能爬坡期 | get_annual_reports、get_recruitment_info、许可或验收相关能力 |
| 订单增长期 | get_bidding_info、get_recruitment_info；上市公司可用 get_financial_data 作 L1 佐证 |
| 稳定经营期 | get_change_records、get_annual_reports |
| 收缩承压期 | get_annual_reports、get_branches、get_cancellation_record_info、get_equity_pledge_info、get_judicial_documents |
| 资本运作期 | get_financing_records、get_change_records、get_company_announcement、get_listing_info |
| 风险暴露期 | 风险扫描命中维度明细，机会侧降级 |

信号必须受回看窗口和 24 个月状态判定边界约束。

## 重点关注路由

- 风险与涉诉：企业风险扫描及非零维度明细
- 股权与实控人：get_shareholder_info、get_beneficial_owners，必要时外部投资与质押
- 经营与财务：年报、变更、融资、招聘、许可、土地；财务数据仅在实际可得时使用
- 联系人与触达路径：get_contact_info、股东主体触达、关键人员；遵守三要素与归属规则
- 知识产权：qcc-ipr 的专利、软件著作权、商标或资质能力
- 招投标业绩：get_bidding_info，必须区分招采方、中标方、候选人和框架协议

## 风险非零下钻

| 扫描命中 | 明细能力 |
| --- | --- |
| 失信被执行人 | get_dishonest_info |
| 被执行人 | get_judgment_debtor_info |
| 终本案件 | get_terminated_cases |
| 股权冻结 | get_equity_freeze |
| 经营异常 | get_business_exception |
| 行政处罚 | get_administrative_penalty |
| 税务异常 | get_tax_abnormal |
| 司法文书 | get_judicial_documents |

董监高：先 get_key_personnel，再使用 qcc-executive / get_executive_risk_scan，并同时传锚定主体与姓名。

## 档位预算

- 速览：约 8 次，基础主体 + 最相关机会信号 + 风险扫描 + 最高优先级非零下钻
- 标准：约 18 次，基础集 + 状态判定 + 2–4 个假设的反证 + 风险明细
- 深度：约 40 次，增加年度序列、变化、行业包、知识产权、招投标、关键人员和更多反证

## 失败降级

1. 企业搜索失败：停止。
2. 工商登记和综合画像均失败：停止正式报告。
3. 风险扫描失败：交付机会侧简报，但明确“风险维度未完成”。
4. 可选工具失败：继续独立维度，覆盖声明写“调用失败”。
5. 返回零条：写“本次查询未发现公开记录”，与调用失败严格区分。
6. 达到预算：保留锚定、状态最小证据、风险扫描、核心反证和报告，停止低优先级查询。
