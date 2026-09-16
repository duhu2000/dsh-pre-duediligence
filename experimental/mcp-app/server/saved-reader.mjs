import { createHash } from 'node:crypto';
import { ReadError } from './service.mjs';
import { titles } from './snapshot.mjs';
const hash = value => createHash('sha256').update(value).digest('hex');
const fail = code => { throw new ReadError(code); };

// No filesystem, fetch, query, export or write dependency. Source is owned by the
// active business plugin; scope is captured from DSH ToolRunContext by the Host.
export function createSavedReader(source, scope, { expectedDigest } = {}) {
  const trusted = structuredClone(scope);
  let pinned = expectedDigest;
  async function load(args) {
    let task;
    try { task = await source.read(args.reportId, args.reportVersion, trusted); }
    catch (e) { fail(['NOT_ACCESSIBLE','VERSION_NOT_FOUND','SAVED_REPORT_FIELDS_MISSING'].includes(e.message) ? e.message : 'INTERNAL_ERROR'); }
    const digest = hash(JSON.stringify(task));
    if (pinned && pinned !== digest) fail('REPORT_CHANGED_REOPEN');
    const value = projectSavedTask(task);
    pinned = digest;
    return { ...value, digest };
  }
  return Object.freeze({
    async getReport(args) { const { report, digest } = await load(args); return { ...report, sourceDigest: digest }; },
    async getEvidence(args) {
      const { report, evidence } = await load(args);
      if (!report.findings.some(f => f.evidenceIds.includes(args.evidenceId))) fail('EVIDENCE_NOT_IN_REPORT');
      const item = evidence.find(e => e.id === args.evidenceId);
      if (!item) fail('EVIDENCE_NOT_SAVED');
      return { schemaVersion:'1.0', reportId:report.reportId, reportVersion:report.reportVersion, entity:report.entity, evidence:item };
    },
    async listArtifacts(args) { const {report} = await load(args); return {schemaVersion:'1.0',reportId:report.reportId,reportVersion:report.reportVersion,artifacts:report.artifacts}; },
  });
}

export function projectSavedTask(task) {
  if (!task || task.schemaVersion !== 1 || !task.entity?.creditCode || !task.entity.fullName || typeof task.reportMarkdown !== 'string' || !Array.isArray(task.runs)) fail('SAVED_REPORT_FIELDS_MISSING');
  // Respect fenced text; never promote an example heading into a report section.
  const sections=[];let fence=null,current;
  for (const line of task.reportMarkdown.split(/\r?\n/)) {
    const marker=line.match(/^\s*(`{3,}|~{3,})/);
    if(marker){if(!fence)fence=marker[1][0];else if(fence===marker[1][0])fence=null;}
    const heading=!fence && line.match(/^#{2,4}\s+(.+)$/);
    const title=heading && titles.find(t=>new RegExp(`^(?:[一二三四五六七八1-8]+[、.．）)\\s]+)?${t}(?:\\s|$|[：:（(])`).test(heading[1]));
    if(title){if(sections.some(s=>s.title===title))fail('AMBIGUOUS_REPORT_SECTIONS');current={title,text:''};sections.push(current);}
    else if(current)current.text += line+'\n';
  }
  if(titles.some(t=>!sections.some(s=>s.title===t)))fail('LEGACY_FIELDS_MISSING');
  sections.forEach(s=>s.text=s.text.trim());
  const findings=[...new Map((task.analysisRecords??[]).map(a=>[a.id,a])).values()].map(a=>({id:a.id,title:a.title,status:a.status,summary:a.summary,evidenceIds:[...new Set(a.evidenceIds??[])]}));
  const linked=new Set(findings.flatMap(f=>f.evidenceIds));
  const materials=new Map((task.materials??[]).map(m=>[m.id,m]));
  const evidence=[];
  for(const f of task.evidenceFacts??[]) {
    if(!linked.has(f.id))continue;
    const m=materials.get(f.materialId);
    if(!m || f.entity!==task.entity.fullName || !m.text?.includes(f.quote) || !f.quote || hash(m.text)!==m.sha256)continue;
    evidence.push({id:f.id,kind:'material-quote',quote:f.quote,source:m.title,sourceDate:m.sourceDate||null,collectedAt:m.importedAt||null,relation:'saved-reference',limitation:`材料提供者填写的来源与日期，未独立核验。位置：${f.location||'未记录'}。`});
  }
  const runs=[...(task.inheritedRuns??[]),...task.runs];
  for(const r of runs) {
    if(!linked.has(r.id)||!r.completedAt||!['done','no-data'].includes(r.status))continue;
    const quote=r.result?[r.result.summary,...(r.result.facts??[]),...(r.result.factors??[]).map(f=>`${f.name}：${f.count}`)].filter(Boolean).join('\n'):'';
    if(!quote && r.status!=='no-data')continue;
    evidence.push({id:r.id,kind:'query-summary',quote:quote||'保存的查询状态为无记录；仅适用于该次查询范围。',source:r.toolName||r.dimension,sourceDate:null,collectedAt:r.completedAt,relation:'saved-reference',limitation:'仅为已保存查询摘要，非接口原始响应；采集时间不等于来源日期。'});
  }
  if(new Set(evidence.map(e=>e.id)).size!==evidence.length)fail('AMBIGUOUS_EVIDENCE_IDS');
  const latest=new Map(runs.map(r=>[r.dimension,r]));
  const labels={done:'查询成功', 'no-data':'无记录',failed:'查询失败','no-permission':'无权限','not-executed':'未执行',skipped:'无需执行',unknown:'结果待核验',running:'保存时尚未结束'};
  const coverage=[...latest].map(([title,r])=>({title,status:r.status,detail:`${labels[r.status]??'未知状态'}；采集于 ${r.completedAt??'未记录'}${(task.inheritedRuns??[]).includes(r)?'；沿用上一版记录':''}。${r.message??''}`}));
  const missing=[...linked].filter(id=>!evidence.some(e=>e.id===id));
  return {report:{schemaVersion:'1.0',reportId:task.id,reportVersion:task.reportVersion??1,sourceKind:'saved-task',synthetic:false,entity:{id:task.entity.creditCode,fullName:task.entity.fullName},generatedAt:task.completedAt,dataAsOf:'未保存统一数据时点；请逐条查看证据日期',status:task.state,summary:sections.find(s=>s.title==='核心研判').text,sections,findings,coverage,originalMarkdown:task.reportMarkdown,artifacts:task.artifact?[{...task.artifact,reportId:task.id,reportVersion:task.reportVersion??1,downloadAvailable:false}]:[],limitations:['仅展示已保存报告，不发起企业查询。','判断与引用来自原记录，未重新推断或补齐证据。',...(!findings.length?['旧报告未保存结构化判断，不能从正文猜测证据关联。']:[]),...(missing.length?[`以下引用没有可读取的已保存证据：${missing.join('、')}`]:[])]},evidence};
}
