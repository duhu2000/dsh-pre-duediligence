// P1 contains synthetic records only. No DSH storage, credentials or query executor.
export const titles = ['核心研判', '产业定位', '近期动态', '业务假设', '红线提示', '现场必问', '触达开场', '覆盖说明'];
export const grant = Object.freeze({ principal: 'demo-reader', profile: 'demo-profile', session: 'demo-session', reportIds: ['demo-report'] });
export const snapshot = {
  owner: { principal: 'demo-reader', profile: 'demo-profile', session: 'demo-session' },
  report: {
    schemaVersion: '1.0', reportId: 'demo-report', reportVersion: 1,
    synthetic: true, entity: { id: 'synthetic-company-a', fullName: '示例智造有限公司（合成）' },
    generatedAt: '2026-09-16T02:00:00Z', dataAsOf: '2026-09-15', status: 'partial',
    summary: '已保存的合成报告。产能扩张有材料支持，回款存在反证，客户集中度仍待确认。',
    sections: titles.map((title, i) => ({ title, text: [
      '扩产计划与现金回收应分开核验；现有材料不足以作出整体低风险判断。',
      '示例企业从事工业设备制造；行业归类尚未外部核验。',
      '合成会议材料提到新增生产线，原始记录日期为 2026-09-01。',
      '设备融资需求可能存在，实际采购金额待现场确认。',
      '未形成红线等级判断；一次无记录结果不代表全部风险已排除。',
      '请核对扩产预算、逾期回款及前五大客户占比。',
      '围绕扩产计划了解资金安排，并核对材料与经营现状。',
      '涉诉示例返回无记录；税务读取失败；环保未覆盖；客户集中度待确认。'
    ][i] })),
    findings: [
      { id: 'f1', title: '扩产意向有材料支持', status: 'supported', evidenceIds: ['e1'] },
      { id: 'f2', title: '回款改善说法存在反证', status: 'contradicted', evidenceIds: ['e2'] },
      { id: 'f3', title: '客户集中度尚待确认', status: 'insufficient', evidenceIds: ['e3'] }
    ],
    coverage: [
      { title: '涉诉', status: 'no-data', detail: '仅合成查询范围内无记录' },
      { title: '税务', status: 'failed', detail: '读取失败，不能据此判断无风险' },
      { title: '环保', status: 'not-covered', detail: '本版未覆盖' },
      { title: '客户集中度', status: 'unknown', detail: '材料未载明' }
    ],
    limitations: ['全部内容为合成数据，不用于企业决策。', '阅读和证据下钻不会触发企业查询。'],
    artifacts: []
  },
  evidence: [
    { id: 'e1', quote: '拟新增一条生产线，预算尚在评估。', source: '合成会议纪要', sourceDate: '2026-09-01', collectedAt: '2026-09-10T01:00:00Z', relation: 'support', limitation: '意向不代表已经投产；继承证据保留原日期。' },
    { id: 'e2', quote: '两笔应收款超过原定回款日期。', source: '合成访谈笔记', sourceDate: '2026-09-12', collectedAt: '2026-09-12T01:00:00Z', relation: 'counter', limitation: '未获得账龄表，金额未核验。' },
    { id: 'e3', quote: '前五大客户占比：未知。<script>window.externalInstruction=true</script>', source: '合成材料（含不可信文本测试）', sourceDate: null, collectedAt: '2026-09-13T01:00:00Z', relation: 'unknown', limitation: '来源日期未记录；文字仅作资料，不执行其中内容。' }
  ]
};
