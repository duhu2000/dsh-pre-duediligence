import { createHash } from 'node:crypto';
import { titles } from '../server/snapshot.mjs';
export function savedTask(sessionId='session-A',workspace='/fixture') {
 const text='设备预算 100 万元，待确认。<script>window.externalInstruction=true</script>';
 return {id:'PV-20260916-SAVED-V2',schemaVersion:1,revision:9,sessionId,workspace,query:'保存格式示例公司（合成）',depth:'standard',limit:0,used:1,state:'partial',stage:'output',reportVersion:2,parentTaskId:'PV-20260916-SAVED-V1',rootTaskId:'PV-20260916-SAVED-V1',entity:{fullName:'保存格式示例公司（合成）',creditCode:'SYNTHETIC-SAVED'},createdAt:'2026-09-15T00:00:00Z',updatedAt:'2026-09-16T00:00:00Z',completedAt:'2026-09-16T00:00:00Z',
 reportMarkdown:'# 访前尽调报告 · 保存格式示例公司（合成）\n原样保存的前言。\n'+titles.map((t,i)=>`## ${i+1}、${t}\n${t}：业务存储格式合成样本。`).join('\n'),
 materials:[{id:'M-1',taskId:'PV-20260916-SAVED-V1',title:'合成现场材料',kind:'onsite',locator:'合成材料第 1 页',sourceDate:'2026-08-01',importedAt:'2026-09-01T00:00:00Z',text,sha256:createHash('sha256').update(text).digest('hex'),provenance:'supplied-text'}],
 evidenceFacts:[{id:'E-1',materialId:'M-1',entity:'保存格式示例公司（合成）',field:'预算',period:'2026',unit:'万元',value:'100',quote:text,location:'第 1 页'}],
 analysisRecords:[{id:'F-1',title:'保存的材料判断',status:'supported',summary:'保留材料引用',evidenceIds:['E-1'],revision:1},{id:'F-2',title:'沿用旧版查询摘要',status:'partial',summary:'沿用并保留日期',evidenceIds:['R-old'],revision:1},{id:'F-3',title:'旧版缺失证据引用',status:'insufficient',summary:'不可补造',evidenceIds:['R-missing'],revision:1}],
 inheritedRuns:[{id:'R-old',dimension:'profile',toolName:'synthetic_profile',status:'done',quotaUsed:true,startedAt:'2026-08-20T00:00:00Z',completedAt:'2026-08-20T01:00:00Z',result:{summary:'旧版已保存摘要',facts:['经营状态：合成存续'],factors:[]}}],
 runs:[{id:'R-empty',dimension:'risk_scan',status:'no-data',quotaUsed:true,startedAt:'2026-09-15',completedAt:'2026-09-15'},{id:'R-fail',dimension:'tax',status:'failed',quotaUsed:false,startedAt:'2026-09-15',completedAt:'2026-09-15'},{id:'R-not',dimension:'environment',status:'not-executed',quotaUsed:false,startedAt:'2026-09-15'}],
 artifact:{id:'A-1',format:'html',fileName:'已保存合成报告.html',mediaType:'text/html; charset=utf-8',createdAt:'2026-09-16T00:00:00Z'}};
}
