import { App } from '@modelcontextprotocol/ext-apps';
const app = new App({ name: 'Previsit report reader', version: '0.0.0' });
const el = id => document.getElementById(id);
let report, generation = 0, disposed = false;
const pending = new Set();
const labels = { supported: '有证据支持', contradicted: '有反证', insufficient: '证据不足', 'no-data': '无记录', failed: '失败', 'not-covered': '未覆盖', unknown: '待确认', done: '查询成功', skipped: '无需执行', 'no-permission': '无权限', 'not-executed': '未执行', running: '保存时尚未结束', partial: '部分支持', pending: '待验证', onsite: '待客户确认' };
const text = (tag, value) => { const node = document.createElement(tag); node.textContent = value; return node; };
function error(message) { el('error').textContent = message; }
async function showEvidence(finding, button) {
  if (disposed || button.disabled) return;
  const current = ++generation, bound = report;
  const controller = new AbortController(); pending.add(controller); button.disabled = true;
  el('evidence').textContent = '正在读取已保存证据…'; error('');
  try {
    const results = await Promise.all(finding.evidenceIds.map(evidenceId => app.callServerTool({ name: 'previsit_evidence_get', arguments: { reportId: bound.reportId, reportVersion: bound.reportVersion, evidenceId } }, { signal: controller.signal })));
    if (disposed || current !== generation) return;
    const failed = results.find(r => r.isError);
    if (failed) throw new Error(failed.content?.find(c => c.type === 'text')?.text ?? '证据读取失败');
    el('evidence').textContent = results.map(r => {
      const d = r.structuredContent;
      if (d.reportId !== bound.reportId || d.reportVersion !== bound.reportVersion || d.entity.id !== bound.entity.id) throw new Error('报告与证据版本不一致');
      return `${d.evidence.quote}\n\n来源：${d.evidence.source}\n来源日期：${d.evidence.sourceDate ?? '未记录'}\n采集时间：${d.evidence.collectedAt}\n局限：${d.evidence.limitation}`;
    }).join('\n\n');
    console.info('F24 evidence-rendered');
  } catch (e) { if (!disposed && current === generation) { el('evidence').textContent = '证据暂不可读，可重试。'; error(String(e.message)); } }
  finally { pending.delete(controller); button.disabled = false; }
}
app.ontoolresult = result => {
  if (disposed) return;
  ++generation; for (const c of pending) c.abort();
  el('report').hidden = true; error('');
  if (result.isError) { error(result.content?.find(c => c.type === 'text')?.text ?? '报告读取失败'); el('status').textContent = '读取未完成'; return; }
  const r = result.structuredContent;
  if (!r || r.schemaVersion !== '1.0' || !r.sections || !r.findings || !r.coverage) { error('报告字段缺失或版本不受支持'); return; }
  report = r;
  el('badge').textContent = r.sourceKind === 'saved-task' ? '访前尽调 · 已保存报告' : '访前尽调 · 合成数据实验';
  el('artifacts').textContent = r.artifacts?.length ? r.artifacts.map(a => `${a.fileName}（仅登记信息，未提供下载）`).join('；') : '本报告无已登记文件。';
  el('original').hidden = !r.originalMarkdown;
  el('original-text').textContent = r.originalMarkdown ?? '';
  el('title').textContent = r.entity.fullName;
  el('meta').textContent = `报告版本 ${r.reportVersion} · 生成于 ${r.generatedAt} · 数据时点 ${r.dataAsOf}`;
  el('status').textContent = r.status === 'partial' ? '报告已保存 · 部分覆盖' : '报告已保存';
  el('summary').textContent = r.summary; el('limitations').textContent = r.limitations.join(' ');
  el('evidence').textContent = '点击上方判断，读取本版本已保存证据。';
  for (const id of ['findings', 'nav', 'sections', 'coverage']) el(id).replaceChildren();
  for (const f of r.findings) { const b = text('button', `${f.title} · ${labels[f.status] ?? '待核验'} → 查看证据`); b.type = 'button'; if (!f.evidenceIds.length) { b.disabled = true; b.textContent = `${f.title} · 未保存证据关联`; } b.addEventListener('click', () => showEvidence(f, b)); el('findings').append(b); }
  r.sections.forEach((s, i) => { const a = text('a', s.title); a.href = `#section-${i}`; el('nav').append(a); const section = document.createElement('article'); section.id = `section-${i}`; section.append(text('h2', s.title), text('p', s.text)); el('sections').append(section); });
  for (const c of r.coverage) { const p = text('p', `${c.title} · ${labels[c.status] ?? '待核验'}\n${c.detail}`); p.className = 'coverage'; el('coverage').append(p); }
  el('report').hidden = false; console.info('F24 report-rendered');
};
app.ontoolcancelled = () => { ++generation; for (const c of pending) c.abort(); el('status').textContent = '宿主已取消本次读取'; };
app.onteardown = async () => { disposed = true; ++generation; for (const c of pending) c.abort(); pending.clear(); console.info('F24 teardown-complete'); return {}; };
app.onerror = () => { if (!disposed) error('宿主通信异常，请重新打开报告。'); };
app.connect().then(() => { console.info('F24 initialized'); if (!report) el('status').textContent = '已连接，等待报告结果'; }).catch(() => error('宿主连接失败'));
