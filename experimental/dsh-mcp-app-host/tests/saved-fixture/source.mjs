import {LlmAdapter} from '/opt/homebrew/lib/node_modules/@deepseek-ai/dsh/node_modules/@deepseek-ai/dsh-llm/lib/index.js';
import {randomUUID,createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {PrevisitWorkflowStore} from '../../../../src/previsit-workflow.ts';
import {createSavedReportSource} from '../../../../src/saved-report-source.ts';
import {savedTask} from '../../../mcp-app/tests/saved-fixture.mjs';
export const inject=['llm','tools','workspaceRegistry','storageDomain'];
export const name='f24-saved-fixture';
class Fixture extends LlmAdapter {
 async listModels(provider){return [{provider,id:'saved',name:'F24 保存格式验收（合成）',inputModalities:['text']}];}
 async resolveModel(provider,model){return {...(await this.listModels(provider))[0],id:model,context:{contextWindow:128000},defaultMaxTokens:2048};}
 async *stream(options){
  const latest=options.messages.slice(options.messages.findLastIndex(m=>m.source?.kind==='user'));
  const calls=latest.flatMap(m=>m.content??[]).filter(b=>b.type==='tool-call').map(b=>b.name);
  let name;
  if(options.tools?.some(t=>t.name==='f24_fixture_prepare')) name=!calls.includes('f24_fixture_prepare')?'f24_fixture_prepare':!calls.includes('f24_previsit_report_open')?'f24_previsit_report_open':undefined;
  const id=JSON.stringify(latest.at(-1)).match(/PV-20260916-[A-F0-9]+-V2/)?.[0];
  const block=name?{type:'tool-call',id:randomUUID(),name,arguments:JSON.stringify(name==='f24_fixture_prepare'?{}:{reportId:id,reportVersion:JSON.stringify(latest[0]).includes('错误版本')?999:2})}:{type:'text',text:'已保存报告适配验收完成（合成样本，无外部模型请求）。'};
  yield {type:'block-start',index:0,blockType:block.type};yield {type:'block-end',index:0,block};yield {type:'finish',reason:{kind:name?'tool-calls':'stop'}};
 }
}
export async function apply(ctx){
 const workspace=fileURLToPath(new URL('../../../../_scratch/f24-saved-workspace',import.meta.url));
 await ctx.workspaceRegistry.create(workspace,'F24 已保存报告验收');
 const store=new PrevisitWorkflowStore();await store.attach(ctx.storageDomain);
 ctx.provide('previsitSavedReports',createSavedReportSource(store));
 ctx.effect(()=>ctx.tools.register({name:'f24_fixture_prepare',description:'仅用于合成验收：预置业务格式保存记录。',parameters:{type:'object',properties:{},additionalProperties:false},output:{schema:{type:'object',properties:{reportId:{type:'string'}},required:['reportId'],additionalProperties:false},render:(_a,v)=>[{type:'text',text:JSON.stringify(v)}]},async execute(_a,exec){
  const t=savedTask(exec.agent.session.id,exec.agent.session.header.cwd);const key=createHash('sha256').update(t.sessionId).digest('hex').slice(0,12).toUpperCase();
  t.id=`PV-20260916-${key}-V2`;t.rootTaskId=t.parentTaskId=`PV-20260916-${key}-V1`;
  await store.put({...t,id:t.parentTaskId,reportVersion:1});await store.put(t);return {reportId:t.id};
 }}));
 ctx.effect(()=>ctx.llm.registerAdapter(['f24-saved-fixture'],new Fixture()));
}
